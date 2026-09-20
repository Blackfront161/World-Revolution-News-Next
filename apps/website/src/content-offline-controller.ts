import {
  canonicalJson,
  contentOfflineTtlMs,
  createEmptyContentOfflineControlV1,
  mergeContentOfflineSafetyLedger,
  type ContentOfflineControlV1,
  type ContentOfflineSafetyLedgerV1,
  type LocalContentReleaseDocumentsV1,
} from '@wrn/content-contracts';
import { evaluateContentOfflineGuard, type ContentOfflineGuard } from '@wrn/domain';

import {
  ContentOfflineStoreError,
  openWebsiteContentOfflineStore,
  type ContentOfflineBundleMetadata,
  type ContentOfflineReadProjection,
  type ContentOfflineStore,
  type ContentOfflineStoreFailure,
} from './content-offline-store';
import {
  checkLocalContentReleaseForOffline,
  type LocalContentReleaseOfflineCheck,
  type LocalContentReleaseRuntime,
} from './local-content-release';

const updateTimeoutMs = 15_000;
export type ContentOfflineControllerStatus =
  | 'active'
  | 'candidate-staged'
  | 'session-only'
  | 'needs-source-check'
  | 'unavailable'
  | 'storage-error'
  | 'aborted'
  | 'stale-operation'
  | 'busy'
  | 'disposed';
export type ContentOfflineAction = 'save' | 'check' | 'activate' | 'rollback' | 'clear';
export type ContentOfflineReason =
  | 'ready'
  | 'no-active-bundle'
  | 'pending-recheck'
  | 'expired'
  | 'clock-regressed'
  | 'missing-control'
  | 'safety-conflict'
  | 'safety-write-failed'
  | 'storage-unavailable'
  | 'transport-or-validation'
  | 'operation-in-progress'
  | 'aborted'
  | 'timeout'
  | 'disposed'
  | 'stale-operation';
export type ContentOfflineActiveMetadata = Readonly<{
  key: string | null;
  revision: string;
  checkedAt: number;
  expiresAt: number;
}>;
export type ContentOfflineAlternativeMetadata = ContentOfflineBundleMetadata &
  Readonly<{
    eligible: boolean;
    reason: ContentOfflineReason;
  }>;
export type ContentOfflineControllerResult = Readonly<{
  status: ContentOfflineControllerStatus;
  readAccess: 'allowed' | 'blocked' | 'unavailable';
  reason: ContentOfflineReason;
  runtime: LocalContentReleaseRuntime | null;
  persistence: 'stored' | 'session-only' | 'none';
  active: ContentOfflineActiveMetadata | null;
  candidate: ContentOfflineAlternativeMetadata | null;
  previous: ContentOfflineAlternativeMetadata | null;
  control: Readonly<{
    generation: number | null;
    clearEpoch: number | null;
    observedAt: number | null;
    safetyFloor: number;
    persistedSafetyFloor: number | null;
    lastObservedAt: number | null;
    pendingRecheck: ContentOfflineControlV1['pendingRecheck'];
    protection: ContentOfflineReason | null;
  }>;
  guard: ContentOfflineGuard | null;
  actions: readonly ContentOfflineAction[];
  storageFailure: ContentOfflineStoreFailure | null;
  failure: ContentOfflineReason | ContentOfflineStoreFailure | null;
  confirmedWrites: readonly string[];
  // Stable aliases for the original consumers. Revision always means ACTIVE, never candidate.
  checkedAt: number | null;
  revision: string | null;
  activeRevision: string | null;
  candidateRevision: string | null;
  previousRevision: string | null;
}>;
type ControllerDependencies = Readonly<{
  openStore: (signal?: AbortSignal) => Promise<ContentOfflineStore>;
  check: (
    signal: AbortSignal,
    knownSafety: ContentOfflineSafetyLedgerV1,
  ) => Promise<LocalContentReleaseOfflineCheck>;
  now: () => number;
  operationId: () => string;
}>;
type Session = Readonly<{
  runtime: LocalContentReleaseRuntime;
  safety: ContentOfflineSafetyLedgerV1;
  checkedAt: number;
  clearEpoch: number | null;
}>;
type Operation = {
  controller: AbortController;
  reason: 'aborted' | 'timeout' | 'disposed';
  confirmedWrites: string[];
  assert(): void;
  wait<T>(promise: Promise<T>): Promise<T>;
};
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    if (!Object.isFrozen(value)) Object.freeze(value);
  }
  return value;
}
function documents(runtime: LocalContentReleaseRuntime): LocalContentReleaseDocumentsV1 {
  return {
    manifest: runtime.ready.manifest,
    payloads: runtime.ready.payloads,
    discoverIndex: runtime.ready.discoverIndex,
    readerDetails: runtime.ready.readerDetails,
    archiveLifecycle: runtime.ready.archiveLifecycle,
    websitePublication: runtime.ready.websitePublication,
  };
}
function immutableRuntime(ready: LocalContentReleaseRuntime['ready']): LocalContentReleaseRuntime {
  return freeze({
    ready,
    archiveValidation: {
      ok: true,
      errors: [],
      archiveArticleIds: [...ready.archiveLifecycle.archiveArticleIds],
      revocationRevision: ready.archiveLifecycle.revocations.revision,
    },
  });
}
function expected(control: ContentOfflineControlV1) {
  return { generation: control.generation, clearEpoch: control.clearEpoch };
}

