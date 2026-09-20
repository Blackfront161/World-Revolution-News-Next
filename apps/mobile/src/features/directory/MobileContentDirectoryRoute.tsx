import { useEffect, useMemo, useState, type RefObject } from 'react';
import { getUiCopy, type UiLanguage } from '@wrn/ui-language';
import type { LoadedMobileContentDirectory } from './directory-loader.js';
import { loadMobileContentDirectory } from './directory-loader.js';
import {
  formatDirectoryCopy,
  getDirectoryCopy,
  getDirectorySportLabels,
  getDirectoryMetadataCopy,
} from './directory-copy.js';
import type { MobileDirectorySection } from './directory-navigation.js';
import './directory.css';
import { projectSourcePreferences } from '@wrn/domain';
import {
  useSourcePreferences,
  SourceProfile,
  SourcePreferencesPanel,
  SourcePreferencesNotice,
} from '../../../../../packages/browser-content/src/source-preferences-ui';
import { SportSources } from '../../../../../packages/browser-content/src/sport-sources';

export type MobileContentDirectoryRouteProps = Readonly<{
  language: UiLanguage;
  section?: MobileDirectorySection;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  onSectionChange?: (section: MobileDirectorySection) => void;
}>;
const externalProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
  referrerPolicy: 'no-referrer' as const,
};

