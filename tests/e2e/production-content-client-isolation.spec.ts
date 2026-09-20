import { expect, test } from '@playwright/test';
import path from 'node:path';

const shared = `/@fs/${path.resolve('packages/browser-content/src').replaceAll('\\', '/')}`;
const harness = `/@fs/${path.resolve('tests/e2e/production-content-offline-harness.ts').replaceAll('\\', '/')}`;

for (const cleared of ['mobile', 'website'] as const) {
  test(`production content and reading clear remain isolated when ${cleared} clears`, async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(
      async ({ shared, harness, cleared }) => {
        const { createProductionContentOfflineStoreFactory } = await import(
          `${shared}/production-content-offline-store.ts`
        );
        const { createProductionReadingStateStore } = await import(
          `${shared}/production-reading-state.ts`
        );
        const { makeProductionOfflineFixture, firstProductionTestId } = await import(harness);
        const names = ['mobile', 'website'];
        const first = await makeProductionOfflineFixture();
        const before: Record<string, string> = {};
        for (const name of names) {
          const store = await createProductionContentOfflineStoreFactory(
            `wrn.${name}-production-content-offline.v1`,
          )();
          let control = await store.prepareRecheck('seed', (await store.snapshot()).control);
          control = await store.commitSafety('seed', first.safetyLedger, 1000, control);
          const saved = await store.saveCandidate({
            descriptor: first.descriptor,
            manifest: first.manifest,
            documents: first.documents,
            checkedAt: 1000,
            expected: control,
          });
          control = await store.activateCandidate(saved.bundleKey, saved.control);
          await store.finishRecheck('seed', 'ready', 1000, control);
          before[name] = JSON.stringify(await store.snapshot());
          store.close();
          const reading = createProductionReadingStateStore(
            `wrn.${name}-production-reading-state.v2`,
          );
          reading.change({
            kind: 'save',
            articleId: firstProductionTestId,
            time: name === 'mobile' ? '2026-09-10T00:00:00.000Z' : '2026-09-10T01:00:00.000Z',
          });
        }
        const untouched = cleared === 'mobile' ? 'website' : 'mobile';
        const otherKey = `wrn.${untouched}-production-reading-state.v2`;
        const otherReading = localStorage.getItem(otherKey);
        const toClear = await createProductionContentOfflineStoreFactory(
          `wrn.${cleared}-production-content-offline.v1`,
        )();
        await toClear.clear((await toClear.snapshot()).control);
        toClear.close();
        createProductionReadingStateStore(`wrn.${cleared}-production-reading-state.v2`).change({
          kind: 'clear',
          target: 'all',
        });
        const reopenedOther = await createProductionContentOfflineStoreFactory(
          `wrn.${untouched}-production-content-offline.v1`,
        )();
        const reopenedCleared = await createProductionContentOfflineStoreFactory(
          `wrn.${cleared}-production-content-offline.v1`,
        )();
        const result = {
          otherSnapshotUnchanged:
            JSON.stringify(await reopenedOther.snapshot()) === before[untouched],
          otherContentPresent:
            (await reopenedOther.readActive())?.ready.documents.articles.articles.length === 2,
          clearedContentAbsent: (await reopenedCleared.readActive()) === null,
          otherReadingUnchanged: localStorage.getItem(otherKey) === otherReading,
          differentKeys:
            localStorage.getItem(otherKey) !==
            localStorage.getItem(`wrn.${cleared}-production-reading-state.v2`),
        };
        reopenedOther.close();
        reopenedCleared.close();
        return result;
      },
      { shared, harness, cleared },
    );
    expect(result).toEqual({
      otherSnapshotUnchanged: true,
      otherContentPresent: true,
      clearedContentAbsent: true,
      otherReadingUnchanged: true,
      differentKeys: true,
    });
    await page.reload();
    const persisted = await page.evaluate(
      async ({ shared, cleared }) => {
        const { createProductionContentOfflineStoreFactory } = await import(
          `${shared}/production-content-offline-store.ts`
        );
        const untouched = cleared === 'mobile' ? 'website' : 'mobile';
        const store = await createProductionContentOfflineStoreFactory(
          `wrn.${untouched}-production-content-offline.v1`,
        )();
        const count = (await store.readActive())?.ready.documents.articles.articles.length;
        store.close();
        return count;
      },
      { shared, cleared },
    );
    expect(persisted).toBe(2);
  });
}
