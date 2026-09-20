import { test } from 'node:test';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, symlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { integrateProductionArticleLandings } from './integrate-production-article-landings.mjs';
import { buildProductionContentRelease } from '../../../tools/build-production-content-release.mjs';
import { buildWebsiteProductionContentRelease } from './production-content-release.mjs';
import {
  prepareProductionWebsitePackage as prepare,
  verifyProductionWebsitePackage as verify,
} from './production-site-package.mjs';
const run = promisify(execFile);
const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const base = path.join(
  workspace,
  'test-results/site-package-chief-' + Date.now() + '-' + process.pid,
);
await mkdir(base);
const input = path.join(base, 'fresh-source-build');
await build({
  root: path.join(workspace, 'apps/website'),
  logLevel: 'error',
  build: { outDir: input, manifest: true, emptyOutDir: false },
});
await integrateProductionArticleLandings({ outputDirectory: input });
const sourceCommit = (await run('git', ['rev-parse', 'HEAD'], { cwd: workspace })).stdout.trim();
const options = (outputDirectory) => ({
  buildDirectory: input,
  outputDirectory,
  trustedWorkspaceRoot: workspace,
  sourceCommit,
  generatedAtUTC: '2026-09-10T16:55:00.000Z',
});
const check = (directory, manifest) =>
  verify({ directory, manifest, trustedWorkspaceRoot: workspace });
const one = await prepare(options(path.join(base, 'one')));
const manifest = JSON.parse(await readFile(one.manifestPath, 'utf8'));
async function clonePackage(name, skip = '') {
  const output = path.join(base, name);
  await mkdir(output);
  for (const e of manifest.files) {
    if (e.path === skip) continue;
    const target = path.join(output, e.path);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await readFile(path.join(one.outputDirectory, e.path)), { flag: 'wx' });
  }
  await writeFile(output + '.manifest.json', await readFile(one.manifestPath), { flag: 'wx' });
  return output;
}
async function cloneInput(name, skipPrefix = '') {
  const output = path.join(base, name);
  await mkdir(output);
  for (const e of manifest.sourceInput.files) {
    if (skipPrefix && e.path.startsWith(skipPrefix)) continue;
    const target = path.join(output, e.path);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await readFile(path.join(input, e.path)), { flag: 'wx' });
  }
  return output;
}

test('two packages have deterministic bytes, exact real closure and immutable input inventory', async () => {
  const two = await prepare(options(path.join(base, 'two')));
  assert.deepEqual(await readFile(one.manifestPath), await readFile(two.manifestPath));
  assert.deepEqual(await check(one.outputDirectory), await check(two.outputDirectory));
  assert.equal(manifest.files.length, 33);
  assert.deepEqual(
    manifest.files.filter((e) => e.path.startsWith('articles/')).map((e) => e.path),
    [
      'articles/wrn-art-1530b6ef5a7ab519b7bb4d15cf4af45c/index.html',
      'articles/wrn-art-67bca5d4b29dab78f8ae26ccd996a9d8/index.html',
      'articles/wrn-art-8a5c375e96abe85721e4ba918c3f73e2/index.html',
      'articles/wrn-art-a772ab86c915a036c6177f1bfe958d4d/index.html',
      'articles/wrn-art-ba76ef8b7afb34885bd5f64bc7135f6c/index.html',
      'articles/wrn-art-bdb90712e1c72ee72293c70904b50889/index.html',
      'articles/wrn-art-c6c6c2fd56d7a3965b4da062d0f73981/index.html',
      'articles/wrn-art-d96004b71171145d4aab1c6e37eb28ca/index.html',
      'articles/wrn-art-f2ad391804423c87773b3351eb79c802/index.html',
    ],
  );
  assert.equal(manifest.sourceInput.files.length, 31);
  assert(
    !manifest.files.some((e) => /\.vite|wrn-local-release|staging|authored|test-only/.test(e.path)),
  );
  const index = (await readFile(path.join(one.outputDirectory, 'index.html'))).toString();
  assert(index.includes('Content-Security-Policy'));
  const meta = index.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert(!meta.includes('frame-ancestors'));
  assert(!meta.includes('unsafe-inline'));
  assert(!meta.includes('unsafe-eval'));
  assert(meta.includes('media-src https://dn721204.ca.archive.org'));
  assert(!meta.includes('media-src https://archive.org'));
  assert.equal(manifest.activationOrder.at(-1), 'wrn-production-content/current.json');
  assert(
    manifest.activationOrder.slice(0, 8).every((p) => p.includes('/' + manifest.revision + '/')),
  );
});

