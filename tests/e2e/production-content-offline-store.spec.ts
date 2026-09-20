import { expect, test } from '@playwright/test';
import path from 'node:path';

const harnessUrl = `/@fs/${path.resolve('tests/e2e/production-content-offline-harness.ts').replaceAll('\\', '/')}`;

test.describe('production content offline IDB boundary', () => {
  test('a full durable identity ledger refuses a new release without eviction or writes', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const { makeProductionOfflineFixture } = await import(harnessUrl);
      const { openProductionContentOfflineStore } =
        await import('/src/production-content-offline-store.ts');
      const { mobileProductionContentOfflineDatabaseName: name } =
        await import('/src/production-content-offline-profile.ts');
      const ready = await makeProductionOfflineFixture({ sequence: 513 });
      const first = await openProductionContentOfflineStore();
      let control = await first.prepareRecheck('capacity', (await first.snapshot()).control);
      control = await first.commitSafety('capacity', ready.safetyLedger, 1000, control);
      first.close();
      const acceptedIdentities = Array.from({ length: 512 }, (_, index) => ({
        revision: `historical-${index + 1}`,
        sequence: index + 1,
        key: (index + 1).toString(16).padStart(64, '0'),
      }));
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(name);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = database.transaction('control', 'readwrite');
        tx.objectStore('control').put(
          { ...control, acceptedIdentities, highestAcceptedSequence: 512 },
          'control',
        );
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      database.close();
      const store = await openProductionContentOfflineStore();
      const before = await store.snapshot();
      let code = '';
      try {
        await store.saveCandidate({
          descriptor: ready.descriptor,
          manifest: ready.manifest,
          documents: ready.documents,
          checkedAt: 1000,
          expected: before.control,
        });
      } catch (error) {
        code = (error as { code: string }).code;
      }
      store.close();
      const reopened = await openProductionContentOfflineStore();
      const after = await reopened.snapshot();
      reopened.close();
      return {
        code,
        unchanged: JSON.stringify(before) === JSON.stringify(after),
        count: after.control.acceptedIdentities.length,
        floor: after.control.highestAcceptedSequence,
        bundles: after.bundles.length,
      };
    }, harnessUrl);
    expect(result).toEqual({
      code: 'quota-or-write-failure',
      unchanged: true,
      count: 512,
      floor: 512,
      bundles: 0,
    });
  });

  for (const failedResource of [
    'articles',
    'admission',
    'discover-index',
    'reader-details',
    'revoked-reader-details',
  ]) {
    test(`verified safety preserves only safe old content at its original TTL after ${failedResource} failure`, async ({
      page,
    }) => {
      await page.goto('/');
      const result = await page.evaluate(
        async ({ harnessUrl, failedResource }) => {
          const { makeProductionOfflinePacket } = await import(harnessUrl);
          const { createProductionContentOfflineController } =
            await import('/src/production-content-offline-controller.ts');
          let packet = await makeProductionOfflinePacket({ sequence: 10 });
          const original = window.fetch;
          let failing = false;
          window.fetch = async (input, options) => {
            if (
              typeof input === 'string' &&
              input.startsWith('https://solinaridao.com/wrn-production-content/')
            )
              input = input.slice('https://solinaridao.com'.length);
            if (typeof input !== 'string' || !input.startsWith('/wrn-production-content/'))
              return original(input, options);
            if (failing && input.endsWith(`/${failedResource.replace('revoked-', '')}.json`))
              return new Response('', { status: 503 });
            return new Response(JSON.stringify(packet.get(input)), {
              headers: { 'content-type': 'application/json' },
            });
          };
          let now = 1000;
          let controller = createProductionContentOfflineController({ now: () => now });
          try {
            const initial = await controller.check();
            const revoked = failedResource.startsWith('revoked-');
            packet = await makeProductionOfflinePacket({
              sequence: 20,
              safetyRevision: 2,
              omitFirst: revoked,
              revokedFirst: revoked,
            });
            now = 2000;
            failing = true;
            const partial = await controller.check();
            controller.dispose();
            controller = createProductionContentOfflineController({ now: () => now });
            const restored = await controller.restore();
            now = 1000 + 86400000;
            const boundary = await controller.restore();
            now++;
            const expired = await controller.restore();
            return {
              initial: initial.status,
              partial: partial.status,
              reason: partial.reason,
              sequence: partial.runtime?.descriptor.sequence ?? null,
              safety: partial.safety?.revision,
              pending: partial.control?.pendingRecheck,
              checkedAt: partial.control?.lastSuccessfulSourceCheckAt,
              restored: restored.status,
              restoredSequence: restored.runtime?.descriptor.sequence ?? null,
              boundary: boundary.status,
              expired: expired.status,
              expiryReason: expired.reason,
            };
          } finally {
            window.fetch = original;
            controller.dispose();
          }
        },
        { harnessUrl, failedResource },
      );
      expect(result.initial).toBe('active');
      expect(result.reason).toBe('transport-or-validation');
      expect(result.safety).toBe(2);
      expect(result.pending).toBeNull();
      expect(result.checkedAt).toBe(1000);
      if (failedResource.startsWith('revoked-')) {
        expect(result.partial).toBe('needs-source-check');
        expect(result.sequence).toBeNull();
        expect(result.restoredSequence).toBeNull();
      } else {
        expect(result.partial).toBe('active');
        expect(result.sequence).toBe(10);
        expect(result.restored).toBe('active');
        expect(result.restoredSequence).toBe(10);
        expect(result.boundary).toBe('active');
        expect(result.expired).toBe('needs-source-check');
        expect(result.expiryReason).toBe('expired');
      }
    });
  }

  test('phase-two failure cancels all three pending sibling streams before returning', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const { makeProductionOfflinePacket } = await import(harnessUrl);
      const { verifyProductionContentSafety, completeProductionContentRelease } =
        await import('/src/production-content-release.ts');
      const packet = await makeProductionOfflinePacket();
      const original = window.fetch;
      const signals: AbortSignal[] = [];
      const cancelled: string[] = [];
      let payloadMode = false;
      let payloadCalls = 0;
      window.fetch = async (input, options) => {
        if (
          typeof input === 'string' &&
          input.startsWith('https://solinaridao.com/wrn-production-content/')
        )
          input = input.slice('https://solinaridao.com'.length);
        if (typeof input !== 'string' || !input.startsWith('/wrn-production-content/'))
          return original(input, options);
        if (!payloadMode)
          return new Response(JSON.stringify(packet.get(input)), {
            headers: { 'content-type': 'application/json' },
          });
        payloadCalls++;
        if (input.endsWith('/articles.json')) return new Response('', { status: 503 });
        signals.push(options!.signal!);
        return new Response(
          new ReadableStream(
            {
              pull() {},
              cancel() {
                cancelled.push(input);
              },
            },
            { highWaterMark: 0 },
          ),
          { headers: { 'content-type': 'application/json' } },
        );
      };
      try {
        const check = await verifyProductionContentSafety(new AbortController().signal, {
          revision: 0,
          revokedIds: [],
        });
        if (check.kind !== 'verified') throw new Error('Missing valid receipt');
        payloadMode = true;
        const completed = await completeProductionContentRelease(
          check.receipt,
          new AbortController().signal,
          check.safety,
        );
        const cancelledBeforeReturn = cancelled.length;
        const aborted = signals.map((value) => value.aborted);
        const alreadyAborted = new AbortController();
        alreadyAborted.abort();
        await completeProductionContentRelease(check.receipt, alreadyAborted.signal, check.safety);
        return { kind: completed.kind, payloadCalls, aborted, cancelledBeforeReturn };
      } finally {
        window.fetch = original;
      }
    }, harnessUrl);
    expect(result).toEqual({
      kind: 'failed',
      payloadCalls: 4,
      aborted: [true, true, true],
      cancelledBeforeReturn: 3,
    });
  });

  test('clear retains immutable revision receipts and permits only the exact highest identity to be restored', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const { makeProductionOfflinePacket, makeProductionOfflineFixture } = await import(
        harnessUrl
      );
      const { createProductionContentOfflineController } =
        await import('/src/production-content-offline-controller.ts');
      const { openProductionContentOfflineStore } =
        await import('/src/production-content-offline-store.ts');
      let packet = await makeProductionOfflinePacket({ sequence: 10 });
      const original = window.fetch;
      window.fetch = async (input, options) => {
        if (
          typeof input === 'string' &&
          input.startsWith('https://solinaridao.com/wrn-production-content/')
        )
          input = input.slice('https://solinaridao.com'.length);
        if (typeof input !== 'string' || !input.startsWith('/wrn-production-content/'))
          return original(input, options);
        return new Response(JSON.stringify(packet.get(input)), {
          headers: { 'content-type': 'application/json' },
        });
      };
      const controller = createProductionContentOfflineController({ now: () => 1000 });
      try {
        await controller.check();
        packet = await makeProductionOfflinePacket({ sequence: 20 });
        const highest = await controller.check();
        await controller.clear();
        const store = await openProductionContentOfflineStore();
        const before = await store.snapshot();
        const rejections: string[] = [];
        for (const options of [
          { revision: 'authored-release-10', sequence: 21 },
          { sequence: 10 },
        ]) {
          const ready = await makeProductionOfflineFixture(options);
          try {
            await store.saveCandidate({
              descriptor: ready.descriptor,
              manifest: ready.manifest,
              documents: ready.documents,
              checkedAt: 1000,
              expected: before.control,
            });
          } catch (error) {
            rejections.push((error as { code: string }).code);
          }
        }
        const unchanged = JSON.stringify(before) === JSON.stringify(await store.snapshot());
        store.close();
        const restored = await controller.check();
        return {
          count: before.control.acceptedIdentities.length,
          floor: before.control.highestAcceptedSequence,
          rejections,
          unchanged,
          restored: restored.status,
          restoredKey: restored.activeKey,
          highestKey: highest.activeKey,
          afterCount: restored.control?.acceptedIdentities.length,
          frozen:
            Object.isFrozen(restored.control?.acceptedIdentities) &&
            Object.isFrozen(restored.control?.acceptedIdentities[0]),
        };
      } finally {
        window.fetch = original;
        controller.dispose();
      }
    }, harnessUrl);
    expect(result.count).toBe(2);
    expect(result.floor).toBe(20);
    expect(result.rejections).toEqual(['identity-conflict', 'identity-conflict']);
    expect(result.unchanged).toBe(true);
    expect(result.restored).toBe('active');
    expect(result.restoredKey).toBe(result.highestKey);
    expect(result.afterCount).toBe(2);
    expect(result.frozen).toBe(true);
  });

  test('a fresh check finishes the exact candidate left by an interrupted activation', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const { makeProductionOfflineFixture, makeProductionOfflinePacket } = await import(
        harnessUrl
      );
      const { openProductionContentOfflineStore } =
        await import('/src/production-content-offline-store.ts');
      const { createProductionContentOfflineController } =
        await import('/src/production-content-offline-controller.ts');
      const ready = await makeProductionOfflineFixture();
      const packet = await makeProductionOfflinePacket();
      const store = await openProductionContentOfflineStore();
      let control = await store.prepareRecheck('interrupted', (await store.snapshot()).control);
      control = await store.commitSafety('interrupted', ready.safetyLedger, 1000, control);
      const staged = await store.saveCandidate({
        descriptor: ready.descriptor,
        manifest: ready.manifest,
        documents: ready.documents,
        checkedAt: 1000,
        expected: control,
      });
      store.close();
      const controller = createProductionContentOfflineController({ now: () => 2000 });
      const before = await controller.restore();
      const original = window.fetch;
      window.fetch = async (input, options) => {
        if (
          typeof input === 'string' &&
          input.startsWith('https://solinaridao.com/wrn-production-content/')
        )
          input = input.slice('https://solinaridao.com'.length);
        if (typeof input !== 'string' || !input.startsWith('/wrn-production-content/'))
          return original(input, options);
        return new Response(JSON.stringify(packet.get(String(input))), {
          headers: { 'content-type': 'application/json' },
        });
      };
      try {
        const checked = await controller.check();
        return {
          before: before.reason,
          after: checked.status,
          key: checked.activeKey,
          stagedKey: staged.bundleKey,
          writes: checked.confirmedWrites,
          pending: checked.control?.pendingRecheck,
        };
      } finally {
        window.fetch = original;
        controller.dispose();
      }
    }, harnessUrl);
    expect(result.before).toBe('pending-recheck');
    expect(result.after).toBe('active');
    expect(result.key).toBe(result.stagedKey);
    expect(result.writes).toContain('candidate-refreshed');
    expect(result.writes).toContain('activate-candidate');
    expect(result.pending).toBeNull();
  });

  test('rejects individually rehashed invalid safety receipts before any payload request', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const { makeProductionOfflinePacket } = await import(harnessUrl);
      const core = await import(
        harnessUrl.replace(
          'tests/e2e/production-content-offline-harness.ts',
          'packages/content-contracts/src/index.ts',
        )
      );
      const { verifyProductionContentSafety, completeProductionContentRelease } =
        await import('/src/production-content-release.ts');
      const packet = await makeProductionOfflinePacket();
      const base = '/wrn-production-content/authored-release-1';
      const pointerPath = '/wrn-production-content/current.json';
      const originalFetch = window.fetch;
      let current = packet;
      const calls: string[] = [];
      window.fetch = async (input, options) => {
        if (
          typeof input === 'string' &&
          input.startsWith('https://solinaridao.com/wrn-production-content/')
        )
          input = input.slice('https://solinaridao.com'.length);
        if (typeof input !== 'string' || !input.startsWith('/wrn-production-content/'))
          return originalFetch(input, options);
        calls.push(String(input));
        return new Response(core.canonicalJson(current.get(String(input))), {
          headers: { 'content-type': 'application/json' },
        });
      };
      try {
        const known = { revision: 0, revokedIds: [] };
        const pending = verifyProductionContentSafety(new AbortController().signal, known);
        known.revision = 50;
        const valid = await pending;
        if (valid.kind !== 'verified') throw new Error('Valid phase one did not complete');
        const immutable =
          Object.isFrozen(valid.receipt) &&
          Object.isFrozen(valid.receipt.manifest.resources) &&
          Object.isFrozen(valid.receipt.archiveLifecycle.revocations.entries);
        const rejected: string[] = [];
        const payloadCalls: number[] = [];
        for (const fault of [
          'extra-schema-field',
          'archive-bytes',
          'archive-count',
          'resource-path',
          'component-revision',
          'archive-revision',
          'lifecycle-membership',
          'pointer-sequence',
          'pointer-revision',
          'pointer-hash',
        ]) {
          current = new Map(
            [...packet].map(([key, value]) => [key, JSON.parse(core.canonicalJson(value))]),
          );
          const descriptor = current.get(`${base}/release-descriptor.json`);
          const manifest = current.get(`${base}/manifest.json`);
          const archive = current.get(`${base}/archive-lifecycle.json`);
          const pointer = current.get(pointerPath);
          const resource = manifest.resources.find((value) => value.id === 'archiveLifecycle');
          if (fault === 'extra-schema-field') archive.unrecognised = true;
          if (fault === 'archive-bytes') resource.bytes++;
          if (fault === 'archive-count') resource.recordCount++;
          if (fault === 'resource-path')
            manifest.resources.find((value) => value.id === 'articles').path = 'other.json';
          if (fault === 'component-revision')
            descriptor.expectedComponents.readerDetails.revision = 'other-release';
          if (fault === 'archive-revision') archive.revision = 'other-release';
          if (fault === 'lifecycle-membership')
            archive.shareableArticleIds.push('wrn-art-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
          // Bind all unaffected hashes again, so each negative targets its own invariant.
          descriptor.expectedComponents.archiveLifecycle.sha256 = await core.sha256Utf8(
            core.canonicalJson(archive),
          );
          resource.sha256 = descriptor.expectedComponents.archiveLifecycle.sha256;
          if (fault !== 'archive-bytes')
            resource.bytes = core.utf8ByteLength(core.canonicalJson(archive));
          descriptor.expectedManifest.sha256 = await core.sha256Utf8(core.canonicalJson(manifest));
          pointer.descriptorSha256 = await core.sha256Utf8(core.canonicalJson(descriptor));
          if (fault === 'pointer-sequence') pointer.sequence++;
          if (fault === 'pointer-revision') descriptor.releaseRevision = 'other-release';
          if (fault === 'pointer-revision')
            pointer.descriptorSha256 = await core.sha256Utf8(core.canonicalJson(descriptor));
          if (fault === 'pointer-hash') pointer.descriptorSha256 = '0'.repeat(64);
          calls.length = 0;
          rejected.push(
            (
              await verifyProductionContentSafety(new AbortController().signal, {
                revision: 0,
                revokedIds: [],
              })
            ).kind,
          );
          payloadCalls.push(
            calls.filter((path) =>
              /\/(articles|admission|discover-index|reader-details)\.json$/.test(path),
            ).length,
          );
        }
        current = packet;
        const badReceipt = JSON.parse(core.canonicalJson(valid.receipt));
        badReceipt.pointer.sequence++;
        calls.length = 0;
        const phaseTwo = await completeProductionContentRelease(
          badReceipt,
          new AbortController().signal,
          valid.safety,
        );
        const phaseTwoCalls = calls.length;
        const knownAtStart = { revision: 1, revokedIds: [] };
        const completion = completeProductionContentRelease(
          valid.receipt,
          new AbortController().signal,
          knownAtStart,
        );
        knownAtStart.revision = 50;
        return {
          valid: valid.kind,
          immutable,
          rejected,
          payloadCalls,
          phaseTwo: phaseTwo.kind,
          phaseTwoCalls,
          snapshotCompletion: (await completion).kind,
        };
      } finally {
        window.fetch = originalFetch;
      }
    }, harnessUrl);
    expect(result.valid).toBe('verified');
    expect(result.immutable).toBe(true);
    expect(result.rejected).toEqual(Array(10).fill('failed'));
    expect(result.payloadCalls).toEqual(Array(10).fill(0));
    expect(result.phaseTwo).toBe('failed');
    expect(result.phaseTwoCalls).toBe(0);
    expect(result.snapshotCompletion).toBe('ready');
  });

  test('a real safety transaction quota failure requests no payload and a fresh check recovers', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const { makeProductionOfflinePacket } = await import(harnessUrl);
      const packet = await makeProductionOfflinePacket();
      const { createProductionContentOfflineController } =
        await import('/src/production-content-offline-controller.ts');
      const { openProductionContentOfflineStore } =
        await import('/src/production-content-offline-store.ts');
      const originalFetch = window.fetch;
      const originalPut = IDBObjectStore.prototype.put;
      const calls: string[] = [];
      window.fetch = async (input, options) => {
        if (
          typeof input === 'string' &&
          input.startsWith('https://solinaridao.com/wrn-production-content/')
        )
          input = input.slice('https://solinaridao.com'.length);
        if (typeof input !== 'string' || !input.startsWith('/wrn-production-content/'))
          return originalFetch(input, options);
        calls.push(String(input));
        return new Response(JSON.stringify(packet.get(String(input))), {
          headers: { 'content-type': 'application/json' },
        });
      };
      IDBObjectStore.prototype.put = function (value, key) {
        if (this.name === 'control' && value?.safety?.revision === 1)
          throw new DOMException(
            'Authored quota fault at real IDB safety write',
            'QuotaExceededError',
          );
        return key === undefined
          ? originalPut.call(this, value)
          : originalPut.call(this, value, key);
      };
      const controller = createProductionContentOfflineController({ now: () => 1000 });
      try {
        const failed = await controller.check();
        const faultCalls = [...calls];
        const observer = await openProductionContentOfflineStore();
        const afterFailure = await observer.snapshot();
        observer.close();
        IDBObjectStore.prototype.put = originalPut;
        controller.dispose();
        const restarted = createProductionContentOfflineController({ now: () => 2000 });
        const beforeRetry = await restarted.restore();
        const retry = await restarted.check();
        restarted.dispose();
        return {
          reason: failed.reason,
          storageFailure: failed.storageFailure,
          faultCalls,
          safety: afterFailure.control.safety.revision,
          bundles: afterFailure.bundles.length,
          beforeRetry: beforeRetry.status,
          retry: retry.status,
        };
      } finally {
        IDBObjectStore.prototype.put = originalPut;
        window.fetch = originalFetch;
        controller.dispose();
      }
    }, harnessUrl);
    expect(result.reason).toBe('safety-write-failed');
    expect(result.storageFailure).toBe('quota-or-write-failure');
    expect(result.faultCalls).toHaveLength(4);
    expect(
      result.faultCalls.some((value) =>
        /\/(articles|admission|discover-index|reader-details)\.json$/.test(value),
      ),
    ).toBe(false);
    expect(result.safety).toBe(0);
    expect(result.bundles).toBe(0);
    expect(result.beforeRetry).not.toBe('active');
    expect(result.retry).toBe('active');
  });

  test('preserves exact active and candidate slots, rejects both identity conflicts and retains safe older bundles', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const { makeProductionOfflineFixture } = await import(harnessUrl);
      const { openProductionContentOfflineStore } =
        await import('/src/production-content-offline-store.ts');
      const store = await openProductionContentOfflineStore();
      let control = (await store.snapshot()).control;
      control = await store.prepareRecheck('first', control);
      control = await store.commitSafety('first', { revision: 1, revokedIds: [] }, 1000, control);
      control = await store.finishRecheck('first', 'ready', 1000, control);
      const first = await makeProductionOfflineFixture({ sequence: 10 });
      const save = async (ready, time) => {
        const saved = await store.saveCandidate({
          descriptor: ready.descriptor,
          manifest: ready.manifest,
          documents: ready.documents,
          checkedAt: time,
          expected: control,
        });
        control = saved.control;
        return saved;
      };
      const staged = await save(first, 1000);
      control = await store.activateCandidate(staged.bundleKey, control);
      const refreshedActive = await save(first, 2000);
      const second = await makeProductionOfflineFixture({ sequence: 20 });
      const candidate = await save(second, 2000);
      const refreshedCandidate = await save(second, 3000);
      const beforeConflicts = JSON.stringify(await store.snapshot());
      const conflicts: string[] = [];
      for (const options of [
        { sequence: 30, revision: first.descriptor.releaseRevision },
        { sequence: 10, revision: 'different-release' },
      ]) {
        try {
          await save(await makeProductionOfflineFixture(options), 3000);
        } catch (error) {
          conflicts.push((error as { code: string }).code);
        }
      }
      const unchanged = beforeConflicts === JSON.stringify(await store.snapshot());
      control = await store.prepareRecheck('new-safety', control);
      control = await store.commitSafety(
        'new-safety',
        { revision: 2, revokedIds: [] },
        4000,
        control,
      );
      control = await store.finishRecheck('new-safety', 'ready', 4000, control);
      const preserved = await store.snapshot();
      const active = await store.readActive();
      store.close();
      return {
        activeDisposition: refreshedActive.disposition,
        activeKey: refreshedActive.control.activeKey,
        firstKey: staged.bundleKey,
        candidateDisposition: refreshedCandidate.disposition,
        candidateKey: refreshedCandidate.control.candidateKey,
        secondKey: candidate.bundleKey,
        conflicts,
        unchanged,
        safety: preserved.control.safety.revision,
        count: preserved.bundles.length,
        activeSequence: active?.ready.descriptor.sequence,
      };
    }, harnessUrl);
    expect(result.activeDisposition).toBe('active-refreshed');
    expect(result.activeKey).toBe(result.firstKey);
    expect(result.candidateDisposition).toBe('candidate-refreshed');
    expect(result.candidateKey).toBe(result.secondKey);
    expect(result.conflicts).toEqual(['identity-conflict', 'identity-conflict']);
    expect(result.unchanged).toBe(true);
    expect(result.safety).toBe(2);
    expect(result.count).toBe(2);
    expect(result.activeSequence).toBe(10);
  });

  test('an incompatible existing object-store schema stays intact and blocks opening', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const { mobileProductionContentOfflineDatabaseName: name } =
        await import('/src/production-content-offline-profile.ts');
      const { openProductionContentOfflineStore } =
        await import('/src/production-content-offline-store.ts');
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(name, 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore('bundles', { keyPath: 'differentKey' });
          request.result.createObjectStore('control');
          request.transaction!.objectStore('control').put('preserve-me', 'sentinel');
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
      let code = '';
      try {
        const store = await openProductionContentOfflineStore();
        store.close();
      } catch (error) {
        code = (error as { code: string }).code;
      }
      const retained = await new Promise<string>((resolve, reject) => {
        const request = indexedDB.open(name, 1);
        request.onsuccess = () => {
          const db = request.result;
          const value = db
            .transaction('control', 'readonly')
            .objectStore('control')
            .get('sentinel');
          value.onsuccess = () => {
            resolve(value.result);
            db.close();
          };
          value.onerror = () => {
            reject(value.error);
            db.close();
          };
        };
      });
      return { code, retained };
    });
    expect(result).toEqual({ code: 'incompatible-storage', retained: 'preserve-me' });
  });

  test('runs all eight transport requests through durable safety, then applies restart, TTL and clock guards', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const { makeProductionOfflineFixture } = await import(harnessUrl);
      const contracts = await import(
        harnessUrl.replace(
          'tests/e2e/production-content-offline-harness.ts',
          'packages/content-contracts/src/index.ts',
        )
      );
      const { openProductionContentOfflineStore } =
        await import('/src/production-content-offline-store.ts');
      const { createProductionContentOfflineController } =
        await import('/src/production-content-offline-controller.ts');
      const ready = await makeProductionOfflineFixture();
      const revision = ready.descriptor.releaseRevision;
      const base = `/wrn-production-content/${revision}`;
      const packet = new Map<string, unknown>([
        [
          '/wrn-production-content/current.json',
          {
            schema: 'wrn.production-content-current.v1',
            releaseRevision: revision,
            sequence: ready.descriptor.sequence,
            descriptorPath: `${base}/release-descriptor.json`,
            descriptorSha256: await contracts.sha256Utf8(contracts.canonicalJson(ready.descriptor)),
          },
        ],
        [`${base}/release-descriptor.json`, ready.descriptor],
        [`${base}/manifest.json`, ready.manifest],
        [`${base}/archive-lifecycle.json`, ready.documents.archiveLifecycle],
        [`${base}/articles.json`, ready.documents.articles],
        [`${base}/admission.json`, ready.documents.admission],
        [`${base}/discover-index.json`, ready.documents.discoverIndex],
        [`${base}/reader-details.json`, ready.documents.readerDetails],
      ]);
      const observer = await openProductionContentOfflineStore();
      const calls: string[] = [];
      const safetyAtPayload: number[] = [];
      const original = window.fetch;
      window.fetch = async (input, options) => {
        if (
          typeof input === 'string' &&
          input.startsWith('https://solinaridao.com/wrn-production-content/')
        )
          input = input.slice('https://solinaridao.com'.length);
        if (typeof input !== 'string' || !input.startsWith('/wrn-production-content/'))
          return original(input, options);
        calls.push(input);
        if (
          ['articles.json', 'admission.json', 'discover-index.json', 'reader-details.json'].some(
            (name) => input.endsWith(`/${name}`),
          )
        )
          safetyAtPayload.push((await observer.snapshot()).control.safety.revision);
        const body = packet.get(input);
        return body === undefined
          ? new Response('', { status: 404 })
          : new Response(contracts.canonicalJson(body), {
              headers: { 'content-type': 'application/json' },
            });
      };
      let now = 1000;
      const controller = createProductionContentOfflineController({ now: () => now });
      try {
        const checked = await controller.check();
        const initial = checked.status;
        now = 2000;
        const resumed = await controller.restore();
        now = 1500;
        const regressed = await controller.restore();
        controller.dispose();
        const restarted = createProductionContentOfflineController({ now: () => now });
        const restartRegressed = await restarted.restore();
        now = 1000 + 86400001;
        const expired = await restarted.restore();
        restarted.dispose();
        return {
          calls,
          safetyAtPayload,
          initial,
          resumed: resumed.status,
          regressed: regressed.reason,
          restartRegressed: restartRegressed.reason,
          expired: expired.reason,
          articleCount: checked.runtime?.articleIds.length,
        };
      } finally {
        window.fetch = original;
        controller.dispose();
        observer.close();
      }
    }, harnessUrl);
    expect(result.calls).toHaveLength(8);
    expect(new Set(result.calls).size).toBe(8);
    expect(result.calls.slice(0, 4).map((value) => value.split('/').pop())).toEqual([
      'current.json',
      'release-descriptor.json',
      'manifest.json',
      'archive-lifecycle.json',
    ]);
    expect(result.safetyAtPayload).toEqual([1, 1, 1, 1]);
    expect(result.initial).toBe('active');
    expect(result.resumed).toBe('active');
    expect(result.articleCount).toBe(2);
    expect(result.regressed).toBe('clock-regressed');
    expect(result.restartRegressed).toBe('clock-regressed');
    expect(result.expired).toBe('expired');
  });

  test('fences concurrent writes and reclaims a crashed pending check without accepting its late write', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const { openProductionContentOfflineStore } =
        await import('/src/production-content-offline-store.ts');
      const first = await openProductionContentOfflineStore();
      const second = await openProductionContentOfflineStore();
      const base = (await first.snapshot()).control;
      const raced = await Promise.allSettled([
        first.observeTime(1000, base),
        second.observeTime(2000, base),
      ]);
      const abandoned = await first.prepareRecheck('old-attempt', (await first.snapshot()).control);
      const recovered = await second.prepareRecheck(
        'new-attempt',
        (await second.snapshot()).control,
      );
      let oldCode = '';
      try {
        await first.commitSafety('old-attempt', { revision: 1, revokedIds: [] }, 2000, abandoned);
      } catch (error) {
        oldCode = (error as { code: string }).code;
      }
      const accepted = await second.commitSafety(
        'new-attempt',
        { revision: 1, revokedIds: [] },
        2000,
        recovered,
      );
      const finished = await second.finishRecheck('new-attempt', 'ready', 2000, accepted);
      first.close();
      second.close();
      return {
        outcomes: raced.map((value) => value.status),
        rejected: raced
          .filter((value) => value.status === 'rejected')
          .map((value) => value.reason.code),
        oldCode,
        generation: finished.generation,
        abandonedGeneration: abandoned.generation,
        pending: finished.pendingRecheck,
      };
    });
    expect(result.outcomes.filter((value) => value === 'fulfilled')).toHaveLength(1);
    expect(result.rejected).toEqual(['stale-operation']);
    expect(result.oldCode).toBe('stale-operation');
    expect(result.generation).toBeGreaterThan(result.abandonedGeneration);
    expect(result.pending).toBeNull();
  });

  test('unknown control format remains byte-for-byte unchanged after a failed read', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const { openProductionContentOfflineStore } =
        await import('/src/production-content-offline-store.ts');
      const { mobileProductionContentOfflineDatabaseName: name } =
        await import('/src/production-content-offline-profile.ts');
      const store = await openProductionContentOfflineStore();
      const control = await store.clear((await store.snapshot()).control);
      store.close();
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(name);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const unknown = { ...control, format: 'future-version', retained: 'do not overwrite' };
      await new Promise<void>((resolve, reject) => {
        const tx = database.transaction('control', 'readwrite');
        tx.objectStore('control').put(unknown, 'control');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      const opened = await openProductionContentOfflineStore();
      let code = '';
      try {
        await opened.snapshot();
      } catch (error) {
        code = (error as { code: string }).code;
      }
      opened.close();
      const after = await new Promise<unknown>((resolve, reject) => {
        const request = database.transaction('control').objectStore('control').get('control');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      database.close();
      return { code, before: JSON.stringify(unknown), after: JSON.stringify(after) };
    });
    expect(result.code).toBe('incompatible-storage');
    expect(result.after).toBe(result.before);
  });

  test('commits real validated articles and preserves exact refresh slots and sequence floor through rollback and clear', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const { makeProductionOfflineFixture } = await import(harnessUrl);
      const { openProductionContentOfflineStore } =
        await import('/src/production-content-offline-store.ts');
      const store = await openProductionContentOfflineStore();
      const before = await store.snapshot();
      await store.clear(before.control);
      const admit = async (sequence: number, activate = true) => {
        const ready = await makeProductionOfflineFixture({ sequence });
        let control = (await store.snapshot()).control;
        control = await store.prepareRecheck(`attempt-${sequence}`, control);
        control = await store.commitSafety(
          `attempt-${sequence}`,
          ready.safetyLedger,
          1000,
          control,
        );
        const saved = await store.saveCandidate({
          descriptor: ready.descriptor,
          manifest: ready.manifest,
          documents: ready.documents,
          checkedAt: 1000,
          expected: control,
        });
        control = saved.control;
        if (activate && saved.disposition === 'candidate-staged')
          control = await store.activateCandidate(saved.bundleKey, control);
        await store.finishRecheck(`attempt-${sequence}`, 'ready', 1000, control);
        return saved;
      };
      const first = await admit(10);
      const second = await admit(20);
      const rolled = await store.rollback((await store.snapshot()).control);
      const refreshed = await admit(20);
      const refreshedState = (await store.snapshot()).control;
      const rejectCode = async (sequence: number) => {
        try {
          await admit(sequence);
          return 'unexpected success';
        } catch (error) {
          return (error as { code: string }).code;
        }
      };
      const downgradeAfterRollback = await rejectCode(15);
      const cleared = await store.clear((await store.snapshot()).control);
      const downgradeAfterClear = await rejectCode(15);
      const newest = await admit(21);
      const active = await store.readActive();
      store.close();
      const reopened = await openProductionContentOfflineStore();
      const restarted = await reopened.readActive();
      reopened.close();
      return {
        firstKey: first.bundleKey,
        secondKey: second.bundleKey,
        rolled,
        refreshed: refreshed.disposition,
        refreshedState,
        downgradeAfterRollback,
        cleared,
        downgradeAfterClear,
        newest: newest.disposition,
        activeSequence: active?.ready.descriptor.sequence,
        restartedSequence: restarted?.ready.descriptor.sequence,
      };
    }, harnessUrl);
    expect(result.rolled).toMatchObject({
      activeKey: result.firstKey,
      previousKey: result.secondKey,
      highestAcceptedSequence: 20,
    });
    expect(result.refreshed).toBe('previous-refreshed');
    expect(result.refreshedState).toMatchObject({
      activeKey: result.firstKey,
      previousKey: result.secondKey,
      candidateKey: null,
    });
    expect(result.downgradeAfterRollback).toBe('identity-conflict');
    expect(result.cleared).toMatchObject({
      activeKey: null,
      previousKey: null,
      candidateKey: null,
      highestAcceptedSequence: 20,
    });
    expect(result.downgradeAfterClear).toBe('identity-conflict');
    expect(result.newest).toBe('candidate-staged');
    expect(result.activeSequence).toBe(21);
    expect(result.restartedSequence).toBe(21);
  });

  test('commits cumulative revocation across all three slots before any replacement articles are saved', async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (harnessUrl) => {
      const { makeProductionOfflineFixture, firstProductionTestId } = await import(harnessUrl);
      const { openProductionContentOfflineStore } =
        await import('/src/production-content-offline-store.ts');
      const store = await openProductionContentOfflineStore();
      let control = (await store.snapshot()).control;
      control = await store.clear(control);
      for (const sequence of [10, 20, 30]) {
        const ready = await makeProductionOfflineFixture({ sequence });
        control = await store.prepareRecheck(`seed-${sequence}`, control);
        control = await store.commitSafety(`seed-${sequence}`, ready.safetyLedger, 1000, control);
        const saved = await store.saveCandidate({
          descriptor: ready.descriptor,
          manifest: ready.manifest,
          documents: ready.documents,
          checkedAt: 1000,
          expected: control,
        });
        control = saved.control;
        if (sequence !== 30) control = await store.activateCandidate(saved.bundleKey, control);
        control = await store.finishRecheck(`seed-${sequence}`, 'ready', 1000, control);
      }
      const seeded = await store.snapshot();
      const replacement = await makeProductionOfflineFixture({
        sequence: 31,
        safetyRevision: 2,
        omitFirst: true,
        revokedFirst: true,
      });
      control = await store.prepareRecheck('take-down', control);
      control = await store.commitSafety('take-down', replacement.safetyLedger, 1100, control);
      const afterSafety = await store.snapshot();
      // Simulate the remaining payload phase failing: no saveCandidate occurs.
      await store.finishRecheck('take-down', 'safety-verified-payload-failed', 1100, control);
      store.close();
      const reopened = await openProductionContentOfflineStore();
      const afterRestart = await reopened.snapshot();
      const active = await reopened.readActive();
      reopened.close();
      return {
        seedSlots: seeded.bundles.length,
        afterSafety,
        afterRestart,
        active,
        firstProductionTestId,
      };
    }, harnessUrl);
    expect(result.seedSlots).toBe(3);
    expect(result.afterSafety.bundles).toEqual([]);
    expect(result.afterSafety.control).toMatchObject({
      activeKey: null,
      previousKey: null,
      candidateKey: null,
      highestAcceptedSequence: 30,
      safety: { revision: 2, revokedIds: [result.firstProductionTestId] },
    });
    expect(result.afterRestart.control.safety).toEqual(result.afterSafety.control.safety);
    expect(result.afterRestart.control.highestAcceptedSequence).toBe(30);
    expect(result.active).toBeNull();
  });
  test('uses a distinct real IndexedDB database and clear retains the monotone control fields', async ({
    page,
  }) => {
    await page.goto('/');
    const state = await page.evaluate(async () => {
      const mod = await import('/src/production-content-offline-store.ts');
      const profile = await import('/src/production-content-offline-profile.ts');
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(
          profile.mobileProductionContentOfflineDatabaseName,
        );
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      const store = await mod.openProductionContentOfflineStore();
      const first = await store.snapshot();
      const cleared = await store.clear({
        generation: first.control.generation,
        clearEpoch: first.control.clearEpoch,
      });
      const second = await store.snapshot();
      store.close();
      return {
        name: profile.mobileProductionContentOfflineDatabaseName,
        first,
        cleared,
        second,
        allNames: (await indexedDB.databases()).map((entry) => entry.name),
      };
    });
    expect(state.name).toBe('wrn.mobile-production-content-offline.v1');
    expect(state.allNames).toContain(state.name);
    expect(state.first.control.highestAcceptedSequence).toBe(0);
    expect(state.cleared.highestAcceptedSequence).toBe(0);
    expect(state.second.control).toMatchObject({
      activeKey: null,
      previousKey: null,
      candidateKey: null,
      generation: 1,
      clearEpoch: 1,
    });
  });
});
