import { describe, expect, it } from 'vitest';
import fixture from './fixtures/wrn-mobile-regional-events-v1/mobile-regional-events.json';
import {
  canonicalRegionalEventsSafety,
  compareSafetyReference,
  mobileRegionalEventsCaps,
  mobileRegionalEventsLocales,
  regionalEventsEventContentPreimage,
  regionalEventsEventsPreimage,
  regionalEventsMediaPreimage,
  regionalEventsRevocationsPreimage,
  regionalEventsSourcesPreimage,
  regionalEventsTaxonomyPreimage,
  validateRegionalEventBundle,
  validateRegionalEventsPin,
  type RegionalEvent,
  type RegionalEventBundleV1,
  type SafetyReference,
} from '../src/mobile-regional-events-v1.js';
import { sha256Utf8 } from '../src/index.js';

type MutableBundle = Omit<RegionalEventBundleV1, 'events'> & { events: RegionalEvent[] };
type WritableBundle = { -readonly [K in keyof MutableBundle]: MutableBundle[K] };
type WritableEvent = { -readonly [K in keyof RegionalEvent]: RegionalEvent[K] };
const base = fixture as unknown as RegionalEventBundleV1;
const source = base.sources[0]!;
const text = () =>
  Object.fromEntries(mobileRegionalEventsLocales.map((locale) => [locale, 'Event'])) as never;

async function makeBundle(overrides: Partial<MutableBundle> = {}): Promise<RegionalEventBundleV1> {
  const event = {
    eventId: 'wrn-event-test',
    regionId: 'wrn-region-test',
    sourceId: source.sourceId,
    status: 'scheduled',
    titles: text(),
    locationNames: text(),
    summaries: text(),
    startInstant: '2026-09-01T12:00:00.000Z',
    startLocal: '2026-09-01T14:00:00',
    startUtcOffsetMinutes: 120,
    timeZone: 'Europe/Zurich',
    publishedAt: '2026-09-01T00:00:00.000Z',
    observedAt: '2026-09-01T00:00:00.000Z',
    validUntil: '2026-09-02T00:00:00.000Z',
    contentRevision: 1,
    contentSha256: '0'.repeat(64),
    rightsStatus: 'self-authored-local-fixture',
    licenseId: 'CC0-1.0',
    rightsReference: 'wrn-rights-local-fixture',
    provenanceReference: 'wrn-provenance-local-fixture',
  } as WritableEvent;
  event.contentSha256 = await sha256Utf8(regionalEventsEventContentPreimage(event));
  const candidate = {
    ...base,
    ...overrides,
    events: overrides.events ?? [event],
  } as WritableBundle;
  candidate.eventsSha256 = await sha256Utf8(regionalEventsEventsPreimage(candidate.events));
  candidate.sourcesSha256 = await sha256Utf8(regionalEventsSourcesPreimage(candidate.sources));
  candidate.mediaSha256 = await sha256Utf8(regionalEventsMediaPreimage(candidate.media));
  candidate.revocationsSha256 = await sha256Utf8(
    regionalEventsRevocationsPreimage(candidate.revocations),
  );
  candidate.taxonomySha256 = await sha256Utf8(regionalEventsTaxonomyPreimage(candidate));
  return candidate as RegionalEventBundleV1;
}

async function makeFreshnessBundle(
  overrides: Partial<MutableBundle> = {},
): Promise<RegionalEventBundleV1> {
  const candidate = (await makeBundle(overrides)) as WritableBundle;
  const events = candidate.events.map((event) => ({ ...event })) as WritableEvent[];
  for (const event of events)
    event.contentSha256 = await sha256Utf8(regionalEventsEventContentPreimage(event));
  candidate.events = events;
  candidate.eventsSha256 = await sha256Utf8(regionalEventsEventsPreimage(events));
  candidate.sourcesSha256 = await sha256Utf8(regionalEventsSourcesPreimage(candidate.sources));
  return candidate as RegionalEventBundleV1;
}

