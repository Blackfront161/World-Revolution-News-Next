import {
  validateMobileContentDirectory,
  validateMobileContentDirectoryIds,
  type MobileContentDirectory,
} from '@wrn/content-contracts/mobile-content-directory-v1';
export const websiteTupleSchema = 'wrn.website-content-tuple.v1' as const;
export const websiteTuplePointerSchema = 'wrn.website-content-tuple-pointer.v1' as const;
export const websiteTupleMaxBytes = 4 * 1024 * 1024;
export const websiteTuplePointerMaxBytes = 4096;
const hex = (v: unknown, n: number): v is string =>
  typeof v === 'string' && new RegExp(`^[a-f0-9]{${n}}$`).test(v);
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const exact = (v: unknown, keys: string[]) =>
  record(v) && Object.keys(v).sort().join(',') === keys.sort().join(',');
const fields = (v: unknown, required: string[], optional: string[] = []) =>
  record(v) &&
  required.every((k) => Object.hasOwn(v, k)) &&
  Object.keys(v).every((k) => required.includes(k) || optional.includes(k));
const short = (v: unknown, max = 2048) => typeof v === 'string' && v.length <= max;
const deniedMedia = {
  text: 'item-admission-required',
  image: 'item-rights-required',
  audio: 'item-rights-required',
  logo: 'item-rights-required',
  teaser: 'no-reviewed-teaser',
};
const media = (v: unknown) =>
  record(v) &&
  exact(v, Object.keys(deniedMedia)) &&
  Object.entries(deniedMedia).every(([k, value]) => v[k] === value);
const sourceIds = (v: unknown) =>
  Array.isArray(v) &&
  v.length <= 2000 &&
  new Set(v).size === v.length &&
  v.every((id) => typeof id === 'string' && /^source-[a-f0-9]{64}$/.test(id));
const articleId = (v: unknown) =>
  v === null || (typeof v === 'string' && /^news-[a-f0-9]{64}$/.test(v));
const sourceId = (v: unknown) =>
  v === null || (typeof v === 'string' && /^source-[a-f0-9]{64}$/.test(v));
const rowIds = (v: unknown) => Array.isArray(v) && v.length <= 10000 && v.every(integer);
const reasons = new Set([
  'invalid-record',
  'invalid-metadata',
  'invalid-schema',
  'future-published-at',
  'duplicate-original-url',
  'insecure-url',
  'identity-conflict',
  'article-revoked',
  'source-revoked',
  'incomplete-source-provenance',
  'ambiguous-source-pass',
  'unsupported-import-mode',
  'directory-only',
  'metadata-prohibited',
]);
const decisionReason = (v: Record<string, unknown>) =>
  v.status === 'excluded'
    ? typeof v.reason === 'string' && reasons.has(v.reason)
    : v.reason === null;
function warning(v: unknown) {
  if (
    !record(v) ||
    v.source !== 'https://github.com/Blackfront161/Revolution-News-Data' ||
    !iso(v.observedAt) ||
    !integer(v.publicationAgeMs)
  )
    return false;
  if (v.code === 'aggregation-budget-exhausted')
    return (
      exact(v, [
        'code',
        'source',
        'stage',
        'observedAt',
        'publicationAgeMs',
        'stoppedForBudget',
        'sourcesConfigured',
        'sourcesEligible',
        'sourcesAttempted',
        'sourcesWithEntries',
      ]) &&
      ['fast', 'enrich', 'unknown'].includes(String(v.stage)) &&
      v.stoppedForBudget === true &&
      ['sourcesConfigured', 'sourcesEligible', 'sourcesAttempted', 'sourcesWithEntries'].every(
        (k) => v[k] === null || integer(v[k]),
      )
    );
  return (
    v.code === 'news-newest-article-at-future' &&
    exact(v, [
      'code',
      'source',
      'stage',
      'observedAt',
      'publicationAgeMs',
      'newestArticleAt',
      'newestArticleAgeMs',
    ]) &&
    v.stage === 'news-feed' &&
    iso(v.newestArticleAt) &&
    Number.isSafeInteger(v.newestArticleAgeMs) &&
    Number(v.newestArticleAgeMs) < 0
  );
}
const iso = (v: unknown): v is string =>
  typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
