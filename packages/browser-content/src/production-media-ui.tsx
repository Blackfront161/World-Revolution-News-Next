import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { UiLanguage } from '@wrn/ui-language';
import { getEventsMediaCopy, getProductionMediaCopy } from '@wrn/ui-language/events-media';
import type { ProductionMediaConsentPrompt } from './production-media-player';
import type {
  createProductionMediaController,
  ProductionMediaControllerState,
} from './production-media-controller';
import { ConsentDialog } from './events-media-directory';
import './production-media-ui.css';

type Controller = ReturnType<typeof createProductionMediaController>;
export type ProductionMediaControllerFactory = (
  onState: (state: ProductionMediaControllerState) => void,
) => Controller;

/** One local controller lifetime per mounted media route; language/filter changes retain it. */
export function ManagedProductionMediaExperience({
  createController,
  language,
  headingLevel,
}: Readonly<{
  createController: ProductionMediaControllerFactory;
  language: UiLanguage;
  headingLevel: 2 | 3;
}>) {
  const [view, setView] = useState<{
    controller: Controller;
    state: ProductionMediaControllerState;
  } | null>(null);
  useEffect(() => {
    let mounted = true;
    let subscribing = true;
    const controller = createController((next) => {
      if (mounted && !subscribing) setView({ controller, state: next });
    });
    subscribing = false;
    setView({ controller, state: controller.getState() });
    void controller.mount().then((next) => {
      if (mounted && next.phase === 'local' && next.reason === 'no-active-release')
        return controller!.bootstrapInitial();
      return next;
    });
    return () => {
      mounted = false;
      controller!.cancelConsent();
      controller!.dispose();
    };
  }, [createController]);
  return view ? (
    <ProductionMediaExperience
      controller={view.controller}
      state={view.state}
      language={language}
      headingLevel={headingLevel}
    />
  ) : null;
}
type Active = NonNullable<ProductionMediaControllerState['active']>;
type Pending = Readonly<{
  prompt: ProductionMediaConsentPrompt;
  trigger: HTMLElement;
  ready: Active['ready'];
  generation: string;
  clearEpoch: number;
}>;
type DialogProps = Readonly<{
  children: ReactNode;
  labelledBy: string;
  cancelLabel: string;
  onCancel: () => void;
}>;

const external = {
  target: '_blank',
  rel: 'noopener noreferrer',
  referrerPolicy: 'no-referrer',
} as const;

function Modal({ children, labelledBy, cancelLabel, onCancel }: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (!node.open) node.showModal();
    cancel.current?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancelRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const targets = [...node.querySelectorAll<HTMLElement>('button,a[href],input')].filter(
        (target) => !target.hasAttribute('disabled'),
      );
      const first = targets[0],
        last = targets.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    node.addEventListener('keydown', trap);
    return () => {
      node.removeEventListener('keydown', trap);
      if (node.open) node.close();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="production-media-modal"
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onCancelRef.current();
      }}
    >
      {children}
      <button
        ref={cancel}
        className="production-media-cancel"
        type="button"
        onClick={() => onCancelRef.current()}
      >
        {cancelLabel}
      </button>
    </dialog>
  );
}

const textFor = (value: Readonly<Record<string, string | null>>, language: UiLanguage) => {
  const selected = value[language];
  if (selected !== null && selected !== undefined) return { text: selected, lang: language };
  const english = value.en;
  if (english !== null && english !== undefined) return { text: english, lang: 'en' };
  const first = Object.entries(value).find(([, text]) => text !== null)?.[0];
  return first ? { text: value[first]!, lang: first } : null;
};
const date = (language: UiLanguage, value: string) =>
  `${new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value))} UTC`;
const duration = (value: number) =>
  `${Math.floor(value / 60_000)}:${String(Math.floor(value / 1_000) % 60).padStart(2, '0')}`;

export type ProductionMediaExperienceProps = Readonly<{
  controller: Controller;
  state: ProductionMediaControllerState;
  language: UiLanguage;
  headingLevel: 2 | 3;
}>;

