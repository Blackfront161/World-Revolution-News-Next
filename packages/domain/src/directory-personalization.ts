import {
  isLocalPersonalizationStateV1,
  isLocalSourcePreferencesV1,
  type LocalPersonalizationInterestId,
  type LocalPersonalizationRegionId,
  type LocalPersonalizationStateV1,
  type LocalSourcePreferencesV1,
} from '@wrn/content-contracts';
import type {
  DirectoryArticle,
  DirectorySource,
} from '@wrn/content-contracts/mobile-content-directory-v1';

const interestTopics: Readonly<Record<LocalPersonalizationInterestId, readonly string[]>> = {
  'fan-culture': [],
  football: [],
  'local-organizing': ['Demonstrations', 'Labor Struggles', 'Squatting & Housing'],
  'media-technology': ['Cyberactivism'],
  'movement-news': ['Movement News'],
  sport: [],
  'women-feminist': ['Antisexism', 'Queer-Feminism'],
};

const regionTopics: Readonly<Record<LocalPersonalizationRegionId, readonly string[]>> = {
  africa: ['Africa'],
  asia: ['Asia'],
  europe: ['Europe'],
  global: ['Global'],
  'latin-america-caribbean': ['Latin America'],
  'middle-east-north-africa': [],
  'north-america': ['North America'],
  oceania: ['Australia & NZ'],
};

/**
 * Selects current metadata/link entries from an already validated directory.
 * It preserves directory order, uses only the user's explicit local choices,
 * and does not infer an interest or region from article text or reading history.
 */
export function projectPersonalizedDirectoryArticles(input: {
  readonly state: LocalPersonalizationStateV1;
  readonly articles: readonly DirectoryArticle[];
}): readonly DirectoryArticle[] {
  const { state, articles } = input;
  if (!isLocalPersonalizationStateV1(state)) return Object.freeze([]);
  if (
    state.interestIds.length + state.regionIds.length + state.contentLanguageIds.length ===
    0
  )
    return Object.freeze([]);

  const interests = new Set(state.interestIds.flatMap((id) => interestTopics[id]));
  const regions = new Set(state.regionIds.flatMap((id) => regionTopics[id]));
  const languages = new Set<string>(state.contentLanguageIds);
  return Object.freeze(
    articles.filter((article) =>
      !article.historical &&
      (state.interestIds.length === 0 || article.topics.some((topic) => interests.has(topic))) &&
      (state.regionIds.length === 0 || article.topics.some((topic) => regions.has(topic))) &&
      (languages.size === 0 || languages.has(article.language)),
    ),
  );
}

/** Exact recorded names cover legacy articles that have no endpoint IDs. */
export function projectDirectorySourcePreferences(input: {
  readonly articles: readonly DirectoryArticle[];
  readonly sources: readonly DirectorySource[];
  readonly preferences: LocalSourcePreferencesV1;
  /** An explicitly selected source may reveal its hidden articles on request. */
  readonly includeHidden?: boolean;
}): readonly DirectoryArticle[] {
  const { articles, sources, preferences, includeHidden = false } = input;
  if (!isLocalSourcePreferencesV1(preferences)) return Object.freeze([...articles]);
  const ids = {
    hide: new Set<string>(),
    follow: new Set<string>(),
  };
  for (const choice of preferences.choices) {
    if (choice.catalog === 'directory')
      ids[choice.action].add(choice.sourceId);
  }
  const names = {
    hide: new Set<string>(),
    follow: new Set<string>(),
  };
  for (const source of sources) {
    for (const action of ['hide', 'follow'] as const) {
      if (!ids[action].has(source.id)) continue;
      names[action].add(source.name);
      for (const observation of source.observations) names[action].add(observation.name);
    }
  }
  const matches = (article: DirectoryArticle, action: 'hide' | 'follow') =>
    article.endpointIds.some((id) => ids[action].has(id)) ||
    names[action].has(article.sourceName) ||
    article.observations.some((observation) => names[action].has(observation.sourceName));
  const followed: DirectoryArticle[] = [];
  const ordinary: DirectoryArticle[] = [];
  for (const article of articles) {
    const hidden = matches(article, 'hide');
    if (hidden && !includeHidden) continue;
    (!hidden && matches(article, 'follow') ? followed : ordinary).push(article);
  }
  return Object.freeze([...followed, ...ordinary]);
}
