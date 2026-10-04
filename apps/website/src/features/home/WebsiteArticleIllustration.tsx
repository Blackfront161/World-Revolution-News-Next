import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import type { UiLanguage } from '@wrn/ui-language';
import { homeReadingSummary } from './home-editorial';
import { getWebsiteHomeCopy } from './website-home-copy';
import { websiteArticleIllustration } from './article-illustration';
import {appArticleImage} from './app-article-images';
import {useState} from 'react';
export function WebsiteArticleIllustration({
  article,
  commit,
  language,
  eager = false,
}: {
  article: DirectoryArticle;
  commit: string;
  language: UiLanguage;
  eager?: boolean;
}) {
  const asset = websiteArticleIllustration(article, commit);
  const original=appArticleImage(article,commit);
  const [failed,setFailed]=useState<string|null>(null);
  if(original&&failed!==original.imageUrl)return (
    <figure className="app-start-illustration" data-app-article-image={article.id}>
      <img src={original.imageUrl} alt={article.title} lang={article.language==='und'?undefined:article.language} width="1672" height="941" loading={eager?'eager':'lazy'} decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(original.imageUrl)} />
      <figcaption><a href={article.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{article.sourceName} ↗</a></figcaption>
    </figure>
  );
  if (!asset) return null;
  const copy = getWebsiteHomeCopy(language);
  return (
    <figure className="app-start-illustration" data-wrn-illustration={article.id}>
      <img
        src={asset}
        alt={`${copy.illustrationCredit} · ${homeReadingSummary(article, commit, language)?.headline ?? article.title}`}
        lang={language}
        width="1672"
        height="941"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
      <figcaption lang={language}>
        <strong>{copy.illustrationCredit}</strong>
        {' · '}
        {copy.illustrationCaption}
      </figcaption>
    </figure>
  );
}
