import { compileProductionMediaProviderPolicyV1 } from '@wrn/content-contracts/production-media-v1';
import { createProductionMediaInitialSource } from '../../../packages/browser-content/src/production-media-initial-source';
import { productionMediaInitialReleaseV1 } from '../../../packages/browser-content/src/data/production-media-initial-release-v1';
import type { ProductionMediaControllerFactory } from '../../../packages/browser-content/src/production-media-ui';
import { createWebsiteProductionMediaController } from './production-media-controller';
import { productionMediaInitialProfile } from '../../../packages/browser-content/src/production-media-profile';

export const createWebsiteProductionMediaExperienceController: ProductionMediaControllerFactory = (
  onState,
) => {
  const allowedOrigins = new Set(productionMediaInitialProfile.allowedOrigins);
  const providerPolicy = compileProductionMediaProviderPolicyV1(
    productionMediaInitialProfile.providerPolicy,
    allowedOrigins,
  );
  if (!providerPolicy) throw new Error('Invalid compiled media profile');
  return createWebsiteProductionMediaController({
    onState,
    source: null,
    allowedOrigins,
    providerPolicy,
    initialSource: createProductionMediaInitialSource({
      raw: productionMediaInitialReleaseV1,
      allowedOrigins,
      providerPolicy,
    }),
  });
};
