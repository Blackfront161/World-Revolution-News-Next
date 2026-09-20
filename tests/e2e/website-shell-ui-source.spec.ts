import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    __wrnShellAttempts: { register: number; cacheOpen: number };
  }
}

test('P3 source-dev explicit shell click never registers a website worker', async ({
  page,
  browserName,
}, info) => {
  test.skip(
    browserName !== 'chromium' || info.project.name !== 'website-390x844',
    'One isolated source-development website probe.',
  );
  const sourceOrigin = 'http://127.0.0.1:43175';
  await page.addInitScript(() => {
    const attempts = { register: 0, cacheOpen: 0 };
    Object.defineProperty(window, '__wrnShellAttempts', { value: attempts });
    const register = navigator.serviceWorker.register.bind(navigator.serviceWorker);
    navigator.serviceWorker.register = (...args) => {
      attempts.register++;
      return register(...args);
    };
    const open = caches.open.bind(caches);
    caches.open = (...args) => {
      attempts.cacheOpen++;
      return open(...args);
    };
  });
  await page.goto(`${sourceOrigin}/?state=ready#more`);
  await expect(page.getByRole('heading', { name: 'Website offline shell' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save website shell' })).toBeVisible();
  expect(
    await page.evaluate(() =>
      navigator.serviceWorker.getRegistrations().then((items) => items.length),
    ),
  ).toBe(0);

  await page.getByRole('button', { name: 'Save website shell' }).click();
  await expect(page.getByText('Offline website availability cannot be confirmed.')).toBeVisible();
  expect(await page.evaluate(() => window.__wrnShellAttempts)).toEqual({
    register: 0,
    cacheOpen: 0,
  });
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.getRegistrations().then((items) => items.length)),
    )
    .toBe(0);
});

test('P3 built visible enable click starts the website shell only after opt-in', async ({
  page,
  browserName,
}, info) => {
  test.skip(
    browserName !== 'chromium' || info.project.name !== 'website-390x844',
    'One built default-adapter opt-in probe.',
  );
  await page.goto('/?state=ready#more');
  await expect(page.getByRole('button', { name: 'Save website shell' })).toBeVisible();
  expect(
    await page.evaluate(() =>
      navigator.serviceWorker.getRegistrations().then((items) => items.length),
    ),
  ).toBe(0);
  await page.getByRole('button', { name: 'Save website shell' }).click();
  await expect
    .poll(() =>
      page.evaluate(async () => ({
        registrations: (await navigator.serviceWorker.getRegistrations()).length,
        control: await caches.match('/__wrn_website_shell_control_v1__'),
      })),
    )
    .toMatchObject({ registrations: 1, control: expect.anything() });
});
