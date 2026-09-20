import { copyFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { getMobileMediaCopy, uiLanguageIds, type UiLanguage } from '../../packages/ui-language/src';

const themes = ['dark', 'light', 'pink', 'contrast'] as const;
const harnessUrl = `/@fs/${fileURLToPath(
  new URL('./g3-021-media-hub-visual-harness.tsx', import.meta.url),
).replaceAll('\\', '/')}`;
const fixedExpiry = Date.parse('2030-01-02T00:00:00.000Z');
const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
});
test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});

type VisualState =
  | 'loading'
  | 'ready'
  | 'empty'
  | 'stale'
  | 'blocked'
  | 'protected'
  | 'storage-failure'
  | 'player-error'
  | 'offline'
  | 'invalid'
  | 'recovery';

/** Self-authored presentational data, deliberately unrelated to P2/P3 IDs,
 * release fixtures, assets, pins, loaders, or stores. */
function model(state: VisualState = 'ready') {
  const ready = state === 'ready' || state === 'player-error';
  return {
    kind: ready
      ? 'ready'
      : state === 'loading' || state === 'offline' || state === 'invalid' || state === 'recovery'
        ? 'empty'
        : state,
    identity: ready ? 'presentational-context' : null,
    episodeId: ready ? 'presentational-episode' : null,
    audioAssetId: ready ? 'presentational-asset' : null,
    audioAssetHash: ready ? 'a'.repeat(64) : null,
    releaseRevision: ready ? 1 : null,
    expiresAt: ready ? fixedExpiry : null,
    title: ready ? { en: 'Local media title' } : null,
    summary: ready ? { en: 'Self-authored visual summary for responsive testing.' } : null,
    source: ready ? { en: 'Local source' } : null,
    durationMs: ready ? 125_000 : null,
    attribution: ready ? 'Local attribution' : null,
    territory: ready ? 'global' : null,
    delivery: ready ? ('local-no-third-party' as const) : null,
    loading: state === 'loading',
    bootstrapFailure: false,
    bootstrap: state === 'offline' ? 'offline' : state === 'invalid' ? 'invalid' : 'none',
    recovery: state === 'recovery',
    recoveryBusy: false,
    player: {
      playback: state === 'player-error' ? ('error' as const) : ('idle' as const),
      availability: state === 'offline' ? ('offline' as const) : ('local' as const),
      error: state === 'player-error' ? ('network-error' as const) : null,
    },
    resume: 'idle' as const,
  };
}

async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  if (process.env.WRN_EVIDENCE_ROOT) {
    await mkdir(resolve(process.env.WRN_EVIDENCE_ROOT), { recursive: true });
    await copyFile(
      path,
      join(
        resolve(process.env.WRN_EVIDENCE_ROOT),
        `${process.env.WRN_EVIDENCE_REVISION ?? 'local'}_${name}.png`,
      ),
    );
  }
}

async function mount(page: Page, language: UiLanguage, state: VisualState = 'ready') {
  await page.unroute('**/__wrn-test__/media-hub-view.json');
  await page.route('**/__wrn-test__/media-hub-view.json', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ language, model: model(state) }),
    }),
  );
  await page.goto('/');
  await page.evaluate(async (url) => {
    const harness = await import(/* @vite-ignore */ url);
    await harness.mountMediaHubVisualHarness();
  }, harnessUrl);
  await expect(
    page.getByRole('heading', { name: getMobileMediaCopy(language).title, level: 2 }),
  ).toBeVisible();
}

