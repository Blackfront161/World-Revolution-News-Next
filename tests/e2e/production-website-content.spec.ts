import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  makeWebsiteTestPacket,
  websiteTestId,
  websiteAliasId,
  websiteGoneId,
} from './production-website-harness';

test.use({ baseURL: 'http://127.0.0.1:43178' });
const firstId = 'wrn-art-a772ab86c915a036c6177f1bfe958d4d';
const secondId = 'wrn-art-ba76ef8b7afb34885bd5f64bc7135f6c';

test('saved production Website opens a real article after closing the page while fully offline', async ({
  page,
  context,
}) => {
  await page.goto(`/?article=${firstId}#home`);
  await expect(page.getByTestId('production-reader')).toBeVisible();
  await page.getByRole('button', { name: 'Save for later', exact: true }).click();
  await page.goto('/#more');
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
  const reopened = await context.newPage();
  await reopened.goto(`/?article=${firstId}#home`);
  await expect(reopened.getByTestId('production-reader')).toBeVisible();
  await expect(reopened.locator('.production-translatable-paragraph > p')).toHaveCount(12);
  await expect(
    reopened.getByRole('button', { name: 'Remove from saved', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(await reopened.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  const cachesHaveProductionJson = await reopened.evaluate(async () => {
    for (const name of await caches.keys())
      for (const request of await (await caches.open(name)).keys())
        if (new URL(request.url).pathname.startsWith('/wrn-production-content/')) return true;
    return false;
  });
  expect(cachesHaveProductionJson).toBe(false);
});

test('static admitted landing opens the genuine Website reader without provider requests', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== 'http://127.0.0.1:43178')
      external.push(request.url());
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(`/articles/${firstId}/`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `https://solinaridao.com/articles/${firstId}/`,
  );
  await expect(page.locator('.reader-content > p')).toHaveCount(12);
  expect(
    await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe('rgb(11, 16, 23)');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.locator('#interactive-reader').click();
  await expect(page.getByTestId('production-reader')).toBeVisible();
  await expect(page.locator('.production-translatable-paragraph > p')).toHaveCount(12);
  expect(external).toEqual([]);
});

test('authored four-block Website main/archive rendering, canonical alias and gone route', async ({
  page,
}, info) => {
  const packet = await makeWebsiteTestPacket();
  await page.route('**/wrn-production-content/**', (route) => {
    const value = packet.get(new URL(route.request().url()).pathname);
    return route.fulfill({
      status: value === undefined ? 404 : 200,
      contentType: 'application/json',
      body: JSON.stringify(value ?? {}),
    });
  });
  await page.goto(`/?article=${websiteAliasId}#home`);
  await expect(page.getByTestId('production-reader')).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`article=${websiteTestId}#home$`));
  await expect(page.locator('.production-reader-blocks ol li')).toHaveCount(2);
  await expect(page.locator('.production-reader-blocks ul li')).toHaveCount(2);
  await expect(page.locator('.production-reader-blocks figcaption')).toHaveText('Test author');
  const blocks = await page.locator('.production-reader-blocks').innerHTML();
  await page.screenshot({ path: info.outputPath('authored-website-main.png'), fullPage: true });
  await page.goto(`/?archive=${websiteTestId}#more`);
  await expect(page.getByTestId('production-reader')).toBeVisible();
  expect(await page.locator('.production-reader-blocks').innerHTML()).toBe(blocks);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('authored-website-archive.png'), fullPage: true });
  await page.goto(`/?article=${websiteGoneId}#home`);
  await expect(
    page.getByText('This article is unavailable or has been withdrawn.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('production-reader')).toHaveCount(0);
});

test('actual Website update, rollback, failed payload revocation and content clear preserve reading data', async ({
  page,
}) => {
  let packet = await makeWebsiteTestPacket();
  let failReader = false;
  await page.route('**/wrn-production-content/**', (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (failReader && pathname.endsWith('/reader-details.json'))
      return route.fulfill({ status: 503, body: '' });
    const value = packet.get(pathname);
    return route.fulfill({
      status: value === undefined ? 404 : 200,
      contentType: 'application/json',
      body: JSON.stringify(value ?? {}),
    });
  });
  const check = async () => {
    await page.getByRole('button', { name: 'Check for a newer revision', exact: true }).click();
    await expect(page.getByTestId('production-content')).toHaveAttribute('aria-busy', 'false');
  };
  await page.goto(`/?article=${websiteTestId}#home`);
  await expect(page.getByTestId('production-reader')).toBeVisible();
  await page.getByRole('button', { name: 'Save for later', exact: true }).click();
  const reading = await page.evaluate(() =>
    localStorage.getItem('wrn.website-production-reading-state.v2'),
  );
  expect(reading).toContain(websiteTestId);
  packet = await makeWebsiteTestPacket({ sequence: 2, omitFirst: true });
  await check();
  await expect(page.getByTestId('production-reader')).toHaveCount(0);
  await page.goto('/#more');
  await page.getByRole('button', { name: 'Use previous revision', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Use previous revision', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto(`/?article=${websiteTestId}#home`);
  await expect(page.getByTestId('production-reader')).toBeVisible();
  packet = await makeWebsiteTestPacket({
    sequence: 3,
    safetyRevision: 2,
    omitFirst: true,
    revokedFirst: true,
  });
  failReader = true;
  await check();
  await expect(page.getByTestId('production-reader')).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByText('This article is unavailable or has been withdrawn.', { exact: true }),
  ).toBeVisible();
  await page.goto('/#more');
  await page.getByRole('button', { name: 'Remove local content', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete now', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem('wrn.website-production-reading-state.v2')),
  ).toBe(reading);
  packet = await makeWebsiteTestPacket();
  failReader = false;
  await check();
  await page.goto(`/?article=${websiteTestId}#home`);
  await expect(
    page.getByText('This article is unavailable or has been withdrawn.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('production-reader')).toHaveCount(0);
});

for (const theme of ['violet', 'dark', 'contrast']) {
  for (const route of ['article', 'archive']) {
    test(`exact original and license focus restoration ${theme} ${route}`, async ({
      page,
    }, info) => {
      await page.goto(`/?theme=${theme}&${route}=${firstId}#home`);
      await expect(page.getByTestId('production-reader')).toBeVisible();
      for (const label of ['Open original source', 'CC-BY-4.0']) {
        for (const close of ['Escape', 'Cancel']) {
          const trigger = page.getByRole('button', { name: label, exact: true });
          await trigger.click();
          await expect(page.getByRole('dialog')).toBeVisible();
          if (close === 'Escape') await page.keyboard.press('Escape');
          else
            await page
              .getByRole('dialog')
              .getByRole('button', { name: 'Cancel', exact: true })
              .click();
          await expect(page.getByRole('dialog')).toHaveCount(0);
          await expect(trigger).toBeFocused();
        }
      }
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`focus-${theme}-${route}.png`) });
    });
  }
}

for (const language of ['en', 'de', 'ru']) {
  for (const width of [320, 390, 1440]) {
    for (const theme of ['violet', 'dark']) {
      test(`production reader layout ${language} ${width} ${theme}`, async ({ page }, info) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/?theme=${theme}&article=${firstId}#home`);
        await expect(page.getByTestId('production-reader')).toBeVisible();
        await page.getByTestId('ui-language-selector').selectOption(language);
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        ).toBe(true);
        const heights = await page
          .getByTestId('production-content')
          .locator('button:visible')
          .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
        expect(heights.every((height) => height >= 44)).toBe(true);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: info.outputPath(`${language}-${width}-${theme}-reader.png`),
        });
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      });
    }
  }
}

