import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJson } from '../packages/content-contracts/src/index.ts';

export const legacyNewsRepository = 'Blackfront161/Revolution-News-Data';
export const legacyNewsLimits = Object.freeze({
  feedBytes: 4 * 1024 * 1024,
  statusBytes: 32 * 1024,
  records: 500,
  deadlineMs: 30_000,
});
const digest = (value) => createHash('sha256').update(value).digest('hex');
const fail = (reason) => {
  throw new Error(`WRN legacy ingestion: ${reason}`);
};
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonNegativeInteger = (value) =>
  Number.isSafeInteger(value) && value >= 0 ? value : null;
function originalUrl(value) {
  if (
    typeof value !== 'string' ||
    value.length > 2048 ||
    [...value].some((character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127)
  )
    return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && !url.hash
      ? url.href
      : null;
  } catch {
    return null;
  }
}
function date(value) {
  if (typeof value !== 'string') return null;
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/u.exec(
      value,
    );
  if (!match || !calendarDay(Number(match[1]), Number(match[2]), Number(match[3]))) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function calendarDay(year, month, day) {
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
}
function articleDate(row) {
  for (const value of [row.pubDate, row.date, row.published]) {
    const iso = date(value);
    if (iso !== null) return iso;
    // build_web_feeds.py explicitly treats naive ISO timestamps as UTC.
    // This reproduces that upstream convention, not a verified source date.
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?$/u.test(value)
    ) {
      const parsed = date(`${value}Z`);
      if (parsed !== null) return parsed;
    }
    // The existing publisher emits RSS dates as well as timezone-qualified ISO.
    // Require an explicit numeric or UTC zone; never depend on the machine zone.
    const rss =
      typeof value === 'string'
        ? /^(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),? )?(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) ([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)? (?:[+-](?:[01]\d|2[0-3])[0-5]\d|GMT|UT|UTC)$/u.exec(
            value,
          )
        : null;
    if (
      rss &&
      calendarDay(
        Number(rss[3]),
        [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ].indexOf(rss[2]) + 1,
        Number(rss[1]),
      )
    ) {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}
function text(value, limit) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= limit
    ? value
    : null;
}
function rowHash(row) {
  return digest(canonicalJson(row));
}
function upstreamWarnings({ status, observedAt, publishedAt }) {
  const observedIso = new Date(observedAt).toISOString();
  const publicationAgeMs = observedAt - publishedAt;
  const warnings = [];
  const aggregation = isRecord(status.aggregation) ? status.aggregation : null;
  const mode =
    typeof aggregation?.mode === 'string' && /^(?:fast|enrich)$/u.test(aggregation.mode)
      ? aggregation.mode
      : 'unknown';
  if (aggregation?.stoppedForBudget === true)
    warnings.push({
      code: 'aggregation-budget-exhausted',
      source: legacyNewsRepository,
      stage: mode,
      observedAt: observedIso,
      publicationAgeMs,
      stoppedForBudget: true,
      sourcesConfigured: nonNegativeInteger(aggregation.sourcesConfigured),
      sourcesEligible: nonNegativeInteger(aggregation.sourcesEligible),
      sourcesAttempted: nonNegativeInteger(aggregation.sourcesAttempted),
      sourcesWithEntries: nonNegativeInteger(aggregation.sourcesWithEntries),
    });
  const newest = date(status.news?.newestArticleAt);
  if (newest !== null && newest > observedAt)
    warnings.push({
      code: 'news-newest-article-at-future',
      source: legacyNewsRepository,
      stage: 'news-feed',
      observedAt: observedIso,
      publicationAgeMs,
      newestArticleAt: new Date(newest).toISOString(),
      newestArticleAgeMs: observedAt - newest,
    });
  return warnings;
}
function abortable(promise, signal, onLate = () => {}) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    Promise.resolve(promise).then(
      (value) => {
        signal.removeEventListener('abort', abort);
        if (signal.aborted) onLate(value);
        else resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', abort);
        reject(error);
      },
    );
  });
}

