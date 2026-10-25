import { useEffect, useMemo, useState, type RefObject } from 'react';
import {
  getDirectoryCopy,
  formatDirectoryCopy,
  getDirectoryMetadataCopy,
} from '@wrn/ui-language/directory';
import type { UiLanguage } from '@wrn/ui-language';
import { loadWebsiteContentDirectory, type WebsiteContentDirectory } from './directory-loader';
import type { WebsiteDirectorySection } from './directory-navigation';
import './directory.css';
import { projectSourcePreferences } from '@wrn/domain';
import {
  useSourcePreferences,
  SourceProfile,
  SourcePreferencesPanel,
  SourcePreferencesNotice,
} from '../../../../../packages/browser-content/src/source-preferences-ui';
import { SportSources } from '../../../../../packages/browser-content/src/sport-sources';
import { SourcePassCards } from '../../../../../packages/browser-content/src/source-pass-ui';
import {
  matchesSourcePass,
  sourcePassEndpointUrl,
  sourcePassFacets,
  sourcePassKnownSources,
} from '../../../../../packages/browser-content/src/source-pass-overlay';
import { useSourcePassOverlay } from '../../../../../packages/browser-content/src/source-pass-hook';
import {
  directorySourceFacets,
  matchesDirectorySourceFilters,
} from '../../../../../packages/browser-content/src/source-search';
import { getSourcePassCopy } from '@wrn/ui-language/source-pass';
const external = {
  target: '_blank',
  rel: 'noopener noreferrer',
  referrerPolicy: 'no-referrer',
} as const;
export function WebsiteContentDirectoryRoute({
  section,
  language,
  headingRef,
  onSectionChange,
}: {
  section: WebsiteDirectorySection;
  language: UiLanguage;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onSectionChange: (section: WebsiteDirectorySection) => void;
}) {
  const copy = getDirectoryCopy(language);
  const metadata = getDirectoryMetadataCopy(language);
  const sourcePreferences = useSourcePreferences();
  const [data, setData] = useState<WebsiteContentDirectory | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [contentLanguage, setContentLanguage] = useState('');
  const [source, setSource] = useState('');
  const [sourceRegion, setSourceRegion] = useState('');
  const [sourceCountry, setSourceCountry] = useState('');
  const [sourceTopic, setSourceTopic] = useState('');
  const [sourceMedium, setSourceMedium] = useState('');
  const [shown, setShown] = useState(30);
  useEffect(() => {
    const c = new AbortController();
    loadWebsiteContentDirectory(c.signal)
      .then(setData)
      .catch(() => setFailed(true));
    return () => c.abort();
  }, []);
  const entries = useMemo(
    () =>
      data === null
        ? []
        : section === 'news'
          ? projectSourcePreferences(
              data.projection.articles.filter(
                (x) =>
                  `${x.title} ${x.sourceName}`
                    .toLocaleLowerCase()
                    .includes(query.toLocaleLowerCase()) &&
                  (!contentLanguage || x.language === contentLanguage) &&
                  (!source || x.sourceName === source),
              ),
              sourcePreferences.state,
              'directory',
              (entry) => entry.endpointIds,
            )
          : section === 'sources'
            ? projectSourcePreferences(
                data.projection.sources.filter((x) =>
                  matchesDirectorySourceFilters(x, {
                    query,
                    language: contentLanguage,
                    region: sourceRegion,
                    country: sourceCountry,
                    topic: sourceTopic,
                    medium: sourceMedium,
                  }),
                ),
                sourcePreferences.state,
                'directory',
                (entry) => [entry.id],
                { includeHidden: true },
              )
            : projectSourcePreferences(
                data.projection.sports,
                sourcePreferences.state,
                'directory',
                (entry) => entry.endpointIds,
              ),
    [
      data,
      query,
      contentLanguage,
      source,
      sourceRegion,
      sourceCountry,
      sourceTopic,
      sourceMedium,
      section,
      sourcePreferences.state,
    ],
  );
  const sourcePassState = useSourcePassOverlay(data?.projection ?? null);
  const sourcePass = sourcePassState.kind === 'ready' ? sourcePassState.value.overlay : null;
  const curatedSources = useMemo(
    () =>
      sourcePass?.records.filter((entry) =>
        matchesSourcePass(entry, {
          query,
          language: contentLanguage,
          region: sourceRegion,
          country: sourceCountry,
          topic: sourceTopic,
          medium: sourceMedium,
        }),
      ) ?? [],
    [sourcePass, query, contentLanguage, sourceRegion, sourceCountry, sourceTopic, sourceMedium],
  );
  const languages = useMemo(
    () =>
      [
        ...new Set(
          data === null
            ? []
            : section === 'sources'
              ? data.projection.sources.flatMap((entry) => [...entry.languages])
              : data.projection.articles.map((entry) => entry.language),
        ),
      ].sort(),
    [data, section],
  );
  const sources = useMemo(
    () => [...new Set(data?.projection.articles.map((entry) => entry.sourceName) ?? [])].sort(),
    [data],
  );
  if (!data)
    return (
      <section className="website-directory" aria-live="polite">
        {failed ? (
          <>
            <p role="alert">{copy.loadError}</p>
            <button onClick={() => window.location.reload()}>{copy.retry}</button>
          </>
        ) : (
          <p role="status">{copy.loading}</p>
        )}
      </section>
    );
  const title = section === 'news' ? copy.title : section === 'sources' ? copy.sources : copy.sport;
  const rawSourceFacets = directorySourceFacets(data.projection.sources);
  const curatedFacets = sourcePassFacets(sourcePass?.records ?? []);
  const mergeFacet = (left: readonly string[], right: readonly string[]) =>
    [...new Set([...left, ...right])].sort((a, b) => a.localeCompare(b));
  const sourcePassCopy = getSourcePassCopy(language);
  return (
    <section className="website-directory" aria-labelledby="website-page-title">
      <SourcePreferencesNotice />
      <p className="hero-kicker">{copy.intro}</p>
      <h1 id="website-page-title" ref={headingRef} tabIndex={-1}>
        {title}
      </h1>
      <p>{formatDirectoryCopy(copy.snapshot, { date: data.document.observedAt.slice(0, 10) })}</p>
      {section === 'sport' && <p>{copy.sportNote}</p>}
      {section === 'sources' && (
        <SourcePreferencesPanel
          knownSources={sourcePassKnownSources(data.projection, sourcePass)}
        />
      )}
      <nav aria-label={copy.title}>
        {(['news', 'sources', 'sport'] as const).map((x) => (
          <button
            key={x}
            type="button"
            aria-current={x === section ? 'page' : undefined}
            onClick={() => {
              setQuery('');
              setContentLanguage('');
              setSource('');
              setSourceRegion('');
              setSourceCountry('');
              setSourceTopic('');
              setSourceMedium('');
              setShown(30);
              onSectionChange(x);
            }}
          >
            {x === 'news' ? copy.news : x === 'sources' ? copy.sources : copy.sport}
          </button>
        ))}
      </nav>
      {section !== 'sport' && (
        <div className="website-content-filters">
          <label>
            {copy.search}
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShown(30);
              }}
            />
          </label>
          <label>
            {copy.language}
            <select
              value={contentLanguage}
              onChange={(event) => {
                setContentLanguage(event.target.value);
                setShown(30);
              }}
            >
              <option value="">{copy.all}</option>
              {languages.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          {section === 'news' && (
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
                {sources.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          )}
          {section === 'sources' &&
            [
              [
                sourcePassCopy.region,
                sourceRegion,
                setSourceRegion,
                mergeFacet(rawSourceFacets.regions, curatedFacets.regions),
              ],
              [
                sourcePassCopy.country,
                sourceCountry,
                setSourceCountry,
                mergeFacet(rawSourceFacets.countries, curatedFacets.countries),
              ],
              [
                sourcePassCopy.topic,
                sourceTopic,
                setSourceTopic,
                mergeFacet(rawSourceFacets.topics, curatedFacets.topics),
              ],
              [
                sourcePassCopy.medium,
                sourceMedium,
                setSourceMedium,
                mergeFacet(rawSourceFacets.media, curatedFacets.media),
              ],
            ].map(([label, value, setter, options]) => (
              <label key={label as string}>
                {label as string}
                <select
                  value={value as string}
                  onChange={(event) => {
                    (setter as (value: string) => void)(event.target.value);
                    setShown(30);
                  }}
                >
                  <option value="">{copy.all}</option>
                  {(options as string[]).map((entry) => (
                    <option key={entry}>{entry}</option>
                  ))}
                </select>
              </label>
            ))}
          <button
            onClick={() => {
              setQuery('');
              setContentLanguage('');
              setSource('');
              setSourceRegion('');
              setSourceCountry('');
              setSourceTopic('');
              setSourceMedium('');
              setShown(30);
            }}
          >
            {copy.reset}
          </button>
        </div>
      )}
      {section === 'sources' && (
        <>
          <h2>{sourcePassCopy.curatedTitle}</h2>
          <p>{sourcePassCopy.curatedIntro}</p>
          {sourcePassState.kind === 'loading' ? (
            <p role="status">{copy.loading}</p>
          ) : sourcePassState.kind === 'invalid' ? (
            <p role="alert">{sourcePassCopy.unavailable}</p>
          ) : curatedSources.length === 0 ? (
            <p>{copy.noResults}</p>
          ) : (
            <SourcePassCards
              records={curatedSources}
              language={language}
              endpointUrl={(record, id) => sourcePassEndpointUrl(record, id, data.projection)}
            />
          )}
          <h2>{sourcePassCopy.completeTitle}</h2>
          <p>{sourcePassCopy.completeIntro}</p>
        </>
      )}
      <p role="status">
        {formatDirectoryCopy(copy.showing, {
          shown: String(Math.min(shown, entries.length)),
          total: String(entries.length),
        })}
      </p>
      {entries.length === 0 ? (
        <p>{copy.noResults}</p>
      ) : (
        <ol className="website-content-list">
          {entries
            .slice(0, shown)
            .map(
              (entry: {
                id: string;
                url: string;
                title?: string;
                name?: string;
                language?: string;
                sourceName?: string;
                languages?: readonly string[];
                publisher?: string;
                historicalHttp?: boolean;
                noteDe?: string;
                noteEn?: string;
                author?: string;
                publishedAt?: string | null;
              }) => (
                <li key={entry.id}>
                  {section === 'sources' && entry.historicalHttp ? (
                    <>
                      <strong>{entry.name}</strong>
                      <p>{entry.url}</p>
                      <p>{copy.historicalHttp}</p>
                    </>
                  ) : (
                    <a
                      href={entry.url}
                      lang={entry.language === 'und' ? undefined : entry.language}
                      {...external}
                    >
                      {entry.title ?? entry.name}
                    </a>
                  )}
                  <p>{entry.sourceName ?? entry.languages?.join(' · ') ?? entry.publisher}</p>
                  {section === 'sources' && (
                    <SourceProfile
                      catalog="directory"
                      sourceId={entry.id}
                      name={entry.name ?? entry.id}
                    >
                      <p>{metadata.historicalStatus}</p>
                      {data.projection.sources
                        .find((source) => source.id === entry.id)
                        ?.observations.map((o) => (
                          <div key={`${o.provenance.dataset}-${o.provenance.row}`}>
                            <p>
                              {o.mediaType ?? metadata.unknown} ·{' '}
                              {o.languages.join(' · ') || metadata.unknown}
                            </p>
                            <p>
                              {o.topics.join(' · ')} · {o.originCountry ?? metadata.unknown} ·{' '}
                              {o.originRegion ?? metadata.unknown}
                            </p>
                            <p>
                              {metadata.recordedStatus}: {o.status ?? metadata.unknown}
                            </p>
                            <p>
                              {metadata.observed}:{' '}
                              <time dateTime={o.provenance.observedAt}>
                                {o.provenance.observedAt.slice(0, 10)}
                              </time>
                            </p>
                          </div>
                        ))}
                    </SourceProfile>
                  )}
                  {section === 'sport' && (
                    <>
                      <p>
                        {entry.author}{' '}
                        {entry.publishedAt && (
                          <time dateTime={entry.publishedAt}>{entry.publishedAt.slice(0, 10)}</time>
                        )}
                      </p>
                      <p lang={language === 'de' ? 'de' : 'en'}>
                        {language === 'de' ? entry.noteDe : entry.noteEn}
                      </p>
                    </>
                  )}
                </li>
              ),
            )}
        </ol>
      )}
      {shown < entries.length && (
        <button onClick={() => setShown((x) => x + 30)}>{copy.loadMore}</button>
      )}
      {section === 'sources' && <SportSources language={language} headingLevel={2} />}
      {section === 'sport' && <SportSources language={language} headingLevel={2} open />}
    </section>
  );
}
