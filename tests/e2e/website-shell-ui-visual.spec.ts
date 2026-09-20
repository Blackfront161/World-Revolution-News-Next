import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { getUiCopy, type UiCopy } from '../../packages/ui-language/src';

// A normal root run must not need a special environment variable. Its process-bound
// fallback is unique; the evidence manifest binds the produced directory to its HEAD.
const revision = process.env.WRN_G3_015_UI_REVISION ?? `auto-${process.pid}-${Date.now()}`;

const evidenceDirectory = process.env.WRN_G3_015_P3_RUN_DIRECTORY
  ? path.resolve(process.env.WRN_G3_015_P3_RUN_DIRECTORY, 'screenshots')
  : path.resolve(`docs/evidence/WRN-G3-015/p3/visual-${revision}`);
const viewports = [
  [320, 568],
  [360, 800],
  [390, 844],
  [412, 915],
  [844, 390],
  [600, 960],
  [800, 1280],
  [1024, 768],
  [1024, 800],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
] as const;
const themes = ['dark', 'light', 'pink', 'contrast'] as const;
const languages = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const;

async function expectCompletedSnapshot(page: Page) {
  await expect(page.locator('.website-shell-panel')).toHaveAttribute(
    'data-shell-status',
    /^(saved|active|waiting)$/,
  );
}

async function enableThroughVisibleUi(page: Page, copy: UiCopy) {
  const panel = page.locator('.website-shell-panel');
  await expect(panel).toBeVisible();
  await expect(
    panel.getByRole('heading', { name: copy.websiteShellTitle, exact: true }),
  ).toBeVisible();
  const status = await panel.getAttribute('data-shell-status');
  if (status === 'uncontrolled' || status === 'removed') {
    await page.getByRole('button', { name: copy.websiteShellEnable, exact: true }).click();
  }
  await expectCompletedSnapshot(page);
  await expect(
    page.getByRole('button', { name: copy.websiteShellRemove, exact: true }),
  ).toBeVisible();
}

async function assertViewportQuality(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  const actionBoxes = await page
    .locator(
      '.website-shell-actions button:visible, .content-offline-actions button:visible, .site-nav a:visible, .site-nav .site-more-button:visible, .site-more-menu a:visible, .site-header-preferences select:visible',
    )
    .evaluateAll((buttons) =>
      buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        return { height: rect.height, width: rect.width };
      }),
    );
  expect(actionBoxes.length).toBeGreaterThan(0);
  for (const box of actionBoxes) {
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }
}

async function assertV3HeaderAndNormalActionRoles(page: Page, theme: (typeof themes)[number]) {
  const roles = await page.evaluate(() => {
    const resolveColor = (variable: string) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${variable})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const read = (selector: string) => {
      const element = [...document.querySelectorAll<HTMLElement>(selector)].find(
        (candidate) => candidate.getClientRects().length > 0,
      );
      if (element === null) throw new Error(`Missing V3 control: ${selector}`);
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      return {
        backgroundColor: style.backgroundColor,
        borderInlineStartColor: style.borderInlineStartColor,
        borderBottomColor: style.borderBottomColor,
        borderRadius: style.borderRadius,
        color: style.color,
        fontWeight: style.fontWeight,
        height: bounds.height,
        width: bounds.width,
      };
    };
    return {
      magenta: resolveColor('--wrn-color-accent-magenta'),
      cyan: resolveColor('--wrn-color-accent-cyan'),
      surface: resolveColor('--wrn-color-surface-raised'),
      controlSurface: resolveColor('--wrn-website-control-surface'),
      normalAction: read('.website-shell-actions button'),
      activeNavigation: read('.site-nav [aria-current="page"]'),
      language: read('.language-selector select'),
      systemPanel: read('.website-shell-panel'),
      theme: read('.theme-selector select'),
    };
  });

  const expectedPinkRoles = {
    buttonText: 'rgb(155, 130, 255)',
    cyan: 'rgb(84, 229, 242)',
    controlSurface: 'rgb(36, 11, 25)',
    magenta: 'rgb(255, 90, 120)',
  };
  const expectedCyan = theme === 'pink' ? expectedPinkRoles.cyan : roles.cyan;
  const expectedMagenta = theme === 'pink' ? expectedPinkRoles.magenta : roles.magenta;
  const expectedButtonText = theme === 'pink' ? expectedPinkRoles.buttonText : expectedMagenta;
  const expectedControlSurface =
    theme === 'pink' ? expectedPinkRoles.controlSurface : roles.surface;

  expect(roles.normalAction.borderBottomColor).toBe(expectedMagenta);
  expect(roles.normalAction.backgroundColor).toBe(expectedControlSurface);
  expect(roles.normalAction.color).toBe(expectedButtonText);
  expect(roles.activeNavigation.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(roles.activeNavigation.borderRadius).not.toBe('999px');
  expect(roles.activeNavigation.borderBottomColor).toBe(expectedMagenta);
  expect(Number(roles.activeNavigation.fontWeight)).toBeGreaterThanOrEqual(800);
  expect(roles.language.borderBottomColor).toBe(expectedCyan);
  expect(roles.language.backgroundColor).toBe(expectedControlSurface);
  expect(roles.theme.borderBottomColor).toBe(expectedCyan);
  expect(roles.theme.backgroundColor).toBe(expectedControlSurface);
  expect(roles.systemPanel.borderInlineStartColor).toBe(expectedCyan);
  for (const control of [roles.normalAction, roles.activeNavigation, roles.language, roles.theme]) {
    expect(control.height).toBeGreaterThanOrEqual(44);
    expect(control.width).toBeGreaterThanOrEqual(44);
  }
}