test('actual six-article V3 publication packages deterministically with the unchanged eight MiB shell cap', async () => {
  const inputPath = path.join(
    workspace,
    'docs/evidence/WRN-NEWS-SIX-ARTICLE-INPUT-2026-09-11/candidate-1789065672080/production-build-input-v3.json',
  );
  const source = path.join(base, 'v3-reviewed-release');
  await buildProductionContentRelease({ inputPath, outputPath: source });
  const buildDirectory = path.join(base, 'v3-source-build');
  await mkdir(buildDirectory);
  // Reuse the actual compiled shell bytes; replace only staged content/publication.
  for (const entry of manifest.sourceInput.files) {
    if (
      entry.path !== 'index.html' &&
      entry.path !== '.vite/manifest.json' &&
      !entry.path.startsWith('assets/')
    )
      continue;
    const target = path.join(buildDirectory, entry.path);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await readFile(path.join(input, entry.path)), { flag: 'wx' });
  }
  const releaseRoot = path.join(buildDirectory, 'wrn-production-content');
  await buildWebsiteProductionContentRelease({
    sourceRoot: source,
    outputDirectory: releaseRoot,
    trustedWorkspaceRoot: workspace,
    generatedAt: '2026-09-11T00:00:00.000Z',
  });
  await integrateProductionArticleLandings({ outputDirectory: buildDirectory, releaseRoot });
  const first = await prepare({ ...options(path.join(base, 'v3-one')), buildDirectory });
  const second = await prepare({ ...options(path.join(base, 'v3-two')), buildDirectory });
  assert.deepEqual(await readFile(first.manifestPath), await readFile(second.manifestPath));
  const candidate = JSON.parse(await readFile(first.manifestPath, 'utf8'));
  assert.equal(candidate.files.filter((entry) => entry.path.startsWith('articles/')).length, 6);
  assert.equal(candidate.activationOrder.at(-1), 'wrn-production-content/current.json');
  assert(candidate.files.every((entry) => entry.bytes <= 8 * 1024 * 1024));
  assert(
    candidate.files
      .filter((entry) => entry.path.startsWith('assets/') || entry.path === 'index.html')
      .reduce((total, entry) => total + entry.bytes, 0) <=
      8 * 1024 * 1024,
  );
  await check(first.outputDirectory);
  await check(second.outputDirectory);
});
test('Apache and per-resource profiles bind CSP, credentialless CORS and exact cache distinctions', async () => {
  const root = await readFile(path.join(one.outputDirectory, '.htaccess'), 'utf8');
  const content = await readFile(
    path.join(one.outputDirectory, 'wrn-production-content/.htaccess'),
    'utf8',
  );
  assert.match(root, /AddType application\/json \.json/);
  assert.match(root, /Header onsuccess unset content-security-policy/);
  assert(!root.includes('x-robots-tag'));
  assert(!content.includes('Allow-Credentials "'));
  assert.match(content, /\(\?!current\\\.json\$\)/);
  assert.match(content, /<Files "current.json">[\s\S]*Cache-Control "no-store"/);
  const h = manifest.headers;
  assert.equal(h['index.html']['cross-origin-resource-policy'], 'same-origin');
  assert.equal(h['index.html']['access-control-allow-origin'], undefined);
  assert.equal(h['website-shell-sw.js']['cache-control'], 'no-store');
  assert.equal(h['website-shell-sw.js']['service-worker-allowed'], '/');
  assert.equal(h['wrn-production-content/current.json']['cache-control'], 'no-store');
  assert.equal(h['wrn-production-content/current.json']['access-control-allow-origin'], '*');
  assert(
    h['wrn-production-content/' + manifest.revision + '/articles.json']['cache-control'].includes(
      'immutable',
    ),
  );
  for (const [p, headers] of Object.entries(h))
    if (p.startsWith('assets/')) assert(headers['cache-control'].includes('immutable'));
});
test('verification rejects changed bytes, missing file and extra file with unmodified originals retained', async () => {
  const tampered = await clonePackage('tampered');
  await writeFile(path.join(tampered, 'index.html'), 'tampered');
  await assert.rejects(() => check(tampered), /bytes mismatch/);
  const missing = await clonePackage('missing', 'robots.txt');
  await assert.rejects(() => check(missing), /closure mismatch/);
  const extra = await clonePackage('extra');
  await writeFile(path.join(extra, 'unexpected.json'), '{}', { flag: 'wx' });
  await assert.rejects(() => check(extra), /closure mismatch/);
  await check(one.outputDirectory);
});
test('strict verification rejects forged manifest fields, input hashes, headers and identities', async () => {
  for (const mutate of [
    (m) => {
      m.extra = true;
    },
    (m) => {
      m.shellId = 'a'.repeat(64);
    },
    (m) => {
      m.sequence++;
    },
    (m) => {
      m.revision = 'forged-revision';
    },
    (m) => {
      m.headers['index.html']['content-security-policy'] = 'default-src *';
    },
    (m) => {
      m.sourceInput.files[0].sha256 = 'b'.repeat(64);
    },
    (m) => {
      m.files[0].extra = true;
    },
    (m) => {
      m.activationOrder = ['wrn-production-content/current.json'];
    },
    (m) => {
      m.sourceInput.buildDirectory = '../outside';
    },
    (m) => {
      m.generatedAtUTC = '2026-99-10T00:00:00.000Z';
    },
  ]) {
    const edited = structuredClone(manifest);
    mutate(edited);
    await assert.rejects(() => check(one.outputDirectory, edited));
  }
});
test('existing output and sibling manifest survive preparation without overwrite', async () => {
  await assert.rejects(() => prepare(options(one.outputDirectory)), /exists/);
  const out = path.join(base, 'existing-manifest');
  await writeFile(out + '.manifest.json', 'keep', { flag: 'wx' });
  await assert.rejects(() => prepare(options(out)), /exists/);
  assert.equal(await readFile(out + '.manifest.json', 'utf8'), 'keep');
});
test('static publication must equal the admitted deterministic content even after self-rehashing', async () => {
  const changed = await cloneInput('changed-static');
  const m = JSON.parse(
    await readFile(path.join(changed, 'article-publication-manifest.json'), 'utf8'),
  );
  const landing = m.landingPages[0].path;
  await writeFile(path.join(changed, landing), 'forged article');
  m.landingPages[0].bytes = Buffer.byteLength('forged article');
  m.landingPages[0].sha256 = createHash('sha256').update('forged article').digest('hex');
  await writeFile(path.join(changed, 'article-publication-manifest.json'), JSON.stringify(m));
  await assert.rejects(
    () => prepare({ ...options(path.join(base, 'bad-static')), buildDirectory: changed }),
    /Static publication bytes/,
  );
});
test('real input assets Junction and output ancestor Junction are rejected without outside output', async () => {
  const linked = await cloneInput('linked-input', 'assets/');
  await symlink(path.join(input, 'assets'), path.join(linked, 'assets'), 'junction');
  await assert.rejects(
    () => prepare({ ...options(path.join(base, 'no-input-output')), buildDirectory: linked }),
    /Junction/,
  );
  const outside = path.join(base, 'junction-target');
  await mkdir(outside);
  const link = path.join(base, 'junction-parent');
  await symlink(outside, link, 'junction');
  await assert.rejects(() => prepare(options(path.join(link, 'not-created'))), /Junction/);
  await assert.rejects(() => readFile(path.join(outside, 'not-created/index.html')), /ENOENT/);
  await assert.rejects(
    () => prepare({ ...options(path.join(base, 'root-alias-output')), trustedWorkspaceRoot: link }),
    /Junction/,
  );
});
test('unsafe Vite resource path and extra source assets never enter a package', async () => {
  const unsafe = await cloneInput('unsafe-vite');
  const file = path.join(unsafe, '.vite/manifest.json');
  const vite = JSON.parse(await readFile(file, 'utf8'));
  vite['index.html'].file = '../outside.js';
  await writeFile(file, JSON.stringify(vite));
  await assert.rejects(
    () => prepare({ ...options(path.join(base, 'no-vite-output')), buildDirectory: unsafe }),
    /Unsafe relative path/,
  );
  const extra = await cloneInput('extra-input');
  await writeFile(path.join(extra, 'assets/unexpected.js'), 'globalThis.bad=true;', { flag: 'wx' });
  await assert.rejects(
    () => prepare({ ...options(path.join(base, 'no-extra-output')), buildDirectory: extra }),
    /extra or missing assets/,
  );
});
test('CLI succeeds from non-root cwd and rejects full-length unknown, duplicate, bare and flag-as-value arguments', async () => {
  const script = path.join(workspace, 'apps/website/tools/production-site-package.mjs');
  const args = [
    '--build',
    input,
    '--output',
    path.join(base, 'cli'),
    '--workspace',
    workspace,
    '--commit',
    options('').sourceCommit,
    '--generated',
    options('').generatedAtUTC,
  ];
  const success = await run(process.execPath, [script, ...args], { cwd: base });
  assert.equal(JSON.parse(success.stdout).files, 33);
  for (const invalid of [
    ['--unknown', ...args.slice(1)],
    [...args.slice(0, 8), '--build', input],
    ['build', ...args.slice(1)],
    ['--build', '--output', ...args.slice(2)],
    args.slice(0, -1),
    [...args, '--unknown', 'x'],
  ])
    await assert.rejects(
      () => run(process.execPath, [script, ...invalid], { cwd: base }),
      /CLI argument/,
    );
});
