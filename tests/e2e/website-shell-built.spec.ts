import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createShellProtocol } from '../../apps/website/src/offline-shell/protocol.mjs';

test.beforeEach(async ({ browserName }, info) => {
  test.skip(browserName !== 'chromium' || info.project.name !== 'website-390x844');
});

async function registerShell(page: import('@playwright/test').Page) {
  await page.goto('/?state=ready#home');
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.getRegistrations().then((items) => items.length)),
    )
    .toBe(0);
  // Worker-level integration: lawful explicit test opt-in, not a default-adapter proof.
  await page.evaluate(async (control) => {
    await (
      await caches.open('wrn.website-shell.v1.control')
    ).put('/__wrn_website_shell_control_v1__', new Response(JSON.stringify(control)));
    await navigator.serviceWorker.register('/website-shell-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
  }, createShellProtocol().initial(1));
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
}

test('SHELL-01/02/03/09: built shell is opt-in and starts offline with only bound interface and catalog assets', async ({
  page,
  context,
}) => {
  await page.goto('/?state=ready#home');
  expect(
    await page.evaluate(() =>
      navigator.serviceWorker.getRegistrations().then((items) => items.length),
    ),
  ).toBe(0);
  expect(await page.evaluate(() => caches.keys())).toEqual([]);

  await registerShell(page);
  const stored = await page.evaluate(async () => {
    const cacheNames = await caches.keys();
    const payload = await caches.open(
      cacheNames.find((name) => name.startsWith('wrn.website-shell.v1.payload.')) ?? '',
    );
    return {
      controller: navigator.serviceWorker.controller?.scriptURL ?? null,
      caches: cacheNames,
      payloadPaths: (await payload.keys()).map((item) => new URL(item.url).pathname).sort(),
      contentCached: Boolean(await caches.match('/wrn-local-release/v1/manifest.json')),
    };
  });
  expect(stored.controller).toContain('/website-shell-sw.js');
  expect(stored.caches).toContain('wrn.website-shell.v1.control');
  expect(
    stored.caches.filter((name) => name.startsWith('wrn.website-shell.v1.payload.')),
  ).toHaveLength(1);
  // Preserve canonical function source bytes; Playwright transforms imported JS.
  const { stdout } = await promisify(execFile)(process.execPath, [
    '--input-type=module',
    '-e',
    "import { collectShellManifest } from './apps/website/tools/build-offline-shell.mjs'; if (!process.env.WRN_E2E_WEBSITE_FIXTURE_OUTPUT) throw new Error('Missing explicit fixture build'); process.stdout.write(JSON.stringify(await collectShellManifest({ outputDirectory: process.env.WRN_E2E_WEBSITE_FIXTURE_OUTPUT, compatibility: 'g3-015-v1' })));",
  ]);
  const manifest = JSON.parse(stdout) as { entries: { path: string }[] };
  expect(stored.payloadPaths).toEqual(
    manifest.entries.map((entry: { path: string }) => entry.path).sort(),
  );
  expect(stored.payloadPaths).toHaveLength(9);
  expect(stored.payloadPaths.filter((pathname) => pathname.endsWith('.json'))).toHaveLength(4);
  for (const family of [
    'legacy-knowledge-v1',
    'legacy-support-v1',
    'content-directory-v1',
    'production-events-media-v1',
  ])
    expect(
      stored.payloadPaths.some(
        (pathname) => pathname.startsWith(`/assets/${family}-`) && pathname.endsWith('.json'),
      ),
    ).toBe(true);
  expect(
    stored.payloadPaths.some((pathname) => /^\/assets\/index-[A-Za-z0-9_-]+\.js$/.test(pathname)),
  ).toBe(true);
  expect(stored.contentCached).toBe(false);

  await context.setOffline(true);
  await page.goto('/?article=wrn-test-art-cedar#home');
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await context.setOffline(false);
});

test('SHELL-05/B1: a different network HTML body is rejected and the complete saved generation remains served', async ({
  page,
}) => {
  await registerShell(page);
  await page.route('**/index.html', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<main>foreign shell</main>' }),
  );
  await page.goto('/#home');
  await expect(page.getByText('foreign shell', { exact: true })).toHaveCount(0);
  await expect(page.locator('#root')).not.toBeEmpty();
});

test('SHELL-05/08: a malformed durable control record fails closed without a cache refill', async ({
  page,
}) => {
  await registerShell(page);
  const before = await page.evaluate(() => caches.keys());
  await page.evaluate(async () => {
    const control = await caches.open('wrn.website-shell.v1.control');
    await control.put('/__wrn_website_shell_control_v1__', new Response('{"version":99}'));
  });
  expect(
    await page.evaluate(async () => {
      try {
        await fetch('/index.html');
        return 'responded';
      } catch {
        return 'failed';
      }
    }),
  ).toBe('failed');
  expect(await page.evaluate(() => caches.keys())).toEqual(before);
});

test('SHELL-08/B4: explicit remove preserves only the disabled control marker and does not touch G3-014 storage', async ({
  page,
}) => {
  await registerShell(page);
  await page.evaluate(async () => {
    localStorage.setItem('wrn.website-ui-language.v1', 'de');
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('wrn.website-content-offline', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('control').put('sentinel', 'safe');
      open.onsuccess = () => {
        open.result.close();
        resolve();
      };
      open.onerror = () => reject(open.error);
    });
    navigator.serviceWorker.controller?.postMessage({
      protocol: 'wrn.website-shell.v1',
      requestId: 'remove-1',
      type: 'remove',
      epoch: 1,
    });
  });
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.getRegistrations().then((items) => items.length)),
    )
    .toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('wrn.website-ui-language.v1'))).toBe('de');
  await expect
    .poll(() => page.evaluate(() => caches.keys()))
    .toEqual(['wrn.website-shell.v1.control']);
  expect(await page.evaluate(async () => caches.keys())).toEqual(['wrn.website-shell.v1.control']);
});
