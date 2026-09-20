import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import type {
  ProductionEventsMediaDocumentV1,
  ProductionEventsMediaEpisodeV1,
  ProductionEventsMediaEventV1,
  ProductionEventsMediaPodcastSourceV1,
  ProductionEventsMediaVideoV1,
} from '@wrn/content-contracts/production-events-media-v1';
import type { UiLanguage } from '@wrn/ui-language';
import { formatEventsMediaCopy, getEventsMediaCopy } from '@wrn/ui-language/events-media';
import {
  emptyEventFilters,
  emptyMediaFilters,
  filterProductionEvents,
  filterProductionMedia,
  pageProductionEventsMedia,
  productionEventsMediaLanguages,
  productionEventsMediaPageSize,
  type EventsMediaMode,
  type EventDateScope,
  type MediaSection,
} from './events-media-model';
import './events-media-directory.css';

export type ProductionEventsMediaDirectoryProps = Readonly<{
  load: (signal: AbortSignal) => Promise<ProductionEventsMediaDocumentV1>;
  language: UiLanguage;
  mode: EventsMediaMode;
  headingId: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  headingLevel?: 1 | 2;
  /** A separately owned current-media experience, deliberately above historical rows. */
  productionMedia?: ReactNode;
  videoChannels?: ReactNode;
  currentEvents?: ReactNode;
}>;
const external = {
  target: '_blank',
  rel: 'noopener noreferrer',
  referrerPolicy: 'no-referrer',
} as const;
const isHttps = (url: string) => url.startsWith('https://');
type DirectoryRecord =
  | ProductionEventsMediaEventV1
  | ProductionEventsMediaVideoV1
  | ProductionEventsMediaEpisodeV1
  | ProductionEventsMediaPodcastSourceV1;
const titleOf = (item: DirectoryRecord) => ('title' in item ? item.title : item.name);
const sourceOf = (item: DirectoryRecord) =>
  'sourceName' in item ? item.sourceName : (item.country ?? '—');
function date(language: UiLanguage, value: string) {
  const formatted = new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
  return `${formatted} UTC`;
}

export function ConsentDialog({
  url,
  onClose,
  copy,
}: {
  url: string;
  onClose: () => void;
  copy: ReturnType<typeof getEventsMediaCopy>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (!node.open) node.showModal();
    cancel.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'Tab') {
        const buttons = node.querySelectorAll<HTMLElement>('button,a,[href]');
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    node.addEventListener('keydown', key);
    return () => {
      node.removeEventListener('keydown', key);
      if (node.open) node.close();
    };
  }, [onClose]);
  return (
    <dialog
      ref={dialog}
      className="events-media-dialog"
      aria-labelledby="events-media-consent-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <h2 id="events-media-consent-title">{copy.consentTitle}</h2>
      <p>{copy.consentText}</p>
      <div>
        <button ref={cancel} type="button" onClick={onClose}>
          {copy.cancel}
        </button>
        <a href={url} {...external}>
          {copy.continue}
        </a>
      </div>
    </dialog>
  );
}
function OriginalLink({
  url,
  copy,
  onConsent,
}: {
  url: string;
  copy: ReturnType<typeof getEventsMediaCopy>;
  onConsent: (url: string, trigger: HTMLElement) => void;
}) {
  return isHttps(url) ? (
    <button
      type="button"
      className="events-media-link"
      onClick={(event) => onConsent(url, event.currentTarget)}
    >
      {copy.openOriginal}
    </button>
  ) : (
    <span className="events-media-http">{copy.http}</span>
  );
}

