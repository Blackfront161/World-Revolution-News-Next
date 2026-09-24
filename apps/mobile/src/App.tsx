import {
  Component,
  createContext,
  lazy,
  Suspense,
  useEffect,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
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
  getMobileKnowledgeCopy,
  getMobileMediaCopy,
  isUiLanguage,
  isRegisteredUiLanguage,
  registeredUiLanguages,
  uiLanguageDirections,
  uiLanguageNativeNames,
  type UiCopy,
  type UiLanguage,
} from '@wrn/ui-language';
import {
  projectLocalHomePresentationV1,
  type LocalHomePresentationProjectionV1,
} from '@wrn/content-contracts';
import type {
  ArchiveLifecycleValidationResult,
  LocalArticle,
  LocalArchiveLifecycleV1,
  LocalContentReleaseReadyV1,
  LocalManifestV1,
  LocalReaderDetailEntryV1,
  LocalReaderDetailsV1,
} from '@wrn/content-contracts';
import {
  clearAllLocalReadingData,
  clearLocalReadMarkers,
  clearLocalSavedArticles,
  createCanonicalArticleShareUrl,
  createReadyFeedState,
  createEmptyLocalReadingState,
  markLocalArticleRead,
  markLocalArticleUnread,
  removeLocalReadingArticle,
  reconcileLocalReadingState,
  resetLocalReadingProgress,
  saveLocalReadingArticle,
  createLocalArchiveProjection,
  createReaderLoadingState,
  displayOriginalLanguage,
  emptyDiscoverCriteria,
  feedStates,
  filterDiscoverArticles,
  hasActiveDiscoverCriteria,
  parseNavigationTargetId,
  projectLocalPersonalizedArticles,
  mobilePrimaryNavigationIds,
  resolveNavigationTarget,
  resolveLocalArchiveLifecycle,
  resolveLocalReaderState,
  toFeedArticleCard,
  updateLocalReadingProgress,
  type ArchiveLifecycleResolution,
  type ArchiveProjection,
  type FeedReadyState,
  type FeedStateKind,
  type NavigationTargetId,
  type ReaderState,
} from '@wrn/domain';
import type { LocalReadingStateV1 } from '@wrn/domain';
import { loadMobileReadingState, persistMobileReadingState } from './local-reading-state';
import {
  createMobilePersonalizationStore,
  type MobilePersonalizationLoadResult,
  type MobilePersonalizationStore,
} from './local-personalization-state';
import { LocalPersonalizationHub } from '../../../packages/browser-content/src/local-personalization-ui';
import {
  SourcePreferencesProvider,
  SourceOnlyResults,
} from '../../../packages/browser-content/src/source-preferences-ui';
import { loadMobileUiLanguage, persistMobileUiLanguage } from './ui-language-preference';
import { loadLocalContentRelease, type LocalContentReleaseRuntime } from './local-content-release';
import type { ContentOfflineControllerResult } from './content-offline-controller';
import { useContentOfflineController } from './content-offline-ui';
import { ProductionContentArea } from './production-content-ui';
import { CurrentRegionalEvents } from '../../../packages/browser-content/src/regional-events/regional-events';
import {
  disabledMobileReaderV2TranslationAdapter,
  loadMobileReaderV2,
  mobileReaderV2BuildPin,
  type MobileReaderV2LocalTranslationAdapter,
  type MobileReaderV2LoadResult,
} from './mobile-reader-v2';
import { loadMobileReaderV2MediaSafety } from './mobile-reader-v2-media-safety';
import { MobileReaderV2Presentation } from './mobile-reader-v2-ui';
import { MobileRegionalEventsPage } from './mobile-regional-events-ui';
import { MobileMediaHubPage } from './mobile-media-hub-ui';
import { VideoSources } from './video-sources-ui';
import { MobileProductionEventsMediaRoute } from './features/events-media/MobileProductionEventsMediaRoute';
import { getSupportCopy } from './features/support/support-copy';
import type { MobileSupportNavigationGuard } from './features/support/MobileSupportRoute';
import {
  parseMobileDirectorySection,
  type MobileDirectorySection,
} from './features/directory/directory-navigation';
import { getDirectoryCopy } from './features/directory/directory-copy';
import { loadMobileContentDirectory } from './features/directory/directory-loader';
import {
  createBrowserShareAdapter,
  type ShareAdapter,
} from '../../../packages/browser-content/src/browser-share';

const MobileHomeDirectory = lazy(() =>
  import('./features/directory/MobileHomeDirectory').then((module) => ({
    default: module.MobileHomeDirectory,
  })),
);
const MobileKnowledgeRoute = lazy(() =>
  import('./features/knowledge/MobileKnowledgeRoute').then((module) => ({
    default: module.MobileKnowledgeRoute,
  })),
);
const MobileSupportRoute = lazy(() =>
  import('./features/support/MobileSupportRoute').then((module) => ({
    default: module.MobileSupportRoute,
  })),
);
const MobileDirectoryRoute = lazy(() =>
  import('./features/directory/MobileContentDirectoryRoute').then((module) => ({
    default: module.MobileContentDirectoryRoute,
  })),
);

class KnowledgeRouteBoundary extends Component<
  Readonly<{
    error: string;
    retry: string;
    note: string;
    onRetry: () => void;
    children: ReactNode;
  }>,
  Readonly<{ failed: boolean }>
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? (
      <section className="migration-panel" role="alert">
        <p>{this.props.error}</p>
        <p>{this.props.note}</p>
        <button type="button" onClick={this.props.onRetry}>
          {this.props.retry}
        </button>
      </section>
    ) : (
      this.props.children
    );
  }
}
import type { MobileReaderV2LoadInput } from './mobile-reader-v2';
import type {
  MobileReaderV2SnapshotIdentity,
  MobileReaderV2ValidatedDocument,
} from '@wrn/content-contracts/mobile-reader-v2';

type LocalFixtureLoader = (signal: AbortSignal) => Promise<LocalContentReleaseRuntime>;
type MobileReaderV2Loader = (input: MobileReaderV2LoadInput) => Promise<MobileReaderV2LoadResult>;
type ReaderFixture = Pick<LocalContentReleaseReadyV1, 'readerDetails'>;
type ReaderArticles = Parameters<typeof filterDiscoverArticles>[0];
type HomeArticle = FeedReadyState['articles'][number];
type LocalArchiveLifecycleFixture = Readonly<{
  articles: readonly LocalArticle[];
  details: LocalReaderDetailsV1;
  lifecycle: LocalArchiveLifecycleV1;
  validation: ArchiveLifecycleValidationResult;
}>;
type OfflineAction = 'save' | 'check' | 'activate' | 'rollback' | 'clear';
type MobilePersonalizationRuntime = Readonly<{
  store: MobilePersonalizationStore;
  loaded: MobilePersonalizationLoadResult;
}>;

