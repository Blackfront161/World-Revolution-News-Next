import { useEffect, useRef, useState } from 'react';
import { formatUiCopy, type UiLanguage } from '@wrn/ui-language';
import { getProductionTranslationCopy } from '@wrn/ui-language/production-translation';
import {
  productionTranslationRenderKey,
  type ProductionTranslationAdapter,
  type ProductionTranslationAuthority,
  type ProductionTranslationOutcome,
} from './production-translation';
import {
  decodeProductionReaderImageBytesV2,
  type ProductionReaderBlockV2,
  type ProductionReaderImageBlockV2,
} from '@wrn/content-contracts';

type OpenEvidence = (url: string, trigger: HTMLButtonElement) => void;

export type ProductionReaderTranslation = Readonly<{
  authority: ProductionTranslationAuthority;
  route: string;
  sourceLanguage: string;
  language: UiLanguage;
  adapter: ProductionTranslationAdapter | null;
}>;

function TranslatableParagraph({
  text,
  index,
  context,
}: {
  text: string;
  index: number;
  context: ProductionReaderTranslation;
}) {
  const copy = getProductionTranslationCopy(context.language);
  const paragraph = {
    ...context.authority,
    route: context.route,
    blockIndex: index,
    text,
    sourceLanguage: context.sourceLanguage,
    targetLanguage: context.language,
  };
  const key = `${productionTranslationRenderKey(paragraph)}:${JSON.stringify(context.adapter?.identity)}`;
  const current = useRef(key);
  current.current = key;
  const pending = useRef<AbortController | null>(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [state, setState] = useState<{
    key: string;
    outcome: ProductionTranslationOutcome | { kind: 'loading' };
  } | null>(null);
  useEffect(() => {
    const offline = () => {
      pending.current?.abort();
      setOnline(false);
      setState(null);
    };
    const connected = () => setOnline(true);
    window.addEventListener('offline', offline);
    window.addEventListener('online', connected);
    return () => {
      pending.current?.abort();
      window.removeEventListener('offline', offline);
      window.removeEventListener('online', connected);
    };
  }, []);
  useEffect(
    () => () => {
      pending.current?.abort();
    },
    [key],
  );
  const outcome = state?.key === key ? state.outcome : null;
  const resultExpiry =
    outcome?.kind === 'translated' ? Date.parse(outcome.response.cache.expiresAt) : Infinity;
  useEffect(() => {
    const timer = setTimeout(
      () => {
        pending.current?.abort();
        setState({ key, outcome: { kind: 'discarded' } });
      },
      Math.max(0, Math.min(context.authority.expiresAt + 1, resultExpiry) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [key, context.authority.expiresAt, resultExpiry]);
  const usable = Date.now() <= context.authority.expiresAt && Date.now() < resultExpiry;
  const sameLanguage = context.sourceLanguage === context.language;
  const start = async () => {
    const adapter = context.adapter;
    if (!adapter || !online || sameLanguage || !usable) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const isCurrent = () =>
      current.current === key &&
      !controller.signal.aborted &&
      navigator.onLine &&
      Date.now() <= paragraph.expiresAt;
    setState({ key, outcome: { kind: 'loading' } });
    let next: ProductionTranslationOutcome;
    try {
      next = await adapter.translate(paragraph, controller.signal, isCurrent);
    } catch {
      next = { kind: 'error' };
    }
    if (!isCurrent() || pending.current !== controller) return;
    if (next.kind === 'translated' && Date.parse(next.response.cache.expiresAt) <= Date.now())
      next = { kind: 'discarded' };
    setState({ key, outcome: next });
  };
  const status = !online
    ? 'offline'
    : !usable
      ? 'discarded'
      : sameLanguage
        ? 'sameLanguage'
        : outcome?.kind;
  return (
    <div className="production-translatable-paragraph">
      <p lang={context.sourceLanguage}>{text}</p>
      {context.adapter && (
        <div className="production-translation" lang={context.language}>
          <button
            type="button"
            data-translation-action
            disabled={!online || sameLanguage || !usable || status === 'loading'}
            onClick={() => void start()}
          >
            {outcome && outcome.kind !== 'loading' ? copy.retry : copy.action}
          </button>
          <div role="status" aria-live="polite">
            {status && status !== 'translated' && <p>{copy[status]}</p>}
            {status === 'translated' && outcome?.kind === 'translated' && (
              <div data-translation-result data-cache-status={outcome.response.cache.status}>
                <p className="production-translation-label">
                  {formatUiCopy(copy.translatedLabel, { language: context.language })}
                </p>
                <p lang={context.language}>{outcome.response.translation.text}</p>
                <p className="production-translation-provenance">
                  {formatUiCopy(copy.provenance, { provider: outcome.response.adapter.provider })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Receives only blocks from an admitted Ready release; never loads sourceUrl. */
function ProductionReaderImage({
  block,
  onExternal,
}: {
  block: ProductionReaderImageBlockV2;
  onExternal?: OpenEvidence | undefined;
}) {
  const [rendered, setRendered] = useState<{
    block: ProductionReaderImageBlockV2;
    url: string;
  } | null>(null);
  const [failed, setFailed] = useState<ProductionReaderImageBlockV2 | null>(null);
  useEffect(() => {
    const bytes = decodeProductionReaderImageBytesV2(block.base64);
    if (bytes === null) return;
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: block.mime }));
    setRendered({ block, url });
    return () => URL.revokeObjectURL(url);
  }, [block]);
  const url = rendered?.block === block && failed !== block ? rendered.url : null;
  return (
    <figure className="production-reader-image">
      {url === null ? (
        <p role="img" aria-label={block.altText} lang={block.altLanguage}>
          {block.altText}
        </p>
      ) : (
        <img
          src={url}
          alt={block.altText}
          lang={block.altLanguage}
          width={block.width}
          height={block.height}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => {
            URL.revokeObjectURL(url);
            setFailed(block);
          }}
        />
      )}
      <figcaption>
        {block.attribution} ·{' '}
        {onExternal ? (
          <button
            id={`production-image-license-${block.mediaId}`}
            type="button"
            aria-label={`${block.attribution} · ${block.licenseId}`}
            onClick={(event) => onExternal(block.licenseUrl, event.currentTarget)}
          >
            {block.licenseId}
          </button>
        ) : (
          block.licenseId
        )}
      </figcaption>
    </figure>
  );
}

/** Main and archive readers share the versioned, admitted content renderer. */
export function ProductionReaderBlocks({
  blocks,
  onExternal,
  translation,
}: {
  blocks: readonly ProductionReaderBlockV2[];
  onExternal?: OpenEvidence;
  translation?: ProductionReaderTranslation | undefined;
}) {
  return (
    <>
      {translation && (
        <p className="production-translation-disclosure" lang={translation.language}>
          {
            getProductionTranslationCopy(translation.language)[
              translation.adapter ? 'disclosure' : 'unavailable'
            ]
          }
        </p>
      )}
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'image':
            return (
              <ProductionReaderImage key={block.mediaId} block={block} onExternal={onExternal} />
            );
          case 'paragraph':
            return translation ? (
              <TranslatableParagraph
                key={index}
                text={block.text}
                index={index}
                context={translation}
              />
            ) : (
              <p key={index}>{block.text}</p>
            );
          case 'heading':
            return block.level === 2 ? (
              <h2 key={index}>{block.text}</h2>
            ) : (
              <h3 key={index}>{block.text}</h3>
            );
          case 'quote':
            return (
              <figure key={index}>
                <blockquote>
                  <p>{block.text}</p>
                </blockquote>
                {block.attribution && <figcaption>{block.attribution}</figcaption>}
              </figure>
            );
          case 'list': {
            const List = block.style === 'ordered' ? 'ol' : 'ul';
            return (
              <List key={index}>
                {block.items.map((item, position) => (
                  <li key={position}>{item}</li>
                ))}
              </List>
            );
          }
        }
      })}
    </>
  );
}
