import { describe, expect, it } from 'vitest';
import sourceCandidate from '../../../../docs/evidence/WRN-CURRENT-REGIONAL-CONTRACT-2026-09-12/input.json';
import { sha256Utf8 } from '../../src/index';
import {
  productionRegionalEventsLimitsV1,
  projectProductionRegionalEventsV1,
  validateProductionRegionalEventsV1,
  type ProductionRegionalEventsV1,
  type ProductionRegionalSelectionV1,
} from '../../src/directory/production-regional-events-v1';

type Mutable<T> = { -readonly [K in keyof T]: T[K] extends object ? Mutable<T[K]> : T[K] };
const now = Date.parse('2026-09-12T01:00:00.000Z');
const choice: ProductionRegionalSelectionV1 = {
  continentId: 'north-america',
  countryId: 'us',
  regionId: 'new-york',
};
function input(): Mutable<ProductionRegionalEventsV1> {
  return {
    schema: 'wrn.production-regional-events.v1',
    revision: 1,
    generatedAt: '2026-09-12T00:00:00.000Z',
    validUntil: '2026-09-19T00:00:00.000Z',
    rights: 'metadata-references-only',
    reviewReference: 'wrn-regional-review-2026-09-12',
    continents: [
      { id: 'north-america', name: 'North America' },
      { id: 'europe', name: 'Europe' },
    ],
    countries: [
      { id: 'us', continentId: 'north-america', code: 'US', name: 'United States' },
      { id: 'gb', continentId: 'europe', code: 'GB', name: 'United Kingdom' },
    ],
    regions: [
      { id: 'new-york', countryId: 'us', name: 'New York' },
      { id: 'london', countryId: 'gb', name: 'London' },
    ],
    sources: [
      {
        id: 'publisher',
        name: 'Publisher',
        language: 'en',
        url: 'https://events.example.org/',
        kind: 'organizer',
        checkedOn: '2026-09-12',
      },
    ],
    events: [
      {
        id: 'fair',
        sourceId: 'publisher',
        regionId: 'new-york',
        title: 'Book fair',
        language: 'en',
        venue: null,
        originalUrl: 'https://events.example.org/book-fair',
        status: 'scheduled',
        schedule: {
          precision: 'day',
          startDate: '2026-09-11',
          endDate: '2026-09-12',
          timeZone: 'America/New_York',
        },
      },
    ],
  };
}
async function read(value: unknown) {
  const raw = JSON.stringify(value);
  return validateProductionRegionalEventsV1(raw, await sha256Utf8(raw));
}
async function valid(value = input()) {
  const result = await read(value);
  if (!result) throw Error('Expected a valid explicit test catalog');
  return result;
}
describe('current regional events integrity', () => {
  it('validates the frozen five-source candidate and its published local clock times', async () => {
    const raw = JSON.stringify(sourceCandidate);
    const catalog = await validateProductionRegionalEventsV1(
      raw,
      'fa62d54dfaf562f41b4a4a5f54e6338985e2d84d9e9dc92b0e21d894ff17174b',
    );
    expect(catalog).not.toBeNull();
    expect(catalog!.events).toHaveLength(5);
    expect(catalog!.sources).toHaveLength(5);
    expect(catalog!.events.filter((event) => event.schedule.precision === 'day')).toHaveLength(2);
    const times = catalog!.events
      .filter((event) => event.schedule.precision === 'minute')
      .map((event) => {
        if (event.schedule.precision !== 'minute') throw Error('Expected minute schedule');
        const format = (at: string) =>
          new Intl.DateTimeFormat('en-GB', {
            timeZone: event.schedule.timeZone,
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
          }).format(new Date(at));
        return [event.id, format(event.schedule.startAt), format(event.schedule.endAt)];
      });
    expect(times).toEqual([
      ['event-london-anarchist-bookfair-2026', '10:00', '18:00'],
      ['event-manchester-salford-anarchist-bookfair-2026', '10:00', '16:00'],
      ['event-sao-paulo-feira-anarquista-2026', '10:00', '19:00'],
    ]);
    const projected = projectProductionRegionalEventsV1(
      catalog!,
      { continentId: 'continent-europe', countryId: 'country-gb', regionId: null },
      Date.parse(catalog!.generatedAt),
    );
    expect(projected.events.map((event) => event.id)).toEqual([
      'event-london-anarchist-bookfair-2026',
      'event-manchester-salford-anarchist-bookfair-2026',
    ]);
  });
  it('detaches and freezes every level, preserves source dates and day precision', async () => {
    const value = input();
    const parsed = await valid(value);
    value.events[0]!.title = 'Changed caller';
    expect(parsed.events[0]!.title).toBe('Book fair');
    expect(Object.isFrozen(parsed.events[0]!.schedule)).toBe(true);
    expect(parsed.sources[0]!.checkedOn).toBe('2026-09-12');
    expect(parsed.events[0]!.schedule).not.toHaveProperty('startAt');
    expect(projectProductionRegionalEventsV1(structuredClone(parsed), choice, now).status).toBe(
      'unavailable',
    );
  });
  it('binds the exact raw UTF-8 hash and inclusive transport cap', async () => {
    const raw = JSON.stringify(input());
    const limit = productionRegionalEventsLimitsV1.bytes;
    for (const size of [limit - 1, limit, limit + 1]) {
      const padded = raw + ' '.repeat(size - new TextEncoder().encode(raw).length);
      const result = await validateProductionRegionalEventsV1(padded, await sha256Utf8(padded));
      expect(result !== null).toBe(size <= limit);
    }
    expect(await validateProductionRegionalEventsV1(raw + ' ', await sha256Utf8(raw))).toBeNull();
    expect(
      await validateProductionRegionalEventsV1('\ufeff' + raw, await sha256Utf8('\ufeff' + raw)),
    ).toBeNull();
    expect(await validateProductionRegionalEventsV1(raw, 'A'.repeat(64))).toBeNull();
    expect(await validateProductionRegionalEventsV1('{', await sha256Utf8('{'))).toBeNull();
  });
  it.each(['\u200b', '\u2060', 'line\nfeed', 'text\u202e', '<b>label</b>', '\ud800', ' trim '])(
    'rejects unsafe or invisible labels %j',
    async (title) => {
      const value = input();
      value.events[0]!.title = title;
      expect(await read(value)).toBeNull();
    },
  );
  it('allows meaningful multilingual and joined emoji labels', async () => {
    const value = input();
    value.events[0]!.title = 'São Paulo · Книги · 👩‍👩‍👧‍👦';
    expect(await read(value)).not.toBeNull();
  });
  it.each([
    'http://events.example.org/',
    'https://name:password@events.example.org/',
    'https://localhost/',
    'https://127.0.0.1/',
    'https://events.internal/',
    'javascript:alert(1)',
  ])('rejects unsafe original links %s', async (originalUrl) => {
    const value = input();
    value.events[0]!.originalUrl = originalUrl;
    expect(await read(value)).toBeNull();
  });
  it('rejects duplicate, dangling and cross-origin identities and unknown fields', async () => {
    const mutations: ((value: Mutable<ProductionRegionalEventsV1>) => void)[] = [
      (v) => {
        v.events.push(structuredClone(v.events[0]!));
      },
      (v) => {
        v.events[0]!.id = 'publisher';
      },
      (v) => {
        v.events[0]!.sourceId = 'missing';
      },
      (v) => {
        v.events[0]!.regionId = 'missing';
      },
      (v) => {
        v.regions[0]!.countryId = 'missing';
      },
      (v) => {
        v.countries[0]!.continentId = 'missing';
      },
      (v) => {
        v.countries[1]!.code = 'US';
      },
      (v) => {
        v.events[0]!.originalUrl = 'https://different.example.org/';
      },
      (v) => {
        Object.assign(v.events[0]!, { image: 'unreviewed.png' });
      },
      (v) => {
        Object.assign(v, { extra: true });
      },
      (v) => {
        Object.assign(v.sources[0]!, { kind: 'unverified' });
      },
    ];
    for (const mutate of mutations) {
      const value = input();
      mutate(value);
      expect(await read(value)).toBeNull();
    }
  });
  it('rejects old/future source checks and excessive/future-format releases', async () => {
    for (const checkedOn of ['2026-09-10', '2026-09-13', '2026-02-30']) {
      const value = input();
      value.sources[0]!.checkedOn = checkedOn;
      expect(await read(value)).toBeNull();
    }
    for (const until of ['2026-09-19T00:00:00.001Z', '2026-09-12T00:00:00.000Z']) {
      const value = input();
      value.validUntil = until;
      expect(await read(value)).toBeNull();
    }
    expect(await read({ ...input(), revision: 0 })).toBeNull();
    expect(await read({ ...input(), schema: 'wrn.production-regional-events.v2' })).toBeNull();
    expect(await read({ ...input(), rights: 'CC0-1.0' })).toBeNull();
  });
  it('validates real calendar days, ordered ranges and supported IANA zones', async () => {
    const value = input();
    value.events[0]!.schedule = {
      precision: 'day',
      startDate: '2028-02-29',
      endDate: '2028-02-29',
      timeZone: 'Europe/London',
    };
    expect(await read(value)).not.toBeNull();
    for (const schedule of [
      {
        precision: 'day',
        startDate: '2026-02-29',
        endDate: '2026-03-01',
        timeZone: 'Europe/London',
      },
      {
        precision: 'day',
        startDate: '2026-09-13',
        endDate: '2026-09-12',
        timeZone: 'Europe/London',
      },
      {
        precision: 'day',
        startDate: '2026-09-12',
        endDate: '2026-09-12',
        timeZone: 'Moon/Unknown',
      },
      {
        precision: 'day',
        startDate: '2026-09-12',
        endDate: '2028-09-12',
        timeZone: 'Europe/London',
      },
      {
        precision: 'minute',
        startAt: '2026-09-12T00:00:01.000Z',
        endAt: '2026-09-12T03:00:00.000Z',
        timeZone: 'Europe/London',
      },
      {
        precision: 'minute',
        startAt: '2026-09-12T03:00:00.000Z',
        endAt: '2026-09-12T03:00:00.000Z',
        timeZone: 'Europe/London',
      },
    ])
      expect(await read({ ...value, events: [{ ...value.events[0], schedule }] })).toBeNull();
  });
  it('enforces event and source count caps independently of transport bytes', async () => {
    const value = input();
    value.events = Array.from({ length: 256 }, (_, i) => ({
      ...value.events[0]!,
      id: `event-${i}`,
    }));
    expect(await read(value)).not.toBeNull();
    value.events.push({ ...value.events[0]!, id: 'event-256' });
    expect(await read(value)).toBeNull();
    value.events = [];
    value.sources = Array.from({ length: 65 }, (_, i) => ({
      ...value.sources[0]!,
      id: `source-${i}`,
    }));
    expect(await read(value)).toBeNull();
  });
});
describe('explicit five-event projection', () => {
  it('handles clock and expiry boundaries without treating expired bytes as corrupt', async () => {
    const catalog = await valid();
    const start = Date.parse(catalog.generatedAt),
      end = Date.parse(catalog.validUntil);
    expect(projectProductionRegionalEventsV1(catalog, choice, start - 1).status).toBe(
      'unavailable',
    );
    expect(projectProductionRegionalEventsV1(catalog, choice, start).status).toBe('ready');
    expect(projectProductionRegionalEventsV1(catalog, choice, end - 1).status).toBe('empty');
    expect(projectProductionRegionalEventsV1(catalog, choice, end).status).toBe('stale');
    for (const clock of [NaN, Infinity, -Infinity])
      expect(projectProductionRegionalEventsV1(catalog, choice, clock).status).toBe('unavailable');
  });
  it('uses the event timezone at midnight and includes an entire unknown-time end day', async () => {
    const value = input();
    value.events[0]!.schedule = {
      precision: 'day',
      startDate: '2026-09-11',
      endDate: '2026-09-11',
      timeZone: 'America/New_York',
    };
    const catalog = await valid(value),
      boundary = Date.parse('2026-09-12T04:00:00.000Z');
    expect(projectProductionRegionalEventsV1(catalog, choice, boundary - 1).events).toHaveLength(1);
    expect(projectProductionRegionalEventsV1(catalog, choice, boundary).status).toBe('empty');
  });
  it('retains ongoing timed events only until their exact end instant', async () => {
    const value = input();
    value.events[0]!.schedule = {
      precision: 'minute',
      startAt: '2026-09-12T00:00:00.000Z',
      endAt: '2026-09-12T03:00:00.000Z',
      timeZone: 'Europe/London',
    };
    const catalog = await valid(value),
      end = Date.parse('2026-09-12T03:00:00.000Z');
    expect(projectProductionRegionalEventsV1(catalog, choice, end - 1).events).toHaveLength(1);
    expect(projectProductionRegionalEventsV1(catalog, choice, end).events).toHaveLength(0);
  });
  it('requires explicit hierarchical choice and excludes cancellations', async () => {
    const value = input();
    const catalog = await valid(value);
    expect(
      projectProductionRegionalEventsV1(
        catalog,
        { continentId: null, countryId: null, regionId: null },
        now,
      ).status,
    ).toBe('unselected');
    for (const selection of [
      { ...choice, continentId: 'europe' },
      { ...choice, countryId: null },
      { ...choice, regionId: 'london' },
      { ...choice, regionId: 'missing' },
    ])
      expect(projectProductionRegionalEventsV1(catalog, selection, now).status).toBe(
        'invalid-selection',
      );
    expect(
      projectProductionRegionalEventsV1(
        catalog,
        { continentId: 'europe', countryId: 'gb', regionId: 'london' },
        now,
      ).status,
    ).toBe('empty');
    expect(
      projectProductionRegionalEventsV1(
        catalog,
        { ...choice, regionId: null, countryId: null },
        now,
      ).events,
    ).toHaveLength(1);
    value.events[0]!.status = 'cancelled';
    expect(projectProductionRegionalEventsV1(await valid(value), choice, now).status).toBe('empty');
  });
  it('sorts mixed precision transitively, keeps stable IDs and caps at five', async () => {
    const value = input();
    const base = value.events[0]!;
    value.events = ['z', 'a', 'e', 'c', 'd', 'b'].map((id) => ({
      ...base,
      id,
      schedule: {
        precision: 'day' as const,
        startDate: '2026-09-12',
        endDate: '2026-09-12',
        timeZone: 'America/New_York',
      },
    }));
    value.events[1]!.schedule = {
      precision: 'minute',
      startAt: '2026-09-12T14:00:00.000Z',
      endAt: '2026-09-12T15:00:00.000Z',
      timeZone: 'America/New_York',
    };
    const before = JSON.stringify(value.events);
    const catalog = await valid(value);
    const projected = projectProductionRegionalEventsV1(catalog, choice, now);
    expect(projected.events.map((event) => event.id)).toEqual(['b', 'c', 'd', 'e', 'z']);
    expect(JSON.stringify(value.events)).toBe(before);
    expect(Object.isFrozen(projected.events)).toBe(true);
  });
});
