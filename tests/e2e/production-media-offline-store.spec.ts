import { expect, test } from '@playwright/test';

const harnessUrl = `/@fs/${process.cwd().replaceAll('\\', '/')}/tests/e2e/production-media-offline-harness.ts`;
const contractUrl = `/@fs/${process.cwd().replaceAll('\\', '/')}/packages/content-contracts/src/production-media-v1.ts`;
const playerUrl = `/@fs/${process.cwd().replaceAll('\\', '/')}/packages/browser-content/src/production-media-player.ts`;

test.describe('production media offline IndexedDB isolation', () => {
  test('creates only the media-specific stores and clears mobile without touching website', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const mobile = await import('/src/production-media-offline-store.ts');
      let arbitraryNameCode = '';
      try {
        mobile.createProductionMediaOfflineStoreFactory('wrn.attacker-media.v1');
      } catch (error) {
        arbitraryNameCode = (error as { code?: string }).code ?? 'unknown';
      }
      const website = mobile.createProductionMediaOfflineStoreFactory(
        'wrn.website-production-media-offline.v1',
      );
      const mobileStore = await mobile.openProductionMediaOfflineStore();
      const websiteStore = await website();
      try {
        const before = await Promise.all([mobileStore.snapshot(), websiteStore.snapshot()]);
        const cleared = await mobileStore.clear(before[0].control);
        const after = await Promise.all([mobileStore.snapshot(), websiteStore.snapshot()]);
        return {
          mobile: 'wrn.mobile-production-media-offline.v1',
          website: 'wrn.website-production-media-offline.v1',
          initial: before.map((snapshot) => snapshot.control),
          cleared,
          after: after.map((snapshot) => snapshot.control),
          arbitraryNameCode,
          deeplyFrozen:
            Object.isFrozen(before[0].control) &&
            Object.isFrozen(before[0].control.safety) &&
            Object.isFrozen(before[0].control.safety.entries) &&
            Object.isFrozen(before[0].control.acceptedIdentities),
        };
      } finally {
        mobileStore.close();
        websiteStore.close();
      }
    });
    expect(result.mobile).toBe('wrn.mobile-production-media-offline.v1');
    expect(result.website).toBe('wrn.website-production-media-offline.v1');
    expect(result.initial[0].acceptedIdentities).toEqual([]);
    expect(result.initial[1].acceptedIdentities).toEqual([]);
    expect(result.cleared.clearEpoch).toBe(result.initial[0].clearEpoch + 1);
    expect(result.after[0].clearEpoch).toBe(result.cleared.clearEpoch);
    expect(result.after[1]).toEqual(result.initial[1]);
    expect(result.arbitraryNameCode).toBe('incompatible-storage');
    expect(result.deeplyFrozen).toBe(true);
  });

  test('preserves the reciprocal client and all existing content, resume and V1 databases', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const harness = await import(harnessUrl);
      const media = await import('/src/production-media-offline-store.ts');
      const markers = [
        'wrn.mobile-content-offline',
        'wrn.website-content-offline',
        'wrn.mobile-production-content-offline.v1',
        'wrn.website-production-content-offline.v1',
        'wrn.mobile-production-media-resume.v1',
        'wrn.website-production-media-resume.v1',
        'wrn-mobile-media-resume-v1',
      ];
      const openRequest = <T>(pending: IDBRequest<T>) =>
        new Promise<T>((resolve, reject) => {
          pending.onsuccess = () => resolve(pending.result);
          pending.onerror = () => reject(pending.error);
        });
      for (const name of markers) {
        const database = await new Promise<IDBDatabase>((resolve, reject) => {
          const pending = indexedDB.open(name, 1);
          pending.onupgradeneeded = () => pending.result.createObjectStore('marker');
          pending.onsuccess = () => resolve(pending.result);
          pending.onerror = () => reject(pending.error);
        });
        const transaction = database.transaction('marker', 'readwrite');
        transaction.objectStore('marker').put(`keep-${name}`, 'value');
        await new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
        database.close();
      }
      const packet = await harness.makeProductionMediaOfflinePacket(1, 'release-a');
      const mobile = await media.openProductionMediaOfflineStore();
      const website = await media.createProductionMediaOfflineStoreFactory(
        harness.productionMediaOfflineDatabaseNames.website,
      )();
      let mobileControl = await harness.stageProductionMediaOfflinePacket(mobile, packet, 'mobile');
      const websiteControl = await harness.stageProductionMediaOfflinePacket(
        website,
        packet,
        'website',
      );
      const websiteBeforeMobileClear = await website.snapshot();
      mobileControl = await mobile.clear(mobileControl);
      const websiteAfterMobileClear = await website.snapshot();
      mobileControl = await mobile.prepareRecheck('mobile-restage', mobileControl);
      mobileControl = await mobile.commitSafety(
        'mobile-restage',
        packet.admittedSafety,
        1001,
        mobileControl,
      );
      await mobile.saveCandidate({
        ...packet,
        checkedAt: 1001,
        operationId: 'mobile-restage',
        expected: mobileControl,
      });
      const mobileBeforeWebsiteClear = await mobile.snapshot();
      await website.clear(websiteControl);
      const mobileAfterWebsiteClear = await mobile.snapshot();
      mobile.close();
      website.close();
      const markerValues: string[] = [];
      for (const name of markers) {
        const database = await openRequest(indexedDB.open(name));
        const transaction = database.transaction('marker', 'readonly');
        markerValues.push(await openRequest(transaction.objectStore('marker').get('value')));
        database.close();
      }
      return {
        websiteBeforeMobileClear,
        websiteAfterMobileClear,
        mobileBeforeWebsiteClear,
        mobileAfterWebsiteClear,
        markerValues,
        markers,
      };
    }, harnessUrl);
    expect(result.websiteAfterMobileClear).toEqual(result.websiteBeforeMobileClear);
    expect(result.mobileAfterWebsiteClear).toEqual(result.mobileBeforeWebsiteClear);
    expect(result.markerValues).toEqual(result.markers.map((name) => `keep-${name}`));
  });
});

