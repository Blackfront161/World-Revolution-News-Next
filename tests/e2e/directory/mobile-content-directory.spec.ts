import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  getDirectoryCopy,
  getDirectoryMetadataCopy,
} from '../../../apps/mobile/src/features/directory/directory-copy';
const languages = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const;
const themes = ['dark', 'oled', 'soft', 'pink', 'light', 'system', 'contrast'] as const;

test('real news filters paginate, retain both snapshots and make no external request or content write', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844');
  const external: string[] = [],
    errors: string[] = [];
  const origin = new URL(testInfo.project.use.baseURL as string).origin;
  page.on('request', (r) => {
    if (new URL(r.url()).origin !== origin) external.push(r.url());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?state=ready#discover/news');
  await expect(page.getByRole('heading', { name: 'News directory', exact: true })).toBeFocused();
  await expect(page.getByText('Showing 30 of 493', { exact: true })).toBeVisible();
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  await page.getByRole('button', { name: 'Load 30 more', exact: true }).click();
  await expect(page.locator('.content-directory__list > li')).toHaveCount(60);
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('it');
  await expect(page.locator('.content-directory__list > li').first()).toContainText('it');
  const source = await page
    .getByRole('combobox', { name: 'Source', exact: true })
    .locator('option')
    .nth(1)
    .getAttribute('value');
  // Native option text is its value when no explicit value attribute exists.
  const sourceValue =
    source ??
    (await page
      .getByRole('combobox', { name: 'Source', exact: true })
      .locator('option')
      .nth(1)
      .textContent());
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await page.getByRole('combobox', { name: 'Source', exact: true }).selectOption(sourceValue!);
  const cards = page.locator('.content-directory__list > li');
  await expect(cards.first()).toContainText(sourceValue!);
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await page.getByRole('radio', { name: 'Legacy app feed', exact: true }).check();
  await expect(page.getByText('Showing 30 of 481', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'All', exact: true }).check();
  await expect(page.getByText('Showing 30 of 973', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill('zzzz-no-match');
  await expect(page.getByText('No matching entries', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect(page.getByText('Showing 30 of 493', { exact: true })).toBeVisible();
  await page.locator('.content-directory__list summary').first().click();
  await expect(page.locator('.content-directory details[open]')).toContainText(
    '48c394798184721cace3448983f87c71baa681da',
  );
  await page.context().setOffline(true);
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill('zzzz-no-match');
  await expect(page.getByText('No matching entries', { exact: true })).toBeVisible();
  await page.context().setOffline(false);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(storage);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('sources retain historical observations and HTTP addresses; sport is attributed and reachable through history', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844');
  await page.goto('/?state=ready#more');
  await page.getByRole('link', { name: 'Sources', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sources', exact: true })).toBeFocused();
  await expect(page.getByText('Showing 30 of 532', { exact: true })).toBeVisible();
  await expect(page.locator('.content-directory a[href^="http:"]')).toHaveCount(0);
  await expect(page.getByText('Historical HTTP endpoint; not opened here.').first()).toBeVisible();
  await page.locator('.content-directory__list summary').first().click();
  await expect(page.locator('.content-directory details[open]')).toContainText(
    '2216ff3c1305f6d474712892a36dc9b0ea7cb0a0',
  );
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('el');
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill('zzzz-no-match');
  await expect(page.getByText('No matching entries', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await page.getByRole('button', { name: 'Load 30 more', exact: true }).click();
  await expect(page.locator('.content-directory__list > li')).toHaveCount(60);
  await page.getByRole('button', { name: 'Sport reading notes', exact: true }).click();
  await expect(page).toHaveURL(/#discover\/sport$/);
  await expect(
    page.getByRole('heading', { name: 'Sport reading notes', exact: true }),
  ).toBeFocused();
  await expect(page.locator('.content-directory__list > li')).toHaveCount(3);
  await expect(
    page.getByRole('link', {
      name: 'Senegal’s World Cup Exit: The Price of National Honor and Women’s Safety',
      exact: true,
    }),
  ).toBeVisible();
  for (const link of await page.locator('.content-directory a').all()) {
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
  }
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Sources', exact: true })).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole('heading', { name: 'Sport reading notes', exact: true }),
  ).toBeVisible();
  await page.locator('a[href="#discover"]').first().click();
  await expect(page).toHaveURL(/#discover$/);
  await page.getByRole('link', { name: 'News directory', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'News directory', exact: true })).toBeVisible();
});

test('directory hash navigation respects a dirty solidarity draft', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844');
  await page.goto('/?state=ready#solidarity');
  const body = page.getByRole('textbox', { name: 'Letter text', exact: true });
  await body.fill('Keep private');
  await page.evaluate(() => {
    location.hash = '#discover/sport';
  });
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveURL(/#solidarity$/);
  await page.getByRole('button', { name: 'Continue editing', exact: true }).click();
  await expect(body).toHaveValue('Keep private');
  await page.evaluate(() => {
    location.hash = '#discover/sport';
  });
  await page.getByRole('button', { name: 'Discard and continue', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Sport reading notes', exact: true }),
  ).toBeVisible();
});

test('data retry and real module reload recover; a late data response does not steal header focus', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844');
  let dataBlocked = true;
  await page.route('**/features/directory/data/content-directory-v1.json*', async (route) => {
    if (dataBlocked) await route.fulfill({ status: 503, body: 'unavailable' });
    else await route.continue();
  });
  await page.goto('/?state=ready#discover/news');
  await expect(
    page.getByText('Local directory data could not be prepared.', { exact: true }),
  ).toBeVisible();
  dataBlocked = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText('Showing 30 of 493', { exact: true })).toBeVisible();
  let chunkBlocked = true;
  await page.route('**/features/directory/MobileContentDirectoryRoute.tsx*', async (route) => {
    if (chunkBlocked) {
      chunkBlocked = false;
      await route.abort('failed');
    } else await route.continue();
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reload view', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reload view', exact: true }).click();
  await expect(page.getByText('Showing 30 of 493', { exact: true })).toBeVisible();
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.unroute('**/features/directory/data/content-directory-v1.json*');
  await page.route('**/features/directory/data/content-directory-v1.json*', async (route) => {
    await gate;
    await route.continue();
  });
  await page.reload();
  await expect(page.getByText('Loading local directory data…', { exact: true })).toBeVisible();
  await page.getByTestId('ui-language-selector').focus();
  release!();
  await expect(page.getByText('Showing 30 of 493', { exact: true })).toBeVisible();
  await expect(page.getByTestId('ui-language-selector')).toBeFocused();
});
const matrix = [
  ...languages.map((language) => ({ language, theme: 'dark', width: 390, height: 844 })),
  ...themes.map((theme) => ({ language: 'de' as const, theme, width: 320, height: 568 })),
  { language: 'de' as const, theme: 'light', width: 768, height: 960 },
  { language: 'de' as const, theme: 'dark', width: 1280, height: 800 },
];
for (const item of matrix)
  test(
    'directory visual ' + item.language + '-' + item.theme + '-' + item.width,
    async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile-390x844');
      const copy = getDirectoryCopy(item.language),
        metadata = getDirectoryMetadataCopy(item.language),
        errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      await page.setViewportSize({ width: item.width, height: item.height });
      const root = path.resolve('test-results/directory-completion-screenshots');
      await mkdir(root, { recursive: true });
      for (const section of ['news', 'sources', 'sport'] as const) {
        await page.goto('/?state=ready&theme=' + item.theme + '#discover/' + section);
        await page.getByTestId('ui-language-selector').selectOption(item.language);
        await expect(
          page.getByRole('heading', {
            name:
              section === 'news' ? copy.title : section === 'sources' ? copy.sources : copy.sport,
            exact: true,
          }),
        ).toBeVisible();
        await page.getByText(metadata.about, { exact: true }).click();
        await expect(page.getByText(metadata.offline, { exact: true })).toBeVisible();
        await page.getByText(metadata.about, { exact: true }).click();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          ),
        ).toBeLessThanOrEqual(1);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        const sizes = await page
          .locator(
            '.content-directory button, .content-directory summary, .content-directory__list > li > a, .content-directory__filters label',
          )
          .evaluateAll((items) => items.map((element) => element.getBoundingClientRect().height));
        expect(sizes.every((height) => height >= 44)).toBe(true);
        await page.screenshot({
          path: path.join(
            root,
            section + '-' + item.language + '-' + item.theme + '-' + item.width + '.png',
          ),
          fullPage: false,
        });
      }
      expect(errors).toEqual([]);
    },
  );
