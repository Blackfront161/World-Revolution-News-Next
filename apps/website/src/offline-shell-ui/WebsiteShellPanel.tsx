import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { englishUiCopy, formatUiCopy, type UiCopy } from '@wrn/ui-language';
import {
  createWebsiteShellAdapter,
  type WebsiteShellAdapter,
  type WebsiteShellOperationOutcome,
  type WebsiteShellStatus,
} from '../offline-shell/adapter';

const initialSnapshot: WebsiteShellStatus = Object.freeze({
  kind: 'initializing',
  epoch: null,
  controlled: false,
});
const noSubscription = () => () => undefined;
const getInitialSnapshot = () => initialSnapshot;

function createSourceDevShellAdapter(): WebsiteShellAdapter {
  let snapshot: WebsiteShellStatus = Object.freeze({
    kind: 'uncontrolled',
    epoch: null,
    controlled: false,
  });
  const listeners = new Set<() => void>();
  const unavailable = async () => {
    snapshot = Object.freeze({
      kind: 'error',
      code: 'unsupported',
      epoch: null,
      controlled: false,
    });
    listeners.forEach((listener) => listener());
    return snapshot;
  };
  return Object.freeze({
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh: async () => snapshot,
    enable: unavailable,
    update: unavailable,
    remove: unavailable,
    dispose: () => listeners.clear(),
  });
}

const createPanelAdapter = () =>
  import.meta.env.DEV ? createSourceDevShellAdapter() : createWebsiteShellAdapter();

type ShellAction = 'enable' | 'update' | 'remove';
type Confirmation = Readonly<{
  fingerprint: string;
  trigger: HTMLButtonElement;
}>;

const snapshotFingerprint = (snapshot: WebsiteShellStatus) =>
  [
    snapshot.kind,
    snapshot.epoch ?? '',
    snapshot.shellId ?? '',
    snapshot.waitingShellId ?? '',
    snapshot.operation ?? '',
  ].join('|');

function statusDetail(copy: UiCopy, snapshot: WebsiteShellStatus) {
  switch (snapshot.kind) {
    case 'uncontrolled':
      return copy.websiteShellUncontrolled;
    case 'saved':
      return copy.websiteShellSaved;
    case 'active':
      return copy.websiteShellActive;
    case 'waiting':
      return copy.websiteShellWaiting;
    case 'pending':
      return copy.websiteShellWorking;
    case 'removed':
      return copy.websiteShellRemoved;
    case 'protected':
    case 'error':
      return copy.websiteShellProtected;
    case 'initializing':
      return copy.loading;
  }
}

function updateAttemptDetail(copy: UiCopy, attempt: WebsiteShellOperationOutcome | null) {
  switch (attempt?.kind) {
    case 'running':
      return copy.websiteShellUpdateRunning;
    case 'succeeded':
      return copy.websiteShellUpdateSucceeded;
    case 'failed':
      return copy.websiteShellUpdateFailed;
    case 'indeterminate':
      return copy.websiteShellUpdateIndeterminate;
    default:
      return copy.websiteShellUpdateNotStarted;
  }
}

function actionsFor(snapshot: WebsiteShellStatus): readonly ShellAction[] {
  switch (snapshot.kind) {
    case 'uncontrolled':
    case 'removed':
      return ['enable'];
    case 'saved':
    case 'active':
      return ['update', 'remove'];
    case 'waiting':
      return ['remove'];
    default:
      return [];
  }
}

