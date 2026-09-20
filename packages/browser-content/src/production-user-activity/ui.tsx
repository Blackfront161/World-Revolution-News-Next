import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getUiCopy, type UiLanguage } from '@wrn/ui-language';
import { getProductionActivityCopy } from '@wrn/ui-language/production-content';
import type { useProductionUserActivity } from './use-activity';
import './ui.css';

const time = (value: number) =>
  `${Math.floor(value / 60)
    .toString()
    .padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
const minutes = (value: string) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
    ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3))
    : NaN;
type Activity = ReturnType<typeof useProductionUserActivity>;
function ClearActivityDialog({
  language,
  trigger,
  close,
  clear,
}: {
  language: UiLanguage;
  trigger: HTMLButtonElement;
  close(): void;
  clear(): void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const common = getUiCopy(language);
  const copy = getProductionActivityCopy(language);
  useLayoutEffect(() => {
    dialog.current?.showModal();
    cancel.current?.focus();
    return () => {
      dialog.current?.close();
      if (trigger.isConnected) trigger.focus();
    };
  }, [trigger]);
  return createPortal(
    <dialog
      ref={dialog}
      className="source-dialog production-activity-dialog"
      aria-labelledby="activity-clear-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          close();
        }
        if (event.key === 'Tab') {
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
      lang={language}
    >
      <h2 id="activity-clear-title">{copy.reset}</h2>
      <p>{copy.resetQuestion}</p>
      <div className="production-actions">
        <button type="button" ref={cancel} onClick={close}>
          {common.cancel}
        </button>
        <button type="button" onClick={clear}>
          {common.deleteNow}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
export function ProductionActivityPanel({
  activity,
  language,
  personalized,
  notificationsSupported,
}: {
  activity: Activity;
  language: UiLanguage;
  personalized: boolean;
  notificationsSupported: boolean;
}) {
  const copy = getProductionActivityCopy(language);
  const { view, controller } = activity;
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const enableButton = useRef<HTMLButtonElement>(null);
  const focusAfterClear = useRef(false);
  const [start, setStart] = useState('22:00');
  const [end, setEnd] = useState('08:00');
  useEffect(() => {
    if (view?.value) {
      setStart(time(view.value.notifications.quietStart));
      setEnd(time(view.value.notifications.quietEnd));
    }
  }, [view?.value?.notifications.quietStart, view?.value?.notifications.quietEnd]);
  useEffect(() => {
    if (focusAfterClear.current && view?.value?.enabled === false) {
      focusAfterClear.current = false;
      enableButton.current?.focus();
    }
  }, [view?.value?.enabled]);
  const disabled = !personalized || view?.phase !== 'ready' || view.busy || !view.contentAvailable;
  return (
    <section
      className="production-activity"
      lang={language}
      aria-labelledby="production-activity-title"
    >
      <h3 id="production-activity-title">{copy.heading}</h3>
      <p>{copy.explanation}</p>
      {!personalized && <p>{copy.selectFirst}</p>}
      {view?.failure && (
        <p role="status">
          {view.failure === 'permission-denied' ? copy.permissionDenied : copy.unavailable}
        </p>
      )}
      {!view?.value?.enabled ? (
        <button type="button" ref={enableButton} disabled={disabled} onClick={activity.enable}>
          {copy.enable}
        </button>
      ) : (
        <>
          <p role="status">
            {view.firstVisit
              ? copy.firstVisit
              : view.newIds.length > 0
                ? copy.count.replace('{count}', String(view.newIds.length))
                : copy.none}
          </p>
          <div className="production-actions">
            <button
              type="button"
              disabled={view.phase === 'loading' || view.phase === 'disposed'}
              onClick={(event) => setTrigger(event.currentTarget)}
            >
              {copy.reset}
            </button>
          </div>
          <details>
            <summary>{copy.localNotifications}</summary>
            <p>{copy.foregroundOnly}</p>
            {notificationsSupported ? (
              <div className="production-actions">
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={view.value.notifications.enabled}
                  onClick={() => {
                    if (view.value?.notifications.enabled) void controller?.disableNotifications();
                    else void controller?.enableNotifications();
                  }}
                >
                  {view.value.notifications.enabled
                    ? copy.disableNotifications
                    : copy.enableNotifications}
                </button>
              </div>
            ) : (
              <p>{copy.notificationsUnsupported}</p>
            )}
            <div className="production-activity-hours">
              <label>
                {copy.quietStart}
                <input
                  type="time"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                />
              </label>
              <label>
                {copy.quietEnd}
                <input type="time" value={end} onChange={(event) => setEnd(event.target.value)} />
              </label>
              <button
                type="button"
                disabled={
                  disabled || !Number.isFinite(minutes(start)) || !Number.isFinite(minutes(end))
                }
                onClick={() => void controller?.setQuietHours(minutes(start), minutes(end))}
              >
                {copy.saveHours}
              </button>
            </div>
            <p>{copy.quietNote}</p>
          </details>
        </>
      )}
      {trigger && (
        <ClearActivityDialog
          language={language}
          trigger={trigger}
          close={() => setTrigger(null)}
          clear={() => {
            setTrigger(null);
            focusAfterClear.current = true;
            void controller?.clear().then((cleared) => {
              if (!cleared) focusAfterClear.current = false;
            });
          }}
        />
      )}
    </section>
  );
}
export function ProductionActivityNotice({
  activity,
  articleId,
  digest,
  language,
  showNew = false,
}: {
  activity: Activity;
  articleId: string;
  digest: string | null;
  language: UiLanguage;
  showNew?: boolean;
}) {
  const copy = getProductionActivityCopy(language);
  const changed = activity.view?.changedIds.includes(articleId);
  return (
    <>
      {showNew && activity.view?.newIds.includes(articleId) && (
        <p className="production-activity-badge" lang={language}>
          {copy.newBadge}
        </p>
      )}
      {changed && digest !== null && (
        <div className="production-activity-change" lang={language}>
          <p>{copy.changed}</p>
          <button
            type="button"
            disabled={activity.view?.busy}
            onClick={() => void activity.controller?.acknowledge(articleId, digest)}
          >
            {copy.acknowledge}
          </button>
        </div>
      )}
    </>
  );
}
