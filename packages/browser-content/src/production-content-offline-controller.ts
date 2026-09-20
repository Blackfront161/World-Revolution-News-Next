import {
  productionContentOfflineTtlMs,
  type ProductionContentOfflineControlV1,
} from '@wrn/content-contracts/production-content-offline-v1';
import { evaluateContentOfflineGuard } from '@wrn/domain';
import type {
  ProductionContentReady,
  ProductionContentSafetyLedgerV1,
} from '@wrn/content-contracts';
import {
  createOfflineOperationScope,
  type OfflineOperation,
} from './content-offline-controller-core';
import {
  completeProductionContentRelease,
  verifyProductionContentSafety,
  type ProductionContentSafetyReceipt,
  type ProductionContentSourceV1,
} from './production-content-release';
import {
  ProductionContentOfflineStoreError,
  type ProductionContentOfflineStore,
  type ProductionContentOfflineStoreFailure,
  type ProductionContentOfflineSnapshot,
} from './production-content-offline-store';

export type ProductionContentOfflineControllerStatus =
  | 'active'
  | 'candidate-staged'
  | 'needs-source-check'
  | 'storage-error'
  | 'busy'
  | 'aborted'
  | 'disposed';
export type ProductionContentOfflineControllerResult = Readonly<{
  status: ProductionContentOfflineControllerStatus;
  runtime: ProductionContentReady | null;
  activeKey: string | null;
  /** The active bundle owns this deadline, including after explicit rollback. */
  expiresAt: number | null;
  control: ProductionContentOfflineControlV1 | null;
  safety: ProductionContentSafetyLedgerV1 | null;
  reason:
    | 'ready'
    | 'no-active-bundle'
    | 'expired'
    | 'clock-regressed'
    | 'pending-recheck'
    | 'missing-control'
    | 'safety-conflict'
    | 'safety-write-failed'
    | 'transport-or-validation'
    | 'operation-in-progress'
    | 'aborted'
    | 'timeout'
    | 'disposed'
    | 'storage-error';
  confirmedWrites: readonly string[];
  storageFailure: ProductionContentOfflineStoreFailure | null;
}>;
export type ProductionContentOfflineDependencies = Readonly<{
  refreshSource?: ProductionContentSourceV1;
  bootstrapSource?: ProductionContentSourceV1;
  openStore: (signal?: AbortSignal) => Promise<ProductionContentOfflineStore>;
  verifySafety: (
    signal: AbortSignal,
    known: ProductionContentSafetyLedgerV1,
  ) => ReturnType<typeof verifyProductionContentSafety>;
  completeRelease: (
    receipt: ProductionContentSafetyReceipt,
    signal: AbortSignal,
    known: ProductionContentSafetyLedgerV1,
  ) => ReturnType<typeof completeProductionContentRelease>;
  now: () => number;
  operationId: () => string;
}>;
function freeze<T>(value: T): T {
  return Object.freeze(value);
}
function expected(control: Readonly<{ generation: number; clearEpoch: number }>) {
  return { generation: control.generation, clearEpoch: control.clearEpoch };
}
function failure(error: unknown): ProductionContentOfflineStoreFailure | null {
  return error instanceof ProductionContentOfflineStoreError ? error.code : null;
}

function isVirginStore({ control, bundles }: ProductionContentOfflineSnapshot): boolean {
  return (
    control.format === 'wrn.production-content-offline.v1' &&
    control.generation === 0 &&
    control.clearEpoch === 0 &&
    control.activeKey === null &&
    control.previousKey === null &&
    control.candidateKey === null &&
    control.pendingRecheck === null &&
    control.lastSuccessfulSourceCheckAt === null &&
    control.lastObservedAt === null &&
    control.highestAcceptedSequence === 0 &&
    control.acceptedIdentities.length === 0 &&
    control.safety.revision === 0 &&
    control.safety.revokedIds.length === 0 &&
    bundles.length === 0
  );
}

