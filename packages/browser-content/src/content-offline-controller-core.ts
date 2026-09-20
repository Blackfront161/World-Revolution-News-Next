import { waitForAbortable } from './content-release-transport-core';

export const contentOfflineOperationDeadlineMs = 15_000;
export type OfflineOperation = {
  controller: AbortController;
  reason: 'aborted' | 'timeout' | 'disposed';
  confirmedWrites: string[];
  assert(): void;
  wait<T>(promise: Promise<T>): Promise<T>;
};

/** One owner and deadline across every phase, including persistent writes. */
export function createOfflineOperationScope(error: () => Error) {
  let current: OfflineOperation | null = null;
  let disposed = false;
  const cleanups = new WeakMap<OfflineOperation, () => void>();
  const isCurrent = (operation: OfflineOperation) => !disposed && current === operation;
  const stop = (operation: OfflineOperation, reason: OfflineOperation['reason']) => {
    if (!operation.controller.signal.aborted) operation.reason = reason;
    operation.controller.abort();
  };
  const finish = (operation: OfflineOperation) => {
    cleanups.get(operation)?.();
    cleanups.delete(operation);
    if (current === operation) current = null;
  };
  return Object.freeze({
    get disposed() {
      return disposed;
    },
    isCurrent,
    finish,
    begin(caller?: AbortSignal): OfflineOperation | 'busy' | 'disposed' {
      if (disposed) return 'disposed';
      if (current !== null) return 'busy';
      const operation: OfflineOperation = {
        controller: new AbortController(),
        reason: 'aborted',
        confirmedWrites: [],
        assert() {
          if (!isCurrent(operation) || operation.controller.signal.aborted) throw error();
        },
        async wait<T>(promise: Promise<T>) {
          const result = await waitForAbortable(promise, operation.controller.signal, error);
          operation.assert();
          return result;
        },
      };
      current = operation;
      const abort = () => stop(operation, 'aborted');
      caller?.addEventListener('abort', abort, { once: true });
      const timer = globalThis.setTimeout(
        () => stop(operation, 'timeout'),
        contentOfflineOperationDeadlineMs,
      );
      cleanups.set(operation, () => {
        globalThis.clearTimeout(timer);
        caller?.removeEventListener('abort', abort);
      });
      if (caller?.aborted) abort();
      return operation;
    },
    cancelCurrent() {
      if (current === null) return;
      const previous = current;
      stop(previous, 'aborted');
      finish(previous);
    },
    dispose() {
      disposed = true;
      if (current !== null) {
        const previous = current;
        stop(previous, 'disposed');
        finish(previous);
      }
    },
  });
}
