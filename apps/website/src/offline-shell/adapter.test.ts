import { describe, expect, it } from 'vitest';
import {
  createWebsiteShellAdapter,
  type WebsiteShellPlatform,
  type WebsiteShellStatus,
} from './adapter';

describe('website shell adapter contract', () => {
  it('keeps a pending update return bound to its platform result while refreshing the snapshot', async () => {
    const pending: WebsiteShellStatus = {
      kind: 'pending',
      operation: 'update',
      epoch: 1,
      controlled: true,
    };
    const active: WebsiteShellStatus = {
      kind: 'active',
      shellId: 'a'.repeat(64),
      epoch: 1,
      controlled: true,
    };
    const calls: string[] = [];
    const adapter = createWebsiteShellAdapter({
      observe: async () => active,
      operate: async (operation, epoch) => {
        calls.push(operation + ':' + epoch);
        return pending;
      },
      subscribe: () => () => undefined,
      dispose: () => undefined,
    });

    await adapter.refresh();
    const result = await adapter.update();

    expect(calls).toEqual(['update:1']);
    expect(result).toBe(pending);
    expect(result).toMatchObject({ kind: 'pending', operation: 'update', epoch: 1 });
    expect(adapter.getSnapshot()).toBe(active);
    adapter.dispose();
  });

  it('does not reinterpret a pending update as a later observed error', async () => {
    const pending: WebsiteShellStatus = {
      kind: 'pending',
      operation: 'update',
      epoch: 1,
      controlled: true,
    };
    const active: WebsiteShellStatus = {
      kind: 'active',
      shellId: 'a'.repeat(64),
      epoch: 1,
      controlled: true,
    };
    const observedError: WebsiteShellStatus = {
      kind: 'error',
      code: 'incomplete',
      epoch: 1,
      controlled: true,
    };
    let operationStarted = false;
    const adapter = createWebsiteShellAdapter({
      observe: async () => (operationStarted ? observedError : active),
      operate: async () => {
        operationStarted = true;
        return pending;
      },
      subscribe: () => () => undefined,
      dispose: () => undefined,
    });

    await adapter.refresh();
    const result = await adapter.update();

    expect(result).toBe(pending);
    expect(adapter.getSnapshot()).toBe(observedError);
    adapter.dispose();
  });

  it('keeps direct error, waiting, active, enable, and remove results faithful', async () => {
    const active: WebsiteShellStatus = {
      kind: 'active',
      shellId: 'a'.repeat(64),
      epoch: 1,
      controlled: true,
    };
    const error: WebsiteShellStatus = {
      kind: 'error',
      code: 'operation-failed',
      epoch: 1,
      controlled: true,
    };
    const waiting: WebsiteShellStatus = {
      kind: 'waiting',
      shellId: 'a'.repeat(64),
      waitingShellId: 'b'.repeat(64),
      epoch: 1,
      controlled: true,
    };
    const saved: WebsiteShellStatus = {
      kind: 'saved',
      shellId: 'b'.repeat(64),
      epoch: 1,
      controlled: false,
    };
    const removed: WebsiteShellStatus = { kind: 'removed', epoch: 1, controlled: false };
    const results = [error, waiting, active, saved, removed];
    const adapter = createWebsiteShellAdapter({
      observe: async () => active,
      operate: async () => results.shift()!,
      subscribe: () => () => undefined,
      dispose: () => undefined,
    });

    await adapter.refresh();
    const failed = await adapter.update();
    await adapter.refresh();
    const queued = await adapter.update();
    const unchanged = await adapter.update();
    const enabled = await adapter.enable();
    const removedResult = await adapter.remove();

    expect(failed).toBe(error);
    expect(queued).toBe(waiting);
    expect(unchanged).toBe(active);
    expect(enabled).toBe(saved);
    expect(removedResult).toBe(removed);
    adapter.dispose();
  });

  it('does not start a second platform operation for a double click', async () => {
    let finish: ((value: WebsiteShellStatus) => void) | undefined;
    const calls: string[] = [];
    const adapter = createWebsiteShellAdapter({
      observe: async () => ({
        kind: 'active',
        shellId: 'a'.repeat(64),
        epoch: 1,
        controlled: true,
      }),
      operate: (operation) =>
        new Promise((resolve) => {
          calls.push(operation);
          finish = resolve;
        }),
      subscribe: () => () => undefined,
      dispose: () => undefined,
    });

    await adapter.refresh();
    const first = adapter.update();
    const second = adapter.update();
    finish?.({ kind: 'waiting', waitingShellId: 'b'.repeat(64), epoch: 1, controlled: true });

    expect((await second).kind).toBe('pending');
    expect((await first).kind).toBe('waiting');
    expect(calls).toEqual(['update']);
    adapter.dispose();
  });

  it('keeps an operation exception as an operation failure', async () => {
    const adapter = createWebsiteShellAdapter({
      observe: async () => ({
        kind: 'active',
        shellId: 'a'.repeat(64),
        epoch: 1,
        controlled: true,
      }),
      operate: async () => {
        throw new Error('platform failure');
      },
      subscribe: () => () => undefined,
      dispose: () => undefined,
    });

    await adapter.refresh();
    await expect(adapter.update()).resolves.toMatchObject({
      kind: 'error',
      code: 'operation-failed',
    });
    adapter.dispose();
  });

  it('keeps an indeterminate update outcome separate from shell readiness and never auto-retries', async () => {
    const active: WebsiteShellStatus = {
      kind: 'active',
      shellId: 'a'.repeat(64),
      epoch: 1,
      controlled: true,
    };
    const indeterminate = Object.freeze({
      ...active,
      outcome: Object.freeze({
        kind: 'indeterminate' as const,
        operation: 'update' as const,
        epoch: 1,
        code: 'native-outcome-unbound' as const,
      }),
    });
    const succeeded = Object.freeze({
      ...active,
      outcome: Object.freeze({
        kind: 'succeeded' as const,
        operation: 'update' as const,
        epoch: 1,
      }),
    });
    let calls = 0;
    const adapter = createWebsiteShellAdapter({
      observe: async () => active,
      operate: async () => (++calls === 1 ? indeterminate : succeeded),
      subscribe: () => () => undefined,
      dispose: () => undefined,
    });

    await adapter.refresh();
    const first = await adapter.update();
    await Promise.resolve();

    expect(first).toBe(indeterminate);
    expect(first).toMatchObject({
      kind: 'active',
      outcome: {
        kind: 'indeterminate',
        operation: 'update',
        code: 'native-outcome-unbound',
      },
    });
    expect(adapter.getSnapshot()).toEqual(active);
    expect(adapter.getSnapshot()).not.toHaveProperty('outcome');
    expect(calls).toBe(1);

    const second = await adapter.update();
    expect(second).toBe(succeeded);
    expect(adapter.getSnapshot()).toEqual(active);
    expect(calls).toBe(2);
    adapter.dispose();
  });

  it('keeps a known operation failure failed while exposing only readiness after reload', async () => {
    const active: WebsiteShellStatus = {
      kind: 'active',
      shellId: 'a'.repeat(64),
      epoch: 1,
      controlled: true,
    };
    const failed = Object.freeze({
      kind: 'error' as const,
      code: 'incomplete' as const,
      epoch: 1,
      controlled: true,
      outcome: Object.freeze({
        kind: 'failed' as const,
        operation: 'update' as const,
        epoch: 1,
        code: 'incomplete' as const,
      }),
    });
    const adapter = createWebsiteShellAdapter({
      observe: async () => active,
      operate: async () => failed,
      subscribe: () => () => undefined,
      dispose: () => undefined,
    });

    await adapter.refresh();
    const result = await adapter.update();

    expect(result).toBe(failed);
    expect(result).toMatchObject({
      kind: 'error',
      outcome: { kind: 'failed', code: 'incomplete' },
    });
    expect(adapter.getSnapshot()).toMatchObject({ kind: 'error', code: 'incomplete' });
    expect(adapter.getSnapshot()).not.toHaveProperty('outcome');
    adapter.dispose();

    const reloaded = createWebsiteShellAdapter({
      observe: async () => active,
      operate: async () => active,
      subscribe: () => () => undefined,
      dispose: () => undefined,
    });
    await reloaded.refresh();
    expect(reloaded.getSnapshot()).toEqual(active);
    expect(reloaded.getSnapshot()).not.toHaveProperty('outcome');
    reloaded.dispose();
  });

  it('reserves a click before initial observation and disposal prevents the deferred write', async () => {
    const reads: Array<(value: WebsiteShellStatus) => void> = [];
    const calls: string[] = [];
    const adapter = createWebsiteShellAdapter({
      observe: () =>
        new Promise((resolve) => {
          reads.push(resolve);
        }),
      operate: async (kind) => {
        calls.push(kind);
        return { kind: 'saved', epoch: 1, controlled: false };
      },
      subscribe: () => () => undefined,
      dispose: () => undefined,
    });
    const first = adapter.enable();
    const second = adapter.enable();
    adapter.dispose();
    for (const resolve of reads) resolve({ kind: 'uncontrolled', epoch: null, controlled: false });
    await Promise.all([first, second]);
    expect(calls).toEqual([]);
  });

  it('a concurrent public observation cannot suppress the confirmed operation end state', async () => {
    let finish: ((value: WebsiteShellStatus) => void) | undefined;
    const adapter = createWebsiteShellAdapter({
      observe: async () => ({ kind: 'uncontrolled', epoch: null, controlled: false }),
      operate: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
      subscribe: () => () => undefined,
      dispose: () => undefined,
    });
    await adapter.refresh();
    const action = adapter.enable();
    await adapter.refresh();
    finish?.({ kind: 'saved', epoch: 1, shellId: 'a'.repeat(64), controlled: false });
    await action;
    expect(adapter.getSnapshot().kind).toBe('saved');
    adapter.dispose();
  });
  it('is observational until explicit action, preserves epoch, and distinguishes unhandled readiness', async () => {
    const calls: string[] = [];
    const platform: WebsiteShellPlatform = {
      observe: async () => ({ kind: 'uncontrolled', epoch: null, controlled: false }),
      operate: async (operation, epoch) => {
        calls.push(operation + ':' + epoch);
        return { kind: 'saved', epoch: 1, shellId: 'a'.repeat(64), controlled: false };
      },
      subscribe: () => () => undefined,
      dispose: () => {
        calls.push('dispose');
      },
    };
    const adapter = createWebsiteShellAdapter(platform);
    await adapter.refresh();
    expect(adapter.getSnapshot().kind).toBe('uncontrolled');
    expect(calls).toEqual([]);
    await adapter.enable();
    expect(calls).toEqual(['enable:null']);
    expect(adapter.getSnapshot()).toMatchObject({ kind: 'saved', controlled: false, epoch: 1 });
    await adapter.update();
    expect(calls).toContain('update:1');
    adapter.dispose();
    await adapter.remove();
    expect(calls).toEqual(['enable:null', 'update:1', 'dispose']);
  });

  it('suppresses stale observations and late publications after disposal', async () => {
    let resolve: ((status: WebsiteShellStatus) => void) | undefined;
    let observations = 0;
    let unsubscribed = 0;
    let notifications = 0;
    const adapter = createWebsiteShellAdapter({
      observe: () =>
        ++observations === 1
          ? new Promise((done) => {
              resolve = done;
            })
          : Promise.resolve({ kind: 'removed', epoch: 3, controlled: true }),
      operate: async () => ({ kind: 'pending', operation: 'remove', epoch: 3, controlled: true }),
      subscribe: () => () => {
        unsubscribed++;
      },
      dispose: () => undefined,
    });
    adapter.subscribe(() => {
      notifications++;
    });
    await adapter.refresh();
    resolve?.({ kind: 'active', shellId: 'a'.repeat(64), epoch: 1, controlled: true });
    await Promise.resolve();
    expect(adapter.getSnapshot().kind).toBe('removed');
    expect(notifications).toBe(1);
    adapter.dispose();
    expect(unsubscribed).toBe(1);
    await adapter.refresh();
    expect(notifications).toBe(1);
  });
});
