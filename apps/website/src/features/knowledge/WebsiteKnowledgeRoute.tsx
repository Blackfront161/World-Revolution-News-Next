import { useEffect, useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import { getMobileKnowledgeCopy, type UiLanguage } from '@wrn/ui-language';
import { getWebsiteSupportCopy } from '@wrn/ui-language/support';
import { loadWebsiteKnowledge, type WebsiteKnowledge } from './knowledge-loader';
import './knowledge.css';

type Tab = 'library' | 'lexicon';
const pageSize = 30;
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

function Library({ data, language }: { data: WebsiteKnowledge; language: UiLanguage }) {
  const copy = getMobileKnowledgeCopy(language);
  const supportCopy = getWebsiteSupportCopy(language);
  const [query, setQuery] = useState('');
  const [bookLanguage, setBookLanguage] = useState('');
  const [source, setSource] = useState('');
  const [format, setFormat] = useState('');
  const [shown, setShown] = useState(pageSize);
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
  useEffect(() => {
    const timeout = window.setTimeout(() => setShown(pageSize), 0);
    return () => window.clearTimeout(timeout);
  }, [bookLanguage, format, query, source]);
  const reset = () => {
    setQuery('');
    setBookLanguage('');
    setSource('');
    setFormat('');
  };
  const languages = [...new Set(data.projection.books.flatMap((book) => book.languages))].sort();
  const formats = [...new Set(data.projection.books.flatMap((book) => book.formats))].sort();
  return (
    <section className="website-knowledge-panel" aria-label={copy.library}>
      <div className="website-content-filters">
        <label>
          {copy.search}
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          {copy.language}
          <select value={bookLanguage} onChange={(event) => setBookLanguage(event.target.value)}>
            <option value="">{copy.all}</option>
            {languages.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          {copy.source}
          <select value={source} onChange={(event) => setSource(event.target.value)}>
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
          <select value={format} onChange={(event) => setFormat(event.target.value)}>
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
            <li key={book.id}>
              <h3 lang={book.languages[0]}>{book.title}</h3>
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
        <button type="button" onClick={() => setShown((count) => count + pageSize)}>
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
    </section>
  );
}

function Lexicon({ data, language }: { data: WebsiteKnowledge; language: UiLanguage }) {
  const copy = getMobileKnowledgeCopy(language);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const terms = useMemo(
    () =>
      data.projection.terms.filter(
        (term) =>
          (!query ||
            normalize(
              `${term.title.de} ${term.title.en} ${term.summary.de} ${term.summary.en}`,
            ).includes(normalize(query))) &&
          (!category || term.category === category),
      ),
    [category, data, query],
  );
  const selected = terms.find((term) => term.id === selectedId) ?? terms[0] ?? null;
  const text = (value: { de: string; en: string }) => (language === 'de' ? value.de : value.en);
  const select = (id: string) => {
    setQuery('');
    setCategory('');
    setSelectedId(id);
  };
  return (
    <section className="website-knowledge-panel" aria-label={copy.lexicon}>
      <div className="website-content-filters">
        <label>
          {copy.search}
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          {copy.category}
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">{copy.all}</option>
            {[...new Set(data.projection.terms.map((term) => term.category))].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      {language !== 'de' && language !== 'en' ? <p>{copy.fallback}</p> : null}
      <div className="website-lexicon-layout">
        <ul className="website-content-list">
          {terms.map((term) => (
            <li key={term.id}>
              <button
                type="button"
                aria-pressed={selected?.id === term.id}
                onClick={() => setSelectedId(term.id)}
              >
                <span lang={language === 'de' ? 'de' : 'en'}>{text(term.title)}</span>
              </button>
            </li>
          ))}
        </ul>
        {selected ? (
          <article>
            <h2 lang={language === 'de' ? 'de' : 'en'}>{text(selected.title)}</h2>
            <p>
              <strong>{copy.definition}</strong> {text(selected.summary)}
            </p>
            <p>
              <strong>{copy.practice}</strong> {text(selected.practice)}
            </p>
            <p>
              <strong>{copy.perspectives}</strong> {text(selected.debate)}
            </p>
            <p className="website-safe-links">
              <strong>{copy.related}</strong>
              {selected.related
                .map((id) => data.projection.terms.find((term) => term.id === id))
                .filter((term): term is NonNullable<typeof term> => term !== undefined)
                .map((term) => (
                  <button key={term.id} type="button" onClick={() => select(term.id)}>
                    {text(term.title)}
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
          </article>
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
  const [tab, setTab] = useState<Tab>('library');
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
      <p className="hero-kicker">{copy.provenance}</p>
      <h1 id="website-page-title" ref={headingRef} tabIndex={-1}>
        {copy.title}
      </h1>
      <p>{copy.intro}</p>
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
            <time dateTime={data.document.observedAt}>
              {new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeZone: 'UTC' }).format(
                new Date(data.document.observedAt),
              )}
            </time>
          </p>
          <p>{copy.offlineNote}</p>
          <div className="website-content-tabs" role="group" aria-label={copy.title}>
            <button
              type="button"
              aria-pressed={tab === 'library'}
              onClick={() => setTab('library')}
            >
              {copy.library}
            </button>
            <button
              type="button"
              aria-pressed={tab === 'lexicon'}
              onClick={() => setTab('lexicon')}
            >
              {copy.lexicon}
            </button>
          </div>
          {tab === 'library' ? (
            <Library data={data} language={language} />
          ) : (
            <Lexicon data={data} language={language} />
          )}
        </>
      )}
    </section>
  );
}
