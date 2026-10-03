import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { UiLanguage } from '@wrn/ui-language';
import { catalogueHref } from '../catalogue-navigation/catalogue-location';
import { websiteGuideCopy, websiteGuideActions } from './website-guide-copy';
import './website-guide.css';

function GuideDialog({
  language,
  trigger,
  close,
}: {
  language: UiLanguage;
  trigger: HTMLButtonElement;
  close(): void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    copy = websiteGuideCopy[language],
    actions = websiteGuideActions[language];
  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      queueMicrotask(() =>
        (trigger.isConnected ? trigger : document.querySelector<HTMLElement>('main'))?.focus(),
      );
    };
  }, [trigger]);
  return createPortal(
    <dialog
      ref={ref}
      className="website-guide"
      aria-labelledby="website-guide-title"
      lang={language}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <button type="button" onClick={close} autoFocus>
        {actions[0]}
      </button>
      <h2 id="website-guide-title">{copy.title}</h2>
      <p>{copy.intro}</p>
      {copy.tasks.map(([title, text]) => (
        <details key={title}>
          <summary>{title}</summary>
          <p>{text}</p>
        </details>
      ))}
      <nav aria-label={copy.title}>
        <a href={catalogueHref('radio', language)}>{actions[1]}</a>
        <a href={catalogueHref('podcasts', language)}>{actions[2]}</a>
        <a href={catalogueHref('library', language)}>{actions[3]}</a>
      </nav>
    </dialog>,
    document.body,
  );
}
export function WebsiteGuide({ language }: { language: UiLanguage }) {
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  return (
    <>
      <button
        type="button"
        className="site-more-action"
        aria-haspopup="dialog"
        onClick={(event) => setTrigger(event.currentTarget)}
      >
        {websiteGuideCopy[language].title}
      </button>
      {trigger && (
        <GuideDialog language={language} trigger={trigger} close={() => setTrigger(null)} />
      )}
    </>
  );
}
