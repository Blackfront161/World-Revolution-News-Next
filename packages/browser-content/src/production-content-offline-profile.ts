import {
  createEmptyProductionContentOfflineControlV1,
  isProductionContentOfflineControlV1,
  mergeProductionContentOfflineSafetyV1,
  productionContentOfflineBundleMaxBytes,
  productionContentOfflineControlMaxBytes,
  productionContentOfflineMaxBundles,
  productionContentOfflineTotalBundleMaxBytes,
  sameProductionContentOfflineSafetyV1,
  type ProductionContentOfflineControlV1,
} from '@wrn/content-contracts/production-content-offline-v1';
import {
  createProductionContentOfflineBundle,
  validateProductionContentOfflineBundle,
  type ProductionContentOfflineBundle,
  type ProductionContentReady,
  type ProductionContentSafetyLedgerV1,
} from '@wrn/content-contracts';
import type { OfflineControlPatch, OfflinePersistenceProfile } from './content-offline-store-core';

export type ProductionOfflineBundleInput = Readonly<{
  descriptor: unknown;
  manifest: unknown;
  documents: unknown;
  checkedAt: number;
}>;

function freezeControl(
  control: ProductionContentOfflineControlV1,
): ProductionContentOfflineControlV1 {
  return Object.freeze({
    ...control,
    acceptedIdentities: Object.freeze(
      control.acceptedIdentities.map((identity) => Object.freeze({ ...identity })),
    ),
    safety: Object.freeze({
      ...control.safety,
      revokedIds: Object.freeze([...control.safety.revokedIds]),
    }),
    pendingRecheck:
      control.pendingRecheck === null ? null : Object.freeze({ ...control.pendingRecheck }),
  });
}

export function patchProductionOfflineControl(
  control: ProductionContentOfflineControlV1,
  patch: OfflineControlPatch<ProductionContentSafetyLedgerV1>,
): ProductionContentOfflineControlV1 {
  const next = freezeControl({ ...control, ...patch });
  if (!isProductionContentOfflineControlV1(next))
    throw new Error('Production offline control patch is invalid.');
  return next;
}

export function createProductionOfflinePersistenceProfile(
  databaseName: string,
): OfflinePersistenceProfile<
  ProductionContentOfflineControlV1,
  ProductionContentOfflineBundle,
  ProductionContentSafetyLedgerV1,
  ProductionContentReady,
  ProductionOfflineBundleInput
> {
  return Object.freeze({
    databaseName,
    bounds: Object.freeze({
      controlBytes: productionContentOfflineControlMaxBytes,
      bundleBytes: productionContentOfflineBundleMaxBytes,
      totalBytes: productionContentOfflineTotalBundleMaxBytes,
      slots: productionContentOfflineMaxBundles,
    }),
    createEmptyControl: createEmptyProductionContentOfflineControlV1,
    isControl: isProductionContentOfflineControlV1,
    createBundle: (input: ProductionOfflineBundleInput, safety: ProductionContentSafetyLedgerV1) =>
      createProductionContentOfflineBundle({ ...input, knownSafety: safety }),
    validateBundle: validateProductionContentOfflineBundle,
    mergeSafety: mergeProductionContentOfflineSafetyV1,
    sameSafety: sameProductionContentOfflineSafetyV1,
    identity: (bundle: ProductionContentOfflineBundle, ready: ProductionContentReady) =>
      Object.freeze({
        key: bundle.key,
        revision: ready.descriptor.releaseRevision,
        sequence: ready.descriptor.sequence,
      }),
    patchControl: patchProductionOfflineControl,
  });
}
