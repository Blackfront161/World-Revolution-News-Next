import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { g3020RegionalEventsStoreHarness } from './g3-020-regional-events-store-harness';

test('G3-020 uses isolated real IndexedDB candidate, safety, restart and selection-CAS paths', async ({
  context,
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-390x844',
    'One isolated browser-IDB proof is sufficient.',
  );
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const remove = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    await remove(names.eventDatabase);
    await remove(names.selectionDatabase);
    const open = (name: string) =>
      new Promise<IDBDatabase>((resolve, reject) => {
        const r = indexedDB.open(name, 1);
        r.onupgradeneeded = () => r.result.createObjectStore('values');
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
    const foreign = await open('wrn-g3-020-foreign-sentinel');
    foreign.transaction('values', 'readwrite').objectStore('values').put('keep', 'key');
    foreign.close();
    const eventsModule = await import('/src/mobile-regional-events-store.ts');
    const selectionModule = await import('/src/mobile-regional-events-selection.ts');
    const eventsStore = await eventsModule.openMobileRegionalEventsStore();
    const bytes = new Uint8Array(
      await (
        await fetch('/wrn-mobile-regional-events/v1/mobile-regional-events.json')
      ).arrayBuffer(),
    );
    const before = await eventsStore.snapshot();
    const candidate = await eventsStore.saveCandidate(bytes, before.control.generation);
    const activated = await eventsStore.activate(candidate.control.generation);
    eventsStore.close();
    const restarted = await eventsModule.openMobileRegionalEventsStore();
    const restart = await restarted.snapshot();
    restarted.close();
    const selectionStore = await selectionModule.openMobileRegionalEventsSelection();
    const selected = await selectionStore.save('wrn-region-test', 0, new Set(['wrn-region-test']));
    await selectionStore.clear(selected.generation);
    const selectionAfterClear = await selectionStore.read();
    selectionStore.close();
    const events = await open(names.eventDatabase);
    const selection = await open(names.selectionDatabase);
    const eventStores = Array.from(events.objectStoreNames);
    const selectionStores = Array.from(selection.objectStoreNames);
    events.close();
    selection.close();
    const check = await open('wrn-g3-020-foreign-sentinel');
    const value = await new Promise<unknown>((resolve, reject) => {
      const r = check.transaction('values').objectStore('values').get('key');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    check.close();
    await remove(names.eventDatabase);
    const futureEvents = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(names.eventDatabase, 2);
      request.onupgradeneeded = () => request.result.createObjectStore('future');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    futureEvents.close();
    let futureEventProtected = false;
    try {
      await eventsModule.openMobileRegionalEventsStore();
    } catch (error) {
      futureEventProtected = error instanceof Error && error.message === 'protected';
    }
    await remove(names.eventDatabase);
    await remove(names.selectionDatabase);
    const extraSelection = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(names.selectionDatabase, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('selection', { keyPath: 'key' });
        request.result.createObjectStore('unexpected');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    extraSelection.close();
    let extraSelectionProtected = false;
    try {
      await selectionModule.openMobileRegionalEventsSelection();
    } catch (error) {
      extraSelectionProtected = error instanceof Error && error.message === 'protected';
    }
    await remove(names.selectionDatabase);
    return {
      before: before.control.generation,
      candidate: candidate.control.generation,
      active: activated.control.active?.bundleRevision,
      restartActive: restart.control.active?.bundleRevision,
      selectionAfterClear: selectionAfterClear.kind,
      futureEventProtected,
      extraSelectionProtected,
      eventStores,
      selectionStores,
      value,
    };
  }, g3020RegionalEventsStoreHarness);
  expect(result.value).toBe('keep');
  expect(result.eventStores).toEqual(['eventBundles', 'eventControl', 'eventSafety']);
  expect(result.selectionStores).toEqual(['selection']);
  expect(result).toMatchObject({
    before: 0,
    candidate: 1,
    active: 1,
    restartActive: 1,
    selectionAfterClear: 'inactive',
    futureEventProtected: true,
    extraSelectionProtected: true,
  });

  const second = await context.newPage();
  await second.goto('http://127.0.0.1:43173');
  const save = (target: typeof page, regionId: string) =>
    target.evaluate(async (region) => {
      const selectionModule = await import('/src/mobile-regional-events-selection.ts');
      const store = await selectionModule.openMobileRegionalEventsSelection();
      try {
        const record = await store.save(region, 0, new Set(['wrn-region-a', 'wrn-region-b']));
        return `ready:${record.generation}`;
      } catch (error) {
        return error instanceof Error ? error.message : 'unexpected';
      } finally {
        store.close();
      }
    }, regionId);
  const race = await Promise.all([save(page, 'wrn-region-a'), save(second, 'wrn-region-b')]);
  await second.close();
  expect(race.filter((outcome) => outcome === 'ready:1')).toHaveLength(1);
  expect(race.filter((outcome) => outcome === 'conflict')).toHaveLength(1);
});

test('G3-020 fails closed and preserves pre-R3 and capped safety raw records in real IndexedDB', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-390x844',
    'One isolated browser-IDB proof is sufficient.',
  );
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const remove = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const setup = (safety: unknown) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(names.eventDatabase, 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore('eventBundles', { keyPath: 'slot' });
          request.result.createObjectStore('eventControl', { keyPath: 'key' });
          request.result.createObjectStore('eventSafety', { keyPath: 'key' });
        };
        request.onsuccess = () => {
          const database = request.result;
          const tx = database.transaction('eventSafety', 'readwrite');
          tx.objectStore('eventSafety').put(safety);
          tx.oncomplete = () => {
            database.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
      });
    const readSafety = () =>
      new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open(names.eventDatabase);
        request.onsuccess = () => {
          const database = request.result;
          const get = database.transaction('eventSafety').objectStore('eventSafety').get('safety');
          get.onsuccess = () => {
            database.close();
            resolve(get.result);
          };
          get.onerror = () => reject(get.error);
        };
        request.onerror = () => reject(request.error);
      });
    const protectedOpen = async () => {
      const eventsModule = await import('/src/mobile-regional-events-store.ts');
      try {
        const store = await eventsModule.openMobileRegionalEventsStore();
        try {
          await store.snapshot();
        } finally {
          store.close();
        }
        return false;
      } catch (error) {
        return error instanceof Error && error.message === 'protected';
      }
    };
    const preR3 = {
      storeSchema: 1,
      key: 'safety',
      revision: 0,
      sha256: '0'.repeat(64),
      entries: [],
    };
    await remove(names.eventDatabase);
    await setup(preR3);
    const preR3Protected = await protectedOpen();
    const preR3Unchanged = JSON.stringify(await readSafety()) === JSON.stringify(preR3);
    const capped = {
      storeSchema: 1,
      key: 'safety',
      revision: 1,
      sha256: '0'.repeat(64),
      entries: Array.from({ length: names.safetyEntryCap + 1 }, (_, index) => ({
        namespace: 'event',
        id: `wrn-event-cap-${index}`,
        status: 'blocked',
      })),
      references: [],
    };
    await remove(names.eventDatabase);
    await setup(capped);
    const cappedProtected = await protectedOpen();
    const cappedUnchanged = JSON.stringify(await readSafety()) === JSON.stringify(capped);
    await remove(names.eventDatabase);
    return { preR3Protected, preR3Unchanged, cappedProtected, cappedUnchanged };
  }, g3020RegionalEventsStoreHarness);
  expect(result).toEqual({
    preR3Protected: true,
    preR3Unchanged: true,
    cappedProtected: true,
    cappedUnchanged: true,
  });
});

