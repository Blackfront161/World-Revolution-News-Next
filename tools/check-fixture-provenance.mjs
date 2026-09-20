import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  canonicalJson,
  isLocalManifestV1,
  sha256Utf8,
  utf8ByteLength,
} from '../packages/content-contracts/src/index.ts';

const fixtureRelativeDirectory = 'packages/test-support/fixtures/wrn-g3-002';
const seedResourcePaths = Object.freeze({
  articles: `${fixtureRelativeDirectory}/articles.json`,
  'supplemental-items': `${fixtureRelativeDirectory}/supplemental-items.json`,
});

function fail(message) {
  throw new Error(`Fixture-Provenienz fehlgeschlagen: ${message}`);
}

function readJsonFile(filePath, label) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    fail(`ungueltiges oder fehlendes JSON fuer ${label}`);
  }
}

function gitOutput(workspaceRoot, args, label) {
  try {
    return execFileSync('git', args, {
      cwd: workspaceRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    fail(`Git-Pruefung fehlgeschlagen fuer ${label}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(`Abweichung bei ${label}`);
  }
}

function assertStringArray(value, label) {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
    fail(`ungueltige ID-Menge fuer ${label}`);
  }
  return value;
}

function getPresentResource(manifest, id) {
  const resource = manifest.resources.find((candidate) => candidate.id === id);
  if (resource === undefined || resource.availability === 'optional-absent') {
    fail(`fehlende vorhandene Ressource ${id}`);
  }
  return resource;
}

function parseSeedJson(workspaceRoot, sourceCommit, relativePath) {
  const source = gitOutput(
    workspaceRoot,
    ['show', `${sourceCommit}:${relativePath}`],
    `Seedpfad ${relativePath}`,
  );
  try {
    return JSON.parse(source);
  } catch {
    fail(`Seedpfad enthaelt ungueltiges JSON: ${relativePath}`);
  }
}

async function assertResource(manifest, id, payload, expectedRecordCount) {
  const resource = getPresentResource(manifest, id);
  const canonical = canonicalJson(payload);
  assertEqual(await sha256Utf8(canonical), resource.sha256, `${id} Hash`);
  assertEqual(utf8ByteLength(canonical), resource.bytes, `${id} Bytezahl`);
  assertEqual(expectedRecordCount, resource.recordCount, `${id} Recordzahl`);
}

/**
 * Prueft lokal, dass persistiertes Manifest, aktueller Arbeitsbaum und der
 * explizite Seed-Commit dieselben zwei oeffentlichen Fixture-JSONs meinen.
 */
export async function verifyFixtureProvenance({
  workspaceRoot,
  manifestPath = path.join(workspaceRoot, fixtureRelativeDirectory, 'manifest.json'),
  fixtureDirectory = path.join(workspaceRoot, fixtureRelativeDirectory),
} = {}) {
  if (typeof workspaceRoot !== 'string' || workspaceRoot.length === 0) {
    fail('workspaceRoot fehlt');
  }

  const manifest = readJsonFile(manifestPath, 'Manifest');
  if (!isLocalManifestV1(manifest)) {
    fail('Manifest verletzt die lokale Manifest-v1-Struktur');
  }

  gitOutput(workspaceRoot, ['cat-file', '-e', `${manifest.sourceCommit}^{commit}`], 'Seed-Commit');

  const currentArticles = readJsonFile(
    path.join(fixtureDirectory, 'articles.json'),
    'aktuelles articles.json',
  );
  const currentSupplementalItems = readJsonFile(
    path.join(fixtureDirectory, 'supplemental-items.json'),
    'aktuelles supplemental-items.json',
  );
  const seedArticles = parseSeedJson(
    workspaceRoot,
    manifest.sourceCommit,
    seedResourcePaths.articles,
  );
  const seedSupplementalItems = parseSeedJson(
    workspaceRoot,
    manifest.sourceCommit,
    seedResourcePaths['supplemental-items'],
  );

  assertEqual(canonicalJson(currentArticles), canonicalJson(seedArticles), 'articles Seeddrift');
  assertEqual(
    canonicalJson(currentSupplementalItems),
    canonicalJson(seedSupplementalItems),
    'supplemental-items Seeddrift',
  );

  if (!Array.isArray(seedArticles.articles)) {
    fail('Seed articles.json enthaelt keine Artikelliste');
  }
  if (!Array.isArray(seedSupplementalItems.items)) {
    fail('Seed supplemental-items.json enthaelt keine Itemliste');
  }

  await assertResource(manifest, 'articles', seedArticles, seedArticles.articles.length);
  await assertResource(
    manifest,
    'supplemental-items',
    seedSupplementalItems,
    seedSupplementalItems.items.length,
  );

  const articleIds = [...seedArticles.articles.map((article) => article?.id)].sort();
  if (!articleIds.every((id) => typeof id === 'string')) {
    fail('Seed articles.json enthaelt eine ungueltige Artikel-ID');
  }
  const expectedIds = articleIds;
  const activeIds = assertStringArray(manifest.articleSets.activeFeedIds, 'activeFeedIds');
  const archiveIds = assertStringArray(manifest.articleSets.archiveIds, 'archiveIds');
  assertEqual(canonicalJson(activeIds), canonicalJson(expectedIds), 'activeFeedIds');
  assertEqual(canonicalJson(archiveIds), canonicalJson(expectedIds), 'archiveIds');

  for (const [setName, ids] of Object.entries(manifest.articleSets)) {
    const actualHash = await sha256Utf8(canonicalJson(ids));
    assertEqual(actualHash, manifest.articleSetHashes[setName], `${setName} Mengenhash`);
  }

  return Object.freeze({
    revision: manifest.revision,
    sourceCommit: manifest.sourceCommit,
  });
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
const thisFile = fileURLToPath(import.meta.url);

if (invokedPath === thisFile) {
  const workspaceRoot = path.resolve(path.dirname(thisFile), '..');
  const result = await verifyFixtureProvenance({ workspaceRoot });
  process.stdout.write(
    `Fixture-Provenienz: bestanden (${result.revision}, ${result.sourceCommit})\n`,
  );
}
