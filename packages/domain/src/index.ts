/**
 * Minimal, plattformneutrale Zustandsbasis fuer die lokalen G3-Shells.
 * Diese Werte beschreiben keinen Content- oder Netzwerkvertrag.
 */
export * from './production-content-v1.js';
export * from './production-reading-state-v2.js';

import type {
  ArchiveLifecycleValidationResult,
  LocalContentReleaseFailureCode,
  LocalContentReleaseValidationResult,
  LocalArchiveLifecycleV1,
  LocalArticle,
  LocalDiscoverFormat,
  LocalDiscoverIndexV1,
  LocalManifestV1,
  LocalReaderDetailEntryV1,
  LocalReaderDetailsV1,
  LocalPersonalizationContentLanguageId,
  LocalPersonalizationInterestId,
  LocalPersonalizationRegionId,
  LocalPersonalizationStateV1,
  ReaderDetailsValidationResult,
} from '@wrn/content-contracts';
import {
  isLocalPersonalizationStateV1,
  isLocalReadingStateV1,
  localPersonalizationContentLanguageIds,
  localPersonalizationContractVersion,
  localPersonalizationInterestIds,
  localPersonalizationRegionIds,
  localPersonalizationRevision,
  localPersonalizationSchema,
  localReadingStateMaxEntries,
  localReadingStateMinimumProgress,
  localReadingStateReadThreshold,
  localReadingStateRevision,
  localReadingStateSchema,
  localReadingStateContractVersion,
  type LocalReadingStateEntryV1,
  type LocalReadingStateV1,
} from '@wrn/content-contracts';
export * from './source-preferences';

/**
 * Die Clients haengen ausschliesslich an der Domainoeffentlichkeit. Dieser
 * additive Re-Export teilt die bereits vorhandene strenge V1-Validierung,
 * ohne ein zweites Schema oder eine Frontendkopie einzufuehren.
 */
export { isLocalReadingStateV1 } from '@wrn/content-contracts';
export type { LocalReadingStateV1 } from '@wrn/content-contracts';
export { isLocalPersonalizationStateV1 } from '@wrn/content-contracts';
export type {
  LocalPersonalizationContentLanguageId,
  LocalPersonalizationInterestId,
  LocalPersonalizationRegionId,
  LocalPersonalizationStateV1,
} from '@wrn/content-contracts';

/**
 * Reine, UI-neutrale Projektion des G3-012-Releaseverbrauchers. Der Adapter
 * liefert ausschliesslich validierte Daten oder einen dieser sicheren Zustaende
 * und speichert bzw. loggt dabei nichts.
 */
export type LocalContentReleaseState =
  | Readonly<{ readonly kind: 'loading' }>
  | Readonly<{
      readonly kind: 'ready';
      readonly revision: string;
      readonly manifestSha256: string;
      readonly articleIds: readonly string[];
    }>
  | Readonly<{
      readonly kind: 'error';
      readonly failureCodes: readonly LocalContentReleaseFailureCode[];
    }>;

export function createLocalContentReleaseLoadingState(): LocalContentReleaseState {
  return Object.freeze({ kind: 'loading' });
}

/**
 * Nie entsteht aus einer fehlgeschlagenen Teilvalidierung ein Ready-Zustand.
 * Die Fehlercodes sind absichtlich kategorisch und enthalten keine Payloads,
 * Original-URLs oder interne Pfade.
 */
export function projectLocalContentReleaseValidation(
  releaseRevision: string,
  validation: LocalContentReleaseValidationResult,
): LocalContentReleaseState {
  if (!validation.ok || validation.manifestSha256 === null) {
    return Object.freeze({
      kind: 'error',
      failureCodes: Object.freeze([...validation.failureCodes]),
    });
  }

  return Object.freeze({
    kind: 'ready',
    revision: releaseRevision,
    manifestSha256: validation.manifestSha256,
    articleIds: Object.freeze([...validation.articleIds]),
  });
}

export const shellStates = ['ready', 'loading', 'error', 'offline'] as const;

export type ShellState = (typeof shellStates)[number];

/**
 * Prueft einen bereits vorliegenden Wert ohne Umwandlung oder Seiteneffekt.
 */
export function isShellState(value: unknown): value is ShellState {
  return typeof value === 'string' && shellStates.includes(value as ShellState);
}

/**
 * Liest einen Shell-Zustand fail-closed. Ungueltige oder fremde Werte ergeben
 * `null`; sie werden nie stillschweigend normalisiert oder vervollstaendigt.
 */
export function parseShellState(candidate: unknown): ShellState | null {
  return isShellState(candidate) ? candidate : null;
}

/**
 * Kennzeichnet Zustande, in denen eine Shell ohne neue Produktdaten weiter
 * bedienbar bleibt und ein erneuter Versuch sinnvoll sein kann.
 */
export function isRecoverableShellState(state: ShellState): boolean {
  return state === 'error' || state === 'offline';
}

/**
 * Kennzeichnet, ob die Shell ihren neutralen Startzustand verlassen hat.
 */
export function hasResolvedShellState(state: ShellState): boolean {
  return state !== 'loading';
}

/** Vollstaendige, lokale Zustandsmenge fuer den G3-002-Newsfeed. */
export const feedStates = [
  'loading',
  'empty',
  'error',
  'offline',
  'optional-absent',
  'ready',
] as const;
export type FeedStateKind = (typeof feedStates)[number];

export interface FeedArticleCard {
  readonly id: string;
  readonly title: string;
  readonly teaser: string;
  readonly publishedAt: string;
  readonly sourceId: string;
  readonly sourceName: string;
  readonly originalLanguage: string;
  readonly tags: readonly string[];
  readonly originalUrl: string;
  readonly rightsStatus: string;
  readonly transformationReference: string;
  readonly translationReference: string;
}

export interface FeedStatusState {
  readonly kind: Exclude<FeedStateKind, 'ready'>;
  readonly message: string;
}

export interface FeedReadyState {
  readonly kind: 'ready';
  readonly manifestRevision: string;
  readonly articleIds: readonly string[];
  readonly articles: readonly FeedArticleCard[];
}

export type FeedState = FeedStatusState | FeedReadyState;

/**
 * Uebersetzt einen bereits validierten Contentrecord ohne Plattform-, DOM- oder
 * Netzwerkbindung in die kleine, sichtbare Feedkarte.
 */
export function toFeedArticleCard(article: LocalArticle): FeedArticleCard {
  return {
    id: article.id,
    title: article.title,
    teaser: article.teaser,
    publishedAt: article.publishedAt,
    sourceId: article.source.id,
    sourceName: article.source.name,
    originalLanguage: article.originalLanguage,
    tags: [...article.tags],
    originalUrl: article.originalUrl,
    rightsStatus: article.rights.status,
    transformationReference: article.transformation.reference,
    translationReference: article.translation.reference,
  };
}

