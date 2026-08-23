import { describe, expect, it } from 'vitest';

import { foundationContractVersion, isShellStateContract } from '@wrn/api-contracts';

import { validateLocalManifestIntegrity } from '@wrn/content-contracts';

import {
  createLocalNewsfeedFixture,
  createShellStateFixture,
  localNewsArticlePayload,
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
  const seed = { sourceCommit: '0123456789abcdef0123456789abcdef01234567' };

  it('is self-authored, deterministic and validates with a supplied immutable seed checkpoint', async () => {
    const first = await createLocalNewsfeedFixture(seed);
    const second = await createLocalNewsfeedFixture(seed);

    expect(first.manifest).toEqual(second.manifest);
    expect(first.manifest.sourceCommit).toBe(seed.sourceCommit);
    expect(first.manifest.provenance.fixtureSeedCommit).toBe(seed.sourceCommit);
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
