import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

const moduleUrl = `/@fs/${path.resolve('packages/browser-content/src/production-media-resume-store.ts').replaceAll('\\', '/')}`;

async function mobileResult<T>(page: Page, action: string): Promise<T> {
  return page.evaluate(
    async ({ moduleUrl, action }) => {
      const mod = await import(moduleUrl);
      const mobile = mod.productionMediaResumeDatabaseNames[0];
      const website = mod.productionMediaResumeDatabaseNames[1];
      const clear = (name: string) =>
        new Promise<void>((resolve) => {
          const request = indexedDB.deleteDatabase(name);
          request.onsuccess = request.onerror = request.onblocked = () => resolve();
        });
      const record = (index: number, positionMs = 0) => ({
        recordVersion: 1,
        key: `episode:episode-${index}`,
        episodeId: `episode-${index}`,
        streamId: `stream-${index}`,
        releaseRevision: 'release-1',
        streamRevision: index.toString(16).padStart(64, 'a'),
        positionMs,
        durationMs: 1000,
      });
      const open = mod.createProductionMediaResumeStoreFactory(mobile);
      if (action === 'missing-and-invalid-input') {
        const store = await open();
        const first = await store.save(record(1), 0);
        const before = await store.snapshot();
        const missing = await store.clearExact([record(9)], first.state.generation);
        const mismatch = await store.clearExact([record(1, 99)], first.state.generation);
        const after = await store.snapshot();
        store.close();
        return {
          missing: missing.kind,
          mismatch: mismatch.kind,
          unchanged: JSON.stringify(before) === JSON.stringify(after),
        };
      }
      if (action === 'invalid-input') {
        const store = await open();
        const before = await store.snapshot();
        const codes: string[] = [];
        for (const work of [
          () => store.save({ ...record(1), positionMs: undefined }, before.generation),
          () => store.deleteIfExact(record(1).key, undefined, before.generation),
          () => store.clearExact([undefined], before.generation),
        ]) {
          try {
            await work();
            codes.push('unexpected-success');
          } catch (error) {
            codes.push(error.code ?? error.message);
          }
        }
        const after = await store.snapshot();
        store.close();
        return { codes, unchanged: JSON.stringify(before) === JSON.stringify(after) };
      }
      if (action === 'generation-overflow') {
        const store = await open();
        await store.snapshot();
        store.close();
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const req = indexedDB.open(mobile);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('mediaResume', 'readwrite');
          tx.objectStore('mediaResume').put({
            recordVersion: 1,
            key: 'control',
            generation: Number.MAX_SAFE_INTEGER,
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        db.close();
        const reopened = await open();
        const before = await reopened.snapshot();
        let code = '';
        try {
          await reopened.save(record(1), before.generation);
        } catch (error) {
          code = error.code ?? error.message;
        }
        const after = await reopened.snapshot();
        reopened.close();
        return { code, unchanged: JSON.stringify(before) === JSON.stringify(after) };
      }
      if (action === 'capacity') {
        await clear(mobile);
        const store = await open();
        let state = await store.snapshot();
        for (let index = 0; index < 64; index += 1) {
          const result = await store.save(record(index), state.generation);
          state = result.state;
        }
        let overflow = '';
        try {
          await store.save(record(64), state.generation);
        } catch (error) {
          overflow = error.code;
        }
        const after = await store.snapshot();
        store.close();
        return { count: after.records.length, generation: after.generation, overflow };
      }
      if (action === 'cas-mutation-delete-clear') {
        await clear(mobile);
        const store = await open();
        const initial = await store.snapshot();
        const mutable = record(1);
        const pending = store.save(mutable, initial.generation);
        mutable.positionMs = 99;
        const first = await pending;
        const races = await Promise.allSettled([
          store.save(record(2), first.state.generation),
          store.save(record(3), first.state.generation),
        ]);
        const afterRace = await store.snapshot();
        const staleDelete = await store.deleteIfExact(
          'episode:episode-1',
          record(1),
          initial.generation,
        );
        const staleClear = await store.clearExact(afterRace.records, initial.generation);
        const exact = afterRace.records.find(
          (item: { key: string }) => item.key === 'episode:episode-1',
        )!;
        const deleted = await store.deleteIfExact(exact.key, exact, afterRace.generation);
        const cleared = await store.clearExact(deleted.state.records, deleted.state.generation);
        store.close();
        const reopened = await open();
        const final = await reopened.snapshot();
        reopened.close();
        return {
          savedPosition: first.state.records[0].positionMs,
          raceSaved: races.filter(
            (item) => item.status === 'fulfilled' && item.value.kind === 'saved',
          ).length,
          raceRejected: races.filter((item) => item.status === 'rejected').length,
          staleDelete: staleDelete.kind,
          staleClear: staleClear.kind,
          deleted: deleted.kind,
          cleared: cleared.kind,
          finalCount: final.records.length,
        };
      }
      if (action === 'protected-isolation-close') {
        await clear(mobile);
        await clear(website);
        const raw = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(website, 1);
          request.onupgradeneeded = () => {
            request.result.createObjectStore('mediaResume', { keyPath: 'key' });
            request.result.createObjectStore('extra');
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        raw.close();
        let protectedCode = '';
        try {
          await mod.createProductionMediaResumeStoreFactory(website)();
        } catch (error) {
          protectedCode = error.code;
        }
        const websiteMeta = (await indexedDB.databases()).find((entry) => entry.name === website);
        const store = await open();
        const before = await store.snapshot();
        const pending = store.save(record(7), before.generation);
        store.close();
        let closedCode = '';
        try {
          await pending;
        } catch (error) {
          closedCode = error.code;
        }
        const reopened = await open();
        const after = await reopened.snapshot();
        reopened.close();
        await clear(mobile);
        const future = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(mobile, 2);
          request.onupgradeneeded = () => {
            request.result.createObjectStore('mediaResume', { keyPath: 'key' });
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        future.close();
        let futureCode = '';
        try {
          await mod.createProductionMediaResumeStoreFactory(mobile)();
        } catch (error) {
          futureCode = error.code;
        }
        return {
          protectedCode,
          websiteVersion: websiteMeta?.version,
          closedCode,
          mobileCount: after.records.length,
          futureCode,
        };
      }
      if (action === 'corrupt-and-abort') {
        const rawState = async (value: IDBDatabase) =>
          new Promise<string>((resolve, reject) => {
            const transaction = value.transaction('mediaResume', 'readonly');
            const request = transaction.objectStore('mediaResume').getAll();
            request.onsuccess = () => resolve(JSON.stringify(request.result));
            request.onerror = () => reject(request.error);
          });
        const rawOpen = async (version: number, write: (store: IDBObjectStore) => void) =>
          new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(mobile, version);
            request.onupgradeneeded = () => {
              const store = request.result.createObjectStore('mediaResume', { keyPath: 'key' });
              write(store);
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        await clear(mobile);
        const corrupt = await rawOpen(1, (store) => {
          store.put({ recordVersion: 1, key: 'control', generation: 0 });
          store.put({ ...record(1), updatedAt: 1 });
        });
        const corruptBefore = await rawState(corrupt);
        corrupt.close();
        let corruptCode = '';
        const corruptStore = await open();
        try {
          await corruptStore.snapshot();
        } catch (error) {
          corruptCode = error.code;
        } finally {
          corruptStore.close();
        }
        const corruptAfterDb = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(mobile);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const corruptAfter = await rawState(corruptAfterDb);
        corruptAfterDb.close();
        await clear(mobile);
        const badControl = await rawOpen(1, (store) =>
          store.put({ recordVersion: 1, key: 'control', generation: Number.MAX_SAFE_INTEGER + 1 }),
        );
        const controlBefore = await rawState(badControl);
        badControl.close();
        let controlCode = '';
        const controlStore = await open();
        try {
          await controlStore.snapshot();
        } catch (error) {
          controlCode = error.code;
        } finally {
          controlStore.close();
        }
        const controlAfterDb = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(mobile);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const controlAfter = await rawState(controlAfterDb);
        controlAfterDb.close();
        await clear(mobile);
        const indexed = await rawOpen(1, (store) => {
          store.createIndex('unexpected', 'key');
          store.put({ recordVersion: 1, key: 'control', generation: 0 });
        });
        const indexBefore = await rawState(indexed);
        indexed.close();
        let indexCode = '';
        try {
          await open();
        } catch (error) {
          indexCode = error.code;
        }
        const indexAfterDb = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(mobile);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const indexAfter = await rawState(indexAfterDb);
        indexAfterDb.close();
        await clear(mobile);
        const store = await open();
        const before = await store.snapshot();
        const abort = new AbortController();
        const pending = store.save(record(9), before.generation, abort.signal);
        abort.abort();
        let abortCode = '';
        try {
          await pending;
        } catch (error) {
          abortCode = error.code;
        }
        store.close();
        const finalStore = await open();
        const final = await finalStore.snapshot();
        finalStore.close();
        return {
          corruptCode,
          corruptStable: corruptBefore === corruptAfter,
          controlCode,
          controlStable: controlBefore === controlAfter,
          indexCode,
          indexStable: indexBefore === indexAfter,
          abortCode,
          abortCount: final.records.length,
        };
      }
      throw new Error('unknown test action');
    },
    { moduleUrl, action },
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:43173');
});

test.describe('production media resume store real IndexedDB', () => {
  test('missing and mismatched exact clear are no-op', async ({ page }) => {
    expect(await mobileResult(page, 'missing-and-invalid-input')).toEqual({
      missing: 'no-op',
      mismatch: 'no-op',
      unchanged: true,
    });
  });
  test('malformed caller inputs stay finite and preserve state', async ({ page }) => {
    expect(await mobileResult(page, 'invalid-input')).toEqual({
      codes: ['protected', 'protected', 'protected'],
      unchanged: true,
    });
  });
  test('generation overflow refuses writes atomically', async ({ page }) => {
    expect(await mobileResult(page, 'generation-overflow')).toEqual({
      code: 'protected',
      unchanged: true,
    });
  });
  test('accepts exactly 64 records and rejects a 65th atomically', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile-390x844', 'one real mobile projection');
    await expect(
      mobileResult<{ count: number; generation: number; overflow: string }>(page, 'capacity'),
    ).resolves.toEqual({
      count: 64,
      generation: 64,
      overflow: 'protected',
    });
  });

  test('keeps CAS, input snapshot, stale exact removal, clear and reopen exact', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'mobile-390x844', 'one real mobile projection');
    await expect(
      mobileResult<{
        savedPosition: number;
        raceSaved: number;
        raceRejected: number;
        staleDelete: string;
        staleClear: string;
        deleted: string;
        cleared: string;
        finalCount: number;
      }>(page, 'cas-mutation-delete-clear'),
    ).resolves.toEqual({
      savedPosition: 0,
      raceSaved: 1,
      raceRejected: 1,
      staleDelete: 'no-op',
      staleClear: 'no-op',
      deleted: 'deleted',
      cleared: 'deleted',
      finalCount: 0,
    });
  });

  test('keeps foreign schema protected and isolated and blocks close-raced persistence', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'mobile-390x844', 'one real mobile projection');
    await expect(
      mobileResult<{
        protectedCode: string;
        websiteVersion?: number;
        closedCode: string;
        mobileCount: number;
        futureCode: string;
      }>(page, 'protected-isolation-close'),
    ).resolves.toEqual({
      protectedCode: 'protected',
      websiteVersion: 1,
      closedCode: 'storage-failure',
      mobileCount: 0,
      futureCode: 'protected',
    });
  });

  test('leaves corrupt, future and indexed state byte-stable and aborts a pending save', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'mobile-390x844', 'one real mobile projection');
    await expect(
      mobileResult<{
        corruptCode: string;
        corruptStable: boolean;
        controlCode: string;
        controlStable: boolean;
        indexCode: string;
        indexStable: boolean;
        abortCode: string;
        abortCount: number;
      }>(page, 'corrupt-and-abort'),
    ).resolves.toEqual({
      corruptCode: 'protected',
      corruptStable: true,
      controlCode: 'protected',
      controlStable: true,
      indexCode: 'protected',
      indexStable: true,
      abortCode: 'aborted',
      abortCount: 0,
    });
  });
});
