import { expect, test } from '@playwright/test';
import { uiSource } from './content-offline-ui-harness';

test.beforeEach(async ({ browserName }, info) => {
  test.skip(
    browserName !== 'chromium' ||
      !['mobile-390x844', 'website-390x844'].includes(info.project.name),
  );
});

test('S12 route guard admits a saved direct reader after a fresh document mount', async ({
  page,
}, info) => {
  await page.goto('/#more');
  await page.getByRole('button', { name: 'Save content locally' }).click();
  await expect(page.getByText('Stored locally', { exact: true })).toBeVisible();
  const origin = new URL(page.url()).origin;
  const route = info.project.name.startsWith('mobile')
    ? '/#article/wrn-test-art-cedar'
    : '/?article=wrn-test-art-cedar#home';
  await page.goto('about:blank');
  await page.goto(origin + route);
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toBeVisible();
});

test('S12 route guard admits an allowed reader reached through actual history', async ({
  page,
}, info) => {
  await page.goto('/#home');
  await expect(page.locator('[data-reader-trigger]').first()).toBeVisible();
  await page.evaluate((mobile) => {
    history.pushState(
      {},
      '',
      mobile ? '/#article/wrn-test-art-cedar' : '/?article=wrn-test-art-cedar#home',
    );
    history.pushState({}, '', '/#home');
  }, info.project.name.startsWith('mobile'));
  await page.goBack();
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toBeVisible();
});

test('S12 a running save owns its result and disables competing check', async ({ page }) => {
  await page.goto('/#more');
  await expect(page.getByRole('button', { name: 'Save content locally' })).toBeVisible();
  let release!: () => void;
  let entered!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    entered = resolve;
  });
  await page.route('**/wrn-local-release/v1/supplemental-items.json', async (route) => {
    const response = await route.fetch();
    entered();
    await held;
    await route.fulfill({ response });
  });
  await page.getByRole('button', { name: 'Save content locally' }).click();
  await requested;
  try {
    await expect(page.getByRole('button', { name: 'Check for a newer revision' })).toBeDisabled();
  } finally {
    release();
  }
  await expect(page.getByText('Stored locally', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Check for a newer revision' })).toBeEnabled();
});

test('S12 history entries for the same reader each receive a current guard', async ({
  page,
}, info) => {
  await page.goto('/#more');
  await page.getByRole('button', { name: 'Save content locally' }).click();
  await expect(page.getByText('Stored locally', { exact: true })).toBeVisible();
  await page.goto(
    info.project.name.startsWith('mobile')
      ? '/#article/wrn-test-art-cedar'
      : '/?article=wrn-test-art-cedar#home',
  );
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toBeVisible();
  await page.evaluate(() => {
    history.pushState({ s12Entry: 1 }, '', location.href);
    history.pushState({ s12Entry: 2 }, '', location.href);
  });
  await page.goBack();
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toBeVisible();
});

for (const moveFocus of [false, true]) {
  test(`S12 delayed Discover navigation completes focus without stealing a newer focus (${moveFocus})`, async ({
    page,
  }) => {
    const source = await uiSource(page);
    const entered = source.hold();
    await page.goto('/#home');
    await entered;
    await page
      .getByRole('navigation', { name: /^(Mobile|Website) main navigation$/ })
      .getByRole('link', { name: 'Discover', exact: true })
      .click();
    await expect(page.getByRole('heading', { name: 'Discover', exact: true })).toBeFocused();
    if (moveFocus) await page.getByTestId('ui-language-selector').focus();
    source.release();
    await expect(page.getByRole('searchbox', { name: 'Search news' })).toBeVisible();
    await expect(
      moveFocus
        ? page.getByTestId('ui-language-selector')
        : page.getByRole('heading', { name: 'Discover', exact: true }),
    ).toBeFocused();
  });
}
