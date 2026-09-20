import { createProductionTranslationAdapter } from '../../../packages/browser-content/src/production-translation';

/** This client's public build configuration is separate from the other client. */
export const createWebsiteProductionTranslationAdapter = createProductionTranslationAdapter;
export const productionTranslationAdapter = createWebsiteProductionTranslationAdapter({
  endpoint: import.meta.env.VITE_WRN_TRANSLATION_ENDPOINT,
  adapter: {
    id: import.meta.env.VITE_WRN_TRANSLATION_ADAPTER_ID,
    version: import.meta.env.VITE_WRN_TRANSLATION_ADAPTER_VERSION,
    provider: import.meta.env.VITE_WRN_TRANSLATION_PROVIDER,
  },
});
