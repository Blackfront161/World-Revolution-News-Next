import { useState, type RefObject } from 'react';
import {
  filterSelectedVideosV1,
  filterVideoSourcesV1,
  videoSourceCatalogV1,
  videoSourceLanguagesV1,
} from '@wrn/content-contracts/video-sources-v1';
import { getVideoSourcesCopy, uiLanguageNativeNames, type UiLanguage } from '@wrn/ui-language';

export function VideoSources({
  language,
  headingRef,
  headingLevel = 1,
}: Readonly<{
  language: UiLanguage;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  headingLevel?: 1 | 2;
}>) {
  const copy = getVideoSourcesCopy(language);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const sources = filterVideoSourcesV1(selectedLanguage);
  const selectedVideos = filterSelectedVideosV1(selectedLanguage);
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const CardHeading = headingLevel === 1 ? 'h2' : 'h3';
  const VideoHeading = headingLevel === 1 ? 'h3' : 'h4';
  const SelectedHeading = headingLevel === 1 ? 'h2' : 'h3';
  return (
    <section className="video-sources" aria-labelledby="website-video-sources-title">
      <Heading id="website-video-sources-title" ref={headingRef} tabIndex={-1}>
        {copy.title}
      </Heading>
      <p>{copy.intro}</p>
      <fieldset className="video-sources-filters">
        <legend>{copy.language}</legend>
        {['all', ...videoSourceLanguagesV1].map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={selectedLanguage === value}
            onClick={() => setSelectedLanguage(value)}
            lang={value === 'all' ? language : value}
          >
            {value === 'all' ? copy.all : uiLanguageNativeNames[value as UiLanguage]}
          </button>
        ))}
      </fieldset>
      <SelectedHeading>{copy.selected}</SelectedHeading>
      <p>{copy.pilotNote}</p>
      {selectedVideos.length === 0 ? (
        <p>{copy.selectedEmpty}</p>
      ) : (
        <ul className="video-sources-list">
          {selectedVideos.map((video) => {
            const source = videoSourceCatalogV1.sources.find(
              (entry) => entry.id === video.sourceId,
            );
            return (
              <li className="video-sources-card" key={video.id} data-video-item={video.id}>
                <p className="video-sources-kind">{copy[video.format]}</p>
                <VideoHeading lang={video.language}>{video.title}</VideoHeading>
                <p lang={video.language}>{source?.name}</p>
                <a
                  href={video.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  aria-label={`${copy.openVideo}: ${video.title}`}
                >
                  {copy.openVideo}
                  <span aria-hidden="true"> ↗</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      <p role="status">{copy.count.replace('{count}', String(sources.length))}</p>
      {sources.length === 0 ? (
        <p>{copy.empty}</p>
      ) : (
        <ul className="video-sources-list">
          {sources.map((source) => (
            <li className="video-sources-card" key={source.id} data-video-source={source.id}>
              <p className="video-sources-kind">{copy[source.kind]}</p>
              <CardHeading lang={source.language}>{source.name}</CardHeading>
              <p lang={source.language}>{uiLanguageNativeNames[source.language]}</p>
              <a
                href={source.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                aria-label={copy.open + ': ' + source.name}
              >
                {copy.open}
                <span aria-hidden="true"> ↗</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="video-sources-privacy">{copy.privacy}</p>
    </section>
  );
}
