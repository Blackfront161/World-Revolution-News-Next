import { describe, expect, it } from 'vitest';
import { createLocalPersonalizationState } from '@wrn/domain';
import {
  productionTestResult,
  testProductionId,
  testAliasId,
  testGoneId,
} from './production-content-test-data';
import {
  listProductionArticles,
  matchesProductionPreferences,
  resolveProductionArticleView,
} from './production-content-view';

describe('production article view authority', () => {
  it('resolves admitted canonical/alias routes and safe canonical share without altering Ready', async () => {
    const result = await productionTestResult();
    const before = JSON.stringify(result.runtime);
    const view = resolveProductionArticleView(result, testAliasId);
    expect(view.kind).toBe('ready');
    if (view.kind !== 'ready') throw new Error('Expected admitted article');
    expect(view.redirected).toBe(true);
    expect(view.article.id).toBe(testProductionId);
    expect(view.translationAuthority).toEqual({
      releaseRevision: result.runtime!.descriptor.releaseRevision,
      manifestSha256: result.runtime!.manifestSha256,
      articleId: testProductionId,
      articleRevision: result.runtime!.documents.admission.entries.find(
        (entry) => entry.articleId === testProductionId,
      )!.admittedContentSha256,
      activeKey: result.activeKey,
      safetyRevision: result.safety!.revision,
      expiresAt: result.expiresAt,
    });
    expect(view.blocks).toHaveLength(6);
    expect(view.shareUrl).toBe(`https://solinaridao.com/articles/${testProductionId}/`);
    expect(resolveProductionArticleView(result, testGoneId)).toEqual({
      kind: 'unavailable',
      reason: 'gone',
    });
    expect(
      resolveProductionArticleView(result, 'wrn-art-cccccccccccccccccccccccccccccccc').kind,
    ).toBe('unavailable');
    expect(JSON.stringify(result.runtime)).toBe(before);
  });
  it('a newer safety overlay blocks canonical and alias requests without changing immutable proof', async () => {
    const result = await productionTestResult();
    const before = JSON.stringify(result.runtime);
    for (const revokedId of [testProductionId, testAliasId] as const) {
      const revoked = { ...result, safety: { revision: 2, revokedIds: [revokedId] } };
      expect(resolveProductionArticleView(revoked, testAliasId)).toEqual({
        kind: 'unavailable',
        reason: 'revoked',
      });
    }
    expect(
      listProductionArticles({
        ...result,
        safety: { revision: 2, revokedIds: [testProductionId] },
      }).some((article) => article.id === testProductionId),
    ).toBe(false);
    expect(JSON.stringify(result.runtime)).toBe(before);
    expect(
      resolveProductionArticleView({ ...result, status: 'needs-source-check' }, testProductionId)
        .kind,
    ).toBe('unavailable');
  });
  it('matches only actual production topics, regions and original languages', async () => {
    const result = await productionTestResult();
    const article = listProductionArticles(result)[0]!;
    const preferences = createLocalPersonalizationState({
      interestIds: [],
      regionIds: ['global'],
      contentLanguageIds: ['en'],
    })!;
    expect(matchesProductionPreferences(article, result, preferences)).toBe(true);
    expect(
      matchesProductionPreferences(article, result, { ...preferences, contentLanguageIds: ['de'] }),
    ).toBe(false);
  });
});
