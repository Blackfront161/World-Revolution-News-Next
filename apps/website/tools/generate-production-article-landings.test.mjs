import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

import { buildWebsiteProductionContentRelease } from './production-content-release.mjs';
import {
  publishProductionArticleLandings,
  renderProductionStaticLandingPage,
} from './generate-production-article-landings.mjs';

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(toolsDirectory, '../../..');
const sourceRoot = path.join(
  workspaceRoot,
  'docs/evidence/WRN-PRODUCTION-ARTICLE-PILOT-2026-09-10/generated-core-e8506a4',
);

async function withRelease(callback) {
  const testResults = path.join(workspaceRoot, 'test-results');
  await mkdir(testResults, { recursive: true });
  const root = await mkdtemp(path.join(testResults, 'wrn-stage-c-landings-'));
  const releaseRoot = path.join(root, 'release');
  await buildWebsiteProductionContentRelease({
    outputDirectory: releaseRoot,
    sourceRoot,
    trustedWorkspaceRoot: root,
    generatedAt: '2026-09-10T06:51:40.000Z',
  });
  return callback(root, releaseRoot);
}

test('publishes both admitted full-text articles byte-identically and carries provenance', async () => {
  await withRelease(async (root, releaseRoot) => {
    const first = await publishProductionArticleLandings({
      outputDirectory: path.join(root, 'one'),
      releaseRoot,
    });
    const second = await publishProductionArticleLandings({
      outputDirectory: path.join(root, 'two'),
      releaseRoot,
    });
    assert.deepEqual(first, second);
    assert.equal(first.landingPages.length, 2);
    assert.deepEqual(first.articleIds, first.landingIds);
    assert.deepEqual(first.articleIds, first.sitemapArticleIds);
    assert.deepEqual((await readdir(path.join(root, 'one'))).sort(), [
      '.wrn-stage-c-staging',
      'article-publication-manifest.json',
      'articles',
      'robots.txt',
      'sitemap.xml',
    ]);
    assert.deepEqual(
      JSON.parse(
        await readFile(path.join(root, 'one', 'article-publication-manifest.json'), 'utf8'),
      ),
      first,
    );
    const page = await readFile(path.join(root, 'one', first.landingPages[0].path), 'utf8');
    assert.match(page, /<html lang="de">/);
    assert.match(page, /<h1 lang="en">/);
    assert.match(page, /<div class="reader-content" lang="en">/);
    assert.match(page, /<dd lang="en">Reader adaptation: complete prose retained/);
    assert.doesNotMatch(page, />wrn-production-eff-2026-09-10-v1</);
    assert.match(page, /Karen Gullo, Adam Schwartz/);
    assert.match(page, /CC-BY-4.0/);
    assert.match(page, /Reader adaptation: complete prose retained/);
    assert.match(page, /Law enforcement agencies across the country/);
    assert.match(page, /href="\/\?article=wrn-art-/);
    assert.match(page, /#b787ff/);
    assert.match(page, /#ff5266/);
    assert.match(
      page,
      /:root\{color-scheme:dark;--canvas:#000000;--surface:#151b25;--raised:#151b25/,
    );
    assert.doesNotMatch(
      page,
      /@media \(prefers-color-scheme:dark\)\{:root\{color-scheme:dark;--canvas:#000000;--surface:#151b25;--raised:#151b25/,
    );
  });
});

test('escapes HTML and script close sequences in production page fields', () => {
  const page = renderProductionStaticLandingPage({
    article: {
      id: 'wrn-art-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      title: 'x </script><img>',
      publishedAt: '2026-09-10T06:51:40.000Z',
      originalLanguage: 'en',
      originalUrl: 'https://example.test/?x=<bad>',
      source: { name: '<unsafe>', authors: ['A <B>'] },
      contentCompleteness: 'full',
      rights: {
        licenseId: 'CC',
        licenseUrl: 'https://example.test/license',
        evidenceUrl: 'https://example.test/evidence',
        scope: '<scope>',
        checkedAt: '2026-09-10T06:51:40.000Z',
      },
      transformation: { reference: '</script>', status: 'transformed' },
    },
    detail: { blocks: [{ kind: 'paragraph', text: '<img src=x>' }] },
    publication: { revision: 'revision' },
  });
  assert.doesNotMatch(page, /<img src=x>/);
  assert.match(page, /&lt;img src=x&gt;/);
  assert.match(page, /\\u003c\/script\\u003e/);
});
