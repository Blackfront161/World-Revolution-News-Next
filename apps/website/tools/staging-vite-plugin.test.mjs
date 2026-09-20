import assert from 'node:assert/strict';
import test from 'node:test';

import { createStagingIsolationPlugin } from './staging-vite-plugin.mjs';

test('pins the browser origin before registration and uses a staging-owned worker', () => {
  const plugin = createStagingIsolationPlugin('https://preview.example.test');
  const source = `const p = createShellProtocol();
const workerPath = '/website-shell-sw.js';
  const supported =
    typeof window !== 'undefined' &&
    window.isSecureContext;
navigator.serviceWorker.register(workerPath);`;
  const transformed = plugin.transform(source, '/repo/src/offline-shell/browser-platform.ts');
  assert.match(transformed.code, /window\.location\.origin === "https:\/\/preview\.example\.test"/);
  assert.match(transformed.code, /website-staging-shell-sw\.js/);
  assert.ok(
    transformed.code.indexOf('window.location.origin ===') <
      transformed.code.indexOf('navigator.serviceWorker.register'),
  );
});

test('accepts the checked-in Windows CRLF source without weakening its markers', () => {
  const plugin = createStagingIsolationPlugin('https://preview.example.test');
  const source = [
    "const workerPath = '/website-shell-sw.js';",
    '  const supported =',
    "    typeof window !== 'undefined' &&",
    '    window.isSecureContext;',
  ].join('\r\n');
  const transformed = plugin.transform(source, 'C:\\repo\\src\\offline-shell\\browser-platform.ts');
  assert.match(transformed.code, /website-staging-shell-sw\.js/);
  assert.match(transformed.code, /window\.location\.origin/);
});

test('gives staging browser code a cache/protocol namespace disjoint from normal builds', () => {
  const plugin = createStagingIsolationPlugin('https://preview.example.test');
  const source = `const protocol = 'wrn.website-shell.v1';
const prefix = 'wrn.website-shell.v1.payload.';`;
  const transformed = plugin.transform(source, '/repo/src/offline-shell/protocol.mjs');
  assert.match(transformed.code, /wrn\.website-staging-shell\.v1/);
  assert.doesNotMatch(transformed.code, /wrn\.website-shell\.v1/);
});
