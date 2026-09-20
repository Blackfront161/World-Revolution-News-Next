import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { getUiCopy, type UiLanguage } from '@wrn/ui-language';
import type { LocalPersonalizationStateV1 } from '@wrn/domain';
import { LocalPersonalizationHub } from '../../../packages/browser-content/src/local-personalization-ui';
import { SourceOnlyResults } from '../../../packages/browser-content/src/source-preferences-ui';
import {
  createWebsitePersonalizationStore,
  type WebsitePersonalizationLoadResult,
  type WebsitePersonalizationStore,
} from './local-personalization-state';

type Runtime = Readonly<{
  store: WebsitePersonalizationStore;
  loaded: WebsitePersonalizationLoadResult;
}>;

export function WebsitePersonalizationArea({
  language,
  headingRef,
  results,
  createStore = createWebsitePersonalizationStore,
}: {
  language: UiLanguage;
  headingRef: RefObject<HTMLHeadingElement | null>;
  results: (state: LocalPersonalizationStateV1 | undefined) => ReactNode;
  createStore?: () => WebsitePersonalizationStore;
}) {
  const copy = getUiCopy(language);
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [reloadAttempt, setReloadAttempt] = useState(0);
  useEffect(() => {
    let store: WebsitePersonalizationStore;
    try {
      store = createStore();
    } catch {
      setUnavailable(true);
      return;
    }
    setUnavailable(false);
    setRuntime({ store, loaded: store.load() });
    return () => {
      store.dispose();
      setRuntime((current) => (current?.store === store ? null : current));
    };
  }, [createStore, reloadAttempt]);
  const store = runtime?.store;
  useEffect(() => {
    headingRef.current?.focus();
  }, [store, headingRef]);
  if (runtime === null) {
    return (
      <section className="personalization-view" aria-labelledby="website-page-title">
        <h1 id="website-page-title" ref={headingRef} tabIndex={-1}>
          {copy.personalizationTitle}
        </h1>
        <p role={unavailable ? 'alert' : 'status'}>
          {unavailable ? copy.personalizationUnavailable : copy.personalizationLoading}
        </p>
        {unavailable && (
          <button type="button" onClick={() => setReloadAttempt((value) => value + 1)}>
            {copy.personalizationReload}
          </button>
        )}
      </section>
    );
  }
  return (
    <LocalPersonalizationHub
      copy={copy}
      headingId="website-page-title"
      headingLevel={1}
      headingRef={headingRef}
      store={runtime.store}
      loaded={runtime.loaded}
      onLoaded={(loaded) => {
        setRuntime((current) =>
          current?.store === runtime.store ? { store: current.store, loaded } : current,
        );
      }}
      results={runtime.loaded.kind === 'ready' ? results(runtime.loaded.state) : null}
      inactiveResults={<SourceOnlyResults headingLevel={2} render={() => results(undefined)} />}
    />
  );
}
