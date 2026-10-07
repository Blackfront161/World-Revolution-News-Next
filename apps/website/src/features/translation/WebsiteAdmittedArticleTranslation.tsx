import { useState } from 'react';
import {
  isUiLanguage,
  uiLanguageIds,
  uiLanguageNativeNames,
  type UiLanguage,
} from '@wrn/ui-language';
import type { ProductionArticleView } from '../../../../../packages/browser-content/src/production-content-view';
import { useSharedArticleTranslation } from './use-shared-article-translation';
import { ArticleTranslationStatus } from './ArticleTranslationStatus';
import { getArticleTranslationCopy } from './translation-copy';

export function WebsiteAdmittedArticleTranslation({
  view,
  language,
  route,
}: {
  view: Extract<ProductionArticleView, { kind: 'ready' }>;
  language: UiLanguage;
  route: string;
}) {
  const [version, setVersion] = useState({ ui: language, value: language });
  const target = version.ui === language ? version.value : language;
  const authority = view.translationAuthority;
  const binding = JSON.stringify(authority);
  // Only resolved, rights-admitted reader blocks enter this client. It never
  // retrieves publisher pages, image URLs, catalogue descriptions or drafts.
  const text = view.blocks
    .flatMap((block) =>
      block.kind === 'image'
        ? []
        : block.kind === 'list'
          ? [block.items.join('\n')]
          : block.kind === 'quote' && block.attribution
            ? [`${block.text}\n${block.attribution}`]
            : [block.text],
    )
    .join('\n\n');
  const translation = useSharedArticleTranslation(
    authority && text
      ? {
          title: view.article.title,
          text,
          sourceLanguage: view.article.originalLanguage,
          targetLanguage: target,
        }
      : null,
    `${route}:${binding}`,
    authority?.expiresAt ?? 0,
  );
  const result = translation.outcome?.kind === 'translated' ? translation.outcome : null;
  const copy = getArticleTranslationCopy(language);
  return (
    <section aria-label={copy.title}>
      <label>
        {copy.language}{' '}
        <select
          value={target}
          onChange={(event) => {
            if (isUiLanguage(event.target.value))
              setVersion({ ui: language, value: event.target.value });
          }}
        >
          {uiLanguageIds.map((id) => (
            <option key={id} value={id}>
              {uiLanguageNativeNames[id]}
            </option>
          ))}
        </select>
      </label>
      <ArticleTranslationStatus translation={translation} language={target} />
      {result && (
        <div
          lang={target}
          data-wrn-translation-authority={binding}
          data-wrn-translation-language={target}
          data-wrn-translated-title={result.title}
        >
          <h3>{result.title}</h3>
          {result.text.split(/\n\s*\n/u).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}
      {result && <h3 lang={language}>{copy.original}</h3>}
    </section>
  );
}