/**
 * Erstellt den Ready-Zustand nur, wenn die sichtbaren Artikel exakt der im
 * Manifest gebundenen aktiven ID-Menge entsprechen. Hashpruefung verbleibt im
 * Content-Contract und ist vor diesem Schritt auszufuehren.
 */
export function createReadyFeedState(
  manifest: Pick<LocalManifestV1, 'revision' | 'articleSets'>,
  articles: readonly LocalArticle[],
): FeedReadyState {
  const expectedIds = [...manifest.articleSets.activeFeedIds];
  const actualIds = [...articles.map((article) => article.id)].sort();

  if (
    new Set(actualIds).size !== actualIds.length ||
    JSON.stringify(actualIds) !== JSON.stringify(expectedIds)
  ) {
    throw new Error('Ready-Feed weicht von der manifestgebundenen aktiven ID-Menge ab.');
  }

  const cardsById = new Map(articles.map((article) => [article.id, toFeedArticleCard(article)]));
  return Object.freeze({
    kind: 'ready',
    manifestRevision: manifest.revision,
    articleIds: Object.freeze(expectedIds),
    articles: Object.freeze(expectedIds.map((id) => cardsById.get(id)!)),
  });
}

/** Zustandsfactory ohne implizite Daten, Requests oder Fehlernormalisierung. */
export function createFeedStatusState(
  kind: Exclude<FeedStateKind, 'ready'>,
  message: string,
): FeedStatusState {
  if (!feedStates.includes(kind) || message.trim().length === 0) {
    throw new Error('Ungueltiger lokaler Feedzustand.');
  }

  return Object.freeze({ kind, message });
}

export function isFeedStateKind(value: unknown): value is FeedStateKind {
  return typeof value === 'string' && feedStates.includes(value as FeedStateKind);
}

/**
 * Stabile, clientneutrale Navigationsziele fuer die schrittweise Migration.
 * Die IDs sind keine URLs und enthalten weder Plattform- noch UI-Wissen.
 */
export const navigationTargetIds = [
  'home',
  'following',
  'discover',
  'media',
  'events',
  'knowledge',
  'solidarity',
  'saved',
  'more',
  'help',
] as const;

export type NavigationTargetId = (typeof navigationTargetIds)[number];

export interface NavigationTarget {
  readonly id: NavigationTargetId;
  readonly label: string;
  readonly laterSlice: string | null;
}

const navigationTargetCatalog: Readonly<Record<NavigationTargetId, NavigationTarget>> = {
  home: { id: 'home', label: 'Start', laterSlice: null },
  following: {
    id: 'following',
    label: 'Für mich',
    laterSlice: 'spaetere lokale Personalisierung',
  },
  discover: {
    id: 'discover',
    label: 'Entdecken',
    laterSlice: 'WRN-G3-005 Suche und Filter',
  },
  media: { id: 'media', label: 'Medien', laterSlice: 'spaeterer Medien-Hub' },
  events: { id: 'events', label: 'Termine', laterSlice: 'spaeterer Termine-Slice' },
  knowledge: { id: 'knowledge', label: 'Wissen', laterSlice: 'spaeterer Wissens-Slice' },
  solidarity: {
    id: 'solidarity',
    label: 'Solidarität',
    laterSlice: 'spaeterer Solidaritaets-Slice',
  },
  saved: {
    id: 'saved',
    label: 'Gespeichert',
    laterSlice: 'spaetere lokale Merkliste',
  },
  more: { id: 'more', label: 'Mehr', laterSlice: 'spaeterer Projekt- und Hilfe-Slice' },
  help: { id: 'help', label: 'Hilfe', laterSlice: 'spaeterer Hilfe-Slice' },
};

/** Liefert nur exakt registrierte IDs; fremde Werte bleiben fail-closed `null`. */
export function parseNavigationTargetId(value: unknown): NavigationTargetId | null {
  return typeof value === 'string' && navigationTargetIds.includes(value as NavigationTargetId)
    ? (value as NavigationTargetId)
    : null;
}

/** Ein unbekanntes lokales Ziel darf nie einen Inhalt vortaeuschen und faellt auf Start zurueck. */
export function resolveNavigationTarget(value: unknown): NavigationTargetId {
  return parseNavigationTargetId(value) ?? 'home';
}

export function getNavigationTarget(id: NavigationTargetId): NavigationTarget {
  return navigationTargetCatalog[id];
}

export const mobilePrimaryNavigationIds = [
  'home',
  'following',
  'discover',
  'media',
  'saved',
] as const satisfies readonly NavigationTargetId[];

export const websiteCompactNavigationIds = [
  'home',
  'discover',
  'media',
  'saved',
  'more',
] as const satisfies readonly NavigationTargetId[];

export const websiteExpandedNavigationIds = [
  'home',
  'discover',
  'media',
  'events',
  'knowledge',
  'solidarity',
  'saved',
  'more',
] as const satisfies readonly NavigationTargetId[];

/** Reine, privacy-neutrale Such- und Filterbasis fuer WRN-G3-005. */
export interface DiscoverCriteria {
  readonly query: string;
  readonly region: string | null;
  readonly topic: string | null;
  readonly source: string | null;
  readonly originalLanguage: string | null;
  readonly format: LocalDiscoverFormat | null;
}

export const emptyDiscoverCriteria: DiscoverCriteria = Object.freeze({
  query: '',
  region: null,
  topic: null,
  source: null,
  originalLanguage: null,
  format: null,
});

export interface DiscoverArticleCard extends FeedArticleCard {
  readonly region: string;
  readonly topics: readonly string[];
  readonly format: LocalDiscoverFormat;
}

export interface DiscoverFacets {
  readonly regions: readonly string[];
  readonly topics: readonly string[];
  readonly sources: readonly string[];
  readonly originalLanguages: readonly string[];
  readonly formats: readonly LocalDiscoverFormat[];
}

export interface DiscoverResult {
  readonly criteria: DiscoverCriteria;
  readonly facets: DiscoverFacets;
  readonly articles: readonly DiscoverArticleCard[];
}

/**
 * NFKC, trimmen, kollabierte Leerzeichen und locale-unabhaengige Kleinschreibung.
 * Leere Terme verschwinden; Teilstrings bleiben bewusst erlaubt.
 */
