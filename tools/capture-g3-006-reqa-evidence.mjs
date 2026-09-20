import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const candidate = '6a4c64b';
const date = '2026-08-24';
const evidenceRoot = path.resolve('docs/evidence/WRN-G3-006-REQA');
const servers = [];

const cases = [
  {
    client: 'app',
    port: 43283,
    viewport: { width: 320, height: 568 },
    url: '/?state=ready&theme=light#home',
    label: '320x568_light_start',
  },
  {
    client: 'app',
    port: 43283,
    viewport: { width: 390, height: 844 },
    url: '/?state=ready&theme=dark#discover',
    label: '390x844_dark_discover-reader',
    openReader: true,
  },
  {
    client: 'app',
    port: 43283,
    viewport: { width: 600, height: 960 },
    url: '/?state=ready&theme=light#article/wrn-test-art-cedar',
    label: '600x960_light_long-reader',
  },
  {
    client: 'app',
    port: 43283,
    viewport: { width: 844, height: 390 },
    url: '/?state=ready&theme=dark#article/wrn-test-art-cedar',
    label: '844x390_dark_source-dialog',
    dialog: true,
  },
  {
    client: 'app',
    port: 43283,
    viewport: { width: 390, height: 844 },
    url: '/?state=ready&theme=light#article/unknown-local-id',
    label: '390x844_light_not-found',
  },
  {
    client: 'app',
    port: 43283,
    viewport: { width: 390, height: 844 },
    url: '/?state=offline&theme=dark#article/wrn-test-art-cedar',
    label: '390x844_dark_offline-reader',
  },
  {
    client: 'app',
    port: 43283,
    viewport: { width: 390, height: 844 },
    url: '/?state=ready&theme=light#article/wrn-test-art-cedar',
    label: '390x844_light_long-reader_200pct-reflow',
    reflow: true,
  },
  {
    client: 'website',
    port: 43284,
    viewport: { width: 390, height: 844 },
    url: '/?state=ready&theme=light&article=wrn-test-art-cedar#discover',
    label: '390x844_light_discover-reader',
  },
  {
    client: 'website',
    port: 43284,
    viewport: { width: 800, height: 1280 },
    url: '/?state=ready&theme=dark&article=wrn-test-art-cedar#home',
    label: '800x1280_dark_long-reader',
  },
  {
    client: 'website',
    port: 43284,
    viewport: { width: 1024, height: 800 },
    url: '/?state=ready&theme=light&article=wrn-test-art-cedar#home',
    label: '1024x800_light_source-dialog',
    dialog: true,
  },
  {
    client: 'website',
    port: 43284,
    viewport: { width: 1440, height: 900 },
    url: '/?state=ready&theme=dark&article=wrn-test-art-cedar#home',
    label: '1440x900_dark_reader',
  },
  {
    client: 'website',
    port: 43284,
    viewport: { width: 1920, height: 1080 },
    url: '/?state=offline&theme=light&article=wrn-test-art-cedar#home',
    label: '1920x1080_light_offline-reader',
  },
  {
    client: 'website',
    port: 43284,
    viewport: { width: 390, height: 844 },
    url: '/?state=ready&theme=dark&article=unknown-local-id#home',
    label: '390x844_dark_not-found',
  },
  {
    client: 'website',
    port: 43284,
    viewport: { width: 800, height: 1280 },
    url: '/?state=offline&theme=light&article=wrn-test-art-cedar#home',
    label: '800x1280_light_offline-reader',
  },
  {
    client: 'website',
    port: 43284,
    viewport: { width: 390, height: 844 },
    url: '/?state=ready&theme=dark&article=wrn-test-art-cedar#home',
    label: '390x844_dark_long-reader_200pct-reflow',
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

async function label(page, entry) {
  await page.evaluate(
    ({ candidateRevision, evidenceDate, caseLabel }) => {
      const marker = document.createElement('aside');
      marker.setAttribute('aria-hidden', 'true');
      marker.textContent = `WRN-G3-006 Re-QA | ${candidateRevision} | ${evidenceDate} | ${caseLabel}`;
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
    { candidateRevision: candidate, evidenceDate: date, caseLabel: entry.label },
  );
}

function readerSelector(client) {
  return client === 'app' ? '#mobile-reader-title' : '#website-reader-title';
}

async function readerRuntime(browser, client) {
  const port = client === 'app' ? 43283 : 43284;
  const root = client === 'app' ? 'apps/mobile' : 'apps/website';
  void root;
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const origin = `http://127.0.0.1:${port}`;
  const route =
    client === 'app'
      ? '/?state=ready&theme=light#article/wrn-test-art-cedar'
      : '/?state=ready&theme=light&article=wrn-test-art-cedar#home';
  const externalRequests = [];
  const consoleErrors = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) externalRequests.push(request.url());
  });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
  await page
    .getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' })
    .waitFor();
  await page.reload({ waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page }).analyze();
  const normal = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    localStorage: localStorage.length,
    sessionStorage: sessionStorage.length,
  }));
  const controls = await page.locator('button:visible, a:visible').evaluateAll((elements) =>
    elements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { text: element.textContent?.trim(), width: rect.width, height: rect.height };
      })
      .filter((entry) => entry.width < 44 || entry.height < 44),
  );
  await page.getByRole('button', { name: 'Originalquelle oeffnen' }).click();
  const external = page
    .getByRole('dialog')
    .getByRole('link', { name: 'Externe Quelle jetzt oeffnen' });
  const externalAttributes = {
    target: await external.getAttribute('target'),
    rel: await external.getAttribute('rel'),
    referrerPolicy: await external.getAttribute('referrerpolicy'),
  };
  await page.keyboard.press('Escape');
  const reflow = await page.evaluate((headingSelector) => {
    document.documentElement.style.fontSize = '200%';
    const heading = document.querySelector(headingSelector);
    const main = document.querySelector('main');
    const reader = document.querySelector('.mobile-reader, .website-reader');
    const nav = document.querySelector('.mobile-primary-nav');
    heading?.scrollIntoView({ block: 'start' });
    const rectangle = (element) => element?.getBoundingClientRect().toJSON() ?? null;
    return {
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      pageScrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      heading: rectangle(heading),
      main: main
        ? {
            ...rectangle(main),
            clientHeight: main.clientHeight,
            scrollHeight: main.scrollHeight,
            overflowY: getComputedStyle(main).overflowY,
          }
        : null,
      reader: reader
        ? {
            ...rectangle(reader),
            clientHeight: reader.clientHeight,
            scrollHeight: reader.scrollHeight,
          }
        : null,
      navigation: rectangle(nav),
    };
  }, readerSelector(client));
  const heading = page.locator(readerSelector(client));
  const source = page.getByRole('button', { name: 'Originalquelle oeffnen' });
  await heading.scrollIntoViewIfNeeded();
  const headingBox = await heading.boundingBox();
  await source.scrollIntoViewIfNeeded();
  const sourceBox = await source.boundingBox();
  await context.close();
  return {
    client,
    axeViolations: axe.violations.map((violation) => violation.id),
    normal: { ...normal, undersized: controls },
    externalAttributes,
    externalRequests,
    consoleErrors,
    reflow,
    reachability: { heading: headingBox, source: sourceBox },
  };
}

