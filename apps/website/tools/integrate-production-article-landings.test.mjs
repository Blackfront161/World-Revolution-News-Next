import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import path from 'node:path';
import test from 'node:test';

import { buildWebsiteProductionContentRelease } from './production-content-release.mjs';
import { integrateProductionArticleLandings } from './integrate-production-article-landings.mjs';

const execFile = promisify(execFileCallback);
const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(toolsDirectory, '../../..');
const sourceRoot = path.join(
  workspaceRoot,
  'docs/evidence/WRN-PRODUCTION-ARTICLE-PILOT-2026-09-10/generated-core-e8506a4',
);

async function createCaseRoot(prefix) {
  const testResults = path.join(workspaceRoot, 'test-results');
  await mkdir(testResults, { recursive: true });
  return mkdtemp(path.join(testResults, prefix));
}

test('promotion preserves a fresh build on injected failure and retains staging evidence', async () => {
  const root = await createCaseRoot('wrn-stage-c-integration-');
  const releaseRoot = path.join(root, 'release');
  await buildWebsiteProductionContentRelease({
    outputDirectory: releaseRoot,
    sourceRoot,
    trustedWorkspaceRoot: root,
    generatedAt: '2026-09-10T06:51:40.000Z',
  });
  const output = path.join(root, 'dist');
  await mkdir(output);
  await writeFile(path.join(output, 'index.html'), 'caller bytes');
  let moves = 0;
  await assert.rejects(
    integrateProductionArticleLandings({
      outputDirectory: output,
      releaseRoot,
      move: async (from, to) => {
        moves += 1;
        if (moves === 3) throw new Error('injected');
        await rename(from, to);
      },
    }),
    /injected/,
  );
  assert.equal(await readFile(path.join(output, 'index.html'), 'utf8'), 'caller bytes');
  assert.deepEqual(await readdir(output), ['.wrn-stage-c-publication-staging', 'index.html']);
  assert.ok(moves >= 5);
});

test('refuses pre-existing artifact bytes before publishing', async () => {
  const root = await createCaseRoot('wrn-stage-c-existing-');
  const output = path.join(root, 'dist');
  await mkdir(output);
  await writeFile(path.join(output, 'robots.txt'), 'caller-owned');
  await assert.rejects(
    integrateProductionArticleLandings({ outputDirectory: output }),
    /bereits robots\.txt/,
  );
  assert.equal(await readFile(path.join(output, 'robots.txt'), 'utf8'), 'caller-owned');
});

test('CLI integrates into a supplied fresh build and reports its landing count', async () => {
  const root = await createCaseRoot('wrn-stage-c-cli-');
  const output = path.join(root, 'dist');
  await mkdir(output);
  const result = await execFile(process.execPath, [
    path.join(toolsDirectory, 'integrate-production-article-landings.mjs'),
    output,
  ]);
  assert.match(result.stdout, /9 production article landings integrated/);
  assert.equal((await readdir(path.join(output, 'articles'))).length, 9);
  assert.deepEqual((await readdir(output)).sort(), [
    '.wrn-stage-c-publication-staging',
    'article-publication-manifest.json',
    'articles',
    'robots.txt',
    'sitemap.xml',
  ]);
});

test('CLI reports an argument failure with a nonzero exit status', async () => {
  await assert.rejects(
    execFile(process.execPath, [
      path.join(toolsDirectory, 'integrate-production-article-landings.mjs'),
    ]),
    (error) => {
      assert.notEqual(error.code, 0);
      assert.match(error.stderr, /outputDirectory fehlt/);
      return true;
    },
  );
});
