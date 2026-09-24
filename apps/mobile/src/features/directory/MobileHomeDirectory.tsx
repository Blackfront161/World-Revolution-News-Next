import { useEffect, useMemo, useState } from 'react';
import { isUiLanguage, uiLanguageNativeNames, type UiLanguage } from '@wrn/ui-language';
import { selectHomeDirectoryArticles } from './home-directory-selection';
import { loadMobileContentDirectory, type LoadedMobileContentDirectory } from './directory-loader';
import { formatDirectoryCopy, getDirectoryCopy } from './directory-copy';
import './directory.css';
import { useSourcePreferences } from '../../../../../packages/browser-content/src/source-preferences-ui';

const titles: Readonly<Record<UiLanguage, string>> = {
  de: 'Aus dem Nachrichtenarchiv',
  en: 'From the news archive',
  es: 'Del archivo de noticias',
  fr: 'Dans les archives d’actualités',
  it: 'Dall’archivio delle notizie',
  pt: 'Do arquivo de notícias',
  ru: 'Из архива новостей',
  el: 'Από το αρχείο ειδήσεων',
  tr: 'Haber arşivinden',
};

export function MobileHomeDirectory({
  language,
  onBrowse,
  load = loadMobileContentDirectory,
}: Readonly<{
  language: UiLanguage;
  onBrowse: () => void;
  load?: () => Promise<LoadedMobileContentDirectory>;
}>) {
  const copy = getDirectoryCopy(language);
  const sourcePreferences = useSourcePreferences();
  const [data, setData] = useState<LoadedMobileContentDirectory | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      setFailed(false);
      load()
        .then((result) => {
          if (active) setData(result);
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [load, attempt]);
  const articles = useMemo(
    () =>
      selectHomeDirectoryArticles(
        data?.projection.articles ?? [],
        language,
        sourcePreferences.state,
      ),
    [data, language, sourcePreferences.state],
  );
  return (
    <section
      className="content-directory content-directory-home"
      aria-labelledby="home-directory-title"
    >
      <h2 id="home-directory-title">{titles[language]}</h2>
      <p>{copy.intro}</p>
      {data === null ? (
        failed ? (
          <>
            <p role="alert">{copy.loadError}</p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>
              {copy.retry}
            </button>
          </>
        ) : (
          <p role="status">{copy.loading}</p>
        )
      ) : (
        <>
          <p className="content-directory__snapshot">
            {formatDirectoryCopy(copy.snapshot, { date: data.document.observedAt.slice(0, 10) })}
          </p>
          {articles.length === 0 ? (
            <p role="status">{copy.noResults}</p>
          ) : (
            <ul className="content-directory__list">
              {articles.map((article) => (
                <li key={article.id} data-home-directory-article={article.id}>
                  <h3 lang={article.language}>{article.title}</h3>
                  <p>
                    <span lang={article.language}>{article.sourceName}</span> ·{' '}
                    <span lang={article.language}>
                      {isUiLanguage(article.language)
                        ? uiLanguageNativeNames[article.language]
                        : article.language}
                    </span>
                    {article.publishedAt !== null && (
                      <>
                        {' '}
                        ·{' '}
                        <time dateTime={article.publishedAt}>
                          {article.publishedAt.slice(0, 10)}
                        </time>
                      </>
                    )}
                  </p>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    aria-label={copy.originalLink + ': ' + article.title}
                  >
                    {copy.originalLink}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <button type="button" onClick={onBrowse}>
        {copy.title} →
      </button>
    </section>
  );
}
