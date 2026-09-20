import type { RefObject } from 'react';
import type { UiLanguage } from '@wrn/ui-language';
import { ProductionEventsMediaDirectory } from '../../../../../packages/browser-content/src/events-media-directory';
import { loadMobileProductionEventsMedia } from './events-media-loader';
import { VideoSources } from '../../video-sources-ui';
import { CurrentRegionalEvents } from '../../../../../packages/browser-content/src/regional-events/regional-events';
import { ManagedProductionMediaExperience } from '../../../../../packages/browser-content/src/production-media-ui';
import { createMobileProductionMediaExperienceController } from '../../production-media-profile';

export function MobileProductionEventsMediaRoute({
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
      load={loadMobileProductionEventsMedia}
      language={language}
      mode={mode}
      headingId="mobile-page-title"
      headingLevel={2}
      headingRef={headingRef}
      videoChannels={<VideoSources language={language} />}
      productionMedia={
        mode === 'media' ? (
          <ManagedProductionMediaExperience
            createController={createMobileProductionMediaExperienceController}
            language={language}
            headingLevel={3}
          />
        ) : null
      }
      currentEvents={<CurrentRegionalEvents client="mobile" language={language} headingLevel={3} />}
    />
  );
}
