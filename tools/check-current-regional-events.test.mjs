import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { checkCurrentRegionalEvents } from './check-current-regional-events.mjs';

const workspace = path.resolve(import.meta.dirname, '..');
const currentSnapshot = JSON.parse(
  await readFile(
    path.join(workspace, 'packages/browser-content/src/regional-events/events.json'),
    'utf8',
  ),
);

test('accepts the current reviewed pinned snapshot outside its renewal window', async () => {
  const result = await checkCurrentRegionalEvents({
    root: workspace,
    at: Date.parse(currentSnapshot.generatedAt) + 3_600_000,
    minimumHours: 48,
  });
  assert.equal(result.schema, 'wrn.regional-events-freshness-check.v1');
  assert.equal(result.revision, 4);
  assert.equal(result.events, 4);
  assert.equal(result.sources, 4);
  assert.equal(result.validUntil, currentSnapshot.validUntil);
  assert.equal(result.publicationPerformed, false);
  assert.match(result.sha256, /^[a-f0-9]{64}$/u);
});

test('requires review before the snapshot expires and at the exact boundary', async () => {
  for (const at of [
    Date.parse(currentSnapshot.validUntil) - 48 * 3_600_000,
    currentSnapshot.validUntil,
  ])
    await assert.rejects(
      checkCurrentRegionalEvents({ root: workspace, at, minimumHours: 48 }),
      /regional-events-renewal-required/u,
    );
});

test('rejects changed bytes even when the JSON still parses', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'wrn-regional-freshness-'));
  const dataDirectory = path.join(root, 'packages/browser-content/src/regional-events');
  await mkdir(dataDirectory, { recursive: true });
  const [events, pin] = await Promise.all([
    readFile(
      path.join(workspace, 'packages/browser-content/src/regional-events/events.json'),
      'utf8',
    ),
    readFile(path.join(workspace, 'packages/browser-content/src/regional-events/data.ts'), 'utf8'),
  ]);
  await Promise.all([
    writeFile(path.join(dataDirectory, 'events.json'), `${events} `),
    writeFile(path.join(dataDirectory, 'data.ts'), pin),
  ]);
  await assert.rejects(
    checkCurrentRegionalEvents({ root, at: currentSnapshot.generatedAt }),
    /regional-hash-pin-mismatch/u,
  );
});
