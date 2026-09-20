import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const candidate = '9affac8';
const date = '2026-08-25';
const evidenceRoot = path.resolve('docs/evidence/WRN-G3-008/qa');
const servers = [];

const clients = {
  app: { root: 'apps/mobile', port: 43593 },
  website: { root: 'apps/website', port: 43594 },
};

const cases = [
  {
    client: 'app',
    viewport: { width: 390, height: 844 },
    route: '/?state=ready&theme=light#archive',
    label: '390x844_light_archive',
    heading: 'Nachrichtenarchiv',
  },
  {
    client: 'app',
    viewport: { width: 390, height: 844 },
    route: '/?state=ready&theme=dark#archive/wrn-test-art-g3-008-historical',
    label: '390x844_dark_historical-reader-share',
    heading: 'Local historical archive fixture',
    share: true,
  },
  {
    client: 'app',
    viewport: { width: 390, height: 844 },
    route: '/?state=ready&theme=dark#archive/wrn-test-art-g3-008-old-historical',
    label: '390x844_dark_alias-normalized',
    heading: 'Local historical archive fixture',
    canonicalUrl: 'wrn-test-art-g3-008-historical',
  },
  {
    client: 'app',
    viewport: { width: 390, height: 844 },
    route: '/?state=ready&theme=light#archive/wrn-test-art-g3-008-gone',
    label: '390x844_light_gone_200pct-reflow',
    heading: 'Nachricht nicht mehr verfuegbar',
    reflow: true,
  },
  {
    client: 'app',
    viewport: { width: 390, height: 844 },
    route: '/?state=ready&theme=dark#archive/wrn-test-art-g3-008-revoked',
    label: '390x844_dark_revoked_200pct-reflow',
    heading: 'Nachricht nicht verfuegbar',
    reflow: true,
  },
  {
    client: 'app',
    viewport: { width: 390, height: 844 },
    route: '/?state=ready&theme=light#archive/wrn-test-art-g3-008-unknown',
    label: '390x844_light_unknown-no-payload',
    heading: 'Artikel nicht gefunden',
  },
  {
    client: 'app',
    viewport: { width: 844, height: 390 },
    route: '/?state=ready&theme=dark#archive/wrn-test-art-g3-008-historical',
    label: '844x390_dark_historical-reader',
    heading: 'Local historical archive fixture',
  },
  {
    client: 'website',
    viewport: { width: 390, height: 844 },
    route: '/?state=ready&theme=light&archive=#more',
    label: '390x844_light_archive',
    heading: 'Nachrichtenarchiv',
  },
  {
    client: 'website',
    viewport: { width: 390, height: 844 },
    route: '/?state=ready&theme=dark&archive=wrn-test-art-g3-008-old-historical#more',
    label: '390x844_dark_alias-normalized',
    heading: 'Local historical archive fixture',
    canonicalUrl: 'wrn-test-art-g3-008-historical',
    share: true,
  },
  {
    client: 'website',
    viewport: { width: 800, height: 1280 },
    route: '/?state=ready&theme=light&archive=wrn-test-art-g3-008-gone#more',
    label: '800x1280_light_gone',
    heading: 'Nachricht nicht mehr verfuegbar',
  },
  {
    client: 'website',
    viewport: { width: 800, height: 1280 },
    route: '/?state=ready&theme=dark&archive=wrn-test-art-g3-008-revoked#more',
    label: '800x1280_dark_revoked',
    heading: 'Nachricht nicht verfuegbar',
  },
  {
    client: 'website',
    viewport: { width: 1024, height: 800 },
    route: '/?state=ready&theme=light&archive=#more',
    label: '1024x800_light_archive-keyboard-focus',
    heading: 'Nachrichtenarchiv',
    focus: true,
  },
  {
    client: 'website',
    viewport: { width: 1440, height: 900 },
    route: '/?state=ready&theme=light&archive=#more',
    label: '1440x900_light_archive',
    heading: 'Nachrichtenarchiv',
  },
  {
    client: 'website',
    viewport: { width: 1920, height: 1080 },
    route: '/?state=ready&theme=dark&archive=wrn-test-art-g3-008-historical#more',
    label: '1920x1080_dark_historical-reader',
    heading: 'Local historical archive fixture',
  },
  {
    client: 'website',
    viewport: { width: 800, height: 1280 },
    route: '/?state=ready&theme=light&archive=wrn-test-art-g3-008-unknown#more',
    label: '800x1280_light_unknown-no-payload',
    heading: 'Artikel nicht gefunden',
  },
  {
    client: 'website',
    viewport: { width: 390, height: 844 },
    route: '/?state=ready&theme=dark&archive=%3Cunsafe%3E#more',
    label: '390x844_dark_invalid-no-payload',
    heading: 'Artikeladresse ungueltig',
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

async function label(page, caseEntry) {
  await page.evaluate(
    ({ candidateRevision, evidenceDate, caseLabel }) => {
      const marker = document.createElement('aside');
      marker.setAttribute('aria-hidden', 'true');
      marker.textContent = `WRN-G3-008 unabh. QA | ${candidateRevision} | ${evidenceDate} | ${caseLabel}`;
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
    { candidateRevision: candidate, evidenceDate: date, caseLabel: caseEntry.label },
  );
}

async function assertNoPayloadLeak(page) {
  await assert.doesNotReject(async () => {
    assert.equal(await page.getByText('Local historical archive fixture').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Teilen' }).count(), 0);
  });
}

async function inspectPage(page, entry, externalRequests, consoleErrors) {
  const axe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(axe.violations, [], `Axe violations for ${entry.label}`);
  const measurements = await page.locator('button:visible, a:visible').evaluateAll((elements) =>
    elements.map((element) => {
      const rectangle = element.getBoundingClientRect();
      const computed = getComputedStyle(element);
      return {
        name: element.textContent?.trim().replaceAll(/\s+/g, ' '),
        width: rectangle.width,
        height: rectangle.height,
        outline: computed.outline,
        boxShadow: computed.boxShadow,
      };
    }),
  );
  const undersized = measurements.filter((entry) => entry.width < 44 || entry.height < 44);
  assert.deepEqual(undersized, [], `Undersized interactive controls for ${entry.label}`);
  const runtime = await page.evaluate(async () => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    localStorage: window.localStorage.length,
    sessionStorage: window.sessionStorage.length,
    serviceWorkers:
      'serviceWorker' in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0,
    webShareAvailable: typeof navigator.share === 'function',
  }));
  assert.ok(runtime.overflow <= 1, `Horizontal overflow (${runtime.overflow}) for ${entry.label}`);
  assert.equal(runtime.localStorage, 0, `Unexpected localStorage for ${entry.label}`);
  assert.equal(runtime.sessionStorage, 0, `Unexpected sessionStorage for ${entry.label}`);
  assert.equal(runtime.serviceWorkers, 0, `Unexpected service worker for ${entry.label}`);
  assert.deepEqual(externalRequests, [], `External requests for ${entry.label}`);
  assert.deepEqual(consoleErrors, [], `Console errors for ${entry.label}`);
  return { axeViolations: axe.violations.map((violation) => violation.id), measurements, runtime };
}

async function keyboardFocusArchiveControl(page) {
  const target = page.locator('button[data-archive-trigger]').first();
  for (let index = 0; index < 20; index += 1) {
    if (await target.evaluate((element) => document.activeElement === element)) break;
    await page.keyboard.press('Tab');
  }
  assert.equal(await target.evaluate((element) => document.activeElement === element), true);
  const focusStyle = await target.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outline: style.outline, boxShadow: style.boxShadow };
  });
  assert.ok(focusStyle.outline !== 'none' || focusStyle.boxShadow !== 'none');
  return focusStyle;
}

