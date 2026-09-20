import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { getSourcePreferencesCopy } from '../../packages/ui-language/src/source-preferences';
import { getUiCopy } from '../../packages/ui-language/src';

const firstId = 'wrn-art-a772ab86c915a036c6177f1bfe958d4d';
const eff = 'Electronic Frontier Foundation';
const endpointId = 'source-29fc972c91f79e665a490767d523a69e3b3a5ce82fc8663ab1980021392dfdb5';
const endpointUrl = 'https://evrensel.net/rss?do=rss';
const newsUrl =
  'https://www.evrensel.net/haber/5999747/yunanistan-italyadan-500-milyon-avroya-savas-gemisi-aliyor';
const copy = getSourcePreferencesCopy('en');
const profiles = [
  {
    name: 'mobile',
    origin: 'http://127.0.0.1:43177',
    reader: `/#article/${firstId}`,
    directory: '.content-directory__list',
  },
  {
    name: 'website',
    origin: 'http://127.0.0.1:43178',
    reader: `/?article=${firstId}#home`,
    directory: '.website-content-list',
  },
] as const;
async function panel(page: Page) {
  const panel = page.locator('.source-preferences-panel');
  await expect(panel).toBeVisible();
  await panel.locator('summary').click();
  return panel;
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
}
for (const profile of profiles) {
  const key = `wrn.${profile.name}.source-preferences.v1`;
  test(`${profile.name}: explicit follow, source-only For me, hide and undo preserve saved/direct articles and persist offline`, async ({
    page,
  }, info) => {
    const foreign: string[] = [],
      errors: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (['http:', 'https:'].includes(url.protocol) && url.origin !== profile.origin)
        foreign.push(url.href);
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-09-11T12:00:00Z'));
    await page.goto(`${profile.origin}/`);
    const cards = page.locator('.production-card');
    await expect(cards).toHaveCount(6);
    const savedArticle = cards.filter({
      has: page.locator(`[data-reader-trigger="${firstId}"]`),
    });
    await savedArticle.getByRole('button', { name: 'Save for later', exact: true }).click();
    const readingKey = `wrn.${profile.name}-production-reading-state.v2`;
    const reading = await page.evaluate((key) => localStorage.getItem(key), readingKey);
    expect(reading).toContain(firstId);
    await cards.first().locator('.source-profile summary').click();
    await cards
      .first()
      .getByRole('button', { name: `Follow: ${eff}`, exact: true })
      .click();
    await expect(
      cards.first().getByRole('button', { name: `Unfollow: ${eff}`, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.goto(`${profile.origin}/#following`);
    const followingCards = page.locator('.personalization-results .production-card');
    await expect(followingCards).toHaveCount(6);
    // The agreed projection prioritizes followed sources without an exclusive filter.
    // C4SS remains visible but moves behind all five EFF articles.
    await expect(followingCards.last().locator('[data-reader-trigger]')).toHaveAttribute(
      'data-reader-trigger',
      'wrn-art-1530b6ef5a7ab519b7bb4d15cf4af45c',
    );
    for (let index = 0; index < 5; index++)
      await expect(followingCards.nth(index).locator('.source-profile summary')).toContainText(eff);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`${profile.name}-source-only-for-me.png`),
      fullPage: true,
    });
    await page.goto(`${profile.origin}/`);
    await cards.first().locator('.source-profile summary').click();
    await cards
      .first()
      .getByRole('button', { name: `Hide: ${eff}`, exact: true })
      .click();
    await expect(cards).toHaveCount(1);
    await expect(cards.locator('[data-reader-trigger]')).toHaveAttribute(
      'data-reader-trigger',
      'wrn-art-1530b6ef5a7ab519b7bb4d15cf4af45c',
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.activeElement !== document.body &&
            document.querySelector('main')?.contains(document.activeElement),
        ),
      )
      .toBe(true);
    await page.goto(`${profile.origin}/#saved`);
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText(copy.hidden);
    expect(await page.evaluate((key) => localStorage.getItem(key), readingKey)).toBe(reading);
    await page.goto(`${profile.origin}${profile.reader}`);
    await expect(page.getByTestId('production-reader')).toContainText(copy.hidden);
    await expect(
      page.getByRole('button', { name: 'Remove from saved', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    // Mobile web preview has no shell SW. Deny every content request and start
    // a fresh runtime; actual IDB content plus local choices must still work.
    await page.route('**/wrn-production-content/**', (route) =>
      route.abort('internetdisconnected'),
    );
    await page.reload();
    await expect(page.getByTestId('production-reader')).toContainText(copy.hidden);
    await page.goto(`${profile.origin}/#more`);
    const choices = await panel(page);
    await expect(
      choices.getByRole('button', { name: `Show again: ${eff}`, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({
      path: info.outputPath(`${profile.name}-hidden-source-management.png`),
      fullPage: true,
    });
    await choices.getByRole('button', { name: `Show again: ${eff}`, exact: true }).click();
    expect(
      JSON.parse((await page.evaluate((key) => localStorage.getItem(key), key))!).choices,
    ).toEqual([]);
    await page.goto(`${profile.origin}/`);
    await expect(cards).toHaveCount(6);
    expect(await page.evaluate((key) => localStorage.getItem(key), readingKey)).toBe(reading);
    expect(foreign).toEqual([]);
    expect(errors).toEqual([]);
  });

  test(`${profile.name}: future raw is protected; cancel and confirmed clear retain other client and reading data`, async ({
    page,
  }, info) => {
    const raw = '{"contractVersion":"9.0.0","secretNote":"untrusted hidden raw"}';
    await page.goto(`${profile.origin}/`);
    await expect(page.locator('.production-card')).toHaveCount(6);
    await page
      .locator('.production-card')
      .first()
      .getByRole('button', { name: 'Save for later', exact: true })
      .click();
    const readingKey = `wrn.${profile.name}-production-reading-state.v2`;
    const before = await page.evaluate((key) => localStorage.getItem(key), readingKey);
    const otherKey = `wrn.${profile.name === 'mobile' ? 'website' : 'mobile'}.source-preferences.v1`;
    await page.evaluate(
      ({ key, raw, otherKey }) => {
        localStorage.setItem(key, raw);
        localStorage.setItem(otherKey, 'other client sentinel');
      },
      { key, raw, otherKey },
    );
    await page.goto(`${profile.origin}/#more`);
    await page.reload();
    const choices = await panel(page);
    await expect(choices.getByRole('alert')).toHaveText(copy.protected);
    await expect(page.getByText('untrusted hidden raw')).toHaveCount(0);
    const clear = choices.getByRole('button', { name: copy.clear, exact: true });
    await clear.click();
    await page.keyboard.press('Escape');
    await expect(clear).toBeFocused();
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(raw);
    await clear.click();
    const dialog = page.getByRole('dialog');
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    await page.screenshot({ path: info.outputPath(`${profile.name}-clear-confirmation.png`) });
    await dialog.getByRole('button', { name: 'Delete now', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(
      choices.getByRole('button', { name: getUiCopy('en').personalizationReload, exact: true }),
    ).toBeFocused();
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
    expect(await page.evaluate((key) => localStorage.getItem(key), readingKey)).toBe(before);
    expect(await page.evaluate((key) => localStorage.getItem(key), otherKey)).toBe(
      'other client sentinel',
    );
  });

  test(`${profile.name}: real endpoint follow comes first; exact matched news hides and returns without organization guessing`, async ({
    page,
  }, info) => {
    await page.goto(`${profile.origin}/#discover/news`);
    await page.getByRole('combobox', { name: 'Source', exact: true }).selectOption('Evrensel');
    await expect(page.locator(`a[href="${newsUrl}"]`)).toBeVisible();
    await page.goto(`${profile.origin}/#discover/sources`);
    await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Evrensel');
    const source = page
      .locator(`${profile.directory} > li`)
      .filter({ has: page.locator(`a[href="${endpointUrl}"]`) });
    await expect(source).toHaveCount(1);
    await source.locator('.source-profile summary').click();
    await source.getByRole('button', { name: 'Follow: Evrensel', exact: true }).click();
    await page.getByRole('textbox', { name: 'Search', exact: true }).fill('');
    await expect(
      page.locator(`${profile.directory} > li`).first().locator(`a[href="${endpointUrl}"]`),
    ).toBeVisible();
    expect(
      JSON.parse((await page.evaluate((key) => localStorage.getItem(key), key))!).choices,
    ).toEqual([{ catalog: 'directory', sourceId: endpointId, action: 'follow' }]);
    await source.getByRole('button', { name: 'Hide: Evrensel', exact: true }).click();
    await page.goto(`${profile.origin}/#discover/news`);
    await page.getByRole('combobox', { name: 'Source', exact: true }).selectOption('Evrensel');
    await expect(page.locator(`a[href="${newsUrl}"]`)).toHaveCount(0);
    await page.goto(`${profile.origin}/#discover/sources`);
    const choices = await panel(page);
    await choices.getByRole('button', { name: 'Show again: Evrensel', exact: true }).click();
    await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Evrensel');
    await source.locator('.source-profile summary').click();
    await page.screenshot({
      path: info.outputPath(`${profile.name}-real-endpoint-profile.png`),
      fullPage: true,
    });
    await page.goto(`${profile.origin}/#discover/news`);
    await page.getByRole('combobox', { name: 'Source', exact: true }).selectOption('Evrensel');
    await expect(page.locator(`a[href="${newsUrl}"]`)).toBeVisible();
    await page.goto(`${profile.origin}/`);
    await expect(page.locator('.production-card')).toHaveCount(6);
  });

  test(`${profile.name}: actual second-tab changes invalidate an open clear confirmation`, async ({
    page,
    context,
  }) => {
    await page.goto(`${profile.origin}/`);
    const card = page.locator('.production-card').first();
    await card.locator('.source-profile summary').click();
    await card.getByRole('button', { name: `Follow: ${eff}`, exact: true }).click();
    await page.goto(`${profile.origin}/#more`);
    const choices = await panel(page);
    await choices.getByRole('button', { name: copy.clear, exact: true }).click();
    const second = await context.newPage();
    await second.goto(`${profile.origin}/`);
    const secondCard = second.locator('.production-card').first();
    await secondCard.locator('.source-profile summary').click();
    await secondCard.getByRole('button', { name: `Hide: ${eff}`, exact: true }).click();
    await expect(
      choices.getByRole('button', { name: `Show again: ${eff}`, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.bringToFront();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete now', exact: true }).click();
    await expect(page.getByRole('dialog').getByRole('alert')).toHaveText(copy.failed);
    expect(
      JSON.parse((await page.evaluate((key) => localStorage.getItem(key), key))!).choices,
    ).toEqual([{ catalog: 'production', sourceId: 'eff', action: 'hide' }]);
    await page.keyboard.press('Escape');
    await second.close();
  });

  for (const theme of ['violet', 'dark']) {
    test(`${profile.name}: source controls ${theme} at 320px and RU200 with keyboard-safe confirmation`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: 320, height: 900 });
      await page.goto(`${profile.origin}/?theme=${theme}`);
      const card = page.locator('.production-card').first();
      await card.locator('.source-profile summary').click();
      const follow = card.getByRole('button', { name: `Follow: ${eff}`, exact: true });
      const unselected = await follow.evaluate((el) => ({
        border: getComputedStyle(el).borderTopColor,
        background: getComputedStyle(el).backgroundColor,
      }));
      expect(unselected.border).toBe('rgb(255, 82, 102)');
      // Existing app-wide theme gives outlined controls a neutral dark fill.
      // The accepted requirement is red outline, with red fill only if selected.
      expect(unselected.background).toBe('rgb(28, 36, 48)');
      await follow.click();
      expect(
        await card
          .getByRole('button', { name: `Unfollow: ${eff}`, exact: true })
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      ).toBe('rgb(255, 82, 102)');
      await noOverflow(page);
      await page.screenshot({
        path: info.outputPath(`${profile.name}-${theme}-320-source-controls.png`),
      });
      await page.goto(`${profile.origin}/?theme=${theme}#more`);
      await page.getByTestId('ui-language-selector').selectOption('ru');
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      const choices = await panel(page);
      await noOverflow(page);
      const heights = await choices
        .locator('button:visible')
        .evaluateAll((buttons) => buttons.map((el) => el.getBoundingClientRect().height));
      expect(heights.every((height) => height >= 44)).toBe(true);
      const clear = choices.getByRole('button', {
        name: getSourcePreferencesCopy('ru').clear,
        exact: true,
      });
      await clear.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await noOverflow(page);
      await expect(
        page
          .getByRole('dialog')
          .getByRole('button', { name: getUiCopy('ru').deleteNow, exact: true }),
      ).toBeInViewport({ ratio: 1 });
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`${profile.name}-${theme}-ru200-clear.png`) });
      await page.keyboard.press('Escape');
      await expect(clear).toBeFocused();
      await page.emulateMedia({ forcedColors: 'active' });
      await choices
        .getByRole('button', {
          name: `${getSourcePreferencesCopy('ru').unfollow}: ${eff}`,
          exact: true,
        })
        .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: info.outputPath(`${profile.name}-${theme}-forced-colors.png`),
      });
    });
  }
}

test('website: saved shell and source selection survive a new page with the entire network disabled', async ({
  page,
  context,
}, info) => {
  const origin = 'http://127.0.0.1:43178';
  await page.goto(`${origin}/?article=${firstId}#home`);
  await page.getByRole('button', { name: 'Save for later', exact: true }).click();
  await page.locator('.source-profile summary').click();
  await page.getByRole('button', { name: `Hide: ${eff}`, exact: true }).click();
  await page.goto(`${origin}/#more`);
  await page.getByRole('button', { name: 'Save website shell', exact: true }).click();
  await expect(page.locator('.website-shell-panel')).toHaveAttribute(
    'data-shell-status',
    /^(saved|active)$/,
  );
  await expect
    .poll(() =>
      page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.state),
    )
    .toBe('activated');
  await page.close();
  await context.setOffline(true);
  const offline = await context.newPage();
  await offline.goto(`${origin}/?article=${firstId}#home`);
  await expect(offline.getByTestId('production-reader')).toContainText(copy.hidden);
  await expect(
    offline.getByRole('button', { name: 'Remove from saved', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  const image = offline.locator('.production-reader-image img');
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(1200);
  await image.scrollIntoViewIfNeeded();
  await offline.screenshot({ path: info.outputPath('website-network-off-saved-hidden-image.png') });
  await offline.goto(`${origin}/#more`);
  const choices = await panel(offline);
  await choices.getByRole('button', { name: `Show again: ${eff}`, exact: true }).click();
  await offline.goto(`${origin}/`);
  await expect(offline.locator('.production-card')).toHaveCount(6);
});

test('mobile: Home archive respects endpoint follow and hide before filling its five slots', async ({
  page,
}, info) => {
  const origin = 'http://127.0.0.1:43177';
  await page.goto(`${origin}/`);
  const archive = page.getByRole('region', { name: 'From the news archive', exact: true });
  await expect(archive.locator('[data-home-directory-article]')).toHaveCount(5);
  const baseline = await archive
    .locator('[data-home-directory-article]')
    .evaluateAll((items) => items.map((item) => item.getAttribute('data-home-directory-article')));
  await page.goto(`${origin}/#discover/sources`);
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Evrensel');
  const source = page
    .locator('.content-directory__list > li')
    .filter({ has: page.locator(`a[href="${endpointUrl}"]`) });
  await source.locator('.source-profile summary').click();
  await source.getByRole('button', { name: 'Follow: Evrensel', exact: true }).click();
  await page.goto(`${origin}/`);
  await expect(archive.locator('[data-home-directory-article]')).toHaveCount(5);
  for (const item of await archive.locator('[data-home-directory-article]').all())
    await expect(item).toContainText('Evrensel');
  await archive.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath('mobile-home-followed-endpoint.png'),
    fullPage: true,
  });
  await page.goto(`${origin}/#discover/sources`);
  const choices = await panel(page);
  await choices.getByRole('button', { name: 'Hide: Evrensel', exact: true }).click();
  await page.goto(`${origin}/`);
  await expect(archive.locator('[data-home-directory-article]')).toHaveCount(5);
  await expect(archive).not.toContainText('Evrensel');
  await archive.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath('mobile-home-hidden-endpoint-refill.png'),
    fullPage: true,
  });
  await page.goto(`${origin}/#discover/sources`);
  const reverse = await panel(page);
  await reverse.getByRole('button', { name: 'Show again: Evrensel', exact: true }).click();
  await page.goto(`${origin}/`);
  await expect(archive.locator('[data-home-directory-article]')).toHaveCount(5);
  expect(
    await archive
      .locator('[data-home-directory-article]')
      .evaluateAll((items) =>
        items.map((item) => item.getAttribute('data-home-directory-article')),
      ),
  ).toEqual(baseline);
});
