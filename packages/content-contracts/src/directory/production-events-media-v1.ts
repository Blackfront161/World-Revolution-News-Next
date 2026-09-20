import {
  directoryPlainText,
  normaliseDirectoryUrl,
} from '@wrn/content-contracts/mobile-content-directory-v1';

export const productionEventsMediaSchemaV1 = 'wrn.production-events-media.v1' as const;
export const productionEventsMediaMaxBytesV1 = 4 * 1024 * 1024;
export const productionEventsMediaInputPathsV1 = Object.freeze({
  events: 'events.json',
  videos: 'video-feed.json',
  episodes: 'podcasts.json',
  sources: 'podcast-sources.json',
});
export const productionEventsMediaCollectionLimitsV1 = Object.freeze({
  events: 6000,
  videos: 100,
  episodes: 1000,
  sources: 100,
});
type Collection = keyof typeof productionEventsMediaInputPathsV1;
const collections = Object.keys(productionEventsMediaInputPathsV1) as Collection[];
const sha = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
const id = (kind: string, value: unknown) =>
  typeof value === 'string' && new RegExp(`^wrn-${kind}-[a-f0-9]{64}$`, 'u').test(value);
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const exact = (value: unknown, keys: string[]): value is Record<string, unknown> =>
  record(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
const exactUrl = (value: unknown, keys: string[]): value is Record<string, unknown> =>
  exact(value, keys) ||
  exact(
    value,
    keys.filter((key) => key !== 'canonicalUrl'),
  );
const language = (value: unknown) =>
  value === 'und' ||
  (typeof value === 'string' &&
    value.length <= 35 &&
    /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u.test(value));
export function normaliseProductionEventsMediaInstant(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-](\d{2}):(\d{2}))$/u.exec(
      value,
    );
  if (!match) return null;
  if (
    Number(match[4]) > 23 ||
    Number(match[5]) > 59 ||
    Number(match[6]) > 59 ||
    Number(match[7] ?? 0) > 23 ||
    Number(match[8] ?? 0) > 59
  )
    return null;
  const year = Number(match[1]!);
  const month = Number(match[2]!);
  const day = Number(match[3]!);
  const calendar = new Date(0);
  calendar.setUTCFullYear(year, month - 1, day);
  if (
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() !== month - 1 ||
    calendar.getUTCDate() !== day
  )
    return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}
const instant = (value: unknown) => normaliseProductionEventsMediaInstant(value) !== null;
export const productionEventsMediaPlainText = directoryPlainText;
/** Reuses directory identity policy; historical HTTP remains explicit. */
export function normaliseProductionEventsMediaUrl(value: unknown): string | null {
  return normaliseDirectoryUrl(value, { allowHttp: true });
}
const canonical = (original: unknown, normalized: unknown) =>
  typeof original === 'string' &&
  (normalized === undefined
    ? normaliseProductionEventsMediaUrl(original) === original
    : typeof normalized === 'string' && normaliseProductionEventsMediaUrl(original) === normalized);
export function productionEventsMediaCanonicalUrl(value: {
  readonly originalUrl: string;
  readonly canonicalUrl?: string;
}): string {
  return value.canonicalUrl ?? normaliseProductionEventsMediaUrl(value.originalUrl)!;
}
const boundedText = (value: unknown, max = 500) => productionEventsMediaPlainText(value, max);
const count = (value: unknown, max: number): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= max;
const sameInstant = (normalized: unknown, original: unknown) =>
  typeof normalized === 'string' && normaliseProductionEventsMediaInstant(original) === normalized;

