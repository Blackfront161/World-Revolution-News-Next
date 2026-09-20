import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';
import { getUiCopy, uiLanguageIds } from '../../packages/ui-language/src';

const clients = [
  { name: 'website', origin: 'http://127.0.0.1:43178', heading: 'h1', card: 'h3' },
  { name: 'mobile', origin: 'http://127.0.0.1:43177', heading: 'h2', card: 'h4' },
] as const;
const copy = getUiCopy('en');
const firstId = 'wrn-art-a772ab86c915a036c6177f1bfe958d4d';

test('actual Mobile and Website personalization adapters keep one-origin saves and clears separate', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:43175/');
  const base = `/@fs/${path.resolve('apps').replaceAll('\\', '/')}`;
  const result = await page.evaluate(
    async ({ base, raw }) => {
      const mobileModule = await import(`${base}/mobile/src/local-personalization-state.ts`);
      const webModule = await import(`${base}/website/src/local-personalization-state.ts`);
      const mobile = mobileModule.createMobilePersonalizationStore();
      const web = webModule.createWebsitePersonalizationStore();
      try {
        const state = JSON.parse(raw);
        const mobileSaved = mobile.save(mobile.load(), state).kind;
        const webSaved = web.save(web.load(), state).kind;
        const beforeMobile = localStorage.getItem(mobileModule.mobilePersonalizationStorageKey);
        const webClear = web.clear(web.load()).kind;
        const mobileKept =
          localStorage.getItem(mobileModule.mobilePersonalizationStorageKey) === beforeMobile;
        web.save(web.load(), state);
        const beforeWeb = localStorage.getItem(webModule.websitePersonalizationStorageKey);
        const mobileClear = mobile.clear(mobile.load()).kind;
        return {
          mobileSaved,
          webSaved,
          webClear,
          mobileClear,
          mobileKept,
          webKept: localStorage.getItem(webModule.websitePersonalizationStorageKey) === beforeWeb,
          distinct:
            mobileModule.mobilePersonalizationStorageKey !==
            webModule.websitePersonalizationStorageKey,
        };
      } finally {
        mobile.dispose();
        web.dispose();
      }
    },
    { base, raw: selected },
  );
  expect(result).toEqual({
    mobileSaved: 'saved',
    webSaved: 'saved',
    webClear: 'cleared',
    mobileClear: 'cleared',
    mobileKept: true,
    webKept: true,
    distinct: true,
  });
});
const key = (name: string) => `wrn.${name}-local-personalization.v1`;
const selected = JSON.stringify({
  contractVersion: 1,
  schema: 'wrn.local-personalization',
  revision: 'wrn-local-personalization-v1',
  interestIds: [],
  regionIds: [],
  contentLanguageIds: ['en'],
});
async function confirm(page: Page, label: string) {
  await page
    .locator('.personalization-view')
    .getByRole('button', { name: label, exact: true })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: label, exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

for (const client of clients) {
  test(`${client.name} saved selection yields the six real articles and survives reader return and reload`, async ({
    page,
  }, info) => {
    const errors: string[] = [],
      external: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== client.origin) external.push(request.url());
    });
    await page.goto(`${client.origin}/#following`);
    const area = page.locator('.personalization-view');
    await expect(
      area.getByRole('heading', { name: copy.personalizationTitle, exact: true }),
    ).toBeFocused();
    await expect(
      area.getByRole('button', { name: copy.personalizationSave, exact: true }),
    ).toBeDisabled();
    await area.getByRole('checkbox', { name: 'English', exact: true }).check();
    expect(await page.evaluate((k) => localStorage.getItem(k), key(client.name))).toBeNull();
    await confirm(page, copy.personalizationSave);
    await expect(area.locator('.production-card')).toHaveCount(6);
    await expect(area.locator(`.production-card ${client.card}`)).toHaveCount(6);
    await expect(area.locator(`.production-card ${client.card}`).first()).toHaveAttribute(
      'lang',
      'en',
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`${client.name}-following-results.png`),
      fullPage: true,
    });
    await area.locator(`[data-reader-trigger="${firstId}"]`).click();
    await expect(page.getByTestId('production-reader')).toBeVisible();
    await page.goBack();
    await expect(area.locator('.production-card')).toHaveCount(6);
    await page.reload();
    await expect(area.getByRole('checkbox', { name: 'English', exact: true })).toBeChecked();
    await expect(area.locator('.production-card')).toHaveCount(6);
    await area.getByRole('checkbox', { name: 'English', exact: true }).uncheck();
    await area
      .getByRole('checkbox', { name: copy.personalizationInterestSport, exact: true })
      .check();
    await confirm(page, copy.personalizationSave);
    await expect(area.locator('.production-card')).toHaveCount(0);
    await expect(area.getByText(copy.personalizationNoMatches, { exact: true })).toBeVisible();
    await confirm(page, copy.personalizationClear);
    await expect(page.locator('main')).toBeFocused();
    expect(await page.evaluate((k) => localStorage.getItem(k), key(client.name))).toBeNull();
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });

  for (const scenario of [
    { language: 'de', width: 320, theme: 'violet', zoom: false },
    { language: 'ru', width: 390, theme: 'dark', zoom: true },
    { language: 'en', width: 1440, theme: 'contrast', zoom: false },
  ] as const) {
    test(`${client.name} personalization layout ${scenario.language} ${scenario.width} ${scenario.theme}`, async ({
      page,
    }, info) => {
      const text = getUiCopy(scenario.language);
      await page.setViewportSize({ width: scenario.width, height: 900 });
      await page.goto(`${client.origin}/?theme=${scenario.theme}#following`);
      await page.getByTestId('ui-language-selector').selectOption(scenario.language);
      await expect(page.locator('html')).toHaveAttribute('lang', scenario.language);
      if (scenario.zoom)
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%';
        });
      const area = page.locator('.personalization-view');
      await expect(area.locator(client.heading).first()).toHaveText(text.personalizationTitle);
      await area.getByRole('checkbox', { name: 'English', exact: true }).check();
      const trigger = area.getByRole('button', { name: text.personalizationSave, exact: true });
      await trigger.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('button', { name: text.cancel, exact: true })).toBeFocused();
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press(i === 2 ? 'Shift+Tab' : 'Tab');
        expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
      }
      await area
        .getByRole('checkbox', { name: 'English', exact: true })
        .evaluate((node) => (node as HTMLElement).focus());
      expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      expect(
        await area.locator('button:visible,label').evaluateAll((nodes) =>
          nodes.every((node) => {
            const r = node.getBoundingClientRect();
            return r.width >= 44 && r.height >= 44;
          }),
        ),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: info.outputPath(`${client.name}-${scenario.language}-${scenario.theme}-dialog.png`),
      });
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
      await confirm(page, text.personalizationSave);
      await expect(area.locator('.production-card')).toHaveCount(6);
      await page.evaluate(() => window.scrollTo(0, 0));
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: info.outputPath(
          `${client.name}-${scenario.language}-${scenario.theme}-following.png`,
        ),
        fullPage: true,
      });
    });
  }
}

