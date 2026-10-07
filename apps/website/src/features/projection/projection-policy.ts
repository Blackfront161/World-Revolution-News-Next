import type {
  MobileContentDirectory,
  DirectoryArticle,
} from '@wrn/content-contracts/mobile-content-directory-v1';
import { projectMobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
type SourceIndex = { homepage: Map<string, Set<string>>; originName: Map<string, Set<string>> };
const sourceIndexes = new WeakMap<MobileContentDirectory, SourceIndex>();
function sourceIndex(directory: MobileContentDirectory): SourceIndex {
  const cached = sourceIndexes.get(directory);
  if (cached) return cached;
  const index: SourceIndex = { homepage: new Map(), originName: new Map() };
  const add = (map: Map<string, Set<string>>, key: string, id: string) => {
    const set = map.get(key) ?? new Set<string>();
    set.add(id);
    map.set(key, set);
  };
  for (const source of directory.sources) {
    const aliases = [
      source.url,
      ...source.observations.flatMap((o) => [o.homepage, o.rawUrl]),
    ].filter((url): url is string => url !== null);
    const names = new Set([source.name, ...source.observations.map((o) => o.name)]);
    for (const alias of aliases) {
      add(index.homepage, alias, source.id);
      try {
        for (const name of names)
          add(index.originName, new URL(alias).origin + '\n' + name, source.id);
      } catch {
        /* Invalid raw aliases grant no association. */
      }
    }
  }
  sourceIndexes.set(directory, index);
  return index;
}

export function websiteArticleSourceIds(
  article: DirectoryArticle,
  directory: MobileContentDirectory,
): string[] {
  const ids = new Set(article.endpointIds);
  const index = sourceIndex(directory);
  for (const observation of article.observations) {
    const associated = observation.sourceHomepage
      ? index.homepage.get(observation.sourceHomepage)
      : index.originName.get(new URL(article.url).origin + '\n' + observation.sourceName);
    for (const id of associated ?? []) ids.add(id);
  }
  return [...ids];
}

/** A restricted link view only. This never admits production full text or media. */
export function applyWebsiteLinkPolicy(
  directory: MobileContentDirectory,
  {
    revokedEndpointIds = [],
    revokedArticleIds = [],
    directoryOnlyEndpointIds = [],
    prohibitedMetadataEndpointIds = [],
  }: {
    revokedEndpointIds?: readonly string[];
    revokedArticleIds?: readonly string[];
    directoryOnlyEndpointIds?: readonly string[];
    prohibitedMetadataEndpointIds?: readonly string[];
  } = {},
): MobileContentDirectory {
  const removedSources = new Set([...directory.withdrawals.endpointIds, ...revokedEndpointIds]);
  const removedArticles = new Set([...directory.withdrawals.articleIds, ...revokedArticleIds]);
  const articleBlockedSources = new Set([
    ...removedSources,
    ...directoryOnlyEndpointIds,
    ...prohibitedMetadataEndpointIds,
  ]);
  const view = projectMobileContentDirectory(directory);
  return {
    ...view,
    sources: view.sources.filter((s) => !removedSources.has(s.id)),
    articles: view.articles.filter(
      (a) =>
        !removedArticles.has(a.id) &&
        (articleBlockedSources.size === 0 ||
          !websiteArticleSourceIds(a, directory).some((id) => articleBlockedSources.has(id))) &&
        (a.historical ||
          (a.publishedAt !== null &&
            Date.parse(a.publishedAt) <= Date.parse(directory.observedAt))),
    ),
    sports: view.sports.filter(
      (s) =>
        !s.endpointIds.some((id) => removedSources.has(id)) &&
        !(s.articleId && removedArticles.has(s.articleId)),
    ),
  };
}
