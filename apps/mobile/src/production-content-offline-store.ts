import { createProductionContentOfflineStoreFactory } from '../../../packages/browser-content/src/production-content-offline-store';
import { mobileProductionContentOfflineDatabaseName } from './production-content-offline-profile';
export * from '../../../packages/browser-content/src/production-content-offline-store';
export const openProductionContentOfflineStore = createProductionContentOfflineStoreFactory(
  mobileProductionContentOfflineDatabaseName,
);
