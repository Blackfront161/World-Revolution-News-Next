import type { DirectorySource } from '@wrn/content-contracts/mobile-content-directory-v1';

/** Search only recorded source metadata; this does not change the destination or provenance. */
export function matchesDirectorySource(source: DirectorySource, query: string): boolean {
  const values = [
    source.name,
    source.url,
    ...source.languages,
    ...source.observations.flatMap((entry) => [
      entry.name,
      entry.homepage ?? '',
      ...entry.languages,
    ]),
  ];
  const needle = query.trim().toLowerCase();
  return values.join(' ').toLowerCase().includes(needle);
}

export type DirectorySourceFilters = Readonly<{
  query: string;
  language: string;
  region: string;
  country: string;
  topic: string;
  medium: string;
}>;

const same = (value: string | null, wanted: string) =>
  !wanted || value?.toLocaleLowerCase() === wanted.toLocaleLowerCase();

export function matchesDirectorySourceFilters(
  source: DirectorySource,
  filters: DirectorySourceFilters,
): boolean {
  return (
    matchesDirectorySource(source, filters.query) &&
    (!filters.language ||
      source.languages.includes(filters.language) ||
      source.observations.some((entry) => entry.languages.includes(filters.language))) &&
    (!filters.region ||
      source.observations.some((entry) => same(entry.originRegion, filters.region))) &&
    (!filters.country ||
      source.observations.some((entry) => same(entry.originCountry, filters.country))) &&
    (!filters.topic ||
      source.observations.some((entry) =>
        entry.topics.some(
          (topic) => topic.toLocaleLowerCase() === filters.topic.toLocaleLowerCase(),
        ),
      )) &&
    (!filters.medium ||
      same(source.mediaType, filters.medium) ||
      source.observations.some((entry) => same(entry.mediaType, filters.medium)))
  );
}

export function directorySourceFacets(sources: readonly DirectorySource[]) {
  const unique = (values: (string | null)[]) =>
    [...new Set(values.filter((value): value is string => Boolean(value)))].sort((left, right) =>
      left.localeCompare(right),
    );
  return {
    languages: unique(
      sources.flatMap((entry) => [
        ...entry.languages,
        ...entry.observations.flatMap((observation) => observation.languages),
      ]),
    ),
    regions: unique(
      sources.flatMap((entry) => entry.observations.map((item) => item.originRegion)),
    ),
    countries: unique(
      sources.flatMap((entry) => entry.observations.map((item) => item.originCountry)),
    ),
    topics: unique(sources.flatMap((entry) => entry.observations.flatMap((item) => item.topics))),
    media: unique(
      sources.flatMap((entry) => [
        entry.mediaType,
        ...entry.observations.map((item) => item.mediaType),
      ]),
    ),
  };
}
