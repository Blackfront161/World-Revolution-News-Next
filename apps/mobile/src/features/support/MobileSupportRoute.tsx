import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import type { UiLanguage } from '@wrn/ui-language';
import {
  createMobileSupportReviewProjector,
  type MobileSupportV1,
} from '@wrn/content-contracts/mobile-support-v1';
import { getSupportCopy, getSupportReachabilityCopy } from './support-copy.js';
import { loadMobileSupport, type SupportLoader } from './support-loader.js';
import './support.css';

export type MobileSupportSection = 'help' | 'solidarity';
/** The app calls this before navigation. Returning false has opened the local discard choice. */
export type MobileSupportNavigationGuard = (continueNavigation: () => void) => boolean;
export type MobileSupportRouteProps = Readonly<{
  section: MobileSupportSection;
  language: UiLanguage;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  onNavigationGuardChange?: (guard: MobileSupportNavigationGuard | null) => void;
  loader?: SupportLoader;
  now?: () => Date;
}>;
type LoadState =
  | Readonly<{ kind: 'loading' }>
  | Readonly<{ kind: 'error' | 'invalid' }>
  | Readonly<{ kind: 'ready'; value: MobileSupportV1 }>;

const neutralTemplate =
  'Dear friend,\n\nI am writing to send solidarity and strength.\n\nWith solidarity,';
const currentClock = () => new Date();
function format(text: string, values: Readonly<Record<string, string>>) {
  return text.replace(/\{(\w+)\}/gu, (_, key: string) => values[key] ?? '');
}
function textMatch(query: string, values: readonly string[]) {
  return values.join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase());
}
function externalProps() {
  return { target: '_blank', rel: 'noopener noreferrer', referrerPolicy: 'no-referrer' as const };
}
function nextDeadline(document: MobileSupportV1, now: Date) {
  const future = [
    ...document.organizations.map((item) => item.nextCheck),
    ...document.persons.map((item) => item.nextReviewAt),
  ]
    .map((date) => Date.parse(`${date}T00:00:00.000Z`))
    .filter((time) => Number.isFinite(time) && time > now.getTime());
  return future.length ? Math.min(...future) : null;
}

