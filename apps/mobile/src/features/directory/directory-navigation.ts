export const mobileDirectorySections = ['news', 'sources', 'sport'] as const;
export type MobileDirectorySection = (typeof mobileDirectorySections)[number];

export function parseMobileDirectorySection(hash: string): MobileDirectorySection | null {
  const match = /^#discover\/(news|sources|sport)$/u.exec(hash);
  return match === null ? null : (match[1] as MobileDirectorySection);
}
