import { useEffect, useRef, useState } from 'react';
import type { UiLanguage } from '@wrn/ui-language';
import { getWebsiteSupportCopy } from '../../../packages/ui-language/src/website-support';
import './website-support-welcome.css';

export const websiteSupportSeenKey = 'wrn.website.support-welcome.v1';
export function WebsiteSupportWelcome({ language }: { language: UiLanguage }) {
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem(websiteSupportSeenKey) !== 'dismissed';
    } catch {
      return true;
    }
  });
  const dialog = useRef<HTMLDialogElement>(null);
  const continueButton = useRef<HTMLButtonElement>(null);
  const copy = getWebsiteSupportCopy(language);
  useEffect(() => {
    if (!visible) return;
    const node = dialog.current;
    const previous = document.activeElement;
    if (node && typeof node.showModal === 'function') node.showModal();
    else if (node) {
      node.setAttribute('open', '');
      node.setAttribute('data-dialog-fallback', 'true');
    }
    continueButton.current?.focus();
    return () => {
      if (node && typeof node.close === 'function') node.close();
      else node?.removeAttribute('open');
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [visible]);
  const dismiss = () => {
    try {
      sessionStorage.setItem(websiteSupportSeenKey, 'dismissed');
    } catch {
      /* Session-only memory remains usable when storage is blocked. */
    }
    setVisible(false);
  };
  if (!visible) return null;
  return (
    <dialog
      ref={dialog}
      className="website-support-welcome"
      aria-labelledby="website-support-title"
      aria-describedby="website-support-body"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          dismiss();
        } else if (event.key === 'Tab') {
          const targets = event.currentTarget.querySelectorAll<HTMLElement>('button,a[href]');
          const first = targets[0];
          const last = targets[targets.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
    >
      <h2 id="website-support-title">{copy.title}</h2>
      <p id="website-support-body">{copy.body}</p>
      <p>{copy.thanks}</p>
      <button ref={continueButton} type="button" onClick={dismiss}>
        {copy.continue}
      </button>
      <a
        href="https://www.paypal.com/ncp/payment/6FSV9FEN4X7VS"
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        aria-describedby="website-support-external"
        onClick={dismiss}
      >
        {copy.support}
      </a>
      <small id="website-support-external">{copy.external}</small>
    </dialog>
  );
}
