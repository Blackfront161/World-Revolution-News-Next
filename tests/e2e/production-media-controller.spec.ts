import { expect, test } from '@playwright/test';
import { productionMediaControllerHarness } from './production-media-controller-harness';

test('A7 controller defaults preserve a blank browser profile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844', 'one isolated browser proof');
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const erase = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    await Promise.all(Object.values(names).map(erase));
    const mobile = await import('/src/production-media-controller.ts');
    const controller = mobile.createMobileProductionMediaController({});
    await controller.recheck();
    const state = controller.getState();
    controller.cancelConsent();
    controller.dispose();
    return {
      phase: state.phase,
      reason: state.reason,
      active: state.active,
      stores: await indexedDB.databases(),
    };
  }, productionMediaControllerHarness);
  expect(result).toMatchObject({ phase: 'unavailable', reason: 'source-disabled', active: null });
  expect(
    result.stores.filter((row) =>
      Object.values(productionMediaControllerHarness).includes(row.name ?? ''),
    ),
  ).toEqual([]);
});

test('A7 activates only a fresh A4 release read back through real A6 IndexedDB', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844', 'one isolated browser proof');
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const erase = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    await Promise.all(Object.values(names).map(erase));
    const mobile = await import('/src/production-media-controller.ts');
    const fixture = await import('/src/production-media-test-fixture.ts');
    const release =
      await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes%20Wo%20Rev%20Ne/packages/browser-content/src/production-media-release.ts');
    const input = await fixture.makeProductionMediaTestInput();
    const origins = new Set(['https://publisher.invalid']);
    const source = release.createProductionMediaSource({
      metadataOrigin: 'https://metadata.invalid',
      allowedOrigins: origins,
      now: () => input.now,
      fetch: async (url: string | URL) => {
        const path = new URL(url.toString()).pathname;
        const raw =
          path === '/content/media/v1/current.json'
            ? input.pointerRaw
            : path.endsWith('/descriptor.json')
              ? input.descriptorRaw
              : input.documentsRaw[
                  path.split('/').at(-1)!.replace('.json', '') as keyof typeof input.documentsRaw
                ];
        return new Response(raw ?? '', {
          status: raw ? 200 : 404,
          headers: raw
            ? {
                'content-type': 'application/json',
                'content-length': String(new TextEncoder().encode(raw).byteLength),
              }
            : {},
        });
      },
    });
    const controller = mobile.createMobileProductionMediaController({
      source,
      allowedOrigins: origins,
      now: () => input.now,
      operationId: () => 'a7-browser-real-a4',
    });
    await controller.recheck();
    const state = controller.getState();
    const offline = await import('/src/production-media-offline-store.ts');
    const store = await offline.openProductionMediaOfflineStore();
    const snapshot = await store.snapshot();
    store.close();
    controller.dispose();
    await Promise.all(Object.values(names).map(erase));
    return {
      phase: state.phase,
      reason: state.reason,
      generation: state.active?.generation,
      activeKey: snapshot.control.activeKey,
      pending: snapshot.control.pendingRecheck,
    };
  }, productionMediaControllerHarness);
  expect(result).toMatchObject({
    phase: 'local',
    reason: 'ready',
    generation: expect.stringMatching(/^media:5:0:/),
    pending: null,
  });
  expect(result.activeKey).toBeTruthy();
});

