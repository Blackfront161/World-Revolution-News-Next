import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { createShellProtocol } from '../src/offline-shell/protocol.mjs';
import { installWebsiteShellRuntime } from '../src/offline-shell/worker-runtime.mjs';
import { workerProtocolRevision } from '../src/offline-shell/worker-template.mjs';

import { buildOfflineShell, collectShellManifest } from './build-offline-shell.mjs';

const jsonNames = [
  'legacy-knowledge-v1-a.json',
  'legacy-support-v1-a.json',
  'content-directory-v1-a.json',
];
async function fixture(names = jsonNames, retained = false) {
  const parent = retained
    ? path.resolve(import.meta.dirname, '../../../test-results')
    : os.tmpdir();
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(path.join(parent, 'wrn-g3-015-shell-'));
  const dist = path.join(root, 'dist');
  await mkdir(path.join(dist, 'assets'), { recursive: true });
  await mkdir(path.join(dist, '.vite'), { recursive: true });
  await writeFile(
    path.join(dist, '.vite/manifest.json'),
    JSON.stringify({
      'index.html': {
        file: 'assets/index-a.js',
        src: 'index.html',
        isEntry: true,
        css: ['assets/index-a.css'],
        assets: [
          'assets/solinaridao-header-mark-filled-a.png',
          'assets/wrn-future-header-white-a.png',
          ...names.map((name) => `assets/${name}`),
        ],
      },
    }),
  );
  await writeFile(
    path.join(dist, 'index.html'),
    '<!doctype html><link rel="stylesheet" href="/assets/index-a.css"><script type="module" src="/assets/index-a.js"></script>',
  );
  await writeFile(path.join(dist, 'assets/index-a.css'), 'body { color: #fff; }');
  await writeFile(path.join(dist, 'assets/index-a.js'), 'console.log("shell");');
  await writeFile(path.join(dist, 'assets/solinaridao-header-mark-filled-a.png'), 'image-a');
  await writeFile(path.join(dist, 'assets/wrn-future-header-white-a.png'), 'image-b');
  for (const name of names) await writeFile(path.join(dist, 'assets', name), '{}');
  return { root, dist };
}

const completeJsonNames = [...jsonNames, 'production-events-media-v1-a.json'];

test('complete nine-entry graph binds the new metadata file bytes and deterministic worker', async () => {
  const { dist } = await fixture(completeJsonNames, true);
  const first = await buildOfflineShell({ outputDirectory: dist });
  assert.equal(first.entries.length, 9);
  const media = first.entries.find((entry) => entry.path.includes('production-events-media-v1-'));
  assert.deepEqual(media, {
    path: '/assets/production-events-media-v1-a.json',
    mime: 'application/json; charset=utf-8',
    bytes: 2,
    sha256: createHash('sha256').update('{}').digest('hex'),
  });
  assert.equal(createShellProtocol().metadata(first.manifest), true);
  assert.equal((await buildOfflineShell({ outputDirectory: dist })).shellId, first.shellId);
  await writeFile(path.join(dist, 'assets/production-events-media-v1-a.json'), '{"changed":true}');
  assert.notEqual((await buildOfflineShell({ outputDirectory: dist })).shellId, first.shellId);
});

test('new family cannot substitute for an original family or duplicate its own family', async () => {
  for (const names of [
    [...jsonNames.slice(0, 2), completeJsonNames[3]],
    [...jsonNames.slice(0, 2), completeJsonNames[3], 'production-events-media-v1-b.json'],
    [...completeJsonNames, 'production-events-media-v1-b.json'],
  ]) {
    const { dist } = await fixture(names, true);
    await assert.rejects(() => buildOfflineShell({ outputDirectory: dist }), /JSON asset families/);
    await assert.rejects(() => readFile(path.join(dist, 'website-shell-sw.js')));
  }
});

