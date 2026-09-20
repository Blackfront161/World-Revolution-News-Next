import { createProductionContentArea } from '../../../packages/browser-content/src/production-content-ui';
import { Capacitor } from '@capacitor/core';
import { productionTranslationAdapter } from './production-translation-adapter';
import { useProductionContentOfflineController } from './content-offline-ui';
import {
  createProductionReadingStateStore,
  productionReadingStateStorageKey,
} from './production-reading-state';
export const ProductionContentArea = createProductionContentArea({
  useProductionContentOfflineController,
  createProductionReadingStateStore,
  productionReadingStateStorageKey,
  headingId: 'mobile-page-title',
  translationAdapter: productionTranslationAdapter,
  archiveTriggerId: 'mobile-more-archive',
  activityClient: 'mobile',
  activityNotificationsEnabled: () => !Capacitor.isNativePlatform(),
});