export function MobileContentDirectoryRoute({
  language,
  section = 'news',
  headingRef,
  onSectionChange,
}: MobileContentDirectoryRouteProps) {
  const copy = getDirectoryCopy(language);
  const metadata = getDirectoryMetadataCopy(language);
  const ui = getUiCopy(language);
  const sourcePreferences = useSourcePreferences();
  const [data, setData] = useState<LoadedMobileContentDirectory | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('');
  const [articleLanguage, setArticleLanguage] = useState('');
  const [feed, setFeed] = useState<'all' | 'current' | 'historical'>('current');
  const [shown, setShown] = useState(30);
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [sourceShown, setSourceShown] = useState(30);
  const [attempt, setAttempt] = useState(0);
  const load = () => setAttempt((value) => value + 1);
  useEffect(() => {
    let active = true;
    setFailed(false);
    loadMobileContentDirectory()
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  useEffect(() => {
    if (data !== null && document.activeElement === document.body) headingRef?.current?.focus();
  }, [data, headingRef]);
  const articles = useMemo(
    () =>
      projectSourcePreferences(
        data?.projection.articles.filter(
          (article) =>
            (feed === 'all' ||
              article.observations.some(
                (o) => o.provenance.dataset === (feed === 'current' ? 'github' : 'app'),
              )) &&
            (!source || article.sourceName === source) &&
            (!articleLanguage || article.language === articleLanguage) &&
            `${article.title} ${article.sourceName} ${article.topics.join(' ')}`
              .toLocaleLowerCase()
              .includes(query.toLocaleLowerCase()),
        ) ?? [],
        sourcePreferences.state,
        'directory',
        (article) => article.endpointIds,
      ),
    [data, feed, source, articleLanguage, query, sourcePreferences.state],
  );
  const sources = useMemo(
    () =>
      projectSourcePreferences(
        data?.projection.sources.filter(
          (entry) =>
            (!sourceLanguage ||
              entry.observations.some((o) => o.languages.includes(sourceLanguage))) &&
            [entry.url, ...entry.observations.map((o) => `${o.name} ${o.languages.join(' ')}`)]
              .join(' ')
              .toLocaleLowerCase()
              .includes(query.trim().toLocaleLowerCase()),
        ) ?? [],
        sourcePreferences.state,
        'directory',
        (entry) => [entry.id],
        { includeHidden: true },
      ),
    [data, query, sourceLanguage, sourcePreferences.state],
  );
  const reset = () => {
    setQuery('');
    setSource('');
    setArticleLanguage('');
    setFeed('current');
    setShown(30);
  };
  if (data === null)
    return (
      <section className="content-directory" aria-live="polite">
        {failed ? (
          <>
            <p role="alert">{copy.loadError}</p>
            <button type="button" onClick={load}>
              {copy.retry}
            </button>
          </>
        ) : (
          <p role="status">{copy.loading}</p>
        )}
      </section>
    );
  const sourceNames = [
    ...new Set(data.projection.articles.map((article) => article.sourceName)),
  ].sort((a, b) => a.localeCompare(b));
  const languages = [
    ...new Set(data.projection.articles.map((article) => article.language)),
  ].sort();
  const sourceLanguages = [
    ...new Set(
      data.projection.sources.flatMap((entry) => entry.observations.flatMap((o) => o.languages)),
    ),
  ].sort();
  const sport = getDirectorySportLabels(language);
  return (
    <section className="content-directory" aria-labelledby="mobile-page-title">
      <SourcePreferencesNotice />
      <h2 id="mobile-page-title" ref={headingRef} tabIndex={-1}>
        {section === 'news' ? copy.title : section === 'sources' ? copy.sources : copy.sport}
      </h2>
      <details className="content-directory__about">
        <summary>{metadata.about}</summary>
        <p>{copy.intro}</p>
        <p>{metadata.offline}</p>
        {section !== 'sport' && <p>{metadata.selection}</p>}
        {section === 'sport' && <p>{metadata.ownNote}</p>}
      </details>
      <p className="content-directory__snapshot">
        {formatDirectoryCopy(copy.snapshot, { date: data.document.observedAt.slice(0, 10) })}
      </p>
      <nav aria-label={copy.title}>
        {(['news', 'sources', 'sport'] as const).map((entry) => (
          <button
            type="button"
            key={entry}
            aria-current={section === entry ? 'page' : undefined}
            onClick={() => onSectionChange?.(entry)}
          >
            {entry === 'news' ? copy.news : entry === 'sources' ? copy.sources : copy.sport}
          </button>
        ))}
      </nav>
      {section === 'news' && (
        <>
          <div className="content-directory__filters">
            <label>
              {copy.search}
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setShown(30);
                }}
              />
            </label>
            <label>
              {copy.source}
              <select
                value={source}
                onChange={(event) => {
                  setSource(event.target.value);
                  setShown(30);
                }}
              >
                <option value="">{copy.all}</option>
                {sourceNames.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label>
              {copy.language}
              <select
                value={articleLanguage}
                onChange={(event) => {
                  setArticleLanguage(event.target.value);
                  setShown(30);
                }}
              >
                <option value="">{copy.all}</option>
                {languages.map((entry) => (
                  <option key={entry}>{entry}</option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>{copy.news}</legend>
              {(['all', 'current', 'historical'] as const).map((entry) => (
                <label key={entry}>
                  <input
                    type="radio"
                    name="directory-feed"
                    checked={feed === entry}
                    onChange={() => {
                      setFeed(entry);
                      setShown(30);
                    }}
                  />
                  {entry === 'all'
                    ? copy.all
                    : entry === 'current'
                      ? copy.current
                      : copy.historical}
                </label>
              ))}
            </fieldset>
            <button type="button" onClick={reset}>
              {copy.reset}
            </button>
          </div>
          <p>
            {formatDirectoryCopy(copy.showing, {
              shown: Math.min(shown, articles.length),
              total: articles.length,
            })}
          </p>
          {articles.length === 0 ? (
            <p>{copy.noResults}</p>
          ) : (
            <ol className="content-directory__list">
              {articles.slice(0, shown).map((article) => (
                <li key={article.id}>
                  <a
                    href={article.url}
                    lang={article.language === 'und' ? undefined : article.language}
                    {...externalProps}
                  >
                    {article.title}
                  </a>
                  <p>
                    {article.sourceName} · {article.language} ·{' '}
                    {article.publishedAt?.slice(0, 10) ?? metadata.unknown}
                  </p>
                  {article.endpointIds.length === 0 && <p>{metadata.unmapped}</p>}
                  <details>
                    <summary>{metadata.observations}</summary>
                    {article.observations.map((o) => (
                      <div key={`${o.provenance.dataset}-${o.provenance.row}`}>
                        <p>
                          {o.provenance.dataset === 'app' ? copy.historical : copy.current} ·{' '}
                          {o.title} · {o.sourceName} · {o.language} ·{' '}
                          {o.publishedAt?.slice(0, 10) ?? metadata.unknown}
                        </p>
                        <p>{o.topics.join(' · ')}</p>
                        <p>{o.rawUrl}</p>
                        <p>
                          {o.provenance.repo} · {o.provenance.commit} · {o.provenance.path} ·
                          SHA256: {o.provenance.inputSHA256}
                        </p>
                        <p>
                          {metadata.observed}: {o.provenance.observedAt}
                        </p>
                      </div>
                    ))}
                  </details>
                </li>
              ))}
            </ol>
          )}
          {shown < articles.length && (
            <button type="button" onClick={() => setShown((value) => value + 30)}>
              {copy.loadMore}
            </button>
          )}
        </>
      )}
      {section === 'sources' && (
        <>
          <SourcePreferencesPanel
            knownSources={data.projection.sources.map((entry) => ({
              catalog: 'directory',
              sourceId: entry.id,
              name: entry.name,
            }))}
          />
          <p>{metadata.endpoints}</p>
          <p>{metadata.historicalStatus}</p>
          <div className="content-directory__filters">
            <label>
              {copy.search}
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSourceShown(30);
                }}
              />
            </label>
            <label>
              {copy.language}
              <select
                value={sourceLanguage}
                onChange={(event) => {
                  setSourceLanguage(event.target.value);
                  setSourceShown(30);
                }}
              >
                <option value="">{copy.all}</option>
                {sourceLanguages.map((entry) => (
                  <option key={entry}>{entry}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSourceLanguage('');
                setSourceShown(30);
              }}
            >
              {copy.reset}
            </button>
          </div>
          <p>
            {formatDirectoryCopy(copy.showing, {
              shown: Math.min(sourceShown, sources.length),
              total: sources.length,
            })}
          </p>
          <ul className="content-directory__list">
            {sources.slice(0, sourceShown).map((entry) => (
              <li key={entry.id}>
                {entry.historicalHttp ? (
                  <>
                    <strong>{entry.name}</strong>
                    <p>{entry.url}</p>
                    <p>{copy.historicalHttp}</p>
                  </>
                ) : (
                  <a href={entry.url} {...externalProps}>
                    {entry.name}
                  </a>
                )}
                <p>{entry.languages.join(' · ') || metadata.unknown}</p>
                <SourceProfile catalog="directory" sourceId={entry.id} name={entry.name}>
                  <p>{entry.mediaType ?? metadata.unknown}</p>
                  {entry.observations.map((o) => (
                    <p key={`${o.provenance.dataset}-${o.provenance.row}`}>
                      {o.topics.join(' · ')} · {o.originCountry ?? metadata.unknown} ·{' '}
                      {o.originRegion ?? metadata.unknown}
                    </p>
                  ))}
                </SourceProfile>
                <details>
                  <summary>
                    {metadata.observations} ({entry.observations.length})
                  </summary>
                  {entry.observations.map((o) => (
                    <div key={`${o.provenance.dataset}-${o.provenance.row}`}>
                      <p>
                        {o.provenance.dataset === 'app' ? copy.historical : copy.current} · {o.name}{' '}
                        · {o.languages.join(' · ') || metadata.unknown} ·{' '}
                        {o.mediaType ?? metadata.unknown}
                      </p>
                      <p>
                        {metadata.recordedStatus}: {o.status ?? metadata.unknown} ·{' '}
                        {String(o.active ?? '—')}
                      </p>
                      <p>
                        {o.topics.join(' · ')} · {o.originCountry} · {o.originRegion}
                      </p>
                      <p>{o.rawUrl}</p>
                      <p>{o.homepage}</p>
                      <p>
                        {o.provenance.repo} · {o.provenance.commit} · {o.provenance.path} · SHA256:{' '}
                        {o.provenance.inputSHA256}
                      </p>
                      <p>
                        {metadata.observed}: {o.provenance.observedAt} ·{' '}
                        {copy.snapshot.replace(
                          '{date}',
                          o.provenance.sourceDate?.slice(0, 10) ?? metadata.unknown,
                        )}
                      </p>
                    </div>
                  ))}
                </details>
              </li>
            ))}
          </ul>
          {sources.length === 0 && <p>{copy.noResults}</p>}
          {sourceShown < sources.length && (
            <button type="button" onClick={() => setSourceShown((value) => value + 30)}>
              {copy.loadMore}
            </button>
          )}
          <SportSources language={language} />
        </>
      )}
      {section === 'sport' && (
        <>
          <SportSources language={language} open />
          <p>{copy.sportNote}</p>
          <ul className="content-directory__list">
            {projectSourcePreferences(
              data.projection.sports,
              sourcePreferences.state,
              'directory',
              (entry) => entry.endpointIds,
            ).map((entry) => (
              <li key={entry.id}>
                <a href={entry.url} lang="en" {...externalProps}>
                  {entry.title}
                </a>
                <p>
                  {sport.author}: {entry.author} · {entry.publisher} · {sport.published}:{' '}
                  {entry.publishedAt} · {sport.category}:{' '}
                  {entry.category === 'football' ? ui.sportFootball : ui.sportFanculture}
                </p>
                <p lang={language === 'de' ? 'de' : 'en'}>
                  {language === 'de' ? entry.noteDe : entry.noteEn}
                </p>
                {language !== 'de' && language !== 'en' && (
                  <p>
                    {sport.noteLanguage}: {sport.fallback}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
