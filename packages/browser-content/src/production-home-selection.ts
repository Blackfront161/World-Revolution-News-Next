import type { ProductionArticleV1 } from '@wrn/content-contracts';

export type ProductionHomeSelection = Readonly<{
  lead: ProductionArticleV1 | null;
  main: readonly ProductionArticleV1[];
  further: readonly ProductionArticleV1[];
}>;

/**
 * Applies the Home presentation policy to an already validated, ordered and
 * source-projected list. It deliberately does not infer editorial priorities.
 */
export function selectProductionHomeArticles(
  articles: readonly ProductionArticleV1[],
): ProductionHomeSelection {
  const unique: ProductionArticleV1[] = [];
  const ids = new Set<string>();
  for (const article of articles) {
    if (ids.has(article.id)) continue;
    ids.add(article.id);
    unique.push(article);
  }
  return Object.freeze({
    lead: unique[0] ?? null,
    main: Object.freeze(unique.slice(1, 6)),
    further: Object.freeze(unique.slice(6)),
  });
}