async function assertPinkInactiveButtonText(page: Page) {
  const controls = await page
    .locator(
      '.website-shell-actions button:visible, .content-offline-actions button:not(:first-child):visible',
    )
    .evaluateAll((buttons) =>
      buttons.map((button) => {
        const style = getComputedStyle(button);
        return {
          backgroundColor: style.backgroundColor,
          borderColor: style.borderBottomColor,
          color: style.color,
        };
      }),
    );
  expect(controls.length).toBeGreaterThanOrEqual(3);
  for (const control of controls) {
    expect(control.backgroundColor).toBe('rgb(36, 11, 25)');
    expect(control.borderColor).toBe('rgb(255, 90, 120)');
    expect(control.color).toBe('rgb(155, 130, 255)');
  }
}

async function capturePinkPointerActiveButton(page: Page, stem: string) {
  const button = page.locator('.website-shell-actions button').first();
  const bounds = await button.boundingBox();
  if (bounds === null) throw new Error('Missing visible Pink action button bounds.');
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  try {
    const pressed = await button.evaluate((element) => {
      const style = getComputedStyle(element);
      return { backgroundColor: style.backgroundColor, color: style.color };
    });
    expect(pressed.backgroundColor).toBe('rgb(155, 130, 255)');
    expect(pressed.color).toBe('rgb(36, 0, 18)');
    await page.screenshot({
      path: path.join(evidenceDirectory, `${stem}-pressed.png`),
      fullPage: true,
    });
  } finally {
    await page.mouse.up();
  }
  await expect
    .poll(() => button.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe('rgb(36, 11, 25)');
}

async function assertV3ActiveActionRole(page: Page, theme: (typeof themes)[number]) {
  const action = await page
    .locator('.state-controls button[aria-pressed="true"]')
    .evaluate((button) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--wrn-color-accent-magenta)';
      document.body.append(probe);
      const magenta = getComputedStyle(probe).color;
      probe.remove();
      const bounds = button.getBoundingClientRect();
      return {
        backgroundColor: getComputedStyle(button).backgroundColor,
        color: getComputedStyle(button).color,
        height: bounds.height,
        magenta,
        width: bounds.width,
      };
    });
  expect(action.backgroundColor).toBe(theme === 'pink' ? 'rgb(155, 130, 255)' : action.magenta);
  if (theme === 'pink') expect(action.color).toBe('rgb(36, 0, 18)');
  expect(action.height).toBeGreaterThanOrEqual(44);
  expect(action.width).toBeGreaterThanOrEqual(44);
}

