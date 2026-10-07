import { useEffect, useMemo, useState, type RefObject } from 'react';
import {
  getDirectoryCopy,
  formatDirectoryCopy,
  getDirectoryMetadataCopy,
} from '@wrn/ui-language/directory';
import type { UiLanguage } from '@wrn/ui-language';
import {
  loadWebsiteContentDirectory,
  subscribeWebsiteContentDirectory,
  type WebsiteContentDirectory,
} from './directory-loader';
import type {
  DirectoryArticle,
  DirectorySource,
} from '@wrn/content-contracts/mobile-content-directory-v1';
import type { SourcePassRecord } from '@wrn/content-contracts/source-pass-overlay-v1';
import type { WebsiteDirectorySection } from './directory-navigation';
import './directory.css';
import { CoverageDetails } from '../projection/WebsiteCoverage';
import { getProjectionCopy } from '../projection/projection-copy';
import { projectDirectorySourcePreferences, projectSourcePreferences } from '@wrn/domain';
import {
  useSourcePreferences,
  SourceProfile,
  SourcePreferencesPanel,
  SourcePreferencesNotice,
} from '../../../../../packages/browser-content/src/source-preferences-ui';
import { SportSources } from '../../../../../packages/browser-content/src/sport-sources';
import { DirectoryArticleLink } from '../reader/directory-article-link';
import { homeReadingSummary } from '../home/home-editorial';
import { WebsiteArticleIllustration } from '../home/WebsiteArticleIllustration';
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
type SelectedDirectorySource = Readonly<{
  ids: ReadonlySet<string>;
  name: string;
  names: ReadonlySet<string>;
}>;
const selectDirectorySource = (source: DirectorySource): SelectedDirectorySource => ({
  ids: new Set([source.id]),
  name: source.name,
  names: new Set([source.name, ...source.observations.map((entry) => entry.name)]),
});
function selectCuratedSource(
  record: SourcePassRecord,
  sources: readonly DirectorySource[],
): SelectedDirectorySource {
  const ids = new Set(record.endpoints.map((entry) => entry.endpointId));
  const linkedSources = sources.filter((entry) => ids.has(entry.id));
  return {
    ids,
    name: record.canonicalName,
    names: new Set([
      record.canonicalName,
      ...record.aliasNames,
      ...linkedSources.flatMap((entry) => [
        entry.name,
        ...entry.observations.map((observation) => observation.name),
      ]),
    ]),
  };
}
function matchesSelectedSource(article: DirectoryArticle, source: SelectedDirectorySource) {
  return (
    article.endpointIds.some((id) => source.ids.has(id)) ||
    source.names.has(article.sourceName) ||
    article.observations.some((entry) => source.names.has(entry.sourceName))
  );
}
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
  const [selectedSource, setSelectedSource] = useState<SelectedDirectorySource | null>(null);
  const [sourceRegion, setSourceRegion] = useState('');
  const [sourceCountry, setSourceCountry] = useState('');
  const [sourceTopic, setSourceTopic] = useState('');
  const [sourceMedium, setSourceMedium] = useState('');
  const [shown, setShown] = useState(30);
  const readerArticleIds = useMemo(
    () =>
      new Set(
        data
          ? projectDirectorySourcePreferences({
              articles: data.projection.articles,
              sources: data.projection.sources,
              preferences: sourcePreferences.state,
            }).map((article) => article.id)
          : [],
      ),
    [data, sourcePreferences.state],
  );
  useEffect(() => {
    const c = new AbortController();
    const unsubscribe = subscribeWebsiteContentDirectory(setData);
    loadWebsiteContentDirectory(c.signal)
      .then(setData)
      .catch(() => setFailed(true));
    return () => {
      unsubscribe();
      c.abort();
    };
  }, []);
  const entries = useMemo(
    () =>
      data === null
        ? []
        : section === 'news'
          ? projectDirectorySourcePreferences({
              articles: data.projection.articles.filter(
                (x) =>
                  `${x.title} ${x.sourceName}`
                    .toLocaleLowerCase()
                    .includes(query.toLocaleLowerCase()) &&
                  (!contentLanguage || x.language === contentLanguage) &&
                  (!source || x.sourceName === source) &&
                  (!selectedSource || matchesSelectedSource(x, selectedSource)),
              ),
              sources: data.projection.sources,
              preferences: sourcePreferences.state,
              includeHidden: Boolean(source || selectedSource),
            })
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
      selectedSource,
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
  const sourceArticleLabel =
    language === 'de' ? 'Alle Meldungen dieser Quelle' : 'All news from this source';
  const sourceArticleCount = (selected: SelectedDirectorySource) =>
    data.projection.articles.filter((article) => matchesSelectedSource(article, selected)).length;
  const showSourceNews = (selected: SelectedDirectorySource) => {
    setSelectedSource(selected);
    setSource('');
    setQuery('');
    setContentLanguage('');
    setShown(30);
    onSectionChange('news');
  };
  return (
    <section className="website-directory" aria-labelledby="website-page-title">
      <SourcePreferencesNotice />
      <p className="hero-kicker">{copy.intro}</p>
      <h1 id="website-page-title" ref={headingRef} tabIndex={-1}>
        {title}
      </h1>
      <p>{formatDirectoryCopy(copy.snapshot, { date: data.document.observedAt.slice(0, 10) })}</p>
      <CoverageDetails data={data} language={language} />
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
              setSelectedSource(null);
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
                  setSelectedSource(null);
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
              setSelectedSource(null);
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
      {section === 'news' && selectedSource && (
        <p className="website-directory-source-selection">
          {copy.source}: <strong>{selectedSource.name}</strong>
        </p>
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
            <div className="website-curated-source-list">
              {curatedSources.map((record) => {
                const selected = selectCuratedSource(record, data.projection.sources);
                const count = sourceArticleCount(selected);
                return (
                  <div className="website-curated-source" key={record.id}>
                    <SourcePassCards
                      records={[record]}
                      language={language}
                      endpointUrl={(item, id) => sourcePassEndpointUrl(item, id, data.projection)}
                    />
                    {count > 0 && (
                      <button
                        type="button"
                        aria-label={`${sourceArticleLabel}: ${record.canonicalName} (${count})`}
                        onClick={() => showSourceNews(selected)}
                      >
                        {sourceArticleLabel} ({count})
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
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
                  ) : section === 'news' && readerArticleIds.has(entry.id) ? (
                    <DirectoryArticleLink
                      id={entry.id}
                      language={language}
                      contentLanguage={entry.language === 'und' ? undefined : entry.language}
                    >
                      {homeReadingSummary(
                        data.projection.articles.find((article) => article.id === entry.id)!,
                        data.document.sourceCommit,
                        language,
                      )?.headline ?? entry.title}
                    </DirectoryArticleLink>
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
                  {section === 'news' && readerArticleIds.has(entry.id) && (
                    <WebsiteArticleIllustration
                      article={data.projection.articles.find((article) => article.id === entry.id)!}
                      commit={data.document.sourceCommit}
                      imageRegister={data.images}
                      language={language}
                    />
                  )}
                  {section === 'sources' && (
                    <p>
                      {sourcePass?.records.some((record) =>
                        record.endpoints.some((endpoint) => endpoint.endpointId === entry.id),
                      )
                        ? getProjectionCopy(language).matchedLabel
                        : getProjectionCopy(language).pendingLabel}
                    </p>
                  )}
                  {section === 'sources' && (
                    <>
                      {(() => {
                        const directorySource = data.projection.sources.find(
                          (item) => item.id === entry.id,
                        );
                        if (!directorySource) return null;
                        const selected = selectDirectorySource(directorySource);
                        const count = sourceArticleCount(selected);
                        return count > 0 ? (
                          <button type="button" onClick={() => showSourceNews(selected)}>
                            {sourceArticleLabel} ({count})
                          </button>
                        ) : null;
                      })()}
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
                    </>
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