/** Backend-only bounded intake. Source text is never executed, rendered or granted rights here. */
export function inspectLegacyNewsSnapshot({ feedBytes, statusBytes, commit, observedAt }) {
  if (!/^[a-f0-9]{40}$/u.test(commit ?? '') || !Number.isSafeInteger(observedAt) || observedAt < 0)
    fail('invalid observation identity');
  if (
    !(feedBytes instanceof Uint8Array) ||
    !(statusBytes instanceof Uint8Array) ||
    feedBytes.length > legacyNewsLimits.feedBytes ||
    statusBytes.length > legacyNewsLimits.statusBytes
  )
    fail('input byte limit');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let rows, status;
  try {
    rows = JSON.parse(decoder.decode(feedBytes));
    status = JSON.parse(decoder.decode(statusBytes));
  } catch {
    fail('invalid UTF-8 JSON');
  }
  if (
    !Array.isArray(rows) ||
    rows.length === 0 ||
    rows.length > legacyNewsLimits.records ||
    !isRecord(status) ||
    !isRecord(status.news) ||
    !isRecord(status.publication)
  )
    fail('invalid feed shape');
  if (
    status.ok !== true ||
    status.publication.pending !== false ||
    status.news.feedCount !== rows.length ||
    status.news.bytes !== feedBytes.length
  )
    fail('inconsistent publication');
  const fetchedAt = date(status.lastSuccessfulFetchAt),
    publishedAt = date(status.lastPublishedAt);
  if (
    fetchedAt === null ||
    publishedAt === null ||
    fetchedAt > publishedAt ||
    publishedAt > observedAt ||
    observedAt - fetchedAt > 24 * 60 * 60 * 1000
  )
    fail('stale or future publication');
  const candidates = [],
    rejected = [],
    urls = new Set(),
    duplicates = new Set();
  const hashes = new Map();
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (!isRecord(row)) {
      rejected.push({ index, reason: 'invalid-record' });
      continue;
    }
    const url = originalUrl(row.link),
      title = text(row.title, 1000),
      sourceName = text(row.quelleName ?? row.sourceName ?? row.source, 300),
      published = articleDate(row);
    if (!url || !title || !sourceName || published === null) {
      rejected.push({ index, reason: 'invalid-metadata' });
      continue;
    }
    if (published > observedAt) {
      rejected.push({ index, reason: 'future-published-at' });
      continue;
    }
    if (urls.has(url)) {
      duplicates.add(url);
      rejected.push({ index, reason: 'duplicate-original-url' });
      continue;
    }
    urls.add(url);
    const content = typeof row.content === 'string' ? row.content : '';
    const contentSha256 = digest(content);
    if (content.trim()) hashes.set(contentSha256, [...(hashes.get(contentSha256) ?? []), url]);
    candidates.push({
      index,
      originalUrl: url,
      title,
      sourceName,
      publishedAt: new Date(published).toISOString(),
      originalLanguage: text(row.language, 32),
      upstreamRecordSha256: rowHash(row),
      contentSha256,
      contentBytes: Buffer.byteLength(content),
      upstreamClaimsFullText: row.contentComplete === true && row.webFeedTruncated !== true,
      reviewRequired: true,
    });
  }
  const reusedText = new Set([...hashes.values()].filter((group) => group.length > 1).flat());
  for (const candidate of candidates)
    candidate.identityConflict =
      duplicates.has(candidate.originalUrl) || reusedText.has(candidate.originalUrl);
  return {
    schema: 'wrn.legacy-news-intake.v1',
    commit,
    observedAt: new Date(observedAt).toISOString(),
    fetchedAt: new Date(fetchedAt).toISOString(),
    publishedAt: new Date(publishedAt).toISOString(),
    feedSha256: digest(feedBytes),
    feedGitBlobSha: createHash('sha1')
      .update(`blob ${feedBytes.length}\0`)
      .update(feedBytes)
      .digest('hex'),
    statusSha256: digest(statusBytes),
    feedBytes: feedBytes.length,
    rows: rows.length,
    candidates,
    rejected,
    upstreamStoppedForBudget: status.aggregation?.stoppedForBudget === true,
    upstreamWarnings: upstreamWarnings({ status, observedAt, publishedAt }),
  };
}

