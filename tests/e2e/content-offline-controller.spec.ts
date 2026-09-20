import { expect, test } from '@playwright/test';
import { controllerHarness, initialTime } from './content-offline-controller-harness';

test('R24 IDB-off explicit B check never autoactivates B or refreshes active session A', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  await page.evaluate(() =>
    Object.defineProperty(window, 'indexedDB', { configurable: true, value: undefined }),
  );
  const a = await h.call('restore');
  h.source('b');
  await page.evaluate(() => {
    window.recovery.now += 1000;
  });
  const b = await h.call('check');
  expect(b.runtime?.ready.descriptor.releaseRevision).toBe(a.active?.revision);
  expect(b.active).toEqual(a.active);
  expect(b.candidate).toBeNull();
  expect(b.status).toBe('storage-error');
  expect(b.storageFailure).toBe('unavailable');
  expect(b.actions).not.toContain('activate');
  h.source('a');
  const same = await h.call('check');
  expect(same.active?.checkedAt).toBe(initialTime + 1000);
  expect(same.status).toBe('session-only');
  h.source('c', true);
  const c = await h.call('check');
  expect(c.runtime).toBeNull();
  expect(c.control.safetyFloor).toBe(2);
  await h.evidence({ a, b, same, c });
});

test('R19 session-only reader re-reads another tab safety and does not revive after its clear', async ({
  page,
  context,
}, info) => {
  const h = await controllerHarness(page, info);
  const a = await h.call('restore');
  expect(a.persistence).toBe('session-only');
  const other = await context.newPage();
  const second = await controllerHarness(other, info);
  second.source('c', true);
  await second.call('check');
  const guard = await h.call('guard');
  expect(guard.runtime).toBeNull();
  expect(guard.control.safetyFloor).toBe(2);
  await second.call('clear');
  const resume = await h.call('resumeGuard');
  expect(resume.runtime).toBeNull();
  expect(resume.control.clearEpoch).toBe(1);
  await h.evidence({ a, guard, resume });
  await other.close();
});

test('R20 unknown readable-control failure never falls through to session source', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  await h.call('restore');
  await page.evaluate(async () => {
    const d = window.recovery;
    d.controller.dispose();
    d.controller = d.create({
      now: () => d.now,
      openStore: async (signal) => {
        const db = await d.open(signal);
        return {
          ...db,
          readProjection: async () => {
            throw new d.Error('incompatible-storage');
          },
        };
      },
    });
  });
  const count = h.requests.length;
  const restored = await h.call('restore');
  expect(restored.status).toBe('storage-error');
  expect(restored.runtime).toBeNull();
  expect(restored.storageFailure).toBe('incompatible-storage');
  expect(restored.actions).toEqual([]);
  expect(h.requests.length).toBe(count);
  await h.evidence(restored);
});

test('R21 candidate/previous availability uses their own ages, never the active age', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  const a = await h.call('save');
  h.source('b');
  await page.evaluate(() => {
    window.recovery.now += 1000;
  });
  const b = await h.call('check');
  await page.evaluate(() => {
    window.recovery.now += 86400000;
  });
  const state = await h.call('guard');
  expect(state.reason).toBe('expired');
  expect(state.candidate?.eligible).toBe(true);
  expect(state.actions).toContain('activate');
  const active = await h.call('activate');
  expect(active.active?.key).toBe(b.candidate?.key);
  expect(active.previous?.key).toBe(a.active?.key);
  expect(active.previous?.eligible).toBe(false);
  expect(active.actions).not.toContain('rollback');
  const refused = await h.call('rollback');
  expect(refused.active?.key).toBe(active.active?.key);
  await h.evidence({ a, b, state, active, refused });
});

test('R22 clear during actual bundle put aborts the old transaction and cannot repopulate', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  await h.call('save');
  h.source('b');
  await page.evaluate(() => {
    const d = window.recovery;
    const original = IDBObjectStore.prototype.put;
    let once = true;
    IDBObjectStore.prototype.put = function (value, key) {
      const request =
        key === undefined ? original.call(this, value) : original.call(this, value, key);
      if (once && this.name === 'bundles') {
        once = false;
        // Invoke the controller while the old transaction is still active.
        d.pending = d.controller.clear();
        IDBObjectStore.prototype.put = original;
      }
      return request;
    };
  });
  const old = await h.call('check');
  const clear = await page.evaluate(() => window.recovery.pending!);
  const state = await h.snapshot();
  expect(old.status).toBe('aborted');
  expect(old.runtime).toBeNull();
  expect(clear.runtime).toBeNull();
  expect(state.bundles).toHaveLength(0);
  expect(state.control.activeKey).toBeNull();
  expect(state.control.clearEpoch).toBe(1);
  await h.evidence({ old, clear, state });
});

