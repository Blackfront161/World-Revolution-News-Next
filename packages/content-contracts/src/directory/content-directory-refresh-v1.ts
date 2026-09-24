import type { MobileContentDirectory } from './mobile-content-directory-v1.js';

export const contentDirectoryRefreshSchema = 'wrn.content-directory-refresh.v1' as const;
export const contentDirectoryRefreshRepository =
  'https://github.com/Blackfront161/Revolution-News-Data' as const;

export type ContentDirectoryRefreshManifestV1 = Readonly<{
  schema: typeof contentDirectoryRefreshSchema;
  sequence: number;
  observedAt: string;
  artifactPath: string;
  artifactSha256: string;
  source: Readonly<{
    repository: typeof contentDirectoryRefreshRepository;
    commit: string;
    newsPath: 'news-feed.json';
    sourcesPath: 'sources-registry.json';
  }>;
}>;

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
  record(value) && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
const iso = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;

export function isContentDirectoryRefreshManifestV1(
  value: unknown,
): value is ContentDirectoryRefreshManifestV1 {
  if (
    !exact(value, [
      'schema',
      'sequence',
      'observedAt',
      'artifactPath',
      'artifactSha256',
      'source',
    ]) ||
    value.schema !== contentDirectoryRefreshSchema ||
    !Number.isSafeInteger(value.sequence) ||
    (value.sequence as number) < 1 ||
    !iso(value.observedAt) ||
    typeof value.artifactSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/u.test(value.artifactSha256) ||
    typeof value.artifactPath !== 'string' ||
    value.artifactPath !==
      `snapshots/directory-${String(value.sequence)}-${value.artifactSha256}.json` ||
    !exact(value.source, ['repository', 'commit', 'newsPath', 'sourcesPath'])
  )
    return false;
  return (
    value.source.repository === contentDirectoryRefreshRepository &&
    typeof value.source.commit === 'string' &&
    /^[a-f0-9]{40}$/u.test(value.source.commit) &&
    value.source.newsPath === 'news-feed.json' &&
    value.source.sourcesPath === 'sources-registry.json'
  );
}

export function isContentDirectoryRefreshBoundToDocument(
  manifest: ContentDirectoryRefreshManifestV1,
  document: MobileContentDirectory,
): boolean {
  if (
    document.sourceCommit !== manifest.source.commit ||
    document.observedAt !== manifest.observedAt
  )
    return false;
  const current = [
    ...document.articles.flatMap((article) => article.observations),
    ...document.sources.flatMap((source) => source.observations),
  ].filter((observation) => observation.provenance.dataset === 'github');
  if (current.length === 0) return false;
  const expectedPaths = new Set<string>([manifest.source.newsPath, manifest.source.sourcesPath]);
  const observedPaths = new Set<string>();
  const hashes = new Map<string, string>();
  for (const observation of current) {
    const provenance = observation.provenance;
    if (
      provenance.repo !== manifest.source.repository ||
      provenance.commit !== manifest.source.commit ||
      !expectedPaths.has(provenance.path)
    )
      return false;
    observedPaths.add(provenance.path);
    const previous = hashes.get(provenance.path);
    if (previous !== undefined && previous !== provenance.inputSHA256) return false;
    hashes.set(provenance.path, provenance.inputSHA256);
  }
  return [...expectedPaths].every((path) => observedPaths.has(path));
}
