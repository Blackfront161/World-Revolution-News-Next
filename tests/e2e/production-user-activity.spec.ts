import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { getUiCopy, uiLanguageIds } from '../../packages/ui-language/src';
import { getProductionActivityCopy } from '../../packages/ui-language/src/production-content';
import type { ActivityState } from '../../packages/browser-content/src/production-user-activity/state';

const harness = `/@fs/${path.resolve('tests/e2e/production-user-activity-harness.tsx').replaceAll('\\', '/')}`;
const time = new Date('2026-09-13T12:00:00Z');
async function state(page: Page, client: string, earlier = false) {
  return page.evaluate(
    async ({ client, earlier }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(`wrn.${client}-production-user-activity.v1`, 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      try {
        return await new Promise<ActivityState>((resolve, reject) => {
          const tx = db.transaction('activity', earlier ? 'readwrite' : 'readonly');
          const store = tx.objectStore('activity');
          let value: ActivityState;
          tx.oncomplete = () => resolve(value);
          tx.onabort = () => reject(tx.error);
          const read = store.get('state');
          read.onsuccess = () => {
            value = read.result as ActivityState;
            // An authored earlier-visit fixture; never alter admitted content or its authority.
            if (earlier) {
              value = {
                ...value,
                generation: value.generation + 1,
                availableIds: [],
                fingerprints: Object.fromEntries(
                  Object.keys(value.fingerprints).map((id) => [id, '0'.repeat(64)]),
                ),
                notifications: { ...value.notifications, notifiedIds: [] },
              };
              store.put(value, 'state');
            }
          };
        });
      } finally {
        db.close();
      }
    },
    { client, earlier },
  );
}
async function prepare(page: Page) {
  await page.clock.setFixedTime(time);
  await page.addInitScript(() => {
    const requests: string[] = [],
      shown: Array<{ title: string; body?: string }> = [];
    class TestNotification {
      static permission = sessionStorage.getItem('wrn.test.notification-permission') ?? 'default';
      static requestPermission() {
        requests.push('explicit');
        this.permission = 'granted';
        sessionStorage.setItem('wrn.test.notification-permission', 'granted');
        return Promise.resolve('granted');
      }
      constructor(title: string, options?: NotificationOptions) {
        shown.push({ title, body: options?.body });
      }
      close() {}
    }
    Object.defineProperty(window, 'Notification', { configurable: true, value: TestNotification });
    Object.assign(window, { wrnActivityTestNotifications: { requests, shown } });
  });
}
const notifications = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as {
          wrnActivityTestNotifications: {
            requests: string[];
            shown: Array<{ title: string; body?: string }>;
          };
        }
      ).wrnActivityTestNotifications,
  );

test('real activity IDB isolates clients, serializes CAS and preserves clear across reopen', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:43174/');
  const result = await page.evaluate(
    async (url) => (await import(url)).exerciseActivityStorage(),
    harness,
  );
  expect(result.race.filter((status: string) => status === 'fulfilled')).toHaveLength(1);
  expect(result.winner.generation).toBe(1);
  expect(result.aborted).toContain('aborted');
  expect(result.afterAbort).toEqual(result.winner);
  expect(result.isolated.generation).toBe(0);
  expect(result.isolated.enabled).toBe(false);
  expect(result.beforeClear).toEqual(result.winner);
  expect(result.stale).toContain('conflict');
  expect(result.cleared).toMatchObject({
    generation: 2,
    enabled: false,
    availableIds: [],
    fingerprints: {},
  });
});
test('real activity IDB refuses future, malformed and extra data without overwriting it', async ({
  page,
}) => {
  // An empty test document avoids an application handle during deliberate incompatible schemas.
  await page.goto('http://127.0.0.1:43174/tests-empty-activity.html');
  const result = await page.evaluate(
    async (url) => (await import(url)).exerciseProtectedActivityStorage(),
    harness,
  );
  expect(result.extraFailure).toContain('protected');
  expect(result.keys).toEqual(['future', 'state']);
  expect(result.futureFailure).toContain('protected');
  expect(result.futurePreserved.version).toBe(2);
  expect(result.schemaFailure).toContain('protected');
  expect(result.corruptFailure).toContain('protected');
});

