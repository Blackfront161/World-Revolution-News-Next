import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const firstId = 'wrn-art-a772ab86c915a036c6177f1bfe958d4d';
const mainImageIds = [
  'wrn-art-f2ad391804423c87773b3351eb79c802',
  'wrn-art-bdb90712e1c72ee72293c70904b50889',
  'wrn-art-67bca5d4b29dab78f8ae26ccd996a9d8',
] as const;
const mainWithoutImageIds = [
  'wrn-art-ba76ef8b7afb34885bd5f64bc7135f6c',
  'wrn-art-1530b6ef5a7ab519b7bb4d15cf4af45c',
] as const;
const profiles = [
  { name: 'mobile', origin: 'http://127.0.0.1:43177', reader: `/#article/${firstId}` },
  { name: 'website', origin: 'http://127.0.0.1:43178', reader: `/?article=${firstId}#home` },
] as const;

test('Mobile Home keeps articles reachable after a wide-to-narrow font resize', async ({
  browser,
}, info) => {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 1000 },
    reducedMotion: 'reduce',
  });
  try {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const origin = process.env.WRN_HOME_REFLOW_ORIGIN ?? 'http://127.0.0.1:43177';
    await page.goto(`${origin}/?theme=violet`);
    await expect(page.locator('[data-home-role="main"]')).toHaveCount(5);
    const language = page.getByTestId('ui-language-selector');
    await language.selectOption('de');
    await page.screenshot({ path: info.outputPath('wide-home-de.png') });
    const mainCard = page.locator('[data-home-role="main"]').filter({
      has: page.locator(`[data-reader-trigger="${mainImageIds[0]}"]`),
    });
    await mainCard.locator('h3').scrollIntoViewIfNeeded();
    const image = mainCard.locator('img');
    await expect
      .poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth))
      .toBe(1200);
    await page.screenshot({ path: info.outputPath('wide-compact-image-de.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await language.selectOption('ru');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const shell = page.locator('.mobile-shell');
    await expect(shell).toHaveAttribute('data-wide-language-layout', 'true');
    await expect
      .poll(() => page.locator('main').evaluate((node) => node.clientHeight))
      .toBeGreaterThan(400);
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath('narrow-compact-image-ru200.png') });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '100%';
    });
    await expect(shell).not.toHaveAttribute('data-wide-language-layout', 'true');
    await expect
      .poll(() => page.locator('main').evaluate((node) => node.clientHeight))
      .toBeGreaterThan(400);
    await page.setViewportSize({ width: 1100, height: 1000 });
    await language.selectOption('de');
    await expect(shell).not.toHaveAttribute('data-wide-language-layout', 'true');
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeInViewport();
    await page.screenshot({ path: info.outputPath('wide-reset-de.png') });
    expect(errors).toEqual([]);
  } finally {
    await page.close();
  }
});