export function normalizeDiscoverQuery(query: string): string[] {
  return query
    .normalize('NFKC')
    .trim()
    .replaceAll(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter((term) => term.length > 0);
}

export function normalizeDiscoverCriteria(criteria: Partial<DiscoverCriteria>): DiscoverCriteria {
  const normalizeValue = (value: string | null | undefined): string | null => {
    const normalized = (value ?? '').normalize('NFKC').trim().replaceAll(/\s+/g, ' ');
    return normalized.length === 0 ? null : normalized;
  };
  return Object.freeze({
    query: normalizeDiscoverQuery(criteria.query ?? '').join(' '),
    region: normalizeValue(criteria.region),
    topic: normalizeValue(criteria.topic),
    source: normalizeValue(criteria.source),
    originalLanguage: normalizeValue(criteria.originalLanguage),
    format: (normalizeValue(criteria.format) as LocalDiscoverFormat | null) ?? null,
  });
}

function stableUnique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort((left, right) => left.localeCompare(right, 'en')));
}

export function displayOriginalLanguage(language: string): string {
  return language === 'und' ? 'Unbekannt' : language;
}

export function createDiscoverFacets(
  articles: readonly LocalArticle[],
  index: LocalDiscoverIndexV1,
): DiscoverFacets {
  const indexByArticleId = new Map(index.entries.map((entry) => [entry.articleId, entry]));
  if (
    indexByArticleId.size !== articles.length ||
    articles.some((article) => !indexByArticleId.has(article.id))
  ) {
    throw new Error('Discover-Facetten brauchen einen vollstaendigen validierten Index.');
  }
  return Object.freeze({
    regions: stableUnique(index.entries.map((entry) => entry.region)),
    topics: stableUnique(index.entries.flatMap((entry) => entry.topics)),
    sources: stableUnique(articles.map((article) => article.source.name)),
    originalLanguages: stableUnique(articles.map((article) => article.originalLanguage)),
    formats: Object.freeze(
      [...new Set(index.entries.map((entry) => entry.format))].sort((left, right) =>
        left.localeCompare(right, 'en'),
      ),
    ),
  });
}

function normalizedEquals(left: string, right: string): boolean {
  return (
    left.normalize('NFKC').trim().replaceAll(/\s+/g, ' ').toLowerCase() ===
    right.normalize('NFKC').trim().replaceAll(/\s+/g, ' ').toLowerCase()
  );
}

/**
 * Ergebnisreihenfolge folgt ausschließlich der übergebenen manifestgebundenen
 * Artikelreihenfolge. Kein Ranking, kein DOM, Storage, Zeit- oder Netzwerkwissen.
 */
export function filterDiscoverArticles(
  articles: readonly LocalArticle[],
  index: LocalDiscoverIndexV1,
  criteria: Partial<DiscoverCriteria> = emptyDiscoverCriteria,
): DiscoverResult {
  const normalizedCriteria = normalizeDiscoverCriteria(criteria);
  const indexByArticleId = new Map(index.entries.map((entry) => [entry.articleId, entry]));
  if (
    indexByArticleId.size !== articles.length ||
    articles.some((article) => !indexByArticleId.has(article.id))
  ) {
    throw new Error('Discover-Ergebnisse brauchen einen vollstaendigen validierten Index.');
  }
  const terms = normalizeDiscoverQuery(normalizedCriteria.query);
  const selectedRegion = normalizedCriteria.region;
  const selectedTopic = normalizedCriteria.topic;
  const selectedSource = normalizedCriteria.source;
  const selectedOriginalLanguage = normalizedCriteria.originalLanguage;
  const selectedFormat = normalizedCriteria.format;
  const filtered = articles.flatMap((article) => {
    const entry = indexByArticleId.get(article.id)!;
    const searchFields = [
      article.title,
      article.teaser,
      article.source.name,
      entry.region,
      ...entry.topics,
      entry.format,
    ].map((field) => field.normalize('NFKC').toLowerCase());
    const matchesSearch = terms.every((term) => searchFields.some((field) => field.includes(term)));
    const matches =
      matchesSearch &&
      (selectedRegion === null || normalizedEquals(entry.region, selectedRegion)) &&
      (selectedTopic === null ||
        entry.topics.some((topic) => normalizedEquals(topic, selectedTopic))) &&
      (selectedSource === null || normalizedEquals(article.source.name, selectedSource)) &&
      (selectedOriginalLanguage === null ||
        normalizedEquals(article.originalLanguage, selectedOriginalLanguage)) &&
      (selectedFormat === null || entry.format === selectedFormat);
    return matches
      ? [
          Object.freeze({
            ...toFeedArticleCard(article),
            region: entry.region,
            topics: Object.freeze([...entry.topics]),
            format: entry.format,
          }),
        ]
      : [];
  });
  return Object.freeze({
    criteria: normalizedCriteria,
    facets: createDiscoverFacets(articles, index),
    articles: Object.freeze(filtered),
  });
}

export function hasActiveDiscoverCriteria(criteria: DiscoverCriteria): boolean {
  return (
    criteria.query.length > 0 ||
    criteria.region !== null ||
    criteria.topic !== null ||
    criteria.source !== null ||
    criteria.originalLanguage !== null ||
    criteria.format !== null
  );
}

/**
 * Creates the only writable V1 shape for the local personalization adapter.
 * Invalid, unknown or empty selections intentionally yield null instead of a
 * partial profile. No storage, time, identity or consent information exists
 * in this domain operation.
 */
export function createLocalPersonalizationState(input: {
  readonly interestIds: readonly LocalPersonalizationInterestId[];
  readonly regionIds: readonly LocalPersonalizationRegionId[];
  readonly contentLanguageIds: readonly LocalPersonalizationContentLanguageId[];
}): LocalPersonalizationStateV1 | null {
  const stable = <T extends string>(
    values: readonly T[],
    catalog: readonly T[],
  ): readonly T[] | null => {
    if (!values.every((value) => catalog.includes(value))) return null;
    return Object.freeze(
      [...new Set(values)].sort((left, right) => left.localeCompare(right, 'en')),
    );
  };
  const interestIds = stable(input.interestIds, localPersonalizationInterestIds);
  const regionIds = stable(input.regionIds, localPersonalizationRegionIds);
  const contentLanguageIds = stable(
    input.contentLanguageIds,
    localPersonalizationContentLanguageIds,
  );
  if (
    interestIds === null ||
    regionIds === null ||
    contentLanguageIds === null ||
    interestIds.length + regionIds.length + contentLanguageIds.length === 0
  ) {
    return null;
  }
  const state: LocalPersonalizationStateV1 = Object.freeze({
    contractVersion: localPersonalizationContractVersion,
    schema: localPersonalizationSchema,
    revision: localPersonalizationRevision,
    interestIds,
    regionIds,
    contentLanguageIds,
  });
  return isLocalPersonalizationStateV1(state) ? state : null;
}

const personalizationTopicIds: Readonly<Record<string, LocalPersonalizationInterestId>> =
  Object.freeze({
    Basisarbeit: 'movement-news',
    Fankultur: 'fan-culture',
    Frauen: 'women-feminist',
    Fussball: 'football',
    Lokales: 'local-organizing',
    Medien: 'media-technology',
    Sport: 'sport',
    Technologie: 'media-technology',
  });

