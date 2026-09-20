import { canonicalJson, sha256Utf8 } from '@wrn/content-contracts';
import {
  productionMediaDocumentsV1,
  productionMediaLocalesV1,
  type ProductionMediaDocumentsDataV1,
  type ProductionMediaDescriptorV1,
  type ProductionMediaPointerV1,
  type ProductionMediaInputV1,
  type ProductionMediaSafetyV1,
} from '@wrn/content-contracts/production-media-v1';

// Locally rehashed reserved-origin metadata; never imports another package's private tests.
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
  if (bytes < utf8ByteLength(raw)) throw new Error('Test padding is smaller than source');
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
export async function makeProductionMediaTestInput(edit?: (docs: Docs) => void, options?: Options) {
  const docs = documents();
  edit?.(docs);
  await stamp(docs);
  return wire(docs, options);
}