test.describe('production media offline identity durability', () => {
  test('supports exact-highest restage and active refresh while 513 fails without eviction', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const harness = await import(harnessUrl);
      const media = await import('/src/production-media-offline-store.ts');
      const contract = await harness.loadProductionMediaOfflineContract();
      const databaseName = harness.productionMediaOfflineDatabaseNames.mobile;
      const packet512 = await harness.makeProductionMediaOfflinePacket(512, 'release-cap');
      const pointer512 = JSON.parse(packet512.pointerRaw) as {
        releaseRevision: string;
        sequence: number;
        descriptorSha256: string;
      };
      const key512 = await contract.productionMediaOfflineBundleKeyV1(pointer512);
      if (!key512) throw new Error('key-512');
      const sha = (value: number) => value.toString(16).padStart(64, '0');
      const identities = Array.from({ length: 511 }, (_, index) => ({
        releaseRevision: `ledger-${index + 1}`,
        sequence: index + 1,
        descriptorSha256: sha(1000 + index),
        key: sha(2000 + index),
      }));
      identities.push({
        releaseRevision: pointer512.releaseRevision,
        sequence: pointer512.sequence,
        descriptorSha256: pointer512.descriptorSha256,
        key: key512,
      });
      const control = {
        ...contract.createEmptyProductionMediaOfflineControlV1(),
        safety: packet512.admittedSafety,
        highestAcceptedSequence: 512,
        acceptedIdentities: identities,
      };
      await harness.seedProductionMediaOfflineDatabase(databaseName, {
        controlRows: [{ key: 'control', value: control }],
        bundleRows: [],
      });
      let store = await media.openProductionMediaOfflineStore();
      let current = await store.prepareRecheck('restage-512', (await store.snapshot()).control);
      current = await store.commitSafety('restage-512', packet512.admittedSafety, 1000, current);
      current = await store.saveCandidate({
        ...packet512,
        operationId: 'restage-512',
        expected: current,
      });
      current = await store.activateCandidate(
        current.candidateKey!,
        Date.parse('2026-09-11T12:00:00.000Z'),
        new Set(['https://publisher.invalid']),
        'restage-512',
        current,
      );
      current = await store.finishRecheck('restage-512', 'ready', 1000, current);
      const afterRestage = await store.snapshot();
      let refresh = await store.prepareRecheck('refresh-512', current);
      refresh = await store.commitSafety('refresh-512', packet512.admittedSafety, 1001, refresh);
      refresh = await store.saveCandidate({
        ...packet512,
        checkedAt: 1001,
        operationId: 'refresh-512',
        expected: refresh,
      });
      const activeKeyBeforeRefresh = refresh.activeKey;
      refresh = await store.activateCandidate(
        activeKeyBeforeRefresh!,
        Date.parse('2026-09-11T12:00:00.000Z'),
        new Set(['https://publisher.invalid']),
        'refresh-512',
        refresh,
      );
      refresh = await store.finishRecheck('refresh-512', 'ready', 1001, refresh);
      const afterRefresh = await store.snapshot();
      const conflicting = await harness.makeProductionMediaOfflinePacket(
        512,
        'release-cap',
        1,
        false,
        1,
        { variant: 'tuple-conflict' },
      );
      let conflictControl = await store.prepareRecheck('conflict', refresh);
      conflictControl = await store.commitSafety(
        'conflict',
        conflicting.admittedSafety,
        1002,
        conflictControl,
      );
      let conflictCode = '';
      try {
        await store.saveCandidate({
          ...conflicting,
          operationId: 'conflict',
          expected: conflictControl,
        });
      } catch (error) {
        conflictCode = (error as { code: string }).code;
      }
      await store.clear(conflictControl);
      store.close();
      store = await media.openProductionMediaOfflineStore();
      const cleared = await store.snapshot();
      const lower = await harness.makeProductionMediaOfflinePacket(511, 'release-cap');
      let lowerControl = await store.prepareRecheck('lower', cleared.control);
      lowerControl = await store.commitSafety('lower', lower.admittedSafety, 1003, lowerControl);
      let lowerCode = '';
      try {
        await store.saveCandidate({ ...lower, operationId: 'lower', expected: lowerControl });
      } catch (error) {
        lowerCode = (error as { code: string }).code;
      }
      const packet513 = await harness.makeProductionMediaOfflinePacket(
        513,
        'release-new',
        2,
        false,
        1,
        { knownSafety: packet512.admittedSafety },
      );
      let fullControl = await store.prepareRecheck('full', lowerControl);
      fullControl = await store.commitSafety('full', packet513.admittedSafety, 1004, fullControl);
      const beforeQuota = await store.snapshot();
      let quotaCode = '';
      try {
        await store.saveCandidate({
          ...packet513,
          operationId: 'full',
          expected: fullControl,
        });
      } catch (error) {
        quotaCode = (error as { code: string }).code;
      }
      const afterQuota = await store.snapshot();
      store.close();
      return {
        afterRestage,
        activeKeyBeforeRefresh,
        afterRefresh,
        conflictCode,
        cleared,
        lowerCode,
        quotaCode,
        beforeQuota,
        afterQuota,
      };
    }, harnessUrl);
    expect(result.afterRestage.control.acceptedIdentities).toHaveLength(512);
    expect(result.afterRestage.control.highestAcceptedSequence).toBe(512);
    expect(result.afterRefresh.control.activeKey).toBe(result.activeKeyBeforeRefresh);
    expect(result.afterRefresh.bundles).toHaveLength(1);
    expect(result.afterRefresh.bundles[0]!.checkedAt).toBe(1001);
    expect(result.conflictCode).toBe('identity-conflict');
    expect(result.cleared.control.acceptedIdentities).toHaveLength(512);
    expect(result.cleared.control.highestAcceptedSequence).toBe(512);
    expect(result.lowerCode).toBe('identity-conflict');
    expect(result.quotaCode).toBe('quota-or-write-failure');
    expect(result.afterQuota).toEqual(result.beforeQuota);
  });
});