export function createProductionContentOfflineController(
  overrides: Pick<ProductionContentOfflineDependencies, 'openStore'> &
    Partial<ProductionContentOfflineDependencies>,
) {
  let serial = 0;
  let store: ProductionContentOfflineStore | null = null;
  const operations = createOfflineOperationScope(
    () => new ProductionContentOfflineStoreError('aborted'),
  );

  const dependencies: ProductionContentOfflineDependencies = {
    verifySafety: verifyProductionContentSafety,
    completeRelease: completeProductionContentRelease,
    now: () => Date.now(),
    operationId: () => `production-content-${++serial}`,
    ...overrides,
  };
  const result = (
    status: ProductionContentOfflineControllerStatus,
    reason: ProductionContentOfflineControllerResult['reason'],
    extra: Partial<ProductionContentOfflineControllerResult> = {},
  ): ProductionContentOfflineControllerResult =>
    freeze({
      status,
      reason,
      runtime: null,
      activeKey: null,
      expiresAt: null,
      control: null,
      safety: null,
      confirmedWrites: Object.freeze([]),
      storageFailure: null,
      ...extra,
    });
  const run = async (
    work: (op: OfflineOperation) => Promise<ProductionContentOfflineControllerResult>,
    caller?: AbortSignal,
  ): Promise<ProductionContentOfflineControllerResult> => {
    const op = operations.begin(caller);
    if (op === 'disposed') return result('disposed', 'disposed');
    if (op === 'busy') return result('busy', 'operation-in-progress');
    try {
      op.assert();
      return await op.wait(work(op));
    } catch (error) {
      const extra = {
        confirmedWrites: Object.freeze([...op.confirmedWrites]),
        storageFailure: failure(error),
      };
      if (operations.disposed) return result('disposed', 'disposed', extra);
      if (op.controller.signal.aborted) return result('aborted', op.reason, extra);
      return result('storage-error', 'storage-error', extra);
    } finally {
      operations.finish(op);
    }
  };
  const connection = async (op: OfflineOperation) => {
    op.assert();
    if (store !== null) return store;
    const opened = dependencies.openStore(op.controller.signal).then((value) => {
      if (!operations.isCurrent(op) || op.controller.signal.aborted) {
        value.close();
        throw new ProductionContentOfflineStoreError('aborted');
      }
      store = value;
      return value;
    });
    return op.wait(opened);
  };
  const project = async (db: ProductionContentOfflineStore, op: OfflineOperation) => {
    const signal = op.controller.signal;
    const state = await op.wait(db.snapshot(signal));
    const active = await op.wait(db.readActive(signal));
    let control = state.control;
    if (
      active !== null &&
      (active.generation !== control.generation || active.clearEpoch !== control.clearEpoch)
    )
      throw new ProductionContentOfflineStoreError('stale-operation');
    const now = dependencies.now();
    const guard = evaluateContentOfflineGuard(
      {
        ...control,
        lastSuccessfulSourceCheckAt:
          control.lastSuccessfulSourceCheckAt === null ? null : (active?.checkedAt ?? null),
      },
      now,
    );
    if (guard.kind !== 'allowed' || active === null)
      return result(
        'needs-source-check',
        guard.kind === 'allowed' ? 'no-active-bundle' : guard.reason,
        {
          control,
          safety: control.safety,
          activeKey: control.activeKey,
          confirmedWrites: Object.freeze([...op.confirmedWrites]),
        },
      );
    if (now !== control.lastObservedAt) {
      control = await op.wait(db.observeTime(now, expected(control), signal));
      op.confirmedWrites.push('observe-time');
    }
    return result('active', 'ready', {
      runtime: active.ready,
      expiresAt: active.checkedAt + productionContentOfflineTtlMs,
      control,
      safety: control.safety,
      activeKey: control.activeKey,
      confirmedWrites: Object.freeze([...op.confirmedWrites]),
    });
  };
  const restore = (signal?: AbortSignal) =>
    run(async (op) => project(await connection(op), op), signal);
  const check = (signal?: AbortSignal) =>
    run(async (op) => {
      const operation = op.controller.signal;
      const writes = op.confirmedWrites;
      const db = await op.wait(connection(op));
      const initial = await op.wait(db.snapshot(operation));
      // Capture the entire source pair before the generation-checked prepare barrier.
      const selectedSource = isVirginStore(initial)
        ? (dependencies.bootstrapSource ?? dependencies.refreshSource)
        : dependencies.refreshSource;
      const verifySafety = selectedSource?.verifySafety ?? dependencies.verifySafety;
      const completeRelease = selectedSource?.completeRelease ?? dependencies.completeRelease;
      const preserveCheckTime =
        selectedSource !== undefined && selectedSource === dependencies.refreshSource;
      const operationId = dependencies.operationId();
      let prepared = await op.wait(
        db.prepareRecheck(operationId, expected(initial.control), operation),
      );
      writes.push('prepare-recheck');
      const checked = await op.wait(verifySafety(operation, prepared.safety));
      if (checked.kind === 'failed') {
        await op.wait(
          db.finishRecheck(
            operationId,
            preserveCheckTime ? 'unverified-preserve-check-time' : 'unverified',
            dependencies.now(),
            expected(prepared),
            operation,
          ),
        );
        writes.push('finish-recheck');
        if (preserveCheckTime) {
          const retained = await project(db, op);
          return freeze({ ...retained, reason: 'transport-or-validation' as const });
        }
        return result('needs-source-check', 'transport-or-validation', {
          confirmedWrites: Object.freeze(writes),
        });
      }
      // This await is the non-negotiable barrier: no completeRelease call exists above it.
      try {
        prepared = await op.wait(
          db.commitSafety(
            operationId,
            checked.safety,
            dependencies.now(),
            expected(prepared),
            operation,
          ),
        );
        writes.push('commit-safety');
      } catch (error) {
        return result('needs-source-check', 'safety-write-failed', {
          confirmedWrites: Object.freeze(writes),
          storageFailure: failure(error),
        });
      }
      const completed = await op.wait(completeRelease(checked.receipt, operation, prepared.safety));
      if (completed.kind === 'failed') {
        await op.wait(
          db.finishRecheck(
            operationId,
            'safety-verified-payload-failed',
            dependencies.now(),
            expected(prepared),
            operation,
          ),
        );
        writes.push('finish-recheck');
        const retained = await project(db, op);
        return freeze({ ...retained, reason: 'transport-or-validation' as const });
      }
      const saved = await op.wait(
        db.saveCandidate(
          {
            descriptor: completed.runtime.descriptor,
            manifest: completed.runtime.manifest,
            documents: completed.runtime.documents,
            checkedAt: dependencies.now(),
            expected: expected(prepared),
          },
          operation,
        ),
      );
      writes.push(saved.disposition);
      let finalControl = saved.control;
      if (saved.disposition === 'candidate-staged' || saved.disposition === 'candidate-refreshed') {
        finalControl = await op.wait(
          db.activateCandidate(saved.bundleKey, expected(saved.control), operation),
        );
        writes.push('activate-candidate');
      }
      await op.wait(
        db.finishRecheck(
          operationId,
          'ready',
          dependencies.now(),
          expected(finalControl),
          operation,
        ),
      );
      writes.push('finish-recheck');
      return project(db, op);
    }, signal);
  return freeze({
    restore,
    check,
    clear: (signal?: AbortSignal) => {
      operations.cancelCurrent();
      return run(async (op) => {
        const operation = op.controller.signal;
        const writes = op.confirmedWrites;
        const db = await op.wait(connection(op));
        const state = await op.wait(db.snapshot(operation));
        await op.wait(db.clear(expected(state.control), operation));
        writes.push('clear');
        return result('needs-source-check', 'no-active-bundle', {
          confirmedWrites: Object.freeze(writes),
        });
      }, signal);
    },
    rollback: (signal?: AbortSignal) =>
      run(async (op) => {
        const operation = op.controller.signal;
        const writes = op.confirmedWrites;
        const db = await op.wait(connection(op));
        const state = await op.wait(db.snapshot(operation));
        const previous = state.bundles.find((bundle) => bundle.key === state.control.previousKey);
        const guard = evaluateContentOfflineGuard(
          {
            ...state.control,
            activeKey: state.control.previousKey,
            lastSuccessfulSourceCheckAt:
              state.control.lastSuccessfulSourceCheckAt === null
                ? null
                : (previous?.checkedAt ?? null),
          },
          dependencies.now(),
        );
        if (guard.kind !== 'allowed') return result('needs-source-check', guard.reason);
        await op.wait(db.rollback(expected(state.control), operation));
        writes.push('rollback');
        return project(db, op);
      }, signal),
    dispose() {
      operations.dispose();

      store?.close();
      store = null;
    },
  });
}
