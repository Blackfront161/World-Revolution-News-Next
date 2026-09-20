import {
  createLocalPersonalizationStore,
  type PersonalizationStorage,
  type StorageEventSource,
} from '../../../packages/browser-content/src/local-personalization-state';
export type {
  LocalPersonalizationLoadResult as MobilePersonalizationLoadResult,
  LocalPersonalizationSaveResult as MobilePersonalizationSaveResult,
  LocalPersonalizationClearResult as MobilePersonalizationClearResult,
  LocalPersonalizationStore as MobilePersonalizationStore,
} from '../../../packages/browser-content/src/local-personalization-state';
/** This key is exclusively for the explicit mobile "For me" selection. */
export const mobilePersonalizationStorageKey = 'wrn.mobile-local-personalization.v1' as const;
export function createMobilePersonalizationStore(
  storage?: PersonalizationStorage,
  eventSource?: StorageEventSource,
) {
  return createLocalPersonalizationStore(mobilePersonalizationStorageKey, storage, eventSource);
}
