import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const base = new URL('./app-home-semantic/', import.meta.url);
const approved = JSON.parse(await fs.readFile(new URL('approved.json', base)));
const root = new URL(approved.semanticRevision + '/', base);
const bindingBytes = await fs.readFile(new URL('binding.json', root));
assert.equal(sha(bindingBytes), approved.bindingSha256);
const binding = JSON.parse(bindingBytes);
const fixture = JSON.parse(await fs.readFile(new URL('fixtures.json', root)));
const sportBytes = await fs.readFile(new URL('news-app-2-sport.js', root));
assert.equal(sha(sportBytes), binding.files['news-app-2-sport.js'].sha256);
const context = { module: { exports: {} } };
vm.runInNewContext(sportBytes.toString(), context, { timeout: 1500 });
const sport = context.module.exports;
test('the App handoff keeps exact negative, fan, sport and editorial override fixtures', () => {
  for (const title of fixture.negative) {
    assert.equal(sport.section({ title }), '', title);
    assert.equal(sport.section({ title: 'History', categories: [title] }), '', title + ' tag');
  }
  for (const title of fixture.fan) assert.equal(sport.section({ title }), 'fan-culture', title);
  for (const title of fixture.sport) assert.equal(sport.section({ title }), 'sport', title);
  assert.equal(sport.section({ title: fixture.negative[0], sportSection: 'sport' }), 'sport');
  assert.equal(
    sport.section({ title: fixture.negative[0], sportSection: 'fan-culture' }),
    'fan-culture',
  );
});
test('historical App source and new manifest successor remain honestly distinct', async () => {
  assert.equal(binding.sourceCommitClaim, null);
  assert.equal(binding.historicalAppCommit, '7dd4e9e428cae4ae5c25caa98402df901f861981');
  assert.notEqual(approved.semanticRevision, approved.appCommit);
  assert.equal(sha(await fs.readFile(new URL('HANDOFF.json', root))), binding.sourceManifestSha256);
  for (const [name, row] of Object.entries(binding.files)) {
    const b = await fs.readFile(new URL(name, root));
    assert.equal(b.length, row.bytes, name);
    assert.equal(sha(b), row.sha256, name);
  }
});