test('nine-entry graph rejects missing, orphaned, foreign and duplicate Vite declarations', async () => {
  for (const replacement of [
    undefined,
    'https://example.org/media.json',
    'assets/content-directory-v1-a.json',
    'assets/production-events-media-v1-a.json?x=1',
  ]) {
    const { dist } = await fixture(completeJsonNames, true);
    const manifestPath = path.join(dist, '.vite/manifest.json');
    const vite = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (replacement === undefined) vite['index.html'].assets.pop();
    else vite['index.html'].assets[5] = replacement;
    await writeFile(manifestPath, JSON.stringify(vite));
    await assert.rejects(() => buildOfflineShell({ outputDirectory: dist }), /Vite manifest/);
    await assert.rejects(() => readFile(path.join(dist, 'website-shell-sw.js')));
  }
  const missing = await fixture(completeJsonNames, true);
  const vitePath = path.join(missing.dist, '.vite/manifest.json');
  const vite = JSON.parse(await readFile(vitePath, 'utf8'));
  vite['index.html'].assets[5] = 'assets/production-events-media-v1-missing.json';
  await writeFile(vitePath, JSON.stringify(vite));
  await assert.rejects(
    () => collectShellManifest({ outputDirectory: missing.dist }),
    /Vite manifest/,
  );
  const orphan = await fixture(completeJsonNames, true);
  await writeFile(path.join(orphan.dist, 'assets/foreign-a.json'), '{}');
  await assert.rejects(
    () => collectShellManifest({ outputDirectory: orphan.dist }),
    /Unapproved shell asset/,
  );
});

test('new metadata has a four MiB family limit within the unchanged eight MiB total', async () => {
  const { dist } = await fixture(completeJsonNames, true);
  const file = path.join(dist, 'assets/production-events-media-v1-a.json');
  await writeFile(file, ' '.repeat(4 * 1024 * 1024));
  assert.equal((await collectShellManifest({ outputDirectory: dist })).entries.length, 9);
  await writeFile(file, ' '.repeat(4 * 1024 * 1024 + 1));
  await assert.rejects(() => collectShellManifest({ outputDirectory: dist }), /JSON asset exceeds/);
  await writeFile(file, ' '.repeat(4 * 1024 * 1024));
  await writeFile(
    path.join(dist, 'assets/legacy-knowledge-v1-a.json'),
    ' '.repeat(3 * 1024 * 1024),
  );
  await writeFile(path.join(dist, 'assets/legacy-support-v1-a.json'), ' '.repeat(1024 * 1024));
  await assert.rejects(() => collectShellManifest({ outputDirectory: dist }), /exceeds 8 MiB/);
});

test('builds a canonical closed shell manifest and byte-identical worker twice', async (t) => {
  const { root, dist } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));

  const first = await buildOfflineShell({ outputDirectory: dist, compatibility: 'g3-015-v1' });
  const firstWorker = await readFile(path.join(dist, 'website-shell-sw.js'));
  const second = await buildOfflineShell({ outputDirectory: dist, compatibility: 'g3-015-v1' });
  const secondWorker = await readFile(path.join(dist, 'website-shell-sw.js'));

  assert.equal(first.shellId, second.shellId);
  assert.deepEqual(first.manifest, second.manifest);
  assert.deepEqual(firstWorker, secondWorker);
  assert.deepEqual(
    first.manifest.entries.map((entry) => entry.path),
    [
      '/assets/content-directory-v1-a.json',
      '/assets/index-a.css',
      '/assets/index-a.js',
      '/assets/legacy-knowledge-v1-a.json',
      '/assets/legacy-support-v1-a.json',
      '/assets/solinaridao-header-mark-filled-a.png',
      '/assets/wrn-future-header-white-a.png',
      '/index.html',
    ],
  );
  assert.ok(first.totalBytes > 0 && first.totalBytes < 8 * 1024 * 1024);
});