const integer = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0;
const ids = (v: unknown, max = 10000): v is string[] =>
  Array.isArray(v) &&
  v.length <= max &&
  v.every((id) => /^news-[a-f0-9]{64}$/.test(id)) &&
  new Set(v).size === v.length;
export async function websiteTupleHash(bytes: Uint8Array) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes)))]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
}
export const websiteTupleBytes = (value: unknown) =>
  new TextEncoder().encode(JSON.stringify(value) + '\n');
export type WebsiteHomeLayout = Readonly<{
  schema: string;
  appFreeze: string;
  directoryCommit: string;
  feedSha256: string;
  handoffSha256: string;
  selectorSha256?: string;
  lead: string | null;
  top: string[];
  sport: string[];
  more: string[];
  briefing: string[];
  visibleIds: string[];
  appTopics: Record<string, string[]>;
}>;
export type WebsiteImageEntry = Readonly<{
  articleId: string;
  originalUrl: string;
  originalTitle: string;
  sourceName: string;
  imageUrl: string;
  sourceRow: number;
  rightsMetadata: Record<string, unknown>;
}>;
export type WebsiteImageRegister = Readonly<{
  schema: string;
  appCommit: string;
  dataCommit: string;
  feedSha256: string;
  handoffSha256: string;
  rights: string;
  imageBytesHosted: false;
  imageBytesOffline: false;
  origins: string[];
  entries: WebsiteImageEntry[];
  excluded: unknown[];
}>;
export type WebsiteTupleSummary = Readonly<{
  directorySha256: string;
  sequence: number;
  commit: string;
  observedAt: string;
  feedTime: string;
  registerTime: string;
  newestArticleAt: string | null;
  counts: Record<
    | 'feed'
    | 'feedSources'
    | 'registry'
    | 'included'
    | 'metadataLinkOnly'
    | 'fullTextImported'
    | 'directoryOnlySources'
    | 'metadataOnlySources'
    | 'excluded'
    | 'matchedSources'
    | 'pendingSources'
    | 'excludedSources'
    | 'directoryArticles'
    | 'directorySources',
    number
  >;
  reasons: Record<string, number>;
  directoryOnlyEndpointIds: string[];
  admissionPolicy: string;
  articleSourcePassPending: number;
}>;
export type WebsiteTupleSource = Readonly<{
  appCommit: string;
  handoffSha256: string;
  selectorSha256: string;
  dataCommit: string;
  feedSha256: string;
  statusSha256: string;
  registrySha256: string;
  sourcePassSha256: string;
  revocationsSha256: string;
}>;
export type WebsiteContentTupleV1 = Readonly<{
  schema: typeof websiteTupleSchema;
  sequence: number;
  observedAt: string;
  source: WebsiteTupleSource;
  directory: MobileContentDirectory;
  summary: WebsiteTupleSummary;
  home: WebsiteHomeLayout;
  images: WebsiteImageRegister;
  report: Record<string, unknown>;
}>;
export type WebsiteContentTuplePointerV1 = Readonly<{
  schema: typeof websiteTuplePointerSchema;
  sequence: number;
  observedAt: string;
  artifactPath: string;
  artifactSha256: string;
  artifactBytes: number;
  source: WebsiteTupleSource;
}>;
function sourceValid(v: unknown): v is WebsiteTupleSource {
  return (
    exact(v, [
      'appCommit',
      'handoffSha256',
      'selectorSha256',
      'dataCommit',
      'feedSha256',
      'statusSha256',
      'registrySha256',
      'sourcePassSha256',
      'revocationsSha256',
    ]) &&
    record(v) &&
    hex(v.appCommit, 40) &&
    hex(v.dataCommit, 40) &&
    [
      'handoffSha256',
      'selectorSha256',
      'feedSha256',
      'statusSha256',
      'registrySha256',
      'sourcePassSha256',
      'revocationsSha256',
    ].every((k) => hex(v[k], 64))
  );
}
export function isWebsiteTuplePointer(v: unknown): v is WebsiteContentTuplePointerV1 {
  return (
    exact(v, [
      'schema',
      'sequence',
      'observedAt',
      'artifactPath',
      'artifactSha256',
      'artifactBytes',
      'source',
    ]) &&
    record(v) &&
    v.schema === websiteTuplePointerSchema &&
    integer(v.sequence) &&
    v.sequence > 0 &&
    iso(v.observedAt) &&
    hex(v.artifactSha256, 64) &&
    v.artifactPath === `snapshots/website-${v.sequence}-${v.artifactSha256}.json` &&
    integer(v.artifactBytes) &&
    v.artifactBytes > 0 &&
    v.artifactBytes <= websiteTupleMaxBytes &&
    sourceValid(v.source)
  );
}
/** Validate the complete metadata handoff before exposing any of its parts. */
export async function validateWebsiteContentTuple(
  value: unknown,
  { allowedImageOrigins }: Readonly<{ allowedImageOrigins: readonly string[] }>,
): Promise<boolean> {
  // A boolean result is used by callers; no unchecked partial tuple is returned.
  if (
    !exact(value, [
      'schema',
      'sequence',
      'observedAt',
      'source',
      'directory',
      'summary',
      'home',
      'images',
      'report',
    ]) ||
    !record(value) ||
    value.schema !== websiteTupleSchema ||
    !integer(value.sequence) ||
    value.sequence < 1 ||
    !iso(value.observedAt) ||
    !sourceValid(value.source) ||
    !validateMobileContentDirectory(value.directory) ||
    !(await validateMobileContentDirectoryIds(value.directory))
  )
    return false;
  const source = value.source,
    doc = value.directory as MobileContentDirectory,
    summary = value.summary,
    home = value.home,
    images = value.images,
    report = value.report;
  if (
    doc.sourceCommit !== source.dataCommit ||
    doc.observedAt !== value.observedAt ||
    !record(summary) ||
    !record(report) ||
    !record(home) ||
    !record(images)
  )
    return false;
  if (
    !exact(summary, [
      'directorySha256',
      'sequence',
      'commit',
      'observedAt',
      'feedTime',
      'registerTime',
      'newestArticleAt',
      'counts',
      'reasons',
      'directoryOnlyEndpointIds',
      'admissionPolicy',
      'articleSourcePassPending',
    ]) ||
    !exact(report, [
      'schema',
      'sequence',
      'upstream',
      'feedTime',
      'registerTime',
      'directorySha256',
      'sourcePassRevision',
      'revocationRevision',
      'counts',
      'commonArticleIds',
      'missingArticleIds',
      'commonSourceIds',
      'missingSourceIds',
      'newestArticleAt',
      'freshness',
      'articles',
      'sources',
      'feedSources',
      'publicationPerformed',
    ]) ||
    !exact(home, [
      'schema',
      'appFreeze',
      'directoryCommit',
      'feedSha256',
      'handoffSha256',
      'selectorSha256',
      'sourceFiles',
      'lead',
      'top',
      'sport',
      'more',
      'briefing',
      'visibleIds',
      'appTopics',
      'excludedSelection',
      'selectionPolicy',
    ]) ||
    !exact(images, [
      'schema',
      'appCommit',
      'dataCommit',
      'feedSha256',
      'handoffSha256',
      'rights',
      'imageBytesHosted',
      'imageBytesOffline',
      'origins',
      'entries',
      'excluded',
    ])
  )
    return false;
  if (
    !fields(
      report.upstream,
      [
        'admissionPolicy',
        'importMode',
        'commit',
        'observedAt',
        'hashes',
        'feedCount',
        'registerCount',
      ],
      ['publishedOrigin', 'publishedBytesMatchCommit'],
    ) ||
    !record(report.upstream) ||
    report.upstream.importMode !== 'metadata-only' ||
    ('publishedOrigin' in report.upstream &&
      report.upstream.publishedOrigin !==
        'https://blackfront161.github.io/Revolution-News-Data/') ||
    ('publishedBytesMatchCommit' in report.upstream &&
      report.upstream.publishedBytesMatchCommit !== true) ||
    !exact(report.upstream.hashes, [
      'baseline',
      'feed',
      'status',
      'registry',
      'sourcePass',
      'revocations',
    ]) ||
    !record(report.upstream.hashes) ||
    !Object.values(report.upstream.hashes).every((h) => hex(h, 64)) ||
    !short(report.sourcePassRevision, 256) ||
    !integer(report.revocationRevision) ||
    report.publicationPerformed !== false ||
    !exact(report.freshness, [
      'observedAt',
      'publicationAgeMs',
      'maximumAgeMs',
      'upstreamWarnings',
    ]) ||
    !record(report.freshness) ||
    report.freshness.observedAt !== value.observedAt ||
    !integer(report.freshness.publicationAgeMs) ||
    report.freshness.publicationAgeMs > 86400000 ||
    report.freshness.maximumAgeMs !== 86400000 ||
    !Array.isArray(report.freshness.upstreamWarnings) ||
    !report.freshness.upstreamWarnings.every(warning)
  )
    return false;
  if (
    !record(home.sourceFiles) ||
    !Object.entries(home.sourceFiles).every(
      ([name, input]) =>
        [
          'news-app-2-core.js',
          'news-card-copy.js',
          'editorial-decisions.json',
          'news-app-2.js',
          'home-selection.js',
        ].includes(name) &&
        exact(input, ['bytes', 'sha256']) &&
        record(input) &&
        integer(input.bytes) &&
        hex(input.sha256, 64),
    ) ||
    !short(home.selectionPolicy, 512) ||
    !Array.isArray(home.excludedSelection) ||
    !home.excludedSelection.every(
      (e) =>
        exact(e, ['url', 'reason']) &&
        record(e) &&
        short(e.url, 4096) &&
        e.reason === 'not-admitted-or-identity-mismatch',
    )
  )
    return false;
  const directorySha = await websiteTupleHash(websiteTupleBytes(doc));
  if (
    summary.directorySha256 !== directorySha ||
    summary.sequence !== value.sequence ||
    summary.commit !== source.dataCommit ||
    summary.observedAt !== value.observedAt ||
    summary.admissionPolicy !== 'website-restricted-link-only-v1' ||
    !record(summary.counts) ||
    !Object.values(summary.counts).every(integer) ||
    summary.counts.fullTextImported !== 0 ||
    !record(summary.reasons) ||
    !Object.values(summary.reasons).every(integer) ||
    !integer(summary.articleSourcePassPending) ||
    !Array.isArray(summary.directoryOnlyEndpointIds) ||
    !summary.directoryOnlyEndpointIds.every(
      (id) => typeof id === 'string' && /^source-[a-f0-9]{64}$/.test(id),
    ) ||
    !iso(summary.feedTime) ||
    !iso(summary.registerTime) ||
    (summary.newestArticleAt !== null && !iso(summary.newestArticleAt))
  )
    return false;
  const countKeys = [
    'feed',
    'feedSources',
    'registry',
    'included',
    'metadataLinkOnly',
    'fullTextImported',
    'directoryOnlySources',
    'metadataOnlySources',
    'excluded',
    'matchedSources',
    'pendingSources',
    'excludedSources',
    'directoryArticles',
    'directorySources',
  ];
  if (
    !exact(summary.counts, countKeys) ||
    summary.counts.directoryArticles !== doc.articles.length ||
    summary.counts.directorySources !== doc.sources.length ||
    report.schema !== 'wrn.website-content-parity.v1' ||
    report.sequence !== value.sequence ||
    report.directorySha256 !== directorySha ||
    !record(report.upstream) ||
    report.upstream.commit !== source.dataCommit ||
    report.upstream.observedAt !== value.observedAt ||
    report.upstream.admissionPolicy !== 'website-restricted-link-only-v1' ||
    !record(report.upstream.hashes) ||
    report.upstream.hashes.feed !== source.feedSha256 ||
    report.upstream.hashes.status !== source.statusSha256 ||
    report.upstream.hashes.registry !== source.registrySha256 ||
    report.upstream.hashes.sourcePass !== source.sourcePassSha256 ||
    report.upstream.hashes.revocations !== source.revocationsSha256 ||
    JSON.stringify(summary.counts) !== JSON.stringify(report.counts) ||
    !Array.isArray(report.articles) ||
    !Array.isArray(report.sources)
  )
    return false;
  const decisions = new Map<number, Record<string, unknown>>(),
    sourceDecisions = new Map<number, Record<string, unknown>>();
  for (const entry of report.articles) {
    if (
      !exact(entry, [
        'row',
        'upstreamRecordSha256',
        'id',
        'sourceIds',
        'importMode',
        'sourceAssociation',
        'status',
        'reason',
        'sourcePassStatus',
        'publishedAt',
        'editorialClassificationPending',
        'mediaExclusions',
      ]) ||
      !record(entry) ||
      !media(entry.mediaExclusions) ||
      !articleId(entry.id) ||
      !sourceIds(entry.sourceIds) ||
      !['exact-homepage', 'observed-origin-and-name-unverified'].includes(
        String(entry.sourceAssociation),
      ) ||
      !['matched-pass', 'pending-unverified'].includes(String(entry.sourcePassStatus)) ||
      !decisionReason(entry) ||
      (entry.publishedAt !== null && !iso(entry.publishedAt)) ||
      typeof entry.editorialClassificationPending !== 'boolean' ||
      !integer(entry.row) ||
      decisions.has(entry.row) ||
      !['excluded', 'metadata-link-only'].includes(String(entry.status))
    )
      return false;
    decisions.set(entry.row, entry);
  }
  for (const entry of report.sources) {
    if (
      !exact(entry, [
        'row',
        'upstreamRecordSha256',
        'id',
        'importMode',
        'observedImportMode',
        'status',
        'sourcePassId',
        'reason',
        'mediaExclusions',
      ]) ||
      !record(entry) ||
      !media(entry.mediaExclusions) ||
      !sourceId(entry.id) ||
      !short(entry.observedImportMode, 128) ||
      !(entry.sourcePassId === null || short(entry.sourcePassId, 256)) ||
      !decisionReason(entry) ||
      !integer(entry.row) ||
      sourceDecisions.has(entry.row) ||
      !['excluded', 'matched-pass', 'pending-unverified'].includes(String(entry.status))
    )
      return false;
    sourceDecisions.set(entry.row, entry);
  }
  if (decisions.size !== summary.counts.feed || sourceDecisions.size !== summary.counts.registry)
    return false;
  if (
    report.upstream.feedCount !== decisions.size ||
    report.upstream.registerCount !== sourceDecisions.size ||
    !Array.isArray(report.feedSources) ||
    report.feedSources.length !== summary.counts.feedSources ||
    report.feedSources.some(
      (s) =>
        !exact(s, [
          'observedName',
          'labelSha256',
          'rows',
          'sourceIds',
          'missingPassEndpointIds',
          'status',
          'missingProvenanceRows',
        ]),
    ) ||
    report.feedSources.some(
      (s) =>
        !record(s) ||
        !short(s.observedName, 300) ||
        !hex(s.labelSha256, 64) ||
        !Array.isArray(s.rows) ||
        !s.rows.every(integer) ||
        !sourceIds(s.sourceIds) ||
        !sourceIds(s.missingPassEndpointIds) ||
        !rowIds(s.missingProvenanceRows) ||
        !['pending-unverified', 'matched-pass'].includes(String(s.status)),
    ) ||
    report.feedSources
      .flatMap((s) => (s as Record<string, unknown>).rows as number[])
      .sort((a, b) => a - b)
      .some((row, i) => row !== i) ||
    report.feedSources.flatMap((s) => (s as Record<string, unknown>).rows as number[]).length !==
      decisions.size
  )
    return false;
  const articleRows = [...decisions.values()],
    sourceRows = [...sourceDecisions.values()];
  if (
    articleRows.some(
      (d, i) =>
        d.row !== i ||
        !hex(d.upstreamRecordSha256, 64) ||
        !['metadata-only', 'directory-only'].includes(String(d.importMode)),
    ) ||
    sourceRows.some(
      (d, i) =>
        d.row !== i ||
        !hex(d.upstreamRecordSha256, 64) ||
        !['metadata-only', 'directory-only'].includes(String(d.importMode)),
    )
  )
    return false;
  const included = articleRows.filter((d) => d.status !== 'excluded'),
    admittedSources = sourceRows.filter((d) => d.status !== 'excluded');
  const directoryOnly = admittedSources
    .filter((d) => d.importMode === 'directory-only')
    .map((d) => d.id)
    .sort();
  const countedReasons: Record<string, number> = {};
  for (const d of articleRows)
    if (typeof d.reason === 'string')
      countedReasons[d.reason] = (countedReasons[d.reason] ?? 0) + 1;
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  if (
    included.some((d) => d.importMode !== 'metadata-only') ||
    summary.counts.included !== included.length ||
    summary.counts.metadataLinkOnly !== included.length ||
    summary.counts.excluded !== articleRows.length - included.length ||
    summary.counts.pendingSources !==
      sourceRows.filter((d) => d.status === 'pending-unverified').length ||
    summary.counts.matchedSources !==
      sourceRows.filter((d) => d.status === 'matched-pass').length ||
    summary.counts.excludedSources !== sourceRows.length - admittedSources.length ||
    summary.counts.directoryOnlySources !== directoryOnly.length ||
    summary.counts.metadataOnlySources !== admittedSources.length - directoryOnly.length ||
    !same(summary.directoryOnlyEndpointIds, directoryOnly) ||
    !same(summary.reasons, countedReasons) ||
    summary.articleSourcePassPending !==
      included.filter((d) => d.sourcePassStatus === 'pending-unverified').length ||
    !same(report.commonArticleIds, included.map((d) => d.id).sort()) ||
    !same(report.commonSourceIds, admittedSources.map((d) => d.id).sort()) ||
    !same(
      report.missingArticleIds,
      articleRows.filter((d) => d.status === 'excluded').map((d) => d.id),
    ) ||
    !same(
      report.missingSourceIds,
      sourceRows.filter((d) => d.status === 'excluded').map((d) => d.id),
    ) ||
    report.feedTime !== summary.feedTime ||
    report.registerTime !== summary.registerTime ||
    report.newestArticleAt !== summary.newestArticleAt
  )
    return false;
  const actualArticles = doc.articles.flatMap((a) =>
    a.observations
      .filter((o) => o.provenance.dataset === 'github')
      .map((o) => ({ id: a.id, row: o.provenance.row })),
  );
  const actualSources = doc.sources.flatMap((a) =>
    a.observations
      .filter((o) => o.provenance.dataset === 'github')
      .map((o) => ({ id: a.id, row: o.provenance.row })),
  );
  if (
    actualArticles.length !== included.length ||
    included.some((d) => !actualArticles.some((a) => a.id === d.id && a.row === d.row)) ||
    actualSources.length !== admittedSources.length ||
    admittedSources.some((d) => !actualSources.some((a) => a.id === d.id && a.row === d.row))
  )
    return false;
  const current = new Map(doc.articles.filter((a) => !a.historical).map((a) => [a.id, a]));
  for (const a of current.values())
    for (const o of a.observations.filter((o) => o.provenance.dataset === 'github')) {
      const p = o.provenance,
        d = decisions.get(p.row);
      if (
        p.commit !== source.dataCommit ||
        p.path !== 'news-feed.json' ||
        p.inputSHA256 !== source.feedSha256 ||
        d?.id !== a.id ||
        d?.status !== 'metadata-link-only'
      )
        return false;
    }
  for (const a of doc.sources)
    for (const o of a.observations.filter((o) => o.provenance.dataset === 'github')) {
      const p = o.provenance,
        d = sourceDecisions.get(p.row);
      if (
        p.commit !== source.dataCommit ||
        p.path !== 'sources-registry.json' ||
        p.inputSHA256 !== source.registrySha256 ||
        d?.id !== a.id ||
        d?.status === 'excluded' ||
        !d
      )
        return false;
    }
  if (
    home.schema !== 'wrn.website-app-home-layout.v1' ||
    home.appFreeze !== source.appCommit ||
    home.directoryCommit !== source.dataCommit ||
    home.feedSha256 !== source.feedSha256 ||
    home.handoffSha256 !== source.handoffSha256 ||
    home.selectorSha256 !== source.selectorSha256 ||
    !ids(home.visibleIds) ||
    !home.visibleIds.every((id) => current.has(id)) ||
    !record(home.appTopics) ||
    !Object.entries(home.appTopics).every(
      ([id, topics]) =>
        (home.visibleIds as string[]).includes(id) &&
        Array.isArray(topics) &&
        topics.length <= 50 &&
        topics.every((t) => typeof t === 'string' && t.length <= 256),
    )
  )
    return false;
  const selected = new Set<string>();
  for (const [key, max] of [
    ['top', 5],
    ['sport', 3],
    ['more', 9],
    ['briefing', 5],
  ] as const) {
    const role = home[key];
    if (!ids(role, max)) return false;
    for (const id of role) {
      if (!(home.visibleIds as string[]).includes(id) || selected.has(id)) return false;
      selected.add(id);
    }
  }
  if (
    home.lead !== null &&
    (typeof home.lead !== 'string' ||
      !home.visibleIds.includes(home.lead) ||
      selected.has(home.lead))
  )
    return false;
  if (
    images.schema !== 'wrn.website-app-image-references.v1' ||
    images.appCommit !== source.appCommit ||
    images.dataCommit !== source.dataCommit ||
    images.feedSha256 !== source.feedSha256 ||
    images.handoffSha256 !== source.handoffSha256 ||
    images.rights !== 'existing-original-image-reference-only' ||
    images.imageBytesHosted !== false ||
    images.imageBytesOffline !== false ||
    !Array.isArray(images.entries) ||
    images.entries.length > 10000 ||
    !Array.isArray(images.origins) ||
    !Array.isArray(images.excluded)
  )
    return false;
  const imageIds = new Set<string>(),
    origins = new Set<string>();
  for (const entry of images.entries) {
    if (
      !exact(entry, [
        'articleId',
        'originalUrl',
        'originalTitle',
        'sourceName',
        'imageUrl',
        'sourceRow',
        'rightsMetadata',
      ]) ||
      !record(entry) ||
      typeof entry.articleId !== 'string' ||
      imageIds.has(entry.articleId) ||
      typeof entry.imageUrl !== 'string' ||
      entry.imageUrl.length > 4096 ||
      /[\x00-\x20\x7f]/.test(entry.imageUrl) ||
      !record(entry.rightsMetadata) ||
      !Object.entries(entry.rightsMetadata).every(
        ([k, v]) =>
          [
            'imageLicense',
            'imageRights',
            'imageCredit',
            'imageCopyright',
            'imageAttribution',
            'imageSource',
          ].includes(k) &&
          (v === null || short(v)),
      ) ||
      !integer(entry.sourceRow)
    )
      return false;
    const a = current.get(entry.articleId),
      decision = decisions.get(entry.sourceRow);
    if (
      !a ||
      decision?.id !== a.id ||
      decision.status !== 'metadata-link-only' ||
      entry.originalUrl !== a.url ||
      entry.originalTitle !== a.title ||
      entry.sourceName !== a.sourceName
    )
      return false;
    let u: URL;
    try {
      u = new URL(entry.imageUrl);
    } catch {
      return false;
    }
    if (
      u.protocol !== 'https:' ||
      u.username ||
      u.password ||
      u.hash ||
      !allowedImageOrigins.includes(u.origin)
    )
      return false;
    imageIds.add(entry.articleId);
    origins.add(u.origin);
  }
  if (
    !images.excluded.every(
      (e) => exact(e, ['row', 'reason']) && record(e) && integer(e.row) && short(e.reason, 128),
    )
  )
    return false;
  if (JSON.stringify([...origins].sort()) !== JSON.stringify([...images.origins].sort()))
    return false;
  return true;
}
