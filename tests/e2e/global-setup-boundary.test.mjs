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
  assert.match(source, /tools\/integrate-static-article-landings\.mjs/u);
  assert.match(source, /tools\/build-offline-shell\.mjs/u);
  assert.ok(
    source.indexOf('tools/integrate-static-article-landings.mjs') <
      source.indexOf('tools/build-offline-shell.mjs'),
    'publisher must finish before the worker is built',
  );
});
