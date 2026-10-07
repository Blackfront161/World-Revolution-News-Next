import links from './data/radio-original-links-v1.json';
import type { AppCatalogRecord } from './app-catalog';

/** A separate, source-bound addition; the frozen five-collection catalogue stays intact. */
export function radioCatalogueRows(rows: AppCatalogRecord[]): AppCatalogRecord[] {
  const ids = new Set(rows.map((row) => row.id));
  const urls = new Set(rows.map((row) => row.url));
  return [
    ...rows,
    ...links.records
      .filter((row) => !ids.has(row.id) && !urls.has(row.url))
      .map(({ id, title, source, url, language, publishedAt, country }) => ({
        id,
        title,
        source,
        url,
        language,
        publishedAt,
        country,
      })),
  ];
}

export function radioOriginalStream(row: AppCatalogRecord): string | null {
  const bound = links.records.find((entry) => entry.id === row.id && entry.url === row.url);
  return bound?.streamUrl ?? null;
}