test('tab icon reuses the approved offline header image and rejects other references', async (t) => {
  const { root, dist } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const htmlPath = path.join(dist, 'index.html');
  const html = await readFile(htmlPath, 'utf8');
  const baseline = await collectShellManifest({ outputDirectory: dist });
  await writeFile(
    htmlPath,
    `${html}<link rel="icon" type="image/png" href="/assets/solinaridao-header-mark-filled-a.png" />`,
  );
  const withIcon = await collectShellManifest({ outputDirectory: dist });
  assert.deepEqual(
    withIcon.entries.map((entry) => entry.path),
    baseline.entries.map((entry) => entry.path),
  );
  assert.notEqual(withIcon.shellId, baseline.shellId);
  for (const icon of [
    'solinaridao-header-mark-filled-missing.png',
    'wrn-future-header-white-a.png',
    'other.png',
  ]) {
    await writeFile(htmlPath, `${html}<link rel="icon" type="image/png" href="/assets/${icon}" />`);
    await assert.rejects(
      () => collectShellManifest({ outputDirectory: dist }),
      /approved shell image|Vite manifest/,
    );
  }
});

test('dedicated original app icon is bound separately and historical shell graphs remain valid', async (t) => {
  for (const names of [jsonNames, completeJsonNames]) {
    const { root, dist } = await fixture(names);
    t.after(() => rm(root, { recursive: true, force: true }));
    const baseline = await collectShellManifest({ outputDirectory: dist });
    const icon = await readFile(
      path.resolve(import.meta.dirname, '../src/assets/wrn-app-icon.png'),
    );
    assert.equal(icon.length, 8845);
    assert.equal(
      createHash('sha256').update(icon).digest('hex'),
      '78b3dbd6c6de3876c6a15012dd0ea683136ace682382f50036d68d2250d2314f',
    );
    await writeFile(path.join(dist, 'assets/wrn-app-icon-a.png'), icon);
    const vitePath = path.join(dist, '.vite/manifest.json');
    const vite = JSON.parse(await readFile(vitePath, 'utf8'));
    vite['index.html'].assets.push('assets/wrn-app-icon-a.png');
    await writeFile(vitePath, JSON.stringify(vite));
    const htmlPath = path.join(dist, 'index.html');
    const html = await readFile(htmlPath, 'utf8');
    await assert.rejects(
      () => collectShellManifest({ outputDirectory: dist }),
      /approved shell image/,
    );
    await writeFile(
      htmlPath,
      html + '<link rel="icon" type="image/png" href="/assets/wrn-app-icon-a.png" />',
    );
    const withIcon = await buildOfflineShell({ outputDirectory: dist });
    assert.equal(withIcon.entries.length, baseline.entries.length + 1);
    assert.equal(createShellProtocol().metadata(withIcon.manifest), true);
    assert.equal(createShellProtocol().metadata(baseline), true);
    assert.deepEqual(
      withIcon.entries.filter(
        (entry) => entry.path !== '/index.html' && !entry.path.includes('wrn-app-icon-'),
      ),
      baseline.entries.filter((entry) => entry.path !== '/index.html'),
    );
    const entry = withIcon.entries.find((entry) => entry.path === '/assets/wrn-app-icon-a.png');
    assert.equal(entry.mime, 'image/png');
    assert.equal(entry.bytes, icon.length);
    assert.equal(entry.sha256, createHash('sha256').update(icon).digest('hex'));
    await writeFile(path.join(dist, 'assets/wrn-app-icon-a.png'), new Uint8Array(16 * 1024 + 1));
    await assert.rejects(() => collectShellManifest({ outputDirectory: dist }), /App icon exceeds/);
  }
});

