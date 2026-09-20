import { cp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { buildOfflineShell, coreHarness, poll } from './website-shell-core-helper.mjs';

async function statusHistory(page: Page) {
  return page.evaluate(
    () => (globalThis as typeof globalThis & { __p3Statuses?: string[] }).__p3Statuses ?? [],
  );
}

test('P3 visible built lifecycle keeps enable, waiting generation, cancel and remove truthful', async ({
  browserName,
}, info) => {
  test.skip(
    browserName !== 'chromium' || info.project.name !== 'website-390x844',
    'One isolated built Website UI lifecycle probe.',
  );
  test.setTimeout(120_000);
  const harness = await coreHarness('p3-ui-lifecycle');
  try {
    // `useBuilt` copies the already built UI into the harness run; it never edits
    // apps/website/dist. A and B are the helper's separately hashed worker packages.
    await harness.useBuilt();
    const nextBuiltDirectory = path.join(harness.run, 'built-b');
    await cp(harness.packages.built.directory, nextBuiltDirectory, { recursive: true });
    const vite = JSON.parse(
      await readFile(path.join(nextBuiltDirectory, '.vite', 'manifest.json'), 'utf8'),
    );
    await writeFile(
      path.join(nextBuiltDirectory, vite['index.html'].file),
      '\n/* p3-real-built-b */\n',
      {
        flag: 'a',
      },
    );
    const realBuiltB = await buildOfflineShell({ outputDirectory: nextBuiltDirectory });
    harness.packages.B = { directory: nextBuiltDirectory, manifest: realBuiltB, built: true };
    harness.report.packages.B = realBuiltB;
    const context = await harness.launch();
    let page = context.pages()[0]!;
    await page.goto(`${harness.origin}/?state=ready#more`);
    let panel = page.locator('.website-shell-panel');
    await expect(panel).toHaveAttribute('data-shell-status', 'uncontrolled');
    await page.evaluate(() => {
      const target = globalThis as typeof globalThis & { __p3Statuses?: string[] };
      target.__p3Statuses = [];
      new MutationObserver(() => {
        const status = document
          .querySelector('.website-shell-panel')
          ?.getAttribute('data-shell-status');
        if (status) target.__p3Statuses!.push(status);
      }).observe(document.body, { childList: true, subtree: true, attributes: true });
    });
    await page.getByRole('button', { name: 'Save website shell', exact: true }).click();
    await expect(panel).toHaveAttribute('data-shell-status', /^(saved|active)$/);
    await poll(
      () =>
        page.evaluate(
          async () =>
            (await navigator.serviceWorker.getRegistration())?.active?.state === 'activated',
        ),
      'visible enable reached active A',
    );
    harness.record('visible-enable', await harness.snapshot(page));

    // Saving deliberately does not claim this open page is controlled. Reopen A
    // before requesting B, as the core contract requires for a real waiting slot.
    await page.reload();
    await expect(panel).toHaveAttribute('data-shell-status', 'active');
    await expect
      .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
      .toBe(true);
    expect((await harness.snapshot(page)).control?.active).toBe(
      harness.packages.built.manifest.shellId,
    );
    await page.evaluate(() => {
      const target = globalThis as typeof globalThis & { __p3Statuses?: string[] };
      target.__p3Statuses = [];
      new MutationObserver(() => {
        const status = document
          .querySelector('.website-shell-panel')
          ?.getAttribute('data-shell-status');
        if (status) target.__p3Statuses!.push(status);
      }).observe(document.body, { childList: true, subtree: true, attributes: true });
    });

    harness.serve('B');
    await page.getByRole('button', { name: 'Check for shell update', exact: true }).click();
    await poll(
      () =>
        page.evaluate(
          async () =>
            (await navigator.serviceWorker.getRegistration())?.waiting?.state === 'installed',
        ),
      'visible update reached real B waiting',
    );
    await expect(panel).toHaveAttribute('data-shell-status', 'waiting');
    await expect(panel).toContainText('An update is waiting.');
    harness.record('visible-waiting', await harness.snapshot(page));

    await page.close();
    // Page closure releases the old client asynchronously. Reopening the origin
    // before native activation can attach a new client to A and keep B waiting.
    await poll(
      async () =>
        (
          await Promise.all(
            context
              .serviceWorkers()
              .map((worker) =>
                worker
                  .evaluate(
                    'self.registration.waiting === null && self.registration.active?.state === "activated"',
                  )
                  .catch(() => false),
              ),
          )
        ).some(Boolean),
      'native B activates after the last controlled page closes',
    );
    page = await context.newPage();
    await page.goto(`${harness.origin}/?state=ready#more`);
    panel = page.locator('.website-shell-panel');
    await expect(panel).toHaveAttribute('data-shell-status', 'active');
    expect((await harness.snapshot(page)).control?.active).toBe(realBuiltB.shellId);
    await page.evaluate(() => {
      const target = globalThis as typeof globalThis & { __p3Statuses?: string[] };
      target.__p3Statuses = [];
      new MutationObserver(() => {
        const status = document
          .querySelector('.website-shell-panel')
          ?.getAttribute('data-shell-status');
        if (status) target.__p3Statuses!.push(status);
      }).observe(document.body, { childList: true, subtree: true, attributes: true });
    });
    harness.record('visible-real-built-b-active', await harness.snapshot(page));

    const panelRemove = panel.getByRole('button', { name: 'Remove website shell', exact: true });
    await panelRemove.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(
      await page.evaluate(() =>
        navigator.serviceWorker.getRegistrations().then((items) => items.length),
      ),
    ).toBe(1);

    await panelRemove.click();
    await expect(dialog).toBeVisible();
    const foreign = await context.newPage();
    await foreign.goto(`${harness.origin}/?state=ready#more`);
    const foreignPanel = foreign.locator('.website-shell-panel');
    await expect(foreignPanel).toHaveAttribute('data-shell-status', 'active');
    await foreign.evaluate(() => {
      const target = globalThis as typeof globalThis & { __p3Statuses?: string[] };
      target.__p3Statuses = [];
      new MutationObserver(() => {
        const status = document
          .querySelector('.website-shell-panel')
          ?.getAttribute('data-shell-status');
        if (status) target.__p3Statuses!.push(status);
      }).observe(document.body, { childList: true, subtree: true, attributes: true });
    });
    await foreignPanel.getByRole('button', { name: 'Remove website shell', exact: true }).click();
    await foreign
      .getByRole('dialog')
      .getByRole('button', { name: 'Remove website shell', exact: true })
      .click();
    await expect(foreignPanel).toHaveAttribute('data-shell-status', 'removed');
    await expect(dialog).toBeHidden();
    await expect(panel).toHaveAttribute('data-shell-status', 'removed');
    const history = await statusHistory(foreign);
    expect(history).toEqual(expect.arrayContaining(['pending', 'removed']));
    harness.check('visible UI carries A -> B waiting -> cancelled remove -> durable remove', true, {
      history,
      snapshot: await harness.snapshot(page),
      packageA: harness.packages.built.manifest.shellId,
      packageB: harness.packages.B.manifest.shellId,
    });
    console.log(
      `p3-built-lifecycle=${JSON.stringify({
        packageA: harness.packages.built.manifest.shellId,
        packageB: harness.packages.B.manifest.shellId,
        history,
      })}`,
    );
  } finally {
    await harness.finish();
  }
});
