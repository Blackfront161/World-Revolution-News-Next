import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const setupUrl = new URL('./global-setup.ts', import.meta.url);

test('keeps publisher and offline-shell builder outside Playwright transformation', async () => {
  const source = await readFile(setupUrl, 'utf8');

  assert.doesNotMatch(source, /pathToFileURL/u);
  assert.doesNotMatch(source, /await\s+import\s*\(/u);
  assert.match(
    source,
    /promisify\(execFile\)\(process\.execPath, \[path\.resolve\(websiteRoot, buildTool\), 'dist'\]/u,
  );
  assert.match(
    source,
    /promisify\(execFile\)\(\s*process\.execPath,\s*\[path\.resolve\(websiteRoot, buildTool\), fixtureOutput\]/u,
  );
  assert.deepEqual(
    [
      ...source.matchAll(
        /'tools\/(?:integrate-(?:production-article|static-article)-landings|build-offline-shell)\.mjs'/gu,
      ),
    ].map(([name]) => name),
    [
      "'tools/integrate-production-article-landings.mjs'",
      "'tools/build-offline-shell.mjs'",
      "'tools/integrate-static-article-landings.mjs'",
      "'tools/build-offline-shell.mjs'",
    ],
    'both publishers must finish before their corresponding workers are built',
  );
});
