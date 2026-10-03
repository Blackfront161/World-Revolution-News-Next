import raw from './data/prisoner-review-v1.json';

export type PrisonerReviewProfile = Readonly<{
  id: string;
  status: 'dated-address-match' | 'needs-review';
  verifiedAt: string;
  nextReviewAt: string;
  profileUrl: string;
  sourceIds: readonly string[];
  evidence: null | Readonly<{
    sourcePublishedAt: string;
    pdfPage: number;
    contentSha256: string;
    announcementEdition: '19.8';
    pdfEdition: '19.9';
  }>;
}>;
export type PrisonerReviewState = 'dated-address-match' | 'needs-review' | 'expired';
const exact = (value: unknown, keys: string[]): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => key in value);
const plain = (v: unknown): v is string =>
  typeof v === 'string' &&
  v.length > 0 &&
  v.length <= 500 &&
  v.trim() === v &&
  !/[\u0000-\u001f\u007f<>]/u.test(v);
const id = (v: unknown): v is string => plain(v) && /^[a-z0-9][a-z0-9-]{0,159}$/u.test(v);
const https = (v: unknown): v is string => {
  if (!plain(v)) return false;
  try {
    const u = new URL(v);
    return (
      u.href === v &&
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      !u.hash &&
      !u.search &&
      /^[a-z][a-z0-9.-]+\.[a-z]+$/u.test(u.hostname) &&
      !u.hostname.endsWith('.local') &&
      !u.hostname.endsWith('.internal')
    );
  } catch {
    return false;
  }
};
const supportOriginals: Record<string, string> = {
  'nyc-books-through-bars': 'https://www.booksthroughbarsnyc.org/',
  'water-protector-legal-collective': 'https://www.waterprotectorlegal.org/',
  'jericho-movement': 'https://www.thejerichomovement.com/',
  'prison-radio-support': 'https://www.prisonradio.org/',
  'prisoner-solidarity-directory': 'https://www.prisonersolidarity.com/',
};
export const validPrisonerReviewDate = (v: unknown): v is string => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(v)) return false;
  const [year, month, day] = v.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!)).toISOString().slice(0, 10) === v;
};
export function validateWebsitePrisonerReview(value: unknown): boolean {
  if (
    !exact(value, [
      'schema',
      'appCommit',
      'appEvidenceCommit',
      'appInputSha256',
      'observedAt',
      'rights',
      'links',
      'profiles',
    ]) ||
    value.schema !== 'wrn.website-prisoner-review.v1' ||
    value.appCommit !== '8c0c0d90a119b7a95b5154fa64c49dfb97c8842e' ||
    value.appEvidenceCommit !== '1a87a404e56d884fdc1924557b7a2cf9690bfcb0' ||
    value.appInputSha256 !== 'a4cde7bbac10cb62826fed1222c8c7d20b787e105ad553d63299b309530a477c' ||
    value.rights !== 'public-directory-metadata' ||
    typeof value.observedAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/u.test(value.observedAt) ||
    !Number.isFinite(Date.parse(value.observedAt)) ||
    !Array.isArray(value.links) ||
    value.links.length !== 5 ||
    !Array.isArray(value.profiles) ||
    value.profiles.length !== 30
  )
    return false;
  if (
    !value.links.every(
      (s) =>
        exact(s, ['id', 'name', 'url', 'kind', 'checkedAt']) &&
        id(s.id) &&
        plain(s.name) &&
        https(s.url) &&
        supportOriginals[s.id] === s.url &&
        plain(s.kind) &&
        validPrisonerReviewDate(s.checkedAt),
    ) ||
    new Set(value.links.map((s) => s.id)).size !== 5 ||
    new Set(value.links.map((s) => s.url)).size !== 5
  )
    return false;
  if (
    !value.profiles.every((p) => {
      if (
        !exact(p, [
          'id',
          'status',
          'verifiedAt',
          'nextReviewAt',
          'profileUrl',
          'sourceIds',
          'evidence',
        ]) ||
        !id(p.id) ||
        !validPrisonerReviewDate(p.verifiedAt) ||
        !validPrisonerReviewDate(p.nextReviewAt) ||
        p.verifiedAt > p.nextReviewAt ||
        !https(p.profileUrl) ||
        !Array.isArray(p.sourceIds) ||
        p.sourceIds.length === 0 ||
        p.sourceIds.length > 18 ||
        !p.sourceIds.every(id) ||
        new Set(p.sourceIds).size !== p.sourceIds.length
      )
        return false;
      if (p.status === 'needs-review') return p.evidence === null;
      if (
        p.status !== 'dated-address-match' ||
        p.nextReviewAt !== '2026-11-08' ||
        p.verifiedAt !== '2026-10-03' ||
        !exact(p.evidence, [
          'sourcePublishedAt',
          'pdfPage',
          'contentSha256',
          'announcementEdition',
          'pdfEdition',
        ])
      )
        return false;
      return (
        p.sourceIds.includes('nycabc-guide-19-8') &&
        p.profileUrl === 'https://nycabc.wordpress.com/2026/09/24/guide_19_8/' &&
        p.evidence.sourcePublishedAt === '2026-09-24' &&
        Number.isInteger(p.evidence.pdfPage) &&
        Number(p.evidence.pdfPage) >= 1 &&
        Number(p.evidence.pdfPage) <= 16 &&
        p.evidence.contentSha256 ===
          'd7b19d149db3c1aa63df4b3a414d89bf313e2f72b443da7dd49ccc3f2745c4ab' &&
        p.evidence.announcementEdition === '19.8' &&
        p.evidence.pdfEdition === '19.9'
      );
    })
  )
    return false;
  return (
    new Set(value.profiles.map((p) => p.id)).size === 30 &&
    value.profiles.filter((p) => p.status === 'dated-address-match').length === 13
  );
}
if (!validateWebsitePrisonerReview(raw)) throw new TypeError('website-prisoner-review-invalid');
export const websitePrisonerReview = raw as unknown as Readonly<{
  profiles: readonly PrisonerReviewProfile[];
  links: readonly Readonly<{
    id: string;
    name: string;
    url: string;
    kind: string;
    checkedAt: string;
  }>[];
}>;

/** Calendar dates remain in the viewer's local zone; the review day is inclusive. */
export function localPrisonerReviewDay(now: Date): string | null {
  if (!Number.isFinite(now.getTime())) return null;
  return `${String(now.getFullYear()).padStart(4, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function prisonerReviewState(
  p: PrisonerReviewProfile,
  now: Date,
  expired: Set<string>,
): PrisonerReviewState {
  if (p.status !== 'dated-address-match') return 'needs-review';
  const today = localPrisonerReviewDay(now);
  if (
    !today ||
    !validPrisonerReviewDate(p.verifiedAt) ||
    !validPrisonerReviewDate(p.nextReviewAt) ||
    today > p.nextReviewAt
  )
    expired.add(p.id);
  if (expired.has(p.id)) return 'expired';
  if (today! < p.verifiedAt) return 'needs-review';
  return 'dated-address-match';
}
