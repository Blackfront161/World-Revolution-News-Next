export const mobileContentDirectorySchema = 'wrn.mobile-content-directory.v1' as const;
export const mobileContentDirectoryMaxBytes = 3 * 1024 * 1024;
export type DirectoryDataset = 'app' | 'github';
export type DirectoryProvenance = {
  dataset: DirectoryDataset;
  repo: string;
  commit: string;
  path: string;
  inputSHA256: string;
  observedAt: string;
  sourceDate: string | null;
  row: number;
};
export type DirectoryArticleObservation = {
  provenance: DirectoryProvenance;
  rawUrl: string;
  title: string;
  sourceName: string;
  language: string;
  rawLanguage: string | null;
  publishedAt: string | null;
  rawPublishedAt: string | null;
  topics: string[];
  sourceHomepage: string | null;
};
export type DirectorySourceObservation = {
  provenance: DirectoryProvenance;
  rawUrl: string;
  name: string;
  languages: string[];
  mediaType: string | null;
  status: string | null;
  active: boolean | null;
  homepage: string | null;
  topics: string[];
  originRegion: string | null;
  originCountry: string | null;
};
export type DirectoryArticle = {
  id: string;
  url: string;
  title: string;
  sourceName: string;
  language: string;
  publishedAt: string | null;
  topics: string[];
  historical: boolean;
  endpointIds: string[];
  observations: DirectoryArticleObservation[];
};
export type DirectorySource = {
  id: string;
  url: string;
  name: string;
  languages: string[];
  mediaType: string | null;
  historicalHttp: boolean;
  accessNote: 'insecure-url' | null;
  observations: DirectorySourceObservation[];
};
export type DirectorySportNote = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  author: string;
  publishedAt: string;
  category: 'football' | 'fan-culture';
  noteDe: string;
  noteEn: string;
  rights: 'wrn-editorial-reading-note';
  observedAt: string;
  sourceHomepage: string;
  articleId: string | null;
  endpointIds: string[];
};
export type DirectoryInputCount = {
  input: number;
  accepted: number;
  rejected: { url: number; http: number; metadata: number };
};
export type DirectoryReconciliation = {
  news: {
    app: DirectoryInputCount;
    github: DirectoryInputCount;
    rawLinkUnion: number;
    normalizedUrlUnionBeforeHttps: number;
    collisions: number;
  };
  sources: { app: DirectoryInputCount; github: DirectoryInputCount; collisions: number };
};
export type MobileContentDirectory = {
  schema: typeof mobileContentDirectorySchema;
  version: 1;
  sourceCommit: string;
  observedAt: string;
  rights: 'metadata-and-links';
  articles: DirectoryArticle[];
  sources: DirectorySource[];
  sports: DirectorySportNote[];
  withdrawals: { articleIds: string[]; endpointIds: string[] };
  reconciliation: DirectoryReconciliation;
};
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const exact = (v: unknown, keys: string): v is Record<string, unknown> =>
  record(v) && Object.keys(v).sort().join(',') === keys.split(' ').sort().join(',');
const hasControl = (value: string) =>
  Array.from(value).some((char) => {
    const code = char.charCodeAt(0);
    return code < 32 || (code >= 127 && code <= 159);
  });
export const directoryPlainText = (v: unknown, max = 500): v is string =>
  typeof v === 'string' &&
  v.length > 0 &&
  v.length <= max &&
  v.trim() === v &&
  !hasControl(v) &&
  !/[<>]/u.test(v);
const nullableText = (v: unknown, max = 500) => v === null || directoryPlainText(v, max);
const language = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u.test(v) && v.length <= 35;
const array = (v: unknown, check: (item: unknown) => boolean, max = 100): v is unknown[] =>
  Array.isArray(v) && v.length <= max && v.every(check);
const unique = (v: unknown[]) => new Set(v).size === v.length;
const id = (v: unknown, prefix: string): v is string =>
  typeof v === 'string' && new RegExp('^' + prefix + '-[a-f0-9]{64}$', 'u').test(v);
const sha = (v: unknown, size: number) =>
  typeof v === 'string' && new RegExp('^[a-f0-9]{' + size + '}$', 'u').test(v);