try {
  await mkdir(evidenceRoot, { recursive: true });
  await Promise.all([startServer('apps/mobile', 43283), startServer('apps/website', 43284)]);
  const browser = await chromium.launch({ channel: 'chrome' });
  const inventory = [];
  for (const entry of cases) {
    const context = await browser.newContext({
      viewport: entry.viewport,
      colorScheme: entry.url.includes('theme=dark') ? 'dark' : 'light',
    });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${entry.port}${entry.url}`, { waitUntil: 'networkidle' });
    if (entry.openReader) await page.getByRole('button', { name: 'Artikel lesen' }).first().click();
    if (entry.dialog) await page.getByRole('button', { name: 'Originalquelle oeffnen' }).click();
    if (entry.reflow) {
      await page.evaluate((headingSelector) => {
        document.documentElement.style.fontSize = '200%';
        document.querySelector(headingSelector)?.scrollIntoView({ block: 'start' });
      }, readerSelector(entry.client));
    }
    await label(page, entry);
    const filename = `${candidate}_${entry.client}_${entry.label}_${date}.png`;
    await page.screenshot({ path: path.join(evidenceRoot, filename), fullPage: true });
    inventory.push({ ...entry, filename });
    await context.close();
  }
  const runtime = [await readerRuntime(browser, 'app'), await readerRuntime(browser, 'website')];
  await browser.close();
  await writeFile(
    path.join(evidenceRoot, `${candidate}_screenshot-inventory_${date}.json`),
    `${JSON.stringify({ candidate, date, inventory }, null, 2)}\n`,
  );
  await writeFile(
    path.join(evidenceRoot, `${candidate}_reader-runtime-qa_${date}.json`),
    `${JSON.stringify({ candidate, runtime }, null, 2)}\n`,
  );
} finally {
  await Promise.allSettled(servers.map((server) => server.close()));
}
