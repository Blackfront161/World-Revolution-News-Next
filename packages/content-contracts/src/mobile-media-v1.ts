import { utf8ByteLength } from './index.js';

export const mobileMediaContractVersion = '1.0.0' as const;
export const mobileMediaReleaseSchema = 'wrn.mobile-media-release.v1' as const;
export const mobileMediaDocumentClasses = [
  'manifest',
  'admission',
  'rights',
  'consent',
  'lifecycle',
  'revocation',
] as const;
export const mobileMediaLocales = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const;
export const mobileMediaRuntimePaths = Object.freeze({
  release: '/wrn-mobile-media/v1/mobile-media-release.json',
  manifest: '/wrn-mobile-media/v1/media-manifest.json',
  admission: '/wrn-mobile-media/v1/media-admission.json',
  rights: '/wrn-mobile-media/v1/media-rights.json',
  consent: '/wrn-mobile-media/v1/media-consent.json',
  lifecycle: '/wrn-mobile-media/v1/media-lifecycle.json',
  revocation: '/wrn-mobile-media/v1/media-revocation.json',
  audio: '/wrn-mobile-media/v1/episode-local.wav',
  thumbnail: '/wrn-mobile-media/v1/episode-local.png',
  transcript: '/wrn-mobile-media/v1/episode-local.txt',
});
export const mobileMediaCaps = Object.freeze({
  json: 524288,
  totalJson: 524288,
  sources: 32,
  series: 8,
  episodes: 32,
  assets: 64,
  audio: 262144,
  thumbnail: 131072,
  transcript: 32768,
  aggregate: 425984,
  dimensions: 2048,
  pixels: 4194304,
  safetyBytes: 65536,
  safetyEntries: 512,
  id: 128,
  slots: 3,
});

export type MediaDocumentClass = (typeof mobileMediaDocumentClasses)[number];
type JsonRecord = Record<string, unknown>;
type LocalizedText = Record<(typeof mobileMediaLocales)[number], string>;
type Descriptor = {
  documentClass: MediaDocumentClass;
  path: string;
  schema: string;
  contractVersion: typeof mobileMediaContractVersion;
  revision: number;
  bytes: number;
  sha256: string;
  recordCount: number;
  compatibility: {
    minReaderContract: typeof mobileMediaContractVersion;
    maxReaderContract: typeof mobileMediaContractVersion;
  };
};
export type MobileMediaReleaseV1 = Readonly<{
  schema: typeof mobileMediaReleaseSchema;
  contractVersion: typeof mobileMediaContractVersion;
  releaseId: string;
  revision: number;
  generatedAt: string;
  validUntil: string;
  owner: string;
  revocationFloor: number;
  documents: readonly Descriptor[];
}>;
type Series = { id: string; sourceId: string; title: LocalizedText; episodeIds: readonly string[] };
type Episode = {
  id: string;
  seriesId: string;
  sourceId: string;
  title: LocalizedText;
  summary: LocalizedText;
  audioAssetId: string;
  thumbnailAssetId: string | null;
  transcriptAssetId: string | null;
  durationMs: number;
};
type Asset = {
  id: string;
  kind: 'audio' | 'thumbnail' | 'transcript';
  path: string;
  mime: string;
  bytes: number;
  sha256: string;
  width: number | null;
  height: number | null;
};
type Source = {
  id: string;
  displayName: LocalizedText;
  selfDescription: LocalizedText;
  editorialDescription: LocalizedText;
  language: (typeof mobileMediaLocales)[number];
  region: string;
  healthAt: string;
  healthStatus: 'ok';
  deliveryClass: 'admitted-local-fixture';
  admissionRevision: number;
  validFrom: string;
  validUntil: string;
  owner: string;
  correctionContact: string;
};
type IdentityLink = { kind: 'alias' | 'successor'; sourceId: string; targetId: string };
type Right = {
  assetId: string;
  assetHash: string;
  status: 'allowed';
  license: 'WRN-self-authored-fixture';
  attribution: string;
  territory: 'global';
  offlineAllowed: true;
  cacheAllowed: true;
  expiresAt: string;
  provenance: string;
  correctionContact: string;
};
type Consent = {
  episodeId: string;
  deliveryClass: 'packaged-local-audio';
  origin: 'same-origin-local';
  dataCategories: readonly [];
  mode: 'local-no-third-party';
  requiresPrompt: false;
};
type SafetyKind = 'source' | 'series' | 'episode' | 'asset';
type SafetyReference = { kind: SafetyKind; id: string };
type SafetyEntry = {
  targetKind: SafetyKind;
  targetId: string;
  targetHash: string | null;
  status: 'blocked' | 'gone' | 'replaced';
  replacementKind: SafetyKind | null;
  replacementId: string | null;
};
type ManifestDocument = JsonRecord & {
  series: readonly Series[];
  episodes: readonly Episode[];
  assets: readonly Asset[];
};
type AdmissionDocument = JsonRecord & {
  sources: readonly Source[];
  identityLinks: readonly IdentityLink[];
};
type RightsDocument = JsonRecord & { rights: readonly Right[] };
type ConsentDocument = JsonRecord & { consents: readonly Consent[] };
type LifecycleDocument = JsonRecord & { lifecycle: JsonRecord };
type RevocationDocument = JsonRecord & {
  safetyRevision: number;
  revocationFloor: number;
  references: readonly SafetyReference[];
  entries: readonly SafetyEntry[];
};
type MobileMediaDocuments = {
  manifest: ManifestDocument;
  admission: AdmissionDocument;
  rights: RightsDocument;
  consent: ConsentDocument;
  lifecycle: LifecycleDocument;
  revocation: RevocationDocument;
};
export type MobileMediaCandidate = Readonly<{
  release: MobileMediaReleaseV1;
  documents: Readonly<MobileMediaDocuments>;
  raw: Readonly<Partial<Record<MediaDocumentClass, string>>>;
}>;
export type MobileMediaClock = () => number;

