/** Pure, shared primitives for the additive production content release. */
export const productionContentMaxArticles = 3 as const;
export const productionContentMaxResourceBytes = 512 * 1024;
export const productionContentMaxBundleBytes = 4 * 1024 * 1024;

const productionArticleIdPattern = /^wrn-art-[a-f0-9]{32}$/;
const sha256Pattern = /^[a-f0-9]{64}$/;
const utcTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function isProductionArticleIdV1(value: unknown): value is `wrn-art-${string}` {
  return typeof value === 'string' && productionArticleIdPattern.test(value);
}

export function isProductionSha256(value: unknown): value is string {
  return typeof value === 'string' && sha256Pattern.test(value);
}

export function isProductionUtcTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    utcTimestampPattern.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

export function isPlainProductionRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function hasExactProductionKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

export function isSafeProductionHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.username === '' &&
      url.password === '' &&
      url.hostname !== '' &&
      url.hostname !== 'localhost' &&
      !url.hostname.endsWith('.localhost') &&
      !url.hostname.endsWith('.local') &&
      !url.hostname.endsWith('.internal') &&
      url.hostname !== 'home.arpa' &&
      !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(url.hostname) &&
      !url.hostname.includes(':') &&
      url.href === value
    );
  } catch {
    return false;
  }
}

export function isSafeProductionReaderText(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 64 * 1024 &&
    value === value.trim() &&
    !/[<>]/.test(value) &&
    !/\bhttps?:\/\//iu.test(value) &&
    !/\bwww\./iu.test(value) &&
    !/\[[^\]]+\]\([^)]*\)/u.test(value)
  );
}

export function isSortedUniqueStrings(
  values: unknown,
  predicate: (value: string) => boolean,
): values is readonly string[] {
  return (
    Array.isArray(values) &&
    values.every((value) => typeof value === 'string' && predicate(value)) &&
    values.every((value, index) => index === 0 || values[index - 1]! < value)
  );
}

export function sameSortedProductionIds(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
