import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { canonicalJson } from '../packages/content-contracts/src/index.ts';
import { inspectLegacyNewsSnapshot } from './legacy-news-ingestion.mjs';
import { runLegacyNewsSupply } from './run-legacy-news-supply.mjs';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.join(workspace, 'docs/evidence/WRN-LEGACY-NEWS-UPDATE-2026-09-14');
const basePrevious = path.join(
  workspace,
  'docs/evidence/WRN-NEWS-SIX-ARTICLE-INPUT-2026-09-11/candidate-1789065672080/production-build-input-v3.json',
);
const reviewed = path.join(evidence, 'candidate/reviewed-batch.json');
const baseLedger = path.join(evidence, 'delivery-ledgers/v3.json');
const commit = 'b'.repeat(40);
const observedAt = Date.parse('2026-09-14T00:00:00.000Z');
const generatedAt = '2026-09-14T00:00:01.000Z';
const hash = (value) => createHash('sha256').update(value).digest('hex');

async function fresh(label) {
  await mkdir(path.join(workspace, 'test-results'), { recursive: true });
  const root = path.join(workspace, 'test-results', `${label}-${randomUUID()}`);
  await mkdir(root);
  return root;
}

async function fixture(root) {
  const batch = JSON.parse(await readFile(reviewed, 'utf8'));
  const article = batch.documents.articles.articles[0];
  const row = {
    link: article.originalUrl,
    title: article.title,
    quelleName: 'C4SS',
    pubDate: article.publishedAt,
    content: 'Review-bound continuous-supply test transport body.',
    contentComplete: true,
  };
  const feedBytes = Buffer.from(JSON.stringify([row]));
  const statusBytes = Buffer.from(
    JSON.stringify({
      ok: true,
      news: { feedCount: 1, bytes: feedBytes.byteLength },
      publication: { pending: false },
      lastSuccessfulFetchAt: '2026-09-13T23:59:00.000Z',
      lastPublishedAt: '2026-09-13T23:59:01.000Z',
    }),
  );
  const intake = inspectLegacyNewsSnapshot({ feedBytes, statusBytes, commit, observedAt });
  const bindings = [
    {
      articleId: article.id,
      sourceName: 'C4SS',
      upstreamRecordSha256: hash(canonicalJson(row)),
      reviewedArticleSha256: hash(canonicalJson(article)),
    },
  ];
  const files = {
    previous: path.join(root, 'previous.json'),
    reviewed: path.join(root, 'reviewed.json'),
    bindings: path.join(root, 'bindings.json'),
    ledger: path.join(root, 'ledger.json'),
  };
  await Promise.all([
    writeFile(files.previous, await readFile(basePrevious)),
    writeFile(files.reviewed, JSON.stringify(batch)),
    writeFile(files.bindings, JSON.stringify(bindings)),
    writeFile(files.ledger, await readFile(baseLedger)),
  ]);
  return {
    batch,
    files,
    fetchSnapshot: async ({ commit: requested }) => {
      assert.equal(requested, commit);
      return { intake, feedBytes, statusBytes };
    },
  };
}

async function request(root, files, fetchSnapshot, extra = {}) {
  return {
    commit,
    outputDirectory: path.join(root, 'run'),
    trustedWorkspaceRoot: workspace,
    previousInputPath: files.previous,
    previousInputSha256: hash(canonicalJson(JSON.parse(await readFile(files.previous, 'utf8')))),
    previousLedgerPath: files.ledger,
    reviewedBatchPath: files.reviewed,
    bindingsPath: files.bindings,
    generatedAt,
    fetchSnapshot,
    ...extra,
  };
}

test('reuses the bounded snapshot and existing atomic supply builder for an admitted batch', async (t) => {
  const root = await fresh('continuous-supply-prepared');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { batch, files, fetchSnapshot } = await fixture(root);
  const result = await runLegacyNewsSupply(await request(root, files, fetchSnapshot));
  assert.equal(result.state, 'prepared');
  assert.equal(result.receipt.publicationPerformed, false);
  assert.deepEqual((await readdir(path.join(root, 'run'))).sort(), [
    'delivery',
    'merged-input.json',
    'publisher',
    'receipt.json',
  ]);
  assert.equal(existsSync(path.join(root, 'run', 'delivery-work')), false);
});

test('records awaiting admission without calling the publisher or delivery builder', async (t) => {
  const root = await fresh('continuous-supply-awaiting');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { fetchSnapshot } = await fixture(root);
  const result = await runLegacyNewsSupply({
    commit,
    outputDirectory: path.join(root, 'run'),
    trustedWorkspaceRoot: workspace,
    generatedAt,
    fetchSnapshot,
  });
  assert.equal(result.state, 'awaiting-admission');
  assert.deepEqual(await readdir(path.join(root, 'run')), ['receipt.json']);
  assert.equal(result.receipt.publicationPerformed, false);
});

