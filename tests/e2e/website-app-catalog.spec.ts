import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
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
    const links = await catalog
      .locator('[data-app-catalog-record] a')
      .evaluateAll((es) =>
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
  await radio.getByRole('button', { name: 'Podcast-Folgen (710)', exact: true }).click();
  const podcasts = await check('podcasts', 710);
  await podcasts.getByRole('button', { name: '30 weitere zeigen', exact: true }).click();
  await expect(podcasts.locator('[data-app-catalog-record]')).toHaveCount(60);
  await podcasts.getByLabel('Inhaltssprache').selectOption('it');
  expect(
    await podcasts
      .locator('[data-app-catalog-record] h3')
      .evaluateAll((es) => es.every((e) => e.getAttribute('lang') === 'it')),
  ).toBe(true);
  await podcasts.getByRole('button', { name: 'Videos (16)', exact: true }).click();
  await check('videos', 16);
  await page.goto('/?lang=de#knowledge');
  const library = await check('library', 266);
  expect(
    await library
      .locator('[data-app-catalog-record] a')
      .evaluateAll((es) => es.every((e) => e.getAttribute('href')?.endsWith('.epub'))),
  ).toBe(true);
  await library.getByLabel('Suche', { exact: true }).fill('8 Stunden');
  await expect(library.locator('[data-app-catalog-record]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Lexikon', exact: true }).click();
  await expect(page.locator('.website-lexicon-layout')).toBeVisible();
  await page.goto('/?lang=de#events');
  await check('events', 5);
  await page.goto('/?lang=de#solidarity');
  await expect(page.locator('#website-page-title')).toBeVisible();
  await page.goto('/?lang=de#home');
  await expect(page.locator('.website-section-nav a')).toHaveCount(6);
  await expect(page.locator('[data-home-directory-article]')).toHaveCount(5);
  await expect(page.locator('.website-coverage-disclosure > summary')).toContainText('483/500');
});
