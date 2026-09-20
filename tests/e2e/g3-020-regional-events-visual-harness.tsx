import { createRoot } from 'react-dom/client';
import { getUiCopy, type UiLanguage } from '../../packages/ui-language/src';
import {
  MobileRegionalEventsView,
  type RegionalEventsViewModel,
} from '../../apps/mobile/src/mobile-regional-events-ui';

export type RegionalEventsVisualHarnessPayload = Readonly<{
  language: UiLanguage;
  model: RegionalEventsViewModel;
  drafts?: Readonly<{ continentId: string; countryId: string; regionId: string }>;
}>;

/** Test-only mount. It imports the pure production view but never reaches a
 * product fixture, pin, loader, store, App query, or production test switch. */
export async function mountRegionalEventsVisualHarness() {
  const response = await fetch('/__wrn-test__/regional-events-view.json', { cache: 'no-store' });
  const payload = (await response.json()) as RegionalEventsVisualHarnessPayload;
  const main = document.createElement('main');
  main.id = 'wrn-regional-events-visual-harness';
  const heading = document.createElement('h1');
  heading.textContent = getUiCopy(payload.language).events;
  const root = document.createElement('div');
  main.append(heading, root);
  document.body.replaceChildren(main);
  createRoot(root).render(
    <MobileRegionalEventsView
      model={payload.model}
      copy={getUiCopy(payload.language)}
      language={payload.language}
      draftContinentId={payload.drafts?.continentId ?? ''}
      draftCountryId={payload.drafts?.countryId ?? ''}
      draftRegionId={payload.drafts?.regionId ?? ''}
      onContinent={() => undefined}
      onCountry={() => undefined}
      onRegion={() => undefined}
      onSave={() => undefined}
      onClear={() => undefined}
      onReload={() => undefined}
    />,
  );
}
