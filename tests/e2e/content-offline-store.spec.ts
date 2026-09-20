import { expect, test } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Source-only store probes must not mount the integrated React controller.
test.beforeEach(async ({ context }) => {
  await context.route(/^http:\/\/127\.0\.0\.1:4317[345]\/$/, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }),
  );
});

test.describe('WRN-G3-014 real IndexedDB control storage', () => {
  test('both clients bound an injected request-event disturbance instead of leaving the operation pending', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(!isMobile && !isWebsite, 'One real-IDB projection per client is sufficient.');
    await page.goto(isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175');
    const result = await page.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      const dbName =
        module.mobileContentOfflineDatabaseName ?? module.websiteContentOfflineDatabaseName;
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const store = await (module.openMobileContentOfflineStore?.() ??
        module.openWebsiteContentOfflineStore());
      const originalGet = IDBObjectStore.prototype.get;
      Object.defineProperty(IDBObjectStore.prototype, 'get', {
        configurable: true,
        value: function disturbedGet(this: IDBObjectStore, key: IDBValidKey) {
          originalGet.call(this, key);
          return {} as IDBRequest<unknown>;
        },
      });
      let outcome: string;
      try {
        outcome = await Promise.race([
          store.snapshot().then(
            () => 'unexpected-success',
            (error) => error.code,
          ),
          new Promise<string>((resolve) => window.setTimeout(() => resolve('test-timeout'), 6_000)),
        ]);
      } finally {
        Object.defineProperty(IDBObjectStore.prototype, 'get', {
          configurable: true,
          value: originalGet,
        });
        store.close();
      }
      return outcome;
    });
    expect(result).toBe('timeout');
  });

  test('both clients pre-abort without creating a v1 schema and abort a close-at-put write', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(!isMobile && !isWebsite, 'One real-IDB projection per client is sufficient.');
    await page.goto(isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175');
    const result = await page.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      const releaseModule = await import('/src/local-content-release.ts');
      const dbName =
        module.mobileContentOfflineDatabaseName ?? module.websiteContentOfflineDatabaseName;
      const open = (signal?: AbortSignal) =>
        module.openMobileContentOfflineStore?.(signal) ??
        module.openWebsiteContentOfflineStore(signal);
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const controller = new AbortController();
      controller.abort();
      let preAbort = '';
      try {
        await open(controller.signal);
      } catch (error) {
        preAbort = error.code;
      }
      const namesAfterPreAbort = await indexedDB.databases();
      const store = await open();
      const runtime = await releaseModule.loadLocalContentRelease(new AbortController().signal);
      const documents = {
        manifest: runtime.ready.manifest,
        payloads: runtime.ready.payloads,
        discoverIndex: runtime.ready.discoverIndex,
        readerDetails: runtime.ready.readerDetails,
        archiveLifecycle: runtime.ready.archiveLifecycle,
        websitePublication: runtime.ready.websitePublication,
      };
      const fresh = await store.snapshot();
      const originalPut = IDBObjectStore.prototype.put;
      let closedAtPut = false;
      Object.defineProperty(IDBObjectStore.prototype, 'put', {
        configurable: true,
        value: function closeAtPut(this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
          const request = originalPut.call(this, value, key);
          if (!closedAtPut) {
            closedAtPut = true;
            store.close();
          }
          return request;
        },
      });
      let closeCode = '';
      try {
        await store.saveCandidate({
          descriptor: runtime.ready.descriptor,
          documents,
          checkedAt: 1_000,
          expected: { generation: fresh.control.generation, clearEpoch: fresh.control.clearEpoch },
        });
      } catch (error) {
        closeCode = error.code;
      } finally {
        Object.defineProperty(IDBObjectStore.prototype, 'put', {
          configurable: true,
          value: originalPut,
        });
      }
      const reopened = await open();
      const afterClose = await reopened.snapshot();
      reopened.close();
      return { preAbort, namesAfterPreAbort, closeCode, afterClose };
    });
    expect(result.preAbort).toBe('aborted');
    expect(result.namesAfterPreAbort.map((entry) => entry.name)).not.toContain(
      isMobile ? 'wrn.mobile-content-offline' : 'wrn.website-content-offline',
    );
    expect(result.closeCode).toBe('aborted');
    expect(result.afterClose.bundles).toEqual([]);
  });

  test('both clients do not mistake an A recheck or expired rollback target for fresh active content', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(!isMobile && !isWebsite, 'One real-IDB projection per client is sufficient.');
    await page.goto(isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175');
    const result = await page.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      const fixturesModule =
        await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes Wo Rev Ne/packages/test-support/src/g3-014-offline-fixtures.ts');
      const dbName =
        module.mobileContentOfflineDatabaseName ?? module.websiteContentOfflineDatabaseName;
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const fixtures = await fixturesModule.createG3014OfflineFixtures();
      const open = () =>
        module.openMobileContentOfflineStore?.() ?? module.openWebsiteContentOfflineStore();
      const store = await open();
      const fresh = await store.snapshot();
      const stagedA = await store.saveCandidate({
        ...fixtures.a,
        checkedAt: 1_000,
        expected: { generation: fresh.control.generation, clearEpoch: fresh.control.clearEpoch },
      });
      const activeA = await store.activateCandidate(1_000, {
        generation: stagedA.generation,
        clearEpoch: stagedA.clearEpoch,
      });
      const refreshedA = await store.saveCandidate({
        ...fixtures.a,
        checkedAt: 2_000,
        expected: { generation: activeA.generation, clearEpoch: activeA.clearEpoch },
      });
      const stagedB = await store.saveCandidate({
        ...fixtures.b,
        checkedAt: 5_000,
        expected: { generation: refreshedA.generation, clearEpoch: refreshedA.clearEpoch },
      });
      const activeB = await store.activateCandidate(5_000, {
        generation: stagedB.generation,
        clearEpoch: stagedB.clearEpoch,
      });
      let rollbackCode = '';
      try {
        await store.rollback(86_403_000, {
          generation: activeB.generation,
          clearEpoch: activeB.clearEpoch,
        });
      } catch (error) {
        rollbackCode = error.code;
      }
      const final = await store.snapshot();
      store.close();
      return { refreshedA, rollbackCode, final };
    });
    expect(result.refreshedA.lastSuccessfulSourceCheckAt).toBe(2_000);
    expect(result.final.bundles).toEqual(
      expect.arrayContaining([expect.objectContaining({ checkedAt: 2_000 })]),
    );
    expect(result.rollbackCode).toBe('invalid-bundle');
  });

  test('both clients retain A while a completed B check waits for explicit activation', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(!isMobile && !isWebsite, 'One real-IDB projection per client is sufficient.');
    await page.goto(isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175');
    const result = await page.evaluate(async () => {
      const storeModule = await import('/src/content-offline-store.ts');
      const fixturesModule =
        await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes Wo Rev Ne/packages/test-support/src/g3-014-offline-fixtures.ts');
      const dbName =
        storeModule.mobileContentOfflineDatabaseName ??
        storeModule.websiteContentOfflineDatabaseName;
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const fixtures = await fixturesModule.createG3014OfflineFixtures();
      const store = await (storeModule.openMobileContentOfflineStore?.() ??
        storeModule.openWebsiteContentOfflineStore());
      const empty = await store.snapshot();
      const stagedA = await store.saveCandidate({
        ...fixtures.a,
        checkedAt: 1_000,
        expected: { generation: empty.control.generation, clearEpoch: empty.control.clearEpoch },
      });
      const activeA = await store.activateCandidate(1_000, {
        generation: stagedA.generation,
        clearEpoch: stagedA.clearEpoch,
      });
      const pending = await store.prepareRecheck('b-check', {
        generation: activeA.generation,
        clearEpoch: activeA.clearEpoch,
      });
      const checked = await store.completeRecheck(
        'b-check',
        pending.pendingRecheck,
        pending.safety,
        2_000,
        { generation: pending.generation, clearEpoch: pending.clearEpoch },
      );
      const stagedB = await store.saveCandidate({
        ...fixtures.b,
        checkedAt: 2_000,
        expected: { generation: checked.generation, clearEpoch: checked.clearEpoch },
      });
      const activatedB = await store.activateCandidate(2_000, {
        generation: stagedB.generation,
        clearEpoch: stagedB.clearEpoch,
      });
      store.close();
      return { activeA, checked, stagedB, activatedB };
    });
    expect(result.checked.activeKey).toBe(result.activeA.activeKey);
    expect(result.stagedB.activeKey).toBe(result.activeA.activeKey);
    expect(result.stagedB.candidateKey).not.toBeNull();
    expect(result.activatedB.activeKey).toBe(result.stagedB.candidateKey);
    expect(result.activatedB.previousKey).toBe(result.activeA.activeKey);
  });

  test('both client stores save, activate, fence stale work, and clear atomically', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(
      !isMobile && !isWebsite,
      'One isolated real-IDB projection per client is sufficient.',
    );
    const origin = isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175';
    await page.goto(origin);
    const result = await page.evaluate(async () => {
      const storeModule = await import('/src/content-offline-store.ts');
      const releaseModule = await import('/src/local-content-release.ts');
      const dbName =
        storeModule.mobileContentOfflineDatabaseName ??
        storeModule.websiteContentOfflineDatabaseName;
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const store = await (storeModule.openMobileContentOfflineStore?.() ??
        storeModule.openWebsiteContentOfflineStore());
      const runtime = await releaseModule.loadLocalContentRelease(new AbortController().signal);
      const documents = {
        manifest: runtime.ready.manifest,
        payloads: runtime.ready.payloads,
        discoverIndex: runtime.ready.discoverIndex,
        readerDetails: runtime.ready.readerDetails,
        archiveLifecycle: runtime.ready.archiveLifecycle,
        websitePublication: runtime.ready.websitePublication,
      };
      const fresh = await store.snapshot();
      const candidate = await store.saveCandidate({
        descriptor: runtime.ready.descriptor,
        documents,
        checkedAt: 1000,
        expected: { generation: fresh.control.generation, clearEpoch: fresh.control.clearEpoch },
      });
      const active = await store.activateCandidate(1_000, {
        generation: candidate.generation,
        clearEpoch: candidate.clearEpoch,
      });
      const cleared = await store.clear({
        generation: active.generation,
        clearEpoch: active.clearEpoch,
      });
      let stale = '';
      try {
        await store.saveCandidate({
          descriptor: runtime.ready.descriptor,
          documents,
          checkedAt: 1001,
          expected: { generation: active.generation, clearEpoch: active.clearEpoch },
        });
      } catch (error) {
        stale = error.code;
      }
      const final = await store.snapshot();
      store.close();
      return { active, cleared, final, stale, dbName };
    });
    expect(result.active.activeKey).not.toBeNull();
    expect(result.cleared.activeKey).toBeNull();
    expect(result.final.bundles).toEqual([]);
    expect(result.final.control.clearEpoch).toBe(1);
    expect(result.stale).toBe('stale-operation');
  });

  test('both clients prune a bundle below a newly verified safety floor', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(!isMobile && !isWebsite, 'One real-IDB projection per client is sufficient.');
    await page.goto(isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175');
    const result = await page.evaluate(async () => {
      const storeModule = await import('/src/content-offline-store.ts');
      const releaseModule = await import('/src/local-content-release.ts');
      const dbName =
        storeModule.mobileContentOfflineDatabaseName ??
        storeModule.websiteContentOfflineDatabaseName;
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const store = await (storeModule.openMobileContentOfflineStore?.() ??
        storeModule.openWebsiteContentOfflineStore());
      const runtime = await releaseModule.loadLocalContentRelease(new AbortController().signal);
      const documents = {
        manifest: runtime.ready.manifest,
        payloads: runtime.ready.payloads,
        discoverIndex: runtime.ready.discoverIndex,
        readerDetails: runtime.ready.readerDetails,
        archiveLifecycle: runtime.ready.archiveLifecycle,
        websitePublication: runtime.ready.websitePublication,
      };
      const fresh = await store.snapshot();
      const staged = await store.saveCandidate({
        descriptor: runtime.ready.descriptor,
        documents,
        checkedAt: 1_000,
        expected: { generation: fresh.control.generation, clearEpoch: fresh.control.clearEpoch },
      });
      const active = await store.activateCandidate(1_000, {
        generation: staged.generation,
        clearEpoch: staged.clearEpoch,
      });
      const recorded = await store.recordSafety({ floor: 2, entries: [] }, 2_000, {
        generation: active.generation,
        clearEpoch: active.clearEpoch,
      });
      const final = await store.snapshot();
      store.close();
      return { recorded, final };
    });
    expect(result.recorded.activeKey).toBeNull();
    expect(result.final.bundles).toEqual([]);
  });

  test('mobile persists a pending recheck before any source work and clear fences it', async ({
    page,
  }, testInfo) => {
    test.skip(
      !testInfo.project.name.startsWith('mobile-'),
      'The store module is served by the mobile Vite harness.',
    );
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(module.mobileContentOfflineDatabaseName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const store = await module.openMobileContentOfflineStore();
      const fresh = await store.snapshot();
      const pending = await store.prepareRecheck('p2-browser-check', {
        generation: fresh.control.generation,
        clearEpoch: fresh.control.clearEpoch,
      });
      const beforeClear = await store.snapshot();
      const cleared = await store.clear({
        generation: pending.generation,
        clearEpoch: pending.clearEpoch,
      });
      const final = await store.snapshot();
      store.close();
      return {
        fresh,
        beforeClear,
        cleared,
        final,
        dbNames: await indexedDB.databases().then((items) => items.map((item) => item.name)),
      };
    });
    expect(result.fresh.control.activeKey).toBeNull();
    expect(result.beforeClear.control.pendingRecheck).toMatchObject({
      operationId: 'p2-browser-check',
      generation: 1,
      clearEpoch: 0,
    });
    expect(result.cleared.clearEpoch).toBe(1);
    expect(result.final.control.pendingRecheck).toMatchObject({ operationId: 'p2-browser-check' });
    expect(result.final.control.activeKey).toBeNull();
    expect(result.dbNames).toContain('wrn.mobile-content-offline');
  });

  test('both clients persist recovery state, fence a backward observed clock, and expose an active snapshot', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(!isMobile && !isWebsite, 'One real-IDB projection per client is sufficient.');
    await page.goto(isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175');
    const result = await page.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      const releaseModule = await import('/src/local-content-release.ts');
      const dbName =
        module.mobileContentOfflineDatabaseName ?? module.websiteContentOfflineDatabaseName;
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const open = () =>
        module.openMobileContentOfflineStore?.() ?? module.openWebsiteContentOfflineStore();
      const runtime = await releaseModule.loadLocalContentRelease(new AbortController().signal);
      const documents = {
        manifest: runtime.ready.manifest,
        payloads: runtime.ready.payloads,
        discoverIndex: runtime.ready.discoverIndex,
        readerDetails: runtime.ready.readerDetails,
        archiveLifecycle: runtime.ready.archiveLifecycle,
        websitePublication: runtime.ready.websitePublication,
      };
      const first = await open();
      const fresh = await first.snapshot();
      const staged = await first.saveCandidate({
        descriptor: runtime.ready.descriptor,
        documents,
        checkedAt: 1_000,
        expected: { generation: fresh.control.generation, clearEpoch: fresh.control.clearEpoch },
      });
      const active = await first.activateCandidate(1_000, {
        generation: staged.generation,
        clearEpoch: staged.clearEpoch,
      });
      const read = await first.readActive();
      const observed = await first.observeTime(2_000, {
        generation: active.generation,
        clearEpoch: active.clearEpoch,
      });
      let backward = '';
      try {
        await first.observeTime(1_999, {
          generation: observed.generation,
          clearEpoch: observed.clearEpoch,
        });
      } catch (error) {
        backward = error.code;
      }
      const pending = await first.prepareRecheck('before-close', {
        generation: observed.generation,
        clearEpoch: observed.clearEpoch,
      });
      first.close();
      let afterClose = '';
      try {
        await first.snapshot();
      } catch (error) {
        afterClose = error.code;
      }
      const reopened = await open();
      const afterReopen = await reopened.snapshot();
      const recovered = await reopened.prepareRecheck('explicit-recovery', {
        generation: afterReopen.control.generation,
        clearEpoch: afterReopen.control.clearEpoch,
      });
      reopened.close();
      return { read, backward, pending, afterClose, afterReopen, recovered };
    });
    expect(result.read).toMatchObject({ checkedAt: 1_000, generation: expect.any(Number) });
    expect(result.backward).toBe('stale-operation');
    expect(result.afterClose).toBe('incompatible-storage');
    expect(result.afterReopen.control.pendingRecheck).toMatchObject({
      operationId: 'before-close',
    });
    expect(result.recovered.pendingRecheck).toMatchObject({ operationId: 'explicit-recovery' });
  });

  test('both clients reject a pre-clear recheck token even if the old operation refreshes its snapshot', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(!isMobile && !isWebsite, 'One real-IDB projection per client is sufficient.');
    await page.goto(isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175');
    const result = await page.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      const dbName =
        module.mobileContentOfflineDatabaseName ?? module.websiteContentOfflineDatabaseName;
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const store = await (module.openMobileContentOfflineStore?.() ??
        module.openWebsiteContentOfflineStore());
      const fresh = await store.snapshot();
      const prepared = await store.prepareRecheck('old-operation', {
        generation: fresh.control.generation,
        clearEpoch: fresh.control.clearEpoch,
      });
      if (prepared.pendingRecheck === null) throw new Error('pending recheck was not stored');
      const cleared = await store.clear({
        generation: prepared.generation,
        clearEpoch: prepared.clearEpoch,
      });
      let code = '';
      try {
        await store.completeRecheck(
          'old-operation',
          prepared.pendingRecheck,
          cleared.safety,
          1_000,
          { generation: cleared.generation, clearEpoch: cleared.clearEpoch },
        );
      } catch (error) {
        code = error.code;
      }
      const final = await store.snapshot();
      store.close();
      return { code, final };
    });
    expect(result.code).toBe('stale-operation');
    expect(result.final.control.pendingRecheck).toMatchObject({ operationId: 'old-operation' });
  });

  test('both clients admit only one matching generation in a two-tab write race', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(!isMobile && !isWebsite, 'One real-IDB projection per client is sufficient.');
    const origin = isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175';
    const second = await page.context().newPage();
    await Promise.all([page.goto(origin), second.goto(origin)]);
    const dbName = await page.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      return module.mobileContentOfflineDatabaseName ?? module.websiteContentOfflineDatabaseName;
    });
    await page.evaluate(async (name) => {
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
    }, dbName);
    const channelName = 'wrn-g3-014-two-tab-generation-race';
    const prepareAttempt = async (target: typeof page) =>
      target.evaluate(async (channel) => {
        const module = await import('/src/content-offline-store.ts');
        const releaseModule = await import('/src/local-content-release.ts');
        const release = await releaseModule.loadLocalContentRelease(new AbortController().signal);
        const documents = {
          manifest: release.ready.manifest,
          payloads: release.ready.payloads,
          discoverIndex: release.ready.discoverIndex,
          readerDetails: release.ready.readerDetails,
          archiveLifecycle: release.ready.archiveLifecycle,
          websitePublication: release.ready.websitePublication,
        };
        const store = await (module.openMobileContentOfflineStore?.() ??
          module.openWebsiteContentOfflineStore());
        const snapshot = await store.snapshot();
        const gate = new BroadcastChannel(channel);
        const outcome = new Promise<string>((resolve) => {
          gate.onmessage = () => {
            void store
              .saveCandidate({
                descriptor: release.ready.descriptor,
                documents,
                checkedAt: 1_000,
                expected: {
                  generation: snapshot.control.generation,
                  clearEpoch: snapshot.control.clearEpoch,
                },
              })
              .then(() => 'saved')
              .catch((error) => error.code)
              .then((result) => {
                gate.close();
                store.close();
                resolve(result);
              });
          };
        });
        (
          window as typeof window & {
            __wrnG3014RaceOutcome?: Promise<string>;
          }
        ).__wrnG3014RaceOutcome = outcome;
        return {
          generation: snapshot.control.generation,
          clearEpoch: snapshot.control.clearEpoch,
        };
      }, channelName);
    const [leftExpected, rightExpected] = await Promise.all([
      prepareAttempt(page),
      prepareAttempt(second),
    ]);
    expect(leftExpected).toEqual(rightExpected);
    await page.evaluate((channel) => {
      new BroadcastChannel(channel).postMessage('start');
    }, channelName);
    const outcomes = await Promise.all([
      page.evaluate(
        () =>
          (window as typeof window & { __wrnG3014RaceOutcome?: Promise<string> })
            .__wrnG3014RaceOutcome,
      ),
      second.evaluate(
        () =>
          (window as typeof window & { __wrnG3014RaceOutcome?: Promise<string> })
            .__wrnG3014RaceOutcome,
      ),
    ]);
    const final = await page.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      const store = await (module.openMobileContentOfflineStore?.() ??
        module.openWebsiteContentOfflineStore());
      const snapshot = await store.snapshot();
      store.close();
      return snapshot;
    });
    await second.close();
    expect(outcomes.sort()).toEqual(['saved', 'stale-operation']);
    expect(final.bundles).toHaveLength(1);
  });

  test('both clients leave a newer unknown schema untouched', async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(!isMobile && !isWebsite, 'One real-IDB projection per client is sufficient.');
    await page.goto(isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175');
    const result = await page.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      const dbName =
        module.mobileContentOfflineDatabaseName ?? module.websiteContentOfflineDatabaseName;
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const newer = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName, 2);
        request.onupgradeneeded = () => {
          request.result.createObjectStore('opaque');
          request.result.createObjectStore('still-unknown').put('sentinel', 'key');
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
      newer.close();
      let code = '';
      try {
        await (module.openMobileContentOfflineStore?.() ?? module.openWebsiteContentOfflineStore());
      } catch (error) {
        code = error.code;
      }
      const preserved = await new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open(dbName, 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('still-unknown', 'readonly');
          const get = tx.objectStore('still-unknown').get('key');
          get.onerror = () => reject(get.error);
          get.onsuccess = () => {
            db.close();
            resolve(get.result);
          };
        };
      });
      return { code, preserved };
    });
    expect(result.code).toBe('incompatible-storage');
    expect(result.preserved).toBe('sentinel');
  });

  test('both clients fail closed without rewriting malformed v1 stores, controls, bundles, or pointers', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(!isMobile && !isWebsite, 'One real-IDB projection per client is sufficient.');
    await page.goto(isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175');
    const result = await page.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      const dbName =
        module.mobileContentOfflineDatabaseName ?? module.websiteContentOfflineDatabaseName;
      const openStore = () =>
        module.openMobileContentOfflineStore?.() ?? module.openWebsiteContentOfflineStore();
      const validEmptyControl = () => ({
        format: 'wrn.content-offline.v1',
        generation: 0,
        clearEpoch: 0,
        activeKey: null,
        previousKey: null,
        candidateKey: null,
        lastSuccessfulSourceCheckAt: null,
        lastObservedAt: null,
        safety: { floor: 0, entries: [] },
        pendingRecheck: null,
      });
      const cases = [
        {
          name: 'wrong-keypath',
          setup(db: IDBDatabase) {
            db.createObjectStore('bundles', { keyPath: 'id' }).put({ id: 'sentinel' });
            db.createObjectStore('control');
          },
          target: 'bundles',
          key: 'sentinel',
        },
        {
          name: 'missing-control',
          setup(db: IDBDatabase) {
            db.createObjectStore('bundles', { keyPath: 'key' }).put({ key: 'sentinel' });
          },
          target: 'bundles',
          key: 'sentinel',
        },
        {
          name: 'malformed-control',
          setup(db: IDBDatabase) {
            db.createObjectStore('bundles', { keyPath: 'key' });
            db.createObjectStore('control').put({ malformed: true }, 'control');
          },
          target: 'control',
          key: 'control',
        },
        {
          name: 'malformed-bundle',
          setup(db: IDBDatabase) {
            db.createObjectStore('bundles', { keyPath: 'key' }).put({ key: 'sentinel' });
            db.createObjectStore('control').put(validEmptyControl(), 'control');
          },
          target: 'bundles',
          key: 'sentinel',
        },
        {
          name: 'dangling-pointer',
          setup(db: IDBDatabase) {
            db.createObjectStore('bundles', { keyPath: 'key' });
            db.createObjectStore('control').put(
              { ...validEmptyControl(), activeKey: 'missing-bundle' },
              'control',
            );
          },
          target: 'control',
          key: 'control',
        },
      ];
      const outcomes: { name: string; code: string; raw: unknown }[] = [];
      for (const item of cases) {
        await new Promise<void>((resolve) => {
          const request = indexedDB.deleteDatabase(dbName);
          request.onsuccess = request.onerror = request.onblocked = () => resolve();
        });
        const created = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(dbName, 1);
          request.onupgradeneeded = () => item.setup(request.result);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
        });
        created.close();
        let code = '';
        try {
          const store = await openStore();
          await store.snapshot();
          store.close();
        } catch (error) {
          code = error.code;
        }
        const raw = await new Promise<unknown>((resolve, reject) => {
          const request = indexedDB.open(dbName, 1);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(item.target, 'readonly');
            const get = tx.objectStore(item.target).get(item.key);
            get.onerror = () => reject(get.error);
            get.onsuccess = () => {
              db.close();
              resolve(get.result);
            };
          };
        });
        outcomes.push({ name: item.name, code, raw });
      }
      return outcomes;
    });
    expect(result.map((item) => item.code)).toEqual([
      'incompatible-storage',
      'incompatible-storage',
      'incompatible-storage',
      'incompatible-storage',
      'incompatible-storage',
    ]);
    expect(result.every((item) => item.raw !== undefined)).toBe(true);
  });

  test('mobile and website stores remain isolated on one origin and preserve foreign preference sentinels', async ({
    page,
  }, testInfo) => {
    test.skip(
      !testInfo.project.name.startsWith('mobile-'),
      'The shared-origin import harness runs once.',
    );
    await page.goto('http://127.0.0.1:43173');
    const result = await page.evaluate(async () => {
      const mobile = await import('/src/content-offline-store.ts');
      const website =
        await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes Wo Rev Ne/apps/website/src/content-offline-store.ts');
      const deleteDatabase = (name: string) =>
        new Promise<void>((resolve) => {
          const request = indexedDB.deleteDatabase(name);
          request.onsuccess = request.onerror = request.onblocked = () => resolve();
        });
      await Promise.all([
        deleteDatabase(mobile.mobileContentOfflineDatabaseName),
        deleteDatabase(website.websiteContentOfflineDatabaseName),
        deleteDatabase('foreign-preference-db'),
      ]);
      localStorage.setItem('wrn.mobile.theme', 'theme-sentinel');
      localStorage.setItem('wrn.website.language', 'language-sentinel');
      localStorage.setItem('wrn.reading-state', 'reading-sentinel');
      const foreign = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('foreign-preference-db', 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore('values').put('sentinel', 'key');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
      foreign.close();
      const mobileStore = await mobile.openMobileContentOfflineStore();
      const websiteStore = await website.openWebsiteContentOfflineStore();
      const mobileFresh = await mobileStore.snapshot();
      const websiteFresh = await websiteStore.snapshot();
      await mobileStore.clear({
        generation: mobileFresh.control.generation,
        clearEpoch: mobileFresh.control.clearEpoch,
      });
      const websiteAfterMobileClear = await websiteStore.snapshot();
      mobileStore.close();
      websiteStore.close();
      const foreignValue = await new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open('foreign-preference-db', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const get = db.transaction('values', 'readonly').objectStore('values').get('key');
          get.onerror = () => reject(get.error);
          get.onsuccess = () => {
            db.close();
            resolve(get.result);
          };
        };
      });
      return {
        mobileName: mobile.mobileContentOfflineDatabaseName,
        websiteName: website.websiteContentOfflineDatabaseName,
        websiteFresh,
        websiteAfterMobileClear,
        foreignValue,
        preferences: [
          localStorage.getItem('wrn.mobile.theme'),
          localStorage.getItem('wrn.website.language'),
          localStorage.getItem('wrn.reading-state'),
        ],
      };
    });
    expect(result.mobileName).not.toBe(result.websiteName);
    expect(result.websiteAfterMobileClear.control.clearEpoch).toBe(
      result.websiteFresh.control.clearEpoch,
    );
    expect(result.foreignValue).toBe('sentinel');
    expect(result.preferences).toEqual(['theme-sentinel', 'language-sentinel', 'reading-sentinel']);
  });

  test('both clients reject a valid different-byte bundle that reuses an existing release ID', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(!isMobile && !isWebsite, 'One real-IDB projection per client is sufficient.');
    await page.goto(isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175');
    const result = await page.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      const fixturesModule =
        await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes Wo Rev Ne/packages/test-support/src/g3-014-offline-fixtures.ts');
      const dbName =
        module.mobileContentOfflineDatabaseName ?? module.websiteContentOfflineDatabaseName;
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const fixtures = await fixturesModule.createG3014OfflineFixtures();
      const store = await (module.openMobileContentOfflineStore?.() ??
        module.openWebsiteContentOfflineStore());
      const fresh = await store.snapshot();
      const first = await store.saveCandidate({
        ...fixtures.a,
        checkedAt: 1_000,
        expected: { generation: fresh.control.generation, clearEpoch: fresh.control.clearEpoch },
      });
      let code = '';
      try {
        await store.saveCandidate({
          descriptor: {
            ...fixtures.b.descriptor,
            releaseRevision: fixtures.a.descriptor.releaseRevision,
          },
          documents: fixtures.b.documents,
          checkedAt: 2_000,
          expected: { generation: first.generation, clearEpoch: first.clearEpoch },
        });
      } catch (error) {
        code = error.code;
      }
      const final = await store.snapshot();
      store.close();
      return { code, final };
    });
    expect(result.code).toBe('invalid-bundle');
    expect(result.final.bundles).toHaveLength(1);
  });

  test('both clients refuse explicit activation of an expired candidate', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(!isMobile && !isWebsite, 'One real-IDB projection per client is sufficient.');
    await page.goto(isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175');
    const result = await page.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      const releaseModule = await import('/src/local-content-release.ts');
      const dbName =
        module.mobileContentOfflineDatabaseName ?? module.websiteContentOfflineDatabaseName;
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const store = await (module.openMobileContentOfflineStore?.() ??
        module.openWebsiteContentOfflineStore());
      const runtime = await releaseModule.loadLocalContentRelease(new AbortController().signal);
      const documents = {
        manifest: runtime.ready.manifest,
        payloads: runtime.ready.payloads,
        discoverIndex: runtime.ready.discoverIndex,
        readerDetails: runtime.ready.readerDetails,
        archiveLifecycle: runtime.ready.archiveLifecycle,
        websitePublication: runtime.ready.websitePublication,
      };
      const fresh = await store.snapshot();
      const staged = await store.saveCandidate({
        descriptor: runtime.ready.descriptor,
        documents,
        checkedAt: 1_000,
        expected: { generation: fresh.control.generation, clearEpoch: fresh.control.clearEpoch },
      });
      let code = '';
      try {
        await store.activateCandidate(86_401_001, {
          generation: staged.generation,
          clearEpoch: staged.clearEpoch,
        });
      } catch (error) {
        code = error.code;
      }
      const final = await store.snapshot();
      store.close();
      return { code, final };
    });
    expect(result.code).toBe('invalid-bundle');
    expect(result.final.control.candidateKey).not.toBeNull();
    expect(result.final.control.activeKey).toBeNull();
  });

  test('both clients report an injected real-IDB quota failure without claiming a full disk', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(!isMobile && !isWebsite, 'One real-IDB projection per client is sufficient.');
    await page.goto(isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175');
    const result = await page.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      const releaseModule = await import('/src/local-content-release.ts');
      const dbName =
        module.mobileContentOfflineDatabaseName ?? module.websiteContentOfflineDatabaseName;
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const store = await (module.openMobileContentOfflineStore?.() ??
        module.openWebsiteContentOfflineStore());
      const runtime = await releaseModule.loadLocalContentRelease(new AbortController().signal);
      const documents = {
        manifest: runtime.ready.manifest,
        payloads: runtime.ready.payloads,
        discoverIndex: runtime.ready.discoverIndex,
        readerDetails: runtime.ready.readerDetails,
        archiveLifecycle: runtime.ready.archiveLifecycle,
        websitePublication: runtime.ready.websitePublication,
      };
      const fresh = await store.snapshot();
      const originalPut = IDBObjectStore.prototype.put;
      Object.defineProperty(IDBObjectStore.prototype, 'put', {
        configurable: true,
        value: () => {
          throw new DOMException('injected quota', 'QuotaExceededError');
        },
      });
      let code = '';
      try {
        await store.saveCandidate({
          descriptor: runtime.ready.descriptor,
          documents,
          checkedAt: 1_000,
          expected: { generation: fresh.control.generation, clearEpoch: fresh.control.clearEpoch },
        });
      } catch (error) {
        code = error.code;
      } finally {
        Object.defineProperty(IDBObjectStore.prototype, 'put', {
          configurable: true,
          value: originalPut,
        });
      }
      const final = await store.snapshot();
      store.close();
      return { code, final };
    });
    expect(result.code).toBe('quota-or-write-failure');
    expect(result.final.bundles).toEqual([]);
  });

  test('both clients retain a pending safety obligation across a real browser-process restart', async ({
    browser,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-390x844';
    const isWebsite = testInfo.project.name === 'website-390x844';
    test.skip(!isMobile && !isWebsite, 'One isolated persistent profile per client is sufficient.');
    const origin = isMobile ? 'http://127.0.0.1:43173' : 'http://127.0.0.1:43175';
    // Chromium's IndexedDB backing store fails on long Windows evidence paths.
    // This isolated short profile is retained across both real browser processes.
    const profile = await mkdtemp(path.join(os.tmpdir(), 'wrn-g3-014-idb-'));
    const launch = async () => {
      const isolated = await browser.browserType().launchPersistentContext(profile, {
        channel: 'chrome',
        headless: true,
        viewport: { width: 390, height: 844 },
      });
      // These independently launched contexts are not covered by beforeEach.
      await isolated.route(origin + '/', (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><html><body></body></html>',
        }),
      );
      return isolated;
    };
    const firstContext = await launch();
    const firstPage = await firstContext.newPage();
    await firstPage.goto(origin);
    const beforeRestart = await firstPage.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      const dbName =
        module.mobileContentOfflineDatabaseName ?? module.websiteContentOfflineDatabaseName;
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
      const store = await (module.openMobileContentOfflineStore?.() ??
        module.openWebsiteContentOfflineStore());
      const fresh = await store.snapshot();
      const pending = await store.prepareRecheck('safety-write-failed-before-process-end', {
        generation: fresh.control.generation,
        clearEpoch: fresh.control.clearEpoch,
      });
      const originalPut = IDBObjectStore.prototype.put;
      Object.defineProperty(IDBObjectStore.prototype, 'put', {
        configurable: true,
        value: () => {
          throw new DOMException('injected safety write quota', 'QuotaExceededError');
        },
      });
      let code = '';
      try {
        await store.recordSafety({ floor: 1, entries: [] }, 1_000, {
          generation: pending.generation,
          clearEpoch: pending.clearEpoch,
        });
      } catch (error) {
        code = error.code;
      } finally {
        Object.defineProperty(IDBObjectStore.prototype, 'put', {
          configurable: true,
          value: originalPut,
        });
      }
      store.close();
      return { code, pending };
    });
    await firstContext.close();

    const restartedContext = await launch();
    const restartedPage = await restartedContext.newPage();
    await restartedPage.goto(origin);
    const afterRestart = await restartedPage.evaluate(async () => {
      const module = await import('/src/content-offline-store.ts');
      const store = await (module.openMobileContentOfflineStore?.() ??
        module.openWebsiteContentOfflineStore());
      const snapshot = await store.snapshot();
      store.close();
      return snapshot;
    });
    await restartedContext.close();

    expect(beforeRestart.code).toBe('quota-or-write-failure');
    expect(afterRestart.control.pendingRecheck).toMatchObject({
      operationId: 'safety-write-failed-before-process-end',
    });
  });
});