async function assertReadyPresentation(page: Page, language: UiLanguage) {
  const copy = getMobileMediaCopy(language);
  await expect(page.getByRole('status').first()).toContainText(copy.ready);
  await expect(page.locator('audio')).toHaveCount(1);
  await expect(page.locator('audio')).toHaveAttribute('preload', 'none');
  await expect(page.locator('audio')).not.toHaveAttribute('controls');
  await expect(page.locator('audio')).not.toHaveAttribute('src', /./u);
  expect(
    await page
      .locator('.mobile-media-view')
      .evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
  ).toBe(true);
  expect(
    await page.locator('body').evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
  ).toBe(true);
  for (const control of await page.getByRole('button').all()) {
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
}

test.beforeEach(async ({ browserName }, info) => {
  test.skip(browserName !== 'chromium' || info.project.name !== 'mobile-390x844');
});

test('G3-021 P4-B captures nine-language media reflow evidence in four themes', async ({
  page,
}, info) => {
  test.setTimeout(240_000);
  for (const language of uiLanguageIds)
    for (const theme of themes)
      for (const reflow of ['normal', 'reflow200'] as const) {
        await mount(page, language);
        await page.evaluate(
          ([nextTheme, fontSize]) => {
            document.documentElement.dataset.theme = nextTheme;
            document.documentElement.style.fontSize = fontSize;
          },
          [theme, reflow === 'reflow200' ? '32px' : '16px'],
        );
        await assertReadyPresentation(page, language);
        await capture(page, info, `g3-021-media-${language}-${theme}-390x844-${reflow}`);
      }
});

test('G3-021 P4-B captures the eight viewport media matrix', async ({ page }, info) => {
  test.setTimeout(240_000);
  for (const [width, height] of [
    [320, 568],
    [360, 800],
    [390, 844],
    [412, 915],
    [600, 960],
    [800, 1280],
    [844, 390],
    [1280, 800],
  ] as const)
    for (const theme of themes) {
      await page.setViewportSize({ width, height });
      await mount(page, 'en');
      await page.evaluate((nextTheme) => {
        document.documentElement.dataset.theme = nextTheme;
      }, theme);
      await assertReadyPresentation(page, 'en');
      await capture(page, info, `g3-021-media-en-${theme}-${width}x${height}`);
    }
});

test('R1 completion action fits all nine languages at normal and enlarged text sizes', async ({
  page,
}, info) => {
  for (const language of uiLanguageIds)
    for (const enlarged of [false, true]) {
      await mount(page, language, 'recovery');
      await page.evaluate((large) => {
        document.documentElement.dataset.theme = large ? 'contrast' : 'dark';
        document.documentElement.style.fontSize = large ? '32px' : '16px';
      }, enlarged);
      const copy = getMobileMediaCopy(language);
      await expect(page.getByRole('status')).toHaveText(copy.interruptedPreparation);
      const action = page.getByRole('button', { name: copy.completePreparation });
      await action.focus();
      await expect(action).toBeFocused();
      const size = await action.boundingBox();
      expect(size?.height).toBeGreaterThanOrEqual(44);
      expect(size?.width).toBeGreaterThanOrEqual(44);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(1);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await capture(
        page,
        info,
        `g3-021-media-recovery-${language}-${enlarged ? 'contrast-reflow200' : 'dark-normal'}`,
      );
    }
});

test('G3-021 P4-B exercises only test-harness status, request, keyboard and Axe cases', async ({
  page,
}, info) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  for (const state of [
    'loading',
    'empty',
    'stale',
    'blocked',
    'protected',
    'storage-failure',
    'player-error',
    'offline',
    'invalid',
    'recovery',
  ] as const) {
    await mount(page, 'de', state);
    const copy = getMobileMediaCopy('de');
    const message =
      state === 'player-error'
        ? copy.playerError
        : state === 'loading'
          ? copy.loading
          : state === 'offline'
            ? copy.offline
            : state === 'recovery'
              ? copy.interruptedPreparation
              : state === 'invalid'
                ? copy.unavailable
                : copy[state === 'storage-failure' ? 'storageFailure' : state];
    await expect(
      page
        .getByRole(
          state === 'blocked' || state === 'protected' || state === 'player-error'
            ? 'alert'
            : 'status',
        )
        .first(),
    ).toContainText(message);
    expect(await page.locator('audio').count()).toBe(state === 'player-error' ? 1 : 0);
    await expect(
      page.getByRole('button', {
        name: state === 'recovery' ? copy.completePreparation : copy.retry,
      }),
    ).toBeVisible();
    expect(
      await page
        .locator('.mobile-media-view')
        .evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    ).toBe(true);
    expect(
      await page.locator('body').evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await capture(page, info, `g3-021-media-status-${state}`);
  }
  await mount(page, 'en');
  await assertReadyPresentation(page, 'en');
  await page.getByRole('button', { name: getMobileMediaCopy('en').play }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: getMobileMediaCopy('en').resume })).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(requested.some((url) => /\.wav(?:$|[?#])/u.test(url))).toBe(false);
});

for (const clockCase of [
  { name: 'test-clock', at: '2026-09-01T12:00:00.000Z', ready: true },
  { name: 'expired', at: '2026-09-03T00:00:00.000Z', ready: false },
] as const) {
  test(`G3-021 P4-B binds the actual route to exactly one ${clockCase.name} clock`, async ({
    page,
  }, info) => {
    // Playwright gives each test its own Page and storage context. There is
    // exactly one init script in each clock case, with no ordering dependency.
    const timestamp = Date.parse(clockCase.at);
    await page.addInitScript((fixed) => {
      Date.now = () => fixed;
    }, timestamp);
    const audioRequests: string[] = [];
    page.on('request', (request) => {
      if (/\.wav(?:$|[?#])/u.test(request.url())) audioRequests.push(request.url());
    });
    await page.goto('/#media');
    expect(await page.evaluate(() => Date.now())).toBe(timestamp);
    if (clockCase.ready) {
      await expect(page.locator('.mobile-media-card')).toBeVisible();
      await expect(page.locator('audio')).toHaveAttribute('preload', 'none');
      await expect(page.locator('audio')).not.toHaveAttribute('src', /./u);
      await expect(page.locator('.mobile-media-card time')).toHaveAttribute(
        'datetime',
        '2026-09-02T00:00:00.000Z',
      );
    } else {
      await expect(page.locator('.mobile-media-card')).toHaveCount(0);
      await expect(page.getByRole('status')).toContainText(getMobileMediaCopy('en').unavailable);
    }
    expect(await page.evaluate(() => Date.now())).toBe(timestamp);
    expect(audioRequests).toEqual([]);
    await capture(page, info, `g3-021-media-actual-route-${clockCase.name}`);
  });
}

test('G3-021 P4-B keeps the real resume handle through P3 late-save compensation after unmount', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const [hubModule, storeModule, uiModule] = await Promise.all([
      import('/src/mobile-media-hub.ts'),
      import('/src/mobile-media-resume-store.ts'),
      import('/src/mobile-media-hub-ui.tsx'),
    ]);
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(storeModule.mobileMediaResumeDatabaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const actual = await storeModule.openMobileMediaResumeStore();
    let closeCount = 0;
    let releaseSave: (() => void) | undefined;
    let persisted = false;
    const delayed = {
      snapshot: actual.snapshot,
      save: async (...input: Parameters<typeof actual.save>) => {
        const saved = await actual.save(...input);
        persisted = true;
        await new Promise<void>((resolve) => {
          releaseSave = resolve;
        });
        return saved;
      },
      deleteIfExact: actual.deleteIfExact,
      clearExact: actual.clearExact,
      close: () => {
        closeCount += 1;
        actual.close();
      },
    };
    const handle = uiModule.createControllerResumeHandle(delayed);
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const sha256 = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    const expiry = '2030-01-02T00:00:00.000Z';
    const snapshot = {
      control: { generation: 1, active: 'active' as const },
      safety: { generation: 1, revision: 1, entries: [] },
      bundles: {
        active: {
          revision: 1,
          transportSha256: 'b'.repeat(64),
          rawBundle: {
            releaseRaw: JSON.stringify({ validUntil: expiry }),
            documentsRaw: {
              manifest: JSON.stringify({
                episodes: [
                  {
                    id: 'episode',
                    sourceId: 'source',
                    seriesId: 'series',
                    audioAssetId: 'asset',
                    durationMs: 100,
                    title: { en: 'Title' },
                    summary: { en: 'Summary' },
                  },
                ],
                assets: [
                  {
                    id: 'asset',
                    kind: 'audio',
                    mime: 'audio/wav',
                    path: '/local.wav',
                    bytes: 4,
                    sha256,
                  },
                ],
                series: [{ id: 'series' }],
              }),
              admission: JSON.stringify({
                sources: [{ id: 'source', displayName: { en: 'Source' }, validUntil: expiry }],
              }),
              rights: JSON.stringify({
                rights: [
                  {
                    assetId: 'asset',
                    status: 'allowed',
                    expiresAt: expiry,
                    attribution: 'A',
                    territory: 'global',
                  },
                ],
              }),
              consent: JSON.stringify({
                consents: [
                  { episodeId: 'episode', mode: 'local-no-third-party', requiresPrompt: false },
                ],
              }),
            },
          },
        },
      },
    };
    const audio = {
      src: '',
      currentTime: 0.01,
      load() {},
      async play() {},
      pause() {},
      onpause: null as ((event: Event) => void) | null,
      onended: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };
    const hub = hubModule.createMobileMediaHub({
      snapshot: async () => snapshot,
      clock: () => Date.parse('2030-01-01T00:00:00.000Z'),
      resumeStore: handle.store,
      fetch: async () =>
        new Response(bytes, { status: 200, headers: { 'content-type': 'audio/wav' } }),
      audio: () => audio,
      createObjectURL: () => 'blob:late-save',
      revokeObjectURL: () => undefined,
    });
    await hub.player.start();
    audio.onpause?.(new Event('pause'));
    await new Promise<void>((resolve) => {
      const wait = () => (persisted ? resolve() : setTimeout(wait, 0));
      wait();
    });
    hub.unmount();
    handle.closeWhenIdle();
    releaseSave?.();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const checked = await storeModule.openMobileMediaResumeStore();
    const state = await checked.snapshot();
    checked.close();
    // Control oracle: the former immediate-close ordering leaves the actual
    // saved record behind because P3's late exact delete cannot open a new
    // transaction on that already closed handle.
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(storeModule.mobileMediaResumeDatabaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const oldActual = await storeModule.openMobileMediaResumeStore();
    let releaseOldSave: (() => void) | undefined;
    let oldPersisted = false;
    const oldDelayed = {
      snapshot: oldActual.snapshot,
      save: async (...input: Parameters<typeof oldActual.save>) => {
        const saved = await oldActual.save(...input);
        oldPersisted = true;
        await new Promise<void>((resolve) => {
          releaseOldSave = resolve;
        });
        return saved;
      },
      deleteIfExact: oldActual.deleteIfExact,
      clearExact: oldActual.clearExact,
      close: oldActual.close,
    };
    const oldAudio = {
      src: '',
      currentTime: 0.01,
      load() {},
      async play() {},
      pause() {},
      onpause: null as ((event: Event) => void) | null,
      onended: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };
    const oldHub = hubModule.createMobileMediaHub({
      snapshot: async () => snapshot,
      clock: () => Date.parse('2030-01-01T00:00:00.000Z'),
      resumeStore: oldDelayed,
      fetch: async () =>
        new Response(bytes, { status: 200, headers: { 'content-type': 'audio/wav' } }),
      audio: () => oldAudio,
      createObjectURL: () => 'blob:immediate-close',
      revokeObjectURL: () => undefined,
    });
    await oldHub.player.start();
    oldAudio.onpause?.(new Event('pause'));
    await new Promise<void>((resolve) => {
      const wait = () => (oldPersisted ? resolve() : setTimeout(wait, 0));
      wait();
    });
    oldHub.unmount();
    oldActual.close();
    releaseOldSave?.();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const oldChecked = await storeModule.openMobileMediaResumeStore();
    const oldState = await oldChecked.snapshot();
    oldChecked.close();
    return { closeCount, state, oldState };
  });
  expect(result.closeCount).toBe(1);
  expect(result.state).toEqual({ generation: 2, records: [] });
  expect(result.oldState).toMatchObject({
    generation: 1,
    records: [{ positionMs: 10, durationMs: 100 }],
  });
});

test('R1 controller recovery completes only the committed candidate after unmount', async ({
  page,
}, info) => {
  test.setTimeout(30_000);
  await page.goto('/');
  const initial = await page.evaluate(async (url) => {
    const [harness, catalogModule, resumeModule, releaseModule] = await Promise.all([
      import(/* @vite-ignore */ url),
      import('/src/mobile-media-catalog-store.ts'),
      import('/src/mobile-media-resume-store.ts'),
      import('/src/mobile-media-release.ts'),
    ]);
    const erase = () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(catalogModule.mobileMediaCatalogDatabaseName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    await erase();
    const now = () => Date.parse('2026-09-01T12:00:00.000Z');
    await harness.mountMediaHubControllerHarness({
      language: 'en',
      now,
      adapters: {
        openCatalog: async (clock: () => number) => {
          const actual = await catalogModule.openMobileMediaCatalogStore(clock);
          return {
            ...actual,
            saveCandidate: async (...input: Parameters<typeof actual.saveCandidate>) => {
              const saved = await actual.saveCandidate(...input);
              (window as Window & { __r1SaveCommitted?: boolean }).__r1SaveCommitted = true;
              return new Promise<typeof saved>((resolve) => {
                (window as Window & { __r1ReleaseSave?: () => void }).__r1ReleaseSave = () =>
                  resolve(saved);
              });
            },
          };
        },
        openResume: () => resumeModule.openMobileMediaResumeStore(),
        load: (signal: AbortSignal, clock: () => number) =>
          releaseModule.loadMobileMediaRelease(signal, releaseModule.mobileMediaBuildPin, fetch, {
            clock,
          }),
      },
    });
    return true;
  }, harnessUrl);
  expect(initial).toBe(true);
  await page.waitForFunction(
    () => (window as Window & { __r1SaveCommitted?: boolean }).__r1SaveCommitted === true,
  );
  await page.evaluate(async (url) => {
    const [harness, catalogModule] = await Promise.all([
      import(/* @vite-ignore */ url),
      import('/src/mobile-media-catalog-store.ts'),
    ]);
    harness.unmountMediaHubControllerHarness();
    (window as Window & { __r1ReleaseSave?: () => void }).__r1ReleaseSave?.();
    await new Promise((resolve) => setTimeout(resolve, 20));
    const checked = await catalogModule.openMobileMediaCatalogStore(() =>
      Date.parse('2026-09-01T12:00:00.000Z'),
    );
    const snapshot = await checked.snapshot();
    checked.close();
    (window as Window & { __r1Snapshot?: unknown }).__r1Snapshot = snapshot;
  }, harnessUrl);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as Window & {
              __r1Snapshot?: {
                control: { generation: number; active: unknown; candidate: unknown };
              };
            }
          ).__r1Snapshot,
      ),
    )
    .toMatchObject({ control: { generation: 1, active: null, candidate: 'candidate' } });
  await page.evaluate(async (url) => {
    const [harness, catalogModule, resumeModule, releaseModule] = await Promise.all([
      import(/* @vite-ignore */ url),
      import('/src/mobile-media-catalog-store.ts'),
      import('/src/mobile-media-resume-store.ts'),
      import('/src/mobile-media-release.ts'),
    ]);
    let activates = 0;
    await harness.mountMediaHubControllerHarness({
      language: 'en',
      now: () => Date.parse('2026-09-01T12:00:00.000Z'),
      adapters: {
        openCatalog: async (clock: () => number) => {
          const actual = await catalogModule.openMobileMediaCatalogStore(clock);
          return {
            ...actual,
            activate: async (...input: Parameters<typeof actual.activate>) => {
              activates += 1;
              return actual.activate(...input);
            },
          };
        },
        openResume: () => resumeModule.openMobileMediaResumeStore(),
        load: (signal: AbortSignal, clock: () => number) =>
          releaseModule.loadMobileMediaRelease(signal, releaseModule.mobileMediaBuildPin, fetch, {
            clock,
          }),
      },
    });
    (window as Window & { __r1Activates?: () => number }).__r1Activates = () => activates;
  }, harnessUrl);
  await expect(page.getByRole('button', { name: 'Complete local preparation' })).toBeVisible();
  expect(
    await page.evaluate(() =>
      (window as Window & { __r1Activates?: () => number }).__r1Activates?.(),
    ),
  ).toBe(0);
  await page.getByRole('button', { name: 'Complete local preparation' }).click();
  await expect(page.locator('.mobile-media-card')).toBeVisible();
  await capture(page, info, 'g3-021-media-controller-recovery');
  expect(
    await page.evaluate(() =>
      (window as Window & { __r1Activates?: () => number }).__r1Activates?.(),
    ),
  ).toBe(1);
  const recovered = await page.evaluate(async () => {
    const catalogModule = await import('/src/mobile-media-catalog-store.ts');
    const checked = await catalogModule.openMobileMediaCatalogStore(() =>
      Date.parse('2026-09-01T12:00:00.000Z'),
    );
    const snapshot = await checked.snapshot();
    checked.close();
    return snapshot;
  });
  expect(recovered.control).toMatchObject({ generation: 2, active: 'active', candidate: null });
  await page.evaluate(async (url) => {
    const [harness, catalogModule, resumeModule] = await Promise.all([
      import(/* @vite-ignore */ url),
      import('/src/mobile-media-catalog-store.ts'),
      import('/src/mobile-media-resume-store.ts'),
    ]);
    harness.unmountMediaHubControllerHarness();
    const counts = { load: 0, activate: 0 };
    harness.mountMediaHubControllerHarness({
      language: 'en',
      now: () => Date.parse('2026-09-01T12:00:00.000Z'),
      adapters: {
        openCatalog: async (clock: () => number) => {
          const actual = await catalogModule.openMobileMediaCatalogStore(clock);
          return {
            ...actual,
            activate: async (generation: number) => {
              counts.activate += 1;
              return actual.activate(generation);
            },
          };
        },
        openResume: () => resumeModule.openMobileMediaResumeStore(),
        load: async () => {
          counts.load += 1;
          throw new Error('Unexpected remount load');
        },
      },
    });
    (window as Window & { __r1RemountCounts?: unknown }).__r1RemountCounts = counts;
  }, harnessUrl);
  await expect(page.locator('.mobile-media-card')).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as Window & { __r1RemountCounts?: unknown }).__r1RemountCounts,
    ),
  ).toEqual({ load: 0, activate: 0 });
  const remounted = await page.evaluate(async () => {
    const catalogModule = await import('/src/mobile-media-catalog-store.ts');
    const checked = await catalogModule.openMobileMediaCatalogStore(() =>
      Date.parse('2026-09-01T12:00:00.000Z'),
    );
    try {
      return await checked.snapshot();
    } finally {
      checked.close();
    }
  });
  expect(remounted).toEqual(recovered);
});

