import { canonicalJson, sha256Utf8, utf8ByteLength } from './index.js';

export const productionMediaContractVersionV1 = '1.0.0' as const;
export const productionMediaPointerSchemaV1 = 'wrn.production-media-current.v1' as const;
export const productionMediaDescriptorSchemaV1 = 'wrn.production-media-descriptor.v1' as const;
export const productionMediaDocumentsV1 = [
  'manifest',
  'admission',
  'rights',
  'consent',
  'revocation',
] as const;
export const productionMediaLocalesV1 = [
  'en',
  'de',
  'es',
  'fr',
  'it',
  'pt',
  'ru',
  'el',
  'tr',
] as const;
export const productionMediaLimitsV1 = Object.freeze({
  pointer: 16_384,
  descriptor: 32_768,
  document: 131_072,
  aggregate: 262_144,
  sources: 8,
  series: 8,
  episodes: 32,
  streams: 32,
  bytes: 134_217_728,
  durationMs: 14_400_000,
  validityMs: 604_800_000,
});
type Doc = (typeof productionMediaDocumentsV1)[number];
type Locale = (typeof productionMediaLocalesV1)[number];
type Row = Record<string, unknown>;
export type ProductionMediaTextV1 = Readonly<Record<Locale, string | null>>;
export type ProductionMediaRevocationV1 = Readonly<{
  targetType: 'source' | 'series' | 'episode' | 'stream';
  targetId: string;
  status: 'blocked' | 'gone' | 'replaced';
}>;
export type ProductionMediaSafetyV1 = Readonly<{
  revision: number;
  floor: number;
  revocationSha256: string | null;
  entries: readonly ProductionMediaRevocationV1[];
}>;
export type ProductionMediaBindingV1 = Readonly<{
  name: Doc;
  path: string;
  sha256: string;
  bytes: number;
}>;
export type ProductionMediaPointerV1 = Readonly<{
  schema: typeof productionMediaPointerSchemaV1;
  contractVersion: '1.0.0';
  releaseRevision: string;
  sequence: number;
  descriptorPath: string;
  descriptorBytes: number;
  descriptorSha256: string;
  revocationFloor: number;
}>;
export type ProductionMediaDescriptorV1 = Readonly<{
  schema: typeof productionMediaDescriptorSchemaV1;
  contractVersion: '1.0.0';
  releaseRevision: string;
  sequence: number;
  generatedAt: string;
  validUntil: string;
  revocationFloor: number;
  documents: readonly ProductionMediaBindingV1[];
}>;
export type ProductionMediaSourceV1 = Readonly<{
  id: string;
  language: Locale;
  title: ProductionMediaTextV1;
}>;
export type ProductionMediaSeriesV1 = Readonly<{
  id: string;
  sourceId: string;
  title: ProductionMediaTextV1;
}>;
export type ProductionMediaEpisodeV1 = Readonly<{
  id: string;
  sourceId: string;
  seriesId: string;
  publisherEpisodeId: string;
  language: Locale;
  title: ProductionMediaTextV1;
  summary: ProductionMediaTextV1;
  canonicalPage: string;
  publishedAt: string;
  durationMs: number;
}>;
export type ProductionMediaStreamV1 = Readonly<{
  id: string;
  episodeId: string;
  sourceId: string;
  publisherEpisodeId: string;
  deliveryClass: 'publisher-stream';
  mime: 'audio/mpeg';
  url: string;
  origin: string;
  declaredBytes: number;
  durationMs: number;
  streamRevision: string;
  corsMode: 'anonymous';
  redirectPolicy: 'admitted-origin-only';
  rangeRequired: true;
  rightsEvidenceSha256: string;
}>;
type Header<S extends string> = Readonly<{
  schema: S;
  contractVersion: '1.0.0';
  releaseRevision: string;
}>;
export type ProductionMediaManifestV1 = Header<'wrn.production-media-manifest.v1'> &
  Readonly<{
    sources: readonly ProductionMediaSourceV1[];
    series: readonly ProductionMediaSeriesV1[];
    episodes: readonly ProductionMediaEpisodeV1[];
    streams: readonly ProductionMediaStreamV1[];
  }>;
