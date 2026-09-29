import { act, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { ProductionArticleV1 } from '@wrn/content-contracts';
import type {
  ProductionTranslationAdapter,
  ProductionTranslationAuthority,
  ProductionTranslationOutcome,
} from '../../../packages/browser-content/src/production-translation';
import { AutomaticHomeCardText } from '../../../packages/browser-content/src/production-home-translation';

const article = {
  id: 'wrn-art-home-translation-test',
  title: 'Original headline',
  teaser: 'Original teaser',
  originalLanguage: 'en',
} as unknown as ProductionArticleV1;
const authority = {
  releaseRevision: 'reviewed-release',
  manifestSha256: 'a'.repeat(64),
  articleId: article.id,
  articleRevision: 'b'.repeat(64),
  activeKey: 'active',
  safetyRevision: 1,
  expiresAt: Date.now() + 60_000,
} satisfies ProductionTranslationAuthority;
const identity = { id: 'fixture', version: '1', provider: 'fixture-provider' };
const translated = (text: string): ProductionTranslationOutcome =>
  ({
    kind: 'translated',
    identity: 'fixture',
    response: {
      translation: { text },
      adapter: identity,
      cache: { expiresAt: new Date(Date.now() + 30_000).toISOString() },
    },
  }) as ProductionTranslationOutcome;

it('translates a reviewed home headline automatically and keeps the original available', async () => {
  const translate = vi.fn<ProductionTranslationAdapter['translate']>(async () =>
    translated('Übersetzte Schlagzeile'),
  );
  const adapter: ProductionTranslationAdapter = { identity, translate };
  render(
    <AutomaticHomeCardText
      article={article}
      role="main"
      headingLevel={3}
      authority={authority}
      language="de"
      adapter={adapter}
    />,
  );
  expect(await screen.findByRole('heading', { name: 'Übersetzte Schlagzeile' })).toBeVisible();
  expect(screen.getByText(/Maschinelle Übersetzung/)).toBeVisible();
  expect(screen.getByText('Original headline')).toBeInTheDocument();
  expect(translate).toHaveBeenCalledTimes(1);
  expect(translate.mock.calls[0]![0]).toMatchObject({
    route: 'home',
    blockIndex: 0,
    text: 'Original headline',
    sourceLanguage: 'en',
    targetLanguage: 'de',
  });
  expect(screen.queryByText(/derzeit nicht verfügbar/)).toBeNull();
});

it('discards an obsolete language result and marks a failed request as original', async () => {
  const switchingArticle = { ...article, id: 'wrn-art-home-translation-switch' as const };
  const switchingAuthority = { ...authority, articleId: switchingArticle.id };
  let finishGerman!: (outcome: ProductionTranslationOutcome) => void;
  const translate = vi.fn((paragraph: { targetLanguage: string }) =>
    paragraph.targetLanguage === 'de'
      ? new Promise<ProductionTranslationOutcome>((resolve) => {
          finishGerman = resolve;
        })
      : Promise.resolve<ProductionTranslationOutcome>({ kind: 'error' }),
  );
  const adapter = { identity, translate } as ProductionTranslationAdapter;
  const ui = render(
    <AutomaticHomeCardText
      article={switchingArticle}
      role="main"
      headingLevel={3}
      authority={switchingAuthority}
      language="de"
      adapter={adapter}
    />,
  );
  await waitFor(() => expect(translate).toHaveBeenCalledTimes(1));
  ui.rerender(
    <AutomaticHomeCardText
      article={switchingArticle}
      role="main"
      headingLevel={3}
      authority={switchingAuthority}
      language="es"
      adapter={adapter}
    />,
  );
  expect(await screen.findByText(/La traducción no está disponible/)).toBeVisible();
  await act(async () => finishGerman(translated('Alte Übersetzung')));
  expect(screen.getByRole('heading', { name: 'Original headline' })).toBeVisible();
  expect(screen.queryByText('Alte Übersetzung')).toBeNull();
  expect(screen.queryByText(/Traducción automática/)).toBeNull();
});

it('translates the visible lead on first mount and requests the new UI language after switching', async () => {
  const lead = { ...article, id: 'wrn-art-home-translation-lead' as const };
  const leadAuthority = { ...authority, articleId: lead.id };
  const translate = vi.fn<ProductionTranslationAdapter['translate']>(async (paragraph) =>
    translated(`${paragraph.targetLanguage}:${paragraph.blockIndex}`),
  );
  const adapter: ProductionTranslationAdapter = { identity, translate };
  const ui = render(
    <AutomaticHomeCardText
      article={lead}
      role="lead"
      headingLevel={3}
      authority={leadAuthority}
      language="de"
      adapter={adapter}
    />,
  );
  expect(await screen.findByRole('heading', { name: 'de:0' })).toBeVisible();
  expect(await screen.findByText('de:1')).toBeVisible();
  expect(translate.mock.calls.map(([paragraph]) => paragraph.text)).toEqual([
    lead.title,
    lead.teaser,
  ]);
  ui.rerender(
    <AutomaticHomeCardText
      article={lead}
      role="lead"
      headingLevel={3}
      authority={leadAuthority}
      language="es"
      adapter={adapter}
    />,
  );
  expect(await screen.findByRole('heading', { name: 'es:0' })).toBeVisible();
  expect(await screen.findByText('es:1')).toBeVisible();
  expect(screen.queryByText('de:0')).toBeNull();
  expect(translate.mock.calls.map(([paragraph]) => paragraph.targetLanguage)).toEqual([
    'de',
    'de',
    'es',
    'es',
  ]);
});

it.each(['und', 'EN'])(
  'keeps an unverified source language %s local without a translation request',
  async (originalLanguage) => {
    const unknown = {
      ...article,
      id: `wrn-art-home-translation-${originalLanguage}` as const,
      originalLanguage,
    };
    const translate = vi.fn<ProductionTranslationAdapter['translate']>();
    render(
      <AutomaticHomeCardText
        article={unknown}
        role="main"
        headingLevel={3}
        authority={{ ...authority, articleId: unknown.id }}
        language="de"
        adapter={{ identity, translate }}
      />,
    );
    await act(async () => undefined);
    expect(screen.getByRole('heading', { name: article.title })).toBeVisible();
    expect(translate).not.toHaveBeenCalled();
  },
);

it('does not translate a title with authority for another article', async () => {
  const translate = vi.fn<ProductionTranslationAdapter['translate']>();
  render(
    <AutomaticHomeCardText
      article={article}
      role="main"
      headingLevel={3}
      authority={{ ...authority, articleId: 'another-article' }}
      language="de"
      adapter={{ identity, translate }}
    />,
  );
  await act(async () => undefined);
  expect(screen.getByRole('heading', { name: article.title })).toBeVisible();
  expect(translate).not.toHaveBeenCalled();
});

it('shows the original without a configured translation adapter', () => {
  render(
    <AutomaticHomeCardText
      article={article}
      role="main"
      headingLevel={3}
      authority={authority}
      language="de"
      adapter={null}
    />,
  );
  expect(screen.getByRole('heading', { name: 'Original headline' })).toBeVisible();
  expect(screen.queryByText(/Maschinelle Übersetzung/)).toBeNull();
});
