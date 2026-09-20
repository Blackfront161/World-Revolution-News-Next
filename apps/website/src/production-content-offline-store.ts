import { createProductionContentOfflineStoreFactory } from '../../../packages/browser-content/src/production-content-offline-store';
import { websiteProductionContentOfflineDatabaseName } from './production-content-offline-profile';

export const openProductionContentOfflineStore = createProductionContentOfflineStoreFactory(
  websiteProductionContentOfflineDatabaseName,
);