const id = /^wrn-media-(release|source|series|episode|asset)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hash = /^[a-f0-9]{64}$/;
const utc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const controlOrMarkup = (value: string) =>
  [...value].some((character) => {
    const point = character.codePointAt(0) ?? 0;
    return (
      point <= 0x1f || (point >= 0x7f && point <= 0x9f) || character === '<' || character === '>'
    );
  });
const hasMarkupSyntax = (value: string) =>
  ['[', ']', '`', '*', '_', '#'].some((character) => value.includes(character));
const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const exact = (value: unknown, keys: readonly string[]): value is JsonRecord =>
  isRecord(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key, index) => Object.keys(value)[index] === key);
const records = (value: unknown): JsonRecord[] | null =>
  Array.isArray(value) && value.every(isRecord) ? value : null;
const positive = (value: unknown, max = Number.MAX_SAFE_INTEGER): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= max;
const count = (value: unknown, max = Number.MAX_SAFE_INTEGER): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max;
const plainText = (value: unknown, max = 512): value is string =>
  typeof value === 'string' &&
  value === value.normalize('NFC') &&
  utf8ByteLength(value) >= 1 &&
  utf8ByteLength(value) <= max &&
  !controlOrMarkup(value) &&
  !hasMarkupSyntax(value) &&
  !/[\ud800-\udfff]/u.test(value);
const time = (value: unknown): value is string =>
  typeof value === 'string' &&
  utc.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
const clockNow = (clock: MobileMediaClock): number | null => {
  const value = clock();
  return Number.isSafeInteger(value) && Number.isFinite(value) ? value : null;
};
const isCurrentRelease = (release: MobileMediaReleaseV1, now: number): boolean => {
  const generatedAt = Date.parse(release.generatedAt);
  const validUntil = Date.parse(release.validUntil);
  return generatedAt <= now && now < validUntil && validUntil - generatedAt <= 604800000;
};
const sorted = (values: readonly unknown[], key: (value: unknown) => string): boolean => {
  let previous: string | null = null;
  for (const value of values) {
    const current = key(value);
    if (previous !== null && previous >= current) return false;
    previous = current;
  }
  return true;
};
const localText = (value: unknown, max = 512): value is LocalizedText =>
  exact(value, mobileMediaLocales) &&
  mobileMediaLocales.every((locale) => plainText(value[locale], max));
const docSchema = (kind: MediaDocumentClass) => `wrn.mobile-media-${kind}.v1`;
const rootKeys = (payload: readonly string[]) => [
  'schema',
  'contractVersion',
  'releaseId',
  'revision',
  'generatedAt',
  'validUntil',
  'owner',
  ...payload,
];
const idOf = (value: unknown, kind?: string): value is string =>
  typeof value === 'string' &&
  utf8ByteLength(value) <= mobileMediaCaps.id &&
  id.test(value) &&
  (kind === undefined || value.startsWith(`wrn-media-${kind}-`));