for (const [client, port] of [
  ['mobile', 43174],
  ['website', 43175],
] as const) {
  const origin = `http://127.0.0.1:${port}`;
  test(`${client} actual opt-in, last visit, changed saved version, notifications and exact clear`, async ({
    page,
  }, info) => {
    await prepare(page);
    const copy = getProductionActivityCopy('en'),
      common = getUiCopy('en');
    const errors: string[] = [],
      foreign: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== origin) foreign.push(request.url());
    });
    await page.goto(`${origin}/#home`);
    await page.getByTestId('ui-language-selector').selectOption('en');
    const cards = page.locator('.production-card');
    await expect(cards).toHaveCount(6);
    await expect(page.locator('.production-activity')).toHaveCount(0);
    await cards.first().getByRole('button', { name: common.saveForLater, exact: true }).click();
    await cards.first().locator('.source-profile summary').click();
    await cards
      .first()
      .getByRole('button', { name: 'Follow: Electronic Frontier Foundation', exact: true })
      .click();
    await page.goto(`${origin}/#following`);
    const panel = page.locator('.production-activity');
    await expect(panel.getByRole('button', { name: copy.enable, exact: true })).toBeEnabled();
    expect((await state(page, client)).enabled).toBe(false);
    expect(await notifications(page)).toEqual({ requests: [], shown: [] });
    await panel.getByRole('button', { name: copy.enable, exact: true }).click();
    await expect(panel).toContainText(copy.firstVisit);
    await expect.poll(async () => (await state(page, client)).availableIds.length).toBe(6);
    await panel.locator('summary').click();
    await panel.getByRole('button', { name: copy.enableNotifications, exact: true }).click();
    await expect(
      panel.getByRole('button', { name: copy.disableNotifications, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect((await notifications(page)).requests).toEqual(['explicit']);
    expect((await notifications(page)).shown).toEqual([]);
    // Preserve an actual saved row; inject only an earlier local overview state.
    await page.goto(`${origin}/#home`);
    await expect(cards).toHaveCount(6);
    const readingKey = `wrn.${client}-production-reading-state.v2`;
    const readingBefore = await page.evaluate((key) => localStorage.getItem(key), readingKey);
    expect(Object.keys((await state(page, client)).fingerprints)).toHaveLength(1);
    await state(page, client, true);
    await page.reload();
    await expect(cards).toHaveCount(6);
    await page.goto(`${origin}/#following`);
    await expect(page.locator('.production-activity-badge')).toHaveCount(5);
    await expect(page.locator('.production-activity-change')).toHaveCount(1);
    await expect.poll(async () => (await notifications(page)).shown.length).toBe(1);
    expect((await notifications(page)).shown[0]).toEqual({
      title: copy.notificationTitle,
      body: copy.notificationBody,
    });
    const previousFingerprints = (await state(page, client)).fingerprints;
    await page.getByTestId('ui-language-selector').selectOption('de');
    await expect(page.locator('.production-activity-badge')).toHaveCount(5);
    expect((await state(page, client)).fingerprints).toEqual(previousFingerprints);
    await page.getByTestId('ui-language-selector').selectOption('en');
    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`${client}-overview.png`) });
    await page
      .locator('.production-activity-change')
      .getByRole('button', { name: copy.acknowledge })
      .click();
    await expect(page.locator('.production-activity-change')).toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), readingKey)).toBe(readingBefore);
    await page.reload();
    await expect(panel).toContainText(copy.none);
    await expect(page.locator('.production-activity-change')).toHaveCount(0);
    expect((await notifications(page)).shown).toEqual([]);
    const trigger = panel.getByRole('button', { name: copy.reset });
    await trigger.click();
    let dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: common.cancel })).toBeFocused();
    await page.screenshot({ path: info.outputPath(`${client}-clear-dialog.png`) });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: common.deleteNow }).click();
    await expect(panel.getByRole('button', { name: copy.enable })).toBeEnabled();
    await expect(panel.getByRole('button', { name: copy.enable })).toBeFocused();
    await page.reload();
    await expect(panel.getByRole('button', { name: copy.enable })).toBeEnabled();
    expect((await state(page, client)).enabled).toBe(false);
    expect(await page.evaluate((key) => localStorage.getItem(key), readingKey)).toBe(readingBefore);
    expect(errors).toEqual([]);
    expect(foreign).toEqual([]);
  });

  test(`${client} nine languages, 320px, RU200, themes, forced colors and keyboard`, async ({
    page,
  }, info) => {
    test.setTimeout(90_000);
    await prepare(page);
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
    await page.goto(`${origin}/?theme=violet#following`);
    await page.getByTestId('ui-language-selector').selectOption('en');
    const panel = page.locator('.production-activity');
    await panel.getByRole('button', { name: getProductionActivityCopy('en').enable }).click();
    await expect(panel).toContainText(getProductionActivityCopy('en').firstVisit);
    await panel.locator('summary').click();
    for (const language of uiLanguageIds) {
      await page.getByTestId('ui-language-selector').selectOption(language);
      const copy = getProductionActivityCopy(language);
      await expect(panel.getByRole('heading', { name: copy.heading })).toBeVisible();
      await expect(panel.getByLabel(copy.quietStart)).toHaveValue('22:00');
    }
    await page.getByTestId('ui-language-selector').selectOption('ru');
    for (const theme of ['violet', 'dark']) {
      await page.goto(`${origin}/?theme=${theme}#following`);
      await panel.locator('summary').click();
      for (const [width, scale] of [
        [320, '100%'],
        [390, '200%'],
      ] as const) {
        await page.setViewportSize({ width, height: 844 });
        await page.evaluate((scale) => {
          document.documentElement.style.fontSize = scale;
        }, scale);
        await panel.scrollIntoViewIfNeeded();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        ).toBe(true);
        for (const control of await panel.locator('button, input, summary').all()) {
          if (await control.isVisible()) {
            const box = (await control.boundingBox())!;
            expect(box.height).toBeGreaterThanOrEqual(44);
            expect(box.width).toBeGreaterThanOrEqual(44);
          }
        }
        await page.screenshot({
          path: info.outputPath(`${client}-${theme}-${width}-ru-${scale.replace('%', '')}.png`),
        });
      }
      expect(
        (await new AxeBuilder({ page }).include('.production-activity').analyze()).violations,
      ).toEqual([]);
    }
    await page.emulateMedia({ forcedColors: 'active' });
    await page.screenshot({ path: info.outputPath(`${client}-forced-colors.png`) });
  });
}