export function ProductionEventsMediaDirectory({
  load,
  language,
  mode,
  headingId,
  headingRef,
  headingLevel = 2,
  productionMedia,
  videoChannels,
  currentEvents,
}: ProductionEventsMediaDirectoryProps) {
  const copy = getEventsMediaCopy(language);
  const [data, setData] = useState<ProductionEventsMediaDocumentV1 | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [eventFilters, setEventFilters] = useState(emptyEventFilters);
  const [mediaFilters, setMediaFilters] = useState(emptyMediaFilters);
  const [section, setSection] = useState<MediaSection>('videos');
  const selection = useMemo(() => ({}), [mode, section, eventFilters, mediaFilters, data]);
  const [page, setPage] = useState<{ selection: object | null; shown: number }>({
    selection: null,
    shown: productionEventsMediaPageSize,
  });
  // Reset by identity during render; a later passive reset must not discard a click.
  const shown = page.selection === selection ? page.shown : productionEventsMediaPageSize;
  const [consent, setConsent] = useState<string | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const restoreConsentFocus = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    setData(null);
    load(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [load, retry]);
  useEffect(() => {
    setConsent(null);
  }, [mode, section, eventFilters, mediaFilters, data]);
  useEffect(() => {
    if (consent !== null || !restoreConsentFocus.current) return;
    restoreConsentFocus.current = false;
    trigger.current?.focus();
  }, [consent]);
  const closeConsent = useCallback(() => {
    restoreConsentFocus.current = true;
    setConsent(null);
  }, []);
  const request = (url: string, origin: HTMLElement) => {
    trigger.current = origin;
    setConsent(url);
  };
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  if (!data)
    return (
      <section
        className="events-media-directory"
        data-testid="production-events-media"
        aria-labelledby={headingId}
      >
        <Heading id={headingId} ref={headingRef} tabIndex={-1}>
          {mode === 'events' ? copy.events : copy.media}
        </Heading>
        {mode === 'media' ? productionMedia : null}
        {mode === 'events' && currentEvents}
        <p role="status">{failed ? copy.failed : copy.loading}</p>
        {failed ? (
          <button type="button" onClick={() => setRetry((value) => value + 1)}>
            {copy.retry}
          </button>
        ) : null}
      </section>
    );
  const languages = productionEventsMediaLanguages(data);
  const sourceNames = new Map(data.sources.map((item) => [item.legacyId, item.name]));
  const sourceOptions =
    section === 'videos'
      ? [...new Map(data.videos.map((item) => [item.sourceId, item.sourceName])).entries()].map(
          ([id, name]) => ({ id, name }),
        )
      : section === 'episodes'
        ? [
            ...new Map(
              data.episodes
                .flatMap((item) => item.observations)
                .map((item) => [item.sourceId, sourceNames.get(item.sourceId) ?? item.sourceId]),
            ).entries(),
          ].map(([id, name]) => ({ id, name }))
        : data.sources.map((item) => ({ id: item.legacyId, name: item.name }));
  const records: readonly DirectoryRecord[] =
    mode === 'events'
      ? filterProductionEvents(data.events, eventFilters)
      : section === 'videos'
        ? filterProductionMedia(data.videos, mediaFilters)
        : section === 'episodes'
          ? filterProductionMedia(data.episodes, mediaFilters)
          : filterProductionMedia(data.sources, mediaFilters);
  const visible = pageProductionEventsMedia(records, shown);
  return (
    <section
      className="events-media-directory"
      data-testid="production-events-media"
      aria-labelledby={headingId}
    >
      <Heading id={headingId} ref={headingRef} tabIndex={-1}>
        {mode === 'events' ? copy.events : copy.media}
      </Heading>
      {mode === 'media' ? productionMedia : null}
      {mode === 'events' && currentEvents}
      <p>
        {copy.historical}{' '}
        <time dateTime={data.snapshot.observedAt}>
          {formatEventsMediaCopy(copy.snapshot, { date: date(language, data.snapshot.observedAt) })}
        </time>
      </p>
      {mode === 'media' ? (
        <div className="events-media-tabs" role="group" aria-label={copy.media}>
          {(['videos', 'episodes', 'sources'] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={section === item}
              onClick={() => {
                setSection(item);
                setMediaFilters((current) => ({ ...current, sourceId: '' }));
              }}
            >
              {copy[item]}
            </button>
          ))}
        </div>
      ) : null}
      <div className="events-media-filters">
        <label>
          {copy.search}
          <input
            value={mode === 'events' ? eventFilters.query : mediaFilters.query}
            onChange={(e) =>
              mode === 'events'
                ? setEventFilters({ ...eventFilters, query: e.target.value })
                : setMediaFilters({ ...mediaFilters, query: e.target.value })
            }
          />
        </label>
        <label>
          {copy.language}
          <select
            value={mode === 'events' ? eventFilters.language : mediaFilters.language}
            onChange={(e) =>
              mode === 'events'
                ? setEventFilters({ ...eventFilters, language: e.target.value })
                : setMediaFilters({ ...mediaFilters, language: e.target.value })
            }
          >
            <option value="">{copy.all}</option>
            {languages.map((item) => (
              <option key={item} value={item}>
                {item === 'und' ? copy.unknownLanguage : item}
              </option>
            ))}
          </select>
        </label>
        {mode === 'events' ? (
          <>
            <label>
              {copy.country}
              <select
                value={eventFilters.country}
                onChange={(e) =>
                  setEventFilters({ ...eventFilters, country: e.target.value, city: '' })
                }
              >
                <option value="">{copy.all}</option>
                {[
                  ...new Set(
                    data.events
                      .map((item) => item.country)
                      .filter((item): item is string => item !== null),
                  ),
                ]
                  .toSorted()
                  .map((item) => (
                    <option key={item}>{item}</option>
                  ))}
              </select>
            </label>
            <label>
              {copy.city}
              <select
                value={eventFilters.city}
                onChange={(e) => setEventFilters({ ...eventFilters, city: e.target.value })}
              >
                <option value="">{copy.all}</option>
                {[
                  ...new Set(
                    data.events
                      .filter(
                        (item) => !eventFilters.country || item.country === eventFilters.country,
                      )
                      .map((item) => item.city)
                      .filter((item): item is string => item !== null),
                  ),
                ]
                  .toSorted()
                  .map((item) => (
                    <option key={item}>{item}</option>
                  ))}
              </select>
            </label>
            <label>
              {copy.from} ({copy.utc})
              <input
                type="date"
                value={eventFilters.from}
                onChange={(e) => setEventFilters({ ...eventFilters, from: e.target.value })}
              />
            </label>
            <label>
              {copy.to} ({copy.utc})
              <input
                type="date"
                value={eventFilters.to}
                onChange={(e) => setEventFilters({ ...eventFilters, to: e.target.value })}
              />
            </label>
            <label>
              {copy.events}
              <select
                value={eventFilters.scope}
                onChange={(e) =>
                  setEventFilters({ ...eventFilters, scope: e.target.value as EventDateScope })
                }
              >
                <option value="all">{copy.all}</option>
                <option value="past">{copy.past}</option>
                <option value="upcoming">{copy.upcoming}</option>
              </select>
            </label>
          </>
        ) : (
          <label>
            {copy.source}
            <select
              value={mediaFilters.sourceId}
              onChange={(e) => setMediaFilters({ ...mediaFilters, sourceId: e.target.value })}
            >
              <option value="">{copy.all}</option>
              {sourceOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          onClick={() =>
            mode === 'events'
              ? setEventFilters(emptyEventFilters)
              : setMediaFilters(emptyMediaFilters)
          }
        >
          {copy.reset}
        </button>
      </div>
      <p role="status" data-testid="events-media-count">
        {formatEventsMediaCopy(copy.showing, {
          shown: Math.min(shown, records.length),
          total: records.length,
        })}
      </p>
      {records.length === 0 ? (
        <p role="status">{copy.empty}</p>
      ) : (
        <ol className="events-media-list">
          {visible.map((item) => (
            <li key={item.id} data-events-media-id={item.id}>
              <article>
                {headingLevel === 1 ? (
                  <h2 lang={item.language === 'und' ? '' : item.language}>{titleOf(item)}</h2>
                ) : (
                  <h3 lang={item.language === 'und' ? '' : item.language}>{titleOf(item)}</h3>
                )}
                <p>
                  {sourceOf(item)} ·{' '}
                  {item.language === 'und' ? copy.unknownLanguage : item.language}
                </p>
                {'startAt' in item ? (
                  <p>
                    <time dateTime={item.startAt}>{date(language, item.startAt)}</time>
                    {item.endAt ? ` – ${date(language, item.endAt)}` : ''}
                    {item.country ? ` · ${item.country}` : ''}
                    {item.city ? ` · ${item.city}` : ''}
                  </p>
                ) : null}
                {'publishedAt' in item ? (
                  <p>
                    <time dateTime={item.publishedAt}>{date(language, item.publishedAt)}</time>
                    {'languageReviewRequired' in item && item.languageReviewRequired
                      ? ` · ${copy.reviewLanguage}`
                      : ''}
                  </p>
                ) : null}
                {'observationCount' in item ? (
                  <p>
                    {item.observationCount} · {copy.source}: {item.sourceName}
                  </p>
                ) : null}
                <OriginalLink url={item.originalUrl} copy={copy} onConsent={request} />
                {'startAt' in item ? <p>{copy.checkSchedule}</p> : null}
              </article>
            </li>
          ))}
        </ol>
      )}
      {shown < records.length ? (
        <button
          type="button"
          onClick={() =>
            setPage((current) => ({
              selection,
              shown:
                (current.selection === selection ? current.shown : productionEventsMediaPageSize) +
                productionEventsMediaPageSize,
            }))
          }
        >
          {copy.more}
        </button>
      ) : null}
      {mode === 'media' && section === 'videos' ? videoChannels : null}
      {consent ? <ConsentDialog url={consent} onClose={closeConsent} copy={copy} /> : null}
    </section>
  );
}
