import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

const localizedThemeLabels = {
  en: ['Violet/Red', 'Red/Cyan'],
  de: ['Violett/Rot', 'Rot/Cyan'],
  es: ['Violeta/Rojo', 'Rojo/Cian'],
  fr: ['Violet/Rouge', 'Rouge/Cyan'],
  it: ['Viola/Rosso', 'Rosso/Ciano'],
  pt: ['Violeta/Vermelho', 'Vermelho/Ciano'],
  ru: ['Фиолетовый/Красный', 'Красный/Голубой'],
  el: ['Μωβ/Κόκκινο', 'Κόκκινο/Κυανό'],
  tr: ['Mor/Kırmızı', 'Kırmızı/Camgöbeği'],
} as const;

const themePreferences = ['violet', 'dark', 'oled', 'soft', 'pink', 'light', 'contrast'] as const;

function contrastRatio(first: readonly number[], second: readonly number[]) {
  const luminance = (channels: readonly number[]) => {
    const linear = channels.map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
  };
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbChannels(value: string) {
  const match = value.match(/\d+(?:\.\d+)?/gu);
  if (match === null || match.length < 3) throw new Error(`Expected an RGB colour, got ${value}.`);
  return match.slice(0, 3).map(Number);
}

async function capture(page: Page, name: string, outputDirectory: string) {
  await page.screenshot({ path: path.join(outputDirectory, `${name}.png`), fullPage: true });
}

async function expectThemeLabelFits(page: Page, label: string) {
  const value = page.getByTestId('theme-current-value');
  await expect(value).toBeVisible();
  await expect(value).toHaveText(label);
  const rendered = await value.evaluate((element) => {
    const select = document.querySelector<HTMLSelectElement>('[data-testid="theme-selector"]');
    if (!select) throw new Error('Native theme select missing');
    const control = select.getBoundingClientRect();
    const valueBox = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const range = document.createRange();
    range.selectNodeContents(element);
    return {
      fontSize: Number.parseFloat(style.fontSize),
      controlHeight: control.height,
      valueHeight: valueBox.height,
      linesFit: Array.from(range.getClientRects()).every(
        (line) =>
          line.left >= control.left + Number.parseFloat(style.paddingLeft) - 1 &&
          line.right <= control.right - Number.parseFloat(style.paddingRight) + 1 &&
          line.top >= control.top &&
          line.bottom <= control.bottom,
      ),
    };
  });
  expect(rendered.linesFit, `Full visible theme name fits: ${label}`).toBe(true);
  expect(rendered.controlHeight).toBeGreaterThanOrEqual(rendered.valueHeight);
  return rendered.fontSize;
}

async function expectTouchTargets(page: Page, selector: string) {
  await expect(page.locator(selector).first()).toBeVisible();
  for (const target of await page.locator(selector).all()) {
    const box = await target.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
}

test('violet/red themes preserve preferences, localized labels, and red control states', async ({
  page,
}, testInfo) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(testInfo.project.name));
  const isMobile = testInfo.project.name.startsWith('mobile-');
  const baseUrl = isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43174';
  const navigationSelector = isMobile ? '.mobile-primary-nav a' : '.site-nav a';

  await page.goto(`${baseUrl}/?state=ready`);
  const themeSelector = page.getByTestId('theme-selector');
  const languageSelector = page.getByTestId('ui-language-selector');
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'violet');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'violet');
  await expect(themeSelector.locator('option')).toHaveCount(8);

  for (const preference of themePreferences) {
    await themeSelector.selectOption(preference);
    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', preference);
    await expect(page.locator('html')).toHaveAttribute('data-theme', preference);
    const palette = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const color = (value: string) => {
        const sample = document.createElement('span');
        sample.style.color = value;
        document.body.append(sample);
        const result = getComputedStyle(sample).color;
        sample.remove();
        return result;
      };
      return {
        action: color(root.getPropertyValue('--wrn-color-action').trim()),
        actionContrast: color(root.getPropertyValue('--wrn-color-action-contrast').trim()),
        raised: color(root.getPropertyValue('--wrn-color-surface-raised').trim()),
      };
    });
    expect(
      contrastRatio(rgbChannels(palette.action), rgbChannels(palette.raised)),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(rgbChannels(palette.actionContrast), rgbChannels(palette.action)),
    ).toBeGreaterThanOrEqual(4.5);
    await capture(page, `${testInfo.project.name}-theme-${preference}`, testInfo.outputDir);
  }

  await page.emulateMedia({ colorScheme: 'light' });
  await themeSelector.selectOption('system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await capture(page, `${testInfo.project.name}-theme-system-light`, testInfo.outputDir);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await themeSelector.selectOption('dark');
  await page.reload();
  await expect(themeSelector).toHaveValue('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  for (const [language, [violet, redCyan]] of Object.entries(localizedThemeLabels)) {
    await languageSelector.selectOption(language);
    await themeSelector.selectOption('violet');
    await expect(themeSelector.locator('option[value="violet"]')).toHaveText(violet);
    await expect(themeSelector.locator('option[value="dark"]')).toHaveText(redCyan);
    const normalSize = await expectThemeLabelFits(page, violet);
    await capture(page, `${testInfo.project.name}-language-${language}`, testInfo.outputDir);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(await expectThemeLabelFits(page, violet)).toBeGreaterThanOrEqual(normalSize * 2);
    await capture(page, `${testInfo.project.name}-language-${language}-200pct`, testInfo.outputDir);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
  }

  await themeSelector.focus();
  await themeSelector.press('Space');
  await themeSelector.press('ArrowDown');
  await themeSelector.press('Enter');
  await expect(themeSelector).toHaveValue('dark');
  await expectThemeLabelFits(page, localizedThemeLabels.tr[1]);
  await themeSelector.selectOption('violet');
  await page.emulateMedia({ forcedColors: 'active' });
  await expectThemeLabelFits(page, localizedThemeLabels.tr[0]);
  await page.emulateMedia({ forcedColors: 'none' });

  await page.goto(`${baseUrl}/?state=offline&theme=violet`);
  const activeState = page.locator('.state-controls button[aria-pressed="true"]');
  const inactiveState = page.locator('.state-controls button[aria-pressed="false"]').first();
  await expect(activeState).toHaveCount(1);
  await expect(inactiveState).toBeVisible();
  const selectedNavigation = page.locator(`${navigationSelector}[aria-current="page"]`).first();
  await expect(selectedNavigation).toBeVisible();

  const controls = await page.evaluate(() => {
    const selectedState = document.querySelector<HTMLElement>(
      '.state-controls button[aria-pressed="true"]',
    );
    const inactiveState = document.querySelector<HTMLElement>(
      '.state-controls button[aria-pressed="false"]',
    );
    const selectedNavigation = document.querySelector<HTMLElement>(
      '.mobile-primary-nav a[aria-current="page"], .site-nav a[aria-current="page"]',
    );
    if (selectedState === null || inactiveState === null || selectedNavigation === null)
      throw new Error('Expected selected and inactive controls are missing.');
    const color = (value: string) => {
      const sample = document.createElement('span');
      sample.style.color = value;
      document.body.append(sample);
      const result = getComputedStyle(sample).color;
      sample.remove();
      return result;
    };
    const measure = (element: HTMLElement) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        border: style.borderTopColor,
        color: style.color,
      };
    };
    return {
      action: color(
        getComputedStyle(document.documentElement).getPropertyValue('--wrn-color-action').trim(),
      ),
      actionContrast: color(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--wrn-color-action-contrast')
          .trim(),
      ),
      raised: color(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--wrn-color-surface-raised')
          .trim(),
      ),
      inactive: measure(inactiveState),
      selectedState: measure(selectedState),
      selectedNavigation: measure(selectedNavigation),
    };
  });
  expect(rgbChannels(controls.inactive.border)).toEqual(rgbChannels(controls.action));
  expect(rgbChannels(controls.inactive.background)).not.toEqual(rgbChannels(controls.action));
  expect(
    contrastRatio(rgbChannels(controls.inactive.border), rgbChannels(controls.raised)),
  ).toBeGreaterThanOrEqual(3);
  for (const selected of [controls.selectedState, controls.selectedNavigation]) {
    expect(rgbChannels(selected.background)).toEqual(rgbChannels(controls.action));
    expect(rgbChannels(selected.color)).toEqual(rgbChannels(controls.actionContrast));
    expect(
      contrastRatio(rgbChannels(selected.color), rgbChannels(selected.background)),
    ).toBeGreaterThanOrEqual(4.5);
  }

  await inactiveState.focus();
  const focus = await inactiveState.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.outlineColor, style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(focus.style).not.toBe('none');
  expect(Number.parseFloat(focus.width)).toBeGreaterThanOrEqual(3);
  expect(
    contrastRatio(rgbChannels(focus.color), rgbChannels(controls.raised)),
  ).toBeGreaterThanOrEqual(3);

  if (isMobile) {
    await languageSelector.selectOption('en');
    await page.goto(`${baseUrl}/?state=ready&theme=violet#discover/sport`);
    const sport = page.locator('.content-directory button[aria-current="page"]');
    const news = page.locator('.content-directory button:not([aria-current])').first();
    await expect(sport).toHaveCount(1);
    await expect(news).toBeVisible();
    const directoryNavigation = await page.evaluate(() => {
      const sport = document.querySelector<HTMLElement>(
        '.content-directory button[aria-current="page"]',
      );
      const news = document.querySelector<HTMLElement>(
        '.content-directory button:not([aria-current])',
      );
      if (sport === null || news === null)
        throw new Error('Directory selection controls are missing.');
      const style = (element: HTMLElement) => {
        const computed = getComputedStyle(element);
        return { background: computed.backgroundColor, border: computed.borderTopColor };
      };
      return { sport: style(sport), news: style(news) };
    });
    expect(rgbChannels(directoryNavigation.sport.background)).toEqual(rgbChannels(controls.action));
    expect(rgbChannels(directoryNavigation.news.border)).toEqual(rgbChannels(controls.action));

    await page.goto(`${baseUrl}/?state=ready&theme=violet#knowledge`);
    const selectedKnowledgeTab = page.locator('.knowledge-tabs button[aria-pressed="true"]');
    const inactiveKnowledgeTab = page.locator('.knowledge-tabs button[aria-pressed="false"]');
    await expect(selectedKnowledgeTab).toHaveCount(1);
    await expect(inactiveKnowledgeTab).toHaveCount(1);
    const knowledgeTabs = await page.evaluate(() => {
      const selected = document.querySelector<HTMLElement>(
        '.knowledge-tabs button[aria-pressed="true"]',
      );
      const inactive = document.querySelector<HTMLElement>(
        '.knowledge-tabs button[aria-pressed="false"]',
      );
      if (selected === null || inactive === null) throw new Error('Knowledge tabs are missing.');
      return {
        selected: getComputedStyle(selected).backgroundColor,
        inactive: getComputedStyle(inactive).backgroundColor,
      };
    });
    expect(rgbChannels(knowledgeTabs.selected)).toEqual(rgbChannels(controls.action));
    expect(rgbChannels(knowledgeTabs.inactive)).not.toEqual(rgbChannels(controls.action));
    await expectTouchTargets(page, '.knowledge-links a');
    await page.goto(`${baseUrl}/?theme=violet#solidarity`);
    await expectTouchTargets(page, '.support-letter select');
    await page.locator('.support-card details > summary').first().click();
    await expectTouchTargets(page, '.support-card a:visible');
    await page.goto(`${baseUrl}/?theme=violet#knowledge`);
    await expect(page.locator('.knowledge-tabs')).toBeVisible();
  }

  for (const viewport of (isMobile
    ? [
        [320, 568],
        [360, 800],
        [390, 844],
        [412, 915],
        [600, 960],
        [800, 1280],
        [844, 390],
      ]
    : [
        [1024, 800],
        [1280, 800],
        [1440, 900],
        [1920, 1080],
      ]) as readonly (readonly [number, number])[]) {
    await page.setViewportSize({ width: viewport[0], height: viewport[1] });
    await capture(
      page,
      `${testInfo.project.name}-${viewport[0]}x${viewport[1]}`,
      testInfo.outputDir,
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await capture(page, `${testInfo.project.name}-reflow-200pct`, testInfo.outputDir);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
});

test('blocked theme storage fails closed to violet without disabling the local preview', async ({
  page,
}, testInfo) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(testInfo.project.name));
  const baseUrl = testInfo.project.name.startsWith('mobile-')
    ? 'http://127.0.0.1:43173'
    : 'http://127.0.0.1:43174';

  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', {
      configurable: true,
      value: () => {
        throw new DOMException('Storage access is blocked.', 'SecurityError');
      },
    });
  });
  await page.goto(`${baseUrl}/?state=ready`);
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'violet');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'violet');
  await expect(page.getByTestId('theme-selector')).toHaveValue('violet');
  await expect(page.getByTestId('manifest-revision')).toBeVisible();
});
