import { describe, expect, it } from 'vitest';
import { canonicalJson, sha256Utf8 } from '../src/index';
import {
  isProductionMediaPointerV1,
  isProductionMediaDescriptorV1,
  isValidatedProductionMediaReadyV1,
  activateHistoricalProductionMediaReleaseV1,
  compileProductionMediaProviderPolicyV1,
  emptyProductionMediaProviderPolicyV1,
  mergeProductionMediaSafetyV1,
  retainsHistoricalProductionMediaReleaseV1,
  validateHistoricalProductionMediaReleaseV1,
  productionMediaDocumentsV1,
  productionMediaLocalesV1,
  validateProductionMediaReleaseV1,
  validateProductionMediaSafetyV1,
  type ProductionMediaDocumentsDataV1,
  type ProductionMediaDescriptorV1,
  type ProductionMediaPointerV1,
  type ProductionMediaInputV1,
  type ProductionMediaProviderPolicyV1,
  type ProductionMediaSafetyV1,
} from '../src/production-media-v1';

type Mutable<T> = { -readonly [K in keyof T]: T[K] extends object ? Mutable<T[K]> : T[K] };
type Docs = Mutable<ProductionMediaDocumentsDataV1>;
type Name = (typeof productionMediaDocumentsV1)[number];
const now = Date.parse('2026-09-11T12:00:00.000Z');
const generatedAt = '2026-09-11T11:00:00.000Z';
const validFrom = '2026-09-01T00:00:00.000Z',
  validUntil = '2026-10-01T00:00:00.000Z';
const evidence = 'a'.repeat(64);
const utf8ByteLength = (value: string) => new Blob([value]).size;
const emptySafety = (): ProductionMediaSafetyV1 => ({
  revision: 0,
  floor: 0,
  revocationSha256: null,
  entries: [],
});
const localeText = () =>
  Object.fromEntries(
    productionMediaLocalesV1.map((locale) => [
      locale,
      locale === 'en' ? 'Publisher episode' : null,
    ]),
  ) as Docs['manifest']['sources'][number]['title'];
