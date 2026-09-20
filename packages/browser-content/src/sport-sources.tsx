import { useState } from 'react';
import type { UiLanguage } from '@wrn/ui-language';
import { getSportSourcesCopy } from '@wrn/ui-language/sport-sources';
import { sportFanSources, sportSources, type SportContinent } from './sport-sources-data';
import './sport-sources.css';

const externalProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
  referrerPolicy: 'no-referrer' as const,
};

const format = (text: string, value: string) => text.replace('{date}', value);
const count = (text: string, value: number) =>
  text.replace('{count}', String(value)).replace(/\(\d+\)/u, `(${value})`);

export function SportSources({
  language,
  open = false,
  headingLevel = 3,
}: {
  language: UiLanguage;
  open?: boolean;
  headingLevel?: 2 | 3;
}) {
  const copy = getSportSourcesCopy(language);
  const [continent, setContinent] = useState<SportContinent | 'all'>('all');
  const regions: Record<SportContinent, string> = {
    africa: '002',
    asia: '142',
    europe: '150',
    'north-america': '003',
    'south-america': '005',
    oceania: '009',
    international: '001',
  };
  const continentName = (value: SportContinent) =>
    value === 'international' ? copy.international : copy.continentNames[value];
  const visibleFans = sportFanSources.filter(
    (source) => continent === 'all' || source.continent === continent,
  );
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <>
      <section
        className="sport-sources"
        data-testid="sport-sources"
        aria-labelledby="sport-sources-title"
      >
        <Heading id="sport-sources-title">{copy.heading}</Heading>
        <p>{copy.intro}</p>
        <details open={open || undefined}>
          <summary data-testid="sport-sources-summary">
            {count(copy.summary, sportSources.length)}
          </summary>
          <ul>
            {sportSources.map((source) => (
              <li key={source.id} data-testid={`sport-source-${source.id}`}>
                <strong>{source.name}</strong>
                <p>
                  {copy.category}: {copy.categories[source.category] ?? source.category} ·{' '}
                  {copy.originalLanguage}: {source.originalLanguage}
                </p>
                <a href={source.originalUrl} {...externalProps}>
                  {copy.openOriginal}
                </a>
                {source.linkedSportNotePublisher && <p>{copy.linkedReadingNote}</p>}
                <details>
                  <summary>{copy.record}</summary>
                  <p>{format(copy.observed, source.observedDate)}</p>
                  <p>{copy.directoryOnly}</p>
                  <p>{copy.rightsUnknown}</p>
                  {source.feed === 'observed' && source.feedUrl ? (
                    <p>
                      <a href={source.feedUrl} {...externalProps}>
                        {source.feedFormat}
                      </a>
                    </p>
                  ) : (
                    <p>{copy.feedUnchecked}</p>
                  )}
                  <p>{source.sourceEvidenceUrl}</p>
                </details>
              </li>
            ))}
          </ul>
        </details>
      </section>
      <section
        className="sport-sources sport-fan-sources"
        data-testid="sport-fan-sources"
        aria-labelledby="sport-fan-sources-title"
      >
        <Heading id="sport-fan-sources-title">{copy.fanHeading}</Heading>
        <p>{copy.fanIntro}</p>
        <details open={open || undefined}>
          <summary data-testid="sport-fan-sources-summary">
            {count(copy.fanSummary, visibleFans.length)}
          </summary>
          <label className="sport-continent-filter">
            {copy.continent}
            <select
              value={continent}
              onChange={(event) => setContinent(event.target.value as SportContinent | 'all')}
            >
              <option value="all">{copy.allContinents}</option>
              {(Object.keys(regions) as SportContinent[])
                .filter((value) => sportFanSources.some((source) => source.continent === value))
                .map((value) => (
                  <option key={value} value={value}>
                    {continentName(value)}
                  </option>
                ))}
            </select>
          </label>
          <p role="status" aria-live="polite" aria-atomic="true">
            {count(copy.fanSummary, visibleFans.length)}
          </p>
          <ul>
            {visibleFans.map((source) => (
              <li key={source.id} data-testid={`sport-fan-source-${source.id}`}>
                <strong>{source.name}</strong>
                <p>
                  {copy.category}: {copy.fanCategories[source.category] ?? source.category} ·{' '}
                  {copy.originalLanguage}: {source.originalLanguage} ·{' '}
                  {continentName(source.continent)}
                </p>
                <a href={source.originalUrl} {...externalProps}>
                  {copy.openOriginal}
                </a>
                <details>
                  <summary>{copy.record}</summary>
                  <p>{format(copy.observed, source.observedDate)}</p>
                  <p>{copy.directoryOnly}</p>
                  <p>{copy.rightsUnknown}</p>
                  <p>{copy.feedUnchecked}</p>
                  <p>{source.sourceEvidenceUrl}</p>
                </details>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </>
  );
}