test('R23 hard 15s result includes a real transaction whose put acknowledgement never arrives', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  await page.clock.install();
  await page.evaluate(() => {
    const d = window.recovery;
    const original = IDBObjectStore.prototype.put;
    const realSetTimeout = window.setTimeout.bind(window);
    // Explicit watchdog noncooperation: delay only the store 5s watchdog,
    // leaving the independent controller 15s deadline real to the test clock.
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
      realSetTimeout(
        handler,
        timeout === 5000 ? 30000 : timeout,
        ...args,
      )) as typeof window.setTimeout;
    IDBObjectStore.prototype.put = function (value, key) {
      const request =
        key === undefined ? original.call(this, value) : original.call(this, value, key);
      if (this.name === 'control' && value.pendingRecheck !== null) {
        d.release = () => {
          IDBObjectStore.prototype.put = original;
          window.setTimeout = realSetTimeout;
        };
        return {} as IDBRequest<IDBValidKey>;
      }
      return request;
    };
    d.pending = d.controller.save();
  });
  await expect.poll(() => page.evaluate(() => Boolean(window.recovery.release))).toBe(true);
  await page.clock.runFor(15001);
  const result = await page.evaluate(() => window.recovery.pending!);
  expect(result.status).toBe('aborted');
  expect(result.reason).toBe('timeout');
  expect(result.runtime).toBeNull();
  expect(h.requests).toHaveLength(0);
  await page.evaluate(() => window.recovery.release!());
  const state = await h.snapshot();
  expect(state.control.pendingRecheck).not.toBeNull();
  await page.clock.runFor(15001);
  await h.evidence({ result, state });
});

for (const boundary of [
  'recordSafety',
  'completeRecheck',
  'saveCandidate',
  'activateCandidate',
] as const)
  test(
    'R14 abort after confirmed ' + boundary + ' preserves exactly its committed state',
    async ({ page }, info) => {
      const h = await controllerHarness(page, info);
      const a = await h.call('save');
      h.source('b');
      const result = await page.evaluate(async (boundary) => {
        const d = window.recovery;
        d.controller.dispose();
        const abort = new AbortController();
        d.controller = d.create({
          now: () => d.now,
          openStore: async (signal) => {
            const db = await d.open(signal);
            return {
              ...db,
              recordSafety: async (...args: Parameters<typeof db.recordSafety>) => {
                const value = await db.recordSafety(...args);
                if (boundary === 'recordSafety') abort.abort();
                return value;
              },
              completeRecheck: async (...args: Parameters<typeof db.completeRecheck>) => {
                const value = await db.completeRecheck(...args);
                if (boundary === 'completeRecheck') abort.abort();
                return value;
              },
              saveCandidate: async (...args: Parameters<typeof db.saveCandidate>) => {
                const value = await db.saveCandidate(...args);
                if (boundary === 'saveCandidate') abort.abort();
                return value;
              },
              activateCandidate: async (...args: Parameters<typeof db.activateCandidate>) => {
                const value = await db.activateCandidate(...args);
                if (boundary === 'activateCandidate') abort.abort();
                return value;
              },
            };
          },
        });
        return d.controller.save(abort.signal);
      }, boundary);
      expect(result.status).toBe('aborted');
      expect(result.runtime).toBeNull();
      const state = await h.snapshot();
      if (boundary === 'recordSafety') expect(state.control.pendingRecheck).not.toBeNull();
      else expect(state.control.pendingRecheck).toBeNull();
      if (boundary === 'saveCandidate') expect(state.control.candidateKey).not.toBeNull();
      else expect(state.control.candidateKey).toBeNull();
      if (boundary === 'activateCandidate') expect(state.control.activeKey).not.toBe(a.active?.key);
      else expect(state.control.activeKey).toBe(a.active?.key);
      await page.evaluate(() => {
        const d = window.recovery;
        d.controller.dispose();
        d.controller = d.create({ now: () => d.now });
      });
      const restarted = await h.call('guard');
      if (boundary === 'recordSafety') expect(restarted.runtime).toBeNull();
      if (boundary === 'activateCandidate')
        expect(restarted.active?.revision).toBe(h.fixtures.b.descriptor.releaseRevision);
      await h.evidence({ boundary, result, state, restarted });
    },
  );