test('G3-020 derives and persists hash-bound safety references before real-IDB activation', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-390x844',
    'One isolated browser-IDB proof is sufficient.',
  );
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const remove = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha256 = async (value: string) => {
      const bytes = new TextEncoder().encode(value);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const fixture = await (
      await fetch('/wrn-mobile-regional-events/v1/mobile-regional-events.json')
    ).json();
    const revocations = [{ namespace: 'continent', id: 'wrn-cont-test', status: 'blocked' }];
    const candidate = {
      ...fixture,
      bundleRevision: 2,
      revocationRevision: 1,
      revocations,
      /* One canonical entry is already sorted and has the exact schema order,
       * so this is the independently reconstructed R2 source preimage. */
      revocationsSha256: await sha256(JSON.stringify(revocations)),
    };
    const rawJson = JSON.stringify(candidate);
    const transportSha256 = await sha256(rawJson);
    await remove(names.eventDatabase);
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(names.eventDatabase, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('eventBundles', { keyPath: 'slot' });
        request.result.createObjectStore('eventControl', { keyPath: 'key' });
        request.result.createObjectStore('eventSafety', { keyPath: 'key' });
      };
      request.onsuccess = () => {
        const database = request.result;
        const tx = database.transaction(['eventBundles', 'eventControl'], 'readwrite');
        tx.objectStore('eventBundles').put({
          storeSchema: 1,
          slot: 'candidate',
          bundleRevision: 2,
          taxonomyRevision: candidate.taxonomyRevision,
          transportSha256,
          rawJson,
        });
        tx.objectStore('eventControl').put({
          storeSchema: 1,
          key: 'control',
          generation: 0,
          active: null,
          candidate: {
            bundleRevision: 2,
            taxonomyRevision: candidate.taxonomyRevision,
            transportSha256,
          },
          previous: null,
          safetyRevision: 0,
        });
        tx.oncomplete = () => {
          database.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
    const eventsModule = await import('/src/mobile-regional-events-store.ts');
    const store = await eventsModule.openMobileRegionalEventsStore();
    const after = await store.activate(0);
    store.close();
    await remove(names.eventDatabase);
    return {
      generation: after.control.generation,
      safetyRevision: after.safety.revision,
      active: after.control.active?.bundleRevision,
      references: after.safety.references,
    };
  }, g3020RegionalEventsStoreHarness);
  expect(result).toEqual({
    generation: 1,
    safetyRevision: 1,
    active: 2,
    references: [{ namespace: 'continent', id: 'wrn-cont-test' }],
  });
});

