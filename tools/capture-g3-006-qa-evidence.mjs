import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const candidate = '206a7e1';
const date = '2026-08-24';
const evidenceRoot = path.resolve('docs/evidence/WRN-G3-006');
const servers = [];

const cases = [
  {
    client: 'app',
    port: 43183,
    viewport: { width: 320, height: 568 },
    url: '/?state=ready&theme=light#home',
    label: '320x568_light_start',
  },
  {
    client: 'app',
    port: 43183,
    viewport: { width: 390, height: 844 },
    url: '/?state=ready&theme=dark#discover',
    label: '390x844_dark_discover-reader',
    openReader: true,
  },
  {
    client: 'app',
    port: 43183,
    viewport: { width: 600, height: 960 },
    url: '/?state=ready&theme=light#article/wrn-test-art-cedar',
    label: '600x960_light_long-reader',
  },
  {
    client: 'app',
    port: 43183,
    viewport: { width: 844, height: 390 },
    url: '/?state=ready&theme=dark#article/wrn-test-art-cedar',
    label: '844x390_dark_source-dialog',
    dialog: true,
  },
  {
    client: 'app',
    port: 43183,
    viewport: { width: 390, height: 844 },
    url: '/?state=ready&theme=light#article/unknown-local-id',
    label: '390x844_light_not-found',
  },
  {
    client: 'app',
    port: 43183,
    viewport: { width: 390, height: 844 },
    url: '/?state=offline&theme=dark#article/wrn-test-art-cedar',
    label: '390x844_dark_offline-reader',
  },
  {
    client: 'app',
    port: 43183,
    viewport: { width: 390, height: 844 },
    url: '/?state=ready&theme=light#article/wrn-test-art-cedar',
    label: '390x844_light_reader_200pct-reflow',
    reflow: true,
  },
  {
    client: 'website',
    port: 43184,
    viewport: { width: 390, height: 844 },
    url: '/?state=ready&theme=light&article=wrn-test-art-cedar#discover',
    label: '390x844_light_discover-reader',
  },
  {
    client: 'website',
    port: 43184,
    viewport: { width: 800, height: 1280 },
    url: '/?state=ready&theme=dark&article=wrn-test-art-cedar#home',
    label: '800x1280_dark_long-reader',
  },
  {
    client: 'website',
    port: 43184,
    viewport: { width: 1024, height: 800 },
    url: '/?state=ready&theme=light&article=wrn-test-art-cedar#home',
    label: '1024x800_light_source-dialog',
    dialog: true,
  },
  {
    client: 'website',
    port: 43184,
    viewport: { width: 1440, height: 900 },
    url: '/?state=ready&theme=dark&article=wrn-test-art-cedar#home',
    label: '1440x900_dark_reader',
  },
  {
    client: 'website',
    port: 43184,
    viewport: { width: 1920, height: 1080 },
    url: '/?state=offline&theme=light&article=wrn-test-art-cedar#home',
    label: '1920x1080_light_reader',
  },
  {
    client: 'website',
    port: 43184,
    viewport: { width: 390, height: 844 },
    url: '/?state=ready&theme=dark&article=unknown-local-id#home',
    label: '390x844_dark_not-found',
  },
  {
    client: 'website',
    port: 43184,
    viewport: { width: 800, height: 1280 },
    url: '/?state=ready&theme=light&article=wrn-test-art-cedar#home',
    label: '800x1280_light_offline-reader',
  },
  {
    client: 'website',
    port: 43184,
    viewport: { width: 390, height: 844 },
    url: '/?state=ready&theme=dark&article=wrn-test-art-cedar#home',
    label: '390x844_dark_reader_200pct-reflow',
    reflow: true,
  },
];

async function startServer(root, port) {
  const server = await createServer({
    clearScreen: false,
    configFile: false,
    logLevel: 'error',
    root: path.resolve(root),
    server: { host: '127.0.0.1', port, strictPort: true },
  });
  await server.listen();
  servers.push(server);
}

async function addLabel(page, entry) {
  await page.evaluate(
    ({ candidateRevision, evidenceDate, label }) => {
      const marker = document.createElement('aside');
      marker.setAttribute('data-wrn-qa-label', 'true');
      marker.setAttribute('aria-hidden', 'true');
      marker.textContent = `WRN-G3-006 | ${candidateRevision} | ${evidenceDate} | ${label}`;
      Object.assign(marker.style, {
        position: 'fixed',
        zIndex: '2147483647',
        right: '8px',
        bottom: '8px',
        maxWidth: 'calc(100vw - 16px)',
        padding: '5px 7px',
        border: '1px solid #ffffff',
        borderRadius: '4px',
        background: '#101722',
        color: '#ffffff',
        font: '600 10px/1.2 system-ui, sans-serif',
        letterSpacing: '0.01em',
        boxSizing: 'border-box',
      });
      document.body.append(marker);
    },
    { candidateRevision: candidate, evidenceDate: date, label: entry.label },
  );
}

try {
  await mkdir(evidenceRoot, { recursive: true });
  await Promise.all([startServer('apps/mobile', 43183), startServer('apps/website', 43184)]);
  const browser = await chromium.launch({ channel: 'chrome' });
  const inventory = [];

  for (const entry of cases) {
    const context = await browser.newContext({ viewport: entry.viewport, colorScheme: 'light' });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${entry.port}${entry.url}`, { waitUntil: 'networkidle' });
    if (entry.openReader) await page.getByRole('button', { name: 'Artikel lesen' }).first().click();
    if (entry.dialog) await page.getByRole('button', { name: 'Originalquelle oeffnen' }).click();
    if (entry.reflow) {
      await page.evaluate((client) => {
        document.documentElement.style.fontSize = '200%';
        document
          .getElementById(client === 'app' ? 'mobile-reader-title' : 'website-reader-title')
          ?.scrollIntoView({ block: 'start', inline: 'nearest' });
      }, entry.client);
    }
    await addLabel(page, entry);
    const filename = `${candidate}_${entry.client}_${entry.label}_${date}.png`;
    await page.screenshot({ path: path.join(evidenceRoot, filename), fullPage: true });
    inventory.push({ ...entry, filename });
    await context.close();
  }

  await browser.close();
  await writeFile(
    path.join(evidenceRoot, `${candidate}_screenshot-inventory_${date}.json`),
    `${JSON.stringify({ candidate, date, inventory }, null, 2)}\n`,
  );
} finally {
  await Promise.allSettled(servers.map((server) => server.close()));
}