test('R15 hard 15s result budget includes delayed preparation; no late fetch or commit', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  await h.call('save');
  const count = h.requests.length;
  await page.clock.install();
  await page.evaluate(() => {
    const d = window.recovery;
    d.controller.dispose();
    d.controller = d.create({
      now: () => d.now,
      openStore: async (signal) => {
        const db = await d.open(signal);
        return {
          ...db,
          prepareRecheck: async (...args: Parameters<typeof db.prepareRecheck>) => {
            const control = await db.prepareRecheck(...args);
            await new Promise<void>((resolve) => {
              d.release = resolve;
            });
            return control;
          },
        };
      },
    });
    d.pending = d.controller.check();
  });
  await expect.poll(() => page.evaluate(() => Boolean(window.recovery.release))).toBe(true);
  await page.clock.runFor(15001);
  const outcome = await page.evaluate(() => window.recovery.pending!);
  expect(outcome.status).toBe('aborted');
  expect(outcome.reason).toBe('timeout');
  expect(outcome.runtime).toBeNull();
  expect(h.requests.length).toBe(count);
  await page.evaluate(() => window.recovery.release!());
  const state = await h.snapshot();
  expect(state.control.pendingRecheck).not.toBeNull();
  const guard = await h.call('guard');
  expect(guard.status).not.toBe('busy');
  expect(guard.runtime).toBeNull();
  expect(h.requests.length).toBe(count);
  await h.evidence({ outcome, state, guard });
});

for (const end of ['abort', 'clear', 'deadline'] as const)
  test('R16 stored revalidation hash gate is fenced by ' + end, async ({ page }, info) => {
    const h = await controllerHarness(page, info);
    const a = await h.call('save');
    if (end === 'deadline') await page.clock.install();
    await page.evaluate((end) => {
      const d = window.recovery;
      const original = crypto.subtle.digest.bind(crypto.subtle);
      let first = true;
      let releaseHash!: () => void;
      crypto.subtle.digest = async (...args: Parameters<typeof crypto.subtle.digest>) => {
        const value = await original(...args);
        if (first) {
          first = false;
          await new Promise<void>((resolve) => {
            releaseHash = resolve;
          });
        }
        return value;
      };
      const abort = new AbortController();
      d.release = () => {
        crypto.subtle.digest = original;
        releaseHash();
      };
      d.seen = new Promise((resolve) => {
        const timer = setInterval(() => {
          if (releaseHash) {
            clearInterval(timer);
            resolve();
          }
        }, 0);
      });
      d.pending = d.controller.guard(abort.signal);
      if (end === 'abort') d.seen.then(() => abort.abort());
    }, end);
    await page.evaluate(() => window.recovery.seen!);
    let clear = null;
    if (end === 'clear') clear = await h.call('clear');
    if (end === 'deadline') await page.clock.runFor(15001);
    const late = await page.evaluate(() => window.recovery.pending!);
    expect(late.status).toBe('aborted');
    expect(late.runtime).toBeNull();
    await page.evaluate(() => window.recovery.release!());
    const state = await h.snapshot();
    if (end === 'clear') expect(state.bundles).toHaveLength(0);
    else expect(state.control.activeKey).toBe(a.active?.key);
    expect(late.confirmedWrites).toEqual([]);
    await h.evidence({ end, late, clear, state });
  });

