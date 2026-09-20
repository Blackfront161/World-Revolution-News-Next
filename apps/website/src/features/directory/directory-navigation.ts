export const websiteDirectorySections = ['news', 'sources', 'sport'] as const;
export type WebsiteDirectorySection = (typeof websiteDirectorySections)[number];
export function readWebsiteDirectorySection(
  hash = window.location.hash,
): WebsiteDirectorySection | null {
  const match = /^#discover\/(news|sources|sport)$/u.exec(hash);
  return match ? (match[1] as WebsiteDirectorySection) : null;
}
