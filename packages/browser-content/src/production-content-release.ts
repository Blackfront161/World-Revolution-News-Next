import {
  canonicalJson,
  createValidatedProductionContentRelease,
  isProductionContentDescriptor,
  validateProductionContentSafetyEvidence,
  sha256Utf8,
  type ProductionContentReady,
  type ProductionContentSafetyLedgerV1,
  type ProductionContentReleaseDescriptor,
  productionContentResourceCapsV3,
} from '@wrn/content-contracts';
import {
  deriveProductionContentReleasePathsV1,
  isProductionContentCurrentPointerV1,
  type ProductionContentCurrentPointerV1,
} from '@wrn/content-contracts/production-content-offline-v1';
import { fetchBoundedSameOriginJson } from './content-release-transport-core';

export const productionContentCurrentPointerPath = '/wrn-production-content/current.json';
export type ProductionContentJsonTransportV1 = typeof fetchBoundedSameOriginJson;

export type ProductionContentSafetyReceipt = Readonly<{
  pointer: ProductionContentCurrentPointerV1;
  descriptor: unknown;
  manifest: unknown;
  archiveLifecycle: unknown;
  safety: ProductionContentSafetyLedgerV1;
}>;

export type ProductionContentSafetyCheck =
  | Readonly<{ kind: 'failed'; safety: null }>
  | Readonly<{
      kind: 'verified';
      safety: ProductionContentSafetyLedgerV1;
      receipt: ProductionContentSafetyReceipt;
    }>;

function pointer(value: unknown): ProductionContentCurrentPointerV1 | null {
  return isProductionContentCurrentPointerV1(value) ? Object.freeze({ ...value }) : null;
}
function freezeReceipt<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freezeReceipt(child);
    Object.freeze(value);
  }
  return value;
}
function copyReceipt<T>(value: T): T {
  return freezeReceipt(JSON.parse(canonicalJson(value)) as T);
}
function resourceCaps(descriptor: ProductionContentReleaseDescriptor) {
  return descriptor.contractVersion === '3.0.0'
    ? productionContentResourceCapsV3
    : Object.freeze({
        articles: 512 * 1024,
        admission: 512 * 1024,
        discoverIndex: 512 * 1024,
        readerDetails: 512 * 1024,
        archiveLifecycle: 256 * 1024,
      });
}
/** Phase one cannot request reader or discovery data and returns only immutable safety evidence. */
export async function verifyProductionContentSafety(
  signal: AbortSignal,
  knownSafety: ProductionContentSafetyLedgerV1,
  transport: ProductionContentJsonTransportV1 = fetchBoundedSameOriginJson,
): Promise<ProductionContentSafetyCheck> {
  try {
    knownSafety = copyReceipt(knownSafety);
    const rawPointer = await transport(productionContentCurrentPointerPath, signal, 32 * 1024);
    const current = pointer(rawPointer);
    const paths = current === null ? null : deriveProductionContentReleasePathsV1(current);
    if (current === null || paths === null) return Object.freeze({ kind: 'failed', safety: null });
    const descriptor = await transport(paths.descriptor, signal, 128 * 1024);
    if (
      !isProductionContentDescriptor(descriptor) ||
      descriptor.releaseRevision !== current.releaseRevision ||
      descriptor.sequence !== current.sequence ||
      (await sha256Utf8(canonicalJson(descriptor))) !== current.descriptorSha256
    )
      return Object.freeze({ kind: 'failed', safety: null });
    const manifest = await transport(paths.manifest, signal, 256 * 1024);
    const archiveLifecycle = await transport(
      paths.archiveLifecycle,
      signal,
      resourceCaps(descriptor).archiveLifecycle,
    );
    const safety = await validateProductionContentSafetyEvidence({
      descriptor,
      manifest,
      archiveLifecycle,
      knownSafety,
    });
    if (safety === null) return Object.freeze({ kind: 'failed', safety: null });
    return Object.freeze({
      kind: 'verified',
      safety,
      receipt: copyReceipt({
        pointer: current,
        descriptor,
        manifest,
        archiveLifecycle,
        safety,
      }),
    });
  } catch {
    return Object.freeze({ kind: 'failed', safety: null });
  }
}

