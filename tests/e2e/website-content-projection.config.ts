import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';
export default defineConfig({
  testDir: '.',
  testMatch: ['website-content-projection.spec.ts', 'production-website-content.spec.ts'],
  globalSetup: './website-content-projection.setup.ts',
  workers: 2,
  retries: 0,
  forbidOnly: true,
  outputDir: `../../test-results/website-projection/${randomUUID()}`,
  reporter: [
    ['list'],
    ['json', { outputFile: '../../test-results/website-projection-results.json' }],
  ],
  use: {
    channel: 'chrome',
    baseURL: 'http://127.0.0.1:43178',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'website-390x844', use: { viewport: { width: 390, height: 844 } } },
    { name: 'website-800x1280', use: { viewport: { width: 800, height: 1280 } } },
    { name: 'website-1440x900', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'website-reflow-200pct', use: { viewport: { width: 390, height: 844 } } },
  ],
});
