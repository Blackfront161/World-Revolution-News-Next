import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  directoryEndpointIds,
  directoryPlainText,
  mobileContentDirectoryMaxBytes,
  normaliseDirectoryUrl,
  validateMobileContentDirectory,
  validateMobileContentDirectoryIds,
} from '../../packages/content-contracts/src/directory/mobile-content-directory-v1.ts';
import {
  fetchLegacyNewsSnapshot,
  legacyNewsLimits,
  legacyNewsRepository,
} from '../legacy-news-ingestion.mjs';
import { writePreparedDirectoryRefresh } from './prepare-content-directory-refresh.mjs';

export const liveDirectorySourceLimit = 4 * 1024 * 1024;
export const liveDirectoryDeadlineMs = 30_000;
const githubRepository = `https://github.com/${legacyNewsRepository}`;
const hash = (value) => createHash('sha256').update(value).digest('hex');
const exactUtc = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
const language = (value) =>
  typeof value === 'string' &&
  /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u.test(value) &&
  value.length <= 35;
const optionalText = (value, maximum = 500) =>
  value === undefined || value === null || value === ''
    ? null
    : directoryPlainText(value, maximum)
      ? value
      : undefined;
const optionalUrl = (value) =>
  value === undefined || value === null || value === ''
    ? null
    : (normaliseDirectoryUrl(value, { allowHttp: true }) ?? undefined);
const inputCount = (input) => ({
  input,
  accepted: 0,
  rejected: { url: 0, http: 0, metadata: 0 },
});
const reject = (counter, reason) => {
  counter.rejected[reason] += 1;
  return null;
};
const canonicalDate = (value) => {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
};
const decodeJson = (bytes, maximum, reason) => {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength > maximum) throw new Error(reason);
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new Error(reason);
  }
};
const group = (records) => {
  const groups = new Map();
  for (const record of records.filter(Boolean)) {
    const observations = groups.get(record.url) ?? [];
    observations.push(record.observation);
    groups.set(record.url, observations);
  }
  return [...groups.entries()];
};
const cloneCount = (value) => JSON.parse(JSON.stringify(value));

function preservedAppRecords(entries, observedAt, path) {
  return entries.flatMap((entry) =>
    entry.observations
      .filter((observation) => observation.provenance.dataset === 'app')
      .map((observation) => ({
        url: entry.url,
        observation: {
          ...observation,
          provenance: { ...observation.provenance, observedAt, path },
        },
      })),
  );
}

function currentArticleRecord(row, candidate, commit, observedAt, feedSha256, counter) {
  const rawUrl = row?.link;
  const urlWithHttp = normaliseDirectoryUrl(rawUrl, { news: true, allowHttp: true });
  if (!urlWithHttp) return reject(counter, 'url');
  if (urlWithHttp.startsWith('http:')) return reject(counter, 'http');
  if (!candidate || candidate.identityConflict === true) return reject(counter, 'metadata');
  const rawLanguage = candidate.originalLanguage;
  const topics = row.categories === undefined ? [] : row.categories;
  const sourceHomepage = optionalUrl(row.sourceHomepage);
  const rawPublishedAt = [row.pubDate, row.date, row.published].find(
    (value) => typeof value === 'string',
  );
  if (
    !directoryPlainText(candidate.title) ||
    !directoryPlainText(candidate.sourceName) ||
    (rawLanguage !== null && !language(rawLanguage)) ||
    !Array.isArray(topics) ||
    topics.length > 100 ||
    !topics.every((value) => directoryPlainText(value, 120)) ||
    sourceHomepage === undefined ||
    (rawPublishedAt !== undefined && !directoryPlainText(rawPublishedAt, 100))
  )
    return reject(counter, 'metadata');
  counter.accepted += 1;
  return {
    url: urlWithHttp,
    observation: {
      provenance: {
        dataset: 'github',
        repo: githubRepository,
        commit,
        path: 'news-feed.json',
        inputSHA256: feedSha256,
        observedAt,
        sourceDate: candidate.publishedAt,
        row: candidate.index,
      },
      rawUrl: candidate.originalUrl,
      title: candidate.title,
      sourceName: candidate.sourceName,
      language: rawLanguage ?? 'und',
      rawLanguage,
      publishedAt: candidate.publishedAt,
      rawPublishedAt: rawPublishedAt ?? null,
      topics,
      sourceHomepage,
    },
  };
}

