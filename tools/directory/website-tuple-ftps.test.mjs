import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createFtpsTransport } from './publish-live-content-directory.mjs';
const password = 'test-only-secret-not-an-account';
function harness({ readback = Buffer.from('{}'), tooLarge = false } = {}) {
  const calls = [];
  const spawnProcess = (name, args, options) => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stderr.setEncoding = () => {};
    child.kill = () => {
      child.killed = true;
    };
    child.stdin = {
      end: (config) => {
        calls.push({ name, args, options, config });
        queueMicrotask(() => {
          if (options.stdio[1] === 'pipe')
            child.stdout.emit('data', tooLarge ? Buffer.alloc(1048577) : readback);
          child.emit('close', child.killed ? null : 0);
        });
      },
    };
    return child;
  };
  const args = {
    host: 'srv2083.hstgr.io',
    ip: '82.198.229.55',
    user: 'u353704738.wrnnewsauto',
    password,
    remoteRoot: '/',
    profile: 'website-tuple',
    spawnProcess,
  };
  return { calls, transport: createFtpsTransport(args), args };
}
test('managed FTPS commands retain TLS verification, bound resolution and credentials only on stdin', async () => {
  const h = harness();
  await h.transport.listManaged('snapshots/');
  const call = h.calls[0];
  assert.equal(call.name, 'curl');
  assert.ok(call.args.includes('--ssl-reqd'));
  assert.ok(call.args.includes('--tlsv1.2'));
  assert.ok(call.args.includes('srv2083.hstgr.io:21:82.198.229.55'));
  assert.ok(call.args.includes('MLSD'));
  assert.ok(!call.args.some((x) => x.includes(password)));
  assert.ok(!call.args.includes('--insecure'));
  assert.match(call.config, /^user = /);
});
test('managed paths reject traversal, foreign files, state deletion and directory-profile use before network', async () => {
  const h = harness();
  for (const path of [
    '../index.html',
    'current.json',
    'snapshots/other.json',
    '.wrn-news-auto-state-v1.json',
  ])
    await assert.rejects(h.transport.removeManaged(path));
  await assert.rejects(h.transport.listManaged('../'));
  assert.equal(h.calls.length, 0);
  assert.equal(createFtpsTransport({ ...h.args, profile: 'directory' }).removeManaged, undefined);
});
test('MLSD capture is bounded and state replacement must pass exact FTP readback', async () => {
  await assert.rejects(
    harness({ tooLarge: true }).transport.listManaged('snapshots/'),
    /ftps-exit/,
  );
  const h = harness({ readback: Buffer.from('different') });
  await assert.rejects(h.transport.writeAutomationState(Buffer.from('{}')), /state-readback/);
  const rename = h.calls.find((c) => c.args.includes('RNTO .wrn-news-auto-state-v1.json'));
  assert.ok(rename);
  assert.ok(rename.args.includes('RNFR .wrn-news-auto-state-v1.tmp'));
});
