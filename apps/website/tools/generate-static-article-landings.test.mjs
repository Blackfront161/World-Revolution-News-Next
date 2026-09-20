import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  publishStaticArticleLandings,
  renderStaticLandingPage,
} from './generate-static-article-landings.mjs';

async function withOutputs(callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wrn-g3-007-publisher-test-'));
  try {
    return await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('publishes the three fixed IDs byte-identically from the same local revision', async () => {
  await withOutputs(async (root) => {
    const firstDirectory = path.join(root, 'first');
    const secondDirectory = path.join(root, 'second');
    const first = await publishStaticArticleLandings({ outputDirectory: firstDirectory });
    const second = await publishStaticArticleLandings({ outputDirectory: secondDirectory });

    assert.deepEqual(first, second);
    assert.deepEqual(
      first.landingPages.map((entry) => entry.path),
      [
        'articles/wrn-test-art-cedar/index.html',
        'articles/wrn-test-art-ember/index.html',
        'articles/wrn-test-art-fern/index.html',
      ],
    );
    for (const entry of first.landingPages) {
      const firstPage = await readFile(path.join(firstDirectory, entry.path), 'utf8');
      const secondPage = await readFile(path.join(secondDirectory, entry.path), 'utf8');
      assert.equal(firstPage, secondPage);
      assert.match(firstPage, new RegExp(`<link rel="canonical" href="${entry.canonical}"`));
      assert.match(firstPage, /<link rel="icon" href="data:," \/>/);
      assert.match(firstPage, new RegExp(`<meta property="og:url" content="${entry.canonical}"`));
      assert.match(firstPage, /<a id="interactive-reader" href="\/\?article=wrn-test-art-/);
      assert.match(firstPage, /rel="noopener noreferrer" referrerpolicy="no-referrer"/);
      assert.match(firstPage, /<meta name="publication-revision"[^>]+\/>\n {4}<title>/);
    }
    assert.equal(
      await readFile(path.join(firstDirectory, 'sitemap.xml'), 'utf8'),
      await readFile(path.join(secondDirectory, 'sitemap.xml'), 'utf8'),
    );
    assert.equal(
      await readFile(path.join(firstDirectory, 'robots.txt'), 'utf8'),
      await readFile(path.join(secondDirectory, 'robots.txt'), 'utf8'),
    );
    assert.equal(
      await readFile(path.join(firstDirectory, 'article-publication-manifest.json'), 'utf8'),
      await readFile(path.join(secondDirectory, 'article-publication-manifest.json'), 'utf8'),
    );
  });
});

test('emits only the declared static artifacts and no copied fixture JSON', async () => {
  await withOutputs(async (root) => {
    const outputDirectory = path.join(root, 'output');
    const result = await publishStaticArticleLandings({ outputDirectory });
    const topLevel = (await readdir(outputDirectory)).sort();
    const publicationManifest = JSON.parse(
      await readFile(path.join(outputDirectory, 'article-publication-manifest.json'), 'utf8'),
    );

    assert.deepEqual(topLevel, [
      'article-publication-manifest.json',
      'articles',
      'robots.txt',
      'sitemap.xml',
    ]);
    assert.equal(publicationManifest.revision, result.revision);
    assert.equal(
      publicationManifest.releaseRevision,
      'wrn-g3-012-local-content-release-v1-d8ff4f1',
    );
    assert.equal(publicationManifest.siteOrigin, 'https://solinaridao.com');
    assert.deepEqual(
      publicationManifest.landingPages.map((entry) => entry.articleId),
      ['wrn-test-art-cedar', 'wrn-test-art-ember', 'wrn-test-art-fern'],
    );
    const sitemap = await readFile(path.join(outputDirectory, 'sitemap.xml'), 'utf8');
    assert.equal((sitemap.match(/<loc>/g) ?? []).length, 3);
    assert.match(sitemap, /https:\/\/solinaridao\.com\/articles\/wrn-test-art-cedar\//);
    assert.equal(
      await readFile(path.join(outputDirectory, 'robots.txt'), 'utf8'),
      'User-agent: *\nAllow: /\nSitemap: https://solinaridao.com/sitemap.xml\n',
    );
  });
});

test('publishes staging SEO only after an explicit target and canonical strategy', async () => {
  await withOutputs(async (root) => {
    const outputDirectory = path.join(root, 'staging');
    const result = await publishStaticArticleLandings({
      outputDirectory,
      publicationTarget: {
        stagingOrigin: 'https://preview.example.test',
        canonicalOrigin: 'https://preview.example.test',
        canonicalStrategy: 'self',
        indexing: 'noindex',
      },
    });
    const cedar = await readFile(
      path.join(outputDirectory, 'articles', 'wrn-test-art-cedar', 'index.html'),
      'utf8',
    );
    assert.match(
      cedar,
      /<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" \/>/,
    );
    assert.match(
      cedar,
      /<link rel="canonical" href="https:\/\/preview\.example\.test\/articles\/wrn-test-art-cedar\/"/,
    );
    assert.equal(
      await readFile(path.join(outputDirectory, 'robots.txt'), 'utf8'),
      'User-agent: *\nDisallow: /\n',
    );
    assert.match(
      await readFile(path.join(outputDirectory, 'sitemap.xml'), 'utf8'),
      /https:\/\/preview\.example\.test\/articles\/wrn-test-art-cedar\//,
    );
    assert.deepEqual(result.delivery, {
      stagingOrigin: 'https://preview.example.test',
      canonicalOrigin: 'https://preview.example.test',
      canonicalStrategy: 'self',
      indexing: 'noindex',
    });
  });
});

test('fails closed before file generation for a missing output target', async () => {
  await assert.rejects(
    publishStaticArticleLandings({ outputDirectory: '' }),
    /outputDirectory fehlt/,
  );
});

test('rejects existing empty and marker-bearing caller-owned output directories unchanged', async () => {
  await withOutputs(async (root) => {
    const emptyOutputDirectory = path.join(root, 'existing-empty-output');
    await mkdir(emptyOutputDirectory);
    await assert.rejects(
      publishStaticArticleLandings({ outputDirectory: emptyOutputDirectory }),
      /Ausgabeziel existiert bereits und bleibt unveraendert/,
    );
    assert.deepEqual(await readdir(emptyOutputDirectory), []);

    const markerOutputDirectory = path.join(root, 'existing-marker-output');
    const markerPath = path.join(markerOutputDirectory, 'caller-owned-marker.txt');
    await mkdir(markerOutputDirectory);
    await writeFile(markerPath, 'nicht veraendern\n', 'utf8');

    await assert.rejects(
      publishStaticArticleLandings({ outputDirectory: markerOutputDirectory }),
      /Ausgabeziel existiert bereits und bleibt unveraendert/,
    );

    assert.equal(await readFile(markerPath, 'utf8'), 'nicht veraendern\n');
    assert.deepEqual(await readdir(markerOutputDirectory), ['caller-owned-marker.txt']);
  });
});

test('escapes text, attributes and JSON-LD boundaries instead of emitting executable markup', () => {
  const page = renderStaticLandingPage({
    article: {
      id: 'wrn-test-art-cedar',
      title: 'Titel </script><img src=x onerror=alert(1)>',
      publishedAt: '2026-08-24T14:00:00.000Z',
      originalLanguage: 'de',
      originalUrl: 'https://fixture.invalid/?q=<unsafe>',
      source: { name: 'Quelle <b>nicht HTML</b>' },
    },
    detail: { blocks: [{ kind: 'paragraph', text: 'Text <img src=x onerror=alert(1)>' }] },
    canonical: 'https://solinaridao.com/articles/wrn-test-art-cedar/',
    publication: { revision: 'test-revision' },
  });

  assert.doesNotMatch(page, /<img src=x onerror=alert\(1\)>/);
  assert.match(page, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(page, /\\u003c\/script\\u003e/);
  assert.match(page, /Quelle &lt;b&gt;nicht HTML&lt;\/b&gt;/);
});
