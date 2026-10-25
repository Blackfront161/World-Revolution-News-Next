import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFile(path.join(root, relative));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const overlay = 'packages/browser-content/src/data/source-pass-overlay-v1.json';
const safety = 'packages/browser-content/src/data/source-pass-revocations-v1.json';

test('both clients ship the exact hash-bound full source overlay and safety snapshot', async () => {
  const [fullBytes, mobileBytes, websiteBytes, mobileSafety, websiteSafety, bundledSafety, loader] =
    await Promise.all([
      read(overlay),
      read('apps/mobile/public/wrn-source-passes/current.json'),
      read('apps/website/public/wrn-source-passes/current.json'),
      read('apps/mobile/public/wrn-source-pass-revocations/current.json'),
      read('apps/website/public/wrn-source-pass-revocations/current.json'),
      read(safety),
      read('packages/browser-content/src/source-pass-overlay.ts'),
    ]);
  assert.deepEqual(mobileBytes, fullBytes);
  assert.deepEqual(websiteBytes, fullBytes);
  assert.deepEqual(mobileSafety, bundledSafety);
  assert.deepEqual(websiteSafety, bundledSafety);
  assert.match(loader.toString('utf8'), new RegExp(`'${sha256(fullBytes)}'`));

  const full = JSON.parse(fullBytes);
  const revocations = JSON.parse(bundledSafety);
  assert.equal(full.records.length, 19);
  assert.equal(full.records.flatMap((record) => record.endpoints).length, 22);
  assert.equal(revocations.schema, 'wrn.source-pass-revocations.v1');
  assert.deepEqual(revocations.endpointIds, []);
});

test('offline fallback remains the first three directory-only profiles with their evidence', async () => {
  const full = JSON.parse(await read(overlay));
  const fallback = JSON.parse(
    await read('packages/browser-content/src/data/source-pass-overlay-fallback-v1.json'),
  );
  assert.equal(fallback.records.length, 3);
  assert.deepEqual(fallback.records, full.records.slice(0, 3));
  assert(
    fallback.records.every((record) =>
      record.endpoints.every((entry) => entry.kind === 'directory'),
    ),
  );
  const referenced = new Set(
    fallback.records.flatMap((record) => [
      ...record.evidenceIds,
      ...record.selfDescription.evidenceIds,
      ...record.editorialDescription.evidenceIds,
      ...record.endpoints.flatMap((entry) => entry.evidenceIds),
      ...record.rights.flatMap((right) => right.evidenceIds),
      ...record.correctionContact.evidenceIds,
    ]),
  );
  assert.deepEqual(
    fallback.evidence,
    full.evidence.filter((entry) => referenced.has(entry.id)),
  );
});
