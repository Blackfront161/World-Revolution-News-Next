import { sha256Utf8, utf8ByteLength } from '../index.js';
import { normaliseDirectoryUrl } from './mobile-content-directory-v1.js';

export const productionRegionalEventsSchemaV1 = 'wrn.production-regional-events.v1' as const;
export const productionRegionalEventsLimitsV1 = Object.freeze({
  bytes: 128 * 1024,
  continents: 7,
  countries: 64,
  regions: 64,
  sources: 64,
  events: 256,
  projection: 5,
  freshnessMs: 7 * 24 * 60 * 60 * 1000,
});
export type ProductionRegionalScheduleV1 =
  | Readonly<{ precision: 'day'; startDate: string; endDate: string; timeZone: string }>
  | Readonly<{ precision: 'minute'; startAt: string; endAt: string; timeZone: string }>;
export type ProductionRegionalSourceV1 = Readonly<{
  id: string;
  name: string;
  language: string;
  url: string;
  kind: 'organizer' | 'venue' | 'attributed-announcement';
  checkedOn: string;
}>;
export type ProductionRegionalEventV1 = Readonly<{
  id: string;
  regionId: string;
  sourceId: string;
  title: string;
  language: string;
  venue: string | null;
  originalUrl: string;
  status: 'scheduled' | 'changed' | 'cancelled';
  schedule: ProductionRegionalScheduleV1;
}>;
export type ProductionRegionalEventsV1 = Readonly<{
  schema: typeof productionRegionalEventsSchemaV1;
  revision: number;
  generatedAt: string;
  validUntil: string;
  rights: 'metadata-references-only';
  reviewReference: string;
  continents: readonly Readonly<{ id: string; name: string }>[];
  countries: readonly Readonly<{ id: string; continentId: string; code: string; name: string }>[];
  regions: readonly Readonly<{ id: string; countryId: string; name: string }>[];
  sources: readonly ProductionRegionalSourceV1[];
  events: readonly ProductionRegionalEventV1[];
}>;
export type ProductionRegionalSelectionV1 = Readonly<{
  continentId: string | null;
  countryId: string | null;
  regionId: string | null;
}>;
export type ProductionRegionalProjectionV1 = Readonly<{
  status: 'ready' | 'empty' | 'unselected' | 'invalid-selection' | 'stale' | 'unavailable';
  events: readonly ProductionRegionalEventV1[];
}>;
type Row = Record<string, unknown>;
const dayMs = 86_400_000;
const compareAscii = (left: string, right: string) => (left < right ? -1 : left > right ? 1 : 0);
const proofs = new WeakSet<object>();
const exact = (v: unknown, keys: readonly string[]): v is Row =>
  typeof v === 'object' &&
  v !== null &&
  !Array.isArray(v) &&
  Object.keys(v).length === keys.length &&
  keys.every((key) => Object.hasOwn(v, key));
const id = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(v) && v.length <= 128;
const text = (v: unknown, max = 300): v is string =>
  typeof v === 'string' &&
  v.isWellFormed() &&
  v.trim() === v &&
  utf8ByteLength(v) <= max &&
  /[^\p{White_Space}\p{Default_Ignorable_Code_Point}]/u.test(v) &&
  !/[\p{Cc}\p{Zl}\p{Zp}\p{Bidi_Control}<>]/u.test(v);
const language = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u.test(v) && v.length <= 35;
const instant = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString() === v;
const day = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(v) && instant(`${v}T00:00:00.000Z`);
const url = (v: unknown): v is string => typeof v === 'string' && normaliseDirectoryUrl(v) === v;
const zone = (v: unknown): v is string => {
  if (typeof v !== 'string' || v.length > 100 || !/^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+$/u.test(v))
    return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: v }).format(0);
    return true;
  } catch {
    return false;
  }
};
const rows = (v: unknown, max: number): v is Row[] =>
  Array.isArray(v) &&
  v.length <= max &&
  v.every((item: unknown) => typeof item === 'object' && item !== null && !Array.isArray(item)) &&
  new Set(v.map((item: Row) => item.id)).size === v.length;
