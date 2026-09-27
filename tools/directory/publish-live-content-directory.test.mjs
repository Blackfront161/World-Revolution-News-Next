import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  createFtpsTransport,
  loadPreparedDirectory,
  publishPreparedDirectory,
  readPublicDirectoryManifest,
} from './publish-live-content-directory.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const baselinePath = 'apps/mobile/src/features/directory/data/content-directory-v1.json';

async function packet(t) {
  const output = await mkdtemp(join(tmpdir(), 'wrn-directory-publisher-'));
  t.after(() => rm(output, { recursive: true, force: true }));
  const snapshotBytes = await readFile(baselinePath);
  const document = JSON.parse(snapshotBytes.toString('utf8'));
  const sequence = 202609090438;
  const artifactSha256 = sha256(snapshotBytes);
  const artifactPath = `snapshots/directory-${sequence}-${artifactSha256}.json`;
  const manifest = {
    schema: 'wrn.content-directory-refresh.v1',
    sequence,
    observedAt: document.observedAt,
    artifactPath,
    artifactSha256,
    source: {
      repository: 'https://github.com/Blackfront161/Revolution-News-Data',
      commit: document.sourceCommit,
      newsPath: 'news-feed.json',
      sourcesPath: 'sources-registry.json',
    },
  };
  await mkdir(join(output, 'snapshots'));
  await writeFile(join(output, artifactPath), snapshotBytes);
  await writeFile(join(output, 'current.json'), JSON.stringify(manifest));
  return { output, manifest, snapshotBytes, now: Date.parse(document.observedAt) + 60_000 };
}

test('accepts only a fresh, commit-bound and byte-matched prepared directory', async (t) => {
  const fixture = await packet(t);
  const args = {
    output: fixture.output,
    expectedCommit: fixture.manifest.source.commit,
    now: fixture.now,
  };
  const prepared = await loadPreparedDirectory(args);
  assert.equal(prepared.manifest.artifactSha256, fixture.manifest.artifactSha256);
  await assert.rejects(loadPreparedDirectory({ ...args, now: fixture.now + 3 * 60 * 60_000 }), {
    message: 'directory-stale',
  });
  await assert.rejects(loadPreparedDirectory({ ...args, expectedCommit: '0'.repeat(40) }), {
    message: 'directory-commit-mismatch',
  });
  await writeFile(join(fixture.output, fixture.manifest.artifactPath), '{}');
  await assert.rejects(loadPreparedDirectory(args), { message: 'directory-snapshot-hash' });
});

test('publishes the verified snapshot before changing the pointer', async (t) => {
  const fixture = await packet(t);
  const prepared = await loadPreparedDirectory({
    output: fixture.output,
    expectedCommit: fixture.manifest.source.commit,
    now: fixture.now,
  });
  const previous = { ...fixture.manifest, sequence: fixture.manifest.sequence - 1 };
  const calls = [];
  let active = previous;
  const transport = {
    uploadSnapshot: async (path) => calls.push(`snapshot:${path}`),
    uploadPointer: async (path, bytes) => {
      assert.deepEqual(bytes, prepared.manifestBytes);
      calls.push(`pending:${path}`);
    },
    activatePointer: async (path) => {
      calls.push(`activate:${path}`);
      active = fixture.manifest;
    },
  };
  const result = await publishPreparedDirectory({
    prepared,
    transport,
    fetchCurrent: async () => active,
    fetchPublic: async () => {
      calls.push('verify-snapshot');
      return new Response(fixture.snapshotBytes, {
        headers: { 'content-type': 'application/json' },
      });
    },
  });
  assert.deepEqual(result, { state: 'published', sequence: fixture.manifest.sequence });
  assert.deepEqual(calls, [
    `snapshot:${fixture.manifest.artifactPath}`,
    'verify-snapshot',
    `pending:current.${fixture.manifest.sequence}-${fixture.manifest.artifactSha256}.tmp`,
    `activate:current.${fixture.manifest.sequence}-${fixture.manifest.artifactSha256}.tmp`,
  ]);
});