for (const theme of ['violet', 'dark']) {
  test(`RU 200 percent reader and confirmation ${theme}`, async ({ page }, info) => {
    await page.goto(`/?theme=${theme}&article=${firstId}#home`);
    await expect(page.getByTestId('production-reader')).toBeVisible();
    await page.getByTestId('ui-language-selector').selectOption('ru');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath(`ru-200-${theme}-reader.png`) });
    await page.getByRole('button', { name: 'CC-BY-4.0', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({ path: info.outputPath(`ru-200-${theme}-dialog.png`) });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    for (let index = 0; index < 5; index++) {
      await page.keyboard.press('Tab');
      expect(
        await page
          .getByRole('dialog')
          .evaluate((dialog) => dialog.contains(document.activeElement)),
      ).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('production-reader')).toBeVisible();
  });
}

test('all nine interface languages retain original article language and actual discovery filters', async ({
  page,
}) => {
  await page.goto('/#discover');
  await expect(page.locator('.production-card')).toHaveCount(6);
  for (const language of ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr']) {
    await page.getByTestId('ui-language-selector').selectOption(language);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.locator('.production-card h3').first()).toHaveAttribute('lang', 'en');
  }
  await page.locator('.production-filters input').fill('sovereignty');
  await expect(page.locator('.production-card')).toHaveCount(1);
  await page.locator('.production-filters input').fill('no-matching-authored-search');
  await expect(page.locator('.production-card')).toHaveCount(0);
});

