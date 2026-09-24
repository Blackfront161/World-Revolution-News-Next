import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { canonicalJson } from '../packages/content-contracts/src/index.ts';
import { prepareLegacyNewsSupply } from './prepare-legacy-news-supply.mjs';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.join(workspace, 'docs/evidence/WRN-LEGACY-NEWS-UPDATE-2026-09-14');
const previous = path.join(
  workspace,
  'docs/evidence/WRN-NEWS-SIX-ARTICLE-INPUT-2026-09-11/candidate-1789065672080/production-build-input-v3.json',
);
const reviewed = path.join(evidence, 'candidate/reviewed-batch.json');
const previousLedger = path.join(evidence, 'delivery-ledgers/v3.json');
const commit = 'a'.repeat(40);
const observedAt = Date.parse('2026-09-14T00:00:00.000Z');
const generatedAt = '2026-09-14T00:00:00.000Z';
const hash = (value) => createHash('sha256').update(value).digest('hex');
const tool = path.join(workspace, 'tools/prepare-legacy-news-supply.mjs');

async function fresh(label) {
  await mkdir(path.join(workspace, 'test-results'), { recursive: true });
  const root = path.join(workspace, 'test-results', `${label}-${randomUUID()}`);
  await mkdir(root);
  return root;
}

async function writeFixture(root) {
  const batch = JSON.parse(await readFile(reviewed, 'utf8'));
  const article = batch.documents.articles.articles[0];
  const sourceRow = {
    link: article.originalUrl,
    title: article.title,
    quelleName: 'C4SS',
    pubDate: article.publishedAt,
    content: 'Review-bound test transport body.',
    contentComplete: true,
  };
  const feedBytes = Buffer.from(JSON.stringify([sourceRow]));
  const status = {
    ok: true,
    news: { feedCount: 1, bytes: feedBytes.byteLength },
    publication: { pending: false },
    lastSuccessfulFetchAt: '2026-09-13T23:59:00.000Z',
    lastPublishedAt: '2026-09-13T23:59:01.000Z',
  };
  const bindings = [
    {
      articleId: article.id,
      sourceName: 'C4SS',
      upstreamRecordSha256: hash(canonicalJson(sourceRow)),
      reviewedArticleSha256: hash(canonicalJson(article)),
    },
  ];
  const files = {
    previous: path.join(root, 'previous.json'),
    reviewed: path.join(root, 'reviewed.json'),
    bindings: path.join(root, 'bindings.json'),
    feed: path.join(root, 'news-feed.json'),
    status: path.join(root, 'feed-status.json'),
    ledger: path.join(root, 'ledger.json'),
  };
  await Promise.all([
    writeFile(files.previous, await readFile(previous)),
    writeFile(files.reviewed, JSON.stringify(batch)),
    writeFile(files.bindings, JSON.stringify(bindings)),
    writeFile(files.feed, feedBytes),
    writeFile(files.status, JSON.stringify(status)),
    writeFile(files.ledger, await readFile(previousLedger)),
  ]);
  return { files, bindings };
}

function junction(link, target) {
  return spawnSync('cmd.exe', ['/d', '/c', 'mklink', '/J', link, target], {
    encoding: 'utf8',
  });
}

function request(root, files) {
  return {
    previousInputPath: files.previous,
    reviewedBatchPath: files.reviewed,
    bindingsPath: files.bindings,
    feedPath: files.feed,
    statusPath: files.status,
    commit,
    observedAt,
    generatedAt,
    previousLedgerPath: files.ledger,
    outputDirectory: path.join(root, 'run'),
    trustedWorkspaceRoot: workspace,
  };
}

