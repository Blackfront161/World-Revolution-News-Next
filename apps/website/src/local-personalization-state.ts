import {
  createLocalPersonalizationStore,
  type PersonalizationStorage,
  type StorageEventSource,
} from '../../../packages/browser-content/src/local-personalization-state';

export type {
  LocalPersonalizationLoadResult as WebsitePersonalizationLoadResult,
  LocalPersonalizationStore as WebsitePersonalizationStore,
} from '../../../packages/browser-content/src/local-personalization-state';

/** Website selections remain separate from Mobile, including on a shared origin. */
export const websitePersonalizationStorageKey = 'wrn.website-local-personalization.v1' as const;

export function createWebsitePersonalizationStore(
  storage?: PersonalizationStorage,
  eventSource?: StorageEventSource,
) {
  return createLocalPersonalizationStore(websitePersonalizationStorageKey, storage, eventSource);
}