const iso = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString() === v;
const date = (v: unknown) =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(v) && iso(v + 'T00:00:00.000Z');
/** Version 1 identity: parser serialization; news drops only fragments and utm_* keys. */
export function normaliseDirectoryUrl(
  value: unknown,
  { news = false, allowHttp = false } = {},
): string | null {
  if (
    typeof value !== 'string' ||
    !/^https?:\/\//u.test(value) ||
    value.length > 2048 ||
    hasControl(value) ||
    /[\s\\<>]/u.test(value)
  )
    return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/u, '');
    if (
      (url.protocol !== 'https:' && !(allowHttp && url.protocol === 'http:')) ||
      url.username ||
      url.password ||
      !host.includes('.') ||
      host.includes(':') ||
      /^[\d.]+$/u.test(host) ||
      !/^[a-z0-9.-]+$/u.test(host) ||
      host.split('.').some((label) => !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u.test(label)) ||
      ['localhost', 'local', 'internal', 'home.arpa'].some(
        (suffix) => host === suffix || host.endsWith('.' + suffix),
      )
    )
      return null;
    if (news) {
      url.hash = '';
      for (const key of [...url.searchParams.keys()])
        if (/^utm_/iu.test(key)) url.searchParams.delete(key);
    }
    return url.href;
  } catch {
    return null;
  }
}
const safeUrl = (v: unknown, allowHttp = false, news = false) =>
  typeof v === 'string' && normaliseDirectoryUrl(v, { allowHttp, news }) === v;
