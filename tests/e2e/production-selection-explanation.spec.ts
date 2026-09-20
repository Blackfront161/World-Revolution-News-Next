import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { getUiCopy } from '../../packages/ui-language/src';
import { getProductionSelectionCopy } from '../../packages/ui-language/src/source-preferences';

const now = new Date('2026-09-12T14:00:00Z');
const eff = 'Electronic Frontier Foundation';
const explain = '.production-selection-explanation';
async function choices(page: Page, client: string) {
  return page.evaluate(
    (client) => ({
      personalization: localStorage.getItem(`wrn.${client}-local-personalization.v1`),
      sources: localStorage.getItem(`wrn.${client}.source-preferences.v1`),
    }),
    client,
  );
}
for (const [client, port] of [
  ['mobile', 43174],
  ['website', 43175],
] as const) {
  const origin = `http://127.0.0.1:${port}`;
  test(`${client} explains actual choices, follows and neutral sources only in For me`, async ({
    page,
  }, info) => {
    const errors: string[] = [],
      foreign: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== origin) foreign.push(request.url());
    });
    await page.clock.setFixedTime(now);
    await page.goto(`${origin}/#home`);
    await page.getByTestId('ui-language-selector').selectOption('en');
    const cards = page.locator('.production-card');
    await expect(cards).toHaveCount(6);
    await expect(page.locator(explain)).toHaveCount(0);
    await cards.first().locator('.source-profile summary').click();
    await cards
      .first()
      .getByRole('button', { name: `Follow: ${eff}`, exact: true })
      .click();
    await page.goto(`${origin}/#following`);
    await expect(page.locator(explain)).toHaveCount(6);
    const first = page.locator(explain).first();
    const copy = getProductionSelectionCopy('en');
    const before = await choices(page, client);
    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('open', '');
    await expect(first).toContainText(copy.followed);
    await expect(first).toContainText(eff);
    await page.locator(explain).last().locator('summary').click();
    await expect(page.locator(explain).last()).toContainText(copy.otherSource);
    expect(await choices(page, client)).toEqual(before);
    await page.screenshot({
      path: info.outputPath(`${client}-en-source-reasons.png`),
      fullPage: true,
    });
    // Real explicit settings flow; the local explanation must name only matching choices.
    await page.getByLabel('English', { exact: true }).check();
    await page.getByLabel('Deutsch', { exact: true }).check();
    await page
      .getByRole('button', { name: getUiCopy('en').personalizationSave, exact: true })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: getUiCopy('en').personalizationSave, exact: true })
      .click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(first).toContainText('Content languages');
    await expect(first.locator('[lang="en"]')).toHaveText('English');
    await expect(first.locator('[lang="de"]')).toHaveCount(0);
    const preserved = await choices(page, client);
    await page.route('**/wrn-production-content/**', (route) =>
      route.abort('internetdisconnected'),
    );
    await page.reload();
    await expect(page.locator(explain)).toHaveCount(6);
    expect(await choices(page, client)).toEqual(preserved);
    for (const route of ['home', 'discover', 'saved', 'more']) {
      await page.goto(`${origin}/#${route}`);
      await expect(page.locator(explain)).toHaveCount(0);
    }
    await page.goto(`${origin}/#home`);
    await cards.first().getByRole('button', { name: 'Read article', exact: true }).click();
    await expect(page.getByTestId('production-reader')).toBeVisible();
    await expect(page.locator(explain)).toHaveCount(0);
    expect(errors).toEqual([]);
    expect(foreign).toEqual([]);
  });

  test(`${client} localized explanation reflow, themes and keyboard`, async ({ page }, info) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.setFixedTime(now);
    await page.addInitScript((client) => {
      localStorage.setItem(
        `wrn.${client}-local-personalization.v1`,
        JSON.stringify({
          contractVersion: 1,
          schema: 'wrn.local-personalization',
          revision: 'wrn-local-personalization-v1',
          interestIds: [],
          regionIds: [],
          contentLanguageIds: ['en'],
        }),
      );
    }, client);
    const sizes =
      client === 'mobile'
        ? [
            [320, 568],
            [360, 800],
            [390, 844],
            [412, 915],
            [600, 960],
            [800, 1280],
            [915, 412],
            [1280, 800],
            [390, 844],
          ]
        : [
            [320, 568],
            [390, 844],
            [800, 1280],
            [1024, 800],
            [1280, 800],
            [1440, 900],
            [1920, 1080],
            [390, 844],
          ];
    for (const theme of ['violet', 'dark']) {
      await page.goto(`${origin}/?theme=${theme}#following`);
      await page.getByTestId('ui-language-selector').selectOption('ru');
      const first = page.locator(explain).first();
      await expect(first).toBeVisible();
      await first.locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(first).toHaveAttribute('open', '');
      await expect(first).toContainText(getProductionSelectionCopy('ru').local);
      for (const [index, [width, height]] of sizes.entries()) {
        await page.setViewportSize({ width: width!, height: height! });
        const reflow = index === sizes.length - 1;
        await page.evaluate((reflow) => {
          document.documentElement.style.fontSize = reflow ? '200%' : '100%';
        }, reflow);
        await first.evaluate((element) => element.scrollIntoView({ block: 'center' }));
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        ).toBe(true);
        const box = await first.locator('summary').boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
        await page.screenshot({
          path: info.outputPath(
            `${client}-${theme}-${width}x${height}-ru${reflow ? '200' : '100'}.png`,
          ),
        });
      }
      expect(
        (await new AxeBuilder({ page }).include('.personalization-results').analyze()).violations,
      ).toEqual([]);
    }
    await page.emulateMedia({ forcedColors: 'active' });
    await page.locator(explain).first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`${client}-forced-colors.png`) });
    expect(errors).toEqual([]);
  });
}