/** Phase two starts only after the caller's durable safety transaction resolves. */
export async function completeProductionContentRelease(
  inputReceipt: ProductionContentSafetyReceipt,
  signal: AbortSignal,
  knownSafety: ProductionContentSafetyLedgerV1,
  transport: ProductionContentJsonTransportV1 = fetchBoundedSameOriginJson,
): Promise<
  Readonly<{ kind: 'failed' }> | Readonly<{ kind: 'ready'; runtime: ProductionContentReady }>
> {
  const phase = new AbortController();
  const abort = () => phase.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  let requests: Promise<unknown>[] = [];
  try {
    knownSafety = copyReceipt(knownSafety);
    const receipt = copyReceipt(inputReceipt);
    const paths = deriveProductionContentReleasePathsV1(receipt.pointer);
    if (
      paths === null ||
      !isProductionContentDescriptor(receipt.descriptor) ||
      receipt.descriptor.releaseRevision !== receipt.pointer.releaseRevision ||
      receipt.descriptor.sequence !== receipt.pointer.sequence ||
      (await sha256Utf8(canonicalJson(receipt.descriptor))) !== receipt.pointer.descriptorSha256 ||
      (await validateProductionContentSafetyEvidence({ ...receipt, knownSafety })) === null
    )
      return Object.freeze({ kind: 'failed' });
    const caps = resourceCaps(receipt.descriptor);
    requests = [
      transport(paths.articles, phase.signal, caps.articles),
      transport(paths.admission, phase.signal, caps.admission),
      transport(paths.discoverIndex, phase.signal, caps.discoverIndex),
      transport(paths.readerDetails, phase.signal, caps.readerDetails),
    ];
    const [articles, admission, discoverIndex, readerDetails] = await Promise.all(requests);
    const runtime = await createValidatedProductionContentRelease({
      descriptor: receipt.descriptor,
      manifest: receipt.manifest,
      documents: {
        articles,
        admission,
        discoverIndex,
        readerDetails,
        archiveLifecycle: receipt.archiveLifecycle,
      },
      ...(knownSafety.revision === 0 ? {} : { knownSafety }),
    });
    return runtime === null || phase.signal.aborted
      ? Object.freeze({ kind: 'failed' })
      : Object.freeze({ kind: 'ready', runtime });
  } catch {
    phase.abort();
    await Promise.allSettled(requests);
    return Object.freeze({ kind: 'failed' });
  } finally {
    signal.removeEventListener('abort', abort);
  }
}

export type ProductionContentSourceV1 = Readonly<{
  id: 'bundled-v1' | 'solinaridao-static-v1';
  verifySafety: (
    signal: AbortSignal,
    known: ProductionContentSafetyLedgerV1,
  ) => Promise<ProductionContentSafetyCheck>;
  completeRelease: (
    receipt: ProductionContentSafetyReceipt,
    signal: AbortSignal,
    known: ProductionContentSafetyLedgerV1,
  ) => ReturnType<typeof completeProductionContentRelease>;
}>;

export function createProductionContentSourceV1(
  transport: ProductionContentJsonTransportV1,
  id: ProductionContentSourceV1['id'],
): ProductionContentSourceV1 {
  return Object.freeze({
    id,
    verifySafety: (signal, known) => verifyProductionContentSafety(signal, known, transport),
    completeRelease: (receipt, signal, known) =>
      completeProductionContentRelease(receipt, signal, known, transport),
  });
}

export const bundledProductionContentSource = createProductionContentSourceV1(
  fetchBoundedSameOriginJson,
  'bundled-v1',
);
