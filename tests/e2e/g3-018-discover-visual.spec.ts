import { copyFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { getUiCopy, uiLanguageIds } from '../../packages/ui-language/src';

const themes = ['dark', 'light', 'pink', 'contrast'] as const;
const baseOrigin = 'http://127.0.0.1:43173';

async function persistCapture(info: TestInfo, name: string, path: string) {
  const root = process.env.WRN_EVIDENCE_ROOT;
  if (!root) return;
  await mkdir(resolve(root), { recursive: true });
  await copyFile(
    path,
    join(resolve(root), `${process.env.WRN_EVIDENCE_REVISION ?? 'local'}_${name}.png`),
  );
  await info.attach(name, { path, contentType: 'image/png' });
}

async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await persistCapture(info, name, path);
}

async function expectDiscoverGeometry(page: Page) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const controls = [
      ...document.querySelectorAll<HTMLElement>(
        '.discover-view button, .discover-view summary, .discover-view select',
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

async function expectNoExternalRequests(page: Page, work: () => Promise<void>) {
  const external: string[] = [];
  const listener = (request: { url: () => string }) => {
    if (new URL(request.url()).origin !== baseOrigin) external.push(request.url());
  };
  page.on('request', listener);
  await work();
  page.off('request', listener);
  expect(external).toEqual([]);
}

test.beforeEach(async ({ browserName }, info) => {
  test.skip(browserName !== 'chromium' || !info.project.name.startsWith('mobile-'));
});

test('G3-018 keeps native filters local, resettable and reader-safe', async ({ page }, info) => {
  test.setTimeout(180_000);
  await page.goto('/?state=ready&theme=dark#discover');
  await expect(page.getByRole('heading', { name: 'Discover', exact: true })).toBeFocused();
  const details = page.locator('.discover-facets');
  const summary = details.locator('summary');
  const search = page.getByRole('searchbox', { name: 'Search news' });
  await expect(details).not.toHaveAttribute('open', '');
  await expect(summary).toContainText('Filters (0)');

  await expectNoExternalRequests(page, async () => {
    await search.fill('responsive');
    await expect(summary).toContainText('Filters (1)');
    await summary.click();
    await expect(details).toHaveAttribute('open', '');
    await page.getByLabel('Format').selectOption('analysis');
    await expect(summary).toContainText('Filters (2)');
    await expect(page.getByRole('status')).toContainText('1 result');
    await summary.click();
    await expect(details).not.toHaveAttribute('open', '');
  });
  await expect(page.getByRole('button', { name: 'Remove Format: analysis' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset all filters' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove Format: analysis' }).click();
  await expect(page.getByRole('button', { name: 'Remove Search news: responsive' })).toBeFocused();

  const reader = page.getByRole('button', { name: 'Read article' });
  await reader.click();
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(reader).toBeFocused();
  await page.getByRole('button', { name: 'Save for later' }).click();
  await expect(page.getByRole('button', { name: 'Save for later' })).toBeVisible();

  await page.getByRole('button', { name: 'Reset all filters' }).click();
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
  await expect(summary).toContainText('Filters (0)');
  await expectDiscoverGeometry(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await capture(page, info, 'g3-018-ready-active-dark');
});

test('G3-018 keeps empty, loading, error, offline and no-result states honest', async ({
  context,
  page,
}, info) => {
  test.setTimeout(180_000);
  await page.goto('/?state=ready&theme=light#discover');
  const search = page.getByRole('searchbox', { name: 'Search news' });
  await search.fill('no local match');
  await expect(page.getByRole('heading', { name: 'No results', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset all filters' })).toBeVisible();
  await expect(page.locator('.discover-facets')).not.toHaveAttribute('open', '');
  await expectDiscoverGeometry(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await capture(page, info, 'g3-018-no-results-light');

  for (const [state, expected, hasResults] of [
    ['offline', 'Offline: the validated local fixture remains usable.', true],
    ['loading', 'The local news fixture is being prepared.', false],
    ['empty', 'The local fixture contains no articles in this test state.', false],
    ['error', 'The local fixture could not be displayed safely.', false],
  ] as const) {
    await page.goto(`/?state=${state}&theme=contrast#discover`);
    await expect(page.getByRole('heading', { name: 'Discover', exact: true })).toBeVisible();
    await expect(page.getByText(expected, { exact: false })).toBeVisible();
    if (hasResults) await expect(page.locator('article[data-article-id]')).not.toHaveCount(0);
    else await expect(page.locator('article[data-article-id]')).toHaveCount(0);
    await expectDiscoverGeometry(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await capture(page, info, `g3-018-${state}-contrast`);
  }

  const readOnly = await context.newPage();
  await readOnly.setViewportSize({ width: 390, height: 844 });
  await readOnly.addInitScript(() => {
    localStorage.setItem('wrn.mobile-local-reading-state.v1', '{future reading state');
  });
  await readOnly.goto('/?state=ready&theme=dark#discover');
  await expect(readOnly.getByRole('button', { name: 'Save for later' }).first()).toBeDisabled();
  await expect(readOnly.getByRole('button', { name: 'Read article' }).first()).toBeEnabled();
  await expectDiscoverGeometry(readOnly);
  expect((await new AxeBuilder({ page: readOnly }).analyze()).violations).toEqual([]);
  await capture(readOnly, info, 'g3-018-read-only-dark');
  await readOnly.close();
});

test('G3-018 covers nine languages, four themes and responsive discover reflow', async ({
  page,
}, info) => {
  test.setTimeout(180_000);
  await page.goto('/?state=ready#discover');
  const summary = page.locator('.discover-facets summary');
  for (const theme of themes) {
    await page.getByTestId('theme-selector').selectOption(theme);
    await expectDiscoverGeometry(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await capture(page, info, `g3-018-ready-${theme}`);
  }
  for (const language of uiLanguageIds) {
    const copy = getUiCopy(language);
    await page.getByTestId('ui-language-selector').selectOption(language);
    await expect(page.getByRole('heading', { name: copy.discover, exact: true })).toBeVisible();
    await expect(summary).toContainText('0');
    await expectDiscoverGeometry(page);
    await capture(page, info, `g3-018-language-${language}`);
  }
  await page.setViewportSize({ width: 600, height: 960 });
  await page.getByTestId('theme-selector').selectOption('dark');
  await expectDiscoverGeometry(page);
  await capture(page, info, 'g3-018-tablet-dark');

  await page.setViewportSize({ width: 844, height: 390 });
  await expectDiscoverGeometry(page);
  await capture(page, info, 'g3-018-landscape-dark');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px';
  });
  for (const theme of themes) {
    await page.getByTestId('theme-selector').selectOption(theme);
    await expectDiscoverGeometry(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await capture(page, info, `g3-018-200pct-${theme}`);
  }
  await summary.focus();
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.discover-facets')).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  expect(await page.context().cookies()).toEqual([]);
});