function provenance(v: unknown, path: string): v is DirectoryProvenance {
  return (
    exact(v, 'dataset repo commit path inputSHA256 observedAt sourceDate row') &&
    (v.dataset === 'app' || v.dataset === 'github') &&
    v.repo ===
      (v.dataset === 'app'
        ? 'https://github.com/Blackfront161/World-Revolution-News-App'
        : 'https://github.com/Blackfront161/Revolution-News-Data') &&
    sha(v.commit, 40) &&
    v.path === path &&
    sha(v.inputSHA256, 64) &&
    iso(v.observedAt) &&
    (v.sourceDate === null || iso(v.sourceDate)) &&
    Number.isSafeInteger(v.row) &&
    (v.row as number) >= 0 &&
    (v.row as number) < 2000
  );
}
function articleObservation(v: unknown, url: string): v is DirectoryArticleObservation {
  return (
    exact(
      v,
      'provenance rawUrl title sourceName language rawLanguage publishedAt rawPublishedAt topics sourceHomepage',
    ) &&
    provenance(v.provenance, 'news-feed.json') &&
    normaliseDirectoryUrl(v.rawUrl, { news: true }) === url &&
    directoryPlainText(v.title) &&
    directoryPlainText(v.sourceName) &&
    language(v.language) &&
    (v.rawLanguage === null || language(v.rawLanguage)) &&
    (v.publishedAt === null || iso(v.publishedAt)) &&
    nullableText(v.rawPublishedAt, 100) &&
    array(v.topics, (x) => directoryPlainText(x, 120)) &&
    (v.sourceHomepage === null || safeUrl(v.sourceHomepage, true)) &&
    v.provenance.sourceDate === v.publishedAt
  );
}
function sourceObservation(v: unknown, url: string): v is DirectorySourceObservation {
  return (
    exact(
      v,
      'provenance rawUrl name languages mediaType status active homepage topics originRegion originCountry',
    ) &&
    provenance(v.provenance, 'sources-registry.json') &&
    normaliseDirectoryUrl(v.rawUrl, { allowHttp: true }) === url &&
    directoryPlainText(v.name) &&
    array(v.languages, language) &&
    unique(v.languages) &&
    nullableText(v.mediaType, 80) &&
    nullableText(v.status, 80) &&
    (v.active === null || typeof v.active === 'boolean') &&
    (v.homepage === null || safeUrl(v.homepage, true)) &&
    array(v.topics, (x) => directoryPlainText(x, 120)) &&
    nullableText(v.originRegion, 120) &&
    nullableText(v.originCountry, 120)
  );
}
export function directoryEndpointIds(
  homepages: (string | null)[],
  sources: DirectorySource[],
): string[] {
  const links = new Set(homepages.filter((v) => v !== null));
  return sources
    .filter(
      (s) =>
        links.has(s.url) ||
        s.observations.some((o) => o.homepage !== null && links.has(o.homepage)),
    )
    .map((s) => s.id)
    .sort();
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
function count(v: unknown): v is DirectoryInputCount {
  if (!exact(v, 'input accepted rejected') || !exact(v.rejected, 'url http metadata')) return false;
  return (
    [v.input, v.accepted, ...Object.values(v.rejected)].every(
      (n) => Number.isSafeInteger(n) && (n as number) >= 0 && (n as number) <= 2000,
    ) &&
    v.input ===
      (v.accepted as number) +
        (v.rejected.url as number) +
        (v.rejected.http as number) +
        (v.rejected.metadata as number)
  );
}
function validateDocument(value: unknown): value is MobileContentDirectory {
  if (
    !exact(
      value,
      'schema version sourceCommit observedAt rights articles sources sports withdrawals reconciliation',
    ) ||
    value.schema !== mobileContentDirectorySchema ||
    value.version !== 1 ||
    value.rights !== 'metadata-and-links' ||
    !sha(value.sourceCommit, 40) ||
    !iso(value.observedAt) ||
    !array(value.articles, record, 2000) ||
    !array(value.sources, record, 2000) ||
    !array(value.sports, record, 50) ||
    !exact(value.withdrawals, 'articleIds endpointIds') ||
    !exact(value.reconciliation, 'news sources')
  )
    return false;
  const sourceIds = new Set<string>();
  const articleIds = new Set<string>();
  const sportIds = new Set<string>();
  const rowKeys = new Set<string>();
  const seenObservation = (p: DirectoryProvenance) => {
    const key = p.dataset + ':' + p.path + ':' + p.row;
    if (rowKeys.has(key)) return false;
    rowKeys.add(key);
    return true;
  };
  const sources = value.sources as DirectorySource[];
  for (const s of sources) {
    if (
      !exact(s, 'id url name languages mediaType historicalHttp accessNote observations') ||
      !id(s.id, 'source') ||
      sourceIds.has(s.id) ||
      !safeUrl(s.url, true) ||
      !array(s.observations, (o) => sourceObservation(o, s.url)) ||
      s.observations.length === 0 ||
      !s.observations.every((o) => seenObservation(o.provenance)) ||
      s.historicalHttp !== s.url.startsWith('http:') ||
      s.accessNote !== (s.historicalHttp ? 'insecure-url' : null)
    )
      return false;
    const display =
      s.observations.findLast((o) => o.provenance.dataset === 'github') ?? s.observations.at(-1)!;
    if (
      s.name !== display.name ||
      !same(s.languages, display.languages) ||
      s.mediaType !== display.mediaType
    )
      return false;
    sourceIds.add(s.id);
  }
  const articles = value.articles as DirectoryArticle[];
  for (const a of articles) {
    if (
      !exact(
        a,
        'id url title sourceName language publishedAt topics historical endpointIds observations',
      ) ||
      !id(a.id, 'news') ||
      articleIds.has(a.id) ||
      !safeUrl(a.url, false, true) ||
      !array(a.observations, (o) => articleObservation(o, a.url)) ||
      a.observations.length === 0 ||
      !a.observations.every((o) => seenObservation(o.provenance)) ||
      !array(a.endpointIds, (x) => id(x, 'source')) ||
      !same(
        a.endpointIds,
        directoryEndpointIds(
          a.observations.map((o) => o.sourceHomepage),
          sources,
        ),
      )
    )
      return false;
    const current = a.observations.findLast((o) => o.provenance.dataset === 'github');
    const display = current ?? a.observations.at(-1)!;
    if (
      a.historical !== !current ||
      a.title !== display.title ||
      a.sourceName !== display.sourceName ||
      a.language !== display.language ||
      a.publishedAt !== display.publishedAt ||
      !same(a.topics, display.topics)
    )
      return false;
    articleIds.add(a.id);
  }
  if (
    new Set(articles.map((a) => a.url)).size !== articles.length ||
    new Set(sources.map((s) => s.url)).size !== sources.length
  )
    return false;
  for (const s of value.sports as DirectorySportNote[]) {
    if (
      !exact(
        s,
        'id title url publisher author publishedAt category noteDe noteEn rights observedAt sourceHomepage articleId endpointIds',
      ) ||
      !id(s.id, 'sport') ||
      sportIds.has(s.id) ||
      !safeUrl(s.url, false, true) ||
      !directoryPlainText(s.title) ||
      !directoryPlainText(s.publisher) ||
      !directoryPlainText(s.author) ||
      !date(s.publishedAt) ||
      !['football', 'fan-culture'].includes(s.category) ||
      !directoryPlainText(s.noteDe, 2000) ||
      !directoryPlainText(s.noteEn, 2000) ||
      s.rights !== 'wrn-editorial-reading-note' ||
      !iso(s.observedAt) ||
      !safeUrl(s.sourceHomepage) ||
      s.articleId !== (articles.find((a) => a.url === s.url)?.id ?? null) ||
      !array(s.endpointIds, (x) => id(x, 'source')) ||
      !same(s.endpointIds, directoryEndpointIds([s.sourceHomepage], sources))
    )
      return false;
    sportIds.add(s.id);
  }
  if (
    !array(value.withdrawals.articleIds, (x) => id(x, 'news') && articleIds.has(x)) ||
    !unique(value.withdrawals.articleIds) ||
    !array(value.withdrawals.endpointIds, (x) => id(x, 'source') && sourceIds.has(x)) ||
    !unique(value.withdrawals.endpointIds)
  )
    return false;
  const raw = value.reconciliation;
  if (
    !exact(raw.news, 'app github rawLinkUnion normalizedUrlUnionBeforeHttps collisions') ||
    !exact(raw.sources, 'app github collisions') ||
    !count(raw.news.app) ||
    !count(raw.news.github) ||
    !count(raw.sources.app) ||
    !count(raw.sources.github)
  )
    return false;
  const r = raw as DirectoryReconciliation;
  const inputIdentities = new Map<string, string>();
  for (const p of [
    ...articles.flatMap((a) => a.observations),
    ...sources.flatMap((s) => s.observations),
  ].map((o) => o.provenance)) {
    const counts = p.path === 'news-feed.json' ? r.news : r.sources;
    if (
      p.row >= counts[p.dataset].input ||
      p.observedAt !== value.observedAt ||
      (p.dataset === 'github' && p.commit !== value.sourceCommit)
    )
      return false;
    const key = p.dataset + ':' + p.path;
    const identity =
      p.commit +
      ':' +
      p.inputSHA256 +
      (p.path === 'sources-registry.json' ? ':' + p.sourceDate : '');
    if (inputIdentities.has(key) && inputIdentities.get(key) !== identity) return false;
    inputIdentities.set(key, identity);
  }
  for (const dataset of ['app', 'github'] as const) {
    if (
      articles.flatMap((a) => a.observations).filter((o) => o.provenance.dataset === dataset)
        .length !== r.news[dataset].accepted ||
      sources.flatMap((s) => s.observations).filter((o) => o.provenance.dataset === dataset)
        .length !== r.sources[dataset].accepted
    )
      return false;
  }
  return (
    [
      r.news.rawLinkUnion,
      r.news.normalizedUrlUnionBeforeHttps,
      r.news.collisions,
      r.sources.collisions,
    ].every((n) => Number.isSafeInteger(n) && (n as number) >= 0 && (n as number) <= 4000) &&
    (r.news.normalizedUrlUnionBeforeHttps as number) <= (r.news.rawLinkUnion as number) &&
    (r.news.rawLinkUnion as number) <= r.news.app.input + r.news.github.input &&
    r.news.collisions === r.news.app.accepted + r.news.github.accepted - articles.length &&
    r.sources.collisions === r.sources.app.accepted + r.sources.github.accepted - sources.length
  );
}
export function validateMobileContentDirectory(value: unknown): value is MobileContentDirectory {
  try {
    return (
      new TextEncoder().encode(JSON.stringify(value)).byteLength <=
        mobileContentDirectoryMaxBytes && validateDocument(value)
    );
  } catch {
    return false;
  }
}
/** The transport additionally checks the full URL hash, beyond shape and reference validation. */
export async function validateMobileContentDirectoryIds(
  directory: MobileContentDirectory,
): Promise<boolean> {
  try {
    const groups = [
      [directory.articles, 'news'],
      [directory.sources, 'source'],
      [directory.sports, 'sport'],
    ] as const;
    const checks = groups.flatMap(([entries, prefix]) =>
      entries.map(async (entry) => {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(entry.url));
        const hex = Array.from(new Uint8Array(digest), (byte) =>
          byte.toString(16).padStart(2, '0'),
        ).join('');
        return entry.id === prefix + '-' + hex;
      }),
    );
    return (await Promise.all(checks)).every(Boolean);
  } catch {
    return false;
  }
}
/** Projection is a view of an already validated document, not a new import document. */
export function projectMobileContentDirectory(
  directory: MobileContentDirectory,
): MobileContentDirectory {
  const removedSources = new Set(directory.withdrawals.endpointIds);
  const removedArticles = new Set(directory.withdrawals.articleIds);
  for (const a of directory.articles)
    if (a.endpointIds.some((id) => removedSources.has(id))) removedArticles.add(a.id);
  return {
    ...directory,
    sources: directory.sources.filter((s) => !removedSources.has(s.id)),
    articles: directory.articles.filter((a) => !removedArticles.has(a.id)),
    sports: directory.sports.filter(
      (s) =>
        !(s.articleId && removedArticles.has(s.articleId)) &&
        !s.endpointIds.some((id) => removedSources.has(id)),
    ),
  };
}
