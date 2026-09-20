import {
  mobileReaderV2MaxDecodedJsonBytes,
  mobileReaderV2MaxTransportBytes,
  mobileReaderV2MaxTranslationBytes,
  sha256Bytes,
  validateMobileReaderV2Document,
  type MobileReaderV2SidecarPin,
  type MobileReaderV2Media,
  type MobileReaderV2SnapshotIdentity,
  type MobileReaderV2ValidatedDocument,
} from '@wrn/content-contracts/mobile-reader-v2';
import {
  canonicalJson,
  sha256Utf8,
  type LocalArticle,
  type LocalReaderDetailEntryV1,
} from '@wrn/content-contracts';
import {
  isMobileReaderV2MediaAllowed,
  type MobileReaderV2MediaSafetyLoad,
} from './mobile-reader-v2-media-safety';

/** The only Reader-v2 request path. It is not derived from documents or state. */
export const mobileReaderV2SidecarPath = '/wrn-mobile-reader-v2/v1/mobile-reader-v2.json' as const;

/**
 * Build-bound local fixture pin. This value is intentionally outside the
 * sidecar itself. A later publisher signature is a separate release decision.
 */
export const mobileReaderV2BuildPin: MobileReaderV2SidecarPin = Object.freeze({
  path: mobileReaderV2SidecarPath,
  revision: 'wrn-g3-019-local-v2',
  wholeDocumentSha256: 'f51e992443f47aa8eaa6063783533fae91c37f44ece27480016b265f0d5b0874',
  snapshot: Object.freeze({
    releaseRevision: 'wrn-g3-016-mobile-home-release-v1',
    manifestSha256: '77244d6774a91b30af2898f2c8ccf98633e8fcb609d4807852e0ea991db562f4',
    readerDetailsRevision: 'wrn-g3-016-local-home-reader-v1',
    readerDetailsWholeDocumentSha256:
      'cb87e281ad020872ae7fdade538c0764db057d0b31e9543ed08b8a62cd3c0e14',
    readerDetailsIntegritySha256:
      'e821e8ffe3845d9e8cbe83317add309987bce4aa673461e9ebe5ad403b534b99',
  }),
});

export type MobileReaderV2LoadResult =
  | Readonly<{ readonly kind: 'ready'; readonly sidecar: MobileReaderV2ValidatedDocument }>
  | Readonly<{
      readonly kind: 'fallback';
      readonly reason: 'missing-pin' | 'invalid-sidecar' | 'aborted';
    }>;

export interface MobileReaderV2LoadInput {
  readonly pin: MobileReaderV2SidecarPin | null;
  readonly snapshot: MobileReaderV2SnapshotIdentity;
  readonly v1Entries: readonly LocalReaderDetailEntryV1[];
  readonly v1Articles: readonly Pick<LocalArticle, 'id' | 'source'>[];
  readonly signal: AbortSignal;
  /** Tests may inject a local Response factory; production uses the platform fetch. */
  readonly request?: typeof fetch;
}

function isJsonMimeType(value: string | null): boolean {
  return value?.split(';', 1)[0]?.trim().toLowerCase() === 'application/json';
}
function exactPinSnapshot(
  pin: MobileReaderV2SidecarPin,
  snapshot: MobileReaderV2SnapshotIdentity,
): boolean {
  return (
    pin.snapshot.releaseRevision === snapshot.releaseRevision &&
    pin.snapshot.manifestSha256 === snapshot.manifestSha256 &&
    pin.snapshot.readerDetailsRevision === snapshot.readerDetailsRevision &&
    pin.snapshot.readerDetailsWholeDocumentSha256 === snapshot.readerDetailsWholeDocumentSha256 &&
    pin.snapshot.readerDetailsIntegritySha256 === snapshot.readerDetailsIntegritySha256
  );
}
async function readCappedBytes(
  response: Response,
  signal: AbortSignal,
): Promise<Uint8Array | null> {
  const declared = response.headers.get('content-length');
  if (
    declared !== null &&
    (!/^[0-9]+$/.test(declared) || Number(declared) > mobileReaderV2MaxTransportBytes)
  )
    return null;
  if (response.body === null) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      if (signal.aborted) return null;
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > mobileReaderV2MaxTransportBytes) return null;
      chunks.push(next.value);
    }
  } catch {
    return null;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* best effort */
    }
  }
  if (declared !== null && total !== Number(declared)) return null;
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/**
 * Attempts one fixed local sidecar load. Any problem returns Reader-v1
 * fallback; it has no cache, retry, storage, history, telemetry or provider.
 */
