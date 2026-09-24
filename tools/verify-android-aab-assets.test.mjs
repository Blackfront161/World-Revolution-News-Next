import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('AAB verifier rejects a same-count manifest that differs from receipt assets', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'wrn-aab-verifier-'));
  const stage = path.join(root, 'native-assets');
  await mkdir(stage);
  const original = Buffer.from('receipt-bound');
  const changed = Buffer.from('manifest-bound');
  await writeFile(path.join(stage, 'asset.txt'), changed);
  const receipt = {
    schema: 'wrn.android-release-preparation.v1',
    sourceCommit: 'a'.repeat(40),
    dirty: { rejected: false, entries: [] },
    assetsDirectory: 'native-assets',
    assets: [{ path: 'asset.txt', bytes: original.length, sha256: sha256(original) }],
  };
  const manifest = [{ path: 'asset.txt', bytes: changed.length, sha256: sha256(changed) }];
  const receiptPath = path.join(root, 'receipt.json');
  await writeFile(receiptPath, JSON.stringify(receipt));
  await writeFile(path.join(root, 'native-assets.json'), JSON.stringify(manifest));
  const aabPath = path.join(root, 'candidate.aab');
  await writeFile(aabPath, 'not-needed');
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
  const result = spawnSync(
    shell,
    [
      '-NoLogo',
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      path.resolve('tools/verify-android-aab-assets.ps1'),
      '-StageDirectory',
      stage,
      '-ReceiptPath',
      receiptPath,
      '-AabPath',
      aabPath,
    ],
    { encoding: 'utf8' },
  );
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /not bound to receipt/u);
});
