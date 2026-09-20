import { WebsiteSupportWelcome } from './website-support-welcome';
import {
  createContext,
  useCallback,
  useEffect,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react';
import {
  isThemePreference,
  normalizeThemePreference,
  resolveEffectiveTheme,
  shellCopy,
  themePreferenceIds,
  themeStorageKey,
  type ThemePreference,
} from '@wrn/brand-tokens';
import {
  englishUiCopy,
  formatUiCopy,
  getUiCopy,
  isUiLanguage,
  isRegisteredUiLanguage,
  registeredUiLanguages,
  uiLanguageDirections,
  uiLanguageNativeNames,
  type UiCopy,
  type UiLanguage,
} from '@wrn/ui-language';
import type {
  ArchiveLifecycleValidationResult,
  LocalArticle,
  LocalArchiveLifecycleV1,
  LocalContentReleaseReadyV1,
  LocalReaderDetailsV1,
} from '@wrn/content-contracts';
import {
  clearAllLocalReadingData,
  clearLocalReadMarkers,
  clearLocalSavedArticles,
  createCanonicalArticleShareUrl,
  createReadyFeedState,
  createEmptyLocalReadingState,
  createLocalArchiveProjection,
  createReaderLoadingState,
  displayOriginalLanguage,
  emptyDiscoverCriteria,
  feedStates,
  filterDiscoverArticles,
  hasActiveDiscoverCriteria,
  parseNavigationTargetId,
  resolveNavigationTarget,
  resolveLocalArchiveLifecycle,
  resolveLocalReaderState,
  markLocalArticleRead,
  markLocalArticleUnread,
  reconcileLocalReadingState,
  removeLocalReadingArticle,
  resetLocalReadingProgress,
  saveLocalReadingArticle,
  updateLocalReadingProgress,
  type LocalReadingStateV1,
  type ArchiveLifecycleResolution,
  type ArchiveProjection,
  websiteCompactNavigationIds,
  websiteExpandedNavigationIds,
  type FeedReadyState,
  type FeedStateKind,
  type NavigationTargetId,
  type ReaderState,
} from '@wrn/domain';
import { loadWebsiteReadingState, mutateWebsiteReadingState } from './local-reading-state';
import {
  clearWebsiteUiLanguageHandoff,
  loadWebsiteUiLanguage,
  persistWebsiteUiLanguage,
  readWebsiteUiLanguageHandoff,
  websiteUiLanguageHandoffParameter,
} from './ui-language-preference';
import {
  loadLocalContentRelease as loadWebsiteLocalContentRelease,
  type LocalContentReleaseRuntime,
} from './local-content-release';
import type { ContentOfflineControllerResult } from './content-offline-controller';
import { useContentOfflineController } from './content-offline-ui';
import { WebsiteShellPanel } from './offline-shell-ui/WebsiteShellPanel';
import { VideoSources } from './video-sources-ui';
import { WebsiteProductionEventsMediaRoute } from './features/events-media/WebsiteProductionEventsMediaRoute';
import { WebsitePersonalizationArea } from './local-personalization-ui';
import { WebsiteProductionContentArea } from './production-content-ui';
import { CurrentRegionalEvents } from '../../../packages/browser-content/src/regional-events/regional-events';
import { SourcePreferencesProvider } from '../../../packages/browser-content/src/source-preferences-ui';
import { getDirectoryCopy } from '@wrn/ui-language/directory';
import { WebsiteKnowledgeRoute } from './features/knowledge/WebsiteKnowledgeRoute';
import { WebsiteContentDirectoryRoute } from './features/directory/WebsiteContentDirectoryRoute';
import { readWebsiteDirectorySection } from './features/directory/directory-navigation';
import { loadWebsiteContentDirectory } from './features/directory/directory-loader';
import {
  createBrowserShareAdapter,
  type ShareAdapter,
} from '../../../packages/browser-content/src/browser-share';
import {
  WebsiteSupportRoute,
  type WebsiteSupportNavigationGuard,
} from './features/support/WebsiteSupportRoutes';

type LocalFixtureLoader = (signal: AbortSignal) => Promise<LocalContentReleaseRuntime>;
type ReaderFixture = Pick<LocalContentReleaseReadyV1, 'readerDetails'>;
type ReaderArticles = Parameters<typeof filterDiscoverArticles>[0];
type LocalArchiveLifecycleFixture = Readonly<{
  articles: readonly LocalArticle[];
  details: LocalReaderDetailsV1;
  lifecycle: LocalArchiveLifecycleV1;
  validation: ArchiveLifecycleValidationResult;
}>;
type OfflineAction = 'save' | 'check' | 'activate' | 'rollback' | 'clear';

function WebsiteContentOfflinePanel({
  result,
  operationResult,
  busy,
  language,
  onAction,
}: {
  result: ContentOfflineControllerResult | null;
  operationResult: ContentOfflineControllerResult | null;
  busy: boolean;
  language: UiLanguage;
  onAction: (action: OfflineAction, trigger: HTMLButtonElement) => void;
}) {
  const copy = useUiCopy();
  if (result === null)
    return (
      <section className="content-offline-panel" aria-busy="true">
        <h2>{copy.localContent}</h2>
        <p role="status">{copy.loading}</p>
      </section>
    );
  const allowed = result.readAccess === 'allowed' && result.runtime !== null;
  const label: Readonly<Record<OfflineAction, string>> = {
    save: copy.saveLocalContent,
    check: copy.checkLocalContent,
    activate: copy.activateLocalContent,
    rollback: copy.rollbackLocalContent,
    clear: copy.clearLocalContent,
  };
  return (
    <section
      className="content-offline-panel"
      aria-labelledby="website-local-content-title"
      aria-busy={busy}
    >
      <h2 id="website-local-content-title">{copy.localContent}</h2>
      <p>{copy.localContentDetail}</p>
      {allowed && result.active !== null ? (
        <p>{formatUiCopy(copy.contentActiveRevision, { revision: result.active.revision })}</p>
      ) : (
        <p role="status">
          {result.reason === 'expired' || result.reason === 'clock-regressed'
            ? copy.contentExpired
            : result.reason === 'no-active-bundle'
              ? copy.contentNoContent
              : copy.contentProtectedDetail}
        </p>
      )}
      {result.active !== null ? (
        <p>
          {formatUiCopy(copy.contentCheckedAt, {
            time: new Date(result.active.checkedAt).toLocaleString(language),
          })}
        </p>
      ) : null}
      <p role="status">
        {result.persistence === 'stored'
          ? copy.contentStored
          : result.persistence === 'session-only'
            ? copy.contentSessionOnly
            : formatUiCopy(copy.contentUnavailable, { reason: copy.contentProtectedDetail })}
      </p>
      {busy ? <p role="status">{copy.contentWorking}</p> : null}
      {operationResult?.failure != null || operationResult?.storageFailure != null ? (
        <p role="status" data-testid="content-operation-message">
          {operationResult.storageFailure !== null
            ? operationResult.actions.length === 0
              ? copy.contentStorageProtected
              : copy.contentStorageFailed
            : copy.contentCheckFailed}
        </p>
      ) : null}
      {result.candidate !== null ? (
        <p>
          {formatUiCopy(copy.contentCandidateRevision, { revision: result.candidate.revision })}
          {!result.candidate.eligible ? ` â€” ${copy.contentAlternativeUnavailable}` : ''}
        </p>
      ) : null}
      {result.previous !== null ? (
        <p>
          {formatUiCopy(copy.contentPreviousRevision, { revision: result.previous.revision })}
          {!result.previous.eligible ? ` â€” ${copy.contentAlternativeUnavailable}` : ''}
        </p>
      ) : null}
      <div className="content-offline-actions">
        {result.actions.map((action) => (
          <button
            key={action}
            type="button"
            disabled={busy && action !== 'clear'}
            onClick={(event) => onAction(action, event.currentTarget)}
          >
            {label[action]}
          </button>
        ))}
      </div>
    </section>
  );
}

function WebsiteContentOfflineConfirmation({
  action,
  trigger,
  onClose,
  onConfirm,
}: {
  action: Extract<OfflineAction, 'rollback' | 'clear' | 'activate'>;
  trigger: HTMLButtonElement | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const copy = useUiCopy();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const backdrop = backdropRef.current;
    const siblings = [...(backdrop?.parentElement?.children ?? [])].filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== backdrop,
    );
    const prior = siblings.map((element) => element.inert);
    siblings.forEach((element) => {
      element.inert = true;
    });
    cancelRef.current?.focus();
    return () => {
      siblings.forEach((element, index) => {
        element.inert = prior[index]!;
      });
      queueMicrotask(() => {
        if (backdrop?.isConnected) return;
        const destination =
          trigger?.isConnected && !trigger.disabled
            ? trigger
            : document.querySelector<HTMLElement>('main');
        destination?.focus();
      });
    };
  }, [trigger]);
  const label =
    action === 'clear'
      ? copy.clearLocalContent
      : action === 'rollback'
        ? copy.rollbackLocalContent
        : copy.activateLocalContent;
  return (
    <div className="confirmation-backdrop source-dialog-backdrop" ref={backdropRef}>
      <section
        className="confirmation-dialog source-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="website-content-confirm-title"
        aria-describedby="website-content-confirm-detail"
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')];
          const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
          if (event.shiftKey && current === 0) {
            event.preventDefault();
            buttons.at(-1)?.focus();
          } else if (!event.shiftKey && current === buttons.length - 1) {
            event.preventDefault();
            buttons[0]?.focus();
          }
        }}
      >
        <h2 id="website-content-confirm-title">
          {formatUiCopy(copy.contentActionQuestion, { action: label })}
        </h2>
        <p id="website-content-confirm-detail">
          {action === 'clear' ? copy.contentClearDetail : copy.contentProtectedDetail}
        </p>
        {action === 'clear' ? <p>{copy.contentSafetyDetail}</p> : null}
        <div className="source-dialog-actions">
          <button ref={cancelRef} type="button" onClick={onClose}>
            {copy.cancel}
          </button>
          <button type="button" onClick={onConfirm}>
            {label}
          </button>
        </div>
      </section>
    </div>
  );
}

function needsWideLanguageSelectorLayout() {
  const rootFontSize = Number.parseFloat(
    window.getComputedStyle(document.documentElement).fontSize,
  );
  return Number.isFinite(rootFontSize) && rootFontSize >= 24 && window.innerWidth <= 480;
}
const localShareAdapter: ShareAdapter = createBrowserShareAdapter();

const UiCopyContext = createContext<UiCopy>(englishUiCopy);
const useUiCopy = () => useContext(UiCopyContext);

