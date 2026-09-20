import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { MobileMediaCopy, UiLanguage } from '@wrn/ui-language';
import { MobileMediaCatalogError, openMobileMediaCatalogStore } from './mobile-media-catalog-store';
import { createMobileMediaHub, type MobileMediaHubProjection } from './mobile-media-hub';
import { mobileMediaBuildPin, loadMobileMediaRelease } from './mobile-media-release';
import type { MobileMediaPlayerState } from './mobile-media-player';
import {
  openMobileMediaResumeStore,
  type MobileMediaResumeStore,
} from './mobile-media-resume-store';

type CatalogStore = Awaited<ReturnType<typeof openMobileMediaCatalogStore>>;
type MediaHub = ReturnType<typeof createMobileMediaHub>;
export type MobileMediaResumeStatus = ReturnType<MediaHub['resumeStatus']>;

export type MobileMediaHubViewModel = MobileMediaHubProjection &
  Readonly<{
    loading: boolean;
    bootstrapFailure: boolean;
    bootstrap: 'none' | 'offline' | 'invalid';
    recovery: boolean;
    recoveryBusy: boolean;
    player: MobileMediaPlayerState;
    resume: MobileMediaResumeStatus;
  }>;

export type MobileMediaHubControllerAdapters = Readonly<{
  openCatalog(clock: () => number): Promise<CatalogStore>;
  openResume(): Promise<MobileMediaResumeStore>;
  load(signal: AbortSignal, clock: () => number): ReturnType<typeof loadMobileMediaRelease>;
}>;

type ControllerResumeHandle = Readonly<{
  store: MobileMediaResumeStore;
  closeWhenIdle(): void;
}>;

/** The P3 hub may compensate a fulfilled late pause-save with deleteIfExact
 * in its next microtask. This controller-owned wrapper keeps the real IDB
 * handle open through that exact, already-started continuation, then closes
 * once; it has no retry or polling timer. */
// This exported test seam exercises the controller's real-store close ordering.
// eslint-disable-next-line react-refresh/only-export-components
export function createControllerResumeHandle(
  store: MobileMediaResumeStore,
): ControllerResumeHandle {
  const active = new Set<Promise<unknown>>();
  let closing = false;
  let closed = false;
  let closeTask: ReturnType<typeof setTimeout> | null = null;
  const maybeClose = () => {
    if (!closing || closed || active.size > 0 || closeTask !== null) return;
    // This is one cancellable resource-close task, never a retry or polling
    // loop. It runs after promise continuations so P3 can begin its exact
    // late-save compensation before this controller releases the handle.
    closeTask = setTimeout(() => {
      closeTask = null;
      if (!closing || closed || active.size > 0) return;
      closed = true;
      store.close();
    }, 0);
  };
  const track = <T,>(operation: () => Promise<T>) => {
    let result: Promise<T>;
    try {
      result = operation();
    } catch (error) {
      return Promise.reject(error);
    }
    if (closeTask !== null) {
      clearTimeout(closeTask);
      closeTask = null;
    }
    active.add(result);
    void result.then(
      () => {
        active.delete(result);
        maybeClose();
      },
      () => {
        active.delete(result);
        maybeClose();
      },
    );
    return result;
  };
  const wrapped: MobileMediaResumeStore = Object.freeze({
    snapshot: () => track(() => store.snapshot()),
    save: (record, generation) => track(() => store.save(record, generation)),
    deleteIfExact: (key, record, generation) =>
      track(() => store.deleteIfExact(key, record, generation)),
    clearExact: (records, generation) => track(() => store.clearExact(records, generation)),
    close: () => {
      closing = true;
      maybeClose();
    },
  });
  return Object.freeze({
    store: wrapped,
    closeWhenIdle: wrapped.close,
  });
}

const emptyModel = (kind: MobileMediaHubProjection['kind'] = 'empty'): MobileMediaHubViewModel =>
  Object.freeze({
    kind,
    identity: null,
    episodeId: null,
    audioAssetId: null,
    audioAssetHash: null,
    releaseRevision: null,
    expiresAt: null,
    title: null,
    summary: null,
    source: null,
    durationMs: null,
    attribution: null,
    territory: null,
    delivery: null,
    loading: kind === 'empty',
    bootstrapFailure: false,
    bootstrap: 'none',
    recovery: false,
    recoveryBusy: false,
    player: Object.freeze({ playback: 'idle', availability: 'local', error: null }),
    resume: 'idle',
  });