test('returns no-change for an exact repeated reviewed batch without a second bundle', async (t) => {
  const root = await fresh('continuous-supply-no-change');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { batch, files, fetchSnapshot } = await fixture(root);
  const first = await runLegacyNewsSupply(await request(root, files, fetchSnapshot));
  const repeated = await runLegacyNewsSupply(
    await request(root, {
      ...files,
      previous: path.join(first.outputDirectory, 'merged-input.json'),
      ledger: path.join(first.outputDirectory, 'delivery', 'next-ledger.json'),
    }, fetchSnapshot, { outputDirectory: path.join(root, 'repeat') }),
  );
  assert.equal(repeated.state, 'no-change');
  assert.deepEqual(await readdir(path.join(root, 'repeat')), ['receipt.json']);
  assert.equal(existsSync(path.join(root, 'repeat', 'publisher')), false);
  assert.deepEqual(
    {
      previousInputSha256: repeated.receipt.previousInputSha256,
      reviewedInputSha256: repeated.receipt.reviewedInputSha256,
      bindingsSha256: repeated.receipt.bindingsSha256,
      articleIds: repeated.receipt.articleIds,
    },
    {
      previousInputSha256: hash(canonicalJson(JSON.parse(await readFile(first.buildInputPath, 'utf8')))),
      reviewedInputSha256: hash(canonicalJson(JSON.parse(await readFile(files.reviewed, 'utf8')))),
      bindingsSha256: hash(canonicalJson(JSON.parse(await readFile(files.bindings, 'utf8')))),
      articleIds: [batch.documents.articles.articles[0].id],
    },
  );
});

test('rejects an invalid prior V3 input before no-change matching and promotes no output', async (t) => {
  const root = await fresh('continuous-supply-partial');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { batch, files, fetchSnapshot } = await fixture(root);
  const previous = JSON.parse(await readFile(files.previous, 'utf8'));
  previous.documents.articles.articles.push({
    ...batch.documents.articles.articles[0],
    id: 'wrn-art-prior-url-collision',
  });
  await writeFile(files.previous, JSON.stringify(previous));
  await assert.rejects(
    runLegacyNewsSupply(await request(root, files, fetchSnapshot)),
    /previous besteht die vollstaendige V3-Pruefung nicht/,
  );
  assert.equal(existsSync(path.join(root, 'run')), false);
});

test('rejects a corrupt admission for a repeated article before no-change output', async (t) => {
  const root = await fresh('continuous-supply-corrupt-prior-admission');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { batch, files, fetchSnapshot } = await fixture(root);
  const first = await runLegacyNewsSupply(await request(root, files, fetchSnapshot));
  const prior = JSON.parse(await readFile(first.buildInputPath, 'utf8'));
  prior.documents.admission.entries.find(
    (entry) => entry.articleId === batch.documents.articles.articles[0].id,
  ).admittedContentSha256 = '0'.repeat(64);
  const corrupt = path.join(root, 'corrupt-prior.json');
  await writeFile(corrupt, JSON.stringify(prior));
  await assert.rejects(
    runLegacyNewsSupply(
      await request(root, { ...files, previous: corrupt }, fetchSnapshot, {
        outputDirectory: path.join(root, 'repeat'),
      }),
    ),
    /previous besteht die vollstaendige V3-Pruefung nicht/,
  );
  assert.equal(existsSync(path.join(root, 'repeat')), false);
});

test('rejects corrupt reviewed details, admission, discover metadata and lifecycle history', async (t) => {
  const corruptions = [
    ['reader', (batch, article) => { batch.documents.readerDetails.entries.find((entry) => entry.articleId === article.id).blocks[0].text = 'changed'; }],
    ['admission', (batch, article) => { batch.documents.admission.entries.find((entry) => entry.articleId === article.id).admittedContentSha256 = '0'.repeat(64); }],
    ['discover', (batch, article) => { batch.documents.discoverIndex.entries.find((entry) => entry.articleId === article.id).title = 'changed'; }],
    ['lifecycle', (batch, article) => { batch.documents.archiveLifecycle.activeArticleIds = batch.documents.archiveLifecycle.activeArticleIds.filter((id) => id !== article.id); batch.documents.archiveLifecycle.aliases = [{ sourceId: article.id, targetId: article.id }]; }],
  ];
  for (const [label, corrupt] of corruptions) {
    const root = await fresh(`continuous-supply-corrupt-reviewed-${label}`);
    const { batch, files, fetchSnapshot } = await fixture(root);
    const first = await runLegacyNewsSupply(await request(root, files, fetchSnapshot));
    const changed = JSON.parse(await readFile(files.reviewed, 'utf8'));
    corrupt(changed, batch.documents.articles.articles[0]);
    await writeFile(files.reviewed, JSON.stringify(changed));
    await assert.rejects(
      runLegacyNewsSupply(
        await request(
          root,
          {
            ...files,
            previous: first.buildInputPath,
            ledger: path.join(first.outputDirectory, 'delivery', 'next-ledger.json'),
          },
          fetchSnapshot,
          { outputDirectory: path.join(root, 'repeat') },
        ),
      ),
      /reviewed besteht die vollstaendige V3-Pruefung nicht/,
    );
    assert.equal(existsSync(path.join(root, 'repeat')), false);
    await rm(root, { recursive: true, force: true });
  }
});

test('rejects an unpaired review input before it can fetch or write', async (t) => {
  const root = await fresh('continuous-supply-unpaired');
  t.after(() => rm(root, { recursive: true, force: true }));
  const { files } = await fixture(root);
  let fetched = false;
  await assert.rejects(
    runLegacyNewsSupply({
      commit,
      outputDirectory: path.join(root, 'run'),
      trustedWorkspaceRoot: workspace,
      reviewedBatchPath: files.reviewed,
      generatedAt,
      fetchSnapshot: async () => {
        fetched = true;
        throw new Error('must not fetch');
      },
    }),
    /muessen gemeinsam vorliegen/,
  );
  assert.equal(fetched, false);
  assert.equal(existsSync(path.join(root, 'run')), false);
});