export type ProductionMediaAdmissionV1 = Readonly<{
  sourceId: string;
  selfDescription: ProductionMediaTextV1;
  editorialDescription: ProductionMediaTextV1;
  healthObservedAt: string;
  healthStatus: 'ok';
  validFrom: string;
  validUntil: string;
  owner: string;
  correctionContact: string;
}>;
export type ProductionMediaRightsV1 = Readonly<{
  episodeId: string;
  streamId: string;
  basis: 'published-license' | 'published-streaming-terms' | 'publisher-grant';
  evidenceId: string;
  evidenceSha256: string;
  reviewedAt: string;
  validFrom: string;
  validUntil: string;
  attribution: string;
  territory: 'worldwide';
  directStreamAllowed: true;
  redistributionAllowed: false;
  cacheAllowed: false;
  offlineAllowed: false;
}>;
export type ProductionMediaConsentV1 = Readonly<{
  episodeId: string;
  recipientName: string;
  recipientOrigin: string;
  dataCategories: readonly ['ip-address', 'user-agent', 'request-timing', 'media-range'];
  privacyNoticeUrl: string;
  mode: 'per-episode-third-party-click';
  requiresPrompt: true;
  validFrom: string;
  validUntil: string;
}>;
export type ProductionMediaProviderRelationshipV1 = Readonly<{
  recipientOrigin: string;
  privacyNoticeUrl: string;
}>;
export type ProductionMediaProviderPolicyV1 = Readonly<{
  kind: 'production-media-provider-policy-v1';
  relationships: readonly ProductionMediaProviderRelationshipV1[];
}>;
export type ProductionMediaDocumentsDataV1 = Readonly<{
  manifest: ProductionMediaManifestV1;
  admission: Header<'wrn.production-media-admission.v1'> &
    Readonly<{ entries: readonly ProductionMediaAdmissionV1[] }>;
  rights: Header<'wrn.production-media-rights.v1'> &
    Readonly<{ entries: readonly ProductionMediaRightsV1[] }>;
  consent: Header<'wrn.production-media-consent.v1'> &
    Readonly<{ entries: readonly ProductionMediaConsentV1[] }>;
  revocation: Header<'wrn.production-media-revocation.v1'> &
    Readonly<{
      revision: number;
      floor: number;
      entries: readonly ProductionMediaRevocationV1[];
    }>;
}>;
export type ProductionMediaReadyV1 = Readonly<{
  kind: 'ready';
  pointer: ProductionMediaPointerV1;
  descriptor: ProductionMediaDescriptorV1;
  documents: ProductionMediaDocumentsDataV1;
  safety: ProductionMediaSafetyV1;
}>;
export type ProductionMediaInputV1 = Readonly<{
  pointerRaw: string;
  descriptorRaw: string;
  documentsRaw: Readonly<Record<Doc, string>>;
  now: number;
  allowedOrigins: ReadonlySet<string>;
  knownSafety: ProductionMediaSafetyV1;
  providerPolicy?: ProductionMediaProviderPolicyV1;
}>;
const readyProofs = new WeakSet<object>();
const historicalProofs = new WeakMap<
  object,
  {
    raw: Pick<ProductionMediaInputV1, 'pointerRaw' | 'descriptorRaw' | 'documentsRaw'>;
    admittedSafety: ProductionMediaSafetyV1;
  }
>();
const rec = (v: unknown): v is Row => typeof v === 'object' && v !== null && !Array.isArray(v);
const exact = (v: unknown, keys: readonly string[]): v is Row =>
  rec(v) && Object.keys(v).length === keys.length && keys.every((k) => Object.hasOwn(v, k));
const id = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,127}$/.test(v);
const sha = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const integer = (v: unknown, min: number, max = Number.MAX_SAFE_INTEGER): v is number =>
  Number.isSafeInteger(v) && (v as number) >= min && (v as number) <= max;
const plainText = (v: unknown, max = 1000): v is string =>
  typeof v === 'string' &&
  v.isWellFormed() &&
  v.length <= max &&
  /[^\p{White_Space}\p{Default_Ignorable_Code_Point}]/u.test(v) &&
  !/[\p{Cc}\p{Zl}\p{Zp}\p{Bidi_Control}<>]/u.test(v);
