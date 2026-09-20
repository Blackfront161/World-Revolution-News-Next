import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';

const moduleUrl = `/@fs/${path.resolve('packages/browser-content/src/regional-events/selection-store.ts').replaceAll('\\', '/')}`;
const now = new Date('2026-09-12T14:00:00.000Z');

for (const [client, port, sizes] of [
  [
    'mobile',
    43192,
    [
      [320, 568],
      [360, 800],
      [390, 844],
      [412, 915],
      [600, 960],
      [800, 1280],
      [915, 412],
      [1280, 800],
      [390, 844],
    ],
  ],
  [
    'website',
    43193,
    [
      [320, 568],
      [390, 844],
      [800, 1280],
      [1024, 800],
      [1280, 800],
      [1440, 900],
      [1920, 1080],
      [390, 844],
    ],
  ],
] as const) {
  test(`${client} regional visual matrix and RU200 native choice reflow`, async ({
    page,
  }, info) => {
    test.setTimeout(150_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.setFixedTime(now);
    let neutral: string[] | null = null;
    for (const theme of ['violet', 'dark']) {
      await page.goto(`http://127.0.0.1:${port}/?theme=${theme}#events`);
      await page.getByTestId('ui-language-selector').selectOption('ru');
      const region = page.getByTestId('current-regional-events');
      await region.getByRole('combobox').nth(0).selectOption('continent-europe');
      await region.getByRole('combobox').nth(1).selectOption('country-gb');
      await region.getByRole('combobox').nth(2).selectOption('region-london');
      await expect(region.locator('.current-regional-events__select > span').first()).toHaveText(
        'Европа',
      );
      const base = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        return [
          '--wrn-color-background',
          '--wrn-color-surface',
          '--wrn-color-text',
          '--wrn-color-action',
        ].map((key) => style.getPropertyValue(key).trim());
      });
      if (neutral) expect(base).toEqual(neutral);
      else neutral = base;
      for (const [index, [width, height]] of sizes.entries()) {
        await page.setViewportSize({ width, height });
        const reflow = index === sizes.length - 1;
        await page.evaluate((reflow) => {
          document.documentElement.style.fontSize = reflow ? '200%' : '100%';
        }, reflow);
        await region.scrollIntoViewIfNeeded();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        ).toBe(true);
        const controlSizes = await region.locator('button,select,summary').evaluateAll((nodes) =>
          nodes.map((node) => {
            const rect = node.getBoundingClientRect();
            return [rect.width, rect.height];
          }),
        );
        expect(controlSizes.every(([width, height]) => width! >= 44 && height! >= 44)).toBe(true);
        const labels = await region
          .locator('.current-regional-events__select > span')
          .evaluateAll((nodes) =>
            nodes.every(
              (node) =>
                node.scrollWidth <= node.clientWidth + 1 &&
                node.scrollHeight <= node.clientHeight + 1,
            ),
          );
        expect(labels).toBe(true);
        await region
          .locator('.current-regional-events__choice')
          .first()
          .evaluate((node) => node.scrollIntoView({ block: 'start' }));
        await page.screenshot({
          path: info.outputPath(
            `${client}-${theme}-${width}x${height}-ru${reflow ? '200' : '100'}-choice.png`,
          ),
        });
        if (reflow) {
          await region
            .locator('.current-regional-events__choice')
            .nth(1)
            .evaluate((node) => node.scrollIntoView({ block: 'start' }));
          await page.screenshot({ path: info.outputPath(`${client}-${theme}-ru200-country.png`) });
        }
      }
      const first = region.getByRole('combobox').first();
      await first.focus();
      await page.keyboard.press('Tab');
      await expect(region.getByRole('combobox').nth(1)).toBeFocused();
      await region.getByRole('article').scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath(`${client}-${theme}-ru200-event.png`) });
      expect(
        (await new AxeBuilder({ page }).include('.current-regional-events').analyze()).violations,
      ).toEqual([]);
    }
    await page.emulateMedia({ forcedColors: 'active' });
    await page.getByTestId('current-regional-events').scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`${client}-forced-colors.png`) });
    expect(errors).toEqual([]);
  });
}

