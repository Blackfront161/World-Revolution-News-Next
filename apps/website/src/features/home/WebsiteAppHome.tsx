import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getUiCopy, type UiLanguage } from '@wrn/ui-language';
import { getDirectoryCopy } from '@wrn/ui-language/directory';
import { getProductionHomeCopy } from '@wrn/ui-language/production-home';
import { projectDirectorySourcePreferences } from '@wrn/domain';
import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import { useSourcePreferences } from '../../../../../packages/browser-content/src/source-preferences-ui';
import { AutomaticDirectoryTitle } from '../../../../../packages/browser-content/src/automatic-directory-title';
import { productionTranslationAdapter } from '../../production-translation-adapter';
import {
  loadWebsiteContentDirectory,
  subscribeWebsiteContentDirectory,
  type WebsiteContentDirectory,
} from '../directory/directory-loader';
import layout from './app-home-layout-v1.json';
import './app-home.css';

const homeLabels: Record<
  UiLanguage,
  readonly [string, string, string, string, string, string, string, string]
> = {
  de: [
    'Das Wichtigste',
    'Weitere Nachrichten',
    'In 5 Minuten',
    'Deine Tageslage',
    'Quellenbreite',
    'Nachrichtenarchiv',
    'Alle',
    'Termine & Veranstaltungen',
  ],
  en: [
    'The most important',
    'More news',
    'In 5 minutes',
    'Your daily overview',
    'Source diversity',
    'News archive',
    'All',
    'Events',
  ],
  es: [
    'Lo más importante',
    'Más noticias',
    'En 5 minutos',
    'Tu panorama diario',
    'Diversidad de fuentes',
    'Archivo de noticias',
    'Todo',
    'Eventos',
  ],
  fr: [
    'L’essentiel',
    'Autres actualités',
    'En 5 minutes',
    'Votre panorama du jour',
    'Diversité des sources',
    'Archives',
    'Tout',
    'Événements',
  ],
  it: [
    'Le notizie principali',
    'Altre notizie',
    'In 5 minuti',
    'Il tuo quadro quotidiano',
    'Diversità delle fonti',
    'Archivio',
    'Tutto',
    'Eventi',
  ],
  pt: [
    'O mais importante',
    'Mais notícias',
    'Em 5 minutos',
    'O teu panorama diário',
    'Diversidade de fontes',
    'Arquivo',
    'Tudo',
    'Eventos',
  ],
  ru: [
    'Главное',
    'Другие новости',
    'За 5 минут',
    'Ваш обзор дня',
    'Разнообразие источников',
    'Архив',
    'Все',
    'События',
  ],
  el: [
    'Τα σημαντικότερα',
    'Περισσότερες ειδήσεις',
    'Σε 5 λεπτά',
    'Η καθημερινή σας εικόνα',
    'Ποικιλία πηγών',
    'Αρχείο',
    'Όλα',
    'Εκδηλώσεις',
  ],
  tr: [
    'En önemli haberler',
    'Diğer haberler',
    '5 dakikada',
    'Günlük özetin',
    'Kaynak çeşitliliği',
    'Haber arşivi',
    'Tümü',
    'Etkinlikler',
  ],
};
const topics = [
  'Labor Struggles',
  'Squatting & Housing',
  'Antifascism',
  'Queer-Feminism',
  'No Borders',
] as const;
const deTopics = [
  'Arbeitskämpfe',
  'Besetzungen & Wohnen',
  'Antifaschismus',
  'Queer-Feminismus',
  'Keine Grenzen',
];

/** The App's actual Home selection, projected through the existing Website admission guard. */
export function selectAppHomeArticles(
  data: WebsiteContentDirectory,
  admitted: readonly DirectoryArticle[],
) {
  const current = admitted.filter((a) => !a.historical);
  const byId = new Map(current.map((a) => [a.id, a]));
  const pick = (ids: readonly string[]) =>
    ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  const bound = data.document.sourceCommit === layout.directoryCommit;
  const lead = bound && layout.lead ? (byId.get(layout.lead) ?? null) : null;
  return {
    lead,
    top: bound ? pick(layout.top) : [],
    sport: bound ? pick(layout.sport) : [],
    more: bound ? pick(layout.more) : [],
    briefing: bound ? pick(layout.briefing) : [],
    current,
  };
}

