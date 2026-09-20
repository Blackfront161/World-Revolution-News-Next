import type {
  ProductionEventsMediaDocumentV1,
  ProductionEventsMediaEpisodeV1,
  ProductionEventsMediaEventV1,
  ProductionEventsMediaPodcastSourceV1,
  ProductionEventsMediaVideoV1,
} from '@wrn/content-contracts/production-events-media-v1';

export const productionEventsMediaPageSize = 30;
export type EventsMediaMode = 'events' | 'media';
export type EventDateScope = 'all' | 'past' | 'upcoming';
export type MediaSection = 'videos' | 'episodes' | 'sources';

export type EventFilters = Readonly<{
  query: string;
  language: string;
  country: string;
  city: string;
  from: string;
  to: string;
  scope: EventDateScope;
}>;
export type MediaFilters = Readonly<{
  query: string;
  language: string;
  sourceId: string;
}>;

export const emptyEventFilters: EventFilters = Object.freeze({
  query: '',
  language: '',
  country: '',
  city: '',
  from: '',
  to: '',
  scope: 'all',
});
export const emptyMediaFilters: MediaFilters = Object.freeze({
  query: '',
  language: '',
  sourceId: '',
});

function text(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}
function matches(query: string, values: readonly (string | null)[]) {
  const needle = text(query.trim());
  return (
    needle.length === 0 || values.some((value) => value !== null && text(value).includes(needle))
  );
}
function day(value: string) {
  return value.slice(0, 10);
}

export function filterProductionEvents(
  events: readonly ProductionEventsMediaEventV1[],
  filters: EventFilters,
  now = new Date().toISOString(),
) {
  return events
    .filter((event) => {
      const date = day(event.startAt);
      return (
        matches(filters.query, [event.title, event.sourceName, event.country, event.city]) &&
        (!filters.language || event.language === filters.language) &&
        (!filters.country || event.country === filters.country) &&
        (!filters.city || event.city === filters.city) &&
        (!filters.from || date >= filters.from) &&
        (!filters.to || date <= filters.to) &&
        (filters.scope === 'all' ||
          (filters.scope === 'past' ? event.startAt < now : event.startAt >= now))
      );
    })
    .toSorted((left, right) =>
      filters.scope === 'upcoming'
        ? left.startAt.localeCompare(right.startAt)
        : right.startAt.localeCompare(left.startAt),
    );
}
export function filterProductionMedia<
  T extends
    | ProductionEventsMediaVideoV1
    | ProductionEventsMediaEpisodeV1
    | ProductionEventsMediaPodcastSourceV1,
>(records: readonly T[], filters: MediaFilters) {
  const title = (record: T) => ('title' in record ? record.title : record.name);
  const sourceName = (record: T) => ('sourceName' in record ? record.sourceName : record.name);
  return records
    .filter(
      (record) =>
        matches(filters.query, [title(record), sourceName(record)]) &&
        (!filters.language || record.language === filters.language) &&
        (!filters.sourceId ||
          ('observations' in record
            ? record.observations.some((observation) => observation.sourceId === filters.sourceId)
            : 'sourceId' in record
              ? record.sourceId === filters.sourceId
              : record.legacyId === filters.sourceId)),
    )
    .toSorted((left, right) => {
      const leftDate = 'publishedAt' in left ? left.publishedAt : '';
      const rightDate = 'publishedAt' in right ? right.publishedAt : '';
      return rightDate.localeCompare(leftDate) || title(left).localeCompare(title(right));
    });
}
export function pageProductionEventsMedia<T>(records: readonly T[], shown: number) {
  return records.slice(0, Math.max(productionEventsMediaPageSize, shown));
}
export function productionEventsMediaLanguages(document: ProductionEventsMediaDocumentV1) {
  return [
    ...new Set(
      [...document.events, ...document.videos, ...document.episodes, ...document.sources].map(
        (item) => item.language,
      ),
    ),
  ].toSorted();
}
