import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getMobileKnowledgeCopy } from '../../packages/ui-language/src/mobile-knowledge';

const languages = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const;
const themes = ['dark', 'oled', 'soft', 'pink', 'light', 'system', 'contrast'] as const;

test('knowledge filters, related navigation, privacy and loaded-shell offline behavior', async ({
  page,
  context,
}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile-'));
  const external: string[] = [],
    errors: string[] = [];
  const origin = new URL(testInfo.project.use.baseURL as string).origin;
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) external.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/?state=ready&theme=dark#knowledge');
  await expect(page.getByRole('heading', { name: 'Knowledge', exact: true })).toBeFocused();
  await expect(page.getByText('30 of 609', { exact: true })).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Source', exact: true })
    .selectOption('anarchist-library-de');
  await expect(page.getByText('No matching local entries.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open catalogue' })).toHaveCount(9);
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('it');
  await page.getByRole('combobox', { name: 'Format', exact: true }).selectOption('epub');
  await page.getByLabel('Search titles, authors, topics or terms').fill('A chi non si dissocia');
  await expect(page.getByText('1 of 1', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Read online' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'EPUB', exact: true })).toHaveCount(1);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Glossary', exact: true }).click();
  await page.getByRole('button', { name: 'Start with mutual aid' }).click();
  await expect(page.getByRole('heading', { name: 'Mutual aid', exact: true })).toBeVisible();
  const related = page.getByRole('article').getByRole('button').first();
  const name = await related.innerText();
  await related.click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await context.setOffline(false);
  for (const link of await page.locator('a[target="_blank"]').all()) {
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

const matrix = [
  ...languages.map((language) => ({ language, theme: 'dark', width: 390, height: 844 })),
  ...themes.map((theme) => ({ language: 'de' as const, theme, width: 320, height: 568 })),
  { language: 'de' as const, theme: 'light', width: 768, height: 960 },
  { language: 'de' as const, theme: 'dark', width: 1280, height: 800 },
];
for (const item of matrix)
  test(`knowledge visual ${item.language}-${item.theme}-${item.width}`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-390x844');
    const copy = getMobileKnowledgeCopy(item.language);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width: item.width, height: item.height });
    await page.goto(`/?state=ready&theme=${item.theme}#knowledge`);
    await page.getByTestId('ui-language-selector').selectOption(item.language);
    await expect(page.getByRole('heading', { name: copy.title, exact: true })).toBeVisible();
    await expect(
      page.getByText(copy.shown.replace('{shown}', '30').replace('{total}', '609'), {
        exact: true,
      }),
    ).toBeVisible();
    const root = path.resolve('test-results/knowledge-completion-screenshots');
    await mkdir(root, { recursive: true });
    for (const [section, label] of [
      ['library', copy.library],
      ['lexicon', copy.lexicon],
    ]) {
      await page
        .getByRole('group', { name: copy.title, exact: true })
        .getByRole('button', { name: label, exact: true })
        .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(1);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: path.join(root, `${section}-${item.language}-${item.theme}-${item.width}.png`),
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });

test('route chunk failure has a working retry and does not fetch data on another route', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844');
  let blocked = true,
    routeRequests = 0,
    dataRequests = 0;
  await page.route('**/features/knowledge/MobileKnowledgeRoute.tsx*', async (route) => {
    routeRequests += 1;
    if (blocked) {
      blocked = false;
      await route.abort('failed');
    } else await route.continue();
  });
  page.on('request', (request) => {
    if (request.url().includes('legacy-knowledge-v1.json')) dataRequests += 1;
  });
  await page.goto('/?state=ready#home');
  await expect(page.getByTestId('ui-language-selector')).toBeVisible();
  expect(routeRequests).toBe(0);
  expect(dataRequests).toBe(0);
  await page.goto('/?state=ready#knowledge');
  await expect(page.getByText('Local knowledge data could not be prepared.')).toBeVisible();
  await page.getByRole('button', { name: 'Reload view', exact: true }).click();
  await expect(page.getByText('30 of 609', { exact: true })).toBeVisible();
});