test('Website preserves drafts in all nine UI languages and protects opaque state across explicit clear', async ({
  page,
}, info) => {
  await page.goto('http://127.0.0.1:43178/#following');
  await page.getByRole('checkbox', { name: 'English', exact: true }).check();
  for (const language of uiLanguageIds) {
    const text = getUiCopy(language);
    await page.getByTestId('ui-language-selector').selectOption(language);
    await expect(page.locator('#website-page-title')).toHaveText(text.personalizationTitle);
    await expect(page.getByRole('checkbox', { name: 'English', exact: true })).toBeChecked();
    await page.getByRole('button', { name: text.personalizationSave, exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText(text.personalizationSaveQuestion);
    await page.keyboard.press('Escape');
  }
  await page.getByTestId('ui-language-selector').selectOption('en');
  await page.evaluate((k) => localStorage.setItem(k, '{future-profile'), key('website'));
  await page.reload();
  await expect(page.getByText(copy.personalizationProtected, { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('website-following-protected.png') });
  expect(await page.evaluate((k) => localStorage.getItem(k), key('website'))).toBe(
    '{future-profile',
  );
  await confirm(page, copy.personalizationClear);
  await expect(page.getByRole('checkbox', { name: 'English', exact: true })).toBeVisible();
});

test('Website refuses a stale confirmation after a second tab changes the selection', async ({
  page,
  context,
}) => {
  await page.goto('http://127.0.0.1:43178/#following');
  await page
    .getByRole('checkbox', { name: copy.personalizationInterestSport, exact: true })
    .check();
  await page.getByRole('button', { name: copy.personalizationSave, exact: true }).click();
  const other = await context.newPage();
  await other.goto('http://127.0.0.1:43178/#following');
  await other.evaluate(({ k, raw }) => localStorage.setItem(k, raw), {
    k: key('website'),
    raw: selected,
  });
  await page
    .getByRole('dialog')
    .getByRole('button', { name: copy.personalizationSave, exact: true })
    .click();
  await expect(page.getByText(copy.personalizationConflict, { exact: true })).toBeVisible();
  expect(await page.evaluate((k) => localStorage.getItem(k), key('website'))).toBe(selected);
  await page.getByRole('button', { name: copy.personalizationReload, exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'English', exact: true })).toBeChecked();
  await expect(page.locator('.production-card')).toHaveCount(6);
  await other.close();
});