async function assertV3ReaderStripe(page: Page, theme: (typeof themes)[number]) {
  const readerStripe = await page.locator('.reader-source').evaluate((source) => {
    const style = getComputedStyle(source);
    const marker = getComputedStyle(source, '::before');
    return {
      borderInlineStartColor: style.borderInlineStartColor,
      markerBackgroundImage: marker.backgroundImage,
      markerContent: marker.content,
    };
  });
  if (theme === 'contrast') {
    expect(readerStripe.markerContent).toBe('none');
    expect(readerStripe.borderInlineStartColor).not.toBe('rgba(0, 0, 0, 0)');
  } else {
    expect(readerStripe.markerContent).not.toBe('none');
    expect(readerStripe.markerBackgroundImage).toContain('linear-gradient');
    if (theme === 'pink') {
      expect(readerStripe.markerBackgroundImage).toContain('rgb(84, 229, 242)');
      expect(readerStripe.markerBackgroundImage).toContain('rgb(255, 90, 120)');
    }
  }
}

async function assertBrandPresentation(page: Page, width: number, theme: (typeof themes)[number]) {
  const markWidth = await page
    .locator('.site-brand-mark')
    .evaluate((mark) => Math.round(mark.getBoundingClientRect().width));
  if (width < 768) {
    expect(markWidth).toBeGreaterThanOrEqual(72);
    expect(markWidth).toBeLessThanOrEqual(94);
  } else if (width < 1024) {
    expect(markWidth).toBeGreaterThanOrEqual(80);
    expect(markWidth).toBeLessThanOrEqual(94);
  } else {
    expect(markWidth).toBeGreaterThanOrEqual(56);
    expect(markWidth).toBeLessThanOrEqual(64);
  }

  const shellBackground = await page
    .locator('.website-shell')
    .evaluate((shell) => getComputedStyle(shell).backgroundImage);
  if (theme === 'contrast') {
    expect(shellBackground).toBe('none');
  } else {
    expect(shellBackground).not.toBe('none');
  }
}

async function capturePanelAndDialog(
  page: Page,
  copy: UiCopy,
  stem: string,
  includeViewportDialog = false,
) {
  await page.screenshot({
    path: path.join(evidenceDirectory, `${stem}-panel.png`),
    fullPage: true,
  });
  expect(
    (await new AxeBuilder({ page }).include('.website-shell-panel').analyze()).violations,
  ).toEqual([]);
  const panelRemove = page
    .locator('.website-shell-panel')
    .getByRole('button', { name: copy.websiteShellRemove, exact: true });
  await panelRemove.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#root')).toHaveJSProperty('inert', true);
  const cancel = dialog.getByRole('button', { name: copy.cancel, exact: true });
  const confirmRemove = dialog.getByRole('button', { name: copy.websiteShellRemove, exact: true });
  await expect(cancel).toBeFocused();
  await expect(dialog).toContainText(copy.websiteShellScope);
  const dialogBoxes = await dialog.locator('button').evaluateAll((buttons) =>
    buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return { height: rect.height, width: rect.width };
    }),
  );
  expect(dialogBoxes.every((box) => box.height >= 44 && box.width >= 44)).toBe(true);
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press('Tab');
  await expect(confirmRemove).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(confirmRemove).toBeFocused();
  await page.screenshot({
    path: path.join(evidenceDirectory, `${stem}-dialog.png`),
    fullPage: true,
  });
  if (includeViewportDialog) {
    await page.screenshot({
      path: path.join(evidenceDirectory, `${stem}-dialog-viewport.png`),
      fullPage: false,
    });
  }
  expect((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations).toEqual(
    [],
  );
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(panelRemove).toBeFocused();
  await expect(page.locator('#root')).toHaveJSProperty('inert', false);
}

async function verifyNormalPage(
  page: Page,
  width: number,
  height: number,
  theme: (typeof themes)[number],
) {
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).fontSize))
    .toBe('16px');
  await expect
    .poll(() => page.evaluate(() => [window.innerWidth, window.innerHeight]))
    .toEqual([width, height]);
}