const owner = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) &&
  utf8ByteLength(value) <= 128;
const sha = (value: unknown): value is string => typeof value === 'string' && hash.test(value);
const assetPath = (kind: unknown, path: unknown, mime: unknown): boolean =>
  (kind === 'audio' && path === mobileMediaRuntimePaths.audio && mime === 'audio/wav') ||
  (kind === 'thumbnail' && path === mobileMediaRuntimePaths.thumbnail && mime === 'image/png') ||
  (kind === 'transcript' &&
    path === mobileMediaRuntimePaths.transcript &&
    mime === 'text/plain;charset=utf-8');
const common = (value: JsonRecord, kind: MediaDocumentClass, payload: readonly string[]): boolean =>
  exact(value, rootKeys(payload)) &&
  value.schema === docSchema(kind) &&
  value.contractVersion === mobileMediaContractVersion &&
  idOf(value.releaseId, 'release') &&
  positive(value.revision) &&
  time(value.generatedAt) &&
  time(value.validUntil) &&
  Date.parse(value.generatedAt) < Date.parse(value.validUntil) &&
  owner(value.owner);
const recordId = (value: unknown, key: string): string =>
  isRecord(value) && typeof value[key] === 'string' ? value[key] : '';

export function mediaDocumentClassForPath(path: string): MediaDocumentClass | null {
  for (const kind of mobileMediaDocumentClasses)
    if (path === mobileMediaRuntimePaths[kind]) return kind;
  return null;
}
export function isMobileMediaRuntimePath(path: unknown): path is string {
  return typeof path === 'string' && Object.values(mobileMediaRuntimePaths).includes(path as never);
}
export function isMobileMediaJsonContentType(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    /^application\/json(?:[ \t]*;[ \t]*charset[ \t]*=[ \t]*utf-8)?$/i.test(value)
  );
}
export function hasMobileMediaJsonByteCap(
  raw: string,
  cap: number = mobileMediaCaps.json,
): boolean {
  return (
    typeof raw === 'string' && Number.isSafeInteger(cap) && cap >= 0 && utf8ByteLength(raw) <= cap
  );
}
function isDescriptor(
  value: unknown,
  expected: MediaDocumentClass,
  revision: number,
): value is Descriptor {
  return (
    exact(value, [
      'documentClass',
      'path',
      'schema',
      'contractVersion',
      'revision',
      'bytes',
      'sha256',
      'recordCount',
      'compatibility',
    ]) &&
    value.documentClass === expected &&
    value.path === mobileMediaRuntimePaths[expected] &&
    value.schema === docSchema(expected) &&
    value.contractVersion === mobileMediaContractVersion &&
    value.revision === revision &&
    positive(value.bytes, mobileMediaCaps.json) &&
    sha(value.sha256) &&
    count(value.recordCount) &&
    exact(value.compatibility, ['minReaderContract', 'maxReaderContract']) &&
    value.compatibility.minReaderContract === mobileMediaContractVersion &&
    value.compatibility.maxReaderContract === mobileMediaContractVersion
  );
}
export function validateMobileMediaRelease(value: unknown): value is MobileMediaReleaseV1 {
  if (
    !exact(value, [
      'schema',
      'contractVersion',
      'releaseId',
      'revision',
      'generatedAt',
      'validUntil',
      'owner',
      'revocationFloor',
      'documents',
    ])
  )
    return false;
  if (
    value.schema !== mobileMediaReleaseSchema ||
    value.contractVersion !== mobileMediaContractVersion ||
    !idOf(value.releaseId, 'release') ||
    !positive(value.revision) ||
    !time(value.generatedAt) ||
    !time(value.validUntil) ||
    Date.parse(value.generatedAt) >= Date.parse(value.validUntil) ||
    !owner(value.owner) ||
    !positive(value.revocationFloor) ||
    !Array.isArray(value.documents) ||
    value.documents.length !== mobileMediaDocumentClasses.length
  )
    return false;
  const revision = value.revision;
  return value.documents.every((descriptor, index) =>
    isDescriptor(descriptor, mobileMediaDocumentClasses[index]!, revision),
  );
}

