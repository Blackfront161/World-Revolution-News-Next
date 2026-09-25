import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createStagingIsolationPlugin } from './tools/staging-vite-plugin.mjs';
import { createBrowserContentAliases } from '../../tools/browser-content-aliases.mjs';
import { createProductionCodeSplitting } from '../../tools/vite-production-chunks.mjs';

export default defineConfig(({ mode }) => {
  const staging = mode === 'staging';
  const stagingOrigin = process.env.WRN_STAGING_ORIGIN;
  if (staging && !stagingOrigin) throw new Error('WRN_STAGING_ORIGIN is required for staging mode');
  return {
    plugins: [react(), ...(staging ? [createStagingIsolationPlugin(stagingOrigin!)] : [])],
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
