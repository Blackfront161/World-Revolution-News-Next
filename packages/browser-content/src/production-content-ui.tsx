import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import {
  formatUiCopy,
  getUiCopy,
  isUiLanguage,
  uiLanguageNativeNames,
  type UiLanguage,
} from '@wrn/ui-language';
import {
  getProductionActivityCopy,
  getProductionContentCopy,
} from '@wrn/ui-language/production-content';
import { getDirectoryCopy } from '@wrn/ui-language/directory';
import type {
  LocalPersonalizationStateV1,
  ProductionArticleV1,
  ProductionReaderImageBlockV2,
} from '@wrn/content-contracts';
import {
  type createProductionContentOfflineHook,
  type ProductionOfflineUiCall,
} from './content-offline-ui';
import {
  type createProductionReadingStateStore,
  type ProductionReadingStateChange,
} from './production-reading-state';
import {
  listProductionArticles,
  matchesProductionPreferences,
  resolveProductionArticleView,
  type ProductionArticleView,
} from './production-content-view';
import { ProductionReaderBlocks } from './production-reader-blocks';
import type { ProductionTranslationAdapter } from './production-translation';
import { ProductionPodcastPanel, type ProductionDeviceSpeechAdapter } from './production-podcast';
import type { ProductionOnlinePodcastAdapter } from './production-podcast-online';
import { ProductionHome, type ProductionHomeDirectory } from './production-home';
import { ProductionSelectionExplanation } from './production-selection-explanation';
import { useProductionUserActivity } from './production-user-activity/use-activity';
import { ProductionActivityNotice, ProductionActivityPanel } from './production-user-activity/ui';
import { browserActivityNotifications } from './production-user-activity/notifications';
import type { ActivityClient } from './production-user-activity/store';
import { projectSourcePreferences } from '@wrn/domain';
import {
  useSourcePreferences,
  SourceProfile,
  SourcePreferencesPanel,
  SourcePreferencesNotice,
  HiddenSourceNotice,
} from './source-preferences-ui';
import './production-content-ui.css';

type DialogState =
  | { kind: 'external'; url: string; identity: string; trigger: HTMLButtonElement }
  | { kind: 'clear' | 'rollback' | 'clear-reading'; trigger: HTMLButtonElement };

function discoverRegionLabel(value: string, copy: ReturnType<typeof getUiCopy>): string {
  const labels: Readonly<Record<string, string>> = {
    africa: copy.personalizationRegionAfrica,
    asia: copy.personalizationRegionAsia,
    europe: copy.personalizationRegionEurope,
    global: copy.personalizationRegionGlobal,
    'latin-america-caribbean': copy.personalizationRegionLatinAmericaCaribbean,
    'middle-east-north-africa': copy.personalizationRegionMiddleEastNorthAfrica,
    'north-america': copy.personalizationRegionNorthAmerica,
    oceania: copy.personalizationRegionOceania,
  };
  return labels[value] ?? value;
}

/** Applies only to a freshly guarded, exact resolved article view. */
export function isPermittedProductionExternalUrl(view: ProductionArticleView | null, url: string) {
  return (
    view?.kind === 'ready' &&
    (url === view.article.originalUrl ||
      url === view.article.rights.licenseUrl ||
      view.blocks.some((block) => block.kind === 'image' && block.licenseUrl === url))
  );
}

function ProductionDialog({
  title,
  children,
  trigger,
  onClose,
}: {
  title: string;
  children: ReactNode;
  trigger: HTMLButtonElement;
  onClose(): void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      queueMicrotask(() =>
        (trigger.isConnected
          ? trigger
          : ((trigger.id ? document.getElementById(trigger.id) : null) ??
            document.querySelector<HTMLElement>('main'))
        )?.focus(),
      );
    };
  }, [trigger]);
  return createPortal(
    <dialog
      ref={ref}
      className="source-dialog production-dialog"
      aria-labelledby="production-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        } else if (event.key === 'Tab') {
          const controls = [
            ...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'),
          ];
          const first = controls[0];
          const last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <h2 id="production-dialog-title">{title}</h2>
      {children}
    </dialog>,
    document.body,
  );
}

