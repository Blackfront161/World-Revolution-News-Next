import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { getSupportCopy } from '../../../apps/mobile/src/features/support/support-copy';
const languages = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const;
const themes = ['dark', 'oled', 'soft', 'pink', 'light', 'system', 'contrast'] as const;

test('support directory filters and guards expired contacts at click time', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844');
  await page.clock.setFixedTime(new Date('2026-09-09T12:00:00.000Z'));
  const external: string[] = [],
    errors: string[] = [];
  const origin = new URL(testInfo.project.use.baseURL as string).origin;
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) external.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?state=ready#help');
  await expect(page.getByRole('heading', { name: 'Help directory', exact: true })).toBeFocused();
  await expect(page.locator('.support-card')).toHaveCount(11);
  await page.getByRole('combobox', { name: 'Region', exact: true }).selectOption('CH');
  await expect(
    page.getByRole('heading', { name: 'Access Now Digital Security Helpline', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'PRO ASYL', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset filters' }).click();
  const contact = page.getByRole('link', { name: 'Official contact', exact: true }).first();
  await expect(contact).toBeVisible();
  await page.clock.setFixedTime(new Date('2027-01-01T00:00:00.000Z'));
  await contact.click();
  await expect(page.getByRole('link', { name: 'Official contact', exact: true })).toHaveCount(0);
  await page.clock.setFixedTime(new Date('2026-09-09T12:00:00.000Z'));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByRole('link', { name: 'Official contact', exact: true })).toHaveCount(0);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('dirty draft preserves Back/Forward history, cancelled choice and explicit discard', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844');
  await page.goto('/?state=ready#home');
  await page.locator('a[href="#more"]').first().click();
  await page.locator('a[href="#solidarity"]').click();
  const body = page.getByRole('textbox', { name: 'Letter text', exact: true });
  await body.fill('A private letter');
  await page.getByRole('button', { name: 'Use neutral template', exact: true }).click();
  await expect(body).toHaveValue('A private letter');
  const length = await page.evaluate(() => history.length);
  await page.goBack();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveURL(/#solidarity$/);
  await expect(page.getByRole('button', { name: 'Continue editing', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Continue editing', exact: true }).click();
  await expect(body).toHaveValue('A private letter');
  expect(await page.evaluate(() => history.length)).toBe(length);
  await page.goBack();
  await page.getByRole('button', { name: 'Discard and continue', exact: true }).click();
  await expect(page).toHaveURL(/#more$/);
  await page.goForward();
  await expect(page).toHaveURL(/#solidarity$/);
  await expect(body).toHaveValue('');
  await body.fill('Another draft');
  await page.locator('a[href="#more"]').first().click();
  await page.keyboard.press('Escape');
  await expect(body).toHaveValue('Another draft');
  await expect(page).toHaveURL(/#solidarity$/);
  await page.evaluate(() => {
    window.location.hash = '#help';
  });
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveURL(/#solidarity$/);
  await page.getByRole('button', { name: 'Continue editing', exact: true }).click();
  await expect(body).toHaveValue('Another draft');
});

test('draft export and print contain only the draft and printing does not blank other views', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844');
  await page.goto('/?state=ready#solidarity');
  await page.getByRole('textbox', { name: 'Letter text', exact: true }).fill('Only this letter');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download draft', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('wrn-letter-draft.txt');
  expect(await readFile((await download.path())!, 'utf8')).toBe('Only this letter');
  await expect(
    page.getByRole('button', { name: 'Export regional list', exact: true }),
  ).toBeDisabled();
  await page
    .getByRole('combobox', { name: 'Region for list export', exact: true })
    .selectOption('Europe');
  const listPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export regional list', exact: true }).click();
  const listDownload = await listPromise;
  const list = JSON.parse(await readFile((await listDownload.path())!, 'utf8'));
  expect(Object.keys(list).sort()).toEqual([
    'observedAt',
    'profileIds',
    'region',
    'schema',
    'snapshotCommit',
    'version',
  ]);
  expect(list.region).toBe('Europe');
  expect(list.profileIds.length).toBeGreaterThan(0);
  expect(JSON.stringify(list)).not.toContain('Only this letter');
  await page.evaluate(() => {
    window.print = () => undefined;
  });
  await page.getByRole('button', { name: 'Print draft', exact: true }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.support-print-only')).toHaveText('Only this letter');
  await expect(page.locator('#root')).not.toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(page.locator('#root')).toBeVisible();
  await page.emulateMedia({ media: null });
  await expect(page.getByRole('textbox', { name: 'Letter text', exact: true })).toHaveValue(
    'Only this letter',
  );
});

const matrix = [
  ...languages.map((language) => ({ language, theme: 'dark', width: 390, height: 844 })),
  ...themes.map((theme) => ({ language: 'de' as const, theme, width: 320, height: 568 })),
  { language: 'de' as const, theme: 'light', width: 768, height: 960 },
  { language: 'de' as const, theme: 'dark', width: 1280, height: 800 },
];
for (const item of matrix)
  test(`support visual ${item.language}-${item.theme}-${item.width}`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-390x844');
    const copy = getSupportCopy(item.language),
      errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width: item.width, height: item.height });
    const root = path.resolve('test-results/support-completion-screenshots');
    await mkdir(root, { recursive: true });
    for (const section of ['help', 'solidarity'] as const) {
      await page.goto(`/?state=ready&theme=${item.theme}#${section}`);
      await page.getByTestId('ui-language-selector').selectOption(item.language);
      await expect(
        page.getByRole('heading', {
          name: section === 'help' ? copy.helpTitle : copy.solidarityTitle,
          exact: true,
        }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(1);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: path.join(root, `${section}-${item.language}-${item.theme}-${item.width}.png`),
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });

test('support data error retries and route chunk error explicitly reloads', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844');
  let dataBlocked = true;
  await page.route('**/features/support/data/legacy-support-v1.json*', async (route) => {
    if (dataBlocked) {
      await route.fulfill({ status: 503, body: 'unavailable' });
    } else await route.continue();
  });
  await page.goto('/?state=ready#help');
  await expect(
    page.getByText('Local support data could not be loaded safely.', { exact: true }),
  ).toBeVisible();
  dataBlocked = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('.support-card')).toHaveCount(11);
  let chunkBlocked = true;
  await page.route('**/features/support/MobileSupportRoute.tsx*', async (route) => {
    if (chunkBlocked) {
      chunkBlocked = false;
      await route.abort('failed');
    } else await route.continue();
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reload view', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reload view', exact: true }).click();
  await expect(page.locator('.support-card')).toHaveCount(11);
});
