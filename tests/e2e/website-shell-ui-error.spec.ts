import { expect, test } from '@playwright/test';
import { coreHarness } from './website-shell-core-helper.mjs';

test('P3 built failed shell asset request projects a neutral error without a content guarantee', async ({
  browserName,
}, info) => {
  test.skip(
    browserName !== 'chromium' || info.project.name !== 'website-390x844',
    'One isolated built negative UI probe.',
  );
  const harness = await coreHarness('p3-ui-built-error');
  let rejectShellAsset = false;
  harness.intercept(async ({ pathname, res }) => {
    if (rejectShellAsset && pathname.startsWith('/assets/index-')) {
      harness.record('forced-shell-asset-failure', { pathname, status: 503 });
      res.writeHead(503, { 'cache-control': 'no-store' });
      res.end('isolated P3 shell asset failure');
      return true;
    }
    return false;
  });
  try {
    await harness.useBuilt();
    const context = await harness.launch();
    const page = context.pages()[0]!;
    await page.goto(`${harness.origin}/?state=ready#more`);
    const panel = page.locator('.website-shell-panel');
    await expect(panel).toHaveAttribute('data-shell-status', 'uncontrolled');
    rejectShellAsset = true;
    await page.getByRole('button', { name: 'Save website shell', exact: true }).click();
    await expect(panel).toHaveAttribute('data-shell-status', /^(error|protected)$/);
    await expect(panel).toContainText('Offline website availability cannot be confirmed.');
    expect(
      await page.getByRole('button', { name: 'Save website shell', exact: true }).count(),
    ).toBe(0);
    harness.check('built rejected shell asset reaches neutral UI failure state', true, {
      snapshot: await harness.snapshot(page),
    });
  } finally {
    await harness.finish();
  }
});
