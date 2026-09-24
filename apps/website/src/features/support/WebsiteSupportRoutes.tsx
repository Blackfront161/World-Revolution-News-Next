import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { type UiLanguage } from '@wrn/ui-language';
import { getWebsiteSupportCopy } from '@wrn/ui-language/support';
import type { MobileSupportV1 } from '@wrn/content-contracts/mobile-support-v1';
import { createWebsiteSupportProjector, loadWebsiteSupport } from './support-loader';
import './support.css';

const external = {
  target: '_blank',
  rel: 'noopener noreferrer',
  referrerPolicy: 'no-referrer',
} as const;
const draftKey = 'wrn.website.support-letter-draft.v1';
type View = 'help' | 'solidarity';
type Draft = Readonly<{ greeting: string; body: string; closing: string }>;
const blankDraft: Draft = Object.freeze({ greeting: '', body: '', closing: '' });
export type WebsiteSupportNavigationGuard = (
  continueNavigation: () => void,
  trigger?: HTMLElement | null,
) => boolean;
const normalize = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
const format = (value: string, data: Record<string, string>) =>
  value.replace(/\{(\w+)\}/gu, (_, key) => data[key] ?? '');

function nextDeadline(data: MobileSupportV1, now: Date) {
  const deadlines = [
    ...data.organizations.map((item) => item.nextCheck),
    ...data.persons.map((item) => item.nextReviewAt),
  ]
    .map((date) => Date.parse(`${date}T00:00:00.000Z`))
    .filter((time) => Number.isFinite(time) && time > now.getTime());
  return deadlines.length ? Math.min(...deadlines) : null;
}
function safeDraft(): Draft {
  try {
    const candidate: unknown = JSON.parse(window.localStorage.getItem(draftKey) ?? 'null');
    if (
      typeof candidate === 'object' &&
      candidate !== null &&
      !Array.isArray(candidate) &&
      ['greeting', 'body', 'closing'].every(
        (key) => typeof (candidate as Record<string, unknown>)[key] === 'string',
      )
    )
      return candidate as Draft;
  } catch {
    /* session-only */
  }
  return blankDraft;
}
function persistDraft(value: Draft) {
  try {
    window.localStorage.setItem(draftKey, JSON.stringify(value));
  } catch {
    /* session-only */
  }
}
function removeDraft() {
  try {
    window.localStorage.removeItem(draftKey);
  } catch {
    /* unavailable */
  }
}
function draftText(value: Draft) {
  return [value.greeting, value.body, value.closing].filter(Boolean).join('\n\n');
}
function downloadDraft(value: Draft) {
  const url = URL.createObjectURL(
    new Blob([draftText(value)], { type: 'text/plain;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'wrn-letter-draft.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
function useData() {
  const [data, setData] = useState<MobileSupportV1 | null>(null);
  const [failed, setFailed] = useState(false);
  const [retryEpoch, setRetryEpoch] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setData(null);
      setFailed(false);
      loadWebsiteSupport(controller.signal)
        .then(setData)
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) setFailed(true);
        });
    }, 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [retryEpoch]);
  return { data, failed, retry: () => setRetryEpoch((value) => value + 1) };
}

