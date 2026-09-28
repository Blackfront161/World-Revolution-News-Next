import { useEffect, useState } from 'react';
import { isUiLanguage, type UiLanguage } from '@wrn/ui-language';
import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import type { ProductionTranslationAdapter } from './production-translation';
import { queueDirectoryTitleTranslation } from './production-home-translation';

type Cached = Readonly<{ text: string; expiresAt: number }>;
const cache = new Map<string, Cached>();
const originalLabel: Readonly<Record<UiLanguage, string>> = {
  de: 'Original',
  en: 'Original',
  es: 'Original',
  fr: 'Original',
  it: 'Original',
  pt: 'Original',
  ru: 'Оригинал',
  el: 'Πρωτότυπο',
  tr: 'Özgün',
};
const translatedLabel: Readonly<Record<UiLanguage, string>> = {
  de: 'Maschinell übersetzt',
  en: 'Machine translated',
  es: 'Traducción automática',
  fr: 'Traduction automatique',
  it: 'Traduzione automatica',
  pt: 'Tradução automática',
  ru: 'Машинный перевод',
  el: 'Αυτόματη μετάφραση',
  tr: 'Makine çevirisi',
};
const unavailableLabel: Readonly<Record<UiLanguage, string>> = {
  de: 'Übersetzung nicht verfügbar',
  en: 'Translation unavailable',
  es: 'Traducción no disponible',
  fr: 'Traduction indisponible',
  it: 'Traduzione non disponibile',
  pt: 'Tradução indisponível',
  ru: 'Перевод недоступен',
  el: 'Η μετάφραση δεν είναι διαθέσιμη',
  tr: 'Çeviri kullanılamıyor',
};

/** Automatically translates only public, known-language directory headlines. */
export function AutomaticDirectoryTitle({
  article,
  directoryRevision,
  language,
  adapter,
  position,
}: Readonly<{
  article: DirectoryArticle;
  directoryRevision: string;
  language: UiLanguage;
  adapter: ProductionTranslationAdapter | null;
  position: number;
}>) {
  const sourceLanguage = isUiLanguage(article.language) ? article.language : null;
  const key =
    adapter && sourceLanguage && sourceLanguage !== language
      ? `${directoryRevision}:${article.id}:${article.title}:${language}:${JSON.stringify(adapter.identity)}`
      : '';
  const [result, setResult] = useState<Readonly<{
    key: string;
    text: string;
    expiresAt: number;
  }> | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [expiryTick, setExpiryTick] = useState(0);
  const cached = key ? cache.get(key) : undefined;
  const translated =
    key && cached && cached.expiresAt > Date.now()
      ? cached.text
      : result?.key === key && result.expiresAt > Date.now()
        ? result.text
        : null;

  useEffect(() => {
    const until = Math.max(cached?.expiresAt ?? 0, result?.key === key ? result.expiresAt : 0);
    if (!key || until <= Date.now()) return;
    const timer = setTimeout(() => setExpiryTick((value) => value + 1), until - Date.now() + 1);
    return () => clearTimeout(timer);
  }, [cached?.expiresAt, key, result]);

  useEffect(() => {
    if (!key || !adapter?.translateDirectoryTitle || !sourceLanguage) return;
    const known = cache.get(key);
    if (known && known.expiresAt > Date.now()) return;
    const controller = new AbortController();
    const expiresAt = Date.now() + 10 * 60_000;
    const isCurrent = () => !controller.signal.aborted && Date.now() <= expiresAt;
    void queueDirectoryTitleTranslation(
      adapter,
      {
        kind: 'directory-title',
        directoryRevision,
        articleId: article.id,
        text: article.title,
        sourceLanguage,
        targetLanguage: language,
        expiresAt,
      },
      controller.signal,
      isCurrent,
      position,
    ).then((outcome) => {
      if (!isCurrent()) return;
      if (outcome.kind !== 'translated') {
        if (outcome.kind !== 'discarded') setFailedKey(key);
        return;
      }
      setFailedKey(null);
      const validUntil = Math.min(Date.parse(outcome.response.cache.expiresAt), expiresAt);
      if (validUntil <= Date.now()) return;
      if (cache.size >= 96) cache.delete(cache.keys().next().value!);
      const text = outcome.response.translation.text;
      cache.set(key, { text, expiresAt: validUntil });
      setResult({ key, text, expiresAt: validUntil });
    });
    return () => controller.abort();
  }, [
    adapter,
    article.id,
    article.title,
    directoryRevision,
    key,
    language,
    position,
    sourceLanguage,
    expiryTick,
  ]);

  if (!translated)
    return (
      <>
        <span lang={sourceLanguage ?? undefined}>{article.title}</span>
        {key && failedKey === key && (
          <small className="directory-title-original" lang={language}>
            {unavailableLabel[language]}
          </small>
        )}
      </>
    );
  return (
    <>
      <span lang={language}>{translated}</span>
      <small className="directory-title-original" lang={language}>
        {translatedLabel[language]} · {originalLabel[language]}:{' '}
        <span lang={sourceLanguage ?? undefined}>{article.title}</span>
      </small>
    </>
  );
}
