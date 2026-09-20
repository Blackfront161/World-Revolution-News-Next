import { createBoundedTrustedOriginJsonTransportV1 } from '../../../packages/browser-content/src/content-release-transport-core';
import {
  bundledProductionContentSource,
  createProductionContentSourceV1,
} from '../../../packages/browser-content/src/production-content-release';

// Compiled trust boundary; never sourced from storage, route parameters or content.
const mobileUpdateOrigin = 'https://solinaridao.com';
export const mobileProductionContentDeliveryProfile = Object.freeze({
  bootstrapSource: bundledProductionContentSource,
  refreshSource: createProductionContentSourceV1(
    createBoundedTrustedOriginJsonTransportV1(mobileUpdateOrigin),
    'solinaridao-static-v1',
  ),
});