const personalizationRegionIds: Readonly<Record<string, LocalPersonalizationRegionId>> =
  Object.freeze({
    Europa: 'europe',
    Lateinamerika: 'latin-america-caribbean',
    Nordamerika: 'north-america',
  });

/**
 * Projects only a currently validated local article array and its equally
 * complete discover index. OR applies within each chosen dimension, AND
 * applies between nonempty dimensions. The supplied article order is retained
 * exactly; no score, reading state, time or behavioural signal is inspected.
 */
export function projectLocalPersonalizedArticles(input: {
  readonly state: LocalPersonalizationStateV1;
  readonly articles: readonly LocalArticle[];
  readonly discoverIndex: LocalDiscoverIndexV1;
}): readonly LocalArticle[] {
  if (
    !isLocalPersonalizationStateV1(input.state) ||
    input.state.interestIds.length +
      input.state.regionIds.length +
      input.state.contentLanguageIds.length ===
      0
  ) {
    return Object.freeze([]);
  }
  const indexByArticleId = new Map(
    input.discoverIndex.entries.map((entry) => [entry.articleId, entry]),
  );
  if (
    indexByArticleId.size !== input.articles.length ||
    new Set(input.articles.map((article) => article.id)).size !== input.articles.length ||
    input.articles.some((article) => !indexByArticleId.has(article.id))
  ) {
    return Object.freeze([]);
  }
  const interestIds = new Set(input.state.interestIds);
  const regionIds = new Set(input.state.regionIds);
  const contentLanguageIds = new Set(input.state.contentLanguageIds);
  return Object.freeze(
    input.articles.filter((article) => {
      const entry = indexByArticleId.get(article.id)!;
      const matchesInterest =
        interestIds.size === 0 ||
        entry.topics.some((topic) => interestIds.has(personalizationTopicIds[topic]!));
      const matchesRegion =
        regionIds.size === 0 || regionIds.has(personalizationRegionIds[entry.region]!);
      const matchesLanguage =
        contentLanguageIds.size === 0 ||
        (contentLanguageIds.size > 0 &&
          contentLanguageIds.has(
            article.originalLanguage as LocalPersonalizationContentLanguageId,
          ));
      return matchesInterest && matchesRegion && matchesLanguage;
    }),
  );
}

/** Reine, clientneutrale Readerzustande fuer WRN-G3-006. */
export const readerStateKinds = ['loading', 'ready', 'not-found', 'error'] as const;
export type ReaderStateKind = (typeof readerStateKinds)[number];

export interface ReaderLoadingState {
  readonly kind: 'loading';
  readonly message: string;
}

export interface ReaderNotFoundState {
  readonly kind: 'not-found';
  readonly message: string;
}

export interface ReaderErrorState {
  readonly kind: 'error';
  readonly message: string;
}

export interface ReaderReadyState {
  readonly kind: 'ready';
  /** Der Record bleibt die einzige Herkunftsmetadatenquelle. */
  readonly article: LocalArticle;
  /** Der Detailvertrag enthaelt ausschliesslich selbst erstellte Textbloecke. */
  readonly detail: LocalReaderDetailEntryV1;
  /** Bereits validierte lokale Inhalte bleiben offline lesbar. */
  readonly isOffline: boolean;
}

export type ReaderState =
  ReaderLoadingState | ReaderNotFoundState | ReaderErrorState | ReaderReadyState;

export interface ReaderResolutionInput {
  readonly requestedArticleId: unknown;
  readonly articles: readonly LocalArticle[];
  readonly details: LocalReaderDetailsV1;
  /** Der Hash- und Vertragscheck wird ausserhalb vor der Domain ausgefuehrt. */
  readonly detailsValidation: ReaderDetailsValidationResult;
  readonly offline: boolean;
}

function exactSameIds(left: readonly string[], right: readonly string[]): boolean {
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return (
    new Set(leftSorted).size === leftSorted.length &&
    new Set(rightSorted).size === rightSorted.length &&
    JSON.stringify(leftSorted) === JSON.stringify(rightSorted)
  );
}

/** Ein ehrlich benannter Zwischenzustand enthaelt niemals Platzhaltertext. */
export function createReaderLoadingState(): ReaderLoadingState {
  return Object.freeze({
    kind: 'loading',
    message: 'Lokaler Artikel wird validiert.',
  });
}

/**
 * Loest nur bereits validierte lokale Daten auf. Kein DOM, Storage, Netzwerk,
 * Routing oder Teaserfallback ist in dieser Domainfunktion enthalten.
 */
export function resolveLocalReaderState(input: ReaderResolutionInput): ReaderState {
  const articleIds = input.articles.map((article) => article.id);
  const detailIds = input.details.entries.map((entry) => entry.articleId);
  if (
    !input.detailsValidation.ok ||
    !exactSameIds(articleIds, detailIds) ||
    !exactSameIds(articleIds, input.detailsValidation.articleIds)
  ) {
    return Object.freeze({
      kind: 'error',
      message: 'Der lokale Artikelinhalt konnte nicht sicher validiert werden.',
    });
  }

  if (typeof input.requestedArticleId !== 'string' || input.requestedArticleId.length === 0) {
    return Object.freeze({
      kind: 'not-found',
      message: 'Der angeforderte Artikel wurde nicht gefunden.',
    });
  }

  const article = input.articles.find((candidate) => candidate.id === input.requestedArticleId);
  const detail = input.details.entries.find(
    (candidate) => candidate.articleId === input.requestedArticleId,
  );
  if (article === undefined || detail === undefined) {
    return Object.freeze({
      kind: 'not-found',
      message: 'Der angeforderte Artikel wurde nicht gefunden.',
    });
  }

  return Object.freeze({
    kind: 'ready',
    article,
    detail,
    isOffline: input.offline,
  });
}

/** Ergebnisarten fuer die rein lokale G3-008-Lifecycleaufloesung. */
export const archiveLifecycleResolutionKinds = [
  'canonical-active',
  'canonical-archived',
  'redirected',
  'gone',
  'revoked',
  'unknown',
  'invalid',
] as const;
export type ArchiveLifecycleResolutionKind = (typeof archiveLifecycleResolutionKinds)[number];

interface CanonicalArchiveResolution {
  readonly kind: 'canonical-active' | 'canonical-archived';
  readonly canonicalId: string;
}

export interface RedirectedArchiveResolution {
  readonly kind: 'redirected';
  readonly canonicalId: string;
}

export interface ArchiveUnavailableResolution {
  readonly kind: 'gone' | 'revoked' | 'unknown' | 'invalid';
  /** Bewusst nur eine sichere abstrakte Meldung, nie Metadaten oder Ziel-ID. */
  readonly message: string;
}

