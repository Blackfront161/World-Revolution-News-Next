import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import type { UiLanguage } from '@wrn/ui-language';
import { homeReadingSummary } from './home-editorial';
import { getWebsiteHomeCopy } from './website-home-copy';
import { websiteArticleIllustration } from './article-illustration';
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
