import { expect, test, type Page } from '@playwright/test';
import { createG3014OfflineFixtures } from '../../packages/test-support/src/g3-014-offline-fixtures';

async function routeOfflineFixture(page: Page) {
  const fixtures = await createG3014OfflineFixtures();
  let source: 'a' | 'b' | 'c' = 'a';
  let broken = false;
  await page.route('**/wrn-local-release/v1/*.json', async (route) => {
    const file = new URL(route.request().url()).pathname.split('/').at(-1)!;
    const documents = fixtures[source].documents;
    const values: Record<string, unknown> = {
      'release-descriptor.json': fixtures[source].descriptor,
      'manifest.json': documents.manifest,
      'articles.json': documents.payloads.articles,
      'supplemental-items.json': broken
        ? { ...documents.payloads['supplemental-items'], invalid: true }
        : documents.payloads['supplemental-items'],
      'discover-index.json': documents.discoverIndex,
      'reader-details.json': documents.readerDetails,
      'archive-lifecycle.json': documents.archiveLifecycle,
      'website-publication.json': documents.websitePublication,
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(values[file]),
    });
  });
  return {
    fixtures,
    set: (next: 'a' | 'b' | 'c', isBroken = false) => {
      source = next;
      broken = isBroken;
    },
  };
}

test('content management uses the controller, confirms clear, and keeps client storage isolated', async ({
  page,
}, info) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(info.project.name));
  const mobile = info.project.name.startsWith('mobile');
  await page.goto('/?state=ready#more');
  await expect(page.getByRole('heading', { name: 'Local content' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save content locally' })).toBeVisible();
  await page.getByRole('button', { name: 'Save content locally' }).click();
  await expect(page.getByText('Stored locally')).toBeVisible();
  const client = mobile ? 'mobile' : 'website';
  const dark = info.outputPath(`${client}-390x844-dark.png`);
  await page.screenshot({
    path: dark,
    fullPage: true,
  });
  await info.attach('content-panel-dark', { path: dark, contentType: 'image/png' });
  await page.getByLabel('Color theme').selectOption('light');
  const light = info.outputPath(`${client}-390x844-light.png`);
  await page.screenshot({
    path: light,
    fullPage: true,
  });
  await info.attach('content-panel-light', { path: light, contentType: 'image/png' });
  const clear = page.getByRole('button', { name: 'Remove local content' });
  await clear.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(clear).toBeFocused();
  await clear.click();
  await dialog.getByRole('button', { name: 'Remove local content' }).click();
  await expect(page.getByRole('heading', { name: 'Local content' })).toBeVisible();
  await expect(
    page.evaluate(async () => {
      const databases = await indexedDB.databases();
      return databases.map((database) => database.name).sort();
    }),
  ).resolves.toEqual([mobile ? 'wrn.mobile-content-offline' : 'wrn.website-content-offline']);
});

test('A stays active while B stages, activates only after confirmation, and rolls back only after confirmation', async ({
  page,
}, info) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(info.project.name));
  const offline = await routeOfflineFixture(page);
  await page.goto('/#more');
  await page.getByRole('button', { name: 'Save content locally' }).click();
  await expect(page.getByText('Stored locally', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Active revision: wrn-g3-012-local-content-release-v1-d8ff4f1'),
  ).toBeVisible();
  offline.set('b');
  await page.getByRole('button', { name: 'Check for a newer revision' }).click();
  await expect(page.getByText('Checked candidate: wrn-g3-014-offline-b-release-v1')).toBeVisible();
  await expect(
    page.getByText('Active revision: wrn-g3-012-local-content-release-v1-d8ff4f1'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Use checked revision' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByText('Active revision: wrn-g3-012-local-content-release-v1-d8ff4f1'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Use checked revision' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Use checked revision' }).click();
  await expect(page.getByText('Active revision: wrn-g3-014-offline-b-release-v1')).toBeVisible();
  await page.getByRole('button', { name: 'Use previous revision' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Use previous revision' }).click();
  await expect(
    page.getByText('Active revision: wrn-g3-012-local-content-release-v1-d8ff4f1'),
  ).toBeVisible();
  offline.set('b', true);
  await page.getByRole('button', { name: 'Check for a newer revision' }).click();
  await expect(page.getByTestId('content-operation-message')).toContainText('could not complete');
  await expect(
    page.getByText('Active revision: wrn-g3-012-local-content-release-v1-d8ff4f1'),
  ).toBeVisible();
});
