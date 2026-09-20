import { createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getMobileMediaCopy, type UiLanguage } from '../../packages/ui-language/src';
import type {
  MobileMediaHubControllerAdapters,
  MobileMediaHubViewModel,
} from '../../apps/mobile/src/mobile-media-hub-ui';

export type MediaHubVisualHarnessPayload = Readonly<{
  language: UiLanguage;
  model: MobileMediaHubViewModel;
}>;

export type MediaHubControllerHarnessPayload = Readonly<{
  language: UiLanguage;
  now: () => number;
  adapters: MobileMediaHubControllerAdapters;
}>;

let controllerRoot: Root | null = null;

/** This separate test seam mounts the actual P4 controller with supplied
 * public adapters. It contains no controller or Catalog state of its own. */
export async function mountMediaHubControllerHarness(payload: MediaHubControllerHarnessPayload) {
  const mobileMediaHubUi = await import('../../apps/mobile/src/mobile-media-hub-ui');
  controllerRoot?.unmount();
  const main = document.createElement('main');
  main.id = 'wrn-media-hub-controller-harness';
  const root = document.createElement('div');
  main.append(root);
  document.body.replaceChildren(main);
  controllerRoot = createRoot(root);
  controllerRoot.render(
    <mobileMediaHubUi.MobileMediaHubPage
      copy={getMobileMediaCopy(payload.language)}
      language={payload.language}
      now={payload.now}
      headingRef={createRef<HTMLHeadingElement>()}
      adapters={payload.adapters}
    />,
  );
}

export function unmountMediaHubControllerHarness() {
  controllerRoot?.unmount();
  controllerRoot = null;
}

/** Test-only mount with self-authored presentation data. It never opens the
 * catalog, loader, player hub, release fixture, or a product route. */
export async function mountMediaHubVisualHarness() {
  const mobileMediaHubUi = await import('../../apps/mobile/src/mobile-media-hub-ui');
  const response = await fetch('/__wrn-test__/media-hub-view.json', { cache: 'no-store' });
  const payload = (await response.json()) as MediaHubVisualHarnessPayload;
  const main = document.createElement('main');
  main.id = 'wrn-media-hub-visual-harness';
  const documentHeading = document.createElement('h1');
  documentHeading.textContent = getMobileMediaCopy(payload.language).title;
  Object.assign(documentHeading.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
  });
  main.append(documentHeading);
  const root = document.createElement('div');
  main.append(root);
  document.body.replaceChildren(main);
  createRoot(root).render(
    <mobileMediaHubUi.MobileMediaHubView
      model={payload.model}
      copy={getMobileMediaCopy(payload.language)}
      language={payload.language}
      onStart={() => undefined}
      onPause={() => undefined}
      onResume={() => undefined}
    />,
  );
}