function HelpDirectory({ data, language }: { data: MobileSupportV1; language: UiLanguage }) {
  const copy = getWebsiteSupportCopy(language);
  const projector = useMemo(() => createWebsiteSupportProjector(), []);
  const [clock, setClock] = useState(() => new Date());
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [contactWarning, setContactWarning] = useState<string | null>(null);
  useEffect(() => {
    let timeout: number | undefined;
    const refresh = () => {
      const now = new Date();
      setClock(now);
      const deadline = nextDeadline(data, now);
      if (deadline !== null)
        timeout = window.setTimeout(
          refresh,
          Math.min(Math.max(0, deadline - now.getTime()), 2_147_483_647),
        );
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        if (timeout !== undefined) window.clearTimeout(timeout);
        refresh();
      }
    };
    refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [data]);
  const projection = projector.project(data, clock);
  const results = projection.organizations.filter(
    (item) =>
      (!query ||
        normalize(`${item.name} ${item.locations.join(' ')} ${item.helpTopics.join(' ')}`).includes(
          normalize(query),
        )) &&
      (!region || item.regions.includes(region)),
  );
  const regions = [...new Set(projection.organizations.flatMap((item) => item.regions))].sort();
  const recheck = (id: string) => {
    const now = new Date();
    const fresh = projector.project(data, now);
    setClock(now);
    const allowed = fresh.organizations.some((item) => item.id === id && item.directContactAllowed);
    if (!allowed) setContactWarning(copy.contactUnavailable);
    return allowed;
  };
  return (
    <section className="website-support-panel">
      <p>{copy.helpIntro}</p>
      <div className="website-content-filters">
        <label>
          {copy.search}
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          {copy.region}
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value="">{copy.allRegions}</option>
            {regions.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setRegion('');
          }}
        >
          {copy.reset}
        </button>
      </div>
      <p role="status">
        {results.length} {copy.results}
      </p>
      {contactWarning ? <p role="status">{contactWarning}</p> : null}
      <ul className="website-source-list">
        {results.map((item) => (
          <li key={item.id}>
            <h2>{item.name}</h2>
            <p>
              {item.locations.join(', ')} · {item.helpTopics.join(', ')}
            </p>
            <div lang={item.id === 'access-now-digital-security-helpline' ? 'en' : 'de'}>
              <p>{item.canHelpWith.join(' ')}</p>
              <p>{item.notResponsibleFor.join(' ')}</p>
            </div>
            <p>
              <small>
                {format(copy.lastChecked, { date: item.lastChecked })}.{' '}
                {format(copy.reviewDate, { date: item.nextCheck })}.
              </small>
            </p>
            <p className="website-safe-links">
              <a href={item.officialWebsite} {...external}>
                {copy.officialWebsite}
              </a>
              {item.directContactAllowed ? (
                <a
                  href={item.officialContact}
                  {...external}
                  onClick={(event) => {
                    if (!recheck(item.id)) event.preventDefault();
                  }}
                >
                  {copy.officialContact}
                </a>
              ) : (
                <span role="status">{copy.directContactHidden}</span>
              )}
            </p>
            <details>
              <summary>{copy.sourcesAndLimits}</summary>
              <p lang="de">{item.notResponsibleFor.join(' ')}</p>
              <ul>
                {item.verificationSources.map((url) => (
                  <li key={url}>
                    <a href={url} {...external}>
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DraftDialog({
  open,
  copy,
  onCancel,
  onDiscard,
}: {
  open: boolean;
  copy: ReturnType<typeof getWebsiteSupportCopy>;
  onCancel: () => void;
  onDiscard: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      continueRef.current?.focus();
    } else if (dialog.open) dialog.close();
  }, [open]);
  const trap = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab') return;
    const controls = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ];
    const index = controls.indexOf(document.activeElement as HTMLElement);
    event.preventDefault();
    controls[
      event.shiftKey
        ? index <= 0
          ? controls.length - 1
          : index - 1
        : index === controls.length - 1
          ? 0
          : index + 1
    ]?.focus();
  };
  return (
    <dialog
      ref={dialogRef}
      className="website-draft-confirm"
      aria-label={copy.discard}
      onCancel={(event) => {
        event.preventDefault();
        event.currentTarget.close();
        onCancel();
      }}
      onKeyDown={trap}
    >
      <p>{copy.discardQuestion}</p>
      <button ref={continueRef} type="button" onClick={onCancel}>
        {copy.continueEditing}
      </button>
      <button type="button" onClick={onDiscard}>
        {copy.discardAndContinue}
      </button>
    </dialog>
  );
}

function SolidarityDirectory({
  data,
  language,
  onNavigationGuardChange,
}: {
  data: MobileSupportV1;
  language: UiLanguage;
  onNavigationGuardChange?: (guard: WebsiteSupportNavigationGuard | null) => void;
}) {
  const copy = getWebsiteSupportCopy(language);
  const projector = useMemo(() => createWebsiteSupportProjector(), []);
  const projection = projector.project(data);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [draft, setDraft] = useState<Draft>(safeDraft);
  const [confirming, setConfirming] = useState(false);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dirty = Boolean(draftText(draft));
  const update = (field: keyof Draft, value: string) =>
    setDraft((current) => {
      const next = { ...current, [field]: value };
      persistDraft(next);
      return next;
    });
  const cancel = () => {
    pendingNavigation.current = null;
    setConfirming(false);
    triggerRef.current?.focus();
    triggerRef.current = null;
  };
  const discard = () => {
    removeDraft();
    setDraft(blankDraft);
    setConfirming(false);
    const continuation = pendingNavigation.current;
    pendingNavigation.current = null;
    triggerRef.current = null;
    continuation?.();
  };
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);
  useEffect(() => {
    if (!onNavigationGuardChange) return;
    if (!dirty) {
      onNavigationGuardChange(null);
      return;
    }
    const guard: WebsiteSupportNavigationGuard = (continuation, trigger) => {
      pendingNavigation.current = continuation;
      triggerRef.current = trigger ?? null;
      setConfirming(true);
      return false;
    };
    onNavigationGuardChange(guard);
    return () => onNavigationGuardChange(null);
  }, [dirty, onNavigationGuardChange]);
  const people = projection.persons.filter(
    (item) =>
      (!query ||
        normalize(`${item.publicName} ${item.country} ${item.region}`).includes(
          normalize(query),
        )) &&
      (!region || item.region === region),
  );
  const regions = [...new Set(projection.persons.map((item) => item.region))].sort();
  return (
    <section className="website-support-panel">
      <p role="status">{copy.historicalSnapshot}</p>
      <div className="website-content-filters">
        <label>
          {copy.search}
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          {copy.region}
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value="">{copy.allRegions}</option>
            {regions.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setRegion('');
          }}
        >
          {copy.reset}
        </button>
      </div>
      <ul className="website-source-list">
        {people.map((item) => (
          <li key={item.id}>
            <h2>{item.publicName}</h2>
            <p>
              {item.country} · {item.region}
            </p>
            {item.contextDe ? (
              <p lang="de">{item.contextDe}</p>
            ) : (
              <p>{copy.historicalDescriptionHidden}</p>
            )}
            <p>
              <small>
                {copy.historicalVerification}:{' '}
                <time dateTime={item.verifiedAt}>{item.verifiedAt}</time>; {copy.review}:{' '}
                <time dateTime={item.nextReviewAt}>{item.nextReviewAt}</time>.
              </small>
            </p>
            <p className="website-safe-links">
              <a href={item.profileUrl} {...external}>
                {copy.profileSource}
              </a>
            </p>
          </li>
        ))}
      </ul>
      <section className="website-letter-workshop" aria-labelledby="letter-workshop-title">
        <h2 id="letter-workshop-title">{copy.letterTitle}</h2>
        <p>{copy.letterPrivacy}</p>
        <label>
          {copy.greeting}
          <textarea
            value={draft.greeting}
            onChange={(event) => update('greeting', event.target.value)}
          />
        </label>
        <label>
          {copy.body}
          <textarea value={draft.body} onChange={(event) => update('body', event.target.value)} />
        </label>
        <label>
          {copy.closing}
          <textarea
            value={draft.closing}
            onChange={(event) => update('closing', event.target.value)}
          />
        </label>
        <p className="website-safe-links">
          <button type="button" disabled={!dirty} onClick={() => window.print()}>
            {copy.print}
          </button>
          <button type="button" disabled={!dirty} onClick={() => downloadDraft(draft)}>
            {copy.download}
          </button>
          <button
            type="button"
            disabled={!dirty}
            onClick={(event) => {
              triggerRef.current = event.currentTarget;
              setConfirming(true);
            }}
          >
            {copy.discard}
          </button>
        </p>
        <DraftDialog open={confirming} copy={copy} onCancel={cancel} onDiscard={discard} />
      </section>
    </section>
  );
}

export function WebsiteSupportRoute({
  view,
  language,
  headingRef,
  onNavigationGuardChange,
}: {
  view: View;
  language: UiLanguage;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onNavigationGuardChange?: (guard: WebsiteSupportNavigationGuard | null) => void;
}) {
  const copy = getWebsiteSupportCopy(language);
  const { data, failed, retry } = useData();
  const title = view === 'help' ? copy.helpTitle : copy.solidarityTitle;
  useLayoutEffect(() => {
    if (document.activeElement === document.body) headingRef.current?.focus();
  }, [headingRef]);
  return (
    <section className="website-support-view" aria-labelledby="website-page-title">
      <p className="hero-kicker">
        {view === 'help' ? copy.localDirectory : copy.historicalSources}
      </p>
      <h1 id="website-page-title" ref={headingRef} tabIndex={-1}>
        {title}
      </h1>
      {data === null ? (
        <div role="status">
          {failed ? (
            <>
              <p>{copy.loadError}</p>
              <button type="button" onClick={retry}>
                {copy.retry}
              </button>
            </>
          ) : (
            copy.loading
          )}
        </div>
      ) : view === 'help' ? (
        <HelpDirectory data={data} language={language} />
      ) : (
        <SolidarityDirectory
          data={data}
          language={language}
          onNavigationGuardChange={onNavigationGuardChange ?? (() => {})}
        />
      )}
    </section>
  );
}