function ShellRemoveConfirmation({
  copy,
  trigger,
  onClose,
  onConfirm,
}: {
  copy: UiCopy;
  trigger: HTMLButtonElement;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const backdrop = backdropRef.current;
    const siblings = [...document.body.children].filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== backdrop,
    );
    const prior = siblings.map((element) => element.inert);
    siblings.forEach((element) => {
      element.inert = true;
    });
    cancelRef.current?.focus();
    return () => {
      siblings.forEach((element, index) => {
        element.inert = prior[index]!;
      });
      queueMicrotask(() => {
        if (backdrop?.isConnected) return;
        const destination =
          trigger.isConnected && !trigger.disabled
            ? trigger
            : document.querySelector<HTMLElement>('main');
        destination?.focus();
      });
    };
  }, [trigger]);
  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')];
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (event.shiftKey && current === 0) {
      event.preventDefault();
      buttons.at(-1)?.focus();
    } else if (!event.shiftKey && current === buttons.length - 1) {
      event.preventDefault();
      buttons[0]?.focus();
    }
  };
  return createPortal(
    <div className="confirmation-backdrop source-dialog-backdrop" ref={backdropRef}>
      <section
        className="confirmation-dialog source-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="website-shell-remove-title"
        aria-describedby="website-shell-remove-detail"
        onKeyDown={onKeyDown}
      >
        <h2 id="website-shell-remove-title">
          {formatUiCopy(copy.clearReadingDataQuestion, { label: copy.websiteShellTitle })}
        </h2>
        <p id="website-shell-remove-detail">{copy.websiteShellScope}</p>
        <div className="source-dialog-actions">
          <button ref={cancelRef} type="button" onClick={onClose}>
            {copy.cancel}
          </button>
          <button type="button" onClick={onConfirm}>
            {copy.websiteShellRemove}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

/**
 * UI ownership ends at the adapter boundary. Creating the adapter in an effect
 * means a render that React discards before commit cannot leak a channel or
 * browser subscription; every committed owner disposes its paired adapter.
 */
export function WebsiteShellPanel({
  adapterFactory = createPanelAdapter,
  copy = englishUiCopy,
}: {
  adapterFactory?: () => WebsiteShellAdapter;
  copy?: UiCopy;
}) {
  const factoryRef = useRef(adapterFactory);
  const mountedRef = useRef(false);
  const [adapter, setAdapter] = useState<WebsiteShellAdapter | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [invoking, setInvoking] = useState<ShellAction | null>(null);
  const [updateAttempt, setUpdateAttempt] = useState<WebsiteShellOperationOutcome | null>(null);
  useEffect(() => {
    mountedRef.current = true;
    const ownedAdapter = factoryRef.current();
    setAdapter(ownedAdapter);
    return () => {
      mountedRef.current = false;
      ownedAdapter.dispose();
    };
  }, []);
  const subscribe = useMemo(
    () => (adapter === null ? noSubscription : adapter.subscribe),
    [adapter],
  );
  const getSnapshot = useMemo(
    () => (adapter === null ? getInitialSnapshot : adapter.getSnapshot),
    [adapter],
  );
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getInitialSnapshot);
  const [settledReadiness, setSettledReadiness] = useState<WebsiteShellStatus>(initialSnapshot);
  useEffect(() => {
    if (snapshot.kind === 'initializing' || snapshot.kind === 'pending') return;
    const timeout = window.setTimeout(() => setSettledReadiness(snapshot), 0);
    return () => window.clearTimeout(timeout);
  }, [snapshot]);
  const readinessSnapshot =
    snapshot.kind === 'pending' && settledReadiness.kind !== 'initializing'
      ? settledReadiness
      : snapshot;
  const actionLabels: Readonly<Record<ShellAction, string>> = {
    enable: copy.websiteShellEnable,
    update:
      updateAttempt?.kind === 'failed' || updateAttempt?.kind === 'indeterminate'
        ? copy.websiteShellUpdateRetry
        : copy.websiteShellUpdate,
    remove: copy.websiteShellRemove,
  };
  const closeConfirmation = () => setConfirmation(null);

  useEffect(() => {
    if (confirmation === null) return;
    if (confirmation.fingerprint === snapshotFingerprint(snapshot)) return;
    const timeout = window.setTimeout(closeConfirmation, 0);
    return () => window.clearTimeout(timeout);
  }, [confirmation, snapshot]);

  useEffect(() => {
    if (
      invoking !== null ||
      updateAttempt?.kind !== 'running' ||
      snapshot.kind === 'initializing' ||
      snapshot.kind === 'pending'
    )
      return;
    const timeout = window.setTimeout(
      () =>
        setUpdateAttempt({
          kind: 'indeterminate',
          operation: 'update',
          epoch: updateAttempt.epoch,
          code: 'native-outcome-unbound',
        }),
      0,
    );
    return () => window.clearTimeout(timeout);
  }, [invoking, snapshot.kind, updateAttempt]);

  const invoke = async (action: ShellAction) => {
    if (
      adapter === null ||
      invoking !== null ||
      updateAttempt?.kind === 'running' ||
      !actionsFor(snapshot).includes(action)
    )
      return;
    setInvoking(action);
    if (action === 'update')
      setUpdateAttempt({ kind: 'running', operation: 'update', epoch: snapshot.epoch });
    try {
      const result = await adapter[action]();
      if (!mountedRef.current || action !== 'update') return;
      setUpdateAttempt(result.outcome?.operation === 'update' ? result.outcome : null);
    } catch {
      if (!mountedRef.current || action !== 'update') return;
      setUpdateAttempt({
        kind: 'failed',
        operation: 'update',
        epoch: snapshot.epoch,
        code: 'operation-failed',
      });
    } finally {
      if (mountedRef.current) setInvoking(null);
    }
  };
  const requestRemove = (trigger: HTMLButtonElement) => {
    if (
      adapter === null ||
      invoking !== null ||
      updateAttempt?.kind === 'running' ||
      !actionsFor(snapshot).includes('remove')
    )
      return;
    setConfirmation({ fingerprint: snapshotFingerprint(snapshot), trigger });
  };
  const confirmRemove = () => {
    if (
      adapter !== null &&
      invoking === null &&
      updateAttempt?.kind !== 'running' &&
      confirmation !== null &&
      confirmation.fingerprint === snapshotFingerprint(adapter.getSnapshot()) &&
      actionsFor(adapter.getSnapshot()).includes('remove')
    )
      void invoke('remove');
    closeConfirmation();
  };
  const actions =
    invoking === null && updateAttempt?.kind !== 'running' ? actionsFor(snapshot) : [];

  return (
    <>
      <section
        className="website-shell-panel"
        aria-labelledby="website-shell-title"
        data-shell-status={snapshot.kind}
        data-update-status={updateAttempt?.kind ?? 'idle'}
      >
        <div>
          <h2 id="website-shell-title">{copy.websiteShellTitle}</h2>
          <p>{copy.websiteShellScope}</p>
        </div>
        <div
          className="website-shell-status-region"
          role="region"
          aria-labelledby="website-shell-readiness-label"
          aria-busy={
            snapshot.kind === 'initializing' ||
            (snapshot.kind === 'pending' && snapshot.operation !== 'update')
          }
        >
          <h3 id="website-shell-readiness-label">{copy.websiteShellReadinessLabel}</h3>
          <p
            className="website-shell-status website-shell-readiness"
            role="status"
            aria-atomic="true"
          >
            {readinessSnapshot.kind === 'saved' || readinessSnapshot.kind === 'active' ? (
              <strong>{copy.ready}: </strong>
            ) : null}
            {readinessSnapshot.kind === 'error' ? <strong>{copy.error}: </strong> : null}
            {statusDetail(copy, readinessSnapshot)}
          </p>
          {snapshot.kind === 'pending' &&
          snapshot.operation !== 'update' &&
          settledReadiness.kind !== 'initializing' ? (
            <p
              className="website-shell-status website-shell-action-status"
              role="status"
              aria-atomic="true"
            >
              {copy.websiteShellWorking}
            </p>
          ) : null}
        </div>
        <div
          className="website-shell-status-region"
          role="region"
          aria-labelledby="website-shell-update-label"
          aria-busy={updateAttempt?.kind === 'running'}
        >
          <h3 id="website-shell-update-label">{copy.websiteShellUpdateAttemptLabel}</h3>
          <p
            className="website-shell-status website-shell-update-status"
            role="status"
            aria-atomic="true"
          >
            {updateAttemptDetail(copy, updateAttempt)}
          </p>
        </div>
        {actions.length > 0 ? (
          <div className="website-shell-actions">
            {actions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={(event) =>
                  action === 'remove' ? requestRemove(event.currentTarget) : invoke(action)
                }
              >
                {actionLabels[action]}
              </button>
            ))}
          </div>
        ) : null}
      </section>
      {confirmation !== null ? (
        <ShellRemoveConfirmation
          copy={copy}
          trigger={confirmation.trigger}
          onClose={closeConfirmation}
          onConfirm={confirmRemove}
        />
      ) : null}
    </>
  );
}