test('R17 a generation change during metadata validation rejects the entire projection', async ({
  page,
  context,
}, info) => {
  const h = await controllerHarness(page, info);
  await h.call('save');
  const other = await context.newPage();
  const second = await controllerHarness(other, info);
  await page.evaluate(() => {
    const d = window.recovery;
    const original = crypto.subtle.digest.bind(crypto.subtle);
    let once = true;
    let seen!: () => void;
    d.seen = new Promise((resolve) => {
      seen = resolve;
    });
    crypto.subtle.digest = async (...args: Parameters<typeof crypto.subtle.digest>) => {
      const value = await original(...args);
      if (once) {
        once = false;
        await new Promise<void>((resolve) => {
          d.release = () => {
            crypto.subtle.digest = original;
            resolve();
          };
          seen();
        });
      }
      return value;
    };
    d.pending = d.controller.guard();
  });
  await page.evaluate(() => window.recovery.seen!);
  await second.call('clear');
  await page.evaluate(() => window.recovery.release!());
  const result = await page.evaluate(() => window.recovery.pending!);
  expect(result.status).toBe('stale-operation');
  expect(result.runtime).toBeNull();
  await h.evidence(result);
  await other.close();
});

test('R18 15s budget does not restart after preparation when content hashing stalls', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  await page.clock.install();
  await page.evaluate(() => {
    const d = window.recovery;
    d.controller.dispose();
    d.controller = d.create({
      now: () => d.now,
      openStore: async (signal) => {
        const db = await d.open(signal);
        return {
          ...db,
          prepareRecheck: async (...args: Parameters<typeof db.prepareRecheck>) => {
            const control = await db.prepareRecheck(...args);
            await new Promise<void>((resolve) => {
              d.release = resolve;
            });
            return control;
          },
        };
      },
    });
    d.pending = d.controller.save();
  });
  await expect.poll(() => page.evaluate(() => Boolean(window.recovery.release))).toBe(true);
  await page.clock.runFor(10000);
  await page.evaluate(() => {
    const d = window.recovery;
    const releasePreparation = d.release!;
    const original = crypto.subtle.digest.bind(crypto.subtle);
    let once = true;
    let seen!: () => void;
    d.seen = new Promise((resolve) => {
      seen = resolve;
    });
    crypto.subtle.digest = async (...args: Parameters<typeof crypto.subtle.digest>) => {
      const value = await original(...args);
      if (once) {
        once = false;
        await new Promise<void>((resolve) => {
          d.release = () => {
            crypto.subtle.digest = original;
            resolve();
          };
          seen();
        });
      }
      return value;
    };
    releasePreparation();
  });
  await page.evaluate(() => window.recovery.seen!);
  await page.clock.runFor(5001);
  const result = await page.evaluate(() => window.recovery.pending!);
  expect(result.status).toBe('aborted');
  expect(result.reason).toBe('timeout');
  expect(result.runtime).toBeNull();
  const before = h.requests.length;
  expect(before).toBe(2);
  await page.evaluate(() => window.recovery.release!());
  const state = await h.snapshot();
  expect(state.bundles).toHaveLength(0);
  expect(state.control.pendingRecheck).not.toBeNull();
  expect(h.requests.length).toBe(before);
  await h.evidence({ result, state });
});

test('R13 session A stays active when default B check stages a candidate without auto-save', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  const a = await h.call('restore');
  h.source('b');
  const b = await h.call('check');
  expect(b.runtime?.ready.descriptor.releaseRevision).toBe(a.active?.revision);
  expect(b.persistence).toBe('session-only');
  expect(b.active).toEqual(a.active);
  expect(b.candidate?.revision).toBe(h.fixtures.b.descriptor.releaseRevision);
  await h.evidence({ a, b });
});

test.beforeEach(async ({ page }, info) => {
  void page;
  test.skip(
    !['mobile-390x844', 'website-390x844'].includes(info.project.name),
    'Isolated real-IDB source harness, not a UI viewport test.',
  );
});

test('R01 default session restore and resume do not persist content or renew age', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  const restored = await h.call('restore');
  const count = h.requests.length;
  await page.evaluate(() => {
    window.recovery.now += 1000;
  });
  const guarded = await h.call('guard');
  const resumed = await h.call('resumeGuard');
  const db = await h.snapshot();
  expect(restored.status).toBe('session-only');
  expect(guarded.readAccess).toBe('allowed');
  expect(resumed.active).toEqual(restored.active);
  expect(resumed.active?.checkedAt).toBe(initialTime);
  expect(resumed.active?.expiresAt).toBe(initialTime + 86400000);
  expect(resumed.persistence).toBe('session-only');
  expect(h.requests.length).toBe(count);
  expect(db.bundles).toHaveLength(0);
  const frozen = await page.evaluate(async () => {
    const result = await window.recovery.controller.guard();
    const deep = (value: unknown): boolean =>
      value === null ||
      typeof value !== 'object' ||
      (Object.isFrozen(value) && Object.values(value).every(deep));
    return deep(result);
  });
  expect(frozen).toBe(true);
  await h.evidence({ restored, guarded, resumed, db, frozen });
});

