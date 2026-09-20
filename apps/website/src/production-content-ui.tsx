import type { ComponentProps } from 'react';
import { createProductionContentArea } from '../../../packages/browser-content/src/production-content-ui';
import { productionTranslationAdapter } from './production-translation-adapter';
import { createProductionContentOfflineHook } from '../../../packages/browser-content/src/content-offline-ui';
import { createProductionContentOfflineController } from './production-content-offline-controller';
import {
  createProductionReadingStateStore,
  productionReadingStateStorageKey,
} from './production-reading-state';
import './production-content-ui.css';

const useProductionContentOfflineController = createProductionContentOfflineHook(
  createProductionContentOfflineController,
);
const ContentArea = createProductionContentArea({
  useProductionContentOfflineController,
  createProductionReadingStateStore,
  productionReadingStateStorageKey,
  headingId: 'website-page-title',
  translationAdapter: productionTranslationAdapter,
  archiveTriggerId: 'website-more-archive',
  embeddedCardHeadingLevel: 3,
  activityClient: 'website',
});

export function WebsiteProductionContentArea(props: ComponentProps<typeof ContentArea>) {
  return (
    <div className="website-production">
      {!props.embedded && <h1 className="website-production-heading">World Revolution News</h1>}
      <ContentArea {...props} />
    </div>
  );
}
