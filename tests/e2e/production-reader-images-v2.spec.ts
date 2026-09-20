import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  canonicalJson,
  sha256Utf8,
  createValidatedProductionContentRelease,
} from '../../packages/content-contracts/src/index';

const id = 'wrn-art-a772ab86c915a036c6177f1bfe958d4d';
const alt = 'Flock cameras and surveillance cameras among barbed wire in a dystopian scene';
const profiles = [
  { name: 'mobile', origin: 'http://127.0.0.1:43177', route: `/#article/${id}` },
  { name: 'website', origin: 'http://127.0.0.1:43178', route: `/?article=${id}#home` },
] as const;

// Derived test releases only; never overwrite admitted source/publication bytes.
async function imagePacket(sequence: number, revoked = false) {
  const root = path.resolve(
    'apps/mobile/public/wrn-production-content/wrn-production-eff-2026-09-10-v2',
  );
  const read = async (name: string) =>
    JSON.parse(await readFile(path.join(root, `${name}.json`), 'utf8'));
  const descriptor = await read('release-descriptor');
  const manifest = await read('manifest');
  const revision = `image-browser-test-${sequence}`;
  const documents = Object.fromEntries(
    await Promise.all(
      manifest.resources.map(async (resource: { id: string; path: string }) => [
        resource.id,
        await read(resource.path.replace('.json', '')),
      ]),
    ),
  );
  descriptor.sequence = sequence;
  descriptor.releaseRevision = revision;
  manifest.revision = revision;
  for (const document of Object.values(documents)) document.revision = revision;
  if (revoked) {
    manifest.articleIds = manifest.articleIds.filter((articleId: string) => articleId !== id);
    documents.articles.articles = documents.articles.articles.filter(
      (article: { id: string }) => article.id !== id,
    );
    for (const name of ['admission', 'discoverIndex', 'readerDetails'])
      documents[name].entries = documents[name].entries.filter(
        (entry: { articleId: string }) => entry.articleId !== id,
      );
    for (const name of ['activeArticleIds', 'archiveArticleIds', 'shareableArticleIds'])
      documents.archiveLifecycle[name] = manifest.articleIds;
    documents.archiveLifecycle.revocations = {
      revision: 2,
      previousRevision: 1,
      entries: [{ id, status: 'blocked', category: 'rights-or-safety' }],
    };
  }
  for (const resource of manifest.resources) {
    const json = canonicalJson(documents[resource.id]);
    resource.sha256 = await sha256Utf8(json);
    resource.bytes = Buffer.byteLength(json);
    resource.recordCount = manifest.articleIds.length;
    if (descriptor.expectedComponents[resource.id])
      descriptor.expectedComponents[resource.id] = { revision, sha256: resource.sha256 };
  }
  descriptor.expectedManifest = { revision, sha256: await sha256Utf8(canonicalJson(manifest)) };
  expect(
    await createValidatedProductionContentRelease({ descriptor, manifest, documents }),
  ).not.toBeNull();
  const base = `/wrn-production-content/${revision}`;
  return new Map<string, unknown>([
    [
      '/wrn-production-content/current.json',
      {
        schema: 'wrn.production-content-current.v1',
        releaseRevision: revision,
        sequence,
        descriptorPath: `${base}/release-descriptor.json`,
        descriptorSha256: await sha256Utf8(canonicalJson(descriptor)),
      },
    ],
    [`${base}/release-descriptor.json`, descriptor],
    [`${base}/manifest.json`, manifest],
    ...manifest.resources.map(
      (resource: { id: string; path: string }) =>
        [`${base}/${resource.path}`, documents[resource.id]] as [string, unknown],
    ),
  ]);
}

