import { createProductionMediaOfflineStoreFactory } from '../../../packages/browser-content/src/production-media-offline-store';
import { websiteProductionMediaOfflineDatabaseName } from './production-media-offline-profile';

export * from '../../../packages/browser-content/src/production-media-offline-store';
export const openProductionMediaOfflineStore = createProductionMediaOfflineStoreFactory(
  websiteProductionMediaOfflineDatabaseName,
);
