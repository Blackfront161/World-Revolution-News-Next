import { createProductionOfflinePersistenceProfile } from '../../../packages/browser-content/src/production-content-offline-profile';

export const websiteProductionContentOfflineDatabaseName =
  'wrn.website-production-content-offline.v1';
export const productionOfflinePersistenceProfile = createProductionOfflinePersistenceProfile(
  websiteProductionContentOfflineDatabaseName,
);