export type ArchiveLifecycleResolution =
  CanonicalArchiveResolution | RedirectedArchiveResolution | ArchiveUnavailableResolution;

export interface ArchiveLifecycleResolutionInput {
  readonly requestedArticleId: unknown;
  readonly lifecycle: LocalArchiveLifecycleV1;
  /** Vor der Domainfunktion ausgefuehrter Hash-/Schema-/Monotoniecheck. */
  readonly lifecycleValidation: ArchiveLifecycleValidationResult;
}

export interface ArchiveArticleCard {
  readonly id: string;
  readonly title: string;
  readonly teaser: string;
  readonly publishedAt: string;
  readonly sourceName: string;
  readonly originalLanguage: string;
  readonly lifecycle: 'active' | 'historical';
}

export type ArchiveProjection =
  | { readonly kind: 'ready'; readonly articles: readonly ArchiveArticleCard[] }
  | {
      readonly kind: 'error';
      readonly message: string;
      readonly articles: readonly ArchiveArticleCard[];
    };

const localOpaqueArticleIdPattern = /^wrn-test-art-[a-z0-9-]+$/;

function isSafeArchiveId(value: unknown): value is string {
  return typeof value === 'string' && localOpaqueArticleIdPattern.test(value);
}

function safeLifecycleValidation(input: ArchiveLifecycleResolutionInput): boolean {
  return (
    input.lifecycleValidation.ok &&
    input.lifecycleValidation.revocationRevision === input.lifecycle.revocations.revision &&
    exactSameIds(input.lifecycleValidation.archiveArticleIds, input.lifecycle.archiveArticleIds)
  );
}

/**
 * Rein seiteneffektfreie Lifecycleaufloesung. Revocation wird bewusst vor
 * jedem Content-, Alias- und Sharepfad behandelt; Fehler fallen nie auf einen
 * aehnlichen Artikel oder einen ersten Archivrecord zurueck.
 */
export function resolveLocalArchiveLifecycle(
  input: ArchiveLifecycleResolutionInput,
): ArchiveLifecycleResolution {
  if (!safeLifecycleValidation(input)) {
    return Object.freeze({
      kind: 'invalid',
      message: 'Die lokale Artikeladresse konnte nicht sicher validiert werden.',
    });
  }
  if (!isSafeArchiveId(input.requestedArticleId)) {
    return Object.freeze({
      kind: 'invalid',
      message: 'Die angeforderte Artikeladresse ist ungueltig.',
    });
  }

  const requestedId = input.requestedArticleId;
  if (input.lifecycle.revocations.entries.some((entry) => entry.id === requestedId)) {
    return Object.freeze({
      kind: 'revoked',
      message: 'Dieser Artikel ist nicht verfuegbar.',
    });
  }
  if (input.lifecycle.gone.some((entry) => entry.id === requestedId)) {
    return Object.freeze({
      kind: 'gone',
      message: 'Dieser Artikel wurde entfernt.',
    });
  }

  const alias = input.lifecycle.aliases.find((entry) => entry.sourceId === requestedId);
  if (alias !== undefined) {
    if (input.lifecycle.revocations.entries.some((entry) => entry.id === alias.targetId)) {
      return Object.freeze({
        kind: 'revoked',
        message: 'Dieser Artikel ist nicht verfuegbar.',
      });
    }
    if (input.lifecycle.gone.some((entry) => entry.id === alias.targetId)) {
      return Object.freeze({
        kind: 'gone',
        message: 'Dieser Artikel wurde entfernt.',
      });
    }
    if (!input.lifecycle.archiveArticleIds.includes(alias.targetId)) {
      return Object.freeze({
        kind: 'invalid',
        message: 'Die lokale Artikeladresse konnte nicht sicher validiert werden.',
      });
    }
    return Object.freeze({ kind: 'redirected', canonicalId: alias.targetId });
  }

  if (!input.lifecycle.archiveArticleIds.includes(requestedId)) {
    return Object.freeze({
      kind: 'unknown',
      message: 'Der angeforderte Artikel wurde nicht gefunden.',
    });
  }
  return Object.freeze({
    kind: input.lifecycle.activeArticleIds.includes(requestedId)
      ? 'canonical-active'
      : 'canonical-archived',
    canonicalId: requestedId,
  });
}

/**
 * Ausschliesslich validierte, direkt aufloesbare kanonische Artikel erscheinen
 * im Archiv. Die Reihenfolge ist Datum absteigend, bei Gleichstand stabile ID.
 */
export function createLocalArchiveProjection(input: {
  readonly lifecycle: LocalArchiveLifecycleV1;
  readonly lifecycleValidation: ArchiveLifecycleValidationResult;
  readonly articles: readonly LocalArticle[];
}): ArchiveProjection {
  const validationInput: ArchiveLifecycleResolutionInput = {
    requestedArticleId: 'wrn-test-art-projection-check',
    lifecycle: input.lifecycle,
    lifecycleValidation: input.lifecycleValidation,
  };
  if (
    !safeLifecycleValidation(validationInput) ||
    !exactSameIds(
      input.articles.map((article) => article.id),
      input.lifecycle.archiveArticleIds,
    )
  ) {
    return Object.freeze({
      kind: 'error',
      message: 'Das lokale Archiv konnte nicht sicher validiert werden.',
      articles: Object.freeze([]),
    });
  }

  const activeIds = new Set(input.lifecycle.activeArticleIds);
  const articles = [...input.articles]
    .sort(
      (left, right) =>
        right.publishedAt.localeCompare(left.publishedAt) || left.id.localeCompare(right.id),
    )
    .map((article) =>
      Object.freeze({
        id: article.id,
        title: article.title,
        teaser: article.teaser,
        publishedAt: article.publishedAt,
        sourceName: article.source.name,
        originalLanguage: article.originalLanguage,
        lifecycle: activeIds.has(article.id) ? ('active' as const) : ('historical' as const),
      }),
    );
  return Object.freeze({ kind: 'ready', articles: Object.freeze(articles) });
}

/**
 * Der Sharepfad kennt nur kanonische, direkt aufloesbare IDs. Kein Query,
 * Fragment, Trackingwert, Dev-Origin oder Alias kann in dieses Ziel gelangen.
 */
export function createCanonicalArticleShareUrl(
  lifecycle: LocalArchiveLifecycleV1,
  resolution: ArchiveLifecycleResolution,
): string | null {
  if (
    (resolution.kind !== 'canonical-active' && resolution.kind !== 'canonical-archived') ||
    !lifecycle.shareableArticleIds.includes(resolution.canonicalId) ||
    !lifecycle.archiveArticleIds.includes(resolution.canonicalId) ||
    !isSafeArchiveId(resolution.canonicalId)
  ) {
    return null;
  }

  return `https://solinaridao.com/articles/${resolution.canonicalId}/`;
}

