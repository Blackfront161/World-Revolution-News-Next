import { describe, expect, it } from 'vitest';

import { foundationContractVersion, isShellStateContract } from '@wrn/api-contracts';

import { validateLocalManifestIntegrity } from '@wrn/content-contracts';

import {
  createPinnedLocalNewsfeedFixture,
  createPinnedLocalDiscoverFixture,
  createPinnedLocalReaderDetailsFixture,
  createPinnedLocalWebsitePublicationFixture,
  createPinnedLocalArchiveLifecycleFixture,
  createPinnedLocalLegacyReadingMigrationFixture,
  createValidatedLocalReaderDetailsFixture,
  createValidatedLocalNewsfeedFixture,
  createLocalNewsfeedFixture,
  createShellStateFixture,
  localNewsArticlePayload,
  localNewsfeedSeedCommit,
  shellStateFixtures,
} from '../src/index.js';

describe('ShellState fixtures', () => {
  it('provides one deterministic, valid fixture per ShellState', () => {
    expect(Object.keys(shellStateFixtures)).toEqual(['ready', 'loading', 'error', 'offline']);

    for (const fixture of Object.values(shellStateFixtures)) {
      expect(fixture.contractVersion).toBe(foundationContractVersion);
      expect(isShellStateContract(fixture)).toBe(true);
      expect(Object.isFrozen(fixture)).toBe(true);
    }
  });

  it('creates detached fixture copies for test-specific mutation', () => {
    const fixture = createShellStateFixture('error');

    expect(fixture).toEqual(shellStateFixtures.error);
    expect(fixture).not.toBe(shellStateFixtures.error);
  });
});

describe('WRN-G3-002 local newsfeed fixture', () => {
  it('is self-authored, deterministic and validates with a supplied immutable seed checkpoint', async () => {
    const first = await createPinnedLocalNewsfeedFixture();
    const second = await createPinnedLocalNewsfeedFixture();
    const direct = await createLocalNewsfeedFixture({ sourceCommit: localNewsfeedSeedCommit });

    expect(first.manifest).toEqual(second.manifest);
    expect(first).toEqual(direct);
    expect(first.manifest.sourceCommit).toBe(localNewsfeedSeedCommit);
    expect(first.manifest.sourceCommit).toHaveLength(40);
    expect(first.manifest.revision).toBe(
      `wrn-g3-002-local-fixture-v1-${localNewsfeedSeedCommit.slice(0, 12)}`,
    );
    expect(first.manifest.provenance.fixtureSeedCommit).toBe(localNewsfeedSeedCommit);
    expect(first.manifest.articleSets.activeFeedIds).toEqual(first.manifest.articleSets.archiveIds);
    expect(first.states.ready).toMatchObject({
      kind: 'ready',
      articleIds: ['wrn-test-art-cedar', 'wrn-test-art-ember', 'wrn-test-art-fern'],
    });
    expect(Object.keys(first.states)).toEqual([
      'loading',
      'empty',
      'error',
      'offline',
      'optional-absent',
      'ready',
    ]);
    await expect(validateLocalManifestIntegrity(first)).resolves.toMatchObject({
      ok: true,
      errors: [],
    });
  });

  it('does not accept a branch label as a provenance seed', async () => {
    await expect(createLocalNewsfeedFixture({ sourceCommit: 'main' })).rejects.toThrow(
      'Fixture-Seed muss ein echter',
    );
  });

  it('fails closed before Ready when a persisted manifest integrity value is manipulated', async () => {
    const fixture = await createPinnedLocalNewsfeedFixture();
    const manipulatedManifest = {
      ...fixture.manifest,
      resources: fixture.manifest.resources.map((resource) =>
        resource.id === 'articles' && resource.availability !== 'optional-absent'
          ? { ...resource, sha256: '0'.repeat(64) }
          : resource,
      ),
    };

    await expect(
      createValidatedLocalNewsfeedFixture({
        manifest: manipulatedManifest,
        payloads: fixture.payloads,
      }),
    ).rejects.toThrow('Gepinnte lokale Fixture verletzt die Integritaet');
  });

  it('contains no media URL and retains explicit unknown values without invention', () => {
    expect(
      localNewsArticlePayload.articles.every((article) => article.originalUrl.includes('.invalid')),
    ).toBe(true);
    expect(
      localNewsArticlePayload.articles.every((article) =>
        article.rights.status.includes('no-third-party-media'),
      ),
    ).toBe(true);
  });
});

describe('WRN-G3-005 local discover fixture', () => {
  it('uses a separate valid index with exactly the pinned article IDs', async () => {
    const discover = await createPinnedLocalDiscoverFixture();
    expect(discover.index.revision).toBe('wrn-g3-005-local-discover-index-v1');
    expect(discover.index.entries.map((entry) => entry.articleId).sort()).toEqual(
      localNewsArticlePayload.articles.map((article) => article.id).sort(),
    );
  });
});

