import { canonicalJson } from '@wrn/content-contracts';
import {
  createEmptyProductionMediaOfflineControlV1,
  productionMediaOfflineBundleKeyV1,
} from '@wrn/content-contracts/production-media-offline-v1';
import {
  compileProductionMediaProviderPolicyV1,
  emptyProductionMediaProviderPolicyV1,
  type ProductionMediaProviderPolicyV1,
  type ProductionMediaSafetyV1,
} from '@wrn/content-contracts/production-media-v1';
import {
  createProductionMediaPlayer,
  type ProductionMediaAudio,
  type ProductionMediaConsentPrompt,
  type ProductionMediaPlayerState,
  type ProductionMediaPlaybackIdentity,
} from './production-media-player';
import type {
  ProductionMediaSafetyCommit,
  ProductionMediaSourceResult,
} from './production-media-release';
import type {
  ProductionMediaOfflineActiveSnapshot,
  ProductionMediaOfflineStore,
} from './production-media-offline-store';
import type {
  ProductionMediaResumeMutation,
  ProductionMediaResumeRecord,
  ProductionMediaResumeState,
  ProductionMediaResumeStore,
} from './production-media-resume-store';

export type ProductionMediaControllerState = Readonly<{
  phase: 'local' | 'checking' | 'unavailable' | 'storage-error' | 'disposed';
  reason:
    | 'ready'
    | 'no-active-release'
    | 'source-disabled'
    | 'source-failed'
    | 'safety-persisted-payload-failed'
    | 'conflict'
    | 'aborted'
    | 'timeout'
    | 'cleared'
    | 'rollback-unavailable'
    | 'storage-error'
    | 'disposed';
  active: Readonly<{
    ready: ProductionMediaOfflineActiveSnapshot['ready'];
    generation: string;
    clearEpoch: number;
    checkedAt: number;
  }> | null;
  player: ProductionMediaPlayerState;
  resume: Readonly<{
    kind: 'none' | 'available' | 'unavailable';
    episodeId?: string;
    positionMs?: number;
    durationMs?: number;
  }>;
}>;

type Source = Readonly<{
  load(
    input: Readonly<{
      signal: AbortSignal;
      knownSafety: ProductionMediaSafetyV1;
      commitSafety: ProductionMediaSafetyCommit;
    }>,
  ): Promise<ProductionMediaSourceResult>;
}>;

export type ProductionMediaControllerPorts = Readonly<{
  openOffline(signal?: AbortSignal): Promise<ProductionMediaOfflineStore>;
  openResume(signal?: AbortSignal): Promise<ProductionMediaResumeStore>;
  source: Source | null;
  initialSource?: Source | null;
  allowedOrigins: ReadonlySet<string>;
  providerPolicy?: ProductionMediaProviderPolicyV1;
  now?: () => number;
  operationId?: () => string;
  audio?: () => ProductionMediaAudio;
  online?: () => boolean;
  onState?: (state: ProductionMediaControllerState) => void;
}>;

type Operation = Readonly<{
  id: number;
  controller: AbortController;
  startedAt: number;
  timedOut: { value: boolean };
}>;
type ResumeBudget = Readonly<{ controller: AbortController; startedAt: number }>;
type OwnedResume = Readonly<{
  record: ProductionMediaResumeRecord;
  generation: number;
  token: number;
  cleanupStarted: { value: boolean };
}>;

const operationLimitMs = 30_000;
const frozen = <T>(value: T): T => Object.freeze(value);
const emptyResume = frozen({ kind: 'none' as const });
const unavailableResume = frozen({ kind: 'unavailable' as const });
const initial = (): ProductionMediaControllerState =>
  frozen({
    phase: 'local',
    reason: 'no-active-release',
    active: null,
    player: frozen({
      phase: 'idle',
      episodeId: null,
      positionMs: 0,
      durationMs: null,
      error: null,
    }),
    resume: emptyResume,
  });
const sameRecord = (left: ProductionMediaResumeRecord, right: ProductionMediaResumeRecord) =>
  left.recordVersion === right.recordVersion &&
  left.key === right.key &&
  left.episodeId === right.episodeId &&
  left.streamId === right.streamId &&
  left.releaseRevision === right.releaseRevision &&
  left.streamRevision === right.streamRevision &&
  left.positionMs === right.positionMs &&
  left.durationMs === right.durationMs;