test('G3-020 rejects lower-revision candidate activation without a real-IDB mutation', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-390x844',
    'One isolated browser-IDB proof is sufficient.',
  );
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const remove = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha256 = async (value: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const fixture = await (
      await fetch('/wrn-mobile-regional-events/v1/mobile-regional-events.json')
    ).json();
    const entries = [{ namespace: 'continent', id: 'wrn-cont-test', status: 'blocked' }];
    const references = [{ namespace: 'continent', id: 'wrn-cont-test' }];
    const rawFor = async (bundleRevision: number) =>
      JSON.stringify({
        ...fixture,
        bundleRevision,
        revocationRevision: 1,
        revocations: entries,
        revocationsSha256: await sha256(JSON.stringify(entries)),
      });
    const record = async (slot: string, bundleRevision: number) => {
      const rawJson = await rawFor(bundleRevision);
      return {
        storeSchema: 1,
        slot,
        bundleRevision,
        taxonomyRevision: fixture.taxonomyRevision,
        transportSha256: await sha256(rawJson),
        rawJson,
      };
    };
    const [active, previous, candidate] = await Promise.all([
      record('active', 1),
      record('previous', 2),
      record('candidate', 3),
    ]);
    const pointer = (value: typeof active) => ({
      bundleRevision: value.bundleRevision,
      taxonomyRevision: value.taxonomyRevision,
      transportSha256: value.transportSha256,
    });
    const safety = {
      storeSchema: 1,
      key: 'safety',
      revision: 2,
      sha256: await sha256(JSON.stringify({ revision: 2, entries, references })),
      entries,
      references,
    };
    await remove(names.eventDatabase);
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(names.eventDatabase, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('eventBundles', { keyPath: 'slot' });
        request.result.createObjectStore('eventControl', { keyPath: 'key' });
        request.result.createObjectStore('eventSafety', { keyPath: 'key' });
      };
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(
          ['eventBundles', 'eventControl', 'eventSafety'],
          'readwrite',
        );
        transaction.objectStore('eventBundles').put(active);
        transaction.objectStore('eventBundles').put(previous);
        transaction.objectStore('eventBundles').put(candidate);
        transaction.objectStore('eventControl').put({
          storeSchema: 1,
          key: 'control',
          generation: 7,
          active: pointer(active),
          candidate: pointer(candidate),
          previous: pointer(previous),
          safetyRevision: 2,
        });
        transaction.objectStore('eventSafety').put(safety);
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });
    const eventsModule = await import('/src/mobile-regional-events-store.ts');
    const store = await eventsModule.openMobileRegionalEventsStore();
    const before = await store.snapshot();
    let code = 'unexpected';
    try {
      await store.activate(7);
    } catch (error) {
      code = error instanceof Error ? error.message : 'unexpected';
    }
    const after = await store.snapshot();
    store.close();
    const restarted = await eventsModule.openMobileRegionalEventsStore();
    const restart = await restarted.snapshot();
    restarted.close();
    await remove(names.eventDatabase);
    return { code, before, after, restart };
  }, g3020RegionalEventsStoreHarness);
  expect(result.code).toBe('protected');
  expect(result.after).toEqual(result.before);
  expect(result.restart).toEqual(result.before);
});

