import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import register from './app-article-images-v1.json';
import type { WebsiteImageRegister } from '../../../../../packages/content-contracts/src/directory/website-content-tuple-v1';
export function appArticleImage(
  article: DirectoryArticle,
  commit: string,
  images: WebsiteImageRegister | typeof register = register,
) {
  const entry = images.entries.find((entry) => entry.articleId === article.id);
  return !article.historical &&
    commit === images.dataCommit &&
    entry?.originalUrl === article.url &&
    entry.originalTitle === article.title &&
    entry.sourceName === article.sourceName
    ? entry
    : null;
}
