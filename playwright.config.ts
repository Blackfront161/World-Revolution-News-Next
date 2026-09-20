import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const chromeChannel = 'chrome' as const;

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 2,
  reporter: [['list']],
  // Playwright clears its output directory: isolate each run from retained evidence.
  outputDir: `test-results/runs/${Date.now()}-${randomUUID()}`,
  expect: {
    timeout: 5_000,
  },
  use: {
    channel: chromeChannel,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-390x844',
      use: { baseURL: 'http://127.0.0.1:43173', viewport: { width: 390, height: 844 } },
    },
    {
      name: 'mobile-600x960',
      use: { baseURL: 'http://127.0.0.1:43173', viewport: { width: 600, height: 960 } },
    },
    {
      name: 'mobile-reflow-200pct',
      use: { baseURL: 'http://127.0.0.1:43173', viewport: { width: 390, height: 844 } },
    },
    {
      name: 'website-390x844',
      use: { baseURL: 'http://127.0.0.1:43174', viewport: { width: 390, height: 844 } },
    },
    {
      name: 'website-800x1280',
      use: { baseURL: 'http://127.0.0.1:43174', viewport: { width: 800, height: 1280 } },
    },
    {
      name: 'website-1440x900',
      use: { baseURL: 'http://127.0.0.1:43174', viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'website-reflow-200pct',
      use: { baseURL: 'http://127.0.0.1:43174', viewport: { width: 390, height: 844 } },
    },
  ],
});
