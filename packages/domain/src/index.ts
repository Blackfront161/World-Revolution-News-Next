/**
 * Minimal, plattformneutrale Zustandsbasis fuer die lokalen G3-Shells.
 * Diese Werte beschreiben keinen Content- oder Netzwerkvertrag.
 */
import type { LocalArticle, LocalManifestV1 } from '@wrn/content-contracts';

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