test('actual IDB version changes close old handles, and postcommit mismatch never reports success', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:43192/__regional-idb');
  const result = await page.evaluate(async (url) => {
    const mod = await import(url);
    const store = await mod.openRegionalSelectionStore('mobile');
    const getAll = IDBObjectStore.prototype.getAll;
    let reads = 0;
    let mismatch = '';
    try {
      IDBObjectStore.prototype.getAll = function (...args) {
        const request = getAll.apply(this, args);
        reads++;
        if (reads === 3)
          Object.defineProperty(request, 'result', {
            get: () => [
              {
                format: 'wrn.regional-selection.v1',
                key: 'choice',
                generation: 2,
                selection: mod.emptyRegionalSelection,
              },
            ],
          });
        return request;
      };
      try {
        await store.save({ continentId: 'continent-europe', countryId: null, regionId: null }, 0);
      } catch (error) {
        mismatch = (error as { code: string }).code;
      }
    } finally {
      IDBObjectStore.prototype.getAll = getAll;
    }
    const committed = await store.snapshot();
    const upgraded = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('wrn.mobile-regional-selection.v1', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    let closed = '';
    try {
      await store.clear(committed.generation);
    } catch (error) {
      closed = (error as { code: string }).code;
    }
    const retained = await new Promise<unknown>((resolve, reject) => {
      const request = upgraded
        .transaction('selection', 'readonly')
        .objectStore('selection')
        .get('choice');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    upgraded.close();
    store.close();
    return { mismatch, committed, closed, retained };
  }, moduleUrl);
  expect(result.mismatch).toBe('stale-operation');
  expect(result.committed.generation).toBe(1);
  expect(result.closed).toBe('incompatible-storage');
  expect(result.retained).toEqual(result.committed);
});

test('actual IDB saves only the explicit choice, survives restart and isolates both clients', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:43192/__regional-idb');
  const result = await page.evaluate(async (url) => {
    const mod = await import(url);
    const choice = {
      continentId: 'continent-europe',
      countryId: 'country-gb',
      regionId: 'region-london',
    };
    const mobile = await mod.openRegionalSelectionStore('mobile');
    const website = await mod.openRegionalSelectionStore('website');
    const initial = await mobile.snapshot();
    const saved = await mobile.save(choice, initial.generation);
    mobile.close();
    const reopened = await mod.openRegionalSelectionStore('mobile');
    const restored = await reopened.snapshot();
    const other = await website.snapshot();
    const otherSaved = await website.save({ ...choice, regionId: null }, other.generation);
    const cleared = await reopened.clear(restored.generation);
    const websiteAfter = await website.snapshot();
    reopened.close();
    website.close();
    return {
      initial,
      saved,
      restored,
      other,
      cleared,
      otherSaved,
      websiteAfter,
      frozen: Object.isFrozen(saved) && Object.isFrozen(saved.selection),
    };
  }, moduleUrl);
  expect(result.initial.generation).toBe(0);
  expect(result.saved).toEqual(result.restored);
  expect(result.other.selection).toEqual({ continentId: null, countryId: null, regionId: null });
  expect(result.cleared.generation).toBe(2);
  expect(result.cleared.selection).toEqual(result.other.selection);
  expect(result.otherSaved).toEqual(result.websiteAfter);
  expect(result.frozen).toBe(true);
  expect(Object.keys(result.saved).sort()).toEqual(['format', 'generation', 'key', 'selection']);
});

test('actual IDB snapshots caller values and rejects competing and pre-clear generations', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:43192/__regional-idb');
  const result = await page.evaluate(async (url) => {
    const mod = await import(url);
    const left = await mod.openRegionalSelectionStore('mobile');
    const right = await mod.openRegionalSelectionStore('mobile');
    const mutable = {
      continentId: 'continent-europe',
      countryId: 'country-gb',
      regionId: 'region-london',
    };
    const first = left.save(mutable, 0);
    mutable.regionId = 'region-mutated';
    const saved = await first;
    const races = await Promise.allSettled([left.save(saved.selection, 1), right.clear(1)]);
    const final = await left.snapshot();
    let stale = '';
    try {
      await right.save(saved.selection, 1);
    } catch (error) {
      stale = (error as { code: string }).code;
    }
    const after = await left.snapshot();
    left.close();
    right.close();
    return { saved, races: races.map((item) => item.status), final, after, stale };
  }, moduleUrl);
  expect(result.saved.selection.regionId).toBe('region-london');
  expect(result.races.filter((status) => status === 'fulfilled')).toHaveLength(1);
  expect(result.final.generation).toBe(2);
  expect(result.after).toEqual(result.final);
  expect(result.stale).toBe('stale-operation');
});