test('a second app icon and a favicon which does not bind its dedicated file fail closed', async (t) => {
  const { root, dist } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const htmlPath = path.join(dist, 'index.html');
  const html = await readFile(htmlPath, 'utf8');
  await writeFile(path.join(dist, 'assets/wrn-app-icon-a.png'), 'icon');
  await writeFile(
    htmlPath,
    html + '<link rel="icon" type="image/png" href="/assets/wrn-app-icon-missing.png" />',
  );
  await assert.rejects(
    () => collectShellManifest({ outputDirectory: dist }),
    /approved shell image/,
  );
  await writeFile(path.join(dist, 'assets/wrn-app-icon-b.png'), 'second');
  await assert.rejects(
    () => collectShellManifest({ outputDirectory: dist }),
    /Duplicate app icon family/,
  );
});

test('binds a bounded static multi-chunk graph and rejects manifest/source disagreement', async (t) => {
  const { root, dist } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifestPath = path.join(dist, '.vite/manifest.json');
  const vite = JSON.parse(await readFile(manifestPath, 'utf8'));
  vite['index.html'].imports = ['_wrn-content-core-a.js'];
  vite['_wrn-content-core-a.js'] = { file: 'assets/wrn-content-core-a.js', imports: [] };
  await writeFile(manifestPath, JSON.stringify(vite));
  await writeFile(
    path.join(dist, 'index.html'),
    '<!doctype html><link rel="modulepreload" href="/assets/wrn-content-core-a.js"><link rel="stylesheet" href="/assets/index-a.css"><script type="module" src="/assets/index-a.js"></script>',
  );
  await writeFile(
    path.join(dist, 'assets/index-a.js'),
    'import { value } from "./wrn-content-core-a.js"; console.log(value);',
  );
  await writeFile(path.join(dist, 'assets/wrn-content-core-a.js'), 'export const value = "shell";');

  const built = await collectShellManifest({ outputDirectory: dist });
  assert.ok(built.entries.some((entry) => entry.path === '/assets/wrn-content-core-a.js'));
  assert.equal(built.entries.length, 9);

  await writeFile(path.join(dist, 'assets/index-a.js'), 'console.log("missing import");');
  await assert.rejects(
    () => collectShellManifest({ outputDirectory: dist }),
    /imports disagree with Vite manifest/u,
  );
});
test('rejects three JSON files from duplicate families, even with matching Vite references', async (t) => {
  const { root, dist } = await fixture([
    'legacy-knowledge-v1-a.json',
    'legacy-knowledge-v1-b.json',
    'legacy-knowledge-v1-c.json',
  ]);
  t.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(
    () => collectShellManifest({ outputDirectory: dist }),
    /JSON asset families/,
  );
});

test('rejects duplicate Vite asset references instead of accepting a missing declaration', async (t) => {
  const { root, dist } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifestPath = path.join(dist, '.vite/manifest.json');
  const vite = JSON.parse(await readFile(manifestPath, 'utf8'));
  vite['index.html'].assets[4] = vite['index.html'].assets[3];
  await writeFile(manifestPath, JSON.stringify(vite));
  await assert.rejects(() => collectShellManifest({ outputDirectory: dist }), /Vite manifest/);
});

test('caps each declared JSON family and rejects foreign, query and traversing references', async (t) => {
  for (const invalid of [
    'https://example.org/a.json',
    'assets/content-directory-v1-a.json?query=1',
    '../assets/content-directory-v1-a.json',
  ]) {
    const { root, dist } = await fixture();
    t.after(() => rm(root, { recursive: true, force: true }));
    const file = path.join(dist, '.vite/manifest.json');
    const vite = JSON.parse(await readFile(file, 'utf8'));
    vite['index.html'].assets[4] = invalid;
    await writeFile(file, JSON.stringify(vite));
    await assert.rejects(() => collectShellManifest({ outputDirectory: dist }), /Vite manifest/);
  }
  const { root, dist } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(dist, 'assets/legacy-support-v1-a.json'), ' '.repeat(1024 * 1024 + 1));
  await assert.rejects(() => collectShellManifest({ outputDirectory: dist }), /JSON asset exceeds/);
});

