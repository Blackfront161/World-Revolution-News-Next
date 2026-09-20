import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

import {
  assertCleanGitSource,
  assertExpectedStagingHtml,
  buildStagingSecurityHeaders,
  copyClosedPublicPackage,
  createPackageManifest,
  injectStagingHead,
  renderApacheConfig,
  renderRetirementWorker,
  resolveStagingTarget,
  verifyStagingPackage,
} from './staging-package.mjs';

test('requires an explicit separate HTTPS origin and canonical strategy', () => {
  const sourceOrigin = 'https://production.example.test';
  assert.throws(() => resolveStagingTarget({ sourceOrigin }), /WRN_STAGING_ORIGIN/);
  assert.throws(
    () =>
      resolveStagingTarget({
        sourceOrigin,
        stagingOrigin: 'https://preview.example.test',
        canonicalStrategy: 'self',
      }),
    /WRN_STAGING_PACKAGE_MODE/,
  );
  assert.throws(
    () =>
      resolveStagingTarget({
        sourceOrigin,
        stagingOrigin: 'http://preview.example.test',
        canonicalStrategy: 'self',
        packageMode: 'probe',
      }),
    /HTTPS origin/,
  );
  assert.throws(
    () =>
      resolveStagingTarget({
        sourceOrigin,
        stagingOrigin: `${sourceOrigin}/preview`,
        canonicalStrategy: 'self',
        packageMode: 'probe',
      }),
    /origin without path/,
  );
  assert.throws(
    () =>
      resolveStagingTarget({
        sourceOrigin,
        stagingOrigin: sourceOrigin,
        canonicalStrategy: 'self',
        packageMode: 'probe',
      }),
    /separate from the source origin/,
  );
  assert.throws(
    () =>
      resolveStagingTarget({
        sourceOrigin,
        stagingOrigin: 'https://preview.example.test',
        packageMode: 'probe',
      }),
    /WRN_STAGING_CANONICAL_STRATEGY/,
  );

  assert.deepEqual(
    resolveStagingTarget({
      sourceOrigin,
      stagingOrigin: 'https://preview.example.test',
      canonicalStrategy: 'self',
      packageMode: 'probe',
    }),
    {
      stagingOrigin: 'https://preview.example.test',
      canonicalOrigin: 'https://preview.example.test',
      canonicalStrategy: 'self',
      indexing: 'noindex',
      packageMode: 'probe',
      uploadEligible: false,
    },
  );
  assert.equal(
    resolveStagingTarget({
      sourceOrigin,
      stagingOrigin: 'https://preview.example.test',
      canonicalStrategy: 'source',
      packageMode: 'probe',
    }).canonicalOrigin,
    sourceOrigin,
  );
  assert.throws(
    () =>
      resolveStagingTarget({
        sourceOrigin,
        stagingOrigin: 'https://preview.example.test',
        canonicalStrategy: 'self',
        packageMode: 'candidate',
      }),
    /reserved probe origin/,
  );
  assert.equal(
    resolveStagingTarget({
      sourceOrigin,
      stagingOrigin: 'https://staging-origin.fixture.dev',
      canonicalStrategy: 'self',
      packageMode: 'candidate',
    }).uploadEligible,
    true,
  );
});

test('builder treats reserved apex and single-dot DNS forms as non-deployable probes', () => {
  const sourceOrigin = 'https://production.fixture.dev';
  for (const stagingOrigin of [
    'https://test',
    'https://localhost',
    'https://example',
    'https://invalid',
    'https://preview.example.test.',
  ]) {
    assert.throws(
      () =>
        resolveStagingTarget({
          sourceOrigin,
          stagingOrigin,
          canonicalStrategy: 'self',
          packageMode: 'candidate',
        }),
      /reserved probe origin/,
      stagingOrigin,
    );
  }
  assert.equal(
    resolveStagingTarget({
      sourceOrigin,
      stagingOrigin: 'https://preview.example.test.',
      canonicalStrategy: 'self',
      packageMode: 'probe',
    }).uploadEligible,
    false,
  );
});

