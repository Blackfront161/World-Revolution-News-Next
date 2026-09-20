import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { getDirectoryCopy } from '../../packages/ui-language/src/directory-copy';
import { getMobileKnowledgeCopy, uiLanguageIds } from '../../packages/ui-language/src';

test('website directory serves news, sources and sport from same-origin local JSON assets', async ({
  page,
}, info) => {
  test.skip(!info.project.name.startsWith('website-'));
  const foreign: string[] = [];
  const origin = new URL(info.project.use.baseURL as string).origin;
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) foreign.push(request.url());
  });
  await page.goto('/?theme=dark#discover/news');
  await expect(page.getByRole('heading', { name: 'News directory' })).toBeVisible();
  await expect(page.getByText(/Showing 30 of/)).toBeVisible();
  await page.screenshot({
    path: info.outputPath('website-directory-news-dark.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Load 30 more', exact: true }).click();
  await expect(page.locator('.website-content-list li')).toHaveCount(60);
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('tr');
  await page.getByRole('combobox', { name: 'Source', exact: true }).selectOption('Evrensel');
  for (const link of await page.locator('.website-content-list a').all())
    await expect(link).toHaveAttribute('lang', 'tr');
  for (const item of await page.locator('.website-content-list li > p').all())
    await expect(item).toHaveText('Evrensel');
  await expect(page.locator('.website-content-list li').first()).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect(page.locator('.website-content-list li')).toHaveCount(30);
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Palestine');
  await page.getByRole('button', { name: 'Sources' }).click();
  await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill('');
  await page.screenshot({
    path: info.outputPath('website-directory-sources-dark.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Sport reading notes' }).click();
  await expect(page.getByRole('heading', { name: 'Sport reading notes' })).toBeVisible();
  await page.getByTestId('ui-language-selector').selectOption('ru');
  await expect(page.getByRole('heading', { name: getDirectoryCopy('ru').sport })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(foreign).toEqual([]);
  await page.screenshot({
    path: info.outputPath('website-directory-sport-ru-dark.png'),
    fullPage: true,
  });
  for (const language of uiLanguageIds) {
    await page.getByTestId('ui-language-selector').selectOption(language);
    await expect(
      page.getByRole('heading', { name: getDirectoryCopy(language).sport, exact: true }),
    ).toBeVisible();
  }
});

test('a missing or malformed directory asset shows retry without rendering unvalidated entries', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'website-390x844');
  for (const status of [404, 200]) {
    await page.route('**/assets/content-directory-v1-*.json', (route) =>
      route.fulfill({
        status,
        contentType: 'application/json; charset=utf-8',
        body: '{"articles":[{"title":"unvalidated injection"}]}',
      }),
    );
    await page.goto('/#discover/news');
    await page.reload();
    await expect(page.getByRole('alert')).toHaveText(getDirectoryCopy('en').loadError);
    await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
    await expect(page.getByText('unvalidated injection')).toHaveCount(0);
    await page.unroute('**/assets/content-directory-v1-*.json');
  }
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'News directory', exact: true })).toBeVisible();
});

test('visible shell save survives network-off reload with all three bound catalogues', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== 'website-390x844');
  const foreign: string[] = [];
  const pageErrors: string[] = [];
  const catalogResponses: { path: string; worker: boolean }[] = [];
  const origin = new URL(info.project.use.baseURL as string).origin;
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) foreign.push(request.url());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/?theme=violet#more');
  const panel = page.locator('.website-shell-panel');
  await expect(panel).toHaveAttribute('data-shell-status', 'uncontrolled');
  await expect(panel).toContainText('library, help, source and news-directory metadata');
  await page.getByRole('button', { name: 'Save website shell', exact: true }).click();
  await expect(panel).toHaveAttribute('data-shell-status', /^(saved|active)$/);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect(panel).toHaveAttribute('data-shell-status', 'active');
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  page.on('response', (response) => {
    const path = new URL(response.url()).pathname;
    if (
      /\/assets\/(legacy-knowledge-v1|legacy-support-v1|content-directory-v1)-[^/]+\.json$/.test(
        path,
      )
    )
      catalogResponses.push({ path, worker: response.fromServiceWorker() });
  });
  await context.setOffline(true);
  try {
    for (const [route, title] of [
      ['knowledge', getMobileKnowledgeCopy('en').title],
      ['help', 'Help directory'],
      ['discover/news', 'News directory'],
      ['discover/sources', 'Sources'],
      ['discover/sport', 'Sport reading notes'],
    ]) {
      await page.goto(`/?theme=violet#${route}`);
      // Force a fresh runtime, including the local JSON loader, for every route.
      await page.reload();
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await page.screenshot({
        path: info.outputPath(`offline-${route.replace('/', '-')}-violet.png`),
        fullPage: true,
      });
    }
    const paths = await page.evaluate(async () => {
      const names = (await caches.keys()).filter((name) =>
        name.startsWith('wrn.website-shell.v1.payload.'),
      );
      if (names.length !== 1) throw new Error('unexpected generations');
      return (await (await caches.open(names[0]!)).keys()).map(
        (request) => new URL(request.url).pathname,
      );
    });
    expect(paths).toHaveLength(8);
    expect(paths.filter((path) => path.endsWith('.json'))).toHaveLength(3);
    for (const family of ['legacy-knowledge-v1', 'legacy-support-v1', 'content-directory-v1'])
      expect(
        catalogResponses.some((response) => response.path.includes(family) && response.worker),
      ).toBe(true);
    expect(catalogResponses.every((response) => response.worker)).toBe(true);
    expect(pageErrors).toEqual([]);
    expect(foreign).toEqual([]);
    const proofPath = info.outputPath('offline-catalog-cache-proof.json');
    await writeFile(
      proofPath,
      JSON.stringify({ paths, catalogResponses, pageErrors, foreign }, null, 2),
    );
    await info.attach('offline-catalog-cache-proof', {
      path: proofPath,
      contentType: 'application/json',
    });
  } finally {
    await context.setOffline(false);
  }
});

test('directory remains readable at 320px and Russian 200 percent in both accent themes and light', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'website-reflow-200pct');
  test.setTimeout(60_000);
  for (const theme of ['dark', 'violet', 'light']) {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const section of ['news', 'sources', 'sport'] as const) {
        await page.goto(`/?theme=${theme}#discover/${section}`);
        await page.getByTestId('ui-language-selector').selectOption('ru');
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%';
        });
        const copy = getDirectoryCopy('ru');
        await expect(
          page.getByRole('heading', {
            name: section === 'news' ? copy.title : copy[section],
            exact: true,
          }),
        ).toBeVisible();
        const overflow = await page.evaluate(() => ({
          pixels: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          offenders: [...document.querySelectorAll('*')]
            .filter(
              (element) =>
                element.getBoundingClientRect().right > document.documentElement.clientWidth + 1 ||
                element.scrollWidth > element.clientWidth + 1,
            )
            .map((element) => ({
              tag: element.tagName,
              class: element.className,
              text: element.textContent?.slice(0, 60),
              width: element.getBoundingClientRect().width,
              scrollWidth: element.scrollWidth,
              clientWidth: element.clientWidth,
            })),
        }));
        expect(overflow.pixels, JSON.stringify(overflow.offenders)).toBeLessThanOrEqual(1);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await page.screenshot({
          path: info.outputPath(`directory-${section}-ru200-${width}-${theme}.png`),
          fullPage: true,
        });
      }
    }
  }
});