test('R02 full default A/save/repeat B/stage/restart/activate/rollback returns one active identity', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  const a = await h.call('save');
  await page.evaluate(() => {
    window.recovery.now += 1000;
  });
  const repeat = await h.call('save');
  h.source('b');
  await page.evaluate(() => {
    window.recovery.now += 1000;
  });
  const b = await h.call('check');
  expect(b.runtime?.ready.descriptor.releaseRevision).toBe(h.fixtures.a.descriptor.releaseRevision);
  expect(b.active).toEqual(repeat.active);
  expect(b.candidate?.revision).toBe(h.fixtures.b.descriptor.releaseRevision);
  expect(b.candidate?.eligible).toBe(true);
  expect(b.previous).toBeNull();
  expect(b.actions).not.toContain('rollback');
  await page.evaluate(() => {
    const d = window.recovery;
    d.controller.dispose();
    d.controller = d.create({ now: () => d.now });
  });
  const restarted = await h.call('guard');
  expect(restarted.candidate).toEqual(b.candidate);
  const activated = await h.call('activate');
  expect(activated.active?.key).toBe(b.candidate?.key);
  expect(activated.previous?.key).toBe(repeat.active?.key);
  expect(activated.runtime?.ready.descriptor.releaseRevision).toBe(
    h.fixtures.b.descriptor.releaseRevision,
  );
  await page.evaluate(() => {
    const d = window.recovery;
    d.controller.dispose();
    d.controller = d.create({ now: () => d.now });
  });
  const beforeRollback = await h.call('guard');
  expect(beforeRollback.previous).toEqual(activated.previous);
  const rollback = await h.call('rollback');
  expect(rollback.active).toEqual(repeat.active);
  expect(rollback.runtime?.ready.descriptor.releaseRevision).toBe(
    h.fixtures.a.descriptor.releaseRevision,
  );
  expect(rollback.previous?.revision).toBe(h.fixtures.b.descriptor.releaseRevision);
  await h.evidence({ a, repeat, b, restarted, activated, beforeRollback, rollback });
});

test('R03 repeat save of A never activates an unrelated existing B candidate or previous', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  const a = await h.call('save');
  h.source('b');
  const staged = await h.call('check');
  h.source('a');
  const repeated = await h.call('save');
  expect(repeated.active?.key).toBe(a.active?.key);
  expect(repeated.runtime?.ready.descriptor.releaseRevision).toBe(a.active?.revision);
  expect(repeated.candidate?.key).toBe(staged.candidate?.key);
  const activated = await h.call('activate');
  const repeatedPrevious = await h.call('save');
  expect(repeatedPrevious.active?.key).toBe(activated.active?.key);
  expect(repeatedPrevious.runtime?.ready.descriptor.releaseRevision).toBe(
    activated.active?.revision,
  );
  expect(repeatedPrevious.previous?.key).toBe(a.active?.key);
  expect(repeatedPrevious.candidate).toBeNull();
  await h.evidence({ a, staged, repeated, activated, repeatedPrevious });
});

test('R04 restored stored A needs no content request while expired/missing A cannot fake success', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  const saved = await h.call('save');
  h.offline();
  const count = h.requests.length;
  await page.evaluate(() => {
    const d = window.recovery;
    d.controller.dispose();
    d.controller = d.create({ now: () => d.now });
  });
  const restored = await h.call('restore');
  expect(restored.active).toEqual(saved.active);
  expect(restored.persistence).toBe('stored');
  expect(h.requests.length).toBe(count);
  await page.evaluate(() => {
    window.recovery.now += 86400001;
  });
  const expired = await h.call('restore');
  expect(expired.reason).toBe('expired');
  expect(expired.runtime).toBeNull();
  expect(h.requests.length).toBe(count);
  await h.call('clear');
  const missing = await h.call('restore');
  expect(missing.runtime).toBeNull();
  expect(missing.readAccess).not.toBe('allowed');
  await h.evidence({ saved, restored, expired, missing });
});