const instant = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(Date.parse(v)).toISOString() === v;
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
const clone = <T>(v: T): T => JSON.parse(canonicalJson(v)) as T;
function parse(raw: unknown, cap: number): Row | null {
  if (
    typeof raw !== 'string' ||
    !raw.isWellFormed() ||
    raw.charCodeAt(0) === 0xfeff ||
    utf8ByteLength(raw) > cap
  )
    return null;
  try {
    const v: unknown = JSON.parse(raw);
    return rec(v) ? v : null;
  } catch {
    return null;
  }
}
function safeUrl(value: unknown): URL | null {
  if (!plainText(value, 2048) || /[\s\\]/.test(value) || /%(?:2e|2f|5c|00)/i.test(value))
    return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      url.username === '' &&
      url.password === '' &&
      url.search === '' &&
      url.hash === '' &&
      url.href === value
      ? url
      : null;
  } catch {
    return null;
  }
}
function snapshotAllowedOrigins(value: unknown): ReadonlySet<string> | null {
  try {
    if (!rec(value)) return null;
    const candidate = value as {
      readonly size?: unknown;
      readonly [Symbol.iterator]?: unknown;
    };
    const declaredSize = candidate.size,
      iteratorFactory = candidate[Symbol.iterator];
    if (!integer(declaredSize, 1, 8) || typeof iteratorFactory !== 'function') return null;
    const iterator = iteratorFactory.call(value) as unknown;
    if (!rec(iterator) || typeof iterator.next !== 'function') return null;
    const next = iterator.next as () => unknown;
    const origins = new Set<string>();
    for (let index = 0; index <= declaredSize; index += 1) {
      const step = next.call(iterator);
      if (!rec(step) || typeof step.done !== 'boolean') return null;
      if (step.done) return index === declaredSize ? origins : null;
      if (
        index === declaredSize ||
        typeof step.value !== 'string' ||
        origins.has(step.value) ||
        safeUrl(step.value + '/')?.origin !== step.value
      )
        return null;
      origins.add(step.value);
    }
    return null;
  } catch {
    return null;
  }
}
export const emptyProductionMediaProviderPolicyV1: ProductionMediaProviderPolicyV1 = freeze({
  kind: 'production-media-provider-policy-v1',
  relationships: [],
});
/** Compiles a detached exact-pair registry against the separately admitted delivery origins. */
export function compileProductionMediaProviderPolicyV1(
  value: unknown,
  allowedOrigins: ReadonlySet<string>,
): ProductionMediaProviderPolicyV1 | null {
  try {
    const origins = snapshotAllowedOrigins(allowedOrigins);
    if (!origins) return null;
    if (value === undefined) return emptyProductionMediaProviderPolicyV1;
    if (!exact(value, ['kind', 'relationships'])) return null;
    const kind = value.kind,
      suppliedRelationships = value.relationships;
    if (kind !== 'production-media-provider-policy-v1' || !Array.isArray(suppliedRelationships))
      return null;
    const declaredRelationships = suppliedRelationships.length;
    if (declaredRelationships > 8) return null;
    const relationshipRows: unknown[] = [];
    for (let index = 0; index < declaredRelationships; index++) {
      if (!Object.hasOwn(suppliedRelationships, index)) return null;
      relationshipRows.push(suppliedRelationships[index]);
    }
    const relationships: ProductionMediaProviderRelationshipV1[] = [];
    const pairs = new Set<string>();
    for (const relationship of relationshipRows) {
      if (!exact(relationship, ['recipientOrigin', 'privacyNoticeUrl'])) return null;
      const recipientOrigin = relationship.recipientOrigin,
        privacyNoticeUrl = relationship.privacyNoticeUrl;
      if (typeof recipientOrigin !== 'string' || typeof privacyNoticeUrl !== 'string') return null;
      const recipient = safeUrl(recipientOrigin + '/');
      const notice = safeUrl(privacyNoticeUrl);
      if (
        !recipient ||
        recipient.origin !== recipientOrigin ||
        recipient.href !== recipientOrigin + '/' ||
        !origins.has(recipientOrigin) ||
        !notice
      )
        return null;
      const pair = recipientOrigin + '\n' + privacyNoticeUrl;
      if (pairs.has(pair)) return null;
      pairs.add(pair);
      relationships.push({
        recipientOrigin,
        privacyNoticeUrl,
      });
    }
    return freeze({ kind: 'production-media-provider-policy-v1', relationships });
  } catch {
    return null;
  }
}
const localised = (value: unknown, required?: string): value is ProductionMediaTextV1 =>
  exact(value, productionMediaLocalesV1) &&
  productionMediaLocalesV1.every((l) => value[l] === null || plainText(value[l])) &&
  (required === undefined ||
    ((productionMediaLocalesV1 as readonly string[]).includes(required) &&
      typeof value[required] === 'string'));
const rows = (v: unknown, max: number, min = 0): v is Row[] =>
  Array.isArray(v) && v.length >= min && v.length <= max && v.every(rec);
const releasePath = (revision: string, name: string) =>
  '/content/media/v1/releases/' + revision + '/' + name + '.json';
const targetKey = (entry: Pick<ProductionMediaRevocationV1, 'targetType' | 'targetId'>) =>
  entry.targetType + ':' + entry.targetId;