const sameOrigin = (left: string, right: string) => new URL(left).origin === new URL(right).origin;
function freeze<T>(v: T): T {
  if (typeof v === 'object' && v !== null) {
    for (const child of Object.values(v)) freeze(child);
    Object.freeze(v);
  }
  return v;
}
function validSchedule(v: unknown): v is ProductionRegionalScheduleV1 {
  if (exact(v, ['precision', 'startDate', 'endDate', 'timeZone']) && v.precision === 'day')
    return (
      day(v.startDate) &&
      day(v.endDate) &&
      zone(v.timeZone) &&
      v.startDate <= v.endDate &&
      Date.parse(v.endDate) - Date.parse(v.startDate) <= 366 * dayMs
    );
  if (!exact(v, ['precision', 'startAt', 'endAt', 'timeZone']) || v.precision !== 'minute')
    return false;
  return (
    instant(v.startAt) &&
    instant(v.endAt) &&
    zone(v.timeZone) &&
    v.startAt.endsWith(':00.000Z') &&
    v.endAt.endsWith(':00.000Z') &&
    v.startAt < v.endAt &&
    Date.parse(v.endAt) - Date.parse(v.startAt) <= 366 * dayMs
  );
}
function validDocument(v: unknown): v is ProductionRegionalEventsV1 {
  if (
    !exact(v, [
      'schema',
      'revision',
      'generatedAt',
      'validUntil',
      'rights',
      'reviewReference',
      'continents',
      'countries',
      'regions',
      'sources',
      'events',
    ]) ||
    v.schema !== productionRegionalEventsSchemaV1 ||
    !Number.isSafeInteger(v.revision) ||
    (v.revision as number) < 1 ||
    !instant(v.generatedAt) ||
    !instant(v.validUntil) ||
    v.generatedAt >= v.validUntil ||
    Date.parse(v.validUntil) - Date.parse(v.generatedAt) >
      productionRegionalEventsLimitsV1.freshnessMs ||
    v.rights !== 'metadata-references-only' ||
    !id(v.reviewReference) ||
    !rows(v.continents, productionRegionalEventsLimitsV1.continents) ||
    !rows(v.countries, productionRegionalEventsLimitsV1.countries) ||
    !rows(v.regions, productionRegionalEventsLimitsV1.regions) ||
    !rows(v.sources, productionRegionalEventsLimitsV1.sources) ||
    !rows(v.events, productionRegionalEventsLimitsV1.events)
  )
    return false;
  const { continents, countries, regions, sources, events, generatedAt, validUntil } = v;
  if (
    !continents.every((row) => exact(row, ['id', 'name']) && id(row.id) && text(row.name)) ||
    !countries.every(
      (row) =>
        exact(row, ['id', 'continentId', 'code', 'name']) &&
        id(row.id) &&
        continents.some((parent) => parent.id === row.continentId) &&
        typeof row.code === 'string' &&
        /^[A-Z]{2}$/u.test(row.code) &&
        text(row.name),
    ) ||
    new Set(countries.map((row) => row.code)).size !== countries.length ||
    !regions.every(
      (row) =>
        exact(row, ['id', 'countryId', 'name']) &&
        id(row.id) &&
        countries.some((parent) => parent.id === row.countryId) &&
        text(row.name),
    ) ||
    !sources.every(
      (row) =>
        exact(row, ['id', 'name', 'language', 'url', 'kind', 'checkedOn']) &&
        id(row.id) &&
        text(row.name) &&
        language(row.language) &&
        url(row.url) &&
        ['organizer', 'venue', 'attributed-announcement'].includes(row.kind as string) &&
        day(row.checkedOn) &&
        row.checkedOn <= generatedAt.slice(0, 10) &&
        Date.parse(validUntil) <= Date.parse(row.checkedOn) + 8 * dayMs,
    )
  )
    return false;
  const allIds = [...continents, ...countries, ...regions, ...sources, ...events].map(
    (row) => row.id,
  );
  if (new Set(allIds).size !== allIds.length) return false;
  return events.every((row) => {
    if (
      !exact(row, [
        'id',
        'regionId',
        'sourceId',
        'title',
        'language',
        'venue',
        'originalUrl',
        'status',
        'schedule',
      ]) ||
      !id(row.id) ||
      !regions.some((region) => region.id === row.regionId) ||
      !text(row.title, 500) ||
      !language(row.language) ||
      !(row.venue === null || text(row.venue, 500)) ||
      !url(row.originalUrl) ||
      !['scheduled', 'changed', 'cancelled'].includes(row.status as string) ||
      !validSchedule(row.schedule)
    )
      return false;
    const source = sources.find((item) => item.id === row.sourceId);
    return source !== undefined && sameOrigin(row.originalUrl, source.url as string);
  });
}