function isSeries(value: unknown): value is Series {
  return (
    exact(value, ['id', 'sourceId', 'title', 'episodeIds']) &&
    idOf(value.id, 'series') &&
    idOf(value.sourceId, 'source') &&
    localText(value.title) &&
    Array.isArray(value.episodeIds) &&
    value.episodeIds.length > 0 &&
    value.episodeIds.every((episodeId) => idOf(episodeId, 'episode')) &&
    sorted(value.episodeIds, (episodeId) => String(episodeId))
  );
}
function isEpisode(value: unknown): value is Episode {
  return (
    exact(value, [
      'id',
      'seriesId',
      'sourceId',
      'title',
      'summary',
      'audioAssetId',
      'thumbnailAssetId',
      'transcriptAssetId',
      'durationMs',
    ]) &&
    idOf(value.id, 'episode') &&
    idOf(value.seriesId, 'series') &&
    idOf(value.sourceId, 'source') &&
    localText(value.title) &&
    localText(value.summary, 2048) &&
    idOf(value.audioAssetId, 'asset') &&
    (value.thumbnailAssetId === null || idOf(value.thumbnailAssetId, 'asset')) &&
    (value.transcriptAssetId === null || idOf(value.transcriptAssetId, 'asset')) &&
    positive(value.durationMs, 60000)
  );
}
function isAsset(value: unknown): value is Asset {
  if (
    !exact(value, ['id', 'kind', 'path', 'mime', 'bytes', 'sha256', 'width', 'height']) ||
    !idOf(value.id, 'asset') ||
    !['audio', 'thumbnail', 'transcript'].includes(String(value.kind)) ||
    !assetPath(value.kind, value.path, value.mime) ||
    !sha(value.sha256)
  )
    return false;
  const cap =
    value.kind === 'audio'
      ? mobileMediaCaps.audio
      : value.kind === 'thumbnail'
        ? mobileMediaCaps.thumbnail
        : mobileMediaCaps.transcript;
  if (!positive(value.bytes, cap)) return false;
  return value.kind === 'thumbnail'
    ? positive(value.width, mobileMediaCaps.dimensions) &&
        positive(value.height, mobileMediaCaps.dimensions) &&
        value.width * value.height <= mobileMediaCaps.pixels
    : value.width === null && value.height === null;
}
function isManifest(value: unknown): value is ManifestDocument {
  if (!isRecord(value) || !common(value, 'manifest', ['series', 'episodes', 'assets']))
    return false;
  const series = records(value.series),
    episodes = records(value.episodes),
    assets = records(value.assets);
  if (
    !series ||
    !episodes ||
    !assets ||
    series.length > mobileMediaCaps.series ||
    episodes.length > mobileMediaCaps.episodes ||
    assets.length > mobileMediaCaps.assets ||
    !series.every(isSeries) ||
    !episodes.every(isEpisode) ||
    !assets.every(isAsset) ||
    !sorted(series, (item) => recordId(item, 'id')) ||
    !sorted(episodes, (item) => recordId(item, 'id')) ||
    !sorted(assets, (item) => recordId(item, 'id'))
  )
    return false;
  const seriesIds = new Set(series.map((item) => item.id));
  const episodeIds = new Set(episodes.map((item) => item.id));
  const assetsById = new Map(assets.map((item): [string, Asset] => [item.id, item]));
  if (
    series.some((item) => !item.episodeIds.every((episodeId) => episodeIds.has(episodeId))) ||
    episodes.some((item) => !seriesIds.has(item.seriesId))
  )
    return false;
  if (
    episodes.some((item) => {
      const audio = assetsById.get(item.audioAssetId);
      const thumbnail =
        item.thumbnailAssetId === null ? null : assetsById.get(item.thumbnailAssetId);
      const transcript =
        item.transcriptAssetId === null ? null : assetsById.get(item.transcriptAssetId);
      return (
        !audio ||
        audio.kind !== 'audio' ||
        (thumbnail !== null && thumbnail?.kind !== 'thumbnail') ||
        (transcript !== null && transcript?.kind !== 'transcript') ||
        audio.bytes + (thumbnail?.bytes ?? 0) + (transcript?.bytes ?? 0) > mobileMediaCaps.aggregate
      );
    })
  )
    return false;
  const referencedAssetIds = new Set(
    episodes.flatMap((item) =>
      [item.audioAssetId, item.thumbnailAssetId, item.transcriptAssetId].filter(
        (assetId): assetId is string => assetId !== null,
      ),
    ),
  );
  if (
    referencedAssetIds.size !== assetsById.size ||
    [...referencedAssetIds].some((assetId) => !assetsById.has(assetId))
  )
    return false;
  return series.every(
    (item) =>
      item.episodeIds.length ===
        episodes.filter((episode) => episode.seriesId === item.id).length &&
      item.episodeIds.every(
        (episodeId) =>
          episodes.find((episode) => episode.id === episodeId)?.sourceId === item.sourceId,
      ),
  );
}
function isSource(value: unknown): value is Source {
  return (
    exact(value, [
      'id',
      'displayName',
      'selfDescription',
      'editorialDescription',
      'language',
      'region',
      'healthAt',
      'healthStatus',
      'deliveryClass',
      'admissionRevision',
      'validFrom',
      'validUntil',
      'owner',
      'correctionContact',
    ]) &&
    idOf(value.id, 'source') &&
    localText(value.displayName) &&
    localText(value.selfDescription, 2048) &&
    localText(value.editorialDescription, 2048) &&
    mobileMediaLocales.includes(value.language as (typeof mobileMediaLocales)[number]) &&
    plainText(value.region) &&
    time(value.healthAt) &&
    value.healthStatus === 'ok' &&
    value.deliveryClass === 'admitted-local-fixture' &&
    positive(value.admissionRevision) &&
    time(value.validFrom) &&
    time(value.validUntil) &&
    owner(value.owner) &&
    plainText(value.correctionContact)
  );
}
function isIdentityLink(value: unknown): value is IdentityLink {
  return (
    exact(value, ['kind', 'sourceId', 'targetId']) &&
    (value.kind === 'alias' || value.kind === 'successor') &&
    idOf(value.sourceId, 'source') &&
    idOf(value.targetId, 'source') &&
    value.sourceId !== value.targetId
  );
}
function graphIsAcyclic(links: readonly IdentityLink[], kind: IdentityLink['kind']): boolean {
  const graph = new Map(
    links
      .filter((link) => link.kind === kind)
      .map((link): [string, string] => [link.sourceId, link.targetId]),
  );
  for (const start of graph.keys()) {
    const seen = new Set<string>();
    let cursor: string | undefined = start;
    while (cursor !== undefined) {
      if (seen.has(cursor)) return false;
      seen.add(cursor);
      cursor = graph.get(cursor);
    }
  }
  return true;
}
function isAdmission(value: unknown): value is AdmissionDocument {
  if (!isRecord(value) || !common(value, 'admission', ['sources', 'identityLinks'])) return false;
  const sources = records(value.sources),
    links = records(value.identityLinks);
  if (
    !sources ||
    !links ||
    sources.length > mobileMediaCaps.sources ||
    !sources.every(isSource) ||
    !links.every(isIdentityLink) ||
    !sorted(sources, (item) => recordId(item, 'id')) ||
    !sorted(
      links,
      (item) =>
        `${recordId(item, 'kind')}\0${recordId(item, 'sourceId')}\0${recordId(item, 'targetId')}`,
    )
  )
    return false;
  const sourceIds = new Set(sources.map((source) => source.id));
  const identityKeys = new Set(links.map((link) => `${link.kind}\0${link.sourceId}`));
  const generatedAt = Date.parse(value.generatedAt as string);
  return (
    identityKeys.size === links.length &&
    sources.every(
      (source) =>
        Date.parse(source.healthAt) <= generatedAt &&
        generatedAt - Date.parse(source.healthAt) <= 86400000 &&
        Date.parse(source.validFrom) <= generatedAt,
    ) &&
    links.every((link) => sourceIds.has(link.sourceId) && sourceIds.has(link.targetId)) &&
    graphIsAcyclic(links, 'alias') &&
    graphIsAcyclic(links, 'successor')
  );
}
function isRight(value: unknown): value is Right {
  return (
    exact(value, [
      'assetId',
      'assetHash',
      'status',
      'license',
      'attribution',
      'territory',
      'offlineAllowed',
      'cacheAllowed',
      'expiresAt',
      'provenance',
      'correctionContact',
    ]) &&
    idOf(value.assetId, 'asset') &&
    sha(value.assetHash) &&
    value.status === 'allowed' &&
    value.license === 'WRN-self-authored-fixture' &&
    plainText(value.attribution) &&
    value.territory === 'global' &&
    value.offlineAllowed === true &&
    value.cacheAllowed === true &&
    time(value.expiresAt) &&
    plainText(value.provenance) &&
    plainText(value.correctionContact)
  );
}
function isRights(value: unknown): value is RightsDocument {
  if (!isRecord(value) || !common(value, 'rights', ['rights'])) return false;
  const rights = records(value.rights);
  return (
    rights !== null &&
    rights.length <= mobileMediaCaps.assets &&
    rights.every(isRight) &&
    sorted(rights, (item) => recordId(item, 'assetId'))
  );
}
function isConsent(value: unknown): value is Consent {
  return (
    exact(value, [
      'episodeId',
      'deliveryClass',
      'origin',
      'dataCategories',
      'mode',
      'requiresPrompt',
    ]) &&
    idOf(value.episodeId, 'episode') &&
    value.deliveryClass === 'packaged-local-audio' &&
    value.origin === 'same-origin-local' &&
    Array.isArray(value.dataCategories) &&
    value.dataCategories.length === 0 &&
    value.mode === 'local-no-third-party' &&
    value.requiresPrompt === false
  );
}
function isConsentDocument(value: unknown): value is ConsentDocument {
  if (!isRecord(value) || !common(value, 'consent', ['consents'])) return false;
  const consents = records(value.consents);
  return (
    consents !== null &&
    consents.every(isConsent) &&
    sorted(consents, (item) => recordId(item, 'episodeId'))
  );
}

