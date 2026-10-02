import { useCallback, useEffect, useRef, type ComponentProps } from 'react';
import {
  productionContentOfflineFormatV1,
  type ProductionContentOfflineControlV1,
} from '@wrn/content-contracts/production-content-offline-v1';
import { createProductionContentArea } from '../../../packages/browser-content/src/production-content-ui';
import { createBrowserDeviceSpeechAdapter } from '../../../packages/browser-content/src/production-podcast';
import { productionTranslationAdapter } from './production-translation-adapter';
import { productionOnlinePodcastAdapter } from './production-podcast-adapter';
import { createProductionContentOfflineHook } from '../../../packages/browser-content/src/content-offline-ui';
import { createProductionContentOfflineController } from './production-content-offline-controller';
import {
  createProductionReadingStateStore,
  productionReadingStateStorageKey,
} from './production-reading-state';
import './production-content-ui.css';
import { WebsiteCoverage } from './features/projection/WebsiteCoverage';

const useBaseProductionContentOfflineController = createProductionContentOfflineHook(
  createProductionContentOfflineController,
);
export function isVirginPublicationControl(control: ProductionContentOfflineControlV1 | null) {
  return (
    control !== null &&
    control.format === productionContentOfflineFormatV1 &&
    control.generation === 0 &&
    control.clearEpoch === 0 &&
    control.activeKey === null &&
    control.previousKey === null &&
    control.candidateKey === null &&
    control.pendingRecheck === null &&
    control.lastSuccessfulSourceCheckAt === null &&
    control.lastObservedAt === null &&
    control.highestAcceptedSequence === 0 &&
    control.acceptedIdentities.length === 0 &&
    control.safety.revision === 0 &&
    control.safety.revokedIds.length === 0
  );
}
export function useProductionContentOfflineController(enabled = true) {
  const offline = useBaseProductionContentOfflineController(enabled);
  const virginGuarded = useRef(false);
  const recoveryEpoch = useRef(0);
  useEffect(
    () => () => {
      recoveryEpoch.current++;
      virginGuarded.current = false;
    },
    [],
  );
  const baseInvoke = offline.invoke;
  const invoke = useCallback<typeof baseInvoke>(
    async (action) => {
      if (action === 'clear') {
        recoveryEpoch.current++;
        virginGuarded.current = false;
      }
      if (action === 'guard' || action === 'resumeGuard') {
        const checked = await baseInvoke(action);
        virginGuarded.current =
          checked?.status === 'needs-source-check' &&
          checked.reason === 'no-active-bundle' &&
          isVirginPublicationControl(checked.control);
        return checked;
      }
      if (action !== 'check' || !virginGuarded.current) return baseInvoke(action);
      // Only the automatically started first publication owns this recovery.
      // A transient request timeout must not permanently latch an empty Home.
      // Every retry still passes the controller's safety and durable barriers.
      const epoch = recoveryEpoch.current;
      let transportFailures = 0;
      for (let attempt = 0; attempt < 6; attempt++) {
        if (recoveryEpoch.current !== epoch) return null;
        const checked = await baseInvoke('check');
        if (recoveryEpoch.current !== epoch) return null;
        if (checked !== null && checked.reason !== 'transport-or-validation') {
          virginGuarded.current = false;
          return checked;
        }
        if (checked !== null) {
          transportFailures++;
          if (transportFailures >= 3) {
            virginGuarded.current = false;
            return checked;
          }
          await new Promise<void>((resolve) => setTimeout(resolve, 250 * transportFailures));
          if (recoveryEpoch.current !== epoch) return null;
        }
        const guarded = await baseInvoke('guard');
        if (recoveryEpoch.current !== epoch) return null;
        const control = guarded?.control;
        if (
          guarded?.status !== 'needs-source-check' ||
          guarded.reason !== 'no-active-bundle' ||
          control === null ||
          control === undefined ||
          control.clearEpoch !== 0 ||
          control.activeKey !== null ||
          control.previousKey !== null ||
          control.candidateKey !== null ||
          control.pendingRecheck !== null ||
          control.highestAcceptedSequence !== 0 ||
          control.acceptedIdentities.length !== 0 ||
          control.safety.revision !== 0 ||
          control.safety.revokedIds.length !== 0
        ) {
          virginGuarded.current = false;
          return guarded;
        }
      }
      virginGuarded.current = false;
      return null;
    },
    [baseInvoke],
  );
  return { ...offline, invoke };
}
const ContentArea = createProductionContentArea({
  useProductionContentOfflineController,
  createProductionReadingStateStore,
  productionReadingStateStorageKey,
  headingId: 'website-page-title',
  translationAdapter: productionTranslationAdapter,
  deviceSpeechAdapter: createBrowserDeviceSpeechAdapter(),
  onlinePodcastAdapter: productionOnlinePodcastAdapter,
  archiveTriggerId: 'website-more-archive',
  shouldAutoCheck: isVirginPublicationControl,
  embeddedCardHeadingLevel: 3,
  activityClient: 'website',
});

export function WebsiteProductionContentArea(props: ComponentProps<typeof ContentArea>) {
  return (
    <div className="website-production">
      {!props.embedded && <h1 className="website-production-heading">World Revolution News</h1>}
      <ContentArea {...props} />
      {props.target === 'home' && props.articleId === null && props.archiveRoute === undefined && (
        <WebsiteCoverage language={props.language} compact />
      )}
    </div>
  );
}
