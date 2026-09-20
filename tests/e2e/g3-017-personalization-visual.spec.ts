import { copyFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { getUiCopy, uiLanguageIds } from '../../packages/ui-language/src';

const themes = ['dark', 'light', 'pink', 'contrast'] as const;
const personalizationKey = 'wrn.mobile-local-personalization.v1';

const readyState = JSON.stringify({
  contractVersion: 1,
  schema: 'wrn.local-personalization',
  revision: 'wrn-local-personalization-v1',
  interestIds: ['movement-news'],
  regionIds: [],
  contentLanguageIds: [],
});

async function persistCapture(info: TestInfo, name: string, path: string) {
  await info.attach(name, { path, contentType: 'image/png' });
  const root = process.env.WRN_EVIDENCE_ROOT;
  if (!root) return;
  const target = resolve(root);
  await mkdir(target, { recursive: true });
  await copyFile(path, join(target, `${process.env.WRN_EVIDENCE_REVISION ?? 'local'}_${name}.png`));
}

async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await persistCapture(info, name, path);
}

async function assertGeometry(page: Page) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const controls = [
      ...document.querySelectorAll<HTMLElement>(
        '.personalization-view button, .personalization-view label',
      ),
    ];
    return {
      overflow: root.scrollWidth > root.clientWidth + 1,
      controls: controls.map((control) => {
        const bounds = control.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height };
      }),
    };
  });
  expect(result.overflow).toBe(false);
  expect(result.controls.every((control) => control.width >= 44 && control.height >= 44)).toBe(
    true,
  );
}

test.beforeEach(async ({ browserName }, info) => {
  test.skip(browserName !== 'chromium' || info.project.name !== 'mobile-390x844');
});

