import { afterEach, describe, expect, it, vi } from 'vitest';
import readerDetails from '../public/wrn-local-release/v1/reader-details.json';
import articles from '../public/wrn-local-release/v1/articles.json';
import releaseDescriptor from '../public/wrn-local-release/v1/release-descriptor.json';
import manifest from '../public/wrn-local-release/v1/manifest.json';
import supplementalItems from '../public/wrn-local-release/v1/supplemental-items.json';
import discoverIndex from '../public/wrn-local-release/v1/discover-index.json';
import archiveLifecycle from '../public/wrn-local-release/v1/archive-lifecycle.json';
import websitePublication from '../public/wrn-local-release/v1/website-publication.json';
import sidecar from '../public/wrn-mobile-reader-v2/v1/mobile-reader-v2.json';
import rawSidecar from '../public/wrn-mobile-reader-v2/v1/mobile-reader-v2.json?raw';
import { sha256Bytes } from '@wrn/content-contracts/mobile-reader-v2';
import {
  mobileReaderV2MaxDecodedJsonBytes,
  mobileReaderV2MaxTranslationBytes,
  mobileReaderV2MaxTransportBytes,
} from '@wrn/content-contracts/mobile-reader-v2';
import {
  createValidatedLocalContentReleaseV1,
  type LocalContentReleaseDocumentsV1,
  type LocalReaderDetailEntryV1,
} from '@wrn/content-contracts';
import type {
  MobileReaderV2Media,
  MobileReaderV2SnapshotIdentity,
} from '@wrn/content-contracts/mobile-reader-v2';
import {
  disabledMobileReaderV2TranslationAdapter,
  loadMobileReaderV2,
  mobileReaderV2BuildPin,
  mobileReaderV2SidecarPath,
  mobileReaderV2TranslationResultIdentity,
  resolveMobileReaderV2LocalAsset,
  translateMobileReaderV2Section,
} from './mobile-reader-v2';
import { emptyMobileReaderV2MediaSafetyLedger } from './mobile-reader-v2-media-safety';

const v1Articles = articles.articles as unknown as readonly {
  readonly id: string;
  readonly source: { readonly id: string; readonly name: string };
}[];

function responseFor(value: unknown): Response {
  const raw = JSON.stringify(value);
  return new Response(raw, {
    headers: {
      'content-type': 'application/json',
      'content-length': String(new TextEncoder().encode(raw).byteLength),
    },
  });
}

function responseForRaw(raw: string): Response {
  return new Response(raw, {
    headers: {
      'content-type': 'application/json',
      'content-length': String(new TextEncoder().encode(raw).byteLength),
    },
  });
}

async function validatedG3016Snapshot(): Promise<MobileReaderV2SnapshotIdentity> {
  const documents: LocalContentReleaseDocumentsV1 = {
    manifest,
    payloads: { articles, 'supplemental-items': supplementalItems },
    discoverIndex,
    readerDetails,
    archiveLifecycle,
    websitePublication,
  };
  const ready = await createValidatedLocalContentReleaseV1(releaseDescriptor, documents);
  return Object.freeze({
    releaseRevision: ready.descriptor.releaseRevision,
    manifestSha256: ready.manifestSha256,
    readerDetailsRevision: ready.readerDetails.revision,
    readerDetailsWholeDocumentSha256: ready.descriptor.expectedComponents.readerDetails.sha256,
    readerDetailsIntegritySha256: ready.readerDetails.integritySha256,
  });
}

function streamResponseForExactJsonBytes(byteLength: number): {
  readonly response: Response;
  readonly bytes: Uint8Array;
} {
  const prefix = new TextEncoder().encode(JSON.stringify(sidecar));
  expect(prefix.byteLength).toBeLessThanOrEqual(byteLength);
  const bytes = new Uint8Array(byteLength);
  bytes.set(prefix);
  bytes.fill(0x20, prefix.byteLength); // JSON whitespace only; no fixture mutation.
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  return {
    bytes,
    response: new Response(body, { headers: { 'content-type': 'application/json' } }),
  };
}
afterEach(() => vi.restoreAllMocks());

