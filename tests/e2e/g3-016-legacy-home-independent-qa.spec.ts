import { createHash } from 'node:crypto';
import { copyFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { canonicalJson } from '../../packages/content-contracts/src';

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

type JsonRecord = Record<string, unknown>;

function sha256(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
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

async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await info.attach(name, { path, contentType: 'image/png' });
  const root = process.env.WRN_EVIDENCE_ROOT;
  if (!root) return;
  await mkdir(resolve(root), { recursive: true });
  await copyFile(
    path,
    join(resolve(root), `${process.env.WRN_EVIDENCE_REVISION ?? 'p5-q1'}_${name}.png`),
  );
}

async function routeManifestVariant(page: Page, variant: 'legacy' | 'invalid') {
  const manifestResponse = await page.request.get('/wrn-local-release/v1/manifest.json');
  const descriptorResponse = await page.request.get(
    '/wrn-local-release/v1/release-descriptor.json',
  );
  const publicationResponse = await page.request.get(
    '/wrn-local-release/v1/website-publication.json',
  );
  expect(manifestResponse.ok()).toBe(true);
  expect(descriptorResponse.ok()).toBe(true);
  expect(publicationResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as JsonRecord;
  const descriptor = (await descriptorResponse.json()) as JsonRecord;
  const publication = (await publicationResponse.json()) as JsonRecord;
  expect(sha256(manifest)).toBe((descriptor.expectedManifest as JsonRecord).sha256);
  const variantManifest: JsonRecord = structuredClone(manifest);
  if (variant === 'legacy') delete variantManifest.homePresentation;
  else variantManifest.homePresentation = { contractVersion: '1.0.0', malformed: true };
  const variantDescriptor: JsonRecord = structuredClone(descriptor);
  const expectedManifest = variantDescriptor.expectedManifest as JsonRecord;
  expectedManifest.sha256 = sha256(variantManifest);
  const variantPublication: JsonRecord = structuredClone(publication);
  (variantPublication.sourceManifest as JsonRecord).integritySha256 = expectedManifest.sha256;
  ((variantDescriptor.expectedComponents as JsonRecord).websitePublication as JsonRecord).sha256 =
    sha256(variantPublication);
  await page.route('**/wrn-local-release/v1/manifest.json', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(variantManifest) }),
  );
  await page.route('**/wrn-local-release/v1/release-descriptor.json', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(variantDescriptor) }),
  );
  await page.route('**/wrn-local-release/v1/website-publication.json', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(variantPublication) }),
  );
}

async function expectGeometry(page: Page) {
  const geometry = await page.evaluate(() => {
    const root = document.documentElement;
    const controls = [...document.querySelectorAll<HTMLElement>('button:enabled, a[href], select')]
      .filter((node) => {
        const style = getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })
      .map((node) => {
        const box = node.getBoundingClientRect();
        return { width: box.width, height: box.height };
      });
    return {
      overflow: root.scrollWidth > root.clientWidth + 1,
      cardOverflow: [...document.querySelectorAll<HTMLElement>('.home-card')].some(
        (card) => card.scrollWidth > card.clientWidth + 1,
      ),
      controls,
    };
  });
  expect(geometry.overflow).toBe(false);
  expect(geometry.cardOverflow).toBe(false);
  expect(geometry.controls.every((control) => control.width >= 44 && control.height >= 44)).toBe(
    true,
  );
}

async function expectLegacyHome(page: Page) {
  await expect(page.getByTestId('manifest-revision')).toContainText(
    'wrn-g3-016-mobile-home-manifest-v1',
  );
  await expect(page.locator('[data-home-mode="legacy"]')).toHaveCount(1);
  await expect(page.locator('article[data-home-role]')).toHaveCount(0);
  expect(
    await page
      .locator('article[data-article-id]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-article-id'))),
  ).toEqual(expectedIds);
  await expect(page.getByRole('link', { name: /all sport news/i })).toHaveCount(0);
  await expect(page.locator('.home-sport')).toHaveCount(0);
}

test.beforeEach(async ({ browserName }, info) => {
  test.skip(browserName !== 'chromium' || info.project.name !== 'mobile-390x844');
});