async function verifyLocaleThemeAndFont(
  page: Page,
  language: (typeof languages)[number],
  theme: (typeof themes)[number],
) {
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.getByTestId('ui-language-selector')).toHaveValue(language);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).fontSize))
    .toBe('32px');
  const languageCodes = await page
    .getByTestId('ui-language-selector')
    .locator('option')
    .evaluateAll((options) => options.map((option) => option.textContent?.trim()));
  expect(languageCodes).toEqual(['EN', 'DE', 'ES', 'FR', 'IT', 'PT', 'RU', 'EL', 'TR']);
}

async function setPreMountState(page: Page, language: string, initialReflow: boolean) {
  await page.addInitScript(
    ({ selectedLanguage, applyInitialReflow }) => {
      if (selectedLanguage) localStorage.setItem('wrn.website-ui-language.v1', selectedLanguage);
      if (!applyInitialReflow) return;
      const observer = new MutationObserver(() => {
        if (document.documentElement) {
          document.documentElement.style.fontSize = '32px';
          observer.disconnect();
        }
      });
      observer.observe(document, { childList: true });
      if (document.documentElement) {
        document.documentElement.style.fontSize = '32px';
        observer.disconnect();
      }
    },
    { selectedLanguage: language, applyInitialReflow: initialReflow },
  );
}

async function openIsolatedContext(browser: Browser) {
  return browser.newContext({ viewport: { width: 390, height: 844 } });
}

test('P3 captures 48 normal and 72 real reflow website-shell panel and dialog cases', async ({
  browser,
  browserName,
}, info) => {
  test.skip(
    browserName !== 'chromium' || info.project.name !== 'website-390x844',
    'One serial built visual matrix; no mobile panel exists.',
  );
  test.setTimeout(720_000);
  await mkdir(evidenceDirectory, { recursive: true });

  const normalContext = await openIsolatedContext(browser);
  try {
    const page = await normalContext.newPage();
    const copy = getUiCopy('en');
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height });
      for (const theme of themes) {
        await page.goto(`/?state=ready&theme=${theme}#more`);
        await enableThroughVisibleUi(page, copy);
        await verifyNormalPage(page, width, height, theme);
        await assertViewportQuality(page);
        await assertBrandPresentation(page, width, theme);
        await capturePanelAndDialog(page, copy, `normal-${width}x${height}-${theme}`);
        await assertV3HeaderAndNormalActionRoles(page, theme);
        if (width === 390 && height === 844) {
          await page.goto(`/?state=ready&theme=${theme}#home`);
          await page.locator('.state-controls button[aria-pressed="true"]').waitFor();
          await assertV3ActiveActionRole(page, theme);
          await page.getByRole('button', { name: copy.readArticle, exact: true }).first().click();
          await expect(page.locator('.reader-source')).toBeVisible();
          await assertV3ReaderStripe(page, theme);
          await page.screenshot({
            path: path.join(evidenceDirectory, `v3-reader-390x844-${theme}.png`),
            fullPage: true,
          });
        }
      }
    }
  } finally {
    await normalContext.close();
  }

  const reflowContext = await openIsolatedContext(browser);
  try {
    for (const language of languages) {
      for (const theme of themes) {
        for (const order of ['initial', 'after-mount'] as const) {
          const page = await reflowContext.newPage();
          const copy = getUiCopy(language);
          try {
            await setPreMountState(page, language, order === 'initial');
            await page.goto(`/?state=ready&theme=${theme}#more`);
            await expect(page.locator('.website-shell-panel')).toBeVisible();
            if (order === 'after-mount') {
              await expect
                .poll(() =>
                  page.evaluate(() => getComputedStyle(document.documentElement).fontSize),
                )
                .toBe('16px');
              await page.evaluate(() => {
                document.documentElement.style.fontSize = '32px';
              });
            }
            await enableThroughVisibleUi(page, copy);
            await verifyLocaleThemeAndFont(page, language, theme);
            await assertViewportQuality(page);
            await assertV3HeaderAndNormalActionRoles(page, theme);
            await assertBrandPresentation(page, 390, theme);
            await capturePanelAndDialog(page, copy, `reflow-${language}-${theme}-${order}`, true);
          } finally {
            await page.close();
          }
        }
      }
    }
  } finally {
    await reflowContext.close();
  }
});