type ProductionContentAreaDependencies = Readonly<{
  useProductionContentOfflineController: ReturnType<typeof createProductionContentOfflineHook>;
  createProductionReadingStateStore: () => ReturnType<typeof createProductionReadingStateStore>;
  productionReadingStateStorageKey: string;
  headingId: string;
  archiveTriggerId: string;
  embeddedCardHeadingLevel?: 3 | 4;
  translationAdapter?: ProductionTranslationAdapter | null;
  deviceSpeechAdapter?: ProductionDeviceSpeechAdapter | null;
  onlinePodcastAdapter?: ProductionOnlinePodcastAdapter | null;
  activityClient?: ActivityClient | null;
  activityNotificationsEnabled?: () => boolean;
}>;
export function createProductionContentArea({
  useProductionContentOfflineController,
  createProductionReadingStateStore,
  productionReadingStateStorageKey,
  headingId,
  archiveTriggerId,
  embeddedCardHeadingLevel = 4,
  translationAdapter = null,
  deviceSpeechAdapter = null,
  onlinePodcastAdapter = null,
  activityClient = null,
  activityNotificationsEnabled = () => true,
}: ProductionContentAreaDependencies) {
  return function ProductionContentArea({
    target,
    articleId,
    archiveRoute,
    language,
    headingRef,
    onRead,
    onArchiveRead,
    onCloseReader,
    onCloseArchive,
    onOpenArchive,
    shareAdapter,
    children,
    preferences,
    embedded = false,
    onCanonical,
    homeDirectory,
    regionalEvents,
  }: {
    target: string;
    articleId: string | null;
    archiveRoute: string | null | undefined;
    language: UiLanguage;
    headingRef: RefObject<HTMLHeadingElement | null>;
    onRead(id: string, trigger: HTMLButtonElement): void;
    onArchiveRead(id: string, trigger: HTMLButtonElement): void;
    onCloseReader(): void;
    onCloseArchive(): void;
    onOpenArchive(trigger: HTMLButtonElement): void;
    shareAdapter: { share(url: string): Promise<void> };
    children?: ReactNode;
    regionalEvents?: ReactNode;
    preferences?: LocalPersonalizationStateV1 | undefined;
    embedded?: boolean;
    onCanonical?(id: string, archive: boolean): void;
    homeDirectory?:
      | Readonly<{
          load(signal: AbortSignal): Promise<ProductionHomeDirectory>;
          onBrowse(): void;
          onBrowseSport?(): void;
        }>
      | undefined;
  }) {
    const copy = getUiCopy(language);
    const text = getProductionContentCopy(language);
    const directoryCopy = getDirectoryCopy(language);
    const sourcePreferences = useSourcePreferences();
    const { result, operation, invoke } = useProductionContentOfflineController();
    const [readingStore] = useState(() => createProductionReadingStateStore());
    const [reading, setReading] = useState(() => readingStore.load());
    const [message, setMessage] = useState<string | null>(null);
    const [shareMessage, setShareMessage] = useState<{
      identity: string;
      route: string;
      text: string;
      url?: string;
    } | null>(null);
    const shareAttempt = useRef(0);
    const [query, setQuery] = useState('');
    const [filterRegion, setFilterRegion] = useState('');
    const [filterTopic, setFilterTopic] = useState('');
    const [filterSource, setFilterSource] = useState('');
    const [filterLanguage, setFilterLanguage] = useState('');
    const [filterFormat, setFilterFormat] = useState('');
    const queryInput = useRef<HTMLInputElement>(null);
    const [dialog, setDialog] = useState<DialogState | null>(null);
    const [guardedRoute, setGuardedRoute] = useState<string | null>(null);
    const bootstrapped = useRef(false);
    const routeKey = `${target}:${articleId ?? ''}:${archiveRoute === undefined ? '-' : (archiveRoute ?? '*')}`;
    useEffect(
      () => () => {
        shareAttempt.current++;
      },
      [routeKey],
    );
    const routeRef = useRef(routeKey);
    routeRef.current = routeKey;
    const blocksRef = useRef<HTMLDivElement>(null);
    const readerHeading = useRef<HTMLHeadingElement>(null);
    const routeArticle = typeof archiveRoute === 'string' ? archiveRoute : articleId;

    useEffect(() => {
      if (target !== 'discover') {
        setQuery('');
        setFilterRegion('');
        setFilterTopic('');
        setFilterSource('');
        setFilterLanguage('');
        setFilterFormat('');
      }
    }, [target]);
    useEffect(() => {
      let active = true;
      setGuardedRoute(null);
      setDialog(null);
      setMessage(null);
      setShareMessage(null);
      void (async () => {
        let checked = await invoke('guard');
        if (!active || routeRef.current !== routeKey) return;
        if (
          !bootstrapped.current &&
          checked?.control?.generation === 0 &&
          checked.control.activeKey === null
        ) {
          bootstrapped.current = true;
          checked = await invoke('check');
        }
        if (active && routeRef.current === routeKey && checked !== null) setGuardedRoute(routeKey);
      })();
      return () => {
        active = false;
      };
    }, [routeKey, invoke]);

    useEffect(() => {
      let active = true;
      const resume = () => {
        setGuardedRoute(null);
        setDialog(null);
        const route = routeRef.current;
        void invoke('resumeGuard').then((checked) => {
          if (active && checked !== null && route === routeRef.current) setGuardedRoute(route);
        });
      };
      const visibility = () => {
        if (document.visibilityState === 'visible') resume();
        else {
          setGuardedRoute(null);
          setDialog(null);
        }
      };
      const timer =
        result?.expiresAt == null
          ? undefined
          : window.setTimeout(resume, Math.max(0, result.expiresAt + 1 - Date.now()));
      window.addEventListener('focus', resume);
      window.addEventListener('pageshow', resume);
      window.addEventListener('popstate', resume);
      window.addEventListener('hashchange', resume);
      document.addEventListener('visibilitychange', visibility);
      return () => {
        active = false;
        window.clearTimeout(timer);
        window.removeEventListener('focus', resume);
        window.removeEventListener('pageshow', resume);
        window.removeEventListener('popstate', resume);
        window.removeEventListener('hashchange', resume);
        document.removeEventListener('visibilitychange', visibility);
      };
    }, [invoke, result?.expiresAt]);
    useEffect(() => {
      const reload = (event: StorageEvent) => {
        if (event.key === productionReadingStateStorageKey || event.key === null)
          setReading(readingStore.load());
      };
      window.addEventListener('storage', reload);
      return () => window.removeEventListener('storage', reload);
    }, [readingStore]);

    const allowed =
      guardedRoute === routeKey &&
      operation === null &&
      result?.status === 'active' &&
      result.runtime !== null &&
      result.expiresAt !== null &&
      Date.now() <= result.expiresAt;
    const visible = allowed ? result : null;
    const identity =
      visible === null
        ? ''
        : `${visible.activeKey}:${visible.safety?.revision}:${visible.expiresAt}`;
    const identityRef = useRef(identity);
    // Controller authority survives the brief React guard-remount batch. Feedback
    // is rendered only when the same identity also passes the visible UI guard.
    const controllerIdentity =
      result?.status === 'active' && result.runtime !== null && result.expiresAt !== null
        ? `${result.activeKey}:${result.safety?.revision}:${result.expiresAt}`
        : '';
    identityRef.current = controllerIdentity;
    useEffect(() => {
      setShareMessage((previous) =>
        previous !== null && previous.identity !== controllerIdentity ? null : previous,
      );
    }, [controllerIdentity]);
    useLayoutEffect(() => {
      if (dialog?.kind === 'external' && dialog.identity !== identity) setDialog(null);
    }, [dialog, identity]);
    const view = routeArticle === null ? null : resolveProductionArticleView(visible, routeArticle);
    useEffect(() => {
      if (view?.kind === 'ready' && view.redirected)
        onCanonical?.(view.article.id, archiveRoute !== undefined);
    }, [view, onCanonical, archiveRoute]);
    const selectedEntry =
      view?.kind === 'ready'
        ? reading.state.entries.find((entry) => entry.articleId === view.article.id)
        : undefined;
    const protectedReading = reading.kind === 'read-only';
    const allArticles = useMemo(
      () => listProductionArticles(visible, archiveRoute !== undefined || target === 'saved'),
      [visible, archiveRoute, target],
    );
    const discoverEntries = useMemo(
      () =>
        new Map(
          (visible?.runtime?.documents.discoverIndex.entries ?? []).map((entry) => [
            entry.articleId,
            entry,
          ]),
        ),
      [visible],
    );
    // Do not expose hidden sources as Discover filter choices.
    const discoverArticles =
      target === 'discover'
        ? projectSourcePreferences(
            allArticles,
            sourcePreferences.state,
            'production',
            (article) => [article.source.id],
          )
        : allArticles;
    const discoverRegions = useMemo(
      () =>
        [
          ...new Set(
            discoverArticles.flatMap((article) => discoverEntries.get(article.id)?.region ?? []),
          ),
        ].sort((left, right) => left.localeCompare(right, language)),
      [discoverArticles, discoverEntries, language],
    );
    const discoverTopics = useMemo(
      () =>
        [
          ...new Set(
            discoverArticles.flatMap((article) => discoverEntries.get(article.id)?.topics ?? []),
          ),
        ].sort((left, right) => left.localeCompare(right, language)),
      [discoverArticles, discoverEntries, language],
    );
    const discoverSources = useMemo(
      () =>
        [
          ...new Map(
            discoverArticles.map((article) => [article.source.id, article.source.name]),
          ).entries(),
        ].sort(([, left], [, right]) => left.localeCompare(right, language)),
      [discoverArticles, language],
    );
    const discoverLanguages = useMemo(
      () =>
        [...new Set(discoverArticles.map((article) => article.originalLanguage))].sort(
          (left, right) => left.localeCompare(right, language),
        ),
      [discoverArticles, language],
    );
    const discoverFormats = useMemo(
      () =>
        [
          ...new Set(
            discoverArticles.flatMap((article) => discoverEntries.get(article.id)?.format ?? []),
          ),
        ].sort((left, right) => left.localeCompare(right, language)),
      [discoverArticles, discoverEntries, language],
    );
    useEffect(() => {
      if (filterRegion !== '' && !discoverRegions.includes(filterRegion)) setFilterRegion('');
      if (filterTopic !== '' && !discoverTopics.includes(filterTopic)) setFilterTopic('');
      if (filterSource !== '' && !discoverSources.some(([id]) => id === filterSource))
        setFilterSource('');
      if (filterLanguage !== '' && !discoverLanguages.includes(filterLanguage))
        setFilterLanguage('');
      if (filterFormat !== '' && !discoverFormats.includes(filterFormat)) setFilterFormat('');
    }, [
      discoverFormats,
      discoverLanguages,
      discoverRegions,
      discoverSources,
      discoverTopics,
      filterFormat,
      filterLanguage,
      filterRegion,
      filterSource,
      filterTopic,
    ]);
    const activeDiscoverFilterCount = [
      filterRegion,
      filterTopic,
      filterSource,
      filterLanguage,
      filterFormat,
    ].filter(Boolean).length;
    const resetDiscoverFilters = () => {
      setQuery('');
      setFilterRegion('');
      setFilterTopic('');
      setFilterSource('');
      setFilterLanguage('');
      setFilterFormat('');
      queueMicrotask(() => queryInput.current?.focus());
    };
    const articles = projectSourcePreferences(
      discoverArticles.filter((article) => {
        if (
          target === 'saved' &&
          !reading.state.entries.some((entry) => entry.articleId === article.id)
        )
          return false;
        if (preferences && !matchesProductionPreferences(article, visible, preferences))
          return false;
        if (target === 'discover') {
          const entry = discoverEntries.get(article.id);
          if (
            entry === undefined ||
            (filterRegion !== '' && entry.region !== filterRegion) ||
            (filterTopic !== '' && !entry.topics.includes(filterTopic)) ||
            (filterSource !== '' && article.source.id !== filterSource) ||
            (filterLanguage !== '' && article.originalLanguage !== filterLanguage) ||
            (filterFormat !== '' && entry.format !== filterFormat)
          )
            return false;
        }
        return `${article.title} ${article.teaser} ${article.source.name} ${article.tags.join(' ')}`
          .toLocaleLowerCase(language)
          .includes(query.toLocaleLowerCase(language).trim());
      }),
      sourcePreferences.state,
      'production',
      (article) => [article.source.id],
      { includeHidden: target === 'saved' || archiveRoute !== undefined },
    );
    const hasPersonalSelection = Boolean(
      preferences &&
      (preferences.interestIds.length > 0 ||
        preferences.regionIds.length > 0 ||
        preferences.contentLanguageIds.length > 0),
    );
    const followedSources = new Set(
      sourcePreferences.state.choices
        .filter((choice) => choice.catalog === 'production' && choice.action === 'follow')
        .map((choice) => choice.sourceId),
    );
    const activityPersonalized = hasPersonalSelection || followedSources.size > 0;
    const selectedIds = new Set(
      articles
        .filter((article) => hasPersonalSelection || followedSources.has(article.source.id))
        .map((article) => article.id),
    );
    const activityCopy = getProductionActivityCopy(language);
    const activityNotifications = browserActivityNotifications(
      () => ({ title: activityCopy.notificationTitle, body: activityCopy.notificationBody }),
      activityNotificationsEnabled(),
    );
    const activity = useProductionUserActivity(
      activityClient,
      {
        key: `${routeKey}:${identity}:${activityPersonalized}:${[...selectedIds].sort().join(',')}`,
        active: allowed,
        following: target === 'following' && routeArticle === null,
        personalized: activityPersonalized,
        articles: (visible?.runtime?.documents.articles.articles ?? [])
          .filter((article) => resolveProductionArticleView(visible, article.id).kind === 'ready')
          .map((article) => ({
            id: article.id,
            admittedContentSha256:
              visible?.runtime?.documents.admission.entries.find(
                (entry) => entry.articleId === article.id,
              )?.admittedContentSha256 ?? null,
            selected: selectedIds.has(article.id),
            readOrSaved: reading.state.entries.some(
              (entry) =>
                entry.articleId === article.id &&
                (entry.readAt !== undefined ||
                  entry.savedAt !== undefined ||
                  entry.progress !== undefined),
            ),
          })),
      },
      activityNotifications,
    );
    const activityNotice = (articleId: string, showNew = false) =>
      activityClient === null ? null : (
        <ProductionActivityNotice
          activity={activity}
          articleId={articleId}
          showNew={showNew}
          language={language}
          digest={
            visible?.runtime?.documents.admission.entries.find(
              (entry) => entry.articleId === articleId,
            )?.admittedContentSha256 ?? null
          }
        />
      );
    const run = useCallback(
      async (action: ProductionOfflineUiCall) => {
        const route = routeRef.current;
        setGuardedRoute(null);
        setDialog(null);
        setMessage(null);
        setShareMessage(null);
        const next = await invoke(action);
        if (next !== null && routeRef.current === route) setGuardedRoute(route);
        return next;
      },
      [invoke],
    );
    const change = (action: ProductionReadingStateChange, success: string) => {
      const next = readingStore.change(action);
      setReading(next);
      setMessage(
        next.kind === 'ready'
          ? success
          : next.kind === 'read-only'
            ? copy.localStateProtected
            : next.kind === 'capacity-conflict'
              ? text.capacity
              : copy.localStateNotSaved,
      );
    };
    const toggleSave = (article: ProductionArticleV1) => {
      const saved =
        reading.state.entries.find((entry) => entry.articleId === article.id)?.savedAt !==
        undefined;
      change(
        saved
          ? { kind: 'unsave', articleId: article.id }
          : { kind: 'save', articleId: article.id, time: new Date().toISOString() },
        saved ? copy.savedRemoved : copy.savedAdded,
      );
    };
    const openExternal = async (
      url: string,
      trigger: HTMLButtonElement,
      explicitArticleId?: string,
    ) => {
      const route = routeRef.current;
      const checked = await run('guard');
      const refreshed =
        (explicitArticleId ?? routeArticle) === null
          ? null
          : resolveProductionArticleView(checked, explicitArticleId ?? routeArticle!);
      const permitted = isPermittedProductionExternalUrl(refreshed, url);
      if (routeRef.current !== route || refreshed?.kind !== 'ready' || !permitted) return;
      setDialog({
        kind: 'external',
        url,
        trigger,
        identity: `${checked?.activeKey}:${checked?.safety?.revision}:${checked?.expiresAt}`,
      });
    };
    const share = async () => {
      const attempt = ++shareAttempt.current;
      const route = routeRef.current;
      const checked = await run('guard');
      const refreshed =
        routeArticle === null ? null : resolveProductionArticleView(checked, routeArticle);
      if (
        routeRef.current !== route ||
        refreshed?.kind !== 'ready' ||
        refreshed.shareUrl === null ||
        checked?.expiresAt == null
      )
        return;
      const authority = `${checked.activeKey}:${checked.safety?.revision}:${checked.expiresAt}`;
      const publish = (value: string, url?: string) => {
        if (
          shareAttempt.current === attempt &&
          routeRef.current === route &&
          identityRef.current === authority &&
          Date.now() <= checked.expiresAt!
        )
          setShareMessage({
            identity: authority,
            route,
            text: value,
            ...(url === undefined ? {} : { url }),
          });
      };
      try {
        await shareAdapter.share(refreshed.shareUrl);
        publish(copy.canonicalShareReady);
      } catch {
        publish(copy.canonicalShareError, refreshed.shareUrl);
      }
    };
    const restoredPosition = useRef<string | null>(null);
    const observedPosition = useRef(0.01);
    useEffect(() => {
      restoredPosition.current = null;
      observedPosition.current = 0.01;
    }, [routeKey]);
    useEffect(() => {
      const observe = () => {
        const blocks = blocksRef.current;
        if (!blocks || !allowed) return;
        const top = blocks.getBoundingClientRect().top + window.scrollY;
        // Returning to the header controls must retain the last text position.
        if (window.scrollY < top) return;
        observedPosition.current = Math.max(
          0.01,
          Math.min(1, (window.scrollY - top) / Math.max(1, blocks.offsetHeight)),
        );
      };
      window.addEventListener('scroll', observe, { passive: true });
      return () => window.removeEventListener('scroll', observe);
    }, [allowed]);
    useEffect(() => {
      if (view?.kind !== 'ready' || restoredPosition.current === view.article.id) return;
      restoredPosition.current = view.article.id;
      readerHeading.current?.focus();
      if (selectedEntry?.progress !== undefined) {
        const fraction = selectedEntry.progress.fraction;
        observedPosition.current = fraction;
        const blocks = blocksRef.current;
        if (blocks)
          window.scrollTo({
            top: Math.max(
              0,
              blocks.getBoundingClientRect().top + window.scrollY + fraction * blocks.offsetHeight,
            ),
            behavior: 'instant',
          });
      }
    }, [view, selectedEntry?.progress]);

    const heading =
      archiveRoute !== undefined
        ? copy.newsArchive
        : target === 'saved'
          ? copy.saved
          : target === 'discover'
            ? copy.discover
            : target === 'more'
              ? copy.more
              : copy.homeCurrent;
    const status =
      result?.reason === 'transport-or-validation' && allowed
        ? text.updateFailed
        : allowed
          ? text.offlineReady
          : operation !== null || result === null
            ? copy.loading
            : text.needsCheck;
    const readingNotice = protectedReading
      ? copy.localStateProtected
      : (message ??
        (shareMessage?.identity === identity && shareMessage.route === routeKey
          ? shareMessage.text
          : null));
    const shareFallbackUrl =
      shareMessage?.identity === identity && shareMessage.route === routeKey
        ? (shareMessage.url ?? null)
        : null;
    const renderArticleCard = (
      article: ProductionArticleV1,
      role?: 'lead' | 'main' | 'further',
    ) => {
      const readingEntry = reading.state.entries.find((entry) => entry.articleId === article.id);
      const saved = readingEntry?.savedAt !== undefined;
      const Title = embedded && embeddedCardHeadingLevel === 4 ? 'h4' : 'h3';
      const homeView =
        role === 'lead' || role === 'main'
          ? resolveProductionArticleView(visible, article.id)
          : null;
      const homeImages =
        homeView?.kind === 'ready'
          ? homeView.blocks
              .filter((block): block is ProductionReaderImageBlockV2 => block.kind === 'image')
              .slice(0, 1)
          : [];
      return (
        <article
          key={article.id}
          className={`production-card${role === 'main' || role === 'further' ? ' production-card--compact' : ''}`}
          data-home-role={role}
        >
          <Title lang={article.originalLanguage}>{article.title}</Title>
          {role !== 'main' && <p lang={article.originalLanguage}>{article.teaser}</p>}
          {homeImages.length > 0 && (
            <div
              className={`production-home-image${role === 'main' ? ' production-home-image--compact' : ''}`}
            >
              <ProductionReaderBlocks
                blocks={homeImages}
                onExternal={(url, trigger) => void openExternal(url, trigger, article.id)}
              />
            </div>
          )}
          <p>
            {article.source.name} ·{' '}
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString(language)}
            </time>{' '}
            · {article.originalLanguage}
          </p>
          {target === 'saved' && (
            <HiddenSourceNotice catalog="production" sourceIds={[article.source.id]} />
          )}
          <SourceProfile
            catalog="production"
            sourceId={article.source.id}
            name={article.source.name}
          />
          {target === 'following' && (
            <ProductionSelectionExplanation
              article={article}
              result={visible}
              preferences={preferences}
              language={language}
            />
          )}
          {(target === 'following' || target === 'saved') &&
            activityNotice(article.id, target === 'following')}
          <div className="production-actions">
            <button
              type="button"
              data-reader-trigger={article.id}
              data-archive-trigger={article.id}
              onClick={(event) =>
                (archiveRoute !== undefined ? onArchiveRead : onRead)(
                  article.id,
                  event.currentTarget,
                )
              }
            >
              {copy.readArticle}
            </button>
            <button
              type="button"
              disabled={protectedReading}
              aria-pressed={saved}
              onClick={() => toggleSave(article)}
            >
              {saved ? copy.removeFromSaved : copy.saveForLater}
            </button>
            {target === 'saved' && (
              <button
                type="button"
                disabled={protectedReading}
                aria-pressed={readingEntry?.readAt !== undefined}
                onClick={() =>
                  change(
                    readingEntry?.readAt
                      ? { kind: 'unread', articleId: article.id }
                      : { kind: 'read', articleId: article.id, time: new Date().toISOString() },
                    readingEntry?.readAt ? copy.unreadMarked : copy.readMarked,
                  )
                }
              >
                {readingEntry?.readAt ? copy.markUnread : copy.markRead}
              </button>
            )}
            {target === 'saved' && readingEntry?.progress && (
              <button
                type="button"
                disabled={protectedReading}
                onClick={() =>
                  change({ kind: 'reset-progress', articleId: article.id }, copy.progressReset)
                }
              >
                {copy.resetProgress}
              </button>
            )}
          </div>
        </article>
      );
    };
    return (
      <section
        className="production-content"
        data-testid="production-content"
        aria-busy={operation !== null}
      >
        <SourcePreferencesNotice />
        {routeArticle !== null ? (
          <>
            <button
              type="button"
              onClick={archiveRoute !== undefined ? onCloseArchive : onCloseReader}
            >
              {copy.back}
            </button>
            {view?.kind === 'ready' ? (
              <article data-testid="production-reader" lang={view.article.originalLanguage}>
                <h2 id={headingId} ref={readerHeading} tabIndex={-1}>
                  {view.article.title}
                </h2>
                <p className="production-attribution">
                  {view.article.source.name} · {view.article.source.authors.join(', ')} ·{' '}
                  <time dateTime={view.article.publishedAt}>
                    {new Date(view.article.publishedAt).toLocaleDateString(language)}
                  </time>{' '}
                  · {view.article.originalLanguage}
                </p>
                <HiddenSourceNotice catalog="production" sourceIds={[view.article.source.id]} />
                {activityNotice(view.article.id)}
                <SourceProfile
                  catalog="production"
                  sourceId={view.article.source.id}
                  name={view.article.source.name}
                />
                <dl className="production-rights" lang={language}>
                  <dt>{view.article.contentCompleteness === 'full' ? text.full : text.partial}</dt>
                  <dd>{view.article.source.name}</dd>
                  <dt>{text.license}</dt>
                  <dd>
                    <button
                      type="button"
                      id={`production-license-${view.article.id}`}
                      onClick={(event) =>
                        void openExternal(view.article.rights.licenseUrl, event.currentTarget)
                      }
                    >
                      {view.article.rights.licenseId}
                    </button>
                  </dd>
                  <dt>{text.transformation}</dt>
                  <dd>
                    {view.article.transformation.status === 'original'
                      ? text.original
                      : text.transformed}
                  </dd>
                  <dt>{text.reference}</dt>
                  <dd lang={view.article.originalLanguage}>
                    {view.article.transformation.reference}
                  </dd>
                </dl>
                <div className="production-actions" lang={language}>
                  <button
                    type="button"
                    disabled={protectedReading}
                    aria-pressed={selectedEntry?.savedAt !== undefined}
                    onClick={() => toggleSave(view.article)}
                  >
                    {selectedEntry?.savedAt ? copy.removeFromSaved : copy.saveForLater}
                  </button>
                  <button
                    type="button"
                    disabled={protectedReading}
                    aria-pressed={selectedEntry?.readAt !== undefined}
                    onClick={() =>
                      change(
                        selectedEntry?.readAt
                          ? { kind: 'unread', articleId: view.article.id }
                          : {
                              kind: 'read',
                              articleId: view.article.id,
                              time: new Date().toISOString(),
                            },
                        selectedEntry?.readAt ? copy.unreadMarked : copy.readMarked,
                      )
                    }
                  >
                    {selectedEntry?.readAt ? copy.markUnread : copy.markRead}
                  </button>
                  <button
                    type="button"
                    disabled={protectedReading}
                    onClick={() => {
                      change(
                        {
                          kind: 'progress',
                          articleId: view.article.id,
                          fraction: observedPosition.current,
                          time: new Date().toISOString(),
                        },
                        text.positionSaved,
                      );
                    }}
                  >
                    {text.savePosition}
                  </button>
                  {selectedEntry?.progress && (
                    <button
                      type="button"
                      disabled={protectedReading}
                      onClick={() =>
                        change(
                          { kind: 'reset-progress', articleId: view.article.id },
                          copy.progressReset,
                        )
                      }
                    >
                      {copy.resetProgress}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(event) =>
                      void openExternal(view.article.originalUrl, event.currentTarget)
                    }
                    id={`production-original-${view.article.id}`}
                  >
                    {copy.openOriginalSource}
                  </button>
                  {view.shareUrl !== null && (
                    <button type="button" onClick={() => void share()}>
                      {copy.share}
                    </button>
                  )}
                </div>
                <ProductionPodcastPanel
                  title={view.article.title}
                  blocks={view.blocks}
                  contentLanguage={view.article.originalLanguage}
                  language={language}
                  adapter={deviceSpeechAdapter}
                  onlineAdapter={onlinePodcastAdapter}
                  authority={
                    view.translationAuthority
                      ? {
                          articleId: view.translationAuthority.articleId,
                          articleRevision: view.translationAuthority.articleRevision,
                          expiresAt: view.translationAuthority.expiresAt,
                        }
                      : null
                  }
                />
                <div className="production-reader-blocks" ref={blocksRef}>
                  <ProductionReaderBlocks
                    blocks={view.blocks}
                    translation={
                      view.translationAuthority
                        ? {
                            authority: view.translationAuthority,
                            route: routeKey,
                            sourceLanguage: view.article.originalLanguage,
                            language,
                            adapter: translationAdapter,
                          }
                        : undefined
                    }
                    onExternal={(url, trigger) => void openExternal(url, trigger)}
                  />
                </div>
              </article>
            ) : (
              <>
                <h2 id={headingId} ref={headingRef} tabIndex={-1}>
                  {guardedRoute !== routeKey || operation !== null || result === null
                    ? copy.loading
                    : copy.archiveUnavailable}
                </h2>
                <p role="status">
                  {guardedRoute !== routeKey || operation !== null || result === null
                    ? copy.loading
                    : text.unavailable}
                </p>
              </>
            )}
          </>
        ) : (
          <>
            {!embedded && (
              <h2 id={headingId} ref={headingRef} tabIndex={-1}>
                {heading}
              </h2>
            )}
            {target === 'home' && <p>{text.intro}</p>}
            {target === 'saved' && <p>{copy.savedIntro}</p>}
            {(target === 'more' || target === 'following') && (
              <SourcePreferencesPanel
                knownSources={allArticles.map((article) => ({
                  catalog: 'production',
                  sourceId: article.source.id,
                  name: article.source.name,
                }))}
              />
            )}
            {archiveRoute !== undefined && (
              <button type="button" onClick={onCloseArchive}>
                {copy.backToMore}
              </button>
            )}
            {target !== 'more' && (
              <>
                {target === 'discover' && (
                  <div className="production-filters">
                    <label>
                      {directoryCopy.search}
                      <input
                        ref={queryInput}
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </label>
                    <details className="production-filter-details">
                      <summary>
                        {formatUiCopy(copy.filtersWithCount, {
                          count: String(activeDiscoverFilterCount),
                        })}
                      </summary>
                      <div className="production-filter-details__options">
                        <label>
                          {copy.region}
                          <select
                            value={filterRegion}
                            onChange={(event) => setFilterRegion(event.target.value)}
                          >
                            <option value="">{copy.allRegions}</option>
                            {discoverRegions.map((value) => (
                              <option key={value} value={value}>
                                {discoverRegionLabel(value, copy)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          {copy.topic}
                          <select
                            value={filterTopic}
                            onChange={(event) => setFilterTopic(event.target.value)}
                          >
                            <option value="">{copy.allTopics}</option>
                            {discoverTopics.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          {copy.source}
                          <select
                            value={filterSource}
                            onChange={(event) => setFilterSource(event.target.value)}
                          >
                            <option value="">{copy.allSources}</option>
                            {discoverSources.map(([id, name]) => (
                              <option key={id} value={id}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          {copy.originalLanguage}
                          <select
                            value={filterLanguage}
                            onChange={(event) => setFilterLanguage(event.target.value)}
                          >
                            <option value="">{copy.allLanguages}</option>
                            {discoverLanguages.map((value) => (
                              <option key={value} value={value}>
                                {isUiLanguage(value) ? uiLanguageNativeNames[value] : value}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          {copy.format}
                          <select
                            value={filterFormat}
                            onChange={(event) => setFilterFormat(event.target.value)}
                          >
                            <option value="">{copy.allFormats}</option>
                            {discoverFormats.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <button type="button" onClick={resetDiscoverFilters}>
                        {copy.resetFilters}
                      </button>
                    </details>
                  </div>
                )}
                {activityClient !== null && target === 'following' && (
                  <ProductionActivityPanel
                    activity={activity}
                    language={language}
                    personalized={activityPersonalized}
                    notificationsSupported={activityNotifications.supported}
                  />
                )}
                {target === 'home' ? (
                  <ProductionHome
                    articles={articles}
                    language={language}
                    sourcePreferences={sourcePreferences.state}
                    renderCard={renderArticleCard}
                    loadDirectory={homeDirectory?.load}
                    onBrowseDirectory={homeDirectory?.onBrowse}
                    onBrowseSport={homeDirectory?.onBrowseSport}
                    regionalEvents={regionalEvents}
                  />
                ) : (
                  <div className="feed-list">
                    {articles.map((article) => renderArticleCard(article))}
                  </div>
                )}
                {allowed && articles.length === 0 && (
                  <p role="status">
                    {target === 'saved' ? copy.savedEmpty : copy.personalizationNoMatches}
                  </p>
                )}
                {target === 'saved' &&
                  reading.state.entries
                    .filter(
                      (entry) => !allArticles.some((article) => article.id === entry.articleId),
                    )
                    .map((entry) => (
                      <div className="production-card" key={entry.articleId}>
                        <p>{copy.unavailableMessage}</p>
                        <button
                          type="button"
                          disabled={protectedReading}
                          onClick={() =>
                            change(
                              { kind: 'remove', articleId: entry.articleId },
                              copy.localStateDeleted,
                            )
                          }
                        >
                          {copy.deleteNow}
                        </button>
                      </div>
                    ))}
              </>
            )}
          </>
        )}
        {readingNotice && (
          <p role="status" className="production-notice">
            {readingNotice}
          </p>
        )}
        {shareFallbackUrl !== null ? (
          <input
            type="url"
            readOnly
            value={shareFallbackUrl}
            aria-label={copy.share}
            data-testid="canonical-share-fallback"
            onFocus={(event) => event.currentTarget.select()}
          />
        ) : null}
        <p role="status" className="production-notice">
          {status}
        </p>
        <div className="production-actions">
          <button type="button" disabled={operation !== null} onClick={() => void run('check')}>
            {copy.checkLocalContent}
          </button>
          {target === 'more' && (
            <>
              <button
                type="button"
                disabled={operation !== null || result?.control?.previousKey == null}
                onClick={(event) => setDialog({ kind: 'rollback', trigger: event.currentTarget })}
              >
                {copy.rollbackLocalContent}
              </button>
              <button
                type="button"
                disabled={operation !== null || result?.status === 'storage-error'}
                onClick={(event) => setDialog({ kind: 'clear', trigger: event.currentTarget })}
              >
                {copy.clearLocalContent}
              </button>
              <button
                type="button"
                data-archive-entry-trigger={archiveTriggerId}
                onClick={(event) => onOpenArchive(event.currentTarget)}
              >
                {copy.newsArchive}
              </button>
            </>
          )}
          {target === 'saved' && (
            <button
              type="button"
              disabled={protectedReading || reading.state.entries.length === 0}
              onClick={(event) =>
                setDialog({ kind: 'clear-reading', trigger: event.currentTarget })
              }
            >
              {copy.clearAllReadingData}
            </button>
          )}
        </div>
        {children}
        {dialog !== null && (dialog.kind !== 'external' || dialog.identity === identity) && (
          <ProductionDialog
            title={
              dialog.kind === 'external'
                ? copy.externalSourceDialogTitle
                : dialog.kind === 'clear'
                  ? text.clearQuestion
                  : dialog.kind === 'rollback'
                    ? copy.rollbackLocalContent
                    : formatUiCopy(copy.clearReadingDataQuestion, { label: copy.clearAllLabel })
            }
            trigger={dialog.trigger}
            onClose={() => setDialog(null)}
          >
            {dialog.kind === 'external' && (
              <>
                <p>{copy.externalSourceWarning}</p>
                <p>{new URL(dialog.url).hostname}</p>
              </>
            )}
            <div className="source-dialog-actions">
              <button type="button" onClick={() => setDialog(null)}>
                {copy.cancel}
              </button>
              {dialog.kind === 'external' ? (
                <a
                  href={dialog.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  onClick={(event) => {
                    if (!allowed || result?.expiresAt == null || Date.now() > result.expiresAt) {
                      event.preventDefault();
                      void run('guard');
                    }
                  }}
                >
                  {copy.openExternalSourceNow}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (dialog.kind === 'clear-reading') {
                      change({ kind: 'clear', target: 'all' }, copy.localStateDeleted);
                      setDialog(null);
                    } else void run(dialog.kind);
                  }}
                >
                  {dialog.kind === 'rollback' ? copy.rollbackLocalContent : copy.deleteNow}
                </button>
              )}
            </div>
          </ProductionDialog>
        )}
      </section>
    );
  };
}