test.describe('production media offline populated durability', () => {
  test('activates A/B/A, retains monotone safety and blocks rollback after current revocation', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const { makeProductionMediaOfflinePacket } = await import(harnessUrl);
      const { openProductionMediaOfflineStore } =
        await import('/src/production-media-offline-store.ts');
      const now = Date.parse('2026-09-11T12:00:00.000Z');
      const origins = new Set(['https://publisher.invalid']);
      const store = await openProductionMediaOfflineStore();
      const stage = async (
        packet: Awaited<ReturnType<typeof makeProductionMediaOfflinePacket>>,
        operationId: string,
      ) => {
        let step = 'prepare';
        try {
          let control = await store.prepareRecheck(operationId, (await store.snapshot()).control);
          step = 'safety';
          control = await store.commitSafety(operationId, packet.admittedSafety, 1000, control);
          step = 'save';
          control = await store.saveCandidate({ ...packet, operationId, expected: control });
          const key = control.candidateKey!;
          step = 'activate';
          control = await store.activateCandidate(key, now, origins, operationId, control);
          step = 'finish';
          return await store.finishRecheck(operationId, 'ready', 1000, control);
        } catch (error) {
          throw new Error(
            `${operationId}:${step}:${(error as { code?: string }).code ?? 'unknown'}`,
            { cause: error },
          );
        }
      };
      try {
        const a = await makeProductionMediaOfflinePacket(1, 'release-a');
        const afterA = await stage(a, 'a');
        const b = await makeProductionMediaOfflinePacket(2, 'release-b', 2, false, 1);
        const afterB = await stage(b, 'b');
        const rolled = await store.rollback(now, origins, afterB);
        const current = await store.readActive(now, origins);
        const blocked = await makeProductionMediaOfflinePacket(3, 'release-c', 3, true);
        const prepared = await store.prepareRecheck('c', rolled);
        const safety = await store.commitSafety('c', blocked.admittedSafety, 1000, prepared);
        let rollbackCode = '';
        try {
          await store.rollback(now, origins, safety);
        } catch (error) {
          rollbackCode = (error as { code: string }).code;
        }
        return {
          afterA,
          afterB,
          rolled,
          currentSequence: current?.ready.descriptor.sequence ?? null,
          safety,
          rollbackCode,
        };
      } finally {
        store.close();
      }
    }, harnessUrl);
    expect(result.afterA.safety.revision).toBe(1);
    expect(result.afterB.safety.revision).toBe(2);
    expect(result.rolled.activeKey).toBe(result.afterA.activeKey);
    expect(result.currentSequence).toBe(1);
    expect(result.safety.safety.revision).toBe(3);
    expect(result.safety.activeKey).toBeNull();
    expect(result.rollbackCode).toBe('invalid-bundle');
  });

  test('preserves genuine Ready provenance from reopened IDB through rollback and A2 consent', async ({
    page,
  }) => {
    const providerRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).hostname === 'publisher.invalid')
        providerRequests.push(request.url());
    });
    await page.goto('/');
    const result = await page.evaluate(
      async ({ contractUrl, harnessUrl, playerUrl }) => {
        const harness = await import(harnessUrl);
        const contract = await import(contractUrl);
        const media = await import('/src/production-media-offline-store.ts');
        const { createProductionMediaPlayer } = await import(playerUrl);
        const now = Date.parse('2026-09-11T12:00:00.000Z');
        const origins = new Set(['https://publisher.invalid']);
        let store = await media.openProductionMediaOfflineStore();
        const first = await harness.makeProductionMediaOfflinePacket(1, 'release-ready-a');
        const afterA = await harness.stageProductionMediaOfflinePacket(store, first, 'ready-a');
        const second = await harness.makeProductionMediaOfflinePacket(
          2,
          'release-ready-b',
          2,
          false,
          1,
          { knownSafety: first.admittedSafety },
        );
        const afterB = await harness.stageProductionMediaOfflinePacket(store, second, 'ready-b');
        const rolled = await store.rollback(now, origins, afterB);
        store.close();

        store = await media.openProductionMediaOfflineStore();
        try {
          const active = await store.readActive(now, origins);
          if (!active) throw new Error('active-ready-missing');
          let audioFactoryCalls = 0;
          let playCalls = 0;
          let assignedSrc = '';
          const audio = {
            get src() {
              return assignedSrc;
            },
            set src(value: string) {
              assignedSrc = value;
            },
            crossOrigin: null as string | null,
            preload: '' as HTMLMediaElement['preload'],
            currentTime: 0,
            duration: 1806,
            onloadedmetadata: null as HTMLMediaElement['onloadedmetadata'],
            ondurationchange: null as HTMLMediaElement['ondurationchange'],
            onerror: null as HTMLMediaElement['onerror'],
            onpause: null as HTMLMediaElement['onpause'],
            onended: null as HTMLMediaElement['onended'],
            ontimeupdate: null as HTMLMediaElement['ontimeupdate'],
            load() {},
            play() {
              playCalls += 1;
              return Promise.resolve();
            },
            pause() {},
            removeAttribute(name: string) {
              if (name === 'src') assignedSrc = '';
            },
          };
          const player = createProductionMediaPlayer({
            context: () => ({
              ready: active.ready,
              generation: `idb:${active.generation}:${active.clearEpoch}`,
            }),
            allowedOrigins: origins,
            now: () => now,
            online: () => true,
            audio: () => {
              audioFactoryCalls += 1;
              return audio;
            },
          });
          const prompt = player.prepareConsent('episode-0');
          const beforeConfirm = { audioFactoryCalls, playCalls };
          const confirmed = prompt === null ? false : player.confirmPlay(prompt);
          const afterConfirm = { audioFactoryCalls, playCalls, assignedSrc };
          player.dispose();

          const clonedReady = JSON.parse(JSON.stringify(active.ready));
          let clonedAudioCalls = 0;
          const clonedPlayer = createProductionMediaPlayer({
            context: () => ({
              ready: clonedReady,
              generation: `idb:${active.generation}:${active.clearEpoch}`,
            }),
            allowedOrigins: origins,
            now: () => now,
            online: () => true,
            audio: () => {
              clonedAudioCalls += 1;
              return audio;
            },
          });
          const clonedPrompt = clonedPlayer.prepareConsent('episode-0');
          clonedPlayer.dispose();
          return {
            rollbackReturnedToA: rolled.activeKey === afterA.activeKey,
            activeSequence: active.ready.descriptor.sequence,
            registeredReady: contract.isValidatedProductionMediaReadyV1(active.ready),
            frozen: {
              wrapper: Object.isFrozen(active),
              ready: Object.isFrozen(active.ready),
              pointer: Object.isFrozen(active.ready.pointer),
              descriptor: Object.isFrozen(active.ready.descriptor),
              documents: Object.isFrozen(active.ready.documents),
              manifest: Object.isFrozen(active.ready.documents.manifest),
              episodes: Object.isFrozen(active.ready.documents.manifest.episodes),
              episode: Object.isFrozen(active.ready.documents.manifest.episodes[0]),
              safety: Object.isFrozen(active.ready.safety),
              safetyEntries: Object.isFrozen(active.ready.safety.entries),
            },
            prompt: prompt
              ? {
                  episodeId: prompt.episode.id,
                  requiresPrompt: prompt.consent.requiresPrompt,
                  directStreamAllowed: prompt.rights.directStreamAllowed,
                }
              : null,
            beforeConfirm,
            confirmed,
            afterConfirm,
            clonedRegistered: contract.isValidatedProductionMediaReadyV1(clonedReady),
            clonedPrompt: clonedPrompt !== null,
            clonedAudioCalls,
          };
        } finally {
          store.close();
        }
      },
      { contractUrl, harnessUrl, playerUrl },
    );

    expect(result.rollbackReturnedToA).toBe(true);
    expect(result.activeSequence).toBe(1);
    expect(result.registeredReady).toBe(true);
    expect(result.frozen).toEqual({
      wrapper: true,
      ready: true,
      pointer: true,
      descriptor: true,
      documents: true,
      manifest: true,
      episodes: true,
      episode: true,
      safety: true,
      safetyEntries: true,
    });
    expect(result.prompt).toEqual({
      episodeId: 'episode-0',
      requiresPrompt: true,
      directStreamAllowed: true,
    });
    expect(result.beforeConfirm).toEqual({ audioFactoryCalls: 0, playCalls: 0 });
    expect(result.confirmed).toBe(true);
    expect(result.afterConfirm).toEqual({
      audioFactoryCalls: 1,
      playCalls: 1,
      assignedSrc: 'https://publisher.invalid/audio-0.mp3',
    });
    expect(result.clonedRegistered).toBe(false);
    expect(result.clonedPrompt).toBe(false);
    expect(result.clonedAudioCalls).toBe(0);
    expect(providerRequests).toEqual([]);
  });

  test('applies the shared 0/8/9/malformed origin boundary to activate, read and rollback', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const harness = await import(harnessUrl);
      const media = await import('/src/production-media-offline-store.ts');
      const store = await media.openProductionMediaOfflineStore();
      const now = Date.parse('2026-09-11T12:00:00.000Z');
      const validEight = () =>
        new Set([
          'https://publisher.invalid',
          ...Array.from({ length: 7 }, (_, index) => `https://extra-${index}.invalid`),
        ]);
      const invalidOrigins = () =>
        [
          ['zero', new Set<string>()],
          [
            'nine',
            new Set([
              'https://publisher.invalid',
              ...Array.from({ length: 8 }, (_, index) => `https://extra-${index}.invalid`),
            ]),
          ],
          ['malformed', new Set(['https://publisher.invalid', 'not-an-origin'])],
          [
            'eight-without-stream-origin',
            new Set(Array.from({ length: 8 }, (_, index) => `https://extra-${index}.invalid`)),
          ],
        ] as const;
      const same = (left: unknown, right: unknown) =>
        JSON.stringify(left) === JSON.stringify(right);
      const errorCode = async (pending: Promise<unknown>) => {
        try {
          await pending;
          return 'resolved';
        } catch (error) {
          return (error as { code?: string }).code ?? 'unknown';
        }
      };

      try {
        const first = await harness.makeProductionMediaOfflinePacket(1, 'release-origin-a');
        const afterA = await harness.stageProductionMediaOfflinePacket(store, first, 'origin-a');
        const second = await harness.makeProductionMediaOfflinePacket(
          2,
          'release-origin-b',
          2,
          false,
          1,
          { knownSafety: first.admittedSafety },
        );
        let candidate = await store.prepareRecheck('origin-b', afterA);
        candidate = await store.commitSafety('origin-b', second.admittedSafety, 2000, candidate);
        candidate = await store.saveCandidate({
          ...second,
          checkedAt: 2000,
          operationId: 'origin-b',
          expected: candidate,
        });
        const candidateKey = candidate.candidateKey!;

        const activateRejected = [];
        for (const [name, origins] of invalidOrigins()) {
          const before = await store.snapshot();
          const code = await errorCode(
            store.activateCandidate(candidateKey, now, origins, 'origin-b', candidate),
          );
          activateRejected.push({
            name,
            code,
            preserved: same(await store.snapshot(), before),
          });
        }

        const activatingOrigins = validEight();
        const activating = store.activateCandidate(
          candidateKey,
          now,
          activatingOrigins,
          'origin-b',
          candidate,
        );
        activatingOrigins.clear();
        let afterB = await activating;
        afterB = await store.finishRecheck('origin-b', 'ready', 2000, afterB);

        const readRejected = [];
        for (const [name, origins] of invalidOrigins()) {
          const before = await store.snapshot();
          const active = await store.readActive(now, origins);
          readRejected.push({
            name,
            ready: active !== null,
            preserved: same(await store.snapshot(), before),
          });
        }
        const readingOrigins = validEight();
        const reading = store.readActive(now, readingOrigins);
        readingOrigins.clear();
        const active = await reading;

        const rollbackRejected = [];
        for (const [name, origins] of invalidOrigins()) {
          const before = await store.snapshot();
          const code = await errorCode(store.rollback(now, origins, afterB));
          rollbackRejected.push({
            name,
            code,
            preserved: same(await store.snapshot(), before),
          });
        }
        const rollbackOrigins = validEight();
        const rollingBack = store.rollback(now, rollbackOrigins, afterB);
        rollbackOrigins.clear();
        const rolledBack = await rollingBack;
        return {
          activateRejected,
          activatedSequence: active?.ready.descriptor.sequence ?? null,
          readRejected,
          rollbackRejected,
          rolledBackToFirst: rolledBack.activeKey === afterA.activeKey,
          final: await store.snapshot(),
        };
      } finally {
        store.close();
      }
    }, harnessUrl);

    const names = ['zero', 'nine', 'malformed', 'eight-without-stream-origin'];
    expect(result.activateRejected).toEqual(
      names.map((name) => ({ name, code: 'invalid-bundle', preserved: true })),
    );
    expect(result.activatedSequence).toBe(2);
    expect(result.readRejected).toEqual(
      names.map((name) => ({ name, ready: false, preserved: true })),
    );
    expect(result.rollbackRejected).toEqual(
      names.map((name) => ({ name, code: 'invalid-bundle', preserved: true })),
    );
    expect(result.rolledBackToFirst).toBe(true);
    expect(result.final.control.activeKey).toBe(result.final.bundles[0]?.key);
    expect(result.final.bundles).toHaveLength(2);
  });

  test('keeps provider history while current policy removal rejects activate read and rollback byte-identically', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(
      async ({ harnessUrl, playerUrl }) => {
        const harness = await import(harnessUrl);
        const media = await import('/src/production-media-offline-store.ts');
        const playerModule = await import(playerUrl);
        const store = await media.openProductionMediaOfflineStore();
        const now = Date.parse('2026-09-11T12:00:00.000Z');
        const provider = {
          recipientOrigin: 'https://dn721204.ca.archive.org',
          privacyNoticeUrl: 'https://archive.org/about/terms',
        };
        const origins = new Set([provider.recipientOrigin]);
        const policy = {
          kind: 'production-media-provider-policy-v1' as const,
          relationships: [provider],
        };
        const empty = {
          kind: 'production-media-provider-policy-v1' as const,
          relationships: [],
        };
        const raw = () =>
          harness.readProductionMediaOfflineRaw(harness.productionMediaOfflineDatabaseNames.mobile);
        const exact = (value: unknown) => JSON.stringify(value);
        const errorCode = async (pending: Promise<unknown>) => {
          try {
            await pending;
            return 'resolved';
          } catch (error) {
            return (error as { code?: string }).code ?? 'unknown';
          }
        };
        try {
          const first = await harness.makeProductionMediaOfflinePacket(
            1,
            'provider-a',
            1,
            false,
            1,
            {
              provider,
            },
          );
          const afterA = await harness.stageProductionMediaOfflinePacket(
            store,
            first,
            'provider-a',
            now,
            { allowedOrigins: origins, providerPolicy: policy },
          );
          const second = await harness.makeProductionMediaOfflinePacket(
            2,
            'provider-b',
            2,
            false,
            1,
            { knownSafety: first.admittedSafety, provider },
          );
          let control = await harness.stageProductionMediaOfflinePacket(
            store,
            second,
            'provider-b',
            now,
            { allowedOrigins: origins, providerPolicy: policy },
          );

          control = await store.prepareRecheck('policy-free-retention', control);
          control = await store.commitSafety(
            'policy-free-retention',
            second.admittedSafety,
            3000,
            control,
          );
          control = await store.finishRecheck('policy-free-retention', 'unverified', 3000, control);
          const retained = await store.snapshot();

          const mutable = structuredClone(policy);
          const reading = store.readActive(now, origins, mutable);
          mutable.relationships[0]!.privacyNoticeUrl = 'https://mutated.invalid/';
          const current = await reading;
          let audioFactoryCalls = 0;
          const player = playerModule.createProductionMediaPlayer({
            context: () =>
              current
                ? {
                    ready: current.ready,
                    generation: `provider:${current.generation}:${current.clearEpoch}`,
                  }
                : null,
            allowedOrigins: origins,
            now: () => now,
            online: () => true,
            audio: () => {
              audioFactoryCalls += 1;
              throw new Error('prompt must not request provider media');
            },
          });
          const prompt = player.prepareConsent('episode-0');
          player.dispose();

          const rejectedReads = [];
          const invalidPolicies = [
            ['removed', empty],
            ['unknown', { ...policy, unknown: true }],
            [
              'wildcard',
              {
                ...policy,
                relationships: [
                  {
                    recipientOrigin: 'https://*.archive.org',
                    privacyNoticeUrl: provider.privacyNoticeUrl,
                  },
                ],
              },
            ],
            [
              'nine',
              {
                ...policy,
                relationships: Array.from({ length: 9 }, (_, index) => ({
                  recipientOrigin: provider.recipientOrigin,
                  privacyNoticeUrl: `https://privacy-${index}.invalid/terms`,
                })),
              },
            ],
          ] as const;
          for (const [name, invalid] of invalidPolicies) {
            const before = exact(await raw());
            const ready = await store.readActive(now, origins, invalid as never);
            rejectedReads.push({
              name,
              ready: ready !== null,
              preserved: exact(await raw()) === before,
            });
          }

          const third = await harness.makeProductionMediaOfflinePacket(
            3,
            'provider-c',
            3,
            false,
            1,
            {
              knownSafety: second.admittedSafety,
              provider,
            },
          );
          control = await store.prepareRecheck('provider-c', control);
          control = await store.commitSafety('provider-c', third.admittedSafety, 4000, control);
          control = await store.saveCandidate({
            ...third,
            operationId: 'provider-c',
            expected: control,
          });
          const beforeActivate = exact(await raw());
          const activateCode = await errorCode(
            store.activateCandidate(
              control.candidateKey!,
              now,
              origins,
              'provider-c',
              control,
              empty,
            ),
          );
          const activatePreserved = exact(await raw()) === beforeActivate;
          control = await store.finishRecheck('provider-c', 'unverified', 4000, control);
          const beforeRollback = exact(await raw());
          const rollbackCode = await errorCode(store.rollback(now, origins, control, empty));
          const rollbackPreserved = exact(await raw()) === beforeRollback;
          return {
            afterAKey: afterA.activeKey,
            retainedBundles: retained.bundles.length,
            currentSequence: current?.ready.pointer.sequence ?? null,
            currentNotice: current?.ready.documents.consent.entries[0]?.privacyNoticeUrl ?? null,
            prompt: prompt
              ? {
                  recipientOrigin: prompt.consent.recipientOrigin,
                  privacyNoticeUrl: prompt.consent.privacyNoticeUrl,
                }
              : null,
            audioFactoryCalls,
            rejectedReads,
            activateCode,
            activatePreserved,
            rollbackCode,
            rollbackPreserved,
            final: await store.snapshot(),
          };
        } finally {
          store.close();
        }
      },
      { harnessUrl, playerUrl },
    );

    expect(result.retainedBundles).toBe(2);
    expect(result.currentSequence).toBe(2);
    expect(result.currentNotice).toBe('https://archive.org/about/terms');
    expect(result.prompt).toEqual({
      recipientOrigin: 'https://dn721204.ca.archive.org',
      privacyNoticeUrl: 'https://archive.org/about/terms',
    });
    expect(result.audioFactoryCalls).toBe(0);
    expect(result.rejectedReads).toEqual(
      ['removed', 'unknown', 'wildcard', 'nine'].map((name) => ({
        name,
        ready: false,
        preserved: true,
      })),
    );
    expect(result.activateCode).toBe('invalid-bundle');
    expect(result.activatePreserved).toBe(true);
    expect(result.rollbackCode).toBe('invalid-bundle');
    expect(result.rollbackPreserved).toBe(true);
    expect(result.final.control.activeKey).not.toBe(result.afterAKey);
    expect(result.final.bundles).toHaveLength(3);
  });

  test('persists safety before payload, across restart and clear without lowering the ledger', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const harness = await import(harnessUrl);
      const media = await import('/src/production-media-offline-store.ts');
      const origins = new Set(['https://publisher.invalid']);
      const now = Date.parse('2026-09-11T12:00:00.000Z');
      let store = await media.openProductionMediaOfflineStore();
      const first = await harness.makeProductionMediaOfflinePacket(1, 'release-a');
      const afterReady = await harness.stageProductionMediaOfflinePacket(store, first, 'ready-a');
      const second = await harness.makeProductionMediaOfflinePacket(2, 'release-b', 2, false, 1, {
        knownSafety: first.admittedSafety,
      });
      let control = await store.prepareRecheck('failed-b', afterReady);
      control = await store.commitSafety('failed-b', second.admittedSafety, 2000, control);
      const safetyReadbackBeforePayload = await store.snapshot();
      control = await store.finishRecheck(
        'failed-b',
        'safety-verified-payload-failed',
        2000,
        control,
      );
      const activeAfterFailure = await store.readActive(now, origins);
      store.close();
      store = await media.openProductionMediaOfflineStore();
      const afterRestart = await store.snapshot();
      const lowerPrepared = await store.prepareRecheck('lower-safety', afterRestart.control);
      const beforeLower = await store.snapshot();
      let lowerCode = '';
      try {
        await store.commitSafety('lower-safety', first.admittedSafety, 2001, lowerPrepared);
      } catch (error) {
        lowerCode = (error as { code: string }).code;
      }
      const afterLower = await store.snapshot();
      const afterClear = await store.clear(afterLower.control);
      const final = await store.snapshot();
      store.close();
      return {
        afterReady,
        safetyReadbackBeforePayload,
        afterFailure: control,
        activeAfterFailure: activeAfterFailure?.ready.descriptor.sequence ?? null,
        afterRestart,
        lowerCode,
        beforeLower,
        afterLower,
        afterClear,
        final,
      };
    }, harnessUrl);
    expect(result.safetyReadbackBeforePayload.control.safety.revision).toBe(2);
    expect(result.afterFailure.safety.revision).toBe(2);
    expect(result.activeAfterFailure).toBe(1);
    expect(result.afterRestart.control.safety).toEqual(result.afterFailure.safety);
    expect(result.lowerCode).toBe('safety-conflict');
    expect(result.afterLower).toEqual(result.beforeLower);
    expect(result.afterClear.safety).toEqual(result.afterFailure.safety);
    expect(result.afterClear.highestAcceptedSequence).toBe(1);
    expect(result.afterClear.acceptedIdentities).toEqual(result.afterReady.acceptedIdentities);
    expect(result.afterClear.clearEpoch).toBe(result.afterRestart.control.clearEpoch + 1);
    expect(result.final.bundles).toEqual([]);
  });

  test('blocks rollback at expiry and removes releases below a later safety floor', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const harness = await import(harnessUrl);
      const media = await import('/src/production-media-offline-store.ts');
      const store = await media.openProductionMediaOfflineStore();
      const origins = new Set(['https://publisher.invalid']);
      const a = await harness.makeProductionMediaOfflinePacket(1, 'release-a');
      const afterA = await harness.stageProductionMediaOfflinePacket(store, a, 'a');
      const b = await harness.makeProductionMediaOfflinePacket(2, 'release-b', 2, false, 1, {
        knownSafety: a.admittedSafety,
      });
      const afterB = await harness.stageProductionMediaOfflinePacket(store, b, 'b');
      let expiryCode = '';
      try {
        await store.rollback(Date.parse('2026-09-12T12:00:00.000Z'), origins, afterB);
      } catch (error) {
        expiryCode = (error as { code: string }).code;
      }
      const floor = await harness.makeProductionMediaOfflinePacket(3, 'release-c', 3, false, 2, {
        knownSafety: b.admittedSafety,
      });
      let control = await store.prepareRecheck('floor', afterB);
      control = await store.commitSafety('floor', floor.admittedSafety, 3000, control);
      const snapshot = await store.snapshot();
      store.close();
      return { afterA, afterB, expiryCode, control, snapshot };
    }, harnessUrl);
    expect(result.expiryCode).toBe('invalid-bundle');
    expect(result.control.safety.floor).toBe(2);
    expect(result.control.previousKey).toBeNull();
    expect(result.control.activeKey).toBe(result.afterB.activeKey);
    expect(result.snapshot.bundles).toHaveLength(1);
    expect(result.snapshot.bundles[0]!.key).toBe(result.afterB.activeKey);
  });
});

