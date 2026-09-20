import type { UiLanguage } from '@wrn/ui-language';
import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import type { LocalSourcePreferencesV1 } from '@wrn/content-contracts';
import { emptySourcePreferences, projectSourcePreferences } from '@wrn/domain';

/** Select only from the validated, withdrawal-filtered projection.
 * Prefer the interface language, then publication time, with stable ID ties.
 * Metadata remains outside the separate offline reader contract.
 */
export function selectHomeDirectoryArticles(
  articles: readonly DirectoryArticle[],
  language: UiLanguage,
  sourcePreferences: LocalSourcePreferencesV1 = emptySourcePreferences(),
) {
  const ordered = [...articles].sort((a, b) => {
    const preferred = Number(b.language === language) - Number(a.language === language);
    if (preferred) return preferred;
    const first = a.publishedAt === null ? -Infinity : Date.parse(a.publishedAt);
    const second = b.publishedAt === null ? -Infinity : Date.parse(b.publishedAt);
    if (first !== second) return second > first ? 1 : -1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return projectSourcePreferences(
    ordered,
    sourcePreferences,
    'directory',
    (article) => article.endpointIds,
  ).slice(0, 5);
}
