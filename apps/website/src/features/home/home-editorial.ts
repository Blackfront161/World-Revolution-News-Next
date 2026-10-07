import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import type { UiLanguage } from '@wrn/ui-language';
import { validateSourcePassOverlayV1 } from '@wrn/content-contracts/source-pass-overlay-v1';
import editorial from './app-home-editorial-v1.json';
import sourceReview from './app-home-source-review-v1.json';
import topicCatalog from './app-topics-v1.json';
import noteLanguages from './home-note-languages-v1.json';
import illustration from './home-illustration-v1.json';
const reviewedProfiles = validateSourcePassOverlayV1(sourceReview) ? sourceReview.records : [];

/** An editorial note never restores an article removed by directory/source safety. */
export function homeReadingNote(article: DirectoryArticle, directoryCommit: string) {
  if (directoryCommit !== editorial.directoryCommit || article.historical) return null;
  return (
    editorial.entries.find(
      (entry) =>
        entry.articleId === article.id &&
        entry.originalUrl === article.url &&
        entry.originalTitle === article.title &&
        entry.sourceName === article.sourceName &&
        entry.admission === 'metadata-only-with-wrn-note' &&
        reviewedProfiles.some(
          (profile) =>
            profile.id === entry.sourcePassId &&
            profile.canonicalName === entry.sourceName &&
            profile.rights.some(
              (right) => right.medium === 'metadata' && ['allowed', 'link-only'].includes(right.status),
            ),
        ) &&
        entry.rights === 'wrn-original-reading-note',
    ) ?? null
  );
}
/** Local language versions remain bound to the reviewed WRN note and article. */
export function homeReadingSummary(
  article: DirectoryArticle,
  directoryCommit: string,
  language: UiLanguage,
) {
  const note = homeReadingNote(article, directoryCommit);
  if (!note) return null;
  if (language === 'de') return { text: note.summaryDe, language: 'de', headline: note.headlineDe };
  const translated = noteLanguages.entries.find(
    (entry) =>
      entry.articleId === note.articleId &&
      entry.sourceSummaryEn === note.summaryEn &&
      entry.sourceHeadlineDe === note.headlineDe,
  );
  if (language === 'en')
    return { text: note.summaryEn, language: 'en', headline: translated?.headlines.en };
  const text = translated?.summaries[language];
  return text
    ? { text, language, headline: translated?.headlines[language] }
    : { text: note.summaryEn, language: 'en', headline: undefined };
}
export const appTopics: readonly string[] = topicCatalog.topics;
export function homeArticleIllustration(article: DirectoryArticle, directoryCommit: string) {
  return homeReadingNote(article, directoryCommit) &&
    directoryCommit === illustration.directoryCommit &&
    article.id === illustration.articleId &&
    article.url === illustration.originalUrl &&
    article.title === illustration.originalTitle &&
    illustration.assetType === 'wrn-original-generated-illustration' &&
    illustration.noForeignSourceImageCopied
    ? illustration
    : null;
}
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
