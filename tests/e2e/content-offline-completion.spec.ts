import { expect, test } from '@playwright/test';
import {
  articleId,
  articleTitle,
  contentStorage,
  holdContentRead,
  saveA,
  uiSource,
} from './content-offline-ui-harness';

const observations = new WeakMap<object, { errors: string[]; external: string[] }>();
test.beforeEach(async ({ page }) => {
  const observed = { errors: [] as string[], external: [] as string[] };
  observations.set(page, observed);
  page.on('pageerror', (error) => observed.errors.push(error.message));
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:')) observed.external.push(request.url());
  });
});

test.afterEach(async ({ page, context }, info) => {
  if (info.status === 'skipped') return;
  const observed = observations.get(page)!;
  expect(observed.errors).toEqual([]);
  expect(observed.external).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  const effects = await page.evaluate(async () => ({
    keys: Object.keys(localStorage).sort(),
    caches: await caches.keys(),
    workers: (await navigator.serviceWorker.getRegistrations()).length,
    databases:
      typeof indexedDB === 'undefined'
        ? []
        : await Promise.all(
            (await indexedDB.databases()).map(async (meta) => {
              const open = indexedDB.open(meta.name!);
              const db = await new Promise<IDBDatabase>((resolve) => {
                open.onsuccess = () => resolve(open.result);
              });
              const stores = [...db.objectStoreNames].sort();
              db.close();
              return { name: meta.name, version: meta.version, stores };
            }),
          ),
  }));
  const client = info.project.name.startsWith('mobile') ? 'mobile' : 'website';
  expect(
    effects.keys.every((key) =>
      [
        `wrn.${client}-local-reading-state.v1`,
        `wrn.${client}-ui-language.v1`,
        'wrn.theme-preference.v1',
      ].includes(key),
    ),
  ).toBe(true);
  expect(effects.caches).toEqual([]);
  expect(effects.workers).toBe(0);
  if (info.title.includes('missing IDB')) expect(effects.databases).toEqual([]);
  else
    expect(effects.databases).toEqual([
      {
        name: `wrn.${client}-content-offline`,
        version: info.title.includes('future storage') ? 2 : 1,
        stores: info.title.includes('future storage') ? ['future'] : ['bundles', 'control'],
      },
    ]);
  await info.attach('ui-boundaries', {
    body: JSON.stringify({ observed, effects }),
    contentType: 'application/json',
  });
});

test.beforeEach(async ({ browserName }, info) => {
  test.skip(
    browserName !== 'chromium' ||
      !['mobile-390x844', 'website-390x844'].includes(info.project.name),
  );
});

test('S12 A/B/A is atomic across feed, discover, reader and archive; failed B is explained', async ({
  page,
}, info) => {
  const source = await uiSource(page);
  const client = info.project.name.startsWith('mobile') ? 'mobile' : 'website';
  await saveA(page);
  const snapshotA = await contentStorage(page, client);
  source.set('b');
  await page.getByRole('button', { name: 'Check for a newer revision' }).click();
  await expect(
    page.getByText('Checked candidate: ' + source.fixtures.b.descriptor.releaseRevision),
  ).toBeVisible();
  await expect(
    page.getByText('Active revision: ' + source.fixtures.a.descriptor.releaseRevision),
  ).toBeVisible();
  for (const target of ['home', 'discover']) {
    await page.goto('/#' + target);
    await expect(page.getByRole('heading', { name: articleTitle, exact: true })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: articleTitle + ' — B', exact: true }),
    ).toHaveCount(0);
  }
  await page.locator(`[data-reader-trigger="${articleId}"]`).click();
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toContainText(
    articleTitle,
  );
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.goto('/#more');
  const activate = page.getByRole('button', { name: 'Use checked revision', exact: true });
  await activate.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(activate).toBeFocused();
  await expect(
    page.getByText('Active revision: ' + source.fixtures.a.descriptor.releaseRevision),
  ).toBeVisible();
  await activate.click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Use checked revision', exact: true })
    .click();
  await expect(
    page.getByText('Active revision: ' + source.fixtures.b.descriptor.releaseRevision),
  ).toBeVisible();
  // Activation removes its own trigger; focus must survive the asynchronous commit.
  await expect(page.locator('main')).toBeFocused();
  for (const target of ['home', 'discover']) {
    await page.goto('/#' + target);
    await expect(
      page.getByRole('heading', { name: articleTitle + ' — B', exact: true }),
    ).toBeVisible();
  }
  await page.locator(`[data-reader-trigger="${articleId}"]`).click();
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toContainText(
    articleTitle + ' — B',
  );
  await page.goto('/#archive');
  await expect(
    page.getByRole('heading', { name: articleTitle + ' — B', exact: true }),
  ).toBeVisible();
  await page.goto('/#more');
  const rollback = page.getByRole('button', { name: 'Use previous revision', exact: true });
  await rollback.click();
  await page.keyboard.press('Escape');
  await expect(rollback).toBeFocused();
  await rollback.click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Use previous revision', exact: true })
    .click();
  await expect(
    page.getByText('Active revision: ' + source.fixtures.a.descriptor.releaseRevision),
  ).toBeVisible();
  expect(typeof snapshotA.control.activeKey).toBe('string');
  expect((await contentStorage(page, client)).control.activeKey).toEqual(
    snapshotA.control.activeKey,
  );
  source.set('b', true);
  await page.getByRole('button', { name: 'Check for a newer revision' }).click();
  await expect(page.getByTestId('content-operation-message')).toContainText('could not complete');
  await expect(
    page.getByText('Active revision: ' + source.fixtures.a.descriptor.releaseRevision),
  ).toBeVisible();
  await page.goto('/#home');
  await expect(page.getByRole('heading', { name: articleTitle, exact: true })).toBeVisible();
});

