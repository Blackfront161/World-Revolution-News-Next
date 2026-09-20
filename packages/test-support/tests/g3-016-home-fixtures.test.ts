import { describe, expect, it } from 'vitest';

import { canonicalJson, createValidatedLocalContentReleaseV1 } from '@wrn/content-contracts';
import { filterDiscoverArticles } from '@wrn/domain';
import mobileArchiveLifecycle from './fixtures/wrn-g3-016-public/archive-lifecycle.json' with { type: 'json' };
import mobileArticles from './fixtures/wrn-g3-016-public/articles.json' with { type: 'json' };
import mobileDiscoverIndex from './fixtures/wrn-g3-016-public/discover-index.json' with { type: 'json' };
import mobileDescriptor from './fixtures/wrn-g3-016-public/release-descriptor.json' with { type: 'json' };
import mobileManifest from './fixtures/wrn-g3-016-public/manifest.json' with { type: 'json' };
import mobileReaderDetails from './fixtures/wrn-g3-016-public/reader-details.json' with { type: 'json' };
import mobileSupplementalItems from './fixtures/wrn-g3-016-public/supplemental-items.json' with { type: 'json' };
import mobileWebsitePublication from './fixtures/wrn-g3-016-public/website-publication.json' with { type: 'json' };

import { createPinnedG3016MobileHomeFixture } from '../src/g3-016-home-fixtures.js';

describe('WRN-G3-016 mobile public release fixture', () => {
  it('keeps nine self-authored IDs atomically bound across all release documents', async () => {
    const fixture = await createPinnedG3016MobileHomeFixture();
    const ready = await createValidatedLocalContentReleaseV1(fixture.descriptor, fixture.documents);

    expect(ready.articleIds).toHaveLength(9);
    expect(ready.articleIds).toEqual(
      expect.arrayContaining(['wrn-test-art-cedar', 'wrn-test-art-ember', 'wrn-test-art-fern']),
    );
    expect(fixture.documents.manifest.homePresentation?.mainIds).toHaveLength(5);
  });

  it('keeps the three neutral sport role fixtures at the existing Discover filter target', async () => {
    const fixture = await createPinnedG3016MobileHomeFixture();
    const articles = fixture.documents.payloads.articles.articles;
    const discoverIndex = fixture.documents.discoverIndex;

    expect(
      filterDiscoverArticles(articles, discoverIndex, { topic: 'Sport' }).articles.map(
        (article) => article.id,
      ),
    ).toEqual(['wrn-test-art-g3-016-d', 'wrn-test-art-g3-016-e', 'wrn-test-art-g3-016-f']);
    for (const [topic, articleId] of [
      ['Fussball', 'wrn-test-art-g3-016-d'],
      ['Fankultur', 'wrn-test-art-g3-016-e'],
      ['Frauen', 'wrn-test-art-g3-016-f'],
    ] as const) {
      expect(
        filterDiscoverArticles(articles, discoverIndex, { topic }).articles.map(
          (article) => article.id,
        ),
      ).toEqual([articleId]);
    }
  });

  it('matches the seven mobile public documents and leaves supplemental items untouched', async () => {
    const fixture = await createPinnedG3016MobileHomeFixture();
    const documents = fixture.documents;
    expect(canonicalJson(mobileDescriptor)).toBe(canonicalJson(fixture.descriptor));
    expect(canonicalJson(mobileManifest)).toBe(canonicalJson(documents.manifest));
    expect(canonicalJson(mobileArticles)).toBe(canonicalJson(documents.payloads.articles));
    expect(canonicalJson(mobileDiscoverIndex)).toBe(canonicalJson(documents.discoverIndex));
    expect(canonicalJson(mobileReaderDetails)).toBe(canonicalJson(documents.readerDetails));
    expect(canonicalJson(mobileArchiveLifecycle)).toBe(canonicalJson(documents.archiveLifecycle));
    expect(canonicalJson(mobileWebsitePublication)).toBe(
      canonicalJson(documents.websitePublication),
    );
    expect(canonicalJson(mobileSupplementalItems)).toBe(canonicalJson({ items: [] }));
  });

  it('does not activate a manifest role change that lacks the pinned descriptor hash', async () => {
    const fixture = await createPinnedG3016MobileHomeFixture();
    const changed = {
      ...fixture.documents,
      manifest: {
        ...fixture.documents.manifest,
        homePresentation: {
          ...fixture.documents.manifest.homePresentation!,
          leadId: 'wrn-test-art-g3-016-a',
        },
      },
    };
    await expect(
      createValidatedLocalContentReleaseV1(fixture.descriptor, changed),
    ).rejects.toThrow();
  });
});
