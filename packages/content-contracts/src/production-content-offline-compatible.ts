// @ts-expect-error Node 24 runs the production builder directly.
import { canonicalJson, sha256Utf8, utf8ByteLength } from './index.ts';
import {
  hasExactProductionKeys,
  isPlainProductionRecord,
  isProductionSha256,
  // @ts-expect-error Node 24 runs the production builder directly.
} from './content-release-core-v1.ts';
import type { ProductionContentSafetyLedgerV1 } from './production-content-release-v1.js';
import {
  createProductionContentOfflineBundleV1,
  validateProductionContentOfflineBundleV1,
  productionContentOfflineBundleFormatV1,
  productionContentOfflineBundleMaxBytes,
  mergeProductionContentOfflineSafetyV1,
  type ProductionContentOfflineBundleV1,
  // @ts-expect-error Node 24 runs the production builder directly.
} from './production-content-offline-v1.ts';
import {
  isProductionContentDescriptorV2,
  // @ts-expect-error Node 24 runs the production builder directly.
} from './production-content-release-v2.ts';
import {
  isProductionContentDescriptorV3,
  // @ts-expect-error Node 24 runs the production builder directly.
} from './production-content-release-v3.ts';
import {
  createValidatedProductionContentRelease,
  type ProductionContentReady,
  type ProductionContentReleaseDescriptor,
  type ProductionContentReleaseDocuments,
  type ProductionContentManifest,
  // @ts-expect-error Node 24 runs the production builder directly.
} from './production-content-compatible.ts';

export const productionContentOfflineBundleFormatV2 =
  'wrn.production-content-offline-bundle.v2' as const;
export const productionContentOfflineBundleFormatV3 =
  'wrn.production-content-offline-bundle.v3' as const;
export type ProductionContentOfflineBundle = Omit<
  ProductionContentOfflineBundleV1,
  'format' | 'descriptor' | 'manifest' | 'documents'
> & {
  readonly format:
    | typeof productionContentOfflineBundleFormatV1
    | typeof productionContentOfflineBundleFormatV2
    | typeof productionContentOfflineBundleFormatV3;
  readonly descriptor: ProductionContentReleaseDescriptor;
  readonly manifest: ProductionContentManifest;
  readonly documents: ProductionContentReleaseDocuments;
};
function snapshot<T>(input: T): T {
  return JSON.parse(canonicalJson(input)) as T;
}
const integer = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

/** V3 binds the whole persisted canonical envelope, including its wrapper fields. */
function v3OfflineEnvelopeBytes(input: {
  readonly key: string;
  readonly checkedAt: number;
  readonly descriptor: ProductionContentReleaseDescriptor;
  readonly manifest: ProductionContentManifest;
  readonly documents: ProductionContentReleaseDocuments;
}): number {
  let byteLength = 0;
  for (let attempt = 0; attempt < 8; attempt++) {
    const next = utf8ByteLength(
      canonicalJson({
        format: productionContentOfflineBundleFormatV3,
        key: input.key,
        byteLength,
        checkedAt: input.checkedAt,
        descriptor: input.descriptor,
        manifest: input.manifest,
        documents: input.documents,
      }),
    );
    if (next === byteLength) return next;
    byteLength = next;
  }
  throw new Error('V3 production offline envelope length did not stabilize.');
}

export async function createProductionContentOfflineBundle(
  input: Parameters<typeof createProductionContentOfflineBundleV1>[0],
): Promise<ProductionContentOfflineBundle> {
  const bound = snapshot(input);
  if (
    !isProductionContentDescriptorV2(bound.descriptor) &&
    !isProductionContentDescriptorV3(bound.descriptor)
  )
    return createProductionContentOfflineBundleV1(bound);
  if (!integer(bound.checkedAt))
    throw new Error('Production offline bundle needs a safe checked time.');
  const knownSafety = bound.knownSafety ?? { revision: 0, revokedIds: [] };
  const ready = await createValidatedProductionContentRelease({
    descriptor: bound.descriptor,
    manifest: bound.manifest,
    documents: bound.documents,
    ...(knownSafety.revision === 0 ? {} : { knownSafety }),
  });
  if (ready === null) throw new Error('Invalid versioned production release.');
  const merged = mergeProductionContentOfflineSafetyV1(knownSafety, ready.safetyLedger);
  if (merged === null || ready.articleIds.some((id) => merged.revokedIds.includes(id)))
    throw new Error('Unsafe V2 production release.');
  const key = await sha256Utf8(
    canonicalJson({
      revision: ready.descriptor.releaseRevision,
      sequence: ready.descriptor.sequence,
      manifestSha256: ready.manifestSha256,
    }),
  );
  const byteLength = isProductionContentDescriptorV3(ready.descriptor)
    ? v3OfflineEnvelopeBytes({
        key,
        checkedAt: bound.checkedAt,
        descriptor: ready.descriptor,
        manifest: ready.manifest,
        documents: ready.documents,
      })
    : utf8ByteLength(
        canonicalJson({
          descriptor: ready.descriptor,
          manifest: ready.manifest,
          documents: ready.documents,
        }),
      );
  if (byteLength > productionContentOfflineBundleMaxBytes)
    throw new Error('Production offline bundle exceeds its cap.');
  return Object.freeze({
    format: isProductionContentDescriptorV3(ready.descriptor)
      ? productionContentOfflineBundleFormatV3
      : productionContentOfflineBundleFormatV2,
    key,
    byteLength,
    checkedAt: bound.checkedAt,
    descriptor: ready.descriptor,
    manifest: ready.manifest,
    documents: ready.documents,
  });
}
export async function validateProductionContentOfflineBundle(
  value: unknown,
  safety: ProductionContentSafetyLedgerV1,
): Promise<ProductionContentReady | null> {
  if (isPlainProductionRecord(value) && value.format === productionContentOfflineBundleFormatV1)
    return validateProductionContentOfflineBundleV1(value, safety);
  if (
    !isPlainProductionRecord(value) ||
    !hasExactProductionKeys(value, [
      'format',
      'key',
      'byteLength',
      'checkedAt',
      'descriptor',
      'manifest',
      'documents',
    ]) ||
    (value.format !== productionContentOfflineBundleFormatV2 &&
      value.format !== productionContentOfflineBundleFormatV3) ||
    (value.format === productionContentOfflineBundleFormatV2 &&
      !isProductionContentDescriptorV2(value.descriptor)) ||
    (value.format === productionContentOfflineBundleFormatV3 &&
      !isProductionContentDescriptorV3(value.descriptor)) ||
    !isProductionSha256(value.key) ||
    !integer(value.byteLength) ||
    !integer(value.checkedAt)
  )
    return null;
  try {
    const stored = snapshot(value),
      currentSafety = snapshot(safety);
    const expected = await createProductionContentOfflineBundle({
      descriptor: stored.descriptor,
      manifest: stored.manifest,
      documents: stored.documents,
      checkedAt: stored.checkedAt,
    });
    if (expected.key !== stored.key || expected.byteLength !== stored.byteLength) return null;
    const ready = await createValidatedProductionContentRelease({
      descriptor: expected.descriptor,
      manifest: expected.manifest,
      documents: expected.documents,
    });
    if (
      ready === null ||
      mergeProductionContentOfflineSafetyV1(ready.safetyLedger, currentSafety) === null ||
      ready.articleIds.some((id) => currentSafety.revokedIds.includes(id))
    )
      return null;
    return ready;
  } catch {
    return null;
  }
}