export type ProductionEventsMediaSnapshotV1 = {
  readonly repository: 'https://github.com/Blackfront161/World-Revolution-News-Website';
  readonly commit: string;
  readonly observedAt: string;
  readonly historical: true;
  readonly inputs: readonly {
    readonly ref: string;
    readonly path: string;
    readonly sha256: string;
  }[];
};
export interface ProductionEventsMediaObservationV1 {
  readonly provenanceRef: 'input-episodes';
  readonly row: number;
  readonly sourceId: string;
  readonly language: string;
  readonly languageReviewRequired: boolean;
}
export interface ProductionEventsMediaEventV1 {
  readonly id: string;
  readonly title: string;
  readonly sourceName: string;
  readonly originalUrl: string;
  readonly canonicalUrl?: string;
  readonly language: string;
  readonly startAt: string;
  readonly endAt: string | null;
  readonly sourceStartAt: string;
  readonly sourceEndAt: string | null;
  readonly timezone: string | null;
  readonly country: string | null;
  readonly city: string | null;
  readonly provenanceRef: 'input-events';
  readonly row: number;
}
export interface ProductionEventsMediaVideoV1 {
  readonly id: string;
  readonly title: string;
  readonly sourceName: string;
  readonly sourceId: string;
  readonly originalUrl: string;
  readonly canonicalUrl?: string;
  readonly language: string;
  readonly publishedAt: string;
  readonly sourcePublishedAt: string;
  readonly historicalAvailability: string | null;
  readonly provenanceRef: 'input-videos';
  readonly row: number;
}
export interface ProductionEventsMediaEpisodeV1 {
  readonly id: string;
  readonly title: string;
  readonly sourceName: string;
  readonly sourceId: string;
  readonly originalUrl: string;
  readonly canonicalUrl?: string;
  readonly language: string;
  readonly languageReviewRequired: boolean;
  readonly publishedAt: string;
  readonly sourcePublishedAt: string;
  readonly observationCount: number;
  readonly observations: readonly ProductionEventsMediaObservationV1[];
}
export interface ProductionEventsMediaPodcastSourceV1 {
  readonly id: string;
  readonly legacyId: string;
  readonly name: string;
  readonly originalUrl: string;
  readonly canonicalUrl?: string;
  readonly language: string;
  readonly country: string | null;
  readonly provenanceRef: 'input-sources';
  readonly row: number;
}
export interface ProductionEventsMediaReconciliationV1 {
  readonly input: Readonly<Record<'events' | 'videos' | 'episodes' | 'sources', number>>;
  readonly accepted: Readonly<Record<'events' | 'videos' | 'episodes' | 'sources', number>>;
  readonly rejected: readonly {
    readonly collection: 'events' | 'videos' | 'episodes' | 'sources';
    readonly row: number;
    readonly reason: string;
  }[];
  readonly rawEpisodeUrls: number;
  readonly deduplicatedEpisodes: number;
}
export type ProductionEventsMediaDocumentV1 = {
  readonly schema: typeof productionEventsMediaSchemaV1;
  readonly version: 1;
  readonly rights: 'metadata-only';
  readonly snapshot: ProductionEventsMediaSnapshotV1;
  readonly events: readonly ProductionEventsMediaEventV1[];
  readonly videos: readonly ProductionEventsMediaVideoV1[];
  readonly episodes: readonly ProductionEventsMediaEpisodeV1[];
  readonly sources: readonly ProductionEventsMediaPodcastSourceV1[];
  readonly reconciliation: ProductionEventsMediaReconciliationV1;
};

