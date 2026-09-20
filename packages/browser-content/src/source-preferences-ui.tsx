import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  isSourcePreferenceId,
  type LocalSourcePreferencesV1,
  type SourcePreferenceCatalog,
} from '@wrn/content-contracts';
import {
  emptySourcePreferences,
  getSourcePreference,
  setSourcePreference,
  type SourcePreferenceAction,
} from '@wrn/domain';
import { getUiCopy, type UiLanguage } from '@wrn/ui-language';
import { getSourcePreferencesCopy } from '@wrn/ui-language/source-preferences';
import {
  createSourcePreferencesStore,
  type SourcePreferencesLoadResult,
  type SourcePreferencesStore,
} from './source-preferences-state';
import './source-preferences-ui.css';

const empty = emptySourcePreferences();
type Runtime = { key: string; store: SourcePreferencesStore; loaded: SourcePreferencesLoadResult };
type SourceContext = {
  enabled: boolean;
  language: UiLanguage;
  state: LocalSourcePreferencesV1;
  loaded: SourcePreferencesLoadResult | null;
  message: 'saved' | 'failed' | null;
  change(catalog: SourcePreferenceCatalog, id: string, action: SourcePreferenceAction): boolean;
  clear(snapshot: SourcePreferencesLoadResult): boolean;
  reload(): void;
};
const Context = createContext<SourceContext>({
  enabled: false,
  language: 'en',
  state: empty,
  loaded: null,
  message: null,
  change: () => false,
  clear: () => false,
  reload: () => undefined,
});
export const useSourcePreferences = () => useContext(Context);

