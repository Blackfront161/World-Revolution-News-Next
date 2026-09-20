import { copyFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import type { RegionalEventBundleV1 } from '../../packages/content-contracts/src/mobile-regional-events-v1';
import { getUiCopy, uiLanguageIds, type UiLanguage } from '../../packages/ui-language/src';

const themes = ['dark', 'light', 'pink', 'contrast'] as const;
const harnessUrl =
  '/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes%20Wo%20Rev%20Ne/tests/e2e/g3-020-regional-events-visual-harness.tsx';
const hash = 'a'.repeat(64);
const names = (prefix: string) =>
  Object.freeze({
    en: `${prefix} EN`,
    de: `${prefix} DE`,
    es: `${prefix} ES`,
    fr: `${prefix} FR`,
    it: `${prefix} IT`,
    pt: `${prefix} PT`,
    ru: `${prefix} RU`,
    el: `${prefix} EL`,
    tr: `${prefix} TR`,
  });

/** Self-authored test-only presentation data. It is never admitted or persisted. */
const presentationalBundle: RegionalEventBundleV1 = Object.freeze({
  schema: 'wrn.mobile-regional-events.v1',
  contractVersion: '1.0.0',
  minimumAppContractVersion: '1.0.0',
  bundleRevision: 1,
  taxonomyRevision: 1,
  generatedAt: '2026-09-01T00:00:00.000Z',
  validUntil: '2026-12-31T00:00:00.000Z',
  locales: uiLanguageIds,
  taxonomySha256: hash,
  sourcesSha256: hash,
  eventsSha256: hash,
  mediaSha256: hash,
  revocationsSha256: hash,
  continents: [{ continentId: 'wrn-cont-presentational', names: names('Continent') }],
  countries: [
    {
      countryId: 'wrn-country-presentational',
      continentId: 'wrn-cont-presentational',
      names: names('Country'),
    },
  ],
  regions: [
    {
      regionId: 'wrn-region-presentational',
      countryId: 'wrn-country-presentational',
      names: names('Active region'),
    },
  ],
  identityLinks: [],
  sources: [
    {
      sourceId: 'wrn-source-presentational',
      names: names('Local source'),
      originalUrl: 'https://regional-events.invalid/presentational',
      rightsStatus: 'self-authored-local-fixture',
      licenseId: 'CC0-1.0',
      rightsReference: 'wrn-rights-presentational',
      provenanceReference: 'wrn-provenance-presentational',
      publishedAt: '2026-09-01T00:00:00.000Z',
      observedAt: '2026-09-01T00:00:00.000Z',
      correctionContactLabel: 'Presentational test contact',
    },
  ],
  events: Array.from({ length: 5 }, (_, index) => ({
    eventId: `wrn-event-presentational-${index + 1}`,
    regionId: 'wrn-region-presentational',
    sourceId: 'wrn-source-presentational',
    status: index === 0 ? ('changed' as const) : ('scheduled' as const),
    titles: names(`Event ${index + 1}`),
    locationNames: names(`Place ${index + 1}`),
    summaries: names(`Summary ${index + 1}`),
    startInstant: `2026-09-${String(index + 2).padStart(2, '0')}T12:00:00.000Z`,
    startLocal: `2026-09-${String(index + 2).padStart(2, '0')}T14:00:00`,
    startUtcOffsetMinutes: 120,
    timeZone: 'Europe/Zurich',
    publishedAt: '2026-09-01T00:00:00.000Z',
    observedAt: '2026-09-01T00:00:00.000Z',
    validUntil: '2026-12-31T00:00:00.000Z',
    contentRevision: 1,
    contentSha256: hash,
    rightsStatus: 'self-authored-local-fixture',
    licenseId: 'CC0-1.0',
    rightsReference: 'wrn-rights-presentational',
    provenanceReference: 'wrn-provenance-presentational',
  })),
  media: [],
  revocationRevision: 0,
  revocations: [],
});

type VisualState =
  | 'loading'
  | 'empty'
  | 'ready-1'
  | 'ready-5'
  | 'stale'
  | 'protected'
  | 'error'
  | 'offline-none'
  | 'offline-lkg'
  | 'invalid-update-lkg'
  | 'invalid-selection'
  | 'reload-required'
  | 'changed'
  | 'cancelled'
  | 'blocked';

const model = (state: VisualState = 'ready-5') => {
  const selected = ![
    'invalid-selection',
    'empty',
    'loading',
    'protected',
    'error',
    'offline-none',
  ].includes(state);
  const cards =
    state === 'ready-1'
      ? presentationalBundle.events.slice(0, 1)
      : [
            'ready-5',
            'offline-lkg',
            'invalid-update-lkg',
            'reload-required',
            'changed',
            'cancelled',
            'blocked',
          ].includes(state)
        ? presentationalBundle.events
        : [];
  const lifecycle =
    state === 'changed'
      ? [{ eventId: 'wrn-event-presentational-1', status: 'changed' as const }]
      : state === 'cancelled'
        ? [{ eventId: 'wrn-event-presentational-cancelled', status: 'cancelled' as const }]
        : state === 'blocked'
          ? [{ eventId: 'wrn-event-presentational-blocked', status: 'blocked' as const }]
          : [];
  const contentStatus =
    state === 'loading'
      ? 'empty'
      : ['stale', 'protected', 'error', 'offline-none'].includes(state)
        ? (state as 'stale' | 'protected' | 'error' | 'offline-none')
        : cards.length === 1
          ? 'ready-1'
          : cards.length === 5
            ? 'ready-5'
            : 'empty';
  return {
    phase:
      state === 'loading'
        ? 'loading'
        : state === 'protected'
          ? 'protected'
          : state === 'error'
            ? 'error'
            : 'ready',
    referenceInstant: '2026-09-01T00:00:00.000Z',
    bundle: ['offline-none', 'error', 'protected'].includes(state) ? null : presentationalBundle,
    safety: [],
    selectionStatus:
      state === 'protected'
        ? 'protected'
        : state === 'invalid-selection'
          ? 'invalid'
          : selected
            ? 'ready'
            : 'inactive',
    selectionGeneration: selected ? 1 : 0,
    selectedRegionId: selected ? 'wrn-region-presentational' : null,
    message: state === 'reload-required' ? 'reload-required' : 'none',
    projection: {
      contentStatus,
      deliveryStatus:
        state === 'offline-lkg' || state === 'offline-none'
          ? 'offline-lkg'
          : state === 'invalid-update-lkg'
            ? 'invalid-update-lkg'
            : 'online',
      events: cards,
      lifecycle,
    },
  } as const;
};

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

async function mount(page: Page, language: UiLanguage, state: VisualState = 'ready-5') {
  await page.unroute('**/__wrn-test__/regional-events-view.json');
  await page.route('**/__wrn-test__/regional-events-view.json', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        language,
        model: model(state),
        drafts: {
          continentId: 'wrn-cont-presentational',
          countryId: 'wrn-country-presentational',
          regionId: 'wrn-region-presentational',
        },
      }),
    }),
  );
  await page.goto('/');
  await page.evaluate(async (url) => {
    const harness = await import(/* @vite-ignore */ url);
    await harness.mountRegionalEventsVisualHarness();
  }, harnessUrl);
  await expect(
    page.getByRole('heading', { name: getUiCopy(language).events, level: 2 }),
  ).toBeVisible();
}

