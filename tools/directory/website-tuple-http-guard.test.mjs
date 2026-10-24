import test from 'node:test';
import assert from 'node:assert/strict';
import { createWebsiteTupleHttpGuard } from './website-tuple-http-guard.mjs';
const current = 'https://solinaridao.com/wrn-website-content/current.json';
const snapshot =
  'https://solinaridao.com/wrn-website-content/snapshots/website-202610241500-' +
  'a'.repeat(64) +
  '.json';
const csp =
  "default-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; worker-src 'self'; script-src 'self' 'sha256-" +
  'A'.repeat(43) +
  "='";
const headers = {
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'cross-origin',
  'strict-transport-security': 'max-age=31536000',
  'access-control-allow-origin': '*',
  'content-security-policy': csp,
};
const response = (url, changes = {}) =>
  new Response('{}', {
    headers: {
      ...headers,
      'cache-control': String(url) === current ? 'no-store' : 'public, max-age=31536000, immutable',
      ...changes,
    },
  });
test('binds pointer then immutable snapshot to the same current hosting policy without credentials', async () => {
  const calls = [];
  const guard = createWebsiteTupleHttpGuard(async (url, options) => {
    calls.push(options);
    return response(url);
  });
  await guard.fetch(current);
  await guard.fetch(snapshot);
  await guard.fetch(current);
  assert.equal(guard.receipt().checked, 3);
  assert.match(guard.receipt().cspSha256, /^[a-f0-9]{64}$/);
  assert.ok(
    calls.every(
      (o) =>
        o.credentials === 'omit' &&
        o.redirect === 'error' &&
        o.referrerPolicy === 'no-referrer' &&
        o.cache === 'no-store',
    ),
  );
});
test('rejects snapshot before seed pointer, credentials, queries and every other host/path', async () => {
  let calls = 0;
  const guard = createWebsiteTupleHttpGuard(async (url) => {
    calls++;
    return response(url);
  });
  await assert.rejects(guard.fetch(snapshot), /pointer-first/);
  for (const url of [
    current + '?fresh=1',
    current + '#x',
    current.replace('solinaridao.com', 'other.example'),
    current.replace('current.json', 'current.1.tmp'),
    current.replace('wrn-website-content', 'wrn-production-content'),
  ])
    await assert.rejects(guard.fetch(url), /path/);
  await assert.rejects(guard.fetch(current, { headers: { authorization: 'test' } }), /credentials/);
  assert.equal(calls, 0);
});
for (const name of [...Object.keys(headers), 'cache-control'])
  test('fails closed before use for a changed ' + name, async () => {
    const guard = createWebsiteTupleHttpGuard(async (url) => response(url, { [name]: 'changed' }));
    await assert.rejects(guard.fetch(current), /tuple-http/);
    assert.equal(guard.receipt().checked, 0);
  });
test('rejects a changed but individually valid policy before activating any new pointer', async () => {
  const guard = createWebsiteTupleHttpGuard(async (url) =>
    response(url, {
      'content-security-policy':
        String(url) === current ? csp : csp + '; upgrade-insecure-requests',
    }),
  );
  await guard.fetch(current);
  await assert.rejects(guard.fetch(snapshot), /csp-changed/);
  assert.equal(guard.receipt().checked, 1);
});
for (const policy of [
  csp + '; object-src https:',
  csp.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'"),
  csp.replace("frame-ancestors 'none'", 'frame-ancestors *'),
])
  test('rejects weakened or duplicate CSP directives', async () => {
    const guard = createWebsiteTupleHttpGuard(async (url) =>
      response(url, { 'content-security-policy': policy }),
    );
    await assert.rejects(guard.fetch(current), /tuple-http-csp/);
  });