function currentSourceRecord(row, index, commit, observedAt, sourceSha256, sourceDate, counter) {
  const rawUrl = row?.canonicalUrl ?? row?.url ?? row?.homepage;
  const url = normaliseDirectoryUrl(rawUrl, { allowHttp: true });
  if (!url) return reject(counter, 'url');
  if (url.startsWith('http:')) return reject(counter, 'http');
  const languages = row.languages === undefined ? [] : row.languages;
  const topics = row.categories === undefined ? [] : row.categories;
  const mediaType = optionalText(row.mediaType, 80);
  const status = optionalText(row.status, 80);
  const homepage = optionalUrl(row.homepage);
  const originRegion = optionalText(row.originRegion, 120);
  const originCountry = optionalText(row.originCountry, 120);
  const active =
    row.active === undefined || row.active === null
      ? null
      : typeof row.active === 'boolean'
        ? row.active
        : undefined;
  if (
    !directoryPlainText(row.name) ||
    !Array.isArray(languages) ||
    languages.length > 100 ||
    !languages.every(language) ||
    !Array.isArray(topics) ||
    topics.length > 100 ||
    !topics.every((value) => directoryPlainText(value, 120)) ||
    [mediaType, status, homepage, originRegion, originCountry, active].includes(undefined)
  )
    return reject(counter, 'metadata');
  counter.accepted += 1;
  return {
    url,
    observation: {
      provenance: {
        dataset: 'github',
        repo: githubRepository,
        commit,
        path: 'sources-registry.json',
        inputSHA256: sourceSha256,
        observedAt,
        sourceDate,
        row: index,
      },
      rawUrl,
      name: row.name,
      languages: [...new Set(languages)],
      mediaType,
      status,
      active,
      homepage,
      topics,
      originRegion,
      originCountry,
    },
  };
}

/**
 * Creates a metadata-and-links directory only. It never grants article/image rights and never
 * copies article bodies. The bundled app observations remain the historical offline baseline;
 * every GitHub observation is replaced by the exact newly pinned upstream commit.
 */