test('A7 real A6 to A2 and A5 keeps exact completed and pending resume ownership', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844', 'one isolated browser proof');
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const erase = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    await Promise.all(Object.values(names).map(erase));
    const mobile = await import('/src/production-media-controller.ts');
    const fixture = await import('/src/production-media-test-fixture.ts');
    const release =
      await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes%20Wo%20Rev%20Ne/packages/browser-content/src/production-media-release.ts');
    const resumeModule =
      await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes%20Wo%20Rev%20Ne/packages/browser-content/src/production-media-resume-store.ts');
    const input = await fixture.makeProductionMediaTestInput();
    const origins = new Set(['https://publisher.invalid']);
    const source = release.createProductionMediaSource({
      metadataOrigin: 'https://metadata.invalid',
      allowedOrigins: origins,
      now: () => input.now,
      fetch: async (url: string | URL) => {
        const path = new URL(url.toString()).pathname;
        const raw =
          path === '/content/media/v1/current.json'
            ? input.pointerRaw
            : path.endsWith('/descriptor.json')
              ? input.descriptorRaw
              : input.documentsRaw[
                  path.split('/').at(-1)!.replace('.json', '') as keyof typeof input.documentsRaw
                ];
        return new Response(raw ?? '', {
          status: raw ? 200 : 404,
          headers: raw
            ? {
                'content-type': 'application/json',
                'content-length': String(new TextEncoder().encode(raw).byteLength),
              }
            : {},
        });
      },
    });
    const makeAudio = () => {
      let sourceUrl = '';
      const audio = {
        crossOrigin: null as string | null,
        preload: '' as HTMLMediaElement['preload'],
        duration: 1806,
        currentTime: 0,
        onloadedmetadata: null as HTMLMediaElement['onloadedmetadata'],
        ondurationchange: null as HTMLMediaElement['ondurationchange'],
        onerror: null as HTMLMediaElement['onerror'],
        onpause: null as HTMLMediaElement['onpause'],
        onended: null as HTMLMediaElement['onended'],
        ontimeupdate: null as HTMLMediaElement['ontimeupdate'],
        get src() {
          return sourceUrl;
        },
        set src(value: string) {
          sourceUrl = value;
          audio.srcWrites++;
        },
        srcWrites: 0,
        plays: 0,
        play() {
          audio.plays++;
          return Promise.resolve();
        },
        pause() {
          audio.onpause?.call(audio as unknown as HTMLAudioElement, new Event('pause'));
        },
        load() {},
        removeAttribute(name: string) {
          if (name === 'src') sourceUrl = '';
        },
      };
      return audio;
    };
    const firstAudio = makeAudio();
    const first = mobile.createMobileProductionMediaController({
      source,
      allowedOrigins: origins,
      now: () => input.now,
      operationId: () => 'a7-browser-resume',
      audio: () => firstAudio,
      online: () => true,
    });
    await first.mount();
    await first.recheck();
    const prompt = first.preparePlay('episode-0');
    if (!prompt || !first.confirmPlay(prompt)) throw new Error('initial prompt');
    firstAudio.onloadedmetadata?.call(
      firstAudio as unknown as HTMLAudioElement,
      new Event('loadedmetadata'),
    );
    const waitForPhase = async (
      controller: ReturnType<typeof mobile.createMobileProductionMediaController>,
      phase: string,
    ) => {
      const deadline = performance.now() + 5000;
      while (performance.now() < deadline) {
        if (controller.getState().player.phase === phase) return;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      throw new Error('player phase ' + controller.getState().player.phase);
    };
    await waitForPhase(first, 'playing');
    firstAudio.currentTime = 12.345;
    if (!first.pause()) throw new Error('pause');

    const openResume = resumeModule.createProductionMediaResumeStoreFactory(
      names.mobileResumeDatabase,
    );
    const waitForRecords = async (count: number) => {
      const deadline = performance.now() + 5000;
      while (performance.now() < deadline) {
        const store = await openResume();
        const snapshot = await store.snapshot();
        store.close();
        if (snapshot.records.length === count) return snapshot;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      throw new Error('resume poll');
    };
    const completedSave = await waitForRecords(1);
    const sameObject = firstAudio;
    if (!first.continue()) throw new Error('continue');
    const completedCleanup = await waitForRecords(0);
    await waitForPhase(first, 'playing');

    firstAudio.currentTime = 23.456;
    if (!first.pause()) throw new Error('second pause');
    const reopenSnapshot = await waitForRecords(1);
    const secondAudio = makeAudio();
    const second = mobile.createMobileProductionMediaController({
      now: () => input.now,
      audio: () => secondAudio,
      online: () => true,
      allowedOrigins: origins,
    });
    await second.mount();
    const resumePrompt = second.prepareResume('episode-0');
    if (!resumePrompt || !second.confirmPlay(resumePrompt)) throw new Error('resume prompt');
    secondAudio.onloadedmetadata?.call(
      secondAudio as unknown as HTMLAudioElement,
      new Event('loadedmetadata'),
    );
    await waitForPhase(second, 'playing');
    const resumedAt = secondAudio.currentTime;
    await second.clearLocal();
    const cleared = await waitForRecords(0);
    const secondState = second.getState();
    second.dispose();
    first.dispose();
    return {
      completedPosition: completedSave.records[0]?.positionMs,
      completedCleanup: completedCleanup.records.length,
      reopenedPosition: reopenSnapshot.records[0]?.positionMs,
      reopenedDuration: reopenSnapshot.records[0]?.durationMs,
      declaredDuration: 1_806_000,
      resumedAt,
      sameObject: sameObject === firstAudio,
      firstSrcWrites: firstAudio.srcWrites,
      secondPlays: secondAudio.plays,
      clearedRecords: cleared.records.length,
      clearReason: secondState.reason,
    };
  }, productionMediaControllerHarness);
  expect(result).toEqual({
    completedPosition: 12_345,
    completedCleanup: 0,
    reopenedPosition: 23_456,
    reopenedDuration: result.declaredDuration,
    declaredDuration: result.declaredDuration,
    resumedAt: 23.456,
    sameObject: true,
    firstSrcWrites: 1,
    secondPlays: 1,
    clearedRecords: 0,
    clearReason: 'cleared',
  });
});