export function SourcePreferencesProvider({
  storageKey,
  language,
  enabled = true,
  createStore = createSourcePreferencesStore,
  children,
}: {
  storageKey: string;
  language: UiLanguage;
  enabled?: boolean;
  createStore?: (key: string) => SourcePreferencesStore;
  children: ReactNode;
}) {
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState<'saved' | 'failed' | null>(null);
  const update = useCallback((next: Runtime) => {
    runtimeRef.current = next;
    setRuntime(next);
  }, []);
  useEffect(() => {
    if (!enabled) return;
    let store: SourcePreferencesStore;
    try {
      store = createStore(storageKey);
    } catch {
      runtimeRef.current = null;
      setRuntime(null);
      setUnavailable(true);
      return;
    }
    let active = true;
    const refresh = () => {
      if (active) update({ key: storageKey, store, loaded: store.load() });
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    setUnavailable(false);
    refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      runtimeRef.current = null;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
      store.dispose();
    };
  }, [storageKey, enabled, createStore, update, attempt]);
  const reload = useCallback(() => {
    setMessage(null);
    const current = runtimeRef.current;
    if (current?.key === storageKey && enabled)
      update({ ...current, loaded: current.store.load() });
    else setAttempt((value) => value + 1);
  }, [storageKey, enabled, update]);
  const change = useCallback(
    (catalog: SourcePreferenceCatalog, id: string, action: SourcePreferenceAction) => {
      const current = runtimeRef.current;
      if (
        !enabled ||
        current?.key !== storageKey ||
        (current.loaded.kind !== 'ready' && current.loaded.kind !== 'inactive')
      )
        return false;
      const next = setSourcePreference(
        current.loaded.kind === 'ready' ? current.loaded.state : empty,
        catalog,
        id,
        action,
      );
      if (next === null) {
        setMessage('failed');
        return false;
      }
      const result = current.store.save(current.loaded, next);
      update({ ...current, loaded: current.store.load() });
      setMessage(result.kind === 'saved' ? 'saved' : 'failed');
      return result.kind === 'saved';
    },
    [storageKey, enabled, update],
  );
  const clear = useCallback(
    (snapshot: SourcePreferencesLoadResult) => {
      const current = runtimeRef.current;
      if (!enabled || current?.key !== storageKey) return false;
      // Keep the snapshot shown when confirmation opened; never silently replace
      // it with another tab's newly loaded choices before destructive confirmation.
      const result = current.store.clear(snapshot);
      update({ ...current, loaded: current.store.load() });
      setMessage(result.kind === 'cleared' ? 'saved' : 'failed');
      return result.kind === 'cleared';
    },
    [storageKey, enabled, update],
  );
  const loaded =
    enabled && runtime?.key === storageKey
      ? runtime.loaded
      : unavailable
        ? { kind: 'unavailable' as const }
        : null;
  const value = useMemo<SourceContext>(
    () => ({
      enabled,
      language,
      loaded,
      state: loaded?.kind === 'ready' ? loaded.state : empty,
      message,
      change,
      clear,
      reload,
    }),
    [enabled, language, loaded, message, change, clear, reload],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

function focusAfterRemoval(trigger: HTMLElement) {
  requestAnimationFrame(() => {
    if (!trigger.isConnected)
      document.querySelector<HTMLElement>('main [tabindex="-1"], main')?.focus();
  });
}

export function SourcePreferencesNotice() {
  const source = useSourcePreferences();
  const text = getSourcePreferencesCopy(source.language);
  if (
    !source.enabled ||
    (source.loaded?.kind !== 'protected' && source.loaded?.kind !== 'unavailable')
  )
    return null;
  return (
    <p className="source-preferences-notice" role="alert" lang={source.language}>
      {text[source.loaded.kind]}
    </p>
  );
}

export function SourceChoiceControls({
  catalog,
  sourceId,
  name,
}: {
  catalog: SourcePreferenceCatalog;
  sourceId: string;
  name: string;
}) {
  const source = useSourcePreferences();
  const text = getSourcePreferencesCopy(source.language);
  const [result, setResult] = useState<'saved' | 'failed' | null>(null);
  if (!source.enabled) return null;
  const action = getSourcePreference(source.state, catalog, sourceId);
  const editable =
    (source.loaded?.kind === 'ready' || source.loaded?.kind === 'inactive') &&
    isSourcePreferenceId(catalog, sourceId);
  return (
    <div
      className="source-choice"
      lang={source.language}
      role="group"
      aria-label={`${text.profile}: ${name}`}
    >
      <div className="source-choice-actions">
        {(['follow', 'hide'] as const).map((choice) => {
          const label =
            choice === 'follow'
              ? action === 'follow'
                ? text.unfollow
                : text.follow
              : action === 'hide'
                ? text.unhide
                : text.hide;
          return (
            <button
              key={choice}
              type="button"
              disabled={!editable}
              aria-pressed={action === choice}
              aria-label={`${label}: ${name}`}
              onClick={(event) => {
                const ok = source.change(catalog, sourceId, action === choice ? 'neutral' : choice);
                setResult(ok ? 'saved' : 'failed');
                if (ok) focusAfterRemoval(event.currentTarget);
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      {result !== null && <p role={result === 'failed' ? 'alert' : 'status'}>{text[result]}</p>}
    </div>
  );
}

export function SourceProfile({
  catalog,
  sourceId,
  name,
  children,
}: {
  catalog: SourcePreferenceCatalog;
  sourceId: string;
  name: string;
  children?: ReactNode;
}) {
  const source = useSourcePreferences();
  const text = getSourcePreferencesCopy(source.language);
  if (!source.enabled) return null;
  return (
    <details className="source-profile" lang={source.language}>
      <summary>
        {text.profile}: {name}
      </summary>
      {catalog === 'directory' && <p>{text.endpoint}</p>}
      {children}
      <SourceChoiceControls catalog={catalog} sourceId={sourceId} name={name} />
    </details>
  );
}

export function HiddenSourceNotice({
  catalog,
  sourceIds,
}: {
  catalog: SourcePreferenceCatalog;
  sourceIds: readonly string[];
}) {
  const source = useSourcePreferences();
  if (
    !source.enabled ||
    !sourceIds.some((id) => getSourcePreference(source.state, catalog, id) === 'hide')
  )
    return null;
  return (
    <p className="source-preferences-notice" lang={source.language}>
      {getSourcePreferencesCopy(source.language).hidden}
    </p>
  );
}

type KnownSource = { catalog: SourcePreferenceCatalog; sourceId: string; name: string };
export function SourcePreferencesPanel({
  knownSources = [],
}: {
  knownSources?: readonly KnownSource[];
}) {
  const source = useSourcePreferences();
  const text = getSourcePreferencesCopy(source.language);
  const copy = getUiCopy(source.language);
  const [confirmation, setConfirmation] = useState<{
    snapshot: SourcePreferencesLoadResult;
    trigger: HTMLButtonElement;
  } | null>(null);
  if (!source.enabled) return null;
  return (
    <details className="source-preferences-panel" lang={source.language}>
      <summary>{text.title}</summary>
      <p>{text.intro}</p>
      <SourcePreferencesNotice />
      {source.state.choices.length === 0 &&
        (source.loaded?.kind === 'ready' || source.loaded?.kind === 'inactive') && (
          <p>{text.empty}</p>
        )}
      <ul>
        {source.state.choices.map((choice) => {
          const known = knownSources.find(
            (item) => item.catalog === choice.catalog && item.sourceId === choice.sourceId,
          );
          const name = known?.name ?? `${text.missing}: ${choice.sourceId}`;
          return (
            <li key={`${choice.catalog}:${choice.sourceId}`}>
              <p>{name}</p>
              {choice.catalog === 'directory' && <p>{text.endpoint}</p>}
              <SourceChoiceControls
                catalog={choice.catalog}
                sourceId={choice.sourceId}
                name={name}
              />
            </li>
          );
        })}
      </ul>
      <div className="source-choice-actions">
        <button type="button" onClick={source.reload}>
          {copy.personalizationReload}
        </button>
        <button
          type="button"
          disabled={source.loaded?.kind !== 'ready' && source.loaded?.kind !== 'protected'}
          onClick={(event) => {
            if (source.loaded !== null)
              setConfirmation({ snapshot: source.loaded, trigger: event.currentTarget });
          }}
        >
          {text.clear}
        </button>
      </div>
      {source.message !== null && (
        <p role={source.message === 'failed' ? 'alert' : 'status'}>{text[source.message]}</p>
      )}
      {confirmation !== null && (
        <ClearSourcesDialog
          trigger={confirmation.trigger}
          onClose={() => setConfirmation(null)}
          onConfirm={() => {
            if (source.clear(confirmation.snapshot)) setConfirmation(null);
          }}
        />
      )}
    </details>
  );
}

function ClearSourcesDialog({
  trigger,
  onClose,
  onConfirm,
}: {
  trigger: HTMLButtonElement;
  onClose(): void;
  onConfirm(): void;
}) {
  const source = useSourcePreferences();
  const text = getSourcePreferencesCopy(source.language);
  const copy = getUiCopy(source.language);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      queueMicrotask(() => {
        if (trigger.isConnected && !trigger.disabled) trigger.focus();
        else {
          const fallback =
            trigger
              .closest('.source-preferences-panel')
              ?.querySelector<HTMLElement>('button:not(:disabled)') ??
            document.querySelector<HTMLElement>('main [tabindex="-1"], main');
          fallback?.focus();
        }
      });
    };
  }, [trigger]);
  return createPortal(
    <dialog
      ref={ref}
      className="source-dialog source-preferences-dialog"
      lang={source.language}
      aria-labelledby="source-clear-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        } else if (event.key === 'Tab') {
          const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')];
          if (event.shiftKey && document.activeElement === buttons[0]) {
            event.preventDefault();
            buttons.at(-1)?.focus();
          } else if (!event.shiftKey && document.activeElement === buttons.at(-1)) {
            event.preventDefault();
            buttons[0]?.focus();
          }
        }
      }}
    >
      <h2 id="source-clear-title">{text.clearQuestion}</h2>
      {source.message === 'failed' && <p role="alert">{text.failed}</p>}
      <div className="source-choice-actions">
        <button type="button" onClick={onClose}>
          {copy.cancel}
        </button>
        <button type="button" onClick={onConfirm}>
          {copy.deleteNow}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}

export function SourceOnlyResults({
  render,
  headingLevel = 3,
}: {
  render(): ReactNode;
  headingLevel?: 2 | 3;
}) {
  const source = useSourcePreferences();
  if (!source.enabled || source.loaded?.kind !== 'ready' || source.state.choices.length === 0)
    return null;
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section className="personalization-results" aria-labelledby="source-results-title">
      <Heading id="source-results-title">
        {getUiCopy(source.language).personalizationResults}
      </Heading>
      <p>{getSourcePreferencesCopy(source.language).intro}</p>
      {render()}
    </section>
  );
}
