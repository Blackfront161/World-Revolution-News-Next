import {
  navigateCatalogue,
  useCatalogueLocation,
  useCatalogueView,
} from '../catalogue-navigation/catalogue-navigation-state';
import { useEffect, useMemo, useState } from 'react';
import { getMobileKnowledgeCopy, type UiLanguage } from '@wrn/ui-language';
import { getEventsMediaCopy } from '@wrn/ui-language/events-media';
import { loadWebsiteAppCatalog } from './events-media-loader';
import type { AppCatalog, CatalogKind, AppCatalogRecord } from './app-catalog';
import directories from './data/media-directory-sources.json';
import { radioCatalogueRows, radioOriginalStream } from './radio-original-links';
import { CatalogueItemPanel, CatalogueLink } from '../catalogue-navigation/catalogue-navigation';
const emptyRows: AppCatalogRecord[] = [];

const copyByLanguage: Record<UiLanguage, { title: string; radio: string; note: string }> = {
  de: {
    title: 'Aus der WRN-App',
    radio: 'Radios',
    note: 'Katalogstand der App · Metadaten und Originallinks',
  },
  en: {
    title: 'From the WRN app',
    radio: 'Radio',
    note: 'App catalogue snapshot · metadata and original links',
  },
  es: {
    title: 'De la app WRN',
    radio: 'Radios',
    note: 'Catálogo de la app · metadatos y enlaces originales',
  },
  fr: {
    title: 'Dans l’app WRN',
    radio: 'Radios',
    note: 'Catalogue de l’app · métadonnées et liens originaux',
  },
  it: {
    title: 'Dall’app WRN',
    radio: 'Radio',
    note: 'Catalogo dell’app · metadati e link originali',
  },
  pt: {
    title: 'Da app WRN',
    radio: 'Rádios',
    note: 'Catálogo da app · metadados e links originais',
  },
  ru: {
    title: 'Из приложения WRN',
    radio: 'Радио',
    note: 'Каталог приложения · метаданные и исходные ссылки',
  },
  el: {
    title: 'Από την εφαρμογή WRN',
    radio: 'Ραδιόφωνα',
    note: 'Κατάλογος εφαρμογής · μεταδεδομένα και αρχικοί σύνδεσμοι',
  },
  tr: {
    title: 'WRN uygulamasından',
    radio: 'Radyolar',
    note: 'Uygulama kataloğu · meta veriler ve özgün bağlantılar',
  },
};
const normalized = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();