async function storedControl(page: Page, client: string) {
  return page.evaluate(async (client) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(`wrn.${client}-production-content-offline.v1`);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const control = await new Promise<{
      highestAcceptedSequence: number;
      safety: { revision: number; revokedIds: string[] };
      activeKey: string | null;
    }>((resolve, reject) => {
      const req = db.transaction('control').objectStore('control').get('control');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return control;
  }, client);
}

async function imageReady(page: Page) {
  const img = page.locator('.production-reader-image img');
  await expect(img).toHaveAttribute('alt', alt);
  await expect(img).toHaveAttribute('lang', 'en');
  await expect(img).toHaveAttribute('src', /^blob:http:\/\/127\.0\.0\.1:/);
  await img.scrollIntoViewIfNeeded();
  await expect.poll(() => img.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1200);
  expect(await img.evaluate((image: HTMLImageElement) => image.naturalHeight)).toBe(600);
  expect(
    await page.locator('.production-reader-blocks > :first-child').evaluate((el) => el.tagName),
  ).toBe('FIGURE');
  return img;
}

for (const profile of profiles) {
  test(`${profile.name}: V2 rollback and clear retain sequence floor, failed image payload still durably revokes the old image`, async ({
    page,
  }) => {
    let packet = await imagePacket(2);
    let failReader = false;
    let safetyBeforeImage: unknown;
    await page.route('**/wrn-production-content/**', async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (failReader && pathname.endsWith('/reader-details.json')) {
        safetyBeforeImage = (await storedControl(page, profile.name)).safety;
        return route.fulfill({ status: 503, body: '' });
      }
      const value = packet.get(pathname);
      return route.fulfill({
        status: value === undefined ? 404 : 200,
        contentType: 'application/json',
        body: JSON.stringify(value ?? {}),
      });
    });
    const check = async () => {
      await page.getByRole('button', { name: 'Check for a newer revision', exact: true }).click();
      await expect(page.getByTestId('production-content')).toHaveAttribute('aria-busy', 'false');
    };
    await page.goto(`${profile.origin}${profile.route}`);
    await imageReady(page);
    packet = await imagePacket(3);
    await check();
    await imageReady(page);
    await page.goto(`${profile.origin}/#more`);
    await page.getByRole('button', { name: 'Use previous revision', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Use previous revision', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect((await storedControl(page, profile.name)).highestAcceptedSequence).toBe(3);
    await page.goto(`${profile.origin}${profile.route}`);
    await imageReady(page);
    packet = await imagePacket(4, true);
    failReader = true;
    await check();
    await expect(page.locator('.production-reader-image')).toHaveCount(0);
    expect(safetyBeforeImage).toEqual({ revision: 2, revokedIds: [id] });
    await page.reload();
    await expect(
      page.getByText('This article is unavailable or has been withdrawn.', { exact: true }),
    ).toBeVisible();
    await expect(page.locator('.production-reader-image')).toHaveCount(0);
    await page.goto(`${profile.origin}/#more`);
    await page.getByRole('button', { name: 'Remove local content', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete now', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect((await storedControl(page, profile.name)).highestAcceptedSequence).toBe(3);
    packet = await imagePacket(2);
    failReader = false;
    await check();
    expect((await storedControl(page, profile.name)).activeKey).toBeNull();
    expect((await storedControl(page, profile.name)).highestAcceptedSequence).toBe(3);
    await page.goto(`${profile.origin}${profile.route}`);
    await expect(page.locator('.production-reader-image')).toHaveCount(0);
  });
  for (const theme of ['violet', 'dark']) {
    test(`${profile.name} ${theme}: original admitted image, no hotlink, license and responsive reflow`, async ({
      page,
    }, info) => {
      const external: string[] = [];
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (['http:', 'https:'].includes(url.protocol) && url.origin !== profile.origin)
          external.push(url.href);
      });
      await page.goto(
        `${profile.origin}${profile.route.replace('/?', `/?theme=${theme}&`).replace('/#', `/?theme=${theme}#`)}`,
      );
      await imageReady(page);
      const license = page.locator('.production-reader-image button');
      await license.click();
      await expect(page.getByRole('dialog').getByRole('link')).toHaveAttribute(
        'href',
        'https://creativecommons.org/licenses/by/4.0/',
      );
      await page.keyboard.press('Escape');
      await expect(license).toBeFocused();
      for (const width of [320, 1200]) {
        await page.setViewportSize({ width, height: 900 });
        await imageReady(page);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        ).toBe(true);
        await page.screenshot({
          path: info.outputPath(`${profile.name}-${theme}-${width}-image.png`),
        });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByTestId('ui-language-selector').selectOption('ru');
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await imageReady(page);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`${profile.name}-${theme}-ru-200-image.png`) });
      expect(external).toEqual([]);
      expect(errors).toEqual([]);
    });
  }

  test(`${profile.name}: V2 image persists in original IDB bytes, survives content-network outage and is released at expiry`, async ({
    page,
  }, info) => {
    await page.clock.install({ time: new Date('2026-09-10T14:00:00Z') });
    await page.addInitScript(() => {
      const create = URL.createObjectURL.bind(URL);
      const revoke = URL.revokeObjectURL.bind(URL);
      Object.assign(window, { imageBlobs: { created: [] as string[], revoked: [] as string[] } });
      const history = (
        window as unknown as { imageBlobs: { created: string[]; revoked: string[] } }
      ).imageBlobs;
      URL.createObjectURL = (blob) => {
        const url = create(blob);
        history.created.push(url);
        return url;
      };
      URL.revokeObjectURL = (url) => {
        history.revoked.push(url);
        revoke(url);
      };
    });
    await page.goto(`${profile.origin}${profile.route}`);
    await imageReady(page);
    const persisted = await page.evaluate(async (client) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(`wrn.${client}-production-content-offline.v1`);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const bundles = await new Promise<unknown[]>((resolve, reject) => {
        const req = db.transaction('bundles').objectStore('bundles').getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      db.close();
      const bytes = JSON.stringify(bundles);
      return {
        v2: bytes.includes('wrn.production-content-offline-bundle.v2'),
        hash: bytes.includes('988f224e78dbd7f971706e000eca9f8001229238a025efca193725ae33f9af7f'),
        encoded: bytes.includes('iVBORw0KGgo'),
      };
    }, profile.name);
    expect(persisted).toEqual({ v2: true, hash: true, encoded: true });
    let contentRequests = 0;
    await page.route('**/wrn-production-content/**', (route) => {
      contentRequests++;
      return route.abort('internetdisconnected');
    });
    await page.reload();
    const img = await imageReady(page);
    const blob = await img.getAttribute('src');
    await page.screenshot({ path: info.outputPath(`${profile.name}-idb-image-reopened.png`) });
    expect(contentRequests).toBe(0);
    await page.clock.fastForward(86_400_001);
    await expect(page.getByTestId('production-reader')).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(
          (url) =>
            (
              window as unknown as { imageBlobs: { revoked: string[] } }
            ).imageBlobs.revoked.includes(url!),
          blob,
        ),
      )
      .toBe(true);
    expect(contentRequests).toBe(0);
  });
}