test.describe('production media offline corruption protection', () => {
  test('rejects hash, identity, slot, control and schema corruption without changing raw state', async ({
    page,
  }) => {
    await page.goto('/');
    const results = await page.evaluate(async (harnessUrl) => {
      const harness = await import(harnessUrl);
      const media = await import('/src/production-media-offline-store.ts');
      const databaseName = harness.productionMediaOfflineDatabaseNames.mobile;
      const packet = await harness.makeProductionMediaOfflinePacket(1, 'release-a');
      const store = await media.openProductionMediaOfflineStore();
      await harness.stageProductionMediaOfflinePacket(store, packet, 'baseline');
      store.close();
      const baseline = await harness.readProductionMediaOfflineRaw(databaseName);
      const baselineControl = structuredClone(
        baseline.stores.find((entry) => entry.name === 'mediaControl')!.values[0],
      ) as Record<string, unknown>;
      const baselineBundle = structuredClone(
        baseline.stores.find((entry) => entry.name === 'mediaBundles')!.values[0],
      ) as Record<string, unknown>;
      const scenarios: {
        name: string;
        controlRows: { key: IDBValidKey; value: unknown }[];
        bundleRows: unknown[];
        options?: Record<string, boolean | number>;
      }[] = [];
      const hashBundle = structuredClone(baselineBundle) as {
        documentsRaw: Record<string, string>;
      };
      hashBundle.documentsRaw.admission = hashBundle.documentsRaw.admission.replace(
        'WRN editorial',
        'WRN editoriab',
      );
      scenarios.push({
        name: 'historical-hash',
        controlRows: [{ key: 'control', value: baselineControl }],
        bundleRows: [hashBundle],
      });
      scenarios.push({
        name: 'bundle-byte-length',
        controlRows: [{ key: 'control', value: baselineControl }],
        bundleRows: [
          {
            ...structuredClone(baselineBundle),
            byteLength: (baselineBundle.byteLength as number) + 1,
          },
        ],
      });
      scenarios.push({
        name: 'bundle-unknown-format',
        controlRows: [{ key: 'control', value: baselineControl }],
        bundleRows: [{ ...structuredClone(baselineBundle), format: 'wrn.media.future' }],
      });
      const identityControl = structuredClone(baselineControl) as {
        acceptedIdentities: { descriptorSha256: string }[];
      };
      identityControl.acceptedIdentities[0]!.descriptorSha256 = 'f'.repeat(64);
      scenarios.push({
        name: 'identity-link',
        controlRows: [{ key: 'control', value: identityControl }],
        bundleRows: [baselineBundle],
      });
      const danglingControl = structuredClone(baselineControl) as { activeKey: string };
      danglingControl.activeKey = 'e'.repeat(64);
      scenarios.push({
        name: 'dangling-slot',
        controlRows: [{ key: 'control', value: danglingControl }],
        bundleRows: [baselineBundle],
      });
      const duplicateSlotControl = structuredClone(baselineControl) as {
        activeKey: string;
        previousKey: string;
      };
      duplicateSlotControl.previousKey = duplicateSlotControl.activeKey;
      scenarios.push({
        name: 'duplicate-slot',
        controlRows: [{ key: 'control', value: duplicateSlotControl }],
        bundleRows: [baselineBundle],
      });
      const orphanControl = structuredClone(baselineControl) as {
        activeKey: null;
        previousKey: null;
        candidateKey: null;
      };
      orphanControl.activeKey = null;
      orphanControl.previousKey = null;
      orphanControl.candidateKey = null;
      scenarios.push({
        name: 'orphan-bundle',
        controlRows: [{ key: 'control', value: orphanControl }],
        bundleRows: [baselineBundle],
      });
      scenarios.push({ name: 'missing-control', controlRows: [], bundleRows: [] });
      scenarios.push({
        name: 'unknown-control-format',
        controlRows: [
          { key: 'control', value: { ...baselineControl, format: 'wrn.media.future' } },
        ],
        bundleRows: [baselineBundle],
      });
      scenarios.push({
        name: 'extra-control',
        controlRows: [
          { key: 'control', value: baselineControl },
          { key: 'extra', value: baselineControl },
        ],
        bundleRows: [baselineBundle],
      });
      for (const [name, options] of [
        ['extra-store', { extraStore: true }],
        ['bundle-index', { bundleIndex: true }],
        ['control-index', { controlIndex: true }],
        ['missing-bundle-store', { omitBundlesStore: true }],
        ['missing-control-store', { omitControlStore: true }],
        ['future-version', { version: 2 }],
      ] as const)
        scenarios.push({
          name,
          controlRows: [{ key: 'control', value: baselineControl }],
          bundleRows: [baselineBundle],
          options,
        });
      const outcomes: { name: string; code: string; stable: boolean }[] = [];
      for (const scenario of scenarios) {
        await harness.seedProductionMediaOfflineDatabase(databaseName, {
          ...scenario.options,
          controlRows: scenario.controlRows,
          bundleRows: scenario.bundleRows,
        });
        const before = JSON.stringify(await harness.readProductionMediaOfflineRaw(databaseName));
        let opened: Awaited<ReturnType<typeof media.openProductionMediaOfflineStore>> | null = null;
        let code = '';
        try {
          opened = await media.openProductionMediaOfflineStore();
          await opened.snapshot();
        } catch (error) {
          code = (error as { code?: string }).code ?? 'unknown';
        } finally {
          opened?.close();
        }
        const after = JSON.stringify(await harness.readProductionMediaOfflineRaw(databaseName));
        outcomes.push({ name: scenario.name, code, stable: before === after });
      }
      return outcomes;
    }, harnessUrl);
    expect(results).toHaveLength(16);
    expect(results.map((entry) => entry.name)).toEqual([
      'historical-hash',
      'bundle-byte-length',
      'bundle-unknown-format',
      'identity-link',
      'dangling-slot',
      'duplicate-slot',
      'orphan-bundle',
      'missing-control',
      'unknown-control-format',
      'extra-control',
      'extra-store',
      'bundle-index',
      'control-index',
      'missing-bundle-store',
      'missing-control-store',
      'future-version',
    ]);
    expect(results.every((entry) => entry.code === 'incompatible-storage')).toBe(true);
    expect(results.every((entry) => entry.stable)).toBe(true);
  });

  test('rejects exact cap-plus-one raw states and preserves every byte', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const harness = await import(harnessUrl);
      const media = await import('/src/production-media-offline-store.ts');
      const contract = await harness.loadProductionMediaOfflineContract();
      const databaseName = harness.productionMediaOfflineDatabaseNames.mobile;
      const sha = (value: number) => value.toString(16).padStart(64, '0');
      const sizeBundle = (target: number, key: string, sequence: number) => {
        const basis = {
          format: contract.productionMediaOfflineFormatV1,
          key,
          byteLength: 0,
          checkedAt: 1,
          admittedSafety: { revision: 0, floor: 0, revocationSha256: null, entries: [] },
          pointerRaw: '{}',
          descriptorRaw: '{}',
          documentsRaw: {
            manifest: '',
            admission: '{}',
            rights: '{}',
            consent: '{}',
            revocation: '{}',
          },
        };
        let padding = Math.max(0, target - contract.productionMediaOfflineFixedBytes(basis)!);
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const candidate = {
            ...basis,
            documentsRaw: { ...basis.documentsRaw, manifest: 'x'.repeat(padding) },
          };
          const bytes = contract.productionMediaOfflineFixedBytes(candidate)!;
          if (bytes === target) return { ...candidate, byteLength: bytes, sequence };
          padding += target - bytes;
        }
        throw new Error(`cannot-size-bundle-${target}`);
      };
      const sizeControl = (target: number) => {
        const basis = { ...contract.createEmptyProductionMediaOfflineControlV1(), padding: '' };
        let padding = Math.max(0, target - contract.productionMediaOfflineUtf8Bytes(basis));
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const candidate = { ...basis, padding: 'x'.repeat(padding) };
          const bytes = contract.productionMediaOfflineUtf8Bytes(candidate);
          if (bytes === target) return candidate;
          padding += target - bytes;
        }
        throw new Error(`cannot-size-control-${target}`);
      };
      const cases = [
        {
          name: 'bundle-plus-one',
          control: contract.createEmptyProductionMediaOfflineControlV1(),
          bundles: [sizeBundle(contract.productionMediaOfflineLimitsV1.bundleBytes + 1, sha(1), 1)],
        },
        {
          name: 'control-plus-one',
          control: sizeControl(contract.productionMediaOfflineLimitsV1.controlBytes + 1),
          bundles: [],
        },
        {
          name: 'total-plus-one',
          control: sizeControl(contract.productionMediaOfflineLimitsV1.controlBytes + 1),
          bundles: [
            sizeBundle(contract.productionMediaOfflineLimitsV1.bundleBytes, sha(1), 1),
            sizeBundle(contract.productionMediaOfflineLimitsV1.bundleBytes, sha(2), 2),
            sizeBundle(contract.productionMediaOfflineLimitsV1.bundleBytes, sha(3), 3),
          ],
        },
      ];
      const outcomes: { name: string; code: string; stable: boolean; bytes: number }[] = [];
      for (const item of cases) {
        await harness.seedProductionMediaOfflineDatabase(databaseName, {
          controlRows: [{ key: 'control', value: item.control }],
          bundleRows: item.bundles,
        });
        const raw = await harness.readProductionMediaOfflineRaw(databaseName);
        const before = JSON.stringify(raw);
        const controlValue = raw.stores.find((entry) => entry.name === 'mediaControl')!.values[0];
        const bundleValues = raw.stores.find((entry) => entry.name === 'mediaBundles')!.values as {
          byteLength: number;
        }[];
        const bytes =
          contract.productionMediaOfflineUtf8Bytes(controlValue) +
          bundleValues.reduce((total, bundle) => total + bundle.byteLength, 0);
        let opened: Awaited<ReturnType<typeof media.openProductionMediaOfflineStore>> | null = null;
        let code = '';
        try {
          opened = await media.openProductionMediaOfflineStore();
          await opened.snapshot();
        } catch (error) {
          code = (error as { code?: string }).code ?? 'unknown';
        } finally {
          opened?.close();
        }
        outcomes.push({
          name: item.name,
          code,
          stable:
            before === JSON.stringify(await harness.readProductionMediaOfflineRaw(databaseName)),
          bytes,
        });
      }
      return outcomes;
    }, harnessUrl);
    expect(result.map((entry) => entry.code)).toEqual([
      'incompatible-storage',
      'incompatible-storage',
      'incompatible-storage',
    ]);
    expect(result.every((entry) => entry.stable)).toBe(true);
    expect(result[0]!.bytes).toBeGreaterThan(1_048_576);
    expect(result[1]!.bytes).toBe(393_217);
    expect(result[2]!.bytes).toBe(3_538_945);
  });

  test('rejects a cyclic stored bundle without repairing or deleting it', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const harness = await import(harnessUrl);
      const media = await import('/src/production-media-offline-store.ts');
      const contract = await harness.loadProductionMediaOfflineContract();
      const databaseName = harness.productionMediaOfflineDatabaseNames.mobile;
      const cyclic = {
        format: contract.productionMediaOfflineFormatV1,
        key: 'a'.repeat(64),
        byteLength: 1,
        checkedAt: 1,
        admittedSafety: { revision: 0, floor: 0, revocationSha256: null, entries: [] },
        pointerRaw: '{}',
        descriptorRaw: '{}',
        documentsRaw: {
          manifest: '{}',
          admission: '{}',
          rights: '{}',
          consent: '{}',
          revocation: '{}',
        },
        self: null as unknown,
      };
      cyclic.self = cyclic;
      await harness.seedProductionMediaOfflineDatabase(databaseName, {
        controlRows: [
          {
            key: 'control',
            value: {
              ...contract.createEmptyProductionMediaOfflineControlV1(),
              activeKey: cyclic.key,
              highestAcceptedSequence: 1,
              acceptedIdentities: [
                {
                  releaseRevision: 'release-a',
                  sequence: 1,
                  descriptorSha256: 'b'.repeat(64),
                  key: cyclic.key,
                },
              ],
            },
          },
        ],
        bundleRows: [cyclic],
      });
      let store: Awaited<ReturnType<typeof media.openProductionMediaOfflineStore>> | null = null;
      let code = '';
      try {
        store = await media.openProductionMediaOfflineStore();
        await store.snapshot();
      } catch (error) {
        code = (error as { code?: string }).code ?? 'unknown';
      } finally {
        store?.close();
      }
      const raw = await harness.readProductionMediaOfflineRaw(databaseName);
      const stored = raw.stores.find((entry) => entry.name === 'mediaBundles')!.values[0] as {
        self: unknown;
        key: string;
      };
      return {
        code,
        rowCount: raw.stores.find((entry) => entry.name === 'mediaBundles')!.values.length,
        cyclePreserved: stored.self === stored,
        key: stored.key,
      };
    }, harnessUrl);
    expect(result).toEqual({
      code: 'incompatible-storage',
      rowCount: 1,
      cyclePreserved: true,
      key: 'a'.repeat(64),
    });
  });
});