/** One instance owns one lifecycle; P3 only renders returned snapshots and calls these actions. */
export function createWebsiteContentOfflineController(
  overrides: Partial<ControllerDependencies> = {},
) {
  let sequence = 0;
  const dependencies: ControllerDependencies = {
    openStore: openWebsiteContentOfflineStore,
    check: checkLocalContentReleaseForOffline,
    now: () => Date.now(),
    operationId: () => `website-content-offline-${++sequence}`,
    ...overrides,
  };
  let connection: ContentOfflineStore | null = null;
  let current: Operation | null = null;
  let disposed = false;
  let session: Session | null = null;
  let lastControl: ContentOfflineControlV1 | null = null;
  let controlReadAt: number | null = null;
  let knownSafety = createEmptyContentOfflineControlV1().safety;
  let observedTime: number | null = null;
  let safetyWriteFailed = false;
  let sessionCheckPending = false;

  const remember = (control: ContentOfflineControlV1) => {
    lastControl = freeze(control);
    controlReadAt = dependencies.now();
    if (session !== null && session.clearEpoch !== control.clearEpoch) session = null;
    const merged = mergeContentOfflineSafetyLedger(knownSafety, control.safety);
    if (merged !== null) knownSafety = merged;
  };
  const result = (
    status: ContentOfflineControllerStatus,
    reason: ContentOfflineReason,
    extra: Partial<ContentOfflineControllerResult> = {},
    op?: Operation,
  ): ContentOfflineControllerResult =>
    freeze({
      status,
      readAccess: reason === 'no-active-bundle' ? 'unavailable' : 'blocked',
      reason,
      runtime: null,
      persistence: 'none',
      active: null,
      candidate: null,
      previous: null,
      control: {
        generation: lastControl?.generation ?? null,
        clearEpoch: lastControl?.clearEpoch ?? null,
        observedAt: controlReadAt,
        safetyFloor: knownSafety.floor,
        persistedSafetyFloor: lastControl?.safety.floor ?? null,
        lastObservedAt:
          observedTime === null
            ? (lastControl?.lastObservedAt ?? null)
            : Math.max(observedTime, lastControl?.lastObservedAt ?? 0),
        pendingRecheck: lastControl?.pendingRecheck ?? null,
        protection: reason === 'ready' || reason === 'no-active-bundle' ? null : reason,
      },
      guard: null,
      actions: [],
      storageFailure: null,
      failure: null,
      confirmedWrites: [...(op?.confirmedWrites ?? [])],
      checkedAt: null,
      revision: null,
      activeRevision: null,
      candidateRevision: null,
      previousRevision: null,
      ...extra,
    });
  const stop = (op: Operation, reason: Operation['reason']) => {
    op.reason = reason;
    op.controller.abort();
  };
  const run = async (
    work: (op: Operation) => Promise<ContentOfflineControllerResult>,
    callerSignal?: AbortSignal,
  ): Promise<ContentOfflineControllerResult> => {
    if (disposed) return result('disposed', 'disposed');
    if (current !== null) return result('busy', 'operation-in-progress');
    const op: Operation = {
      controller: new AbortController(),
      reason: 'aborted',
      confirmedWrites: [],
      assert() {
        if (op.controller.signal.aborted || current !== op || disposed)
          throw new ContentOfflineStoreError('aborted');
      },
      async wait<T>(promise: Promise<T>): Promise<T> {
        // Attach both handlers even if abort already won: late rejection is always consumed.
        let abort!: () => void;
        const cancelled = new Promise<never>((_, reject) => {
          abort = () => reject(new ContentOfflineStoreError('aborted'));
          op.controller.signal.addEventListener('abort', abort, { once: true });
          if (op.controller.signal.aborted) abort();
        });
        try {
          const value = await Promise.race([promise, cancelled]);
          op.assert();
          return value;
        } finally {
          op.controller.signal.removeEventListener('abort', abort);
        }
      },
    };
    current = op;
    const abort = () => stop(op, 'aborted');
    callerSignal?.addEventListener('abort', abort, { once: true });
    if (callerSignal?.aborted) abort();
    const timeout = window.setTimeout(() => stop(op, 'timeout'), updateTimeoutMs);
    try {
      op.assert();
      return await op.wait(work(op));
    } catch (error) {
      if (op.controller.signal.aborted || disposed)
        return result(disposed ? 'disposed' : 'aborted', op.reason, { failure: op.reason }, op);
      const code = error instanceof ContentOfflineStoreError ? error.code : 'unavailable';
      const status =
        code === 'stale-operation'
          ? 'stale-operation'
          : code === 'aborted' || code === 'timeout'
            ? 'aborted'
            : 'storage-error';
      const reason = safetyWriteFailed
        ? 'safety-write-failed'
        : code === 'stale-operation' || code === 'aborted' || code === 'timeout'
          ? code
          : 'storage-unavailable';
      return result(
        status,
        reason,
        {
          storageFailure: code,
          failure: code,
          actions: code === 'incompatible-storage' ? [] : ['check'],
        },
        op,
      );
    } finally {
      window.clearTimeout(timeout);
      callerSignal?.removeEventListener('abort', abort);
      if (current === op) current = null;
    }
  };
  const store = async (op: Operation): Promise<ContentOfflineStore | null> => {
    op.assert();
    if (connection !== null) return connection;
    try {
      const opened = dependencies.openStore(op.controller.signal).then((value) => {
        if (disposed || current !== op || op.controller.signal.aborted) {
          value.close();
          throw new ContentOfflineStoreError('aborted');
        }
        connection = value;
        return value;
      });
      return await op.wait(opened);
    } catch (error) {
      op.assert();
      // Only a positively absent platform API is the permitted no-IDB session path.
      // An open/read failure, including permission/unknown schema, is not proof of no ledger.
      if (
        typeof indexedDB === 'undefined' &&
        lastControl === null &&
        error instanceof ContentOfflineStoreError &&
        error.code === 'unavailable'
      )
        return null;
      throw error;
    }
  };
  const read = async (db: ContentOfflineStore, op: Operation) => {
    op.assert();
    const view = await op.wait(db.readProjection(op.controller.signal));
    remember(view.control);
    return view;
  };
  const write = async (
    op: Operation,
    label: string,
    action: () => Promise<ContentOfflineControlV1>,
  ) => {
    op.assert();
    return op.wait(
      action().then((control) => {
        // Records only transaction-complete results; cancellation does not claim to undo them.
        op.confirmedWrites.push(label);
        if (current === op && !disposed) remember(control);
        return control;
      }),
    );
  };
  const guarded = (
    meta: ContentOfflineActiveMetadata | null,
    control: ContentOfflineControlV1 | null,
    now: number,
  ): ContentOfflineGuard =>
    evaluateContentOfflineGuard(
      {
        activeKey: meta === null ? null : (meta.key ?? 'session'),
        lastSuccessfulSourceCheckAt: meta?.checkedAt ?? null,
        lastObservedAt: Math.max(observedTime ?? 0, control?.lastObservedAt ?? 0),
        pendingRecheck: sessionCheckPending ? {} : (control?.pendingRecheck ?? null),
        safety: knownSafety,
      },
      now,
    );
  const project = (
    view: ContentOfflineReadProjection | null,
    op: Operation,
    outcome?: ContentOfflineControllerStatus,
    failure: ContentOfflineControllerResult['failure'] = null,
  ): ContentOfflineControllerResult => {
    op.assert();
    const now = dependencies.now();
    const control = view?.control ?? null;
    const stored = view?.active ?? null;
    const active: ContentOfflineActiveMetadata | null =
      stored === null
        ? session === null
          ? null
          : {
              key: null,
              revision: session.runtime.ready.descriptor.releaseRevision,
              checkedAt: session.checkedAt,
              expiresAt: session.checkedAt + contentOfflineTtlMs,
            }
        : {
            key: stored.key,
            revision: stored.revision,
            checkedAt: stored.checkedAt,
            expiresAt: stored.expiresAt,
          };
    const currentGuard = guarded(active, control, now);
    const safety = stored === null ? (session?.safety ?? null) : (control?.safety ?? null);
    const protection = safetyWriteFailed
      ? 'safety-write-failed'
      : safety !== null && mergeContentOfflineSafetyLedger(knownSafety, safety) === null
        ? 'safety-conflict'
        : currentGuard.kind === 'allowed'
          ? null
          : currentGuard.reason;
    const allowed = protection === null && active !== null;
    const alternative = (
      meta: ContentOfflineBundleMetadata | null,
    ): ContentOfflineAlternativeMetadata | null => {
      if (meta === null) return null;
      const guard = guarded(meta, control, now);
      const reason = safetyWriteFailed
        ? 'safety-write-failed'
        : control !== null && mergeContentOfflineSafetyLedger(knownSafety, control.safety) === null
          ? 'safety-conflict'
          : guard.kind === 'allowed'
            ? 'ready'
            : guard.reason;
      return { ...meta, eligible: reason === 'ready', reason };
    };
    const candidate = alternative(view?.candidate ?? null);
    const previous = alternative(view?.previous ?? null);
    const actions: ContentOfflineAction[] = ['check'];
    if (allowed && stored === null && view !== null) actions.unshift('save');
    if (candidate?.eligible) actions.push('activate');
    if (previous?.eligible) actions.push('rollback');
    if (view !== null || session !== null) actions.push('clear');
    const reason = protection ?? 'ready';
    const status =
      outcome ??
      (allowed
        ? stored === null
          ? 'session-only'
          : 'active'
        : reason === 'no-active-bundle'
          ? 'unavailable'
          : 'needs-source-check');
    const runtime = allowed
      ? stored === null
        ? session!.runtime
        : immutableRuntime(stored.ready)
      : null;
    return result(
      status,
      reason,
      {
        readAccess: allowed ? 'allowed' : reason === 'no-active-bundle' ? 'unavailable' : 'blocked',
        runtime,
        persistence: active === null ? 'none' : stored === null ? 'session-only' : 'stored',
        active,
        candidate,
        previous,
        guard: currentGuard,
        actions,
        failure,
        storageFailure:
          outcome === 'storage-error' && failure === 'unavailable' ? 'unavailable' : null,
        checkedAt: active?.checkedAt ?? null,
        revision: active?.revision ?? null,
        activeRevision: active?.revision ?? null,
        candidateRevision: candidate?.revision ?? null,
        previousRevision: previous?.revision ?? null,
      },
      op,
    );
  };
  const projection = async (
    db: ContentOfflineStore | null,
    op: Operation,
    outcome?: ContentOfflineControllerStatus,
    failure: ContentOfflineControllerResult['failure'] = null,
  ) => {
    let view = db === null ? null : await read(db, op);
    const first = project(view, op, outcome, failure);
    // Observing a valid reading advances only monotone observation metadata, never bundle age.
    if (first.readAccess === 'allowed') {
      const now = dependencies.now();
      if (db !== null && view !== null && view.control.lastObservedAt !== now) {
        await write(op, 'observe-time', () =>
          db.observeTime(now, expected(view!.control), op.controller.signal),
        );
        view = await read(db, op);
      }
      observedTime = Math.max(observedTime ?? 0, now);
    }
    return project(view, op, outcome, failure);
  };
  const source = async (
    db: ContentOfflineStore | null,
    op: Operation,
    mode: 'restore' | 'save' | 'check',
  ): Promise<ContentOfflineControllerResult> => {
    let control: ContentOfflineControlV1 | null = null;
    let prepared: ContentOfflineControlV1 | null = null;
    if (db !== null) {
      control = (await read(db, op)).control;
      prepared = await write(op, 'prepare-recheck', () =>
        db.prepareRecheck(dependencies.operationId(), expected(control!), op.controller.signal),
      );
      if (prepared.pendingRecheck === null) throw new ContentOfflineStoreError('stale-operation');
    } else {
      sessionCheckPending = true;
    }
    const checked = await op.wait(dependencies.check(op.controller.signal, knownSafety));
    const checkedAt = dependencies.now();
    if (checked.safety === null)
      return projection(db, op, 'needs-source-check', 'transport-or-validation');
    const merged = mergeContentOfflineSafetyLedger(knownSafety, checked.safety);
    if (merged === null) return projection(db, op, 'needs-source-check', 'safety-conflict');
    knownSafety = merged;
    if (db !== null && prepared !== null) {
      safetyWriteFailed = true;
      const afterSafety = await write(op, 'record-safety', () =>
        db.recordSafety(merged, checkedAt, expected(prepared!), op.controller.signal),
      );
      control = await write(op, 'complete-recheck', () =>
        db.completeRecheck(
          prepared!.pendingRecheck!.operationId,
          expected(prepared!),
          merged,
          checkedAt,
          expected(afterSafety),
          op.controller.signal,
          checked.kind,
        ),
      );
      safetyWriteFailed = false;
    }
    sessionCheckPending = false;
    if (checked.kind === 'failed')
      return projection(db, op, 'needs-source-check', 'transport-or-validation');
    if (
      db === null &&
      mode === 'check' &&
      (session === null ||
        canonicalJson(session.runtime.ready.descriptor) !==
          canonicalJson(checked.runtime.ready.descriptor))
    )
      return projection(null, op, 'storage-error', 'unavailable');
    if (mode === 'restore' || db === null) {
      session = freeze({
        runtime: immutableRuntime(checked.runtime.ready),
        safety: merged,
        checkedAt,
        clearEpoch: control?.clearEpoch ?? null,
      });
      observedTime = checkedAt;
      return projection(
        db,
        op,
        db === null && mode === 'save' ? 'storage-error' : undefined,
        db === null && mode === 'save' ? 'unavailable' : null,
      );
    }
    const staged = await write(op, 'save-candidate', () =>
      db.saveCandidate(
        {
          descriptor: checked.runtime.ready.descriptor,
          documents: documents(checked.runtime),
          checkedAt,
          expected: expected(control!),
        },
        op.controller.signal,
      ),
    );
    // saveCandidate may refresh ACTIVE or PREVIOUS without replacing an existing candidate.
    // Only the identity just checked may be activated; never an unrelated pre-existing B.
    const view = await read(db, op);
    if (view.control.generation !== staged.generation)
      throw new ContentOfflineStoreError('stale-operation');
    const checkedRevision = checked.runtime.ready.descriptor.releaseRevision;
    if (mode === 'save' && view.candidate?.revision === checkedRevision) {
      await write(op, 'activate-candidate', () =>
        db.activateCandidate(dependencies.now(), expected(view.control), op.controller.signal),
      );
    }
    if (view.active !== null || mode === 'save') session = null;
    return projection(
      db,
      op,
      mode === 'check' && view.candidate?.revision === checkedRevision
        ? 'candidate-staged'
        : undefined,
    );
  };
  const guard = (signal?: AbortSignal) =>
    run(async (op) => projection(await store(op), op), signal);
  return Object.freeze({
    restore: (signal?: AbortSignal) =>
      run(async (op) => {
        const db = await store(op);
        const state = await projection(db, op);
        if (state.readAccess !== 'unavailable') return state;
        return source(db, op, 'restore');
      }, signal),
    save: (signal?: AbortSignal) => run(async (op) => source(await store(op), op, 'save'), signal),
    check: (signal?: AbortSignal) =>
      run(async (op) => source(await store(op), op, 'check'), signal),
    activate: (signal?: AbortSignal) =>
      run(async (op) => {
        const db = await store(op);
        if (db === null) return projection(db, op, 'storage-error', 'unavailable');
        const view = await read(db, op);
        if (!project(view, op).candidate?.eligible) return projection(db, op, 'needs-source-check');
        await write(op, 'activate-candidate', () =>
          db.activateCandidate(dependencies.now(), expected(view.control), op.controller.signal),
        );
        session = null;
        return projection(db, op);
      }, signal),
    rollback: (signal?: AbortSignal) =>
      run(async (op) => {
        const db = await store(op);
        if (db === null) return projection(db, op, 'storage-error', 'unavailable');
        const view = await read(db, op);
        if (!project(view, op).previous?.eligible) return projection(db, op, 'needs-source-check');
        await write(op, 'rollback', () =>
          db.rollback(dependencies.now(), expected(view.control), op.controller.signal),
        );
        session = null;
        return projection(db, op);
      }, signal),
    clear: (signal?: AbortSignal) => {
      if (current !== null) {
        stop(current, 'aborted');
        current = null;
      }
      session = null;
      return run(async (op) => {
        const db = await store(op);
        if (db === null) return project(null, op, 'unavailable');
        const snapshot = await op.wait(db.snapshot(op.controller.signal));
        remember(snapshot.control);
        await write(op, 'clear', () => db.clear(expected(snapshot.control), op.controller.signal));
        return projection(db, op, 'unavailable');
      }, signal);
    },
    guard,
    resumeGuard: guard,
    dispose() {
      disposed = true;
      session = null;
      if (current !== null) stop(current, 'disposed');
      connection?.close();
      connection = null;
    },
  });
}
