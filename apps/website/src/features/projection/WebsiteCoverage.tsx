import { useEffect, useState } from 'react';
import type { UiLanguage } from '@wrn/ui-language';
import {
  loadWebsiteContentDirectory,
  subscribeWebsiteContentDirectory,
  type WebsiteContentDirectory,
} from '../directory/directory-loader';
import { getProjectionCopy } from './projection-copy';
import { projectionStateCopy, projectionAvailableCopy } from './projection-state-copy';
import './projection.css';

export function CoverageDetails({
  data,
  language,
  now,
}: {
  data: WebsiteContentDirectory;
  language: UiLanguage;
  now?: number;
}) {
  const copy = getProjectionCopy(language),
    coverage = data.coverage;
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <section className="website-coverage" aria-label={copy.title}>
      <h2>{copy.title}</h2>
      <p data-projection-available>
        {projectionAvailableCopy(language)}:{' '}
        {data.projection.articles.filter((a) => !a.historical).length}
      </p>
      <p role="status" data-projection-transfer={data.transferState ?? 'saved'}>
        {projectionStateCopy(language, data.transferState)}
      </p>
      {coverage ? (
        <>
          <p>
            {copy.snapshot}: <time dateTime={coverage.feedTime}>{coverage.feedTime}</time>
          </p>
          <p>
            {copy.newest}:{' '}
            <time dateTime={coverage.newestArticleAt ?? undefined}>
              {coverage.newestArticleAt ?? '—'}
            </time>
          </p>
          <p>
            {copy.included}: {coverage.counts.included}/{coverage.counts.feed} · {copy.excluded}:{' '}
            {coverage.counts.excluded} · {copy.pending}: {coverage.counts.pendingSources}/
            {coverage.counts.registry}
          </p>
          <details>
            <summary>{copy.reasons}</summary>
            <ul>
              {Object.entries(coverage.reasons).map(([reason, count]) => (
                <li key={reason}>
                  <code>{reason}</code>: {count}
                </li>
              ))}
            </ul>
          </details>
          {(now ?? clock) - Date.parse(coverage.feedTime) > 86400000 && (
            <p role="status">{copy.stale}</p>
          )}
        </>
      ) : (
        <p>{copy.unknown}</p>
      )}
      <p>{copy.warning}</p>
    </section>
  );
}

export function WebsiteCoverage({
  language,
  compact = false,
}: {
  language: UiLanguage;
  compact?: boolean;
}) {
  const [data, setData] = useState<WebsiteContentDirectory | null>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const unsubscribe = subscribeWebsiteContentDirectory(setData);
    loadWebsiteContentDirectory(controller.signal)
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => {
      unsubscribe();
      controller.abort();
    };
  }, []);
  const copy = getProjectionCopy(language);
  if (!data) return failed ? <p role="status">{copy.unavailable}</p> : null;
  if (compact)
    return (
      <details className="website-coverage-disclosure">
        <summary>
          {copy.title} ·{' '}
          {data.coverage
            ? `${data.coverage.counts.included}/${data.coverage.counts.feed}`
            : projectionAvailableCopy(language)}
        </summary>
        <CoverageDetails data={data} language={language} />
      </details>
    );
  const links = data.projection.articles
    .filter((a) => !a.historical)
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, 6);
  return (
    <>
      <CoverageDetails data={data} language={language} />
      <section className="website-projection-links" aria-label={copy.current}>
        <h2>{copy.current}</h2>
        <p>{copy.warning}</p>
        <ul>
          {links.map((article) => (
            <li key={article.id} data-projection-article={article.id}>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                lang={article.language === 'und' ? undefined : article.language}
              >
                {article.title}
              </a>
              <p>
                {article.sourceName} · {article.publishedAt?.slice(0, 10)}
              </p>
              <p>{copy.original}</p>
              <p>
                {article.endpointIds.some((id) => data.reviewedEndpointIds?.includes(id))
                  ? copy.matchedLabel
                  : copy.pendingLabel}
              </p>
            </li>
          ))}
        </ul>
        <a href="#discover/news">{copy.more}</a>
      </section>
    </>
  );
}
