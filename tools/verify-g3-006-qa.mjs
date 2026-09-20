import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const candidate = '206a7e1';
const evidenceRoot = path.resolve('docs/evidence/WRN-G3-006');
const servers = [];
const clients = [
  {
    name: 'app',
    root: 'apps/mobile',
    port: 43185,
    route: '/?state=ready&theme=light#article/wrn-test-art-cedar',
  },
  {
    name: 'website',
    root: 'apps/website',
    port: 43186,
    route: '/?state=ready&theme=light&article=wrn-test-art-cedar#home',
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

try {
  await mkdir(evidenceRoot, { recursive: true });
  await Promise.all(clients.map((client) => startServer(client.root, client.port)));
  const browser = await chromium.launch({ channel: 'chrome' });
  const results = [];

  for (const client of clients) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const baseOrigin = `http://127.0.0.1:${client.port}`;
    const externalRequests = [];
    const consoleErrors = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== baseOrigin) externalRequests.push(request.url());
    });
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.goto(`${baseOrigin}${client.route}`, { waitUntil: 'networkidle' });
    await page
      .getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' })
      .waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    const axe = await new AxeBuilder({ page }).analyze();
    const geometry = await page.evaluate(() => {
      const root = document.documentElement;
      const controls = [...document.querySelectorAll('button, a')].filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.visibility !== 'hidden' &&
          style.display !== 'none' &&
          rect.width > 0 &&
          rect.height > 0
        );
      });
      const undersized = controls
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return { text: element.textContent?.trim(), width: rect.width, height: rect.height };
        })
        .filter((control) => control.width < 44 || control.height < 44);
      return {
        overflow: root.scrollWidth - root.clientWidth,
        undersized,
        localStorage: localStorage.length,
        sessionStorage: sessionStorage.length,
      };
    });
    await page.getByRole('button', { name: 'Originalquelle oeffnen' }).click();
    const dialog = page.getByRole('dialog');
    const external = dialog.getByRole('link', { name: 'Externe Quelle jetzt oeffnen' });
    const externalAttributes = {
      target: await external.getAttribute('target'),
      rel: await external.getAttribute('rel'),
      referrerPolicy: await external.getAttribute('referrerpolicy'),
    };
    await page.keyboard.press('Escape');
    const result = {
      client: client.name,
      axeViolations: axe.violations.map((violation) => violation.id),
      geometry,
      externalAttributes,
      externalRequests,
      consoleErrors,
    };
    if (
      result.axeViolations.length ||
      result.geometry.overflow > 1 ||
      result.geometry.undersized.length ||
      result.geometry.localStorage ||
      result.geometry.sessionStorage ||
      result.externalAttributes.target !== '_blank' ||
      result.externalAttributes.rel !== 'noopener noreferrer' ||
      result.externalAttributes.referrerPolicy !== 'no-referrer' ||
      result.externalRequests.length ||
      result.consoleErrors.length
    ) {
      throw new Error(JSON.stringify(result));
    }

    const reflowContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const reflowPage = await reflowContext.newPage();
    await reflowPage.goto(`${baseOrigin}${client.route}`, { waitUntil: 'networkidle' });
    const reflow = await reflowPage.evaluate((clientName) => {
      document.documentElement.style.fontSize = '200%';
      const heading = document.getElementById(
        clientName === 'app' ? 'mobile-reader-title' : 'website-reader-title',
      );
      heading?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const main = document.querySelector('main');
      const nav = document.querySelector(
        clientName === 'app' ? '.mobile-primary-nav' : '.site-header',
      );
      const headingBounds = heading?.getBoundingClientRect();
      const mainBounds = main?.getBoundingClientRect();
      const navBounds = nav?.getBoundingClientRect();
      return {
        documentOverflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        heading: headingBounds?.toJSON(),
        main: mainBounds
          ? {
              ...mainBounds.toJSON(),
              clientHeight: main?.clientHeight,
              scrollHeight: main?.scrollHeight,
            }
          : null,
        navigation: navBounds?.toJSON(),
      };
    }, client.name);
    result.reflow200 = reflow;
    await reflowContext.close();
    results.push(result);
    await context.close();
  }

  await browser.close();
  await writeFile(
    path.join(evidenceRoot, `${candidate}_reader-runtime-qa_2026-08-24.json`),
    `${JSON.stringify({ candidate, results }, null, 2)}\n`,
  );
} finally {
  await Promise.allSettled(servers.map((server) => server.close()));
}
