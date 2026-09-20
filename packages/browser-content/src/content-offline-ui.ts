import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  createProductionContentOfflineController,
  ProductionContentOfflineControllerResult,
} from './production-content-offline-controller';
export type OfflineUiAction = 'save' | 'check' | 'activate' | 'rollback' | 'clear';
export type OfflineUiCall = OfflineUiAction | 'restore' | 'guard' | 'resumeGuard';
type UiController<Action extends OfflineUiCall, Value> = Record<Action, () => Promise<Value>> & {
  dispose(): void;
};

/**
 * UI ownership only. The controller remains the sole storage/safety authority.
 * Guards coalesce behind the current operation; user downloads never auto-retry.
 * Clear invalidates queued callers and is the only operation allowed to preempt.
 */
export function createOfflineUiSession<
  Action extends OfflineUiCall,
  Value extends { status: string },
>(
  controller: UiController<Action, Value>,
  publish: (result: Value, action: Action) => void,
  changed: (action: Action | null) => void,
) {
  type Result = Value | null;
  let mounted = true;
  let epoch = 0;
  let running: { promise: Promise<Result> } | null = null;
  let queuedGuard: Promise<Result> | null = null;

  const run = (action: Action): Promise<Result> => {
    if (!mounted) return Promise.resolve(null);
    if (running !== null && action !== 'clear') return Promise.resolve(null);
    if (action === 'clear') {
      epoch++;
      queuedGuard = null;
    }
    const owner: { promise: Promise<Result> } = { promise: Promise.resolve<Result>(null) };
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
  const invoke = (action: Action): Promise<Result> => {
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

export function useOfflineController<
  Action extends OfflineUiCall,
  Value extends { status: string },
>(enabled: boolean, factory: () => UiController<Action, Value>, initialAction: Action) {
  const session = useRef<ReturnType<typeof createOfflineUiSession<Action, Value>> | null>(null);
  const [result, setResult] = useState<Value | null>(null);
  const [operationResult, setOperationResult] = useState<Value | null>(null);
  const [operation, setOperation] = useState<Action | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const current = createOfflineUiSession<Action, Value>(
      factory(),
      (next, action) => {
        setResult(next);
        if (action !== 'guard' && action !== 'resumeGuard') setOperationResult(next);
      },
      setOperation,
    );
    session.current = current;
    void current.invoke(initialAction);
    return () => {
      if (session.current === current) session.current = null;
      current.dispose();
    };
  }, [enabled, factory, initialAction]);
  const invoke = useCallback(
    (action: Action) => session.current?.invoke(action) ?? Promise.resolve(null),
    [],
  );
  return { result, operationResult, operation, invoke };
}

export type ProductionOfflineUiCall =
  'restore' | 'guard' | 'resumeGuard' | 'check' | 'rollback' | 'clear';
export function createProductionContentOfflineHook(
  factory: () => ReturnType<typeof createProductionContentOfflineController>,
) {
  function productionUiController() {
    const controller = factory();
    return { ...controller, guard: controller.restore, resumeGuard: controller.restore };
  }
  return function useProductionContentOfflineController(enabled = true) {
    return useOfflineController<ProductionOfflineUiCall, ProductionContentOfflineControllerResult>(
      enabled,
      productionUiController,
      'restore',
    );
  };
}
