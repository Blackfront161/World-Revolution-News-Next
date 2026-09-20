import {
  createProductionArticleShareUrl,
  isProductionContentSafetyLedgerV1,
  resolveProductionContentArticle,
  type LocalPersonalizationStateV1,
  type ProductionArticleV1,
  type ProductionReaderBlockV2,
} from '@wrn/content-contracts';
import type { ProductionContentOfflineControllerResult } from './production-content-offline-controller';
import type { ProductionTranslationAuthority } from './production-translation';

export type ProductionArticleView =
  | Readonly<{ kind: 'unavailable'; reason: string }>
  | Readonly<{
      kind: 'ready';
      article: ProductionArticleV1;
      blocks: readonly ProductionReaderBlockV2[];
      shareUrl: string | null;
      redirected: boolean;
      translationAuthority?: ProductionTranslationAuthority | null;
    }>;

export function resolveProductionArticleView(
  result: ProductionContentOfflineControllerResult | null,
  requested: string,
): ProductionArticleView {
  if (
    result?.status !== 'active' ||
    result.runtime === null ||
    result.safety === null ||
    !isProductionContentSafetyLedgerV1(result.safety)
  )
    return { kind: 'unavailable', reason: 'needs-source-check' };
  const ready = result.runtime;
  if (
    result.safety.revision < ready.safetyLedger.revision ||
    ready.safetyLedger.revokedIds.some((id) => !result.safety!.revokedIds.includes(id))
  )
    return { kind: 'unavailable', reason: 'safety-conflict' };
  // The current ledger overlays the immutable Ready proof. Never rewrite its own ledger.
  if (result.safety.revokedIds.some((id) => id === requested))
    return { kind: 'unavailable', reason: 'revoked' };
  const resolved = resolveProductionContentArticle(ready, requested);
  if (!('canonicalId' in resolved)) return { kind: 'unavailable', reason: resolved.kind };
  if (result.safety.revokedIds.includes(resolved.canonicalId))
    return { kind: 'unavailable', reason: 'revoked' };
  const article = ready.documents.articles.articles.find(
    (value) => value.id === resolved.canonicalId,
  );
  const detail = ready.documents.readerDetails.entries.find(
    (value) => value.articleId === resolved.canonicalId,
  );
  if (!article || !detail) return { kind: 'unavailable', reason: 'unknown' };
  const admission = ready.documents.admission.entries.find(
    (entry) => entry.articleId === article.id,
  );
  return Object.freeze({
    kind: 'ready',
    article,
    blocks: detail.blocks,
    shareUrl: createProductionArticleShareUrl(
      ready,
      resolveProductionContentArticle(ready, resolved.canonicalId),
    ),
    redirected: resolved.kind === 'redirected',
    translationAuthority:
      admission && result.activeKey !== null && result.expiresAt !== null
        ? Object.freeze({
            releaseRevision: ready.descriptor.releaseRevision,
            manifestSha256: ready.manifestSha256,
            articleId: article.id,
            articleRevision: admission.admittedContentSha256,
            activeKey: result.activeKey,
            safetyRevision: result.safety.revision,
            expiresAt: result.expiresAt,
          })
        : null,
  });
}

export function listProductionArticles(
  result: ProductionContentOfflineControllerResult | null,
  archive = false,
): readonly ProductionArticleV1[] {
  if (result?.status !== 'active' || result.runtime === null) return [];
  const ids = archive
    ? result.runtime.documents.archiveLifecycle.archiveArticleIds
    : result.runtime.documents.archiveLifecycle.activeArticleIds;
  return result.runtime.documents.articles.articles
    .filter(
      (article) =>
        ids.includes(article.id) &&
        resolveProductionArticleView(result, article.id).kind === 'ready',
    )
    .sort(
      (left, right) =>
        right.publishedAt.localeCompare(left.publishedAt) || left.id.localeCompare(right.id),
    );
}

export function matchesProductionPreferences(
  article: ProductionArticleV1,
  result: ProductionContentOfflineControllerResult | null,
  preferences: LocalPersonalizationStateV1,
): boolean {
  return getProductionPreferenceMatches(article, result, preferences) !== null;
}

/** Filtering and its explanation share the same explicit local-choice matches. */
export function getProductionPreferenceMatches(
  article: ProductionArticleV1,
  result: ProductionContentOfflineControllerResult | null,
  preferences: LocalPersonalizationStateV1,
): Pick<LocalPersonalizationStateV1, 'interestIds' | 'regionIds' | 'contentLanguageIds'> | null {
  const entry = result?.runtime?.documents.discoverIndex.entries.find(
    (value) => value.articleId === article.id,
  );
  if (!entry) return null;
  const matches = {
    interestIds: preferences.interestIds.filter(
      (id) => entry.topics.includes(id) || article.tags.includes(id),
    ),
    regionIds: preferences.regionIds.filter((id) => id === entry.region),
    contentLanguageIds: preferences.contentLanguageIds.filter(
      (id) => id === article.originalLanguage,
    ),
  };
  return (preferences.interestIds.length === 0 || matches.interestIds.length > 0) &&
    (preferences.regionIds.length === 0 || matches.regionIds.length > 0) &&
    (preferences.contentLanguageIds.length === 0 || matches.contentLanguageIds.length > 0)
    ? matches
    : null;
}
