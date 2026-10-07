import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { getUiCopy, type UiLanguage } from '@wrn/ui-language';
import { getWebsiteHomeCopy } from '../home/website-home-copy';
import {
  catalogueHref,
  catalogueKinds,
  readCatalogueLocation,
  type WebsiteCatalogueKind,
} from './catalogue-location';
import { notifyNavigation } from './catalogue-navigation-state';
export function CatalogueLink({
  kind,
  item,
  language,
  children,
}: {
  kind: WebsiteCatalogueKind;
  item?: string;
  language: UiLanguage;
  children: ReactNode;
}) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    window.dispatchEvent(new CustomEvent('wrn-catalogue-capture', { detail: item ?? null }));
    const location = readCatalogueLocation(window.location.hash);
    const origin =
      location !== null && !location.item && !location.invalidItem ? location.kind : null;
    window.history.pushState(
      { wrnCatalogueOrigin: origin, wrnCatalogueItemKind: kind, wrnCatalogueItemId: item ?? null },
      '',
      catalogueHref(kind, language, item),
    );
    notifyNavigation();
  };
  return (
    <a href={catalogueHref(kind, language, item)} onClick={open} data-catalogue-item={item}>
      {children}
    </a>
  );
}
export function CatalogueItemPanel({
  kind,
  item,
  language,
  title,
  titleLanguage,
  children,
}: {
  kind: WebsiteCatalogueKind;
  item: string | null;
  language: UiLanguage;
  title: string | null;
  titleLanguage?: string;
  children?: ReactNode;
}) {
  const ui = getUiCopy(language),
    copy = getWebsiteHomeCopy(language);
  const [status, setStatus] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [item]);
  const canonical =
    item && title ? `https://solinaridao.com${catalogueHref(kind, language, item)}` : null;
  const copyLink = async () => {
    if (!canonical) return;
    try {
      await navigator.clipboard.writeText(canonical);
      setStatus(copy.copied);
    } catch {
      setStatus(copy.shareFailed);
    }
  };
  const share = async () => {
    if (!canonical || !title) return;
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({ title, url: canonical });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        setStatus(copy.shareFailed);
    }
  };
  return (
    <article className="website-catalogue-item" aria-labelledby="website-catalogue-item-title">
      <button
        type="button"
        onClick={() => {
          const state = window.history.state;
          if (
            state?.wrnCatalogueItemKind === kind &&
            state.wrnCatalogueItemId === item &&
            catalogueKinds.includes(state.wrnCatalogueOrigin)
          )
            window.history.back();
          else {
            window.history.replaceState({}, '', catalogueHref(kind, language));
            notifyNavigation();
          }
        }}
      >
        ← {ui.back}
      </button>
      <h2
        id="website-catalogue-item-title"
        ref={heading}
        tabIndex={-1}
        lang={title ? (titleLanguage ?? language) : language}
      >
        {title ?? ui.locallyUnavailable}
      </h2>
      {title ? children : <p role="status">{ui.messageUnavailable}</p>}
      {canonical ? (
        <div className="website-safe-links">
          <button type="button" onClick={() => void share()}>
            {ui.share}
          </button>
          <button type="button" onClick={() => void copyLink()}>
            {copy.copyLink}
          </button>
          <label>
            {copy.copyLink}
            <input
              aria-label={copy.copyLink}
              value={canonical}
              readOnly
              onFocus={(event) => event.target.select()}
            />
          </label>
        </div>
      ) : null}
      <p role="status">{status}</p>
    </article>
  );
}
