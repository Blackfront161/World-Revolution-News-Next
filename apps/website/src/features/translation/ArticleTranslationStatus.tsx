import { formatUiCopy, uiLanguageNativeNames, type UiLanguage } from '@wrn/ui-language';
import { getProductionTranslationCopy } from '@wrn/ui-language/production-translation';
import { getArticleTranslationCopy } from './translation-copy';
import { useSharedArticleTranslation } from './use-shared-article-translation';
import { useEffect, useState } from 'react';

export function ArticleTranslationStatus({
  translation,
  language,
}: {
  translation: ReturnType<typeof useSharedArticleTranslation>;
  language: UiLanguage;
}) {
  const { outcome, retry, online } = translation;
  const retryAt = outcome?.kind === 'error' ? outcome.retryAt : undefined;
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (retryAt === undefined || retryAt <= now) return;
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(2147483647, Math.max(0, retryAt - Date.now())),
    );
    return () => clearTimeout(timer);
  }, [retryAt, now]);
  if (!outcome) return null;
  const ui = getProductionTranslationCopy(language),
    copy = getArticleTranslationCopy(language);
  const waiting = retryAt !== undefined && retryAt > now;
  return (
    <aside className="website-article-translation" lang={language}>
      <p>{copy.disclosure}</p>
      <p role="status" aria-live="polite">
        {outcome.kind === 'translated'
          ? formatUiCopy(ui.translatedLabel, { language: uiLanguageNativeNames[language] })
          : outcome.kind === 'loading'
            ? ui.loading
            : outcome.kind === 'offline'
              ? ui.offline
              : outcome.kind === 'timeout'
                ? ui.timeout
                : outcome.kind === 'discarded'
                  ? ui.discarded
                  : outcome.kind === 'error'
                    ? ui.error
                    : copy.unavailable}
      </p>
      {outcome.kind === 'translated' && outcome.cache === 'hit' && <p>{copy.cache}</p>}
      {waiting && (
        <p>
          {copy.wait}{' '}
          <time dateTime={new Date(retryAt).toISOString()}>
            {new Intl.DateTimeFormat(language, { dateStyle: 'short', timeStyle: 'medium' }).format(
              retryAt,
            )}
          </time>
        </p>
      )}
      {['error', 'timeout', 'offline'].includes(outcome.kind) && (
        <button type="button" disabled={waiting || !online} onClick={retry}>
          {ui.retry}
        </button>
      )}
    </aside>
  );
}
