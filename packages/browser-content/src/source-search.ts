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
