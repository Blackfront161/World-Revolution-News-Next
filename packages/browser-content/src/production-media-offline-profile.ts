import {
  isProductionMediaPointerV1,
  productionMediaDocumentsV1,
  sameProductionMediaSafetyV1,
  snapshotProductionMediaSafetyV1,
  validateHistoricalProductionMediaReleaseV1,
  type ProductionMediaSafetyV1,
} from '@wrn/content-contracts/production-media-v1';
import {
  productionMediaOfflineBundleKeyV1,
  productionMediaOfflineFixedBytes,
  productionMediaOfflineFormatV1,
  type ProductionMediaOfflineBundleV1,
} from '@wrn/content-contracts/production-media-offline-v1';

export type ProductionMediaOfflineBundleInput = Readonly<{
  pointerRaw: string;
  descriptorRaw: string;
  documentsRaw: Readonly<Record<(typeof productionMediaDocumentsV1)[number], string>>;
  admittedSafety: ProductionMediaSafetyV1;
  checkedAt: number;
}>;

/** Builds only a raw, historical bundle. A1 reconstructs Ready later on each read. */
export async function createProductionMediaOfflineBundle(
  input: ProductionMediaOfflineBundleInput,
): Promise<ProductionMediaOfflineBundleV1 | null> {
  // Detach every caller-owned value before the first hashing await.
  const checkedAt = input.checkedAt;
  if (!Number.isSafeInteger(checkedAt) || checkedAt < 0) return null;
  const safety = snapshotProductionMediaSafetyV1(input.admittedSafety);
  const raw = {
    pointerRaw: input.pointerRaw,
    descriptorRaw: input.descriptorRaw,
    documentsRaw: Object.freeze({ ...input.documentsRaw }),
  };
  if (!safety || !(await validateHistoricalProductionMediaReleaseV1(raw, safety))) return null;
  let pointer: unknown;
  try {
    pointer = JSON.parse(raw.pointerRaw);
  } catch {
    return null;
  }
  if (!isProductionMediaPointerV1(pointer)) return null;
  const key = await productionMediaOfflineBundleKeyV1({
    releaseRevision: pointer.releaseRevision,
    sequence: pointer.sequence,
    descriptorSha256: pointer.descriptorSha256,
  });
  if (!key) return null;
  const basis = {
    format: productionMediaOfflineFormatV1,
    key,
    byteLength: 0,
    checkedAt,
    admittedSafety: safety,
    ...raw,
  };
  const byteLength = productionMediaOfflineFixedBytes(basis);
  return byteLength === null ? null : Object.freeze({ ...basis, byteLength });
}

export function sameProductionMediaOfflineSafety(
  left: unknown,
  right: unknown,
): left is ProductionMediaSafetyV1 {
  return sameProductionMediaSafetyV1(left, right);
}