test('rejects unknown JSON and missing declared asset before emitting a worker', async (t) => {
  const { root, dist } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(dist, 'assets/unknown-a.json'), '{}');
  await assert.rejects(
    () => buildOfflineShell({ outputDirectory: dist }),
    /Unapproved shell asset/,
  );
  await assert.rejects(() => readFile(path.join(dist, 'website-shell-sw.js')));
  const missing = await fixture(jsonNames.slice(0, 2));
  t.after(() => rm(missing.root, { recursive: true, force: true }));
  await assert.rejects(() => buildOfflineShell({ outputDirectory: missing.dist }), /JSON asset/);
});

test('binds staging HTML security headers into shell identity and reconstructed responses', async (t) => {
  const { root, dist } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const htmlResponseHeaders = {
    'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
    'x-content-type-options': 'nosniff',
    'x-robots-tag': 'noindex, nofollow',
  };
  const plain = await buildOfflineShell({ outputDirectory: dist, compatibility: 'g3-015-v1' });
  const staged = await buildOfflineShell({
    outputDirectory: dist,
    compatibility: 'g3-015-v1',
    htmlResponseHeaders,
    stagingOrigin: 'https://preview.example.test',
  });
  const worker = await readFile(path.join(dist, 'website-staging-shell-sw.js'), 'utf8');

  assert.notEqual(plain.shellId, staged.shellId);
  assert.deepEqual(staged.manifest.htmlResponseHeaders, htmlResponseHeaders);
  assert.match(worker, /content-security-policy/);
  assert.match(worker, /x-robots-tag/);
  assert.match(worker, /expected\.path\.endsWith\('\.html'\)/);
  assert.match(worker, /wrn\.website-staging-shell\.v1/);
  assert.match(worker, /https:\/\/preview\.example\.test/);
  assert.doesNotMatch(worker, /wrn\.website-shell\.v1/);
});

test('returns the bound staging headers from an actual cached navigation response', async (t) => {
  const { root, dist } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const htmlResponseHeaders = {
    'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
    'x-content-type-options': 'nosniff',
    'x-robots-tag': 'noindex, nofollow',
  };
  const built = await buildOfflineShell({
    outputDirectory: dist,
    compatibility: 'g3-015-v1',
    htmlResponseHeaders,
    stagingOrigin: 'https://preview.example.test',
  });
  const worker = await readFile(path.join(dist, 'website-staging-shell-sw.js'), 'utf8');
  const protocol = {
    controlCache: 'wrn.website-staging-shell.v1.control',
    controlKey: '/__wrn_website_shell_control_v1__',
    prefix: 'wrn.website-staging-shell.v1.payload.',
  };
  const control = {
    version: 1,
    compatibility: 'g3-015-v1',
    epoch: 1,
    enabled: true,
    state: 'enabled',
    active: built.shellId,
    previous: null,
    generations: [{ id: built.shellId, bytes: built.totalBytes, ready: true, epoch: 1 }],
    pendingJob: null,
    removalJob: null,
  };
  const payloads = new Map();
  for (const entry of built.manifest.entries) {
    payloads.set(entry.path, {
      bytes: await readFile(path.join(dist, entry.path.slice(1))),
      mime: entry.mime,
    });
  }
  const storage = {
    match: async (key, options) => {
      if (options?.cacheName === protocol.controlCache && key === protocol.controlKey)
        return new Response(JSON.stringify(control));
      if (options?.cacheName === protocol.prefix + built.shellId && payloads.has(key)) {
        const payload = payloads.get(key);
        return new Response(payload.bytes, { headers: { 'content-type': payload.mime } });
      }
      return undefined;
    },
  };
  const handlers = new Map();
  const scope = {
    caches: storage,
    location: { origin: 'https://preview.example.test' },
    addEventListener: (name, handler) => handlers.set(name, handler),
  };
  vm.runInNewContext(worker, {
    self: scope,
    AbortSignal,
    Response,
    TextDecoder,
    TextEncoder,
    URL,
    crypto,
    fetch: async () => {
      throw new Error('offline');
    },
    performance,
  });
  let responsePromise;
  handlers.get('fetch')({
    request: { method: 'GET', mode: 'navigate', url: 'https://preview.example.test/' },
    respondWith: (value) => {
      responsePromise = value;
    },
  });
  const response = await responsePromise;
  assert.equal(response.status, 200);
  for (const [name, value] of Object.entries(htmlResponseHeaders))
    assert.equal(response.headers.get(name), value);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-wrn-shell-id'), built.shellId);
});

