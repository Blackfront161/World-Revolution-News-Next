import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createMobileContentOfflineController,
  type ContentOfflineControllerResult,
} from './content-offline-controller';

const keys = [
  'status',
  'readAccess',
  'reason',
  'runtime',
  'persistence',
  'active',
  'candidate',
  'previous',
  'control',
  'guard',
  'actions',
  'storageFailure',
  'failure',
  'confirmedWrites',
  'checkedAt',
  'revision',
  'activeRevision',
  'candidateRevision',
  'previousRevision',
].sort();
function complete(result: ContentOfflineControllerResult) {
  expect(Object.keys(result).sort()).toEqual(keys);
  expect(Object.values(result)).not.toContain(undefined);
  expect(Object.isFrozen(result)).toBe(true);
  expect(Object.isFrozen(result.actions)).toBe(true);
  expect(Object.isFrozen(result.control)).toBe(true);
}
afterEach(() => {
  vi.useRealTimers();
});
describe('mobile UI-neutral controller result and lifecycle contract', () => {
  it('every public async action returns the same complete immutable nullable projection', async () => {
    // jsdom has no IndexedDB; source responses still use the actual bounded default loader.
    const controller = createMobileContentOfflineController();
    for (const action of [
      'restore',
      'save',
      'check',
      'guard',
      'resumeGuard',
      'activate',
      'rollback',
      'clear',
    ] as const) {
      const value = await controller[action]();
      complete(value);
      if (action === 'restore') expect(value.readAccess).toBe('allowed');
      if (action === 'save') {
        expect(value.status).toBe('storage-error');
        expect(value.persistence).toBe('session-only');
      }
    }
    controller.dispose();
    const disposed = await controller.guard();
    complete(disposed);
    expect(disposed.status).toBe('disposed');
    expect(disposed.runtime).toBeNull();
  });
  it('a pre-aborted operation does not open a database or invoke source loading', async () => {
    const openStore = vi.fn();
    const check = vi.fn();
    const controller = createMobileContentOfflineController({ openStore, check });
    const abort = new AbortController();
    abort.abort();
    const value = await controller.restore(abort.signal);
    complete(value);
    expect(value.status).toBe('aborted');
    expect(openStore).not.toHaveBeenCalled();
    expect(check).not.toHaveBeenCalled();
    controller.dispose();
  });
  it('restore owns the slot and hard-settles at 15s even when open ignores abort', async () => {
    vi.useFakeTimers();
    const controller = createMobileContentOfflineController({
      openStore: () => new Promise(() => undefined),
    });
    const pending = controller.restore();
    const busy = await controller.guard();
    complete(busy);
    expect(busy.status).toBe('busy');
    expect(busy.runtime).toBeNull();
    expect(busy.actions).toEqual([]);
    await vi.advanceTimersByTimeAsync(15001);
    const expired = await pending;
    complete(expired);
    expect(expired.reason).toBe('timeout');
    const next = controller.guard();
    controller.dispose();
    expect((await next).status).toBe('disposed');
  });
  it('dispose consumes a late rejected open and does not retry', async () => {
    let reject!: (error: Error) => void;
    const openStore = vi.fn(
      () =>
        new Promise<never>((_, fail) => {
          reject = fail;
        }),
    );
    const controller = createMobileContentOfflineController({ openStore });
    const pending = controller.restore();
    controller.dispose();
    expect((await pending).status).toBe('disposed');
    reject(new Error('injected late open'));
    await Promise.resolve();
    await Promise.resolve();
    expect(openStore).toHaveBeenCalledTimes(1);
  });
});