/**
 * WRN-G3-011: reine, clientneutrale Operationen fuer einen minimalen lokalen
 * Lesestatus. Keine Funktion greift auf Storage, Netzwerk, Zeit oder Content
 * zu; Aufrufer liefern Zeitwerte und schreiben erst nach eigener Validierung.
 */
export function createEmptyLocalReadingState(): LocalReadingStateV1 {
  return Object.freeze({
    contractVersion: localReadingStateContractVersion,
    schema: localReadingStateSchema,
    revision: localReadingStateRevision,
    entries: Object.freeze([]),
  });
}

function isSafeReadingId(value: unknown): value is string {
  return typeof value === 'string' && localOpaqueArticleIdPattern.test(value);
}

function isSafeReadingTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

interface ReadingEntryParts {
  readonly savedAt?: string | undefined;
  readonly readAt?: string | undefined;
  readonly progress?: { readonly fraction: number; readonly updatedAt: string } | undefined;
}

function createReadingEntry(
  articleId: string,
  parts: ReadingEntryParts,
): LocalReadingStateEntryV1 | null {
  if (parts.savedAt === undefined && parts.readAt === undefined && parts.progress === undefined) {
    return null;
  }
  const entry: {
    articleId: string;
    savedAt?: string;
    readAt?: string;
    progress?: { readonly fraction: number; readonly updatedAt: string };
  } = { articleId };
  if (parts.savedAt !== undefined) entry.savedAt = parts.savedAt;
  if (parts.readAt !== undefined) entry.readAt = parts.readAt;
  if (parts.progress !== undefined) entry.progress = Object.freeze({ ...parts.progress });
  return Object.freeze(entry);
}

function createReadingState(entries: readonly LocalReadingStateEntryV1[]): LocalReadingStateV1 {
  const sorted = [...entries].sort((left, right) => left.articleId.localeCompare(right.articleId));
  return Object.freeze({
    contractVersion: localReadingStateContractVersion,
    schema: localReadingStateSchema,
    revision: localReadingStateRevision,
    entries: Object.freeze(sorted),
  });
}

function updateReadingEntry(
  state: LocalReadingStateV1,
  articleId: unknown,
  mutate: (current: LocalReadingStateEntryV1 | undefined) => LocalReadingStateEntryV1 | null,
): LocalReadingStateV1 {
  if (!isLocalReadingStateV1(state) || !isSafeReadingId(articleId)) {
    return state;
  }
  const entries = new Map(state.entries.map((entry) => [entry.articleId, entry]));
  if (!entries.has(articleId) && entries.size >= localReadingStateMaxEntries) {
    return state;
  }
  const next = mutate(entries.get(articleId));
  if (next === null) entries.delete(articleId);
  else entries.set(articleId, next);
  return createReadingState([...entries.values()]);
}

function latestTimestamp(left: string | undefined, right: string | undefined): string | undefined {
  if (left === undefined) return right;
  if (right === undefined) return left;
  return left >= right ? left : right;
}

function latestProgress(
  left: LocalReadingStateEntryV1['progress'],
  right: LocalReadingStateEntryV1['progress'],
): LocalReadingStateEntryV1['progress'] {
  if (left === undefined) return right;
  if (right === undefined) return left;
  return left.updatedAt >= right.updatedAt ? left : right;
}

/** Idempotentes Speichern; Lesestatus und Fortschritt bleiben unberuehrt. */
export function saveLocalReadingArticle(
  state: LocalReadingStateV1,
  articleId: unknown,
  savedAt: unknown,
): LocalReadingStateV1 {
  if (!isSafeReadingTimestamp(savedAt)) return state;
  return updateReadingEntry(state, articleId, (current) =>
    createReadingEntry(articleId as string, {
      savedAt: latestTimestamp(current?.savedAt, savedAt),
      readAt: current?.readAt,
      progress: current?.progress,
    }),
  );
}

/** Entfernt nur die Merkliste; Lesestatus und Fortschritt bleiben bestehen. */
export function removeLocalReadingArticle(
  state: LocalReadingStateV1,
  articleId: unknown,
): LocalReadingStateV1 {
  return updateReadingEntry(state, articleId, (current) =>
    current === undefined
      ? null
      : createReadingEntry(articleId as string, {
          readAt: current.readAt,
          progress: current.progress,
        }),
  );
}

export function markLocalArticleRead(
  state: LocalReadingStateV1,
  articleId: unknown,
  readAt: unknown,
): LocalReadingStateV1 {
  if (!isSafeReadingTimestamp(readAt)) return state;
  return updateReadingEntry(state, articleId, (current) =>
    createReadingEntry(articleId as string, {
      savedAt: current?.savedAt,
      readAt: latestTimestamp(current?.readAt, readAt),
      progress: current?.progress,
    }),
  );
}

/** Ungelesen entfernt nur readAt; ein bereits gespeicherter Fortschritt bleibt erhalten. */
export function markLocalArticleUnread(
  state: LocalReadingStateV1,
  articleId: unknown,
): LocalReadingStateV1 {
  return updateReadingEntry(state, articleId, (current) =>
    current === undefined
      ? null
      : createReadingEntry(articleId as string, {
          savedAt: current.savedAt,
          progress: current.progress,
        }),
  );
}

/**
 * Normalisiert endliche UI-Fortschritte auf [0, 1]. Werte unter der zentralen
 * Mindestschwelle werden nicht gespeichert; ab der Leseschwelle wird derselbe
 * Artikel deterministisch als gelesen markiert.
 */
export function updateLocalReadingProgress(
  state: LocalReadingStateV1,
  articleId: unknown,
  fraction: unknown,
  updatedAt: unknown,
): LocalReadingStateV1 {
  if (
    typeof fraction !== 'number' ||
    !Number.isFinite(fraction) ||
    !isSafeReadingTimestamp(updatedAt)
  ) {
    return state;
  }
  const normalized = Math.min(1, Math.max(0, fraction));
  return updateReadingEntry(state, articleId, (current) => {
    const progress =
      normalized < localReadingStateMinimumProgress
        ? undefined
        : { fraction: normalized, updatedAt };
    return createReadingEntry(articleId as string, {
      savedAt: current?.savedAt,
      readAt:
        normalized >= localReadingStateReadThreshold
          ? (current?.readAt ?? updatedAt)
          : current?.readAt,
      progress,
    });
  });
}

export function resetLocalReadingProgress(
  state: LocalReadingStateV1,
  articleId: unknown,
): LocalReadingStateV1 {
  return updateReadingEntry(state, articleId, (current) =>
    current === undefined
      ? null
      : createReadingEntry(articleId as string, {
          savedAt: current.savedAt,
          readAt: current.readAt,
        }),
  );
}

