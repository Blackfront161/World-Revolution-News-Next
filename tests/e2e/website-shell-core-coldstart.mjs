import { expect } from '@playwright/test';
import { coreHarness, poll } from './website-shell-core-helper.mjs';

const h = await coreHarness('coldstart');
try {
  await h.useBuilt();
  const emptyContext = await h.launch();
  const emptyPage = emptyContext.pages()[0];
  await emptyPage.goto(h.origin);
  await h.attach(emptyPage);
  await emptyPage.evaluate(() => window.shell.enable());
  const emptyProfile = emptyContext.testProfile;
  await emptyContext.close();
  let context = await h.launch();
  let page = context.pages()[0];
  await page.goto(h.origin + '/#more');
  await page.getByRole('button', { name: 'Save content locally', exact: true }).click();
  await expect(page.getByText('Stored locally', { exact: true })).toBeVisible();
  const content = await page.evaluate(async () => {
    const request = indexedDB.open('wrn.website-content-offline');
    const db = await new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction(['bundles', 'control']);
    const bundles = tx.objectStore('bundles').getAll();
    const control = tx.objectStore('control').getAll();
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
    const result = { bundles: bundles.result, control: control.result };
    db.close();
    return result;
  });
  h.record('real-G3-014-save', content);
  await h.attach(page);
  const saved = await page.evaluate(() => window.shell.enable());
  await poll(
    () =>
      page.evaluate(
        async () =>
          (await navigator.serviceWorker.getRegistration())?.active?.state === 'activated',
      ),
    'built shell active',
  );
  h.check(
    'Default enable completes with full built shell',
    ['saved', 'active'].includes(saved.kind),
    saved,
  );
  await page.goto(h.origin + '/#home');
  await expect(
    page.getByRole('heading', {
      name: 'Lokale Testmeldung zur gemeinsamen Leseliste',
      exact: true,
    }),
  ).toBeVisible();
  const removed = await page.evaluate(() => window.shell.remove());
  const afterRemove = await page.evaluate(async () => {
    const request = indexedDB.open('wrn.website-content-offline');
    const db = await new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction('bundles');
    const all = tx.objectStore('bundles').getAll();
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
    const values = all.result;
    db.close();
    return values;
  });
  h.check(
    'SHELL-08 removing shell preserves actual saved G3-014 bundle bytes',
    removed.kind === 'removed' && JSON.stringify(afterRemove) === JSON.stringify(content.bundles),
    { removed, bundleCount: afterRemove.length },
  );
  await page.evaluate(() => window.shell.enable());
  const profile = context.testProfile;
  await page.screenshot({ path: h.run + '/prepared.png' });
  await context.close();
  h.record('browser-process-closed', profile);
  await h.stopServer();
  context = await h.launch(profile, true);
  page = context.pages()[0];
  for (const route of ['/', '/#home', '/?article=wrn-test-art-cedar#home']) {
    await page.goto('about:blank');
    const response = await page.goto(h.origin + route);
    await expect(
      page.getByRole('heading', {
        name: 'Lokale Testmeldung zur gemeinsamen Leseliste',
        exact: true,
      }),
    ).toBeVisible();
    if (route.includes('article='))
      await expect(page.locator('article[aria-labelledby$="reader-title"]')).toContainText(
        'Lokale Testmeldung zur gemeinsamen Leseliste',
      );
    const state = await h.snapshot(page);
    h.check(
      'SHELL-03 process restart offline ' + route,
      response.fromServiceWorker() &&
        response.headers()['x-wrn-shell-id'] === h.packages.built.manifest.shellId &&
        state.active === 'activated',
      {
        header: response.headers()['x-wrn-shell-id'],
        fromServiceWorker: response.fromServiceWorker(),
        state,
      },
    );
    await page.screenshot({
      path:
        h.run +
        '/offline-' +
        (route === '/' ? 'root' : route.includes('?') ? 'query' : 'hash') +
        '.png',
    });
  }
  await page.clock.install({ time: new Date(Date.now() + 2 * 86400000) });
  await page.goto('about:blank');
  await page.goto(h.origin + '/#more');
  await expect(
    page.getByText(/reading period has ended or the device clock changed/),
  ).toBeVisible();
  h.check(
    'SHELL-04 stored content expiration is not bypassed by ready shell',
    (await page.locator('[data-reader-trigger]').count()) === 0,
    {
      text: await page.locator('.content-offline-panel').innerText(),
      state: await h.snapshot(page),
    },
  );
  await page.clock.setFixedTime(new Date(Date.now() - 86400000));
  await page.goto('about:blank');
  await page.goto(h.origin + '/?article=wrn-test-art-cedar#more');
  await expect(
    page.getByText(/reading period has ended or the device clock changed/).first(),
  ).toBeVisible();
  h.check(
    'SHELL-04 regressed clock does not revive the saved reader',
    (await page.locator('article[aria-labelledby$="reader-title"]').count()) === 0,
    { text: await page.locator('.content-offline-panel').innerText() },
  );
  const emptyRestart = await h.launch(emptyProfile, true);
  const empty = emptyRestart.pages()[0];
  await empty.goto(h.origin + '/#more');
  await expect(empty.getByTestId('content-operation-message')).toBeVisible();
  h.check(
    'SHELL-04 prepared shell with no content never claims saved content',
    (await empty.getByText('Stored locally', { exact: true }).count()) === 0 &&
      (await empty.locator('[data-reader-trigger]').count()) === 0,
    {
      message: await empty.getByTestId('content-operation-message').innerText(),
      state: await h.snapshot(empty),
    },
  );
} catch (error) {
  h.report.errors.push({ message: error.message, stack: error.stack });
}
const report = await h.finish();
process.exitCode = report.errors.length ? 2 : report.assertions.some((x) => !x.passed) ? 1 : 0;