test('G3-020 deduplicates same-ID hash references in a real-IDB merge and restart', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-390x844',
    'One isolated browser-IDB proof is sufficient.',
  );
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const remove = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha256 = async (value: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const fixture = await (
      await fetch('/wrn-mobile-regional-events/v1/mobile-regional-events.json')
    ).json();
    const entries = [
      {
        namespace: 'continent',
        id: 'wrn-cont-test',
        status: 'blocked',
        objectSha256: 'a'.repeat(64),
      },
      {
        namespace: 'continent',
        id: 'wrn-cont-test',
        status: 'blocked',
        objectSha256: 'b'.repeat(64),
      },
    ];
    const rawJson = JSON.stringify({
      ...fixture,
      bundleRevision: 2,
      revocationRevision: 1,
      revocations: entries,
      revocationsSha256: await sha256(JSON.stringify(entries)),
    });
    const candidate = {
      storeSchema: 1,
      slot: 'candidate',
      bundleRevision: 2,
      taxonomyRevision: fixture.taxonomyRevision,
      transportSha256: await sha256(rawJson),
      rawJson,
    };
    await remove(names.eventDatabase);
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(names.eventDatabase, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('eventBundles', { keyPath: 'slot' });
        request.result.createObjectStore('eventControl', { keyPath: 'key' });
        request.result.createObjectStore('eventSafety', { keyPath: 'key' });
      };
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(['eventBundles', 'eventControl'], 'readwrite');
        transaction.objectStore('eventBundles').put(candidate);
        transaction.objectStore('eventControl').put({
          storeSchema: 1,
          key: 'control',
          generation: 0,
          active: null,
          candidate: {
            bundleRevision: candidate.bundleRevision,
            taxonomyRevision: candidate.taxonomyRevision,
            transportSha256: candidate.transportSha256,
          },
          previous: null,
          safetyRevision: 0,
        });
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });
    const eventsModule = await import('/src/mobile-regional-events-store.ts');
    const store = await eventsModule.openMobileRegionalEventsStore();
    const after = await store.activate(0);
    store.close();
    const restarted = await eventsModule.openMobileRegionalEventsStore();
    const restart = await restarted.snapshot();
    restarted.close();
    await remove(names.eventDatabase);
    return { after, restart };
  }, g3020RegionalEventsStoreHarness);
  expect(result.after.safety.entries).toHaveLength(2);
  expect(result.after.safety.references).toEqual([{ namespace: 'continent', id: 'wrn-cont-test' }]);
  expect(result.restart).toEqual(result.after);
});

test('G3-020 deduplicates shared replacement references in a real-IDB merge and restart', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-390x844',
    'One isolated browser-IDB proof is sufficient.',
  );
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const remove = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha256 = async (value: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const fixture = await (
      await fetch('/wrn-mobile-regional-events/v1/mobile-regional-events.json')
    ).json();
    const continents = [
      { ...fixture.continents[0], continentId: 'wrn-cont-replacement' },
      ...fixture.continents,
    ];
    const entries = [
      {
        namespace: 'continent',
        id: 'wrn-cont-test',
        status: 'replaced',
        objectSha256: 'a'.repeat(64),
        replacementId: 'wrn-cont-replacement',
      },
      {
        namespace: 'continent',
        id: 'wrn-cont-test',
        status: 'replaced',
        objectSha256: 'b'.repeat(64),
        replacementId: 'wrn-cont-replacement',
      },
    ];
    const rawJson = JSON.stringify({
      ...fixture,
      bundleRevision: 2,
      taxonomySha256: await sha256(
        JSON.stringify({
          continents,
          countries: fixture.countries,
          regions: fixture.regions,
          identityLinks: fixture.identityLinks,
        }),
      ),
      continents,
      revocationRevision: 1,
      revocations: entries,
      revocationsSha256: await sha256(JSON.stringify(entries)),
    });
    const candidate = {
      storeSchema: 1,
      slot: 'candidate',
      bundleRevision: 2,
      taxonomyRevision: fixture.taxonomyRevision,
      transportSha256: await sha256(rawJson),
      rawJson,
    };
    await remove(names.eventDatabase);
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(names.eventDatabase, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('eventBundles', { keyPath: 'slot' });
        request.result.createObjectStore('eventControl', { keyPath: 'key' });
        request.result.createObjectStore('eventSafety', { keyPath: 'key' });
      };
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(['eventBundles', 'eventControl'], 'readwrite');
        transaction.objectStore('eventBundles').put(candidate);
        transaction.objectStore('eventControl').put({
          storeSchema: 1,
          key: 'control',
          generation: 0,
          active: null,
          candidate: {
            bundleRevision: candidate.bundleRevision,
            taxonomyRevision: candidate.taxonomyRevision,
            transportSha256: candidate.transportSha256,
          },
          previous: null,
          safetyRevision: 0,
        });
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });
    const eventsModule = await import('/src/mobile-regional-events-store.ts');
    const store = await eventsModule.openMobileRegionalEventsStore();
    const after = await store.activate(0);
    store.close();
    const restarted = await eventsModule.openMobileRegionalEventsStore();
    const restart = await restarted.snapshot();
    restarted.close();
    await remove(names.eventDatabase);
    return { after, restart };
  }, g3020RegionalEventsStoreHarness);
  expect(result.after.safety.entries).toHaveLength(2);
  expect(result.after.safety.references).toEqual([
    { namespace: 'continent', id: 'wrn-cont-replacement' },
    { namespace: 'continent', id: 'wrn-cont-test' },
  ]);
  expect(result.restart).toEqual(result.after);
});