export async function loadMobileReaderV2(
  input: MobileReaderV2LoadInput,
): Promise<MobileReaderV2LoadResult> {
  if (input.signal.aborted) return Object.freeze({ kind: 'fallback', reason: 'aborted' });
  const pin = input.pin;
  if (
    pin === null ||
    pin.path !== mobileReaderV2SidecarPath ||
    !exactPinSnapshot(pin, input.snapshot)
  )
    return Object.freeze({ kind: 'fallback', reason: 'missing-pin' });
  let response: Response;
  try {
    response = await (input.request ?? fetch)(mobileReaderV2SidecarPath, {
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      signal: input.signal,
    });
  } catch {
    return Object.freeze({
      kind: 'fallback',
      reason: input.signal.aborted ? 'aborted' : 'invalid-sidecar',
    });
  }
  if (
    input.signal.aborted ||
    response.status !== 200 ||
    response.redirected ||
    !isJsonMimeType(response.headers.get('content-type'))
  )
    return Object.freeze({
      kind: 'fallback',
      reason: input.signal.aborted ? 'aborted' : 'invalid-sidecar',
    });
  const bytes = await readCappedBytes(response, input.signal);
  if (
    bytes === null ||
    input.signal.aborted ||
    (await sha256Bytes(bytes)) !== pin.wholeDocumentSha256
  )
    return Object.freeze({
      kind: 'fallback',
      reason: input.signal.aborted ? 'aborted' : 'invalid-sidecar',
    });
  let parsed: unknown;
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (new TextEncoder().encode(decoded).byteLength > mobileReaderV2MaxDecodedJsonBytes)
      throw new Error('cap');
    parsed = JSON.parse(decoded) as unknown;
  } catch {
    return Object.freeze({ kind: 'fallback', reason: 'invalid-sidecar' });
  }
  const sidecar = await validateMobileReaderV2Document(
    parsed,
    input.snapshot,
    input.v1Entries,
    input.v1Articles,
  );
  return sidecar === null || sidecar.document.revision !== pin.revision
    ? Object.freeze({ kind: 'fallback', reason: 'invalid-sidecar' })
    : Object.freeze({ kind: 'ready', sidecar });
}

export interface MobileReaderV2TranslationRequest {
  readonly snapshot: MobileReaderV2SnapshotIdentity;
  readonly articleId: string;
  readonly sectionId: string;
  readonly sourceFragmentSha256: string;
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
  readonly input: string;
}
export interface MobileReaderV2LocalTranslationAdapter {
  readonly id: string;
  readonly version: string;
  readonly translate: (
    request: MobileReaderV2TranslationRequest,
    signal: AbortSignal,
  ) => Promise<string>;
}
export type MobileReaderV2TranslationResult =
  | Readonly<{ readonly kind: 'disabled' | 'noop' | 'aborted' | 'stale' | 'error' }>
  | Readonly<{ readonly kind: 'translated'; readonly text: string }>;

/** Production default: disabled and free of remote/provider capabilities. */
export const disabledMobileReaderV2TranslationAdapter: MobileReaderV2LocalTranslationAdapter | null =
  null;

export interface MobileReaderV2TranslationResultIdentity {
  readonly key: string;
  readonly adapterId: string;
  readonly adapterVersion: string;
}