async function readBounded(response, limit, signal) {
  const rejectResponse = (reason) => {
    void response.body?.cancel().catch(() => {});
    fail(reason);
  };
  if (
    !response.ok ||
    response.redirected ||
    !response.body ||
    !/^application\/(?:[\w.+-]*\+)?json(?:\s*;|$)|^text\/plain(?:\s*;|$)/iu.test(
      response.headers.get('content-type') ?? '',
    )
  )
    rejectResponse('invalid transport response');
  const length = response.headers.get('content-length');
  if (length !== null && (!/^\d+$/u.test(length) || Number(length) > limit))
    rejectResponse('transport byte limit');
  const reader = response.body.getReader(),
    chunks = [];
  let total = 0;
  const abort = () => {
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener('abort', abort, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const next = await abortable(reader.read(), signal);
      signal.throwIfAborted();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > limit) fail('transport byte limit');
      chunks.push(next.value);
    }
    if (length !== null && Number(length) !== total) fail('transport length mismatch');
    return Buffer.concat(chunks, total);
  } finally {
    signal.removeEventListener('abort', abort);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function fetchLegacyNewsSnapshot({
  commit,
  fetchImpl = fetch,
  signal: callerSignal,
  now = Date.now,
}) {
  if (!/^[a-f0-9]{40}$/u.test(commit ?? '')) fail('invalid commit');
  const deadline = AbortSignal.timeout(legacyNewsLimits.deadlineMs);
  const signal = callerSignal ? AbortSignal.any([callerSignal, deadline]) : deadline;
  const root = `https://raw.githubusercontent.com/${legacyNewsRepository}/${commit}/`;
  const obtain = async (name, limit) => {
    signal.throwIfAborted();
    const response = await abortable(
      fetchImpl(root + name, {
        signal,
        redirect: 'error',
        credentials: 'omit',
        cache: 'no-store',
        headers: { accept: 'application/json', 'accept-encoding': 'identity' },
      }),
      signal,
      (late) => {
        void late.body?.cancel().catch(() => {});
      },
    );
    signal.throwIfAborted();
    return readBounded(response, limit, signal);
  };
  // Sequential reads share one deadline and pin both files to the same Git commit.
  const statusBytes = await obtain('feed-status.json', legacyNewsLimits.statusBytes);
  const feedBytes = await obtain('news-feed.json', legacyNewsLimits.feedBytes);
  const intake = inspectLegacyNewsSnapshot({ feedBytes, statusBytes, commit, observedAt: now() });
  return { intake, feedBytes, statusBytes };
}

/** Join already reviewed V3 records to exact intake identities; never infer permission from a feed flag. */
export function bindReviewedLegacyArticles({ intake, approvedInput, bindings }) {
  if (
    approvedInput?.schema !== 'wrn.production-content-build-input.v3' ||
    !Array.isArray(bindings) ||
    !bindings.every(isRecord) ||
    !Array.isArray(intake?.candidates) ||
    !intake.candidates.every(isRecord)
  )
    fail('invalid reviewed input');
  const copy = JSON.parse(JSON.stringify(approvedInput));
  const articles = copy.documents?.articles?.articles;
  if (!Array.isArray(articles) || articles.length > 64 || bindings.length !== articles.length)
    fail('incomplete review bindings');
  const used = new Set();
  for (const article of articles) {
    const binding = bindings.find((item) => item.articleId === article.id);
    if (!binding || used.has(binding.articleId)) fail('duplicate or missing binding');
    used.add(binding.articleId);
    const candidate = intake.candidates.find((item) => item.originalUrl === article.originalUrl);
    if (
      !candidate ||
      candidate.identityConflict ||
      candidate.upstreamRecordSha256 !== binding.upstreamRecordSha256 ||
      candidate.publishedAt !== article.publishedAt ||
      candidate.sourceName !== binding.sourceName ||
      digest(canonicalJson(article)) !== binding.reviewedArticleSha256
    )
      fail('changed or conflicting article');
  }
  // The existing V3 publisher must still validate all admission, rights, reader and lifecycle contracts.
  return copy;
}

/** Append a reviewed batch to an exact prior input; feed eviction never means article deletion.
 * Corrections and revocations deliberately remain in the existing explicit workflows.
 * The returned full input must pass the existing V3 publisher before delivery.
 */
export function appendReviewedLegacyArticles({
  previousInput,
  previousInputSha256,
  intake,
  reviewedInput,
  bindings,
}) {
  if (
    previousInput?.schema !== 'wrn.production-content-build-input.v3' ||
    digest(canonicalJson(previousInput)) !== previousInputSha256
  )
    fail('unbound previous input');
  const additions = bindReviewedLegacyArticles({ intake, approvedInput: reviewedInput, bindings });
  if (
    !Number.isSafeInteger(previousInput.sequence) ||
    additions.sequence !== previousInput.sequence + 1 ||
    additions.releaseRevision === previousInput.releaseRevision
  )
    fail('invalid update sequence');
  const copy = JSON.parse(JSON.stringify(previousInput));
  const prior = copy.documents,
    incoming = additions.documents;
  const oldArticles = prior?.articles?.articles,
    newArticles = incoming?.articles?.articles;
  if (
    !Array.isArray(oldArticles) ||
    !Array.isArray(newArticles) ||
    newArticles.length === 0 ||
    oldArticles.length + newArticles.length > 64
  )
    fail('invalid append count');
  const ids = new Set(oldArticles.map((article) => article.id)),
    urls = new Set(oldArticles.map((article) => article.originalUrl));
  if (ids.size !== oldArticles.length || urls.size !== oldArticles.length)
    fail('ambiguous previous articles');
  const newIds = new Set();
  for (const article of newArticles) {
    if (ids.has(article.id) || urls.has(article.originalUrl) || newIds.has(article.id))
      fail('append identity collision');
    newIds.add(article.id);
    urls.add(article.originalUrl);
  }
  for (const component of ['readerDetails', 'admission', 'discoverIndex']) {
    const oldEntries = prior[component]?.entries,
      newEntries = incoming[component]?.entries;
    if (
      !Array.isArray(oldEntries) ||
      !Array.isArray(newEntries) ||
      oldEntries.length !== ids.size ||
      newEntries.length !== newIds.size ||
      new Set(oldEntries.map((entry) => entry.articleId)).size !== ids.size ||
      new Set(newEntries.map((entry) => entry.articleId)).size !== newIds.size ||
      oldEntries.some((entry) => !ids.has(entry.articleId)) ||
      newEntries.some((entry) => !newIds.has(entry.articleId))
    )
      fail('incomplete article bundle');
    oldEntries.push(...newEntries);
  }
  const lifecycle = prior.archiveLifecycle,
    batchLifecycle = incoming.archiveLifecycle;
  if (
    !isRecord(lifecycle) ||
    !isRecord(batchLifecycle) ||
    !Array.isArray(batchLifecycle.aliases) ||
    batchLifecycle.aliases.length ||
    !Array.isArray(batchLifecycle.gone) ||
    batchLifecycle.gone.length ||
    !Array.isArray(batchLifecycle.revocations?.entries) ||
    batchLifecycle.revocations.entries.length
  )
    fail('append cannot alter lifecycle history');
  for (const name of ['activeArticleIds', 'archiveArticleIds', 'shareableArticleIds']) {
    const oldValues = lifecycle[name],
      newValues = batchLifecycle[name];
    if (
      !Array.isArray(oldValues) ||
      !Array.isArray(newValues) ||
      newValues.length !== newIds.size ||
      new Set(newValues).size !== newIds.size ||
      newValues.some((id) => !newIds.has(id))
    )
      fail('incomplete append lifecycle');
    oldValues.push(...newValues);
  }
  oldArticles.push(...newArticles);
  copy.releaseRevision = additions.releaseRevision;
  copy.sequence = additions.sequence;
  return copy;
}

async function readLocalBounded(file, limit) {
  const chunks = [];
  let total = 0;
  for await (const chunk of createReadStream(file)) {
    total += chunk.length;
    if (total > limit) fail('local input byte limit');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, total);
}

async function appendFromCli(args) {
  if (args.length !== 9)
    fail(
      'usage: --append <previous.json> <previous canonical sha256> <reviewed-batch.json> <bindings.json> <news-feed.json> <feed-status.json> <commit> <new-output.json>',
    );
  const [
    ,
    previousPath,
    previousInputSha256,
    reviewedPath,
    bindingsPath,
    feedPath,
    statusPath,
    commit,
    output,
  ] = args;
  const parse = (bytes) => {
    try {
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    } catch {
      fail('invalid local UTF-8 JSON');
    }
  };
  const previousInput = parse(await readLocalBounded(previousPath, legacyNewsLimits.feedBytes));
  const reviewedInput = parse(await readLocalBounded(reviewedPath, legacyNewsLimits.feedBytes));
  const bindings = parse(await readLocalBounded(bindingsPath, 64 * 1024));
  const feedBytes = await readLocalBounded(feedPath, legacyNewsLimits.feedBytes);
  const statusBytes = await readLocalBounded(statusPath, legacyNewsLimits.statusBytes);
  const intake = inspectLegacyNewsSnapshot({
    feedBytes,
    statusBytes,
    commit,
    observedAt: Date.now(),
  });
  const input = appendReviewedLegacyArticles({
    previousInput,
    previousInputSha256,
    reviewedInput,
    bindings,
    intake,
  });
  const serialized = canonicalJson(input) + '\n';
  if (Buffer.byteLength(serialized) > legacyNewsLimits.feedBytes) fail('merged input byte limit');
  await writeFile(output, serialized, { flag: 'wx' });
  console.log(
    JSON.stringify({
      output: path.resolve(output),
      articles: input.documents.articles.articles.length,
      sequence: input.sequence,
      publicationPerformed: false,
    }),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) &&
  process.argv[2] === '--append'
) {
  await appendFromCli(process.argv.slice(2));
} else if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [commit, output] = process.argv.slice(2);
  if (!output)
    fail('usage: legacy-news-ingestion.mjs <40-character commit> <new output directory>');
  const snapshot = await fetchLegacyNewsSnapshot({ commit });
  await mkdir(output, { recursive: false });
  await writeFile(path.join(output, 'news-feed.json'), snapshot.feedBytes, { flag: 'wx' });
  await writeFile(path.join(output, 'feed-status.json'), snapshot.statusBytes, { flag: 'wx' });
  await writeFile(
    path.join(output, 'intake.json'),
    JSON.stringify(snapshot.intake, null, 2) + '\n',
    { flag: 'wx' },
  );
  console.log(
    JSON.stringify({
      commit,
      rows: snapshot.intake.rows,
      candidates: snapshot.intake.candidates.length,
      rejected: snapshot.intake.rejected.length,
      feedBytes: snapshot.intake.feedBytes,
      output: path.resolve(output),
      publicationPerformed: false,
    }),
  );
}