test('S12 clear cancels a download and preserves populated reading, theme and language keys', async ({
  page,
}, info) => {
  const source = await uiSource(page);
  const client = info.project.name.startsWith('mobile') ? 'mobile' : 'website';
  await saveA(page);
  await page.goto('/#home');
  await page.locator(`[data-reader-trigger="${articleId}"]`).click();
  await page.getByRole('button', { name: 'Save for later', exact: true }).click();
  await page.getByRole('button', { name: 'Mark as read', exact: true }).click();
  await page.getByRole('button', { name: 'Save 50% reading progress', exact: true }).click();
  await page.getByTestId('theme-selector').selectOption('pink');
  // Select English deliberately so the language key is genuinely populated.
  await page.getByTestId('ui-language-selector').selectOption('de');
  await page.getByTestId('ui-language-selector').selectOption('en');
  await page.goto('/#more');
  const keys = [
    `wrn.${client}-local-reading-state.v1`,
    `wrn.${client}-ui-language.v1`,
    'wrn.theme-preference.v1',
  ];
  const before = await page.evaluate(
    (names) => names.map((name) => localStorage.getItem(name)),
    keys,
  );
  expect(before.every((value) => value !== null)).toBe(true);
  expect(before[0]).toContain('savedAt');
  expect(before[0]).toContain('readAt');
  expect(before[0]).toContain('progress');
  source.set('b');
  const held = source.hold();
  await page.getByRole('button', { name: 'Check for a newer revision' }).click();
  await held;
  const clear = page.getByRole('button', { name: 'Remove local content', exact: true });
  await clear.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('safety');
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(
    dialog.getByRole('button', { name: 'Remove local content', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await expect(page.locator('main')).toHaveJSProperty('inert', true);
  await page.keyboard.press('Escape');
  await expect(clear).toBeFocused();
  await clear.click();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(clear).toBeFocused();
  await clear.click();
  await dialog.getByRole('button', { name: 'Remove local content', exact: true }).click();
  await expect(page.getByText('Stored locally', { exact: true })).toHaveCount(0);
  source.release();
  await expect.poll(async () => (await contentStorage(page, client)).bundles.length).toBe(0);
  const after = await contentStorage(page, client);
  expect(after.control.clearEpoch).toBe(1);
  expect(after.control.pendingRecheck).not.toBeNull();
  expect(
    await page.evaluate((names) => names.map((name) => localStorage.getItem(name)), keys),
  ).toEqual(before);
  await expect(page.locator('main')).toHaveJSProperty('inert', false);
  if (await clear.count()) await expect(clear).toBeFocused();
  else await expect(page.locator('main')).toBeFocused();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Local content' })).toBeVisible();
  expect(
    await page.evaluate((names) => names.map((name) => localStorage.getItem(name)), keys),
  ).toEqual(before);
  await expect(page.getByText('Stored locally', { exact: true })).toHaveCount(0);
});

test('S12 clear preempts a delayed guard without publishing its late snapshot', async ({
  page,
}, info) => {
  await uiSource(page);
  await saveA(page);
  const client = info.project.name.startsWith('mobile') ? 'mobile' : 'website';
  await page.getByRole('button', { name: 'Remove local content', exact: true }).click();
  const release = await holdContentRead(page, client);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Remove local content', exact: true })
    .click();
  await release();
  await expect(page.getByText('Stored locally', { exact: true })).toHaveCount(0);
  await expect.poll(async () => (await contentStorage(page, client)).bundles.length).toBe(0);
  await expect(page.getByRole('heading', { name: articleTitle, exact: true })).toHaveCount(0);
});

test('S12 missing IDB uses the default controller and never claims storage or silent B activation', async ({
  page,
}) => {
  await page.addInitScript(() => Object.defineProperty(window, 'indexedDB', { value: undefined }));
  const source = await uiSource(page);
  await page.goto('/#more');
  await expect(
    page.getByText('Available for this session only; it is not stored.', { exact: true }),
  ).toBeVisible();
  // The controller does not offer save when no usable store exists.
  await expect(page.getByRole('button', { name: 'Save content locally' })).toHaveCount(0);
  await expect(page.getByText('Stored locally', { exact: true })).toHaveCount(0);
  source.set('b');
  const before = source.requests.length;
  await page.getByRole('button', { name: 'Check for a newer revision' }).click();
  await expect.poll(() => source.requests.length).toBeGreaterThan(before);
  await expect(page.locator('.content-offline-panel')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByTestId('content-operation-message')).toContainText('could not be stored');
  await expect(
    page.getByText('Active revision: ' + source.fixtures.a.descriptor.releaseRevision),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Use checked revision' })).toHaveCount(0);
  await page.goto('/#home');
  await expect(page.getByRole('heading', { name: articleTitle, exact: true })).toBeVisible();
});

test('S12 unknown future storage remains byte-identical and visibly protected', async ({
  page,
}, info) => {
  const source = await uiSource(page);
  const client = info.project.name.startsWith('mobile') ? 'mobile' : 'website';
  await page.route('**/__s12_blank__', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Storage setup only</title>',
    }),
  );
  await page.goto('/__s12_blank__');
  await page.evaluate(async (name) => {
    const open = indexedDB.open(`wrn.${name}-content-offline`, 2);
    open.onupgradeneeded = () =>
      open.result.createObjectStore('future').put('s12-future-sentinel', 'untouched');
    await new Promise<void>((resolve) => {
      open.onsuccess = () => {
        open.result.close();
        resolve();
      };
    });
  }, client);
  await page.goto('/#more');
  await expect(page.getByTestId('content-operation-message')).toContainText('left untouched');
  await expect(page.locator('.content-offline-actions button')).toHaveCount(0);
  expect(source.requests).toHaveLength(0);
  const stored = await page.evaluate(async (name) => {
    const open = indexedDB.open(`wrn.${name}-content-offline`);
    const db = await new Promise<IDBDatabase>((resolve) => {
      open.onsuccess = () => resolve(open.result);
    });
    const get = db.transaction('future').objectStore('future').get('untouched');
    const value = await new Promise<unknown>((resolve) => {
      get.onsuccess = () => resolve(get.result);
    });
    const result = { version: db.version, stores: [...db.objectStoreNames], value };
    db.close();
    return result;
  }, client);
  expect(stored).toEqual({ version: 2, stores: ['future'], value: 's12-future-sentinel' });
});

test('S12 expiry closes an open reader without a background source request', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-08-28T12:00:00Z') });
  const source = await uiSource(page);
  await saveA(page);
  await page.goto('/#home');
  await page.locator(`[data-reader-trigger="${articleId}"]`).click();
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toBeVisible();
  const requests = source.requests.length;
  await page.clock.fastForward(24 * 60 * 60 * 1000 + 1000);
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toHaveCount(0);
  await page.goto('/#more');
  await expect(page.getByText(/reading period has ended/)).toBeVisible();
  expect(source.requests).toHaveLength(requests);
});

test('S12 actual document unmount aborts a held check; remount preserves pending protection', async ({
  page,
}, info) => {
  const source = await uiSource(page);
  await saveA(page);
  source.set('b');
  const held = source.hold();
  await page.getByRole('button', { name: 'Check for a newer revision' }).click();
  await held;
  const origin = new URL(page.url()).origin;
  await page.goto('about:blank');
  source.release();
  const before = source.requests.length;
  await page.goto(origin + '/#more');
  await expect(
    page
      .getByText('Content access is protected until a safe source check can complete.', {
        exact: true,
      })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByText('Active revision: ' + source.fixtures.b.descriptor.releaseRevision),
  ).toHaveCount(0);
  expect(source.requests).toHaveLength(before);
  const client = info.project.name.startsWith('mobile') ? 'mobile' : 'website';
  expect((await contentStorage(page, client)).control.pendingRecheck).not.toBeNull();
});

test('S12 C partial failure closes an open source and reader on resume and cannot revive through history', async ({
  page,
  context,
}, info) => {
  const source = await uiSource(page);
  await saveA(page);
  await page.goto('/#home');
  await page.locator(`[data-reader-trigger="${articleId}"]`).click();
  await page.getByRole('button', { name: 'Open original source', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const second = await context.newPage();
  const source2 = await uiSource(second);
  await second.goto(new URL('/#more', page.url()).href);
  await expect(second.getByText('Stored locally', { exact: true })).toBeVisible();
  source2.set('b');
  await second.getByRole('button', { name: 'Check for a newer revision' }).click();
  await expect(
    second.getByText('Checked candidate: ' + source.fixtures.b.descriptor.releaseRevision),
  ).toBeVisible();
  await page.bringToFront();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toContainText(
    articleTitle,
  );
  await expect(page.getByRole('heading', { name: articleTitle + ' — B', exact: true })).toHaveCount(
    0,
  );
  source2.set('c', true);
  await second.getByRole('button', { name: 'Check for a newer revision' }).click();
  await expect(second.getByTestId('content-operation-message')).toBeVisible();
  await expect(
    second.getByText('Active revision: ' + source.fixtures.a.descriptor.releaseRevision),
  ).toHaveCount(0);
  const requestCount = source.requests.length;
  await page.bringToFront();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toHaveCount(0);
  await page.goBack();
  await page.goForward();
  await expect(page.getByRole('heading', { name: articleTitle, exact: true })).toHaveCount(0);
  expect(source.requests).toHaveLength(requestCount);
  const client = info.project.name.startsWith('mobile') ? 'mobile' : 'website';
  const stored = await contentStorage(page, client);
  expect(stored.bundles).toHaveLength(0);
  await second.close();
});

test('S12 stored A restores with content transport unavailable while the shell remains reachable', async ({
  page,
}, info) => {
  await uiSource(page);
  await saveA(page);
  const client = info.project.name.startsWith('mobile') ? 'mobile' : 'website';
  const stored = await contentStorage(page, client);
  let requests = 0;
  await page.route('**/wrn-local-release/v1/*.json', (route) => {
    requests++;
    return route.abort();
  });
  await page.reload();
  await expect(page.getByText('Stored locally', { exact: true })).toBeVisible();
  await page.goto('/#home');
  await page.locator(`[data-reader-trigger="${articleId}"]`).click();
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toBeVisible();
  expect(requests).toBe(0);
  const restored = await contentStorage(page, client);
  expect(restored.bundles).toEqual(stored.bundles);
  expect(restored.control.lastSuccessfulSourceCheckAt).toEqual(
    stored.control.lastSuccessfulSourceCheckAt,
  );
});

test('S12 missing A plus failed content transport has no fixture fallback or saved claim', async ({
  page,
}) => {
  await page.route('**/wrn-local-release/v1/*.json', (route) => route.abort());
  await page.goto('/#more');
  await expect(page.getByTestId('content-operation-message')).toBeVisible();
  await expect(page.getByText('Stored locally', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save content locally' })).toHaveCount(0);
  await page.goto('/#home');
  await expect(page.locator('[data-reader-trigger]')).toHaveCount(0);
});

test('S12 delayed resume guard disables writes; history waits then reads without source retry', async ({
  page,
}, info) => {
  const source = await uiSource(page);
  await saveA(page);
  const before = source.requests.length;
  const client = info.project.name.startsWith('mobile') ? 'mobile' : 'website';
  const release = await holdContentRead(page, client);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('button', { name: 'Check for a newer revision' })).toBeDisabled();
  await page.evaluate((mobile) => {
    history.pushState(
      {},
      '',
      mobile ? '/#article/wrn-test-art-cedar' : '/?article=wrn-test-art-cedar#home',
    );
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, client === 'mobile');
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toHaveCount(0);
  await release();
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toBeVisible();
  expect(source.requests).toHaveLength(before);
});