for (const idbOff of [false, true])
  test('R05 session TTL and observed backward clock, IDB-off=' + idbOff, async ({ page }, info) => {
    const h = await controllerHarness(page, info);
    if (idbOff)
      await page.evaluate(() =>
        Object.defineProperty(window, 'indexedDB', { configurable: true, value: undefined }),
      );
    const restored = await h.call('restore');
    expect(restored.readAccess).toBe('allowed');
    const count = h.requests.length;
    await page.evaluate(() => {
      window.recovery.now += 86400000;
    });
    const edge = await h.call('resumeGuard');
    expect(edge.readAccess).toBe('allowed');
    expect(edge.active).toEqual(restored.active);
    await page.evaluate(() => {
      window.recovery.now++;
    });
    const expired = await h.call('guard');
    expect(expired.reason).toBe('expired');
    expect(expired.runtime).toBeNull();
    await page.evaluate(() => {
      window.recovery.now -= 2000;
    });
    const backwards = await h.call('guard');
    expect(backwards.reason).toBe('clock-regressed');
    expect(backwards.runtime).toBeNull();
    expect(h.requests.length).toBe(count);
    await h.evidence({ restored, edge, expired, backwards });
  });

test('R06 B semantic content failure completes safety but never refreshes A age', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  const a = await h.call('save');
  h.source('b', true);
  await page.evaluate(() => {
    window.recovery.now += 1000;
  });
  const b = await h.call('check');
  expect(b.failure).toBe('transport-or-validation');
  expect(b.readAccess).toBe('allowed');
  expect(b.active).toEqual(a.active);
  expect(b.runtime?.ready.descriptor.releaseRevision).toBe(a.active?.revision);
  expect(b.control.pendingRecheck).toBeNull();
  expect(b.candidate).toBeNull();
  await h.evidence({ a, b });
});

test('R07 C semantic partial failure beats clear and fresh-controller A restore', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  await h.call('save');
  h.source('c', true);
  const c = await h.call('check');
  expect(c.runtime).toBeNull();
  expect(c.control.safetyFloor).toBe(2);
  expect((await h.snapshot()).bundles).toHaveLength(0);
  const clear = await h.call('clear');
  h.source('a');
  const restored = await h.call('restore');
  await page.evaluate(() => {
    const d = window.recovery;
    d.controller.dispose();
    d.controller = d.create({ now: () => d.now });
  });
  const restart = await h.call('restore');
  expect(restored.runtime).toBeNull();
  expect(restart.runtime).toBeNull();
  expect(restart.control.safetyFloor).toBe(2);
  await h.evidence({ c, clear, restored, restart });
});

test('R08 actual C ledger-write quota fault preserves pending across restart', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  await h.call('save');
  h.source('c', true);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, key) {
      if (this.name === 'control' && value.safety?.floor === 2)
        throw new DOMException('test quota', 'QuotaExceededError');
      return key === undefined ? original.call(this, value) : original.call(this, value, key);
    };
    window.recovery.release = () => {
      IDBObjectStore.prototype.put = original;
    };
  });
  const failed = await h.call('check');
  expect(failed.reason).toBe('safety-write-failed');
  expect(failed.runtime).toBeNull();
  expect(failed.control.safetyFloor).toBe(2);
  const pending = await h.snapshot();
  expect(pending.control.pendingRecheck).not.toBeNull();
  expect(pending.control.safety.floor).toBe(1);
  await page.evaluate(() => {
    const d = window.recovery;
    d.release!();
    d.controller.dispose();
    d.controller = d.create({ now: () => d.now });
  });
  h.source('a');
  const count = h.requests.length;
  const restart = await h.call('restore');
  expect(restart.reason).toBe('pending-recheck');
  expect(restart.runtime).toBeNull();
  expect(h.requests.length).toBe(count);
  h.source('c', true);
  const recovery = await h.call('check');
  expect(recovery.control.safetyFloor).toBe(2);
  expect(recovery.control.pendingRecheck).toBeNull();
  await h.evidence({ failed, pending, restart, recovery });
});

