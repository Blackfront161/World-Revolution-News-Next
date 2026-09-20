import { copyFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { getUiCopy, uiLanguageIds } from '../../packages/ui-language/src';

const viewports = [
  [390, 844],
  [412, 915],
  [600, 960],
  [844, 390],
] as const;
const themes = ['dark', 'light', 'pink', 'contrast'] as const;
const expectedIds = [
  'wrn-test-art-cedar',
  'wrn-test-art-ember',
  'wrn-test-art-fern',
  'wrn-test-art-g3-016-a',
  'wrn-test-art-g3-016-b',
  'wrn-test-art-g3-016-c',
  'wrn-test-art-g3-016-d',
  'wrn-test-art-g3-016-e',
  'wrn-test-art-g3-016-f',
] as const;
const expectedRoles = [
  'lead',
  'main',
  'main',
  'main',
  'main',
  'main',
  'sport-feature',
  'sport-secondary',
  'sport-secondary',
] as const;
const sportIds = [
  'wrn-test-art-g3-016-d',
  'wrn-test-art-g3-016-e',
  'wrn-test-art-g3-016-f',
] as const;
const forbiddenRawCopyKeys = [
  'homeCurrent',
  'homeLead',
  'homeMainStories',
  'sportAndFanculture',
  'allSportNews',
  'sportFootball',
  'sportFanculture',
  'sportWomen',
  'sportNotCurrentTitle',
  'sportNotCurrentDetail',
  'homePlaceholderImage',
] as const;

async function persistCapture(info: TestInfo, name: string, source: string) {
  await info.attach(name, { path: source, contentType: 'image/png' });
  const root = process.env.WRN_EVIDENCE_ROOT;
  if (!root) return;
  const target = resolve(root);
  await mkdir(target, { recursive: true });
  await copyFile(source, join(target, `${process.env.WRN_EVIDENCE_REVISION ?? 'qa'}_${name}.png`));
}

async function capturePage(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await persistCapture(info, name, path);
}

async function captureSegment(page: Page, info: TestInfo, selector: string, name: string) {
  const segment = page.locator(selector);
  await segment.scrollIntoViewIfNeeded();
  await expect(segment).toBeVisible();
  const path = info.outputPath(`${name}.png`);
  await segment.screenshot({ path });
  await persistCapture(info, name, path);
}

async function expectRoles(page: Page) {
  await expect(page.getByTestId('manifest-revision')).toContainText(
    'wrn-g3-016-mobile-home-manifest-v1',
  );
  const articles = page.locator('article[data-home-role]');
  await expect(articles).toHaveCount(9);
  expect(
    await articles.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-article-id')),
    ),
  ).toEqual(expectedIds);
  expect(
    await articles.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-home-role'))),
  ).toEqual(expectedRoles);
  expect(
    new Set(
      await articles.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('data-article-id')),
      ),
    ).size,
  ).toBe(9);
  expect(await page.locator('body').innerText()).not.toMatch(
    new RegExp(`\\b(?:${forbiddenRawCopyKeys.join('|')})\\b`, 'u'),
  );
}

async function expectGeometry(page: Page) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const nav = document.querySelector<HTMLElement>('.mobile-primary-nav');
    const main = document.querySelector<HTMLElement>('#mobile-main');
    const interactive = [
      ...document.querySelectorAll<HTMLElement>('button:enabled, a[href], select'),
    ]
      .filter((node) => {
        const style = getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })
      .map((node) => {
        const bounds = node.getBoundingClientRect();
        return { text: node.innerText, width: bounds.width, height: bounds.height };
      });
    return {
      pageOverflow: root.scrollWidth > root.clientWidth + 1,
      cardOverflow: [...document.querySelectorAll<HTMLElement>('.home-card')].some(
        (card) => card.scrollWidth > card.clientWidth + 1,
      ),
      mainAndNavigationOverlap:
        main !== null &&
        nav !== null &&
        nav.getBoundingClientRect().top < main.getBoundingClientRect().bottom - 1,
      interactive,
    };
  });
  expect(result.pageOverflow).toBe(false);
  expect(result.cardOverflow).toBe(false);
  expect(result.mainAndNavigationOverlap).toBe(false);
  expect(result.interactive.every((control) => control.width >= 44 && control.height >= 44)).toBe(
    true,
  );
}

async function expectReflowFlow(page: Page) {
  await expect(page.locator('.mobile-shell')).toHaveAttribute('data-wide-language-layout', 'true');
  const state = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('.mobile-shell');
    const main = document.querySelector<HTMLElement>('#mobile-main');
    return {
      shellOverflow: shell === null ? null : getComputedStyle(shell).overflowY,
      mainOverflow: main === null ? null : getComputedStyle(main).overflowY,
      hasDocumentScroll: document.documentElement.scrollHeight > window.innerHeight,
    };
  });
  expect(state.shellOverflow).toBe('visible');
  expect(state.mainOverflow).toBe('visible');
  expect(state.hasDocumentScroll).toBe(true);
  for (const selector of [
    '.mobile-header',
    '.home-main-stories',
    '.home-sport',
    '.mobile-primary-nav',
  ]) {
    const item = page.locator(selector);
    await item.scrollIntoViewIfNeeded();
    await expect(item).toBeVisible();
  }
  await expectGeometry(page);
}

function collectRuntimeSignals(page: Page) {
  const external: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:43173') external.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return { external, errors };
}

test.beforeEach(async ({ browserName }, info) => {
  test.skip(browserName !== 'chromium' || info.project.name !== 'mobile-390x844');
});

