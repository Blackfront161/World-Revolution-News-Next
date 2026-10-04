import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createStagingIsolationPlugin } from './tools/staging-vite-plugin.mjs';
import { createBrowserContentAliases } from '../../tools/browser-content-aliases.mjs';
import { createProductionCodeSplitting } from '../../tools/vite-production-chunks.mjs';
import { createAtlasPreviewPlugin } from './tools/atlas-vite-plugin.mjs';

const code26Mark = '../../../apps/website/src/assets/solinaridao-header-mark-filled.png';
const inheritedMark = '../assets/solinaridao-header-mark-filled.png';

function code26WebsiteBrandAsset() {
  return {
    name: 'code26-website-brand-asset',
    enforce: 'pre' as const,
    transform(source: string, id: string) {
      if (!(id.replaceAll('\\', '/').split('?')[0] ?? '').endsWith('/packages/brand-tokens/src/index.ts'))
        return null;
      if (!source.includes(inheritedMark))
        throw new Error('Website brand asset contract changed');
      // Use the Code26 mark without changing the shared app asset or the
      // two-image offline-shell contract.
      return source.replace(inheritedMark, code26Mark);
    },
  };
}

export default defineConfig(({ mode }) => {
  const staging = mode === 'staging';
  const stagingOrigin = process.env.WRN_STAGING_ORIGIN;
  if (staging && !stagingOrigin) throw new Error('WRN_STAGING_ORIGIN is required for staging mode');
  return {
    plugins: [code26WebsiteBrandAsset(), react(), createAtlasPreviewPlugin(import.meta.dirname), ...(staging ? [createStagingIsolationPlugin(stagingOrigin!)] : [])],
    resolve: { alias: createBrowserContentAliases(import.meta.dirname) },
    build: {
      rolldownOptions: { output: { codeSplitting: createProductionCodeSplitting() } },
    },
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, '**/dist-normal-*/**'],
      setupFiles: './src/test/setup.ts',
    },
  };
});