export async function buildLiveContentDirectory({
  baseline,
  feedBytes,
  sourceBytes,
  intake,
  commit,
  observedAt = intake?.observedAt,
}) {
  if (
    !validateMobileContentDirectory(baseline) ||
    !(await validateMobileContentDirectoryIds(baseline)) ||
    !/^[a-f0-9]{40}$/u.test(commit ?? '') ||
    !exactUtc(observedAt) ||
    intake?.schema !== 'wrn.legacy-news-intake.v1' ||
    intake.commit !== commit ||
    intake.observedAt !== observedAt ||
    intake.feedSha256 !== hash(feedBytes)
  )
    throw new Error('live-directory-input');
  const currentNews = decodeJson(feedBytes, legacyNewsLimits.feedBytes, 'live-directory-feed');
  const sourceRegistry = decodeJson(
    sourceBytes,
    liveDirectorySourceLimit,
    'live-directory-sources',
  );
  if (
    !Array.isArray(currentNews) ||
    currentNews.length !== intake.rows ||
    currentNews.length > legacyNewsLimits.records ||
    sourceRegistry === null ||
    typeof sourceRegistry !== 'object' ||
    Array.isArray(sourceRegistry) ||
    !Array.isArray(sourceRegistry.sources) ||
    sourceRegistry.sources.length > 2000
  )
    throw new Error('live-directory-shape');
  const sourceDate = canonicalDate(sourceRegistry.generatedAt);
  if (sourceDate === null || Date.parse(sourceDate) > Date.parse(observedAt))
    throw new Error('live-directory-source-date');

  const appArticles = preservedAppRecords(baseline.articles, observedAt, 'news-feed.json');
  const appSources = preservedAppRecords(baseline.sources, observedAt, 'sources-registry.json');
  const appNewsCount = cloneCount(baseline.reconciliation.news.app);
  const appSourceCount = cloneCount(baseline.reconciliation.sources.app);
  if (appNewsCount.accepted !== appArticles.length || appSourceCount.accepted !== appSources.length)
    throw new Error('live-directory-baseline-count');

  const githubNewsCount = inputCount(currentNews.length);
  const candidateByIndex = new Map(
    intake.candidates.map((candidate) => [candidate.index, candidate]),
  );
  const githubArticles = currentNews.map((row, index) =>
    currentArticleRecord(
      row,
      candidateByIndex.get(index),
      commit,
      observedAt,
      intake.feedSha256,
      githubNewsCount,
    ),
  );
  const sourceSha256 = hash(sourceBytes);
  const githubSourceCount = inputCount(sourceRegistry.sources.length);
  const githubSources = sourceRegistry.sources.map((row, index) =>
    currentSourceRecord(
      row,
      index,
      commit,
      observedAt,
      sourceSha256,
      sourceDate,
      githubSourceCount,
    ),
  );

  const sources = group([...appSources, ...githubSources])
    .map(([url, observations]) => {
      const display =
        observations.findLast((observation) => observation.provenance.dataset === 'github') ??
        observations.at(-1);
      return {
        id: `source-${hash(url)}`,
        url,
        name: display.name,
        languages: display.languages,
        mediaType: display.mediaType,
        historicalHttp: url.startsWith('http:'),
        accessNote: url.startsWith('http:') ? 'insecure-url' : null,
        observations,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  const articles = group([...appArticles, ...githubArticles])
    .map(([url, observations]) => {
      const current = observations.findLast(
        (observation) => observation.provenance.dataset === 'github',
      );
      const display = current ?? observations.at(-1);
      return {
        id: `news-${hash(url)}`,
        url,
        title: display.title,
        sourceName: display.sourceName,
        language: display.language,
        publishedAt: display.publishedAt,
        topics: display.topics,
        historical: !current,
        endpointIds: directoryEndpointIds(
          observations.map((observation) => observation.sourceHomepage),
          sources,
        ),
        observations,
      };
    })
    .sort(
      (a, b) =>
        (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '') || a.id.localeCompare(b.id),
    );
  const articleIds = new Set(articles.map((article) => article.id));
  const sourceIds = new Set(sources.map((source) => source.id));
  const sports = baseline.sports.map((sport) => ({
    ...sport,
    observedAt,
    articleId: articles.find((article) => article.url === sport.url)?.id ?? null,
    endpointIds: directoryEndpointIds([sport.sourceHomepage], sources),
  }));
  const rawLinks = [
    ...appArticles.map((entry) => entry.observation.rawUrl),
    ...currentNews.map((row) => row?.link).filter((value) => typeof value === 'string'),
  ];
  const reconciliation = {
    news: {
      app: appNewsCount,
      github: githubNewsCount,
      rawLinkUnion: new Set(rawLinks).size,
      normalizedUrlUnionBeforeHttps: new Set(
        rawLinks
          .map((url) => normaliseDirectoryUrl(url, { news: true, allowHttp: true }))
          .filter(Boolean),
      ).size,
      collisions: appNewsCount.accepted + githubNewsCount.accepted - articles.length,
    },
    sources: {
      app: appSourceCount,
      github: githubSourceCount,
      collisions: appSourceCount.accepted + githubSourceCount.accepted - sources.length,
    },
  };
  const document = {
    schema: 'wrn.mobile-content-directory.v1',
    version: 1,
    sourceCommit: commit,
    observedAt,
    rights: 'metadata-and-links',
    articles,
    sources,
    sports,
    withdrawals: {
      articleIds: baseline.withdrawals.articleIds.filter((id) => articleIds.has(id)),
      endpointIds: baseline.withdrawals.endpointIds.filter((id) => sourceIds.has(id)),
    },
    reconciliation,
  };
  const bytes = new TextEncoder().encode(JSON.stringify(document) + '\n');
  const shapeValid = validateMobileContentDirectory(document);
  const identitiesValid = shapeValid && (await validateMobileContentDirectoryIds(document));
  if (bytes.byteLength > mobileContentDirectoryMaxBytes || !shapeValid || !identitiesValid)
    throw new Error(
      `live-directory-contract:size=${bytes.byteLength}:shape=${shapeValid}:ids=${identitiesValid}`,
    );
  return document;
}

async function readBoundedJsonResponse(response, signal) {
  if (
    !response.ok ||
    response.redirected ||
    response.body === null ||
    !/^application\/(?:[\w.+-]*\+)?json(?:\s*;|$)|^text\/plain(?:\s*;|$)/iu.test(
      response.headers.get('content-type') ?? '',
    )
  )
    throw new Error('live-directory-source-response');
  const declared = response.headers.get('content-length');
  if (
    declared !== null &&
    (!/^\d+$/u.test(declared) || Number(declared) > liveDirectorySourceLimit)
  )
    throw new Error('live-directory-source-size');
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  const abort = () => void reader.cancel().catch(() => undefined);
  signal.addEventListener('abort', abort, { once: true });
  try {
    signal.throwIfAborted();
    for (;;) {
      const next = await reader.read();
      signal.throwIfAborted();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > liveDirectorySourceLimit) throw new Error('live-directory-source-size');
      chunks.push(next.value);
    }
    if (declared !== null && Number(declared) !== total)
      throw new Error('live-directory-source-length');
    return Buffer.concat(chunks, total);
  } finally {
    signal.removeEventListener('abort', abort);
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export async function fetchLegacySourceRegistry({ commit, fetchImpl = fetch, signal }) {
  if (!/^[a-f0-9]{40}$/u.test(commit ?? '')) throw new Error('live-directory-commit');
  const localSignal = signal ?? AbortSignal.timeout(liveDirectoryDeadlineMs);
  localSignal.throwIfAborted();
  const response = await fetchImpl(
    `https://raw.githubusercontent.com/${legacyNewsRepository}/${commit}/sources-registry.json`,
    {
      signal: localSignal,
      redirect: 'error',
      credentials: 'omit',
      cache: 'no-store',
      headers: { accept: 'application/json', 'accept-encoding': 'identity' },
    },
  );
  return readBoundedJsonResponse(response, localSignal);
}

export async function prepareLiveContentDirectory({
  baseline,
  commit,
  sequence,
  output,
  fetchImpl = fetch,
  now = Date.now,
}) {
  const observedMs = now();
  if (!Number.isSafeInteger(observedMs) || observedMs < 0) throw new Error('live-directory-time');
  const signal = AbortSignal.timeout(liveDirectoryDeadlineMs);
  const snapshot = await fetchLegacyNewsSnapshot({
    commit,
    fetchImpl,
    signal,
    now: () => observedMs,
  });
  const sourceBytes = await fetchLegacySourceRegistry({ commit, fetchImpl, signal });
  const document = await buildLiveContentDirectory({
    baseline,
    feedBytes: snapshot.feedBytes,
    sourceBytes,
    intake: snapshot.intake,
    commit,
  });
  const manifest = await writePreparedDirectoryRefresh({ document, sequence, output });
  const receipt = {
    schema: 'wrn.live-content-directory-receipt.v1',
    dryRun: true,
    publicationPerformed: false,
    commit,
    observedAt: document.observedAt,
    feedSha256: snapshot.intake.feedSha256,
    sourcesSha256: hash(sourceBytes),
    articles: document.articles.length,
    sources: document.sources.length,
    sports: document.sports.length,
    reconciliation: document.reconciliation,
    manifest,
  };
  await writeFile(`${resolve(output)}-receipt.json`, JSON.stringify(receipt) + '\n', {
    flag: 'wx',
  });
  return { document, manifest, receipt };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const values = new Map();
  for (let index = 2; index < process.argv.length; index += 2)
    values.set(process.argv[index], process.argv[index + 1]);
  const baselinePath = values.get('--baseline');
  const commit = values.get('--commit');
  const output = values.get('--output');
  const sequence = Number(values.get('--sequence'));
  if (
    !baselinePath ||
    !output ||
    !/^[a-f0-9]{40}$/u.test(commit ?? '') ||
    !Number.isSafeInteger(sequence) ||
    sequence < 1
  )
    throw new Error('usage: --baseline <json> --commit <40-hex> --output <dir> --sequence <n>');
  const baselineBytes = await readFile(resolve(baselinePath));
  const baseline = decodeJson(
    baselineBytes,
    mobileContentDirectoryMaxBytes,
    'live-directory-baseline',
  );
  const result = await prepareLiveContentDirectory({ baseline, commit, sequence, output });
  process.stdout.write(JSON.stringify(result.receipt) + '\n');
}
