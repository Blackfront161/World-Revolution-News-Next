import {
  createElement as h,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  LocalArticle,
  LocalReaderContentBlock,
  LocalReaderDetailEntryV1,
} from '@wrn/content-contracts';
import { formatUiCopy, type UiCopy } from '@wrn/ui-language';
import type {
  MobileReaderV2SnapshotIdentity,
  MobileReaderV2ValidatedDocument,
} from '@wrn/content-contracts/mobile-reader-v2';
import {
  mobileReaderV2TranslationResultIdentity,
  resolveMobileReaderV2LocalAsset,
  translateMobileReaderV2Section,
  type MobileReaderV2LocalTranslationAdapter,
  type MobileReaderV2TranslationResult,
} from './mobile-reader-v2';
import type { MobileReaderV2MediaSafetyLoad } from './mobile-reader-v2-media-safety';

type TranslationState = Readonly<{
  kind: 'disabled' | 'noop' | 'loading' | 'translated' | 'error' | 'offline' | 'stale' | 'aborted';
  text?: string;
  adapter?: string;
}>;
const initialTranslationState: TranslationState = Object.freeze({ kind: 'disabled' });
type ControllerScope = Readonly<{ id: symbol }>;
const controllerScopes = new WeakMap<ControllerScope, Map<string, AbortController>>();
function createControllerScope(): ControllerScope {
  const scope = Object.freeze({ id: Symbol('reader-v2-translation') });
  controllerScopes.set(scope, new Map());
  return scope;
}
function controllersFor(scope: ControllerScope): Map<string, AbortController> {
  const controllers = controllerScopes.get(scope);
  if (controllers === undefined) throw new Error('translation controller scope is unavailable');
  return controllers;
}

function serializeBlocks(blocks: readonly LocalReaderContentBlock[]): string {
  return blocks
    .map((block) =>
      block.kind === 'list'
        ? block.items.join('\n')
        : block.kind === 'quote' && block.attribution !== undefined
          ? `${block.text}\n${block.attribution}`
          : block.text,
    )
    .join('\n\n');
}
function renderBlock(block: LocalReaderContentBlock, key: string): ReactNode {
  if (block.kind === 'paragraph') return h('p', { key }, block.text);
  if (block.kind === 'heading') return h(block.level === 2 ? 'h2' : 'h3', { key }, block.text);
  if (block.kind === 'quote')
    return h(
      'blockquote',
      { key },
      h('p', null, block.text),
      block.attribution === undefined ? null : h('footer', null, block.attribution),
    );
  return h(
    block.style === 'ordered' ? 'ol' : 'ul',
    { key },
    block.items.map((item, index) => h('li', { key: `${key}:${index}` }, item)),
  );
}
function hasMatchingSnapshot(
  sidecar: MobileReaderV2ValidatedDocument | null,
  snapshot: MobileReaderV2SnapshotIdentity | null,
): sidecar is MobileReaderV2ValidatedDocument {
  return (
    sidecar !== null &&
    snapshot !== null &&
    sidecar.document.snapshot.releaseRevision === snapshot.releaseRevision &&
    sidecar.document.snapshot.manifestSha256 === snapshot.manifestSha256 &&
    sidecar.document.snapshot.readerDetailsRevision === snapshot.readerDetailsRevision &&
    sidecar.document.snapshot.readerDetailsWholeDocumentSha256 ===
      snapshot.readerDetailsWholeDocumentSha256 &&
    sidecar.document.snapshot.readerDetailsIntegritySha256 === snapshot.readerDetailsIntegritySha256
  );
}