export function WebsiteAppCatalog({
  mode,
  language,
}: {
  mode: 'media' | 'library' | 'events';
  language: UiLanguage;
}) {
  const copy = copyByLanguage[language];
  const common = getMobileKnowledgeCopy(language);
  const media = getEventsMediaCopy(language);
  const [data, setData] = useState<AppCatalog | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const route = useCatalogueLocation();
  const kind: CatalogKind =
    mode === 'media'
      ? route && ['radio', 'podcasts', 'videos'].includes(route.kind)
        ? (route.kind as 'radio' | 'podcasts' | 'videos')
        : 'radio'
      : mode;
  const { view, change, reset } = useCatalogueView(kind, data !== null);
  const { query, language: contentLanguage, source, country, shown } = view;
  const setQuery = (value: string) => change('query', value);
  const setContentLanguage = (value: string) => change('language', value);
  const setSource = (value: string) => change('source', value);
  const setCountry = (value: string) => change('country', value);
  const setShown = (value: number) => change('shown', value);
  useEffect(() => {
    const abort = new AbortController();
    loadWebsiteAppCatalog(abort.signal)
      .then((d) => {
        setData(d.current);
        setFailed(false);
      })
      .catch(() => {
        if (!abort.signal.aborted) setFailed(true);
      });
    return () => abort.abort();
  }, [retry]);
  const radioRows = useMemo(
    () => (data ? radioCatalogueRows(data.collections.radio) : emptyRows),
    [data],
  );
  const rows = kind === 'radio' ? radioRows : (data?.collections[kind] ?? emptyRows);
  const filtered = useMemo(
    () =>
      rows
        .filter(
          (r) =>
            (!query || normalized(`${r.title} ${r.source}`).includes(normalized(query))) &&
            (!contentLanguage || r.language === contentLanguage) &&
            (!source || r.source === source) &&
            (!country || r.country === country),
        )
        .sort((a, b) =>
          kind === 'podcasts' || kind === 'videos'
            ? (Date.parse(b.publishedAt ?? '') || 0) - (Date.parse(a.publishedAt ?? '') || 0) ||
              a.id.localeCompare(b.id)
            : a.title.localeCompare(b.title),
        ),
    [rows, kind, query, contentLanguage, source, country],
  );
  const labels = {
    radio: copy.radio,
    podcasts: media.episodes,
    videos: media.videos,
    library: common.library,
    events: media.events,
  };
  if (data && route?.kind === kind && (route.item || route.invalidItem)) {
    const record = rows.find((item) => item.id === route.item);
    return (
      <CatalogueItemPanel
        key={route.item}
        kind={kind}
        item={route.item}
        language={language}
        title={record?.title ?? null}
        titleLanguage={record?.language ?? 'und'}
      >
        {record ? (
          <>
            <p>{copy.note}</p>
            <p>
              {record.source} · {record.language}
              {record.country ? ` · ${record.country}` : ''}
            </p>
            {record.publishedAt ? (
              <p>
                <time dateTime={record.publishedAt}>
                  {new Intl.DateTimeFormat(language, {
                    dateStyle: 'medium',
                    timeZone: 'UTC',
                  }).format(new Date(record.publishedAt))}
                </time>
              </p>
            ) : null}
            <a
              href={record.url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
            >
              {media.openOriginal}
            </a>
          </>
        ) : null}
      </CatalogueItemPanel>
    );
  }
  return (
    <section
      className="website-app-catalog website-knowledge-panel"
      data-app-catalog={kind}
      aria-labelledby={`app-catalog-${mode}`}
    >
      <h2 id={`app-catalog-${mode}`}>
        {copy.title} · {labels[kind]}
      </h2>
      {mode === 'media' && kind === 'podcasts' ? (
        <aside>
          <h3>{language === 'de' ? 'Weitere Audio-Verzeichnisse' : 'More audio directories'}</h3>
          <p lang={language === 'de' ? 'de' : 'en'}>
            {language === 'de'
              ? 'Bei der Originalquelle öffnen. Ein automatischer Podcastfeed ist noch nicht bestätigt.'
              : 'Open at the original source. An automatic podcast feed has not yet been confirmed.'}
          </p>
          {directories.sources.map((source) => (
            <p key={source.id}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
              >
                {source.name}
              </a>{' '}
              · {source.country}
            </p>
          ))}
        </aside>
      ) : null}
      <p>
        {copy.note}
        {data ? (
          <>
            {' '}
            ·{' '}
            <time dateTime={data.observedAt}>
              {new Intl.DateTimeFormat(language, {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'UTC',
              }).format(new Date(data.observedAt))}{' '}
              UTC
            </time>
          </>
        ) : null}
      </p>
      {mode === 'media' ? (
        <div className="website-content-tabs" role="group" aria-label={media.media}>
          {(['radio', 'podcasts', 'videos'] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => {
                navigateCatalogue(k, language);
              }}
            >
              {labels[k]}
              {data ? ` (${k === 'radio' ? radioRows.length : data.collections[k].length})` : ''}
            </button>
          ))}
        </div>
      ) : null}
      {!data ? (
        <div role="status">
          {failed ? (
            <>
              <p>{common.error}</p>
              <button type="button" onClick={() => setRetry((r) => r + 1)}>
                {common.retry}
              </button>
            </>
          ) : (
            common.loading
          )}
        </div>
      ) : (
        <>
          <div className="website-content-filters" data-catalogue-view={kind}>
            <label>
              {media.search}
              <input
                data-catalogue-control="query"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShown(30);
                }}
              />
            </label>
            <label>
              {media.language}
              <select
                data-catalogue-control="language"
                value={contentLanguage}
                onChange={(e) => {
                  setContentLanguage(e.target.value);
                  setShown(30);
                }}
              >
                <option value="">{media.all}</option>
                {[...new Set(rows.map((r) => r.language))].sort().map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <label>
              {media.source}
              <select
                data-catalogue-control="source"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setShown(30);
                }}
              >
                <option value="">{media.all}</option>
                {[...new Set(rows.map((r) => r.source))].sort().map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            {mode === 'events' || kind === 'radio' ? (
              <label>
                {media.country}
                <select
                  data-catalogue-control="country"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setShown(30);
                  }}
                >
                  <option value="">{media.all}</option>
                  {[...new Set(rows.flatMap((r) => (r.country ? [r.country] : [])))]
                    .sort()
                    .map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                </select>
              </label>
            ) : null}
            <button type="button" onClick={reset}>
              {media.reset}
            </button>
          </div>
          <p role="status" data-app-catalog-count>
            {common.shown
              .replace('{shown}', String(Math.min(shown, filtered.length)))
              .replace('{total}', String(filtered.length))}
          </p>
          {mode === 'events' ? <p>{media.checkSchedule}</p> : null}
          {filtered.length ? (
            <ol className="website-content-list">
              {filtered.slice(0, shown).map((r) => (
                <li key={r.id} data-app-catalog-record={r.id}>
                  <h3 lang={r.language}>
                    <CatalogueLink kind={kind} item={r.id} language={language}>
                      {r.title}
                    </CatalogueLink>
                  </h3>
                  <p>
                    {r.source} · {r.language}
                    {r.country ? ` · ${r.country}` : ''}
                    {r.publishedAt ? (
                      <>
                        {' '}
                        ·{' '}
                        <time dateTime={r.publishedAt}>
                          {new Intl.DateTimeFormat(language, {
                            dateStyle: 'medium',
                            timeZone: 'UTC',
                          }).format(new Date(r.publishedAt))}
                        </time>
                      </>
                    ) : null}
                  </p>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                  >
                    {media.openOriginal}
                    {/\.epub(?:[?#]|$)/i.test(r.url) ? ' · EPUB' : ''}
                  </a>
                  {kind === 'radio' && radioOriginalStream(r) ? (
                    <p>
                      <a
                        href={radioOriginalStream(r)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                        lang={language === 'de' ? 'de' : 'en'}
                      >
                        {language === 'de'
                          ? 'Live beim Originalsender hören'
                          : 'Listen live at the original broadcaster'}
                      </a>
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p role="status">{media.empty}</p>
          )}
          {shown < filtered.length ? (
            <button type="button" onClick={() => setShown(shown + 30)}>
              {media.more}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