function source(value: unknown): boolean {
  return (
    exactUrl(value, [
      'id',
      'legacyId',
      'name',
      'originalUrl',
      'canonicalUrl',
      'language',
      'country',
      'provenanceRef',
      'row',
    ]) &&
    id('source', value.id) &&
    boundedText(value.legacyId, 160) &&
    boundedText(value.name) &&
    canonical(value.originalUrl, value.canonicalUrl) &&
    language(value.language) &&
    (value.country === null || boundedText(value.country, 80)) &&
    value.provenanceRef === 'input-sources' &&
    Number.isSafeInteger(value.row) &&
    (value.row as number) >= 0
  );
}
function event(value: unknown): boolean {
  return (
    exactUrl(value, [
      'id',
      'title',
      'sourceName',
      'originalUrl',
      'canonicalUrl',
      'language',
      'startAt',
      'endAt',
      'sourceStartAt',
      'sourceEndAt',
      'timezone',
      'country',
      'city',
      'provenanceRef',
      'row',
    ]) &&
    id('event', value.id) &&
    boundedText(value.title) &&
    boundedText(value.sourceName) &&
    canonical(value.originalUrl, value.canonicalUrl) &&
    language(value.language) &&
    sameInstant(value.startAt, value.sourceStartAt) &&
    (value.endAt === null
      ? value.sourceEndAt === null
      : sameInstant(value.endAt, value.sourceEndAt) &&
        Date.parse(value.endAt as string) >= Date.parse(value.startAt as string)) &&
    (value.timezone === null || boundedText(value.timezone, 80)) &&
    (value.country === null || boundedText(value.country, 80)) &&
    (value.city === null || boundedText(value.city, 160)) &&
    value.provenanceRef === 'input-events' &&
    count(value.row, productionEventsMediaCollectionLimitsV1.events - 1)
  );
}
function video(value: unknown): boolean {
  return (
    exactUrl(value, [
      'id',
      'title',
      'sourceName',
      'sourceId',
      'originalUrl',
      'canonicalUrl',
      'language',
      'publishedAt',
      'sourcePublishedAt',
      'historicalAvailability',
      'provenanceRef',
      'row',
    ]) &&
    id('video', value.id) &&
    boundedText(value.title) &&
    boundedText(value.sourceName) &&
    boundedText(value.sourceId, 160) &&
    canonical(value.originalUrl, value.canonicalUrl) &&
    language(value.language) &&
    sameInstant(value.publishedAt, value.sourcePublishedAt) &&
    (value.historicalAvailability === null || boundedText(value.historicalAvailability, 80)) &&
    value.provenanceRef === 'input-videos' &&
    count(value.row, productionEventsMediaCollectionLimitsV1.videos - 1)
  );
}
function episode(value: unknown): boolean {
  return (
    exactUrl(value, [
      'id',
      'title',
      'sourceName',
      'sourceId',
      'originalUrl',
      'canonicalUrl',
      'language',
      'languageReviewRequired',
      'publishedAt',
      'sourcePublishedAt',
      'observationCount',
      'observations',
    ]) &&
    id('episode', value.id) &&
    boundedText(value.title) &&
    boundedText(value.sourceName) &&
    boundedText(value.sourceId, 160) &&
    canonical(value.originalUrl, value.canonicalUrl) &&
    language(value.language) &&
    typeof value.languageReviewRequired === 'boolean' &&
    sameInstant(value.publishedAt, value.sourcePublishedAt) &&
    Number.isSafeInteger(value.observationCount) &&
    value.observationCount ===
      (Array.isArray(value.observations) ? value.observations.length : -1) &&
    Array.isArray(value.observations) &&
    value.observations.length > 0 &&
    value.observations.length <= 100 &&
    value.observations.every(
      (observation) =>
        exact(observation, [
          'provenanceRef',
          'row',
          'sourceId',
          'language',
          'languageReviewRequired',
        ]) &&
        observation.provenanceRef === 'input-episodes' &&
        count(observation.row, productionEventsMediaCollectionLimitsV1.episodes - 1) &&
        boundedText(observation.sourceId, 160) &&
        language(observation.language) &&
        typeof observation.languageReviewRequired === 'boolean',
    )
  );
}

