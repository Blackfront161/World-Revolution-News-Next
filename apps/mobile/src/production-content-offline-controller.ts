import {
  createProductionContentOfflineController as createController,
  type ProductionContentOfflineDependencies,
} from '../../../packages/browser-content/src/production-content-offline-controller';
import { openProductionContentOfflineStore } from './production-content-offline-store';
import { mobileProductionContentDeliveryProfile } from './production-content-delivery-profile';
export * from '../../../packages/browser-content/src/production-content-offline-controller';
export function createProductionContentOfflineController(
  overrides: Partial<ProductionContentOfflineDependencies> = {},
) {
  const explicitPhases =
    overrides.verifySafety !== undefined || overrides.completeRelease !== undefined;
  return createController({
    openStore: openProductionContentOfflineStore,
    ...(explicitPhases ? {} : mobileProductionContentDeliveryProfile),
    ...overrides,
  });
}
