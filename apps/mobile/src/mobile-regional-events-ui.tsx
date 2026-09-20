import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { UiCopy, UiLanguage } from '@wrn/ui-language';
import {
  resolveRegionalAlias,
  validateRegionalEventBundle,
  type RegionalEventBundleV1,
} from '@wrn/content-contracts/mobile-regional-events-v1';
import {
  loadMobileRegionalEvents,
  projectMobileRegionalEvents,
  type RegionalEventsProjection,
} from './mobile-regional-events';
import {
  openMobileRegionalEventsStore,
  RegionalEventsStoreError,
  type RegionalEventsStoreSnapshot,
} from './mobile-regional-events-store';
import {
  openMobileRegionalEventsSelection,
  RegionalEventsSelectionError,
  type RegionalEventsSelectionRead,
} from './mobile-regional-events-selection';

type EventStore = Awaited<ReturnType<typeof openMobileRegionalEventsStore>>;
type SelectionStore = Awaited<ReturnType<typeof openMobileRegionalEventsSelection>>;
type ContentStatus = RegionalEventsProjection['contentStatus'];
type DeliveryStatus = RegionalEventsProjection['deliveryStatus'];
type SelectionStatus = 'loading' | 'inactive' | 'ready' | 'invalid' | 'protected';

export type RegionalEventsControllerAdapters = Readonly<{
  openStore: typeof openMobileRegionalEventsStore;
  openSelection: typeof openMobileRegionalEventsSelection;
  load: typeof loadMobileRegionalEvents;
}>;

const productionAdapters: RegionalEventsControllerAdapters = Object.freeze({
  openStore: openMobileRegionalEventsStore,
  openSelection: openMobileRegionalEventsSelection,
  load: loadMobileRegionalEvents,
});

export type RegionalEventsViewModel = Readonly<{
  phase: 'loading' | 'ready' | 'protected' | 'error';
  referenceInstant: string;
  bundle: RegionalEventBundleV1 | null;
  safety: RegionalEventsStoreSnapshot['safety']['entries'];
  projection: RegionalEventsProjection;
  selectionStatus: SelectionStatus;
  selectionGeneration: number;
  selectedRegionId: string | null;
  message: 'none' | 'reload-required' | 'storage-error';
}>;

const emptyProjection = (
  contentStatus: ContentStatus = 'error',
  deliveryStatus: DeliveryStatus = 'online',
): RegionalEventsProjection =>
  Object.freeze({
    contentStatus,
    deliveryStatus,
    events: Object.freeze([]),
    lifecycle: Object.freeze([]),
  });

const loadingViewModel = (referenceInstant: string): RegionalEventsViewModel =>
  Object.freeze({
    phase: 'loading',
    referenceInstant,
    bundle: null,
    safety: Object.freeze([]),
    projection: emptyProjection('error'),
    selectionStatus: 'loading',
    selectionGeneration: 0,
    selectedRegionId: null,
    message: 'none',
  });

function isProtected(error: unknown) {
  return (
    (error instanceof RegionalEventsStoreError && error.code === 'protected') ||
    (error instanceof RegionalEventsSelectionError && error.code === 'protected')
  );
}

async function validatedActive(snapshot: RegionalEventsStoreSnapshot) {
  const active = snapshot.bundles.active;
  if (active === null) return null;
  try {
    const parsed = JSON.parse(active.rawJson) as unknown;
    const bundle = await validateRegionalEventBundle(parsed);
    return bundle !== null &&
      bundle.bundleRevision === active.bundleRevision &&
      bundle.taxonomyRevision === active.taxonomyRevision &&
      active.transportSha256 === snapshot.control.active?.transportSha256
      ? bundle
      : null;
  } catch {
    return null;
  }
}

function projectionFor(
  bundle: RegionalEventBundleV1 | null,
  snapshot: RegionalEventsStoreSnapshot,
  referenceInstant: string,
  regionId: string | null,
  deliveryStatus: DeliveryStatus,
): RegionalEventsProjection {
  if (bundle === null)
    return emptyProjection(
      deliveryStatus === 'offline-lkg' ? 'offline-none' : 'error',
      deliveryStatus,
    );
  return projectMobileRegionalEvents({
    bundle,
    regionId,
    safety: snapshot.safety.entries,
    referenceInstant,
    online: deliveryStatus !== 'offline-lkg',
    invalidUpdate: deliveryStatus === 'invalid-update-lkg',
  });
}

