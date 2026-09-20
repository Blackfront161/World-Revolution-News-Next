import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { getUiCopy, uiLanguageIds } from '../../packages/ui-language/src';

async function capture(page: Page, info: TestInfo, name: string, fullPage = false) {
  const path = info.outputPath(name + '.png');
  await page.screenshot({ path, fullPage });
  await info.attach(name, { path, contentType: 'image/png' });
}

async function geometry(page: Page) {
  return page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>('.content-offline-panel')!;
    const dialog = document.querySelector<HTMLElement>('.confirmation-dialog');
    const scope = dialog ?? panel;
    return {
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      panelOverflow: panel.scrollWidth > panel.clientWidth + 1,
      dialogOverflow: dialog ? dialog.scrollWidth > dialog.clientWidth + 1 : false,
      buttons: [...scope.querySelectorAll('button')].map((button) => {
        const rect = button.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
      dialogPosition: dialog ? getComputedStyle(dialog.parentElement!).position : null,
      offenders: [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.width > 0 &&
            (rect.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1)
          );
        })
        .slice(0, 12)
        .map((element) => ({
          tag: element.tagName,
          className: element.className,
          width: element.clientWidth,
          scroll: element.scrollWidth,
        })),
    };
  });
}

test.beforeEach(async ({ browserName }, info) => {
  test.skip(
    browserName !== 'chromium' ||
      !['mobile-390x844', 'website-390x844'].includes(info.project.name),
  );
});

test('S12 first UI visual matrix covers specified viewports and four themes', async ({
  page,
  context,
}, info) => {
  test.setTimeout(180_000);
  const mobile = info.project.name.startsWith('mobile');
  const client = mobile ? 'mobile' : 'website';
  const sizes = mobile
    ? [
        [320, 568],
        [360, 800],
        [390, 844],
        [412, 915],
        [844, 390],
      ]
    : [
        [390, 844],
        [600, 960],
        [800, 1280],
        [1024, 800],
        [1280, 800],
        [1440, 900],
        [1920, 1080],
      ];
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:')) external.push(request.url());
  });
  const rows: unknown[] = [];
  await page.goto('/#more');
  await page.getByRole('button', { name: 'Save content locally' }).click();
  await expect(page.getByText('Stored locally', { exact: true })).toBeVisible();
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width: width!, height: height! });
    for (const theme of ['dark', 'light', 'pink', 'contrast']) {
      await page.getByTestId('theme-selector').selectOption(theme);
      await page.locator('.content-offline-panel').scrollIntoViewIfNeeded();
      const panel = await geometry(page);
      expect(panel.overflow).toBe(false);
      expect(panel.panelOverflow).toBe(false);
      expect(panel.buttons.every((button) => button.width >= 44 && button.height >= 44)).toBe(true);
      await capture(page, info, `${client}-${width}x${height}-${theme}-panel`, true);
      await page.getByRole('button', { name: 'Remove local content', exact: true }).click();
      const dialog = await geometry(page);
      expect(dialog.dialogPosition).toBe('fixed');
      expect(dialog.dialogOverflow).toBe(false);
      expect(dialog.buttons.every((button) => button.width >= 44 && button.height >= 44)).toBe(
        true,
      );
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await capture(page, info, `${client}-${width}x${height}-${theme}-clear`);
      await page.keyboard.press('Escape');
      rows.push({ client, width, height, theme, panel, dialog });
    }
  }
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  const sideEffects = await page.evaluate(async () => ({
    dbs: (await indexedDB.databases()).map((db) => ({ name: db.name, version: db.version })),
    caches: await caches.keys(),
    workers: (await navigator.serviceWorker.getRegistrations()).length,
    keys: Object.keys(localStorage).sort(),
  }));
  expect(sideEffects).toEqual({
    dbs: [{ name: `wrn.${client}-content-offline`, version: 1 }],
    caches: [],
    workers: 0,
    keys: ['wrn.theme-preference.v1'],
  });
  await info.attach('visual-matrix', {
    body: JSON.stringify({ rows, errors, external, sideEffects }),
    contentType: 'application/json',
  });
});

test('S12 all nine languages retain content controls and modal focus at initial and post-mount 200% reflow', async ({
  context,
}, info) => {
  test.setTimeout(180_000);
  const client = info.project.name.startsWith('mobile') ? 'mobile' : 'website';
  const rows: unknown[] = [];
  for (const language of uiLanguageIds) {
    const copy = getUiCopy(language);
    for (const order of ['initial', 'after-mount']) {
      const page = await context.newPage();
      await page.addInitScript(
        ({ language, initial, client }) => {
          localStorage.setItem(`wrn.${client}-ui-language.v1`, language);
          if (initial) {
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
          }
        },
        { language, initial: order === 'initial', client },
      );
      await page.goto('/#more');
      await expect(page.locator('.content-offline-panel')).toHaveAttribute('aria-busy', 'false');
      if (order === 'after-mount') {
        // Explicit 100% -> 200% after the shell and content are mounted.
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '16px';
        });
        await expect(
          page.locator(client === 'mobile' ? '.mobile-shell' : '.site-header'),
        ).not.toHaveAttribute('data-wide-language-layout', 'true');
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '32px';
        });
      }
      await expect(
        page.locator(client === 'mobile' ? '.mobile-shell' : '.site-header'),
      ).toHaveAttribute('data-wide-language-layout', 'true');
      await expect(page.getByTestId('ui-language-selector')).toHaveValue(language);
      const save = page.getByRole('button', { name: copy.saveLocalContent, exact: true });
      if (await save.count()) await save.click();
      await expect(page.getByText(copy.contentStored, { exact: true })).toBeVisible();
      const panel = await geometry(page);
      await info.attach(`${client}-${language}-${order}-geometry`, {
        body: JSON.stringify(panel),
        contentType: 'application/json',
      });
      expect(panel.overflow).toBe(false);
      expect(panel.panelOverflow).toBe(false);
      await page.getByRole('button', { name: copy.clearLocalContent, exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('button', { name: copy.cancel, exact: true })).toBeFocused();
      const modal = await geometry(page);
      expect(modal.dialogPosition).toBe('fixed');
      expect(modal.dialogOverflow).toBe(false);
      expect(modal.buttons.every((button) => button.width >= 44 && button.height >= 44)).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await capture(page, info, `${client}-390x844-${language}-${order}-200pct-clear-actions`);
      // At 200% the dialog is intentionally scrollable; also show its reachable beginning.
      await dialog.evaluate((element) => {
        element.scrollTop = 0;
      });
      await capture(page, info, `${client}-390x844-${language}-${order}-200pct-clear-top`);
      await page.keyboard.press('Escape');
      await page.route('**/wrn-local-release/v1/supplemental-items.json', (route) =>
        route.fulfill({ contentType: 'application/json', body: '{"invalid":true}' }),
      );
      await page.getByRole('button', { name: copy.checkLocalContent, exact: true }).click();
      await expect(page.getByText(copy.contentCheckFailed, { exact: true })).toBeVisible();
      await expect(page.getByText(copy.contentStored, { exact: true })).toBeVisible();
      expect(await page.locator('.content-offline-panel').innerText()).not.toMatch(/\{\w+\}/u);
      rows.push({ language, order, panel, modal });
      await page.close();
    }
  }
  await info.attach('reflow-matrix', {
    body: JSON.stringify(rows),
    contentType: 'application/json',
  });
});
