import type {DirectoryArticle} from '@wrn/content-contracts/mobile-content-directory-v1';
import register from './app-article-images-v1.json';
const entries=new Map(register.entries.map(entry=>[entry.articleId,entry]));
export function appArticleImage(article:DirectoryArticle,commit:string) {
 const entry=entries.get(article.id);
 return !article.historical&&commit===register.dataCommit&&entry?.originalUrl===article.url&&entry.originalTitle===article.title&&entry.sourceName===article.sourceName?entry:null;
}