const productionAdapters: MobileMediaHubControllerAdapters = Object.freeze({
  openCatalog: (clock) => openMobileMediaCatalogStore(clock),
  openResume: () => openMobileMediaResumeStore(),
  load: (signal, clock) => loadMobileMediaRelease(signal, mobileMediaBuildPin, fetch, { clock }),
});

function isCanonicalEmpty(snapshot: Awaited<ReturnType<CatalogStore['snapshot']>>) {
  return (
    snapshot.control.generation === 0 &&
    snapshot.control.active === null &&
    snapshot.control.candidate === null &&
    snapshot.control.previous === null &&
    snapshot.bundles.active === null &&
    snapshot.bundles.candidate === null &&
    snapshot.bundles.previous === null
  );
}

type CandidateObservation = Readonly<{ generation: number; serializedCandidate: string }>;

function candidateOnly(
  snapshot: Awaited<ReturnType<CatalogStore['snapshot']>>,
): CandidateObservation | null {
  if (
    snapshot.control.active !== null ||
    snapshot.control.previous !== null ||
    snapshot.control.candidate !== 'candidate' ||
    snapshot.bundles.active !== null ||
    snapshot.bundles.previous !== null ||
    snapshot.bundles.candidate === null
  )
    return null;
  return Object.freeze({
    generation: snapshot.control.generation,
    serializedCandidate: JSON.stringify(snapshot.bundles.candidate),
  });
}

function matchesObservedCandidate(
  snapshot: Awaited<ReturnType<CatalogStore['snapshot']>>,
  observed: CandidateObservation,
) {
  const current = candidateOnly(snapshot);
  return (
    current !== null &&
    current.generation === observed.generation &&
    current.serializedCandidate === observed.serializedCandidate
  );
}

function localized(values: Record<string, string> | null, language: UiLanguage) {
  return values?.[language] ?? values?.en ?? '';
}

function readableDuration(durationMs: number, language: UiLanguage) {
  const total = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return (
    new Intl.NumberFormat(language, { minimumIntegerDigits: 2 }).format(minutes) +
    ':' +
    new Intl.NumberFormat(language, { minimumIntegerDigits: 2 }).format(seconds)
  );
}

function readableExpiry(expiresAt: number, language: UiLanguage) {
  return new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(new Date(expiresAt));
}

function statusText(model: MobileMediaHubViewModel, copy: MobileMediaCopy) {
  if (model.loading) return copy.loading;
  if (model.recovery) return copy.interruptedPreparation;
  if (model.bootstrap === 'offline' || model.player.availability === 'offline') return copy.offline;
  if (model.bootstrap === 'invalid') return copy.unavailable;
  if (model.player.error !== null) return copy.playerError;
  switch (model.kind) {
    case 'ready':
      return copy.ready;
    case 'empty':
      return model.bootstrapFailure ? copy.unavailable : copy.empty;
    case 'stale':
      return copy.stale;
    case 'blocked':
      return copy.blocked;
    case 'protected':
      return copy.protected;
    case 'storage-failure':
      return copy.storageFailure;
  }
}

function resumeText(status: MobileMediaResumeStatus, copy: MobileMediaCopy) {
  return (
    {
      idle: null,
      saved: copy.resumeAvailable,
      deleted: copy.resumeRemoved,
      'no-op': null,
      'resume-clear-failed': copy.resumeClearFailed,
      'resume-cleanup-failed': copy.resumeCleanupFailed,
      'resume-discarded': copy.resumeDiscarded,
      'storage-failure': copy.storageFailure,
      resumed: copy.resumed,
    } as const
  )[status];
}