test('default entry reads admitted articles, persists v2 and never touches reading v1', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const protectedKeys = [
      'wrn.website-local-reading-state.v1',
      'wrn.mobile-local-reading-state.v1',
      'wrn.mobile-production-reading-state.v2',
    ];
    for (const key of protectedKeys) localStorage.setItem(key, `preserve-${key}`);
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (name) {
      if (protectedKeys.includes(name))
        throw new Error('Website production accessed protected reading state');
      return original.call(this, name);
    };
    const open = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function (name, version) {
      if (name !== 'wrn.website-production-content-offline.v1')
        throw new Error(`Website production opened unexpected database ${name}`);
      return version === undefined ? open.call(this, name) : open.call(this, name, version);
    };
  });
  await page.goto('/');
  await expect(page.locator('.production-card')).toHaveCount(6);
  await page.locator(`[data-reader-trigger="${firstId}"]`).click();
  const reader = page.getByTestId('production-reader');
  await expect(reader).toBeVisible();
  await expect(reader).toHaveAttribute('lang', 'en');
  await expect(reader.locator('.production-translatable-paragraph > p')).toHaveCount(12);
  await reader.getByRole('button', { name: 'Save for later', exact: true }).click();
  await expect(reader.getByRole('button', { name: 'Remove from saved' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await reader.getByRole('button', { name: 'Mark as read', exact: true }).click();
  await reader.getByRole('button', { name: 'Save reading position', exact: true }).click();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('wrn.website-production-reading-state.v2')!),
  );
  expect(state.entries[0]).toMatchObject({
    articleId: firstId,
    savedAt: expect.any(String),
    readAt: expect.any(String),
    progress: { fraction: expect.any(Number) },
  });
  await page.screenshot({ path: info.outputPath('production-reader-en.png'), fullPage: true });
  expect(errors).toEqual([]);
  await page.reload();
  await expect(page.getByTestId('production-reader')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Remove from saved', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(
    await page.evaluate(() =>
      [
        'wrn.website-local-reading-state.v1',
        'wrn.mobile-local-reading-state.v1',
        'wrn.mobile-production-reading-state.v2',
      ].every((key) => localStorage[key] === `preserve-${key}`),
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('original and license use modal confirmation and main/archive share one reader', async ({
  page,
}, info) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:43178')) external.push(request.url());
  });
  await page.goto(`/?article=${secondId}#home`);
  const reader = page.getByTestId('production-reader');
  await expect(reader).toBeVisible();
  await expect(reader.getByRole('button', { name: 'CC-BY-4.0' })).toBeVisible();
  await reader.getByRole('button', { name: 'CC-BY-4.0' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link')).toHaveAttribute(
    'href',
    'https://creativecommons.org/licenses/by/4.0/',
  );
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(reader).toBeVisible();
  await reader.getByRole('button', { name: 'Open original source', exact: true }).click();
  await expect(dialog.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
  await page.screenshot({ path: info.outputPath('production-source-dialog.png'), fullPage: true });
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  const blocks = await reader.locator('.production-reader-blocks').textContent();
  await page.goto(`/?archive=${secondId}#more`);
  await expect(page.getByTestId('production-reader')).toBeVisible();
  expect(await page.locator('.production-reader-blocks').textContent()).toBe(blocks);
  expect(external).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('restart restores stored articles without source fetch; exact bundle expiry hides the body', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-09-10T04:00:00Z') });
  await page.goto(`/?article=${firstId}#home`);
  await expect(page.getByTestId('production-reader')).toBeVisible();
  let requests = 0;
  await page.route('**/wrn-production-content/**', (route) => {
    requests++;
    return route.abort('internetdisconnected');
  });
  await page.reload();
  await expect(page.getByTestId('production-reader')).toBeVisible();
  expect(requests).toBe(0);
  await page.clock.fastForward(86_400_001);
  await expect(page.getByTestId('production-reader')).toHaveCount(0);
  expect(requests).toBe(0);
});

test('saving from header retains the last text position and restores it on reload and reopen', async ({
  page,
}) => {
  await page.goto(`/?article=${secondId}#home`);
  const blocks = page.locator('.production-reader-blocks');
  await expect(blocks).toBeVisible();
  await blocks.evaluate((element) =>
    window.scrollTo(
      0,
      element.getBoundingClientRect().top + window.scrollY + element.clientHeight * 0.5,
    ),
  );
  await expect
    .poll(() =>
      blocks.evaluate((element) => -element.getBoundingClientRect().top / element.clientHeight),
    )
    .toBeCloseTo(0.5, 2);
  await page.getByRole('button', { name: 'Save reading position', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('wrn.website-production-reading-state.v2')!).entries[0]
            .progress.fraction,
      ),
    )
    .toBeCloseTo(0.5, 2);
  await page.reload();
  await expect(blocks).toBeVisible();
  await expect
    .poll(() =>
      blocks.evaluate((element) => -element.getBoundingClientRect().top / element.clientHeight),
    )
    .toBeCloseTo(0.5, 2);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page
    .locator('.production-card')
    .filter({ hasText: 'Digital Sovereignty' })
    .getByRole('button', { name: 'Read article', exact: true })
    .click();
  await expect(blocks).toBeVisible();
  await expect
    .poll(() =>
      blocks.evaluate((element) => -element.getBoundingClientRect().top / element.clientHeight),
    )
    .toBeCloseTo(0.5, 2);
});