for (const profile of profiles) {
  for (const theme of ['violet', 'dark'] as const) {
    for (const width of [320, 390, 1200] as const) {
      test(`${profile.name} production Home presents admitted content and bounded directory notes in ${theme} at ${width}px`, async ({
        page,
      }, info) => {
        const escapedExternalRequests: string[] = [];
        const pageErrors: string[] = [];
        page.on('request', (request) => {
          const url = new URL(request.url());
          if (
            (url.protocol === 'http:' || url.protocol === 'https:') &&
            url.origin !== profile.origin
          ) {
            escapedExternalRequests.push(request.url());
          }
        });
        page.on('pageerror', (error) => pageErrors.push(error.message));
        await page.setViewportSize({ width, height: width === 1200 ? 900 : 844 });
        await page.goto(`${profile.origin}/?theme=${theme}`);
        const home = page.getByTestId('production-home');
        await expect(home).toBeVisible();
        await expect(home.locator('[data-home-role="lead"]')).toHaveCount(1);
        await expect(home.locator('[data-home-role="main"]')).toHaveCount(5);
        await expect(home.locator('[data-home-role="further"]')).toHaveCount(0);
        await expect(home.locator('[data-home-sport-note]')).toHaveCount(3);
        await expect(home.locator('[data-home-directory-article]')).toHaveCount(5);
        const image = home.locator('.production-home-image img');
        await expect(image).toHaveCount(4);
        for (const item of await image.all()) {
          await item.scrollIntoViewIfNeeded();
          await expect
            .poll(() => item.evaluate((node: HTMLImageElement) => node.naturalWidth))
            .toBe(1200);
        }
        await expect
          .poll(() =>
            image.evaluateAll((nodes: HTMLImageElement[]) =>
              nodes.map((node) => node.naturalWidth),
            ),
          )
          .toEqual([1200, 1200, 1200, 1200]);
        for (const id of mainImageIds)
          await expect(
            home
              .locator(`[data-reader-trigger="${id}"]`)
              .locator('..')
              .locator('..')
              .locator('.production-home-image img'),
          ).toHaveCount(1);
        for (const id of mainWithoutImageIds)
          await expect(
            home
              .locator(`[data-reader-trigger="${id}"]`)
              .locator('..')
              .locator('..')
              .locator('.production-home-image img'),
          ).toHaveCount(0);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        ).toBe(true);
        await page.screenshot({
          path: info.outputPath(`${profile.name}-${theme}-${width}-home-normal.png`),
          fullPage: true,
        });
        const imageLicence = home
          .locator('[data-home-role="main"] .production-home-image button')
          .first();
        await imageLicence.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('dialog').getByRole('link')).toHaveAttribute(
          'href',
          'https://creativecommons.org/licenses/by/4.0/',
        );
        await page.keyboard.press('Escape');
        await expect(imageLicence).toBeFocused();
        const lead = home.locator('[data-home-role="lead"]');
        const leadLicence = lead.locator('.production-home-image button');
        await leadLicence.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('dialog').getByRole('link')).toHaveAttribute(
          'href',
          'https://creativecommons.org/licenses/by/4.0/',
        );
        await page.keyboard.press('Escape');
        await expect(leadLicence).toBeFocused();
        await lead.getByRole('button', { name: 'Read article', exact: true }).click();
        await expect(page.getByTestId('production-reader')).toBeVisible();
        await page.getByRole('button', { name: 'Save for later', exact: true }).click();
        await page.getByRole('button', { name: 'Back', exact: true }).click();
        await expect(
          lead.getByRole('button', { name: 'Remove from saved', exact: true }),
        ).toHaveAttribute('aria-pressed', 'true');
        if (width === 390) {
          await page.getByTestId('ui-language-selector').selectOption('ru');
          await page.evaluate(() => {
            document.documentElement.style.fontSize = '200%';
          });
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          ).toBe(true);
          // A non-overflowing grid can still shred a date into one character per line.
          const dateLines = await home.locator('[data-home-sport-note] time').evaluateAll((dates) =>
            dates.map((date) => {
              const range = document.createRange();
              range.selectNodeContents(date);
              return new Set(Array.from(range.getClientRects(), (rect) => rect.top)).size;
            }),
          );
          expect(dateLines.every((lines) => lines > 0 && lines <= 2)).toBe(true);
          const leadImage = lead.locator('.production-home-image img');
          await leadImage.scrollIntoViewIfNeeded();
          await expect
            .poll(() => leadImage.evaluate((element: HTMLImageElement) => element.naturalWidth))
            .toBe(1200);
          expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
          await page.screenshot({
            path: info.outputPath(`${profile.name}-${theme}-${width}-home-ru200.png`),
            fullPage: true,
          });
          await page.emulateMedia({ forcedColors: 'active' });
          await expect(home).toBeVisible();
          await page.screenshot({
            path: info.outputPath(`${profile.name}-${theme}-${width}-home-ru200-forced.png`),
            fullPage: true,
          });
        }
        const sourceProfile = lead.locator('.source-profile');
        await sourceProfile.locator('summary').click();
        await sourceProfile.locator('button[aria-label]').nth(1).click();
        await expect(home.locator('[data-home-role="lead"]')).toHaveCount(1);
        await expect(home.locator('[data-reader-trigger]')).toHaveCount(1);
        await expect(home.locator('[data-reader-trigger]')).toHaveAttribute(
          'data-reader-trigger',
          'wrn-art-1530b6ef5a7ab519b7bb4d15cf4af45c',
        );
        await expect(home.locator('.production-home-image img')).toHaveCount(0);
        expect(escapedExternalRequests).toEqual([]);
        expect(pageErrors).toEqual([]);
      });
    }
  }
}

test('Website Home restarts from its saved offline shell without requesting an external provider', async ({
  page,
  context,
}, info) => {
  const origin = 'http://127.0.0.1:43178';
  await page.goto(origin);
  await expect(page.getByTestId('production-home')).toBeVisible();
  await expect(page.locator('[data-home-role="main"]')).toHaveCount(5);
  await page.goto(`${origin}/#more`);
  await page.getByRole('button', { name: 'Save website shell', exact: true }).click();
  await expect(page.locator('.website-shell-panel')).toHaveAttribute(
    'data-shell-status',
    /^(saved|active)$/,
  );
  await page.close();
  await context.setOffline(true);
  const offline = await context.newPage();
  await offline.goto(origin);
  await expect(offline.getByTestId('production-home')).toBeVisible();
  const image = offline.locator('.production-home-image img');
  await expect(image).toHaveCount(4);
  for (const item of await image.all()) {
    await item.scrollIntoViewIfNeeded();
    await expect
      .poll(() => item.evaluate((node: HTMLImageElement) => node.naturalWidth))
      .toBe(1200);
  }
  await expect
    .poll(() =>
      image.evaluateAll((nodes: HTMLImageElement[]) => nodes.map((node) => node.naturalWidth)),
    )
    .toEqual([1200, 1200, 1200, 1200]);
  await expect(offline.locator('[data-home-sport-note]')).toHaveCount(3);
  await expect(offline.locator('[data-home-directory-article]')).toHaveCount(5);
  await offline.screenshot({
    path: info.outputPath('website-home-offline-restart.png'),
    fullPage: true,
  });
});
