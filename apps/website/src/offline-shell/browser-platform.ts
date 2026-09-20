import type {
  WebsiteShellFailureCode,
  WebsiteShellOperation,
  WebsiteShellOperationOutcome,
  WebsiteShellOperationResult,
  WebsiteShellPlatform,
  WebsiteShellStatus,
} from './adapter';
import { createShellProtocol, type ShellJob } from './protocol.mjs';

const p = createShellProtocol();
const workerPath = '/website-shell-sw.js';
type Identity = { shellId: string; ready: boolean };
type NativeAttempt = { workers: Set<ServiceWorker> };
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createBrowserWebsiteShellPlatform(): WebsiteShellPlatform {
  const supported =
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    'serviceWorker' in navigator &&
    'caches' in window &&
    'locks' in navigator;
  const listeners = new Set<() => void>();
  const cleanups = new Map<EventTarget, () => void>();
  const channel =
    supported && typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(p.protocol) : null;
  let disposed = false;
  let recovery: Promise<void> | null = null;
  const controlled = () => supported && navigator.serviceWorker.controller !== null;
  const emit = () => {
    if (!disposed) for (const listener of listeners) listener();
  };
  const onMessage = (event: MessageEvent) => {
    if (event.data?.protocol === p.protocol && event.data?.type === 'changed') emit();
  };
  const changed = () => {
    if (disposed) return;
    channel?.postMessage('changed');
    emit();
  };
  if (channel) channel.onmessage = emit;
  const watch = (target: EventTarget, event: string) => {
    if (cleanups.has(target)) return;
    target.addEventListener(event, emit);
    cleanups.set(target, () => target.removeEventListener(event, emit));
  };
  if (supported) {
    navigator.serviceWorker.addEventListener('controllerchange', emit);
    navigator.serviceWorker.addEventListener('message', onMessage);
    window.addEventListener('pageshow', emit);
    window.addEventListener('online', emit);
  }
  const withLock = <T>(task: () => Promise<T>) =>
    navigator.locks.request(p.lock, { mode: 'exclusive' }, task);
  const read = async () => {
    const result = await p.read(caches);
    if (result.kind !== 'known')
      throw new Error(result.kind === 'missing' ? 'incomplete' : 'protected');
    return result.value;
  };
  const registration = async () => {
    const entries = await navigator.serviceWorker.getRegistrations();
    const root = entries.find((r) => r.scope === location.origin + '/');
    if (
      root &&
      [root.active, root.waiting, root.installing].some(
        (worker) => worker && worker.scriptURL !== location.origin + workerPath,
      )
    )
      throw new Error('protected');
    if (root) {
      watch(root, 'updatefound');
      for (const worker of [root.active, root.waiting, root.installing])
        if (worker) watch(worker, 'statechange');
    }
    return root;
  };
  const identify = (worker: ServiceWorker | null, epoch: number): Promise<Identity | null> => {
    if (!worker) return Promise.resolve(null);
    return new Promise((resolve) => {
      const requestId = crypto.randomUUID();
      const finish = (value: Identity | null) => {
        clearTimeout(timer);
        navigator.serviceWorker.removeEventListener('message', handler);
        resolve(value);
      };
      const handler = (event: MessageEvent) => {
        const m = event.data as Record<string, unknown> | null;
        if (
          event.source !== worker ||
          !m ||
          m.protocol !== p.protocol ||
          m.type !== 'status' ||
          m.requestId !== requestId ||
          m.epoch !== epoch
        )
          return;
        if (
          typeof m.shellId !== 'string' ||
          !/^[a-f0-9]{64}$/.test(m.shellId) ||
          typeof m.ready !== 'boolean'
        )
          return;
        finish({ shellId: m.shellId, ready: m.ready });
      };
      const timer = setTimeout(() => finish(null), 1500);
      navigator.serviceWorker.addEventListener('message', handler);
      worker.postMessage({ protocol: p.protocol, type: 'status', requestId, epoch });
    });
  };
  const error = (cause: unknown, epoch: number | null): WebsiteShellStatus => {
    const code = cause instanceof Error ? cause.message : '';
    return {
      kind: code === 'protected' ? 'protected' : 'error',
      epoch,
      controlled: controlled(),
      code: ['protected', 'budget', 'incomplete', 'stale'].includes(code)
        ? (code as 'protected' | 'budget' | 'incomplete' | 'stale')
        : 'operation-failed',
    };
  };
  const operationResult = (
    readiness: WebsiteShellStatus,
    outcome: WebsiteShellOperationOutcome,
  ): WebsiteShellOperationResult =>
    Object.freeze({ ...readiness, outcome: Object.freeze(outcome) });
  const failed = (
    cause: unknown,
    operation: WebsiteShellOperation,
    epoch: number | null,
  ): WebsiteShellOperationResult => {
    const readiness = error(cause, epoch);
    return operationResult(readiness, {
      kind: 'failed',
      operation,
      epoch,
      code: (readiness.code ?? 'operation-failed') as WebsiteShellFailureCode,
    });
  };
  const failedReadiness = (
    readiness: WebsiteShellStatus,
    operation: WebsiteShellOperation,
    epoch: number | null,
  ): WebsiteShellOperationResult =>
    operationResult(readiness, {
      kind: 'failed',
      operation,
      epoch,
      code: readiness.code ?? 'operation-failed',
    });
  const finishRemove = async (epoch: number, ticket: string, settled: boolean) =>
    withLock(async () => {
      let c = await read();
      if (c.state !== 'removing' || c.epoch !== epoch || c.removalJob?.id !== ticket) return;
      if (!settled) return;
      if (await registration()) return; // Native result is not the rest verification.
      c = { ...c, pendingJob: null, removalJob: { id: ticket, epoch, phase: 'settled' } };
      await p.write(caches, c); // Crash recovery can distinguish queue fence from cache cleanup.
      await p.inventory(caches, c);
      for (const g of c.generations) await caches.delete(p.prefix + g.id);
      if ((await p.inventory(caches, c)).length !== 0) return;
      c = {
        ...c,
        state: 'removed',
        active: null,
        previous: null,
        generations: [],
        pendingJob: null,
        removalJob: null,
      };
      await p.write(caches, c);
      changed();
    });
  const remove = async (expected: number | null, resume: boolean) => {
    const job = await withLock(async () => {
      const r = await registration();
      const found = await p.read(caches);
      if (found.kind === 'missing') {
        if (r) throw new Error('protected');
        return null; // A normal fresh visit/remove creates no marker.
      }
      if (found.kind !== 'known') throw new Error('protected');
      let c = found.value;
      if (!resume && c.epoch !== expected) throw new Error('stale');
      if (c.state === 'removed') return null;
      await p.inventory(caches, c);
      if (c.state !== 'removing') {
        c = { ...c, state: 'removing', enabled: false, epoch: c.epoch + 1, removalJob: null };
        await p.write(caches, c); // Durable fence precedes all destructive/native work.
      }
      // An unresolved registration with no observable handle cannot be fenced.
      // Keep pending rather than assuming the queued native job disappeared.
      if (!r && (c.pendingJob || (c.removalJob && c.removalJob.phase !== 'settled'))) return null;
      const ticket = { id: crypto.randomUUID(), epoch: c.epoch, phase: 'started' as const };
      await p.write(caches, { ...c, removalJob: ticket });
      const settlement = r ? r.unregister() : Promise.resolve(true);
      return { ticket, settlement };
    });
    if (!job) return;
    // A timeout is not cancellation. The continuation retains its captured ticket.
    const continuation = job.settlement.then(() =>
      finishRemove(job.ticket.epoch, job.ticket.id, true),
    );
    void continuation.then(changed, changed);
    await Promise.race([continuation, delay(35000)]);
  };
  const observe = async (): Promise<WebsiteShellStatus> => {
    if (!supported) return { kind: 'error', code: 'unsupported', epoch: null, controlled: false };
    try {
      const r = await registration();
      const found = await p.read(caches);
      if (found.kind === 'missing')
        return { kind: r ? 'protected' : 'uncontrolled', epoch: null, controlled: controlled() };
      if (found.kind !== 'known')
        return { kind: 'protected', code: 'protected', epoch: null, controlled: controlled() };
      const c = found.value;
      const base = { epoch: c.epoch, controlled: controlled() };
      if (c.state === 'removed') return { ...base, kind: 'removed' };
      if (c.state === 'removing') {
        if (!recovery && !disposed) {
          recovery = remove(c.epoch, true)
            .catch(() => undefined)
            .finally(() => {
              recovery = null;
            });
        }
        return { ...base, kind: 'pending', operation: 'remove' };
      }
      await p.inventory(caches, c);
      if (r?.installing)
        return {
          ...base,
          kind: 'pending',
          operation: c.pendingJob?.kind === 'register' ? 'enable' : 'update',
        };
      const [active, waiting] = await Promise.all([
        identify(r?.active ?? null, c.epoch),
        identify(r?.waiting ?? null, c.epoch),
      ]);
      if (waiting?.ready)
        return {
          ...base,
          kind: 'waiting',
          ...(active ? { shellId: active.shellId } : {}),
          waitingShellId: waiting.shellId,
        };
      if (c.pendingJob)
        return {
          ...base,
          kind: 'pending',
          operation: c.pendingJob.kind === 'register' ? 'enable' : 'update',
        };
      if (active?.ready) {
        const identity = controlled()
          ? navigator.serviceWorker.controller === r?.active
            ? active
            : await identify(navigator.serviceWorker.controller, c.epoch)
          : null;
        return {
          ...base,
          kind: identity?.ready ? 'active' : 'saved',
          shellId: identity?.shellId ?? active.shellId,
        };
      }
      return { ...base, kind: 'error', code: 'incomplete' };
    } catch (cause) {
      return error(cause, null);
    }
  };
  const prepare = async (worker: ServiceWorker, ticket: ShellJob, identity: Identity) => {
    await new Promise<void>((resolve, reject) => {
      const finish = (ok: boolean) => {
        clearTimeout(timer);
        navigator.serviceWorker.removeEventListener('message', handler);
        if (ok) resolve();
        else reject(new Error('incomplete'));
      };
      const handler = (event: MessageEvent) => {
        const m = event.data;
        if (
          event.source === worker &&
          m?.protocol === p.protocol &&
          m.type === 'prepared' &&
          m.requestId === ticket.id &&
          m.epoch === ticket.epoch &&
          m.shellId === identity.shellId &&
          typeof m.ok === 'boolean'
        )
          finish(m.ok);
      };
      const timer = setTimeout(() => finish(false), 35000);
      navigator.serviceWorker.addEventListener('message', handler);
      worker.postMessage({
        protocol: p.protocol,
        type: 'prepare',
        requestId: ticket.id,
        epoch: ticket.epoch,
      });
    });
  };
  const settle = async (ticket: ShellJob, r: ServiceWorkerRegistration, attempt: NativeAttempt) => {
    // Native register resolves before install. Observe its real completion.
    await delay(0);
    while (r.installing) {
      attempt.workers.add(r.installing);
      watch(r.installing, 'statechange');
      await delay(30);
    }
    const workers = [...attempt.workers];
    const singleWorker = workers.length === 1 ? workers[0] : null;
    if (singleWorker?.state === 'redundant') throw new Error('incomplete');
    if (ticket.kind === 'register' && r.active) {
      const identity = await identify(r.active, ticket.epoch);
      if (identity && !identity.ready) await prepare(r.active, ticket, identity);
    }
    await withLock(async () => {
      const c = await read();
      if (c.pendingJob?.id !== ticket.id) return;
      if (c.epoch !== ticket.epoch || !c.enabled) {
        // Removing owns the newer epoch; only clear this old job, never enable it.
        await p.write(caches, { ...c, pendingJob: null });
        return;
      }
      await registration();
      await p.write(caches, { ...c, pendingJob: null });
    });
    changed();
    return workers.length === 1;
  };
  const operate = async (
    operation: WebsiteShellOperation,
    expected: number | null,
  ): Promise<WebsiteShellOperationResult> => {
    if (!supported) return failed(new Error('unsupported'), operation, expected);
    try {
      if (operation === 'remove') {
        await remove(expected, false);
        const readiness = await observe();
        if (readiness.kind === 'error' || readiness.kind === 'protected')
          return failedReadiness(readiness, operation, readiness.epoch);
        return operationResult(readiness, {
          kind: readiness.kind === 'pending' ? 'running' : 'succeeded',
          operation,
          epoch: readiness.epoch,
        });
      }
      const job = await withLock(async () => {
        const r = await registration();
        const found = await p.read(caches);
        if (found.kind !== 'known' && found.kind !== 'missing') throw new Error('protected');
        let c = found.kind === 'known' ? found.value : null;
        if ((c?.epoch ?? null) !== expected) throw new Error('stale');
        if (c?.state === 'removing' || c?.pendingJob || c?.removalJob || r?.installing)
          throw new Error('incomplete');
        if (!c || c.state === 'removed') {
          if (operation !== 'enable' || r) throw new Error('protected');
          c = p.initial((c?.epoch ?? 0) + 1);
        }
        await p.inventory(caches, c);
        if (operation === 'update' && (!c.enabled || !r)) throw new Error('incomplete');
        // Do not start C if B waits. Browser auto-update still meets the same
        // hard slot guard in install; no manual waiting-worker replacement.
        if (r?.waiting) throw new Error('budget');
        const ticket: ShellJob = {
          id: crypto.randomUUID(),
          epoch: c.epoch,
          kind: operation === 'enable' ? 'register' : 'update',
        };
        await p.write(caches, { ...c, pendingJob: ticket });
        const attempt: NativeAttempt = { workers: new Set() };
        const onUpdate = () => {
          if (r?.installing) attempt.workers.add(r.installing);
        };
        r?.addEventListener('updatefound', onUpdate);
        const settlement =
          operation === 'enable'
            ? navigator.serviceWorker.register(workerPath, { scope: '/', updateViaCache: 'none' })
            : r!.update();
        return {
          ticket,
          settlement,
          attempt,
          cleanup: () => r?.removeEventListener('updatefound', onUpdate),
        };
      });
      const completion = job.settlement
        .then((r) => settle(job.ticket, r, job.attempt))
        .catch(async (cause: unknown) => {
          await withLock(async () => {
            const c = await read();
            if (c.pendingJob?.id === job.ticket.id)
              await p.write(caches, { ...c, pendingJob: null });
          });
          throw cause;
        })
        .finally(job.cleanup);
      void completion.then(changed, changed);
      const outcome = await Promise.race([
        completion.then((bound) => ({ kind: 'settled' as const, bound })),
        delay(35000).then(() => 'pending' as const),
      ]);
      if (outcome === 'pending')
        return operationResult(
          { kind: 'pending', operation, epoch: job.ticket.epoch, controlled: controlled() },
          { kind: 'running', operation, epoch: job.ticket.epoch },
        );
      const readiness = await observe();
      if (readiness.kind === 'error' || readiness.kind === 'protected')
        return failedReadiness(readiness, operation, job.ticket.epoch);
      if (operation === 'update' && !outcome.bound)
        return operationResult(readiness, {
          kind: 'indeterminate',
          operation,
          epoch: job.ticket.epoch,
          code: 'native-outcome-unbound',
        });
      return operationResult(readiness, {
        kind: 'succeeded',
        operation,
        epoch: job.ticket.epoch,
      });
    } catch (cause) {
      return failed(cause, operation, expected);
    }
  };
  return {
    observe,
    operate,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose: () => {
      disposed = true;
      listeners.clear();
      for (const cleanup of cleanups.values()) cleanup();
      cleanups.clear();
      channel?.close();
      if (supported) {
        navigator.serviceWorker.removeEventListener('controllerchange', emit);
        navigator.serviceWorker.removeEventListener('message', onMessage);
        window.removeEventListener('pageshow', emit);
        window.removeEventListener('online', emit);
      }
    },
  };
}
export const protocol = p.protocol;
