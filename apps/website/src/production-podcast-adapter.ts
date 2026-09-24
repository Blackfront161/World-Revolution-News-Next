import { createProductionOnlinePodcastAdapter } from '../../../packages/browser-content/src/production-podcast-online';

export const productionOnlinePodcastAdapter = createProductionOnlinePodcastAdapter(
  import.meta.env.VITE_WRN_PODCAST_ENDPOINT,
);
