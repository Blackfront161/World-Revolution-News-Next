import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { prepareAndroidRelease } from './prepare-android-release.mjs';

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' });
}

async function file(root, relative, body = '') {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wrn-android-release-test-'));
  await Promise.all([
    file(root, 'apps/mobile/dist/index.html', '<main>bound current dist</main>'),
    file(root, 'apps/mobile/dist/assets/app.js', 'console.log("bound");'),
    file(root, 'apps/mobile/public/static.txt', 'public source'),
    file(root, 'apps/mobile/package.json', '{"name":"fixture"}\n'),
    file(root, 'apps/mobile/capacitor.config.ts', 'export default {};\n'),
    file(root, 'pnpm-lock.yaml', 'lockfileVersion: 9\n'),
    file(root, 'apps/mobile/android/app/build.gradle', 'android {}\n'),
    file(root, 'apps/mobile/android/capacitor.settings.gradle', 'include \'fixture\'\n'),
    file(root, 'apps/mobile/android/app/src/main/assets/capacitor.config.json', '{}\n'),
    file(root, 'apps/mobile/android/app/src/main/assets/capacitor.plugins.json', '[]\n'),
    file(root, 'apps/mobile/android/app/src/main/assets/public/cordova.js', 'cordova\n'),
    file(root, 'apps/mobile/android/app/src/main/assets/public/cordova_plugins.js', 'plugins\n'),
    file(root, 'package.json', '{"private":true}\n'),
    file(root, 'tools/browser-content-aliases.mjs', 'export {};\n'),
    file(root, 'tools/prepare-android-release.mjs', 'export {};\n'),
  ]);
  git(root, ['init', '-q']);
  git(root, ['add', '.']);
  git(root, ['-c', 'user.name=WRN Test', '-c', 'user.email=wrn-test@example.invalid', 'commit', '-qm', 'fixture']);
  return root;
}

test('prepares a fresh hash-bound unsigned bundle stage without invoking Gradle', async () => {
  const root = await fixture();
  const prepared = await prepareAndroidRelease({
    workspaceRoot: root,
    now: () => new Date('2026-09-20T12:00:00.000Z'),
  });
  assert.equal(prepared.receipt.dirty.rejected, false);
  assert.equal(prepared.receipt.signing, false);
  assert.equal(prepared.receipt.upload, false);
  assert.equal(prepared.receipt.executesGradle, false);
  assert.equal(prepared.receipt.distProvenance.status, 'unverified');
  assert.ok(prepared.receipt.sourcePaths.includes('apps/mobile/android'));
  assert.ok(prepared.receipt.sourcePaths.includes('apps/mobile/public'));
  assert.ok(prepared.receipt.sourcePaths.includes('tools/prepare-android-release.mjs'));
  assert.match(prepared.receipt.sourceCommit, /^[a-f0-9]{40}$/);
  assert.equal(await readFile(path.join(prepared.output, 'native-assets/public/index.html'), 'utf8'), '<main>bound current dist</main>');
  assert.equal(await readFile(path.join(prepared.output, 'native-assets/public/cordova.js'), 'utf8'), 'cordova\n');
  const init = await readFile(path.join(prepared.output, 'unsigned-bundle.init.gradle'), 'utf8');
  assert.match(init, /Release signing configuration must remain unset/);
  assert.match(init, /writereleasesigningconfigversions/);
  assert.match(init, /Task outside unsigned release bundle scope/);
  assert.match(init, /Only :app:bundleRelease is permitted/);
  assert.match(init, /unsignedBundleSigningTask = ':app:signReleaseBundle'/);
  assert.match(init, /task\.path == unsignedBundleSigningTask/);
  assert.match(init, /wrn\.receipt/);
  const receiptBytes = await readFile(path.join(prepared.output, 'receipt.json'));
  const receiptHash = createHash('sha256').update(receiptBytes).digest('hex');
  assert.match(init, new RegExp(receiptHash));
  const expectedReceiptPath = path.join(prepared.output, 'receipt.json').replaceAll('\\', '\\\\');
  assert.ok(init.includes(expectedReceiptPath));
  const changedReceiptHash = createHash('sha256')
    .update(Buffer.concat([receiptBytes, Buffer.from(' ')]))
    .digest('hex');
  assert.doesNotMatch(init, new RegExp(changedReceiptHash));
  assert.match(init, /Bound release receipt does not match the prepared snapshot/);
  assert.match(init, /Stage assets differ from the receipt manifest/);
  assert.match(prepared.receipt.laterGradleCommand, /:app:bundleRelease/);
  assert.deepEqual((await readdir(prepared.output)).sort(), ['native-assets', 'native-assets.json', 'receipt.json', 'unsigned-bundle.init.gradle']);
});

test('records and rejects dirty tracked Android inputs before staging assets', async () => {
  const root = await fixture();
  await file(root, 'apps/mobile/android/app/build.gradle', 'android { dirty true }\n');
  await assert.rejects(() => prepareAndroidRelease({ workspaceRoot: root }), /tracked Android source is dirty/);
  const work = await readdir(path.join(root, 'work'));
  assert.equal(work.length, 1);
  const receipt = JSON.parse(await readFile(path.join(root, 'work', work[0], 'receipt.json'), 'utf8'));
  assert.equal(receipt.dirty.rejected, true);
  assert.ok(receipt.dirty.entries.some((entry) => entry.includes('apps/mobile/android/app/build.gradle')));
  await assert.rejects(() => readdir(path.join(root, 'work', work[0], 'native-assets')));
});

test('rejects a symlink in the current dist before copying it into the stage', async (t) => {
  const root = await fixture();
  const target = path.join(root, 'apps/mobile/dist/assets/target.js');
  await file(root, 'apps/mobile/dist/assets/target.js', 'target');
  try {
    await symlink(target, path.join(root, 'apps/mobile/dist/assets/linked.js'));
  } catch (error) {
    t.skip(`symlink creation unavailable: ${error instanceof Error ? error.code : 'unknown'}`);
    return;
  }
  await assert.rejects(() => prepareAndroidRelease({ workspaceRoot: root }), /link or junction|non-regular file/);
});

test('rejects public and tool mutations that would make the staged dist stale', async () => {
  for (const [relative, changed] of [
    ['apps/mobile/public/static.txt', 'changed public source'],
    ['tools/prepare-android-release.mjs', 'changed preparation tool'],
  ]) {
    const root = await fixture();
    await file(root, relative, changed);
    await assert.rejects(() => prepareAndroidRelease({ workspaceRoot: root }), /tracked Android source is dirty/);
    const [output] = await readdir(path.join(root, 'work'));
    const receipt = JSON.parse(await readFile(path.join(root, 'work', output, 'receipt.json'), 'utf8'));
    assert.ok(receipt.dirty.entries.some((entry) => entry.includes(relative)));
  }
});

test('requires the web entry before any native bridge file can make a stage appear non-empty', async () => {
  const root = await fixture();
  await writeFile(path.join(root, 'apps/mobile/dist/index.html'), '');
  await assert.rejects(() => prepareAndroidRelease({ workspaceRoot: root }), /public\/index\.html/);
});
