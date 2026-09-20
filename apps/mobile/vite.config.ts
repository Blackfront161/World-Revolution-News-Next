import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createBrowserContentAliases } from '../../tools/browser-content-aliases.mjs';
import { productionMediaInitialCsp } from '../../packages/browser-content/src/production-media-profile';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'wrn-production-media-policy',
      apply: 'build',
      transformIndexHtml: () => [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: productionMediaInitialCsp },
          injectTo: 'head-prepend',
        },
        {
          tag: 'meta',
          attrs: { name: 'referrer', content: 'no-referrer' },
          injectTo: 'head-prepend',
        },
      ],
    },
  ],
  resolve: { alias: createBrowserContentAliases(import.meta.dirname) },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
