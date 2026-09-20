import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildProductionContentRelease } from './build-production-content-release.mjs';
import { canonicalJson } from '../packages/content-contracts/src/index.ts';
import {
  appendReviewedLegacyArticles,
  bindReviewedLegacyArticles,
  fetchLegacyNewsSnapshot,
  inspectLegacyNewsSnapshot,
  legacyNewsRepository,
  legacyNewsLimits,
} from './legacy-news-ingestion.mjs';

async function appendFixture() {
  const original = JSON.parse(
    await readFile(
      new URL(
        '../docs/evidence/WRN-NEWS-SIX-ARTICLE-INPUT-2026-09-11/candidate-1789065672080/production-build-input-v3.json',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  const selected = original.documents.articles.articles[0];
  const subset = (include) => {
    const copy = structuredClone(original);
    copy.documents.articles.articles = copy.documents.articles.articles.filter((article) =>
      include(article.id),
    );
    for (const name of ['readerDetails', 'admission', 'discoverIndex'])
      copy.documents[name].entries = copy.documents[name].entries.filter((entry) =>
        include(entry.articleId),
      );
    for (const name of ['activeArticleIds', 'archiveArticleIds', 'shareableArticleIds'])
      copy.documents.archiveLifecycle[name] = copy.documents.archiveLifecycle[name].filter(include);
    return copy;
  };
  const previousInput = subset((id) => id !== selected.id),
    reviewedInput = subset((id) => id === selected.id);
  reviewedInput.sequence++;
  reviewedInput.releaseRevision = 'legacy-append-test-v4';
  // Synthetic upstream transport fixture; the six article/admission/reader records are unchanged.
  const intake = inspectLegacyNewsSnapshot(
    snapshot([row({ link: selected.originalUrl, pubDate: selected.publishedAt })]),
  );
  const candidate = intake.candidates[0];
  const bindings = [
    {
      articleId: selected.id,
      sourceName: candidate.sourceName,
      upstreamRecordSha256: candidate.upstreamRecordSha256,
      reviewedArticleSha256: hash(selected),
    },
  ];
  return {
    original,
    previousInput,
    previousInputSha256: hash(previousInput),
    reviewedInput,
    intake,
    bindings,
  };
}

test('append retains five absent-from-feed articles and all four images, then passes the existing V3 publisher', async () => {
  const fixture = await appendFixture(),
    before = structuredClone(fixture);
  const merged = appendReviewedLegacyArticles(fixture);
  assert.equal(merged.documents.articles.articles.length, 6);
  for (const name of ['readerDetails', 'admission', 'discoverIndex']) {
    assert.deepEqual(
      [...merged.documents[name].entries].sort((a, b) => a.articleId.localeCompare(b.articleId)),
      [...fixture.original.documents[name].entries].sort((a, b) =>
        a.articleId.localeCompare(b.articleId),
      ),
    );
  }
  assert.equal(
    merged.documents.readerDetails.entries
      .flatMap((entry) => entry.blocks)
      .filter((block) => block.kind === 'image').length,
    4,
  );
  assert.deepEqual(fixture, before);
  const directory = await mkdtemp(path.join(os.tmpdir(), 'wrn-legacy-append-'));
  const inputPath = path.join(directory, 'input.json');
  await writeFile(inputPath, JSON.stringify(merged));
  const result = await buildProductionContentRelease({
    inputPath,
    outputPath: path.join(directory, 'release'),
  });
  assert.equal(result.releaseRevision, 'legacy-append-test-v4');
});

test('append rejects unbound prior state, skipped sequence, changed identity and incomplete bundles without mutation', async () => {
  for (const mode of ['hash', 'sequence', 'identity', 'reader', 'history', 'active']) {
    const fixture = await appendFixture();
    if (mode === 'hash') fixture.previousInputSha256 = '0'.repeat(64);
    if (mode === 'sequence') fixture.reviewedInput.sequence++;
    if (mode === 'identity') {
      fixture.previousInput.documents.articles.articles.push(
        structuredClone(fixture.reviewedInput.documents.articles.articles[0]),
      );
      fixture.previousInputSha256 = hash(fixture.previousInput);
    }
    if (mode === 'reader') fixture.reviewedInput.documents.readerDetails.entries = [];
    if (mode === 'history')
      fixture.reviewedInput.documents.archiveLifecycle.revocations.entries.push({
        articleId: 'unreviewed-revocation',
      });
    if (mode === 'active') fixture.reviewedInput.documents.archiveLifecycle.activeArticleIds = [];
    const before = structuredClone(fixture);
    assert.throws(() => appendReviewedLegacyArticles(fixture), undefined, mode);
    assert.deepEqual(fixture, before);
  }
});

test('append preserves prior lifecycle history instead of resetting it to the batch history', async () => {
  const fixture = await appendFixture();
  fixture.previousInput.documents.archiveLifecycle.revocations = {
    revision: 8,
    previousRevision: 7,
    entries: [{ articleId: 'historical-revocation' }],
  };
  fixture.previousInput.documents.archiveLifecycle.gone = [{ articleId: 'historical-gone' }];
  fixture.previousInput.documents.archiveLifecycle.aliases = [
    { from: 'historical-alias', to: 'historical-target' },
  ];
  fixture.previousInputSha256 = hash(fixture.previousInput);
  const merged = appendReviewedLegacyArticles(fixture);
  for (const name of ['revocations', 'gone', 'aliases'])
    assert.deepEqual(
      merged.documents.archiveLifecycle[name],
      fixture.previousInput.documents.archiveLifecycle[name],
    );
  // This synthetic history only tests preservation; the V3 publisher remains responsible for its validity.
});

test('append CLI creates a full publisher input without overwriting an existing output', async () => {
  const fixture = await appendFixture(),
    directory = await mkdtemp(path.join(os.tmpdir(), 'wrn-append-cli-'));
  const selected = fixture.reviewedInput.documents.articles.articles[0];
  const raw = snapshot([row({ link: selected.originalUrl, pubDate: selected.publishedAt })], {
    lastSuccessfulFetchAt: new Date(Date.now() - 2000).toISOString(),
    lastPublishedAt: new Date(Date.now() - 1000).toISOString(),
  });
  for (const [name, value] of [
    ['previous', fixture.previousInput],
    ['batch', fixture.reviewedInput],
    ['bindings', fixture.bindings],
  ])
    await writeFile(path.join(directory, name + '.json'), JSON.stringify(value));
  await writeFile(path.join(directory, 'feed.json'), raw.feedBytes);
  await writeFile(path.join(directory, 'status.json'), raw.statusBytes);
  const output = path.join(directory, 'merged.json');
  const args = [
    fileURLToPath(new URL('./legacy-news-ingestion.mjs', import.meta.url)),
    '--append',
    path.join(directory, 'previous.json'),
    fixture.previousInputSha256,
    path.join(directory, 'batch.json'),
    path.join(directory, 'bindings.json'),
    path.join(directory, 'feed.json'),
    path.join(directory, 'status.json'),
    commit,
    output,
  ];
  const result = JSON.parse(
    execFileSync(process.execPath, args, { encoding: 'utf8', stdio: 'pipe' }),
  );
  assert.equal(result.articles, 6);
  assert.equal(result.publicationPerformed, false);
  const saved = await readFile(output);
  assert.throws(() => execFileSync(process.execPath, args, { stdio: 'pipe' }));
  assert.deepEqual(await readFile(output), saved);
  const built = await buildProductionContentRelease({
    inputPath: output,
    outputPath: path.join(directory, 'built'),
  });
  assert.equal(built.releaseRevision, 'legacy-append-test-v4');
  await writeFile(path.join(directory, 'bindings.json'), Buffer.alloc(64 * 1024 + 1));
  assert.throws(() =>
    execFileSync(process.execPath, [...args.slice(0, -1), path.join(directory, 'oversized.json')], {
      stdio: 'pipe',
    }),
  );
  assert.deepEqual(await readFile(output), saved);
});

const commit = 'a'.repeat(40);
const now = Date.parse('2026-09-13T14:00:00Z');
const hash = (value) => createHash('sha256').update(canonicalJson(value)).digest('hex');
const row = (overrides = {}) => ({
  link: 'https://example.org/news/CaseSensitive',
  title: 'Test article',
  quelleName: 'Test source',
  pubDate: 'Sun, 13 Sep 2026 12:00:00 +0000',
  content: 'Test source text',
  contentComplete: true,
  ...overrides,
});
function snapshot(rows = [row()], statusChanges = {}) {
  const feedBytes = Buffer.from(JSON.stringify(rows));
  const statusBytes = Buffer.from(
    JSON.stringify({
      ok: true,
      news: { feedCount: rows.length, bytes: feedBytes.length },
      publication: { pending: false },
      lastSuccessfulFetchAt: '2026-09-13T12:10:00+00:00',
      lastPublishedAt: '2026-09-13T12:11:00+00:00',
      ...statusChanges,
    }),
  );
  return { feedBytes, statusBytes, commit, observedAt: now };
}
const response = (bytes) =>
  new Response(bytes, {
    headers: { 'content-type': 'application/json', 'content-length': String(bytes.length) },
  });

test('accepts upstream RSS, zoned and naive ISO UTC conventions without granting source rights', () => {
  const dates = [
    'Sun, 13 Sep 2026 12:00:00 +0000',
    'Sun, 13 Sep 2026 13:00:00 +0100',
    'Sun, 13 Sep 2026 12:00:00 GMT',
    '2026-09-13T12:00:00Z',
    '2026-09-13T12:00:00.000000',
  ];
  for (const pubDate of dates) {
    const intake = inspectLegacyNewsSnapshot(snapshot([row({ pubDate, webFeedTruncated: true })]));
    assert.equal(intake.candidates[0].publishedAt, '2026-09-13T12:00:00.000Z');
    assert.equal(intake.candidates[0].reviewRequired, true);
    assert.equal(intake.candidates[0].upstreamClaimsFullText, false);
    assert.equal(intake.candidates[0].originalLanguage, null);
    assert.equal('content' in intake.candidates[0], false);
    assert.equal('license' in intake.candidates[0], false);
  }
});

test('retains case-sensitive identities and source rows through hashes', () => {
  const rows = [
    row(),
    row({ link: 'https://example.org/news/casesensitive', content: 'Other text' }),
  ];
  const intake = inspectLegacyNewsSnapshot(snapshot(rows));
  assert.equal(intake.candidates.length, 2);
  assert.equal(intake.candidates[0].upstreamRecordSha256, hash(rows[0]));
  assert.ok(intake.candidates.every((candidate) => !candidate.identityConflict));
});

test('rejects calendar rollover and non-ISO status dates instead of silently changing the date', () => {
  for (const pubDate of [
    '2026-02-30T12:00:00Z',
    '2026-02-30T12:00:00',
    '30 Feb 2026 12:00:00 GMT',
    '2026-09-12T24:00:00Z',
  ]) {
    assert.equal(inspectLegacyNewsSnapshot(snapshot([row({ pubDate })])).candidates.length, 0);
  }
  assert.throws(
    () =>
      inspectLegacyNewsSnapshot(
        snapshot([row()], { lastSuccessfulFetchAt: 'Sep 13 2026 12:10:00Z' }),
      ),
    /publication/,
  );
});

test('quarantines both sides of duplicate URLs and identical bodies', () => {
  const intake = inspectLegacyNewsSnapshot(
    snapshot([row(), row({ content: 'Changed body' }), row({ link: 'https://example.org/other' })]),
  );
  assert.equal(intake.rejected[0].reason, 'duplicate-original-url');
  assert.ok(intake.candidates.every((candidate) => candidate.identityConflict));
});

test('rejects invalid source identities and future or ambiguous dates', () => {
  const rows = [
    row({ link: 'javascript:alert(1)' }),
    row({ link: 'https://user:pass@example.org/' }),
    row({ pubDate: '09/13/2026' }),
    row({ pubDate: '2026-09-14T00:00:00Z' }),
    row({ quelleName: '' }),
  ];
  const intake = inspectLegacyNewsSnapshot(snapshot(rows));
  assert.equal(intake.rejected.length, rows.length);
  assert.equal(intake.rejected[3].reason, 'future-published-at');
});

test('rejects stale, future, pending and count/byte-inconsistent snapshots', () => {
  for (const changes of [
    { lastSuccessfulFetchAt: '2026-09-12T12:00:00Z' },
    { lastPublishedAt: '2026-09-14T12:00:00Z' },
    { publication: { pending: true } },
    { news: { feedCount: 1, bytes: 0 } },
    { ok: false },
  ])
    assert.throws(() => inspectLegacyNewsSnapshot(snapshot([row()], changes)));
});

test('fails closed for invalid UTF-8, oversized bytes and too many rows', () => {
  assert.throws(
    () => inspectLegacyNewsSnapshot({ ...snapshot(), feedBytes: Buffer.from([0xff]) }),
    /UTF-8/,
  );
  assert.throws(
    () =>
      inspectLegacyNewsSnapshot({
        ...snapshot(),
        feedBytes: Buffer.alloc(legacyNewsLimits.feedBytes + 1),
      }),
    /byte limit/,
  );
  assert.throws(
    () => inspectLegacyNewsSnapshot(snapshot(Array.from({ length: 501 }, () => row()))),
    /feed shape/,
  );
});

test('exposes an upstream budget stop without claiming that the complete publication failed', () => {
  const intake = inspectLegacyNewsSnapshot(
    snapshot([row()], {
      aggregation: {
        mode: 'enrich',
        stoppedForBudget: true,
        sourcesConfigured: 257,
        sourcesEligible: 257,
        sourcesAttempted: 254,
        sourcesWithEntries: 178,
      },
    }),
  );
  assert.equal(intake.upstreamStoppedForBudget, true);
  assert.deepEqual(intake.upstreamWarnings, [
    {
      code: 'aggregation-budget-exhausted',
      source: legacyNewsRepository,
      stage: 'enrich',
      observedAt: '2026-09-13T14:00:00.000Z',
      publicationAgeMs: 6540000,
      stoppedForBudget: true,
      sourcesConfigured: 257,
      sourcesEligible: 257,
      sourcesAttempted: 254,
      sourcesWithEntries: 178,
    },
  ]);
});

test('reports a future newest-feed timestamp without blocking independently dated candidates', () => {
  const input = snapshot([row()]);
  const status = JSON.parse(input.statusBytes);
  status.news.newestArticleAt = '2026-09-14T00:00:00.000Z';
  input.statusBytes = Buffer.from(JSON.stringify(status));
  const intake = inspectLegacyNewsSnapshot(input);
  assert.equal(intake.candidates.length, 1);
  assert.deepEqual(intake.upstreamWarnings, [
    {
      code: 'news-newest-article-at-future',
      source: legacyNewsRepository,
      stage: 'news-feed',
      observedAt: '2026-09-13T14:00:00.000Z',
      publicationAgeMs: 6540000,
      newestArticleAt: '2026-09-14T00:00:00.000Z',
      newestArticleAgeMs: -36000000,
    },
  ]);
});

test('fetches only two pinned upstream files without cookies or redirects', async () => {
  const input = snapshot();
  const calls = [];
  const result = await fetchLegacyNewsSnapshot({
    commit,
    now: () => now,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return response(url.endsWith('feed-status.json') ? input.statusBytes : input.feedBytes);
    },
  });
  assert.equal(calls.length, 2);
  assert.ok(
    calls.every(
      (call) =>
        call.url.startsWith(
          `https://raw.githubusercontent.com/Blackfront161/Revolution-News-Data/${commit}/`,
        ) &&
        call.options.redirect === 'error' &&
        call.options.credentials === 'omit',
    ),
  );
  assert.deepEqual(result.feedBytes, input.feedBytes);
  assert.equal(result.intake.candidates.length, 1);
});

test('rejects malformed commit before network access and already cancelled calls', async () => {
  let calls = 0;
  const fetchImpl = () => {
    calls++;
    throw new Error('unexpected network');
  };
  await assert.rejects(fetchLegacyNewsSnapshot({ commit: '../main', fetchImpl }), /invalid commit/);
  await assert.rejects(
    fetchLegacyNewsSnapshot({ commit, fetchImpl, signal: AbortSignal.abort() }),
    { name: 'AbortError' },
  );
  assert.equal(calls, 0);
});

test('cancels oversized or invalid transport responses before consuming source data', async () => {
  for (const headers of [
    { 'content-type': 'text/html' },
    {
      'content-type': 'application/json',
      'content-length': String(legacyNewsLimits.statusBytes + 1),
    },
  ]) {
    let cancelled = false;
    const body = new ReadableStream({
      cancel() {
        cancelled = true;
      },
    });
    await assert.rejects(
      fetchLegacyNewsSnapshot({ commit, fetchImpl: async () => new Response(body, { headers }) }),
      /transport/,
    );
    assert.equal(cancelled, true);
  }
});

test('enforces streaming bounds when content length is absent', async () => {
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(legacyNewsLimits.statusBytes + 1));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(
    fetchLegacyNewsSnapshot({
      commit,
      fetchImpl: async () =>
        new Response(body, { headers: { 'content-type': 'application/json' } }),
    }),
    /byte limit/,
  );
  assert.equal(cancelled, true);
});

test('caller abort ends a stalled body and a late fetch is cancelled', async () => {
  const controller = new AbortController();
  let cancelled = false;
  const body = new ReadableStream({
    cancel() {
      cancelled = true;
    },
  });
  const pending = fetchLegacyNewsSnapshot({
    commit,
    signal: controller.signal,
    fetchImpl: async () => new Response(body, { headers: { 'content-type': 'application/json' } }),
  });
  await new Promise((resolve) => setImmediate(resolve));
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(cancelled, true);

  const lateController = new AbortController();
  let resolveFetch;
  let lateCancelled = false;
  const late = fetchLegacyNewsSnapshot({
    commit,
    signal: lateController.signal,
    fetchImpl: () =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
  });
  lateController.abort();
  await assert.rejects(late, { name: 'AbortError' });
  resolveFetch(
    new Response(
      new ReadableStream({
        cancel() {
          lateCancelled = true;
        },
      }),
    ),
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(lateCancelled, true);
});

test('review binding requires unchanged article and exact upstream record; never mutates approved input', () => {
  const intake = inspectLegacyNewsSnapshot(snapshot());
  const candidate = intake.candidates[0];
  const article = {
    id: 'test-article',
    originalUrl: candidate.originalUrl,
    publishedAt: candidate.publishedAt,
  };
  const approvedInput = {
    schema: 'wrn.production-content-build-input.v3',
    documents: { articles: { articles: [article] } },
  };
  const bindings = [
    {
      articleId: article.id,
      sourceName: candidate.sourceName,
      upstreamRecordSha256: candidate.upstreamRecordSha256,
      reviewedArticleSha256: hash(article),
    },
  ];
  const copy = bindReviewedLegacyArticles({ intake, approvedInput, bindings });
  assert.deepEqual(copy, approvedInput);
  assert.notEqual(copy, approvedInput);
  for (const changed of [
    [],
    [null],
    [{ ...bindings[0], upstreamRecordSha256: '0'.repeat(64) }],
    [{ ...bindings[0], reviewedArticleSha256: '0'.repeat(64) }],
  ]) {
    assert.throws(() => bindReviewedLegacyArticles({ intake, approvedInput, bindings: changed }));
  }
  assert.throws(
    () =>
      bindReviewedLegacyArticles({
        intake: { ...intake, candidates: [{ ...candidate, identityConflict: true }] },
        approvedInput,
        bindings,
      }),
    /conflicting/,
  );
  assert.equal(approvedInput.documents.articles.articles[0], article);
});
