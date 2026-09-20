import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { publicFixturePairs, verifyPublicFixtureParity } from './check-public-fixture-parity.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(file, 'utf8');

test('binds all sixteen package fixtures to the actual shipped Mobile artifacts', () => {
  assert.equal(publicFixturePairs.length, 16);
  assert.equal(new Set(publicFixturePairs.map((pair) => pair.client)).size, 16);
  assert.equal(verifyPublicFixtureParity(root), 16);
});

test('detects changed metadata in every shipped artifact and every package copy', () => {
  for (const pair of publicFixturePairs) {
    for (const key of ['client', 'fixture']) {
      const changedFile = path.resolve(root, pair[key]);
      const readChanged = (file) =>
        file === changedFile
          ? JSON.stringify({ ...JSON.parse(read(file)), unexpectedChange: true })
          : read(file);
      assert.throws(
        () => verifyPublicFixtureParity(root, readChanged),
        /content differs/,
        pair[key],
      );
    }
  }
});

test('fails on absent and malformed files on either side without filesystem mutation', () => {
  for (const key of ['client', 'fixture']) {
    const target = path.resolve(root, publicFixturePairs[0][key]);
    assert.throws(
      () =>
        verifyPublicFixtureParity(root, (file) => {
          if (file === target) throw new Error('ENOENT');
          return read(file);
        }),
      /missing or invalid JSON/,
    );
    assert.throws(
      () => verifyPublicFixtureParity(root, (file) => (file === target ? '{' : read(file))),
      /missing or invalid JSON/,
    );
  }
});

test('ignores JSON object key order and whitespace, while retaining values and array order', () => {
  assert.equal(
    verifyPublicFixtureParity(root, (file) => {
      const parsed = JSON.parse(read(file));
      return JSON.stringify(Object.fromEntries(Object.entries(parsed).reverse()), null, 4);
    }),
    16,
  );
});