export function WebsiteAppHome({
  language,
  onBrowse,
  onSport,
  regionalEvents,
}: Readonly<{
  language: UiLanguage;
  onBrowse(): void;
  onSport(): void;
  regionalEvents: ReactNode;
}>) {
  const [data, setData] = useState<WebsiteContentDirectory | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [topic, setTopic] = useState('');
  const preferences = useSourcePreferences();
  const labels = homeLabels[language],
    ui = getUiCopy(language),
    directoryCopy = getDirectoryCopy(language),
    homeCopy = getProductionHomeCopy(language);
  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeWebsiteContentDirectory((next) => {
      if (active) setData(next);
    });
    setFailed(false);
    const controller = new AbortController();
    void loadWebsiteContentDirectory(controller.signal).then(
      (next) => {
        if (active) setData(next);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
      controller.abort();
      unsubscribe();
    };
  }, [attempt]);
  const selected = useMemo(
    () =>
      data
        ? selectAppHomeArticles(
            data,
            projectDirectorySourcePreferences({
              articles: data.projection.articles,
              sources: data.projection.sources,
              preferences: preferences.state,
            }),
          )
        : null,
    [data, preferences.state],
  );
  const dated = (article: DirectoryArticle) =>
    article.publishedAt
      ? new Intl.DateTimeFormat(language, {
          day: 'numeric',
          month: 'short',
          timeZone: 'UTC',
        }).format(new Date(article.publishedAt))
      : '';
  const title = (article: DirectoryArticle, position: number) => (
    <AutomaticDirectoryTitle
      article={article}
      directoryRevision={`${data!.document.sourceCommit}:${data!.document.observedAt}`}
      language={language}
      adapter={productionTranslationAdapter}
      position={position}
    />
  );
  const story = (article: DirectoryArticle, role = 'main', position = 0) => (
    <article
      className={`app-start-story app-start-story--${role}`}
      data-app-home-article={article.id}
      key={article.id}
    >
      <div className="app-start-story__meta">
        <span>{article.sourceName}</span>
        <time dateTime={article.publishedAt ?? undefined}>{dated(article)}</time>
      </div>
      {role === 'lead' ? (
        <h2 className="app-start-headline">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            {title(article, position)}
          </a>
        </h2>
      ) : (
        <h3>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            {title(article, position)}
          </a>
        </h3>
      )}
      <div className="app-start-story__topics">
        {article.topics.map((t) => (
          <span key={t}>
            {language === 'de' && topics.includes(t as (typeof topics)[number])
              ? deTopics[topics.indexOf(t as (typeof topics)[number])]
              : t}
          </span>
        ))}
      </div>
      <a
        className="app-start-original"
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
      >
        {language === 'de' ? 'Beitrag beim Original lesen' : directoryCopy.originalLink}{' '}
        <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
  const heading = (text: string, action?: () => void) => (
    <header className="app-start-section-heading">
      <h2>{text}</h2>
      {action && (
        <button type="button" onClick={action}>
          {labels[6]} <span aria-hidden="true">→</span>
        </button>
      )}
    </header>
  );
  return (
    <div className="website-app-start">
      <nav className="app-start-topics" aria-label={ui.topics}>
        <button type="button" aria-pressed={!topic} onClick={() => setTopic('')}>
          {labels[6]}
        </button>
        {topics.map((t, i) => (
          <button type="button" key={t} aria-pressed={topic === t} onClick={() => setTopic(t)}>
            {language === 'de' ? deTopics[i] : t}
          </button>
        ))}
      </nav>
      {!selected ? (
        <div role={failed ? 'alert' : 'status'}>
          <p>{failed ? directoryCopy.loadError : ui.loading}</p>
          {failed && (
            <button type="button" onClick={() => setAttempt((a) => a + 1)}>
              {directoryCopy.retry}
            </button>
          )}
        </div>
      ) : (
        <>
          {topic ? (
            <section>
              <h2 className="app-start-topic-title">
                {language === 'de'
                  ? (deTopics[topics.indexOf(topic as (typeof topics)[number])] ?? topic)
                  : topic}
              </h2>
              <div className="app-start-grid">
                {selected.current
                  .filter((a) => a.topics.includes(topic))
                  .slice(0, 30)
                  .map((a, i) => story(a, 'main', i))}
              </div>
              {!selected.current.some((a) => a.topics.includes(topic)) && (
                <p role="status">{directoryCopy.noResults}</p>
              )}
            </section>
          ) : (
            <>
              <div className="app-start-front">
                <section className="app-start-lead">
                  {selected.lead ? story(selected.lead, 'lead') : <h2>{homeCopy.latest}</h2>}
                </section>
                <aside className="app-start-latest">
                  {heading(homeCopy.latest, onBrowse)}
                  <ol>
                    {selected.current.slice(0, 5).map((article, i) => (
                      <li key={article.id} data-home-directory-article={article.id}>
                        <time dateTime={article.publishedAt ?? undefined}>{dated(article)}</time>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                        >
                          {title(article, i + 1)}
                        </a>
                        <small>{article.sourceName}</small>
                      </li>
                    ))}
                  </ol>
                </aside>
              </div>
              <section data-app-home-section="top">
                {heading(labels[0])}
                <div className="app-start-grid">
                  {selected.top.map((a, i) => story(a, 'main', i + 1))}
                </div>
              </section>
              {selected.sport.length > 0 && (
                <section data-app-home-section="sport">
                  {heading(ui.sportAndFanculture, onSport)}
                  <div className="app-start-grid">
                    {selected.sport.map((a, i) => story(a, 'sport', i + 6))}
                  </div>
                </section>
              )}
              <section data-app-home-section="events">{regionalEvents}</section>
              <section data-app-home-section="more">
                {heading(labels[1], onBrowse)}
                <div className="app-start-grid">
                  {selected.more.map((a, i) => story(a, 'main', i + 7))}
                </div>
              </section>
              <section data-app-home-section="briefing">
                {heading(labels[2])}
                <ol className="app-start-briefing">
                  {selected.briefing.map((a, i) => (
                    <li key={a.id}>
                      <b>{i + 1}</b>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                      >
                        {title(a, i + 16)}
                      </a>
                      <small>{a.sourceName}</small>
                    </li>
                  ))}
                </ol>
              </section>
              <section data-app-home-section="catalogues">
                {heading(language === 'de' ? 'Weitere Bereiche aus der App' : 'More from the app')}
                <div className="app-start-today">
                  <article>
                    <h3>{labels[4]}</h3>
                    <strong>{new Set(selected.current.map((a) => a.sourceName)).size}</strong>
                    <p>{ui.source}</p>
                    <button type="button" onClick={onBrowse}>
                      {labels[5]} →
                    </button>
                  </article>
                  <article>
                    <h3>{ui.media}</h3>
                    <a href="#media">{ui.media} →</a>
                  </article>
                  <article>
                    <h3>{ui.knowledge}</h3>
                    <a href="#knowledge">{ui.knowledge} →</a>
                  </article>
                  <article>
                    <h3>{ui.solidarity}</h3>
                    <a href="#solidarity">{ui.solidarity} →</a>
                  </article>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
