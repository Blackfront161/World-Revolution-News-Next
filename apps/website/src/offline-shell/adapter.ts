import { createBrowserWebsiteShellPlatform } from './browser-platform';

export type WebsiteShellOperation = 'enable' | 'update' | 'remove';
export type WebsiteShellFailureCode =
  | 'unsupported'
  | 'storage'
  | 'protected'
  | 'budget'
  | 'incomplete'
  | 'stale'
  | 'operation-failed'
  | 'disposed';
export type WebsiteShellStatus = Readonly<{
  kind:
    | 'initializing'
    | 'uncontrolled'
    | 'saved'
    | 'active'
    | 'waiting'
    | 'pending'
    | 'removed'
    | 'protected'
    | 'error';
  epoch: number | null;
  controlled: boolean;
  shellId?: string;
  waitingShellId?: string;
  operation?: WebsiteShellOperation;
  code?: WebsiteShellFailureCode;
}>;
export type WebsiteShellOperationOutcome =
  | Readonly<{
      kind: 'running' | 'succeeded';
      operation: WebsiteShellOperation;
      epoch: number | null;
    }>
  | Readonly<{
      kind: 'failed';
      operation: WebsiteShellOperation;
      epoch: number | null;
      code: WebsiteShellFailureCode;
    }>
  | Readonly<{
      kind: 'indeterminate';
      operation: 'update';
      epoch: number | null;
      code: 'native-outcome-unbound';
    }>;
/** The top-level fields are current readiness. `outcome` describes only this
 * direct attempt and is deliberately absent from observable snapshots. */
export type WebsiteShellOperationResult = WebsiteShellStatus &
  Readonly<{ outcome?: WebsiteShellOperationOutcome }>;
export type WebsiteShellPlatform = Readonly<{
  observe: () => Promise<WebsiteShellStatus>;
  operate: (
    operation: WebsiteShellOperation,
    expectedEpoch: number | null,
  ) => Promise<WebsiteShellOperationResult>;
  subscribe: (listener: () => void) => () => void;
  dispose: () => void;
}>;
export type WebsiteShellAdapter = Readonly<{
  getSnapshot: () => WebsiteShellStatus;
  subscribe: (listener: () => void) => () => void;
  refresh: () => Promise<WebsiteShellStatus>;
  enable: () => Promise<WebsiteShellOperationResult>;
  update: () => Promise<WebsiteShellOperationResult>;
  remove: () => Promise<WebsiteShellOperationResult>;
  dispose: () => void;
}>;

/** UI-neutral default assembly. No registration/cache creation before enable.
 * remove() is the confirmed action; the consumer owns only its confirmation UI.
 * dispose() suppresses publications, never cancels an already durable operation. */
export function createWebsiteShellAdapter(
  platform: WebsiteShellPlatform = createBrowserWebsiteShellPlatform(),
): WebsiteShellAdapter {
  let snapshot: WebsiteShellStatus = Object.freeze({
    kind: 'initializing',
    epoch: null,
    controlled: false,
  });
  let disposed = false;
  let serial = 0;
  let busy = false;
  const listeners = new Set<() => void>();
  const readinessOf = (result: WebsiteShellOperationResult): WebsiteShellStatus => {
    const { outcome, ...readiness } = result;
    void outcome;
    return readiness;
  };
  const publish = (next: WebsiteShellStatus, ticket: number) => {
    if (!disposed && ticket === serial) {
      snapshot = Object.freeze(next);
      for (const listener of listeners) listener();
    }
    return snapshot;
  };
  const observe = async () => {
    if (disposed) return snapshot;
    const ticket = ++serial;
    try {
      return publish(await platform.observe(), ticket);
    } catch {
      return publish({ ...snapshot, kind: 'error', code: 'storage' }, ticket);
    }
  };
  const refresh = async () => (busy ? snapshot : observe());
  const unsubscribe = platform.subscribe(() => {
    if (!busy) void refresh();
  });
  const operation = async (kind: WebsiteShellOperation) => {
    if (disposed || busy) return snapshot;
    busy = true;
    if (snapshot.kind === 'initializing') await observe();
    if (disposed) {
      busy = false;
      return snapshot;
    }
    const epoch = snapshot.epoch;
    const ticket = ++serial;
    publish({ ...snapshot, kind: 'pending', operation: kind }, ticket);
    let result: WebsiteShellOperationResult;
    try {
      result = Object.freeze(await platform.operate(kind, epoch));
      publish(readinessOf(result), ticket);
    } catch {
      result = Object.freeze({
        ...snapshot,
        kind: 'error',
        code: 'operation-failed',
        outcome: Object.freeze({
          kind: 'failed',
          operation: kind,
          epoch,
          code: 'operation-failed',
        }),
      });
      publish(readinessOf(result), ticket);
    } finally {
      busy = false;
    }
    if (result.kind === 'pending') await refresh();
    return result;
  };
  void refresh();
  return Object.freeze({
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      if (!disposed) listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    refresh,
    enable: () => operation('enable'),
    update: () => operation('update'),
    remove: () => operation('remove'),
    dispose: () => {
      disposed = true;
      ++serial;
      listeners.clear();
      unsubscribe();
      platform.dispose();
    },
  });
}