test('V3-R2 keeps Pink controls on the dark signed-app surface', async ({
  browser,
  browserName,
}, info) => {
  test.skip(
    browserName !== 'chromium' || info.project.name !== 'website-390x844',
    'One targeted built website review; no mobile panel exists.',
  );
  test.setTimeout(180_000);
  await mkdir(evidenceDirectory, { recursive: true });

  const context = await openIsolatedContext(browser);
  try {
    const page = await context.newPage();
    const copy = getUiCopy('en');

    for (const [width, height] of [
      [390, 844],
      [1440, 900],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto('/?state=ready&theme=pink#more');
      await enableThroughVisibleUi(page, copy);
      await verifyNormalPage(page, width, height, 'pink');
      await assertViewportQuality(page);
      await assertBrandPresentation(page, width, 'pink');
      await assertV3HeaderAndNormalActionRoles(page, 'pink');
      await capturePanelAndDialog(page, copy, `r2-${width}x${height}-pink`);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?state=ready&theme=pink#home');
    await page.locator('.state-controls button[aria-pressed="true"]').waitFor();
    await assertV3ActiveActionRole(page, 'pink');
    await page.getByRole('button', { name: copy.readArticle, exact: true }).first().click();
    await expect(page.locator('.reader-source')).toBeVisible();
    await assertV3ReaderStripe(page, 'pink');
    await page.screenshot({
      path: path.join(evidenceDirectory, 'r2-reader-390x844-pink.png'),
      fullPage: true,
    });

    await page.goto('/?state=ready&theme=pink#more');
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).fontSize))
      .toBe('16px');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '32px';
    });
    await enableThroughVisibleUi(page, copy);
    await verifyLocaleThemeAndFont(page, 'en', 'pink');
    await assertViewportQuality(page);
    await assertV3HeaderAndNormalActionRoles(page, 'pink');
    await page.screenshot({
      path: path.join(evidenceDirectory, 'r2-reflow-en-pink-panel.png'),
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});

test('V3-R4 fills Pink action buttons violet only while pressed', async ({
  browser,
  browserName,
}, info) => {
  test.skip(
    browserName !== 'chromium' || info.project.name !== 'website-390x844',
    'One targeted built website review; no mobile panel exists.',
  );
  test.setTimeout(180_000);
  await mkdir(evidenceDirectory, { recursive: true });

  const context = await openIsolatedContext(browser);
  try {
    const page = await context.newPage();
    const copy = getUiCopy('en');

    for (const [width, height] of [
      [390, 844],
      [1440, 900],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto('/?state=ready&theme=pink#more');
      await enableThroughVisibleUi(page, copy);
      await verifyNormalPage(page, width, height, 'pink');
      await assertViewportQuality(page);
      await assertV3HeaderAndNormalActionRoles(page, 'pink');
      await assertPinkInactiveButtonText(page);
      expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
      const firstVioletButton = page.locator('.website-shell-actions button').first();
      await firstVioletButton.focus();
      await expect(firstVioletButton).toBeFocused();
      await capturePinkPointerActiveButton(page, `r4-${width}x${height}-pink-buttons`);
      if (width === 390) {
        await capturePanelAndDialog(page, copy, `r4-${width}x${height}-pink-buttons`);
      } else {
        await page.screenshot({
          path: path.join(evidenceDirectory, `r4-${width}x${height}-pink-buttons.png`),
          fullPage: true,
        });
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?state=ready&theme=pink#home');
    await page.locator('.state-controls button[aria-pressed="true"]').waitFor();
    await assertV3ActiveActionRole(page, 'pink');
    await page.screenshot({
      path: path.join(evidenceDirectory, 'r4-390x844-pink-selected-state.png'),
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?state=ready&theme=pink#more');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '32px';
    });
    await enableThroughVisibleUi(page, copy);
    await verifyLocaleThemeAndFont(page, 'en', 'pink');
    await assertViewportQuality(page);
    await assertPinkInactiveButtonText(page);
    expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
    await page.screenshot({
      path: path.join(evidenceDirectory, 'r4-reflow-en-pink-buttons.png'),
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});