test('fails closed for an unapproved asset class before writing a worker', async (t) => {
  const { root, dist } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(dist, 'assets/later.js'), 'orphaned split chunk');

  await assert.rejects(() =>
    collectShellManifest({ outputDirectory: dist, compatibility: 'g3-015-v1' }),
  );
  await assert.rejects(() => readFile(path.join(dist, 'website-shell-sw.js')));
});

test('fails closed for an AST-recognized external dynamic import without a new dist asset', async (t) => {
  const { root, dist } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    path.join(dist, 'assets/index-a.js'),
    'import("https://example.invalid/shell.js")',
  );

  await assert.rejects(() =>
    collectShellManifest({ outputDirectory: dist, compatibility: 'g3-015-v1' }),
  );
});

test('requires Vite entry/import/assets graph to agree with HTML, not just a dist glob', async () => {
  const { dist } = await fixture();
  await writeFile(
    path.join(dist, '.vite/manifest.json'),
    JSON.stringify({ 'index.html': { file: 'assets/not-the-entry.js', isEntry: true } }),
  );
  await assert.rejects(() =>
    collectShellManifest({ outputDirectory: dist, compatibility: 'g3-015-v1' }),
  );
});

test('enforces complete shell byte budget and rejects CSS dependencies', async () => {
  const { dist } = await fixture();
  await writeFile(path.join(dist, 'assets/index-a.css'), 'body { background: url(/hidden.png); }');
  await assert.rejects(() =>
    collectShellManifest({ outputDirectory: dist, compatibility: 'g3-015-v1' }),
  );
  await writeFile(path.join(dist, 'assets/index-a.css'), 'body {}');
  await writeFile(
    path.join(dist, 'assets/solinaridao-header-mark-filled-a.png'),
    new Uint8Array(8 * 1024 * 1024),
  );
  await assert.rejects(() =>
    collectShellManifest({ outputDirectory: dist, compatibility: 'g3-015-v1' }),
  );
});

test('worker identity binds actual canonical protocol/runtime source bytes', () => {
  const source = createShellProtocol.toString() + '\n' + installWebsiteShellRuntime.toString();
  assert.equal(
    workerProtocolRevision,
    'wrn.website-shell.worker.v1.3.' + createHash('sha256').update(source).digest('hex'),
  );
});

test('bounds embedded metadata even when the five payload files are tiny', async () => {
  const { dist } = await fixture();
  await assert.rejects(() =>
    buildOfflineShell({ outputDirectory: dist, compatibility: 'x'.repeat(64 * 1024) }),
  );
  await assert.rejects(() => readFile(path.join(dist, 'website-shell-sw.js')));
});

test('many tiny extra files cannot expand the closed five-entry metadata graph', async () => {
  const { dist } = await fixture();
  for (let i = 0; i < 40; i++) await writeFile(path.join(dist, 'assets', `tiny-${i}.js`), '0');
  await assert.rejects(() =>
    collectShellManifest({ outputDirectory: dist, compatibility: 'g3-015-v1' }),
  );
});