test('S5-Q1 independently verifies legacy Home order, Reader, Save/Remove, EN/DE, four themes and reflow', async ({
  browser,
}, info) => {
  test.setTimeout(300_000);
  for (const language of ['en', 'de'] as const) {
    for (const theme of themes) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      const signals = collectRuntimeSignals(page);
      await page.addInitScript(
        ({ language }) => {
          localStorage.setItem('wrn.mobile-ui-language.v1', language);
        },
        { language },
      );
      await routeManifestVariant(page, 'legacy');
      const deliveredManifest = page.waitForResponse((response) =>
        response.url().endsWith('/wrn-local-release/v1/manifest.json'),
      );
      await page.goto(`/?state=ready&theme=${theme}`);
      const manifestResponse = await deliveredManifest;
      expect(manifestResponse.status()).toBe(200);
      expect((await manifestResponse.json()).homePresentation).toBeUndefined();
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expectLegacyHome(page);
      await expectGeometry(page);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await capture(page, info, `legacy-${language}-${theme}-390x844`);

      if (language === 'en' && theme === 'dark') {
        const first = page.locator('article[data-article-id]').first();
        const reader = first.locator('[data-reader-trigger]');
        await reader.focus();
        await expect(reader).toBeFocused();
        await reader.press('Enter');
        await expect(page).toHaveURL(/#article\/wrn-test-art-cedar/u);
        await expect(page.locator('#mobile-reader-title')).toBeFocused();
        await page.goBack();
        await expect(reader).toBeFocused();
        const save = first.getByRole('button', { name: 'Save for later' });
        await save.click();
        await expect(first.getByRole('button', { name: 'Remove from saved' })).toBeVisible();
        await first.getByRole('button', { name: 'Remove from saved' }).click();
        await expect(save).toBeVisible();
      }

      await page.evaluate(() => {
        document.documentElement.style.fontSize = '32px';
      });
      await expect(page.locator('.mobile-shell')).toHaveAttribute(
        'data-wide-language-layout',
        'true',
      );
      await expectGeometry(page);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await capture(page, info, `legacy-${language}-${theme}-reflow-200pct`);
      expect(signals.external).toEqual([]);
      expect(signals.errors).toEqual([]);
      expect(await context.cookies()).toEqual([]);
      await context.close();
    }
  }
});

test('S5-Q1 keeps an invalid present Home contract fail-closed and the current contract at 1+5+1+2', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const invalidContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const invalidPage = await invalidContext.newPage();
  const invalidSignals = collectRuntimeSignals(invalidPage);
  await routeManifestVariant(invalidPage, 'invalid');
  await invalidPage.goto('/?state=ready&theme=dark');
  await expect(invalidPage.getByRole('alert')).toBeVisible();
  await expect(invalidPage.locator('article[data-article-id]')).toHaveCount(0);
  await expect(invalidPage.locator('[data-home-mode="legacy"]')).toHaveCount(0);
  await expect(invalidPage.getByRole('link', { name: /all sport news/i })).toHaveCount(0);
  expect(invalidSignals.external).toEqual([]);
  expect(invalidSignals.errors).toEqual([]);
  expect(await invalidContext.cookies()).toEqual([]);
  await invalidContext.close();

  const currentContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const currentPage = await currentContext.newPage();
  const currentSignals = collectRuntimeSignals(currentPage);
  await currentPage.goto('/?state=ready&theme=dark');
  await expect(currentPage.locator('[data-home-role="lead"]')).toHaveCount(1);
  await expect(currentPage.locator('[data-home-role="main"]')).toHaveCount(5);
  await expect(currentPage.locator('[data-home-role="sport-feature"]')).toHaveCount(1);
  await expect(currentPage.locator('[data-home-role="sport-secondary"]')).toHaveCount(2);
  await expect(currentPage.locator('[data-home-mode="legacy"]')).toHaveCount(0);
  await expectGeometry(currentPage);
  expect((await new AxeBuilder({ page: currentPage }).analyze()).violations).toEqual([]);
  expect(currentSignals.external).toEqual([]);
  expect(currentSignals.errors).toEqual([]);
  expect(await currentContext.cookies()).toEqual([]);
  await currentContext.close();
});
