import { useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createLocalPersonalizationState } from '@wrn/domain';
import {
  localPersonalizationContentLanguageIds,
  localPersonalizationInterestIds,
  localPersonalizationRegionIds,
} from '@wrn/content-contracts';
import type { UiCopy } from '@wrn/ui-language';
import type {
  LocalPersonalizationLoadResult,
  LocalPersonalizationStore,
} from './local-personalization-state';
import './local-personalization-ui.css';
type PersonalizationDialogKind = 'save' | 'clear';

function LocalPersonalizationDialog({
  kind,
  trigger,
  onClose,
  onConfirm,
  copy,
  headingRef,
}: {
  kind: PersonalizationDialogKind;
  trigger: HTMLButtonElement | null;
  onClose: () => void;
  onConfirm: () => void;
  copy: UiCopy;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const node = dialogRef.current;
    node?.showModal();
    cancelRef.current?.focus();
    return () => {
      node?.close();
      queueMicrotask(() => {
        if (node?.isConnected) return;
        (trigger?.isConnected && !trigger.disabled
          ? trigger
          : (headingRef.current?.closest<HTMLElement>('main') ?? headingRef.current)
        )?.focus();
      });
    };
  }, [trigger, headingRef]);
  return (
    <dialog
      ref={dialogRef}
      className="personalization-dialog"
      aria-labelledby="personalization-confirm-title"
      aria-describedby="personalization-confirm-detail"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose();
          return;
        }
        if (event.key !== 'Tab') return;
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
        ];
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <h2 id="personalization-confirm-title">
        {kind === 'save' ? copy.personalizationSaveQuestion : copy.personalizationClearQuestion}
      </h2>
      <p id="personalization-confirm-detail">
        {kind === 'save' ? copy.personalizationSaveDetail : copy.personalizationClearDetail}
      </p>
      <div className="personalization-actions">
        <button ref={cancelRef} type="button" onClick={onClose}>
          {copy.cancel}
        </button>
        <button type="button" onClick={onConfirm}>
          {kind === 'save' ? copy.personalizationSave : copy.personalizationClear}
        </button>
      </div>
    </dialog>
  );
}

function personalizationStatus(
  copy: UiCopy,
  result: LocalPersonalizationLoadResult,
  saved: boolean,
  cleared: boolean,
) {
  if (cleared) return { role: 'status' as const, text: copy.personalizationDeleted };
  if (saved) return { role: 'status' as const, text: copy.personalizationSaved };
  switch (result.kind) {
    case 'inactive':
      return { role: 'status' as const, text: copy.personalizationInactive };
    case 'ready':
      return { role: 'status' as const, text: copy.personalizationReady };
    case 'protected':
      return { role: 'alert' as const, text: copy.personalizationProtected };
    case 'unavailable':
      return { role: 'alert' as const, text: copy.personalizationUnavailable };
  }
}

