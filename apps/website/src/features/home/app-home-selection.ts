import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import type { WebsiteContentDirectory } from '../directory/directory-loader';
import layout from './app-home-layout-v1.json';
/** The App's actual Home selection, projected through the existing Website admission guard. */
export function selectAppHomeArticles(
  data: WebsiteContentDirectory,
  admitted: readonly DirectoryArticle[],
) {
  const current = admitted.filter((a) => !a.historical);
  const byId = new Map(current.map((a) => [a.id, a]));
  const pick = (ids: readonly string[]) =>
    ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  const bound = data.document.sourceCommit === layout.directoryCommit;
  const lead = bound && layout.lead ? (byId.get(layout.lead) ?? null) : null;
  return {
    lead,
    top: bound ? pick(layout.top) : [],
    sport: bound ? pick(layout.sport) : [],
    more: bound ? pick(layout.more) : [],
    briefing: bound ? pick(layout.briefing) : [],
    current,
  };
}
