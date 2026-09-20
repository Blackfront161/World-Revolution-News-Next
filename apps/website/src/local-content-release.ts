import {
  canonicalJson,
  createValidatedLocalContentReleaseV1,
  isLocalContentReleaseDescriptorV1,
  isLocalManifestV1,
  localContentReleaseBasePath,
  localContentReleaseMaxTransportBytes,
  localContentReleaseResourcePaths,
  sha256Utf8,
  validateLocalContentReleaseSafetyEvidenceV1,
  validateLocalArchiveLifecycleV1,
  validateLocalContentReleaseTransportReceipt,
  type ArchiveLifecycleValidationResult,
  type LocalContentReleaseDocumentsV1,
  type LocalContentReleaseReadyV1,
  type LocalContentReleaseResourceId,
  type ContentOfflineSafetyLedgerV1,
} from '@wrn/content-contracts';

const descriptorPath = `${localContentReleaseBasePath}/release-descriptor.json`;
const requestTimeoutMs = 5_000;
const updateTimeoutMs = 15_000;

export interface LocalContentReleaseRuntime {
  readonly ready: LocalContentReleaseReadyV1;
  readonly archiveValidation: ArchiveLifecycleValidationResult;
}

/** P2 result: verified safety survives an unrelated incomplete payload. */
export type LocalContentReleaseOfflineCheck =
  | Readonly<{
      readonly kind: 'ready';
      readonly runtime: LocalContentReleaseRuntime;
      readonly safety: ContentOfflineSafetyLedgerV1;
    }>
  | Readonly<{
      readonly kind: 'failed';
      readonly safety: ContentOfflineSafetyLedgerV1 | null;
    }>;

type JsonRecord = Record<string, unknown>;

function safeFailure(): Error {
  return new Error('Lokale Inhaltsrevision konnte nicht sicher geladen werden.');
}

/** A signal is an outcome boundary even when a platform/mock promise does not cooperate. */
async function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  let abort!: () => void;
  const cancelled = new Promise<never>((_, reject) => {
    abort = () => reject(safeFailure());
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
  try {
    const value = await Promise.race([promise, cancelled]);
    if (signal.aborted) throw safeFailure();
    return value;
  } finally {
    signal.removeEventListener('abort', abort);
  }
}

function cancelBody(response: Response): void {
  try {
    void response.body?.cancel().catch(() => undefined);
  } catch {
    /* Already locked/closed. */
  }
}

function isJsonMimeType(value: string | null): boolean {
  return value?.split(';', 1)[0]?.trim().toLowerCase() === 'application/json';
}

async function readResponseJson(
  response: Response,
  resourceId: LocalContentReleaseResourceId | 'descriptor',
  path: string,
  signal: AbortSignal,
): Promise<unknown> {
  const headerLength = response.headers.get('content-length');
  const declaredLength = headerLength === null ? null : Number(headerLength);
  if (
    headerLength !== null &&
    (!/^[0-9]+$/.test(headerLength) ||
      !Number.isSafeInteger(declaredLength) ||
      declaredLength! < 0 ||
      declaredLength! > localContentReleaseMaxTransportBytes)
  )
    throw safeFailure();
  const byteLength = declaredLength ?? 0;

  if (resourceId !== 'descriptor') {
    const receipt = validateLocalContentReleaseTransportReceipt({
      resourceId,
      path,
      status: response.status,
      mimeType: isJsonMimeType(response.headers.get('content-type')) ? 'application/json' : '',
      redirected: response.redirected,
      byteLength,
    });
    if (!receipt.ok) throw safeFailure();
  } else if (
    response.status !== 200 ||
    response.redirected ||
    !isJsonMimeType(response.headers.get('content-type')) ||
    (headerLength !== null && declaredLength! < 0)
  ) {
    throw safeFailure();
  }

  const bytes = await readCappedResponseBytes(response, declaredLength, signal);
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw safeFailure();
  }
}

/** Enforces the transport cap while bytes arrive; never buffers an unbounded body. */
async function readCappedResponseBytes(
  response: Response,
  declaredLength: number | null,
  signal: AbortSignal,
): Promise<Uint8Array> {
  if (response.body === null || response.body === undefined) throw safeFailure();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  const cancel = () => {
    try {
      void reader.cancel().catch(() => undefined);
    } catch {
      /* Cancellation is best effort. */
    }
  };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      if (signal.aborted) throw safeFailure();
      const next = await abortable(reader.read(), signal);
      if (next.done) break;
      length += next.value.byteLength;
      if (length > localContentReleaseMaxTransportBytes) {
        throw safeFailure();
      }
      chunks.push(next.value);
    }
  } catch (error) {
    cancel();
    throw error;
  } finally {
    signal.removeEventListener('abort', cancel);
    try {
      reader.releaseLock();
    } catch {
      /* A noncooperative reader may still own a read. */
    }
  }
  if (declaredLength !== null && length !== declaredLength) throw safeFailure();
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

