import {
  createOfflineUiSession,
  useOfflineController,
  createProductionContentOfflineHook,
  type OfflineUiCall,
} from '../../../packages/browser-content/src/content-offline-ui';
import {
  createMobileContentOfflineController,
  type ContentOfflineControllerResult,
} from './content-offline-controller';
import { createProductionContentOfflineController } from './production-content-offline-controller';
export type {
  OfflineUiAction,
  OfflineUiCall,
  ProductionOfflineUiCall,
} from '../../../packages/browser-content/src/content-offline-ui';
type Controller = ReturnType<typeof createMobileContentOfflineController>;
export function createContentOfflineUiSession(
  controller: Controller,
  publish: (result: ContentOfflineControllerResult, action: OfflineUiCall) => void,
  changed: (action: OfflineUiCall | null) => void,
) {
  return createOfflineUiSession<OfflineUiCall, ContentOfflineControllerResult>(
    controller,
    publish,
    changed,
  );
}

export function useContentOfflineController(enabled: boolean) {
  return useOfflineController<OfflineUiCall, ContentOfflineControllerResult>(
    enabled,
    createMobileContentOfflineController,
    'restore',
  );
}

export const useProductionContentOfflineController = createProductionContentOfflineHook(
  createProductionContentOfflineController,
);
