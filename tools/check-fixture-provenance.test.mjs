import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { verifyFixtureProvenance } from './check-fixture-provenance.mjs';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureDirectory = path.join(workspaceRoot, 'packages/test-support/fixtures/wrn-g3-002');
const manifestPath = path.join(fixtureDirectory, 'manifest.json');

async function withTemporaryFixture(callback) {
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'wrn-fixture-provenance-'));
  try {
    cpSync(fixtureDirectory, temporaryDirectory, { recursive: true });
    return await callback(temporaryDirectory);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

test('accepts the current manifest and the exact committed static seed', async () => {
  const result = await verifyFixtureProvenance({ workspaceRoot, manifestPath, fixtureDirectory });

  assert.equal(result.sourceCommit, '675cd13c0863ade6a72d631e27283a29810eef10');
  assert.equal(result.revision, 'wrn-g3-002-local-fixture-v1-675cd13c0863');
});

test('fails closed when the manifest references an unavailable older or wrong commit', async () => {
  await withTemporaryFixture(async (temporaryDirectory) => {
    const temporaryManifestPath = path.join(temporaryDirectory, 'manifest.json');
    const manifest = JSON.parse(readFileSync(temporaryManifestPath, 'utf8'));
    manifest.sourceCommit = '0000000000000000000000000000000000000000';
    manifest.provenance.fixtureSeedCommit = manifest.sourceCommit;
    writeFileSync(temporaryManifestPath, JSON.stringify(manifest), 'utf8');

    return assert.rejects(
      verifyFixtureProvenance({
        workspaceRoot,
        manifestPath: temporaryManifestPath,
        fixtureDirectory: temporaryDirectory,
      }),
      /Git-Pruefung fehlgeschlagen fuer Seed-Commit/,
    );
  });
});

test('fails closed when the current static payload drifts from the committed seed', async () => {
  await withTemporaryFixture(async (temporaryDirectory) => {
    const articlesPath = path.join(temporaryDirectory, 'articles.json');
    const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));
    articles.articles[0].title = 'Lokale Driftprobe';
    writeFileSync(articlesPath, JSON.stringify(articles), 'utf8');

    return assert.rejects(
      verifyFixtureProvenance({
        workspaceRoot,
        manifestPath,
        fixtureDirectory: temporaryDirectory,
      }),
      /Abweichung bei articles Seeddrift/,
    );
  });
});
