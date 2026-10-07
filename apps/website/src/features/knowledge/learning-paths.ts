import type { WebsiteKnowledge } from './knowledge-loader';
import document from './data/learning-paths.json';
import type { AppCatalog } from '../events-media/app-catalog';

export function learningPodcastsForKnowledge(data: WebsiteKnowledge, catalog: AppCatalog | null) {
  if (!catalog) return [];
  const terms = new Map(data.projection.terms.map((term) => [term.id, term]));
  const episodes = new Map(catalog.collections.podcasts.map((episode) => [episode.url, episode]));
  return document.paths.map((path) => ({
    id: path.id,
    entries: path.podcastEntries.flatMap((entry) => {
      const episode = episodes.get(entry.originalUrl);
      const references = entry.termIds.map((id) => terms.get(id));
      return episode && references.length > 0 && references.every((term) => term !== undefined)
        ? [{ ...entry, episode, terms: references.filter((term) => term !== undefined) }]
        : [];
    }),
  }));
}

/** Resolve editorial relationships only against the currently validated catalogue. */
export function learningPathsForKnowledge(data: WebsiteKnowledge) {
  const books = new Map(data.projection.books.map((book) => [book.id, book]));
  const terms = new Map(data.projection.terms.map((term) => [term.id, term]));
  return document.paths
    .map((path) => ({
      ...path,
      entries: path.entries.flatMap((entry) => {
        const book = books.get(entry.bookId);
        const references = entry.termIds.map((id) => terms.get(id));
        return book &&
          references.every((term) => term !== undefined) &&
          [book.readUrl, ...Object.values(book.downloads)].includes(entry.originalUrl)
          ? [{ ...entry, book, terms: references.filter((term) => term !== undefined) }]
          : [];
      }),
    }))
    .filter((path) => path.entries.length > 0);
}