function stateLabels(copy: UiCopy): Readonly<Record<FeedStateKind, string>> {
  return {
    loading: copy.loading,
    empty: copy.empty,
    error: copy.error,
    offline: copy.offline,
    'optional-absent': copy.noMedia,
    ready: copy.ready,
  };
}
function uiThemeLabels(copy: UiCopy): Readonly<Record<ThemePreference, string>> {
  return {
    violet: copy.themeViolet,
    dark: copy.themeDark,
    editorial: copy.themeEditorial,
    oled: copy.themeOled,
    soft: copy.themeSoft,
    pink: copy.themePink,
    light: copy.themeLight,
    system: copy.themeSystem,
    contrast: copy.themeContrast,
  };
}
function readState(value: string | null): FeedStateKind {
  return value === null
    ? 'ready'
    : feedStates.includes(value as FeedStateKind)
      ? (value as FeedStateKind)
      : 'error';
}
function getSystemMediaQuery(): MediaQueryList | null {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
}
function readSystemPrefersDark(): boolean {
  return getSystemMediaQuery()?.matches ?? false;
}
function readThemePreference(
  query: URLSearchParams,
  initialTheme?: ThemePreference,
): ThemePreference {
  if (initialTheme !== undefined) return normalizeThemePreference(initialTheme);
  if (query.has('theme')) return normalizeThemePreference(query.get('theme'));
  try {
    const storedPreference = window.localStorage.getItem(themeStorageKey);
    if (storedPreference !== null && !isThemePreference(storedPreference)) {
      window.localStorage.removeItem(themeStorageKey);
      return 'violet';
    }
    return normalizeThemePreference(storedPreference);
  } catch {
    return 'violet';
  }
}
function readNavigationTargetFromLocation(): NavigationTargetId {
  if (/^#discover\/(news|sources|sport)$/u.test(window.location.hash)) return 'discover';
  return resolveNavigationTarget(window.location.hash.replace(/^#\/?/, ''));
}
function readWebsiteArticleIdFromLocation(): string | null {
  const value = new URLSearchParams(window.location.search).get('article');
  return value === null ? null : value;
}
function readWebsiteArchiveRoute(): string | null | undefined {
  const query = new URLSearchParams(window.location.search);
  if (!query.has('archive')) return undefined;
  const value = query.get('archive');
  return value === '' ? null : value;
}
function readReaderHistory(articleId: string): {
  origin: NavigationTargetId;
  triggerId: string;
} | null {
  const state = window.history.state;
  if (state === null || typeof state !== 'object') return null;
  const candidate = state as Record<string, unknown>;
  const origin = parseNavigationTargetId(candidate.wrnReaderOriginTarget);
  return candidate.wrnReaderArticleId === articleId &&
    origin !== null &&
    typeof candidate.wrnReaderTriggerId === 'string' &&
    candidate.wrnReaderTriggerId.length > 0
    ? { origin, triggerId: candidate.wrnReaderTriggerId }
    : null;
}
function formatUtcDate(value: string): string {
  return `${value.slice(8, 10)}.${value.slice(5, 7)}.${value.slice(0, 4)}, ${value.slice(11, 16)} UTC`;
}
/**
 * The saved-reading projection can only expose IDs that are already bound to
 * a validated local content source. The archive lifecycle stays authoritative
 * for aliases, removals and revocations; the validated ready feed adds its
 * own active reader IDs without turning a saved-state-only ID into content.
 */
function bindReadingLifecycle(archive: LocalArchiveLifecycleFixture, ready: FeedReadyState | null) {
  const activeContentIds = ready === null ? [] : [...ready.articleIds];
  const archiveArticleIds = [
    ...new Set([...archive.lifecycle.archiveArticleIds, ...activeContentIds]),
  ].sort();
  const activeArticleIds = [
    ...new Set([...archive.lifecycle.activeArticleIds, ...activeContentIds]),
  ].sort();
  const lifecycle = Object.freeze({
    ...archive.lifecycle,
    archiveArticleIds: Object.freeze(archiveArticleIds),
    activeArticleIds: Object.freeze(activeArticleIds),
  });
  return Object.freeze({
    lifecycle,
    lifecycleValidation: Object.freeze({
      ...archive.validation,
      archiveArticleIds: Object.freeze(archiveArticleIds),
    }),
  });
}

function statusMessage(copy: UiCopy, state: Exclude<FeedStateKind, 'ready'>): string {
  switch (state) {
    case 'loading':
      return copy.stateLoading;
    case 'empty':
      return copy.stateEmpty;
    case 'error':
      return copy.stateError;
    case 'offline':
      return copy.stateOffline;
    case 'optional-absent':
      return copy.stateNoMedia;
  }
}

function WebsiteDiscover({
  articles,
  index,
  criteria,
  onCriteria,
  onRead,
  headingRef,
}: {
  articles: Parameters<typeof filterDiscoverArticles>[0];
  index: Parameters<typeof filterDiscoverArticles>[1];
  criteria: ReturnType<typeof filterDiscoverArticles>['criteria'];
  onCriteria: (criteria: ReturnType<typeof filterDiscoverArticles>['criteria']) => void;
  onRead: (articleId: string, trigger: HTMLButtonElement) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const copy = useUiCopy();
  const result = filterDiscoverArticles(articles, index, criteria);
  const active = hasActiveDiscoverCriteria(result.criteria);
  const set = <K extends keyof typeof result.criteria>(
    key: K,
    value: (typeof result.criteria)[K],
  ) => onCriteria({ ...result.criteria, [key]: value });
  const reset = () => {
    onCriteria(emptyDiscoverCriteria);
    document.getElementById('website-discover-search')?.focus();
  };
  const activeCriteria = [
    { key: 'query' as const, label: copy.searchNews, value: result.criteria.query },
    { key: 'region' as const, label: copy.region, value: result.criteria.region },
    { key: 'topic' as const, label: copy.topic, value: result.criteria.topic },
    { key: 'source' as const, label: copy.source, value: result.criteria.source },
    {
      key: 'originalLanguage' as const,
      label: copy.languageLabel,
      value:
        result.criteria.originalLanguage &&
        displayOriginalLanguage(result.criteria.originalLanguage),
    },
    { key: 'format' as const, label: copy.format, value: result.criteria.format },
  ].filter((entry) => Boolean(entry.value)) as {
    key: keyof typeof result.criteria;
    label: string;
    value: string;
  }[];
  return (
    <section className="website-discover" aria-labelledby="website-page-title">
      <p className="hero-kicker">{copy.localSearchAndFilters}</p>
      <h1 id="website-page-title" ref={headingRef} tabIndex={-1}>
        {copy.discover}
      </h1>
      <p className="discover-intro">{copy.discoverWebsiteIntro}</p>
      <div className="website-discover-layout">
        <form className="discover-controls" onSubmit={(event) => event.preventDefault()}>
          <label className="discover-search-label" htmlFor="website-discover-search">
            {copy.searchNews}
          </label>
          <input
            id="website-discover-search"
            className="discover-search"
            type="search"
            value={result.criteria.query}
            onChange={(event) => set('query', event.target.value)}
            placeholder={copy.searchPlaceholder}
          />
          <fieldset className="discover-facets">
            <legend>{copy.filters}</legend>
            <label>
              {copy.region}
              <select
                value={result.criteria.region ?? ''}
                onChange={(event) => set('region', event.target.value || null)}
              >
                <option value="">{copy.allRegions}</option>
                {result.facets.regions.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              {copy.topic}
              <select
                value={result.criteria.topic ?? ''}
                onChange={(event) => set('topic', event.target.value || null)}
              >
                <option value="">{copy.allTopics}</option>
                {result.facets.topics.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              {copy.source}
              <select
                value={result.criteria.source ?? ''}
                onChange={(event) => set('source', event.target.value || null)}
              >
                <option value="">{copy.allSources}</option>
                {result.facets.sources.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              {copy.originalLanguage}
              <select
                value={result.criteria.originalLanguage ?? ''}
                onChange={(event) => set('originalLanguage', event.target.value || null)}
              >
                <option value="">{copy.allLanguages}</option>
                {result.facets.originalLanguages.map((value) => (
                  <option key={value} value={value}>
                    {displayOriginalLanguage(value)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {copy.format}
              <select
                value={result.criteria.format ?? ''}
                onChange={(event) =>
                  set('format', (event.target.value || null) as typeof result.criteria.format)
                }
              >
                <option value="">{copy.allFormats}</option>
                {result.facets.formats.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </fieldset>
        </form>
        <div className="discover-results">
          <div className="discover-summary" aria-live="polite" aria-atomic="true">
            <p role="status">{formatUiCopy(copy.resultCount, { count: result.articles.length })}</p>
            {active && result.articles.length > 0 ? (
              <button type="button" onClick={reset}>
                {copy.resetFilters}
              </button>
            ) : null}
          </div>
          {activeCriteria.length > 0 ? (
            <ul className="active-criteria" aria-label={copy.activeCriteria}>
              {activeCriteria.map(({ key, label, value }) => (
                <li key={key}>
                  <button
                    type="button"
                    aria-label={formatUiCopy(copy.removeCriteria, { label, value })}
                    onClick={() => set(key, (key === 'query' ? '' : null) as never)}
                  >
                    {label}: {value} Ã—
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {result.articles.length === 0 ? (
            <section className="discover-empty" aria-labelledby="website-discover-empty-title">
              <h2 id="website-discover-empty-title">{copy.noResults}</h2>
              <p>{copy.noResultsDetail}</p>
              <button type="button" onClick={reset}>
                {copy.resetFilters}
              </button>
            </section>
          ) : (
            <div className="article-grid" aria-label={copy.filteredLocalNews}>
              {result.articles.map((article) => (
                <article
                  className="website-feed-card"
                  key={article.id}
                  data-article-id={article.id}
                >
                  <div className="article-content">
                    <p className="article-source">{article.sourceName}</p>
                    <h2>{article.title}</h2>
                    <p className="article-teaser">{article.teaser}</p>
                    <p className="discover-card-meta">
                      {article.region} Â· {article.format} Â·{' '}
                      {displayOriginalLanguage(article.originalLanguage)}
                    </p>
                    <ul className="tag-list" aria-label={copy.topics}>
                      {article.topics.map((topic) => (
                        <li key={topic}>{topic}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="reader-entry"
                      data-reader-trigger={article.id}
                      onClick={(event) => onRead(article.id, event.currentTarget)}
                    >
                      {copy.readArticle}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function WebsiteReader({
  state,
  onClose,
  onConfirmSource,
  saved,
  isRead,
  progress,
  onSaveToggle,
  onReadToggle,
  onSaveProgress,
  onResetProgress,
  readingActionsDisabled,
  readingProtectionMessage,
}: {
  state: ReaderState;
  onClose: () => void;
  onConfirmSource: (
    article: Extract<ReaderState, { kind: 'ready' }>['article'],
    trigger: HTMLButtonElement,
  ) => void;
  saved: boolean;
  isRead: boolean;
  progress: number | undefined;
  onSaveToggle: (articleId: string) => void;
  onReadToggle: (articleId: string, isRead: boolean) => void;
  onSaveProgress: (articleId: string) => void;
  onResetProgress: (articleId: string) => void;
  readingActionsDisabled: boolean;
  readingProtectionMessage: string | null;
}) {
  const copy = useUiCopy();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [state.kind]);
  if (state.kind !== 'ready') {
    const isError = state.kind === 'error';
    const detail =
      state.kind === 'loading'
        ? copy.readerLoadingDetail
        : isError
          ? copy.readerUnavailableDetail
          : copy.readerNotFoundDetail;
    return (
      <section className="reader-status" aria-labelledby="website-reader-title">
        <p className="hero-kicker">{copy.localReader}</p>
        <h1 id="website-reader-title" ref={headingRef} tabIndex={-1}>
          {state.kind === 'loading'
            ? copy.articleLoading
            : isError
              ? copy.articleUnavailable
              : copy.articleNotFound}
        </h1>
        <p
          role={isError ? 'alert' : 'status'}
          aria-live="polite"
          aria-busy={state.kind === 'loading'}
        >
          {detail}
        </p>
        <button type="button" className="reader-back" onClick={onClose}>
          {copy.backToHome}
        </button>
      </section>
    );
  }
  const { article, detail, isOffline } = state;
  return (
    <article className="website-reader" aria-labelledby="website-reader-title">
      <button type="button" className="reader-back" onClick={onClose}>
        {copy.back}
      </button>
      {isOffline ? (
        <p className="discover-offline" role="status">
          {copy.readerOffline}
        </p>
      ) : null}
      <p className="article-source">{article.source.name}</p>
      <h1 id="website-reader-title" ref={headingRef} tabIndex={-1}>
        {article.title}
      </h1>
      <dl className="reader-meta">
        <div>
          <dt>{copy.date}</dt>
          <dd>{formatUtcDate(article.publishedAt)}</dd>
        </div>
        <div>
          <dt>{copy.originalLanguage}</dt>
          <dd>{displayOriginalLanguage(article.originalLanguage)}</dd>
        </div>
      </dl>
      <ul className="tag-list" aria-label={copy.topics}>
        {article.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      <div className="reader-content">
        {detail.blocks.map((block, index) => {
          if (block.kind === 'paragraph') return <p key={index}>{block.text}</p>;
          if (block.kind === 'heading')
            return block.level === 2 ? (
              <h2 key={index}>{block.text}</h2>
            ) : (
              <h3 key={index}>{block.text}</h3>
            );
          if (block.kind === 'quote')
            return (
              <blockquote key={index}>
                <p>{block.text}</p>
                {block.attribution ? <footer>{block.attribution}</footer> : null}
              </blockquote>
            );
          const List = block.style === 'ordered' ? 'ol' : 'ul';
          return (
            <List key={index}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </List>
          );
        })}
      </div>
      <section className="reading-actions" aria-label={copy.localReadingData}>
        <h2>{copy.localReadingData}</h2>
        {readingProtectionMessage !== null ? <p role="status">{readingProtectionMessage}</p> : null}
        <button
          type="button"
          disabled={readingActionsDisabled}
          onClick={() => onSaveToggle(article.id)}
        >
          {saved ? copy.removeFromSaved : copy.saveForLater}
        </button>
        <button
          type="button"
          disabled={readingActionsDisabled}
          onClick={() => onReadToggle(article.id, isRead)}
        >
          {isRead ? copy.markUnread : copy.markRead}
        </button>
        {progress === undefined ? (
          <button
            type="button"
            disabled={readingActionsDisabled}
            onClick={() => onSaveProgress(article.id)}
          >
            {copy.saveProgress}
          </button>
        ) : (
          <button
            type="button"
            disabled={readingActionsDisabled}
            onClick={() => onResetProgress(article.id)}
          >
            {formatUiCopy(copy.progressAt, { percent: Math.round(progress * 100) })}
          </button>
        )}
      </section>
      <section className="reader-source" aria-labelledby="website-original-source-title">
        <h2 id="website-original-source-title">{copy.originalSource}</h2>
        <p>{copy.originalSourceDetail}</p>
        <button type="button" onClick={(event) => onConfirmSource(article, event.currentTarget)}>
          {copy.openOriginalSource}
        </button>
      </section>
    </article>
  );
}

type ReadingClearKind = 'saved' | 'read' | 'all';
type SavedFeedArticle = NonNullable<FeedReadyState>['articles'][number];

function WebsiteSavedView({
  state,
  articles,
  unavailableArticleIds,
  onRead,
  onSaveToggle,
  onReadToggle,
  onResetProgress,
  onRequestClear,
  message,
  readingActionsDisabled,
  headingRef,
}: {
  state: LocalReadingStateV1;
  articles: readonly SavedFeedArticle[];
  unavailableArticleIds: readonly string[];
  onRead: (articleId: string, trigger: HTMLButtonElement) => void;
  onSaveToggle: (articleId: string) => void;
  onReadToggle: (articleId: string, isRead: boolean) => void;
  onResetProgress: (articleId: string) => void;
  onRequestClear: (kind: ReadingClearKind, trigger: HTMLButtonElement) => void;
  message: string | null;
  readingActionsDisabled: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const copy = useUiCopy();
  const articlesById = new Map(articles.map((article) => [article.id, article]));
  const unavailable = new Set(unavailableArticleIds);
  const renderEntry = (entry: LocalReadingStateV1['entries'][number], group: string) => {
    const article = unavailable.has(entry.articleId)
      ? undefined
      : articlesById.get(entry.articleId);
    return (
      <article
        className="saved-entry"
        key={`${group}-${entry.articleId}`}
        data-reading-id={entry.articleId}
      >
        {article === undefined ? (
          <>
            <h3>{copy.locallyUnavailable}</h3>
            <p>{copy.unavailableReadingEntryDetail}</p>
          </>
        ) : (
          <>
            <p className="article-source">{article.sourceName}</p>
            <h3>{article.title}</h3>
            <p className="article-teaser">{article.teaser}</p>
            <button
              type="button"
              className="reader-entry"
              data-reader-trigger={`saved-${entry.articleId}`}
              onClick={(event) => onRead(entry.articleId, event.currentTarget)}
            >
              {copy.readArticle}
            </button>
          </>
        )}
        <div className="reading-actions" aria-label={copy.localReadingData}>
          {entry.savedAt !== undefined ? (
            <button
              type="button"
              disabled={readingActionsDisabled}
              onClick={() => onSaveToggle(entry.articleId)}
            >
              {copy.removeFromSaved}
            </button>
          ) : (
            <button
              type="button"
              disabled={readingActionsDisabled}
              onClick={() => onSaveToggle(entry.articleId)}
            >
              {copy.saveForLater}
            </button>
          )}
          <button
            type="button"
            disabled={readingActionsDisabled}
            onClick={() => onReadToggle(entry.articleId, entry.readAt !== undefined)}
          >
            {entry.readAt === undefined ? copy.markRead : copy.markUnread}
          </button>
          {entry.progress !== undefined ? (
            <button
              type="button"
              disabled={readingActionsDisabled}
              onClick={() => onResetProgress(entry.articleId)}
            >
              {formatUiCopy(copy.progressAt, {
                percent: Math.round(entry.progress.fraction * 100),
              })}
            </button>
          ) : null}
        </div>
      </article>
    );
  };
  const later = state.entries.filter((entry) => entry.savedAt !== undefined);
  const read = state.entries.filter((entry) => entry.readAt !== undefined);
  return (
    <section className="saved-view" aria-labelledby="website-page-title">
      <p className="hero-kicker">{copy.localReadingData}</p>
      <h1 id="website-page-title" ref={headingRef} tabIndex={-1}>
        {copy.saved}
      </h1>
      <p className="saved-intro">{copy.savedIntro}</p>
      {message !== null ? (
        <p className="saved-message" role="status">
          {message}
        </p>
      ) : null}
      <section className="saved-group" aria-labelledby="website-later-title">
        <div className="saved-group-heading">
          <h2 id="website-later-title">{copy.readLater}</h2>
          <p>{later.length}</p>
        </div>
        {later.length === 0 ? (
          <p className="saved-empty">{copy.savedEmpty}</p>
        ) : (
          later.map((entry) => renderEntry(entry, 'later'))
        )}
        {later.length > 0 ? (
          <button
            type="button"
            disabled={readingActionsDisabled}
            onClick={(event) => onRequestClear('saved', event.currentTarget)}
          >
            {copy.clearSaved}
          </button>
        ) : null}
      </section>
      <section className="saved-group" aria-labelledby="website-read-title">
        <div className="saved-group-heading">
          <h2 id="website-read-title">{copy.read}</h2>
          <p>{read.length}</p>
        </div>
        {read.length === 0 ? (
          <p className="saved-empty">{copy.readEmpty}</p>
        ) : (
          read.map((entry) => renderEntry(entry, 'read'))
        )}
        {read.length > 0 ? (
          <button
            type="button"
            disabled={readingActionsDisabled}
            onClick={(event) => onRequestClear('read', event.currentTarget)}
          >
            {copy.clearRead}
          </button>
        ) : null}
      </section>
      {state.entries.length > 0 || readingActionsDisabled ? (
        <button
          type="button"
          className="reading-danger"
          disabled={readingActionsDisabled}
          onClick={(event) => onRequestClear('all', event.currentTarget)}
        >
          {copy.clearAllReadingData}
        </button>
      ) : null}
    </section>
  );
}

function ReadingClearConfirmation({
  kind,
  onConfirm,
  onClose,
}: {
  kind: ReadingClearKind;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const copy = useUiCopy();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => cancelRef.current?.focus(), []);
  const label =
    kind === 'saved'
      ? copy.clearSavedLabel
      : kind === 'read'
        ? copy.clearReadLabel
        : copy.clearAllLabel;
  return (
    <div className="source-dialog-backdrop" role="presentation">
      <section
        className="source-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reading-clear-title"
      >
        <h2 id="reading-clear-title">{formatUiCopy(copy.clearReadingDataQuestion, { label })}</h2>
        <p>{copy.clearReadingDataDetail}</p>
        <div className="source-dialog-actions">
          <button type="button" ref={cancelRef} onClick={onClose}>
            {copy.cancel}
          </button>
          <button type="button" onClick={onConfirm}>
            {copy.deleteNow}
          </button>
        </div>
      </section>
    </div>
  );
}

function ExternalSourceConfirmation({
  article,
  onClose,
}: {
  article: Extract<ReaderState, { kind: 'ready' }>['article'];
  onClose: () => void;
}) {
  const copy = useUiCopy();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLAnchorElement>(null);
  const host = new URL(article.originalUrl).host;
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);
  const trapFocus = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return;
    const first = cancelRef.current;
    const last = confirmRef.current;
    if (first === null || last === null) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (document.activeElement !== first && document.activeElement !== last) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  };
  return (
    <div className="source-dialog-backdrop" role="presentation">
      <section
        className="source-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="website-source-dialog-title"
        onKeyDown={trapFocus}
      >
        <h2 id="website-source-dialog-title">{copy.externalSourceDialogTitle}</h2>
        <p>{formatUiCopy(copy.sourceLabel, { source: article.source.name })}</p>
        <p>{formatUiCopy(copy.targetHostLabel, { host })}</p>
        <p>{copy.externalSourceWarning}</p>
        <div className="source-dialog-actions">
          <button type="button" ref={cancelRef} onClick={onClose}>
            {copy.cancel}
          </button>
          <a
            href={article.originalUrl}
            ref={confirmRef}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            {copy.openExternalSourceNow}
          </a>
        </div>
      </section>
    </div>
  );
}

function archiveUnavailableHeading(
  resolution: Extract<ArchiveLifecycleResolution, { message: string }>,
  copy: UiCopy,
) {
  switch (resolution.kind) {
    case 'gone':
      return copy.messageNoLongerAvailable;
    case 'revoked':
      return copy.messageUnavailable;
    case 'unknown':
      return copy.articleNotFoundArchive;
    case 'invalid':
      return copy.articleAddressInvalid;
  }
}

function WebsiteArchiveView({
  fixture,
  requestedId,
  onRead,
  onClose,
  shareAdapter,
}: {
  fixture: LocalArchiveLifecycleFixture | null;
  requestedId: string | null;
  onRead: (articleId: string, trigger: HTMLButtonElement) => void;
  onClose: () => void;
  shareAdapter: ShareAdapter;
}) {
  const copy = useUiCopy();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const hasContent = fixture !== null;
  useEffect(() => {
    headingRef.current?.focus();
  }, [requestedId, hasContent]);
  if (fixture === null) {
    return (
      <section className="archive-status" aria-labelledby="website-archive-title">
        <p className="hero-kicker">{copy.localArchive}</p>
        <h1 id="website-archive-title" ref={headingRef} tabIndex={-1}>
          {copy.archivePreparing}
        </h1>
        <p role="status">{copy.archiveValidating}</p>
      </section>
    );
  }
  if (requestedId === null) {
    const projection: ArchiveProjection = createLocalArchiveProjection({
      lifecycle: fixture.lifecycle,
      lifecycleValidation: fixture.validation,
      articles: fixture.articles,
    });
    if (projection.kind === 'error') {
      return (
        <section className="archive-status" aria-labelledby="website-archive-title">
          <p className="hero-kicker">{copy.localArchive}</p>
          <h1 id="website-archive-title" ref={headingRef} tabIndex={-1}>
            {copy.archiveUnavailable}
          </h1>
          <p role="alert">{projection.message}</p>
          <button type="button" className="reader-back" onClick={onClose}>
            {copy.backToMore}
          </button>
        </section>
      );
    }
    return (
      <section className="website-archive archive-view" aria-labelledby="website-archive-title">
        <p className="hero-kicker">{copy.localArchive}</p>
        <h1 id="website-archive-title" ref={headingRef} tabIndex={-1}>
          {copy.newsArchive}
        </h1>
        <p className="discover-intro">{copy.archiveIntro}</p>
        <div className="archive-list" aria-label={copy.localArchiveArticles}>
          {projection.articles.map((article) => (
            <article className="archive-card" key={article.id} data-archive-id={article.id}>
              <p className="archive-lifecycle">
                {article.lifecycle === 'historical' ? copy.historical : copy.current}
              </p>
              <h2>{article.title}</h2>
              <p>{article.teaser}</p>
              <dl className="reader-meta">
                <div>
                  <dt>{copy.source}</dt>
                  <dd>{article.sourceName}</dd>
                </div>
                <div>
                  <dt>{copy.date}</dt>
                  <dd>{formatUtcDate(article.publishedAt)}</dd>
                </div>
                <div>
                  <dt>{copy.originalLanguage}</dt>
                  <dd>{displayOriginalLanguage(article.originalLanguage)}</dd>
                </div>
              </dl>
              <button
                type="button"
                className="reader-entry"
                data-archive-trigger={article.id}
                onClick={(event) => onRead(article.id, event.currentTarget)}
              >
                {copy.readArticle}
              </button>
            </article>
          ))}
        </div>
      </section>
    );
  }
  const resolution = resolveLocalArchiveLifecycle({
    requestedArticleId: requestedId,
    lifecycle: fixture.lifecycle,
    lifecycleValidation: fixture.validation,
  });
  if (resolution.kind === 'redirected') {
    return (
      <section className="archive-status" aria-labelledby="website-archive-title">
        <p className="hero-kicker">{copy.localArchive}</p>
        <h1 id="website-archive-title" ref={headingRef} tabIndex={-1}>
          {copy.normalizingArticleAddress}
        </h1>
        <p role="status">{copy.preparingCanonicalArticle}</p>
      </section>
    );
  }
  if ('message' in resolution) {
    return (
      <section className="archive-status" aria-labelledby="website-archive-title">
        <p className="hero-kicker">{copy.localArchive}</p>
        <h1 id="website-archive-title" ref={headingRef} tabIndex={-1}>
          {archiveUnavailableHeading(resolution, copy)}
        </h1>
        <p role={resolution.kind === 'invalid' ? 'alert' : 'status'}>
          {copy.archiveUnavailableDetail}
        </p>
        <button type="button" className="reader-back" onClick={onClose}>
          {copy.backToMore}
        </button>
      </section>
    );
  }
  const article = fixture.articles.find((candidate) => candidate.id === resolution.canonicalId);
  const detail = fixture.details.entries.find(
    (candidate) => candidate.articleId === resolution.canonicalId,
  );
  const shareUrl = createCanonicalArticleShareUrl(fixture.lifecycle, resolution);
  if (article === undefined || detail === undefined) {
    return (
      <section className="archive-status" aria-labelledby="website-archive-title">
        <h1 id="website-archive-title" ref={headingRef} tabIndex={-1}>
          {copy.archiveUnavailable}
        </h1>
        <p role="alert">{copy.archiveArticleValidationError}</p>
      </section>
    );
  }
  const share = () => {
    if (shareUrl !== null)
      void shareAdapter.share(shareUrl).then(
        () => setShareMessage(copy.canonicalShareReady),
        () => setShareMessage(copy.canonicalShareError),
      );
  };
  return (
    <article className="website-reader archive-reader" aria-labelledby="website-archive-title">
      <button type="button" className="reader-back" onClick={onClose}>
        {copy.backToArchive}
      </button>
      <p className="archive-lifecycle">
        {resolution.kind === 'canonical-archived'
          ? copy.historicalArticle
          : copy.currentArchiveArticle}
      </p>
      <p className="article-source">{article.source.name}</p>
      <h1 id="website-archive-title" ref={headingRef} tabIndex={-1}>
        {article.title}
      </h1>
      <dl className="reader-meta">
        <div>
          <dt>{copy.date}</dt>
          <dd>{formatUtcDate(article.publishedAt)}</dd>
        </div>
        <div>
          <dt>{copy.originalLanguage}</dt>
          <dd>{displayOriginalLanguage(article.originalLanguage)}</dd>
        </div>
      </dl>
      <div className="reader-content">
        {detail.blocks.map((block, index) =>
          block.kind === 'paragraph' ? (
            <p key={index}>{block.text}</p>
          ) : block.kind === 'heading' ? (
            <h2 key={index}>{block.text}</h2>
          ) : null,
        )}
      </div>
      {shareUrl !== null ? (
        <section className="archive-share" aria-label={copy.canonicalSharing}>
          <button type="button" className="reader-entry" onClick={share}>
            {copy.share}
          </button>
          {shareMessage !== null ? <p role="status">{shareMessage}</p> : null}
        </section>
      ) : null}
    </article>
  );
}

export function App({
  initialState,
  initialTheme,
  initialUiLanguage,
  loader,
  contentMode,
  shareAdapter = localShareAdapter,
}: {
  initialState?: FeedStateKind;
  initialTheme?: ThemePreference;
  initialUiLanguage?: UiLanguage;
  loader?: LocalFixtureLoader;
  contentMode?: 'production' | 'fixture-offline';
  shareAdapter?: ShareAdapter;
} = {}) {
  const query = new URLSearchParams(window.location.search);
  const [languageHandoff] = useState(() => {
    const initialQuery = new URLSearchParams(window.location.search);
    return Object.freeze({
      present: initialQuery.has(websiteUiLanguageHandoffParameter),
      language: readWebsiteUiLanguageHandoff(initialQuery),
    });
  });
  const [requestedState, setRequestedState] = useState<FeedStateKind>(
    initialState ?? readState(query.get('state')),
  );
  const fixtureMode = initialState !== undefined || loader !== undefined;
  const productionMode = !fixtureMode && contentMode !== 'fixture-offline';
  const [fixtureReadyState, setReadyState] = useState<FeedReadyState | null>(null);
  const [fixtureDiscoverArticles, setDiscoverArticles] = useState<
    Parameters<typeof filterDiscoverArticles>[0] | null
  >(null);
  const [fixtureDiscoverIndex, setDiscoverIndex] = useState<
    Parameters<typeof filterDiscoverArticles>[1] | null
  >(null);
  const [fixtureReaderFixture, setReaderFixture] = useState<ReaderFixture | null>(null);
  const [fixtureReaderArticles, setReaderArticles] = useState<ReaderArticles | null>(null);
  const [discoverCriteria, setDiscoverCriteria] = useState(emptyDiscoverCriteria);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    readThemePreference(query, initialTheme),
  );
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>(() =>
    initialUiLanguage !== undefined && isRegisteredUiLanguage(initialUiLanguage)
      ? initialUiLanguage
      : (languageHandoff.language ?? loadWebsiteUiLanguage()),
  );
  const [wideLanguageSelectorLayout, setWideLanguageSelectorLayout] = useState(
    needsWideLanguageSelectorLayout,
  );
  const copy = getUiCopy(uiLanguage);
  const [systemPrefersDark, setSystemPrefersDark] = useState(readSystemPrefersDark);
  const [target, setTarget] = useState<NavigationTargetId>(readNavigationTargetFromLocation);
  const [searchRequested, setSearchRequested] = useState(false);
  const [readerArticleId, setReaderArticleId] = useState<string | null>(
    readWebsiteArticleIdFromLocation,
  );
  const [archiveRoute, setArchiveRoute] = useState<string | null | undefined>(
    readWebsiteArchiveRoute,
  );
  const [fixtureArchive, setArchiveFixture] = useState<LocalArchiveLifecycleFixture | null>(null);
  const [sourceConfirmation, setSourceConfirmation] = useState<
    Extract<ReaderState, { kind: 'ready' }>['article'] | null
  >(null);
  const [sourceConfirmationSnapshotIdentity, setSourceConfirmationSnapshotIdentity] = useState<
    string | null
  >(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(target === 'more');
  const [loadedReadingState] = useState(() =>
    productionMode
      ? { kind: 'read-only' as const, state: createEmptyLocalReadingState() }
      : loadWebsiteReadingState(),
  );
  const [readingState, setReadingState] = useState<LocalReadingStateV1>(loadedReadingState.state);
  const [readingActionsDisabled, setReadingActionsDisabled] = useState(
    loadedReadingState.kind === 'read-only',
  );
  const [readingMessage, setReadingMessage] = useState<string | null>(() =>
    readingActionsDisabled ? copy.localStateProtected : null,
  );
  const [readingClearKind, setReadingClearKind] = useState<ReadingClearKind | null>(null);
  const {
    result: contentResult,
    operationResult: contentOperationResult,
    operation: contentOperation,
    invoke: contentAction,
  } = useContentOfflineController(!fixtureMode && !productionMode);
  const runtime = contentResult?.readAccess === 'allowed' ? contentResult.runtime : null;
  const activeSnapshotIdentity =
    runtime === null
      ? null
      : `${runtime.ready.descriptor.releaseRevision}:${runtime.ready.descriptor.expectedManifest.sha256}`;
  const projection = useMemo(() => {
    if (runtime == null) return null;
    const release = runtime.ready;
    const payload = release.payloads.articles;
    if (payload === undefined || !('articles' in payload)) return null;
    return {
      ready: createReadyFeedState(release.manifest, payload.articles),
      articles: payload.articles,
      index: release.discoverIndex,
      reader: { readerDetails: release.readerDetails },
      archive: {
        articles: payload.articles,
        details: release.readerDetails,
        lifecycle: release.archiveLifecycle,
        validation: runtime.archiveValidation,
      },
    };
  }, [runtime]);
  const readyState = fixtureMode ? fixtureReadyState : (projection?.ready ?? null);
  const discoverArticles = fixtureMode ? fixtureDiscoverArticles : (projection?.articles ?? null);
  const discoverIndex = fixtureMode ? fixtureDiscoverIndex : (projection?.index ?? null);
  const readerFixture = fixtureMode ? fixtureReaderFixture : (projection?.reader ?? null);
  const readerArticles = fixtureMode ? fixtureReaderArticles : (projection?.articles ?? null);
  const archiveFixture = fixtureMode ? fixtureArchive : (projection?.archive ?? null);
  const [contentConfirmation, setContentConfirmation] = useState<Extract<
    OfflineAction,
    'activate' | 'rollback' | 'clear'
  > | null>(null);
  const [routeGuardAllowed, setContentRouteAllowed] = useState(fixtureMode);
  const [navigationEpoch, setNavigationEpoch] = useState(0);
  const contentRouteAllowed =
    fixtureMode ||
    (routeGuardAllowed && contentOperation !== 'guard' && contentOperation !== 'resumeGuard');
  const readingStateRef = useRef(readingState);
  const readingClearTriggerRef = useRef<HTMLButtonElement | null>(null);
  const copyRef = useRef(copy);
  const hasMountedNavigation = useRef(false);
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);
  const pendingNavigationFocusRef = useRef<HTMLHeadingElement | null>(null);
  const readerTriggerIdRef = useRef<string | null>(null);
  const readerOriginRef = useRef<NavigationTargetId | null>(null);
  const archiveTriggerIdRef = useRef<string | null>(null);
  const sourceTriggerRef = useRef<HTMLButtonElement | null>(null);
  const contentTriggerRef = useRef<HTMLButtonElement | null>(null);
  const supportNavigationGuardRef = useRef<WebsiteSupportNavigationGuard | null>(null);
  const targetRef = useRef(target);
  const setSupportNavigationGuard = useCallback((guard: WebsiteSupportNavigationGuard | null) => {
    supportNavigationGuardRef.current = guard;
  }, []);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    copyRef.current = copy;
  }, [copy]);

  useLayoutEffect(() => {
    const update = () => setWideLanguageSelectorLayout(needsWideLanguageSelectorLayout());
    const styleObserver = new MutationObserver(update);
    styleObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    update();
    return () => {
      styleObserver.disconnect();
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    if (!fixtureMode) return;
    let active = true;
    const controller = new AbortController();
    const fixtureLoader = loader ?? loadWebsiteLocalContentRelease;
    void fixtureLoader(controller.signal)
      .then(async (runtime) => {
        if (!active) return;
        const release = runtime.ready;
        const articlePayload = release.payloads.articles;
        if (articlePayload === undefined || !('articles' in articlePayload)) {
          setRequestedState('error');
          return;
        }
        const ready = createReadyFeedState(release.manifest, articlePayload.articles);
        if (!active) return;
        setReadyState(ready);
        setDiscoverArticles(articlePayload.articles);
        setDiscoverIndex(release.discoverIndex);
        setReaderArticles(articlePayload.articles);
        setReaderFixture({ readerDetails: release.readerDetails });
        const archive = {
          articles: articlePayload.articles,
          details: release.readerDetails,
          lifecycle: release.archiveLifecycle,
          validation: runtime.archiveValidation,
        };
        setArchiveFixture(archive);
        const readingLifecycle = bindReadingLifecycle(archive, ready);
        const reconciled = reconcileLocalReadingState({
          state: readingStateRef.current,
          lifecycle: readingLifecycle.lifecycle,
          lifecycleValidation: readingLifecycle.lifecycleValidation,
        });
        if (
          !readingActionsDisabled &&
          reconciled.kind === 'ready' &&
          JSON.stringify(reconciled.state) !== JSON.stringify(readingStateRef.current)
        ) {
          void mutateWebsiteReadingState((current) => {
            const currentReconciled = reconcileLocalReadingState({
              state: current,
              lifecycle: readingLifecycle.lifecycle,
              lifecycleValidation: readingLifecycle.lifecycleValidation,
            });
            return currentReconciled.kind === 'ready' ? currentReconciled.state : current;
          }).then((result) => {
            if (!active) return;
            if (result.kind === 'read-only') {
              setReadingActionsDisabled(true);
              setReadingMessage(copyRef.current.localStateProtected);
              return;
            }
            if (result.kind === 'failed') {
              setReadingMessage(copyRef.current.localStateNotSaved);
              return;
            }
            readingStateRef.current = result.state;
            setReadingState(result.state);
          });
        }
      })
      .catch(() => {
        if (active) setRequestedState('error');
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [fixtureMode, loader, readingActionsDisabled]);
  const effectiveTheme = resolveEffectiveTheme(themePreference, systemPrefersDark);
  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.dataset.themePreference = themePreference;
    return () => {
      delete document.documentElement.dataset.theme;
      delete document.documentElement.dataset.themePreference;
    };
  }, [effectiveTheme, themePreference]);
  useEffect(() => {
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = uiLanguageDirections[uiLanguage];
  }, [uiLanguage]);
  useEffect(() => {
    if (!languageHandoff.present) return;
    const url = new URL(window.location.href);
    clearWebsiteUiLanguageHandoff(url.searchParams);
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [languageHandoff]);
  useEffect(() => {
    if (themePreference !== 'system') return;
    const mediaQuery = getSystemMediaQuery();
    if (mediaQuery === null) return;
    const update = () => setSystemPrefersDark(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, [themePreference]);
  useEffect(() => {
    const syncNavigation = () => {
      // Different history entries may resolve to the same article ID.
      setNavigationEpoch((epoch) => epoch + 1);
      const nextTarget = readNavigationTargetFromLocation();
      const currentTarget = targetRef.current;
      const guard = supportNavigationGuardRef.current;
      if (nextTarget !== currentTarget && guard !== null) {
        const pendingUrl = new URL(window.location.href);
        window.history.replaceState(
          { wrnNavigationTarget: currentTarget },
          '',
          `#${currentTarget}`,
        );
        guard(() => {
          window.history.pushState(
            { wrnNavigationTarget: nextTarget },
            '',
            `${pendingUrl.pathname}${pendingUrl.search}${pendingUrl.hash}`,
          );
          targetRef.current = nextTarget;
          setTarget(nextTarget);
          setMoreMenuOpen(nextTarget === 'more');
        });
        return;
      }
      const requestedArticleId = readWebsiteArticleIdFromLocation();
      const readerHistory =
        requestedArticleId === null ? null : readReaderHistory(requestedArticleId);
      if (readerHistory !== null) {
        readerOriginRef.current = readerHistory.origin;
        readerTriggerIdRef.current = readerHistory.triggerId;
      }
      setTarget(nextTarget);
      targetRef.current = nextTarget;
      setMoreMenuOpen(nextTarget === 'more');
      setReaderArticleId(requestedArticleId);
      setArchiveRoute(readWebsiteArchiveRoute());
      if (!fixtureMode) setContentRouteAllowed(false);
      setSourceConfirmation(null);
    };
    window.addEventListener('popstate', syncNavigation);
    window.addEventListener('hashchange', syncNavigation);
    return () => {
      window.removeEventListener('popstate', syncNavigation);
      window.removeEventListener('hashchange', syncNavigation);
    };
  }, [fixtureMode]);
  useEffect(() => {
    if (readerArticleId === null && readerTriggerIdRef.current !== null) {
      document
        .querySelector<HTMLButtonElement>(`[data-reader-trigger="${readerTriggerIdRef.current}"]`)
        ?.focus();
      readerTriggerIdRef.current = null;
      readerOriginRef.current = null;
    } else if (hasMountedNavigation.current && readerArticleId === null)
      pageHeadingRef.current?.focus();
    hasMountedNavigation.current = true;
    pendingNavigationFocusRef.current = target === 'discover' ? pageHeadingRef.current : null;
  }, [target, readerArticleId]);
  const discoverHasContent =
    discoverArticles !== null &&
    discoverIndex !== null &&
    (requestedState === 'ready' || requestedState === 'offline');
  useEffect(() => {
    if (target !== 'discover' || !discoverHasContent) return;
    const pending = pendingNavigationFocusRef.current;
    // Finish only a replaced loading heading; never steal a newer user focus.
    if (pending !== null && !pending.isConnected && document.activeElement === document.body)
      pageHeadingRef.current?.focus();
    pendingNavigationFocusRef.current = null;
  }, [discoverHasContent, target]);
  useEffect(() => {
    if (archiveFixture === null || typeof archiveRoute !== 'string') return;
    const resolution = resolveLocalArchiveLifecycle({
      requestedArticleId: archiveRoute,
      lifecycle: archiveFixture.lifecycle,
      lifecycleValidation: archiveFixture.validation,
    });
    if (resolution.kind !== 'redirected') return;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete('article');
    nextUrl.searchParams.set('archive', resolution.canonicalId);
    window.history.replaceState(
      { ...window.history.state, wrnArchiveCanonicalId: resolution.canonicalId },
      '',
      `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash || '#more'}`,
    );
  }, [archiveFixture, archiveRoute]);
  useEffect(() => {
    if (sourceConfirmation === null && sourceTriggerRef.current !== null) {
      // A guard can remount the reader while the original trigger is detached.
      const trigger = sourceTriggerRef.current.isConnected
        ? sourceTriggerRef.current
        : (document.querySelector<HTMLElement>('.reader-source button') ??
          document.querySelector<HTMLElement>('main'));
      trigger?.focus();
      sourceTriggerRef.current = null;
    }
  }, [sourceConfirmation]);
  useLayoutEffect(() => {
    if (
      fixtureMode ||
      sourceConfirmation === null ||
      sourceConfirmationSnapshotIdentity === activeSnapshotIdentity
    )
      return;
    setSourceConfirmation(null);
  }, [activeSnapshotIdentity, fixtureMode, sourceConfirmation, sourceConfirmationSnapshotIdentity]);
  useEffect(() => {
    if (contentResult?.active?.expiresAt === undefined || contentAction === null) return;
    const timeout = window.setTimeout(
      () => contentAction('resumeGuard'),
      Math.max(0, contentResult.active.expiresAt - Date.now()),
    );
    const resume = () => void contentAction('resumeGuard');
    const visibility = () => {
      if (document.visibilityState === 'visible') resume();
    };
    window.addEventListener('focus', resume);
    window.addEventListener('pageshow', resume);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pageshow', resume);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [contentAction, contentResult?.active?.expiresAt]);
  useEffect(() => {
    if (fixtureMode) {
      setContentRouteAllowed(true);
      return;
    }
    if (readerArticleId === null && archiveRoute === undefined) {
      setContentRouteAllowed(true);
      return;
    }
    if (contentAction === null) return;
    let active = true;
    setContentRouteAllowed(false);
    void contentAction('guard').then((access) => {
      if (active && access?.readAccess === 'allowed' && access.runtime !== null)
        setContentRouteAllowed(true);
    });
    return () => {
      active = false;
    };
  }, [archiveRoute, contentAction, fixtureMode, navigationEpoch, readerArticleId]);
  useEffect(() => {
    if (fixtureMode || contentResult === null || runtime !== null) return;
    setSourceConfirmation(null);
    setReaderArticleId(null);
    setArchiveRoute(undefined);
    setContentRouteAllowed(false);
  }, [contentResult, fixtureMode, runtime]);
  const navigate = (nextTarget: NavigationTargetId, trigger?: HTMLElement | null) => {
    if (
      nextTarget === target &&
      (!productionMode || (readerArticleId === null && archiveRoute === undefined))
    )
      return;
    const continueNavigation = () => {
      const url = new URL(window.location.href);
      if (productionMode) {
        url.searchParams.delete('article');
        url.searchParams.delete('archive');
        readerTriggerIdRef.current = null;
        readerOriginRef.current = null;
        archiveTriggerIdRef.current = null;
        setReaderArticleId(null);
        setArchiveRoute(undefined);
        setSourceConfirmation(null);
      }
      window.history.pushState(
        { wrnNavigationTarget: nextTarget, wrnMoreReturn: nextTarget === 'more' },
        '',
        productionMode ? `${url.pathname}${url.search}#${nextTarget}` : `#${nextTarget}`,
      );
      targetRef.current = nextTarget;
      setTarget(nextTarget);
      setMoreMenuOpen(nextTarget === 'more');
    };
    if (supportNavigationGuardRef.current?.(continueNavigation, trigger) === false) return;
    continueNavigation();
  };
  const menuIsOpen = target === 'more' && readerArticleId === null && archiveRoute === undefined;
  const toggleMoreMenu = () => {
    if (!menuIsOpen) {
      navigate('more');
    } else if (window.history.state?.wrnMoreReturn === true) {
      window.history.back();
    } else {
      navigate('home');
    }
  };
  useEffect(() => {
    if (!searchRequested || target !== 'discover') return;
    const frame = window.requestAnimationFrame(() => {
      (
        document.getElementById('website-discover-search') ??
        document.querySelector<HTMLInputElement>('input[type="search"]')
      )?.focus();
      setSearchRequested(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [searchRequested, target]);
  const openReader = (articleId: string, trigger: HTMLButtonElement) => {
    setContentRouteAllowed(fixtureMode);
    readerOriginRef.current = target;
    readerTriggerIdRef.current = trigger.dataset.readerTrigger ?? articleId;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('article', articleId);
    window.history.pushState(
      {
        wrnReaderArticleId: articleId,
        wrnReaderOriginTarget: target,
        wrnReaderTriggerId: readerTriggerIdRef.current,
      },
      '',
      `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
    );
    setReaderArticleId(articleId);
  };
  const openArchive = (trigger: HTMLButtonElement) => {
    setContentRouteAllowed(fixtureMode);
    archiveTriggerIdRef.current = trigger.dataset.archiveEntryTrigger ?? 'website-more-archive';
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete('article');
    nextUrl.searchParams.set('archive', '');
    nextUrl.hash = '#more';
    window.history.pushState(
      { wrnArchiveOriginTarget: target, wrnArchiveTriggerId: archiveTriggerIdRef.current },
      '',
      `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
    );
    setTarget('more');
    setMoreMenuOpen(true);
    setArchiveRoute(null);
  };
  const openArchiveReader = (articleId: string, trigger: HTMLButtonElement) => {
    setContentRouteAllowed(fixtureMode);
    archiveTriggerIdRef.current = trigger.dataset.archiveTrigger ?? articleId;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete('article');
    nextUrl.searchParams.set('archive', articleId);
    nextUrl.hash = '#more';
    window.history.pushState(
      { wrnArchiveArticleId: articleId, wrnArchiveTriggerId: archiveTriggerIdRef.current },
      '',
      `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
    );
    setTarget('more');
    setMoreMenuOpen(true);
    setArchiveRoute(articleId);
  };
  const closeArchive = () => {
    if (
      window.history.state?.wrnArchiveOriginTarget !== undefined ||
      window.history.state?.wrnArchiveArticleId !== undefined
    ) {
      window.history.back();
      return;
    }
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete('archive');
    nextUrl.hash = '#more';
    window.history.replaceState(
      { wrnNavigationTarget: 'more' },
      '',
      `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
    );
    setTarget('more');
    setMoreMenuOpen(true);
    setArchiveRoute(undefined);
  };
  const closeReader = () => {
    setSourceConfirmation(null);
    if (readerOriginRef.current !== null) {
      window.history.back();
      return;
    }
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete('article');
    nextUrl.hash = '#home';
    window.history.replaceState(
      { wrnNavigationTarget: 'home' },
      '',
      `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
    );
    setTarget('home');
    setReaderArticleId(null);
  };
  const openSourceConfirmation = async (
    article: Extract<ReaderState, { kind: 'ready' }>['article'],
    trigger: HTMLButtonElement,
  ) => {
    const origin = window.location.href;
    if (!fixtureMode) {
      const access = await contentAction?.('guard');
      if (
        access === null ||
        access === undefined ||
        access.readAccess !== 'allowed' ||
        access.runtime === null ||
        window.location.href !== origin
      )
        return;
      const release = access.runtime.ready;
      const payload = release.payloads.articles;
      if (payload === undefined || !('articles' in payload)) return;
      const fresh = resolveLocalReaderState({
        requestedArticleId: article.id,
        articles: payload.articles,
        details: release.readerDetails,
        detailsValidation: {
          ok: true,
          errors: [],
          articleIds: payload.articles.map((item) => item.id),
        },
        offline: false,
      });
      if (fresh.kind !== 'ready') return;
      article = fresh.article;
      setSourceConfirmationSnapshotIdentity(
        `${release.descriptor.releaseRevision}:${release.descriptor.expectedManifest.sha256}`,
      );
    } else {
      setSourceConfirmationSnapshotIdentity(null);
    }
    sourceTriggerRef.current = trigger;
    setSourceConfirmation(article);
  };
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (readingClearKind !== null) {
        event.preventDefault();
        closeReadingClear();
      } else if (contentConfirmation !== null) {
        event.preventDefault();
        setContentConfirmation(null);
        contentTriggerRef.current?.focus();
        contentTriggerRef.current = null;
      } else if (sourceConfirmation !== null) {
        event.preventDefault();
        setSourceConfirmation(null);
      } else if (archiveRoute !== undefined) {
        event.preventDefault();
        closeArchive();
      } else if (readerArticleId !== null) {
        event.preventDefault();
        closeReader();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  });
  const displayedState: FeedStateKind =
    !fixtureMode &&
    contentResult !== null &&
    !(contentResult.readAccess === 'allowed' && contentResult.runtime !== null)
      ? 'error'
      : requestedState === 'ready' && (readyState === null || discoverIndex === null)
        ? 'loading'
        : requestedState;
  const isReady = displayedState === 'ready' && readyState !== null;
  const navigationLabel = (id: NavigationTargetId) => {
    const safeId = parseNavigationTargetId(id);
    if (safeId === null) return copy.home;
    return {
      home: copy.home,
      following: copy.following,
      discover: copy.discover,
      media: copy.media,
      events: copy.events,
      knowledge: copy.knowledge,
      solidarity: copy.solidarity,
      saved: copy.saved,
      more: copy.more,
      help: copy.help,
    }[safeId];
  };
  const readerState: ReaderState =
    readerArticleId === null || (!fixtureMode && !contentRouteAllowed)
      ? createReaderLoadingState()
      : readerFixture === null || readerArticles === null
        ? createReaderLoadingState()
        : resolveLocalReaderState({
            requestedArticleId: readerArticleId,
            articles: readerArticles,
            details: readerFixture.readerDetails,
            detailsValidation: {
              ok: true,
              errors: [],
              articleIds: readerArticles.map((article) => article.id),
            },
            offline: displayedState === 'offline',
          });
  const displayedArchiveRoute =
    archiveFixture !== null && contentRouteAllowed && typeof archiveRoute === 'string'
      ? (() => {
          const resolution = resolveLocalArchiveLifecycle({
            requestedArticleId: archiveRoute,
            lifecycle: archiveFixture.lifecycle,
            lifecycleValidation: archiveFixture.validation,
          });
          return resolution.kind === 'redirected' ? resolution.canonicalId : archiveRoute;
        })()
      : archiveRoute;
  const routeLink = (id: NavigationTargetId, label = navigationLabel(id)) => (
    <a
      href={`#${id}`}
      aria-current={target === id ? 'page' : undefined}
      onClick={(event) => {
        event.preventDefault();
        navigate(id, event.currentTarget);
      }}
    >
      {label}
    </a>
  );
  const navigateDirectory = (section: 'news' | 'sources' | 'sport') => {
    window.history.pushState({ wrnNavigationTarget: 'discover' }, '', `#discover/${section}`);
    targetRef.current = 'discover';
    setTarget('discover');
    setNavigationEpoch((epoch) => epoch + 1);
  };
  const navigationLinks = (ids: readonly NavigationTargetId[]) =>
    ids.filter((id) => id !== 'more').map((id) => <span key={id}>{routeLink(id)}</span>);
  const selectTheme = (value: string) => {
    const nextPreference = normalizeThemePreference(value);
    setThemePreference(nextPreference);
    try {
      window.localStorage.setItem(themeStorageKey, nextPreference);
    } catch {
      // A blocked local store must not prevent the local preview from rendering.
    }
  };
  const selectUiLanguage = (value: string) => {
    if (!isUiLanguage(value) || !isRegisteredUiLanguage(value)) return;
    setUiLanguage(value);
    // Persistence failure is intentionally not surfaced as a false success;
    // the selected language still remains active for this session.
    persistWebsiteUiLanguage(value);
  };
  const commitReadingState = (
    mutate: (current: LocalReadingStateV1) => LocalReadingStateV1,
    success: string,
  ) => {
    if (readingActionsDisabled) {
      setReadingMessage(copy.localStateProtected);
      return;
    }
    void mutateWebsiteReadingState(mutate).then((result) => {
      if (result.kind === 'read-only') {
        setReadingActionsDisabled(true);
        setReadingMessage(copy.localStateProtected);
        return;
      }
      if (result.kind === 'failed') {
        setReadingMessage(copy.localStateNotSaved);
        return;
      }
      readingStateRef.current = result.state;
      setReadingState(result.state);
      if (result.kind === 'committed') setReadingMessage(success);
    });
  };
  const toggleSaved = (articleId: string) => {
    const saved =
      readingState.entries.find((entry) => entry.articleId === articleId)?.savedAt !== undefined;
    const changedAt = new Date().toISOString();
    commitReadingState(
      (current) =>
        saved
          ? removeLocalReadingArticle(current, articleId)
          : saveLocalReadingArticle(current, articleId, changedAt),
      saved ? copy.savedRemoved : copy.savedAdded,
    );
  };
  const toggleRead = (articleId: string, isRead: boolean) =>
    commitReadingState(
      (current) =>
        isRead
          ? markLocalArticleUnread(current, articleId)
          : markLocalArticleRead(current, articleId, new Date().toISOString()),
      isRead ? copy.unreadMarked : copy.readMarked,
    );
  const saveProgress = (articleId: string) =>
    commitReadingState(
      (current) => updateLocalReadingProgress(current, articleId, 0.5, new Date().toISOString()),
      copy.progressSaved,
    );
  const resetProgress = (articleId: string) =>
    commitReadingState(
      (current) => resetLocalReadingProgress(current, articleId),
      copy.progressReset,
    );
  const requestClear = (kind: ReadingClearKind, trigger: HTMLButtonElement) => {
    if (readingActionsDisabled) {
      setReadingMessage(copy.localStateProtected);
      return;
    }
    readingClearTriggerRef.current = trigger;
    setReadingClearKind(kind);
  };
  function closeReadingClear() {
    setReadingClearKind(null);
    readingClearTriggerRef.current?.focus();
    readingClearTriggerRef.current = null;
  }
  const confirmClear = () => {
    const clearKind = readingClearKind;
    commitReadingState(
      (current) =>
        clearKind === 'saved'
          ? clearLocalSavedArticles(current)
          : clearKind === 'read'
            ? clearLocalReadMarkers(current)
            : clearAllLocalReadingData(current),
      copy.localStateDeleted,
    );
    setReadingClearKind(null);
  };
  const requestContentAction = (action: OfflineAction, trigger: HTMLButtonElement) => {
    if (contentAction === null) return;
    if (action === 'activate' || action === 'rollback' || action === 'clear') {
      contentTriggerRef.current = trigger;
      setContentConfirmation(action);
      return;
    }
    void contentAction(action);
  };
  const confirmContentAction = () => {
    if (contentConfirmation !== null) void contentAction?.(contentConfirmation);
    setContentConfirmation(null);
  };
  const readingLifecycle =
    archiveFixture === null ||
    (!fixtureMode && (contentResult?.readAccess !== 'allowed' || contentResult.runtime === null))
      ? null
      : bindReadingLifecycle(archiveFixture, readyState);
  const reconciledReadingState =
    readingLifecycle === null
      ? null
      : reconcileLocalReadingState({
          state: readingState,
          lifecycle: readingLifecycle.lifecycle,
          lifecycleValidation: readingLifecycle.lifecycleValidation,
        });
  const visibleReadingState =
    reconciledReadingState?.kind === 'ready' ? reconciledReadingState.state : readingState;
  const unavailableReadingIds =
    reconciledReadingState?.kind === 'ready' ? reconciledReadingState.unavailableArticleIds : [];
  const readerReadingEntry =
    readerArticleId === null
      ? undefined
      : visibleReadingState.entries.find((entry) => entry.articleId === readerArticleId);

  return (
    <UiCopyContext.Provider value={copy}>
      <SourcePreferencesProvider
        storageKey="wrn.website.source-preferences.v1"
        language={uiLanguage}
        enabled={productionMode}
      >
        <div className="website-shell">
          <a className="skip-link" href="#website-main">
            {copy.skipToMain}
          </a>
          <header
            className="site-header"
            data-wide-language-layout={wideLanguageSelectorLayout ? 'true' : undefined}
          >
            <div className="site-header-inner">
              <div className="compact-site-masthead">
                <button
                  type="button"
                  className="compact-site-menu"
                  aria-label={menuIsOpen ? copy.back : copy.more}
                  data-testid="header-more-trigger"
                  aria-expanded={moreMenuOpen}
                  aria-controls="website-more-menu"
                  aria-current={target === 'more' ? 'page' : undefined}
                  onClick={toggleMoreMenu}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d={menuIsOpen ? 'm14 6-6 6 6 6M8 12h13' : 'M3 6h18M3 12h18M3 18h18'} />
                  </svg>
                </button>
                <div className="compact-site-brand">
                  <a
                    className="site-brand"
                    href="#home"
                    aria-label={formatUiCopy(copy.brandHomeName, {
                      brand: shellCopy.brandName,
                      product: shellCopy.productName,
                    })}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate('home');
                    }}
                  >
                    <span className="site-brand-name">
                      World <span>Revolution</span> News
                    </span>
                  </a>
                  <a
                    className="site-brand-project"
                    href={`https://solinaridao.com/?lang=${encodeURIComponent(uiLanguage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    aria-label={copy.moreAboutProject}
                  >
                    solinaridao.com â†—
                  </a>
                </div>
                <div className="compact-site-tools">
                  <button
                    type="button"
                    className="compact-site-search"
                    aria-label={copy.searchNews}
                    data-testid="header-search-trigger"
                    onClick={() => {
                      setSearchRequested(true);
                      navigate('discover');
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <circle cx="11" cy="11" r="6.5" />
                      <path d="m16 16 5 5" />
                    </svg>
                  </button>
                  <label className="language-selector">
                    <span>{copy.languageLabel}</span>
                    <select
                      value={uiLanguage}
                      onChange={(event) => selectUiLanguage(event.target.value)}
                      aria-label={formatUiCopy(copy.languageSelectionName, {
                        language: uiLanguageNativeNames[uiLanguage],
                      })}
                      data-testid="ui-language-selector"
                    >
                      {registeredUiLanguages.map((language) => (
                        <option key={language} value={language}>
                          {language.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <nav aria-label={copy.websiteMainNavigation} className="site-nav site-nav-compact">
                {navigationLinks(websiteCompactNavigationIds)}
                <button
                  type="button"
                  className="site-more-button"
                  aria-expanded={moreMenuOpen}
                  aria-controls="website-more-menu"
                  aria-current={target === 'more' ? 'page' : undefined}
                  onClick={() => {
                    setMoreMenuOpen((open) => !open);
                    if (target !== 'more') navigate('more');
                  }}
                >
                  {copy.more}
                </button>
              </nav>
              <nav
                aria-label={copy.websiteExpandedNavigation}
                className="site-nav site-nav-expanded"
              >
                {navigationLinks(websiteExpandedNavigationIds)}
                <button
                  type="button"
                  className="site-more-button"
                  aria-expanded={moreMenuOpen}
                  aria-controls="website-more-menu"
                  aria-current={target === 'more' ? 'page' : undefined}
                  onClick={() => {
                    setMoreMenuOpen((open) => !open);
                    if (target !== 'more') navigate('more');
                  }}
                >
                  {copy.more}
                </button>
              </nav>
              <div id="website-more-menu" className="site-more-menu" hidden={!moreMenuOpen}>
                <p>{copy.moreAreas}</p>
                <button
                  type="button"
                  className="reader-entry"
                  data-archive-entry-trigger="website-more-archive"
                  onClick={(event) => openArchive(event.currentTarget)}
                >
                  {copy.newsArchive}
                </button>
                {routeLink('knowledge')}
                {routeLink('events')}
                {routeLink('solidarity')}
                {routeLink('help')}
              </div>
            </div>
          </header>
          <main id="website-main" tabIndex={-1} aria-labelledby="website-page-title">
            {target === 'more' && archiveRoute === undefined && (
              <section className="more-theme-settings">
                <label className="theme-selector">
                  <span id="website-theme-label">{copy.colorTheme}</span>
                  <span className="wrn-theme-control">
                    <select
                      aria-labelledby="website-theme-label"
                      value={themePreference}
                      onChange={(event) => selectTheme(event.target.value)}
                      data-testid="theme-selector"
                    >
                      {themePreferenceIds.map((preference) => (
                        <option key={preference} value={preference}>
                          {uiThemeLabels(copy)[preference]}
                        </option>
                      ))}
                    </select>
                    <span
                      className="wrn-theme-control-value"
                      data-testid="theme-current-value"
                      aria-hidden="true"
                    >
                      {uiThemeLabels(copy)[themePreference]}
                    </span>
                  </span>
                </label>
              </section>
            )}
            {productionMode &&
            (archiveRoute !== undefined ||
              readerArticleId !== null ||
              target === 'home' ||
              target === 'saved' ||
              target === 'more' ||
              (target === 'discover' && readWebsiteDirectorySection() === null)) ? (
              <WebsiteProductionContentArea
                target={target}
                articleId={readerArticleId}
                archiveRoute={archiveRoute}
                language={uiLanguage}
                headingRef={pageHeadingRef}
                onRead={openReader}
                onArchiveRead={openArchiveReader}
                onCloseReader={closeReader}
                onCloseArchive={closeArchive}
                onOpenArchive={openArchive}
                shareAdapter={shareAdapter}
                homeDirectory={
                  target === 'home'
                    ? {
                        load: loadWebsiteContentDirectory,
                        onBrowse: () => navigateDirectory('news'),
                        onBrowseSport: () => navigateDirectory('sport'),
                      }
                    : undefined
                }
                regionalEvents={<CurrentRegionalEvents client="website" language={uiLanguage} />}
                onCanonical={(id, archive) => {
                  const url = new URL(window.location.href);
                  url.searchParams.set(archive ? 'archive' : 'article', id);
                  url.searchParams.delete(archive ? 'article' : 'archive');
                  window.history.replaceState(
                    { ...window.history.state, wrnCanonicalArticleId: id },
                    '',
                    `${url.pathname}${url.search}${url.hash}`,
                  );
                  if (archive) setArchiveRoute(id);
                  else setReaderArticleId(id);
                }}
              >
                {readerArticleId === null &&
                  archiveRoute === undefined &&
                  (target === 'home' || target === 'discover' || target === 'more') && (
                    <nav className="secondary-navigation" aria-label={copy.discover}>
                      {(['news', 'sources', 'sport'] as const).map((section) => (
                        <a
                          href={`#discover/${section}`}
                          key={section}
                          onClick={(event) => {
                            event.preventDefault();
                            navigateDirectory(section);
                          }}
                        >
                          {getDirectoryCopy(uiLanguage)[section]}
                        </a>
                      ))}
                    </nav>
                  )}
                {target === 'more' && archiveRoute === undefined && (
                  <>
                    <WebsiteShellPanel copy={copy} />
                    <nav className="secondary-navigation" aria-label={copy.moreAreas}>
                      {routeLink('help')}
                      {routeLink('solidarity')}
                      {routeLink('knowledge')}
                      {routeLink('events')}
                    </nav>
                  </>
                )}
              </WebsiteProductionContentArea>
            ) : productionMode && target === 'following' ? (
              <WebsitePersonalizationArea
                language={uiLanguage}
                headingRef={pageHeadingRef}
                results={(preferences) => (
                  <WebsiteProductionContentArea
                    target={target}
                    articleId={null}
                    archiveRoute={undefined}
                    language={uiLanguage}
                    headingRef={pageHeadingRef}
                    onRead={openReader}
                    onArchiveRead={openArchiveReader}
                    onCloseReader={closeReader}
                    onCloseArchive={closeArchive}
                    onOpenArchive={openArchive}
                    shareAdapter={shareAdapter}
                    preferences={preferences}
                    embedded
                  />
                )}
              />
            ) : archiveRoute !== undefined ? (
              <WebsiteArchiveView
                fixture={contentRouteAllowed ? archiveFixture : null}
                requestedId={displayedArchiveRoute ?? null}
                onRead={openArchiveReader}
                onClose={closeArchive}
                shareAdapter={shareAdapter}
              />
            ) : readerArticleId !== null ? (
              <WebsiteReader
                state={readerState}
                onClose={closeReader}
                onConfirmSource={openSourceConfirmation}
                saved={readerReadingEntry?.savedAt !== undefined}
                isRead={readerReadingEntry?.readAt !== undefined}
                progress={readerReadingEntry?.progress?.fraction}
                onSaveToggle={toggleSaved}
                onReadToggle={toggleRead}
                onSaveProgress={saveProgress}
                onResetProgress={resetProgress}
                readingActionsDisabled={readingActionsDisabled}
                readingProtectionMessage={readingActionsDisabled ? readingMessage : null}
              />
            ) : target === 'home' ? (
              <>
                <section className="website-hero" aria-labelledby="website-page-title">
                  <p className="hero-kicker">
                    {shellCopy.brandName} Â· {shellCopy.previewLabel}
                  </p>
                  <h1 id="website-page-title" ref={pageHeadingRef} tabIndex={-1}>
                    {copy.localPreviewHeadline}
                  </h1>
                  <p>{copy.localPreviewDetail}</p>
                </section>
                {isReady ? (
                  <section className="website-feed" aria-label={copy.localNews}>
                    <div className="feed-context">
                      <p>{copy.testEdition}</p>
                      <p data-testid="manifest-revision">
                        {formatUiCopy(copy.manifestRevision, {
                          revision: readyState.manifestRevision,
                        })}
                      </p>
                    </div>
                    <div className="article-grid">
                      {readyState.articles.map((article) => (
                        <article
                          className="website-feed-card"
                          key={article.id}
                          data-article-id={article.id}
                        >
                          <div
                            className="media-placeholder"
                            role="img"
                            aria-label={copy.unavailableMediaFixture}
                          >
                            <span>{copy.noImage}</span>
                          </div>
                          <div className="article-content">
                            <p className="article-source">{article.sourceName}</p>
                            <h2>{article.title}</h2>
                            <p className="article-teaser">{article.teaser}</p>
                            <dl className="article-meta">
                              <div>
                                <dt>{copy.date}</dt>
                                <dd>{formatUtcDate(article.publishedAt)}</dd>
                              </div>
                              <div>
                                <dt>{copy.language}</dt>
                                <dd>{article.originalLanguage}</dd>
                              </div>
                            </dl>
                            <ul className="tag-list" aria-label={copy.topics}>
                              {article.tags.map((tag) => (
                                <li key={tag}>{tag}</li>
                              ))}
                            </ul>
                            <p className="source-url">
                              {formatUiCopy(copy.originalUrl, { url: article.originalUrl })}
                            </p>
                            <button
                              type="button"
                              className="reader-entry"
                              data-reader-trigger={article.id}
                              onClick={(event) => openReader(article.id, event.currentTarget)}
                            >
                              {copy.readArticle}
                            </button>
                            <button
                              type="button"
                              disabled={readingActionsDisabled}
                              onClick={() => toggleSaved(article.id)}
                            >
                              {visibleReadingState.entries.find(
                                (entry) => entry.articleId === article.id,
                              )?.savedAt !== undefined
                                ? copy.removeFromSaved
                                : copy.saveForLater}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : (
                  <section
                    className={`feed-status feed-status-${displayedState}`}
                    aria-labelledby="website-status-title"
                  >
                    <h2 id="website-status-title">{stateLabels(copy)[displayedState]}</h2>
                    <p
                      role={displayedState === 'error' ? 'alert' : 'status'}
                      aria-live="polite"
                      aria-busy={displayedState === 'loading'}
                    >
                      {statusMessage(copy, displayedState as Exclude<FeedStateKind, 'ready'>)}
                    </p>
                  </section>
                )}
                <section className="state-panel" aria-labelledby="website-states-title">
                  <div>
                    <p className="hero-kicker">{copy.localTestStates}</p>
                    <h2 id="website-states-title">{copy.statePanelTitle}</h2>
                  </div>
                  <div className="state-controls" aria-label={copy.selectFeedState}>
                    {feedStates.map((candidate) => (
                      <button
                        key={candidate}
                        type="button"
                        aria-pressed={requestedState === candidate}
                        onClick={() => setRequestedState(candidate)}
                      >
                        {stateLabels(copy)[candidate]}
                      </button>
                    ))}
                  </div>
                </section>
              </>
            ) : target === 'discover' && readWebsiteDirectorySection() !== null ? (
              <WebsiteContentDirectoryRoute
                section={readWebsiteDirectorySection()!}
                language={uiLanguage}
                headingRef={pageHeadingRef}
                onSectionChange={navigateDirectory}
              />
            ) : target === 'discover' ? (
              discoverArticles !== null &&
              discoverIndex !== null &&
              (displayedState === 'ready' || displayedState === 'offline') ? (
                <>
                  {displayedState === 'offline' ? (
                    <p className="discover-offline" role="status">
                      {copy.offlineFixtureUsable}
                    </p>
                  ) : null}
                  <WebsiteDiscover
                    articles={discoverArticles}
                    index={discoverIndex}
                    criteria={discoverCriteria}
                    onCriteria={setDiscoverCriteria}
                    onRead={openReader}
                    headingRef={pageHeadingRef}
                  />
                </>
              ) : (
                <section className="migration-panel" aria-labelledby="website-page-title">
                  <p className="hero-kicker">{copy.localSearchAndFilters}</p>
                  <h1 id="website-page-title" ref={pageHeadingRef} tabIndex={-1}>
                    {copy.discover}
                  </h1>
                  <p
                    role={displayedState === 'error' ? 'alert' : 'status'}
                    aria-live="polite"
                    aria-busy={displayedState === 'loading'}
                  >
                    {displayedState === 'ready'
                      ? copy.discoverIndexLoading
                      : statusMessage(copy, displayedState as Exclude<FeedStateKind, 'ready'>)}
                  </p>
                </section>
              )
            ) : target === 'saved' ? (
              <WebsiteSavedView
                state={visibleReadingState}
                articles={readyState?.articles ?? []}
                unavailableArticleIds={unavailableReadingIds}
                onRead={openReader}
                onSaveToggle={toggleSaved}
                onReadToggle={toggleRead}
                onResetProgress={resetProgress}
                onRequestClear={requestClear}
                message={readingMessage}
                readingActionsDisabled={readingActionsDisabled}
                headingRef={pageHeadingRef}
              />
            ) : productionMode && (target === 'events' || target === 'media') ? (
              <WebsiteProductionEventsMediaRoute
                mode={target}
                language={uiLanguage}
                headingRef={pageHeadingRef}
              />
            ) : target === 'media' ? (
              <VideoSources language={uiLanguage} headingRef={pageHeadingRef} />
            ) : target === 'knowledge' ? (
              <WebsiteKnowledgeRoute language={uiLanguage} headingRef={pageHeadingRef} />
            ) : target === 'help' || target === 'solidarity' ? (
              <WebsiteSupportRoute
                view={target}
                language={uiLanguage}
                headingRef={pageHeadingRef}
                onNavigationGuardChange={setSupportNavigationGuard}
              />
            ) : (
              <section className="migration-panel" aria-labelledby="website-page-title">
                <p className="hero-kicker">{copy.inProgress}</p>
                <h1 id="website-page-title" ref={pageHeadingRef} tabIndex={-1}>
                  {navigationLabel(target)}
                </h1>
                {target !== 'more' ? (
                  <>
                    <p role="status">{copy.notMigrated}</p>
                    <p>{copy.laterSliceDetail}</p>
                  </>
                ) : null}
                {target === 'more' ? (
                  <>
                    <WebsiteContentOfflinePanel
                      result={contentResult}
                      operationResult={contentOperationResult}
                      busy={contentOperation !== null}
                      language={uiLanguage}
                      onAction={requestContentAction}
                    />
                    <WebsiteShellPanel copy={copy} />
                  </>
                ) : null}
                <span className="return-link">{routeLink('home', copy.returnHome)}</span>
              </section>
            )}
            {!productionMode && (
              <aside className="boundary-note" aria-labelledby="boundary-title">
                <h2 id="boundary-title">{copy.previewBoundary}</h2>
                <p>{copy.previewBoundaryDetail}</p>
              </aside>
            )}
          </main>
          {productionMode && <WebsiteSupportWelcome language={uiLanguage} />}
          <footer className="site-footer">
            {productionMode ? shellCopy.productName : copy.websitePreviewFooter}
          </footer>
          {sourceConfirmation !== null &&
          contentRouteAllowed &&
          (fixtureMode || runtime !== null) ? (
            <ExternalSourceConfirmation
              article={sourceConfirmation}
              onClose={() => setSourceConfirmation(null)}
            />
          ) : null}
          {readingClearKind !== null ? (
            <ReadingClearConfirmation
              kind={readingClearKind}
              onConfirm={confirmClear}
              onClose={closeReadingClear}
            />
          ) : null}
          {contentConfirmation !== null ? (
            <WebsiteContentOfflineConfirmation
              action={contentConfirmation}
              trigger={contentTriggerRef.current}
              onClose={() => {
                setContentConfirmation(null);
                contentTriggerRef.current?.focus();
                contentTriggerRef.current = null;
              }}
              onConfirm={confirmContentAction}
            />
          ) : null}
        </div>
      </SourcePreferencesProvider>
    </UiCopyContext.Provider>
  );
}