export function clearLocalSavedArticles(state: LocalReadingStateV1): LocalReadingStateV1 {
  if (!isLocalReadingStateV1(state)) return state;
  return createReadingState(
    state.entries.flatMap((entry) => {
      const next = createReadingEntry(entry.articleId, {
        readAt: entry.readAt,
        progress: entry.progress,
      });
      return next === null ? [] : [next];
    }),
  );
}

export function clearLocalReadMarkers(state: LocalReadingStateV1): LocalReadingStateV1 {
  if (!isLocalReadingStateV1(state)) return state;
  return createReadingState(
    state.entries.flatMap((entry) => {
      const next = createReadingEntry(entry.articleId, {
        savedAt: entry.savedAt,
        progress: entry.progress,
      });
      return next === null ? [] : [next];
    }),
  );
}

/** Entfernt ausschliesslich den V1-Lesestatus; Themes und andere Keys sind nicht Teil der Domain. */
export function clearAllLocalReadingData(state: LocalReadingStateV1): LocalReadingStateV1 {
  return isLocalReadingStateV1(state) ? createEmptyLocalReadingState() : state;
}

function mergeReadingEntries(
  left: LocalReadingStateEntryV1,
  right: LocalReadingStateEntryV1,
  articleId = left.articleId,
): LocalReadingStateEntryV1 {
  const merged = createReadingEntry(articleId, {
    savedAt: latestTimestamp(left.savedAt, right.savedAt),
    readAt: latestTimestamp(left.readAt, right.readAt),
    progress: latestProgress(left.progress, right.progress),
  });
  if (merged === null)
    throw new Error('Leere Lesestatusrecords duerfen nicht zusammengefuehrt werden.');
  return merged;
}

/** Bestehende gleich oder neuere V1-Felder dominieren einen importierten Altwert. */
export function mergeLocalReadingStates(
  existing: LocalReadingStateV1,
  imported: LocalReadingStateV1,
): LocalReadingStateV1 {
  if (!isLocalReadingStateV1(existing) || !isLocalReadingStateV1(imported)) return existing;
  const merged = new Map(existing.entries.map((entry) => [entry.articleId, entry]));
  for (const entry of imported.entries) {
    const current = merged.get(entry.articleId);
    if (current === undefined && merged.size >= localReadingStateMaxEntries) {
      continue;
    }
    merged.set(
      entry.articleId,
      current === undefined ? entry : mergeReadingEntries(current, entry),
    );
  }
  return createReadingState([...merged.values()]);
}

export interface LocalReadingStateReconciliation {
  readonly kind: 'ready' | 'invalid';
  readonly state: LocalReadingStateV1;
  /** Sicher gespeicherte IDs ohne aktuelle Contentprojektion bleiben entfernbar. */
  readonly unavailableArticleIds: readonly string[];
}

/**
 * Alias wird kanonisiert; Gone, Revoked und unbekannte sichere IDs bleiben
 * payloadfrei im Zustand, damit sie sichtbar entfernt werden koennen. Eine
 * ungueltige/stale Lifecyclebindung aendert den vorhandenen Zustand nie.
 */
export function reconcileLocalReadingState(input: {
  readonly state: LocalReadingStateV1;
  readonly lifecycle: LocalArchiveLifecycleV1;
  readonly lifecycleValidation: ArchiveLifecycleValidationResult;
}): LocalReadingStateReconciliation {
  if (!isLocalReadingStateV1(input.state)) {
    return Object.freeze({
      kind: 'invalid',
      state: input.state,
      unavailableArticleIds: Object.freeze([]),
    });
  }
  const merged = new Map<string, LocalReadingStateEntryV1>();
  const unavailable: string[] = [];
  for (const entry of input.state.entries) {
    const resolution = resolveLocalArchiveLifecycle({
      requestedArticleId: entry.articleId,
      lifecycle: input.lifecycle,
      lifecycleValidation: input.lifecycleValidation,
    });
    if (resolution.kind === 'invalid') {
      return Object.freeze({
        kind: 'invalid',
        state: input.state,
        unavailableArticleIds: Object.freeze([]),
      });
    }
    const articleId = resolution.kind === 'redirected' ? resolution.canonicalId : entry.articleId;
    if (
      resolution.kind === 'gone' ||
      resolution.kind === 'revoked' ||
      resolution.kind === 'unknown'
    ) {
      unavailable.push(articleId);
    }
    const current = merged.get(articleId);
    merged.set(
      articleId,
      current === undefined ? entry : mergeReadingEntries(current, entry, articleId),
    );
    if (current === undefined && articleId !== entry.articleId) {
      merged.set(articleId, createReadingEntry(articleId, entry) ?? entry);
    }
  }
  return Object.freeze({
    kind: 'ready',
    state: createReadingState([...merged.values()]),
    unavailableArticleIds: Object.freeze([...new Set(unavailable)].sort()),
  });
}

export interface LocalLegacyIdentityMapEntry {
  readonly legacyKey: string;
  readonly articleId: string;
}
export interface LocalLegacyBookmarkRecord {
  readonly key: string;
  readonly savedAt: string;
}
export interface LocalLegacyReadRecord {
  readonly key: string;
  readonly readAt: string;
}
export interface LocalLegacyPositionRecord {
  readonly key: string;
  readonly fraction: number;
  readonly updatedAt: string;
}
export interface LocalLegacyReadingMigrationInput {
  readonly identityMap: readonly LocalLegacyIdentityMapEntry[];
  readonly bookmarks: readonly LocalLegacyBookmarkRecord[];
  readonly readList: readonly LocalLegacyReadRecord[];
  readonly positions: readonly LocalLegacyPositionRecord[];
}
export interface LocalLegacyReadingMigrationResult {
  readonly kind: 'ready' | 'invalid';
  readonly state: LocalReadingStateV1;
  readonly importedArticleIds: readonly string[];
  readonly unavailableArticleIds: readonly string[];
  readonly unmappedLegacyKeyCount: number;
}

function validLegacyKey(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 512;
}

function isLegacyMigrationInput(value: LocalLegacyReadingMigrationInput): boolean {
  const mappings = value.identityMap;
  return (
    mappings.length <= 200 &&
    value.bookmarks.length <= 200 &&
    value.readList.length <= 200 &&
    value.positions.length <= 200 &&
    mappings.every(
      (entry) => validLegacyKey(entry.legacyKey) && isSafeReadingId(entry.articleId),
    ) &&
    new Set(mappings.map((entry) => entry.legacyKey)).size === mappings.length &&
    value.bookmarks.every(
      (entry) => validLegacyKey(entry.key) && isSafeReadingTimestamp(entry.savedAt),
    ) &&
    value.readList.every(
      (entry) => validLegacyKey(entry.key) && isSafeReadingTimestamp(entry.readAt),
    ) &&
    value.positions.every(
      (entry) =>
        validLegacyKey(entry.key) &&
        typeof entry.fraction === 'number' &&
        Number.isFinite(entry.fraction) &&
        isSafeReadingTimestamp(entry.updatedAt),
    )
  );
}

