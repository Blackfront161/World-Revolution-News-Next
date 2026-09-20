import { describe, expect, it } from 'vitest';
import {
  validateProductionEventsMediaV1,
  normaliseProductionEventsMediaInstant,
  productionEventsMediaInputPathsV1,
  productionEventsMediaMaxBytesV1,
} from '../../src/directory/production-events-media-v1.js';

const document = () => ({
  schema: 'wrn.production-events-media.v1',
  version: 1,
  rights: 'metadata-only',
  snapshot: {
    repository: 'https://github.com/Blackfront161/World-Revolution-News-Website',
    commit: '9a59b17cc9b3a6a7b7541c2e64862af208d02ace',
    observedAt: '2026-09-10T00:00:00.000Z',
    historical: true,
    inputs: Object.entries(productionEventsMediaInputPathsV1).map(([ref, path]) => ({
      ref: `input-${ref}`,
      path,
      sha256: 'a'.repeat(64),
    })),
  },
  events: [
    {
      id: `wrn-event-${'b'.repeat(64)}`,
      title: 'Event',
      sourceName: 'Source',
      originalUrl: 'http://example.org/event',
      canonicalUrl: 'http://example.org/event',
      language: 'und',
      startAt: '2026-09-10T00:00:00.000Z',
      endAt: null,
      sourceStartAt: '2026-09-10T00:00:00Z',
      sourceEndAt: null,
      timezone: null,
      country: null,
      city: null,
      provenanceRef: 'input-events',
      row: 0,
    },
  ],
  videos: [],
  episodes: [],
  sources: [],
  reconciliation: {
    input: { events: 1, videos: 0, episodes: 0, sources: 0 },
    accepted: { events: 1, videos: 0, episodes: 0, sources: 0 },
    rejected: [] as { collection: string; row: number; reason: string }[],
    rawEpisodeUrls: 0,
    deduplicatedEpisodes: 0,
  },
});
describe('production events/media v1', () => {
  it('accepts historical HTTP metadata without making it an inferred HTTPS URL', () => {
    expect(validateProductionEventsMediaV1(document())).toBe(true);
  });
  it('rejects unsafe URLs, unzoned dates, unknown provenance and excess rows', () => {
    const unsafe = document();
    unsafe.events[0]!.originalUrl = 'http://127.0.0.1/a';
    expect(validateProductionEventsMediaV1(unsafe)).toBe(false);
    const date = document();
    date.events[0]!.sourceStartAt = '2026-09-10T00:00:00';
    expect(validateProductionEventsMediaV1(date)).toBe(false);
    const provenance = document();
    provenance.events[0]!.provenanceRef = 'input-other';
    expect(validateProductionEventsMediaV1(provenance)).toBe(false);
    const limit = document();
    limit.events = Array.from({ length: 6001 }, () => document().events[0]!);
    expect(validateProductionEventsMediaV1(limit)).toBe(false);
  });
  it.each([
    '2026-02-30T10:00:00Z',
    '2025-02-29T10:00:00Z',
    '2026-09-10T24:00:00Z',
    '2026-09-10T10:60:00Z',
    '2026-09-10T10:00:60Z',
    '2026-09-10T10:00:00+24:00',
    '2026-09-10T10:00:00',
  ])('rejects non-calendar or non-zoned instant %s', (value) => {
    expect(normaliseProductionEventsMediaInstant(value)).toBeNull();
  });
  it('normalizes real leap dates and source offsets', () => {
    expect(normaliseProductionEventsMediaInstant('2024-02-29T10:00:00+02:00')).toBe(
      '2024-02-29T08:00:00.000Z',
    );
  });
  it.each([
    [
      'wrong collection',
      (doc: ReturnType<typeof document>) => {
        doc.events[0]!.provenanceRef = 'input-videos';
      },
    ],
    [
      'negative row',
      (doc: ReturnType<typeof document>) => {
        doc.events[0]!.row = -1;
      },
    ],
    [
      'out-of-range row',
      (doc: ReturnType<typeof document>) => {
        doc.events[0]!.row = 1;
      },
    ],
    [
      'changed source date',
      (doc: ReturnType<typeof document>) => {
        doc.events[0]!.sourceStartAt = '2026-09-11T00:00:00Z';
      },
    ],
    [
      'duplicate snapshot ref',
      (doc: ReturnType<typeof document>) => {
        doc.snapshot.inputs[1] = { ...doc.snapshot.inputs[0]! };
      },
    ],
    [
      'wrong snapshot path',
      (doc: ReturnType<typeof document>) => {
        doc.snapshot.inputs[0]!.path = 'elsewhere.json' as (typeof doc.snapshot.inputs)[0]['path'];
      },
    ],
    [
      'forged accepted count',
      (doc: ReturnType<typeof document>) => {
        doc.reconciliation.accepted.events = 0;
      },
    ],
    [
      'missing row',
      (doc: ReturnType<typeof document>) => {
        doc.reconciliation.input.events = 2;
      },
    ],
    [
      'duplicate rejected row',
      (doc: ReturnType<typeof document>) => {
        doc.reconciliation.rejected.push({
          collection: 'events',
          row: 0,
          reason: 'invalid-metadata',
        });
      },
    ],
    [
      'forged deduplicated count',
      (doc: ReturnType<typeof document>) => {
        doc.reconciliation.deduplicatedEpisodes = 1;
      },
    ],
    [
      'forged raw count',
      (doc: ReturnType<typeof document>) => {
        doc.reconciliation.rawEpisodeUrls = 1;
      },
    ],
  ])('rejects %s', (_label, mutate) => {
    const doc = document();
    mutate(doc);
    expect(validateProductionEventsMediaV1(doc)).toBe(false);
  });
  it('accepts complete explicit rejected row coverage', () => {
    const doc = document();
    doc.reconciliation.input.events = 2;
    doc.reconciliation.rejected.push({ collection: 'events', row: 1, reason: 'invalid-date' });
    expect(validateProductionEventsMediaV1(doc)).toBe(true);
  });
  it('enforces byte cap even when every row is structurally valid and row counts match', () => {
    const doc = document();
    doc.events = Array.from({ length: 6000 }, (_, row) => ({
      ...doc.events[0]!,
      id: `wrn-event-${row.toString(16).padStart(64, '0')}`,
      row,
      title: 'ä'.repeat(500),
      originalUrl: `http://example.org/event/${row}`,
      canonicalUrl: `http://example.org/event/${row}`,
    }));
    doc.reconciliation.input.events = doc.reconciliation.accepted.events = 6000;
    expect(new TextEncoder().encode(JSON.stringify(doc)).byteLength).toBeGreaterThan(
      productionEventsMediaMaxBytesV1,
    );
    expect(validateProductionEventsMediaV1(doc)).toBe(false);
  });
});