test('A7 real A5 pending Continue preserves concurrent rows and reports partial clear', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844', 'one isolated browser proof');
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const erase = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    await Promise.all(Object.values(names).map(erase));
    const mobile = await import('/src/production-media-controller.ts');
    const fixture = await import('/src/production-media-test-fixture.ts');
    const offlineModule = await import('/src/production-media-offline-store.ts');
    const release =
      await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes%20Wo%20Rev%20Ne/packages/browser-content/src/production-media-release.ts');
    const controllerModule =
      await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes%20Wo%20Rev%20Ne/packages/browser-content/src/production-media-controller.ts');
    const resumeModule =
      await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes%20Wo%20Rev%20Ne/packages/browser-content/src/production-media-resume-store.ts');
    const input = await fixture.makeProductionMediaTestInput();
    const origins = new Set(['https://publisher.invalid']);
    const source = release.createProductionMediaSource({
      metadataOrigin: 'https://metadata.invalid',
      allowedOrigins: origins,
      now: () => input.now,
      fetch: async (url: string | URL) => {
        const path = new URL(url.toString()).pathname;
        const raw =
          path === '/content/media/v1/current.json'
            ? input.pointerRaw
            : path.endsWith('/descriptor.json')
              ? input.descriptorRaw
              : input.documentsRaw[
                  path.split('/').at(-1)!.replace('.json', '') as keyof typeof input.documentsRaw
                ];
        return new Response(raw ?? '', {
          status: raw ? 200 : 404,
          headers: raw
            ? {
                'content-type': 'application/json',
                'content-length': String(new TextEncoder().encode(raw).byteLength),
              }
            : {},
        });
      },
    });
    const activation = mobile.createMobileProductionMediaController({
      source,
      allowedOrigins: origins,
      now: () => input.now,
      operationId: () => 'a7-real-a5-activation',
      online: () => true,
    });
    await activation.mount();
    await activation.recheck();
    if (!activation.getState().active) throw new Error('activation');
    activation.dispose();
    await Promise.resolve();

    const actualOffline = await offlineModule.openProductionMediaOfflineStore();
    const openResume = resumeModule.createProductionMediaResumeStoreFactory(
      names.mobileResumeDatabase,
    );
    const actualResume = await openResume();
    let saveEntered = 0;
    let saveSettled = 0;
    let deleteEntered = 0;
    let injectedDuringClear = false;
    let lateRecord: Parameters<typeof actualResume.save>[0] | null = null;
    const proxyResume = Object.freeze({
      ...actualResume,
      save(...args: Parameters<typeof actualResume.save>) {
        saveEntered++;
        const pending = actualResume.save(...args);
        void pending.then(
          () => saveSettled++,
          () => saveSettled++,
        );
        return pending;
      },
      deleteIfExact(...args: Parameters<typeof actualResume.deleteIfExact>) {
        deleteEntered++;
        return actualResume.deleteIfExact(...args);
      },
      async clearExact(...args: Parameters<typeof actualResume.clearExact>) {
        if (!injectedDuringClear) {
          injectedDuringClear = true;
          const current = await actualResume.snapshot(args[2]);
          const basis = args[0][0]!;
          lateRecord = {
            ...basis,
            key: 'episode:late-during-clear',
            episodeId: 'late-during-clear',
            positionMs: 44_444,
          };
          const added = await actualResume.save(lateRecord, current.generation, args[2]);
          if (added.kind !== 'saved') throw new Error('late row not saved');
        }
        return actualResume.clearExact(...args);
      },
    });
    let sourceUrl = '';
    const audio = {
      crossOrigin: null as string | null,
      preload: '' as HTMLMediaElement['preload'],
      duration: 1806,
      currentTime: 0,
      onloadedmetadata: null as HTMLMediaElement['onloadedmetadata'],
      ondurationchange: null as HTMLMediaElement['ondurationchange'],
      onerror: null as HTMLMediaElement['onerror'],
      onpause: null as HTMLMediaElement['onpause'],
      onended: null as HTMLMediaElement['onended'],
      ontimeupdate: null as HTMLMediaElement['ontimeupdate'],
      get src() {
        return sourceUrl;
      },
      set src(value: string) {
        sourceUrl = value;
      },
      play: () => Promise.resolve(),
      pause() {
        audio.onpause?.call(audio as unknown as HTMLAudioElement, new Event('pause'));
      },
      load() {},
      removeAttribute(name: string) {
        if (name === 'src') sourceUrl = '';
      },
    };
    const controller = controllerModule.createProductionMediaController({
      source: null,
      allowedOrigins: origins,
      openOffline: async () => actualOffline,
      openResume: async () => proxyResume,
      now: () => input.now,
      audio: () => audio,
      online: () => true,
    });
    await controller.mount();
    const prompt = controller.preparePlay('episode-0');
    if (!prompt || !controller.confirmPlay(prompt)) throw new Error('play prompt');
    audio.onloadedmetadata?.call(audio as unknown as HTMLAudioElement, new Event('loadedmetadata'));
    for (let turn = 0; turn < 8; turn += 1) await Promise.resolve();
    audio.currentTime = 12.345;
    if (!controller.pause()) throw new Error('first pause');
    for (let turn = 0; turn < 8 && saveEntered === 0; turn += 1) await Promise.resolve();
    const pendingAtContinue = saveEntered === 1 && saveSettled === 0;
    const continuedPending = controller.continue();

    const waitFor = async <T>(read: () => Promise<T>, accept: (value: T) => boolean) => {
      const deadline = performance.now() + 5000;
      while (performance.now() < deadline) {
        const value = await read();
        if (accept(value)) return value;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      throw new Error('real A5 wait');
    };
    const afterPending = await waitFor(
      () => actualResume.snapshot(),
      (snapshot) => saveSettled >= 1 && deleteEntered >= 1 && snapshot.records.length === 0,
    );

    audio.currentTime = 23.456;
    if (!controller.pause()) throw new Error('second pause');
    const owned = await waitFor(
      () => actualResume.snapshot(),
      (snapshot) => saveEntered >= 2 && saveSettled >= 2 && snapshot.records.length === 1,
    );
    const original = owned.records[0]!;
    const changed = { ...original, positionMs: 33_333 };
    let mutation = await actualResume.save(changed, owned.generation);
    if (mutation.kind !== 'saved') throw new Error('changed row');
    const concurrent = {
      ...original,
      key: 'episode:concurrent-new',
      episodeId: 'concurrent-new',
      positionMs: 22_222,
    };
    mutation = await actualResume.save(concurrent, mutation.state.generation);
    if (mutation.kind !== 'saved') throw new Error('concurrent row');
    const deletesBeforeConcurrentContinue = deleteEntered;
    const continuedConcurrent = controller.continue();
    await waitFor(
      () => actualResume.snapshot(),
      (snapshot) =>
        deleteEntered > deletesBeforeConcurrentContinue &&
        snapshot.records.some((record) => record.episodeId === changed.episodeId) &&
        snapshot.records.some((record) => record.episodeId === concurrent.episodeId),
    );
    const afterConcurrentContinue = await actualResume.snapshot();
    await controller.clearLocal();
    const partialState = controller.getState();
    const partialResume = await actualResume.snapshot();
    const clearedOffline = await actualOffline.snapshot();
    controller.dispose();
    return {
      pendingAtContinue,
      continuedPending,
      afterPendingRecords: afterPending.records.length,
      continuedConcurrent,
      concurrentRows: afterConcurrentContinue.records.map((record) => ({
        episodeId: record.episodeId,
        positionMs: record.positionMs,
      })),
      partial: {
        phase: partialState.phase,
        reason: partialState.reason,
        resume: partialState.resume.kind,
        active: partialState.active,
      },
      residualRows: partialResume.records.map((record) => ({
        episodeId: record.episodeId,
        positionMs: record.positionMs,
      })),
      expectedLate: lateRecord && {
        episodeId: lateRecord.episodeId,
        positionMs: lateRecord.positionMs,
      },
      offlineActiveKey: clearedOffline.control.activeKey,
    };
  }, productionMediaControllerHarness);
  expect(result).toEqual({
    pendingAtContinue: true,
    continuedPending: true,
    afterPendingRecords: 0,
    continuedConcurrent: true,
    concurrentRows: [
      { episodeId: 'concurrent-new', positionMs: 22_222 },
      { episodeId: 'episode-0', positionMs: 33_333 },
    ],
    partial: {
      phase: 'storage-error',
      reason: 'storage-error',
      resume: 'unavailable',
      active: null,
    },
    residualRows: [{ episodeId: 'late-during-clear', positionMs: 44_444 }],
    expectedLate: { episodeId: 'late-during-clear', positionMs: 44_444 },
    offlineActiveKey: null,
  });
});