test('injects noindex and the selected canonical origin into the staging shell only', () => {
  const html = injectStagingHead('<!doctype html><html><head><title>x</title></head></html>', {
    canonicalOrigin: 'https://preview.example.test',
  });
  assert.match(
    html,
    /name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex"/,
  );
  assert.match(html, /rel="canonical" href="https:\/\/preview\.example\.test\/"/);
  assert.match(html, /property="og:url" content="https:\/\/preview\.example\.test\/"/);
  assert.throws(
    () => injectStagingHead(html, { canonicalOrigin: 'https://preview.example.test' }),
    /caller-owned SEO directives/,
  );
  for (const duplicate of [
    '<html><head><meta content="noindex"   name = "robots"></head></html>',
    "<html><head><link\n href='https://elsewhere.invalid/'\n rel = 'alternate canonical'></head></html>",
  ]) {
    assert.throws(
      () => injectStagingHead(duplicate, { canonicalOrigin: 'https://preview.example.test' }),
      /caller-owned SEO directives/,
    );
  }
});

test('rejects dirty or untracked Git sources before commit provenance is read', () => {
  assert.doesNotThrow(() => assertCleanGitSource(''));
  assert.throws(() => assertCleanGitSource(' M apps/website/index.html\n'), /not clean/);
  assert.throws(() => assertCleanGitSource('?? apps/website/untracked-input.json\n'), /not clean/);
});

test('builds one strict header contract for Apache and worker HTML', () => {
  const headers = buildStagingSecurityHeaders([
    '<!doctype html><style>body{color:red}</style><script>window.ready=true</script>',
    '<!doctype html><script type="application/ld+json">{"safe":true}</script>',
  ]);
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['x-frame-options'], 'DENY');
  assert.equal(headers['x-robots-tag'], 'noindex, nofollow, noarchive, nosnippet, noimageindex');
  assert.match(headers['content-security-policy'], /default-src 'self'/);
  assert.match(headers['content-security-policy'], /frame-ancestors 'none'/);
  assert.match(headers['content-security-policy'], /script-src 'self' 'sha256-/);
  assert.match(headers['content-security-policy'], /style-src 'self' 'sha256-/);
  assert.doesNotMatch(headers['content-security-policy'], /unsafe-inline/);

  const apache = renderApacheConfig(headers);
  for (const [name, value] of Object.entries(headers)) {
    assert.match(
      apache,
      new RegExp(
        `Header always set ${name} "${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`,
        'i',
      ),
    );
  }
  assert.match(apache, /website-staging-shell-sw\.js/);
  assert.match(apache, /Service-Worker-Allowed "\/"/);
});

test('retirement worker deletes only WRN shell caches and unregisters itself', async () => {
  const handlers = new Map();
  const deleted = [];
  let unregistered = 0;
  let claimed = 0;
  const context = {
    self: {
      addEventListener: (name, handler) => handlers.set(name, handler),
      skipWaiting: async () => undefined,
      registration: {
        unregister: async () => {
          unregistered += 1;
          return true;
        },
      },
      clients: {
        claim: async () => {
          claimed += 1;
        },
      },
    },
    caches: {
      keys: async () => [
        'wrn.website-shell.v1.control',
        'wrn.website-shell.v1.payload.abc',
        'wrn.website-staging-shell.v1.control',
        'wrn.website-staging-shell.v1.payload.abc',
        'unrelated-cache',
      ],
      delete: async (name) => {
        deleted.push(name);
        return true;
      },
    },
    Promise,
  };
  vm.runInNewContext(renderRetirementWorker(), context);
  const waits = [];
  handlers.get('install')({ waitUntil: (promise) => waits.push(promise) });
  handlers.get('activate')({ waitUntil: (promise) => waits.push(promise) });
  await Promise.all(waits);

  assert.deepEqual(deleted.sort(), [
    'wrn.website-staging-shell.v1.control',
    'wrn.website-staging-shell.v1.payload.abc',
  ]);
  assert.equal(unregistered, 1);
  assert.equal(claimed, 1);
});

test('creates an exact deterministic public file manifest and excludes Vite evidence', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wrn-staging-manifest-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, '.vite'));
  await mkdir(path.join(root, 'assets'));
  await writeFile(path.join(root, '.vite', 'manifest.json'), '{}');
  await writeFile(path.join(root, 'index.html'), '<!doctype html>');
  await writeFile(path.join(root, 'assets', 'index-a.js'), 'console.log(1)');

  const input = {
    directory: root,
    sourceCommit: 'a'.repeat(40),
    lockfileSha256: 'b'.repeat(64),
    stagingOrigin: 'https://preview.example.test',
    canonicalStrategy: 'self',
    packageMode: 'probe',
    uploadEligible: false,
    contentRevision: 'fixture-v1',
  };
  const first = await createPackageManifest(input);
  const second = await createPackageManifest(input);
  assert.deepEqual(first, second);
  assert.deepEqual(
    first.files.map((entry) => entry.path),
    ['assets/index-a.js', 'index.html'],
  );
  assert.match(first.packageId, /^[a-f0-9]{64}$/);
  assert.equal((await readdir(root)).includes('.vite'), true);
});