test.describe('production media offline race and failure durability', () => {
  test('snapshots caller input and origins across hashing awaits', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const harness = await import(harnessUrl);
      const media = await import('/src/production-media-offline-store.ts');
      const packet = await harness.makeProductionMediaOfflinePacket(1, 'release-a');
      const store = await media.openProductionMediaOfflineStore();
      let control = await store.prepareRecheck('snapshot', (await store.snapshot()).control);
      control = await store.commitSafety('snapshot', packet.admittedSafety, 1000, control);
      const mutable = structuredClone({ ...packet, operationId: 'snapshot', expected: control });
      const originalDigest = crypto.subtle.digest.bind(crypto.subtle);
      let releaseDigest!: () => void;
      let enteredDigest!: () => void;
      const entered = new Promise<void>((resolve) => (enteredDigest = resolve));
      const gate = new Promise<void>((resolve) => (releaseDigest = resolve));
      let held = false;
      Object.defineProperty(crypto.subtle, 'digest', {
        configurable: true,
        value: async (...args: Parameters<SubtleCrypto['digest']>) => {
          if (!held) {
            held = true;
            enteredDigest();
            await gate;
          }
          return originalDigest(...args);
        },
      });
      const saving = store.saveCandidate(mutable);
      await entered;
      mutable.pointerRaw = '{}';
      mutable.descriptorRaw = '{}';
      mutable.documentsRaw.manifest = '{}';
      mutable.admittedSafety.revision = 99;
      mutable.checkedAt = 9999;
      mutable.operationId = 'mutated';
      mutable.expected.generation = 9999;
      releaseDigest();
      control = await saving;
      Object.defineProperty(crypto.subtle, 'digest', {
        configurable: true,
        value: originalDigest,
      });
      const mutableOrigins = new Set(['https://publisher.invalid']);
      const key = control.candidateKey!;
      const activating = store.activateCandidate(
        key,
        Date.parse('2026-09-11T12:00:00.000Z'),
        mutableOrigins,
        'snapshot',
        control,
      );
      mutableOrigins.clear();
      control = await activating;
      const active = await store.readActive(
        Date.parse('2026-09-11T12:00:00.000Z'),
        new Set(['https://publisher.invalid']),
      );
      control = await store.finishRecheck('snapshot', 'ready', 1000, control);
      const second = await harness.makeProductionMediaOfflinePacket(2, 'release-b', 2, false, 1, {
        knownSafety: packet.admittedSafety,
      });
      control = await store.prepareRecheck('incoming', control);
      const mutableSafety = structuredClone(second.admittedSafety);
      let releaseSafetyDigest!: () => void;
      let enteredSafetyDigest!: () => void;
      const safetyEntered = new Promise<void>((resolve) => (enteredSafetyDigest = resolve));
      const safetyGate = new Promise<void>((resolve) => (releaseSafetyDigest = resolve));
      let safetyHeld = false;
      Object.defineProperty(crypto.subtle, 'digest', {
        configurable: true,
        value: async (...args: Parameters<SubtleCrypto['digest']>) => {
          if (!safetyHeld) {
            safetyHeld = true;
            enteredSafetyDigest();
            await safetyGate;
          }
          return originalDigest(...args);
        },
      });
      const committing = store.commitSafety('incoming', mutableSafety, 2000, control);
      await safetyEntered;
      mutableSafety.revision = 99;
      mutableSafety.floor = 99;
      mutableSafety.entries.push({
        targetType: 'episode',
        targetId: 'episode-0',
        status: 'blocked',
      });
      releaseSafetyDigest();
      control = await committing;
      Object.defineProperty(crypto.subtle, 'digest', {
        configurable: true,
        value: originalDigest,
      });
      const raw = await harness.readProductionMediaOfflineRaw(
        harness.productionMediaOfflineDatabaseNames.mobile,
      );
      store.close();
      const storedBundle = raw.stores.find((entry) => entry.name === 'mediaBundles')!.values[0] as {
        checkedAt: number;
        pointerRaw: string;
      };
      return {
        activeSequence: active?.ready.descriptor.sequence ?? null,
        storedCheckedAt: storedBundle.checkedAt,
        storedPointerRaw: storedBundle.pointerRaw,
        expectedPointerRaw: packet.pointerRaw,
        committedSafetyRevision: control.safety.revision,
        committedSafetyEntries: control.safety.entries.length,
      };
    }, harnessUrl);
    expect(result.activeSequence).toBe(1);
    expect(result.storedCheckedAt).toBe(1000);
    expect(result.storedPointerRaw).toBe(result.expectedPointerRaw);
    expect(result.committedSafetyRevision).toBe(2);
    expect(result.committedSafetyEntries).toBe(0);
  });

  test('prevents a late hash from writing after clear, concurrent state change, abort or close', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const harness = await import(harnessUrl);
      const media = await import('/src/production-media-offline-store.ts');
      const databaseName = harness.productionMediaOfflineDatabaseNames.mobile;
      const packet = await harness.makeProductionMediaOfflinePacket(1, 'release-a');
      const run = async (kind: 'clear' | 'generation' | 'abort' | 'close' | 'versionchange') => {
        await harness.deleteProductionMediaOfflineDatabase(databaseName);
        const store = await media.openProductionMediaOfflineStore();
        let control = await store.prepareRecheck(kind, (await store.snapshot()).control);
        control = await store.commitSafety(kind, packet.admittedSafety, 1000, control);
        const originalDigest = crypto.subtle.digest.bind(crypto.subtle);
        let releaseDigest!: () => void;
        let enteredDigest!: () => void;
        const entered = new Promise<void>((resolve) => (enteredDigest = resolve));
        const gate = new Promise<void>((resolve) => (releaseDigest = resolve));
        let held = false;
        Object.defineProperty(crypto.subtle, 'digest', {
          configurable: true,
          value: async (...args: Parameters<SubtleCrypto['digest']>) => {
            if (!held) {
              held = true;
              enteredDigest();
              await gate;
            }
            return originalDigest(...args);
          },
        });
        const aborter = new AbortController();
        const saving = store.saveCandidate(
          { ...packet, operationId: kind, expected: control },
          aborter.signal,
        );
        await entered;
        if (kind === 'clear' || kind === 'generation') {
          const other = await media.openProductionMediaOfflineStore();
          if (kind === 'clear') await other.clear(control);
          else await other.prepareRecheck('new-generation', control);
          other.close();
        } else if (kind === 'abort') aborter.abort();
        else if (kind === 'close') store.close();
        else {
          await new Promise<void>((resolve, reject) => {
            const upgrade = indexedDB.open(databaseName, 2);
            upgrade.onupgradeneeded = () => upgrade.transaction?.abort();
            upgrade.onsuccess = () => {
              upgrade.result.close();
              resolve();
            };
            upgrade.onerror = () => resolve();
            upgrade.onblocked = () => reject(new Error('versionchange-blocked'));
          });
        }
        releaseDigest();
        let code = '';
        try {
          await saving;
        } catch (error) {
          code = (error as { code?: string }).code ?? 'unknown';
        } finally {
          Object.defineProperty(crypto.subtle, 'digest', {
            configurable: true,
            value: originalDigest,
          });
          store.close();
        }
        const raw = await harness.readProductionMediaOfflineRaw(databaseName);
        const bundles = raw.stores.find((entry) => entry.name === 'mediaBundles')!.values;
        const storedControl = raw.stores.find((entry) => entry.name === 'mediaControl')!
          .values[0] as {
          generation: number;
          clearEpoch: number;
        };
        return { kind, code, bundles: bundles.length, control: storedControl };
      };
      return [
        await run('clear'),
        await run('generation'),
        await run('abort'),
        await run('close'),
        await run('versionchange'),
      ];
    }, harnessUrl);
    expect(result.map((entry) => entry.bundles)).toEqual([0, 0, 0, 0, 0]);
    expect(result[0]!.code).toBe('stale-operation');
    expect(result[0]!.control.clearEpoch).toBe(1);
    expect(result[1]!.code).toBe('stale-operation');
    expect(result[2]!.code).toBe('aborted');
    expect(result[3]!.code).toBe('incompatible-storage');
    expect(result[4]!.code).toBe('incompatible-storage');
  });

  test('detects same-generation raw changes in the precommit readback', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const harness = await import(harnessUrl);
      const media = await import('/src/production-media-offline-store.ts');
      const databaseName = harness.productionMediaOfflineDatabaseNames.mobile;
      const packet = await harness.makeProductionMediaOfflinePacket(1, 'release-a');
      const store = await media.openProductionMediaOfflineStore();
      let control = await store.prepareRecheck('precommit', (await store.snapshot()).control);
      control = await store.commitSafety('precommit', packet.admittedSafety, 1000, control);
      const originalDigest = crypto.subtle.digest.bind(crypto.subtle);
      let releaseDigest!: () => void;
      let enteredDigest!: () => void;
      const entered = new Promise<void>((resolve) => (enteredDigest = resolve));
      const gate = new Promise<void>((resolve) => (releaseDigest = resolve));
      let held = false;
      Object.defineProperty(crypto.subtle, 'digest', {
        configurable: true,
        value: async (...args: Parameters<SubtleCrypto['digest']>) => {
          if (!held) {
            held = true;
            enteredDigest();
            await gate;
          }
          return originalDigest(...args);
        },
      });
      const saving = store.saveCandidate({
        ...packet,
        operationId: 'precommit',
        expected: control,
      });
      await entered;
      const raw = await harness.readProductionMediaOfflineRaw(databaseName);
      const storedControl = structuredClone(
        raw.stores.find((entry) => entry.name === 'mediaControl')!.values[0],
      ) as { lastObservedAt: number | null };
      storedControl.lastObservedAt = 1001;
      await harness.replaceProductionMediaOfflineRows(
        databaseName,
        [{ key: 'control', value: storedControl }],
        [],
      );
      releaseDigest();
      let code = '';
      try {
        await saving;
      } catch (error) {
        code = (error as { code?: string }).code ?? 'unknown';
      } finally {
        Object.defineProperty(crypto.subtle, 'digest', {
          configurable: true,
          value: originalDigest,
        });
        store.close();
      }
      const after = await harness.readProductionMediaOfflineRaw(databaseName);
      const finalControl = after.stores.find((entry) => entry.name === 'mediaControl')!
        .values[0] as {
        lastObservedAt: number | null;
      };
      return {
        code,
        bundles: after.stores.find((entry) => entry.name === 'mediaBundles')!.values.length,
        observedAt: finalControl.lastObservedAt,
      };
    }, harnessUrl);
    expect(result).toEqual({ code: 'stale-operation', bundles: 0, observedAt: 1001 });
  });

  test('maps quota abort atomically and refuses success when postcommit readback fails', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const media = await import('/src/production-media-offline-store.ts');
      const store = await media.openProductionMediaOfflineStore();
      const initial = await store.snapshot();
      const originalPut = IDBObjectStore.prototype.put;
      let injectQuota = true;
      IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
        if (injectQuota && this.name === 'mediaControl') {
          injectQuota = false;
          throw new DOMException('injected', 'QuotaExceededError');
        }
        return originalPut.apply(this, args);
      };
      let quotaCode = '';
      try {
        await store.prepareRecheck('quota', initial.control);
      } catch (error) {
        quotaCode = (error as { code?: string }).code ?? 'unknown';
      } finally {
        IDBObjectStore.prototype.put = originalPut;
      }
      const afterQuota = await store.snapshot();
      const originalTransaction = IDBDatabase.prototype.transaction;
      let transactions = 0;
      IDBDatabase.prototype.transaction = function (
        ...args: Parameters<IDBDatabase['transaction']>
      ) {
        transactions += 1;
        if (transactions === 3) throw new DOMException('injected', 'InvalidStateError');
        return originalTransaction.apply(this, args);
      };
      let readbackCode = '';
      try {
        await store.prepareRecheck('readback', afterQuota.control);
      } catch (error) {
        readbackCode = (error as { code?: string }).code ?? 'unknown';
      } finally {
        IDBDatabase.prototype.transaction = originalTransaction;
      }
      const durable = await store.snapshot();
      store.close();
      return { initial, quotaCode, afterQuota, readbackCode, durable };
    });
    expect(result.quotaCode).toBe('quota-or-write-failure');
    expect(result.afterQuota).toEqual(result.initial);
    expect(result.readbackCode).toBe('incompatible-storage');
    expect(result.durable.control.generation).toBe(result.initial.control.generation + 1);
    expect(result.durable.control.pendingRecheck?.operationId).toBe('readback');
  });
});
