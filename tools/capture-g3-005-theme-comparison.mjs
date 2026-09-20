import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const candidate = '9a9a2216a4fa734596c0742f4c2eaf70d4a75fce';
const viewport = { width: 390, height: 844 };
const port = 43_175;
const repositoryRoot = process.cwd();
const outputRoot = path.resolve(repositoryRoot, 'docs/evidence/WRN-G3-005/theme-comparison');

const server = await createServer({
  clearScreen: false,
  configFile: false,
  logLevel: 'error',
  root: path.resolve(repositoryRoot, 'apps/mobile'),
  server: {
    host: '127.0.0.1',
    port,
    strictPort: true,
  },
});

await mkdir(outputRoot, { recursive: true });
await server.listen();

const browser = await chromium.launch({ channel: 'chrome' });
const comparison = {};

try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({
      colorScheme: theme,
      reducedMotion: 'reduce',
      viewport,
    });
    const page = await context.newPage();

    await page.goto(`http://127.0.0.1:${port}/?state=ready&theme=${theme}#discover`);
    await page.getByRole('heading', { name: 'Entdecken', exact: true }).waitFor();
    await page.evaluate(async () => {
      document.documentElement.style.fontSize = '100%';
      await document.fonts.ready;
    });

    comparison[theme] = await page.evaluate(() => {
      const selectors = ['.mobile-primary-nav a', '.discover-search', '.discover-facets select'];

      return selectors.flatMap((selector) =>
        [...document.querySelectorAll(selector)].map((element, index) => {
          const bounds = element.getBoundingClientRect();
          return {
            key: `${selector}:${index}`,
            height: bounds.height,
            width: bounds.width,
            x: bounds.x,
            y: bounds.y,
          };
        }),
      );
    });

    await page.screenshot({
      fullPage: true,
      path: path.join(
        outputRoot,
        `${candidate}_mobile_390x844_${theme}_initial_100pct_2026-08-24.png`,
      ),
    });

    await context.close();
  }

  const light = new Map(comparison.light.map((measurement) => [measurement.key, measurement]));
  const geometryDifferences = comparison.dark.flatMap((darkMeasurement) => {
    const lightMeasurement = light.get(darkMeasurement.key);
    if (!lightMeasurement) return [{ key: darkMeasurement.key, reason: 'missing-light-control' }];

    const differences = ['height', 'width', 'x', 'y'].filter(
      (property) => Math.abs(lightMeasurement[property] - darkMeasurement[property]) > 0.01,
    );
    return differences.length === 0
      ? []
      : [{ key: darkMeasurement.key, differences, light: lightMeasurement, dark: darkMeasurement }];
  });

  await writeFile(
    path.join(outputRoot, 'geometry-comparison.json'),
    `${JSON.stringify({ candidate, viewport, zoom: '100%', geometryDifferences, ...comparison }, null, 2)}\n`,
    'utf8',
  );

  if (geometryDifferences.length > 0) {
    throw new Error(`Theme geometry differs: ${JSON.stringify(geometryDifferences)}`);
  }
} finally {
  await browser.close();
  await server.close();
}