test('G3-020 bounds the complete selection record by UTF-8 bytes before real-IDB writes', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-390x844',
    'One isolated browser-IDB proof is sufficient.',
  );
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const remove = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const readRaw = () =>
      new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open(names.selectionDatabase);
        request.onsuccess = () => {
          const database = request.result;
          const get = database
            .transaction('selection')
            .objectStore('selection')
            .get(names.selectionKey);
          get.onsuccess = () => {
            database.close();
            resolve(get.result);
          };
          get.onerror = () => reject(get.error);
        };
        request.onerror = () => reject(request.error);
      });
    const serialized = (regionId: string, generation: number) =>
      JSON.stringify({
        storeSchema: 1,
        key: names.selectionKey,
        generation,
        contractVersion: 1,
        schema: names.selectionSchema,
        revision: names.selectionKey,
        regionId,
      });
    const bytes = (value: string) => new TextEncoder().encode(value).byteLength;
    const ascii4095 = 'x'.repeat(3880);
    const ascii4096 = 'x'.repeat(3881);
    const ascii4097 = 'x'.repeat(3882);
    await remove(names.selectionDatabase);
    const selectionModule = await import('/src/mobile-regional-events-selection.ts');
    const store = await selectionModule.openMobileRegionalEventsSelection();
    const first = await store.save(ascii4095, 0, new Set([ascii4095]));
    const second = await store.save(ascii4096, first.generation, new Set([ascii4096]));
    store.close();
    const rawBefore = JSON.stringify(await readRaw());
    const rejectedStore = await selectionModule.openMobileRegionalEventsSelection();
    let oversizedCode = 'unexpected';
    try {
      await rejectedStore.save(ascii4097, second.generation, new Set([ascii4097]));
    } catch (error) {
      oversizedCode = error instanceof Error ? error.message : 'unexpected';
    }
    const afterRejected = await rejectedStore.read();
    rejectedStore.close();
    const rawAfter = JSON.stringify(await readRaw());
    const restartedStore = await selectionModule.openMobileRegionalEventsSelection();
    const restart = await restartedStore.read();
    restartedStore.close();
    await remove(names.selectionDatabase);
    const multiByte = `${'x'.repeat(3880)}é`;
    const multiStore = await selectionModule.openMobileRegionalEventsSelection();
    const baseline = await multiStore.save('wrn-region-test', 0, new Set(['wrn-region-test']));
    let multiByteCode = 'unexpected';
    try {
      await multiStore.save(multiByte, baseline.generation, new Set([multiByte]));
    } catch (error) {
      multiByteCode = error instanceof Error ? error.message : 'unexpected';
    }
    const multiAfterRejected = await multiStore.read();
    multiStore.close();
    await remove(names.selectionDatabase);
    return {
      firstBytes: bytes(JSON.stringify(first)),
      secondBytes: bytes(JSON.stringify(second)),
      oversizedBytes: bytes(serialized(ascii4097, second.generation + 1)),
      oversizedCode,
      rawUnchanged: rawAfter === rawBefore,
      afterRejected,
      restart,
      multiByteCode,
      multiByteCodeUnits: serialized(multiByte, baseline.generation + 1).length,
      multiByteBytes: bytes(serialized(multiByte, baseline.generation + 1)),
      multiAfterRejected,
    };
  }, g3020RegionalEventsStoreHarness);
  expect(result.firstBytes).toBe(4095);
  expect(result.secondBytes).toBe(4096);
  expect(result.oversizedBytes).toBe(4097);
  expect(result.oversizedCode).toBe('storage-failure');
  expect(result.rawUnchanged).toBe(true);
  expect(result.afterRejected).toMatchObject({ kind: 'ready', record: { generation: 2 } });
  expect(result.restart).toEqual(result.afterRejected);
  expect(result.multiByteCodeUnits).toBe(4096);
  expect(result.multiByteBytes).toBe(4097);
  expect(result.multiByteCode).toBe('storage-failure');
  expect(result.multiAfterRejected).toMatchObject({ kind: 'ready', record: { generation: 1 } });
});

