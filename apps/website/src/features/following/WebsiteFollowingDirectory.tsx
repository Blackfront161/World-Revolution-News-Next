import { useEffect, useMemo, useState } from 'react';
import {
  projectPersonalizedDirectoryArticles,
  projectDirectorySourcePreferences,
  type LocalPersonalizationStateV1,
} from '@wrn/domain';
import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import type { UiLanguage } from '@wrn/ui-language';
import { formatDirectoryCopy, getDirectoryCopy } from '@wrn/ui-language/directory';
import {
  loadWebsiteContentDirectory,
  subscribeWebsiteContentDirectory,
  type WebsiteContentDirectory,
} from '../directory/directory-loader';
import { useSourcePreferences } from '../../../../../packages/browser-content/src/source-preferences-ui';
import './following-directory.css';
import { DirectoryArticleLink } from '../reader/directory-article-link';
import { homeReadingSummary } from '../home/home-editorial';
import { WebsiteArticleIllustration } from '../home/WebsiteArticleIllustration';

const pageSize = 30;
const title: Readonly<Record<UiLanguage, string>> = {
  de: 'Aktuelle Links für mich',
  en: 'Current links for me',
  es: 'Enlaces actuales para mí',
  fr: 'Liens récents pour moi',
  it: 'Link recenti per me',
  pt: 'Links recentes para mim',
  ru: 'Актуальные ссылки для меня',
  el: 'Πρόσφατοι σύνδεσμοι για μένα',
  tr: 'Benim için güncel bağlantılar',
};
const note: Readonly<Record<UiLanguage, string>> = {
  de: 'Gefilterte Metadaten und Original-Links aus dem Nachrichtenverzeichnis; keine geprüften Volltexte. Deine Auswahl bleibt auf diesem Gerät.',
  en: 'Filtered metadata and original links from the news directory; these are not validated full texts. Your selection stays on this device.',
  es: 'Metadatos filtrados y enlaces originales del directorio de noticias; no son textos completos verificados. Tu selección permanece en este dispositivo.',
  fr: 'Métadonnées filtrées et liens originaux du répertoire d’actualités ; ce ne sont pas des textes intégraux vérifiés. Votre sélection reste sur cet appareil.',
  it: 'Metadati filtrati e link originali dall’indice delle notizie; non sono testi integrali verificati. La tua selezione resta su questo dispositivo.',
  pt: 'Metadados filtrados e links originais do diretório de notícias; não são textos integrais verificados. Sua seleção fica neste dispositivo.',
  ru: 'Отфильтрованные метаданные и ссылки на оригиналы из каталога новостей; это не проверенные полные тексты. Ваш выбор остаётся на этом устройстве.',
  el: 'Φιλτραρισμένα μεταδεδομένα και σύνδεσμοι προς τα πρωτότυπα από τον κατάλογο ειδήσεων· δεν είναι ελεγμένα πλήρη κείμενα. Οι επιλογές σας μένουν σε αυτή τη συσκευή.',
  tr: 'Haber dizininden filtrelenmiş üst veriler ve özgün bağlantılar; doğrulanmış tam metin değildir. Seçiminiz bu cihazda kalır.',
};

export function WebsiteFollowingDirectory({
  language,
  preferences,
  loadDirectory = loadWebsiteContentDirectory,
}: {
  language: UiLanguage;
  preferences: LocalPersonalizationStateV1;
  loadDirectory?: (signal: AbortSignal) => Promise<WebsiteContentDirectory>;
}) {
  const [directory, setDirectory] = useState<WebsiteContentDirectory | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pagination, setPagination] = useState({ preferences, count: pageSize });
  const shown = pagination.preferences === preferences ? pagination.count : pageSize;
  const sourcePreferences = useSourcePreferences();
  const copy = getDirectoryCopy(language);

  useEffect(() => {
    const controller = new AbortController();
    const unsubscribe =
      loadDirectory === loadWebsiteContentDirectory
        ? subscribeWebsiteContentDirectory(setDirectory)
        : () => {};
    loadDirectory(controller.signal)
      .then((loaded) => {
        if (!controller.signal.aborted) {
          setDirectory(loaded);
          setFailed(false);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => {
      unsubscribe();
      controller.abort();
    };
  }, [loadDirectory, attempt]);

  const articles = useMemo(
    () =>
      directory
        ? projectDirectorySourcePreferences({
            articles: projectPersonalizedDirectoryArticles({
              state: preferences,
              articles: directory.projection.articles,
            }),
            sources: directory.projection.sources,
            preferences: sourcePreferences.state,
          })
        : [],
    [directory, preferences, sourcePreferences.state],
  );

  return (
    <section className="website-following-directory" aria-labelledby="following-directory-title">
      <h2 id="following-directory-title">{title[language]}</h2>
      <p className="website-following-directory__notice">{note[language]}</p>
      {directory && (
        <p className="website-following-directory__asof">
          {formatDirectoryCopy(copy.snapshot, { date: directory.document.observedAt.slice(0, 10) })}
        </p>
      )}
      {!directory && !failed && <p role="status">{copy.loading}</p>}
      {failed && !directory && (
        <>
          <p role="alert">{copy.loadError}</p>
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setAttempt((current) => current + 1);
            }}
          >
            {copy.retry}
          </button>
        </>
      )}
      {directory && (
        <>
          <p role="status">
            {formatDirectoryCopy(copy.showing, {
              shown: Math.min(shown, articles.length),
              total: articles.length,
            })}
          </p>
          {articles.length === 0 && <p>{copy.noResults}</p>}
          <ol className="website-following-directory__list">
            {articles.slice(0, shown).map((article: DirectoryArticle) => (
              <li key={article.id}>
                <DirectoryArticleLink
                  id={article.id}
                  language={language}
                  contentLanguage={article.language === 'und' ? undefined : article.language}
                >
                  {homeReadingSummary(article, directory.document.sourceCommit, language)
                    ?.headline ?? article.title}
                </DirectoryArticleLink>
                <WebsiteArticleIllustration
                  article={article}
                  commit={directory.document.sourceCommit}
                  language={language}
                />
                <p>
                  {article.sourceName}
                  {article.publishedAt && (
                    <>
                      {' '}
                      ·{' '}
                      <time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10)}</time>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ol>
          {shown < articles.length && (
            <button
              type="button"
              onClick={() => setPagination({ preferences, count: shown + pageSize })}
            >
              {copy.loadMore}
            </button>
          )}
        </>
      )}
    </section>
  );
}
