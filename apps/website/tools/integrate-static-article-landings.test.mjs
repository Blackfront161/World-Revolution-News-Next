import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { integrateStaticArticleLandings } from './integrate-static-article-landings.mjs';

async function withOutput(callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wrn-g3-007-build-test-'));
  try {
    const output = path.join(root, 'website-dist');
    await mkdir(output);
    return await callback(output);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function snapshotTree(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const snapshot = {};
  for (const entry of entries.sort((first, second) => first.name.localeCompare(second.name))) {
    const entryPath = path.join(directory, entry.name);
    snapshot[entry.name] = entry.isDirectory()
      ? await snapshotTree(entryPath)
      : (await readFile(entryPath)).toString('base64');
  }
  return snapshot;
}

test('integrates only the static publication into a fresh website build', async () => {
  await withOutput(async (output) => {
    await writeFile(path.join(output, 'index.html'), '<!doctype html>\n', 'utf8');
    const result = await integrateStaticArticleLandings({ outputDirectory: output });

    assert.equal(result.landingPages.length, 3);
    assert.deepEqual((await readdir(output)).sort(), [
      'article-publication-manifest.json',
      'articles',
      'index.html',
      'robots.txt',
      'sitemap.xml',
    ]);
    const cedar = await readFile(
      path.join(output, 'articles', 'wrn-test-art-cedar', 'index.html'),
      'utf8',
    );
    assert.match(cedar, /World Revolution News/);
    assert.match(cedar, /prefers-color-scheme:dark/);
    assert.match(cedar, /class="reader-content"/);
    assert.match(cedar, /href="\/?\?article=wrn-test-art-cedar"/);
  });
});

test('refuses caller-owned static artifacts without changing their marker', async () => {
  await withOutput(async (output) => {
    const marker = path.join(output, 'sitemap.xml');
    await writeFile(marker, 'caller-owned\n', 'utf8');
    await assert.rejects(
      integrateStaticArticleLandings({ outputDirectory: output }),
      /enthaelt bereits sitemap\.xml und bleibt unveraendert/,
    );
    assert.equal(await readFile(marker, 'utf8'), 'caller-owned\n');
    assert.deepEqual(await readdir(output), ['sitemap.xml']);
  });
});

test('restores the caller-owned website build exactly after a mid-promotion failure', async () => {
  await withOutput(async (output) => {
    await writeFile(path.join(output, 'index.html'), '<!doctype html>caller-build\n', 'utf8');
    await writeFile(path.join(output, 'caller-owned-marker.txt'), 'keep every byte\n', 'utf8');
    const before = await snapshotTree(output);
    let moveCount = 0;

    await assert.rejects(
      integrateStaticArticleLandings({
        outputDirectory: output,
        move: async (source, target) => {
          moveCount += 1;
          if (moveCount === 3) throw new Error('simulated promotion interruption');
          await rename(source, target);
        },
      }),
      /simulated promotion interruption/,
    );

    assert.equal(moveCount, 5);
    assert.deepEqual(await snapshotTree(output), before);
    await assert.rejects(readFile(path.join(output, '.wrn-g3-007-static-staging')));
  });
});
