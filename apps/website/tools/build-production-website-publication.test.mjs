import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

import { buildWebsiteProductionContentRelease } from './build-production-website-publication.mjs';

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(toolsDirectory, '../../..');
const sourceRoot = path.join(
  workspaceRoot,
  'docs/evidence/WRN-PRODUCTION-ARTICLE-PILOT-2026-09-10/generated-core-e8506a4',
);

async function createCaseRoot() {
  const testResults = path.join(workspaceRoot, 'test-results');
  await mkdir(testResults, { recursive: true });
  return mkdtemp(path.join(testResults, 'wrn-stage-c-builder-'));
}

test('builder creates an absent nested target inside its trusted workspace', async () => {
  const root = await createCaseRoot();
  const output = path.join(root, 'new', 'nested', 'release');
  await buildWebsiteProductionContentRelease({
    outputDirectory: output,
    sourceRoot,
    trustedWorkspaceRoot: root,
    generatedAt: '2026-09-10T06:51:40.000Z',
  });
  assert.deepEqual((await readdir(output)).sort(), [
    'current.json',
    'wrn-production-eff-2026-09-10-v1',
  ]);
});