test('stops on rollback, hash mismatch and a concurrent pointer change', async (t) => {
  const fixture = await packet(t);
  const prepared = await loadPreparedDirectory({
    output: fixture.output,
    expectedCommit: fixture.manifest.source.commit,
    now: fixture.now,
  });
  const calls = [];
  const transport = {
    uploadSnapshot: async () => calls.push('snapshot'),
    uploadPointer: async () => calls.push('pending'),
    activatePointer: async () => calls.push('activate'),
  };
  await assert.rejects(
    publishPreparedDirectory({
      prepared,
      transport,
      fetchCurrent: async () => ({ ...fixture.manifest, sequence: fixture.manifest.sequence + 1 }),
    }),
    { message: 'directory-rollback-or-sequence-conflict' },
  );
  assert.deepEqual(calls, []);
  const previous = { ...fixture.manifest, sequence: fixture.manifest.sequence - 1 };
  await assert.rejects(
    publishPreparedDirectory({
      prepared,
      transport,
      fetchCurrent: async () => previous,
      fetchPublic: async () =>
        new Response('{}', { headers: { 'content-type': 'application/json' } }),
    }),
    { message: 'directory-upload-mismatch' },
  );
  assert.deepEqual(calls, ['snapshot']);
  calls.length = 0;
  let reads = 0;
  await assert.rejects(
    publishPreparedDirectory({
      prepared,
      transport,
      fetchCurrent: async () => (++reads === 1 ? previous : fixture.manifest),
      fetchPublic: async () =>
        new Response(fixture.snapshotBytes, { headers: { 'content-type': 'application/json' } }),
    }),
    { message: 'directory-concurrent-publication' },
  );
  assert.deepEqual(calls, ['snapshot']);
  calls.length = 0;
  reads = 0;
  await assert.rejects(
    publishPreparedDirectory({
      prepared,
      transport,
      fetchCurrent: async () => (++reads < 3 ? previous : fixture.manifest),
      fetchPublic: async () =>
        new Response(fixture.snapshotBytes, { headers: { 'content-type': 'application/json' } }),
    }),
    { message: 'directory-concurrent-publication' },
  );
  assert.deepEqual(calls, ['snapshot', 'pending']);
  calls.length = 0;
  assert.deepEqual(
    await publishPreparedDirectory({
      prepared,
      transport,
      fetchCurrent: async () => fixture.manifest,
      fetchPublic: async () =>
        new Response(fixture.snapshotBytes, { headers: { 'content-type': 'application/json' } }),
    }),
    { state: 'already-current', sequence: fixture.manifest.sequence },
  );
  assert.deepEqual(calls, []);
});

test('remote manifest reader and FTPS setup reject untrusted deployment inputs', async () => {
  await assert.rejects(
    readPublicDirectoryManifest(
      async () => new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }),
    ),
    { message: 'directory-public-type' },
  );
  assert.throws(
    () =>
      createFtpsTransport({
        host: 'evil.example',
        ip: '127.0.0.1',
        user: 'wrn',
        password: 'valid-long-password',
        remoteRoot: '/',
      }),
    { message: 'directory-ftps-host' },
  );
  assert.throws(
    () =>
      createFtpsTransport({
        host: 'srv2083.hstgr.io',
        ip: '82.198.229.55',
        user: 'wrn',
        password: 'valid-long-password',
        remoteRoot: '/../public_html',
      }),
    { message: 'directory-ftps-root' },
  );
});

test('the scheduled publisher is off by default, read-only at GitHub and requires scoped secrets', async () => {
  const workflow = await readFile('.github/workflows/wrn-directory-publication.yml', 'utf8');
  assert.match(workflow, /schedule:\s*\n\s*- cron: '47 \*\/6 \* \* \*'/u);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/u);
  assert.match(workflow, /github\.event\.repository\.private == false/u);
  assert.match(workflow, /persist-credentials: false/u);
  assert.match(workflow, /vars\.WRN_DIRECTORY_PUBLISH_ENABLED == '1'/u);
  assert.match(workflow, /inputs\.publish == true/u);
  assert.match(workflow, /default: false/u);
  assert.match(workflow, /secrets\.WRN_FTPS_PASSWORD/u);
  assert.match(workflow, /--expected-commit "\$UPSTREAM_COMMIT"/u);
  assert.doesNotMatch(workflow, /--insecure|--ftp-ssl-control|--ssl-allow-beast/u);
});