for (const fault of ['abort', 'quota', 'timeout'] as const)
  test('R09 preparation ' + fault + ' starts zero content requests', async ({ page }, info) => {
    const h = await controllerHarness(page, info);
    await h.call('save');
    const count = h.requests.length;
    const failed = await page.evaluate(async (fault) => {
      const original = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (value, key) {
        if (this.name === 'control' && value.pendingRecheck !== null) {
          if (fault === 'quota') throw new DOMException('test quota', 'QuotaExceededError');
          const request =
            key === undefined ? original.call(this, value) : original.call(this, value, key);
          if (fault === 'abort') {
            this.transaction.abort();
            return request;
          }
          // Real put, deliberately swallowed acknowledgement; the 5s store watchdog must settle.
          return {} as IDBRequest<IDBValidKey>;
        }
        return key === undefined ? original.call(this, value) : original.call(this, value, key);
      };
      try {
        return await window.recovery.controller.check();
      } finally {
        IDBObjectStore.prototype.put = original;
      }
    }, fault);
    expect(h.requests.length).toBe(count);
    expect(failed.runtime).toBeNull();
    expect(failed.confirmedWrites).not.toContain('prepare-recheck');
    const state = await h.snapshot();
    if (fault === 'timeout') expect(state.control.pendingRecheck).not.toBeNull();
    else expect(state.control.pendingRecheck).toBeNull();
    await h.evidence({ failed, fault, state });
  });

test('R10 clear at default payload gate cancels stale work and preserves pending obligation', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  await h.call('save');
  h.source('b');
  const gate = h.hold('supplemental-items.json');
  await page.evaluate(() => {
    const d = window.recovery;
    d.pending = d.controller.check();
  });
  await gate.seen;
  const cleared = await h.call('clear');
  gate.release();
  const late = await page.evaluate(() => window.recovery.pending!);
  const after = await h.snapshot();
  expect(late.status).toBe('aborted');
  expect(late.runtime).toBeNull();
  expect(cleared.runtime).toBeNull();
  expect(after.bundles).toHaveLength(0);
  expect(after.control.pendingRecheck).not.toBeNull();
  expect(after.control.clearEpoch).toBe(1);
  await h.evidence({ cleared, late, after });
});

for (const action of ['clear', 'safety'] as const)
  test(
    'R11 second real controller tab ' + action + ' is authoritative at reader/resume',
    async ({ page, context }, info) => {
      const h = await controllerHarness(page, info);
      await h.call('save');
      const other = await context.newPage();
      const h2 = await controllerHarness(other, info);
      if (action === 'clear') await h2.call('clear');
      else {
        h2.source('c', true);
        await h2.call('check');
      }
      const count = h.requests.length;
      const guard = await h.call('guard');
      const resume = await h.call('resumeGuard');
      expect(guard.runtime).toBeNull();
      expect(resume.runtime).toBeNull();
      expect(h.requests.length).toBe(count);
      if (action === 'safety') expect(guard.control.safetyFloor).toBe(2);
      else expect(guard.control.clearEpoch).toBe(1);
      await h.evidence({ guard, resume });
      await h2.evidence({ other: await h2.snapshot() });
      await other.close();
    },
  );

test('R12 late open after dispose closes connection and settles before injected open resolves', async ({
  page,
}, info) => {
  const h = await controllerHarness(page, info);
  await page.evaluate(() => {
    const d = window.recovery;
    d.controller.dispose();
    d.controller = d.create({
      now: () => d.now,
      openStore: async () => {
        const db = await d.open();
        await new Promise<void>((resolve) => {
          d.release = resolve;
        });
        return {
          ...db,
          close: () => {
            d.events.push('closed');
            db.close();
          },
        };
      },
    });
    d.pending = d.controller.restore();
  });
  await expect.poll(() => page.evaluate(() => Boolean(window.recovery.release))).toBe(true);
  const result = await page.evaluate(async () => {
    const d = window.recovery;
    d.controller.dispose();
    return d.pending!;
  });
  expect(result.status).toBe('disposed');
  expect(result.runtime).toBeNull();
  expect(h.requests).toHaveLength(0);
  await page.evaluate(() => window.recovery.release!());
  await expect.poll(() => page.evaluate(() => window.recovery.events)).toEqual(['closed']);
  await page.evaluate(() => {
    window.recovery.events = [];
  });
  await h.evidence(result);
});