async function assertInteractivePresentation(
  page: Page,
  language: UiLanguage,
  cards: number,
  lifecycle: number,
) {
  expect(await page.locator('.regional-events-card').count()).toBe(cards);
  expect(await page.locator('.regional-events-lifecycle li').count()).toBe(lifecycle);
  expect(await page.locator('time[datetime]').count()).toBe(cards);
  if (cards) {
    await expect(page.locator('.regional-events-card').first()).toContainText('Europe/Zurich');
    await expect(page.locator('.regional-events-card').first()).toContainText(
      `Event 1 ${language.toUpperCase()}`,
    );
  }
  expect(
    await page
      .locator('.regional-events-view')
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

test('G3-020 captures actual nine-language card and selection reflow evidence', async ({
  page,
}, info) => {
  test.setTimeout(240_000);
  for (const language of uiLanguageIds)
    for (const theme of themes)
      for (const reflow of ['normal', 'reflow200'] as const) {
        await mount(page, language);
        await page.evaluate(
          ([nextTheme, zoom]) => {
            document.documentElement.dataset.theme = nextTheme;
            document.documentElement.style.fontSize = zoom;
          },
          [theme, reflow === 'reflow200' ? '32px' : '16px'],
        );
        await assertInteractivePresentation(page, language, 5, 0);
        await expect(page.getByText(getUiCopy(language).eventsSelectionReady)).toBeVisible();
        await expect(page.locator('.regional-events-active-region')).toContainText(
          `Active region ${language.toUpperCase()}`,
        );
        await capture(page, info, `g3-020-events-${language}-${theme}-390x844-${reflow}`);
      }
});

test('G3-020 captures the complete presentational viewport and state matrix', async ({
  page,
}, info) => {
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
      await assertInteractivePresentation(page, 'en', 5, 0);
      await capture(page, info, `g3-020-events-en-${theme}-${width}x${height}`);
    }
  for (const state of [
    'loading',
    'empty',
    'ready-1',
    'ready-5',
    'stale',
    'protected',
    'error',
    'offline-none',
    'offline-lkg',
    'invalid-update-lkg',
    'invalid-selection',
    'reload-required',
    'changed',
    'cancelled',
    'blocked',
  ] as const) {
    await mount(page, 'de', state);
    const cards =
      state === 'ready-1'
        ? 1
        : [
              'ready-5',
              'offline-lkg',
              'invalid-update-lkg',
              'changed',
              'cancelled',
              'blocked',
              'reload-required',
            ].includes(state)
          ? 5
          : 0;
    const lifecycle = ['changed', 'cancelled', 'blocked'].includes(state) ? 1 : 0;
    await assertInteractivePresentation(page, 'de', cards, lifecycle);
    if (state === 'reload-required')
      await expect(page.getByRole('alert')).toContainText(getUiCopy('de').eventsReloadRequired);
    if (lifecycle) await expect(page.locator('.regional-events-lifecycle')).toBeVisible();
    if (['offline-none', 'error', 'protected'].includes(state)) {
      const copy = getUiCopy('de');
      const reload = page.getByRole('button', { name: copy.eventsReload, exact: true });
      await expect(reload).toHaveCount(1);
      await expect(reload).toBeVisible();
      await expect(reload).toBeEnabled();
      await reload.focus();
      await expect(reload).toBeFocused();
      await expect(page.getByText(copy.eventsOnline, { exact: false })).toHaveCount(0);
      await expect(page.getByText(copy.eventsOfflineLkg, { exact: false })).toHaveCount(0);
      if (state === 'offline-none')
        await expect(page.getByText(copy.eventsOfflineNone, { exact: true })).toHaveCount(1);
    }
    await capture(page, info, `g3-020-events-presentational-${state}`);
  }
});

test('G3-020 checks Axe, labels, focus and keyboard flow in every theme', async ({ page }) => {
  for (const theme of themes) {
    await mount(page, 'en', 'changed');
    await page.evaluate((nextTheme) => {
      document.documentElement.dataset.theme = nextTheme;
    }, theme);
    await assertInteractivePresentation(page, 'en', 5, 1);
    const selects = page.locator('.regional-events-select-grid select');
    await expect(selects.first()).toBeVisible();
    await selects.first().focus();
    await page.keyboard.press('Tab');
    await expect(selects.nth(1)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(selects.nth(2)).toBeFocused();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    for (const state of ['offline-none', 'error', 'protected'] as const) {
      await mount(page, 'en', state);
      await page.evaluate((nextTheme) => {
        document.documentElement.dataset.theme = nextTheme;
      }, theme);
      await assertInteractivePresentation(page, 'en', 0, 0);
      const reload = page.getByRole('button', { name: getUiCopy('en').eventsReload, exact: true });
      await expect(reload).toHaveCount(1);
      await expect(reload).toBeEnabled();
      await page.keyboard.press('Tab');
      await expect(reload).toBeFocused();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  }
});