export function MobileReaderV2Presentation({
  article,
  detail,
  sidecar,
  snapshot,
  targetLanguage,
  copy,
  isOffline,
  translationAdapter,
  mediaSafety,
}: {
  readonly article: LocalArticle;
  readonly detail: LocalReaderDetailEntryV1;
  readonly sidecar: MobileReaderV2ValidatedDocument | null;
  readonly snapshot: MobileReaderV2SnapshotIdentity | null;
  readonly targetLanguage: string;
  readonly copy: UiCopy;
  readonly isOffline: boolean;
  readonly translationAdapter: MobileReaderV2LocalTranslationAdapter | null;
  readonly mediaSafety: MobileReaderV2MediaSafetyLoad;
}) {
  const matchingSidecar = hasMatchingSnapshot(sidecar, snapshot) ? sidecar : null;
  const projection = matchingSidecar?.document.articles.find(
    (item) => item.articleId === article.id,
  );
  const valid = projection !== undefined && projection.projection !== 'rejected';
  const profile = valid
    ? matchingSidecar?.document.sources.find((item) => item.sourceId === article.source.id)
    : undefined;
  const [states, setStates] = useState<Readonly<Record<string, TranslationState>>>({});
  const [controllerScope] = useState(createControllerScope);
  const identity =
    snapshot === null
      ? ''
      : `${article.id}:${snapshot.releaseRevision}:${snapshot.manifestSha256}:${snapshot.readerDetailsRevision}:${snapshot.readerDetailsWholeDocumentSha256}:${snapshot.readerDetailsIntegritySha256}:${targetLanguage}`;
  useEffect(
    () => () => {
      const controllers = controllersFor(controllerScope);
      controllers.forEach((item) => item.abort());
      controllers.clear();
    },
    [controllerScope],
  );
  useEffect(() => {
    const controllers = controllersFor(controllerScope);
    controllers.forEach((item) => item.abort());
    controllers.clear();
    const timeout = window.setTimeout(() => setStates({}), 0);
    return () => window.clearTimeout(timeout);
  }, [controllerScope, identity]);
  const sections = useMemo(
    () =>
      !valid || projection === undefined
        ? null
        : projection.sections.map((section) => ({
            section,
            references: section.blockReferences.map((reference) => ({
              reference,
              blocks: detail.blocks.slice(reference.startIndex, reference.endIndex + 1),
            })),
          })),
    [detail.blocks, projection, valid],
  );
  const media = useMemo(() => {
    const result = new Map<string, ReturnType<typeof resolveMobileReaderV2LocalAsset>>();
    if (!valid || matchingSidecar === null) return result;
    matchingSidecar.document.media
      .filter((item) => item.articleId === article.id)
      .forEach((item) =>
        result.set(
          `${item.sectionId}:${item.blockId}`,
          resolveMobileReaderV2LocalAsset(item, mediaSafety),
        ),
      );
    return result;
  }, [article.id, matchingSidecar, mediaSafety, valid]);
  const translate = useCallback(
    (
      sectionId: string,
      blockId: string,
      sourceFragmentSha256: string,
      blocks: readonly LocalReaderContentBlock[],
    ) => {
      if (snapshot === null) return;
      const controllers = controllersFor(controllerScope);
      const key = `${identity}:${sectionId}:${blockId}:${sourceFragmentSha256}`;
      controllers.get(key)?.abort();
      const controller = new AbortController();
      controllers.set(key, controller);
      if (isOffline) {
        setStates((old) => ({ ...old, [key]: { kind: 'offline' } }));
        return;
      }
      setStates((old) => ({ ...old, [key]: { kind: 'loading' } }));
      const request = {
        snapshot,
        articleId: article.id,
        sectionId,
        sourceFragmentSha256,
        sourceLanguage: article.originalLanguage,
        targetLanguage,
        input: serializeBlocks(blocks),
      };
      void (async () => {
        const adapter = translationAdapter;
        const resultIdentity =
          adapter === null ? null : await mobileReaderV2TranslationResultIdentity(request, adapter);
        const result: MobileReaderV2TranslationResult = await translateMobileReaderV2Section(
          request,
          controller.signal,
          adapter,
          () => !controller.signal.aborted,
        );
        if (
          controller.signal.aborted ||
          controllers.get(key) !== controller ||
          (result.kind === 'translated' && (adapter === null || resultIdentity === null))
        )
          return;
        const next: TranslationState =
          result.kind === 'translated'
            ? {
                kind: 'translated',
                text: result.text,
                adapter: `${resultIdentity!.adapterId}/${resultIdentity!.adapterVersion}`,
              }
            : { kind: result.kind };
        setStates((old) => ({ ...old, [key]: next }));
        controllers.delete(key);
      })();
    },
    [
      article.id,
      article.originalLanguage,
      controllerScope,
      identity,
      isOffline,
      snapshot,
      targetLanguage,
      translationAdapter,
    ],
  );
  const readerContent =
    sections === null
      ? detail.blocks.map((block, index) => renderBlock(block, `v1:${index}`))
      : sections.map(({ section, references }) =>
          h(
            'section',
            {
              className: 'reader-v2-section',
              key: section.sectionId,
              'data-section-id': section.sectionId,
            },
            projection!.projection === 'ambiguous'
              ? h('p', { className: 'reader-v2-ambiguous', role: 'status' }, copy.readerV2Ambiguous)
              : null,
            references.map(({ reference, blocks }) => {
              const anchor = `${section.sectionId}:${reference.blockId}`;
              const resolved = media.get(anchor);
              const key = `${identity}:${section.sectionId}:${reference.blockId}:${reference.sourceFragmentSha256}`;
              const state = states[key] ?? initialTranslationState;
              const status =
                state.kind === 'disabled'
                  ? copy.readerV2TranslationDisabled
                  : state.kind === 'loading'
                    ? copy.readerV2TranslationLoading
                    : state.kind === 'offline'
                      ? copy.readerV2TranslationOffline
                      : state.kind === 'noop'
                        ? copy.readerV2TranslationNoop
                        : state.kind === 'error'
                          ? copy.readerV2TranslationError
                          : state.kind === 'stale' || state.kind === 'aborted'
                            ? copy.readerV2TranslationDiscarded
                            : state.kind === 'translated'
                              ? `${state.adapter}: ${state.text}`
                              : null;
              return h(
                'div',
                { className: 'reader-v2-reference', key, 'data-block-reference': key },
                section.predecessor?.beforeBlockId === reference.blockId
                  ? h(
                      'p',
                      { className: 'reader-v2-predecessor' },
                      formatUiCopy(copy.readerV2Predecessor, { label: section.predecessor.label }),
                    )
                  : null,
                resolved === undefined
                  ? null
                  : resolved === null
                    ? h(
                        'p',
                        { className: 'reader-v2-media-placeholder', role: 'status' },
                        copy.readerV2MediaUnavailable,
                      )
                    : h('img', {
                        src: resolved.path,
                        alt: resolved.altText,
                        width: resolved.width,
                        height: resolved.height,
                      }),
                blocks.map((block, offset) =>
                  renderBlock(
                    block,
                    `${section.sectionId}:${reference.blockId}:${reference.startIndex + offset}`,
                  ),
                ),
                h(
                  'div',
                  { className: 'reader-v2-translation' },
                  h(
                    'button',
                    {
                      type: 'button',
                      'aria-label': copy.readerV2TranslateBlock,
                      'aria-pressed': state.kind === 'translated',
                      disabled: state.kind === 'loading',
                      onClick: () =>
                        translate(
                          section.sectionId,
                          reference.blockId,
                          reference.sourceFragmentSha256,
                          blocks,
                        ),
                    },
                    copy.readerV2TranslateBlock,
                  ),
                  h('p', { role: 'status', 'aria-live': 'polite' }, status),
                ),
              );
            }),
          ),
        );
  return h(
    'div',
    null,
    h(
      'div',
      {
        className: 'reader-content',
        'data-reader-v2': valid ? projection!.projection : 'fallback',
      },
      readerContent,
    ),
    profile === undefined
      ? null
      : h(
          'details',
          { className: 'reader-v2-source-profile' },
          h('summary', null, copy.readerV2SourceProfile),
          h(
            'dl',
            null,
            h(
              'div',
              null,
              h('dt', null, copy.readerV2SelfDescription),
              h('dd', null, profile.selfDescription),
            ),
            h(
              'div',
              null,
              h('dt', null, copy.readerV2EditorialContext),
              h('dd', null, profile.editorialContext),
            ),
            h(
              'div',
              null,
              h('dt', null, copy.readerV2SourceType),
              h('dd', null, profile.sourceType),
            ),
            h(
              'div',
              null,
              h('dt', null, copy.readerV2Regions),
              h('dd', null, profile.regions.join(', ')),
            ),
            h(
              'div',
              null,
              h('dt', null, copy.readerV2Languages),
              h('dd', null, profile.languages.join(', ')),
            ),
            h(
              'div',
              null,
              h('dt', null, copy.readerV2Freshness),
              h('dd', null, profile.freshness.status),
            ),
            profile.correctionContact === null
              ? null
              : h(
                  'div',
                  null,
                  h('dt', null, profile.correctionContact.label),
                  h('dd', null, profile.correctionContact.value),
                ),
          ),
        ),
  );
}
