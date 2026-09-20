import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { getMobileKnowledgeCopy, type UiLanguage } from '@wrn/ui-language';
import { loadMobileKnowledge, type LoadedMobileKnowledge } from './knowledge-loader';
import './knowledge.css';

type Tab = 'library' | 'lexicon';
const pageSize = 30;
// Description languages observed in the pinned v1 catalogue, not the books' languages.
const libraryDescriptionLanguages: Readonly<Record<string, string>> = Object.freeze({
  'anarchist-library-en': 'de',
  'anarchist-library-de': 'de',
  'anarchist-library-es': 'es',
  'anarchist-library-fr': 'fr',
  'anarchist-library-it': 'it',
  'libcom-library': 'de',
  'kate-sharpley-library': 'de',
  'zabalaza-books': 'de',
  'anarchist-archive': 'de',
});
const normalize = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
const linkProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
  referrerPolicy: 'no-referrer',
} as const;
function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} {...linkProps}>
      {children}
    </a>
  );
}
function Library({ data, language }: { data: LoadedMobileKnowledge; language: UiLanguage }) {
  const copy = getMobileKnowledgeCopy(language);
  const [query, setQuery] = useState('');
  const [selectedLanguage, setLanguage] = useState('');
  const [source, setSource] = useState('');
  const [format, setFormat] = useState('');
  const [shown, setShown] = useState(pageSize);
  const books = useMemo(
    () =>
      data.projection.books.filter((book) => {
        const words = `${book.title} ${book.authors.join(' ')} ${book.topics.join(' ')} ${book.sourceName}`;
        return (
          (!query || normalize(words).includes(normalize(query))) &&
          (!selectedLanguage || book.languages.includes(selectedLanguage)) &&
          (!source || book.sourceId === source) &&
          (!format || book.formats.includes(format as 'html' | 'pdf' | 'epub'))
        );
      }),
    [data, format, query, selectedLanguage, source],
  );
  useEffect(() => setShown(pageSize), [query, selectedLanguage, source, format]);
  const languages = [...new Set(data.projection.books.flatMap((book) => book.languages))].sort();
  const formats = [...new Set(data.projection.books.flatMap((book) => book.formats))].sort();
  const reset = () => {
    setQuery('');
    setLanguage('');
    setSource('');
    setFormat('');
  };
  return (
    <section className="knowledge-panel" aria-label={copy.library}>
      <div className="knowledge-filters">
        <label>
          {copy.search}
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          {copy.language}
          <select value={selectedLanguage} onChange={(event) => setLanguage(event.target.value)}>
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
      {books.length === 0 ? (
        <p role="status">{copy.noResults}</p>
      ) : (
        <ol className="knowledge-list">
          {books.slice(0, shown).map((book) => (
            <li key={book.id}>
              <h3 lang={book.languages[0]}>{book.title}</h3>
              <p>
                {book.authors.join(', ') || '—'} · {book.languages.join(', ')} · {book.sourceName}
              </p>
              <div className="knowledge-links">
                {book.readUrl ? <ExternalLink href={book.readUrl}>{copy.read}</ExternalLink> : null}
                {Object.entries(book.downloads).map(([kind, url]) => (
                  <ExternalLink key={kind} href={url}>
                    {kind.toUpperCase()}
                  </ExternalLink>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
      {shown < books.length ? (
        <button type="button" onClick={() => setShown((count) => count + pageSize)}>
          {copy.loadMore}
        </button>
      ) : null}
      <h3>{copy.sources}</h3>
      <ul className="knowledge-sources">
        {data.projection.librarySources.map((item) => (
          <li key={item.id}>
            <strong>{item.name}</strong>
            <p lang={libraryDescriptionLanguages[item.id]}>{item.description}</p>
            <p>
              <small>
                {copy.historicalReview}: <time dateTime={item.verifiedAt}>{item.verifiedAt}</time>
              </small>
            </p>
            <ExternalLink href={item.catalogUrl}>{copy.openCatalog}</ExternalLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
function Lexicon({ data, language }: { data: LoadedMobileKnowledge; language: UiLanguage }) {
  const copy = getMobileKnowledgeCopy(language);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fallback = language !== 'de' && language !== 'en';
  const terms = useMemo(
    () =>
      data.projection.terms.filter((term) => {
        const text = `${term.title.de} ${term.title.en} ${term.aliases.de.join(' ')} ${term.aliases.en.join(' ')} ${term.summary.de} ${term.summary.en}`;
        return (
          (!query || normalize(text).includes(normalize(query))) &&
          (!category || term.category === category)
        );
      }),
    [category, data, query],
  );
  const selected = terms.find((term) => term.id === selectedId) ?? terms[0] ?? null;
  const selectRelated = (id: string) => {
    setQuery('');
    setCategory('');
    setSelectedId(id);
  };
  const text = (value: { de: string; en: string }) => (language === 'de' ? value.de : value.en);
  const mutualAid = data.projection.terms.find((term) => term.id === 'mutual-aid');
  return (
    <section className="knowledge-panel" aria-label={copy.lexicon}>
      <div className="knowledge-filters">
        <label>
          {copy.search}
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          {copy.category}
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">{copy.all}</option>
            {[...new Set(data.projection.terms.map((term) => term.category))].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      {fallback ? <p>{copy.fallback}</p> : null}
      <aside className="knowledge-reading-help">
        <strong>{copy.readingHelp}</strong>
        <ol>
          <li>{copy.checkSourceDate}</li>
          <li>{copy.comparePerspectives}</li>
          <li>{copy.deepenRelated}</li>
        </ol>
        {mutualAid ? (
          <button type="button" onClick={() => selectRelated(mutualAid.id)}>
            {copy.mutualAid}
          </button>
        ) : null}
      </aside>
      <div className="lexicon-layout">
        <ul className="knowledge-list">
          {terms.map((term) => (
            <li key={term.id}>
              <button
                type="button"
                className="knowledge-term-button"
                aria-pressed={selected?.id === term.id}
                onClick={() => setSelectedId(term.id)}
              >
                <span lang={language === 'de' ? 'de' : 'en'}>{text(term.title)}</span>
              </button>
            </li>
          ))}
        </ul>
        {selected ? (
          <article className="lexicon-detail">
            <h3 lang={language === 'de' ? 'de' : 'en'}>{text(selected.title)}</h3>
            <p>
              <strong>{copy.definition}</strong>{' '}
              <span lang={language === 'de' ? 'de' : 'en'}>{text(selected.summary)}</span>
            </p>
            <p>
              <strong>{copy.practice}</strong>{' '}
              <span lang={language === 'de' ? 'de' : 'en'}>{text(selected.practice)}</span>
            </p>
            <p>
              <strong>{copy.perspectives}</strong>{' '}
              <span lang={language === 'de' ? 'de' : 'en'}>{text(selected.debate)}</span>
            </p>
            <div className="knowledge-links">
              <strong>{copy.related}</strong>{' '}
              {selected.related
                .map((id) => data.projection.terms.find((term) => term.id === id))
                .filter((term): term is NonNullable<typeof term> => term !== undefined)
                .map((term) => (
                  <button key={term.id} type="button" onClick={() => selectRelated(term.id)}>
                    <span lang={language === 'de' ? 'de' : 'en'}>{text(term.title)}</span>
                  </button>
                ))}
              {selected.related.length === 0 ? '—' : null}
            </div>
            <h4>{copy.sources}</h4>
            <ul>
              {selected.sources
                .map((id) => data.projection.lexiconSources.find((item) => item.id === id))
                .filter((item): item is NonNullable<typeof item> => item !== undefined)
                .map((item) => (
                  <li key={item.id}>
                    <ExternalLink href={item.url}>{item.name}</ExternalLink>
                    <p lang={language === 'de' ? 'de' : 'en'}>{text(item.description)}</p>
                    <div className="knowledge-links">
                      {item.downloads.map((download) => (
                        <ExternalLink key={download.url} href={download.url}>
                          {download.label}
                        </ExternalLink>
                      ))}
                    </div>
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
export function MobileKnowledgeRoute({
  language,
  headingRef,
}: {
  language: UiLanguage;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const copy = getMobileKnowledgeCopy(language);
  const [tab, setTab] = useState<Tab>('library');
  const [data, setData] = useState<LoadedMobileKnowledge | null>(null);
  const [failed, setFailed] = useState(false);
  const [retryEpoch, setRetryEpoch] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    loadMobileKnowledge()
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [retryEpoch]);
  useLayoutEffect(() => {
    if (
      document.activeElement === document.body ||
      document.activeElement?.id === 'mobile-page-title'
    )
      headingRef.current?.focus();
  }, [headingRef]);
  return (
    <section className="knowledge-view" aria-labelledby="mobile-page-title">
      <p className="feed-overline">{copy.provenance}</p>
      <h2 id="mobile-page-title" ref={headingRef} tabIndex={-1}>
        {copy.title}
      </h2>
      <p>{copy.intro}</p>
      {data === null ? (
        <div role="status">
          {failed ? (
            <>
              <p>{copy.error}</p>
              <button type="button" onClick={() => setRetryEpoch((value) => value + 1)}>
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
          <div className="knowledge-tabs" role="group" aria-label={copy.title}>
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
