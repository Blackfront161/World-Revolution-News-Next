import { StrictMode } from 'react';
import { render, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { ProductionArticleV1 } from '@wrn/content-contracts';
import {
  projectMobileContentDirectory,
  type MobileContentDirectory,
} from '@wrn/content-contracts/mobile-content-directory-v1';
import { emptySourcePreferences } from '@wrn/domain';
import { AutomaticHomeCardText } from '../../../packages/browser-content/src/production-home-translation';
import { ProductionHome } from '../../../packages/browser-content/src/production-home';
import type { ProductionTranslationAdapter } from '../../../packages/browser-content/src/production-translation';
import directorySnapshot from './features/directory/data/content-directory-v1.json';

it('reserves seven first-minute requests for six reviewed cards even when directory loads first', async () => {
  const translate = vi.fn<ProductionTranslationAdapter['translate']>(async () => ({
    kind: 'unavailable',
  }));
  const translateDirectoryTitle = vi.fn<
    NonNullable<ProductionTranslationAdapter['translateDirectoryTitle']>
  >(async () => ({ kind: 'unavailable' }));
  const adapter: ProductionTranslationAdapter = {
    identity: { id: 'home-queue-test', version: '1', provider: 'test' },
    translate,
    translateDirectoryTitle,
  };
  const document = directorySnapshot as MobileContentDirectory;
  const loadDirectory = async () => ({
    document,
    projection: projectMobileContentDirectory(document),
  });
  const sourcePreferences = emptySourcePreferences();
  const renderCard = (article: ProductionArticleV1, role: 'lead' | 'main' | 'further') => (
    <AutomaticHomeCardText
      article={article}
      role={role === 'lead' ? 'lead' : 'main'}
      headingLevel={3}
      authority={{
        releaseRevision: 'test-release',
        manifestSha256: 'a'.repeat(64),
        articleId: article.id,
        articleRevision: 'b'.repeat(64),
        activeKey: 'test-active',
        safetyRevision: 1,
        expiresAt: Date.now() + 120_000,
      }}
      language="de"
      adapter={adapter}
    />
  );
  const ui = render(
    <StrictMode>
      <ProductionHome
        articles={[]}
        language="de"
        sourcePreferences={sourcePreferences}
        renderCard={renderCard}
        loadDirectory={loadDirectory}
        translationAdapter={adapter}
        contentReady={false}
        prioritizeCurrentLinks
      />
    </StrictMode>,
  );
  await waitFor(() => expect(translateDirectoryTitle).toHaveBeenCalledOnce());
  const cards = Array.from(
    { length: 6 },
    (_, index) =>
      ({
        id: `wrn-art-home-queue-${index}`,
        title: `Reviewed title ${index}`,
        teaser: `Lead teaser ${index}`,
        originalLanguage: 'en',
        publishedAt: `2026-09-${String(20 - index).padStart(2, '0')}T00:00:00.000Z`,
        tags: [],
        source: { id: `source-${index}`, name: `Source ${index}` },
      }) as unknown as ProductionArticleV1,
  );
  ui.rerender(
    <StrictMode>
      <ProductionHome
        articles={cards}
        language="de"
        sourcePreferences={sourcePreferences}
        renderCard={renderCard}
        loadDirectory={loadDirectory}
        translationAdapter={adapter}
        contentReady
        prioritizeCurrentLinks
      />
    </StrictMode>,
  );
  await waitFor(() => expect(translate).toHaveBeenCalledTimes(7));
  expect(translateDirectoryTitle).toHaveBeenCalledTimes(1);
  expect(translate.mock.calls.filter(([paragraph]) => paragraph.blockIndex === 1)).toHaveLength(1);
});
