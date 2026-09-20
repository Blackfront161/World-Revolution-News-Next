import { copyFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { getUiCopy, uiLanguageIds } from '../../packages/ui-language/src';

const themes = ['dark', 'light', 'pink', 'contrast'] as const;
async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  const root = process.env.WRN_EVIDENCE_ROOT;
  if (root) {
    await mkdir(resolve(root), { recursive: true });
    await copyFile(
      path,
      join(resolve(root), `${process.env.WRN_EVIDENCE_REVISION ?? 'local'}_${name}.png`),
    );
  }
  await info.attach(name, { path, contentType: 'image/png' });
}
async function openReader(page: Page, article = 'wrn-test-art-cedar') {
  await page.goto(`/?state=ready#article/${article}`);
  await expect(
    page.getByRole('heading', { name: /Lokale Testmeldung|Local fixture|Nota local/u }),
  ).toBeFocused();
  const sidecarResponse = await page.evaluate(async () => {
    const response = await fetch('/wrn-mobile-reader-v2/v1/mobile-reader-v2.json', {
      cache: 'no-store',
    });
    const bytes = await response.clone().arrayBuffer();
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    return {
      status: response.status,
      contentType: response.headers.get('content-type'),
      sha256: [...digest].map((value) => value.toString(16).padStart(2, '0')).join(''),
    };
  });
  expect(sidecarResponse).toEqual({
    status: 200,
    contentType: 'application/json',
    sha256: 'f51e992443f47aa8eaa6063783533fae91c37f44ece27480016b265f0d5b0874',
  });
  const releaseIdentity = await page.evaluate(async () => {
    const [descriptor, manifest, details] = await Promise.all([
      fetch('/wrn-local-release/v1/release-descriptor.json').then((response) => response.json()),
      fetch('/wrn-local-release/v1/manifest.json').then((response) => response.json()),
      fetch('/wrn-local-release/v1/reader-details.json').then((response) => response.json()),
    ]);
    return {
      releaseRevision: descriptor.releaseRevision,
      manifestSha256: descriptor.expectedManifest.sha256,
      readerDetailsRevision: details.revision,
      readerDetailsWholeDocumentSha256: descriptor.expectedComponents.readerDetails.sha256,
      readerDetailsIntegritySha256: details.integritySha256,
      manifestRevision: manifest.revision,
    };
  });
  expect(releaseIdentity).toEqual({
    releaseRevision: 'wrn-g3-016-mobile-home-release-v1',
    manifestSha256: '77244d6774a91b30af2898f2c8ccf98633e8fcb609d4807852e0ea991db562f4',
    readerDetailsRevision: 'wrn-g3-016-local-home-reader-v1',
    readerDetailsWholeDocumentSha256:
      'cb87e281ad020872ae7fdade538c0764db057d0b31e9543ed08b8a62cd3c0e14',
    readerDetailsIntegritySha256:
      'e821e8ffe3845d9e8cbe83317add309987bce4aa673461e9ebe5ad403b534b99',
    manifestRevision: 'wrn-g3-016-mobile-home-manifest-v1',
  });
  await expect(page.locator('[data-reader-v2]')).toBeVisible();
}
async function expectReaderGeometry(page: Page) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const controls = [
      ...document.querySelectorAll<HTMLElement>('.mobile-reader button, .mobile-reader summary'),
    ];
    return {
      overflow: root.scrollWidth > root.clientWidth + 1,
      controls: controls.map((item) => item.getBoundingClientRect()),
    };
  });
  expect(result.overflow).toBe(false);
  expect(result.controls.every((item) => item.width >= 44 && item.height >= 44)).toBe(true);
}
test.beforeEach(async ({ browserName }, info) => {
  test.skip(browserName !== 'chromium' || info.project.name !== 'mobile-390x844');
});

test('G3-019 captures the nine-language four-theme Reader-v2 reflow matrix', async ({
  page,
}, info) => {
  test.setTimeout(180_000);
  await openReader(page);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px';
  });
  for (const language of uiLanguageIds) {
    const copy = getUiCopy(language);
    await page.getByTestId('ui-language-selector').selectOption(language);
    await expect(page.getByRole('button', { name: copy.readerV2TranslateBlock })).toBeVisible();
    for (const theme of themes) {
      await page.getByTestId('theme-selector').selectOption(theme);
      await expectReaderGeometry(page);
      if (language === 'en')
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await capture(page, info, `g3-019-reader-${language}-${theme}-390x844-reflow200`);
    }
  }
});

test('G3-019 keeps v1 text and Reader-v2 states accessible across required viewports', async ({
  page,
}, info) => {
  test.setTimeout(180_000);
  await openReader(page);
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [600, 960],
    [844, 390],
  ] as const) {
    for (const [language, theme] of [
      ['en', 'dark'],
      ['de', 'light'],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.getByTestId('ui-language-selector').selectOption(language);
      await page.getByTestId('theme-selector').selectOption(theme);
      await expectReaderGeometry(page);
      await capture(page, info, `g3-019-reader-${language}-${theme}-${width}x${height}`);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId('theme-selector').selectOption('pink');
  await page.getByTestId('ui-language-selector').selectOption('de');
  await expect(page.getByText(getUiCopy('de').readerV2TranslationDisabled)).toBeVisible();
  await capture(page, info, 'g3-019-reader-translation-disabled-de-pink');
  await page.getByTestId('ui-language-selector').selectOption('en');
  await page.getByTestId('theme-selector').selectOption('contrast');
  const profile = page.locator('.reader-v2-source-profile');
  await capture(page, info, 'g3-019-reader-source-profile-closed-en-contrast');
  await profile.locator('summary').click();
  await expect(profile).toHaveAttribute('open', '');
  await capture(page, info, 'g3-019-reader-source-profile-open-en-contrast');
  await page.goto('/?state=ready&theme=light#article/wrn-test-art-fern');
  await page.getByTestId('ui-language-selector').selectOption('de');
  await expect(page.getByText(getUiCopy('de').readerV2Ambiguous)).toBeVisible();
  await capture(page, info, 'g3-019-reader-ambiguous-de-light');
  await page.goto('/?state=offline&theme=dark#article/wrn-test-art-cedar');
  await page.getByTestId('ui-language-selector').selectOption('en');
  await expect(page.getByText(getUiCopy('en').readerOffline)).toBeVisible();
  await capture(page, info, 'g3-019-reader-offline-en-dark');
  await page.goto('/?state=ready&theme=dark#archive/wrn-test-art-cedar');
  await page.getByTestId('ui-language-selector').selectOption('en');
  await expect(
    page.getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
  ).toBeVisible();
  await expect(page.locator('[data-reader-v2]')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: getUiCopy('en').readerV2TranslateBlock }),
  ).toHaveCount(0);
  await expectReaderGeometry(page);
  await capture(page, info, 'g3-019-reader-v1-fallback-en-dark');
});