test('R1 real-Hub oracle: an older ready Catalog snapshot cannot replace a newer safety-blocked projection', async ({
  page,
}) => {
  test.setTimeout(30_000);
  await page.goto('/');
  await page.evaluate(async (url) => {
    const [harness, catalogModule, resumeModule, releaseModule] = await Promise.all([
      import(/* @vite-ignore */ url),
      import('/src/mobile-media-catalog-store.ts'),
      import('/src/mobile-media-resume-store.ts'),
      import('/src/mobile-media-release.ts'),
    ]);
    const now = () => Date.parse('2026-09-01T12:00:00.000Z');
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(catalogModule.mobileMediaCatalogDatabaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const seed = await catalogModule.openMobileMediaCatalogStore(now);
    const loaded = await releaseModule.loadMobileMediaRelease(
      new AbortController().signal,
      releaseModule.mobileMediaBuildPin,
      fetch,
      { clock: now },
    );
    if (loaded.kind !== 'ready') throw new Error('expected ready release');
    const saved = await seed.saveCandidate({ rawBundle: loaded.rawBundle, expectedGeneration: 0 });
    await seed.activate(saved.control.generation);
    seed.close();
    await harness.mountMediaHubControllerHarness({
      language: 'en',
      now,
      adapters: {
        openCatalog: async (clock: () => number) => {
          const actual = await catalogModule.openMobileMediaCatalogStore(clock);
          const base = await actual.snapshot();
          const episodeId = JSON.parse(base.bundles.active.rawBundle.documentsRaw.manifest)
            .episodes[0].id;
          const blocked = {
            ...base,
            safety: {
              generation: base.safety.generation + 1,
              revision: base.safety.revision + 1,
              entries: [{ targetKind: 'episode', targetId: episodeId, targetHash: null }],
            },
          };
          let calls = 0;
          return {
            ...actual,
            snapshot: () => {
              calls += 1;
              const call = calls;
              if (call === 3 || call === 4)
                return new Promise<typeof base>((resolve) => {
                  const state = window as Window & {
                    __r1ResolveSnapshot?: (index: number) => void;
                  };
                  const previous = state.__r1ResolveSnapshot;
                  state.__r1ResolveSnapshot = (index) => {
                    if (index === call) resolve(base);
                    else previous?.(index);
                  };
                });
              return Promise.resolve(call >= 5 ? blocked : base);
            },
          };
        },
        openResume: () => resumeModule.openMobileMediaResumeStore(),
        load: (signal: AbortSignal, clock: () => number) =>
          releaseModule.loadMobileMediaRelease(signal, releaseModule.mobileMediaBuildPin, fetch, {
            clock,
          }),
      },
    });
  }, harnessUrl);
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  await page.getByRole('button', { name: 'Play' }).click();
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.getByRole('alert')).toContainText(getMobileMediaCopy('en').blocked);
  await page.evaluate(() =>
    (window as Window & { __r1ResolveSnapshot?: (index: number) => void }).__r1ResolveSnapshot?.(4),
  );
  await expect(page.locator('.mobile-media-card')).toHaveCount(0);
});