export function MobileMediaHubView({
  model,
  copy,
  language,
  audioRef,
  headingRef,
  onStart,
  onPause,
  onResume,
  onReload = () => undefined,
  onCompletePreparation = () => undefined,
}: {
  model: MobileMediaHubViewModel;
  copy: MobileMediaCopy;
  language: UiLanguage;
  audioRef?: RefObject<HTMLAudioElement | null>;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReload?: () => void;
  onCompletePreparation?: () => void;
}) {
  const ready = model.kind === 'ready' && !model.loading;
  const player = model.player.playback;
  const paused = player === 'paused';
  const canResume = ready && !paused && player !== 'loading';
  const text = statusText(model, copy);
  const resume = resumeText(model.resume, copy);
  return (
    <section className="mobile-media-view" aria-labelledby="mobile-page-title">
      <p className="mobile-media-overline">{copy.overline}</p>
      <h2 id="mobile-page-title" ref={headingRef} tabIndex={-1}>
        {copy.title}
      </h2>
      <p className="mobile-media-intro">{copy.intro}</p>
      <p
        className={`mobile-media-status mobile-media-status--${model.kind}`}
        role={
          model.kind === 'blocked' || model.kind === 'protected' || model.player.error !== null
            ? 'alert'
            : 'status'
        }
        aria-live="polite"
        aria-busy={model.loading || player === 'loading'}
      >
        {text}
      </p>
      {ready ? (
        <>
          <article className="mobile-media-card">
            <h3>{localized(model.title, language)}</h3>
            <p>{localized(model.summary, language)}</p>
            <dl className="mobile-media-facts">
              <div>
                <dt>{copy.source}</dt>
                <dd>{localized(model.source, language)}</dd>
              </div>
              <div>
                <dt>{copy.duration}</dt>
                <dd>
                  {model.durationMs === null ? '' : readableDuration(model.durationMs, language)}
                </dd>
              </div>
              <div>
                <dt>{copy.rights}</dt>
                <dd>{model.attribution ?? copy.notAvailable}</dd>
              </div>
              <div>
                <dt>{copy.territory}</dt>
                <dd>{model.territory ?? copy.notAvailable}</dd>
              </div>
              <div>
                <dt>{copy.expires}</dt>
                <dd>
                  {model.expiresAt === null ? (
                    copy.notAvailable
                  ) : (
                    <time dateTime={new Date(model.expiresAt).toISOString()}>
                      {readableExpiry(model.expiresAt, language)}
                    </time>
                  )}
                </dd>
              </div>
              <div>
                <dt>{copy.delivery}</dt>
                <dd>{copy.localDelivery}</dd>
              </div>
            </dl>
          </article>
          <section className="mobile-media-player" aria-label={copy.player}>
            <audio ref={audioRef} preload="none" aria-label={copy.audio} />
            <div className="mobile-media-actions">
              {paused ? (
                <button type="button" onClick={onStart}>
                  {copy.continue}
                </button>
              ) : (
                <button type="button" onClick={onStart} disabled={player === 'loading'}>
                  {copy.play}
                </button>
              )}
              <button type="button" onClick={onPause} disabled={player !== 'playing'}>
                {copy.pause}
              </button>
              {canResume ? (
                <button type="button" onClick={onResume}>
                  {copy.resume}
                </button>
              ) : null}
            </div>
            <p role="status" className="mobile-media-playback-status">
              {
                {
                  idle: copy.idle,
                  loading: copy.playerLoading,
                  playing: copy.playerPlaying,
                  paused: copy.playerPaused,
                  ended: copy.playerEnded,
                  error: copy.playerError,
                }[player]
              }
            </p>
            {resume !== null ? <p role="status">{resume}</p> : null}
          </section>
        </>
      ) : null}
      {model.recovery ? (
        <button
          type="button"
          className="mobile-media-reload"
          onClick={onCompletePreparation}
          disabled={model.recoveryBusy}
          aria-busy={model.recoveryBusy}
        >
          {copy.completePreparation}
        </button>
      ) : !ready || model.player.error !== null ? (
        <button type="button" className="mobile-media-reload" onClick={onReload}>
          {copy.retry}
        </button>
      ) : null}
    </section>
  );
}