test('G3-020 R4-B-R1 keeps selection lifecycle, foreign records and event safety isolated in real IndexedDB', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-390x844',
    'The persistent selection matrix is bound to one isolated browser project.',
  );
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const remove = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const put = (database: IDBDatabase, store: string, value: unknown) =>
      new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(store, 'readwrite');
        transaction.objectStore(store).put(value);
        transaction.oncomplete = () => resolve();
        transaction.onerror = transaction.onabort = () => reject(transaction.error);
      });
    const code = async (operation: () => Promise<unknown>) => {
      try {
        await operation();
        return 'ready';
      } catch (error) {
        return error instanceof Error ? error.message : 'unexpected';
      }
    };
    await remove(names.eventDatabase);
    await remove(names.selectionDatabase);
    const selectionModule = await import('/src/mobile-regional-events-selection.ts');
    const eventsModule = await import('/src/mobile-regional-events-store.ts');
    const first = await selectionModule.openMobileRegionalEventsSelection();
    const missing = await first.read();
    const invalid = await code(() =>
      first.save('wrn-region-nope', 0, new Set(['wrn-region-test'])),
    );
    const saved = await first.save('wrn-region-test', 0, new Set(['wrn-region-test']));
    const stale = await code(() => first.save('wrn-region-test', 0, new Set(['wrn-region-test'])));
    first.close();
    const restartStore = await selectionModule.openMobileRegionalEventsSelection();
    const restart = await restartStore.read();
    await restartStore.clear(saved.generation);
    const cleared = await restartStore.read();
    restartStore.close();

    const events = await eventsModule.openMobileRegionalEventsStore();
    const safetyBefore = await events.snapshot();
    events.close();
    const selection = await selectionModule.openMobileRegionalEventsSelection();
    const second = await selection.save('wrn-region-test', 0, new Set(['wrn-region-test']));
    await selection.clear(second.generation);
    selection.close();
    const eventsRestart = await eventsModule.openMobileRegionalEventsStore();
    const safetyAfter = await eventsRestart.snapshot();
    eventsRestart.close();

    await remove(names.selectionDatabase);
    const corrupt = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(names.selectionDatabase, 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore('selection', { keyPath: 'key' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await put(corrupt, 'selection', { key: names.selectionKey, malformed: true });
    corrupt.close();
    const corruptStore = await selectionModule.openMobileRegionalEventsSelection();
    const corruptRead = await corruptStore.read();
    corruptStore.close();

    await remove(names.selectionDatabase);
    const future = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(names.selectionDatabase, 2);
      request.onupgradeneeded = () => request.result.createObjectStore('future');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    future.close();
    const futureOpen = await code(() => selectionModule.openMobileRegionalEventsSelection());
    await remove(names.eventDatabase);
    await remove(names.selectionDatabase);
    return {
      missing,
      invalid,
      saved,
      stale,
      restart,
      cleared,
      safetyUnchanged: JSON.stringify(safetyAfter.safety) === JSON.stringify(safetyBefore.safety),
      corruptRead,
      futureOpen,
    };
  }, g3020RegionalEventsStoreHarness);
  expect(result.missing).toEqual({ kind: 'inactive', generation: 0 });
  expect(result.invalid).toBe('invalid-region');
  expect(result.saved.generation).toBe(1);
  expect(result.stale).toBe('conflict');
  expect(result.restart).toMatchObject({ kind: 'ready', record: { generation: 1 } });
  expect(result.cleared).toEqual({ kind: 'inactive', generation: 0 });
  expect(result.safetyUnchanged).toBe(true);
  expect(result.corruptRead).toEqual({ kind: 'protected' });
  expect(result.futureOpen).toBe('protected');
});

test('G3-020 R4-B-R1 converts injected real-IDB selection failures into no-mutation storage failures', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-390x844',
    'Browser-level IndexedDB failure injection is intentionally isolated.',
  );
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const remove = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const code = async (operation: () => Promise<unknown>) => {
      try {
        await operation();
        return 'ready';
      } catch (error) {
        return error instanceof Error ? error.message : 'unexpected';
      }
    };
    const inject = async (method: 'put' | 'get' | 'delete', action: () => Promise<string>) => {
      const prototype = IDBObjectStore.prototype;
      const original = prototype[method] as unknown as (...args: unknown[]) => unknown;
      Object.defineProperty(prototype, method, {
        configurable: true,
        value(this: IDBObjectStore, ...args: unknown[]) {
          if (this.name === 'selection')
            throw new DOMException(
              'injected',
              method === 'put' ? 'QuotaExceededError' : 'AbortError',
            );
          return original.apply(this, args);
        },
      });
      try {
        return await action();
      } finally {
        Object.defineProperty(prototype, method, { configurable: true, value: original });
      }
    };
    await remove(names.selectionDatabase);
    const selectionModule = await import('/src/mobile-regional-events-selection.ts');
    const store = await selectionModule.openMobileRegionalEventsSelection();
    const initial = await store.save('wrn-region-test', 0, new Set(['wrn-region-test']));
    const before = await store.read();
    const putFailure = await inject('put', () =>
      code(() => store.save('wrn-region-test', initial.generation, new Set(['wrn-region-test']))),
    );
    const afterPut = await store.read();
    const getFailure = await inject('get', () =>
      code(() => store.save('wrn-region-test', initial.generation, new Set(['wrn-region-test']))),
    );
    const afterGet = await store.read();
    const deleteFailure = await inject('delete', () => code(() => store.clear(initial.generation)));
    const afterDelete = await store.read();
    store.close();
    const restartStore = await selectionModule.openMobileRegionalEventsSelection();
    const restart = await restartStore.read();
    restartStore.close();
    await remove(names.selectionDatabase);
    return {
      putFailure,
      getFailure,
      deleteFailure,
      before,
      afterPut,
      afterGet,
      afterDelete,
      restart,
    };
  }, g3020RegionalEventsStoreHarness);
  expect(result.putFailure).toBe('storage-failure');
  expect(result.getFailure).toBe('storage-failure');
  expect(result.deleteFailure).toBe('storage-failure');
  expect(result.afterPut).toEqual(result.before);
  expect(result.afterGet).toEqual(result.before);
  expect(result.afterDelete).toEqual(result.before);
  expect(result.restart).toEqual(result.before);
});