test('prepares a review-bound V3 append, publisher, delivery chain, and portable receipt', async (t) => {
  const root = await fresh('legacy-supply-positive');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { files } = await writeFixture(root);
  const previousInputSha256 = hash(
    canonicalJson(JSON.parse(await readFile(files.previous, 'utf8'))),
  );
  const result = await prepareLegacyNewsSupply({
    ...request(root, files),
    previousInputSha256,
    dryRun: true,
  });
  const receipt = JSON.parse(await readFile(path.join(root, 'run', 'receipt.json'), 'utf8'));
  assert.equal(result.publisher.sequence, 4);
  assert.equal(receipt.schema, 'wrn.legacy-news-supply-receipt.v1');
  assert.equal(receipt.publicationPerformed, false);
  assert.equal(receipt.dryRun, true);
  assert.equal(receipt.release.articleCount, 7);
  assert.equal(receipt.delivery.pointerLast, true);
  assert.equal(receipt.intake.commit, commit);
  assert.equal(receipt.previousInputSha256, previousInputSha256);
  assert.deepEqual((await readdir(path.join(root, 'run'))).sort(), [
    'delivery',
    'merged-input.json',
    'publisher',
    'receipt.json',
  ]);
  assert.equal(
    existsSync(
      path.join(root, 'run', 'publisher', receipt.release.releaseRevision, 'manifest.json'),
    ),
    true,
  );
  assert.equal(
    existsSync(path.join(root, 'run', 'delivery', 'activate/wrn-production-content/current.json')),
    true,
  );
});

test('fails before writes for a changed review binding and never promotes an output', async (t) => {
  const root = await fresh('legacy-supply-binding');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { files, bindings } = await writeFixture(root);
  bindings[0].upstreamRecordSha256 = '0'.repeat(64);
  await writeFile(files.bindings, JSON.stringify(bindings));
  const previousInputSha256 = hash(
    canonicalJson(JSON.parse(await readFile(files.previous, 'utf8'))),
  );
  await assert.rejects(
    prepareLegacyNewsSupply({ ...request(root, files), previousInputSha256 }),
    /changed or conflicting/,
  );
  assert.equal(existsSync(path.join(root, 'run')), false);
});

test('records upstream degradation in the receipt without blocking an independently reviewed append', async (t) => {
  const root = await fresh('legacy-supply-upstream-warning');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { files } = await writeFixture(root);
  const status = JSON.parse(await readFile(files.status, 'utf8'));
  status.aggregation = {
    mode: 'enrich',
    stoppedForBudget: true,
    sourcesConfigured: 4,
    sourcesEligible: 4,
    sourcesAttempted: 3,
    sourcesWithEntries: 2,
  };
  await writeFile(files.status, JSON.stringify(status));
  const previousInputSha256 = hash(
    canonicalJson(JSON.parse(await readFile(files.previous, 'utf8'))),
  );
  await prepareLegacyNewsSupply({ ...request(root, files), previousInputSha256 });
  const receipt = JSON.parse(await readFile(path.join(root, 'run', 'receipt.json'), 'utf8'));
  assert.equal(receipt.intake.upstreamStoppedForBudget, true);
  assert.equal(receipt.intake.upstreamWarnings.length, 1);
  assert.equal(receipt.intake.upstreamWarnings[0].code, 'aggregation-budget-exhausted');
  assert.equal(receipt.intake.upstreamWarnings[0].stage, 'enrich');
});

test('rejects a run receipt time that predates its local intake observation', async (t) => {
  const root = await fresh('legacy-supply-time');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { files } = await writeFixture(root);
  const previousInputSha256 = hash(
    canonicalJson(JSON.parse(await readFile(files.previous, 'utf8'))),
  );
  await assert.rejects(
    prepareLegacyNewsSupply({
      ...request(root, files),
      previousInputSha256,
      generatedAt: '2026-09-13T23:59:59.999Z',
    }),
    /generatedAt liegt vor observedAt/,
  );
  assert.equal(existsSync(path.join(root, 'run')), false);
});

test('discards every staged artifact on V3 rejection and permits a clean retry', async (t) => {
  const root = await fresh('legacy-supply-v3-rejection');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { files } = await writeFixture(root);
  const batch = JSON.parse(await readFile(files.reviewed, 'utf8'));
  batch.documents.admission.entries[0].admittedContentSha256 = '0'.repeat(64);
  await writeFile(files.reviewed, JSON.stringify(batch));
  const previousInputSha256 = hash(
    canonicalJson(JSON.parse(await readFile(files.previous, 'utf8'))),
  );
  await assert.rejects(
    prepareLegacyNewsSupply({ ...request(root, files), previousInputSha256 }),
    /invalid admission package/,
  );
  assert.equal(existsSync(path.join(root, 'run')), false);
  const admitted = JSON.parse(await readFile(reviewed, 'utf8'));
  await writeFile(files.reviewed, JSON.stringify(admitted));
  const retried = await prepareLegacyNewsSupply({ ...request(root, files), previousInputSha256 });
  assert.equal(retried.outputDirectory, path.join(root, 'run'));
  assert.equal(existsSync(path.join(root, 'run', 'receipt.json')), true);
});