test('P4 independently verifies the 9-language, 4-theme, 4-viewport home matrix', async ({
  context,
  page,
}, info) => {
  test.setTimeout(600_000);
  const signals = collectRuntimeSignals(page);
  await page.goto('/?state=ready');
  await expectRoles(page);

  for (const language of uiLanguageIds) {
    const copy = getUiCopy(language);
    await page.getByTestId('ui-language-selector').selectOption(language);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.getByRole('heading', { name: copy.sportAndFanculture })).toBeVisible();
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height });
      for (const theme of themes) {
        await page.getByTestId('theme-selector').selectOption(theme);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expectRoles(page);
        await expectGeometry(page);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        if (language !== 'en') continue;
        const suffix = `${width}x${height}-${theme}`;
        await capturePage(page, info, `home-top-${suffix}`);
        await captureSegment(page, info, '.home-main-stories', `home-main-${suffix}`);
        await captureSegment(page, info, '.home-sport', `home-sport-${suffix}`);
      }
    }
  }

  expect(signals.external).toEqual([]);
  expect(signals.errors).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

test('P4 independently verifies all languages and themes at initial and post-mount 200-percent reflow', async ({
  browser,
}, info) => {
  test.setTimeout(300_000);
  for (const language of uiLanguageIds) {
    const copy = getUiCopy(language);
    for (const theme of themes) {
      for (const phase of ['initial', 'after-mount'] as const) {
        const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
        const page = await context.newPage();
        const signals = collectRuntimeSignals(page);
        await page.addInitScript(
          ({ language, phase }) => {
            localStorage.setItem('wrn.mobile-ui-language.v1', language);
            if (phase !== 'initial') return;
            const apply = () => {
              document.documentElement?.style.setProperty('font-size', '32px');
            };
            const observer = new MutationObserver(() => {
              apply();
              observer.disconnect();
            });
            observer.observe(document, { childList: true });
            apply();
          },
          { language, phase },
        );
        await page.goto(`/?state=ready&theme=${theme}`);
        if (phase === 'after-mount') {
          await page.evaluate(() => {
            document.documentElement.style.fontSize = '32px';
          });
        }
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await expect(page.getByRole('heading', { name: copy.sportAndFanculture })).toBeVisible();
        await expectRoles(page);
        await expectReflowFlow(page);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await capturePage(page, info, `home-reflow-${language}-${theme}-${phase}`);
        expect(signals.external).toEqual([]);
        expect(signals.errors).toEqual([]);
        expect(await context.cookies()).toEqual([]);
        await context.close();
      }
    }
  }
});

test('P4 independently verifies reader return focus, saving, Sport Discover, language persistence, and stale Sport', async ({
  context,
  page,
}) => {
  test.setTimeout(180_000);
  const signals = collectRuntimeSignals(page);
  await page.goto('/?state=ready&theme=dark');
  await expectRoles(page);

  for (const role of ['lead', 'main', 'sport-feature'] as const) {
    const card = page.locator(`[data-home-role="${role}"]`).first();
    const trigger = card.locator('[data-reader-trigger]');
    await trigger.click();
    await expect(page).toHaveURL(/#article\//u);
    await expect(page.locator('#mobile-reader-title')).toBeFocused();
    await page.goBack();
    await expect(page).not.toHaveURL(/#article\//u);
    await expect(trigger).toBeFocused();
  }

  const savedCard = page.locator('[data-home-role="sport-secondary"]').first();
  const save = savedCard.getByRole('button', { name: 'Save for later' });
  await save.click();
  await expect(savedCard.getByRole('button', { name: 'Remove from saved' })).toBeVisible();
  await savedCard.getByRole('button', { name: 'Remove from saved' }).click();
  await expect(savedCard.getByRole('button', { name: 'Save for later' })).toBeVisible();

  const sportLink = page.getByRole('link', { name: 'All sport news' });
  await sportLink.click();
  await expect(page).toHaveURL(/#discover$/u);
  await expect(page.locator('.discover-facets select').nth(1)).toHaveValue('Sport');
  await expect(page.locator('article[data-article-id]')).toHaveCount(3);
  expect(
    await page
      .locator('article[data-article-id]')
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.articleId)),
  ).toEqual(sportIds);
  await page.goBack();
  await expect(page).not.toHaveURL(/#discover$/u);
  await expect(page.locator('#mobile-page-title')).toBeFocused();

  await page.getByTestId('ui-language-selector').selectOption('de');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.getByTestId('ui-language-selector')).toHaveValue('de');
  expect(await page.evaluate(() => localStorage.getItem('wrn.mobile-ui-language.v1'))).toBe('de');

  const staleContext = await context
    .browser()!
    .newContext({ viewport: { width: 390, height: 844 } });
  const stalePage = await staleContext.newPage();
  await stalePage.addInitScript(() => {
    Date.now = () => Date.parse('2026-09-07T10:00:01.000Z');
  });
  await stalePage.goto('/?state=ready');
  await expect(stalePage.locator('article[data-home-role]')).toHaveCount(6);
  await expect(stalePage.locator('[data-home-role^="sport-"]')).toHaveCount(0);
  await expect(stalePage.getByText('Sport updates are not current')).toBeVisible();
  await expect(stalePage.getByRole('link', { name: 'All sport news' })).toHaveCount(0);
  await expectGeometry(stalePage);
  await staleContext.close();

  expect(signals.external).toEqual([]);
  expect(signals.errors).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});