export async function mobileReaderV2TranslationResultIdentity(
  request: Omit<MobileReaderV2TranslationRequest, 'input'>,
  adapter: Pick<MobileReaderV2LocalTranslationAdapter, 'id' | 'version'>,
): Promise<MobileReaderV2TranslationResultIdentity | null> {
  if (
    !/^[A-Za-z0-9._:-]{1,128}$/.test(adapter.id) ||
    !/^[A-Za-z0-9._:-]{1,128}$/.test(adapter.version)
  )
    return null;
  return Object.freeze({
    key: await sha256Utf8(
      canonicalJson({
        adapterId: adapter.id,
        adapterVersion: adapter.version,
        articleId: request.articleId,
        sectionId: request.sectionId,
        snapshot: request.snapshot,
        sourceFragmentSha256: request.sourceFragmentSha256,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
      }),
    ),
    adapterId: adapter.id,
    adapterVersion: adapter.version,
  });
}

export async function translateMobileReaderV2Section(
  request: MobileReaderV2TranslationRequest,
  signal: AbortSignal,
  adapter: MobileReaderV2LocalTranslationAdapter | null,
  isCurrent: () => boolean,
): Promise<MobileReaderV2TranslationResult> {
  if (!isCurrent()) return Object.freeze({ kind: 'stale' });
  if (request.sourceLanguage === request.targetLanguage) return Object.freeze({ kind: 'noop' });
  if (adapter === null) return Object.freeze({ kind: 'disabled' });
  if (signal.aborted) return Object.freeze({ kind: 'aborted' });
  if (new TextEncoder().encode(request.input).byteLength > mobileReaderV2MaxTranslationBytes)
    return Object.freeze({ kind: 'error' });
  try {
    const text = await adapter.translate(Object.freeze({ ...request }), signal);
    if (signal.aborted) return Object.freeze({ kind: 'aborted' });
    if (!isCurrent()) return Object.freeze({ kind: 'stale' });
    return new TextEncoder().encode(text).byteLength > mobileReaderV2MaxTranslationBytes
      ? Object.freeze({ kind: 'error' })
      : Object.freeze({ kind: 'translated', text });
  } catch {
    return Object.freeze({ kind: signal.aborted ? 'aborted' : 'error' });
  }
}

export interface MobileReaderV2LocalAssetRegistryEntry {
  readonly localAssetId: string;
  readonly path: string;
  readonly mimeType: MobileReaderV2Media['mimeType'];
  readonly byteLength: number;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
}

export interface MobileReaderV2LocalAssetDescriptor {
  readonly path: string;
  readonly mimeType: MobileReaderV2Media['mimeType'];
  readonly byteLength: number;
  readonly width: number;
  readonly height: number;
  readonly altText: string;
}

const localAssetPathPattern = /^\/wrn-mobile-reader-v2\/assets\/[A-Za-z0-9._-]+$/;
/** Build-only registry; this fixture intentionally has no media entries. */
export const mobileReaderV2LocalAssetRegistry: ReadonlyMap<
  string,
  MobileReaderV2LocalAssetRegistryEntry
> = new Map();

export function resolveMobileReaderV2LocalAsset(
  media: MobileReaderV2Media,
  safety: MobileReaderV2MediaSafetyLoad,
  registry: ReadonlyMap<
    string,
    MobileReaderV2LocalAssetRegistryEntry
  > = mobileReaderV2LocalAssetRegistry,
): MobileReaderV2LocalAssetDescriptor | null {
  if (!isMobileReaderV2MediaAllowed(safety, media.mediaId, media.sha256)) return null;
  const entry = registry.get(media.localAssetId);
  if (
    entry === undefined ||
    !localAssetPathPattern.test(entry.path) ||
    entry.path.includes('..') ||
    entry.localAssetId !== media.localAssetId ||
    entry.mimeType !== media.mimeType ||
    entry.byteLength !== media.byteLength ||
    entry.width !== media.width ||
    entry.height !== media.height ||
    entry.sha256 !== media.sha256
  )
    return null;
  return Object.freeze({
    path: entry.path,
    mimeType: entry.mimeType,
    byteLength: entry.byteLength,
    width: entry.width,
    height: entry.height,
    altText: media.altText,
  });
}