test('copies exactly 21 active files and rejects every extra HTML/article before hashing', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wrn-staging-copy-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const build = path.join(root, 'build');
  const output = path.join(root, 'output');
  await mkdir(path.join(build, '.vite'), { recursive: true });
  await writeFile(path.join(build, '.vite', 'manifest.json'), '{}');
  for (const relativePath of [
    '.htaccess',
    'article-publication-manifest.json',
    'index.html',
    'robots.txt',
    'sitemap.xml',
    'website-staging-shell-sw.js',
    'articles/wrn-test-art-cedar/index.html',
    'articles/wrn-test-art-ember/index.html',
    'articles/wrn-test-art-fern/index.html',
    'assets/index-a.js',
    'assets/index-a.css',
    'assets/solinaridao-header-mark-filled-a.png',
    'assets/wrn-future-header-white-a.png',
    ...[
      'archive-lifecycle.json',
      'articles.json',
      'discover-index.json',
      'manifest.json',
      'reader-details.json',
      'release-descriptor.json',
      'supplemental-items.json',
      'website-publication.json',
    ].map((name) => `wrn-local-release/v1/${name}`),
  ]) {
    const target = path.join(build, ...relativePath.split('/'));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, relativePath);
  }
  assert.deepEqual(await assertExpectedStagingHtml(build), [
    'articles/wrn-test-art-cedar/index.html',
    'articles/wrn-test-art-ember/index.html',
    'articles/wrn-test-art-fern/index.html',
    'index.html',
  ]);
  assert.equal((await copyClosedPublicPackage(build, output)).length, 21);
  const probeManifest = await createPackageManifest({
    directory: output,
    sourceCommit: 'a'.repeat(40),
    lockfileSha256: 'b'.repeat(64),
    stagingOrigin: 'https://preview.example.test',
    canonicalStrategy: 'self',
    packageMode: 'probe',
    uploadEligible: false,
    contentRevision: 'fixture-v1',
  });
  await assert.rejects(
    verifyStagingPackage({
      directory: output,
      manifest: probeManifest,
      actualOrigin: 'https://preview.example.test',
    }),
    /not upload eligible/,
  );
  await assert.rejects(
    verifyStagingPackage({
      directory: output,
      manifest: probeManifest,
      actualOrigin: 'https://wrong.example.test',
      allowProbe: true,
    }),
    /does not match/,
  );
  await assert.rejects(
    verifyStagingPackage({
      directory: output,
      manifest: {
        ...probeManifest,
        stagingOrigin: 'https://preview.example.test.',
        packageMode: 'candidate',
        uploadEligible: true,
      },
      actualOrigin: 'https://preview.example.test.',
    }),
    /Reserved probe origin/,
  );
  assert.deepEqual((await readdir(output)).sort(), [
    '.htaccess',
    'article-publication-manifest.json',
    'articles',
    'assets',
    'index.html',
    'robots.txt',
    'sitemap.xml',
    'website-staging-shell-sw.js',
    'wrn-local-release',
  ]);
  await writeFile(path.join(build, 'leak.txt'), 'not public');
  await assert.rejects(
    copyClosedPublicPackage(build, path.join(root, 'rejected')),
    /Unexpected public build files: leak\.txt/,
  );
  await writeFile(path.join(build, 'extra.html'), '<!doctype html>');
  await assert.rejects(assertExpectedStagingHtml(build), /Unexpected staging HTML: extra\.html/);
  await rm(path.join(build, 'extra.html'));
  const extraArticle = path.join(build, 'articles', 'wrn-test-art-oak', 'index.html');
  await mkdir(path.dirname(extraArticle), { recursive: true });
  await writeFile(extraArticle, '<!doctype html>');
  await assert.rejects(
    copyClosedPublicPackage(build, path.join(root, 'rejected-article')),
    /Unexpected public build files: articles\/wrn-test-art-oak\/index\.html/,
  );
});
