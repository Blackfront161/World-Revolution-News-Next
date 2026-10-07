import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import type { UiLanguage } from '@wrn/ui-language';
import { originalArticleImage } from './reviewed-article-images';
import { useState } from 'react';
import type { WebsiteImageRegister } from '../../../../../packages/content-contracts/src/directory/website-content-tuple-v1';
export function WebsiteArticleIllustration({
  article,
  commit,
  eager = false,
  imageRegister,
}: {
  article: DirectoryArticle;
  commit: string;
  language: UiLanguage;
  eager?: boolean;
  imageRegister?: WebsiteImageRegister | undefined;
}) {
  const original = originalArticleImage(article, commit, imageRegister);
  const [failed, setFailed] = useState<string | null>(null);
  if (original && failed !== original.imageUrl)
    return (
      <figure className="app-start-illustration" data-app-article-image={article.id}>
        <img
          src={original.imageUrl}
          alt={article.title}
          lang={article.language === 'und' ? undefined : article.language}
          width="1672"
          height="941"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(original.imageUrl)}
        />
        <figcaption>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            {article.sourceName} ↗
          </a>
          {original.imageCredit && <> · {original.imageCredit}</>}
        </figcaption>
      </figure>
    );
  return null;
}
