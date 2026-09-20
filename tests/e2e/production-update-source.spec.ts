import { expect, test } from '@playwright/test';
import path from 'node:path';

const harness = `/@fs/${path.resolve('tests/e2e/production-content-offline-harness.ts').replaceAll('\\', '/')}`;
const website = `/@fs/${path.resolve('apps/website/src').replaceAll('\\', '/')}`;
const remoteOrigin = 'https://solinaridao.com';

test.beforeEach(async ({ page }) => {
  // A faulty adapter must fail locally instead of reaching the real future endpoint.
  await page.route('https://**/*', (route) => route.abort('blockedbyclient'));
  await page.goto('/');
});

test('actual bundled pilot bootstraps once; updates, remount and Clear use only the fixed remote origin', async ({
  page,
}) => {
  const escapes: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith('https://')) escapes.push(request.url());
  });
  const result = await page.evaluate(
    async ({ harness, remoteOrigin }) => {
      const { makeProductionOfflinePacket } = await import(harness);
      const { createProductionContentOfflineController } =
        await import('/src/production-content-offline-controller.ts');
      const { openProductionContentOfflineStore } =
        await import('/src/production-content-offline-store.ts');
      const original = window.fetch;
      let packet = await makeProductionOfflinePacket({ sequence: 3 });
      const requests: string[] = [];
      window.fetch = async (input, options) => {
        if (typeof input !== 'string' || !input.includes('/wrn-production-content/'))
          return original(input, options);
        requests.push(input);
        if (!input.startsWith(remoteOrigin)) return original(input, options);
        if (
          options?.credentials !== 'omit' ||
          options.referrerPolicy !== 'no-referrer' ||
          options.redirect !== 'error' ||
          options.cache !== 'no-store'
        )
          throw new Error('unsafe remote options');
        return new Response(JSON.stringify(packet.get(input.slice(remoteOrigin.length))), {
          headers: { 'content-type': 'application/json' },
        });
      };
      let controller = createProductionContentOfflineController({ now: () => 1000 });
      try {
        const first = await controller.check();
        const updated = await controller.check();
        controller.dispose();
        controller = createProductionContentOfflineController({ now: () => 2000 });
        const remounted = await controller.check();
        await controller.clear();
        const observer = await openProductionContentOfflineStore();
        const afterClear = await observer.snapshot();
        observer.close();
        controller.dispose();
        controller = createProductionContentOfflineController({ now: () => 3000 });
        packet = await makeProductionOfflinePacket({ sequence: 2 });
        const lower = await controller.check();
        packet = await makeProductionOfflinePacket({ sequence: 3, revision: 'authored-collision' });
        const collision = await controller.check();
        packet = await makeProductionOfflinePacket({ sequence: 4 });
        const higher = await controller.check();
        return {
          first: first.runtime?.descriptor.releaseRevision,
          firstSequence: first.runtime?.descriptor.sequence,
          firstArticles: first.runtime?.manifest.articleIds,
          update: updated.runtime?.descriptor.sequence,
          remount: remounted.runtime?.descriptor.sequence,
          afterClear: {
            floor: afterClear.control.highestAcceptedSequence,
            bundles: afterClear.bundles.length,
            epoch: afterClear.control.clearEpoch,
          },
          lower: lower.storageFailure,
          collision: collision.storageFailure,
          higher: higher.runtime?.descriptor.sequence,
          requests,
        };
      } finally {
        controller.dispose();
        window.fetch = original;
      }
    },
    { harness, remoteOrigin },
  );
  expect(result.first).toBe('wrn-production-eff-2026-09-10-v2');
  expect(result.firstSequence).toBe(2);
  expect(result.firstArticles).toEqual([
    'wrn-art-a772ab86c915a036c6177f1bfe958d4d',
    'wrn-art-ba76ef8b7afb34885bd5f64bc7135f6c',
  ]);
  expect(result.update).toBe(3);
  expect(result.remount).toBe(3);
  expect(result.afterClear).toEqual({ floor: 3, bundles: 0, epoch: 1 });
  expect(result.lower).toBe('identity-conflict');
  expect(result.collision).toBe('identity-conflict');
  expect(result.higher).toBe(4);
  expect(result.requests).toHaveLength(48);
  expect(
    result.requests.slice(0, 8).every((url) => url.startsWith('/wrn-production-content/')),
  ).toBe(true);
  expect(
    result.requests
      .slice(8)
      .every((url) => url.startsWith(`${remoteOrigin}/wrn-production-content/`)),
  ).toBe(true);
  expect(escapes).toEqual([]);
});