export const mobileMediaPlaybackTransitions = Object.freeze([
  { from: 'idle', event: 'user-play', to: 'loading' },
  { from: 'loading', event: 'decoder-ready', to: 'playing' },
  { from: 'loading', event: 'failure', to: 'error' },
  { from: 'playing', event: 'user-pause', to: 'paused' },
  { from: 'paused', event: 'user-play', to: 'playing' },
  { from: 'playing', event: 'media-ended', to: 'ended' },
  { from: 'ended', event: 'user-play', to: 'loading' },
  { from: 'error', event: 'user-reset', to: 'idle' },
] as const);
export const mobileMediaAvailabilityTransitions = Object.freeze([
  { from: 'online', event: 'network-lost', to: 'offline' },
  { from: 'offline', event: 'network-restored', to: 'online' },
  { from: 'online', event: 'freshness-expired', to: 'stale' },
  { from: 'offline', event: 'freshness-expired', to: 'stale' },
  { from: 'local', event: 'freshness-expired', to: 'stale' },
  { from: 'local', event: 'safety-block', to: 'blocked' },
  { from: 'online', event: 'safety-block', to: 'blocked' },
  { from: 'offline', event: 'safety-block', to: 'blocked' },
  { from: 'stale', event: 'safety-block', to: 'blocked' },
] as const);
const dominanceRules = [
  {
    availability: 'local',
    stopPlayback: false,
    detachDecoder: false,
    allowNewStart: true,
    allowResumeWrite: true,
  },
  {
    availability: 'online',
    stopPlayback: false,
    detachDecoder: false,
    allowNewStart: true,
    allowResumeWrite: true,
  },
  {
    availability: 'offline',
    stopPlayback: false,
    detachDecoder: false,
    allowNewStart: false,
    allowResumeWrite: true,
  },
  {
    availability: 'stale',
    stopPlayback: true,
    detachDecoder: true,
    allowNewStart: false,
    allowResumeWrite: false,
  },
  {
    availability: 'blocked',
    stopPlayback: true,
    detachDecoder: true,
    allowNewStart: false,
    allowResumeWrite: false,
  },
] as const;
const same = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);
function isLifecycle(value: unknown): value is LifecycleDocument {
  return (
    isRecord(value) &&
    common(value, 'lifecycle', ['lifecycle']) &&
    isRecord(value.lifecycle) &&
    exact(value.lifecycle, [
      'playbackStates',
      'availabilityStates',
      'playbackTransitions',
      'availabilityTransitions',
      'dominanceRules',
    ]) &&
    same(value.lifecycle.playbackStates, [
      'idle',
      'loading',
      'ready',
      'playing',
      'paused',
      'ended',
      'error',
    ]) &&
    same(value.lifecycle.availabilityStates, ['local', 'online', 'offline', 'stale', 'blocked']) &&
    same(value.lifecycle.playbackTransitions, mobileMediaPlaybackTransitions) &&
    same(value.lifecycle.availabilityTransitions, mobileMediaAvailabilityTransitions) &&
    same(value.lifecycle.dominanceRules, dominanceRules)
  );
}
const safetyKinds: readonly SafetyKind[] = ['source', 'series', 'episode', 'asset'];
const isSafetyReference = (value: unknown): value is SafetyReference =>
  exact(value, ['kind', 'id']) &&
  safetyKinds.includes(value.kind as SafetyKind) &&
  idOf(value.id, value.kind as string);
