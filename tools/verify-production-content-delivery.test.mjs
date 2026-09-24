import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { verifyProductionDelivery } from './verify-production-content-delivery.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const pointer = 'activate/wrn-production-content/current.json';
async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'wrn-delivery-check-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const generatedAt = '2026-09-20T00:00:00.000Z';
  const descriptor = '{"releaseRevision":"v5","sequence":1}';
  const current = JSON.stringify({
    schema: 'wrn.production-content-current.v1',
    releaseRevision: 'v5',
    sequence: 1,
    descriptorPath: 'v5/release-descriptor.json',
    descriptorSha256: hash(descriptor),
  });
  const entries = [
    ['preactivate/wrn-production-content/v5/release-descriptor.json', descriptor],
    ['preactivate/wrn-production-content/v5/manifest.json', '{}'],
    ['preactivate/wrn-production-content/v5/website-publication.json', '{}'],
    ['preactivate/article-publication-manifest.json', '{}'],
    [pointer, current],
  ];
  const ledger = JSON.stringify({
    schema: 'wrn.production-static-delivery-ledger.v1',
    version: 1,
    endpointBase: 'https://solinaridao.com/wrn-production-content/',
    siteOrigin: 'https://solinaridao.com/',
    highestSequence: 1,
    previousLedgerSha256: null,
    safetyLedger: { revision: 1, revokedIds: [] },
    entries: [
      {
        sequence: 1,
        releaseRevision: 'v5',
        descriptorSha256: hash(descriptor),
        manifestSha256: hash('{}'),
        publicationSha256: hash('{}'),
        staticManifestSha256: hash('{}'),
        generatedAt,
        safetyRevision: 1,
        articleIds: ['wrn-art-' + 'a'.repeat(32)],
      },
    ],
  });
  await writeFile(path.join(root, 'next-ledger.json'), ledger);
  for (const [p, b] of entries) {
    await mkdir(path.dirname(path.join(root, p)), { recursive: true });
    await writeFile(path.join(root, p), b);
  }
  const manifest = {
    schema: 'wrn.production-static-delivery-manifest.v1',
    version: 1,
    endpointBase: 'https://solinaridao.com/wrn-production-content/',
    siteOrigin: 'https://solinaridao.com/',
    releaseRevision: 'v5',
    sequence: 1,
    generatedAt,
    nextLedgerSha256: hash(ledger),
    files: entries.map(([p, b]) => ({ path: p, bytes: Buffer.byteLength(b), sha256: hash(b) })),
    activationOrder: entries.map(([p]) => p),
  };
  const save = async () => {
    const b = JSON.stringify(manifest);
    await writeFile(path.join(root, 'delivery-manifest.json'), b);
    return hash(b);
  };
  return { root, entries, manifest, save, manifestSha256: await save() };
}
test('local verification binds every file and ledger without any network request', async (t) => {
  const f = await fixture(t);
  const result = await verifyProductionDelivery({
    directory: f.root,
    manifestSha256: f.manifestSha256,
    fetchImpl: () => assert.fail('network'),
  });
  assert.equal(result.localFiles, 5);
  assert.equal(result.remoteFiles, 0);
  assert.equal(result.publicationPerformed, false);
  await writeFile(path.join(f.root, f.entries[0][0]), 'wrong');
  await assert.rejects(
    verifyProductionDelivery({ directory: f.root, manifestSha256: f.manifestSha256 }),
    /hash mismatch/,
  );
});
test('rejects changed manifest and ledger before remote traffic', async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    verifyProductionDelivery({ directory: f.root, manifestSha256: '0'.repeat(64) }),
    /manifest hash/,
  );
  await writeFile(path.join(f.root, 'next-ledger.json'), 'changed');
  await assert.rejects(
    verifyProductionDelivery({ directory: f.root, manifestSha256: f.manifestSha256 }),
    /ledger hash/,
  );
});
test('requires pointer-last order and disallows package traversal', async (t) => {
  const f = await fixture(t);
  f.manifest.activationOrder.reverse();
  await assert.rejects(
    verifyProductionDelivery({ directory: f.root, manifestSha256: await f.save() }),
    /activation order/,
  );
  f.manifest.files[0].path = 'preactivate/../../outside';
  await assert.rejects(
    verifyProductionDelivery({ directory: f.root, manifestSha256: await f.save() }),
    /invalid package path/,
  );
});
test('preactivation never fetches pointer; active checks it last with safe transport', async (t) => {
  const f = await fixture(t);
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push(url);
    assert.equal(options.redirect, 'error');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.method, 'GET');
    const entry = f.entries.find(([p]) =>
      url.endsWith('/' + p.replace(/^(activate|preactivate)\//, '')),
    );
    return new Response(entry[1], { headers: { 'cache-control': 'no-store' } });
  };
  const base = { directory: f.root, manifestSha256: f.manifestSha256, fetchImpl };
  assert.equal(
    (await verifyProductionDelivery({ ...base, phase: 'preactivate' })).pointerChecked,
    false,
  );
  assert.equal(calls.length, 4);
  calls.length = 0;
  assert.equal((await verifyProductionDelivery({ ...base, phase: 'active' })).pointerChecked, true);
  assert.equal(calls.length, 5);
  assert.ok(calls[4].endsWith('/current.json'));
});
test('rejects wrong remote bytes, oversized streams and cacheable pointer', async (t) => {
  const f = await fixture(t);
  const base = { directory: f.root, manifestSha256: f.manifestSha256, phase: 'active' };
  await assert.rejects(
    verifyProductionDelivery({ ...base, fetchImpl: async () => new Response('X'.repeat(200)) }),
    /exceeds bound/,
  );
  await assert.rejects(
    verifyProductionDelivery({ ...base, fetchImpl: async () => new Response('wrong') }),
    /hash mismatch/,
  );
  await assert.rejects(
    verifyProductionDelivery({
      ...base,
      fetchImpl: async (url) =>
        new Response(
          f.entries.find(([p]) =>
            url.endsWith('/' + p.replace(/^(activate|preactivate)\//, '')),
          )[1],
          {
            headers: { 'cache-control': 'public,max-age=86400' },
          },
        ),
    }),
    /pointer must not/,
  );
});

test('rejects malformed identity and a valid ledger bound to another revision', async (t) => {
  const f = await fixture(t);
  f.manifest.sequence = 'x';
  await assert.rejects(
    verifyProductionDelivery({ directory: f.root, manifestSha256: await f.save() }),
    /invalid manifest/,
  );
  f.manifest.sequence = 1;
  f.manifest.releaseRevision = 'another';
  await assert.rejects(
    verifyProductionDelivery({ directory: f.root, manifestSha256: await f.save() }),
    /release identity mismatch/,
  );
});

test('rejects a hash-consistent pointer targeting a different revision directory', async (t) => {
  const f = await fixture(t);
  const bytes = JSON.stringify({
    ...JSON.parse(f.entries.at(-1)[1]),
    descriptorPath: 'other/release-descriptor.json',
  });
  await writeFile(path.join(f.root, pointer), bytes);
  const entry = f.manifest.files.find((e) => e.path === pointer);
  entry.bytes = Buffer.byteLength(bytes);
  entry.sha256 = hash(bytes);
  await assert.rejects(
    verifyProductionDelivery({ directory: f.root, manifestSha256: await f.save() }),
    /release identity mismatch/,
  );
});
