import { createProductionEventsMediaLoader } from '../../../../../packages/browser-content/src/events-media-loader';
import assetUrl from './data/production-events-media-v1.json?url';

export const loadMobileProductionEventsMedia = createProductionEventsMediaLoader(assetUrl);