test('A7 real A4 and A6 failed safety readback drops authority before ordinary payload', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844', 'one isolated browser proof');
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const erase = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    await Promise.all(Object.values(names).map(erase));
    const fixture = await import('/src/production-media-test-fixture.ts');
    const offlineModule = await import('/src/production-media-offline-store.ts');
    const release =
      await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes%20Wo%20Rev%20Ne/packages/browser-content/src/production-media-release.ts');
    const controllerModule =
      await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes%20Wo%20Rev%20Ne/packages/browser-content/src/production-media-controller.ts');
    const resumeModule =
      await import('/@fs/C:/Users/patri/Documents/ChatGPT/Sauberes%20Wo%20Rev%20Ne/packages/browser-content/src/production-media-resume-store.ts');
    const input = await fixture.makeProductionMediaTestInput();
    const origins = new Set(['https://publisher.invalid']);
    const paths: string[] = [];
    const source = release.createProductionMediaSource({
      metadataOrigin: 'https://metadata.invalid',
      allowedOrigins: origins,
      now: () => input.now,
      fetch: async (url: string | URL) => {
        const path = new URL(url.toString()).pathname;
        paths.push(path);
        const raw =
          path === '/content/media/v1/current.json'
            ? input.pointerRaw
            : path.endsWith('/descriptor.json')
              ? input.descriptorRaw
              : input.documentsRaw[
                  path.split('/').at(-1)!.replace('.json', '') as keyof typeof input.documentsRaw
                ];
        return new Response(raw ?? '', {
          status: raw ? 200 : 404,
          headers: raw
            ? {
                'content-type': 'application/json',
                'content-length': String(new TextEncoder().encode(raw).byteLength),
              }
            : {},
        });
      },
    });
    const actual = await offlineModule.openProductionMediaOfflineStore();
    const commitSafety = async (...args: Parameters<typeof actual.commitSafety>) => {
      await actual.commitSafety(...args);
      throw new Error('simulated lost postcommit readback');
    };
    const proxy = Object.freeze({ ...actual, commitSafety });
    const openResume = resumeModule.createProductionMediaResumeStoreFactory(
      names.mobileResumeDatabase,
    );
    const controller = controllerModule.createProductionMediaController({
      source,
      allowedOrigins: origins,
      openOffline: async () => proxy,
      openResume,
      now: () => input.now,
      operationId: () => 'a7-lost-safety-readback',
    });
    await controller.mount();
    await controller.recheck();
    const state = controller.getState();
    const durable = await actual.snapshot();
    controller.dispose();
    return {
      phase: state.phase,
      reason: state.reason,
      active: state.active,
      paths,
      safetyRevision: durable.control.safety.revision,
      pendingOperation: durable.control.pendingRecheck?.operationId ?? null,
    };
  }, productionMediaControllerHarness);
  expect(result).toEqual({
    phase: 'unavailable',
    reason: 'conflict',
    active: null,
    paths: [
      '/content/media/v1/current.json',
      '/content/media/v1/releases/release-1/descriptor.json',
      '/content/media/v1/releases/release-1/revocation.json',
    ],
    safetyRevision: 1,
    pendingOperation: 'a7-lost-safety-readback',
  });
});
