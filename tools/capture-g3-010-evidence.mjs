import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const candidate = '3cc85e1';
const date = '2026-08-26';
const evidenceRoot = path.resolve('docs/evidence/WRN-G3-010/implementation');
const servers = [];
const inventory = [];

const clients = {
  app: { root: 'apps/mobile', port: 43613 },
  website: { root: 'apps/website', port: 43614 },
};

const cases = [
  ...['dark', 'light', 'oled', 'soft', 'pink', 'contrast', 'system'].map((theme) => ({
    client: 'app',
    viewport: { width: 390, height: 844 },
    theme,
    label: `390x844_${theme}_ready`,
  })),
  { client: 'app', viewport: { width: 320, height: 568 }, theme: 'dark', label: '320x568_dark' },
  { client: 'app', viewport: { width: 320, height: 568 }, theme: 'pink', label: '320x568_pink' },
  { client: 'app', viewport: { width: 360, height: 800 }, theme: 'soft', label: '360x800_soft' },
  {
    client: 'app',
    viewport: { width: 412, height: 915 },
    theme: 'contrast',
    label: '412x915_contrast',
  },
  { client: 'app', viewport: { width: 844, height: 390 }, theme: 'pink', label: '844x390_pink' },
  {
    client: 'app',
    viewport: { width: 390, height: 844 },
    theme: 'pink',
    label: '390x844_pink_200pct-reflow',
    reflow: true,
  },
  {
    client: 'website',
    viewport: { width: 390, height: 844 },
    theme: 'dark',
    label: '390x844_dark',
  },
  {
    client: 'website',
    viewport: { width: 390, height: 844 },
    theme: 'pink',
    label: '390x844_pink',
  },
  {
    client: 'website',
    viewport: { width: 390, height: 844 },
    theme: 'contrast',
    label: '390x844_contrast',
  },
  {
    client: 'website',
    viewport: { width: 800, height: 1280 },
    theme: 'soft',
    label: '800x1280_soft',
  },
  {
    client: 'website',
    viewport: { width: 1024, height: 800 },
    theme: 'oled',
    label: '1024x800_oled',
  },
  {
    client: 'website',
    viewport: { width: 1440, height: 900 },
    theme: 'dark',
    label: '1440x900_dark',
  },
  {
    client: 'website',
    viewport: { width: 1440, height: 900 },
    theme: 'light',
    label: '1440x900_light',
  },
  {
    client: 'website',
    viewport: { width: 1440, height: 900 },
    theme: 'pink',
    label: '1440x900_pink',
  },
  {
    client: 'website',
    viewport: { width: 1920, height: 1080 },
    theme: 'system',
    label: '1920x1080_system-dark',
    systemDark: true,
  },
  {
    client: 'website',
    viewport: { width: 390, height: 844 },
    theme: 'dark',
    label: '390x844_dark_200pct-reflow',
    reflow: true,
  },
  {
    client: 'app',
    viewport: { width: 390, height: 844 },
    theme: 'pink',
    label: '390x844_pink_brand-fallback',
    fallback: true,
  },
  {
    client: 'website',
    viewport: { width: 390, height: 844 },
    theme: 'pink',
    label: '390x844_pink_brand-fallback',
    fallback: true,
  },
];

async function startServer(client) {
  const server = await createServer({
    clearScreen: false,
    configFile: false,
    logLevel: 'error',
    root: path.resolve(client.root),
    server: { host: '127.0.0.1', port: client.port, strictPort: true },
  });
  await server.listen();
  servers.push(server);
}

function originFor(client) {
  return `http://127.0.0.1:${clients[client].port}`;
}

async function label(page, entry, effectiveTheme) {
  await page.evaluate(
    ({ candidateRevision, evidenceDate, entryLabel, preference, effective }) => {
      const marker = document.createElement('aside');
      marker.setAttribute('aria-hidden', 'true');
      marker.textContent = `WRN-G3-010 Implementierung | ${candidateRevision} | ${evidenceDate} | ${entryLabel} | Praeferenz: ${preference} | Palette: ${effective}`;
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
        boxSizing: 'border-box',
      });
      document.body.append(marker);
    },
    {
      candidateRevision: candidate,
      evidenceDate: date,
      entryLabel: entry.label,
      preference: entry.theme,
      effective: effectiveTheme,
    },
  );
}