function selectionFromRead(
  read: RegionalEventsSelectionRead,
  bundle: RegionalEventBundleV1,
): Readonly<{ status: SelectionStatus; generation: number; regionId: string | null }> {
  if (read.kind === 'inactive')
    return Object.freeze({ status: 'inactive', generation: 0, regionId: null });
  if (read.kind === 'protected')
    return Object.freeze({ status: 'protected', generation: 0, regionId: null });
  const canonical = resolveRegionalAlias(bundle, read.record.regionId);
  return canonical === null
    ? Object.freeze({ status: 'invalid', generation: read.record.generation, regionId: null })
    : Object.freeze({ status: 'ready', generation: read.record.generation, regionId: canonical });
}

// eslint-disable-next-line react-refresh/only-export-components -- focused units need this pure IANA formatter.
export function formatRegionalEventTime(
  event: RegionalEventBundleV1['events'][number],
  language: UiLanguage,
) {
  return new Intl.DateTimeFormat(language, {
    timeZone: event.timeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(event.startInstant));
}

// eslint-disable-next-line react-refresh/only-export-components -- controlled adapter tests exercise the controller's abort contract.
export function useMobileRegionalEventsController({
  now,
  adapters = productionAdapters,
}: Readonly<{
  now: () => number;
  adapters?: RegionalEventsControllerAdapters;
}>) {
  const [model, setModel] = useState<RegionalEventsViewModel>(() =>
    loadingViewModel(new Date(now()).toISOString()),
  );
  const [draftContinentId, setDraftContinentId] = useState('');
  const [draftCountryId, setDraftCountryId] = useState('');
  const [draftRegionId, setDraftRegionId] = useState('');
  const storeRef = useRef<EventStore | null>(null);
  const selectionRef = useRef<SelectionStore | null>(null);
  const runRef = useRef(0);
  const activeRunRef = useRef<Readonly<{ id: number; controller: AbortController }> | null>(null);
  const mutationDisabledRef = useRef(false);

  const closeStores = useCallback(() => {
    selectionRef.current?.close();
    selectionRef.current = null;
    storeRef.current?.close();
    storeRef.current = null;
  }, []);

  const run = useCallback(() => {
    activeRunRef.current?.controller.abort();
    closeStores();
    const runId = runRef.current + 1;
    runRef.current = runId;
    const controller = new AbortController();
    activeRunRef.current = Object.freeze({ id: runId, controller });
    const referenceInstant = new Date(now()).toISOString();
    mutationDisabledRef.current = false;
    setModel(loadingViewModel(referenceInstant));
    setDraftContinentId('');
    setDraftCountryId('');
    setDraftRegionId('');
    void (async () => {
      let store!: EventStore;
      let selectionStore!: SelectionStore;
      const current = () =>
        runRef.current === runId &&
        activeRunRef.current?.id === runId &&
        !controller.signal.aborted;
      const closeLate = <T extends { close(): void }>(handle: T) => {
        handle.close();
        return null;
      };
      const adoptStore = (handle: EventStore) => {
        if (!current()) return closeLate(handle);
        storeRef.current?.close();
        storeRef.current = handle;
        return handle;
      };
      const adoptSelection = (handle: SelectionStore) => {
        if (!current()) return closeLate(handle);
        selectionRef.current?.close();
        selectionRef.current = handle;
        return handle;
      };
      let snapshot: RegionalEventsStoreSnapshot;
      try {
        const opened = await adapters.openStore();
        const adoptedStore = adoptStore(opened);
        if (adoptedStore === null) return;
        store = adoptedStore;
        snapshot = await store.snapshot();
      } catch (error) {
        if (!current()) return;
        setModel(
          Object.freeze({
            ...loadingViewModel(referenceInstant),
            phase: isProtected(error) ? 'protected' : 'error',
            projection: emptyProjection(isProtected(error) ? 'protected' : 'error'),
            selectionStatus: isProtected(error) ? 'protected' : 'inactive',
          }),
        );
        return;
      }
      let active = await validatedActive(snapshot);
      if (!current()) return;
      if (active === null && snapshot.bundles.active !== null) {
        if (!current()) return;
        setModel(
          Object.freeze({
            ...loadingViewModel(referenceInstant),
            phase: 'protected',
            projection: emptyProjection('protected'),
            selectionStatus: 'protected',
          }),
        );
        return;
      }
      let deliveryStatus: DeliveryStatus = 'online';
      let loadKind:
        'ready' | 'no-change' | 'invalid' | 'future-bundle' | 'no-request' | 'network-error';
      try {
        const loaded = await adapters.load(controller.signal);
        if (!current()) return;
        loadKind = loaded.kind;
        if (loaded.kind === 'ready') {
          const saved = await store.saveCandidate(
            new TextEncoder().encode(loaded.rawJson),
            snapshot.control.generation,
          );
          if (!current()) return;
          if (saved.control.generation === snapshot.control.generation) {
            loadKind = 'no-change';
            snapshot = saved;
          } else {
            snapshot = await store.activate(saved.control.generation);
            if (!current()) return;
            active = await validatedActive(snapshot);
            if (!current()) return;
            if (active === null) throw new RegionalEventsStoreError('protected');
          }
        }
      } catch (error) {
        if (!current()) return;
        try {
          snapshot = await store.snapshot();
          if (!current()) return;
          active = await validatedActive(snapshot);
          if (!current()) return;
        } catch (snapshotError) {
          if (!current()) return;
          const protectedState = isProtected(error) || isProtected(snapshotError);
          setModel(
            Object.freeze({
              ...loadingViewModel(referenceInstant),
              phase: protectedState ? 'protected' : 'error',
              projection: emptyProjection(protectedState ? 'protected' : 'error'),
              selectionStatus: protectedState ? 'protected' : 'inactive',
            }),
          );
          return;
        }
        if (active === null && snapshot.bundles.active !== null) {
          setModel(
            Object.freeze({
              ...loadingViewModel(referenceInstant),
              phase: 'protected',
              projection: emptyProjection('protected'),
              selectionStatus: 'protected',
            }),
          );
          return;
        }
        deliveryStatus = active === null ? 'online' : 'invalid-update-lkg';
        loadKind = 'invalid';
      }
      if (!current()) return;
      if (loadKind === 'network-error') deliveryStatus = 'offline-lkg';
      if (loadKind === 'invalid' || loadKind === 'future-bundle' || loadKind === 'no-request')
        deliveryStatus = active === null ? 'online' : 'invalid-update-lkg';
      if (active === null) {
        setModel(
          Object.freeze({
            ...loadingViewModel(referenceInstant),
            phase: 'ready',
            projection: emptyProjection(
              loadKind === 'network-error' ? 'offline-none' : 'error',
              deliveryStatus,
            ),
            selectionStatus: 'inactive',
          }),
        );
        return;
      }
      let selection: ReturnType<typeof selectionFromRead>;
      try {
        const openedSelection = await adapters.openSelection();
        const adoptedSelection = adoptSelection(openedSelection);
        if (adoptedSelection === null) return;
        selectionStore = adoptedSelection;
        selection = selectionFromRead(await selectionStore.read(), active);
        if (!current()) return;
      } catch (error) {
        if (!current()) return;
        selectionRef.current?.close();
        selectionRef.current = null;
        selection = Object.freeze({
          status: isProtected(error) ? 'protected' : 'inactive',
          generation: 0,
          regionId: null,
        });
        mutationDisabledRef.current = !isProtected(error);
      }
      if (!current()) return;
      setModel(
        Object.freeze({
          phase: 'ready',
          referenceInstant,
          bundle: active,
          safety: snapshot.safety.entries,
          projection: projectionFor(
            active,
            snapshot,
            referenceInstant,
            selection.regionId,
            deliveryStatus,
          ),
          selectionStatus: selection.status,
          selectionGeneration: selection.generation,
          selectedRegionId: selection.regionId,
          message: mutationDisabledRef.current ? 'reload-required' : 'none',
        }),
      );
    })();
  }, [adapters, closeStores, now]);

  useEffect(() => {
    run();
    return () => {
      activeRunRef.current?.controller.abort();
      runRef.current += 1;
      activeRunRef.current = null;
      closeStores();
    };
  }, [closeStores, run]);

  const saveSelection = useCallback(async () => {
    const bundle = model.bundle;
    const store = selectionRef.current;
    const runId = runRef.current;
    if (bundle === null || store === null || !draftRegionId || mutationDisabledRef.current) {
      if (bundle !== null && !mutationDisabledRef.current)
        setModel((current) => Object.freeze({ ...current, message: 'reload-required' }));
      return;
    }
    const validRegions = new Set(bundle.regions.map((region) => region.regionId));
    try {
      const record = await store.save(draftRegionId, model.selectionGeneration, validRegions);
      if (
        runId !== runRef.current ||
        activeRunRef.current?.id !== runId ||
        activeRunRef.current.controller.signal.aborted
      )
        return;
      setModel((current) =>
        current.bundle === null
          ? current
          : Object.freeze({
              ...current,
              selectionStatus: 'ready',
              selectionGeneration: record.generation,
              selectedRegionId: record.regionId,
              projection: projectMobileRegionalEvents({
                bundle: current.bundle,
                regionId: record.regionId,
                safety: current.safety,
                referenceInstant: current.referenceInstant,
                online: current.projection.deliveryStatus !== 'offline-lkg',
                invalidUpdate: current.projection.deliveryStatus === 'invalid-update-lkg',
              }),
              message: 'none',
            }),
      );
    } catch {
      if (
        runId !== runRef.current ||
        activeRunRef.current?.id !== runId ||
        activeRunRef.current.controller.signal.aborted
      )
        return;
      mutationDisabledRef.current = true;
      setModel((current) => Object.freeze({ ...current, message: 'reload-required' }));
    }
  }, [draftRegionId, model.bundle, model.selectionGeneration]);

  const clearSelection = useCallback(async () => {
    const store = selectionRef.current;
    const runId = runRef.current;
    if (store === null || mutationDisabledRef.current) {
      setModel((current) => Object.freeze({ ...current, message: 'reload-required' }));
      return;
    }
    try {
      await store.clear(model.selectionGeneration);
      if (
        runId !== runRef.current ||
        activeRunRef.current?.id !== runId ||
        activeRunRef.current.controller.signal.aborted
      )
        return;
      setDraftContinentId('');
      setDraftCountryId('');
      setDraftRegionId('');
      setModel((current) =>
        current.bundle === null
          ? current
          : Object.freeze({
              ...current,
              selectionStatus: 'inactive',
              selectionGeneration: 0,
              selectedRegionId: null,
              projection: projectMobileRegionalEvents({
                bundle: current.bundle,
                regionId: null,
                safety: current.safety,
                referenceInstant: current.referenceInstant,
                online: current.projection.deliveryStatus !== 'offline-lkg',
                invalidUpdate: current.projection.deliveryStatus === 'invalid-update-lkg',
              }),
              message: 'none',
            }),
      );
    } catch {
      if (
        runId !== runRef.current ||
        activeRunRef.current?.id !== runId ||
        activeRunRef.current.controller.signal.aborted
      )
        return;
      mutationDisabledRef.current = true;
      setModel((current) => Object.freeze({ ...current, message: 'reload-required' }));
    }
  }, [model.selectionGeneration]);

  return Object.freeze({
    model,
    draftContinentId,
    draftCountryId,
    draftRegionId,
    setDraftContinentId: (value: string) => {
      setDraftContinentId(value);
      setDraftCountryId('');
      setDraftRegionId('');
    },
    setDraftCountryId: (value: string) => {
      setDraftCountryId(value);
      setDraftRegionId('');
    },
    setDraftRegionId,
    saveSelection: () => void saveSelection(),
    clearSelection: () => void clearSelection(),
    reload: run,
  });
}

function contentCopy(copy: UiCopy, status: ContentStatus) {
  return {
    'ready-1': copy.eventsReady,
    'ready-2': copy.eventsReady,
    'ready-3': copy.eventsReady,
    'ready-4': copy.eventsReady,
    'ready-5': copy.eventsReady,
    empty: copy.eventsEmpty,
    stale: copy.eventsStale,
    protected: copy.eventsProtected,
    error: copy.eventsError,
    'offline-none': copy.eventsOfflineNone,
  }[status];
}

export function MobileRegionalEventsView({
  model,
  copy,
  language,
  headingRef,
  draftContinentId,
  draftCountryId,
  draftRegionId,
  onContinent,
  onCountry,
  onRegion,
  onSave,
  onClear,
  onReload,
}: Readonly<{
  model: RegionalEventsViewModel;
  copy: UiCopy;
  language: UiLanguage;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  draftContinentId: string;
  draftCountryId: string;
  draftRegionId: string;
  onContinent: (value: string) => void;
  onCountry: (value: string) => void;
  onRegion: (value: string) => void;
  onSave: () => void;
  onClear: () => void;
  onReload: () => void;
}>) {
  const [clearConfirmation, setClearConfirmation] = useState(false);
  const bundle = model.bundle;
  const continents = bundle?.continents ?? [];
  const countries =
    bundle?.countries.filter((country) => country.continentId === draftContinentId) ?? [];
  const regions = bundle?.regions.filter((region) => region.countryId === draftCountryId) ?? [];
  const loading = model.phase === 'loading';
  const activeRegion =
    model.selectedRegionId === null
      ? null
      : (bundle?.regions.find((region) => region.regionId === model.selectedRegionId) ?? null);
  const blockedSelection =
    model.selectionStatus === 'protected' || model.message === 'reload-required';
  const delivery =
    bundle === null || model.projection.contentStatus === 'offline-none'
      ? ''
      : model.projection.deliveryStatus === 'online'
        ? copy.eventsOnline
        : model.projection.deliveryStatus === 'offline-lkg'
          ? copy.eventsOfflineLkg
          : copy.eventsInvalidUpdateLkg;
  return (
    <section
      className="regional-events-view"
      aria-labelledby="mobile-page-title"
      data-regional-events
    >
      <p className="feed-overline">{copy.eventsOverline}</p>
      <h2 id="mobile-page-title" ref={headingRef} tabIndex={-1}>
        {copy.events}
      </h2>
      <p className="regional-events-intro">{copy.eventsIntro}</p>
      <p className="regional-events-privacy">{copy.eventsPrivacy}</p>
      {loading ? (
        <p className="regional-events-status" role="status" aria-busy="true">
          {copy.eventsLoading}
        </p>
      ) : null}
      {!loading ? (
        <p
          className="regional-events-status"
          role={model.phase === 'protected' || model.phase === 'error' ? 'alert' : 'status'}
        >
          {contentCopy(copy, model.projection.contentStatus)} {delivery}
        </p>
      ) : null}
      {bundle !== null ? (
        <section
          className="regional-events-selection"
          aria-labelledby="regional-events-selection-title"
        >
          <h3 id="regional-events-selection-title">{copy.eventsSelectionTitle}</h3>
          <p>
            {model.selectionStatus === 'inactive'
              ? copy.eventsSelectionInactive
              : model.selectionStatus === 'ready'
                ? copy.eventsSelectionReady
                : model.selectionStatus === 'protected'
                  ? copy.eventsSelectionProtected
                  : copy.eventsSelectionInvalid}
          </p>
          {model.selectionStatus === 'ready' && activeRegion !== null ? (
            <p className="regional-events-active-region">
              <strong>{copy.eventsRegion}: </strong>
              {activeRegion.names[language]}
            </p>
          ) : null}
          <div className="regional-events-select-grid">
            <label>
              <span>{copy.eventsContinent}</span>
              <select
                value={draftContinentId}
                onChange={(event) => onContinent(event.target.value)}
                disabled={blockedSelection}
              >
                <option value="">{copy.eventsChooseContinent}</option>
                {continents.map((continent) => (
                  <option key={continent.continentId} value={continent.continentId}>
                    {continent.names[language]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{copy.eventsCountry}</span>
              <select
                value={draftCountryId}
                onChange={(event) => onCountry(event.target.value)}
                disabled={blockedSelection || !draftContinentId}
              >
                <option value="">{copy.eventsChooseCountry}</option>
                {countries.map((country) => (
                  <option key={country.countryId} value={country.countryId}>
                    {country.names[language]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{copy.eventsRegion}</span>
              <select
                value={draftRegionId}
                onChange={(event) => onRegion(event.target.value)}
                disabled={blockedSelection || !draftCountryId}
              >
                <option value="">{copy.eventsChooseRegion}</option>
                {regions.map((region) => (
                  <option key={region.regionId} value={region.regionId}>
                    {region.names[language]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="regional-events-actions">
            <button type="button" onClick={onSave} disabled={blockedSelection || !draftRegionId}>
              {copy.eventsSaveSelection}
            </button>
            <button
              type="button"
              onClick={() => setClearConfirmation(true)}
              disabled={
                blockedSelection ||
                (model.selectionStatus !== 'ready' && model.selectionStatus !== 'invalid')
              }
            >
              {copy.eventsClearSelection}
            </button>
            <button type="button" onClick={onReload}>
              {copy.eventsReload}
            </button>
          </div>
          {clearConfirmation ? (
            <div className="regional-events-confirmation" role="alert">
              <p>{copy.eventsClearConfirmation}</p>
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setClearConfirmation(false);
                }}
              >
                {copy.eventsConfirm}
              </button>
              <button type="button" onClick={() => setClearConfirmation(false)}>
                {copy.cancel}
              </button>
            </div>
          ) : null}
          {model.message === 'reload-required' ? (
            <p className="regional-events-alert" role="alert" tabIndex={-1}>
              {copy.eventsReloadRequired}
            </p>
          ) : null}
        </section>
      ) : null}
      {!loading && bundle === null ? (
        <div className="regional-events-actions">
          <button type="button" onClick={onReload}>
            {copy.eventsReload}
          </button>
        </div>
      ) : null}
      {model.projection.events.length > 0 ? (
        <ol className="regional-events-list" aria-label={copy.eventsList}>
          {model.projection.events.map((event) => (
            <li key={event.eventId} className="regional-events-card">
              <h3>{event.titles[language]}</h3>
              <p>{event.locationNames[language]}</p>
              <p>
                <time dateTime={event.startInstant}>
                  {formatRegionalEventTime(event, language)}
                </time>{' '}
                · {event.timeZone}
              </p>
              <p>{event.status === 'changed' ? copy.eventsChanged : copy.eventsScheduled}</p>
            </li>
          ))}
        </ol>
      ) : null}
      {model.projection.lifecycle.length > 0 ? (
        <section
          className="regional-events-lifecycle"
          aria-labelledby="regional-events-lifecycle-title"
        >
          <h3 id="regional-events-lifecycle-title">{copy.eventsLifecycle}</h3>
          <ul>
            {model.projection.lifecycle.map((entry) => (
              <li key={`${entry.eventId}-${entry.status}`}>
                {entry.eventId}:{' '}
                {entry.status === 'changed'
                  ? copy.eventsChanged
                  : entry.status === 'cancelled'
                    ? copy.eventsCancelled
                    : copy.eventsBlocked}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

export function MobileRegionalEventsPage({
  copy,
  language,
  now,
  headingRef,
}: Readonly<{
  copy: UiCopy;
  language: UiLanguage;
  now: () => number;
  headingRef: RefObject<HTMLHeadingElement | null>;
}>) {
  const controller = useMobileRegionalEventsController({ now });
  return (
    <MobileRegionalEventsView
      model={controller.model}
      copy={copy}
      language={language}
      headingRef={headingRef}
      draftContinentId={controller.draftContinentId}
      draftCountryId={controller.draftCountryId}
      draftRegionId={controller.draftRegionId}
      onContinent={controller.setDraftContinentId}
      onCountry={controller.setDraftCountryId}
      onRegion={controller.setDraftRegionId}
      onSave={controller.saveSelection}
      onClear={controller.clearSelection}
      onReload={() => {
        controller.reload();
      }}
    />
  );
}