/** The expected hash is compiled/trusted; publisher metadata cannot choose its own pin. */
export async function validateProductionRegionalEventsV1(
  raw: unknown,
  expectedSha256: unknown,
): Promise<ProductionRegionalEventsV1 | null> {
  try {
    if (
      typeof raw !== 'string' ||
      !raw.isWellFormed() ||
      raw.charCodeAt(0) === 0xfeff ||
      utf8ByteLength(raw) > productionRegionalEventsLimitsV1.bytes ||
      typeof expectedSha256 !== 'string' ||
      !/^[a-f0-9]{64}$/u.test(expectedSha256) ||
      (await sha256Utf8(raw)) !== expectedSha256
    )
      return null;
    const value: unknown = JSON.parse(raw);
    if (!validDocument(value)) return null;
    const result = freeze(value);
    proofs.add(result);
    return result;
  } catch {
    return null;
  }
}

function localDate(now: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
function scheduleDate(schedule: ProductionRegionalScheduleV1): string {
  return schedule.precision === 'day'
    ? schedule.startDate
    : localDate(Date.parse(schedule.startAt), schedule.timeZone);
}

/** Explicit local choice only. No current facts are projected from expired snapshots. */
export function projectProductionRegionalEventsV1(
  document: ProductionRegionalEventsV1,
  selection: ProductionRegionalSelectionV1,
  now: number,
): ProductionRegionalProjectionV1 {
  const result = (
    status: ProductionRegionalProjectionV1['status'],
    events: readonly ProductionRegionalEventV1[] = [],
  ) => Object.freeze({ status, events: Object.freeze([...events]) });
  try {
    if (!proofs.has(document) || !Number.isFinite(now) || now < Date.parse(document.generatedAt))
      return result('unavailable');
    if (now >= Date.parse(document.validUntil)) return result('stale');
    if (!exact(selection, ['continentId', 'countryId', 'regionId']))
      return result('invalid-selection');
    const { continentId, countryId, regionId } = selection;
    if (continentId === null && countryId === null && regionId === null)
      return result('unselected');
    if (
      !document.continents.some((item) => item.id === continentId) ||
      (countryId !== null &&
        !document.countries.some(
          (item) => item.id === countryId && item.continentId === continentId,
        )) ||
      (regionId !== null &&
        (countryId === null ||
          !document.regions.some((item) => item.id === regionId && item.countryId === countryId)))
    )
      return result('invalid-selection');
    const countryIds = new Set(
      document.countries
        .filter(
          (item) =>
            item.continentId === continentId && (countryId === null || item.id === countryId),
        )
        .map((item) => item.id),
    );
    const regionIds = new Set(
      document.regions
        .filter(
          (item) => countryIds.has(item.countryId) && (regionId === null || item.id === regionId),
        )
        .map((item) => item.id),
    );
    const events = document.events
      .filter(
        (event) =>
          event.status !== 'cancelled' &&
          regionIds.has(event.regionId) &&
          (event.schedule.precision === 'day'
            ? event.schedule.endDate >= localDate(now, event.schedule.timeZone)
            : Date.parse(event.schedule.endAt) > now),
      )
      .toSorted((left, right) => {
        const date = compareAscii(scheduleDate(left.schedule), scheduleDate(right.schedule));
        if (date) return date;
        // Day precision has no known clock time. Give it a fixed group so mixed
        // day/minute comparisons form a transitive order without inventing one.
        if (left.schedule.precision !== right.schedule.precision)
          return left.schedule.precision === 'day' ? -1 : 1;
        if (left.schedule.precision === 'minute' && right.schedule.precision === 'minute') {
          const time = compareAscii(left.schedule.startAt, right.schedule.startAt);
          if (time) return time;
        }
        return compareAscii(left.id, right.id);
      })
      .slice(0, productionRegionalEventsLimitsV1.projection);
    return result(events.length ? 'ready' : 'empty', events);
  } catch {
    return result('unavailable');
  }
}