function MobileContentOfflinePanel({
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
        <h3>{copy.localContent}</h3>
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
      aria-labelledby="mobile-local-content-title"
      aria-busy={busy}
    >
      <h3 id="mobile-local-content-title">{copy.localContent}</h3>
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
          {!result.candidate.eligible ? ` — ${copy.contentAlternativeUnavailable}` : ''}
        </p>
      ) : null}
      {result.previous !== null ? (
        <p>
          {formatUiCopy(copy.contentPreviousRevision, { revision: result.previous.revision })}
          {!result.previous.eligible ? ` — ${copy.contentAlternativeUnavailable}` : ''}
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

function MobileContentOfflineConfirmation({
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
        aria-labelledby="mobile-content-confirm-title"
        aria-describedby="mobile-content-confirm-detail"
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
        <h2 id="mobile-content-confirm-title">
          {formatUiCopy(copy.contentActionQuestion, { action: label })}
        </h2>
        <p id="mobile-content-confirm-detail">
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
const systemClock = () => Date.now();

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
  if (parseMobileDirectorySection(window.location.hash) !== null) return 'discover';
  return resolveNavigationTarget(window.location.hash.replace(/^#\/?/, ''));
}
function readMobileArticleIdFromLocation(): string | null {
  const match = window.location.hash.match(/^#article\/([^/]+)$/u);
  if (match?.[1] === undefined) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return '';
  }
}
function readMobileArchiveRoute(): string | null | undefined {
  if (window.location.hash === '#archive') return null;
  const match = window.location.hash.match(/^#archive\/([^/]+)$/u);
  if (match?.[1] === undefined) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return '';
  }
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

function MobileHomeArticle({
  article,
  variant,
  category,
  onRead,
  onSaveToggle,
  readingActionsDisabled,
  saved,
}: {
  article: HomeArticle;
  variant: 'lead' | 'main' | 'sport-feature' | 'sport-secondary' | 'legacy';
  category?: string;
  onRead: (articleId: string, trigger: HTMLButtonElement) => void;
  onSaveToggle: (articleId: string) => void;
  readingActionsDisabled: boolean;
  saved: boolean;
}) {
  const copy = useUiCopy();
  return (
    <article
      className={`mobile-feed-card home-card home-card--${variant}`}
      data-article-id={article.id}
      data-home-role={variant === 'legacy' ? undefined : variant}
    >
      <div
        className="media-placeholder home-card-media"
        role="img"
        aria-label={formatUiCopy(copy.homePlaceholderImage, { title: article.title })}
      >
        <span>{copy.noImage}</span>
      </div>
      <div className="article-body">
        {category !== undefined ? <p className="home-card-category">{category}</p> : null}
        <p className="article-source">{article.sourceName}</p>
        <h3>{article.title}</h3>
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
        <div className="home-card-actions">
          <button
            type="button"
            className="reader-entry"
            data-reader-trigger={article.id}
            onClick={(event) => onRead(article.id, event.currentTarget)}
          >
            {copy.readArticle}
          </button>
          <button
            type="button"
            disabled={readingActionsDisabled}
            onClick={() => onSaveToggle(article.id)}
          >
            {saved ? copy.removeFromSaved : copy.saveForLater}
          </button>
        </div>
      </div>
    </article>
  );
}

function buildHomeProjection(
  manifest: Pick<LocalManifestV1, 'homePresentation'>,
  articles: readonly HomeArticle[],
  now: number,
): Readonly<{
  readonly roles: LocalHomePresentationProjectionV1;
  readonly lead: HomeArticle;
  readonly main: readonly HomeArticle[];
  readonly sport: Readonly<{
    readonly feature: HomeArticle;
    readonly secondary: readonly HomeArticle[];
    readonly categories: readonly string[];
  }> | null;
}> | null {
  const roles = projectLocalHomePresentationV1(manifest, articles, now);
  if (roles.leadId === null) return null;
  const byId = new Map(articles.map((article) => [article.id, article]));
  const lead = byId.get(roles.leadId);
  const main = roles.mainIds.map((id) => byId.get(id));
  if (lead === undefined || main.length !== 5 || main.some((article) => article === undefined))
    return null;
  if (roles.kind !== 'ready' || roles.sport === null)
    return Object.freeze({ roles, lead, main: Object.freeze(main as HomeArticle[]), sport: null });
  const feature = byId.get(roles.sport.featureId);
  const secondary = roles.sport.secondaryIds.map((id) => byId.get(id));
  if (
    feature === undefined ||
    secondary.length !== 2 ||
    secondary.some((article) => article === undefined)
  )
    return null;
  return Object.freeze({
    roles,
    lead,
    main: Object.freeze(main as HomeArticle[]),
    sport: Object.freeze({
      feature,
      secondary: Object.freeze(secondary as HomeArticle[]),
      categories: Object.freeze([...roles.sport.categories]),
    }),
  });
}

function MobileDiscover({
  articles,
  index,
  criteria,
  onCriteria,
  onRead,
  onSaveToggle,
  readingActionsDisabled,
  headingRef,
}: {
  articles: Parameters<typeof filterDiscoverArticles>[0];
  index: Parameters<typeof filterDiscoverArticles>[1];
  criteria: ReturnType<typeof filterDiscoverArticles>['criteria'];
  onCriteria: (criteria: ReturnType<typeof filterDiscoverArticles>['criteria']) => void;
  onRead: (articleId: string, trigger: HTMLButtonElement) => void;
  onSaveToggle: (articleId: string) => void;
  readingActionsDisabled: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const copy = useUiCopy();
  const result = filterDiscoverArticles(articles, index, criteria);
  const active = hasActiveDiscoverCriteria(result.criteria);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const filterDisclosureRef = useRef<HTMLDetailsElement | null>(null);
  const criterionRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocusRef = useRef<string | 'filters' | 'search' | null>(null);
  const set = <K extends keyof typeof result.criteria>(
    key: K,
    value: (typeof result.criteria)[K],
  ) => onCriteria({ ...result.criteria, [key]: value });
  const reset = () => {
    pendingFocusRef.current = 'search';
    onCriteria(emptyDiscoverCriteria);
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

  useEffect(() => {
    const pendingFocus = pendingFocusRef.current;
    if (pendingFocus === null) return;
    pendingFocusRef.current = null;
    if (pendingFocus === 'search') {
      searchRef.current?.focus();
      return;
    }
    if (pendingFocus === 'filters') {
      filterDisclosureRef.current?.querySelector('summary')?.focus();
      return;
    }
    criterionRefs.current.get(pendingFocus)?.focus();
  }, [activeCriteria]);

  const removeCriterion = (key: keyof typeof result.criteria) => {
    const remaining = activeCriteria.filter((entry) => entry.key !== key);
    pendingFocusRef.current = remaining[0]?.key ?? 'filters';
    onCriteria({ ...result.criteria, [key]: (key === 'query' ? '' : null) as never });
  };

  return (
    <section className="discover-view" aria-labelledby="mobile-page-title">
      <p className="feed-overline">{copy.localSearchAndFilters}</p>
      <h2 id="mobile-page-title" ref={headingRef} tabIndex={-1}>
        {copy.discover}
      </h2>
      <p className="discover-intro">{copy.discoverIntro}</p>
      <label className="discover-search-label" htmlFor="mobile-discover-search">
        {copy.searchNews}
      </label>
      <input
        id="mobile-discover-search"
        className="discover-search"
        type="search"
        ref={searchRef}
        value={result.criteria.query}
        onChange={(event) => set('query', event.target.value)}
        placeholder={copy.searchPlaceholder}
      />
      <details className="discover-facets" ref={filterDisclosureRef}>
        <summary>{formatUiCopy(copy.filtersWithCount, { count: activeCriteria.length })}</summary>
        <div className="discover-facet-controls">
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
        </div>
      </details>
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
                ref={(element) => {
                  if (element) criterionRefs.current.set(key, element);
                  else criterionRefs.current.delete(key);
                }}
                onClick={() => removeCriterion(key)}
              >
                {label}: {value} ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {result.articles.length === 0 ? (
        <section className="discover-empty" aria-labelledby="mobile-discover-empty-title">
          <h3 id="mobile-discover-empty-title">{copy.noResults}</h3>
          <p>{copy.noResultsDetail}</p>
          <button type="button" onClick={reset}>
            {copy.resetFilters}
          </button>
        </section>
      ) : (
        <section className="feed-list" aria-label={copy.filteredLocalNews}>
          {result.articles.map((article) => (
            <article className="mobile-feed-card" key={article.id} data-article-id={article.id}>
              <div className="article-body">
                <p className="article-source">{article.sourceName}</p>
                <h3>{article.title}</h3>
                <p className="article-teaser">{article.teaser}</p>
                <p className="discover-card-meta">
                  {article.region} · {article.format} ·{' '}
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
                <button
                  type="button"
                  disabled={readingActionsDisabled}
                  onClick={() => onSaveToggle(article.id)}
                >
                  {copy.saveForLater}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}

function MobileReader({
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
  readerV2Sidecar,
  readerV2Snapshot,
  readerV2TranslationAdapter,
  readerV2MediaSafety,
  uiLanguage,
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
  readerV2Sidecar: MobileReaderV2ValidatedDocument | null;
  readerV2Snapshot: MobileReaderV2SnapshotIdentity | null;
  readerV2TranslationAdapter: MobileReaderV2LocalTranslationAdapter | null;
  readerV2MediaSafety: ReturnType<typeof loadMobileReaderV2MediaSafety>;
  uiLanguage: UiLanguage;
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
      <section className="reader-status" aria-labelledby="mobile-reader-title">
        <p className="feed-overline">{copy.localReader}</p>
        <h2 id="mobile-reader-title" ref={headingRef} tabIndex={-1}>
          {state.kind === 'loading'
            ? copy.articleLoading
            : isError
              ? copy.articleUnavailable
              : copy.articleNotFound}
        </h2>
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
    <article className="mobile-reader" aria-labelledby="mobile-reader-title">
      <button type="button" className="reader-back" onClick={onClose}>
        {copy.back}
      </button>
      {isOffline ? (
        <p className="discover-offline" role="status">
          {copy.readerOffline}
        </p>
      ) : null}
      <p className="article-source">{article.source.name}</p>
      <h2 id="mobile-reader-title" ref={headingRef} tabIndex={-1}>
        {article.title}
      </h2>
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
      <section className="reading-actions" aria-label={copy.localReadingData}>
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
        <button
          type="button"
          disabled={readingActionsDisabled}
          onClick={() => onSaveProgress(article.id)}
        >
          {copy.saveProgress}
        </button>
        {progress !== undefined ? (
          <button
            type="button"
            disabled={readingActionsDisabled}
            onClick={() => onResetProgress(article.id)}
          >
            {formatUiCopy(copy.progressAt, { percent: Math.round(progress * 100) })}
          </button>
        ) : null}
      </section>
      <MobileReaderV2Presentation
        article={article}
        detail={detail}
        sidecar={readerV2Sidecar}
        snapshot={readerV2Snapshot}
        targetLanguage={uiLanguage}
        copy={copy}
        isOffline={isOffline}
        translationAdapter={readerV2TranslationAdapter}
        mediaSafety={readerV2MediaSafety}
      />
      <section className="reader-source" aria-labelledby="mobile-original-source-title">
        <h3 id="mobile-original-source-title">{copy.originalSource}</h3>
        <p>{copy.originalSourceDetail}</p>
        <button type="button" onClick={(event) => onConfirmSource(article, event.currentTarget)}>
          {copy.openOriginalSource}
        </button>
      </section>
    </article>
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
        aria-labelledby="mobile-source-dialog-title"
        onKeyDown={trapFocus}
      >
        <h2 id="mobile-source-dialog-title">{copy.externalSourceDialogTitle}</h2>
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

function MobileArchiveView({
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
      <section className="archive-status" aria-labelledby="mobile-archive-title">
        <p className="feed-overline">{copy.localArchive}</p>
        <h2 id="mobile-archive-title" ref={headingRef} tabIndex={-1}>
          {copy.archivePreparing}
        </h2>
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
        <section className="archive-status" aria-labelledby="mobile-archive-title">
          <p className="feed-overline">{copy.localArchive}</p>
          <h2 id="mobile-archive-title" ref={headingRef} tabIndex={-1}>
            {copy.archiveUnavailable}
          </h2>
          <p role="alert">{projection.message}</p>
          <button type="button" className="reader-back" onClick={onClose}>
            {copy.backToMore}
          </button>
        </section>
      );
    }
    return (
      <section className="archive-view" aria-labelledby="mobile-archive-title">
        <p className="feed-overline">{copy.localArchive}</p>
        <h2 id="mobile-archive-title" ref={headingRef} tabIndex={-1}>
          {copy.archive}
        </h2>
        <p className="discover-intro">{copy.archiveIntro}</p>
        <div className="archive-list" aria-label={copy.localArchiveArticles}>
          {projection.articles.map((article) => (
            <article className="archive-card" key={article.id} data-archive-id={article.id}>
              <p className="archive-lifecycle">
                {article.lifecycle === 'historical' ? copy.historical : copy.current}
              </p>
              <h3>{article.title}</h3>
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
      <section className="archive-status" aria-labelledby="mobile-archive-title">
        <p className="feed-overline">{copy.localArchive}</p>
        <h2 id="mobile-archive-title" ref={headingRef} tabIndex={-1}>
          {copy.normalizingArticleAddress}
        </h2>
        <p role="status">{copy.preparingCanonicalArticle}</p>
      </section>
    );
  }
  if ('message' in resolution) {
    return (
      <section className="archive-status" aria-labelledby="mobile-archive-title">
        <p className="feed-overline">{copy.localArchive}</p>
        <h2 id="mobile-archive-title" ref={headingRef} tabIndex={-1}>
          {archiveUnavailableHeading(resolution, copy)}
        </h2>
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
      <section className="archive-status" aria-labelledby="mobile-archive-title">
        <h2 id="mobile-archive-title" ref={headingRef} tabIndex={-1}>
          {copy.archiveUnavailable}
        </h2>
        <p role="alert">{copy.archiveArticleValidationError}</p>
      </section>
    );
  }
  const share = () => {
    if (shareUrl === null) return;
    void shareAdapter.share(shareUrl).then(
      () => setShareMessage(copy.canonicalShareReady),
      () => setShareMessage(copy.canonicalShareError),
    );
  };
  return (
    <article className="mobile-reader archive-reader" aria-labelledby="mobile-archive-title">
      <button type="button" className="reader-back" onClick={onClose}>
        {copy.backToArchive}
      </button>
      <p className="archive-lifecycle">
        {resolution.kind === 'canonical-archived'
          ? copy.historicalArticle
          : copy.currentArchiveArticle}
      </p>
      <p className="article-source">{article.source.name}</p>
      <h2 id="mobile-archive-title" ref={headingRef} tabIndex={-1}>
        {article.title}
      </h2>
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
            <h3 key={index}>{block.text}</h3>
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

type SavedFeedArticle = NonNullable<FeedReadyState>['articles'][number];
type ReadingClearKind = 'saved' | 'read' | 'all';

function MobileSavedView({
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
  const later = state.entries.filter((entry) => entry.savedAt !== undefined);
  const read = state.entries.filter((entry) => entry.readAt !== undefined);
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
  return (
    <section className="saved-view" aria-labelledby="mobile-page-title">
      <p className="feed-overline">{copy.localReadingData}</p>
      <h2 id="mobile-page-title" ref={headingRef} tabIndex={-1}>
        {copy.saved}
      </h2>
      <p className="saved-intro">{copy.savedIntro}</p>
      {message !== null ? (
        <p className="saved-message" role="status">
          {message}
        </p>
      ) : null}
      <section className="saved-group" aria-labelledby="mobile-later-title">
        <div className="saved-group-heading">
          <h3 id="mobile-later-title">{copy.readLater}</h3>
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
      <section className="saved-group" aria-labelledby="mobile-read-title">
        <div className="saved-group-heading">
          <h3 id="mobile-read-title">{copy.read}</h3>
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

function MobilePersonalizationHub({
  articles,
  discoverIndex,
  onRead,
  headingRef,
  store,
  loaded,
  onLoaded,
  productionResults,
}: {
  articles: readonly LocalArticle[] | null;
  discoverIndex: Parameters<typeof filterDiscoverArticles>[1] | null;
  onRead: (articleId: string, trigger: HTMLButtonElement) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  store: MobilePersonalizationStore;
  loaded: MobilePersonalizationLoadResult;
  onLoaded: (value: MobilePersonalizationLoadResult) => void;
  productionResults?: ReactNode;
}) {
  const copy = useUiCopy();
  const matchingArticles = useMemo(() => {
    if (loaded.kind !== 'ready' || articles === null || discoverIndex === null) return [];
    return projectLocalPersonalizedArticles({ state: loaded.state, articles, discoverIndex });
  }, [articles, discoverIndex, loaded]);
  return (
    <LocalPersonalizationHub
      copy={copy}
      headingId="mobile-page-title"
      headingRef={headingRef}
      store={store}
      loaded={loaded}
      onLoaded={onLoaded}
      inactiveResults={
        productionResults === undefined ? undefined : (
          <SourceOnlyResults render={() => productionResults} />
        )
      }
      results={
        productionResults !== undefined ? (
          productionResults
        ) : matchingArticles.length === 0 ? (
          <p role="status">{copy.personalizationNoMatches}</p>
        ) : (
          <div className="feed-list">
            {matchingArticles.map((article) => (
              <MobileHomeArticle
                key={article.id}
                article={toFeedArticleCard(article)}
                variant="legacy"
                onRead={onRead}
                onSaveToggle={() => undefined}
                readingActionsDisabled
                saved={false}
              />
            ))}
          </div>
        )
      }
    />
  );
}

function MobilePersonalizationLoading({
  headingRef,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const copy = useUiCopy();
  return (
    <section className="personalization-view" aria-labelledby="mobile-page-title">
      <p className="feed-overline">{copy.personalizationOverline}</p>
      <h2 id="mobile-page-title" ref={headingRef} tabIndex={-1}>
        {copy.personalizationTitle}
      </h2>
      <p className="personalization-intro">{copy.personalizationIntro}</p>
      <p role="status" aria-live="polite" className="personalization-status">
        {copy.personalizationLoading}
      </p>
    </section>
  );
}

export function App({
  initialState,
  initialTheme,
  initialUiLanguage,
  contentMode,
  loader,
  shareAdapter = localShareAdapter,
  onHistorySessionChange,
  onNavigationReady,
  now = systemClock,
  mobileReaderV2Loader = loadMobileReaderV2,
  mobileReaderV2TranslationAdapter = disabledMobileReaderV2TranslationAdapter,
}: {
  initialState?: FeedStateKind;
  initialTheme?: ThemePreference;
  initialUiLanguage?: UiLanguage;
  /** Explicit component injection for the offline fixture acceptance harness. */
  contentMode?: 'production' | 'fixture-offline';
  loader?: LocalFixtureLoader;
  shareAdapter?: ShareAdapter;
  onHistorySessionChange?: (session: string | null) => void;
  onNavigationReady?: () => void;
  now?: () => number;
  mobileReaderV2Loader?: MobileReaderV2Loader;
  mobileReaderV2TranslationAdapter?: MobileReaderV2LocalTranslationAdapter | null;
} = {}) {
  const query = new URLSearchParams(window.location.search);
  const [requestedState, setRequestedState] = useState<FeedStateKind>(
    initialState ?? readState(query.get('state')),
  );
  const fixtureMode = initialState !== undefined || loader !== undefined;
  const productionMode = !fixtureMode && contentMode !== 'fixture-offline';
  const [fixtureReadyState, setReadyState] = useState<FeedReadyState | null>(null);
  const [fixtureManifest, setFixtureManifest] = useState<LocalManifestV1 | null>(null);
  const [fixtureDiscoverArticles, setDiscoverArticles] = useState<
    Parameters<typeof filterDiscoverArticles>[0] | null
  >(null);
  const [fixtureDiscoverIndex, setDiscoverIndex] = useState<
    Parameters<typeof filterDiscoverArticles>[1] | null
  >(null);
  const [fixtureReaderFixture, setReaderFixture] = useState<ReaderFixture | null>(null);
  const [fixtureReaderArticles, setReaderArticles] = useState<ReaderArticles | null>(null);
  const [fixtureReleaseReady, setFixtureReleaseReady] = useState<LocalContentReleaseReadyV1 | null>(
    null,
  );
  const [readerV2Sidecar, setReaderV2Sidecar] = useState<MobileReaderV2ValidatedDocument | null>(
    null,
  );
  const [readerV2MediaSafety] = useState<ReturnType<typeof loadMobileReaderV2MediaSafety>>(() =>
    productionMode ? { kind: 'unavailable' } : loadMobileReaderV2MediaSafety(),
  );
  const [discoverCriteria, setDiscoverCriteria] = useState(emptyDiscoverCriteria);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    readThemePreference(query, initialTheme),
  );
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>(() =>
    initialUiLanguage !== undefined && isRegisteredUiLanguage(initialUiLanguage)
      ? initialUiLanguage
      : loadMobileUiLanguage(),
  );
  const [personalizationRuntime, setPersonalizationRuntime] =
    useState<MobilePersonalizationRuntime | null>(null);
  const [wideLanguageSelectorLayout, setWideLanguageSelectorLayout] = useState(
    needsWideLanguageSelectorLayout,
  );
  const uiLanguageSelectRef = useRef<HTMLSelectElement>(null);
  const copy = getUiCopy(uiLanguage);
  const knowledgeCopy = getMobileKnowledgeCopy(uiLanguage);
  const supportCopy = getSupportCopy(uiLanguage);
  const directoryCopy = getDirectoryCopy(uiLanguage);
  const [directorySection, setDirectorySection] = useState(() =>
    parseMobileDirectorySection(window.location.hash),
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState(readSystemPrefersDark);
  const [target, setTarget] = useState<NavigationTargetId>(readNavigationTargetFromLocation);
  const [searchRequested, setSearchRequested] = useState(false);
  const supportClock = useCallback(() => new Date(now()), [now]);
  const supportGuardRef = useRef<MobileSupportNavigationGuard | null>(null);
  const registerSupportGuard = useCallback((guard: MobileSupportNavigationGuard | null) => {
    supportGuardRef.current = guard;
  }, []);
  const historySessionRef = useRef(crypto.randomUUID());
  const historyInitializedRef = useRef(false);
  const acceptedHistoryRef = useRef({
    href: window.location.href,
    state: window.history.state as unknown,
    position: 0,
  });
  const restoringHistoryRef = useRef<{ href: string; afterRestore: () => void } | null>(null);
  const requestNavigation = useCallback((action: () => void) => {
    const request = () => {
      const guard = supportGuardRef.current;
      if (guard === null || guard(action)) action();
    };
    if (restoringHistoryRef.current !== null) restoringHistoryRef.current.afterRestore = request;
    else request();
  }, []);
  const pushNavigationHistory = useCallback((state: Record<string, unknown>, url: string) => {
    const position = acceptedHistoryRef.current.position + 1;
    const markedState = {
      ...state,
      wrnHistorySession: historySessionRef.current,
      wrnHistoryPosition: position,
    };
    window.history.pushState(markedState, '', url);
    acceptedHistoryRef.current = { href: window.location.href, state: markedState, position };
  }, []);
  const replaceNavigationHistory = useCallback((state: Record<string, unknown>, url: string) => {
    const position = acceptedHistoryRef.current.position;
    const markedState = {
      ...state,
      wrnHistorySession: historySessionRef.current,
      wrnHistoryPosition: position,
    };
    window.history.replaceState(markedState, '', url);
    acceptedHistoryRef.current = { href: window.location.href, state: markedState, position };
  }, []);
  useEffect(() => {
    if (!historyInitializedRef.current) {
      const state =
        typeof window.history.state === 'object' && window.history.state !== null
          ? (window.history.state as Record<string, unknown>)
          : {};
      replaceNavigationHistory(state, window.location.href);
      // Effect replay must not accept a native hash change before the router
      // has synchronized its state with that destination.
      historyInitializedRef.current = true;
    }
    onHistorySessionChange?.(historySessionRef.current);
    return () => onHistorySessionChange?.(null);
  }, [onHistorySessionChange, replaceNavigationHistory]);
  const [readerArticleId, setReaderArticleId] = useState<string | null>(
    readMobileArticleIdFromLocation,
  );
  const [archiveRoute, setArchiveRoute] = useState<string | null | undefined>(
    readMobileArchiveRoute,
  );
  const [fixtureArchive, setArchiveFixture] = useState<LocalArchiveLifecycleFixture | null>(null);
  const [sourceConfirmation, setSourceConfirmation] = useState<
    Extract<ReaderState, { kind: 'ready' }>['article'] | null
  >(null);
  const [sourceConfirmationSnapshotIdentity, setSourceConfirmationSnapshotIdentity] = useState<
    string | null
  >(null);
  const [loadedReadingState] = useState(() =>
    productionMode
      ? { kind: 'read-only' as const, state: createEmptyLocalReadingState() }
      : loadMobileReadingState(),
  );
  const [readingState, setReadingState] = useState<LocalReadingStateV1>(loadedReadingState.state);
  const readingActionsDisabled = loadedReadingState.kind === 'read-only';
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
  const [routeGuardAllowed, setContentRouteAllowed] = useState(fixtureMode);
  const [navigationEpoch, setNavigationEpoch] = useState(0);
  const contentRouteAllowed =
    fixtureMode ||
    (routeGuardAllowed && contentOperation !== 'guard' && contentOperation !== 'resumeGuard');
  const readerV2Ready = fixtureMode ? fixtureReleaseReady : (runtime?.ready ?? null);
  const readerV2Snapshot = useMemo<MobileReaderV2SnapshotIdentity | null>(() => {
    if (readerV2Ready === null) return null;
    return Object.freeze({
      releaseRevision: readerV2Ready.descriptor.releaseRevision,
      manifestSha256: readerV2Ready.manifestSha256,
      readerDetailsRevision: readerV2Ready.readerDetails.revision,
      readerDetailsWholeDocumentSha256:
        readerV2Ready.descriptor.expectedComponents.readerDetails.sha256,
      readerDetailsIntegritySha256: readerV2Ready.readerDetails.integritySha256,
    });
  }, [readerV2Ready]);
  const readerV2AttemptKey =
    readerV2Snapshot === null
      ? null
      : `${readerV2Snapshot.releaseRevision}:${readerV2Snapshot.manifestSha256}:${readerV2Snapshot.readerDetailsRevision}:${readerV2Snapshot.readerDetailsWholeDocumentSha256}:${readerV2Snapshot.readerDetailsIntegritySha256}`;
  // A Reader-v2 sidecar may only start after the canonical v1 route guard has
  // admitted the already validated release. This avoids consuming the single
  // snapshot attempt while the guard is still replacing the runtime.
  const readerV2CanLoad = fixtureMode || contentRouteAllowed;
  const readerV2InputRef = useRef<MobileReaderV2LoadInput | null>(null);
  const readerV2Articles = readerV2Ready?.payloads.articles;
  readerV2InputRef.current =
    !readerV2CanLoad ||
    readerV2Ready === null ||
    readerV2Snapshot === null ||
    readerV2Articles === undefined ||
    !('articles' in readerV2Articles)
      ? null
      : {
          pin: mobileReaderV2BuildPin,
          snapshot: readerV2Snapshot,
          v1Entries: readerV2Ready.readerDetails.entries as readonly LocalReaderDetailEntryV1[],
          v1Articles: readerV2Articles.articles,
          signal: new AbortController().signal,
        };
  const homeProjection = useMemo(() => {
    const manifest = fixtureMode ? fixtureManifest : runtime?.ready.manifest;
    const cards = readyState?.articles;
    if (manifest === null || manifest === undefined || cards === undefined) return null;
    return buildHomeProjection(manifest, cards, now());
  }, [fixtureManifest, fixtureMode, now, readyState, runtime]);
  const [contentConfirmation, setContentConfirmation] = useState<Extract<
    OfflineAction,
    'activate' | 'rollback' | 'clear'
  > | null>(null);
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

  useEffect(() => {
    copyRef.current = copy;
  }, [copy]);
  useEffect(() => {
    const store = createMobilePersonalizationStore();
    const runtime = Object.freeze({ store, loaded: store.load() });
    const timeout = window.setTimeout(() => setPersonalizationRuntime(runtime), 0);
    return () => {
      window.clearTimeout(timeout);
      store.dispose();
    };
  }, []);

  useLayoutEffect(() => {
    const update = () => setWideLanguageSelectorLayout(needsWideLanguageSelectorLayout());
    // Root style mutations can arrive before inherited text sizing has settled.
    const sizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    if (uiLanguageSelectRef.current !== null) sizeObserver?.observe(uiLanguageSelectRef.current);
    const styleObserver = new MutationObserver(update);
    styleObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    update();
    return () => {
      sizeObserver?.disconnect();
      styleObserver.disconnect();
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    if (!fixtureMode) return;
    let active = true;
    const controller = new AbortController();
    const fixtureLoader = loader ?? loadLocalContentRelease;
    void fixtureLoader(controller.signal)
      .then(async (runtime) => {
        if (!active) return;
        const release = runtime.ready;
        const articlePayload = release.payloads.articles;
        if (articlePayload === undefined || !('articles' in articlePayload)) {
          setRequestedState('error');
          return;
        }
        const validatedReadyState = createReadyFeedState(release.manifest, articlePayload.articles);
        if (!active) return;
        setReadyState(validatedReadyState);
        setFixtureManifest(release.manifest);
        setDiscoverArticles(articlePayload.articles);
        setDiscoverIndex(release.discoverIndex);
        setReaderArticles(articlePayload.articles);
        setReaderFixture({ readerDetails: release.readerDetails });
        setFixtureReleaseReady(release);
        const archive = {
          articles: articlePayload.articles,
          details: release.readerDetails,
          lifecycle: release.archiveLifecycle,
          validation: runtime.archiveValidation,
        };
        setArchiveFixture(archive);
        const readingLifecycle = bindReadingLifecycle(archive, validatedReadyState);
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
          if (persistMobileReadingState(reconciled.state)) {
            readingStateRef.current = reconciled.state;
            setReadingState(reconciled.state);
          } else setReadingMessage(copyRef.current.localStateNotSaved);
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
  useEffect(() => {
    const input = readerV2InputRef.current;
    if (input === null) {
      setReaderV2Sidecar(null);
      return;
    }
    let active = true;
    const controller = new AbortController();
    setReaderV2Sidecar(null);
    void mobileReaderV2Loader({
      ...input,
      signal: controller.signal,
    })
      .then((result) => {
        if (!active || result.kind !== 'ready') return;
        setReaderV2Sidecar(result.sidecar);
      })
      .catch(() => {
        if (active) setReaderV2Sidecar(null);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [mobileReaderV2Loader, readerV2AttemptKey, readerV2CanLoad]);
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
      const restoring = restoringHistoryRef.current;
      if (restoring !== null) {
        if (window.location.href === restoring.href) {
          restoringHistoryRef.current = null;
          restoring.afterRestore();
        }
        return;
      }
      const state = window.history.state as Record<string, unknown> | null;
      const position =
        state?.wrnHistorySession === historySessionRef.current &&
        Number.isSafeInteger(state?.wrnHistoryPosition)
          ? (state!.wrnHistoryPosition as number)
          : null;
      const accepted = acceptedHistoryRef.current;
      if (window.location.href === accepted.href && position === accepted.position) return;
      if (supportGuardRef.current !== null) {
        const difference = position === null ? null : accepted.position - position;
        if (difference !== null && difference !== 0) {
          restoringHistoryRef.current = {
            href: accepted.href,
            afterRestore: () =>
              requestNavigation(() => {
                supportGuardRef.current = null;
                window.history.go(-difference);
              }),
          };
          window.history.go(difference);
        } else {
          // An unmarked hash entry has no reliable direction. Preserve it and
          // create a return entry, never overwrite the user's destination.
          window.history.pushState(accepted.state, '', accepted.href);
          requestNavigation(() => {
            supportGuardRef.current = null;
            window.history.back();
          });
        }
        return;
      }
      if (position === null) {
        historySessionRef.current = crypto.randomUUID();
        acceptedHistoryRef.current = { href: window.location.href, state, position: 0 };
        replaceNavigationHistory(state ?? {}, window.location.href);
        onHistorySessionChange?.(historySessionRef.current);
      } else acceptedHistoryRef.current = { href: window.location.href, state, position };
      // Different history entries may resolve to the same article ID.
      setNavigationEpoch((epoch) => epoch + 1);
      const requestedArticleId = readMobileArticleIdFromLocation();
      const readerHistory =
        requestedArticleId === null ? null : readReaderHistory(requestedArticleId);
      if (readerHistory !== null) {
        readerOriginRef.current = readerHistory.origin;
        readerTriggerIdRef.current = readerHistory.triggerId;
      }
      setTarget(readNavigationTargetFromLocation());
      setDirectorySection(parseMobileDirectorySection(window.location.hash));
      setReaderArticleId(requestedArticleId);
      setArchiveRoute(readMobileArchiveRoute());
      if (!fixtureMode) setContentRouteAllowed(false);
      setSourceConfirmation(null);
    };
    window.addEventListener('popstate', syncNavigation);
    window.addEventListener('hashchange', syncNavigation);
    onNavigationReady?.();
    return () => {
      window.removeEventListener('popstate', syncNavigation);
      window.removeEventListener('hashchange', syncNavigation);
    };
  }, [
    fixtureMode,
    onHistorySessionChange,
    onNavigationReady,
    replaceNavigationHistory,
    requestNavigation,
  ]);
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
    pendingNavigationFocusRef.current =
      target === 'discover' || target === 'following' ? pageHeadingRef.current : null;
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
    if (target !== 'following' || personalizationRuntime === null) return;
    const pending = pendingNavigationFocusRef.current;
    // The mount effect replaces the loading heading. Complete that pending focus only then.
    if (pending !== null && !pending.isConnected && document.activeElement === document.body)
      pageHeadingRef.current?.focus();
    pendingNavigationFocusRef.current = null;
  }, [personalizationRuntime, target]);
  useEffect(() => {
    if (archiveFixture === null || typeof archiveRoute !== 'string') return;
    const resolution = resolveLocalArchiveLifecycle({
      requestedArticleId: archiveRoute,
      lifecycle: archiveFixture.lifecycle,
      lifecycleValidation: archiveFixture.validation,
    });
    if (resolution.kind !== 'redirected') return;
    const canonicalRoute = `#archive/${encodeURIComponent(resolution.canonicalId)}`;
    replaceNavigationHistory(
      { ...window.history.state, wrnArchiveCanonicalId: resolution.canonicalId },
      canonicalRoute,
    );
  }, [archiveFixture, archiveRoute, replaceNavigationHistory]);
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
    const timeout = window.setTimeout(() => setSourceConfirmation(null), 0);
    return () => window.clearTimeout(timeout);
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
    let active = true;
    const timeout = window.setTimeout(() => {
      if (fixtureMode || (readerArticleId === null && archiveRoute === undefined)) {
        setContentRouteAllowed(true);
        return;
      }
      if (contentAction === null) return;
      setContentRouteAllowed(false);
      void contentAction('guard').then((access) => {
        if (active && access?.readAccess === 'allowed' && access.runtime !== null)
          setContentRouteAllowed(true);
      });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [archiveRoute, contentAction, fixtureMode, navigationEpoch, readerArticleId]);
  useEffect(() => {
    if (fixtureMode || contentResult === null || runtime !== null) return;
    const timeout = window.setTimeout(() => {
      setSourceConfirmation(null);
      setReaderArticleId(null);
      setArchiveRoute(undefined);
      setContentRouteAllowed(false);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [contentResult, fixtureMode, runtime]);
  const navigate = (nextTarget: NavigationTargetId) => {
    if (
      nextTarget === target &&
      directorySection === null &&
      readerArticleId === null &&
      archiveRoute === undefined
    )
      return;
    requestNavigation(() => {
      pushNavigationHistory(
        { wrnNavigationTarget: nextTarget, wrnMoreReturn: nextTarget === 'more' },
        `#${nextTarget}`,
      );
      setReaderArticleId(null);
      setArchiveRoute(undefined);
      setTarget(nextTarget);
      setDirectorySection(null);
    });
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
        document.getElementById('mobile-discover-search') ??
        document.querySelector<HTMLInputElement>('input[type="search"]')
      )?.focus();
      setSearchRequested(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [searchRequested, target]);
  const navigateDirectory = (section: MobileDirectorySection) => {
    if (target === 'discover' && directorySection === section) return;
    requestNavigation(() => {
      pushNavigationHistory({ wrnNavigationTarget: 'discover' }, `#discover/${section}`);
      setReaderArticleId(null);
      setArchiveRoute(undefined);
      setTarget('discover');
      setDirectorySection(section);
    });
  };
  const loadProductionHomeDirectory = useCallback(() => loadMobileContentDirectory(), []);
  const openReader = (articleId: string, trigger: HTMLButtonElement) => {
    setContentRouteAllowed(fixtureMode);
    readerOriginRef.current = target;
    readerTriggerIdRef.current = trigger.dataset.readerTrigger ?? articleId;
    pushNavigationHistory(
      {
        wrnReaderArticleId: articleId,
        wrnReaderOriginTarget: target,
        wrnReaderTriggerId: readerTriggerIdRef.current,
      },
      `#article/${encodeURIComponent(articleId)}`,
    );
    setReaderArticleId(articleId);
  };
  const openArchive = (trigger: HTMLButtonElement) => {
    setContentRouteAllowed(fixtureMode);
    archiveTriggerIdRef.current = trigger.dataset.archiveEntryTrigger ?? 'archive-entry';
    pushNavigationHistory(
      { wrnArchiveOriginTarget: target, wrnArchiveTriggerId: archiveTriggerIdRef.current },
      '#archive',
    );
    setTarget('more');
    setArchiveRoute(null);
  };
  const openArchiveReader = (articleId: string, trigger: HTMLButtonElement) => {
    setContentRouteAllowed(fixtureMode);
    archiveTriggerIdRef.current = trigger.dataset.archiveTrigger ?? articleId;
    pushNavigationHistory(
      { wrnArchiveArticleId: articleId, wrnArchiveTriggerId: archiveTriggerIdRef.current },
      `#archive/${encodeURIComponent(articleId)}`,
    );
    setTarget('more');
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
    replaceNavigationHistory({ wrnNavigationTarget: 'more' }, '#more');
    setTarget('more');
    setArchiveRoute(undefined);
  };
  const closeReader = () => {
    setSourceConfirmation(null);
    if (readerOriginRef.current !== null) {
      window.history.back();
      return;
    }
    replaceNavigationHistory({ wrnNavigationTarget: 'home' }, '#home');
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
  const activeManifest = fixtureMode ? fixtureManifest : runtime?.ready.manifest;
  const legacyHomeArticles =
    isReady && activeManifest?.homePresentation === undefined ? readyState.articles : null;
  const homeStatus =
    displayedState === 'ready' && homeProjection === null && legacyHomeArticles === null
      ? 'error'
      : displayedState;
  const navigationLabel = (id: NavigationTargetId) =>
    ({
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
    })[id];
  const sportCategoryLabel = (category: string) =>
    ({
      football: copy.sportFootball,
      fanculture: copy.sportFanculture,
      women: copy.sportWomen,
    })[category] ?? copy.sportAndFanculture;
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
        navigate(id);
      }}
    >
      {label}
    </a>
  );
  const directoryLinks = (
    <nav className="secondary-navigation" aria-label={directoryCopy.title}>
      {(['news', 'sources', 'sport'] as const).map((section) => (
        <a
          key={section}
          href={`#discover/${section}`}
          onClick={(event) => {
            event.preventDefault();
            navigateDirectory(section);
          }}
        >
          {section === 'news'
            ? directoryCopy.title
            : section === 'sources'
              ? directoryCopy.sources
              : directoryCopy.sport}
        </a>
      ))}
    </nav>
  );
  const privacyPolicyLink = (
    <a
      href={`https://solinaridao.com/privacy.html?lang=${encodeURIComponent(uiLanguage)}&return=app`}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
    >
      {copy.privacyPolicy}
    </a>
  );
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
    // A blocked store leaves the deliberate session selection usable without
    // claiming that it will survive a later reopen.
    persistMobileUiLanguage(value);
  };
  const commitReadingState = (nextState: LocalReadingStateV1, success: string) => {
    if (readingActionsDisabled) {
      setReadingMessage(copy.localStateProtected);
      return;
    }
    if (JSON.stringify(nextState) === JSON.stringify(readingState)) return;
    if (!persistMobileReadingState(nextState)) {
      setReadingMessage(copy.localStateNotSaved);
      return;
    }
    readingStateRef.current = nextState;
    setReadingState(nextState);
    setReadingMessage(success);
  };
  const toggleSaved = (articleId: string) => {
    const saved =
      readingState.entries.find((entry) => entry.articleId === articleId)?.savedAt !== undefined;
    commitReadingState(
      saved
        ? removeLocalReadingArticle(readingState, articleId)
        : saveLocalReadingArticle(readingState, articleId, new Date().toISOString()),
      saved ? copy.savedRemoved : copy.savedAdded,
    );
  };
  const toggleRead = (articleId: string, isRead: boolean) =>
    commitReadingState(
      isRead
        ? markLocalArticleUnread(readingState, articleId)
        : markLocalArticleRead(readingState, articleId, new Date().toISOString()),
      isRead ? copy.unreadMarked : copy.readMarked,
    );
  const saveProgress = (articleId: string) =>
    commitReadingState(
      updateLocalReadingProgress(readingState, articleId, 0.5, new Date().toISOString()),
      copy.progressSaved,
    );
  const resetProgress = (articleId: string) =>
    commitReadingState(resetLocalReadingProgress(readingState, articleId), copy.progressReset);
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
    const next =
      readingClearKind === 'saved'
        ? clearLocalSavedArticles(readingState)
        : readingClearKind === 'read'
          ? clearLocalReadMarkers(readingState)
          : clearAllLocalReadingData(readingState);
    commitReadingState(next, copy.localStateDeleted);
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
        storageKey="wrn.mobile.source-preferences.v1"
        language={uiLanguage}
        enabled={productionMode}
      >
        <div
          className={`mobile-shell${readerArticleId !== null || archiveRoute !== undefined ? ' mobile-shell--reader' : ''}`}
          data-wide-language-layout={wideLanguageSelectorLayout ? 'true' : undefined}
        >
          <a
            className="skip-link"
            href="#mobile-main"
            onClick={(event) => {
              event.preventDefault();
              document.getElementById('mobile-main')?.focus();
            }}
          >
            {copy.skipToMain}
          </a>
          <header className="mobile-header">
            <div className="compact-header-row">
              <a
                className="compact-header-menu"
                href={menuIsOpen ? '#home' : '#more'}
                data-testid="header-more-trigger"
                aria-expanded={menuIsOpen}
                aria-current={target === 'more' ? 'page' : undefined}
                aria-label={menuIsOpen ? copy.back : copy.more}
                onClick={(event) => {
                  event.preventDefault();
                  toggleMoreMenu();
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d={menuIsOpen ? 'm14 6-6 6 6 6M8 12h13' : 'M3 6h18M3 12h18M3 18h18'} />
                </svg>
              </a>
              <div className="compact-header-brand">
                <a
                  className="compact-header-title"
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
                  World <span>Revolution</span> News
                </a>
                <a
                  className="header-website-link"
                  href={`https://solinaridao.com/?lang=${encodeURIComponent(uiLanguage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  aria-label={copy.moreAboutProject}
                >
                  solinaridao.com ↗
                </a>
              </div>
              <div className="compact-header-tools">
                <button
                  type="button"
                  className="compact-header-search"
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
                <label
                  className="language-selector"
                  data-wide-language-layout={wideLanguageSelectorLayout ? 'true' : undefined}
                >
                  <span>{copy.languageLabel}</span>
                  <select
                    ref={uiLanguageSelectRef}
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
          </header>
          <main id="mobile-main" tabIndex={-1} aria-labelledby="mobile-page-title">
            {target === 'more' && archiveRoute === undefined && (
              <section className="more-theme-settings">
                <label className="theme-selector">
                  <span id="mobile-theme-label">{copy.colorTheme}</span>
                  <span className="wrn-theme-control">
                    <select
                      aria-labelledby="mobile-theme-label"
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
              (target === 'discover' && directorySection === null)) ? (
              <ProductionContentArea
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
                        load: loadProductionHomeDirectory,
                        onBrowse: () => navigateDirectory('news'),
                        onBrowseSport: () => navigateDirectory('sport'),
                      }
                    : undefined
                }
                regionalEvents={<CurrentRegionalEvents client="mobile" language={uiLanguage} />}
                onCanonical={(id, archive) => {
                  replaceNavigationHistory(
                    { ...window.history.state, wrnCanonicalArticleId: id },
                    `#${archive ? 'archive' : 'article'}/${encodeURIComponent(id)}`,
                  );
                  if (archive) setArchiveRoute(id);
                  else setReaderArticleId(id);
                }}
              >
                {readerArticleId === null &&
                  archiveRoute === undefined &&
                  (target === 'home' || target === 'discover' || target === 'more') &&
                  directoryLinks}
                {target === 'more' && archiveRoute === undefined && (
                  <nav aria-label={copy.moreAreas} className="secondary-navigation">
                    {routeLink('help')}
                    {routeLink('solidarity')}
                    {routeLink('knowledge')}
                    {routeLink('events')}
                    {privacyPolicyLink}
                    {routeLink('home', copy.returnHome)}
                  </nav>
                )}
              </ProductionContentArea>
            ) : archiveRoute !== undefined ? (
              <MobileArchiveView
                fixture={contentRouteAllowed ? archiveFixture : null}
                requestedId={displayedArchiveRoute ?? null}
                onRead={openArchiveReader}
                onClose={closeArchive}
                shareAdapter={shareAdapter}
              />
            ) : readerArticleId !== null ? (
              <MobileReader
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
                readerV2Sidecar={readerV2Sidecar}
                readerV2Snapshot={readerV2Snapshot}
                readerV2TranslationAdapter={mobileReaderV2TranslationAdapter}
                readerV2MediaSafety={readerV2MediaSafety}
                uiLanguage={uiLanguage}
              />
            ) : target === 'home' ? (
              <>
                <section className="feed-heading" aria-labelledby="mobile-page-title">
                  <p className="feed-overline">{copy.pinnedLocalRevision}</p>
                  <h2 id="mobile-page-title" ref={pageHeadingRef} tabIndex={-1}>
                    {copy.homeCurrent}
                  </h2>
                  <p>{copy.homeIntro}</p>
                </section>
                {!fixtureMode && (
                  <KnowledgeRouteBoundary
                    error={directoryCopy.loadError}
                    retry={directoryCopy.reloadView}
                    note={directoryCopy.intro}
                    onRetry={() => window.location.reload()}
                  >
                    <Suspense fallback={<p role="status">{directoryCopy.loading}</p>}>
                      <MobileHomeDirectory
                        language={uiLanguage}
                        onBrowse={() => navigateDirectory('news')}
                      />
                    </Suspense>
                  </KnowledgeRouteBoundary>
                )}
                {isReady && (homeProjection !== null || legacyHomeArticles !== null) ? (
                  <>
                    <section aria-label={copy.localNews} className="home-feed">
                      <p className="feed-revision" data-testid="manifest-revision">
                        {formatUiCopy(copy.manifestRevision, {
                          revision: readyState.manifestRevision,
                        })}
                      </p>
                      {legacyHomeArticles !== null ? (
                        <div className="feed-list" data-home-mode="legacy">
                          {legacyHomeArticles.map((article) => (
                            <MobileHomeArticle
                              key={article.id}
                              article={article}
                              variant="legacy"
                              onRead={openReader}
                              onSaveToggle={toggleSaved}
                              readingActionsDisabled={readingActionsDisabled}
                              saved={
                                visibleReadingState.entries.find(
                                  (entry) => entry.articleId === article.id,
                                )?.savedAt !== undefined
                              }
                            />
                          ))}
                        </div>
                      ) : (
                        <>
                          <section className="home-lead" aria-labelledby="mobile-home-lead-title">
                            <h3 id="mobile-home-lead-title" className="home-section-title">
                              {copy.homeLead}
                            </h3>
                            <MobileHomeArticle
                              article={homeProjection!.lead}
                              variant="lead"
                              onRead={openReader}
                              onSaveToggle={toggleSaved}
                              readingActionsDisabled={readingActionsDisabled}
                              saved={
                                visibleReadingState.entries.find(
                                  (entry) => entry.articleId === homeProjection!.lead.id,
                                )?.savedAt !== undefined
                              }
                            />
                          </section>
                          <section
                            className="home-main-stories"
                            aria-labelledby="mobile-home-main-title"
                          >
                            <h3 id="mobile-home-main-title" className="home-section-title">
                              {copy.homeMainStories}
                            </h3>
                            <div className="home-main-grid">
                              {homeProjection!.main.map((article) => (
                                <MobileHomeArticle
                                  key={article.id}
                                  article={article}
                                  variant="main"
                                  onRead={openReader}
                                  onSaveToggle={toggleSaved}
                                  readingActionsDisabled={readingActionsDisabled}
                                  saved={
                                    visibleReadingState.entries.find(
                                      (entry) => entry.articleId === article.id,
                                    )?.savedAt !== undefined
                                  }
                                />
                              ))}
                            </div>
                          </section>
                          <section className="home-sport" aria-labelledby="mobile-home-sport-title">
                            <h3 id="mobile-home-sport-title" className="home-section-title">
                              {copy.sportAndFanculture}
                            </h3>
                            {homeProjection!.sport === null ? (
                              <div className="home-sport-not-current" role="status">
                                <h4>{copy.sportNotCurrentTitle}</h4>
                                <p>{copy.sportNotCurrentDetail}</p>
                              </div>
                            ) : (
                              <>
                                <MobileHomeArticle
                                  article={homeProjection!.sport.feature}
                                  variant="sport-feature"
                                  category={sportCategoryLabel(
                                    homeProjection!.sport.categories[0] ?? '',
                                  )}
                                  onRead={openReader}
                                  onSaveToggle={toggleSaved}
                                  readingActionsDisabled={readingActionsDisabled}
                                  saved={
                                    visibleReadingState.entries.find(
                                      (entry) =>
                                        entry.articleId === homeProjection!.sport!.feature.id,
                                    )?.savedAt !== undefined
                                  }
                                />
                                <div className="home-sport-secondary-grid">
                                  {homeProjection!.sport.secondary.map((article, index) => (
                                    <MobileHomeArticle
                                      key={article.id}
                                      article={article}
                                      variant="sport-secondary"
                                      category={sportCategoryLabel(
                                        homeProjection!.sport!.categories[index + 1] ?? '',
                                      )}
                                      onRead={openReader}
                                      onSaveToggle={toggleSaved}
                                      readingActionsDisabled={readingActionsDisabled}
                                      saved={
                                        visibleReadingState.entries.find(
                                          (entry) => entry.articleId === article.id,
                                        )?.savedAt !== undefined
                                      }
                                    />
                                  ))}
                                </div>
                                <a
                                  className="home-sport-link"
                                  href="#discover/sport"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    navigateDirectory('sport');
                                  }}
                                >
                                  {copy.allSportNews}
                                </a>
                              </>
                            )}
                          </section>
                        </>
                      )}
                    </section>
                  </>
                ) : (
                  <section
                    className={`feed-status feed-status-${homeStatus}`}
                    aria-labelledby="mobile-status-title"
                  >
                    <h2 id="mobile-status-title">{stateLabels(copy)[homeStatus]}</h2>
                    <p
                      role={homeStatus === 'error' ? 'alert' : 'status'}
                      aria-live="polite"
                      aria-busy={homeStatus === 'loading'}
                    >
                      {statusMessage(copy, homeStatus as Exclude<FeedStateKind, 'ready'>)}
                    </p>
                  </section>
                )}
                {directoryLinks}
                {fixtureMode || requestedState !== 'ready' || query.has('state') ? (
                  <section className="state-panel" aria-labelledby="mobile-states-title">
                    <h2 id="mobile-states-title">{copy.localTestStates}</h2>
                    <p>{copy.localTestStatesDetail}</p>
                    <div className="state-controls" aria-label={copy.chooseFeedState}>
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
                ) : null}
              </>
            ) : target === 'discover' && directorySection !== null ? (
              <KnowledgeRouteBoundary
                key={directorySection}
                error={directoryCopy.loadError}
                retry={directoryCopy.reloadView}
                note={knowledgeCopy.reloadNote}
                onRetry={() => window.location.reload()}
              >
                <Suspense fallback={<p role="status">{directoryCopy.loading}</p>}>
                  <MobileDirectoryRoute
                    key={directorySection}
                    language={uiLanguage}
                    section={directorySection}
                    headingRef={pageHeadingRef}
                    onSectionChange={navigateDirectory}
                  />
                </Suspense>
              </KnowledgeRouteBoundary>
            ) : target === 'discover' ? (
              <>
                {directoryLinks}
                {discoverArticles !== null &&
                discoverIndex !== null &&
                (displayedState === 'ready' || displayedState === 'offline') ? (
                  <>
                    {displayedState === 'offline' ? (
                      <p className="discover-offline" role="status">
                        {copy.offlineFixtureUsable}
                      </p>
                    ) : null}
                    <MobileDiscover
                      articles={discoverArticles}
                      index={discoverIndex}
                      criteria={discoverCriteria}
                      onCriteria={setDiscoverCriteria}
                      onRead={openReader}
                      onSaveToggle={toggleSaved}
                      readingActionsDisabled={readingActionsDisabled}
                      headingRef={pageHeadingRef}
                    />
                  </>
                ) : (
                  <section className="migration-panel" aria-labelledby="mobile-page-title">
                    <p className="feed-overline">{copy.localSearchAndFilters}</p>
                    <h2 id="mobile-page-title" ref={pageHeadingRef} tabIndex={-1}>
                      {copy.discover}
                    </h2>
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
                )}
              </>
            ) : productionMode && (target === 'events' || target === 'media') ? (
              <MobileProductionEventsMediaRoute
                mode={target}
                language={uiLanguage}
                headingRef={pageHeadingRef}
              />
            ) : target === 'events' ? (
              <MobileRegionalEventsPage
                copy={copy}
                language={uiLanguage}
                now={now}
                headingRef={pageHeadingRef}
              />
            ) : target === 'media' ? (
              <>
                <MobileMediaHubPage
                  copy={getMobileMediaCopy(uiLanguage)}
                  language={uiLanguage}
                  now={now}
                  headingRef={pageHeadingRef}
                />
                <VideoSources language={uiLanguage} />
              </>
            ) : target === 'knowledge' ? (
              <KnowledgeRouteBoundary
                error={knowledgeCopy.error}
                retry={knowledgeCopy.reloadView}
                note={knowledgeCopy.reloadNote}
                onRetry={() => window.location.reload()}
              >
                <Suspense
                  fallback={
                    <section className="migration-panel" role="status">
                      {knowledgeCopy.loading}
                    </section>
                  }
                >
                  <MobileKnowledgeRoute language={uiLanguage} headingRef={pageHeadingRef} />
                </Suspense>
              </KnowledgeRouteBoundary>
            ) : target === 'help' || target === 'solidarity' ? (
              <KnowledgeRouteBoundary
                key={target}
                error={supportCopy.loadError}
                retry={supportCopy.reloadView}
                note={supportCopy.reloadNote}
                onRetry={() => window.location.reload()}
              >
                <Suspense
                  fallback={
                    <section className="migration-panel" role="status">
                      {supportCopy.loading}
                    </section>
                  }
                >
                  <MobileSupportRoute
                    key={target}
                    section={target}
                    language={uiLanguage}
                    headingRef={pageHeadingRef}
                    now={supportClock}
                    onNavigationGuardChange={registerSupportGuard}
                  />
                </Suspense>
              </KnowledgeRouteBoundary>
            ) : target === 'following' ? (
              personalizationRuntime === null ? (
                <MobilePersonalizationLoading headingRef={pageHeadingRef} />
              ) : (
                <MobilePersonalizationHub
                  articles={discoverHasContent ? discoverArticles : null}
                  discoverIndex={discoverHasContent ? discoverIndex : null}
                  onRead={openReader}
                  headingRef={pageHeadingRef}
                  store={personalizationRuntime.store}
                  loaded={personalizationRuntime.loaded}
                  productionResults={
                    productionMode ? (
                      <ProductionContentArea
                        target="following"
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
                        preferences={
                          personalizationRuntime.loaded.kind === 'ready'
                            ? personalizationRuntime.loaded.state
                            : undefined
                        }
                        embedded
                      />
                    ) : undefined
                  }
                  onLoaded={(loaded) =>
                    setPersonalizationRuntime((current) =>
                      current === null ? current : Object.freeze({ ...current, loaded }),
                    )
                  }
                />
              )
            ) : target === 'saved' ? (
              <MobileSavedView
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
            ) : (
              <section className="migration-panel" aria-labelledby="mobile-page-title">
                <p className="feed-overline">{copy.inProgress}</p>
                <h2 id="mobile-page-title" ref={pageHeadingRef} tabIndex={-1}>
                  {navigationLabel(target)}
                </h2>
                {target !== 'more' ? (
                  <>
                    <p role="status">{copy.notMigrated}</p>
                    <p>{copy.laterSliceDetail}</p>
                  </>
                ) : null}
                {target === 'more' ? (
                  <>
                    <MobileContentOfflinePanel
                      result={contentResult}
                      operationResult={contentOperationResult}
                      busy={contentOperation !== null}
                      language={uiLanguage}
                      onAction={requestContentAction}
                    />
                    <nav aria-label={copy.moreAreas} className="secondary-navigation">
                      <button
                        type="button"
                        className="reader-entry"
                        data-archive-entry-trigger="mobile-more-archive"
                        onClick={(event) => openArchive(event.currentTarget)}
                      >
                        {copy.newsArchive}
                      </button>
                      {routeLink('help')}
                      {routeLink('solidarity')}
                      {routeLink('knowledge')}
                      {routeLink('events')}
                      {privacyPolicyLink}
                      {routeLink('home', copy.returnHome)}
                    </nav>
                    {directoryLinks}
                  </>
                ) : (
                  <span className="return-link">{routeLink('home', copy.returnHome)}</span>
                )}
              </section>
            )}
            <footer className="mobile-footer">
              {!productionMode && <p>{copy.mobilePreviewFooter}</p>}
              <div className="mobile-project-links" aria-label={copy.projectAndSupport}>
                <a
                  className="mobile-external-link"
                  href="https://solinaridao.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                >
                  {copy.moreAboutProject}
                </a>
                <p>
                  {copy.voluntarySupport}{' '}
                  <a
                    className="mobile-external-link"
                    href="https://www.paypal.com/ncp/payment/6FSV9FEN4X7VS"
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                  >
                    {copy.support}
                  </a>{' '}
                  – {copy.externalPaymentNotice}
                </p>
              </div>
            </footer>
          </main>
          <nav aria-label={copy.mobileMainNavigation} className="mobile-primary-nav">
            {mobilePrimaryNavigationIds.map((id) => (
              <span key={id}>{routeLink(id)}</span>
            ))}
          </nav>
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
            <MobileContentOfflineConfirmation
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