async function inspect(page, entry, externalRequests, consoleErrors) {
  const axe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(axe.violations, [], `Axe violations for ${entry.label}`);
  const controls = await page
    .locator('button:visible, a:visible, select:visible')
    .evaluateAll((items) =>
      items.map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          name: element.getAttribute('aria-label') ?? element.textContent?.trim(),
          width: bounds.width,
          height: bounds.height,
        };
      }),
    );
  assert.deepEqual(
    controls.filter((control) => control.width < 44 || control.height < 44),
    [],
    `Undersized controls for ${entry.label}`,
  );
  const runtime = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    localStorage: window.localStorage.length,
    sessionStorage: window.sessionStorage.length,
    preference: document.documentElement.dataset.themePreference,
    effective: document.documentElement.dataset.theme,
    pinkPrimary: getComputedStyle(document.documentElement)
      .getPropertyValue('--wrn-brand-wordmark-primary')
      .trim(),
    pinkSecondary: getComputedStyle(document.documentElement)
      .getPropertyValue('--wrn-brand-wordmark-secondary')
      .trim(),
  }));
  assert.ok(runtime.overflow <= 1, `Horizontal overflow (${runtime.overflow}) for ${entry.label}`);
  assert.equal(runtime.localStorage, 0, `Unexpected local storage for ${entry.label}`);
  assert.equal(runtime.sessionStorage, 0, `Unexpected session storage for ${entry.label}`);
  assert.equal(runtime.preference, entry.theme, `Wrong preference for ${entry.label}`);
  if (entry.theme === 'pink') {
    assert.equal(runtime.pinkPrimary, '#ff4fa3');
    assert.equal(runtime.pinkSecondary, '#9b82ff');
  }
  assert.deepEqual(externalRequests, [], `External requests for ${entry.label}`);
  // The two fallback captures intentionally abort their local brand-image
  // request. Chromium may report that expected fault without the asset URL.
  const unexpectedConsoleErrors = entry.fallback ? [] : consoleErrors;
  assert.deepEqual(unexpectedConsoleErrors, [], `Console errors for ${entry.label}`);
  if (entry.fallback) {
    const fallbackText = await page.locator('.brand-asset-fallback:visible').textContent();
    assert.equal(fallbackText, 'S', `Missing readable brand fallback for ${entry.label}`);
  }
  return {
    controls,
    runtime,
    axeViolations: axe.violations.map((violation) => violation.id),
    expectedFallbackConsoleErrors: entry.fallback ? consoleErrors : [],
  };
}

try {
  await mkdir(evidenceRoot, { recursive: true });
  await Promise.all(Object.values(clients).map(startServer));
  const browser = await chromium.launch({ channel: 'chrome' });
  for (const entry of cases) {
    const context = await browser.newContext({
      viewport: entry.viewport,
      colorScheme: entry.systemDark ? 'dark' : 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(5_000);
    const externalRequests = [];
    const consoleErrors = [];
    const origin = originFor(entry.client);
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== origin) externalRequests.push(request.url());
    });
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    if (entry.fallback) {
      await page.route('**/*solinaridao-header-mark-filled*', (route) => route.abort());
    }
    await page.goto(`${origin}/?state=ready&theme=${entry.theme}#home`, {
      waitUntil: 'networkidle',
    });
    await page.getByLabel('Farbdarstellung').waitFor();
    if (entry.reflow) {
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
    }
    const selector = page.getByLabel('Farbdarstellung');
    await selector.focus();
    assert.equal(await selector.evaluate((element) => document.activeElement === element), true);
    const inspected = await inspect(page, entry, externalRequests, consoleErrors);
    await label(page, entry, inspected.runtime.effective);
    const filename = `${candidate}_${entry.client}_${entry.label}_${date}.png`;
    await page.screenshot({ path: path.join(evidenceRoot, filename), fullPage: true });
    inventory.push({ ...entry, filename, ...inspected });
    await context.close();
  }
  await browser.close();
  await writeFile(
    path.join(evidenceRoot, `${candidate}_runtime-visual-matrix_${date}.json`),
    `${JSON.stringify({ candidate, date, inventory }, null, 2)}\n`,
  );
} catch (error) {
  await writeFile(
    path.join(evidenceRoot, `${candidate}_runtime-visual-matrix_${date}.error.txt`),
    `${error instanceof Error ? error.stack : String(error)}\n`,
  );
  throw error;
} finally {
  await Promise.allSettled(servers.map((server) => server.close()));
}