/**
 * Reine Test-/Migrationsdomain: alte Schluessel werden nur ueber eine
 * explizite Zuordnung auf sichere IDs abgebildet. Niemals gelangen der alte
 * Key oder ein Artikelpayload in den neuen V1-Zustand.
 */
export function migrateLegacyLocalReadingState(input: {
  readonly legacy: LocalLegacyReadingMigrationInput;
  readonly existingState: LocalReadingStateV1;
  readonly lifecycle: LocalArchiveLifecycleV1;
  readonly lifecycleValidation: ArchiveLifecycleValidationResult;
}): LocalLegacyReadingMigrationResult {
  const validationInput: ArchiveLifecycleResolutionInput = {
    requestedArticleId: 'wrn-test-art-g3-011-migration-check',
    lifecycle: input.lifecycle,
    lifecycleValidation: input.lifecycleValidation,
  };
  if (
    !isLocalReadingStateV1(input.existingState) ||
    !isLegacyMigrationInput(input.legacy) ||
    !safeLifecycleValidation(validationInput)
  ) {
    return Object.freeze({
      kind: 'invalid',
      state: input.existingState,
      importedArticleIds: Object.freeze([]),
      unavailableArticleIds: Object.freeze([]),
      unmappedLegacyKeyCount: 0,
    });
  }
  const mappedIds = new Map(
    input.legacy.identityMap.map((entry) => [entry.legacyKey, entry.articleId]),
  );
  let imported = createEmptyLocalReadingState();
  const unavailable: string[] = [];
  let unmapped = 0;
  const resolve = (key: string): string | null => {
    const candidate = mappedIds.get(key);
    if (candidate === undefined) {
      unmapped += 1;
      return null;
    }
    const resolution = resolveLocalArchiveLifecycle({
      requestedArticleId: candidate,
      lifecycle: input.lifecycle,
      lifecycleValidation: input.lifecycleValidation,
    });
    if (resolution.kind === 'invalid') return null;
    if (resolution.kind === 'redirected') return resolution.canonicalId;
    if (
      resolution.kind === 'gone' ||
      resolution.kind === 'revoked' ||
      resolution.kind === 'unknown'
    ) {
      unavailable.push(candidate);
    }
    return candidate;
  };
  for (const record of input.legacy.bookmarks) {
    const articleId = resolve(record.key);
    if (articleId !== null) imported = saveLocalReadingArticle(imported, articleId, record.savedAt);
  }
  for (const record of input.legacy.readList) {
    const articleId = resolve(record.key);
    if (articleId !== null) imported = markLocalArticleRead(imported, articleId, record.readAt);
  }
  for (const record of input.legacy.positions) {
    const articleId = resolve(record.key);
    if (articleId !== null) {
      imported = updateLocalReadingProgress(imported, articleId, record.fraction, record.updatedAt);
    }
  }
  const reconciled = reconcileLocalReadingState({
    state: mergeLocalReadingStates(input.existingState, imported),
    lifecycle: input.lifecycle,
    lifecycleValidation: input.lifecycleValidation,
  });
  if (reconciled.kind === 'invalid') {
    return Object.freeze({
      kind: 'invalid',
      state: input.existingState,
      importedArticleIds: Object.freeze([]),
      unavailableArticleIds: Object.freeze([]),
      unmappedLegacyKeyCount: unmapped,
    });
  }
  return Object.freeze({
    kind: 'ready',
    state: reconciled.state,
    importedArticleIds: Object.freeze(imported.entries.map((entry) => entry.articleId)),
    unavailableArticleIds: Object.freeze(
      [...new Set([...unavailable, ...reconciled.unavailableArticleIds])].sort(),
    ),
    unmappedLegacyKeyCount: unmapped,
  });
}

/** WRN-G3-014 UI-neutral gate. Call it before reader access and on resume. */
export type ContentOfflineGuard =
  | Readonly<{ readonly kind: 'allowed'; readonly activeKey: string; readonly checkedAt: number }>
  | Readonly<{
      readonly kind: 'needs-source-check';
      readonly reason: 'pending-recheck' | 'expired' | 'clock-regressed' | 'missing-control';
    }>
  | Readonly<{
      readonly kind: 'unavailable';
      readonly reason: 'no-active-bundle' | 'safety-conflict';
    }>;

export interface ContentOfflineGuardControl {
  readonly activeKey: string | null;
  readonly lastSuccessfulSourceCheckAt: number | null;
  readonly lastObservedAt: number | null;
  readonly pendingRecheck: unknown | null;
  readonly safety: unknown;
}

export const contentOfflineGuardTtlMs = 24 * 60 * 60 * 1000;

/**
 * This intentionally does not fetch, write, or infer online state. A pending
 * source check wins over a usable bundle so a failed safety write survives a
 * process restart as a fail-closed condition.
 */
export function evaluateContentOfflineGuard(
  control: ContentOfflineGuardControl | null,
  now: unknown,
): ContentOfflineGuard {
  if (control === null || !Number.isSafeInteger(now) || (now as number) < 0) {
    return Object.freeze({ kind: 'needs-source-check', reason: 'missing-control' });
  }
  if (control.pendingRecheck !== null) {
    return Object.freeze({ kind: 'needs-source-check', reason: 'pending-recheck' });
  }
  if (control.activeKey === null)
    return Object.freeze({ kind: 'unavailable', reason: 'no-active-bundle' });
  if (!Number.isSafeInteger(control.lastSuccessfulSourceCheckAt)) {
    return Object.freeze({ kind: 'needs-source-check', reason: 'missing-control' });
  }
  if ((now as number) < (control.lastSuccessfulSourceCheckAt as number)) {
    return Object.freeze({ kind: 'needs-source-check', reason: 'clock-regressed' });
  }
  if (
    Number.isSafeInteger(control.lastObservedAt) &&
    (now as number) < (control.lastObservedAt as number)
  ) {
    return Object.freeze({ kind: 'needs-source-check', reason: 'clock-regressed' });
  }
  if (
    (now as number) - (control.lastSuccessfulSourceCheckAt as number) >
    contentOfflineGuardTtlMs
  ) {
    return Object.freeze({ kind: 'needs-source-check', reason: 'expired' });
  }
  return Object.freeze({
    kind: 'allowed',
    activeKey: control.activeKey,
    checkedAt: control.lastSuccessfulSourceCheckAt as number,
  });
}
