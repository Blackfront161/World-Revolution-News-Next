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

import { fetchBoundedSameOriginJson, waitForAbortable } from './content-release-transport-core';

const descriptorPath = `${localContentReleaseBasePath}/release-descriptor.json`;

const updateTimeoutMs = 15_000;

export interface LocalContentReleaseRuntime {
  readonly ready: LocalContentReleaseReadyV1;
  readonly archiveValidation: ArchiveLifecycleValidationResult;
}

/**
 * P2 transport result for the explicit update flow. A verified safety ledger
 * survives an unrelated payload failure, but a failed result never activates
 * or persists a content candidate by itself.
 */
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

/** Fixture outcome mapping is kept concrete; byte/cancellation mechanics are shared. */
async function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return waitForAbortable(promise, signal, safeFailure);
}

async function readReleaseDocument(
  resourceId: LocalContentReleaseResourceId | 'descriptor',
  path: string,
  signal: AbortSignal,
): Promise<unknown> {
  if (
    resourceId !== 'descriptor' &&
    !validateLocalContentReleaseTransportReceipt({
      resourceId,
      path,
      status: 200,
      mimeType: 'application/json',
      redirected: false,
      byteLength: 0,
    }).ok
  )
    throw safeFailure();
  try {
    return await fetchBoundedSameOriginJson(path, signal, localContentReleaseMaxTransportBytes);
  } catch {
    throw safeFailure();
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

/**
 * Reads one explicit update attempt under the bounded transport contract.
 * Safety prerequisites are awaited independently from supplemental content so
 * callers can record a verified takedown before reporting an incomplete
 * release. This helper performs no IDB write, retry, timer poll, or activation.
 */
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