/** Headless A4/A6/A2/A5 coordinator. It never manufactures an A1 Ready. */
export function createProductionMediaController(ports: ProductionMediaControllerPorts) {
  const origins = new Set(ports.allowedOrigins);
  const policy =
    ports.providerPolicy === undefined && origins.size === 0
      ? emptyProductionMediaProviderPolicyV1
      : compileProductionMediaProviderPolicyV1(ports.providerPolicy, origins);
  if (!policy) throw new Error('Invalid media provider policy');
  const source = ports.source;
  const initialSource = ports.initialSource ?? null;
  const pristineControl = canonicalJson(createEmptyProductionMediaOfflineControlV1());
  let state = initial();
  let epoch = 0;
  let command: Operation | null = null;
  let disposed = false;
  let offline: ProductionMediaOfflineStore | null = null;
  let resumeStore: ProductionMediaResumeStore | null = null;
  let resumeState: ProductionMediaResumeState | null = null;
  let active: ProductionMediaControllerState['active'] = null;
  let activeKey: string | null = null;
  let lastDomainNow: number | null = null;
  let resumeToken = 0;
  let ownedResume: OwnedResume | null = null;
  let resumeTail: Promise<void> = Promise.resolve();
  const resumeJobs = new Set<Promise<void>>();

  const controllerNow = () => {
    let value: number;
    try {
      value = (ports.now ?? Date.now)();
    } catch {
      throw new Error('clock');
    }
    if (!Number.isFinite(value) || value < 0 || (lastDomainNow !== null && value < lastDomainNow))
      throw new Error('clock');
    lastDomainNow = value;
    return value;
  };
  const isCurrent = (operation: Operation) =>
    !disposed &&
    command === operation &&
    epoch === operation.id &&
    !operation.controller.signal.aborted;
  const ownsEpoch = (operation: Operation) =>
    !disposed && command === operation && epoch === operation.id;
  const begin = (): Operation => {
    command?.controller.abort();
    const operation = frozen({
      id: ++epoch,
      controller: new AbortController(),
      startedAt: Date.now(),
      timedOut: { value: false },
    });
    command = operation;
    return operation;
  };
  const remaining = (startedAt: number) => operationLimitMs - (Date.now() - startedAt);
  const timed = async <T>(operation: Operation, work: () => Promise<T>): Promise<T> => {
    const left = remaining(operation.startedAt);
    if (left <= 0) {
      operation.timedOut.value = true;
      operation.controller.abort();
      throw new DOMException('TimeoutError', 'TimeoutError');
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        Promise.resolve().then(work),
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => {
            operation.timedOut.value = true;
            operation.controller.abort();
            reject(new DOMException('TimeoutError', 'TimeoutError'));
          }, left);
        }),
      ]);
      if (remaining(operation.startedAt) <= 0) {
        operation.timedOut.value = true;
        operation.controller.abort();
        throw new DOMException('TimeoutError', 'TimeoutError');
      }
      if (!isCurrent(operation)) throw new DOMException('AbortError', 'AbortError');
      return result;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  };
  const timedResume = async <T>(
    budget: ResumeBudget,
    work: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> => {
    const left = remaining(budget.startedAt);
    if (left <= 0) {
      budget.controller.abort();
      throw new DOMException('TimeoutError', 'TimeoutError');
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        Promise.resolve().then(() => work(budget.controller.signal)),
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => {
            budget.controller.abort();
            reject(new DOMException('TimeoutError', 'TimeoutError'));
          }, left);
        }),
      ]);
      if (remaining(budget.startedAt) <= 0) {
        budget.controller.abort();
        throw new DOMException('TimeoutError', 'TimeoutError');
      }
      return result;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  };
  const commandReason = (
    operation: Operation,
    fallback: ProductionMediaControllerState['reason'],
  ) =>
    operation.timedOut.value
      ? ('timeout' as const)
      : operation.controller.signal.aborted
        ? ('aborted' as const)
        : fallback;

  const publish = (
    next: Omit<ProductionMediaControllerState, 'player'> &
      Partial<Pick<ProductionMediaControllerState, 'player'>>,
  ) => {
    if (disposed && next.phase !== 'disposed') return;
    state = frozen({ ...next, player: next.player ?? player.getState() });
    try {
      ports.onState?.(state);
    } catch {
      // Observers never own controller state.
    }
  };
  const invalidateResumeOwnership = () => {
    resumeToken++;
    const owned = ownedResume;
    ownedResume = null;
    if (owned && !owned.cleanupStarted.value) {
      owned.cleanupStarted.value = true;
      scheduleOwnedCleanup(owned, Date.now());
    }
  };
  /** Playback invalidation deliberately preserves the current source command. */
  const dropPlaybackAuthority = () => {
    active = null;
    activeKey = null;
    invalidateResumeOwnership();
    player.stop();
  };

  const resumeView = () => {
    if (!active || !resumeState) return emptyResume;
    for (const record of resumeState.records) {
      const stream = active.ready.documents.manifest.streams.find(
        (item) => item.id === record.streamId && item.episodeId === record.episodeId,
      );
      if (
        stream &&
        record.releaseRevision === active.ready.pointer.releaseRevision &&
        record.streamRevision === stream.streamRevision &&
        record.durationMs === stream.durationMs
      )
        return frozen({
          kind: 'available' as const,
          episodeId: record.episodeId,
          positionMs: record.positionMs,
          durationMs: record.durationMs,
        });
    }
    return emptyResume;
  };
  const recordForEpisode = (episodeId: string) => {
    if (!active || !resumeState) return null;
    const stream = active.ready.documents.manifest.streams.find(
      (item) => item.episodeId === episodeId,
    );
    if (!stream) return null;
    return (
      resumeState.records.find(
        (record) =>
          record.episodeId === episodeId &&
          record.streamId === stream.id &&
          record.releaseRevision === active!.ready.pointer.releaseRevision &&
          record.streamRevision === stream.streamRevision &&
          record.durationMs === stream.durationMs,
      ) ?? null
    );
  };
  const trackResumeJob = (work: () => Promise<void>) => {
    const job = resumeTail.then(work, work);
    resumeTail = job.catch(() => undefined);
    resumeJobs.add(job);
    void job.finally(() => resumeJobs.delete(job)).catch(() => undefined);
    return job;
  };
  const deleteOwnedExact = async (
    store: ProductionMediaResumeStore,
    record: ProductionMediaResumeRecord,
    generation: number,
    budget: ResumeBudget,
  ): Promise<ProductionMediaResumeMutation> => {
    let mutation = await timedResume(budget, (signal) =>
      store.deleteIfExact(record.key, record, generation, signal),
    );
    if (
      mutation.kind === 'no-op' &&
      mutation.state.records.some((item) => sameRecord(item, record))
    )
      mutation = await timedResume(budget, (signal) =>
        store.deleteIfExact(record.key, record, mutation.state.generation, signal),
      );
    return mutation;
  };
  const scheduleOwnedCleanup = (owned: OwnedResume, startedAt: number) => {
    const store = resumeStore;
    if (!store) return;
    const budget = { controller: new AbortController(), startedAt };
    trackResumeJob(async () => {
      try {
        const mutation = await deleteOwnedExact(store, owned.record, owned.generation, budget);
        if (!disposed) {
          resumeState = mutation.state;
          publish({ ...state, active, resume: resumeView() });
        }
      } catch {
        if (!disposed) publish({ ...state, active, resume: unavailableResume });
      }
    });
  };
  const startPauseSave = (identity: ProductionMediaPlaybackIdentity, positionMs: number) => {
    const store = resumeStore;
    const before = resumeState;
    const context = active;
    const token = ++resumeToken;
    const startedAt = Date.now();
    const stream = context?.ready.documents.manifest.streams.find(
      (item) => item.id === identity.streamId && item.episodeId === identity.episodeId,
    );
    if (
      !store ||
      !before ||
      !context ||
      identity.generation !== context.generation ||
      identity.releaseRevision !== context.ready.pointer.releaseRevision ||
      !stream ||
      stream.streamRevision !== identity.streamRevision ||
      !Number.isSafeInteger(positionMs) ||
      positionMs < 0 ||
      positionMs >= stream.durationMs
    )
      return;
    const record: ProductionMediaResumeRecord = frozen({
      recordVersion: 1,
      key: `episode:${identity.episodeId}`,
      episodeId: identity.episodeId,
      streamId: identity.streamId,
      releaseRevision: identity.releaseRevision,
      streamRevision: identity.streamRevision,
      positionMs,
      durationMs: stream.durationMs,
    });
    const budget = { controller: new AbortController(), startedAt };
    trackResumeJob(async () => {
      try {
        const mutation = await timedResume(budget, (signal) =>
          store.save(record, before.generation, signal),
        );
        if (!disposed) resumeState = mutation.state;
        if (mutation.kind !== 'saved') {
          if (!disposed) publish({ ...state, active, resume: resumeView() });
          return;
        }
        const owned: OwnedResume = frozen({
          record,
          generation: mutation.state.generation,
          token,
          cleanupStarted: { value: false },
        });
        if (token === resumeToken && !disposed) {
          ownedResume = owned;
          publish({ ...state, active, resume: resumeView() });
          return;
        }
        owned.cleanupStarted.value = true;
        const cleaned = await deleteOwnedExact(store, record, mutation.state.generation, budget);
        if (!disposed) {
          resumeState = cleaned.state;
          publish({ ...state, active, resume: resumeView() });
        }
      } catch {
        if (!disposed && token === resumeToken)
          publish({ ...state, active, resume: unavailableResume });
      }
    });
  };
  const scheduleEndedDelete = (identity: ProductionMediaPlaybackIdentity) => {
    const store = resumeStore;
    const before = resumeState;
    const record = before?.records.find(
      (item) =>
        item.episodeId === identity.episodeId &&
        item.streamId === identity.streamId &&
        item.releaseRevision === identity.releaseRevision &&
        item.streamRevision === identity.streamRevision,
    );
    resumeToken++;
    ownedResume = null;
    if (!store || !before || !record) return;
    const budget = { controller: new AbortController(), startedAt: Date.now() };
    trackResumeJob(async () => {
      try {
        const mutation = await deleteOwnedExact(store, record, before.generation, budget);
        if (!disposed) {
          resumeState = mutation.state;
          publish({ ...state, active, resume: resumeView() });
        }
      } catch {
        if (!disposed) publish({ ...state, active, resume: unavailableResume });
      }
    });
  };

  const player = createProductionMediaPlayer({
    context: () => (active ? frozen({ ready: active.ready, generation: active.generation }) : null),
    allowedOrigins: origins,
    ...(ports.audio ? { audio: ports.audio } : {}),
    ...(ports.now ? { now: ports.now } : {}),
    ...(ports.online ? { online: ports.online } : {}),
    onState: (playerState) =>
      publish({ ...state, active, player: playerState, resume: resumeView() }),
    onExplicitPause: startPauseSave,
    onTerminated: (identity, reason) => {
      if (reason === 'ended') scheduleEndedDelete(identity);
    },
  });

  const install = async (db: ProductionMediaOfflineStore, operation: Operation) => {
    const fresh = await timed(operation, () =>
      db.readActive(controllerNow(), origins, policy, operation.controller.signal),
    );
    if (!fresh) {
      dropPlaybackAuthority();
      return null;
    }
    const key = await timed(operation, () =>
      productionMediaOfflineBundleKeyV1({
        releaseRevision: fresh.ready.pointer.releaseRevision,
        sequence: fresh.ready.pointer.sequence,
        descriptorSha256: fresh.ready.pointer.descriptorSha256,
      }),
    );
    const check = await timed(operation, () => db.snapshot(operation.controller.signal));
    if (
      check.control.activeKey !== key ||
      check.control.generation !== fresh.generation ||
      check.control.clearEpoch !== fresh.clearEpoch
    ) {
      dropPlaybackAuthority();
      throw new Error('conflict');
    }
    const generation = `media:${fresh.generation}:${fresh.clearEpoch}:${key}`;
    if (generation.length > 128) {
      dropPlaybackAuthority();
      throw new Error('generation');
    }
    if (active && (active.generation !== generation || activeKey !== key)) {
      dropPlaybackAuthority();
      if (!isCurrent(operation)) throw new DOMException('AbortError', 'AbortError');
    }
    activeKey = key;
    active = frozen({
      ready: fresh.ready,
      generation,
      clearEpoch: fresh.clearEpoch,
      checkedAt: fresh.checkedAt,
    });
    return active;
  };
  const trackOpen = <T extends { close(): void }>(promise: Promise<T>, operation: Operation) => {
    let handle: T | null = null;
    let transferred = false;
    let discarded = false;
    let closed = false;
    const close = () => {
      if (!handle || transferred || closed) return;
      closed = true;
      try {
        handle.close();
      } catch {
        // A rejected open result has no remaining controller ownership.
      }
    };
    const tracked = promise.then((value) => {
      handle = value;
      if (discarded || !isCurrent(operation)) close();
      return value;
    });
    void tracked.catch(() => undefined);
    return {
      promise: tracked,
      transfer() {
        transferred = true;
      },
      discard() {
        discarded = true;
        close();
      },
    };
  };
  const invalidResumeRecords = () => {
    if (!active || !resumeState) return [] as ProductionMediaResumeRecord[];
    return resumeState.records.filter((record) => {
      const stream = active!.ready.documents.manifest.streams.find(
        (item) => item.episodeId === record.episodeId,
      );
      return (
        !stream ||
        stream.id !== record.streamId ||
        record.releaseRevision !== active!.ready.pointer.releaseRevision ||
        record.streamRevision !== stream.streamRevision ||
        record.durationMs !== stream.durationMs
      );
    });
  };
  const cleanInvalidMountedRecords = (records: readonly ProductionMediaResumeRecord[]) => {
    const store = resumeStore;
    const before = resumeState;
    if (!store || !before || records.length === 0) return;
    const budget = { controller: new AbortController(), startedAt: Date.now() };
    trackResumeJob(async () => {
      let generation = before.generation;
      try {
        for (const record of records) {
          const mutation = await deleteOwnedExact(store, record, generation, budget);
          generation = mutation.state.generation;
          if (!disposed) resumeState = mutation.state;
        }
        if (!disposed) publish({ ...state, active, resume: resumeView() });
      } catch {
        if (!disposed) publish({ ...state, active, resume: unavailableResume });
      }
    });
  };

  const mount = async () => {
    if (disposed) return state;
    const operation = begin();
    let offlineOpen: ReturnType<typeof trackOpen<ProductionMediaOfflineStore>> | null = null;
    let resumeOpen: ReturnType<typeof trackOpen<ProductionMediaResumeStore>> | null = null;
    dropPlaybackAuthority();
    publish({
      ...state,
      phase: 'local',
      reason: 'no-active-release',
      active: null,
      resume: emptyResume,
    });
    try {
      offlineOpen = trackOpen(
        Promise.resolve().then(() => ports.openOffline(operation.controller.signal)),
        operation,
      );
      resumeOpen = trackOpen(
        Promise.resolve().then(() => ports.openResume(operation.controller.signal)),
        operation,
      );
      const [db, rs] = await timed(operation, () =>
        Promise.all([offlineOpen!.promise, resumeOpen!.promise]),
      );
      if (!isCurrent(operation)) {
        offlineOpen.discard();
        resumeOpen.discard();
        return state;
      }
      offlineOpen.transfer();
      resumeOpen.transfer();
      if (offline && offline !== db) offline.close();
      if (resumeStore && resumeStore !== rs) resumeStore.close();
      offline = db;
      resumeStore = rs;
      resumeState = await timed(operation, () => rs.snapshot(operation.controller.signal));
      const installed = await install(db, operation);
      publish({
        ...state,
        phase: 'local',
        reason: installed ? 'ready' : 'no-active-release',
        active: installed,
        resume: resumeView(),
      });
      if (!isCurrent(operation)) return state;
      cleanInvalidMountedRecords(invalidResumeRecords());
      return state;
    } catch {
      offlineOpen?.discard();
      resumeOpen?.discard();
      if (!ownsEpoch(operation)) return state;
      const reason = commandReason(operation, 'storage-error');
      operation.controller.abort();
      dropPlaybackAuthority();
      publish({
        ...state,
        phase: 'storage-error',
        reason,
        active: null,
        resume: emptyResume,
      });
      return state;
    }
  };

  const checkSource = async (selectedSource: Source | null, initialOnly = false) => {
    if (disposed) return state;
    const operation = begin();
    if (selectedSource === null) {
      publish({ ...state, phase: 'unavailable', reason: 'source-disabled' });
      return state;
    }
    publish({ ...state, phase: 'checking', reason: active ? 'ready' : 'no-active-release' });
    let db: ProductionMediaOfflineStore | null = null;
    let safetyAttempted = false;
    let safetyReturned = false;
    let operationId: string | null = null;
    let lease: { generation: number; clearEpoch: number } | null = null;
    let opening: ReturnType<typeof trackOpen<ProductionMediaOfflineStore>> | null = null;
    try {
      if (offline) db = offline;
      else {
        opening = trackOpen(
          Promise.resolve().then(() => ports.openOffline(operation.controller.signal)),
          operation,
        );
        db = await timed(operation, () => opening!.promise);
        opening.transfer();
        offline = db;
      }
      const base = await timed(operation, () => db!.snapshot(operation.controller.signal));
      if (
        initialOnly &&
        (base.bundles.length !== 0 || canonicalJson(base.control) !== pristineControl)
      ) {
        const installed = await install(db, operation);
        publish({
          ...state,
          phase: installed || base.control.clearEpoch > 0 ? 'local' : 'unavailable',
          reason: installed ? 'ready' : base.control.clearEpoch > 0 ? 'cleared' : 'source-failed',
          active: installed,
          resume: resumeView(),
        });
        return state;
      }
      operationId = (() => {
        try {
          const value = (ports.operationId ?? (() => crypto.randomUUID()))();
          return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,127}$/.test(value)
            ? value
            : null;
        } catch {
          return null;
        }
      })();
      if (!operationId) throw new Error('operation');
      const prepared = await timed(operation, () =>
        db!.prepareRecheck(
          operationId!,
          { generation: base.control.generation, clearEpoch: base.control.clearEpoch },
          operation.controller.signal,
        ),
      );
      lease = { generation: prepared.generation, clearEpoch: prepared.clearEpoch };
      let committed = false;
      let durableSafety = prepared.safety;
      const result = await timed(operation, () =>
        selectedSource.load({
          signal: operation.controller.signal,
          knownSafety: prepared.safety,
          commitSafety: async (safety, sourceSignal) => {
            safetyAttempted = true;
            try {
              const control = await timed(operation, () =>
                db!.commitSafety(operationId!, safety, controllerNow(), lease!, sourceSignal),
              );
              if (!isCurrent(operation)) throw new DOMException('AbortError', 'AbortError');
              lease = { generation: control.generation, clearEpoch: control.clearEpoch };
              durableSafety = control.safety;
              committed = true;
              safetyReturned = true;
              if (control.activeKey !== activeKey) {
                dropPlaybackAuthority();
                if (!isCurrent(operation)) throw new DOMException('AbortError', 'AbortError');
              }
              return control.safety;
            } catch (error) {
              dropPlaybackAuthority();
              throw error;
            }
          },
        }),
      );
      if (safetyAttempted && !safetyReturned) throw new Error('uncertain-safety');
      if (result.kind !== 'ready') {
        const outcome = committed
          ? ('safety-verified-payload-failed' as const)
          : ('unverified-preserve-check-time' as const);
        const control = await timed(operation, () =>
          db!.finishRecheck(
            operationId!,
            outcome,
            controllerNow(),
            lease!,
            operation.controller.signal,
          ),
        );
        if (control.activeKey !== activeKey) dropPlaybackAuthority();
        if (!isCurrent(operation)) return state;
        try {
          await install(db, operation);
        } catch {
          dropPlaybackAuthority();
        }
        publish({
          ...state,
          phase: 'unavailable',
          reason: committed ? 'safety-persisted-payload-failed' : 'source-failed',
          active,
          resume: resumeView(),
        });
        return state;
      }
      const key = await timed(operation, () =>
        productionMediaOfflineBundleKeyV1({
          releaseRevision: result.ready.pointer.releaseRevision,
          sequence: result.ready.pointer.sequence,
          descriptorSha256: result.ready.pointer.descriptorSha256,
        }),
      );
      if (key === null) throw new Error('key');
      const saved = await timed(operation, () =>
        db!.saveCandidate(
          {
            ...result.raw,
            admittedSafety: durableSafety,
            checkedAt: controllerNow(),
            operationId: operationId!,
            expected: lease!,
          },
          operation.controller.signal,
        ),
      );
      lease = { generation: saved.generation, clearEpoch: saved.clearEpoch };
      const activated = await timed(operation, () =>
        db!.activateCandidate(
          key,
          controllerNow(),
          origins,
          operationId!,
          lease!,
          policy,
          operation.controller.signal,
        ),
      );
      lease = { generation: activated.generation, clearEpoch: activated.clearEpoch };
      await timed(operation, () =>
        db!.finishRecheck(
          operationId!,
          'ready',
          controllerNow(),
          lease!,
          operation.controller.signal,
        ),
      );
      const installed = await install(db, operation);
      publish({
        ...state,
        phase: 'local',
        reason: installed ? 'ready' : 'conflict',
        active: installed,
        resume: resumeView(),
      });
      return state;
    } catch {
      opening?.discard();
      if (!ownsEpoch(operation)) return state;
      if (safetyAttempted && !safetyReturned) {
        dropPlaybackAuthority();
      } else if (
        !operation.timedOut.value &&
        !operation.controller.signal.aborted &&
        db &&
        operationId &&
        lease
      ) {
        try {
          await timed(operation, () =>
            db!.finishRecheck(
              operationId!,
              safetyReturned ? 'safety-verified-payload-failed' : 'unverified-preserve-check-time',
              controllerNow(),
              lease!,
              operation.controller.signal,
            ),
          );
        } catch {
          // A lost lease is reconciled only through the fresh A6 fence below.
        }
        if (isCurrent(operation)) {
          try {
            await install(db, operation);
          } catch {
            dropPlaybackAuthority();
          }
        }
      }
      if (operation.timedOut.value) dropPlaybackAuthority();
      const reason = commandReason(
        operation,
        safetyReturned ? 'safety-persisted-payload-failed' : 'conflict',
      );
      publish({
        ...state,
        phase: 'unavailable',
        reason,
        active,
        resume: resumeView(),
      });
      return state;
    }
  };

  const recheck = () => checkSource(source);
  const bootstrapInitial = () => checkSource(initialSource, true);

  const rollback = async () => {
    if (disposed) return state;
    const operation = begin();
    let opening: ReturnType<typeof trackOpen<ProductionMediaOfflineStore>> | null = null;
    try {
      let db: ProductionMediaOfflineStore;
      if (offline) db = offline;
      else {
        opening = trackOpen(
          Promise.resolve().then(() => ports.openOffline(operation.controller.signal)),
          operation,
        );
        db = await timed(operation, () => opening!.promise);
        opening.transfer();
        offline = db;
      }
      const before = await timed(operation, () => db.snapshot(operation.controller.signal));
      await timed(operation, () =>
        db.rollback(
          controllerNow(),
          origins,
          {
            generation: before.control.generation,
            clearEpoch: before.control.clearEpoch,
          },
          policy,
          operation.controller.signal,
        ),
      );
      const installed = await install(db, operation);
      publish({
        ...state,
        phase: installed ? 'local' : 'unavailable',
        reason: installed ? 'ready' : 'rollback-unavailable',
        active: installed,
        resume: resumeView(),
      });
      return state;
    } catch {
      opening?.discard();
      if (!ownsEpoch(operation)) return state;
      const reason = commandReason(operation, 'rollback-unavailable');
      if (!operation.timedOut.value && offline && isCurrent(operation)) {
        try {
          const reconciled = await install(offline, operation);
          publish({
            ...state,
            phase: 'unavailable',
            reason,
            active: reconciled,
            resume: resumeView(),
          });
          return state;
        } catch {
          // A failed fresh fence has no authority to retain the prior context.
        }
      }
      dropPlaybackAuthority();
      publish({
        ...state,
        phase: 'unavailable',
        reason,
        active: null,
        resume: resumeView(),
      });
      return state;
    }
  };

  const clearLocal = async () => {
    if (disposed) return state;
    const operation = begin();
    let offlineOpen: ReturnType<typeof trackOpen<ProductionMediaOfflineStore>> | null = null;
    let resumeOpen: ReturnType<typeof trackOpen<ProductionMediaResumeStore>> | null = null;
    dropPlaybackAuthority();
    let a6Cleared = false;
    try {
      await timed(operation, () => Promise.allSettled([...resumeJobs]).then(() => undefined));
      let db: ProductionMediaOfflineStore;
      if (offline) db = offline;
      else {
        offlineOpen = trackOpen(
          Promise.resolve().then(() => ports.openOffline(operation.controller.signal)),
          operation,
        );
        db = await timed(operation, () => offlineOpen!.promise);
        offlineOpen.transfer();
        offline = db;
      }
      let rs: ProductionMediaResumeStore;
      if (resumeStore) rs = resumeStore;
      else {
        resumeOpen = trackOpen(
          Promise.resolve().then(() => ports.openResume(operation.controller.signal)),
          operation,
        );
        rs = await timed(operation, () => resumeOpen!.promise);
        resumeOpen.transfer();
        resumeStore = rs;
      }
      const [a6Before, a5Before] = await timed(operation, () =>
        Promise.all([
          db.snapshot(operation.controller.signal),
          rs.snapshot(operation.controller.signal),
        ]),
      );
      await timed(operation, () =>
        db.clear(
          {
            generation: a6Before.control.generation,
            clearEpoch: a6Before.control.clearEpoch,
          },
          operation.controller.signal,
        ),
      );
      a6Cleared = true;
      let mutation = await timed(operation, () =>
        rs.clearExact(a5Before.records, a5Before.generation, operation.controller.signal),
      );
      if (mutation.kind === 'no-op' && a5Before.records.length > 0)
        mutation = await timed(operation, () =>
          rs.clearExact(a5Before.records, mutation.state.generation, operation.controller.signal),
        );
      const finalResume = await timed(operation, () => rs.snapshot(operation.controller.signal));
      resumeState = finalResume;
      const residual = finalResume.records.length > 0;
      publish({
        ...state,
        phase: residual ? 'storage-error' : 'local',
        reason: residual ? 'storage-error' : 'cleared',
        active: null,
        resume: residual ? unavailableResume : emptyResume,
      });
      return state;
    } catch {
      offlineOpen?.discard();
      resumeOpen?.discard();
      if (!ownsEpoch(operation)) return state;
      const reason = commandReason(operation, 'storage-error');
      publish({
        ...state,
        phase: 'storage-error',
        reason,
        active: null,
        resume: a6Cleared ? unavailableResume : resumeView(),
      });
      return state;
    }
  };

  const preparePlay = (episodeId: string) =>
    !disposed && active ? player.prepareConsent(episodeId, 0) : null;
  const prepareResume = (episodeId: string) => {
    if (disposed || !active) return null;
    const record = recordForEpisode(episodeId);
    return record ? player.prepareConsent(episodeId, record.positionMs) : null;
  };
  const continuePlayback = () => {
    resumeToken++;
    const owned = ownedResume;
    ownedResume = null;
    if (owned && !owned.cleanupStarted.value) {
      owned.cleanupStarted.value = true;
      scheduleOwnedCleanup(owned, Date.now());
    }
    return player.continue();
  };

  return frozen({
    getState: () => state,
    mount,
    recheck,
    bootstrapInitial,
    clearLocal,
    preparePlay,
    prepareResume,
    confirmPlay: (prompt: ProductionMediaConsentPrompt) => player.confirmPlay(prompt),
    cancelConsent: () => player.cancelConsent(),
    pause: () => player.pause(),
    continue: continuePlayback,
    seek: (positionMs: number) => player.seek(positionMs),
    refresh: () => player.refresh(),
    rollback,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      command?.controller.abort();
      epoch++;
      active = null;
      activeKey = null;
      invalidateResumeOwnership();
      player.stop();
      player.dispose();
      const db = offline;
      const rs = resumeStore;
      offline = null;
      resumeStore = null;
      db?.close();
      state = frozen({
        ...state,
        phase: 'disposed',
        reason: 'disposed',
        active: null,
        player: player.getState(),
        resume: emptyResume,
      });
      try {
        ports.onState?.(state);
      } catch {
        // Disposed remains final despite observer failures.
      }
      if (rs) {
        const pending = Promise.allSettled([...resumeJobs]).then(() => rs.close());
        let timer: ReturnType<typeof setTimeout> | undefined;
        void Promise.race([
          pending,
          new Promise<void>((resolve) => {
            timer = setTimeout(() => {
              rs.close();
              resolve();
            }, operationLimitMs);
          }),
        ]).finally(() => {
          if (timer !== undefined) clearTimeout(timer);
        });
      }
    },
  });
}
