import { expect, test, type Page, type TestInfo } from '@playwright/test';

const fixtureModule =
  '/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes Wo Rev Ne/packages/test-support/src/g3-014-offline-fixtures.ts';

async function routeReleaseDocuments(page: Page, testInfo: TestInfo) {
  const mobile = testInfo.project.name === 'mobile-390x844';
  const website = testInfo.project.name === 'website-390x844';
  test.skip(!mobile && !website, 'One source-IDB harness per client.');
  const origin = `http://127.0.0.1:${mobile ? 43173 : 43175}`;
  const requested: { release: 'a' | 'b'; file: string }[] = [];
  // This source-only harness owns IDB; do not also start the React controller.
  await page.route(origin + '/', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }),
  );
  await page.goto(origin);
  const fixtures = await page.evaluate(
    async (modulePath) => (await import(modulePath)).createG3014OfflineFixtures(),
    fixtureModule,
  );
  let release: 'a' | 'b' = 'a';
  await page.route('**/wrn-local-release/v1/*.json', async (route) => {
    const file = new URL(route.request().url()).pathname.split('/').at(-1)!;
    requested.push({ release, file });
    const current = fixtures[release];
    const documents = current.documents;
    const bodies: Record<string, unknown> = {
      'release-descriptor.json': current.descriptor,
      'manifest.json': documents.manifest,
      'articles.json': documents.payloads.articles,
      'supplemental-items.json': documents.payloads['supplemental-items'],
      'discover-index.json': documents.discoverIndex,
      'reader-details.json': documents.readerDetails,
      'archive-lifecycle.json': documents.archiveLifecycle,
      'website-publication.json': documents.websitePublication,
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(bodies[file]),
    });
  });
  return {
    mobile,
    requested,
    setRelease(next: 'a' | 'b') {
      release = next;
    },
  };
}

test.describe('WRN-G3-014 semantic offline safety equality', () => {
  test('both default loaders accept routed A and B against the known A safety ledger', async ({
    page,
  }, testInfo) => {
    const harness = await routeReleaseDocuments(page, testInfo);
    const result = await page.evaluate(async (modulePath) => {
      const fixtures = await (await import(modulePath)).createG3014OfflineFixtures();
      const contracts =
        await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes Wo Rev Ne/packages/content-contracts/src/index.ts');
      const loader = await import('/src/local-content-release.ts');
      const knownA = JSON.parse(
        contracts.canonicalJson(
          contracts.createContentOfflineSafetyLedger(fixtures.a.documents.archiveLifecycle),
        ),
      );
      const first = await loader.checkLocalContentReleaseForOffline(
        new AbortController().signal,
        knownA,
      );
      return { first, knownA };
    }, fixtureModule);
    harness.setRelease('b');
    const second = await page.evaluate(async (knownA) => {
      const loader = await import('/src/local-content-release.ts');
      return loader.checkLocalContentReleaseForOffline(new AbortController().signal, knownA);
    }, result.knownA);

    expect(result.first.kind).toBe('ready');
    expect(second.kind).toBe('ready');
    expect(harness.requested).toEqual([
      ...Array.from({ length: 8 }, () => expect.objectContaining({ release: 'a' })),
      ...Array.from({ length: 8 }, () => expect.objectContaining({ release: 'b' })),
    ]);
  });

  test('both default controllers stage B and complete the pending recheck after A', async ({
    page,
  }, testInfo) => {
    const harness = await routeReleaseDocuments(page, testInfo);
    const result = await page.evaluate(async (mobile) => {
      const controllers = await import('/src/content-offline-controller.ts');
      const stores = await import('/src/content-offline-store.ts');
      const databaseName =
        stores.mobileContentOfflineDatabaseName ?? stores.websiteContentOfflineDatabaseName;
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(databaseName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const controller = (
        mobile
          ? controllers.createMobileContentOfflineController
          : controllers.createWebsiteContentOfflineController
      )({ now: () => 1_788_000_001_000 });
      const saved = await controller.save();
      return { saved };
    }, harness.mobile);
    harness.setRelease('b');
    const checked = await page.evaluate(async () => {
      const controllers = await import('/src/content-offline-controller.ts');
      const stores = await import('/src/content-offline-store.ts');
      const controller = (
        controllers.createMobileContentOfflineController ??
        controllers.createWebsiteContentOfflineController
      )({ now: () => 1_788_000_002_000 });
      const checked = await controller.check();
      const store = await (stores.openMobileContentOfflineStore?.() ??
        stores.openWebsiteContentOfflineStore());
      const snapshot = await store.snapshot();
      store.close();
      controller.dispose();
      return { checked, snapshot };
    });

    expect(result.saved.status).toBe('active');
    expect(checked.checked.status).toBe('candidate-staged');
    expect(checked.snapshot.control.candidateKey).not.toBeNull();
    expect(checked.snapshot.control.pendingRecheck).toBeNull();
    expect(harness.requested).toHaveLength(16);
  });
});