export function validateProductionEventsMediaV1(
  value: unknown,
): value is ProductionEventsMediaDocumentV1 {
  if (
    !exact(value, [
      'schema',
      'version',
      'rights',
      'snapshot',
      'events',
      'videos',
      'episodes',
      'sources',
      'reconciliation',
    ]) ||
    value.schema !== productionEventsMediaSchemaV1 ||
    value.version !== 1 ||
    value.rights !== 'metadata-only' ||
    !record(value.snapshot) ||
    !Array.isArray(value.events) ||
    !Array.isArray(value.videos) ||
    !Array.isArray(value.episodes) ||
    !Array.isArray(value.sources) ||
    !record(value.reconciliation)
  )
    return false;
  const snapshot = value.snapshot;
  if (
    !exact(snapshot, ['repository', 'commit', 'observedAt', 'historical', 'inputs']) ||
    snapshot.repository !== 'https://github.com/Blackfront161/World-Revolution-News-Website' ||
    !/^[a-f0-9]{40}$/u.test(String(snapshot.commit)) ||
    !instant(snapshot.observedAt) ||
    snapshot.historical !== true ||
    !Array.isArray(snapshot.inputs) ||
    snapshot.inputs.length !== 4 ||
    !snapshot.inputs.every(
      (input) =>
        exact(input, ['ref', 'path', 'sha256']) &&
        collections.some(
          (key) =>
            input.ref === `input-${key}` && input.path === productionEventsMediaInputPathsV1[key],
        ) &&
        sha(input.sha256),
    ) ||
    new Set(snapshot.inputs.map((input) => input.ref)).size !== 4
  )
    return false;
  const unique = (rows: readonly Record<string, unknown>[]) =>
    new Set(rows.map((row) => row.id)).size === rows.length;
  return (
    value.events.length <= 6000 &&
    value.videos.length <= 100 &&
    value.episodes.length <= 1000 &&
    value.sources.length <= 100 &&
    value.events.every(event) &&
    value.videos.every(video) &&
    value.episodes.every(episode) &&
    value.sources.every(source) &&
    unique(value.events) &&
    unique(value.videos) &&
    unique(value.episodes) &&
    unique(value.sources) &&
    reconcile(value as unknown as ProductionEventsMediaDocumentV1) &&
    new TextEncoder().encode(JSON.stringify(value)).byteLength <= productionEventsMediaMaxBytesV1
  );
}

function reconcile(document: ProductionEventsMediaDocumentV1): boolean {
  const value = document.reconciliation;
  if (
    !exact(value, ['input', 'accepted', 'rejected', 'rawEpisodeUrls', 'deduplicatedEpisodes']) ||
    !exact(value.input, collections) ||
    !exact(value.accepted, collections) ||
    !collections.every(
      (key) =>
        count(value.input[key], productionEventsMediaCollectionLimitsV1[key]) &&
        count(value.accepted[key], value.input[key]),
    ) ||
    !Array.isArray(value.rejected) ||
    value.rejected.length > 7200 ||
    !count(value.rawEpisodeUrls, value.input.episodes) ||
    value.rawEpisodeUrls < document.episodes.length ||
    value.deduplicatedEpisodes !== document.episodes.length
  )
    return false;
  const seen: Record<Collection, Set<number>> = {
    events: new Set(),
    videos: new Set(),
    episodes: new Set(),
    sources: new Set(),
  };
  const add = (key: Collection, row: number) => {
    if (!count(row, value.input[key] - 1) || seen[key].has(row)) return false;
    seen[key].add(row);
    return true;
  };
  for (const key of ['events', 'videos', 'sources'] as const) {
    if (
      value.accepted[key] !== document[key].length ||
      !document[key].every((entry) => add(key, entry.row))
    )
      return false;
  }
  const sourceIds = new Set(document.sources.map((entry) => entry.legacyId));
  if (sourceIds.size !== document.sources.length) return false;
  for (const entry of document.episodes) {
    if (
      !entry.observations.every((item) => add('episodes', item.row) && sourceIds.has(item.sourceId))
    )
      return false;
    const languages = new Set(entry.observations.map((item) => item.language));
    const first = entry.observations[0]!;
    if (
      entry.sourceId !== first.sourceId ||
      entry.language !== (languages.size === 1 ? first.language : 'und') ||
      entry.languageReviewRequired !==
        (languages.size > 1 || entry.observations.some((item) => item.languageReviewRequired))
    )
      return false;
  }
  if (value.accepted.episodes !== seen.episodes.size) return false;
  for (const item of value.rejected) {
    if (!exact(item, ['collection', 'row', 'reason'])) return false;
    const key = collections.find((key) => key === item.collection);
    if (
      !key ||
      typeof item.row !== 'number' ||
      typeof item.reason !== 'string' ||
      ![
        'invalid-url',
        'invalid-date',
        'invalid-metadata',
        'unknown-source',
        'duplicate-identity',
      ].includes(item.reason) ||
      !add(key, item.row)
    )
      return false;
  }
  return collections.every((key) => seen[key].size === value.input[key]);
}
