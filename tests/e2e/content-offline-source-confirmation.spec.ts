import { expect, test, type BrowserContext } from '@playwright/test';
import {
  archiveLifecycleIntegrityPayload,
  canonicalJson,
  createValidatedLocalContentReleaseV1,
  sha256Utf8,
  utf8ByteLength,
  type LocalContentReleaseReadyV1,
} from '../../packages/content-contracts/src/index.ts';
import {
  createG3014OfflineFixtures,
  type G3014OfflineReleaseFixture,
} from '../../packages/test-support/src/g3-014-offline-fixtures';

type Writable<Value> = Value extends readonly (infer Entry)[]
  ? Writable<Entry>[]
  : Value extends object
    ? { -readonly [Key in keyof Value]: Writable<Value[Key]> }
    : Value;

type SourceFixtures = {
  readonly a: G3014OfflineReleaseFixture;
  readonly b: G3014OfflineReleaseFixture;
  readonly bReady: LocalContentReleaseReadyV1;
};

async function createSourceFixtures(): Promise<SourceFixtures> {
  const fixtures = await createG3014OfflineFixtures();
  const b = structuredClone(fixtures.b) as unknown as Writable<G3014OfflineReleaseFixture>;
  const documents = b.documents;
  const article = documents.payloads.articles.articles[0]!;
  article.source.name = 'S16 source B';
  article.originalUrl = 'https://source-b.s16.invalid/cedar';

  const articleHash = await sha256Utf8(canonicalJson(documents.payloads.articles));
  const articleResource = documents.manifest.resources.find(
    (resource) => resource.id === 'articles',
  );
  if (articleResource === undefined) throw new Error('S16 fixture is missing articles.');
  articleResource.sha256 = articleHash;
  articleResource.bytes = utf8ByteLength(canonicalJson(documents.payloads.articles));
  documents.archiveLifecycle.sourceContent.articlePayloadSha256 = articleHash;
  documents.archiveLifecycle.integritySha256 = await sha256Utf8(
    canonicalJson(archiveLifecycleIntegrityPayload(documents.archiveLifecycle)),
  );
  documents.websitePublication.sourceManifest.integritySha256 = await sha256Utf8(
    canonicalJson(documents.manifest),
  );
  b.descriptor.releaseRevision = 'wrn-g3-014-s16-source-b-v1';
  b.descriptor.expectedManifest.sha256 = await sha256Utf8(canonicalJson(documents.manifest));
  b.descriptor.expectedComponents.archiveLifecycle.sha256 = await sha256Utf8(
    canonicalJson(documents.archiveLifecycle),
  );
  b.descriptor.expectedComponents.websitePublication.sha256 = await sha256Utf8(
    canonicalJson(documents.websitePublication),
  );
  return {
    a: fixtures.a,
    b,
    bReady: await createValidatedLocalContentReleaseV1(b.descriptor, documents),
  };
}

async function routeLocalReleases(context: BrowserContext, fixtures: SourceFixtures) {
  let active = fixtures.a;
  await context.route('**/wrn-local-release/v1/*.json', async (route) => {
    const file = new URL(route.request().url()).pathname.split('/').at(-1)!;
    const documents = active.documents;
    const values: Record<string, unknown> = {
      'release-descriptor.json': active.descriptor,
      'manifest.json': documents.manifest,
      'articles.json': documents.payloads.articles,
      'supplemental-items.json': documents.payloads['supplemental-items'],
      'discover-index.json': documents.discoverIndex,
      'reader-details.json': documents.readerDetails,
      'archive-lifecycle.json': documents.archiveLifecycle,
      'website-publication.json': documents.websitePublication,
    };
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(values[file]) });
  });
  return {
    useB() {
      active = fixtures.b;
    },
  };
}

test.beforeEach(async ({ browserName }, info) => {
  test.skip(
    browserName !== 'chromium' ||
      !['mobile-390x844', 'website-390x844'].includes(info.project.name),
  );
});

test('S16 source confirmation is discarded on a confirmed cross-tab snapshot change', async ({
  context,
  page,
}, info) => {
  const fixtures = await createSourceFixtures();
  const release = await routeLocalReleases(context, fixtures);
  const builtOrigin = info.project.name.startsWith('mobile')
    ? process.env.WRN_S16_BUILT_MOBILE_ORIGIN
    : process.env.WRN_S16_BUILT_WEBSITE_ORIGIN;
  const origin = new URL(builtOrigin ?? (info.project.use.baseURL as string)).origin;
  const externalRequests: string[] = [];
  const pageErrors: string[] = [];
  context.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) externalRequests.push(request.url());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(`${origin}/#more`);
  await page.getByRole('button', { name: 'Save content locally', exact: true }).click();
  await expect(page.getByText('Stored locally', { exact: true })).toBeVisible();
  await page.goto(`${origin}/#home`);
  await page.locator('[data-reader-trigger="wrn-test-art-cedar"]').click();
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toBeVisible();
  const sourceTrigger = page.getByRole('button', { name: 'Open original source', exact: true });
  await sourceTrigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(
    fixtures.a.documents.payloads.articles.articles[0]!.source.name,
  );
  await expect(dialog.getByRole('link')).toHaveAttribute(
    'href',
    fixtures.a.documents.payloads.articles.articles[0]!.originalUrl,
  );

  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(dialog).toBeVisible();
  await page.screenshot({ path: info.outputPath('s16-a-confirmation.png'), fullPage: true });

  const second = await context.newPage();
  second.on('pageerror', (error) => pageErrors.push(error.message));
  await second.goto(`${origin}/#more`);
  await expect(second.getByText('Stored locally', { exact: true })).toBeVisible();
  release.useB();
  await second.getByRole('button', { name: 'Check for a newer revision', exact: true }).click();
  await expect(
    second.getByText(`Checked candidate: ${fixtures.bReady.descriptor.releaseRevision}`, {
      exact: true,
    }),
  ).toBeVisible();
  await page.bringToFront();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toContainText(
    fixtures.a.documents.payloads.articles.articles[0]!.title,
  );
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link')).toHaveAttribute(
    'href',
    fixtures.a.documents.payloads.articles.articles[0]!.originalUrl,
  );

  await second.bringToFront();
  await second.getByRole('button', { name: 'Use checked revision', exact: true }).click();
  await second.getByRole('dialog').getByRole('button', { name: 'Use checked revision' }).click();
  await expect(
    second.getByText(`Active revision: ${fixtures.bReady.descriptor.releaseRevision}`, {
      exact: true,
    }),
  ).toBeVisible();

  await page.bringToFront();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toContainText('— B');
  await expect(dialog).toBeHidden();
  await expect(sourceTrigger).toBeFocused();

  await sourceTrigger.click();
  await expect(dialog).toContainText('S16 source B');
  await expect(dialog).toContainText('source-b.s16.invalid');
  await expect(dialog.getByRole('link')).toHaveAttribute(
    'href',
    'https://source-b.s16.invalid/cedar',
  );
  await page.screenshot({ path: info.outputPath('s16-b-confirmation.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(sourceTrigger).toBeFocused();
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