async function exerciseHistoryAndEscape(browser, client) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(4_000);
  const externalRequests = [];
  const consoleErrors = [];
  const origin = originFor(client);
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) externalRequests.push(request.url());
  });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  const route =
    client === 'app' ? '/?state=ready&theme=light#more' : '/?state=ready&theme=light#more';
  await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Nachrichtenarchiv' }).click();
  await page.getByRole('heading', { name: 'Nachrichtenarchiv' }).waitFor();
  const trigger = page
    .locator('button[data-archive-trigger]')
    .filter({ hasText: 'Artikel lesen' })
    .nth(1);
  await trigger.click();
  await page.getByRole('heading', { name: 'Local historical archive fixture' }).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('heading', { name: 'Nachrichtenarchiv' }).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('heading', { name: 'Mehr', exact: true }).waitFor();
  await page.goForward();
  await page.getByRole('heading', { name: 'Nachrichtenarchiv' }).waitFor();
  await page.goBack();
  await page.getByRole('heading', { name: 'Mehr', exact: true }).waitFor();
  const runtime = await inspectPage(
    page,
    { label: `${client}-history-escape` },
    externalRequests,
    consoleErrors,
  );
  await context.close();
  return runtime;
}

try {
  await mkdir(evidenceRoot, { recursive: true });
  await Promise.all(Object.values(clients).map(startServer));
  const browser = await chromium.launch({ channel: 'chrome' });
  const inventory = [];
  for (const entry of cases) {
    const context = await browser.newContext({
      viewport: entry.viewport,
      colorScheme: entry.route.includes('theme=dark') ? 'dark' : 'light',
    });
    const page = await context.newPage();
    const origin = originFor(entry.client);
    const externalRequests = [];
    const consoleErrors = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== origin) externalRequests.push(request.url());
    });
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.goto(`${origin}${entry.route}`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: entry.heading }).waitFor();
    if (entry.canonicalUrl) assert.match(page.url(), new RegExp(entry.canonicalUrl));
    if (entry.reflow) {
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
    }
    if (entry.share) {
      await page.getByRole('button', { name: 'Teilen' }).click();
      await page
        .getByRole('status')
        .filter({ hasText: 'Kanonisches lokales Share-Ziel vorbereitet' })
        .waitFor();
    }
    if (/gone|revoked|unknown|invalid/.test(entry.label)) await assertNoPayloadLeak(page);
    const focusStyle = entry.focus ? await keyboardFocusArchiveControl(page) : null;
    const runtime = await inspectPage(page, entry, externalRequests, consoleErrors);
    await label(page, entry);
    const filename = `${candidate}_${entry.client}_${entry.label}_${date}.png`;
    await page.screenshot({ path: path.join(evidenceRoot, filename), fullPage: true });
    inventory.push({ ...entry, filename, focusStyle, runtime });
    await context.close();
  }
  const history = {
    app: await exerciseHistoryAndEscape(browser, 'app'),
    website: await exerciseHistoryAndEscape(browser, 'website'),
  };
  await browser.close();
  await writeFile(
    path.join(evidenceRoot, `${candidate}_runtime-qa_${date}.json`),
    `${JSON.stringify({ candidate, date, inventory, history }, null, 2)}\n`,
  );
} finally {
  await Promise.allSettled(servers.map((server) => server.close()));
}
