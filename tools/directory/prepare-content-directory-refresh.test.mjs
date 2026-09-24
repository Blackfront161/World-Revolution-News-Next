import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import snapshot from '../../apps/mobile/src/features/directory/data/content-directory-v1.json' with { type: 'json' };
import {
  directoryRefreshMaxBytes,
  directoryRefreshSchema,
  selectDirectoryRefresh,
  validateDirectoryRefresh,
} from './prepare-content-directory-refresh.mjs';

const bytes = new TextEncoder().encode(JSON.stringify(snapshot) + '\n');
const artifactSha256 = createHash('sha256').update(bytes).digest('hex');
const manifest = {
  schema: directoryRefreshSchema,
  sequence: 2,
  observedAt: snapshot.observedAt,
  artifactPath: `snapshots/directory-2-${artifactSha256}.json`,
  artifactSha256,
  source: {
    repository: 'https://github.com/Blackfront161/Revolution-News-Data',
    commit: snapshot.sourceCommit,
    newsPath: 'news-feed.json',
    sourcesPath: 'sources-registry.json',
  },
};
const response = (body = bytes, headers = {}) =>
  new Response(body, { headers: { 'content-type': 'application/json', ...headers } });

test('binds exact bytes, source commit, paths, monotonic sequence and stable ids', async () => {
  assert.equal(await validateDirectoryRefresh(manifest, bytes, 1), true);
  assert.equal(
    await validateDirectoryRefresh({ ...manifest, artifactSha256: '0'.repeat(64) }, bytes, 1),
    false,
  );
  assert.equal(await validateDirectoryRefresh(manifest, bytes, 2), false);
  assert.equal(
    await validateDirectoryRefresh(
      { ...manifest, source: { ...manifest.source, newsPath: 'other.json' } },
      bytes,
      1,
    ),
    false,
  );
});

test('accepts only the exact hosted artifact path and keeps valid fallback on network failure', async () => {
  let requested;
  const accepted = await selectDirectoryRefresh({
    localBytes: bytes,
    manifest,
    previousSequence: 1,
    fetchImpl: async (url) => {
      requested = String(url);
      return response();
    },
  });
  assert.equal(accepted.state, 'remote-accepted');
  assert.equal(requested, `https://solinaridao.com/wrn-content-directory/${manifest.artifactPath}`);
  const fallback = await selectDirectoryRefresh({
    localBytes: bytes,
    manifest,
    fetchImpl: async () => {
      throw new Error('offline');
    },
  });
  assert.equal(fallback.state, 'offline-fallback');
  assert.deepEqual(fallback.bytes, bytes);
});

test('rejects rollback, tamper, invalid local fallback and streamed oversize', async () => {
  const rollback = await selectDirectoryRefresh({
    localBytes: bytes,
    manifest,
    previousSequence: 2,
    fetchImpl: async () => {
      throw new Error('must not fetch');
    },
  });
  assert.equal(rollback.state, 'offline-fallback');
  const tampered = new Uint8Array(bytes);
  tampered[tampered.length - 2] ^= 1;
  assert.equal(
    (
      await selectDirectoryRefresh({
        localBytes: bytes,
        manifest,
        fetchImpl: async () => response(tampered),
      })
    ).state,
    'offline-fallback',
  );
  await assert.rejects(
    () => selectDirectoryRefresh({ localBytes: new TextEncoder().encode('{}'), manifest }),
    /local-directory-invalid/u,
  );
  const oversized = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(directoryRefreshMaxBytes + 1));
    },
  });
  assert.equal(
    (
      await selectDirectoryRefresh({
        localBytes: bytes,
        manifest,
        fetchImpl: async () => response(oversized),
      })
    ).state,
    'offline-fallback',
  );
});
