import {
  createProductionMediaController,
  type ProductionMediaControllerPorts,
} from '../../../packages/browser-content/src/production-media-controller';
import { createProductionMediaResumeStoreFactory } from '../../../packages/browser-content/src/production-media-resume-store';
import { openProductionMediaOfflineStore } from './production-media-offline-store';
export { createProductionMediaController } from '../../../packages/browser-content/src/production-media-controller';
export const createMobileProductionMediaController = (
  ports: Omit<
    ProductionMediaControllerPorts,
    'openOffline' | 'openResume' | 'source' | 'allowedOrigins'
  > &
    Partial<Pick<ProductionMediaControllerPorts, 'source' | 'allowedOrigins'>>,
) =>
  createProductionMediaController({
    ...ports,
    openOffline: openProductionMediaOfflineStore,
    openResume: createProductionMediaResumeStoreFactory('wrn.mobile-production-media-resume.v1'),
    source: ports.source ?? null,
    allowedOrigins: ports.allowedOrigins ?? new Set(),
  });