export function MobileMediaHubPage({
  copy,
  language,
  now,
  headingRef,
  adapters = productionAdapters,
}: {
  copy: MobileMediaCopy;
  language: UiLanguage;
  now: () => number;
  headingRef: RefObject<HTMLHeadingElement | null>;
  adapters?: MobileMediaHubControllerAdapters;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hubRef = useRef<MediaHub | null>(null);
  const actionsRef = useRef<Readonly<{
    start(): void;
    pause(): void;
    resume(): void;
    completePreparation(): void;
  }> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [model, setModel] = useState<MobileMediaHubViewModel>(emptyModel());

  useEffect(() => {
    let active = true;
    let catalog: CatalogStore | null = null;
    let resumeStore: MobileMediaResumeStore | null = null;
    let resumeHandle: ControllerResumeHandle | null = null;
    let hub: MediaHub | null = null;
    let sample: number | null = null;
    let expiry: number | null = null;
    let pausePolls = 0;
    let projectionEpoch = 0;
    let observedCandidate: CandidateObservation | null = null;
    let recoveryInFlight = false;
    const abort = new AbortController();
    const resumeOpening = adapters
      .openResume()
      .then((opened) => {
        if (!active) {
          opened.close();
          return null;
        }
        resumeStore = opened;
        return opened;
      })
      .catch(() => null);
    const publishProjection = async (
      bootstrap: MobileMediaHubViewModel['bootstrap'] = 'none',
      recovery = observedCandidate !== null,
    ) => {
      if (hub === null) return;
      const invocation = ++projectionEpoch;
      let projection: MobileMediaHubProjection;
      try {
        projection = await hub.projection();
      } catch {
        if (!active || hubRef.current !== hub || invocation !== projectionEpoch) return;
        if (expiry !== null) window.clearTimeout(expiry);
        expiry = null;
        setModel(emptyModel('storage-failure'));
        return;
      }
      if (!active || hubRef.current !== hub || invocation !== projectionEpoch) return;
      if (projection.kind !== 'empty') observedCandidate = null;
      setModel(
        Object.freeze({
          ...projection,
          loading: false,
          bootstrapFailure: bootstrap !== 'none',
          bootstrap,
          recovery: recovery && projection.kind === 'empty',
          recoveryBusy: false,
          player: hub.player.state(),
          resume: hub.resumeStatus(),
        }),
      );
      if (expiry !== null) window.clearTimeout(expiry);
      expiry = null;
      // A ready idle view has no player expiry timer yet. This single
      // controller-owned timer only re-reads the Hub's public projection at
      // the already calculated boundary; it never makes a rights decision or
      // polls IDB. A late callback is inert after the run is invalidated.
      if (projection.kind === 'ready' && projection.expiresAt !== null) {
        const delay = Math.max(0, projection.expiresAt - now());
        expiry = window.setTimeout(() => {
          expiry = null;
          void publishProjection();
        }, delay);
      }
    };
    const publishCatalogError = (error: unknown) => {
      projectionEpoch += 1;
      observedCandidate = null;
      if (error instanceof MobileMediaCatalogError && error.code === 'invalid-candidate') {
        setModel(
          Object.freeze({
            ...emptyModel(),
            loading: false,
            bootstrapFailure: true,
            bootstrap: 'invalid' as const,
          }),
        );
      } else {
        setModel(
          emptyModel(
            error instanceof MobileMediaCatalogError && error.code === 'protected'
              ? 'protected'
              : 'storage-failure',
          ),
        );
      }
    };
    const scheduleSample = () => {
      if (sample !== null) window.clearTimeout(sample);
      sample = window.setTimeout(observeActiveState, 250);
    };
    const observeActiveState = () => {
      sample = null;
      if (!active || hub === null || hubRef.current !== hub) return;
      const player = hub.player.state();
      const resume = hub.resumeStatus();
      setModel((current) =>
        current.kind !== 'ready' ? current : Object.freeze({ ...current, player, resume }),
      );
      if (player.playback === 'playing' || player.playback === 'loading') {
        pausePolls = 0;
        scheduleSample();
        return;
      }
      if (player.playback === 'paused' && pausePolls < 20) {
        pausePolls += 1;
        scheduleSample();
      } else {
        pausePolls = 0;
        void publishProjection();
      }
    };
    void (async () => {
      try {
        catalog = await adapters.openCatalog(now);
        if (!active) {
          catalog.close();
          return;
        }
        const initial = await catalog.snapshot();
        if (!active) return;
        let bootstrap: MobileMediaHubViewModel['bootstrap'] = 'none';
        let inactiveProtected = false;
        if (isCanonicalEmpty(initial)) {
          const loaded = await adapters.load(abort.signal, now);
          if (!active) return;
          if (loaded.kind === 'ready') {
            const saved = await catalog.saveCandidate({
              rawBundle: loaded.rawBundle,
              expectedGeneration: initial.control.generation,
            });
            if (!active) return;
            const ownsCandidate =
              saved.control.generation === initial.control.generation + 1 &&
              saved.control.candidate === 'candidate' &&
              JSON.stringify(saved.bundles.candidate?.rawBundle) ===
                JSON.stringify(loaded.rawBundle);
            if (ownsCandidate) {
              await catalog.activate(saved.control.generation);
              if (!active) return;
            } else bootstrap = 'invalid';
          } else bootstrap = loaded.kind === 'network-error' ? 'offline' : 'invalid';
        } else {
          observedCandidate = candidateOnly(initial);
          inactiveProtected = initial.control.active === null && observedCandidate === null;
        }
        if (!active) return;
        resumeStore = await resumeOpening;
        if (!active) return;
        resumeHandle = resumeStore === null ? null : createControllerResumeHandle(resumeStore);
        const activeCatalog = catalog;
        hub = createMobileMediaHub({
          snapshot: async () => {
            const value = await activeCatalog.snapshot();
            return {
              control: {
                generation: value.control.generation,
                active: value.control.active === 'active' ? ('active' as const) : null,
              },
              safety: {
                generation: value.safety.generation,
                revision: value.safety.revision,
                entries: value.safety.entries as readonly Record<string, unknown>[],
              },
              bundles: { active: value.bundles.active },
            };
          },
          clock: now,
          resumeStore:
            resumeHandle?.store ??
            (() => Promise.reject(new Error('local media resume storage unavailable'))),
          audio: () => {
            if (audioRef.current === null) throw new Error('media element unavailable');
            return audioRef.current;
          },
        });
        hubRef.current = hub;
        if (inactiveProtected) setModel(emptyModel('protected'));
        else await publishProjection(bootstrap);
        actionsRef.current = Object.freeze({
          start() {
            const operation = hub?.player.start();
            observeActiveState();
            void operation?.then(
              () => publishProjection(),
              () => publishProjection(),
            );
          },
          pause() {
            hub?.player.pause();
            observeActiveState();
            void publishProjection();
          },
          resume() {
            if (hub === null) return;
            const operation = hub.player.start();
            observeActiveState();
            void (async () => {
              try {
                await operation;
                if (!active || hubRef.current !== hub) return;
                await hub.resumeOnUserAction();
              } finally {
                if (active && hubRef.current === hub) await publishProjection();
              }
            })();
          },
          completePreparation() {
            const observed = observedCandidate;
            if (hub === null || catalog === null || observed === null || recoveryInFlight) return;
            recoveryInFlight = true;
            setModel((current) =>
              current.recovery ? Object.freeze({ ...current, recoveryBusy: true }) : current,
            );
            void (async () => {
              try {
                const fresh = await catalog.snapshot();
                if (!active || hubRef.current !== hub) return;
                if (!matchesObservedCandidate(fresh, observed)) {
                  observedCandidate = candidateOnly(fresh);
                  if (observedCandidate === null && fresh.control.active === null)
                    publishCatalogError(new MobileMediaCatalogError('protected'));
                  else await publishProjection('none', observedCandidate !== null);
                  return;
                }
                await catalog.activate(observed.generation);
                if (!active || hubRef.current !== hub) return;
                observedCandidate = null;
                await publishProjection();
              } catch (error) {
                if (!active || hubRef.current !== hub) return;
                if (
                  error instanceof MobileMediaCatalogError &&
                  (error.code === 'conflict' || error.code === 'invalid-candidate')
                ) {
                  try {
                    const current = await catalog.snapshot();
                    if (!active || hubRef.current !== hub) return;
                    observedCandidate = candidateOnly(current);
                    if (error.code === 'invalid-candidate') {
                      publishCatalogError(error);
                    } else if (observedCandidate !== null) await publishProjection('none', true);
                    else if (current.control.active === null) setModel(emptyModel('protected'));
                    else await publishProjection();
                  } catch (readError) {
                    if (active && hubRef.current === hub) publishCatalogError(readError);
                  }
                } else {
                  publishCatalogError(error);
                }
              } finally {
                recoveryInFlight = false;
              }
            })();
          },
        });
      } catch (error) {
        if (active)
          setModel(
            emptyModel(
              error instanceof MobileMediaCatalogError && error.code === 'protected'
                ? 'protected'
                : 'storage-failure',
            ),
          );
      }
    })();
    return () => {
      active = false;
      projectionEpoch += 1;
      abort.abort();
      if (sample !== null) window.clearTimeout(sample);
      if (expiry !== null) window.clearTimeout(expiry);
      actionsRef.current = null;
      if (hubRef.current === hub) hubRef.current = null;
      hub?.unmount();
      resumeHandle?.closeWhenIdle();
      if (resumeHandle === null) resumeStore?.close();
      catalog?.close();
    };
  }, [adapters, attempt, now]);

  const onStart = useCallback(() => {
    actionsRef.current?.start();
  }, []);
  const onPause = useCallback(() => {
    actionsRef.current?.pause();
  }, []);
  const onResume = useCallback(() => {
    actionsRef.current?.resume();
  }, []);

  return (
    <MobileMediaHubView
      model={model}
      copy={copy}
      language={language}
      audioRef={audioRef}
      headingRef={headingRef}
      onStart={onStart}
      onPause={onPause}
      onResume={onResume}
      onReload={() => setAttempt((current) => current + 1)}
      onCompletePreparation={() => actionsRef.current?.completePreparation()}
    />
  );
}