test('Website saved shell reopens the image fully offline after closing the page', async ({
  page,
  context,
}, info) => {
  const profile = profiles[1];
  await page.goto(`${profile.origin}${profile.route}`);
  await imageReady(page);
  await page.getByRole('button', { name: 'Save for later', exact: true }).click();
  await page.goto(`${profile.origin}/#more`);
  await page.getByRole('button', { name: 'Save website shell', exact: true }).click();
  await expect(page.locator('.website-shell-panel')).toHaveAttribute(
    'data-shell-status',
    /^(saved|active)$/,
  );
  await expect
    .poll(() =>
      page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.state),
    )
    .toBe('activated');
  await page.close();
  await context.setOffline(true);
  const reopened = await context.newPage();
  await reopened.goto(`${profile.origin}${profile.route}`);
  await imageReady(reopened);
  await expect(
    reopened.getByRole('button', { name: 'Remove from saved', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await reopened.screenshot({ path: info.outputPath('website-full-offline-image.png') });
});

test('static Website landing embeds original PNG bytes with attribution and no image host request', async ({
  page,
}, info) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'https:') external.push(url.href);
  });
  await page.goto(`http://127.0.0.1:43178/articles/${id}/`);
  const img = page.locator('.reader-content img');
  await expect(img).toHaveAttribute('src', /^data:image\/png;base64,iVBORw0KGgo/);
  await expect(img).toHaveAttribute('alt', alt);
  await img.scrollIntoViewIfNeeded();
  await expect.poll(() => img.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1200);
  await expect(page.locator('.reader-content > :first-child')).toHaveJSProperty(
    'tagName',
    'FIGURE',
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(external).toEqual([]);
  await page.screenshot({ path: info.outputPath('website-static-image.png') });
});