for (const client of ['mobile', 'website'] as const) {
  test(`${client}: failed refresh preserves exact active bytes, check time and inclusive TTL across remount`, async ({
    page,
  }) => {
    const result = await page.evaluate(
      async ({ client, website, remoteOrigin }) => {
        const prefix = client === 'mobile' ? '/src' : website;
        const { createProductionContentOfflineController } = await import(
          `${prefix}/production-content-offline-controller.ts`
        );
        const { openProductionContentOfflineStore } = await import(
          `${prefix}/production-content-offline-store.ts`
        );
        const original = window.fetch;
        let failing = false;
        const requests: string[] = [];
        window.fetch = async (input, options) => {
          if (typeof input !== 'string' || !input.includes('/wrn-production-content/'))
            return original(input, options);
          requests.push(input);
          if (failing) return new Response('', { status: 503 });
          return original(input, options);
        };
        const readingKey = `wrn.${client}-production-reading-state.v2`;
        const untouchedKey = `wrn.${client === 'mobile' ? 'website' : 'mobile'}-production-reading-state.v2`;
        localStorage.setItem(readingKey, 'preserve-authored-reading-bytes');
        localStorage.setItem(untouchedKey, 'preserve-other-client-reading-bytes');
        let now = 1000;
        let controller = createProductionContentOfflineController({ now: () => now });
        try {
          const first = await controller.check();
          const beforeStore = await openProductionContentOfflineStore();
          const before = await beforeStore.snapshot();
          beforeStore.close();
          now = 2000;
          failing = true;
          const failed = await controller.check();
          controller.dispose();
          controller = createProductionContentOfflineController({ now: () => now });
          const restored = await controller.restore();
          const afterStore = await openProductionContentOfflineStore();
          const after = await afterStore.snapshot();
          afterStore.close();
          now = 1999;
          const backwards = await controller.restore();
          now = 1000 + 86400000;
          const boundary = await controller.restore();
          now++;
          const expired = await controller.restore();
          return {
            initial: first.status,
            failed: failed.status,
            reason: failed.reason,
            keyUnchanged:
              first.activeKey === failed.activeKey && first.activeKey === restored.activeKey,
            bodyUnchanged:
              JSON.stringify(first.runtime) === JSON.stringify(failed.runtime) &&
              JSON.stringify(first.runtime) === JSON.stringify(restored.runtime),
            bundleBytesUnchanged: JSON.stringify(before.bundles) === JSON.stringify(after.bundles),
            checkedAt: after.control.lastSuccessfulSourceCheckAt,
            expiry: [first.expiresAt, failed.expiresAt, restored.expiresAt],
            pending: after.control.pendingRecheck,
            backwards: backwards.reason,
            boundary: boundary.status,
            expired: expired.reason,
            reading: localStorage.getItem(readingKey),
            otherReading: localStorage.getItem(untouchedKey),
            refreshUrl: requests[8],
            expectedRefresh: `${client === 'mobile' ? remoteOrigin : ''}/wrn-production-content/current.json`,
          };
        } finally {
          controller.dispose();
          window.fetch = original;
        }
      },
      { client, website, remoteOrigin },
    );
    expect(result.initial).toBe('active');
    expect(result.failed).toBe('active');
    expect(result.reason).toBe('transport-or-validation');
    expect(result.keyUnchanged && result.bodyUnchanged && result.bundleBytesUnchanged).toBe(true);
    expect(result.checkedAt).toBe(1000);
    expect(result.expiry).toEqual(Array(3).fill(86401000));
    expect(result.pending).toBeNull();
    expect(result.backwards).toBe('clock-regressed');
    expect(result.boundary).toBe('active');
    expect(result.expired).toBe('expired');
    expect(result.reading).toBe('preserve-authored-reading-bytes');
    expect(result.otherReading).toBe('preserve-other-client-reading-bytes');
    expect(result.refreshUrl).toBe(result.expectedRefresh);
  });
}