describe('WRN-G3-006 local reader details fixture', () => {
  it('uses self-authored hashed blocks with exactly the three pinned article IDs', async () => {
    const reader = await createPinnedLocalReaderDetailsFixture();

    expect(reader.details.revision).toBe('wrn-g3-006-local-reader-details-v2-long-cedar');
    expect(reader.details.entries.map((entry) => entry.articleId).sort()).toEqual(
      localNewsArticlePayload.articles.map((article) => article.id).sort(),
    );
    expect(
      reader.details.entries.flatMap((entry) => entry.blocks).every((block) => !('url' in block)),
    ).toBe(true);
  });

  it('keeps Cedar as a viewportunabhaengigen langen strukturierten Reader-Stresstest', async () => {
    const reader = await createPinnedLocalReaderDetailsFixture();
    const cedar = reader.details.entries.find((entry) => entry.articleId === 'wrn-test-art-cedar');

    expect(cedar).toBeDefined();
    if (cedar === undefined) {
      throw new Error('Cedar-Readerdetail fehlt trotz manifestgebundener Fixture.');
    }

    const characterCount = cedar.blocks.reduce(
      (total, block) => total + ('text' in block ? block.text.length : block.items.join('').length),
      0,
    );
    expect(characterCount).toBeGreaterThanOrEqual(5000);
    expect(cedar.blocks.length).toBeGreaterThanOrEqual(10);
    expect(new Set(cedar.blocks.map((block) => block.kind))).toEqual(
      new Set(['paragraph', 'heading', 'quote', 'list']),
    );
    expect(
      cedar.blocks.some((block) => block.kind === 'paragraph' && block.text.length >= 500),
    ).toBe(true);
  });

  it('rejects persisted details whose IDs no longer match the manifest-validated articles', async () => {
    const reader = await createPinnedLocalReaderDetailsFixture();
    await expect(
      createValidatedLocalReaderDetailsFixture(localNewsArticlePayload.articles, {
        ...reader.details,
        entries: reader.details.entries.slice(0, 2),
      }),
    ).rejects.toThrow('Persistierte WRN-G3-006-Readerdetails verletzen die Integritaet');
  });
});

describe('WRN-G3-007 local website publication fixture', () => {
  it('binds the existing three local articles and reader details without copying article content', async () => {
    const fixture = await createPinnedLocalWebsitePublicationFixture();

    expect(fixture.publication.revision).toBe('wrn-g3-007-local-website-publication-v1-d8ff4f1');
    expect(fixture.publication.landingIds).toEqual([
      'wrn-test-art-cedar',
      'wrn-test-art-ember',
      'wrn-test-art-fern',
    ]);
    expect(fixture.publication.sitemapArticleIds).toEqual(fixture.publication.landingIds);
    expect(fixture.manifest.articleSets.landingIds).toEqual(fixture.publication.landingIds);
    expect(Object.keys(fixture.publication)).not.toContain('articles');
    expect(Object.keys(fixture.publication)).not.toContain('details');
  });
});

describe('WRN-G3-008 local archive lifecycle fixture', () => {
  it('uses an isolated, self-authored and hash-bound archive fixture', async () => {
    const fixture = await createPinnedLocalArchiveLifecycleFixture();

    expect(fixture.lifecycle.revision).toBe('wrn-g3-008-local-archive-lifecycle-v1');
    expect(fixture.lifecycle.archiveArticleIds).toEqual(
      fixture.articles.map((article) => article.id).sort(),
    );
    expect(fixture.lifecycle.activeArticleIds).toEqual(['wrn-test-art-g3-008-active']);
    expect(fixture.lifecycle.aliases).toEqual([
      {
        sourceId: 'wrn-test-art-g3-008-old-historical',
        targetId: 'wrn-test-art-g3-008-historical',
      },
      {
        sourceId: 'wrn-test-art-g3-008-revoked',
        targetId: 'wrn-test-art-g3-008-historical',
      },
    ]);
    expect(fixture.lifecycle.gone).toEqual([
      { id: 'wrn-test-art-g3-008-gone', category: 'removed' },
    ]);
    expect(fixture.lifecycle.revocations.entries).toEqual([
      {
        id: 'wrn-test-art-g3-008-revoked',
        status: 'blocked',
        category: 'rights-or-safety',
      },
    ]);
    expect(
      [...fixture.lifecycle.gone, ...fixture.lifecycle.revocations.entries].some(
        (entry) => 'title' in entry,
      ),
    ).toBe(false);
  });

  it('rejects a persisted lifecycle that moves backwards behind a known revocation revision', async () => {
    await expect(createPinnedLocalArchiveLifecycleFixture(3)).rejects.toThrow(
      'niedrigere Revocationrevision',
    );
  });
});

describe('WRN-G3-011 payloadfreie Legacy-Migrationsfixture', () => {
  it('models only the three known key areas and never contains an article payload', () => {
    const fixture = createPinnedLocalLegacyReadingMigrationFixture();
    expect(Object.isFrozen(fixture.legacy)).toBe(true);
    expect(fixture.legacy.identityMap.map((entry) => entry.legacyKey)).toEqual([
      'legacy://wrn_bookmarks/old-historical',
      'legacy://wrn_read_list/unknown',
      'legacy://wrn_read_positions/active',
    ]);
    expect(JSON.stringify(fixture.legacy)).not.toMatch(/title|teaser|originalUrl|image|content/i);
  });
});
