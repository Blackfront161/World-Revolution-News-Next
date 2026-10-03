import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { UiLanguage } from '@wrn/ui-language';
import {
  catalogueHref,
  catalogueControls,
  emptyCatalogueView,
  readCatalogueLocation,
  readCatalogueReturn,
  type CatalogueView,
  type CatalogueControl,
  type WebsiteCatalogueKind,
} from './catalogue-location';
let navigationEpoch = 0;
const navigationListeners = new Set<() => void>();
function onNavigation() {
  navigationEpoch += 1;
  for (const listener of navigationListeners) listener();
}
function subscribe(callback: () => void) {
  if (navigationListeners.size === 0) {
    window.addEventListener('hashchange', onNavigation);
    window.addEventListener('popstate', onNavigation);
    window.addEventListener('wrn-catalogue-navigation', onNavigation);
  }
  navigationListeners.add(callback);
  return () => {
    navigationListeners.delete(callback);
    if (navigationListeners.size === 0) {
      window.removeEventListener('hashchange', onNavigation);
      window.removeEventListener('popstate', onNavigation);
      window.removeEventListener('wrn-catalogue-navigation', onNavigation);
    }
  };
}
export function useCatalogueLocation() {
  return readCatalogueLocation(useSyncExternalStore(subscribe, () => window.location.hash));
}
export function notifyNavigation() {
  window.dispatchEvent(new PopStateEvent('popstate'));
}
export function navigateCatalogue(kind: WebsiteCatalogueKind, language: UiLanguage, item?: string) {
  window.dispatchEvent(new CustomEvent('wrn-catalogue-capture'));
  const origin = readCatalogueLocation(window.location.hash)?.kind ?? null;
  window.history.pushState(
    { wrnCatalogueOrigin: origin, wrnCatalogueItemKind: kind, wrnCatalogueItemId: item ?? null },
    '',
    catalogueHref(kind, language, item),
  );
  notifyNavigation();
}
export function useCatalogueView(kind: WebsiteCatalogueKind, ready: boolean) {
  const location = useCatalogueLocation();
  const epoch = useSyncExternalStore(subscribe, () => navigationEpoch);
  const [stored, setStored] = useState(() => ({
    kind,
    epoch,
    view: readCatalogueReturn(window.history.state, kind)?.view ?? emptyCatalogueView,
  }));
  const view =
    stored.kind === kind && stored.epoch === epoch
      ? stored.view
      : (readCatalogueReturn(window.history.state, kind)?.view ?? emptyCatalogueView);
  const restored = useRef<unknown>(null);
  useEffect(() => {
    const persist = (
      focusItem: string | null = null,
      focusControl: CatalogueControl | null = null,
    ) => {
      const route = readCatalogueLocation(window.location.hash);
      if (!ready || route?.kind !== kind || route.item || route.invalidItem) return;
      const previous = readCatalogueReturn(window.history.state, kind);
      if (window.history.state?.wrnCatalogueReturn !== undefined && previous === null) return;
      const candidate = {
        kind,
        view,
        scrollY: window.scrollY,
        focusItem: focusItem ?? (focusControl ? null : (previous?.focusItem ?? null)),
        focusControl: focusItem ? null : (focusControl ?? previous?.focusControl ?? null),
      };
      if (readCatalogueReturn({ wrnCatalogueReturn: candidate }, kind) === null) return;
      try {
        window.history.replaceState({ ...window.history.state, wrnCatalogueReturn: candidate }, '');
      } catch {
        // History retention is optional; a restricted browser keeps the live controls usable.
      }
    };
    const capture = (event: Event) =>
      persist(
        event instanceof CustomEvent && typeof event.detail === 'string' ? event.detail : null,
      );
    const click = () => persist();
    let scrollTimer: number | undefined;
    const scroll = () => {
      if (scrollTimer !== undefined) return;
      scrollTimer = window.setTimeout(() => {
        scrollTimer = undefined;
        persist();
      }, 500);
    };
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      const control = event.target.dataset.catalogueControl as CatalogueControl;
      if (catalogueControls.includes(control)) persist(null, control);
    };
    window.addEventListener('wrn-catalogue-capture', capture);
    document.addEventListener('click', click, true);
    window.addEventListener('scroll', scroll, { passive: true });
    document.addEventListener('focusin', focus);
    if (readCatalogueReturn(window.history.state, kind)?.view !== view) persist();
    return () => {
      window.removeEventListener('wrn-catalogue-capture', capture);
      document.removeEventListener('click', click, true);
      window.removeEventListener('scroll', scroll);
      document.removeEventListener('focusin', focus);
      window.clearTimeout(scrollTimer);
    };
  }, [kind, view, ready]);
  useEffect(() => {
    if (!ready || location?.kind !== kind || location.item || location.invalidItem) return;
    const value = window.history.state?.wrnCatalogueReturn;
    const previous = readCatalogueReturn(window.history.state, kind);
    if (!previous || restored.current === value) return;
    const frame = window.requestAnimationFrame(() => {
      restored.current = value;
      if (previous.focusItem)
        document
          .querySelector<HTMLElement>(`[data-catalogue-item="${previous.focusItem}"]`)
          ?.focus({ preventScroll: true });
      else if (previous.focusControl)
        document
          .querySelector<HTMLElement>(
            `[data-catalogue-view="${kind}"] [data-catalogue-control="${previous.focusControl}"]`,
          )
          ?.focus({ preventScroll: true });
      window.scrollTo({ top: previous.scrollY, behavior: 'instant' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [kind, ready, epoch, location?.kind, location?.item, location?.invalidItem]);
  const change = (field: keyof CatalogueView, value: string | number) => {
    setStored((previous) => ({
      kind,
      epoch,
      view: {
        ...(previous.kind === kind && previous.epoch === epoch ? previous.view : view),
        [field]: value,
        ...(field === 'shown' ? {} : { shown: 30 }),
      },
    }));
  };
  return { view, change, reset: () => setStored({ kind, epoch, view: emptyCatalogueView }) };
}
