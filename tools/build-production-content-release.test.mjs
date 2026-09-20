import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildProductionContentRelease } from './build-production-content-release.mjs';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(
  workspace,
  'packages',
  'content-contracts',
  'tests',
  'fixtures',
  'wrn-production-content-v1',
  'synthetic-build-input.json',
);
async function files(directory, prefix = '') {
  const names = await readdir(directory, { withFileTypes: true });
  const entries = await Promise.all(
    names.map(async (entry) =>
      entry.isDirectory()
        ? files(path.join(directory, entry.name), `${prefix}${entry.name}/`)
        : [`${prefix}${entry.name}:${await readFile(path.join(directory, entry.name), 'utf8')}`],
    ),
  );
  return entries.flat().sort();
}
test('builds fresh releases byte-for-byte across input ordering and working directories', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wrn-production-builder-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const firstInput = path.join(root, 'one.json');
  const secondInput = path.join(root, 'two.json');
  await cp(source, firstInput);
  const parsed = JSON.parse(await readFile(source, 'utf8'));
  await writeFile(
    secondInput,
    JSON.stringify({
      documents: {
        archiveLifecycle: parsed.documents.archiveLifecycle,
        readerDetails: parsed.documents.readerDetails,
        discoverIndex: parsed.documents.discoverIndex,
        admission: parsed.documents.admission,
        articles: parsed.documents.articles,
      },
      sequence: parsed.sequence,
      releaseRevision: parsed.releaseRevision,
      schema: parsed.schema,
    }),
    'utf8',
  );
  await buildProductionContentRelease({
    inputPath: firstInput,
    outputPath: path.join(root, 'first'),
  });
  const previousDirectory = process.cwd();
  process.chdir(os.tmpdir());
  try {
    await buildProductionContentRelease({
      inputPath: secondInput,
      outputPath: path.join(root, 'second'),
    });
  } finally {
    process.chdir(previousDirectory);
  }
  assert.deepEqual(await files(path.join(root, 'first')), await files(path.join(root, 'second')));
});
test('refuses existing target and invalid input before any promotion', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wrn-production-builder-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const input = path.join(root, 'input.json');
  await cp(source, input);
  const target = path.join(root, 'target');
  await buildProductionContentRelease({ inputPath: input, outputPath: target });
  await assert.rejects(
    buildProductionContentRelease({ inputPath: input, outputPath: target }),
    /already exists/,
  );
  const invalid = path.join(root, 'invalid.json');
  await writeFile(invalid, '{"schema":"bad"}', 'utf8');
  await assert.rejects(
    buildProductionContentRelease({
      inputPath: invalid,
      outputPath: path.join(root, 'invalid-target'),
    }),
    /does not match/,
  );
  const unknownKey = path.join(root, 'unknown-key.json');
  const valid = JSON.parse(await readFile(source, 'utf8'));
  valid.documents.extra = {};
  await writeFile(unknownKey, JSON.stringify(valid), 'utf8');
  await assert.rejects(
    buildProductionContentRelease({
      inputPath: unknownKey,
      outputPath: path.join(root, 'unknown-key-target'),
    }),
    /does not match/,
  );
  const malformedUtf8 = path.join(root, 'malformed-utf8.json');
  await writeFile(malformedUtf8, Buffer.from([0xc3, 0x28]));
  await assert.rejects(
    buildProductionContentRelease({
      inputPath: malformedUtf8,
      outputPath: path.join(root, 'malformed-utf8-target'),
    }),
    /strict UTF-8 JSON/,
  );
  const oversized = path.join(root, 'oversized.json');
  await writeFile(oversized, `{"padding":"${'x'.repeat(4 * 1024 * 1024)}"}`, 'utf8');
  await assert.rejects(
    buildProductionContentRelease({
      inputPath: oversized,
      outputPath: path.join(root, 'oversized-target'),
    }),
    /size limit/,
  );
});