test('remote verified revocation is durable before failed payload and removes the old body', async ({
  page,
}) => {
  const result = await page.evaluate(
    async ({ harness, remoteOrigin }) => {
      const { makeProductionOfflinePacket } = await import(harness);
      const { createProductionContentOfflineController } =
        await import('/src/production-content-offline-controller.ts');
      const { openProductionContentOfflineStore } =
        await import('/src/production-content-offline-store.ts');
      let packet = await makeProductionOfflinePacket({ sequence: 1 });
      let failing = false;
      const original = window.fetch;
      const payloadObservations: number[] = [];
      window.fetch = async (input, options) => {
        if (typeof input !== 'string' || !input.includes('/wrn-production-content/'))
          return original(input, options);
        const key = input.startsWith(remoteOrigin) ? input.slice(remoteOrigin.length) : input;
        if (failing && /\/(articles|admission|discover-index|reader-details)\.json$/.test(key)) {
          const store = await openProductionContentOfflineStore();
          payloadObservations.push((await store.snapshot()).control.safety.revision);
          store.close();
          return new Response('', { status: 503 });
        }
        return new Response(JSON.stringify(packet.get(key)), {
          headers: { 'content-type': 'application/json' },
        });
      };
      let controller = createProductionContentOfflineController({ now: () => 1000 });
      try {
        const first = await controller.check();
        packet = await makeProductionOfflinePacket({
          sequence: 2,
          safetyRevision: 2,
          revokedFirst: true,
          omitFirst: true,
        });
        failing = true;
        const failed = await controller.check();
        controller.dispose();
        controller = createProductionContentOfflineController({ now: () => 2000 });
        const restored = await controller.restore();
        return {
          first: first.status,
          failed: failed.status,
          runtime: failed.runtime,
          restored: restored.status,
          safety: restored.safety,
          payloadObservations,
        };
      } finally {
        controller.dispose();
        window.fetch = original;
      }
    },
    { harness, remoteOrigin },
  );
  expect(result.first).toBe('active');
  expect(result.failed).toBe('needs-source-check');
  expect(result.runtime).toBeNull();
  expect(result.restored).toBe('needs-source-check');
  expect(result.safety).toEqual({
    revision: 2,
    revokedIds: ['wrn-art-0123456789abcdef0123456789abcdef'],
  });
  expect(result.payloadObservations).toEqual([2, 2, 2, 2]);
});

test('a failed bootstrap consumes its opportunity; remount cannot retry the APK source', async ({
  page,
}) => {
  const result = await page.evaluate(
    async ({ remoteOrigin }) => {
      const { createProductionContentOfflineController } =
        await import('/src/production-content-offline-controller.ts');
      const original = window.fetch;
      const requests: string[] = [];
      window.fetch = async (input, options) => {
        if (typeof input !== 'string' || !input.includes('/wrn-production-content/'))
          return original(input, options);
        requests.push(input);
        return new Response('', { status: 503 });
      };
      let controller = createProductionContentOfflineController({ now: () => 1000 });
      try {
        const first = await controller.check();
        controller.dispose();
        controller = createProductionContentOfflineController({ now: () => 2000 });
        const second = await controller.check();
        return { first: first.status, second: second.status, requests, remoteOrigin };
      } finally {
        controller.dispose();
        window.fetch = original;
      }
    },
    { remoteOrigin },
  );
  expect(result.first).toBe('needs-source-check');
  expect(result.second).toBe('needs-source-check');
  expect(result.requests).toEqual([
    '/wrn-production-content/current.json',
    `${remoteOrigin}/wrn-production-content/current.json`,
  ]);
});
