import { expect, test } from '@playwright/test';
import { controllerHarness, initialTime } from './content-offline-controller-harness';

test.beforeEach(async ({ page }, info) => {
  void page;
  test.skip(
    !['mobile-390x844', 'website-390x844'].includes(info.project.name),
    'The clock regression requires one isolated real-IDB controller per client.',
  );
});

test('S15 failed default B check cannot lower a persisted clock observation across restart', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  const a = await h.call('save');
  expect(a.readAccess).toBe('allowed');

  await page.evaluate(() => {
    window.recovery.now += 10_000;
  });
  const forward = await h.call('guard');
  const beforeRegression = await h.snapshot();
  expect(forward.readAccess).toBe('allowed');
  expect(beforeRegression.control.generation).toBe(6);
  expect(beforeRegression.control.lastObservedAt).toBe(initialTime + 10_000);

  await page.evaluate(() => {
    window.recovery.now -= 5_000;
  });
  const backwards = await h.call('guard');
  expect(backwards.reason).toBe('clock-regressed');

  h.source('b', true);
  const failedCheck = await h.call('check');
  const afterFailedCheck = await h.snapshot();
  expect(failedCheck.failure).toBe('transport-or-validation');
  expect(failedCheck.reason).toBe('clock-regressed');
  expect(afterFailedCheck.control.lastObservedAt).toBe(initialTime + 10_000);
  expect(afterFailedCheck.control.generation).toBe(9);
  expect(afterFailedCheck.control.lastSuccessfulSourceCheckAt).toBe(initialTime);
  expect(afterFailedCheck.control.pendingRecheck).toBeNull();
  expect(afterFailedCheck.control.activeKey).toBe(a.active?.key);

  h.offline();
  const requestsBeforeRestart = h.requests.length;
  await page.evaluate(() => {
    const d = window.recovery;
    d.controller.dispose();
    d.controller = d.create({ now: () => d.now });
  });
  const restored = await h.call('restore');
  const afterRestart = await h.snapshot();
  expect(restored.reason).toBe('clock-regressed');
  expect(restored.readAccess).toBe('blocked');
  expect(restored.runtime).toBeNull();
  expect(h.requests).toHaveLength(requestsBeforeRestart);
  expect(afterRestart.control.lastObservedAt).toBe(initialTime + 10_000);
  expect(afterRestart.control.generation).toBe(9);

  await h.evidence({
    a,
    forward,
    backwards,
    failedCheck,
    beforeRegression,
    afterFailedCheck,
    restored,
    afterRestart,
    requestsBeforeRestart,
  });
});

test('S15 complete default A check keeps its existing full-source time-anchor behavior', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  await h.call('save');
  await page.evaluate(() => {
    window.recovery.now += 10_000;
  });
  const forward = await h.call('guard');
  await page.evaluate(() => {
    window.recovery.now -= 5_000;
  });
  const backwards = await h.call('guard');

  h.source('a');
  const completeA = await h.call('check');
  const afterCompleteA = await h.snapshot();
  expect(forward.readAccess).toBe('allowed');
  expect(backwards.reason).toBe('clock-regressed');
  expect(completeA.failure).toBeNull();
  expect(completeA.reason).toBe('clock-regressed');
  expect(completeA.active?.checkedAt).toBe(initialTime + 5_000);
  expect(afterCompleteA.control.lastSuccessfulSourceCheckAt).toBe(initialTime + 5_000);
  expect(afterCompleteA.control.lastObservedAt).toBe(initialTime + 5_000);
  expect(afterCompleteA.control.generation).toBe(10);

  await page.evaluate(() => {
    const d = window.recovery;
    d.controller.dispose();
    d.controller = d.create({ now: () => d.now });
  });
  const restarted = await h.call('restore');
  expect(restarted.reason).toBe('ready');
  expect(restarted.readAccess).toBe('allowed');
  await h.evidence({ forward, backwards, completeA, afterCompleteA, restarted });
});

test('S15 abort after confirmed safety before complete source recheck stays fail-closed', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  await h.call('save');
  await page.evaluate(() => {
    window.recovery.now += 10_000;
  });
  await h.call('guard');
  await page.evaluate(() => {
    window.recovery.now -= 5_000;
    const d = window.recovery;
    d.controller.dispose();
    const abort = new AbortController();
    d.controller = d.create({
      now: () => d.now,
      openStore: async (signal) => {
        const store = await d.open(signal);
        return {
          ...store,
          recordSafety: async (...args: Parameters<typeof store.recordSafety>) => {
            const recorded = await store.recordSafety(...args);
            abort.abort();
            return recorded;
          },
        };
      },
    });
    d.pending = d.controller.check(abort.signal);
  });
  const aborted = await page.evaluate(() => window.recovery.pending!);
  const afterSafety = await h.snapshot();
  expect(aborted.status).toBe('aborted');
  expect(afterSafety.control.lastObservedAt).toBe(initialTime + 10_000);
  expect(afterSafety.control.generation).toBe(8);
  expect(afterSafety.control.pendingRecheck).not.toBeNull();

  await page.evaluate(() => {
    const d = window.recovery;
    d.controller.dispose();
    d.controller = d.create({ now: () => d.now });
  });
  const restarted = await h.call('restore');
  expect(restarted.readAccess).not.toBe('allowed');
  expect(restarted.runtime).toBeNull();
  await h.evidence({ aborted, afterSafety, restarted });
});