// Exercise the serialized worker installer, including ready publication and
// cleanup. Protocol/storage lifecycle behavior has its own contract suite.
async function installResponse(body, headers, expectedBody = 'bound shell bytes', status = 200) {
  const entry = {
    path: '/index.html',
    mime: 'text/html; charset=utf-8',
    bytes: Buffer.byteLength(expectedBody),
    sha256: createHash('sha256').update(expectedBody).digest('hex'),
  };
  const manifest = {
    version: 1,
    compatibility: 'g3-015-v1',
    shellId: 'a'.repeat(64),
    totalBytes: entry.bytes,
    entries: [entry],
  };
  const protocol = createShellProtocol();
  let control = protocol.initial(1);
  const caches = new Map();
  const storage = {
    open: async (name) => {
      if (!caches.has(name)) caches.set(name, new Map());
      return { put: async (key, value) => caches.get(name).set(key, value.clone()) };
    },
    match: async (key, options) => caches.get(options.cacheName)?.get(key)?.clone(),
    delete: async (name) => caches.delete(name),
    has: async (name) => caches.has(name),
  };
  const p = {
    ...protocol,
    metadata: () => true,
    inventory: async () => {},
    read: async () => ({ kind: 'known', value: structuredClone(control) }),
    write: async (_storage, value) => {
      control = structuredClone(value);
    },
  };
  const handlers = new Map();
  const scope = {
    caches: storage,
    navigator: { locks: { request: async (_key, _options, task) => task() } },
    clients: { matchAll: async () => [] },
    addEventListener: (name, handler) => handlers.set(name, handler),
  };
  vm.runInNewContext('(' + installWebsiteShellRuntime.toString() + ')(self, manifest, p)', {
    self: scope,
    manifest,
    p,
    performance,
    crypto,
    Response,
    AbortSignal,
    URL,
    fetch: async () =>
      new Response(body, { status, headers: { 'content-type': entry.mime, ...headers } }),
  });
  let installation;
  handlers.get('install')({
    waitUntil: (value) => {
      installation = value;
    },
  });
  try {
    await installation;
  } catch (error) {
    return { error: error.message, control, caches };
  }
  return { control, caches };
}

for (const encoding of ['br', 'gzip', 'deflate'])
  test(`decoded ${encoding} response accepts encoded Content-Length and stores verified identity bytes`, async () => {
    const result = await installResponse('bound shell bytes', {
      'content-encoding': encoding,
      'content-length': '7',
    });
    assert.equal(result.error, undefined);
    assert.equal(result.control.generations[0].ready, true);
    const response = result.caches.values().next().value.get('/index.html');
    assert.equal(await response.text(), 'bound shell bytes');
    assert.equal(response.headers.get('content-encoding'), null);
    assert.equal(response.headers.get('content-length'), null);
  });

for (const encoding of [undefined, 'identity'])
  test(`incorrect identity Content-Length rejects before ready (${encoding ?? 'absent'})`, async () => {
    const result = await installResponse('bound shell bytes', {
      'content-length': '7',
      ...(encoding ? { 'content-encoding': encoding } : {}),
    });
    assert.equal(result.error, 'integrity');
    assert.equal(result.control.generations.length, 0);
    assert.equal(result.caches.size, 0);
  });

for (const [name, body, headers, error, status] of [
  ['decoded overrun', 'bound shell bytes!', {}, 'budget', 200],
  ['decoded truncation', 'bound shell byte', {}, 'integrity', 200],
  ['decoded wrong digest', 'wrong shell bytes', {}, 'integrity', 200],
  ['wrong MIME', 'bound shell bytes', { 'content-type': 'text/plain' }, 'integrity', 200],
  ['wrong status', 'bound shell bytes', {}, 'integrity', 206],
])
  test(`compressed ${name} cannot publish ready and cleans partial payload`, async () => {
    const result = await installResponse(
      body,
      { 'content-encoding': 'br', 'content-length': '7', ...headers },
      'bound shell bytes',
      status,
    );
    assert.equal(result.error, error);
    assert.equal(result.control.generations.length, 0);
    assert.equal(result.caches.size, 0);
  });
