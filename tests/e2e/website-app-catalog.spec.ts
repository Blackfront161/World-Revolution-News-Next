import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { getMobileKnowledgeCopy } from '../../packages/ui-language/src';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem('wrn.website.support-welcome.v1', 'dismissed'),
  );
  await page.route('https://**/*', (route) => route.abort());
});
test('all current app catalogues, EPUB-only books, filters and safe original links are reachable', async ({
  page,
}, info) => {
  if (info.project.name === 'website-reflow-200pct')
    await page.addInitScript(() =>
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.style.fontSize = '200%';
      }),
    );
  const check = async (kind: string, total: number) => {
    const catalog = page.locator(`[data-app-catalog="${kind}"]`);
    await expect(catalog.locator('[data-app-catalog-count]')).toHaveText(
      `${Math.min(30, total)} von ${total}`,
    );
    await expect(catalog.locator('[data-app-catalog-record]')).toHaveCount(Math.min(30, total));
    const links = await catalog.locator('[data-app-catalog-record] a').evaluateAll((es) =>
      es.map((a) => ({
        href: a.getAttribute('href'),
        rel: a.getAttribute('rel'),
        policy: a.getAttribute('referrerpolicy'),
      })),
    );
    expect(
      links.every(
        (a) =>
          a.href?.startsWith('https://') &&
          a.rel === 'noopener noreferrer' &&
          a.policy === 'no-referrer',
      ),
    ).toBe(true);
    expect(await page.locator('body').evaluate((el) => el.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    expect(
      (await new AxeBuilder({ page }).include('.website-app-catalog').analyze()).violations,
    ).toEqual([]);
    return catalog;
  };
  await page.goto('/?lang=de#media');
  const radio = await check('radio', 27);
  await radio.getByLabel('Suche', { exact: true }).fill('Radio Dreyeckland');
  await expect(radio.locator('[data-app-catalog-record]')).toHaveCount(1);
  await radio.getByRole('button', { name: 'Filter zurücksetzen', exact: true }).click();
  await radio.getByRole('button', { name: 'Podcast-Folgen (1256)', exact: true }).click();
  const podcasts = await check('podcasts', 1256);
  await podcasts.getByRole('button', { name: '30 weitere zeigen', exact: true }).click();
  await expect(podcasts.locator('[data-app-catalog-record]')).toHaveCount(60);
  await podcasts.getByLabel('Inhaltssprache').selectOption('it');
  expect(
    await podcasts
      .locator('[data-app-catalog-record] h3')
      .evaluateAll((es) => es.every((e) => e.getAttribute('lang') === 'it')),
  ).toBe(true);
  await podcasts.getByRole('button', { name: 'Videos (17)', exact: true }).click();
  await check('videos', 17);
  await page.goto('/?lang=de#knowledge');
  const library = page.locator('.website-knowledge-panel');
  await expect(library.getByText('30 von 715', { exact: true })).toBeVisible();
  await expect(library.locator('ol.website-content-list > li')).toHaveCount(30);
  expect(
    await library
      .locator('.website-safe-links a')
      .evaluateAll((es) => es.every((e) => e.getAttribute('href')?.endsWith('.epub'))),
  ).toBe(true);
  await library
    .getByLabel(getMobileKnowledgeCopy('de').search, { exact: true })
    .fill('ABC des Anarchismus');
  await expect(library.locator('ol.website-content-list > li')).toHaveCount(1);
  await expect(library.locator('ol.website-content-list')).toContainText('Berkman');
  await expect(library.locator('[data-learning-path]')).toHaveCount(3);
  await expect(library.locator('[data-learning-book]')).toHaveCount(30);
  for (const language of ['de', 'en', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr']) {
    await page.getByTestId('ui-language-selector').selectOption(language);
    await expect(library.locator('[data-learning-path]')).toHaveCount(3);
    await expect(library.locator('[data-learning-book]')).toHaveCount(30);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
  }
  await page.getByTestId('ui-language-selector').selectOption('de');
  await library.locator('.website-learning-paths summary').first().click();
  expect(
    (await new AxeBuilder({ page }).include('.website-knowledge-view').analyze()).violations,
  ).toEqual([]);
  await library.locator('.website-learning-paths button').first().click();
  await expect(page.locator('.website-lexicon-layout > article h2')).toHaveText('Anarchismus');
  await page.getByRole('button', { name: 'Lexikon', exact: true }).click();
  await expect(page.locator('.website-lexicon-layout')).toBeVisible();
  await expect(page.locator('.website-lexicon-layout > ul > li')).toHaveCount(155);
  await page.goto('/?lang=de#events');
  await check('events', 6);
  await page.goto('/?lang=de#solidarity');
  await expect(page.locator('#website-page-title')).toBeVisible();
  await page.goto('/?lang=de#home');
  await expect(page.locator('.website-section-nav a')).toHaveCount(6);
  await expect(page.locator('[data-home-directory-article]')).toHaveCount(5);
  await expect(page.locator('.website-coverage-disclosure > summary')).toContainText('483/500');
});
