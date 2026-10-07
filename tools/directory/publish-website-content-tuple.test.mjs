import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { websiteTupleFixture } from './website-tuple-test-fixture.mjs';
import {
  prepareWebsiteContentTuple,
  writePreparedWebsiteTuple,
} from './prepare-website-content-tuple.mjs';
import {
  loadPreparedWebsiteTuple,
  publishPreparedWebsiteTuple,
  readPublicWebsiteTuplePointerBytes,
} from './publish-website-content-tuple.mjs';
const a = await prepareWebsiteContentTuple(websiteTupleFixture()),
  b = await prepareWebsiteContentTuple(websiteTupleFixture({ revision: 2 }));
const prepared = {
  manifest: b.pointer,
  pointerBytes: b.pointerBytes,
  snapshotBytes: b.bytes,
  snapshotPath: 'unused-test-path',
};
function harness({
  badSnapshot = false,
  failedReadback = false,
  failedRollback = false,
  concurrent = false,
} = {}) {
  let active = a.pointerBytes,
    readbackFailed = false;
  const calls = [];
  return {
    calls,
    get active() {
      return active;
    },
    transport: {
      uploadSnapshot: async () => calls.push('snapshot'),
      uploadPointer: async (path) =>
        calls.push(path.endsWith('rollback.tmp') ? 'backup' : 'pending'),
      activatePointer: async (path) => {
        calls.push(path.endsWith('rollback.tmp') ? 'restore' : 'activate');
        if (path.endsWith('rollback.tmp')) {
          if (failedRollback) throw Error('offline');
          active = a.pointerBytes;
        } else {
          active = b.pointerBytes;
          readbackFailed = failedReadback;
        }
      },
    },
    fetchCurrentBytes: async () => {
      if (readbackFailed) {
        readbackFailed = false;
        throw Error('readback failure');
      }
      if (concurrent && calls.includes('backup'))
        return Buffer.from(
          JSON.stringify({
            ...b.pointer,
            sequence: 103,
            artifactPath: `snapshots/website-103-${b.pointer.artifactSha256}.json`,
          }) + '\n',
        );
      return active;
    },
    fetchPublic: async () =>
      new Response(badSnapshot ? '{}' : b.bytes, {
        headers: { 'content-type': 'application/json' },
      }),
  };
}
test('packet requires READY, exact byte/hash/source/commit binding and freshness', async (t) => {
  const base = await mkdtemp(join(tmpdir(), 'wrn-tuple-tests-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const output = join(base, 'packet');
  await writePreparedWebsiteTuple(b, output);
  const args = {
    output,
    expectedCommit: b.pointer.source.dataCommit,
    allowedImageOrigins: ['https://images.example'],
    now: Date.parse(b.pointer.observedAt),
  };
  assert.equal(
    (await loadPreparedWebsiteTuple(args)).manifest.artifactSha256,
    b.pointer.artifactSha256,
  );
  await assert.rejects(
    loadPreparedWebsiteTuple({ ...args, expectedCommit: 'f'.repeat(40) }),
    /tuple-commit/,
  );
  await assert.rejects(
    loadPreparedWebsiteTuple({ ...args, now: args.now + 7200001 }),
    /tuple-stale/,
  );
  await writeFile(join(output, 'READY.json'), '{}');
  await assert.rejects(loadPreparedWebsiteTuple(args), /tuple-ready/);
});
test('snapshot readback precedes the single pointer activation', async () => {
  const h = harness(),
    result = await publishPreparedWebsiteTuple({ prepared, ...h });
  assert.equal(result.state, 'published');
  assert.deepEqual(h.calls, ['snapshot', 'pending', 'backup', 'activate']);
  assert.deepEqual(h.active, b.pointerBytes);
});
test('failed pointer readback restores the exact previous complete tuple', async () => {
  const h = harness({ failedReadback: true });
  await assert.rejects(
    publishPreparedWebsiteTuple({ prepared, ...h }),
    /activation-unverified-restored/,
  );
  assert.deepEqual(h.active, a.pointerBytes);
  assert.equal(h.calls.at(-1), 'restore');
});
test('wrong snapshot and a concurrent publisher stop before activation', async () => {
  const bad = harness({ badSnapshot: true });
  await assert.rejects(publishPreparedWebsiteTuple({ prepared, ...bad }), /upload-mismatch/);
  assert.deepEqual(bad.calls, ['snapshot']);
  const race = harness({ concurrent: true });
  await assert.rejects(
    publishPreparedWebsiteTuple({ prepared, ...race }),
    /concurrent-publication/,
  );
  assert.ok(!race.calls.includes('activate'));
});
test('an unverified rollback and a missing initial release never claim success', async () => {
  const h = harness({ failedReadback: true, failedRollback: true });
  await assert.rejects(publishPreparedWebsiteTuple({ prepared, ...h }), /rollback-unverified/);
  await assert.rejects(
    readPublicWebsiteTuplePointerBytes(async () => new Response('', { status: 404 })),
    /seed-release-required/,
  );
});