function documents(sourcesCount = 1, seriesCount = 1, episodesCount = 1): Docs {
  const base = { contractVersion: '1.0.0' as const, releaseRevision: 'release-1' };
  const sources: Docs['manifest']['sources'] = Array.from({ length: sourcesCount }, (_, i) => ({
    id: 'source-' + i,
    language: 'en',
    title: localeText(),
  }));
  const series: Docs['manifest']['series'] = Array.from({ length: seriesCount }, (_, i) => ({
    id: 'series-' + i,
    sourceId: 'source-' + (i % sourcesCount),
    title: localeText(),
  }));
  const episodes: Docs['manifest']['episodes'] = Array.from({ length: episodesCount }, (_, i) => ({
    id: 'episode-' + i,
    seriesId: 'series-' + (i % seriesCount),
    sourceId: series[i % seriesCount]!.sourceId,
    publisherEpisodeId: 'publisher-' + i,
    language: 'en',
    title: localeText(),
    summary: localeText(),
    canonicalPage: 'https://publisher.invalid/episode-' + i,
    publishedAt: '2026-09-10T10:00:00.000Z',
    durationMs: 1806000,
  }));
  const streams: Docs['manifest']['streams'] = episodes.map((episode, i) => ({
    id: 'stream-' + i,
    episodeId: episode.id,
    sourceId: episode.sourceId,
    publisherEpisodeId: episode.publisherEpisodeId,
    deliveryClass: 'publisher-stream',
    mime: 'audio/mpeg',
    url: 'https://publisher.invalid/audio-' + i + '.mp3',
    origin: 'https://publisher.invalid',
    declaredBytes: 29251585,
    durationMs: episode.durationMs,
    streamRevision: '0'.repeat(64),
    corsMode: 'anonymous',
    redirectPolicy: 'admitted-origin-only',
    rangeRequired: true,
    rightsEvidenceSha256: evidence,
  }));
  return {
    manifest: {
      ...base,
      schema: 'wrn.production-media-manifest.v1',
      sources,
      series,
      episodes,
      streams,
    },
    admission: {
      ...base,
      schema: 'wrn.production-media-admission.v1',
      entries: sources.map((source) => ({
        sourceId: source.id,
        selfDescription: localeText(),
        editorialDescription: localeText(),
        healthObservedAt: '2026-09-11T10:00:00.000Z',
        healthStatus: 'ok',
        validFrom,
        validUntil,
        owner: 'WRN editorial',
        correctionContact: 'contact-' + source.id,
      })),
    },
    rights: {
      ...base,
      schema: 'wrn.production-media-rights.v1',
      entries: streams.map((stream) => ({
        episodeId: stream.episodeId,
        streamId: stream.id,
        basis: 'published-license',
        evidenceId: 'proof-' + stream.id,
        evidenceSha256: evidence,
        reviewedAt: '2026-09-10T10:00:00.000Z',
        validFrom,
        validUntil,
        attribution: 'Publisher; music credits; CC BY 4.0',
        territory: 'worldwide',
        directStreamAllowed: true,
        redistributionAllowed: false,
        cacheAllowed: false,
        offlineAllowed: false,
      })),
    },
    consent: {
      ...base,
      schema: 'wrn.production-media-consent.v1',
      entries: episodes.map((episode) => ({
        episodeId: episode.id,
        recipientName: 'Publisher',
        recipientOrigin: 'https://publisher.invalid',
        dataCategories: ['ip-address', 'user-agent', 'request-timing', 'media-range'],
        privacyNoticeUrl: 'https://publisher.invalid/privacy',
        mode: 'per-episode-third-party-click',
        requiresPrompt: true,
        validFrom,
        validUntil,
      })),
    },
    revocation: {
      ...base,
      schema: 'wrn.production-media-revocation.v1',
      revision: 1,
      floor: 1,
      entries: [],
    },
  };
}
async function stamp(docs: Docs) {
  for (const stream of docs.manifest.streams)
    stream.streamRevision = await sha256Utf8(
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
}
type Options = {
  pointerBytes?: number;
  descriptorBytes?: number;
  documentBytes?: Partial<Record<Name, number>>;
  descriptor?: (value: Mutable<ProductionMediaDescriptorV1>) => void;
  pointer?: (value: Mutable<ProductionMediaPointerV1>) => void;
};
function pad(raw: string, bytes?: number) {
  if (bytes === undefined) return raw;
  expect(bytes).toBeGreaterThanOrEqual(utf8ByteLength(raw));
  return raw + ' '.repeat(bytes - utf8ByteLength(raw));
}
async function wire(docs: Docs, options: Options = {}): Promise<ProductionMediaInputV1> {
  const documentsRaw = Object.fromEntries(
    productionMediaDocumentsV1.map((name) => [
      name,
      pad(canonicalJson(docs[name]), options.documentBytes?.[name]),
    ]),
  ) as Record<Name, string>;
  const descriptor: Mutable<ProductionMediaDescriptorV1> = {
    schema: 'wrn.production-media-descriptor.v1',
    contractVersion: '1.0.0',
    releaseRevision: 'release-1',
    sequence: 1,
    generatedAt,
    validUntil: '2026-09-12T12:00:00.000Z',
    revocationFloor: docs.revocation.floor,
    documents: await Promise.all(
      productionMediaDocumentsV1.map(async (name) => ({
        name,
        path: '/content/media/v1/releases/release-1/' + name + '.json',
        bytes: utf8ByteLength(documentsRaw[name]),
        sha256: await sha256Utf8(documentsRaw[name]),
      })),
    ),
  };
  options.descriptor?.(descriptor);
  const descriptorRaw = pad(canonicalJson(descriptor), options.descriptorBytes);
  const pointer: Mutable<ProductionMediaPointerV1> = {
    schema: 'wrn.production-media-current.v1',
    contractVersion: '1.0.0',
    releaseRevision: 'release-1',
    sequence: 1,
    descriptorPath: '/content/media/v1/releases/release-1/descriptor.json',
    descriptorBytes: utf8ByteLength(descriptorRaw),
    descriptorSha256: await sha256Utf8(descriptorRaw),
    revocationFloor: descriptor.revocationFloor,
  };
  options.pointer?.(pointer);
  return {
    pointerRaw: pad(canonicalJson(pointer), options.pointerBytes),
    descriptorRaw,
    documentsRaw,
    now,
    allowedOrigins: new Set(['https://publisher.invalid']),
    knownSafety: emptySafety(),
  };
}
async function release(edit?: (docs: Docs) => void, options?: Options) {
  const docs = documents();
  edit?.(docs);
  await stamp(docs);
  return wire(docs, options);
}
const validate = validateProductionMediaReleaseV1;
const providerOrigin = 'https://dn721204.ca.archive.org';
const providerNotice = 'https://archive.org/about/terms';
const providerPolicy = (): ProductionMediaProviderPolicyV1 => ({
  kind: 'production-media-provider-policy-v1',
  relationships: [{ recipientOrigin: providerOrigin, privacyNoticeUrl: providerNotice }],
});
async function providerRelease() {
  const input = await release((docs) => {
    const stream = docs.manifest.streams[0]!;
    stream.url = providerOrigin + '/episode-0.mp3';
    stream.origin = providerOrigin;
    const consent = docs.consent.entries[0]!;
    consent.recipientOrigin = providerOrigin;
    consent.privacyNoticeUrl = providerNotice;
  });
  return { ...input, allowedOrigins: new Set([providerOrigin]) };
}

describe('pure production publisher-stream contract', () => {
  it('compiles only a detached frozen canonical provider-policy registry', () => {
    const mutable = structuredClone(providerPolicy()) as {
      kind: 'production-media-provider-policy-v1';
      relationships: Array<{ recipientOrigin: string; privacyNoticeUrl: string }>;
    };
    const compiled = compileProductionMediaProviderPolicyV1(mutable, new Set([providerOrigin]));
    expect(compiled).toEqual(providerPolicy());
    expect(Object.isFrozen(compiled)).toBe(true);
    expect(Object.isFrozen(compiled?.relationships)).toBe(true);
    expect(Object.isFrozen(compiled?.relationships[0])).toBe(true);
    mutable.relationships[0]!.privacyNoticeUrl = 'https://mutated.invalid/';
    expect(compiled?.relationships[0]?.privacyNoticeUrl).toBe(providerNotice);
    expect(compileProductionMediaProviderPolicyV1(undefined, new Set([providerOrigin]))).toBe(
      emptyProductionMediaProviderPolicyV1,
    );

    const invalid = [
      { ...providerPolicy(), extra: true },
      {
        ...providerPolicy(),
        relationships: [{ ...providerPolicy().relationships[0]!, extra: true }],
      },
      {
        ...providerPolicy(),
        relationships: [providerPolicy().relationships[0]!, providerPolicy().relationships[0]!],
      },
      {
        ...providerPolicy(),
        relationships: Array.from({ length: 9 }, (_, index) => ({
          recipientOrigin: providerOrigin,
          privacyNoticeUrl: `https://privacy-${index}.invalid/terms`,
        })),
      },
      {
        ...providerPolicy(),
        relationships: [
          { recipientOrigin: 'https://*.archive.org', privacyNoticeUrl: providerNotice },
        ],
      },
      {
        ...providerPolicy(),
        relationships: [
          {
            recipientOrigin: providerOrigin,
            privacyNoticeUrl: providerNotice + '?redirect=publisher.invalid',
          },
        ],
      },
    ];
    for (const value of invalid)
      expect(compileProductionMediaProviderPolicyV1(value, new Set([providerOrigin]))).toBeNull();
    expect(
      compileProductionMediaProviderPolicyV1(providerPolicy(), new Set(['https://other.invalid'])),
    ).toBeNull();

    const iteratorBypass = Array.from({ length: 9 }, (_, index) => ({
      recipientOrigin: providerOrigin,
      privacyNoticeUrl: `https://archive.org/terms-${index}`,
    }));
    Object.defineProperty(iteratorBypass, Symbol.iterator, {
      value: () => {
        throw new Error('compiler must not execute caller iteration code');
      },
    });
    expect(
      compileProductionMediaProviderPolicyV1(
        { kind: 'production-media-provider-policy-v1', relationships: iteratorBypass },
        new Set([providerOrigin]),
      ),
    ).toBeNull();
  });

  it('admits only the exact current cross-origin privacy pair and snapshots caller mutation', async () => {
    const input = await providerRelease();
    await expect(validate(input)).resolves.toBeNull();
    await expect(validate({ ...input, providerPolicy: providerPolicy() })).resolves.not.toBeNull();
    await expect(
      validate({
        ...input,
        providerPolicy: {
          ...providerPolicy(),
          relationships: [
            { recipientOrigin: providerOrigin, privacyNoticeUrl: 'https://archive.org/privacy' },
          ],
        },
      }),
    ).resolves.toBeNull();
    await expect(
      validate({
        ...input,
        allowedOrigins: new Set([providerOrigin, 'https://archive.org']),
        providerPolicy: {
          kind: 'production-media-provider-policy-v1',
          relationships: [
            {
              recipientOrigin: 'https://archive.org',
              privacyNoticeUrl: providerOrigin + '/',
            },
          ],
        },
      }),
    ).resolves.toBeNull();

    const mutable = structuredClone(providerPolicy()) as {
      kind: 'production-media-provider-policy-v1';
      relationships: Array<{ recipientOrigin: string; privacyNoticeUrl: string }>;
    };
    const pending = validate({ ...input, providerPolicy: mutable });
    mutable.relationships[0]!.privacyNoticeUrl = 'https://mutated.invalid/';
    const ready = await pending;
    expect(ready?.documents.consent.entries[0]?.recipientOrigin).toBe(providerOrigin);
    expect(ready?.documents.consent.entries[0]?.privacyNoticeUrl).toBe(providerNotice);
  });

  it('keeps historical proof and safety retention policy-free while current activation follows removal', async () => {
    const input = await providerRelease();
    const admitted = await validateProductionMediaSafetyV1(input);
    expect(admitted).not.toBeNull();
    const proof = await validateHistoricalProductionMediaReleaseV1(input, admitted!);
    expect(proof).not.toBeNull();
    expect(isValidatedProductionMediaReadyV1(proof)).toBe(false);
    await expect(retainsHistoricalProductionMediaReleaseV1(proof, admitted!)).resolves.toBe(true);
    await expect(
      activateHistoricalProductionMediaReleaseV1(proof, admitted!, now, input.allowedOrigins),
    ).resolves.toBeNull();
    const ready = await activateHistoricalProductionMediaReleaseV1(
      proof,
      admitted!,
      now,
      input.allowedOrigins,
      providerPolicy(),
    );
    expect(isValidatedProductionMediaReadyV1(ready)).toBe(true);
  });

  it('returns a deeply frozen detached, module-provenanced valid release', async () => {
    const input = await release(),
      ready = await validate(input);
    expect(ready).not.toBeNull();
    expect(isValidatedProductionMediaReadyV1(ready)).toBe(true);
    expect(Object.isFrozen(ready?.documents.manifest.episodes[0]?.title)).toBe(true);
    expect(isValidatedProductionMediaReadyV1(JSON.parse(JSON.stringify(ready)))).toBe(false);
    await expect(validateProductionMediaSafetyV1(input)).resolves.toEqual(ready?.safety);
  });
  it.each(['published-license', 'published-streaming-terms', 'publisher-grant'] as const)(
    'accepts whole-episode rights basis %s',
    async (basis) => {
      await expect(
        validate(
          await release((d) => {
            d.rights.entries[0]!.basis = basis;
          }),
        ),
      ).resolves.not.toBeNull();
    },
  );
  it('accepts complete Unicode pairs while rejecting unpaired JSON text values', async () => {
    await expect(
      validate(
        await release((d) => {
          d.manifest.episodes[0]!.title.en = 'Podcast 🎙️';
        }),
      ),
    ).resolves.not.toBeNull();
    await expect(
      validate(
        await release((d) => {
          d.manifest.episodes[0]!.title.en = 'Podcast \ud800';
        }),
      ),
    ).resolves.toBeNull();
  });
  it.each([
    ['zero width only', '\u200b'],
    ['C1 only', '\u0085'],
    ['bidi override', 'Publisher\u202e episode'],
    ['line separator', 'Publisher\u2028 episode'],
    ['paragraph separator', 'Publisher\u2029 episode'],
    ['bidi isolate', 'Publisher\u2066 episode\u2069'],
    ['variation selector only', '\ufe0f'],
    ['spaces and joiners only', ' \u200d\u200b '],
  ])('rejects Unicode non-plain title: %s', async (_label, title) => {
    await expect(
      validate(
        await release((d) => {
          d.manifest.sources[0]!.title.en = title;
        }),
      ),
    ).resolves.toBeNull();
  });
  it.each(['Podcast 👩‍💻 🎙️', 'Παράδειγμα · Пример · مثال · 例'])(
    'preserves visible Unicode title: %s',
    async (title) => {
      await expect(
        validate(
          await release((d) => {
            d.manifest.sources[0]!.title.en = title;
          }),
        ),
      ).resolves.not.toBeNull();
    },
  );
  for (const [field, cap] of [
    ['pointerBytes', 16384],
    ['descriptorBytes', 32768],
  ] as const)
    it.each([cap - 1, cap, cap + 1])(
      'checks ' + field + ' raw UTF-8 boundary %i',
      async (bytes) => {
        const result = await validate(await release(undefined, { [field]: bytes }));
        expect(result !== null).toBe(bytes <= cap);
      },
    );
  for (const name of productionMediaDocumentsV1)
    it.each([131071, 131072, 131073])(
      'checks ' + name + ' raw document bytes %i',
      async (bytes) => {
        expect(
          (await validate(await release(undefined, { documentBytes: { [name]: bytes } }))) !== null,
        ).toBe(bytes <= 131072);
      },
    );
  it.each([262143, 262144, 262145])('checks aggregate UTF-8 boundary %i', async (bytes) => {
    const docs = documents();
    await stamp(docs);
    const other = productionMediaDocumentsV1
      .filter((n) => n !== 'manifest' && n !== 'rights')
      .reduce((sum, n) => sum + utf8ByteLength(canonicalJson(docs[n])), 0);
    const input = await wire(docs, {
      documentBytes: { manifest: 131072, rights: bytes - 131072 - other },
    });
    expect((await validate(input)) !== null).toBe(bytes <= 262144);
  });
  it.each([7, 8, 9])('checks complete source/series graph boundary %i', async (count) => {
    const docs = documents(count, count, count);
    await stamp(docs);
    expect((await validate(await wire(docs))) !== null).toBe(count <= 8);
  });
  it.each([7, 8, 9])('checks series boundary with one source %i', async (count) => {
    const docs = documents(1, count, count);
    await stamp(docs);
    expect((await validate(await wire(docs))) !== null).toBe(count <= 8);
  });
  it.each([31, 32, 33])('checks exact episode/stream graph boundary %i', async (count) => {
    const docs = documents(1, 1, count);
    await stamp(docs);
    expect((await validate(await wire(docs))) !== null).toBe(count <= 32);
  });
  it.each([0, 1, 2, 134217727, 134217728, 134217729])(
    'checks declared audio bytes %i',
    async (bytes) => {
      const input = await release((d) => {
        d.manifest.streams[0]!.declaredBytes = bytes;
      });
      expect((await validate(input)) !== null).toBe(bytes >= 1 && bytes <= 134217728);
    },
  );
  it.each([999, 1000, 1001, 14399999, 14400000, 14400001])(
    'checks declared duration %i',
    async (duration) => {
      const input = await release((d) => {
        d.manifest.episodes[0]!.durationMs = duration;
        d.manifest.streams[0]!.durationMs = duration;
      });
      expect((await validate(input)) !== null).toBe(duration >= 1000 && duration <= 14400000);
    },
  );
  it.each([604799999, 604800000, 604800001])(
    'checks release validity window %i',
    async (duration) => {
      const input = await release(undefined, {
        descriptor: (d) => {
          d.validUntil = new Date(Date.parse(generatedAt) + duration).toISOString();
        },
      });
      expect((await validate(input)) !== null).toBe(duration <= 604800000);
    },
  );
  const invalidEdits: [string, (docs: Docs) => void][] = [
    [
      'empty source graph',
      (d) => {
        d.manifest.sources = [];
      },
    ],
    [
      'duplicate source',
      (d) => {
        d.manifest.sources.push(d.manifest.sources[0]!);
      },
    ],
    [
      'duplicate series',
      (d) => {
        d.manifest.series.push(d.manifest.series[0]!);
      },
    ],
    [
      'orphan series',
      (d) => {
        d.manifest.series[0]!.sourceId = 'missing';
      },
    ],
    [
      'orphan episode',
      (d) => {
        d.manifest.episodes[0]!.seriesId = 'missing';
      },
    ],
    [
      'second stream for one episode',
      (d) => {
        d.manifest.streams.push({ ...d.manifest.streams[0]!, id: 'second-stream' });
      },
    ],
    [
      'wrong stream duration',
      (d) => {
        d.manifest.streams[0]!.durationMs++;
      },
    ],
    [
      'future publication',
      (d) => {
        d.manifest.episodes[0]!.publishedAt = '2026-09-11T11:00:00.001Z';
      },
    ],
    [
      'extra source field',
      (d) => {
        Object.assign(d.manifest.sources[0]!, { verified: true });
      },
    ],
    [
      'missing summary',
      (d) => {
        Reflect.deleteProperty(d.manifest.episodes[0]!, 'summary');
      },
    ],
    [
      'missing locale',
      (d) => {
        Object.assign(d.manifest.episodes[0]!, { title: { en: 'only English' } });
      },
    ],
    [
      'markup in title',
      (d) => {
        d.manifest.episodes[0]!.title.en = '<b>title</b>';
      },
    ],
    [
      'missing admission',
      (d) => {
        d.admission.entries = [];
      },
    ],
    [
      'future health observation',
      (d) => {
        d.admission.entries[0]!.healthObservedAt = '2026-09-11T11:00:00.001Z';
      },
    ],
    [
      'health older than seven days',
      (d) => {
        d.admission.entries[0]!.healthObservedAt = '2026-09-04T10:59:59.999Z';
      },
    ],
    [
      'missing correction contact',
      (d) => {
        d.admission.entries[0]!.correctionContact = '';
      },
    ],
    [
      'missing source owner',
      (d) => {
        d.admission.entries[0]!.owner = '';
      },
    ],
    [
      'missing rights',
      (d) => {
        d.rights.entries = [];
      },
    ],
    [
      'music-only rights basis',
      (d) => {
        Object.assign(d.rights.entries[0]!, { basis: 'music-credit' });
      },
    ],
    [
      'metadata-only rights basis',
      (d) => {
        Object.assign(d.rights.entries[0]!, { basis: 'metadata-only' });
      },
    ],
    [
      'feed enclosure rights basis',
      (d) => {
        Object.assign(d.rights.entries[0]!, { basis: 'feed-enclosure' });
      },
    ],
    [
      'available page rights basis',
      (d) => {
        Object.assign(d.rights.entries[0]!, { basis: 'page-available' });
      },
    ],
    [
      'missing rights evidence',
      (d) => {
        d.rights.entries[0]!.evidenceSha256 = '';
      },
    ],
    [
      'rights evidence mismatch',
      (d) => {
        d.rights.entries[0]!.evidenceSha256 = 'b'.repeat(64);
      },
    ],
    [
      'future rights review',
      (d) => {
        d.rights.entries[0]!.reviewedAt = '2026-09-11T11:00:00.001Z';
      },
    ],
    [
      'offline right',
      (d) => {
        Object.assign(d.rights.entries[0]!, { offlineAllowed: true });
      },
    ],
    [
      'cache right',
      (d) => {
        Object.assign(d.rights.entries[0]!, { cacheAllowed: true });
      },
    ],
    [
      'redistribution right',
      (d) => {
        Object.assign(d.rights.entries[0]!, { redistributionAllowed: true });
      },
    ],
    [
      'missing direct-stream right',
      (d) => {
        Object.assign(d.rights.entries[0]!, { directStreamAllowed: false });
      },
    ],
    [
      'restricted territory',
      (d) => {
        Object.assign(d.rights.entries[0]!, { territory: 'de' });
      },
    ],
    [
      'missing consent',
      (d) => {
        d.consent.entries = [];
      },
    ],
    [
      'no prompt',
      (d) => {
        Object.assign(d.consent.entries[0]!, { requiresPrompt: false });
      },
    ],
    [
      'wrong recipient',
      (d) => {
        d.consent.entries[0]!.recipientOrigin = 'https://another.invalid';
      },
    ],
    [
      'wrong privacy origin',
      (d) => {
        d.consent.entries[0]!.privacyNoticeUrl = 'https://another.invalid/privacy';
      },
    ],
    [
      'missing data disclosure',
      (d) => {
        Object.assign(d.consent.entries[0]!, { dataCategories: ['ip-address'] });
      },
    ],
    [
      'wrong audio MIME',
      (d) => {
        Object.assign(d.manifest.streams[0]!, { mime: 'audio/wav' });
      },
    ],
    [
      'wrong CORS mode',
      (d) => {
        Object.assign(d.manifest.streams[0]!, { corsMode: 'use-credentials' });
      },
    ],
    [
      'wrong redirect policy',
      (d) => {
        Object.assign(d.manifest.streams[0]!, { redirectPolicy: 'follow' });
      },
    ],
    [
      'no range support',
      (d) => {
        Object.assign(d.manifest.streams[0]!, { rangeRequired: false });
      },
    ],
  ];
  it.each(invalidEdits)('rejects otherwise rehashed %s', async (_name, edit) => {
    await expect(validate(await release(edit))).resolves.toBeNull();
  });
  for (const name of ['admission', 'rights', 'consent'] as const) {
    it.each(['validFrom', 'validUntil'] as const)(
      'requires ' + name + ' full-window %s',
      async (key) => {
        await expect(
          validate(
            await release((d) => {
              d[name].entries[0]![key] =
                key === 'validFrom' ? '2026-09-11T11:00:00.001Z' : '2026-09-12T11:59:59.999Z';
            }),
          ),
        ).resolves.toBeNull();
      },
    );
  }
  it.each([
    'http://publisher.invalid/audio.mp3',
    'https://user:pw@publisher.invalid/audio.mp3',
    'https://publisher.invalid/audio.mp3?q=1',
    'https://publisher.invalid/audio.mp3#x',
    'https://PUBLISHER.invalid/audio.mp3',
    'https://publisher.invalid:443/audio.mp3',
    'https://publisher.invalid/a/../audio.mp3',
    'https://publisher.invalid/%2e%2e/audio.mp3',
    'https://publisher.invalid/a%2fb.mp3',
    'https:\\\\publisher.invalid/audio.mp3',
    'https://publisher.invalid/audio.mp3\n',
    'https://unadmitted.invalid/audio.mp3',
  ])('rejects unadmitted/noncanonical stream URL %s', async (url) => {
    await expect(
      validate(
        await release((d) => {
          d.manifest.streams[0]!.url = url;
        }),
      ),
    ).resolves.toBeNull();
  });
  it.each(['source', 'series', 'episode', 'stream'] as const)(
    'rejects newly revoked %s',
    async (targetType) => {
      const input = await release((d) => {
        d.revocation.entries = [{ targetType, targetId: targetType + '-0', status: 'blocked' }];
      });
      const safety = await validateProductionMediaSafetyV1(input);
      expect(safety?.entries).toHaveLength(1);
      await expect(validate(input)).resolves.toBeNull();
    },
  );
  it('keeps safety independent of unreadable ordinary payloads', async () => {
    const input = await release();
    const documentsRaw = { revocation: input.documentsRaw.revocation };
    Object.defineProperty(documentsRaw, 'manifest', {
      get() {
        throw Error('ordinary payload read');
      },
    });
    await expect(
      validateProductionMediaSafetyV1({
        ...input,
        documentsRaw: documentsRaw as ProductionMediaInputV1['documentsRaw'],
      }),
    ).resolves.not.toBeNull();
  });
  it('rejects malformed full descriptor even in phase one', async () => {
    const input = await release(undefined, {
      descriptor: (d) => {
        d.documents[0]!.path = '/escape';
      },
    });
    await expect(validateProductionMediaSafetyV1(input)).resolves.toBeNull();
  });
  it('rejects missing, duplicated and extra document bindings', async () => {
    for (const edit of [
      (d: Mutable<ProductionMediaDescriptorV1>) => {
        d.documents.pop();
      },
      (d: Mutable<ProductionMediaDescriptorV1>) => {
        d.documents[0] = d.documents[1]!;
      },
      (d: Mutable<ProductionMediaDescriptorV1>) => {
        d.documents.push(d.documents[0]!);
      },
    ])
      await expect(validate(await release(undefined, { descriptor: edit }))).resolves.toBeNull();
  });
  it('rejects future versions, pointer hash/bytes/floor/sequence and raw hash tampering', async () => {
    for (const patch of [
      { contractVersion: '2.0.0' },
      { descriptorSha256: 'b'.repeat(64) },
      { descriptorBytes: 1 },
      { revocationFloor: 2 },
      { sequence: 2 },
      { descriptorPath: '/content/media/v1/releases/%2e%2e/descriptor.json' },
    ]) {
      const input = await release(undefined, {
        pointer: (p) => {
          Object.assign(p, patch);
        },
      });
      await expect(validate(input)).resolves.toBeNull();
    }
    const input = await release();
    await expect(
      validate({
        ...input,
        documentsRaw: {
          ...input.documentsRaw,
          manifest: input.documentsRaw.manifest.replace('Publisher', 'Changed'),
        },
      }),
    ).resolves.toBeNull();
    const docs = documents();
    await stamp(docs);
    docs.manifest.streams[0]!.streamRevision = 'b'.repeat(64);
    await expect(validate(await wire(docs))).resolves.toBeNull();
  });
  it('allows identical safety, rejects equal-revision conflicts and retains higher cumulative revocations', async () => {
    const first = await release((d) => {
      d.revocation.entries = [{ targetType: 'episode', targetId: 'retired', status: 'gone' }];
    });
    const known = await validateProductionMediaSafetyV1(first);
    expect(known).not.toBeNull();
    await expect(validate({ ...first, knownSafety: known! })).resolves.not.toBeNull();
    const conflict = await release();
    await expect(validate({ ...conflict, knownSafety: known! })).resolves.toBeNull();
    const higher = await release((d) => {
      d.revocation.revision = 2;
      d.revocation.floor = 2;
    });
    const ready = await validate({ ...higher, knownSafety: known! });
    expect(ready?.safety.entries).toEqual(known!.entries);
    await expect(validate({ ...first, knownSafety: ready!.safety })).resolves.toBeNull();
    const lowered = await release((d) => {
      d.revocation.revision = 3;
      d.revocation.floor = 1;
    });
    await expect(validate({ ...lowered, knownSafety: ready!.safety })).resolves.toBeNull();
  });
  it('rejects duplicate safety targets, malformed known safety and extra document inputs', async () => {
    const input = await release((d) => {
      d.revocation.entries = Array.from({ length: 2 }, () => ({
        targetType: 'episode',
        targetId: 'retired',
        status: 'gone',
      }));
    });
    await expect(validate(input)).resolves.toBeNull();
    const good = await release();
    for (const knownSafety of [
      null,
      {},
      { ...emptySafety(), floor: 1 },
      { ...emptySafety(), revision: 1 },
    ])
      await expect(
        validate({ ...good, knownSafety: knownSafety as ProductionMediaSafetyV1 }),
      ).resolves.toBeNull();
    await expect(
      validate({
        ...good,
        documentsRaw: {
          ...good.documentsRaw,
          extra: '{}',
        } as ProductionMediaInputV1['documentsRaw'],
      }),
    ).resolves.toBeNull();
  });
  it('snapshots origin, clock, raw documents and cumulative safety before hash awaits', async () => {
    const input = await release(),
      pending = validate(input);
    (input.allowedOrigins as Set<string>).clear();
    Object.assign(input, { now: Infinity });
    Object.assign(input.knownSafety, { floor: 42 });
    Object.assign(input.documentsRaw, { manifest: '{}' });
    expect(await pending).not.toBeNull();
  });
  it('binds historical proof to one detached input clone before asynchronous hashing', async () => {
    const input = await release();
    const safety = await validateProductionMediaSafetyV1(input);
    expect(safety).not.toBeNull();
    const pending = validateHistoricalProductionMediaReleaseV1(input, safety!);
    Object.assign(input.documentsRaw, { manifest: '{}' });
    Object.assign(input, { descriptorRaw: '{}' });
    const proof = await pending;
    expect(proof).not.toBeNull();
    const activated = await activateHistoricalProductionMediaReleaseV1(
      proof,
      safety!,
      now,
      new Set(['https://publisher.invalid']),
    );
    expect(activated).not.toBeNull();
    expect(isValidatedProductionMediaReadyV1(activated)).toBe(true);
  });
  it('shares the exact 1..8 canonical origin boundary across ordinary and historical readiness', async () => {
    const input = await release();
    const admitted = await validateProductionMediaSafetyV1(input);
    const proof = await validateHistoricalProductionMediaReleaseV1(input, admitted!);
    const eight = new Set([
      'https://publisher.invalid',
      ...Array.from({ length: 7 }, (_, index) => `https://extra-${index}.invalid`),
    ]);
    const nine = new Set([...eight, 'https://extra-7.invalid']);
    const missingStreamOrigin = new Set(
      Array.from({ length: 8 }, (_, index) => `https://extra-${index}.invalid`),
    );
    const malformed = new Set(['https://publisher.invalid', 'not-an-origin']);
    const activate = (allowedOrigins: ReadonlySet<string>) =>
      activateHistoricalProductionMediaReleaseV1(proof, admitted!, now, allowedOrigins);
    const ordinary = (allowedOrigins: ReadonlySet<string>) =>
      validate({ ...input, allowedOrigins, knownSafety: admitted! });

    await expect(Promise.all([ordinary(eight), activate(eight)])).resolves.toEqual([
      expect.objectContaining({ kind: 'ready' }),
      expect.objectContaining({ kind: 'ready' }),
    ]);
    for (const origins of [new Set<string>(), nine, missingStreamOrigin, malformed]) {
      await expect(ordinary(origins)).resolves.toBeNull();
      await expect(activate(origins)).resolves.toBeNull();
    }
  });
  it('rejects malformed runtime origin containers finitely in both readiness paths', async () => {
    const input = await release();
    const admitted = await validateProductionMediaSafetyV1(input);
    const proof = await validateHistoricalProductionMediaReleaseV1(input, admitted!);
    const malformed = [
      null,
      {},
      { size: 1, [Symbol.iterator]: 1 },
      {
        size: 1,
        [Symbol.iterator]() {
          throw new Error('iterator-failure');
        },
      },
      {
        size: 1,
        [Symbol.iterator]() {
          return { next: () => ({ done: false, value: 'https://publisher.invalid' }) };
        },
      },
    ];
    for (const allowedOrigins of malformed) {
      await expect(
        validate({ ...input, allowedOrigins: allowedOrigins as ReadonlySet<string> }),
      ).resolves.toBeNull();
      await expect(
        activateHistoricalProductionMediaReleaseV1(
          proof,
          admitted!,
          now,
          allowedOrigins as ReadonlySet<string>,
        ),
      ).resolves.toBeNull();
    }
  });
  it('detaches the historical origin snapshot before returning its promise', async () => {
    const input = await release();
    const admitted = await validateProductionMediaSafetyV1(input);
    const proof = await validateHistoricalProductionMediaReleaseV1(input, admitted!);
    const origins = new Set(['https://publisher.invalid']);
    const pending = activateHistoricalProductionMediaReleaseV1(proof, admitted!, now, origins);
    origins.clear();
    await expect(pending).resolves.toEqual(expect.objectContaining({ kind: 'ready' }));
  });
  it('separates historical integrity from current floor, expiry and revocation availability', async () => {
    const input = await release();
    const admitted = await validateProductionMediaSafetyV1(input);
    const proof = await validateHistoricalProductionMediaReleaseV1(input, admitted!);
    expect(proof).not.toBeNull();
    const origins = new Set(['https://publisher.invalid']);
    const later = {
      revision: 2,
      floor: 1,
      revocationSha256: 'b'.repeat(64),
      entries: [],
    } as const;
    await expect(
      activateHistoricalProductionMediaReleaseV1(proof, later, Date.parse(generatedAt), origins),
    ).resolves.not.toBeNull();
    await expect(
      activateHistoricalProductionMediaReleaseV1(
        proof,
        later,
        Date.parse('2026-09-12T11:59:59.999Z'),
        origins,
      ),
    ).resolves.not.toBeNull();
    for (const [safety, at] of [
      [{ ...later, floor: 2 }, now],
      [
        {
          ...later,
          entries: [{ targetType: 'episode', targetId: 'episode-0', status: 'blocked' }],
        },
        now,
      ],
      [later, Date.parse(generatedAt) - 1],
      [later, Date.parse('2026-09-12T12:00:00.000Z')],
      [later, Number.NaN],
    ] as const)
      await expect(
        activateHistoricalProductionMediaReleaseV1(
          proof,
          safety as ProductionMediaSafetyV1,
          at,
          origins,
        ),
      ).resolves.toBeNull();
  });
  it('rejects dropped cumulative targets, equal-revision conflicts and forged provenance', async () => {
    const input = await release((documents) => {
      documents.revocation.entries = [
        { targetType: 'episode', targetId: 'retired', status: 'gone' },
      ];
    });
    const admitted = await validateProductionMediaSafetyV1(input);
    const proof = await validateHistoricalProductionMediaReleaseV1(input, admitted!);
    expect(proof).not.toBeNull();
    const dropped = {
      revision: 2,
      floor: 1,
      revocationSha256: 'b'.repeat(64),
      entries: [],
    } as const;
    expect(mergeProductionMediaSafetyV1(admitted, dropped)).toBeNull();
    expect(
      mergeProductionMediaSafetyV1(admitted, {
        ...admitted!,
        revocationSha256: 'c'.repeat(64),
      }),
    ).toBeNull();
    await expect(
      activateHistoricalProductionMediaReleaseV1(
        proof,
        dropped,
        now,
        new Set(['https://publisher.invalid']),
      ),
    ).resolves.toBeNull();
    await expect(
      activateHistoricalProductionMediaReleaseV1(
        { kind: 'historical-production-media-v1' },
        admitted!,
        now,
        new Set(['https://publisher.invalid']),
      ),
    ).resolves.toBeNull();
    const ready = await validateProductionMediaReleaseV1(input);
    expect(ready).not.toBeNull();
    expect(isValidatedProductionMediaReadyV1(JSON.parse(JSON.stringify(ready)))).toBe(false);
  });
  it('rejects empty origins, BOM, invalid raw Unicode, generation in future and expiry', async () => {
    const input = await release();
    await expect(validate({ ...input, allowedOrigins: new Set() })).resolves.toBeNull();
    await expect(
      validate({ ...input, pointerRaw: '\ufeff' + input.pointerRaw }),
    ).resolves.toBeNull();
    await expect(
      validate({ ...input, descriptorRaw: input.descriptorRaw + '\ud800' }),
    ).resolves.toBeNull();
    await expect(validate({ ...input, now: Date.parse(generatedAt) - 1 })).resolves.toBeNull();
    await expect(
      validate({ ...input, now: Date.parse('2026-09-12T12:00:00.000Z') }),
    ).resolves.toBeNull();
    expect(isProductionMediaPointerV1(JSON.parse(input.pointerRaw))).toBe(true);
    expect(isProductionMediaDescriptorV1(JSON.parse(input.descriptorRaw))).toBe(true);
  });
});