export function MobileSupportRoute({
  section,
  language,
  headingRef,
  onNavigationGuardChange,
  loader,
  now = currentClock,
}: MobileSupportRouteProps) {
  const copy = getSupportCopy(language);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [retryEpoch, setRetryEpoch] = useState(0);
  const [clock, setClock] = useState(() => now());
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [location, setLocation] = useState('');
  const [topic, setTopic] = useState('');
  const [counsellingLanguage, setCounsellingLanguage] = useState('');
  const [exportRegion, setExportRegion] = useState('');
  const [greeting, setGreeting] = useState('');
  const [body, setBody] = useState('');
  const [closing, setClosing] = useState('');
  const [discardOpen, setDiscardOpen] = useState(false);
  const [printingText, setPrintingText] = useState<string | null>(null);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const createdUrls = useRef(new Set<string>());
  const runRef = useRef(0);
  const reviewProjector = useMemo(() => createMobileSupportReviewProjector(), []);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const continueEditingRef = useRef<HTMLButtonElement>(null);
  const draft = [greeting, body, closing].join('\n').trim();
  useLayoutEffect(() => {
    if (
      state.kind === 'ready' &&
      (document.activeElement === document.body ||
        document.activeElement?.id === 'mobile-page-title')
    )
      headingRef?.current?.focus();
  }, [state.kind, headingRef]);

  useEffect(() => {
    const abort = new AbortController();
    const run = ++runRef.current;
    const timeout = window.setTimeout(() => {
      reviewProjector.reset();
      setState({ kind: 'loading' });
      void loadMobileSupport(abort.signal, loader).then((result) => {
        if (abort.signal.aborted || run !== runRef.current || result.kind === 'aborted') return;
        setState(result.kind === 'ready' ? result : { kind: result.kind });
      });
    }, 0);
    return () => {
      window.clearTimeout(timeout);
      abort.abort();
    };
  }, [loader, retryEpoch, reviewProjector]);

  useEffect(() => {
    if (state.kind !== 'ready') return;
    let timeout: number | undefined;
    const reschedule = () => {
      const current = now();
      setClock(current);
      const deadline = nextDeadline(state.value, current);
      if (deadline === null) return;
      timeout = window.setTimeout(
        reschedule,
        Math.min(Math.max(0, deadline - current.getTime()), 2_147_483_647),
      );
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (timeout !== undefined) window.clearTimeout(timeout);
        timeout = undefined;
        reschedule();
      }
    };
    reschedule();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [now, state]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!draft) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [draft]);

  useEffect(() => {
    if (!onNavigationGuardChange) return;
    if (!draft) {
      onNavigationGuardChange(null);
      return;
    }
    const guard: MobileSupportNavigationGuard = (continueNavigation) => {
      pendingNavigation.current = continueNavigation;
      setDiscardOpen(true);
      return false;
    };
    onNavigationGuardChange(guard);
    return () => onNavigationGuardChange(null);
  }, [draft, onNavigationGuardChange]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!discardOpen) {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      return;
    }
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    continueEditingRef.current?.focus();
  }, [discardOpen]);

  useEffect(() => {
    if (printingText === null) return;
    const clear = () => setPrintingText(null);
    window.addEventListener('afterprint', clear, { once: true });
    const frame = window.requestAnimationFrame(() => window.print());
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('afterprint', clear);
    };
  }, [printingText]);

  useEffect(
    () => () => {
      for (const url of createdUrls.current) URL.revokeObjectURL(url);
      createdUrls.current.clear();
    },
    [],
  );

  const projection = useMemo(
    () => (state.kind === 'ready' ? reviewProjector.project(state.value, clock) : null),
    [clock, reviewProjector, state],
  );
  const resetFilters = useCallback(() => {
    setQuery('');
    setRegion('');
    setLocation('');
    setTopic('');
    setCounsellingLanguage('');
    setExportRegion('');
  }, []);
  const download = useCallback((filename: string, content: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    createdUrls.current.add(url);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      createdUrls.current.delete(url);
    }, 0);
  }, []);
  const discardDraft = useCallback(() => {
    setGreeting('');
    setBody('');
    setClosing('');
    setDiscardOpen(false);
    const continuation = pendingNavigation.current;
    pendingNavigation.current = null;
    onNavigationGuardChange?.(null);
    continuation?.();
  }, [onNavigationGuardChange]);
  const cancelDiscard = useCallback(() => {
    pendingNavigation.current = null;
    setDiscardOpen(false);
  }, []);
  const recheckDirectContact = useCallback(
    (organizationId: string) => {
      if (state.kind !== 'ready') return false;
      const fresh = reviewProjector.project(state.value, now());
      setClock(now());
      return fresh.organizations.some(
        (item) => item.id === organizationId && item.directContactAllowed,
      );
    },
    [now, reviewProjector, state],
  );

  if (state.kind === 'loading')
    return (
      <section className="support-route" aria-busy="true">
        <p role="status">{copy.loading}</p>
      </section>
    );
  if (state.kind !== 'ready' || projection === null) {
    return (
      <section className="support-route">
        <p role="alert">{copy.loadError}</p>
        <button type="button" onClick={() => setRetryEpoch((epoch) => epoch + 1)}>
          {copy.retry}
        </button>
      </section>
    );
  }

  const regions = [
    ...new Set(
      section === 'help'
        ? projection.organizations.flatMap((item) =>
            item.regions.filter((value) => value !== 'worldwide'),
          )
        : projection.persons.map((item) => item.region),
    ),
  ].sort();
  const topics = [...new Set(projection.organizations.flatMap((item) => item.helpTopics))].sort();
  const locations = [...new Set(projection.organizations.flatMap((item) => item.locations))].sort();
  const languages = [
    ...new Set(projection.organizations.flatMap((item) => item.confirmedCounsellingLanguages)),
  ].sort();
  const queryValues = (item: {
    name?: string;
    publicName?: string;
    country?: string;
    region?: string;
    locations?: readonly string[];
    helpTopics?: readonly string[];
    audiences?: readonly string[];
  }) => [
    item.name ?? item.publicName ?? '',
    item.country ?? '',
    item.region ?? '',
    ...(item.locations ?? []),
    ...(item.helpTopics ?? []),
    ...(item.audiences ?? []),
  ];
  const organizations = projection.organizations.filter(
    (item) =>
      (!query || textMatch(query, queryValues(item))) &&
      (!region || item.regions.includes(region) || item.regions.includes('worldwide')) &&
      (!location || item.locations.includes(location)) &&
      (!topic || item.helpTopics.includes(topic)) &&
      (!counsellingLanguage || item.confirmedCounsellingLanguages.includes(counsellingLanguage)),
  );
  const persons = projection.persons.filter(
    (item) =>
      (!query || textMatch(query, queryValues(item))) && (!region || item.region === region),
  );
  const sourceNames = new Map(projection.personSources.map((item) => [item.id, item.name]));
  const sourceById = new Map(projection.personSources.map((item) => [item.id, item]));

  return (
    <section className="support-route" aria-labelledby="mobile-page-title">
      <p className="support-overline">
        {section === 'help' ? copy.helpTitle : copy.solidarityTitle}
      </p>
      <h2 id="mobile-page-title" ref={headingRef} tabIndex={-1}>
        {section === 'help' ? copy.helpTitle : copy.solidarityTitle}
      </h2>
      <p>{section === 'help' ? copy.helpIntro : copy.solidarityIntro}</p>
      {section === 'solidarity' ? <p>{copy.historicalProvenance}</p> : null}
      <div className="support-filters" aria-label={copy.search}>
        <label>
          {copy.search}
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          {copy.region}
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value="">{copy.all}</option>
            {regions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        {section === 'help' ? (
          <>
            <label>
              {copy.location}
              <select value={location} onChange={(event) => setLocation(event.target.value)}>
                <option value="">{copy.all}</option>
                {locations.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {copy.topic}
              <select value={topic} onChange={(event) => setTopic(event.target.value)}>
                <option value="">{copy.all}</option>
                {topics.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {copy.language}
              <select
                value={counsellingLanguage}
                onChange={(event) => setCounsellingLanguage(event.target.value)}
              >
                <option value="">{copy.all}</option>
                {languages.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        <button type="button" onClick={resetFilters}>
          {copy.reset}
        </button>
      </div>
      {section === 'help' ? (
        <div className="support-list">
          {organizations.length === 0 ? (
            <p role="status">{copy.noResults}</p>
          ) : (
            organizations.map((item) => (
              <article key={item.id} className="support-card">
                <h3>{item.name}</h3>
                {item.regions.includes('worldwide') ? <p>{copy.globalService}</p> : null}
                <p>
                  {item.officialOperator} · {item.regions.join(', ')} · {item.locations.join(', ')}
                </p>
                <div lang={item.id === 'access-now-digital-security-helpline' ? 'en' : 'de'}>
                  <p>{item.canHelpWith.join(' · ')}</p>
                  <p>{item.notResponsibleFor.join(' · ')}</p>
                  <p>
                    {item.audiences.join(' · ')} · {item.requirements.join(' · ')}
                  </p>
                </div>
                <p>{format(copy.lastChecked, { date: item.lastChecked })}</p>
                <p>
                  {format(copy.historicalReachability, {
                    status: getSupportReachabilityCopy(language, item.reachabilityStatus),
                  })}
                </p>
                <p>{format(copy.reviewDate, { date: item.nextCheck })}</p>
                {item.reviewState === 'overdue' ? (
                  <p role="status">
                    {copy.reviewOverdue} {copy.directContactHidden}
                  </p>
                ) : null}
                <a href={item.officialWebsite} {...externalProps()}>
                  {copy.officialWebsite}
                </a>
                {item.directContactAllowed ? (
                  <a
                    href={item.officialContact}
                    {...externalProps()}
                    onClick={(event) => {
                      if (!recheckDirectContact(item.id)) event.preventDefault();
                    }}
                  >
                    {copy.officialContact}
                  </a>
                ) : null}
                <details>
                  <summary>{copy.source}</summary>
                  <ul>
                    {item.verificationSources.map((link) => (
                      <li key={link}>
                        <a href={link} {...externalProps()}>
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              </article>
            ))
          )}
        </div>
      ) : (
        <>
          <div className="support-list">
            {persons.length === 0 ? (
              <p role="status">{copy.noResults}</p>
            ) : (
              persons.map((item) => (
                <article key={item.id} className="support-card">
                  <h3>{item.publicName}</h3>
                  <p>
                    {item.country} · {item.region}
                  </p>
                  <p>{copy.historicalEntry}</p>
                  <p>{format(copy.historicalObservedAt, { date: state.value.observedAt })}</p>
                  <p>{format(copy.reviewDate, { date: item.nextReviewAt })}</p>
                  {item.reviewState === 'overdue' ? (
                    <p role="status">{copy.reviewOverdue}</p>
                  ) : (
                    <p lang="de">{item.contextDe}</p>
                  )}
                  <details>
                    <summary>{copy.source}</summary>
                    <ul>
                      {item.sourceIds.map((id) => (
                        <li key={id}>
                          {sourceNames.get(id)}{' '}
                          {sourceById.get(id) ? (
                            <a href={sourceById.get(id)!.url} {...externalProps()}>
                              {copy.source}
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </details>
                  <a href={item.profileUrl} {...externalProps()}>
                    {copy.profileSource}
                  </a>
                </article>
              ))
            )}
          </div>
          <section className="support-letter" aria-labelledby="support-letter-title">
            <h3 id="support-letter-title">{copy.letterTitle}</h3>
            <p>{copy.letterIntro}</p>
            <label>
              {copy.greeting}
              <input
                value={greeting}
                maxLength={10_000}
                onChange={(event) => setGreeting(event.target.value)}
              />
            </label>
            <label>
              {copy.body}
              <textarea
                value={body}
                maxLength={10_000}
                onChange={(event) => setBody(event.target.value)}
              />
            </label>
            <label>
              {copy.closing}
              <input
                value={closing}
                maxLength={10_000}
                onChange={(event) => setClosing(event.target.value)}
              />
            </label>
            <p>{copy.draftWarning}</p>
            <button
              type="button"
              onClick={() => {
                if (!draft) setBody(neutralTemplate);
              }}
            >
              {copy.applyTemplate}
            </button>
            <button
              type="button"
              disabled={!draft}
              onClick={() =>
                download(
                  'wrn-letter-draft.txt',
                  [greeting, body, closing].filter(Boolean).join('\n\n'),
                  'text/plain;charset=utf-8',
                )
              }
            >
              {copy.download}
            </button>
            <button
              type="button"
              disabled={!draft}
              onClick={() =>
                setPrintingText([greeting, body, closing].filter(Boolean).join('\n\n'))
              }
            >
              {copy.print}
            </button>
            <button type="button" disabled={!draft} onClick={discardDraft}>
              {copy.discard}
            </button>
            <label>
              {copy.exportRegion}
              <select
                value={exportRegion}
                onChange={(event) => setExportRegion(event.target.value)}
              >
                <option value="">{copy.chooseExportRegion}</option>
                {regions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!exportRegion}
              onClick={() =>
                download(
                  'wrn-support-region-list.json',
                  JSON.stringify(
                    {
                      schema: 'wrn.support-region-list.v1',
                      version: 1,
                      snapshotCommit: state.value.sourceCommit,
                      observedAt: state.value.observedAt,
                      region: exportRegion,
                      profileIds: projection.persons
                        .filter(
                          (item) => item.region === exportRegion || item.region === 'worldwide',
                        )
                        .map((item) => item.id)
                        .sort(),
                    },
                    null,
                    2,
                  ),
                  'application/json;charset=utf-8',
                )
              }
            >
              {copy.exportList}
            </button>
          </section>
        </>
      )}
      <dialog
        ref={dialogRef}
        aria-label={copy.navigationPrompt}
        className="support-dialog"
        onCancel={(event) => {
          event.preventDefault();
          cancelDiscard();
        }}
        onClose={() => {
          if (discardOpen) cancelDiscard();
        }}
      >
        {discardOpen ? (
          <>
            <p>{copy.navigationPrompt}</p>
            <button ref={continueEditingRef} type="button" onClick={cancelDiscard}>
              {copy.continueEditing}
            </button>
            <button type="button" onClick={discardDraft}>
              {copy.discardAndContinue}
            </button>
          </>
        ) : null}
      </dialog>
      {printingText !== null
        ? createPortal(<pre className="support-print-only">{printingText}</pre>, document.body)
        : null}
    </section>
  );
}