function isSafetyEntry(value: unknown): value is SafetyEntry {
  if (
    !exact(value, [
      'targetKind',
      'targetId',
      'targetHash',
      'status',
      'replacementKind',
      'replacementId',
    ]) ||
    !safetyKinds.includes(value.targetKind as SafetyKind) ||
    !idOf(value.targetId, value.targetKind as string) ||
    (value.targetKind === 'asset' ? !sha(value.targetHash) : value.targetHash !== null) ||
    !['blocked', 'gone', 'replaced'].includes(String(value.status))
  )
    return false;
  if (value.status !== 'replaced')
    return value.replacementKind === null && value.replacementId === null;
  return (
    safetyKinds.includes(value.replacementKind as SafetyKind) &&
    value.replacementKind === value.targetKind &&
    idOf(value.replacementId, value.replacementKind as string) &&
    value.replacementId !== value.targetId
  );
}
function isRevocation(value: unknown): value is RevocationDocument {
  if (
    !isRecord(value) ||
    !common(value, 'revocation', ['safetyRevision', 'revocationFloor', 'references', 'entries']) ||
    !positive(value.safetyRevision) ||
    !positive(value.revocationFloor) ||
    value.safetyRevision < value.revocationFloor
  )
    return false;
  const references = records(value.references),
    entries = records(value.entries);
  if (
    !references ||
    !entries ||
    entries.length > mobileMediaCaps.safetyEntries ||
    !references.every(isSafetyReference) ||
    !entries.every(isSafetyEntry) ||
    !sorted(references, (item) => `${recordId(item, 'kind')}\0${recordId(item, 'id')}`) ||
    !sorted(
      entries,
      (item) =>
        `${recordId(item, 'targetKind')}\0${recordId(item, 'targetId')}\0${recordId(item, 'targetHash')}`,
    )
  )
    return false;
  const known = new Set(references.map((reference) => `${reference.kind}\0${reference.id}`));
  if (
    !entries.every(
      (entry) =>
        known.has(`${entry.targetKind}\0${entry.targetId}`) &&
        (entry.status !== 'replaced' ||
          known.has(`${entry.replacementKind}\0${entry.replacementId}`)),
    )
  )
    return false;
  const graph = new Map(
    entries
      .filter((entry) => entry.status === 'replaced')
      .map((entry): [string, string] => [
        `${entry.targetKind}\0${entry.targetId}`,
        `${entry.replacementKind}\0${entry.replacementId}`,
      ]),
  );
  for (const start of graph.keys()) {
    const seen = new Set<string>();
    let cursor: string | undefined = start;
    while (cursor !== undefined) {
      if (seen.has(cursor)) return false;
      seen.add(cursor);
      cursor = graph.get(cursor);
    }
  }
  return true;
}
export function validateMobileMediaDocument(
  kind: MediaDocumentClass,
  value: unknown,
): value is JsonRecord {
  return kind === 'manifest'
    ? isManifest(value)
    : kind === 'admission'
      ? isAdmission(value)
      : kind === 'rights'
        ? isRights(value)
        : kind === 'consent'
          ? isConsentDocument(value)
          : kind === 'lifecycle'
            ? isLifecycle(value)
            : isRevocation(value);
}
function documentsShareRelease(document: JsonRecord, release: MobileMediaReleaseV1): boolean {
  return (
    document.releaseId === release.releaseId &&
    document.revision === release.revision &&
    document.generatedAt === release.generatedAt &&
    document.validUntil === release.validUntil &&
    document.owner === release.owner
  );
}
export function validateMobileMediaCandidate(
  releaseValue: unknown,
  documentsValue: Readonly<Record<MediaDocumentClass, unknown>>,
  raw?: Readonly<Partial<Record<MediaDocumentClass, string>>>,
  clock: MobileMediaClock = Date.now,
): MobileMediaCandidate | null {
  if (!validateMobileMediaRelease(releaseValue)) return null;
  const release = releaseValue;
  const now = clockNow(clock);
  if (now === null || !isCurrentRelease(release, now)) return null;
  const manifest = documentsValue.manifest,
    admission = documentsValue.admission,
    rights = documentsValue.rights,
    consent = documentsValue.consent,
    lifecycle = documentsValue.lifecycle,
    revocation = documentsValue.revocation;
  if (
    !isManifest(manifest) ||
    !isAdmission(admission) ||
    !isRights(rights) ||
    !isConsentDocument(consent) ||
    !isLifecycle(lifecycle) ||
    !isRevocation(revocation)
  )
    return null;
  const docs: MobileMediaDocuments = {
    manifest,
    admission,
    rights,
    consent,
    lifecycle,
    revocation,
  };
  if (!Object.values(docs).every((document) => documentsShareRelease(document, release)))
    return null;
  for (const descriptor of release.documents) {
    const rawDocument = raw?.[descriptor.documentClass];
    if (rawDocument !== undefined && utf8ByteLength(rawDocument) !== descriptor.bytes) return null;
  }
  if (
    revocation.revocationFloor !== release.revocationFloor ||
    manifest.series.length + manifest.episodes.length + manifest.assets.length !==
      release.documents[0]!.recordCount ||
    admission.sources.length + admission.identityLinks.length !==
      release.documents[1]!.recordCount ||
    rights.rights.length !== release.documents[2]!.recordCount ||
    consent.consents.length !== release.documents[3]!.recordCount ||
    release.documents[4]!.recordCount !== 1 ||
    revocation.entries.length !== release.documents[5]!.recordCount
  )
    return null;
  const sourceIds = new Set(manifest.series.map((series) => series.sourceId));
  const admittedSourceIds = new Set(admission.sources.map((source) => source.id));
  const assets = new Map(manifest.assets.map((asset): [string, Asset] => [asset.id, asset]));
  const episodes = new Set(manifest.episodes.map((episode) => episode.id));
  if (
    sourceIds.size !== admittedSourceIds.size ||
    [...sourceIds].some((sourceId) => !admittedSourceIds.has(sourceId))
  )
    return null;
  if (
    admission.sources.some(
      (source) =>
        Date.parse(source.healthAt) > Date.parse(release.generatedAt) ||
        Date.parse(release.generatedAt) - Date.parse(source.healthAt) > 86400000 ||
        Date.parse(source.validFrom) > Date.parse(release.generatedAt) ||
        now >= Date.parse(source.validUntil) ||
        source.validUntil !== release.validUntil,
    )
  )
    return null;
  if (
    rights.rights.length !== assets.size ||
    rights.rights.some(
      (right) =>
        assets.get(right.assetId)?.sha256 !== right.assetHash ||
        right.expiresAt !== release.validUntil ||
        now >= Date.parse(right.expiresAt),
    ) ||
    consent.consents.length !== episodes.size ||
    consent.consents.some((item) => !episodes.has(item.episodeId))
  )
    return null;
  const currentReferences = new Set<string>([
    ...admission.sources.map((source) => `source\0${source.id}`),
    ...manifest.series.map((series) => `series\0${series.id}`),
    ...manifest.episodes.map((episode) => `episode\0${episode.id}`),
    ...manifest.assets.map((asset) => `asset\0${asset.id}`),
  ]);
  const safetyReferences = new Set(
    revocation.references.map((reference) => `${reference.kind}\0${reference.id}`),
  );
  const entryReferences = new Set(
    revocation.entries.flatMap((entry) => [
      `${entry.targetKind}\0${entry.targetId}`,
      ...(entry.status === 'replaced' ? [`${entry.replacementKind}\0${entry.replacementId}`] : []),
    ]),
  );
  const requiredReferences = new Set([...currentReferences, ...entryReferences]);
  if (
    requiredReferences.size !== safetyReferences.size ||
    [...requiredReferences].some((reference) => !safetyReferences.has(reference))
  )
    return null;
  return Object.freeze({
    release,
    documents: Object.freeze(docs),
    raw: Object.freeze(raw ? { ...raw } : {}),
  });
}