test('G3-020 R4-B-R1 aborts an injected safety-persist write before any event-store mutation', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-390x844',
    'The safety persistence failure is an isolated browser IndexedDB proof.',
  );
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const remove = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const sha256 = async (value: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    await remove(names.eventDatabase);
    const fixture = await (
      await fetch('/wrn-mobile-regional-events/v1/mobile-regional-events.json')
    ).json();
    const entries = [{ namespace: 'continent', id: 'wrn-cont-test', status: 'blocked' }];
    const rawJson = JSON.stringify({
      ...fixture,
      bundleRevision: 2,
      revocationRevision: 1,
      revocations: entries,
      revocationsSha256: await sha256(JSON.stringify(entries)),
    });
    const candidate = {
      storeSchema: 1,
      slot: 'candidate',
      bundleRevision: 2,
      taxonomyRevision: fixture.taxonomyRevision,
      transportSha256: await sha256(rawJson),
      rawJson,
    };
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(names.eventDatabase, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('eventBundles', { keyPath: 'slot' });
        request.result.createObjectStore('eventControl', { keyPath: 'key' });
        request.result.createObjectStore('eventSafety', { keyPath: 'key' });
      };
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(['eventBundles', 'eventControl'], 'readwrite');
        transaction.objectStore('eventBundles').put(candidate);
        transaction.objectStore('eventControl').put({
          storeSchema: 1,
          key: 'control',
          generation: 0,
          active: null,
          candidate: {
            bundleRevision: candidate.bundleRevision,
            taxonomyRevision: candidate.taxonomyRevision,
            transportSha256: candidate.transportSha256,
          },
          previous: null,
          safetyRevision: 0,
        });
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = transaction.onabort = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });
    const eventsModule = await import('/src/mobile-regional-events-store.ts');
    const store = await eventsModule.openMobileRegionalEventsStore();
    const before = await store.snapshot();
    const prototype = IDBObjectStore.prototype;
    const originalPut = prototype.put;
    Object.defineProperty(prototype, 'put', {
      configurable: true,
      value(this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
        if (this.name === 'eventSafety') throw new DOMException('quota', 'QuotaExceededError');
        return originalPut.apply(this, args);
      },
    });
    let code = 'ready';
    try {
      await store.activate(0);
    } catch (error) {
      code = error instanceof Error ? error.message : 'unexpected';
    } finally {
      Object.defineProperty(prototype, 'put', { configurable: true, value: originalPut });
    }
    const after = await store.snapshot();
    store.close();
    const restartStore = await eventsModule.openMobileRegionalEventsStore();
    const restart = await restartStore.snapshot();
    restartStore.close();
    await remove(names.eventDatabase);
    return { code, before, after, restart };
  }, g3020RegionalEventsStoreHarness);
  expect(result.code).toBe('storage-failure');
  expect(result.after).toEqual(result.before);
  expect(result.restart).toEqual(result.before);
});

