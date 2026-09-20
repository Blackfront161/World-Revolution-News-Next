import { useEffect, useId, useRef, useState } from 'react';
import {
  projectProductionRegionalEventsV1,
  type ProductionRegionalEventsV1,
  type ProductionRegionalScheduleV1,
  type ProductionRegionalSelectionV1,
} from '@wrn/content-contracts/production-regional-events-v1';
import type { UiLanguage } from '@wrn/ui-language';
import {
  getProductionRegionalCopy,
  getRegionalContinentName,
} from '@wrn/ui-language/production-regional';
import { loadCurrentRegionalEvents } from './data';
import {
  emptyRegionalSelection,
  openRegionalSelectionStore,
  RegionalSelectionError,
  type RegionalClient,
  type RegionalSelectionSnapshot,
  type RegionalSelectionStore,
} from './selection-store';
import './regional-events.css';

const external = {
  target: '_blank',
  rel: 'noopener noreferrer',
  referrerPolicy: 'no-referrer',
} as const;
const sameSelection = (left: ProductionRegionalSelectionV1, right: ProductionRegionalSelectionV1) =>
  left.continentId === right.continentId &&
  left.countryId === right.countryId &&
  left.regionId === right.regionId;
function date(language: UiLanguage, value: string) {
  return new Intl.DateTimeFormat(language, { timeZone: 'UTC', dateStyle: 'medium' }).format(
    Date.parse(`${value}T00:00:00.000Z`),
  );
}
export function formatRegionalSchedule(
  schedule: ProductionRegionalScheduleV1,
  language: UiLanguage,
): string {
  const copy = getProductionRegionalCopy(language);
  if (schedule.precision === 'day') {
    const range =
      schedule.startDate === schedule.endDate
        ? date(language, schedule.startDate)
        : `${date(language, schedule.startDate)} – ${date(language, schedule.endDate)}`;
    return `${range} · ${copy.timeUnknown}`;
  }
  const formatter = new Intl.DateTimeFormat(language, {
    timeZone: schedule.timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'shortOffset',
  });
  return `${formatter.format(Date.parse(schedule.startAt))} – ${formatter.format(Date.parse(schedule.endAt))} · ${copy.localTime}`;
}

function RegionalChoice({
  id,
  label,
  value,
  disabled,
  options,
  missing,
  onChange,
}: {
  id: string;
  label: string;
  value: string | null;
  disabled: boolean;
  options: readonly Readonly<{ value: string; label: string }>[];
  missing: string;
  onChange(value: string | null): void;
}) {
  const selected = options.find((item) => item.value === (value ?? ''));
  return (
    <div className="current-regional-events__choice">
      <label htmlFor={id}>{label}</label>
      <div className="current-regional-events__select" data-selected={value !== null}>
        <select
          id={id}
          value={value ?? ''}
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.value || null)}
        >
          {!selected && <option value={value ?? ''}>{missing}</option>}
          {options.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <span aria-hidden="true">{selected?.label ?? missing}</span>
      </div>
    </div>
  );
}

