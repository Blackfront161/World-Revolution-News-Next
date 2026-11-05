import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  inspectProductionChunks,
  maximumProductionChunkBytes,
} from './check-production-js-chunks.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wrn-production-chunks-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const client of ['mobile', 'website'])
    await mkdir(path.join(root, 'apps', client, 'dist', 'assets'), { recursive: true });
  return root;
}

async function chunk(root, client, name, bytes) {
  await writeFile(path.join(root, 'apps', client, 'dist', 'assets', name), Buffer.alloc(bytes));
}

test('accepts regular production chunks at the exact cap and reports the largest first', async (t) => {
  const root = await fixture(t);
  await chunk(root, 'mobile', 'small.js', 7);
  await chunk(root, 'mobile', 'cap.js', maximumProductionChunkBytes);
  await chunk(root, 'website', 'site.js', 11);
  const result = await inspectProductionChunks(root);
  assert.equal(result[0]?.largest.name, 'cap.js');
  assert.equal(result[0]?.largest.bytes, maximumProductionChunkBytes);
  assert.equal(result[1]?.largest.name, 'site.js');
});

test('rejects an oversized production chunk', async (t) => {
  const root = await fixture(t);
  await chunk(root, 'mobile', 'too-large.js', maximumProductionChunkBytes + 1);
  await chunk(root, 'website', 'site.js', 1);
  await assert.rejects(inspectProductionChunks(root), /too-large\.js is 500001 bytes/u);
});

test('rejects a build without JavaScript chunks', async (t) => {
  const root = await fixture(t);
  await chunk(root, 'mobile', 'mobile.js', 1);
  await writeFile(path.join(root, 'apps', 'website', 'dist', 'assets', 'style.css'), '');
  await assert.rejects(
    inspectProductionChunks(root),
    /website production build has no JavaScript chunks/u,
  );
});