type RecoveryProbe = {
  counts(): { reads: number; attempts: number; completed: number; error: string | null };
  releaseRead(): void;
  releaseActivate(): void;
  state(): Promise<unknown>;
  unmount(): void;
};
type RecoveryScenario =
  | 'before-read-change'
  | 'cas-conflict'
  | 'expired'
  | 'double-read'
  | 'double-activate'
  | 'unmount-read';

async function prepareRecoveryScenario(page: Page, scenario: RecoveryScenario) {
  await page.goto('/');
  return page.evaluate(
    async ({ url, scenario }) => {
      const [harness, catalogModule, resumeModule, releaseModule] = await Promise.all([
        import(/* @vite-ignore */ url),
        import('/src/mobile-media-catalog-store.ts'),
        import('/src/mobile-media-resume-store.ts'),
        import('/src/mobile-media-release.ts'),
      ]);
      const fixed = Date.parse('2026-09-01T12:00:00.000Z');
      let clock = fixed;
      const now = () => clock;
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(catalogModule.mobileMediaCatalogDatabaseName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      const seed = await catalogModule.openMobileMediaCatalogStore(now);
      const loaded = await releaseModule.loadMobileMediaRelease(
        new AbortController().signal,
        releaseModule.mobileMediaBuildPin,
        fetch,
        { clock: now },
      );
      if (loaded.kind !== 'ready') throw new Error('Expected valid test release');
      const baseline = await seed.saveCandidate({
        rawBundle: loaded.rawBundle,
        expectedGeneration: 0,
      });
      seed.close();
      // Test-only competing writer: change the real IDB generation while keeping
      // every bundle byte intact. The controller must fail its old confirmation.
      const shiftGeneration = async () => {
        const database = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(catalogModule.mobileMediaCatalogDatabaseName);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          await new Promise<void>((resolve, reject) => {
            const transaction = database.transaction('mediaControl', 'readwrite');
            transaction.oncomplete = () => resolve();
            transaction.onabort = transaction.onerror = () => reject(transaction.error);
            const store = transaction.objectStore('mediaControl');
            const request = store.get('control');
            request.onsuccess = () =>
              store.put({ ...request.result, generation: request.result.generation + 1 });
          });
        } finally {
          database.close();
        }
      };
      const counts = { reads: 0, attempts: 0, completed: 0, error: null as string | null };
      let releaseRead = () => {
        throw new Error('No pending read');
      };
      let releaseActivate = () => {
        throw new Error('No pending activate');
      };
      harness.mountMediaHubControllerHarness({
        language: 'en',
        now,
        adapters: {
          openCatalog: async () => {
            const actual = await catalogModule.openMobileMediaCatalogStore(now);
            return {
              ...actual,
              snapshot: async () => {
                counts.reads += 1;
                if (scenario === 'before-read-change' && counts.reads === 3)
                  await shiftGeneration();
                const value = await actual.snapshot();
                if (
                  (scenario === 'double-read' || scenario === 'unmount-read') &&
                  counts.reads === 3
                )
                  return new Promise<typeof value>((resolve) => {
                    releaseRead = () => resolve(value);
                  });
                return value;
              },
              activate: async (generation: number) => {
                counts.attempts += 1;
                if (scenario === 'cas-conflict') await shiftGeneration();
                if (scenario === 'expired') clock = Date.parse('2026-09-03T00:00:00.000Z');
                if (scenario === 'double-activate')
                  await new Promise<void>((resolve) => {
                    releaseActivate = resolve;
                  });
                try {
                  const result = await actual.activate(generation);
                  counts.completed += 1;
                  return result;
                } catch (error) {
                  counts.error =
                    error instanceof catalogModule.MobileMediaCatalogError ? error.code : 'unknown';
                  throw error;
                }
              },
            };
          },
          openResume: () => resumeModule.openMobileMediaResumeStore(),
          load: async () => {
            throw new Error('Existing Candidate must never reload automatically');
          },
        },
      });
      (window as Window & { __recoveryProbe?: RecoveryProbe }).__recoveryProbe = {
        counts: () => ({ ...counts }),
        releaseRead: () => releaseRead(),
        releaseActivate: () => releaseActivate(),
        unmount: () => harness.unmountMediaHubControllerHarness(),
        state: async () => {
          const checked = await catalogModule.openMobileMediaCatalogStore(() => fixed);
          try {
            return await checked.snapshot();
          } finally {
            checked.close();
          }
        },
      };
      return baseline;
    },
    { url: harnessUrl, scenario },
  );
}

