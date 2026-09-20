import type { RefObject } from 'react';
import type { UiLanguage } from '@wrn/ui-language';
import { ProductionEventsMediaDirectory } from '../../../../../packages/browser-content/src/events-media-directory';
import { loadWebsiteProductionEventsMedia } from './events-media-loader';
import { VideoSources } from '../../video-sources-ui';
import { CurrentRegionalEvents } from '../../../../../packages/browser-content/src/regional-events/regional-events';
import { ManagedProductionMediaExperience } from '../../../../../packages/browser-content/src/production-media-ui';
import { createWebsiteProductionMediaExperienceController } from '../../production-media-profile';

export function WebsiteProductionEventsMediaRoute({
  mode,
  language,
  headingRef,
}: {
  mode: 'events' | 'media';
  language: UiLanguage;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <ProductionEventsMediaDirectory
      load={loadWebsiteProductionEventsMedia}
      language={language}
      mode={mode}
      headingId="website-page-title"
      headingLevel={1}
      headingRef={headingRef}
      videoChannels={<VideoSources language={language} headingLevel={2} />}
      productionMedia={
        mode === 'media' ? (
          <ManagedProductionMediaExperience
            createController={createWebsiteProductionMediaExperienceController}
            language={language}
            headingLevel={2}
          />
        ) : null
      }
      currentEvents={<CurrentRegionalEvents client="website" language={language} />}
    />
  );
}
