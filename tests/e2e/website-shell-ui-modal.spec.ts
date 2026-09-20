import { expect, test, type Page } from '@playwright/test';
import { createShellProtocol } from '../../apps/website/src/offline-shell/protocol.mjs';

async function prepareBuiltShell(page: Page) {
  await page.goto('/?state=ready#home');
  await page.evaluate(async (control) => {
    await (
      await caches.open('wrn.website-shell.v1.control')
    ).put('/__wrn_website_shell_control_v1__', new Response(JSON.stringify(control)));
    await navigator.serviceWorker.register('/website-shell-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
  }, createShellProtocol().initial(1));
  await page.reload();
}

test('P3 remove dialog is root-modal: header and navigation cannot receive pointer interaction', async ({
  page,
  browserName,
}, info) => {
  test.skip(
    browserName !== 'chromium' || info.project.name !== 'website-390x844',
    'One built website modal-boundary probe.',
  );
  await prepareBuiltShell(page);
  await page.goto('/?state=ready#more');
  const remove = page.getByRole('button', { name: 'Remove website shell' });
  await expect(remove).toBeVisible();
  const more = page.getByRole('button', { name: 'More', exact: true }).first();
  const moreExpandedBeforeDialog = await more.getAttribute('aria-expanded');

  await remove.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#root')).toHaveJSProperty('inert', true);

  const moreBox = await more.boundingBox();
  expect(moreBox).not.toBeNull();
  await page.mouse.click(moreBox!.x + moreBox!.width / 2, moreBox!.y + moreBox!.height / 2);
  await expect(dialog).toBeVisible();
  await expect(more).toHaveAttribute('aria-expanded', moreExpandedBeforeDialog ?? 'false');

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('#root')).toHaveJSProperty('inert', false);
  await expect(remove).toBeFocused();
});
