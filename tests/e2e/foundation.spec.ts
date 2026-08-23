import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const evidenceRevision = process.env.WRN_EVIDENCE_REVISION;
const evidenceRoot = path.resolve('docs/evidence/WRN-G3-001');

async function captureEvidence(page: Page, name: string) {
  if (!evidenceRevision) return;
  await mkdir(evidenceRoot, { recursive: true });
  await page.screenshot({
    path: path.join(evidenceRoot, `${evidenceRevision}_${name}_2026-08-23.png`),
    fullPage: true,
  });
}

test('foundation shell is local, semantic and accessible', async ({ page }, testInfo) => {
  const externalRequests: string[] = [];
  const consoleErrors: string[] = [];
  const baseOrigin = new URL(testInfo.project.use.baseURL as string).origin;

  page.on('request', (request) => {
    if (new URL(request.url()).origin !== baseOrigin) externalRequests.push(request.url());
  });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/?state=ready');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByText(/parity claim/i)).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  const controls = page.getByRole('button');
  for (let index = 0; index < (await controls.count()); index += 1) {
    const bounds = await controls.nth(index).boundingBox();
    expect(bounds, `button ${index} has bounds`).not.toBeNull();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
  }

  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).not.toHaveJSProperty('tagName', 'BODY');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  expect(externalRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);

  await captureEvidence(page, `${testInfo.project.name}_light-ready`);
});

test('all preview states work without a remote service', async ({ context, page }, testInfo) => {
  await page.goto('/?state=loading');
  await expect(page.getByRole('status')).toHaveAttribute('aria-busy', 'true');

  await page.getByRole('button', { name: /error/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();

  await context.setOffline(true);
  const offlineButton = page.getByRole('button', { name: /offline/i });
  await offlineButton.click();
  await expect(offlineButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: /offline/i })).toBeVisible();
  await expect(page.getByRole('status')).toBeVisible();

  await page.getByRole('button', { name: /switch to dark theme/i }).click();
  await expect(page.getByRole('button', { name: /switch to light theme/i })).toBeVisible();
  await captureEvidence(page, `${testInfo.project.name}_dark-offline`);
});