describe('mobile reader v2 fixed sidecar loader', () => {
  it('cross-binds the complete validated G3-016 release to the packaged sidecar and build pin', async () => {
    const snapshot = await validatedG3016Snapshot();
    const rawBytes = new TextEncoder().encode(rawSidecar);
    expect(snapshot).toEqual({
      releaseRevision: 'wrn-g3-016-mobile-home-release-v1',
      manifestSha256: '77244d6774a91b30af2898f2c8ccf98633e8fcb609d4807852e0ea991db562f4',
      readerDetailsRevision: 'wrn-g3-016-local-home-reader-v1',
      readerDetailsWholeDocumentSha256:
        'cb87e281ad020872ae7fdade538c0764db057d0b31e9543ed08b8a62cd3c0e14',
      readerDetailsIntegritySha256:
        'e821e8ffe3845d9e8cbe83317add309987bce4aa673461e9ebe5ad403b534b99',
    });
    expect(mobileReaderV2BuildPin.snapshot).toEqual(snapshot);
    expect(sidecar.snapshot).toEqual(snapshot);
    expect(await sha256Bytes(rawBytes)).toBe(mobileReaderV2BuildPin.wholeDocumentSha256);

    const acceptedRequest = vi.fn<(path: string) => Promise<Response>>(async () =>
      responseForRaw(rawSidecar),
    );
    await expect(
      loadMobileReaderV2({
        pin: mobileReaderV2BuildPin,
        snapshot,
        v1Entries: readerDetails.entries as unknown as readonly LocalReaderDetailEntryV1[],
        v1Articles,
        signal: new AbortController().signal,
        request: acceptedRequest as unknown as typeof fetch,
      }),
    ).resolves.toMatchObject({ kind: 'ready' });
    expect(acceptedRequest).toHaveBeenCalledTimes(1);
    expect(acceptedRequest.mock.calls[0]![0]).toBe(mobileReaderV2SidecarPath);

    for (const mutation of [
      { releaseRevision: 'other-release' },
      { manifestSha256: '0'.repeat(64) },
      { readerDetailsRevision: 'other-reader-details' },
      { readerDetailsWholeDocumentSha256: '1'.repeat(64) },
      { readerDetailsIntegritySha256: '2'.repeat(64) },
    ] as const) {
      const request = vi.fn(async () => responseForRaw(rawSidecar));
      await expect(
        loadMobileReaderV2({
          pin: mobileReaderV2BuildPin,
          snapshot: { ...snapshot, ...mutation },
          v1Entries: readerDetails.entries as unknown as readonly LocalReaderDetailEntryV1[],
          v1Articles,
          signal: new AbortController().signal,
          request: request as unknown as typeof fetch,
        }),
      ).resolves.toEqual({ kind: 'fallback', reason: 'missing-pin' });
      expect(request).toHaveBeenCalledTimes(0);
    }

    const physicalReaderDetailsFileHash =
      '6fc207b46395f0bc3db2b4e1d2bcbd6a3ac23342007d7fe71c30c9c27d098b8f';
    const semanticMismatchRequest = vi.fn(async () => responseForRaw(rawSidecar));
    const semanticMismatchSnapshot = {
      ...snapshot,
      readerDetailsWholeDocumentSha256: physicalReaderDetailsFileHash,
    };
    await expect(
      loadMobileReaderV2({
        pin: { ...mobileReaderV2BuildPin, snapshot: semanticMismatchSnapshot },
        snapshot: semanticMismatchSnapshot,
        v1Entries: readerDetails.entries as unknown as readonly LocalReaderDetailEntryV1[],
        v1Articles,
        signal: new AbortController().signal,
        request: semanticMismatchRequest as unknown as typeof fetch,
      }),
    ).resolves.toEqual({ kind: 'fallback', reason: 'invalid-sidecar' });
    expect(semanticMismatchRequest).toHaveBeenCalledTimes(1);

    const outerHashMismatchRequest = vi.fn(async () => responseForRaw(rawSidecar));
    await expect(
      loadMobileReaderV2({
        pin: { ...mobileReaderV2BuildPin, wholeDocumentSha256: '3'.repeat(64) },
        snapshot,
        v1Entries: readerDetails.entries as unknown as readonly LocalReaderDetailEntryV1[],
        v1Articles,
        signal: new AbortController().signal,
        request: outerHashMismatchRequest as unknown as typeof fetch,
      }),
    ).resolves.toEqual({ kind: 'fallback', reason: 'invalid-sidecar' });
    expect(outerHashMismatchRequest).toHaveBeenCalledTimes(1);
  });

  it('uses the one fixed path after a present external pin and validates v1 exact cover', async () => {
    const request = vi.fn(async (path: string) =>
      responseFor(path === mobileReaderV2SidecarPath ? sidecar : {}),
    );
    const rawPin = {
      ...mobileReaderV2BuildPin,
      wholeDocumentSha256: await sha256Bytes(new TextEncoder().encode(JSON.stringify(sidecar))),
    };
    await expect(
      loadMobileReaderV2({
        pin: rawPin,
        snapshot: mobileReaderV2BuildPin.snapshot,
        v1Entries: readerDetails.entries as unknown as readonly LocalReaderDetailEntryV1[],
        v1Articles,
        signal: new AbortController().signal,
        request: request as unknown as typeof fetch,
      }),
    ).resolves.toMatchObject({ kind: 'ready' });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0]![0]).toBe(mobileReaderV2SidecarPath);
  });
  it('does zero requests without a pin and rejects a raw-byte hash mismatch', async () => {
    const request = vi.fn(async () => responseFor(sidecar));
    await expect(
      loadMobileReaderV2({
        pin: null,
        snapshot: mobileReaderV2BuildPin.snapshot,
        v1Entries: readerDetails.entries as unknown as readonly LocalReaderDetailEntryV1[],
        v1Articles,
        signal: new AbortController().signal,
        request: request as unknown as typeof fetch,
      }),
    ).resolves.toEqual({ kind: 'fallback', reason: 'missing-pin' });
    await expect(
      loadMobileReaderV2({
        pin: { ...mobileReaderV2BuildPin, wholeDocumentSha256: '0'.repeat(64) },
        snapshot: mobileReaderV2BuildPin.snapshot,
        v1Entries: readerDetails.entries as unknown as readonly LocalReaderDetailEntryV1[],
        v1Articles,
        signal: new AbortController().signal,
        request: request as unknown as typeof fetch,
      }),
    ).resolves.toEqual({ kind: 'fallback', reason: 'invalid-sidecar' });
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('fails closed when a hash-valid sidecar revision differs from the external pin', async () => {
    const request = vi.fn(async () => responseFor(sidecar));
    const pin = {
      ...mobileReaderV2BuildPin,
      revision: 'wrn-g3-019-local-v1-other',
      wholeDocumentSha256: await sha256Bytes(new TextEncoder().encode(JSON.stringify(sidecar))),
    };
    await expect(
      loadMobileReaderV2({
        pin,
        snapshot: mobileReaderV2BuildPin.snapshot,
        v1Entries: readerDetails.entries as unknown as readonly LocalReaderDetailEntryV1[],
        v1Articles,
        signal: new AbortController().signal,
        request: request as unknown as typeof fetch,
      }),
    ).resolves.toEqual({ kind: 'fallback', reason: 'invalid-sidecar' });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it.each([-1, 0, 1] as const)(
    'enforces the uncached ReadableStream transport triplet at 512 KiB %+d',
    async (delta) => {
      const byteLength = mobileReaderV2MaxTransportBytes + delta;
      const { bytes, response } = streamResponseForExactJsonBytes(byteLength);
      expect(response.headers.has('content-length')).toBe(false);
      const request = vi.fn(async () => response);
      const pin = {
        ...mobileReaderV2BuildPin,
        wholeDocumentSha256: await sha256Bytes(bytes),
      };

      await expect(
        loadMobileReaderV2({
          pin,
          snapshot: mobileReaderV2BuildPin.snapshot,
          v1Entries: readerDetails.entries as unknown as readonly LocalReaderDetailEntryV1[],
          v1Articles,
          signal: new AbortController().signal,
          request: request as unknown as typeof fetch,
        }),
      ).resolves.toMatchObject(
        delta > 0 ? { kind: 'fallback', reason: 'invalid-sidecar' } : { kind: 'ready' },
      );
      expect(request).toHaveBeenCalledTimes(1);
    },
  );

  it('keeps transport and decoded JSON caps as an explicit redundant invariant', () => {
    expect(mobileReaderV2MaxTransportBytes).toBe(512 * 1024);
    expect(mobileReaderV2MaxDecodedJsonBytes).toBe(512 * 1024);
    expect(mobileReaderV2MaxTransportBytes).toBe(mobileReaderV2MaxDecodedJsonBytes);
  });
});

describe('local translation adapter boundary', () => {
  const request = {
    snapshot: mobileReaderV2BuildPin.snapshot,
    articleId: 'article',
    sectionId: 'section',
    sourceFragmentSha256: 'a'.repeat(64),
    sourceLanguage: 'en',
    targetLanguage: 'de',
    input: 'fixture text',
  };
  it('is disabled by default and no-ops for the same language', async () => {
    await expect(
      translateMobileReaderV2Section(
        request,
        new AbortController().signal,
        disabledMobileReaderV2TranslationAdapter,
        () => true,
      ),
    ).resolves.toEqual({ kind: 'disabled' });
    await expect(
      translateMobileReaderV2Section(
        { ...request, targetLanguage: 'en' },
        new AbortController().signal,
        disabledMobileReaderV2TranslationAdapter,
        () => true,
      ),
    ).resolves.toEqual({ kind: 'noop' });
  });
  it('handles local errors, aborts, and stale replies without persistence or requests', async () => {
    const errorAdapter = {
      id: 'local-fixture',
      version: '1.0.0',
      translate: async () => {
        throw new Error('fixture');
      },
    };
    await expect(
      translateMobileReaderV2Section(
        request,
        new AbortController().signal,
        errorAdapter,
        () => true,
      ),
    ).resolves.toEqual({ kind: 'error' });
    const controller = new AbortController();
    controller.abort();
    await expect(
      translateMobileReaderV2Section(
        request,
        controller.signal,
        {
          id: 'local-fixture',
          version: '1.0.0',
          translate: async () => 'x',
        },
        () => true,
      ),
    ).resolves.toEqual({ kind: 'aborted' });
    await expect(
      translateMobileReaderV2Section(
        request,
        new AbortController().signal,
        { id: 'local-fixture', version: '1.0.0', translate: async () => 'x' },
        () => false,
      ),
    ).resolves.toEqual({ kind: 'stale' });
  });
  it('binds every translation identity field and refuses stale work before and after the adapter', async () => {
    const adapter = { id: 'local-fixture', version: '1.0.0', translate: async () => 'x' };
    const baseline = await mobileReaderV2TranslationResultIdentity(request, adapter);
    expect(baseline).not.toBeNull();
    for (const changed of [
      { articleId: 'article-other' },
      { sectionId: 'section-other' },
      { sourceFragmentSha256: 'b'.repeat(64) },
      { snapshot: { ...request.snapshot, manifestSha256: '0'.repeat(64) } },
      { snapshot: { ...request.snapshot, readerDetailsRevision: 'other-reader-details-revision' } },
      {
        snapshot: {
          ...request.snapshot,
          readerDetailsWholeDocumentSha256: '1'.repeat(64),
        },
      },
      {
        snapshot: {
          ...request.snapshot,
          readerDetailsIntegritySha256: '2'.repeat(64),
        },
      },
      { sourceLanguage: 'fr' },
      { targetLanguage: 'es' },
      { snapshot: { ...request.snapshot, releaseRevision: 'other-revision' } },
    ]) {
      const mutation = await mobileReaderV2TranslationResultIdentity(
        { ...request, ...changed },
        adapter,
      );
      expect(mutation).not.toBeNull();
      expect(mutation!.key).not.toBe(baseline!.key);
    }
    const adapterIdMutation = await mobileReaderV2TranslationResultIdentity(request, {
      ...adapter,
      id: 'other-adapter-id',
    });
    expect(adapterIdMutation).not.toBeNull();
    expect(adapterIdMutation!.key).not.toBe(baseline!.key);
    const adapterVersionMutation = await mobileReaderV2TranslationResultIdentity(request, {
      ...adapter,
      version: '2.0.0',
    });
    expect(adapterVersionMutation).not.toBeNull();
    expect(adapterVersionMutation!.key).not.toBe(baseline!.key);
    let called = false;
    await expect(
      translateMobileReaderV2Section(
        request,
        new AbortController().signal,
        {
          ...adapter,
          translate: async () => {
            called = true;
            return 'x';
          },
        },
        () => false,
      ),
    ).resolves.toEqual({ kind: 'stale' });
    expect(called).toBe(false);
    let current = true;
    await expect(
      translateMobileReaderV2Section(
        request,
        new AbortController().signal,
        {
          ...adapter,
          translate: async () => {
            current = false;
            return 'x';
          },
        },
        () => current,
      ),
    ).resolves.toEqual({ kind: 'stale' });
  });
  it.each([-1, 0, 1] as const)(
    'uses the direct translation byte cap at limit %+d',
    async (delta) => {
      const length = mobileReaderV2MaxTranslationBytes + delta;
      const input = 'a'.repeat(length);
      const adapter = { id: 'local-fixture', version: '1.0.0', translate: async () => input };
      const result = await translateMobileReaderV2Section(
        { ...request, input },
        new AbortController().signal,
        adapter,
        () => true,
      );
      expect(result.kind).toBe(delta > 0 ? 'error' : 'translated');
    },
  );
  it.each([-1, 0, 1] as const)(
    'enforces the translated result byte cap at limit %+d',
    async (delta) => {
      const output = 'b'.repeat(mobileReaderV2MaxTranslationBytes + delta);
      const result = await translateMobileReaderV2Section(
        request,
        new AbortController().signal,
        { id: 'local-fixture', version: '1.0.0', translate: async () => output },
        () => true,
      );
      expect(result.kind).toBe(delta > 0 ? 'error' : 'translated');
    },
  );
});

describe('build-bound local media resolver', () => {
  const media: MobileReaderV2Media = {
    mediaId: 'wrn-v2-media-a',
    articleId: 'wrn-test-art-cedar',
    sectionId: 'wrn-v2-section-cedar',
    blockId: 'wrn-v2-block-cedar-0',
    provenance: 'self-authored',
    rights: 'self-authored-local-fixture',
    license: 'fixture',
    attribution: 'fixture',
    delivery: 'self-authored-local-fixture',
    localAssetId: 'wrn-local-asset-a',
    mimeType: 'image/png',
    byteLength: 1,
    width: 1,
    height: 1,
    sha256: 'a'.repeat(64),
    revision: 'v1',
    altTextProvenance: 'self-authored',
    altText: 'A self-authored local fixture image.',
  };
  const entry = {
    localAssetId: media.localAssetId,
    path: '/wrn-mobile-reader-v2/assets/fixture-a.png',
    mimeType: media.mimeType,
    byteLength: media.byteLength,
    width: media.width,
    height: media.height,
    sha256: media.sha256,
  } as const;
  const ready = { kind: 'ready' as const, ledger: emptyMobileReaderV2MediaSafetyLedger() };
  it('returns a descriptor only for an exact build-registry match and allowed ledger', () => {
    expect(
      resolveMobileReaderV2LocalAsset(media, ready, new Map([[media.localAssetId, entry]])),
    ).toMatchObject({ path: entry.path });
    for (const changed of [
      { path: 'https://example.invalid/a.png' },
      { path: '/wrn-mobile-reader-v2/assets/../a.png' },
      { mimeType: 'image/jpeg' as const },
      { byteLength: 2 },
      { width: 2 },
      { height: 2 },
      { sha256: 'b'.repeat(64) },
    ]) {
      expect(
        resolveMobileReaderV2LocalAsset(
          media,
          ready,
          new Map([[media.localAssetId, { ...entry, ...changed }]]),
        ),
      ).toBeNull();
    }
    expect(
      resolveMobileReaderV2LocalAsset(
        media,
        { kind: 'protected' },
        new Map([[media.localAssetId, entry]]),
      ),
    ).toBeNull();
    expect(
      resolveMobileReaderV2LocalAsset(
        media,
        { kind: 'unavailable' },
        new Map([[media.localAssetId, entry]]),
      ),
    ).toBeNull();
    expect(
      resolveMobileReaderV2LocalAsset(
        media,
        {
          kind: 'ready',
          ledger: {
            ...emptyMobileReaderV2MediaSafetyLedger(),
            entries: [{ mediaId: media.mediaId, sha256: media.sha256 }],
          },
        },
        new Map([[media.localAssetId, entry]]),
      ),
    ).toBeNull();
  });
});
