import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import type { UiLanguage } from '@wrn/ui-language';
import editorial from './app-home-editorial-v1.json';
import topicCatalog from './app-topics-v1.json';

/** An editorial note never restores an article removed by directory/source safety. */
export function homeReadingNote(article: DirectoryArticle, directoryCommit: string) {
  if (directoryCommit !== editorial.directoryCommit || article.historical) return null;
  return (
    editorial.entries.find(
      (entry) =>
        entry.articleId === article.id &&
        entry.originalUrl === article.url &&
        entry.originalTitle === article.title &&
        entry.rights === 'wrn-original-reading-note',
    ) ?? null
  );
}
export const appTopics: readonly string[] = topicCatalog.topics;
export function appTopicLabel(topic: string, language: UiLanguage): string {
  const labels = topicCatalog.labels as Record<string, Record<string, string>>;
  return labels[language]?.[topic] ?? topic;
}
const regions = new Set([
  'Africa',
  'Asia',
  'Europe',
  'Global',
  'Latin America',
  'North America',
  'Oceania',
  'Australia & NZ',
  'DACH',
]);
export function homeCoverage(articles: readonly DirectoryArticle[], now: number) {
  const recent = articles
    .filter((article) => {
      const time = Date.parse(article.publishedAt ?? '');
      return !article.historical && time >= now - 7 * 86400000 && time <= now;
    })
    .slice(0, 160);
  const languages = new Set(
    recent.map((a) => a.language.split(/[-_]/)[0]).filter((l) => l && l !== 'und'),
  );
  const regionSet = new Set(recent.flatMap((a) => a.topics.filter((t) => regions.has(t))));
  return {
    articles: recent.length,
    languages: languages.size,
    regions: regionSet.size,
    sources: new Set(recent.map((a) => a.sourceName)).size,
    last24Hours: articles.filter((a) => {
      const time = Date.parse(a.publishedAt ?? '');
      return !a.historical && time > now - 86400000 && time <= now;
    }).length,
  };
}
