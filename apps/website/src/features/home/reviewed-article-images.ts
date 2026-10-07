import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import type { WebsiteImageRegister } from '../../../../../packages/content-contracts/src/directory/website-content-tuple-v1';
import reviewed from './reviewed-article-images-v1.json';
import register from './app-article-images-v1.json';
import { appArticleImage } from './app-article-images';

/** Exact article/immutable feed binding; publisher references, never a themed substitute. */
export function originalArticleImage(
  article: DirectoryArticle,
  commit: string,
  images: WebsiteImageRegister | typeof register = register,
) {
  const entry = reviewed.entries.find((entry) => entry.articleId === article.id);
  if (
    !article.historical &&
    commit === reviewed.dataCommit &&
    commit === images.dataCommit &&
    images.feedSha256 === reviewed.feedSha256 &&
    entry?.originalUrl === article.url &&
    entry.originalTitle === article.title &&
    entry.sourceName === article.sourceName
  )
    return entry.imageUrl ? entry : null;
  // A reviewed correction must never regress to the disproved feed picture.
  if (entry) return null;
  const original = appArticleImage(article, commit, images);
  return original ? { ...original, imageCredit: '' } : null;
}