export function CurrentRegionalEvents({
  client,
  language,
  headingLevel = 2,
}: {
  client: RegionalClient;
  language: UiLanguage;
  headingLevel?: 2 | 3;
}) {
  const copy = getProductionRegionalCopy(language);
  const id = useId();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const CardHeading = headingLevel === 2 ? 'h3' : 'h4';
  const [catalog, setCatalog] = useState<ProductionRegionalEventsV1 | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [snapshot, setSnapshot] = useState<RegionalSelectionSnapshot | null>(null);
  const [draft, setDraft] = useState(emptyRegionalSelection);
  const [storageError, setStorageError] = useState<'storageError' | 'conflict' | null>(null);
  const [busy, setBusy] = useState(false);
  const edited = useRef(false);
  const choose = (selection: ProductionRegionalSelectionV1) => {
    edited.current = true;
    setDraft(selection);
  };
  const session = useRef<{ store: RegionalSelectionStore | null; abort: AbortController } | null>(
    null,
  );
  useEffect(() => {
    const current = { store: null as RegionalSelectionStore | null, abort: new AbortController() };
    session.current = current;
    edited.current = false;
    setSnapshot(null);
    setDraft(emptyRegionalSelection);
    setStorageError(null);
    setLoaded(false);
    setCatalog(null);
    setBusy(false);
    loadCurrentRegionalEvents()
      .then((data) => {
        if (current.abort.signal.aborted) return;
        setCatalog(data);
        setLoaded(true);
      })
      .catch(() => {
        if (!current.abort.signal.aborted) setLoaded(true);
      });
    openRegionalSelectionStore(client, current.abort.signal)
      .then(async (store) => {
        if (current.abort.signal.aborted) {
          store.close();
          return;
        }
        current.store = store;
        const saved = await store.snapshot(current.abort.signal);
        if (current.abort.signal.aborted) return;
        setSnapshot(saved);
        // Initial local read must not overwrite a selection already made in this view.
        setDraft((choice) => (!edited.current ? saved.selection : choice));
      })
      .catch(() => {
        if (!current.abort.signal.aborted) setStorageError('storageError');
      });
    const clock = () => setNow(Date.now());
    clock();
    const interval = window.setInterval(clock, 60_000);
    window.addEventListener('focus', clock);
    document.addEventListener('visibilitychange', clock);
    return () => {
      current.abort.abort();
      current.store?.close();
      window.clearInterval(interval);
      window.removeEventListener('focus', clock);
      document.removeEventListener('visibilitychange', clock);
      if (session.current === current) session.current = null;
    };
  }, [client]);
  const projection = catalog ? projectProductionRegionalEventsV1(catalog, draft, now) : null;
  const status = projection?.status;
  const save = async (clear: boolean) => {
    const current = session.current;
    if (!current || busy) return;
    edited.current = true;
    if (!current.store || !snapshot || storageError) {
      if (clear) setDraft(emptyRegionalSelection);
      return;
    }
    setBusy(true);
    try {
      const result = clear
        ? await current.store.clear(snapshot.generation, current.abort.signal)
        : await current.store.save(draft, snapshot.generation, current.abort.signal);
      if (current.abort.signal.aborted || session.current !== current) return;
      setSnapshot(result);
      setDraft(result.selection);
    } catch (error) {
      if (!current.abort.signal.aborted && session.current === current)
        setStorageError(
          error instanceof RegionalSelectionError && error.code === 'stale-operation'
            ? 'conflict'
            : 'storageError',
        );
    } finally {
      if (!current.abort.signal.aborted && session.current === current) setBusy(false);
    }
  };
  const statusText = !loaded
    ? copy.loading
    : !catalog || status === 'unavailable'
      ? copy.unavailable
      : status === 'stale'
        ? copy.stale
        : status === 'invalid-selection'
          ? copy.invalid
          : status === 'empty'
            ? copy.empty
            : status === 'unselected'
              ? copy.unselected
              : null;
  const countryNames = new Intl.DisplayNames([language], { type: 'region' });
  return (
    <section
      className="current-regional-events"
      aria-labelledby={`${id}-heading`}
      data-testid="current-regional-events"
    >
      <Heading id={`${id}-heading`}>{copy.title}</Heading>
      <p>{copy.intro}</p>
      {catalog && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save(false);
          }}
        >
          <div className="current-regional-events__choices">
            <RegionalChoice
              id={`${id}-continent`}
              label={copy.continent}
              value={draft.continentId}
              disabled={busy}
              missing={copy.invalid}
              options={[
                { value: '', label: copy.choose },
                ...catalog.continents.map((continent) => ({
                  value: continent.id,
                  label: getRegionalContinentName(language, continent.id) ?? continent.name,
                })),
              ]}
              onChange={(value) => choose({ continentId: value, countryId: null, regionId: null })}
            />
            <RegionalChoice
              id={`${id}-country`}
              label={copy.country}
              value={draft.countryId}
              disabled={busy || draft.continentId === null}
              missing={copy.invalid}
              options={[
                { value: '', label: draft.continentId ? copy.allCountries : copy.choose },
                ...catalog.countries
                  .filter((country) => country.continentId === draft.continentId)
                  .map((country) => ({
                    value: country.id,
                    label: countryNames.of(country.code) || country.name,
                  })),
              ]}
              onChange={(value) => choose({ ...draft, countryId: value, regionId: null })}
            />
            <RegionalChoice
              id={`${id}-region`}
              label={copy.region}
              value={draft.regionId}
              disabled={busy || draft.countryId === null}
              missing={copy.invalid}
              options={[
                { value: '', label: draft.countryId ? copy.allRegions : copy.choose },
                ...catalog.regions
                  .filter((region) => region.countryId === draft.countryId)
                  .map((region) => ({ value: region.id, label: region.name })),
              ]}
              onChange={(value) => choose({ ...draft, regionId: value })}
            />
          </div>
          <div className="current-regional-events__actions">
            <button
              type="submit"
              disabled={
                busy || !snapshot || storageError !== null || status === 'invalid-selection'
              }
            >
              {copy.save}
            </button>
            <button type="button" disabled={busy} onClick={() => void save(true)}>
              {copy.clear}
            </button>
          </div>
          <p role="status">
            {storageError
              ? copy[storageError]
              : snapshot && sameSelection(snapshot.selection, draft) && draft.continentId !== null
                ? copy.saved
                : copy.temporary}
          </p>
        </form>
      )}
      <p>{copy.coverage}</p>
      {statusText && <p role="status">{statusText}</p>}
      {projection && projection.events.length > 0 && catalog && (
        <ol className="current-regional-events__list">
          {projection.events.map((event) => {
            const source = catalog.sources.find((item) => item.id === event.sourceId)!;
            return (
              <li key={event.id} data-regional-event={event.id}>
                <article>
                  <CardHeading lang={event.language}>{event.title}</CardHeading>
                  {event.status === 'changed' && <p>{copy.changed}</p>}
                  <p>{formatRegionalSchedule(event.schedule, language)}</p>
                  <p>
                    <bdi>{event.schedule.timeZone}</bdi>
                  </p>
                  <p lang={event.venue ? event.language : language}>
                    {event.venue || copy.venueUnknown}
                  </p>
                  <p>
                    {copy.source}: <span lang={source.language}>{source.name}</span> ·{' '}
                    {copy.checked}:{' '}
                    <time dateTime={source.checkedOn}>{date(language, source.checkedOn)}</time>
                  </p>
                  <a {...external} href={event.originalUrl}>
                    {copy.original}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </article>
              </li>
            );
          })}
        </ol>
      )}
      {catalog && (
        <>
          <p>
            {copy.through}:{' '}
            <time dateTime={catalog.validUntil}>
              {new Intl.DateTimeFormat(language, {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'UTC',
              }).format(Date.parse(catalog.validUntil))}{' '}
              UTC
            </time>
          </p>
          <details>
            <summary>{copy.sources}</summary>
            <ul>
              {catalog.sources.map((source) => (
                <li key={source.id}>
                  <a {...external} href={source.url} lang={source.language}>
                    {source.name}
                    <span aria-hidden="true"> ↗</span>
                  </a>{' '}
                  · {copy.checked}:{' '}
                  <time dateTime={source.checkedOn}>{date(language, source.checkedOn)}</time>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