test('CLI requires all local bindings and reports a non-published prepared receipt', async (t) => {
  const root = await fresh('legacy-supply-cli');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { files } = await writeFixture(root);
  const previousInputSha256 = hash(
    canonicalJson(JSON.parse(await readFile(files.previous, 'utf8'))),
  );
  const output = path.join(root, 'run');
  const run = spawnSync(
    process.execPath,
    [
      tool,
      '--previous',
      files.previous,
      '--previous-sha256',
      previousInputSha256,
      '--reviewed',
      files.reviewed,
      '--bindings',
      files.bindings,
      '--feed',
      files.feed,
      '--status',
      files.status,
      '--commit',
      commit,
      '--observed-at',
      new Date(observedAt).toISOString(),
      '--generated-at',
      generatedAt,
      '--ledger',
      files.ledger,
      '--output',
      output,
      '--workspace',
      workspace,
    ],
    { encoding: 'utf8' },
  );
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(JSON.parse(run.stdout), {
    publicationPerformed: false,
    receipt: path.join(path.resolve(output), 'receipt.json'),
    releaseRevision: 'wrn-production-news-2026-09-14-v4',
    sequence: 4,
  });
  assert.equal(
    JSON.parse(await readFile(path.join(output, 'receipt.json'), 'utf8')).publicationPerformed,
    false,
  );
});

test('retains pre-existing file and directory targets byte-for-byte', async (t) => {
  const root = await fresh('legacy-supply-collision');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { files } = await writeFixture(root);
  const previousInputSha256 = hash(
    canonicalJson(JSON.parse(await readFile(files.previous, 'utf8'))),
  );
  const existingFile = path.join(root, 'existing-run');
  const existingBytes = Buffer.from('do not overwrite');
  await writeFile(existingFile, existingBytes);
  await assert.rejects(
    prepareLegacyNewsSupply({
      ...request(root, files),
      previousInputSha256,
      outputDirectory: existingFile,
    }),
    /Run-Bundle-Ausgabe existiert bereits/,
  );
  assert.deepEqual(await readFile(existingFile), existingBytes);

  const existingDirectory = path.join(root, 'existing-run-directory');
  await mkdir(existingDirectory);
  const marker = path.join(existingDirectory, 'marker');
  const markerBytes = Buffer.from('preserve this directory');
  await writeFile(marker, markerBytes);
  await assert.rejects(
    prepareLegacyNewsSupply({
      ...request(root, files),
      previousInputSha256,
      outputDirectory: existingDirectory,
    }),
    /Run-Bundle-Ausgabe existiert bereits/,
  );
  assert.deepEqual(await readFile(marker), markerBytes);
});

test('rejects an output target that collides with an input before any write', async (t) => {
  const root = await fresh('legacy-supply-overlap');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { files } = await writeFixture(root);
  const previousInputSha256 = hash(
    canonicalJson(JSON.parse(await readFile(files.previous, 'utf8'))),
  );
  const previousBytes = await readFile(files.previous);
  await assert.rejects(
    prepareLegacyNewsSupply({
      ...request(root, files),
      previousInputSha256,
      outputDirectory: files.previous,
    }),
    /Run-Bundle-Ausgabe existiert bereits/,
  );
  assert.deepEqual(await readFile(files.previous), previousBytes);
});

test('rejects a Windows junction ancestor without writing through it', async (t) => {
  const root = await fresh('legacy-supply-junction');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { files } = await writeFixture(root);
  const link = path.join(root, 'linked-workspace');
  const linked = junction(link, workspace);
  if (linked.status !== 0) {
    t.diagnostic(
      'Windows sandbox denied junction creation; ancestor rejection is covered by the shared guard.',
    );
    return;
  }
  const previousInputSha256 = hash(
    canonicalJson(JSON.parse(await readFile(files.previous, 'utf8'))),
  );
  await assert.rejects(
    prepareLegacyNewsSupply({
      ...request(root, files),
      previousInputSha256,
      outputDirectory: path.join(link, 'through-junction'),
    }),
    /Link oder Junction/,
  );
  assert.equal(existsSync(path.join(link, 'through-junction')), false);
});