/** UI-only projection of A7 state. It does not construct Audio, fetch, or claim a provider update. */
export function ProductionMediaExperience({
  controller,
  state,
  language,
  headingLevel,
}: ProductionMediaExperienceProps) {
  const copy = getProductionMediaCopy(language);
  const [pending, setPending] = useState<Pending | null>(null);
  const [clearing, setClearing] = useState<HTMLElement | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [confirmFailed, setConfirmFailed] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const CardHeading = headingLevel === 2 ? 'h3' : 'h4';
  const active = state.active?.ready;
  const controlsDisabled = state.phase === 'checking';
  const unavailable =
    state.phase === 'storage-error'
      ? copy.storage
      : state.reason === 'cleared'
        ? copy.cleared
        : copy.unavailable;

  useEffect(
    () => () => {
      controller.cancelConsent();
    },
    [controller],
  );
  useEffect(() => {
    if (pending || clearing || originalUrl) return;
    const target = returnFocus.current;
    returnFocus.current = null;
    target?.focus();
  }, [pending, clearing, originalUrl]);
  useEffect(() => {
    if (
      !pending ||
      (state.active &&
        state.active.ready === pending.ready &&
        state.active.generation === pending.generation &&
        state.active.clearEpoch === pending.clearEpoch)
    )
      return;
    controller.cancelConsent();
    returnFocus.current = pending.trigger;
    setPending(null);
  }, [controller, pending, state.active]);

  const closePrompt = () => {
    controller.cancelConsent();
    returnFocus.current = pending?.trigger ?? returnFocus.current;
    setPending(null);
  };
  const closeClear = () => {
    returnFocus.current = clearing;
    setClearing(null);
  };
  const closeOriginal = () => {
    setOriginalUrl(null);
  };
  const requestPlay = (episodeId: string, trigger: HTMLElement, resume: boolean) => {
    if (controlsDisabled || !state.active) return;
    const prompt = resume ? controller.prepareResume(episodeId) : controller.preparePlay(episodeId);
    if (prompt) {
      setConfirmFailed(false);
      setPending({
        prompt,
        trigger,
        ready: state.active.ready,
        generation: state.active.generation,
        clearEpoch: state.active.clearEpoch,
      });
    }
  };

  if (state.phase === 'disposed') return null;

  return (
    <section
      className="production-media-experience"
      data-testid="production-media-experience"
      aria-labelledby="production-media-heading"
    >
      <Heading id="production-media-heading">{copy.heading}</Heading>
      {state.phase === 'checking' ||
      (!active && state.phase === 'local' && state.reason === 'no-active-release') ? (
        <p role="status">{copy.loading}</p>
      ) : null}
      {!active &&
      state.phase !== 'checking' &&
      !(state.phase === 'local' && state.reason === 'no-active-release') ? (
        <p role="status">{unavailable}</p>
      ) : null}
      {active ? (
        <ol className="production-media-list">
          {active.documents.manifest.episodes.map((episode) => {
            const source = active.documents.manifest.sources.find(
              (entry) => entry.id === episode.sourceId,
            );
            const rights = active.documents.rights.entries.find(
              (entry) => entry.episodeId === episode.id,
            );
            const title = textFor(episode.title, language);
            const summary = textFor(episode.summary, language);
            const isCurrent = state.player.episodeId === episode.id;
            const max = state.player.durationMs ?? episode.durationMs;
            return (
              <li key={episode.id}>
                <article>
                  <CardHeading lang={title?.lang}>{title?.text ?? copy.unavailable}</CardHeading>
                  {summary ? <p lang={summary.lang}>{summary.text}</p> : <p>{copy.unavailable}</p>}
                  <dl>
                    <div>
                      <dt>{copy.publisher}</dt>
                      <dd lang={source ? textFor(source.title, language)?.lang : undefined}>
                        {source
                          ? (textFor(source.title, language)?.text ?? copy.unavailable)
                          : copy.unavailable}
                      </dd>
                    </div>
                    <div>
                      <dt>{copy.published}</dt>
                      <dd>
                        <time dateTime={episode.publishedAt}>
                          {date(language, episode.publishedAt)}
                        </time>
                      </dd>
                    </div>
                    <div>
                      <dt>{copy.duration}</dt>
                      <dd>{duration(episode.durationMs)}</dd>
                    </div>
                    <div>
                      <dt>{copy.attribution}</dt>
                      <dd>{rights?.attribution ?? copy.unavailable}</dd>
                    </div>
                  </dl>
                  <p>
                    {copy.onlineOnly} · {copy.noDownload}
                  </p>
                  <button
                    className="production-media-original"
                    type="button"
                    onClick={(event) => {
                      returnFocus.current = event.currentTarget;
                      setOriginalUrl(episode.canonicalPage);
                    }}
                  >
                    {copy.original}
                  </button>
                  <div className="production-media-controls" aria-label={title?.text ?? episode.id}>
                    {!isCurrent ||
                    state.player.phase === 'ended' ||
                    state.player.phase === 'error' ? (
                      <button
                        type="button"
                        disabled={controlsDisabled}
                        onClick={(event) => requestPlay(episode.id, event.currentTarget, false)}
                      >
                        {copy.play}
                      </button>
                    ) : null}
                    {state.resume.kind === 'available' &&
                    state.resume.episodeId === episode.id &&
                    !isCurrent ? (
                      <button
                        type="button"
                        disabled={controlsDisabled}
                        onClick={(event) => requestPlay(episode.id, event.currentTarget, true)}
                      >
                        {copy.resume}
                      </button>
                    ) : null}
                    {isCurrent && state.player.phase === 'playing' ? (
                      <button
                        type="button"
                        disabled={controlsDisabled}
                        onClick={() => controller.pause()}
                      >
                        {copy.pause}
                      </button>
                    ) : null}
                    {isCurrent && state.player.phase === 'paused' ? (
                      <button
                        type="button"
                        disabled={controlsDisabled}
                        onClick={() => controller.continue()}
                      >
                        {copy.continue}
                      </button>
                    ) : null}
                    {isCurrent ? (
                      <label>
                        {copy.seek}
                        <input
                          type="range"
                          min="0"
                          max={max}
                          value={Math.min(state.player.positionMs, max)}
                          disabled={controlsDisabled}
                          onChange={(event) => controller.seek(Number(event.currentTarget.value))}
                        />
                      </label>
                    ) : null}
                  </div>
                  {isCurrent && state.player.error ? (
                    <p role="status">{copy.streamUnavailable}</p>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ol>
      ) : null}
      {confirmFailed ? <p role="status">{copy.streamUnavailable}</p> : null}
      {
        <button
          className="production-media-clear"
          type="button"
          disabled={controlsDisabled}
          onClick={(event) => setClearing(event.currentTarget)}
        >
          {copy.clear}
        </button>
      }
      {pending ? (
        <Modal
          labelledBy="production-media-consent-title"
          cancelLabel={copy.cancel}
          onCancel={closePrompt}
        >
          <h4 id="production-media-consent-title">{copy.consentTitle}</h4>
          {textFor(pending.prompt.episode.title, language) ? (
            <p lang={textFor(pending.prompt.episode.title, language)?.lang}>
              <strong>{textFor(pending.prompt.episode.title, language)?.text}</strong>
            </p>
          ) : null}
          <p>{copy.consentIntro}</p>
          <p>
            <strong>{pending.prompt.consent.recipientName}</strong>
            <br />
            {pending.prompt.consent.recipientOrigin}
          </p>
          <p>{copy.categories}</p>
          <p>
            {copy.onlineOnly} · {copy.noDownload}
          </p>
          <p>
            {copy.attribution}: {pending.prompt.rights.attribution}
          </p>
          <a href={pending.prompt.consent.privacyNoticeUrl} {...external}>
            {copy.privacy}
          </a>
          <button
            type="button"
            onClick={() => {
              // This exact click is the user gesture boundary; no async work or state update precedes it.
              const confirmed = controller.confirmPlay(pending.prompt);
              returnFocus.current = pending.trigger;
              setPending(null);
              if (!confirmed) setConfirmFailed(true);
            }}
          >
            {copy.confirmPlay}
          </button>
        </Modal>
      ) : null}
      {clearing ? (
        <Modal
          labelledBy="production-media-clear-title"
          cancelLabel={copy.cancel}
          onCancel={closeClear}
        >
          <h4 id="production-media-clear-title">{copy.clearTitle}</h4>
          <p>{copy.clearText}</p>
          <button
            type="button"
            onClick={() => {
              void controller.clearLocal();
              closeClear();
            }}
          >
            {copy.confirmClear}
          </button>
        </Modal>
      ) : null}
      {originalUrl ? (
        <ConsentDialog
          url={originalUrl}
          onClose={closeOriginal}
          copy={getEventsMediaCopy(language)}
        />
      ) : null}
    </section>
  );
}