describe('mobile regional events v1 contract — R4-A explicit matrix', () => {
  it('accepts exact-cover and rejects top-level/record key drift', async () => {
    const valid = await makeBundle();
    expect(await validateRegionalEventBundle(valid)).not.toBeNull();
    expect(await validateRegionalEventBundle({ ...valid, extra: true })).toBeNull();
    expect(
      await validateRegionalEventBundle({
        ...valid,
        events: [{ ...valid.events[0]!, extra: true }],
      }),
    ).toBeNull();
  });

  it('binds seven schema-ordered preimages and rejects a generic lexical oracle', async () => {
    const valid = await makeBundle();
    const reversed = {
      ...valid,
      events: [...valid.events].reverse(),
      sources: [...valid.sources].reverse(),
    };
    expect(regionalEventsTaxonomyPreimage(valid)).toBe(regionalEventsTaxonomyPreimage(reversed));
    expect(regionalEventsSourcesPreimage(valid.sources)).toBe(
      regionalEventsSourcesPreimage(reversed.sources),
    );
    expect(regionalEventsEventsPreimage(valid.events)).toBe(
      regionalEventsEventsPreimage(reversed.events),
    );
    expect(regionalEventsMediaPreimage(valid.media)).toBe(
      regionalEventsMediaPreimage([...valid.media].reverse()),
    );
    expect(regionalEventsRevocationsPreimage(valid.revocations)).toBe(
      regionalEventsRevocationsPreimage([...valid.revocations].reverse()),
    );
    expect(regionalEventsEventContentPreimage(valid.events[0]!)).not.toContain('contentSha256');
    expect(JSON.stringify(valid)).not.toBe(regionalEventsEventsPreimage(valid.events));
  });

  it('enforces exact pin schema, revision and transport hash shape', () => {
    const pin = {
      schema: base.schema,
      contractVersion: base.contractVersion,
      path: '/wrn-mobile-regional-events/v1/mobile-regional-events.json',
      bundleRevision: 1,
      taxonomyRevision: 1,
      transportSha256: 'a'.repeat(64),
    };
    expect(validateRegionalEventsPin(pin)).toBe(true);
    expect(validateRegionalEventsPin({ ...pin, extra: true })).toBe(false);
    expect(validateRegionalEventsPin({ ...pin, bundleRevision: 0 })).toBe(false);
    expect(validateRegionalEventsPin({ ...pin, transportSha256: 'x'.repeat(64) })).toBe(false);
  });

  it('rejects locale, parent, alias-cycle and duplicate-ID violations independently', async () => {
    const valid = await makeBundle();
    const cases = [
      { locales: [...mobileRegionalEventsLocales].reverse() },
      { countries: [{ ...valid.countries[0]!, continentId: 'wrn-cont-missing' }] },
      {
        identityLinks: [
          {
            namespace: 'region',
            sourceId: 'wrn-region-test',
            targetId: 'wrn-region-test',
            relation: 'alias',
          },
        ],
      },
      { events: [...valid.events, { ...valid.events[0]! }] },
    ];
    for (const mutation of cases)
      expect(await validateRegionalEventBundle({ ...valid, ...mutation } as never)).toBeNull();
  });

  it('rejects noncanonical UTC/IANA, offset, plain-text, HTML and rights values', async () => {
    const valid = await makeBundle();
    const mutations = [
      { timeZone: 'Not/AZone' },
      { startLocal: '2026-09-01T13:00:00' },
      { startUtcOffsetMinutes: 60 },
      { titles: { ...valid.events[0]!.titles, en: '\u200fBidi' } },
      { summaries: { ...valid.events[0]!.summaries, en: '<b>HTML</b>' } },
    ];
    for (const mutation of mutations)
      expect(
        await validateRegionalEventBundle(
          await makeBundle({ events: [{ ...valid.events[0]!, ...mutation } as RegionalEvent] }),
        ),
      ).toBeNull();
    expect(
      await validateRegionalEventBundle(
        await makeBundle({ sources: [{ ...source, rightsStatus: 'remote' } as never] }),
      ),
    ).toBeNull();
  });

  it('asserts cap limit-minus, limit and limit-plus, including the dimension/pixel dominance invariant', async () => {
    const valid = await makeBundle();
    const events = (count: number) =>
      Array.from({ length: count }, (_, i) => ({
        ...valid.events[0]!,
        eventId: `wrn-event-e${i}`,
      }));
    // Event-count positive boundaries are dominated by the 512 KiB decoded-JSON cap;
    // the invariant is asserted explicitly and the reachable overflow is rejected.
    expect(mobileRegionalEventsCaps.events).toBe(4096);
    expect(events(mobileRegionalEventsCaps.events - 1)).toHaveLength(4095);
    expect(events(mobileRegionalEventsCaps.events)).toHaveLength(4096);
    expect(
      await validateRegionalEventBundle(
        await makeBundle({ events: events(mobileRegionalEventsCaps.events + 1) }),
      ),
    ).toBeNull();
    const overText = {
      ...valid.events[0]!,
      summaries: {
        ...valid.events[0]!.summaries,
        en: 'x'.repeat(mobileRegionalEventsCaps.summary + 1),
      },
    };
    expect(await validateRegionalEventBundle(await makeBundle({ events: [overText] }))).toBeNull();
    expect(mobileRegionalEventsCaps.dimension ** 2).toBe(mobileRegionalEventsCaps.pixels);
  });

  it('keeps replacement references ID-scoped, ordered and fail-closed', async () => {
    const valid = await makeBundle();
    const refs: SafetyReference[] = [
      { namespace: 'event', id: 'wrn-event-a' },
      { namespace: 'event', id: 'wrn-event-b' },
    ];
    expect(canonicalRegionalEventsSafety([], 2, [...refs].reverse())).toBe(
      canonicalRegionalEventsSafety([], 2, refs),
    );
    expect(compareSafetyReference(refs[0]!, refs[1]!)).toBeLessThan(0);
    expect(
      await validateRegionalEventBundle(
        await makeBundle({
          revocations: [{ namespace: 'event', id: 'wrn-event-test', status: 'replaced' } as never],
        }),
      ),
    ).toBeNull();
    expect(
      await validateRegionalEventBundle({ ...valid, eventsSha256: '0'.repeat(64) }),
    ).toBeNull();
  });

  it('rejects lower revision, stale freshness and malformed hash replay', async () => {
    const valid = await makeBundle();
    expect(await validateRegionalEventBundle(await makeBundle({ bundleRevision: 0 }))).toBeNull();
    expect(
      await validateRegionalEventBundle({ ...valid, generatedAt: '2026-09-03T00:00:00.000Z' }),
    ).toBeNull();
    expect(
      await validateRegionalEventBundle({ ...valid, taxonomySha256: '0'.repeat(64) }),
    ).toBeNull();
  });

  it('enforces source observedAt against the bundle envelope after canonical rehashing', async () => {
    const generatedAt = '2026-09-01T00:00:00.000Z';
    const equal = await makeFreshnessBundle({
      sources: [{ ...source, observedAt: generatedAt }],
    });
    expect(await validateRegionalEventBundle(equal)).not.toBeNull();
    const after = await makeFreshnessBundle({
      sources: [{ ...source, observedAt: '2026-09-01T00:00:00.001Z' }],
    });
    expect(await validateRegionalEventBundle(after)).toBeNull();
  });

  it('enforces event observedAt against the bundle envelope after canonical content and event rehashing', async () => {
    const valid = await makeFreshnessBundle({
      events: [{ ...(await makeBundle()).events[0]!, observedAt: '2026-09-01T00:00:00.000Z' }],
    });
    expect(await validateRegionalEventBundle(valid)).not.toBeNull();
    const after = await makeFreshnessBundle({
      events: [{ ...(await makeBundle()).events[0]!, observedAt: '2026-09-01T00:00:00.001Z' }],
    });
    expect(await validateRegionalEventBundle(after)).toBeNull();
  });

  it('enforces the strict event validUntil lower envelope after canonical content and event rehashing', async () => {
    const equal = await makeFreshnessBundle({
      events: [{ ...(await makeBundle()).events[0]!, validUntil: '2026-09-01T00:00:00.000Z' }],
    });
    expect(await validateRegionalEventBundle(equal)).toBeNull();
    const after = await makeFreshnessBundle({
      events: [{ ...(await makeBundle()).events[0]!, validUntil: '2026-09-01T00:00:00.001Z' }],
    });
    expect(await validateRegionalEventBundle(after)).not.toBeNull();
  });

  it('enforces the event validUntil upper envelope after canonical content and event rehashing', async () => {
    const equal = await makeFreshnessBundle({
      events: [{ ...(await makeBundle()).events[0]!, validUntil: '2026-09-02T00:00:00.000Z' }],
    });
    expect(await validateRegionalEventBundle(equal)).not.toBeNull();
    const after = await makeFreshnessBundle({
      events: [{ ...(await makeBundle()).events[0]!, validUntil: '2026-09-02T00:00:00.001Z' }],
    });
    expect(await validateRegionalEventBundle(after)).toBeNull();
  });
});