for (const kind of [
  'missing',
  'extra-row',
  'extra-field',
  'invalid-hierarchy',
  'overflow',
  'extra-store',
  'extra-index',
  'future',
] as const) {
  test(`actual IDB protects ${kind} storage without repair or byte changes`, async ({ page }) => {
    await page.goto('http://127.0.0.1:43192/__regional-idb');
    const result = await page.evaluate(
      async ({ url, kind }) => {
        const mod = await import(url);
        const name = 'wrn.mobile-regional-selection.v1';
        const row = {
          format: 'wrn.regional-selection.v1',
          key: 'choice',
          generation: kind === 'overflow' ? Number.MAX_SAFE_INTEGER : 0,
          selection: {
            continentId: null,
            countryId: null,
            regionId: kind === 'invalid-hierarchy' ? 'region-london' : null,
          },
          ...(kind === 'extra-field' ? { history: [] } : {}),
        };
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(name, kind === 'future' ? 2 : 1);
          request.onupgradeneeded = () => {
            const store = request.result.createObjectStore('selection', { keyPath: 'key' });
            if (kind !== 'missing') store.put(row);
            if (kind === 'extra-row') store.put({ ...row, key: 'other' });
            if (kind === 'extra-index') store.createIndex('unexpected', 'generation');
            if (kind === 'extra-store') request.result.createObjectStore('unexpected');
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const raw = () =>
          new Promise<string>((resolve, reject) => {
            const tx = db.transaction('selection', 'readonly');
            const request = tx.objectStore('selection').getAll();
            request.onsuccess = () =>
              resolve(
                JSON.stringify({
                  version: db.version,
                  stores: [...db.objectStoreNames],
                  indexes: [...tx.objectStore('selection').indexNames],
                  rows: request.result,
                }),
              );
            request.onerror = () => reject(request.error);
          });
        const before = await raw();
        let code = '';
        let handle;
        try {
          handle = await mod.openRegionalSelectionStore('mobile');
          const state = await handle.snapshot();
          await handle.clear(state.generation);
        } catch (error) {
          code = (error as { code: string }).code;
        }
        handle?.close();
        const after = await raw();
        db.close();
        return { before, after, code };
      },
      { url: moduleUrl, kind },
    );
    expect(result.code).toBe(kind === 'overflow' ? 'stale-operation' : 'incompatible-storage');
    expect(result.after).toBe(result.before);
  });
}

test('actual IDB abort, close, quota and failed precommit readback cannot leave a late choice', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:43192/__regional-idb');
  const result = await page.evaluate(async (url) => {
    const mod = await import(url);
    const choice = { continentId: 'continent-europe', countryId: null, regionId: null };
    let store = await mod.openRegionalSelectionStore('mobile');
    const before = await store.snapshot();
    const codes: string[] = [];
    const code = async (work: Promise<unknown>) => {
      try {
        await work;
        codes.push('unexpected-success');
      } catch (error) {
        codes.push((error as { code: string }).code);
      }
    };
    const abort = new AbortController();
    abort.abort();
    await code(store.save(choice, 0, abort.signal));
    const pending = store.save(choice, 0);
    store.close();
    await code(pending);
    store = await mod.openRegionalSelectionStore('mobile');
    const put = IDBObjectStore.prototype.put;
    try {
      IDBObjectStore.prototype.put = function () {
        throw new DOMException('test', 'QuotaExceededError');
      };
      await code(store.save(choice, 0));
      IDBObjectStore.prototype.put = function () {
        return this.get('choice');
      };
      await code(store.save(choice, 0));
    } finally {
      IDBObjectStore.prototype.put = put;
    }
    const after = await store.snapshot();
    store.close();
    return { codes, before, after };
  }, moduleUrl);
  expect(result.codes).toEqual([
    'aborted',
    'aborted',
    'quota-or-write-failure',
    'quota-or-write-failure',
  ]);
  expect(result.after).toEqual(result.before);
});

for (const [client, port] of [
  ['mobile', 43192],
  ['website', 43193],
] as const) {
  test(`${client} actual Home and Events save, restore, clear and retain source precision`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.setFixedTime(now);
    await page.goto(`http://127.0.0.1:${port}/?theme=violet`);
    await page.getByTestId('ui-language-selector').selectOption('de');
    const region = page.getByTestId('current-regional-events');
    await expect(region.getByRole('combobox', { name: 'Kontinent', exact: true })).toHaveValue('');
    await region
      .getByRole('combobox', { name: 'Kontinent', exact: true })
      .selectOption('continent-europe');
    await region.getByRole('combobox', { name: 'Land', exact: true }).selectOption('country-gb');
    await region
      .getByRole('combobox', { name: 'Region', exact: true })
      .selectOption('region-london');
    await expect(region.getByRole('article')).toHaveCount(1);
    await expect(region).toContainText('10:00');
    await expect(region).toContainText('18:00');
    await region.getByRole('button', { name: 'Auswahl auf diesem Gerät speichern' }).click();
    await expect(region).toContainText('Auswahl auf diesem Gerät gespeichert.');
    await region.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`${client}-home-london-de.png`) });
    await page.reload();
    await expect(region.getByRole('combobox', { name: 'Region', exact: true })).toHaveValue(
      'region-london',
    );
    await page.goto(`http://127.0.0.1:${port}/?theme=violet#events`);
    await expect(region.getByRole('combobox', { name: 'Region', exact: true })).toHaveValue(
      'region-london',
    );
    await expect(
      region.getByRole('heading', {
        name: 'Termine in deiner Region',
        level: client === 'mobile' ? 3 : 2,
      }),
    ).toBeVisible();
    const links = region.getByRole('link', { name: 'Originalankündigung öffnen' });
    await expect(links).toHaveAttribute(
      'href',
      'https://www.oxfordhouse.org.uk/event/2026-london-anarchist-bookfair-2/',
    );
    await expect(links).toHaveAttribute('referrerpolicy', 'no-referrer');
    await page.screenshot({ path: info.outputPath(`${client}-events-london-de.png`) });
    const axe = await new AxeBuilder({ page }).include('.current-regional-events').analyze();
    expect(axe.violations).toEqual([]);
    await region.getByRole('button', { name: 'Regionsauswahl löschen' }).click();
    await expect(region.getByRole('combobox', { name: 'Kontinent', exact: true })).toHaveValue('');
    await page.reload();
    await expect(region.getByRole('combobox', { name: 'Kontinent', exact: true })).toHaveValue('');
    expect(errors).toEqual([]);
  });
}
