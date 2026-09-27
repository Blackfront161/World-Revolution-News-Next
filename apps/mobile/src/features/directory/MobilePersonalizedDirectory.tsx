import { useEffect, useMemo, useState } from 'react';
import { isUiLanguage, uiLanguageNativeNames, type UiLanguage } from '@wrn/ui-language';
import {
  projectDirectorySourcePreferences,
  projectPersonalizedDirectoryArticles,
  type LocalPersonalizationStateV1,
} from '@wrn/domain';
import { useSourcePreferences } from '../../../../../packages/browser-content/src/source-preferences-ui';
import { loadMobileContentDirectory, type LoadedMobileContentDirectory } from './directory-loader';
import { formatDirectoryCopy, getDirectoryCopy } from './directory-copy';
import './directory.css';

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
const more: Readonly<Record<UiLanguage, string>> = {
  de: 'Weitere Links anzeigen',
  en: 'Show more links',
  es: 'Mostrar más enlaces',
  fr: 'Afficher plus de liens',
  it: 'Mostra altri link',
  pt: 'Mostrar mais links',
  ru: 'Показать больше ссылок',
  el: 'Περισσότεροι σύνδεσμοι',
  tr: 'Daha fazla bağlantı göster',
};

export function MobilePersonalizedDirectory({
  language,
  state,
  load = loadMobileContentDirectory,
}: Readonly<{
  language: UiLanguage;
  state: LocalPersonalizationStateV1;
  load?: () => Promise<LoadedMobileContentDirectory>;
}>) {
  const copy = getDirectoryCopy(language);
  const sourcePreferences = useSourcePreferences();
  const [data, setData] = useState<LoadedMobileContentDirectory | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [shown, setShown] = useState(12);
  useEffect(() => {
    let active = true;
    setFailed(false);
    load()
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [load, attempt]);
  const articles = useMemo(
    () =>
      projectDirectorySourcePreferences({
        articles: projectPersonalizedDirectoryArticles({
          state,
          articles: data?.projection.articles ?? [],
        }),
        sources: data?.projection.sources ?? [],
        preferences: sourcePreferences.state,
      }),
    [data, state, sourcePreferences.state],
  );
  return (
    <section className="content-directory content-directory-personalized" aria-labelledby="personalized-directory-title">
      <h3 id="personalized-directory-title">{title[language]}</h3>
      <p>{note[language]}</p>
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
            <>
              <ul className="content-directory__list">
                {articles.slice(0, shown).map((article) => (
                  <li key={article.id} data-personalized-directory-article={article.id}>
                    <h4 lang={article.language}>{article.title}</h4>
                    <p>
                      <span lang={article.language}>{article.sourceName}</span> ·{' '}
                      <span lang={article.language}>
                        {isUiLanguage(article.language)
                          ? uiLanguageNativeNames[article.language]
                          : article.language}
                      </span>
                      {article.publishedAt !== null && (
                        <>
                          {' '}· <time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10)}</time>
                        </>
                      )}
                    </p>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                    >
                      {copy.originalLink}<span aria-hidden="true"> ↗</span>
                    </a>
                  </li>
                ))}
              </ul>
              {shown < articles.length && (
                <button type="button" onClick={() => setShown((value) => value + 12)}>
                  {more[language]}
                </button>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
