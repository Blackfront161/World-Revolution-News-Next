import { afterEach, expect, it, vi } from 'vitest';
import {
  createOfflineOperationScope,
  type OfflineOperation,
} from './content-offline-controller-core';

afterEach(() => vi.useRealTimers());
const scope = () => createOfflineOperationScope(() => new Error('cancelled'));
function begin(owner: ReturnType<typeof scope>): OfflineOperation {
  const operation = owner.begin();
  if (typeof operation === 'string') throw new Error(operation);
  return operation;
}

it('aborts the actual shared signal at the whole-operation deadline before releasing ownership', async () => {
  vi.useFakeTimers();
  const owner = scope();
  const operation = begin(owner);
  const abort = vi.fn();
  operation.controller.signal.addEventListener('abort', abort);
  const waiting = operation.wait(new Promise(() => undefined)).catch((error) => error.message);
  await vi.advanceTimersByTimeAsync(15000);
  expect(await waiting).toBe('cancelled');
  expect(abort).toHaveBeenCalledOnce();
  expect(operation.reason).toBe('timeout');
  expect(owner.begin()).toBe('busy');
  owner.finish(operation);
  const next = begin(owner);
  expect(next.controller.signal.aborted).toBe(false);
  owner.dispose();
});

it('superseded work cannot complete into a clear or subsequent operation', async () => {
  const owner = scope();
  const old = begin(owner);
  let resolve!: (value: string) => void;
  const waiting = old
    .wait(
      new Promise<string>((done) => {
        resolve = done;
      }),
    )
    .catch((error) => error.message);
  owner.cancelCurrent();
  const next = begin(owner);
  resolve('late');
  expect(await waiting).toBe('cancelled');
  owner.finish(old);
  expect(owner.isCurrent(next)).toBe(true);
  expect(() => old.assert()).toThrow('cancelled');
  owner.dispose();
});

it('disposal cancels outstanding work and cannot be reopened', async () => {
  const owner = scope();
  const operation = begin(owner);
  const waiting = operation.wait(new Promise(() => undefined)).catch((error) => error.message);
  owner.dispose();
  expect(await waiting).toBe('cancelled');
  expect(operation.reason).toBe('disposed');
  expect(owner.begin()).toBe('disposed');
});

it('already-aborted caller never permits work and completion detaches the caller', async () => {
  const owner = scope();
  const caller = new AbortController();
  caller.abort();
  const cancelled = owner.begin(caller.signal);
  if (typeof cancelled === 'string') throw new Error(cancelled);
  expect(() => cancelled.assert()).toThrow('cancelled');
  owner.finish(cancelled);
  const nextCaller = new AbortController();
  const next = owner.begin(nextCaller.signal);
  if (typeof next === 'string') throw new Error(next);
  expect(await next.wait(Promise.resolve(42))).toBe(42);
  owner.finish(next);
  nextCaller.abort();
  expect(next.controller.signal.aborted).toBe(false);
});
