import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import { homeArticleIllustration, homeReadingNote } from './home-editorial';
import additional from './home-additional-illustrations-v1.json';
import austerity from '../../assets/wrn-austerity-illustration-v1.webp';
import teachers from '../../assets/wrn-teachers-illustration-v1.webp';
import agroecology from '../../assets/wrn-agroecology-illustration-v1.webp';
const assets: Readonly<Record<string, string>> = {
  'wrn-teachers-illustration-v1.webp': teachers,
  'wrn-agroecology-illustration-v1.webp': agroecology,
};
export function websiteArticleIllustration(article: DirectoryArticle, commit: string) {
  if (homeArticleIllustration(article, commit)) return austerity;
  if (commit !== additional.directoryCommit || !homeReadingNote(article, commit)) return null;
  const image = additional.entries.find(
    (entry) =>
      entry.articleId === article.id &&
      entry.originalUrl === article.url &&
      entry.originalTitle === article.title &&
      entry.assetType === 'wrn-original-generated-illustration' &&
      entry.noForeignSourceImageCopied,
  );
  return image ? (assets[image.asset] ?? null) : null;
}
