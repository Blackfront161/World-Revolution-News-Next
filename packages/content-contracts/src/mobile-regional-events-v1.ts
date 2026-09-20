import { sha256Utf8, utf8ByteLength } from './index.js';

export const mobileRegionalEventsSchema = 'wrn.mobile-regional-events.v1' as const;
export const mobileRegionalEventsContractVersion = '1.0.0' as const;
export const mobileRegionalEventsPath =
  '/wrn-mobile-regional-events/v1/mobile-regional-events.json' as const;
export const mobileRegionalEventsLocales = [
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
export const mobileRegionalEventsMaxTransportBytes = 512 * 1024;
export const mobileRegionalEventsMaxDecodedJsonBytes = 512 * 1024;
export const mobileRegionalEventsCaps = Object.freeze({
  continents: 8,
  countries: 256,
  regions: 2048,
  sources: 512,
  events: 4096,
  identityLinks: 4096,
  revocations: 512,
  media: 64,
  id: 128,
  name: 512,
  summary: 2048,
  url: 2048,
  safetyBytes: 64 * 1024,
  safetyEntries: 512,
  mediaBytes: 256 * 1024,
  dimension: 2048,
  pixels: 4_194_304,
  slots: 3,
});

export type RegionalNamespace = 'continent' | 'country' | 'region' | 'event' | 'source';
export type LocalizedText = Readonly<Record<(typeof mobileRegionalEventsLocales)[number], string>>;
export interface RegionalEventsBuildPin {
  readonly schema: typeof mobileRegionalEventsSchema;
  readonly contractVersion: typeof mobileRegionalEventsContractVersion;
  readonly path: typeof mobileRegionalEventsPath;
  readonly bundleRevision: number;
  readonly taxonomyRevision: number;
  readonly transportSha256: string;
}
export interface RegionalEventBundleV1 {
  readonly schema: typeof mobileRegionalEventsSchema;
  readonly contractVersion: typeof mobileRegionalEventsContractVersion;
  readonly minimumAppContractVersion: typeof mobileRegionalEventsContractVersion;
  readonly bundleRevision: number;
  readonly taxonomyRevision: number;
  readonly generatedAt: string;
  readonly validUntil: string;
  readonly locales: readonly (typeof mobileRegionalEventsLocales)[number][];
  readonly taxonomySha256: string;
  readonly sourcesSha256: string;
  readonly eventsSha256: string;
  readonly mediaSha256: string;
  readonly revocationsSha256: string;
  readonly continents: readonly Continent[];
  readonly countries: readonly Country[];
  readonly regions: readonly Region[];
  readonly identityLinks: readonly IdentityLink[];
  readonly sources: readonly EventSource[];
  readonly events: readonly RegionalEvent[];
  readonly media: readonly EventMedium[];
  readonly revocationRevision: number;
  readonly revocations: readonly Revocation[];
}
export interface Continent {
  readonly continentId: string;
  readonly names: LocalizedText;
}
export interface Country {
  readonly countryId: string;
  readonly continentId: string;
  readonly names: LocalizedText;
}
export interface Region {
  readonly regionId: string;
  readonly countryId: string;
  readonly names: LocalizedText;
}
export interface IdentityLink {
  readonly namespace: RegionalNamespace;
  readonly sourceId: string;
  readonly targetId: string;
  readonly relation: 'alias' | 'successor';
}
export interface EventSource {
  readonly sourceId: string;
  readonly names: LocalizedText | { readonly und: string };
  readonly originalUrl: string;
  readonly rightsStatus: 'self-authored-local-fixture';
  readonly licenseId: 'CC0-1.0';
  readonly rightsReference: string;
  readonly provenanceReference: string;
  readonly publishedAt: string;
  readonly observedAt: string;
  readonly correctionContactLabel: string;
}
export interface RegionalEvent {
  readonly eventId: string;
  readonly regionId: string;
  readonly sourceId: string;
  readonly status: 'scheduled' | 'changed' | 'cancelled';
  readonly titles: LocalizedText;
  readonly locationNames: LocalizedText;
  readonly summaries: LocalizedText;
  readonly startInstant: string;
  readonly startLocal: string;
  readonly startUtcOffsetMinutes: number;
  readonly timeZone: string;
  readonly publishedAt: string;
  readonly observedAt: string;
  readonly validUntil: string;
  readonly contentRevision: number;
  readonly contentSha256: string;
  readonly rightsStatus: 'self-authored-local-fixture';
  readonly licenseId: 'CC0-1.0';
  readonly rightsReference: string;
  readonly provenanceReference: string;
  readonly endInstant?: string;
  readonly endLocal?: string;
  readonly endUtcOffsetMinutes?: number;
  readonly mediaId?: string;
}
export interface EventMedium {
  readonly mediaId: string;
  readonly eventId: string;
  readonly assetId: string;
  readonly assetPath: string;
  readonly mimeType: 'image/png' | 'image/webp';
  readonly bytes: number;
  readonly width: number;
  readonly height: number;
  readonly pixelArea: number;
  readonly sha256: string;
  readonly altTexts: LocalizedText;
  readonly altTextProvenanceReference: string;
  readonly rightsStatus: 'self-authored-local-fixture';
  readonly licenseId: 'CC0-1.0';
  readonly rightsReference: string;
  readonly provenanceReference: string;
  readonly attributionLabel: string;
}
export interface Revocation {
  readonly namespace: RegionalNamespace;
  readonly id: string;
  readonly status: 'blocked' | 'gone' | 'replaced';
  readonly objectSha256?: string;
  readonly replacementId?: string;
}
/** Persisted provenance for a safety entry.  It is deliberately an ID-only
 * witness: references are derived from an already pinned, validated bundle by
 * the event store and never accepted from a caller. */
export interface SafetyReference {
  readonly namespace: RegionalNamespace;
  readonly id: string;
}

const id = /^wrn-(cont|country|region|event|source)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hash = /^[a-f0-9]{64}$/;
const utc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const local = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const reference = /^wrn-(rights|provenance)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const namespaces: readonly RegionalNamespace[] = [
  'continent',
  'country',
  'region',
  'event',
  'source',
];
const exact = (v: unknown, keys: readonly string[]): v is Record<string, unknown> =>
  isRecord(v) &&
  Object.keys(v).length === keys.length &&
  keys.every((key, i) => Object.keys(v)[i] === key);
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const safePositive = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v > 0;
const safeNonNegative = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const ascii = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const sorted = <T>(a: readonly T[], compare: (x: T, y: T) => number) => [...a].sort(compare);

export function isCanonicalUtc(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    utc.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
export function isPlainText(value: unknown, max: number): value is string {
  return (
    typeof value === 'string' &&
    value === value.normalize('NFC') &&
    utf8ByteLength(value) >= 1 &&
    utf8ByteLength(value) <= max &&
    value.trim() === value &&
    !Array.from(value).some((character) => {
      const code = character.codePointAt(0)!;
      return (
        code <= 0x1f ||
        (code >= 0x7f && code <= 0x9f) ||
        code === 0x200e ||
        code === 0x200f ||
        (code >= 0x202a && code <= 0x202e) ||
        (code >= 0x2066 && code <= 0x2069)
      );
    }) &&
    !/[\ud800-\udfff]/u.test(value)
  );
}
function isId(value: unknown, kind?: string): value is string {
  return (
    typeof value === 'string' &&
    value.length <= mobileRegionalEventsCaps.id &&
    id.test(value) &&
    (kind === undefined || value.startsWith(`wrn-${kind}-`))
  );
}
function isHash(value: unknown): value is string {
  return typeof value === 'string' && hash.test(value);
}
function isReference(value: unknown, kind: 'rights' | 'provenance'): value is string {
  return (
    typeof value === 'string' &&
    utf8ByteLength(value) <= 128 &&
    reference.test(value) &&
    value.startsWith(`wrn-${kind}-`)
  );
}
function isLocalized(
  value: unknown,
  cap: number = mobileRegionalEventsCaps.name,
): value is LocalizedText {
  return (
    exact(value, mobileRegionalEventsLocales) &&
    mobileRegionalEventsLocales.every((key) => isPlainText(value[key], cap))
  );
}
function timestamp(value: unknown): value is string {
  return isCanonicalUtc(value);
}
function dateMs(value: string) {
  return Date.parse(value);
}
function canonicalZone(zone: unknown): zone is string {
  if (typeof zone !== 'string' || zone.length > 128) return false;
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: zone }).resolvedOptions().timeZone === zone;
  } catch {
    return false;
  }
}
function wallFor(instant: string, zone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant));
  const read = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${read('year')}-${read('month')}-${read('day')}T${read('hour')}:${read('minute')}:${read('second')}`;
}
function offsetFor(instant: string, zone: string) {
  const d = new Date(instant);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(d);
  const n = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return Math.round(
    (Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second')) -
      d.getTime()) /
      60_000,
  );
}
function validWall(instant: unknown, wall: unknown, offset: unknown, zone: unknown) {
  return (
    timestamp(instant) &&
    typeof wall === 'string' &&
    local.test(wall) &&
    typeof offset === 'number' &&
    Number.isSafeInteger(offset) &&
    offset >= -840 &&
    offset <= 840 &&
    canonicalZone(zone) &&
    wallFor(instant, zone) === wall &&
    offsetFor(instant, zone) === offset
  );
}
function exactSource(v: unknown): v is EventSource {
  return (
    exact(v, [
      'sourceId',
      'names',
      'originalUrl',
      'rightsStatus',
      'licenseId',
      'rightsReference',
      'provenanceReference',
      'publishedAt',
      'observedAt',
      'correctionContactLabel',
    ]) &&
    isId(v.sourceId, 'source') &&
    (isLocalized(v.names) ||
      (exact(v.names, ['und']) && isPlainText(v.names.und, mobileRegionalEventsCaps.name))) &&
    validUrl(v.originalUrl) &&
    v.rightsStatus === 'self-authored-local-fixture' &&
    v.licenseId === 'CC0-1.0' &&
    isReference(v.rightsReference, 'rights') &&
    isReference(v.provenanceReference, 'provenance') &&
    timestamp(v.publishedAt) &&
    timestamp(v.observedAt) &&
    dateMs(v.publishedAt) <= dateMs(v.observedAt) &&
    isPlainText(v.correctionContactLabel, mobileRegionalEventsCaps.name)
  );
}
function validUrl(value: unknown) {
  if (typeof value !== 'string' || utf8ByteLength(value) > mobileRegionalEventsCaps.url)
    return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !!u.host && !u.hash;
  } catch {
    return false;
  }
}
function exactEvent(v: unknown): v is RegionalEvent {
  if (!isRecord(v)) return false;
  const base = [
    'eventId',
    'regionId',
    'sourceId',
    'status',
    'titles',
    'locationNames',
    'summaries',
    'startInstant',
    'startLocal',
    'startUtcOffsetMinutes',
    'timeZone',
    'publishedAt',
    'observedAt',
    'validUntil',
    'contentRevision',
    'contentSha256',
    'rightsStatus',
    'licenseId',
    'rightsReference',
    'provenanceReference',
  ];
  const end = ['endInstant', 'endLocal', 'endUtcOffsetMinutes'];
  const keys = Object.keys(v);
  const hasEnd = end.some((key) => key in v);
  const allowed = [...base, ...(hasEnd ? end : []), ...('mediaId' in v ? ['mediaId'] : [])];
  if (keys.length !== allowed.length || !allowed.every((key, index) => keys[index] === key))
    return false;
  return (
    isId(v.eventId, 'event') &&
    isId(v.regionId, 'region') &&
    isId(v.sourceId, 'source') &&
    ['scheduled', 'changed', 'cancelled'].includes(v.status as string) &&
    isLocalized(v.titles) &&
    isLocalized(v.locationNames) &&
    isLocalized(v.summaries, mobileRegionalEventsCaps.summary) &&
    validWall(v.startInstant, v.startLocal, v.startUtcOffsetMinutes, v.timeZone) &&
    timestamp(v.publishedAt) &&
    timestamp(v.observedAt) &&
    timestamp(v.validUntil) &&
    dateMs(String(v.publishedAt)) <= dateMs(String(v.observedAt)) &&
    safePositive(v.contentRevision) &&
    isHash(v.contentSha256) &&
    v.rightsStatus === 'self-authored-local-fixture' &&
    v.licenseId === 'CC0-1.0' &&
    isReference(v.rightsReference, 'rights') &&
    isReference(v.provenanceReference, 'provenance') &&
    (!hasEnd ||
      (validWall(v.endInstant, v.endLocal, v.endUtcOffsetMinutes, v.timeZone) &&
        dateMs(String(v.endInstant)) >= dateMs(String(v.startInstant)))) &&
    (!('mediaId' in v) || isId(v.mediaId, 'event-media'))
  );
}
function exactMedium(v: unknown): v is EventMedium {
  return (
    exact(v, [
      'mediaId',
      'eventId',
      'assetId',
      'assetPath',
      'mimeType',
      'bytes',
      'width',
      'height',
      'pixelArea',
      'sha256',
      'altTexts',
      'altTextProvenanceReference',
      'rightsStatus',
      'licenseId',
      'rightsReference',
      'provenanceReference',
      'attributionLabel',
    ]) &&
    isId(v.mediaId, 'event-media') &&
    isId(v.eventId, 'event') &&
    typeof v.assetId === 'string' &&
    /^wrn-event-asset-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.assetId) &&
    /^\/wrn-mobile-regional-events\/v1\/assets\/[a-z0-9]+(?:-[a-z0-9]+)*\.(png|webp)$/.test(
      String(v.assetPath),
    ) &&
    ['image/png', 'image/webp'].includes(v.mimeType as string) &&
    safePositive(v.bytes) &&
    (v.bytes as number) <= mobileRegionalEventsCaps.mediaBytes &&
    safePositive(v.width) &&
    (v.width as number) <= mobileRegionalEventsCaps.dimension &&
    safePositive(v.height) &&
    (v.height as number) <= mobileRegionalEventsCaps.dimension &&
    v.pixelArea === (v.width as number) * (v.height as number) &&
    (v.pixelArea as number) <= mobileRegionalEventsCaps.pixels &&
    isHash(v.sha256) &&
    isLocalized(v.altTexts) &&
    isReference(v.altTextProvenanceReference, 'provenance') &&
    v.rightsStatus === 'self-authored-local-fixture' &&
    v.licenseId === 'CC0-1.0' &&
    isReference(v.rightsReference, 'rights') &&
    isReference(v.provenanceReference, 'provenance') &&
    isPlainText(v.attributionLabel, mobileRegionalEventsCaps.name)
  );
}
function exactRevocation(v: unknown): v is Revocation {
  if (!isRecord(v)) return false;
  const expected = [
    'namespace',
    'id',
    'status',
    ...('objectSha256' in v ? ['objectSha256'] : []),
    ...('replacementId' in v ? ['replacementId'] : []),
  ];
  if (
    !exact(v, expected) ||
    !namespaces.includes(v.namespace as RegionalNamespace) ||
    !isId(v.id) ||
    !['blocked', 'gone', 'replaced'].includes(v.status as string) ||
    ('objectSha256' in v && !isHash(v.objectSha256))
  )
    return false;
  return v.status === 'replaced' ? isId(v.replacementId) : !('replacementId' in v);
}
function sortedUnique<T>(items: readonly T[], key: (item: T) => string) {
  return items.every((item, index) => index === 0 || ascii(key(items[index - 1]!), key(item)) < 0);
}
function refsValid(bundle: RegionalEventBundleV1) {
  const cont = new Set(bundle.continents.map((x) => x.continentId));
  const countries = new Set(bundle.countries.map((x) => x.countryId));
  const regions = new Set(bundle.regions.map((x) => x.regionId));
  const sources = new Set(bundle.sources.map((x) => x.sourceId));
  const events = new Set(bundle.events.map((x) => x.eventId));
  const ids: Record<RegionalNamespace, Set<string>> = {
    continent: cont,
    country: countries,
    region: regions,
    event: events,
    source: sources,
  };
  if (
    bundle.countries.some((x) => !cont.has(x.continentId)) ||
    bundle.regions.some((x) => !countries.has(x.countryId)) ||
    bundle.events.some((x) => !regions.has(x.regionId) || !sources.has(x.sourceId)) ||
    bundle.media.some((x) => !events.has(x.eventId))
  )
    return false;
  const links = new Set<string>();
  for (const link of bundle.identityLinks) {
    if (
      !namespaces.includes(link.namespace) ||
      !ids[link.namespace].has(link.sourceId) ||
      !ids[link.namespace].has(link.targetId) ||
      link.sourceId === link.targetId ||
      links.has(`${link.namespace}:${link.sourceId}`)
    )
      return false;
    links.add(`${link.namespace}:${link.sourceId}`);
  }
  for (const namespace of namespaces) {
    const map = new Map(
      bundle.identityLinks
        .filter((x) => x.namespace === namespace)
        .map((x) => [x.sourceId, x.targetId]),
    );
    for (const start of map.keys()) {
      const seen = new Set<string>();
      let next: string | undefined = start;
      while (next) {
        if (seen.has(next)) return false;
        seen.add(next);
        next = map.get(next);
      }
    }
  }
  return (
    bundle.events.every(
      (e) =>
        !e.mediaId ||
        bundle.media.filter((m) => m.mediaId === e.mediaId && m.eventId === e.eventId).length === 1,
    ) &&
    bundle.media.every((m) => bundle.events.filter((e) => e.mediaId === m.mediaId).length === 1) &&
    bundle.revocations.every(
      (r) =>
        ids[r.namespace].has(r.id) &&
        (r.status !== 'replaced' || ids[r.namespace].has(r.replacementId!)),
    )
  );
}
export function canonicalRegionalEventsJson(value: unknown): string {
  /* This entry point deliberately rejects arbitrary JSON. G3-020 hashes only
   * schema-ordered, reconstructed values below; a generic key sorter is not a
   * compatible substitute. */
  if (!isRecord(value)) throw new TypeError('regional-events-schema-value-required');
  return JSON.stringify(value);
}
function localized(value: LocalizedText) {
  return {
    en: value.en,
    de: value.de,
    es: value.es,
    fr: value.fr,
    it: value.it,
    pt: value.pt,
    ru: value.ru,
    el: value.el,
    tr: value.tr,
  };
}
function continent(value: Continent) {
  return { continentId: value.continentId, names: localized(value.names) };
}
function country(value: Country) {
  return {
    countryId: value.countryId,
    continentId: value.continentId,
    names: localized(value.names),
  };
}
function region(value: Region) {
  return { regionId: value.regionId, countryId: value.countryId, names: localized(value.names) };
}
function identityLink(value: IdentityLink) {
  return {
    namespace: value.namespace,
    sourceId: value.sourceId,
    targetId: value.targetId,
    relation: value.relation,
  };
}
function source(value: EventSource) {
  return {
    sourceId: value.sourceId,
    names: 'und' in value.names ? { und: value.names.und } : localized(value.names),
    originalUrl: value.originalUrl,
    rightsStatus: value.rightsStatus,
    licenseId: value.licenseId,
    rightsReference: value.rightsReference,
    provenanceReference: value.provenanceReference,
    publishedAt: value.publishedAt,
    observedAt: value.observedAt,
    correctionContactLabel: value.correctionContactLabel,
  };
}
function eventPreimage(value: RegionalEvent, includeContentSha256 = true) {
  const result: Record<string, unknown> = {
    eventId: value.eventId,
    regionId: value.regionId,
    sourceId: value.sourceId,
    status: value.status,
    titles: localized(value.titles),
    locationNames: localized(value.locationNames),
    summaries: localized(value.summaries),
    startInstant: value.startInstant,
    startLocal: value.startLocal,
    startUtcOffsetMinutes: value.startUtcOffsetMinutes,
    timeZone: value.timeZone,
    publishedAt: value.publishedAt,
    observedAt: value.observedAt,
    validUntil: value.validUntil,
    contentRevision: value.contentRevision,
  };
  if (includeContentSha256) result.contentSha256 = value.contentSha256;
  result.rightsStatus = value.rightsStatus;
  result.licenseId = value.licenseId;
  result.rightsReference = value.rightsReference;
  result.provenanceReference = value.provenanceReference;
  if (value.endInstant !== undefined) {
    result.endInstant = value.endInstant;
    result.endLocal = value.endLocal!;
    result.endUtcOffsetMinutes = value.endUtcOffsetMinutes!;
  }
  if (value.mediaId !== undefined) result.mediaId = value.mediaId;
  return result;
}
function medium(value: EventMedium) {
  return {
    mediaId: value.mediaId,
    eventId: value.eventId,
    assetId: value.assetId,
    assetPath: value.assetPath,
    mimeType: value.mimeType,
    bytes: value.bytes,
    width: value.width,
    height: value.height,
    pixelArea: value.pixelArea,
    sha256: value.sha256,
    altTexts: localized(value.altTexts),
    altTextProvenanceReference: value.altTextProvenanceReference,
    rightsStatus: value.rightsStatus,
    licenseId: value.licenseId,
    rightsReference: value.rightsReference,
    provenanceReference: value.provenanceReference,
    attributionLabel: value.attributionLabel,
  };
}
function revocation(value: Revocation) {
  const result: Record<string, unknown> = {
    namespace: value.namespace,
    id: value.id,
    status: value.status,
  };
  if (value.objectSha256 !== undefined) result.objectSha256 = value.objectSha256;
  if (value.replacementId !== undefined) result.replacementId = value.replacementId;
  return result;
}
export function regionalEventsTaxonomyPreimage(
  bundle: Pick<RegionalEventBundleV1, 'continents' | 'countries' | 'regions' | 'identityLinks'>,
): string {
  return JSON.stringify({
    continents: sorted(bundle.continents, (a, b) => ascii(a.continentId, b.continentId)).map(
      continent,
    ),
    countries: sorted(bundle.countries, (a, b) => ascii(a.countryId, b.countryId)).map(country),
    regions: sorted(bundle.regions, (a, b) => ascii(a.regionId, b.regionId)).map(region),
    identityLinks: sorted(bundle.identityLinks, (a, b) =>
      ascii(
        `${a.namespace}\u0000${a.sourceId}\u0000${a.relation}\u0000${a.targetId}`,
        `${b.namespace}\u0000${b.sourceId}\u0000${b.relation}\u0000${b.targetId}`,
      ),
    ).map(identityLink),
  });
}
export function regionalEventsSourcesPreimage(values: readonly EventSource[]): string {
  return JSON.stringify(sorted(values, (a, b) => ascii(a.sourceId, b.sourceId)).map(source));
}
export function regionalEventsEventsPreimage(values: readonly RegionalEvent[]): string {
  return JSON.stringify(
    sorted(values, (a, b) => ascii(a.eventId, b.eventId)).map((value) => eventPreimage(value)),
  );
}
export function regionalEventsMediaPreimage(values: readonly EventMedium[]): string {
  return JSON.stringify(sorted(values, (a, b) => ascii(a.mediaId, b.mediaId)).map(medium));
}
export function regionalEventsRevocationsPreimage(values: readonly Revocation[]): string {
  return JSON.stringify(sorted(values, compareRevocation).map(revocation));
}
export function regionalEventsEventContentPreimage(value: RegionalEvent): string {
  return JSON.stringify(eventPreimage(value, false));
}
export function canonicalRegionalEventsSafety(
  entries: readonly Revocation[],
  revision: number,
  references: readonly SafetyReference[] = [],
): string {
  return JSON.stringify({
    revision,
    entries: sorted(entries, compareRevocation).map(revocation),
    references: sorted(references, compareSafetyReference).map(safetyReference),
  });
}
export function validateRegionalEventsRevocation(value: unknown): value is Revocation {
  return exactRevocation(value);
}
export function validateRegionalEventsSafetyReference(value: unknown): value is SafetyReference {
  return (
    exact(value, ['namespace', 'id']) &&
    namespaces.includes(value.namespace as RegionalNamespace) &&
    isId(value.id, referencePrefix(value.namespace as RegionalNamespace)) &&
    utf8ByteLength(value.id) <= 128
  );
}
function referencePrefix(namespace: RegionalNamespace) {
  return namespace === 'continent' ? 'cont' : namespace;
}
function safetyReference(value: SafetyReference) {
  return { namespace: value.namespace, id: value.id };
}
export function compareRevocation(a: Revocation, b: Revocation) {
  return ascii(
    `${a.namespace}\u0000${a.id}\u0000${a.objectSha256 ?? ''}\u0000${a.status}\u0000${a.replacementId ?? ''}`,
    `${b.namespace}\u0000${b.id}\u0000${b.objectSha256 ?? ''}\u0000${b.status}\u0000${b.replacementId ?? ''}`,
  );
}
export function compareSafetyReference(a: SafetyReference, b: SafetyReference) {
  return ascii(`${a.namespace}\u0000${a.id}`, `${b.namespace}\u0000${b.id}`);
}
export function validateRegionalEventsPin(pin: unknown): pin is RegionalEventsBuildPin {
  return (
    exact(pin, [
      'schema',
      'contractVersion',
      'path',
      'bundleRevision',
      'taxonomyRevision',
      'transportSha256',
    ]) &&
    pin.schema === mobileRegionalEventsSchema &&
    pin.contractVersion === mobileRegionalEventsContractVersion &&
    pin.path === mobileRegionalEventsPath &&
    safePositive(pin.bundleRevision) &&
    safePositive(pin.taxonomyRevision) &&
    isHash(pin.transportSha256)
  );
}
export async function validateRegionalEventBundle(
  candidate: unknown,
): Promise<RegionalEventBundleV1 | null> {
  const keys = [
    'schema',
    'contractVersion',
    'minimumAppContractVersion',
    'bundleRevision',
    'taxonomyRevision',
    'generatedAt',
    'validUntil',
    'locales',
    'taxonomySha256',
    'sourcesSha256',
    'eventsSha256',
    'mediaSha256',
    'revocationsSha256',
    'continents',
    'countries',
    'regions',
    'identityLinks',
    'sources',
    'events',
    'media',
    'revocationRevision',
    'revocations',
  ];
  if (
    !exact(candidate, keys) ||
    candidate.schema !== mobileRegionalEventsSchema ||
    candidate.contractVersion !== mobileRegionalEventsContractVersion ||
    candidate.minimumAppContractVersion !== mobileRegionalEventsContractVersion ||
    !safePositive(candidate.bundleRevision) ||
    !safePositive(candidate.taxonomyRevision) ||
    !timestamp(candidate.generatedAt) ||
    !timestamp(candidate.validUntil) ||
    dateMs(candidate.generatedAt) >= dateMs(candidate.validUntil) ||
    dateMs(candidate.validUntil) - dateMs(candidate.generatedAt) > 7 * 86400000 ||
    !Array.isArray(candidate.locales) ||
    JSON.stringify(candidate.locales) !== JSON.stringify(mobileRegionalEventsLocales) ||
    ![
      candidate.continents,
      candidate.countries,
      candidate.regions,
      candidate.identityLinks,
      candidate.sources,
      candidate.events,
      candidate.media,
      candidate.revocations,
    ].every(Array.isArray) ||
    ![
      candidate.taxonomySha256,
      candidate.sourcesSha256,
      candidate.eventsSha256,
      candidate.mediaSha256,
      candidate.revocationsSha256,
    ].every(isHash) ||
    !safeNonNegative(candidate.revocationRevision) ||
    utf8ByteLength(JSON.stringify(candidate)) > mobileRegionalEventsMaxDecodedJsonBytes
  )
    return null;
  const b = candidate as unknown as RegionalEventBundleV1;
  if (
    b.continents.length > 8 ||
    b.countries.length > 256 ||
    b.regions.length > 2048 ||
    b.identityLinks.length > 4096 ||
    b.sources.length > 512 ||
    b.events.length > 4096 ||
    b.media.length > 64 ||
    b.revocations.length > 512 ||
    !b.continents.every(
      (x) =>
        exact(x, ['continentId', 'names']) && isId(x.continentId, 'cont') && isLocalized(x.names),
    ) ||
    !b.countries.every(
      (x) =>
        exact(x, ['countryId', 'continentId', 'names']) &&
        isId(x.countryId, 'country') &&
        isId(x.continentId, 'cont') &&
        isLocalized(x.names),
    ) ||
    !b.regions.every(
      (x) =>
        exact(x, ['regionId', 'countryId', 'names']) &&
        isId(x.regionId, 'region') &&
        isId(x.countryId, 'country') &&
        isLocalized(x.names),
    ) ||
    !b.identityLinks.every(
      (x) =>
        exact(x, ['namespace', 'sourceId', 'targetId', 'relation']) &&
        namespaces.includes(x.namespace) &&
        isId(x.sourceId) &&
        isId(x.targetId) &&
        ['alias', 'successor'].includes(x.relation),
    ) ||
    !b.sources.every(exactSource) ||
    !b.events.every(exactEvent) ||
    !b.media.every(exactMedium) ||
    !b.revocations.every(exactRevocation) ||
    !sortedUnique(b.continents, (x) => x.continentId) ||
    !sortedUnique(b.countries, (x) => x.countryId) ||
    !sortedUnique(b.regions, (x) => x.regionId) ||
    !sortedUnique(b.sources, (x) => x.sourceId) ||
    !sortedUnique(b.events, (x) => x.eventId) ||
    !sortedUnique(b.media, (x) => x.mediaId) ||
    !sortedUnique(
      b.identityLinks,
      (x) => `${x.namespace}\u0000${x.sourceId}\u0000${x.relation}\u0000${x.targetId}`,
    ) ||
    !sortedUnique(
      b.revocations,
      (x) =>
        `${x.namespace}\u0000${x.id}\u0000${x.objectSha256 ?? ''}\u0000${x.status}\u0000${x.replacementId ?? ''}`,
    ) ||
    !refsValid(b)
  )
    return null;
  const generatedAt = dateMs(b.generatedAt);
  const bundleValidUntil = dateMs(b.validUntil);
  if (
    b.sources.some((source) => dateMs(source.observedAt) > generatedAt) ||
    b.events.some(
      (event) =>
        dateMs(event.observedAt) > generatedAt ||
        generatedAt >= dateMs(event.validUntil) ||
        dateMs(event.validUntil) > bundleValidUntil,
    )
  )
    return null;
  const [taxonomy, sources, events, media, revocations] = await Promise.all([
    sha256Utf8(regionalEventsTaxonomyPreimage(b)),
    sha256Utf8(regionalEventsSourcesPreimage(b.sources)),
    sha256Utf8(regionalEventsEventsPreimage(b.events)),
    sha256Utf8(regionalEventsMediaPreimage(b.media)),
    sha256Utf8(regionalEventsRevocationsPreimage(b.revocations)),
  ]);
  if (
    taxonomy !== b.taxonomySha256 ||
    sources !== b.sourcesSha256 ||
    events !== b.eventsSha256 ||
    media !== b.mediaSha256 ||
    revocations !== b.revocationsSha256
  )
    return null;
  for (const event of b.events)
    if ((await sha256Utf8(regionalEventsEventContentPreimage(event))) !== event.contentSha256)
      return null;
  return Object.freeze(b);
}
export function resolveRegionalAlias(
  bundle: RegionalEventBundleV1,
  regionId: string,
): string | null {
  const links = new Map(
    bundle.identityLinks
      .filter((x) => x.namespace === 'region' && x.relation === 'alias')
      .map((x) => [x.sourceId, x.targetId]),
  );
  let result = regionId;
  const seen = new Set<string>();
  while (links.has(result)) {
    if (seen.has(result)) return null;
    seen.add(result);
    result = links.get(result)!;
  }
  return bundle.regions.some((r) => r.regionId === result) ? result : null;
}