function revocationEntry(v: unknown): v is ProductionMediaRevocationV1 {
  return (
    exact(v, ['targetType', 'targetId', 'status']) &&
    ['source', 'series', 'episode', 'stream'].includes(v.targetType as string) &&
    id(v.targetId) &&
    ['blocked', 'gone', 'replaced'].includes(v.status as string)
  );
}
function safetySnapshot(value: unknown): ProductionMediaSafetyV1 | null {
  if (
    !exact(value, ['revision', 'floor', 'revocationSha256', 'entries']) ||
    !integer(value.revision, 0) ||
    !integer(value.floor, 0, value.revision) ||
    !Array.isArray(value.entries) ||
    value.entries.length > productionMediaLimitsV1.document ||
    !value.entries.every(revocationEntry)
  )
    return null;
  if (
    value.revision === 0
      ? value.floor !== 0 || value.revocationSha256 !== null || value.entries.length !== 0
      : !sha(value.revocationSha256) || value.floor < 1
  )
    return null;
  const entries = value.entries as ProductionMediaRevocationV1[];
  if (new Set(entries.map(targetKey)).size !== entries.length) return null;
  const raw = canonicalJson(value);
  if (utf8ByteLength(raw) > productionMediaLimitsV1.document) return null;
  return freeze(JSON.parse(raw) as ProductionMediaSafetyV1);
}
/** Returns a detached exact A1 safety snapshot, or null without coercion. */
export function snapshotProductionMediaSafetyV1(value: unknown): ProductionMediaSafetyV1 | null {
  return safetySnapshot(value);
}
export function sameProductionMediaSafetyV1(left: unknown, right: unknown): boolean {
  const a = safetySnapshot(left),
    b = safetySnapshot(right);
  return a !== null && b !== null && canonicalJson(a) === canonicalJson(b);
}
/** A later safety snapshot must retain every earlier target and exact equal revisions. */
export function mergeProductionMediaSafetyV1(
  current: unknown,
  incoming: unknown,
): ProductionMediaSafetyV1 | null {
  const before = safetySnapshot(current),
    after = safetySnapshot(incoming);
  if (!before || !after || after.revision < before.revision || after.floor < before.floor)
    return null;
  if (after.revision === before.revision)
    return canonicalJson(before) === canonicalJson(after) ? after : null;
  const keys = new Set(after.entries.map(targetKey));
  return before.entries.every((entry) => keys.has(targetKey(entry))) ? after : null;
}
export function isProductionMediaPointerV1(value: unknown): value is ProductionMediaPointerV1 {
  return (
    exact(value, [
      'schema',
      'contractVersion',
      'releaseRevision',
      'sequence',
      'descriptorPath',
      'descriptorBytes',
      'descriptorSha256',
      'revocationFloor',
    ]) &&
    value.schema === productionMediaPointerSchemaV1 &&
    value.contractVersion === '1.0.0' &&
    id(value.releaseRevision) &&
    integer(value.sequence, 1) &&
    integer(value.revocationFloor, 1) &&
    value.descriptorPath === releasePath(value.releaseRevision, 'descriptor') &&
    integer(value.descriptorBytes, 1, productionMediaLimitsV1.descriptor) &&
    sha(value.descriptorSha256)
  );
}
export function isProductionMediaDescriptorV1(
  value: unknown,
): value is ProductionMediaDescriptorV1 {
  if (
    !exact(value, [
      'schema',
      'contractVersion',
      'releaseRevision',
      'sequence',
      'generatedAt',
      'validUntil',
      'revocationFloor',
      'documents',
    ]) ||
    value.schema !== productionMediaDescriptorSchemaV1 ||
    value.contractVersion !== '1.0.0' ||
    !id(value.releaseRevision) ||
    !integer(value.sequence, 1) ||
    !integer(value.revocationFloor, 1) ||
    !instant(value.generatedAt) ||
    !instant(value.validUntil) ||
    Date.parse(value.validUntil) <= Date.parse(value.generatedAt) ||
    Date.parse(value.validUntil) - Date.parse(value.generatedAt) >
      productionMediaLimitsV1.validityMs ||
    !rows(value.documents, 5, 5)
  )
    return false;
  const names = new Set<string>();
  let total = 0;
  for (const binding of value.documents) {
    if (
      !exact(binding, ['name', 'path', 'sha256', 'bytes']) ||
      !(productionMediaDocumentsV1 as readonly unknown[]).includes(binding.name) ||
      names.has(binding.name as string) ||
      !sha(binding.sha256) ||
      !integer(binding.bytes, 1, productionMediaLimitsV1.document) ||
      binding.path !== releasePath(value.releaseRevision, binding.name as string)
    )
      return false;
    names.add(binding.name as string);
    total += binding.bytes;
  }
  return total <= productionMediaLimitsV1.aggregate;
}
function preflight(pointerRaw: unknown, descriptorRaw: unknown, now: number) {
  const pointer = parse(pointerRaw, productionMediaLimitsV1.pointer);
  const descriptor = parse(descriptorRaw, productionMediaLimitsV1.descriptor);
  if (
    !Number.isFinite(now) ||
    !isProductionMediaPointerV1(pointer) ||
    !isProductionMediaDescriptorV1(descriptor) ||
    typeof descriptorRaw !== 'string' ||
    pointer.descriptorBytes !== utf8ByteLength(descriptorRaw) ||
    descriptor.sequence !== pointer.sequence ||
    descriptor.releaseRevision !== pointer.releaseRevision ||
    descriptor.revocationFloor !== pointer.revocationFloor ||
    Date.parse(descriptor.generatedAt) > now ||
    now >= Date.parse(descriptor.validUntil)
  )
    return null;
  return { pointer, descriptor, descriptorRaw };
}
async function verifiedSafety(
  graph: NonNullable<ReturnType<typeof preflight>>,
  revocationRaw: unknown,
  known: ProductionMediaSafetyV1,
): Promise<ProductionMediaSafetyV1 | null> {
  const binding = graph.descriptor.documents.find((v) => v.name === 'revocation')!;
  const revocation = parse(revocationRaw, productionMediaLimitsV1.document);
  if (
    typeof revocationRaw !== 'string' ||
    binding.bytes !== utf8ByteLength(revocationRaw) ||
    !exact(revocation, [
      'schema',
      'contractVersion',
      'releaseRevision',
      'revision',
      'floor',
      'entries',
    ]) ||
    revocation.schema !== 'wrn.production-media-revocation.v1' ||
    revocation.contractVersion !== '1.0.0' ||
    revocation.releaseRevision !== graph.pointer.releaseRevision ||
    !integer(revocation.revision, 1) ||
    !integer(revocation.floor, 1, revocation.revision) ||
    revocation.floor !== graph.pointer.revocationFloor ||
    revocation.revision < known.revision ||
    revocation.floor < known.floor ||
    !Array.isArray(revocation.entries) ||
    !revocation.entries.every(revocationEntry)
  )
    return null;
  const entries = revocation.entries as ProductionMediaRevocationV1[];
  if (new Set(entries.map(targetKey)).size !== entries.length) return null;
  const [descriptorHash, revocationHash] = await Promise.all([
    sha256Utf8(graph.descriptorRaw),
    sha256Utf8(revocationRaw),
  ]);
  if (
    descriptorHash !== graph.pointer.descriptorSha256 ||
    revocationHash !== binding.sha256 ||
    (revocation.revision === known.revision && revocationHash !== known.revocationSha256)
  )
    return null;
  const merged = new Map(known.entries.map((v) => [targetKey(v), v]));
  for (const entry of entries) merged.set(targetKey(entry), entry);
  return safetySnapshot({
    revision: revocation.revision,
    floor: revocation.floor,
    revocationSha256: revocationHash,
    entries: [...merged.values()].sort((a, b) => targetKey(a).localeCompare(targetKey(b))),
  });
}
/** Phase one checks hash-bound safety; no signatures, payload reads or durable writes are claimed. */
export async function validateProductionMediaSafetyV1(
  input: Pick<
    ProductionMediaInputV1,
    'pointerRaw' | 'descriptorRaw' | 'documentsRaw' | 'now' | 'knownSafety'
  >,
): Promise<ProductionMediaSafetyV1 | null> {
  try {
    const graph = preflight(input.pointerRaw, input.descriptorRaw, input.now);
    const known = safetySnapshot(input.knownSafety);
    const raw = input.documentsRaw?.revocation;
    return graph && known ? await verifiedSafety(graph, raw, known) : null;
  } catch {
    return null;
  }
}
function header(v: Row, name: Doc, revision: string, bodyKeys: readonly string[]) {
  return (
    exact(v, ['schema', 'contractVersion', 'releaseRevision', ...bodyKeys]) &&
    v.schema === 'wrn.production-media-' + name + '.v1' &&
    v.contractVersion === '1.0.0' &&
    v.releaseRevision === revision
  );
}
function windowCovers(row: Row, start: number, end: number) {
  return (
    instant(row.validFrom) &&
    instant(row.validUntil) &&
    Date.parse(row.validFrom) <= start &&
    Date.parse(row.validUntil) >= end
  );
}
function semanticDocuments(
  docs: Record<Doc, Row>,
  graph: NonNullable<ReturnType<typeof preflight>>,
  origins: ReadonlySet<string>,
  safety: ProductionMediaSafetyV1,
  providerPolicy: ProductionMediaProviderPolicyV1 | null,
): ProductionMediaDocumentsDataV1 | null {
  const m = docs.manifest,
    start = Date.parse(graph.descriptor.generatedAt),
    end = Date.parse(graph.descriptor.validUntil);
  if (
    !header(m, 'manifest', graph.pointer.releaseRevision, [
      'sources',
      'series',
      'episodes',
      'streams',
    ]) ||
    !rows(m.sources, 8, 1) ||
    !rows(m.series, 8, 1) ||
    !rows(m.episodes, 32, 1) ||
    !rows(m.streams, 32, 1)
  )
    return null;
  const sources = new Map<string, Row>(),
    series = new Map<string, Row>(),
    episodes = new Map<string, Row>(),
    streams = new Map<string, Row>();
  const allIds = new Set<string>(),
    revoked = new Set(safety.entries.map(targetKey));
  const add = (row: Row, type: string, map: Map<string, Row>) => {
    if (!id(row.id) || allIds.has(row.id) || revoked.has(type + ':' + row.id)) return false;
    allIds.add(row.id);
    map.set(row.id, row);
    return true;
  };
  for (const v of m.sources)
    if (
      !exact(v, ['id', 'language', 'title']) ||
      typeof v.language !== 'string' ||
      !localised(v.title, v.language) ||
      !add(v, 'source', sources)
    )
      return null;
  for (const v of m.series)
    if (
      !exact(v, ['id', 'sourceId', 'title']) ||
      !id(v.sourceId) ||
      !sources.has(v.sourceId) ||
      !localised(v.title, sources.get(v.sourceId)!.language as string) ||
      !add(v, 'series', series)
    )
      return null;
  const publishers = new Set<string>();
  for (const v of m.episodes) {
    if (
      !exact(v, [
        'id',
        'sourceId',
        'seriesId',
        'publisherEpisodeId',
        'language',
        'title',
        'summary',
        'canonicalPage',
        'publishedAt',
        'durationMs',
      ]) ||
      !id(v.sourceId) ||
      !id(v.seriesId) ||
      !id(v.publisherEpisodeId) ||
      series.get(v.seriesId)?.sourceId !== v.sourceId ||
      sources.get(v.sourceId)?.language !== v.language ||
      typeof v.language !== 'string' ||
      !localised(v.title, v.language) ||
      !localised(v.summary) ||
      !safeUrl(v.canonicalPage) ||
      !instant(v.publishedAt) ||
      Date.parse(v.publishedAt) > start ||
      !integer(v.durationMs, 1000, productionMediaLimitsV1.durationMs) ||
      publishers.has(v.sourceId + ':' + v.publisherEpisodeId) ||
      !add(v, 'episode', episodes)
    )
      return null;
    publishers.add(v.sourceId + ':' + v.publisherEpisodeId);
  }
  const usedEpisodes = new Set<string>();
  for (const v of m.streams) {
    const url = safeUrl(v.url);
    if (
      !exact(v, [
        'id',
        'episodeId',
        'sourceId',
        'publisherEpisodeId',
        'deliveryClass',
        'mime',
        'url',
        'origin',
        'declaredBytes',
        'durationMs',
        'streamRevision',
        'corsMode',
        'redirectPolicy',
        'rangeRequired',
        'rightsEvidenceSha256',
      ]) ||
      !id(v.episodeId) ||
      usedEpisodes.has(v.episodeId) ||
      !episodes.has(v.episodeId) ||
      episodes.get(v.episodeId)!.sourceId !== v.sourceId ||
      episodes.get(v.episodeId)!.publisherEpisodeId !== v.publisherEpisodeId ||
      episodes.get(v.episodeId)!.durationMs !== v.durationMs ||
      !url ||
      url.origin !== v.origin ||
      !origins.has(url.origin) ||
      v.deliveryClass !== 'publisher-stream' ||
      v.mime !== 'audio/mpeg' ||
      !integer(v.declaredBytes, 1, productionMediaLimitsV1.bytes) ||
      !sha(v.streamRevision) ||
      !sha(v.rightsEvidenceSha256) ||
      v.corsMode !== 'anonymous' ||
      v.redirectPolicy !== 'admitted-origin-only' ||
      v.rangeRequired !== true ||
      !add(v, 'stream', streams)
    )
      return null;
    usedEpisodes.add(v.episodeId);
  }
  if (
    usedEpisodes.size !== episodes.size ||
    [...series.keys()].some((key) => ![...episodes.values()].some((v) => v.seriesId === key)) ||
    [...sources.keys()].some((key) => ![...series.values()].some((v) => v.sourceId === key))
  )
    return null;
  for (const name of ['admission', 'rights', 'consent'] as const)
    if (
      !header(docs[name], name, graph.pointer.releaseRevision, ['entries']) ||
      !rows(docs[name].entries, name === 'admission' ? 8 : 32, 1)
    )
      return null;
  const admissions = docs.admission.entries as Row[],
    rights = docs.rights.entries as Row[],
    consents = docs.consent.entries as Row[];
  if (
    admissions.length !== sources.size ||
    rights.length !== streams.size ||
    consents.length !== episodes.size
  )
    return null;
  const seen = new Set<string>();
  for (const v of admissions) {
    if (
      !exact(v, [
        'sourceId',
        'selfDescription',
        'editorialDescription',
        'healthObservedAt',
        'healthStatus',
        'validFrom',
        'validUntil',
        'owner',
        'correctionContact',
      ]) ||
      !id(v.sourceId) ||
      !sources.has(v.sourceId) ||
      seen.has(v.sourceId) ||
      !localised(v.selfDescription) ||
      !localised(v.editorialDescription) ||
      !plainText(v.owner, 256) ||
      !id(v.correctionContact) ||
      v.healthStatus !== 'ok' ||
      !instant(v.healthObservedAt) ||
      Date.parse(v.healthObservedAt) > start ||
      start - Date.parse(v.healthObservedAt) > productionMediaLimitsV1.validityMs ||
      !windowCovers(v, start, end)
    )
      return null;
    seen.add(v.sourceId);
  }
  seen.clear();
  for (const v of rights) {
    if (
      !exact(v, [
        'episodeId',
        'streamId',
        'basis',
        'evidenceId',
        'evidenceSha256',
        'reviewedAt',
        'validFrom',
        'validUntil',
        'attribution',
        'territory',
        'directStreamAllowed',
        'redistributionAllowed',
        'cacheAllowed',
        'offlineAllowed',
      ]) ||
      !id(v.streamId) ||
      !streams.has(v.streamId) ||
      streams.get(v.streamId)!.episodeId !== v.episodeId ||
      seen.has(v.streamId) ||
      !['published-license', 'published-streaming-terms', 'publisher-grant'].includes(
        v.basis as string,
      ) ||
      !id(v.evidenceId) ||
      !sha(v.evidenceSha256) ||
      streams.get(v.streamId)!.rightsEvidenceSha256 !== v.evidenceSha256 ||
      !instant(v.reviewedAt) ||
      Date.parse(v.reviewedAt) > start ||
      !windowCovers(v, start, end) ||
      !plainText(v.attribution, 4096) ||
      v.territory !== 'worldwide' ||
      v.directStreamAllowed !== true ||
      v.redistributionAllowed !== false ||
      v.cacheAllowed !== false ||
      v.offlineAllowed !== false
    )
      return null;
    seen.add(v.streamId);
  }
  seen.clear();
  const categories = ['ip-address', 'user-agent', 'request-timing', 'media-range'];
  for (const v of consents) {
    const stream = [...streams.values()].find((row) => row.episodeId === v.episodeId),
      notice = safeUrl(v.privacyNoticeUrl);
    if (
      !exact(v, [
        'episodeId',
        'recipientName',
        'recipientOrigin',
        'dataCategories',
        'privacyNoticeUrl',
        'mode',
        'requiresPrompt',
        'validFrom',
        'validUntil',
      ]) ||
      !id(v.episodeId) ||
      !episodes.has(v.episodeId) ||
      seen.has(v.episodeId) ||
      !plainText(v.recipientName, 256) ||
      !notice ||
      stream?.origin !== v.recipientOrigin ||
      (providerPolicy !== null &&
        notice.origin !== v.recipientOrigin &&
        !providerPolicy.relationships.some(
          (relationship) =>
            relationship.recipientOrigin === v.recipientOrigin &&
            relationship.privacyNoticeUrl === v.privacyNoticeUrl,
        )) ||
      !Array.isArray(v.dataCategories) ||
      JSON.stringify(v.dataCategories) !== JSON.stringify(categories) ||
      v.mode !== 'per-episode-third-party-click' ||
      v.requiresPrompt !== true ||
      !windowCovers(v, start, end)
    )
      return null;
    seen.add(v.episodeId);
  }
  return docs as unknown as ProductionMediaDocumentsDataV1;
}
export function isValidatedProductionMediaReadyV1(value: unknown): value is ProductionMediaReadyV1 {
  return rec(value) && readyProofs.has(value);
}
async function validateProductionMediaReleaseDataV1(
  input: ProductionMediaInputV1,
  origins: ReadonlySet<string>,
  providerPolicy: ProductionMediaProviderPolicyV1 | null,
) {
  const graph = preflight(input.pointerRaw, input.descriptorRaw, input.now),
    known = safetySnapshot(input.knownSafety);
  if (!graph || !known || !exact(input.documentsRaw, productionMediaDocumentsV1)) return null;
  const raw: Record<Doc, string> = {} as Record<Doc, string>,
    documents = {} as Record<Doc, Row>;
  for (const binding of graph.descriptor.documents) {
    const text = input.documentsRaw[binding.name],
      value = parse(text, productionMediaLimitsV1.document);
    if (!value || typeof text !== 'string' || utf8ByteLength(text) !== binding.bytes) return null;
    raw[binding.name] = text;
    documents[binding.name] = value;
  }
  const safety = await verifiedSafety(graph, raw.revocation, known);
  if (!safety) return null;
  for (const binding of graph.descriptor.documents)
    if (binding.name !== 'revocation' && (await sha256Utf8(raw[binding.name])) !== binding.sha256)
      return null;
  const validated = semanticDocuments(documents, graph, origins, safety, providerPolicy);
  if (!validated) return null;
  for (const stream of validated.manifest.streams) {
    const expected = await sha256Utf8(
      canonicalJson({
        sourceId: stream.sourceId,
        publisherEpisodeId: stream.publisherEpisodeId,
        url: stream.url,
        mime: stream.mime,
        declaredBytes: stream.declaredBytes,
        durationMs: stream.durationMs,
        rightsEvidenceSha256: stream.rightsEvidenceSha256,
      }),
    );
    if (expected !== stream.streamRevision) return null;
  }
  return { graph, validated, safety };
}
/** No network, audio integrity, storage, CSP or activation is implied by metadata readiness. */
export async function validateProductionMediaReleaseV1(
  input: ProductionMediaInputV1,
): Promise<ProductionMediaReadyV1 | null> {
  try {
    const origins = snapshotAllowedOrigins(input.allowedOrigins),
      providerPolicy = origins
        ? compileProductionMediaProviderPolicyV1(input.providerPolicy, origins)
        : null;
    if (!origins || !providerPolicy) return null;
    const result = await validateProductionMediaReleaseDataV1(input, origins, providerPolicy);
    if (!result) return null;
    const ready = freeze(
      clone({
        kind: 'ready' as const,
        pointer: result.graph.pointer,
        descriptor: result.graph.descriptor,
        documents: result.validated,
        safety: result.safety,
      }),
    );
    readyProofs.add(ready);
    return ready;
  } catch {
    return null;
  }
}