test('G3-017 captures inactive, dialogs, protected and unavailable local-only states', async ({
  context,
  page,
}, info) => {
  test.setTimeout(180_000);
  const external: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:43173') external.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?state=ready#following');
  await expect(page.getByRole('checkbox', { name: 'Movement news' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'For me' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Save selection' })).toBeDisabled();
  await capture(page, info, 'g3-017-inactive-dark');

  await page.getByRole('checkbox', { name: 'Movement news' }).check();
  await page.getByRole('button', { name: 'Save selection' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await capture(page, info, 'g3-017-save-dialog-dark');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

  await page.getByRole('button', { name: 'Save selection' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Save selection' }).click();
  await expect(page.getByText('Your local selection was saved.')).toBeVisible();
  await page.getByTestId('theme-selector').selectOption('pink');
  await assertGeometry(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await capture(page, info, 'g3-017-ready-pink');

  await page.getByRole('button', { name: 'Delete local selection' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await capture(page, info, 'g3-017-clear-dialog-pink');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

  const protectedPage = await context.newPage({ viewport: { width: 390, height: 844 } });
  await protectedPage.addInitScript(
    (key) => localStorage.setItem(key, '{protected'),
    personalizationKey,
  );
  await protectedPage.goto('/?state=ready&theme=contrast#following');
  await expect(protectedPage.getByRole('alert')).toBeVisible();
  await assertGeometry(protectedPage);
  expect((await new AxeBuilder({ page: protectedPage }).analyze()).violations).toEqual([]);
  await capture(protectedPage, info, 'g3-017-protected-contrast');
  await protectedPage.close();

  const unavailablePage = await context.newPage({ viewport: { width: 390, height: 844 } });
  await unavailablePage.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('test storage unavailable');
    };
  });
  await unavailablePage.goto('/?state=ready#following');
  await expect(unavailablePage.getByRole('alert')).toBeVisible();
  await assertGeometry(unavailablePage);
  expect((await new AxeBuilder({ page: unavailablePage }).analyze()).violations).toEqual([]);
  await capture(unavailablePage, info, 'g3-017-unavailable-dark');
  await unavailablePage.close();

  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

test('G3-017 binds nine UI languages, four ready themes and 200 percent reflow', async ({
  context,
  page,
}, info) => {
  test.setTimeout(180_000);
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, state), {
    key: personalizationKey,
    state: readyState,
  });
  await page.goto('/?state=ready#following');
  for (const theme of themes) {
    await page.getByTestId('theme-selector').selectOption(theme);
    await assertGeometry(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await capture(page, info, `g3-017-ready-${theme}`);
  }
  await page.setViewportSize({ width: 600, height: 960 });
  await page.getByTestId('theme-selector').selectOption('dark');
  await assertGeometry(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await capture(page, info, 'g3-017-ready-tablet-dark');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const language of uiLanguageIds) {
    const copy = getUiCopy(language);
    await page.getByTestId('ui-language-selector').selectOption(language);
    await expect(page.getByRole('heading', { name: copy.personalizationTitle })).toBeVisible();
    await capture(page, info, `g3-017-language-${language}`);
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px';
  });
  for (const theme of themes) {
    await page.getByTestId('theme-selector').selectOption(theme);
    await assertGeometry(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await capture(page, info, `g3-017-ready-200pct-${theme}`);
  }
  const noMatch = await context.newPage({ viewport: { width: 600, height: 960 } });
  const noMatchExternal: string[] = [];
  noMatch.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:43173')
      noMatchExternal.push(request.url());
  });
  await noMatch.addInitScript(
    ({ key }) => {
      localStorage.setItem('wrn.mobile-ui-language.v1', 'en');
      localStorage.setItem(
        key,
        JSON.stringify({
          contractVersion: 1,
          schema: 'wrn.local-personalization',
          revision: 'wrn-local-personalization-v1',
          interestIds: [],
          regionIds: ['oceania'],
          contentLanguageIds: [],
        }),
      );
    },
    { key: personalizationKey },
  );
  await noMatch.goto('/?state=ready&theme=light#home');
  await expect(noMatch.getByTestId('manifest-revision')).toBeVisible();
  await noMatch.getByRole('link', { name: 'For me' }).click();
  const noMatchMessage = noMatch.getByText('No validated local articles match this selection.');
  await expect(noMatchMessage).toBeVisible();
  await noMatchMessage.scrollIntoViewIfNeeded();
  await assertGeometry(noMatch);
  expect((await new AxeBuilder({ page: noMatch }).analyze()).violations).toEqual([]);
  await capture(noMatch, info, 'g3-017-ready-no-match-tablet-light');
  expect(noMatchExternal).toEqual([]);
  await noMatch.close();
  const offlineMatching = await context.newPage({ viewport: { width: 390, height: 844 } });
  const offlineMatchingExternal: string[] = [];
  offlineMatching.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:43173')
      offlineMatchingExternal.push(request.url());
  });
  await offlineMatching.addInitScript(({ key, state }) => localStorage.setItem(key, state), {
    key: personalizationKey,
    state: readyState,
  });
  await offlineMatching.goto('/?state=ready&theme=dark#home');
  await expect(offlineMatching.getByTestId('manifest-revision')).toBeVisible();
  await offlineMatching.getByRole('button', { name: 'Offline', exact: true }).click();
  await offlineMatching.getByRole('link', { name: 'For me' }).click();
  await expect(offlineMatching.getByRole('heading', { name: 'For me' })).toBeVisible();
  const offlineArticles = offlineMatching.getByRole('article');
  await expect(offlineArticles).not.toHaveCount(0);
  const offlineNoMatchMessage = offlineMatching.getByText(
    'No validated local articles match this selection.',
  );
  await expect(offlineNoMatchMessage).toHaveCount(0);
  const firstOfflineTrigger = offlineArticles.first().getByRole('button', { name: 'Read article' });
  await firstOfflineTrigger.click();
  await expect(offlineMatching.getByRole('button', { name: 'Back' })).toBeVisible();
  await offlineMatching.getByRole('button', { name: 'Back' }).click();
  await expect(offlineMatching.getByRole('heading', { name: 'For me' })).toBeVisible();
  await expect(offlineMatching.locator('[data-reader-trigger]').first()).toBeFocused();
  await assertGeometry(offlineMatching);
  expect((await new AxeBuilder({ page: offlineMatching }).analyze()).violations).toEqual([]);
  await capture(offlineMatching, info, 'g3-017-offline-dark');
  expect(offlineMatchingExternal).toEqual([]);
  await offlineMatching.close();
  expect(await context.cookies()).toEqual([]);
});
