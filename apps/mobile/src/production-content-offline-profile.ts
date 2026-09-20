import { createProductionOfflinePersistenceProfile } from '../../../packages/browser-content/src/production-content-offline-profile';
export * from '../../../packages/browser-content/src/production-content-offline-profile';
export const mobileProductionContentOfflineDatabaseName =
  'wrn.mobile-production-content-offline.v1';
export const productionOfflinePersistenceProfile = createProductionOfflinePersistenceProfile(
  mobileProductionContentOfflineDatabaseName,
);