async function readReleaseDocument(
  resourceId: LocalContentReleaseResourceId | 'descriptor',
  path: string,
  signal: AbortSignal,
): Promise<unknown> {
  if (signal.aborted) throw safeFailure();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);
  const abort = () => controller.abort();
  if (signal.aborted) abort();
  signal.addEventListener('abort', abort, { once: true });
  try {
    const response = await abortable(
      fetch(path, {
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
        signal: controller.signal,
      }).then((response) => {
        if (controller.signal.aborted) {
          cancelBody(response);
          throw safeFailure();
        }
        return response;
      }),
      controller.signal,
    );
    try {
      return await readResponseJson(response, resourceId, path, controller.signal);
    } catch (error) {
      cancelBody(response);
      throw error;
    }
  } catch {
    throw safeFailure();
  } finally {
    window.clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function validateDescriptorAndManifestBeforePayloadRequests(
  descriptor: unknown,
  manifest: unknown,
): Promise<void> {
  if (!isLocalContentReleaseDescriptorV1(descriptor) || !isLocalManifestV1(manifest)) {
    throw safeFailure();
  }
  if (
    manifest.compatibility.minContractVersion !==
      descriptor.compatibility.minManifestContractVersion ||
    manifest.compatibility.maxContractVersion !==
      descriptor.compatibility.maxManifestContractVersion ||
    manifest.revision !== descriptor.expectedManifest.revision
  ) {
    throw safeFailure();
  }
  if ((await sha256Utf8(canonicalJson(manifest))) !== descriptor.expectedManifest.sha256) {
    throw safeFailure();
  }
}

/**
 * Der Mobile-Adapter kennt nur feste lokale Pfade. Er aktiviert erst den
 * vollständig validierten Releasevertrag und besitzt weder Storage noch einen
 * Fixturefallback.
 */
export async function loadLocalContentRelease(
  signal: AbortSignal,
): Promise<LocalContentReleaseRuntime> {
  const checked = await checkLocalContentReleaseForOffline(signal, { floor: 0, entries: [] });
  if (checked.kind !== 'ready') throw safeFailure();
  return checked.runtime;
}

/** Bounded explicit source check; it has no persistence, retry, or activation side effect. */
export async function checkLocalContentReleaseForOffline(
  signal: AbortSignal,
  knownSafety: ContentOfflineSafetyLedgerV1,
): Promise<LocalContentReleaseOfflineCheck> {
  let verifiedSafety: ContentOfflineSafetyLedgerV1 | null = null;
  const overall = new AbortController();
  const abort = () => overall.abort();
  if (signal.aborted) overall.abort();
  signal.addEventListener('abort', abort, { once: true });
  const timeout = window.setTimeout(() => overall.abort(), updateTimeoutMs);
  try {
    const descriptor = await readReleaseDocument('descriptor', descriptorPath, overall.signal);
    if (!isLocalContentReleaseDescriptorV1(descriptor))
      return Object.freeze({ kind: 'failed', safety: null });
    const manifest = await readReleaseDocument(
      'manifest',
      localContentReleaseResourcePaths.manifest,
      overall.signal,
    );
    await abortable(
      validateDescriptorAndManifestBeforePayloadRequests(descriptor, manifest),
      overall.signal,
    );
    const settled = await Promise.allSettled(
      (
        Object.entries(localContentReleaseResourcePaths) as [
          LocalContentReleaseResourceId,
          string,
        ][]
      )
        .filter(([id]) => id !== 'manifest')
        .map(
          async ([id, path]) => [id, await readReleaseDocument(id, path, overall.signal)] as const,
        ),
    );
    const byId = Object.fromEntries(
      settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : [])),
    ) as Partial<Record<LocalContentReleaseResourceId, unknown>>;
    const safety = await abortable(
      validateLocalContentReleaseSafetyEvidenceV1({
        descriptor,
        manifest,
        articles: byId.articles,
        readerDetails: byId['reader-details'],
        archiveLifecycle: byId['archive-lifecycle'],
        knownSafety,
      }),
      overall.signal,
    );
    verifiedSafety = safety;
    if (settled.some((result) => result.status === 'rejected') || safety === null)
      return Object.freeze({ kind: 'failed', safety });
    if (!isRecord(byId.articles) || !isRecord(byId['supplemental-items']))
      return Object.freeze({ kind: 'failed', safety });
    const documents: LocalContentReleaseDocumentsV1 = {
      manifest: manifest as LocalContentReleaseDocumentsV1['manifest'],
      payloads: { articles: byId.articles, 'supplemental-items': byId['supplemental-items'] },
      discoverIndex: byId['discover-index'],
      readerDetails: byId['reader-details'],
      archiveLifecycle: byId['archive-lifecycle'],
      websitePublication: byId['website-publication'],
    };
    const ready = await abortable(
      createValidatedLocalContentReleaseV1(descriptor, documents, safety.floor),
      overall.signal,
    );
    const articles = ready.payloads.articles;
    if (articles === undefined || !('articles' in articles))
      return Object.freeze({ kind: 'failed', safety });
    const archiveValidation = await abortable(
      validateLocalArchiveLifecycleV1(
        ready.archiveLifecycle,
        articles.articles,
        ready.readerDetails,
        safety.floor,
      ),
      overall.signal,
    );
    if (!archiveValidation.ok) return Object.freeze({ kind: 'failed', safety });
    return Object.freeze({
      kind: 'ready',
      runtime: Object.freeze({ ready, archiveValidation }),
      safety,
    });
  } catch {
    return Object.freeze({ kind: 'failed', safety: verifiedSafety });
  } finally {
    window.clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}
