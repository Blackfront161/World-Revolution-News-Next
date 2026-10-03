import {
  navigateCatalogue,
  useCatalogueLocation,
  useCatalogueView,
} from '../catalogue-navigation/catalogue-navigation-state';
import { useEffect, useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import { getMobileKnowledgeCopy, type UiLanguage } from '@wrn/ui-language';
import { getWebsiteSupportCopy } from '@wrn/ui-language/support';
import { loadWebsiteKnowledge, type WebsiteKnowledge } from './knowledge-loader';
import { BlackAnarchismResources } from '../../../../../packages/browser-content/src/black-anarchism-resources';
import './knowledge.css';
import { LearningPaths } from './LearningPaths';
import { localizedKnowledgeTerm } from './lexicon-locales';
import { CatalogueItemPanel, CatalogueLink } from '../catalogue-navigation/catalogue-navigation';

const pageSize = 30;
const currentCatalogueCopy: Record<UiLanguage, { provenance: string; intro: string }> = {
  de: {
    provenance: 'WRN-Katalog · Bibliothek, Lexikon und Lernpfade',
    intro:
      'Bücher, Begriffe und Lesepfade aus unserem lokalen WRN-Katalog. Externe Texte öffnen bei ihrer Originalquelle.',
  },
  en: {
    provenance: 'WRN catalogue · library, glossary and learning paths',
    intro:
      'Books, terms and reading paths from our local WRN catalogue. External texts open at their original source.',
  },
  es: {
    provenance: 'Catálogo WRN · biblioteca, glosario e itinerarios',
    intro:
      'Libros, conceptos e itinerarios de lectura de nuestro catálogo local WRN. Los textos externos se abren en su fuente original.',
  },
  fr: {
    provenance: 'Catalogue WRN · bibliothèque, lexique et parcours',
    intro:
      'Livres, notions et parcours de lecture de notre catalogue local WRN. Les textes externes s’ouvrent à leur source originale.',
  },
  it: {
    provenance: 'Catalogo WRN · biblioteca, glossario e percorsi',
    intro:
      'Libri, concetti e percorsi di lettura dal nostro catalogo locale WRN. I testi esterni si aprono alla fonte originale.',
  },
  pt: {
    provenance: 'Catálogo WRN · biblioteca, glossário e percursos',
    intro:
      'Livros, conceitos e percursos de leitura do nosso catálogo local WRN. Os textos externos abrem na fonte original.',
  },
  ru: {
    provenance: 'Каталог WRN · библиотека, словарь и учебные маршруты',
    intro:
      'Книги, понятия и маршруты чтения из нашего локального каталога WRN. Внешние тексты открываются у первоисточника.',
  },
  el: {
    provenance: 'Κατάλογος WRN · βιβλιοθήκη, λεξικό και διαδρομές μάθησης',
    intro:
      'Βιβλία, έννοιες και διαδρομές ανάγνωσης από τον τοπικό κατάλογο WRN. Τα εξωτερικά κείμενα ανοίγουν στην αρχική πηγή.',
  },
  tr: {
    provenance: 'WRN kataloğu · kütüphane, sözlük ve öğrenme yolları',
    intro:
      'Yerel WRN kataloğumuzdan kitaplar, kavramlar ve okuma yolları. Harici metinler özgün kaynağında açılır.',
  },
};
const normalize = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
const external = {
  target: '_blank',
  rel: 'noopener noreferrer',
  referrerPolicy: 'no-referrer',
} as const;

function Library({
  data,
  language,
  onOpenTerm,
}: {
  data: WebsiteKnowledge;
  language: UiLanguage;
  onOpenTerm: (id: string) => void;
}) {
  const copy = getMobileKnowledgeCopy(language);
  const supportCopy = getWebsiteSupportCopy(language);
  const route = useCatalogueLocation();
  const { view, change, reset } = useCatalogueView('library', true);
  const { query, language: bookLanguage, source, format, shown } = view;
  const setQuery = (value: string) => change('query', value);
  const setBookLanguage = (value: string) => change('language', value);
  const setSource = (value: string) => change('source', value);
  const setFormat = (value: string) => change('format', value);
  const books = useMemo(
    () =>
      data.projection.books.filter((book) => {
        const text = `${book.title} ${book.authors.join(' ')} ${book.topics.join(' ')} ${book.sourceName}`;
        return (
          (!query || normalize(text).includes(normalize(query))) &&
          (!bookLanguage || book.languages.includes(bookLanguage)) &&
          (!source || book.sourceId === source) &&
          (!format || book.formats.includes(format as 'html' | 'pdf' | 'epub'))
        );
      }),
    [bookLanguage, data, format, query, source],
  );
  const languages = [...new Set(data.projection.books.flatMap((book) => book.languages))].sort();
  const formats = [...new Set(data.projection.books.flatMap((book) => book.formats))].sort();
  if (route?.kind === 'library' && (route.item || route.invalidItem)) {
    const book = data.projection.books.find((value) => value.id === route.item);
    return (
      <CatalogueItemPanel
        key={route.item}
        kind="library"
        item={route.item}
        language={language}
        title={book?.title ?? null}
        titleLanguage={book?.languages[0] ?? 'und'}
      >
        {book ? (
          <>
            <p>
              {book.authors.join(', ') || '—'} · {book.languages.join(', ')} · {book.sourceName}
            </p>
            <p>{book.topics.join(', ')}</p>
            <p className="website-safe-links">
              {book.readUrl ? (
                <a href={book.readUrl} {...external}>
                  {copy.read}
                </a>
              ) : null}
              {Object.entries(book.downloads).map(([kind, url]) => (
                <a key={kind} href={url} {...external}>
                  {kind.toUpperCase()}
                </a>
              ))}
            </p>
          </>
        ) : null}
      </CatalogueItemPanel>
    );
  }
  return (
    <section className="website-knowledge-panel" aria-label={copy.library}>
      <LearningPaths data={data} language={language} onOpenTerm={onOpenTerm} />
      <div className="website-content-filters" data-catalogue-view="library">
        <label>
          {copy.search}
          <input
            data-catalogue-control="query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          {copy.language}
          <select
            data-catalogue-control="language"
            value={bookLanguage}
            onChange={(event) => setBookLanguage(event.target.value)}
          >
            <option value="">{copy.all}</option>
            {languages.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          {copy.source}
          <select
            data-catalogue-control="source"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          >
            <option value="">{copy.all}</option>
            {data.projection.librarySources.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {copy.format}
          <select
            data-catalogue-control="format"
            value={format}
            onChange={(event) => setFormat(event.target.value)}
          >
            <option value="">{copy.all}</option>
            {formats.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={reset}>
          {copy.reset}
        </button>
      </div>
      <p role="status">
        {copy.shown
          .replace('{shown}', String(Math.min(shown, books.length)))
          .replace('{total}', String(books.length))}
      </p>
      <h2>{supportCopy.libraryResults}</h2>
      {books.length === 0 ? (
        <p role="status">{copy.noResults}</p>
      ) : (
        <ol className="website-content-list">
          {books.slice(0, shown).map((book) => (
            <li key={book.id} data-knowledge-book={book.id}>
              <h3 lang={book.languages[0]}>
                <CatalogueLink kind="library" item={book.id} language={language}>
                  {book.title}
                </CatalogueLink>
              </h3>
              <p>
                {book.authors.join(', ') || '—'} · {book.languages.join(', ')} · {book.sourceName}
              </p>
              <p className="website-safe-links">
                {book.readUrl ? (
                  <a href={book.readUrl} {...external}>
                    {copy.read}
                  </a>
                ) : null}
                {Object.entries(book.downloads).map(([kind, url]) => (
                  <a key={kind} href={url} {...external}>
                    {kind.toUpperCase()}
                  </a>
                ))}
              </p>
            </li>
          ))}
        </ol>
      )}
      {shown < books.length ? (
        <button type="button" onClick={() => change('shown', shown + pageSize)}>
          {copy.loadMore}
        </button>
      ) : null}
      <h2>{copy.sources}</h2>
      <ul className="website-source-list">
        {data.projection.librarySources.map((item) => (
          <li key={item.id}>
            <strong>{item.name}</strong>
            <p>{item.description}</p>
            <p>
              <small>
                {copy.historicalReview}: <time dateTime={item.verifiedAt}>{item.verifiedAt}</time>
              </small>
            </p>
            <a href={item.catalogUrl} {...external}>
              {copy.openCatalog}
            </a>
          </li>
        ))}
      </ul>
      <BlackAnarchismResources
        language={language}
        headingLevel={2}
        listClassName="website-source-list"
      />
    </section>
  );
}

function Lexicon({ data, language }: { data: WebsiteKnowledge; language: UiLanguage }) {
  const copy = getMobileKnowledgeCopy(language);
  const route = useCatalogueLocation();
  const { view, change } = useCatalogueView('lexicon', true);
  const { query, category } = view;
  const selectedId = route?.kind === 'lexicon' ? route.item : null;
  const terms = useMemo(
    () =>
      data.projection.terms.filter(
        (term) =>
          (!query ||
            normalize(
              `${term.title.de} ${term.title.en} ${term.summary.de} ${term.summary.en} ${localizedKnowledgeTerm(term, language).title} ${localizedKnowledgeTerm(term, language).summary}`,
            ).includes(normalize(query))) &&
          (!category || term.category === category),
      ),
    [category, data, query, language],
  );
  const selected = selectedId
    ? (data.projection.terms.find((term) => term.id === selectedId) ?? null)
    : route?.invalidItem
      ? null
      : (terms[0] ?? null);
  const selectedText = selected ? localizedKnowledgeTerm(selected, language) : null;
  const text = (value: { de: string; en: string }) => (language === 'de' ? value.de : value.en);
  const select = (id: string) => navigateCatalogue('lexicon', language, id);
  return (
    <section className="website-knowledge-panel" aria-label={copy.lexicon}>
      {!selectedId && !route?.invalidItem ? (
        <div className="website-content-filters" data-catalogue-view="lexicon">
          <label>
            {copy.search}
            <input
              data-catalogue-control="query"
              value={query}
              onChange={(event) => change('query', event.target.value)}
            />
          </label>
          <label>
            {copy.category}
            <select
              data-catalogue-control="category"
              value={category}
              onChange={(event) => change('category', event.target.value)}
            >
              <option value="">{copy.all}</option>
              {[...new Set(data.projection.terms.map((term) => term.category))].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {language !== 'de' && language !== 'en' && selectedText?.language !== language ? (
        <p>{copy.fallback}</p>
      ) : null}
      <div className="website-lexicon-layout">
        {!selectedId && !route?.invalidItem ? (
          <ul className="website-content-list">
            {terms.map((term) => (
              <li key={term.id}>
                <CatalogueLink kind="lexicon" item={term.id} language={language}>
                  <span lang={localizedKnowledgeTerm(term, language).language}>
                    {localizedKnowledgeTerm(term, language).title}
                  </span>
                </CatalogueLink>
              </li>
            ))}
          </ul>
        ) : null}
        {selected ? (
          <CatalogueItemPanel
            key={selectedId}
            kind="lexicon"
            item={selectedId}
            language={language}
            title={selectedText?.title ?? null}
            titleLanguage={selectedText?.language ?? language}
          >
            {selectedText?.draft ? (
              <p lang={selectedText.language}>
                {selectedText.language === 'fr'
                  ? 'Traduction éditoriale WRN · brouillon'
                  : 'Traducción editorial WRN · borrador'}
              </p>
            ) : null}
            <p>
              <strong>{copy.definition}</strong>{' '}
              <span lang={selectedText?.language}>{selectedText?.summary}</span>
            </p>
            <p>
              <strong>{copy.practice}</strong>{' '}
              <span lang={selectedText?.language}>{selectedText?.practice}</span>
            </p>
            <p>
              <strong>{copy.perspectives}</strong>{' '}
              <span lang={selectedText?.language}>{selectedText?.debate}</span>
            </p>
            <p className="website-safe-links">
              <strong>{copy.related}</strong>
              {selected.related
                .map((id) => data.projection.terms.find((term) => term.id === id))
                .filter((term): term is NonNullable<typeof term> => term !== undefined)
                .map((term) => (
                  <button key={term.id} type="button" onClick={() => select(term.id)}>
                    {localizedKnowledgeTerm(term, language).title}
                  </button>
                ))}
            </p>
            <h3>{copy.sources}</h3>
            <ul>
              {selected.sources
                .map((id) => data.projection.lexiconSources.find((source) => source.id === id))
                .filter((source): source is NonNullable<typeof source> => source !== undefined)
                .map((source) => (
                  <li key={source.id}>
                    <a href={source.url} {...external}>
                      {source.name}
                    </a>
                    <p>{text(source.description)}</p>
                  </li>
                ))}
            </ul>
          </CatalogueItemPanel>
        ) : selectedId || route?.invalidItem ? (
          <CatalogueItemPanel kind="lexicon" item={selectedId} language={language} title={null} />
        ) : (
          <p role="status">{copy.noResults}</p>
        )}
      </div>
    </section>
  );
}

export function WebsiteKnowledgeRoute({
  language,
  headingRef,
}: {
  language: UiLanguage;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const copy = getMobileKnowledgeCopy(language);
  const route = useCatalogueLocation();
  const tab = route?.kind === 'lexicon' ? 'lexicon' : 'library';
  const openTerm = (id: string) => navigateCatalogue('lexicon', language, id);
  const [data, setData] = useState<WebsiteKnowledge | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setFailed(false);
      setData(null);
      loadWebsiteKnowledge(controller.signal)
        .then(setData)
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) setFailed(true);
        });
    }, 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [retry]);
  useLayoutEffect(() => {
    if (document.activeElement === document.body) headingRef.current?.focus();
  }, [headingRef]);
  return (
    <section className="website-knowledge-view" aria-labelledby="website-page-title">
      <p className="hero-kicker">{currentCatalogueCopy[language].provenance}</p>
      <h1 id="website-page-title" ref={headingRef} tabIndex={-1}>
        {copy.title}
      </h1>
      <p>{currentCatalogueCopy[language].intro}</p>
      {data === null ? (
        <div role="status">
          {failed ? (
            <>
              <p>{copy.error}</p>
              <button type="button" onClick={() => setRetry((value) => value + 1)}>
                {copy.retry}
              </button>
            </>
          ) : (
            copy.loading
          )}
        </div>
      ) : (
        <>
          <p>
            {copy.snapshotDate}:{' '}
            <time
              dateTime={
                tab === 'lexicon' ? data.glossaryDocument.observedAt : data.document.observedAt
              }
            >
              {new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeZone: 'UTC' }).format(
                new Date(
                  tab === 'lexicon' ? data.glossaryDocument.observedAt : data.document.observedAt,
                ),
              )}
            </time>
          </p>
          <p>{copy.offlineNote}</p>
          <div className="website-content-tabs" role="group" aria-label={copy.title}>
            <button
              type="button"
              aria-pressed={tab === 'library'}
              onClick={() => navigateCatalogue('library', language)}
            >
              {copy.library}
            </button>
            <button
              type="button"
              aria-pressed={tab === 'lexicon'}
              onClick={() => navigateCatalogue('lexicon', language)}
            >
              {copy.lexicon}
            </button>
          </div>
          {tab === 'library' ? (
            <>
              <Library data={data} language={language} onOpenTerm={openTerm} />
            </>
          ) : (
            <Lexicon data={data} language={language} />
          )}
        </>
      )}
    </section>
  );
}