export function LocalPersonalizationHub({
  copy,
  headingId,
  headingLevel = 2,
  headingRef,
  store,
  loaded,
  onLoaded,
  results,
  inactiveResults,
}: {
  copy: UiCopy;
  headingId: string;
  headingLevel?: 1 | 2;
  headingRef: RefObject<HTMLHeadingElement | null>;
  store: LocalPersonalizationStore;
  loaded: LocalPersonalizationLoadResult;
  onLoaded: (value: LocalPersonalizationLoadResult) => void;
  results: ReactNode;
  inactiveResults?: ReactNode;
}) {
  const [draft, setDraft] = useState(() =>
    loaded.kind === 'ready'
      ? {
          interestIds: [...loaded.state.interestIds],
          regionIds: [...loaded.state.regionIds],
          contentLanguageIds: [...loaded.state.contentLanguageIds],
        }
      : {
          interestIds: [] as string[],
          regionIds: [] as string[],
          contentLanguageIds: [] as string[],
        },
  );
  const [dialog, setDialog] = useState<PersonalizationDialogKind | null>(null);
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [resultKind, setResultKind] = useState<
    | 'conflict'
    | 'unavailable'
    | 'write-failed'
    | 'verification-failed'
    | 'remove-failed'
    | 'blocked'
    | 'invalid'
    | null
  >(null);
  const [reloadRequired, setReloadRequired] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const selection = useMemo(
    () =>
      createLocalPersonalizationState({
        interestIds: draft.interestIds as Parameters<
          typeof createLocalPersonalizationState
        >[0]['interestIds'],
        regionIds: draft.regionIds as Parameters<
          typeof createLocalPersonalizationState
        >[0]['regionIds'],
        contentLanguageIds: draft.contentLanguageIds as Parameters<
          typeof createLocalPersonalizationState
        >[0]['contentLanguageIds'],
      }),
    [draft],
  );
  const setField = (field: keyof typeof draft, id: string, selected: boolean) => {
    setSaved(false);
    setCleared(false);
    setResultKind(null);
    setDraft((current) => ({
      ...current,
      [field]: selected ? [...current[field], id] : current[field].filter((value) => value !== id),
    }));
  };
  const reload = () => {
    const next = store.load();
    onLoaded(next);
    setSaved(false);
    setCleared(false);
    setResultKind(null);
    setReloadRequired(false);
    setDraft(
      next.kind === 'ready'
        ? {
            interestIds: [...next.state.interestIds],
            regionIds: [...next.state.regionIds],
            contentLanguageIds: [...next.state.contentLanguageIds],
          }
        : { interestIds: [], regionIds: [], contentLanguageIds: [] },
    );
  };
  const requestSave = (trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setDialog('save');
  };
  const requestClear = (trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setDialog('clear');
  };
  const confirm = () => {
    const action = dialog;
    setDialog(null);
    if (action === 'save') {
      if (selection === null) {
        setResultKind('invalid');
        return;
      }
      const result = store.save(loaded, selection);
      if (result.kind === 'saved') {
        const next = store.load();
        onLoaded(next);
        setSaved(true);
        setCleared(false);
        setResultKind(null);
        return;
      }
      setResultKind(result.kind);
      setReloadRequired(true);
      return;
    }
    if (action === 'clear') {
      const result = store.clear(loaded);
      if (result.kind === 'cleared') {
        onLoaded(store.load());
        setDraft({ interestIds: [], regionIds: [], contentLanguageIds: [] });
        setSaved(false);
        setCleared(true);
        setResultKind(null);
        return;
      }
      setResultKind(result.kind);
      setReloadRequired(true);
    }
  };
  const resultText =
    resultKind === null
      ? null
      : resultKind === 'conflict'
        ? copy.personalizationConflict
        : resultKind === 'unavailable'
          ? copy.personalizationUnavailable
          : resultKind === 'write-failed'
            ? copy.personalizationWriteFailed
            : resultKind === 'verification-failed'
              ? copy.personalizationVerificationFailed
              : resultKind === 'remove-failed'
                ? copy.personalizationClearFailed
                : resultKind === 'invalid'
                  ? copy.personalizationInvalid
                  : copy.personalizationReloadRequired;
  const status =
    resultText === null
      ? personalizationStatus(copy, loaded, saved, cleared)
      : {
          role: 'alert' as const,
          text: resultText,
        };
  const groups: ReadonlyArray<{
    field: keyof typeof draft;
    legend: string;
    items: readonly { id: string; label: string }[];
  }> = [
    {
      field: 'interestIds',
      legend: copy.personalizationInterests,
      items: localPersonalizationInterestIds.map((id) => ({
        id,
        label: {
          'fan-culture': copy.personalizationInterestFanCulture,
          football: copy.personalizationInterestFootball,
          'local-organizing': copy.personalizationInterestLocalOrganizing,
          'media-technology': copy.personalizationInterestMediaTechnology,
          'movement-news': copy.personalizationInterestMovementNews,
          sport: copy.personalizationInterestSport,
          'women-feminist': copy.personalizationInterestWomenFeminist,
        }[id],
      })),
    },
    {
      field: 'regionIds',
      legend: copy.personalizationRegions,
      items: localPersonalizationRegionIds.map((id) => ({
        id,
        label: {
          africa: copy.personalizationRegionAfrica,
          asia: copy.personalizationRegionAsia,
          europe: copy.personalizationRegionEurope,
          global: copy.personalizationRegionGlobal,
          'latin-america-caribbean': copy.personalizationRegionLatinAmericaCaribbean,
          'middle-east-north-africa': copy.personalizationRegionMiddleEastNorthAfrica,
          'north-america': copy.personalizationRegionNorthAmerica,
          oceania: copy.personalizationRegionOceania,
        }[id],
      })),
    },
    {
      field: 'contentLanguageIds',
      legend: copy.personalizationContentLanguages,
      items: localPersonalizationContentLanguageIds.map((id) => ({
        id,
        label: {
          de: 'Deutsch',
          el: 'Ελληνικά',
          en: 'English',
          es: 'Español',
          fr: 'Français',
          it: 'Italiano',
          pt: 'Português',
          ru: 'Русский',
          tr: 'Türkçe',
        }[id],
      })),
    },
  ];
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const ResultsHeading = headingLevel === 1 ? 'h2' : 'h3';
  const editable = loaded.kind === 'inactive' || loaded.kind === 'ready';
  return (
    <section className="personalization-view" aria-labelledby={headingId}>
      <p className="feed-overline">{copy.personalizationOverline}</p>
      <Heading id={headingId} ref={headingRef} tabIndex={-1}>
        {copy.personalizationTitle}
      </Heading>
      <p className="personalization-intro">{copy.personalizationIntro}</p>
      <p className="personalization-privacy">{copy.personalizationPrivacy}</p>
      <p role={status.role} aria-live="polite" className="personalization-status">
        {status.text}
      </p>
      {reloadRequired ? <p role="status">{copy.personalizationReloadRequired}</p> : null}
      {editable ? (
        <>
          <div className="personalization-groups">
            {groups.map((group) => (
              <fieldset key={group.field} className="personalization-group">
                <legend>{group.legend}</legend>
                <div className="personalization-options">
                  {group.items.map((item) => {
                    const checked = draft[group.field].includes(item.id);
                    const inputId = `personalization-${group.field}-${item.id}`;
                    return (
                      <label key={item.id} className="personalization-option" htmlFor={inputId}>
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => setField(group.field, item.id, event.target.checked)}
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="personalization-actions">
            <button
              type="button"
              className="reader-entry"
              disabled={selection === null || reloadRequired}
              onClick={(event) => requestSave(event.currentTarget)}
            >
              {copy.personalizationSave}
            </button>
            {loaded.kind === 'ready' ? (
              <button
                type="button"
                className="reading-danger"
                disabled={reloadRequired}
                onClick={(event) => requestClear(event.currentTarget)}
              >
                {copy.personalizationClear}
              </button>
            ) : null}
            <button type="button" onClick={reload}>
              {copy.personalizationReload}
            </button>
          </div>
        </>
      ) : loaded.kind === 'protected' ? (
        <div className="personalization-actions">
          <button
            type="button"
            className="reading-danger"
            disabled={reloadRequired}
            onClick={(event) => requestClear(event.currentTarget)}
          >
            {copy.personalizationClear}
          </button>
          <button type="button" onClick={reload}>
            {copy.personalizationReload}
          </button>
        </div>
      ) : (
        <button type="button" onClick={reload}>
          {copy.personalizationReload}
        </button>
      )}
      {loaded.kind === 'ready' ? (
        <section
          className="personalization-results"
          aria-labelledby="personalization-results-title"
        >
          <ResultsHeading id="personalization-results-title">
            {copy.personalizationResults}
          </ResultsHeading>
          {results}
        </section>
      ) : loaded.kind === 'inactive' ? (
        inactiveResults
      ) : null}
      {dialog !== null ? (
        <LocalPersonalizationDialog
          copy={copy}
          headingRef={headingRef}
          kind={dialog}
          trigger={triggerRef.current}
          onClose={() => setDialog(null)}
          onConfirm={confirm}
        />
      ) : null}
    </section>
  );
}
