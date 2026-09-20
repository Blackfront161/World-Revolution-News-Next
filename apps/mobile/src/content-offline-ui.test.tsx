import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  createMobileContentOfflineController,
  type ContentOfflineControllerResult,
} from './content-offline-controller';
import { createContentOfflineUiSession, useContentOfflineController } from './content-offline-ui';

vi.mock('./content-offline-controller', () => ({
  createMobileContentOfflineController: vi.fn(),
}));
const snapshot = (status = 'active') => ({ status }) as ContentOfflineControllerResult;
function deferred() {
  let resolve!: (result: ContentOfflineControllerResult) => void;
  const promise = new Promise<ContentOfflineControllerResult>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function controller() {
  return {
    restore: vi.fn(async () => snapshot()),
    save: vi.fn(async () => snapshot()),
    check: vi.fn(async () => snapshot()),
    activate: vi.fn(async () => snapshot()),
    rollback: vi.fn(async () => snapshot()),
    clear: vi.fn(async () => snapshot('unavailable')),
    guard: vi.fn(async () => snapshot()),
    resumeGuard: vi.fn(async () => snapshot()),
    dispose: vi.fn(),
  };
}

describe('mount-bound UI ownership (no storage or safety policy)', () => {
  it('reserves an idle guard synchronously against a same-event write', async () => {
    const api = controller();
    const held = deferred();
    api.guard.mockImplementation(() => held.promise);
    const session = createContentOfflineUiSession(api, vi.fn(), vi.fn());
    const guarded = session.invoke('guard');
    expect(await session.invoke('save')).toBeNull();
    expect(api.save).not.toHaveBeenCalled();
    held.resolve(snapshot());
    await guarded;
  });
  it('does not invalidate a save when a competing user action is refused', async () => {
    const api = controller();
    const held = deferred();
    api.save.mockImplementation(() => held.promise);
    const publish = vi.fn();
    const changed = vi.fn();
    const session = createContentOfflineUiSession(api, publish, changed);
    const saved = session.invoke('save');
    expect(await session.invoke('check')).toBeNull();
    expect(api.check).not.toHaveBeenCalled();
    expect(changed.mock.calls).toEqual([['save']]);
    held.resolve(snapshot());
    await saved;
    expect(publish).toHaveBeenCalledTimes(1);
    expect(changed.mock.calls).toEqual([['save'], [null]]);
  });
  it('coalesces guarded navigation behind restore and does not retry a source operation', async () => {
    const api = controller();
    const held = deferred();
    api.restore.mockImplementation(() => held.promise);
    const session = createContentOfflineUiSession(api, vi.fn(), vi.fn());
    const restored = session.invoke('restore');
    const one = session.invoke('guard');
    const two = session.invoke('resumeGuard');
    expect(one).toBe(two);
    expect(api.guard).not.toHaveBeenCalled();
    held.resolve(snapshot());
    await Promise.all([restored, one, two]);
    expect(api.restore).toHaveBeenCalledTimes(1);
    expect(api.guard).toHaveBeenCalledTimes(1);
    expect(api.resumeGuard).not.toHaveBeenCalled();
  });
  it('clear invalidates a queued guard and an older running publication', async () => {
    const api = controller();
    const held = deferred();
    api.check.mockImplementation(() => held.promise);
    const publish = vi.fn();
    const session = createContentOfflineUiSession(api, publish, vi.fn());
    const checked = session.invoke('check');
    const guarded = session.invoke('guard');
    await session.invoke('clear');
    held.resolve(snapshot());
    expect(await checked).toBeNull();
    expect(await guarded).toBeNull();
    expect(api.guard).not.toHaveBeenCalled();
    expect(publish.mock.calls.map((call) => call[1])).toEqual(['clear']);
  });
  it('StrictMode owns distinct controllers and discards late results after cleanup and real remount', async () => {
    const instances: ReturnType<typeof controller>[] = [];
    const held: ReturnType<typeof deferred>[] = [];
    vi.mocked(createMobileContentOfflineController).mockImplementation(() => {
      const api = controller();
      const pending = deferred();
      api.restore.mockImplementation(() => pending.promise);
      instances.push(api);
      held.push(pending);
      return api;
    });
    const first = renderHook(() => useContentOfflineController(true), { reactStrictMode: true });
    expect(instances).toHaveLength(2);
    expect(instances[0]!.dispose).toHaveBeenCalledTimes(1);
    await act(async () => {
      held[0]!.resolve(snapshot('disposed'));
    });
    expect(first.result.current.operation).toBe('restore');
    expect(first.result.current.result).toBeNull();
    first.unmount();
    expect(instances[1]!.dispose).toHaveBeenCalledTimes(1);
    const second = renderHook(() => useContentOfflineController(true), { reactStrictMode: true });
    expect(instances).toHaveLength(4);
    await act(async () => {
      held[1]!.resolve(snapshot());
    });
    expect(second.result.current.result).toBeNull();
    await act(async () => {
      held[3]!.resolve(snapshot());
    });
    expect(second.result.current.result?.status).toBe('active');
    expect(second.result.current.operation).toBeNull();
    second.unmount();
    expect(instances[3]!.dispose).toHaveBeenCalledTimes(1);
  });
});