test('G3-020 R4-B-R2 rebinds exactly one local binary pin per fresh page and preserves the A1 to H9 lifecycle', async ({
  context,
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844', 'One exact Chrome IDB lifecycle proof.');
  await page.goto('http://127.0.0.1:43173');
  const baseline = await page.evaluate(async () =>
    fetch('/wrn-mobile-regional-events/v1/mobile-regional-events.json').then((response) =>
      response.text(),
    ),
  );
  await page.close();
  const path = '/wrn-mobile-regional-events/v1/mobile-regional-events.json';
  const originalPin = 'f39fb174a5bdb5a958713a9801178e404fb476662b52afd5e5d9c5f68c08f907';
  const rawFor = (revision: number) => {
    if (revision === 1) return baseline;
    const value = JSON.parse(baseline) as Record<string, unknown>;
    value.bundleRevision = revision;
    return JSON.stringify(value);
  };
  let revision = 1;
  let raw = rawFor(revision);
  let pin = createHash('sha256').update(raw).digest('hex');
  const expectedPin = () => (revision === 1 ? originalPin : pin);
  await context.route('**/src/mobile-regional-events.ts', async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    const baselineHits = source.split('bundleRevision: 1,').length - 1;
    const pinHits = source.split(originalPin).length - 1;
    if (baselineHits !== 1 || pinHits !== 1) throw new Error('ambiguous-local-binary-pin-route');
    await route.fulfill({
      response,
      body: source
        .replace('bundleRevision: 1,', `bundleRevision: ${revision},`)
        .replace(originalPin, expectedPin()),
    });
  });
  await context.route(`**${path}`, async (route) =>
    route.fulfill({ contentType: 'application/json', body: raw }),
  );
  const open = async () => {
    const fresh = await context.newPage();
    await fresh.goto('http://127.0.0.1:43173');
    return fresh;
  };
  const invoke = async (
    operation: 'saveCandidate' | 'activate' | 'rollback',
    generation: number,
  ) => {
    const fresh = await open();
    const result = await fresh.evaluate(
      async ({ operation, generation, raw }) => {
        const module = await import('/src/mobile-regional-events-store.ts');
        const store = await module.openMobileRegionalEventsStore();
        try {
          const value =
            operation === 'saveCandidate'
              ? await store.saveCandidate(new TextEncoder().encode(raw), generation)
              : await store[operation](generation);
          return { code: 'ready', value };
        } catch (error) {
          return {
            code: error instanceof Error ? error.message : 'unexpected',
            value: await store.snapshot(),
          };
        } finally {
          store.close();
        }
      },
      { operation, generation, raw },
    );
    await fresh.close();
    return result;
  };
  const restart = async () => {
    const fresh = await open();
    const result = await fresh.evaluate(async () => {
      const module = await import('/src/mobile-regional-events-store.ts');
      const store = await module.openMobileRegionalEventsStore();
      const snapshot = await store.snapshot();
      store.close();
      return snapshot;
    });
    await fresh.close();
    return result;
  };
  const initial = await open();
  await initial.evaluate(
    async (names) => indexedDB.deleteDatabase(names.eventDatabase),
    g3020RegionalEventsStoreHarness,
  );
  await initial.close();
  const a1Save = await invoke('saveCandidate', 0);
  const a1 = await invoke('activate', 1);
  expect(a1Save.value.control.generation).toBe(1);
  expect(a1.value.control.generation).toBe(2);
  expect(a1.value.bundles.active?.bundleRevision).toBe(1);
  const noChange = await invoke('saveCandidate', 2);
  expect(noChange.value.control.generation).toBe(2);
  const bad = await open();
  const badResult = await bad.evaluate(async () => {
    const module = await import('/src/mobile-regional-events-store.ts');
    const store = await module.openMobileRegionalEventsStore();
    try {
      await store.saveCandidate(new Uint8Array([1, 2, 3]), 2);
      return 'ready';
    } catch (error) {
      return error instanceof Error ? error.message : 'unexpected';
    } finally {
      store.close();
    }
  });
  await bad.close();
  expect(badResult).toBe('invalid-bundle');
  for (const next of [2, 3, 4, 5, 6, 7] as const) {
    revision = next;
    raw = rawFor(revision);
    pin = createHash('sha256').update(raw).digest('hex');
    const saved = await invoke('saveCandidate', (next - 1) * 2);
    const active = await invoke('activate', (next - 1) * 2 + 1);
    expect(saved.code).toBe('ready');
    expect(active.code).toBe('ready');
    expect(active.value.control.generation).toBe(next * 2);
    expect(active.value.bundles.active?.bundleRevision).toBe(next);
  }
  expect((await restart()).control.generation).toBe(14);
  revision = 8;
  raw = rawFor(revision);
  pin = createHash('sha256').update(raw).digest('hex');
  expect((await invoke('saveCandidate', 14)).value.control.generation).toBe(15);
  expect((await invoke('rollback', 15)).value.control.generation).toBe(16);
  expect((await restart()).bundles.active?.bundleRevision).toBe(6);
  revision = 9;
  raw = rawFor(revision);
  pin = createHash('sha256').update(raw).digest('hex');
  const [left, right] = await Promise.all([
    invoke('saveCandidate', 16),
    invoke('saveCandidate', 16),
  ]);
  expect([left.code, right.code].sort()).toEqual(['conflict', 'ready']);
  expect((await invoke('rollback', 17)).value.control.generation).toBe(18);
  const final = await restart();
  expect(final.bundles.active?.bundleRevision).toBe(7);
  expect(final.bundles.previous?.bundleRevision).toBe(6);
  expect(final.bundles.candidate).toBeNull();
  await context.unroute(`**${path}`);
  await context.unroute('**/src/mobile-regional-events.ts');
});
