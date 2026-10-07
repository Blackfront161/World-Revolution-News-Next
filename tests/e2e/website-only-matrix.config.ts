import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// Preserve the existing four Website projects and every existing specification.
// The separate setup deliberately never opens or builds apps/mobile.
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  globalSetup: './website-only-matrix.setup.ts',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  forbidOnly: true,
  outputDir: `../../test-results/website-only/${randomUUID()}`,
  reporter: [['list'], ['json', { outputFile: '../../test-results/website-only-matrix.json' }]],
  expect: { timeout: 5_000 },
  use: {
    channel: 'chrome',
    baseURL: 'http://127.0.0.1:43174',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'website-390x844', use: { viewport: { width: 390, height: 844 } } },
    { name: 'website-800x1280', use: { viewport: { width: 800, height: 1280 } } },
    { name: 'website-1440x900', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'website-reflow-200pct', use: { viewport: { width: 390, height: 844 } } },
  ],
});