for (const scenario of [
  'before-read-change',
  'cas-conflict',
  'expired',
  'double-read',
  'double-activate',
  'unmount-read',
] as const) {
  test(`R1 real Catalog recovery respects ${scenario}`, async ({ page }, info) => {
    const errors: string[] = [];
    const audioRequests: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (/\.wav(?:$|[?#])/u.test(request.url())) audioRequests.push(request.url());
    });
    const baseline = await prepareRecoveryScenario(page, scenario);
    const action = page.getByRole('button', { name: getMobileMediaCopy('en').completePreparation });
    await expect(action).toBeEnabled();
    expect(
      await page.evaluate(
        () =>
          (window as Window & { __recoveryProbe?: RecoveryProbe }).__recoveryProbe!.counts()
            .attempts,
      ),
    ).toBe(0);
    if (scenario === 'double-read' || scenario === 'double-activate') {
      await action.dblclick();
      await expect(action).toBeDisabled();
      const held = await page.evaluate(() =>
        (window as Window & { __recoveryProbe?: RecoveryProbe }).__recoveryProbe!.counts(),
      );
      expect(held).toMatchObject({
        reads: 3,
        attempts: scenario === 'double-read' ? 0 : 1,
        completed: 0,
      });
      if (scenario === 'double-read')
        await capture(page, info, 'g3-021-media-controller-recovery-busy');
      await page.evaluate((read) => {
        const p = (window as Window & { __recoveryProbe?: RecoveryProbe }).__recoveryProbe!;
        if (read) p.releaseRead();
        else p.releaseActivate();
      }, scenario === 'double-read');
      await expect(page.locator('.mobile-media-card')).toBeVisible();
    } else {
      await action.click();
      if (scenario === 'unmount-read') {
        await expect(action).toBeDisabled();
        await page.evaluate(() => {
          const p = (window as Window & { __recoveryProbe?: RecoveryProbe }).__recoveryProbe!;
          p.unmount();
          p.releaseRead();
        });
        await expect(page.locator('.mobile-media-view')).toHaveCount(0);
      } else if (scenario === 'expired') {
        await expect(page.getByRole('status')).toHaveText(getMobileMediaCopy('en').unavailable);
      } else await expect(action).toBeEnabled();
    }
    const counts = await page.evaluate(() =>
      (window as Window & { __recoveryProbe?: RecoveryProbe }).__recoveryProbe!.counts(),
    );
    const after = await page.evaluate(() =>
      (window as Window & { __recoveryProbe?: RecoveryProbe }).__recoveryProbe!.state(),
    );
    if (scenario === 'double-read' || scenario === 'double-activate') {
      expect(counts).toMatchObject({ attempts: 1, completed: 1, error: null });
      expect(after).toMatchObject({
        control: { generation: 2, active: 'active', candidate: null },
      });
    } else {
      expect(counts).toMatchObject({
        attempts: scenario === 'expired' || scenario === 'cas-conflict' ? 1 : 0,
        completed: 0,
        error:
          scenario === 'expired'
            ? 'invalid-candidate'
            : scenario === 'cas-conflict'
              ? 'conflict'
              : null,
      });
      expect(after).toEqual(
        scenario === 'before-read-change' || scenario === 'cas-conflict'
          ? { ...baseline, control: { ...baseline.control, generation: 2 } }
          : baseline,
      );
      await expect(page.locator('.mobile-media-card')).toHaveCount(0);
    }
    expect(counts.reads).toBeLessThanOrEqual(6);
    expect(errors).toEqual([]);
    expect(audioRequests).toEqual([]);
    if (scenario === 'expired' || scenario === 'cas-conflict')
      await capture(page, info, `g3-021-media-controller-${scenario}`);
    await page.evaluate(() =>
      (window as Window & { __recoveryProbe?: RecoveryProbe }).__recoveryProbe!.unmount(),
    );
  });
}