export type ProductionMediaHistoricalProofV1 = Readonly<{ kind: 'historical-production-media-v1' }>;
/** Validates stored A1 bytes against their admitted safety, without minting Ready. */
export async function validateHistoricalProductionMediaReleaseV1(
  raw: Pick<ProductionMediaInputV1, 'pointerRaw' | 'descriptorRaw' | 'documentsRaw'>,
  admittedSafety: ProductionMediaSafetyV1,
): Promise<ProductionMediaHistoricalProofV1 | null> {
  try {
    // This is the only clone.  It occurs before the first hashing await, so
    // a proof remains bound to the exact byte strings A1 actually checked.
    const detached = {
      pointerRaw: raw.pointerRaw,
      descriptorRaw: raw.descriptorRaw,
      documentsRaw: clone(raw.documentsRaw),
    };
    const safety = safetySnapshot(admittedSafety),
      descriptor = parse(detached.descriptorRaw, productionMediaLimitsV1.descriptor),
      manifest = parse(detached.documentsRaw?.manifest, productionMediaLimitsV1.document);
    if (
      !safety ||
      !isProductionMediaDescriptorV1(descriptor) ||
      !manifest ||
      !Array.isArray(manifest.streams)
    )
      return null;
    const origins = new Set<string>();
    for (const stream of manifest.streams) {
      if (!rec(stream) || !safeUrl(stream.url)) return null;
      origins.add(safeUrl(stream.url)!.origin);
    }
    const validated = await validateProductionMediaReleaseDataV1(
      {
        ...detached,
        now: Date.parse(descriptor.generatedAt),
        allowedOrigins: origins,
        knownSafety: safety,
      },
      origins,
      null,
    );
    if (!validated || !sameProductionMediaSafetyV1(validated.safety, safety)) return null;
    const proof = freeze({ kind: 'historical-production-media-v1' as const });
    historicalProofs.set(proof, { raw: detached, admittedSafety: safety });
    return proof;
  } catch {
    return null;
  }
}
/** Rechecks a registered proof under current safety without consulting policy or minting Ready. */
export async function retainsHistoricalProductionMediaReleaseV1(
  proof: unknown,
  currentSafety: ProductionMediaSafetyV1,
): Promise<boolean> {
  try {
    const stored = rec(proof) ? historicalProofs.get(proof) : undefined;
    const current = safetySnapshot(currentSafety);
    if (
      !stored ||
      !current ||
      mergeProductionMediaSafetyV1(stored.admittedSafety, current) === null ||
      stored.admittedSafety.revision < current.floor
    )
      return false;
    const descriptor = parse(stored.raw.descriptorRaw, productionMediaLimitsV1.descriptor),
      manifest = parse(stored.raw.documentsRaw.manifest, productionMediaLimitsV1.document);
    if (!isProductionMediaDescriptorV1(descriptor) || !manifest || !Array.isArray(manifest.streams))
      return false;
    const origins = new Set<string>();
    for (const stream of manifest.streams) {
      if (!rec(stream) || !safeUrl(stream.url)) return false;
      origins.add(safeUrl(stream.url)!.origin);
    }
    const graph = preflight(
      stored.raw.pointerRaw,
      stored.raw.descriptorRaw,
      Date.parse(descriptor.generatedAt),
    );
    if (!graph || !snapshotAllowedOrigins(origins)) return false;
    const docs = {} as Record<Doc, Row>;
    for (const name of productionMediaDocumentsV1) {
      const value = parse(stored.raw.documentsRaw[name], productionMediaLimitsV1.document);
      if (!value) return false;
      docs[name] = value;
    }
    return semanticDocuments(docs, graph, origins, current, null) !== null;
  } catch {
    return false;
  }
}
/** Rechecks a registered historical proof against current safety/time/origins and only then mints Ready. */
export async function activateHistoricalProductionMediaReleaseV1(
  proof: unknown,
  currentSafety: ProductionMediaSafetyV1,
  now: number,
  allowedOrigins: ReadonlySet<string>,
  providerPolicy?: ProductionMediaProviderPolicyV1,
): Promise<ProductionMediaReadyV1 | null> {
  const stored = rec(proof) ? historicalProofs.get(proof) : undefined;
  const current = safetySnapshot(currentSafety),
    origins = snapshotAllowedOrigins(allowedOrigins),
    policy = origins ? compileProductionMediaProviderPolicyV1(providerPolicy, origins) : null;
  if (
    !stored ||
    !current ||
    !origins ||
    !policy ||
    !Number.isFinite(now) ||
    mergeProductionMediaSafetyV1(stored.admittedSafety, current) === null ||
    stored.admittedSafety.revision < current.floor
  )
    return null;
  const graph = preflight(stored.raw.pointerRaw, stored.raw.descriptorRaw, now);
  if (!graph || !exact(stored.raw.documentsRaw, productionMediaDocumentsV1)) return null;
  const docs = {} as Record<Doc, Row>;
  for (const name of productionMediaDocumentsV1) {
    const value = parse(stored.raw.documentsRaw[name], productionMediaLimitsV1.document);
    if (!value) return null;
    docs[name] = value;
  }
  const validated = semanticDocuments(docs, graph, origins, current, policy);
  if (!validated) return null;
  const ready = freeze(
    clone({
      kind: 'ready' as const,
      pointer: graph.pointer,
      descriptor: graph.descriptor,
      documents: validated,
      safety: current,
    }),
  );
  readyProofs.add(ready);
  return ready;
}
