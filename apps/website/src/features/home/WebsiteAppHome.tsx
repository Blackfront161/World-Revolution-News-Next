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
import { selectAppHomeArticles } from './app-home-selection';
import { appTopics, appTopicLabel, homeReadingSummary, homeCoverage } from './home-editorial';
import './app-home.css';
import { WebsiteArticleIllustration } from './WebsiteArticleIllustration';
import { getWebsiteHomeCopy } from './website-home-copy';
import { DirectoryArticleLink } from '../reader/directory-article-link';

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
const topics = appTopics;

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
  const [editionOpen, setEditionOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const preferences = useSourcePreferences();
  const copy = getWebsiteHomeCopy(language);
  const labels = homeLabels[language],
    ui = getUiCopy(language),
    directoryCopy = getDirectoryCopy(language),
    homeCopy = getProductionHomeCopy(language);
  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeWebsiteContentDirectory((next) => {
      if (active) setData(next);
    });
    const controller = new AbortController();
    void loadWebsiteContentDirectory(controller.signal).then(
      (next) => {
        if (active) {
          setData(next);
          setFailed(false);
        }
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
  const title = (article: DirectoryArticle, position: number) =>
    data && homeReadingSummary(article, data.document.sourceCommit, language)?.headline ? (
      <>{homeReadingSummary(article, data.document.sourceCommit, language)!.headline}</>
    ) : (
      <AutomaticDirectoryTitle
        article={article}
        directoryRevision={`${data!.document.sourceCommit}:${data!.document.observedAt}`}
        language={language}
        adapter={productionTranslationAdapter}
        position={position}
      />
    );
  const summary = (article: DirectoryArticle) =>
    data ? homeReadingSummary(article, data.document.sourceCommit, language) : null;
  const story = (article: DirectoryArticle, role = 'main', position = 0) => (
    <article
      className={`app-start-story app-start-story--${role}`}
      {...(role === 'edition'
        ? { 'data-edition-article': article.id }
        : { 'data-app-home-article': article.id })}
      key={article.id}
    >
      {data && (
        <WebsiteArticleIllustration
          article={article}
          commit={data.document.sourceCommit}
          language={language}
          eager={role === 'lead'}
        />
      )}
      <div className="app-start-story__meta">
        <span>{article.sourceName}</span>
        <time dateTime={article.publishedAt ?? undefined}>{dated(article)}</time>
      </div>
      {role === 'lead' ? (
        <h2 className="app-start-headline">
          <DirectoryArticleLink id={article.id} language={language}>
            {title(article, position)}
          </DirectoryArticleLink>
        </h2>
      ) : (
        <h3>
          <DirectoryArticleLink id={article.id} language={language}>
            {title(article, position)}
          </DirectoryArticleLink>
        </h3>
      )}
      {summary(article) && (
        <p className="app-start-story__summary" lang={summary(article)!.language}>
          {summary(article)!.text}
        </p>
      )}
      <div className="app-start-story__topics">
        {article.topics.map((t) => (
          <span key={t}>{appTopicLabel(t, language)}</span>
        ))}
      </div>
      <a
        className="app-start-original"
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
      >
        {directoryCopy.originalLink} <span aria-hidden="true">↗</span>
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
  const coverage = selected ? homeCoverage(selected.current, now) : null;
  return (
    <div className="website-app-start">
      <nav className="app-start-topics" aria-label={ui.topics}>
        <button type="button" aria-pressed={!topic} onClick={() => setTopic('')}>
          {labels[6]}
        </button>
        {topics.map((t) => (
          <button type="button" key={t} aria-pressed={topic === t} onClick={() => setTopic(t)}>
            {appTopicLabel(t, language)}
          </button>
        ))}
      </nav>
      {selected && (
        <p className="app-start-editorial-credit" lang={language}>
          {copy.editorialCredit}
        </p>
      )}
      {!selected ? (
        <div role={failed ? 'alert' : 'status'}>
          <p>{failed ? directoryCopy.loadError : ui.loading}</p>
          {failed && (
            <button
              type="button"
              onClick={() => {
                setFailed(false);
                setAttempt((a) => a + 1);
              }}
            >
              {directoryCopy.retry}
            </button>
          )}
        </div>
      ) : (
        <>
          {topic ? (
            <section>
              <h2 className="app-start-topic-title">{appTopicLabel(topic, language)}</h2>
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
                <div className="app-start-front-main">
                  <section className="app-start-lead">
                    {selected.lead ? story(selected.lead, 'lead') : <h2>{homeCopy.latest}</h2>}
                  </section>
                  <section data-app-home-section="top">
                    {heading(labels[0])}
                    <div className="app-start-grid app-start-grid--front">
                      {selected.top.slice(0, 2).map((a, i) => story(a, 'main', i + 1))}
                    </div>
                  </section>
                </div>
                <aside className="app-start-latest">
                  {heading(homeCopy.latest, onBrowse)}
                  <ol>
                    {selected.current.slice(0, 5).map((article, i) => (
                      <li key={article.id} data-home-directory-article={article.id}>
                        <time dateTime={article.publishedAt ?? undefined}>{dated(article)}</time>
                        <DirectoryArticleLink id={article.id} language={language}>
                          {title(article, i + 1)}
                        </DirectoryArticleLink>
                        <small>{article.sourceName}</small>
                      </li>
                    ))}
                  </ol>
                </aside>
              </div>
              <section data-app-home-section="top" aria-label={labels[0]}>
                <div className="app-start-grid">
                  {selected.top.slice(2).map((a, i) => story(a, 'main', i + 3))}
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
                      <DirectoryArticleLink id={a.id} language={language}>
                        {title(a, i + 16)}
                      </DirectoryArticleLink>
                      <small>{a.sourceName}</small>
                    </li>
                  ))}
                </ol>
              </section>
              <section data-app-home-section="today">
                {heading(copy.today)}
                <div className="app-start-today">
                  <article>
                    <h3>{copy.last24Hours}</h3>
                    <strong>{coverage?.last24Hours}</strong>
                    <p>{copy.reports}</p>
                    <button type="button" onClick={onBrowse}>
                      {labels[5]} →
                    </button>
                  </article>
                  <article>
                    <h3>{labels[4]}</h3>
                    <dl className="app-start-metrics">
                      <div>
                        <dt>{copy.languages}</dt>
                        <dd>{coverage?.languages}</dd>
                      </div>
                      <div>
                        <dt>{copy.regions}</dt>
                        <dd>{coverage?.regions}</dd>
                      </div>
                      <div>
                        <dt>{copy.sources}</dt>
                        <dd>{coverage?.sources}</dd>
                      </div>
                    </dl>
                    <p>{copy.coverage}</p>
                    <button type="button" onClick={onBrowse}>
                      {ui.discover} →
                    </button>
                  </article>
                  <article>
                    <h3>{copy.edition}</h3>
                    <strong>{selected.briefing.length}</strong>
                    <p>{copy.editionIntro}</p>
                    <button
                      type="button"
                      onClick={() => setEditionOpen((open) => !open)}
                      aria-expanded={editionOpen}
                      aria-controls="app-start-edition"
                    >
                      {copy.openEdition} <span aria-hidden="true">→</span>
                    </button>
                  </article>
                  <article>
                    <h3>{ui.solidarity}</h3>
                    <p>{copy.solidarityIntro}</p>
                    <a href="#solidarity">{ui.solidarity} →</a>
                  </article>
                </div>
                {editionOpen && (
                  <section
                    id="app-start-edition"
                    className="app-start-edition"
                    aria-label={copy.edition}
                  >
                    <header>
                      <h3>{copy.edition}</h3>
                      <button type="button" onClick={() => setEditionOpen(false)}>
                        {copy.close}
                      </button>
                    </header>
                    <p>{copy.notes}</p>
                    {selected.briefing.map((a, i) => story(a, 'edition', i + 16))}
                  </section>
                )}
                <div className="app-start-more-sections">
                  <a href="#media">{ui.media} →</a>
                  <a href="#knowledge">{ui.knowledge} →</a>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
