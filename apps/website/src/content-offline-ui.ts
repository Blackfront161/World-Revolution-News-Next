import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createWebsiteContentOfflineController,
  type ContentOfflineControllerResult,
} from './content-offline-controller';

export type OfflineUiAction = 'save' | 'check' | 'activate' | 'rollback' | 'clear';
export type OfflineUiCall = OfflineUiAction | 'restore' | 'guard' | 'resumeGuard';
type Controller = ReturnType<typeof createWebsiteContentOfflineController>;
type Result = ContentOfflineControllerResult | null;

/**
 * UI ownership only. The controller remains the sole storage/safety authority.
 * Guards coalesce behind the current operation; user downloads never auto-retry.
 * Clear invalidates queued callers and is the only operation allowed to preempt.
 */
export function createContentOfflineUiSession(
  controller: Controller,
  publish: (result: ContentOfflineControllerResult, action: OfflineUiCall) => void,
  changed: (action: OfflineUiCall | null) => void,
) {
  let mounted = true;
  let epoch = 0;
  let running: { promise: Promise<Result> } | null = null;
  let queuedGuard: Promise<Result> | null = null;

  const run = (action: OfflineUiCall): Promise<Result> => {
    if (!mounted) return Promise.resolve(null);
    if (running !== null && action !== 'clear') return Promise.resolve(null);
    if (action === 'clear') {
      epoch++;
      queuedGuard = null;
    }
    const owner = { promise: Promise.resolve<Result>(null) };
    running = owner;
    changed(action);
    owner.promise = (async () => {
      try {
        const result = await controller[action]();
        if (!mounted || running !== owner || result.status === 'busy') return null;
        publish(result, action);
        return result;
      } finally {
        if (mounted && running === owner) {
          running = null;
          changed(null);
        }
      }
    })();
    return owner.promise;
  };
  const invoke = (action: OfflineUiCall): Promise<Result> => {
    if (action !== 'guard' && action !== 'resumeGuard') {
      if (action !== 'clear' && queuedGuard !== null) return Promise.resolve(null);
      return run(action);
    }
    if (!mounted) return Promise.resolve(null);
    if (queuedGuard !== null) return queuedGuard;
    const requestedEpoch = epoch;
    const request =
      running === null
        ? run(action)
        : running.promise.then(() => (mounted && epoch === requestedEpoch ? run(action) : null));
    queuedGuard = request;
    void request.finally(() => {
      if (queuedGuard === request) queuedGuard = null;
    });
    return request;
  };
  return {
    invoke,
    dispose() {
      mounted = false;
      epoch++;
      controller.dispose();
    },
  };
}

export function useContentOfflineController(enabled: boolean) {
  const session = useRef<ReturnType<typeof createContentOfflineUiSession> | null>(null);
  const [result, setResult] = useState<ContentOfflineControllerResult | null>(null);
  const [operationResult, setOperationResult] = useState<ContentOfflineControllerResult | null>(
    null,
  );
  const [operation, setOperation] = useState<OfflineUiCall | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const current = createContentOfflineUiSession(
      createWebsiteContentOfflineController(),
      (next, action) => {
        setResult(next);
        if (action !== 'guard' && action !== 'resumeGuard') setOperationResult(next);
      },
      setOperation,
    );
    session.current = current;
    void current.invoke('restore');
    return () => {
      if (session.current === current) session.current = null;
      current.dispose();
    };
  }, [enabled]);
  const invoke = useCallback(
    (action: OfflineUiCall) => session.current?.invoke(action) ?? Promise.resolve(null),
    [],
  );
  return { result, operationResult, operation, invoke };
}
