const utf8ByteLength = (value: string) => new TextEncoder().encode(value).byteLength;

export const mobileKnowledgeSchema = 'wrn.mobile-knowledge.v1' as const;
export const mobileKnowledgeContractVersion = '1.0.0' as const;
export const mobileKnowledgeRuntimeMaxBytes = 3 * 1024 * 1024;
export const mobileKnowledgeLocales = [
  'en',
  'de',
  'es',
  'fr',
  'it',
  'pt',
  'ru',
  'el',
  'tr',
] as const;
export type MobileKnowledgeLocale = (typeof mobileKnowledgeLocales)[number];
export type KnowledgeLink = Readonly<{ label: string; url: string }>;
export type KnowledgeBook = Readonly<{
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  authors: readonly string[];
  languages: readonly string[];
  topics: readonly string[];
  formats: readonly ('html' | 'pdf' | 'epub')[];
  readUrl: string;
  downloads: Readonly<Partial<Record<'html' | 'pdf' | 'epub', string>>>;
  updatedAt: string;
  rights: 'metadata-and-links';
}>;
export type KnowledgeCatalogSource = Readonly<{
  id: string;
  name: string;
  languages: readonly string[];
  homepage: string;
  catalogUrl: string;
  formats: readonly ('html' | 'pdf' | 'epub')[];
  description: string;
  politicalScope: readonly string[];
  status: string;
  verifiedAt: string;
  rights: 'metadata-and-links';
  descriptionRights: 'user-supplied-editorial-text';
}>;
export type KnowledgeLexiconSource = Readonly<{
  id: string;
  name: string;
  language: string;
  description: Readonly<{ de: string; en: string }>;
  url: string;
  downloads: readonly KnowledgeLink[];
  rights: 'user-supplied-editorial-text';
  linkRights: 'metadata-and-links';
}>;
export type KnowledgeTerm = Readonly<{
  id: string;
  category: string;
  sources: readonly string[];
  title: Readonly<{ de: string; en: string }>;
  aliases: Readonly<{ de: readonly string[]; en: readonly string[] }>;
  summary: Readonly<{ de: string; en: string }>;
  practice: Readonly<{ de: string; en: string }>;
  debate: Readonly<{ de: string; en: string }>;
  related: readonly string[];
  rights: 'user-supplied-editorial-text';
}>;
export type MobileKnowledgeV1 = Readonly<{
  schema: typeof mobileKnowledgeSchema;
  contractVersion: typeof mobileKnowledgeContractVersion;
  sourceCommit: string;
  observedAt: string;
  origin: 'legacy-app-snapshot';
  input: Readonly<{
    libraryFeedSha256: string;
    libraryFeedBytes: number;
    librarySourcesSha256: string;
    librarySourcesBytes: number;
    lexiconSha256: string;
    lexiconBytes: number;
  }>;
  library: Readonly<{
    books: readonly KnowledgeBook[];
    sources: readonly KnowledgeCatalogSource[];
  }>;
  lexicon: Readonly<{
    terms: readonly KnowledgeTerm[];
    sources: readonly KnowledgeLexiconSource[];
  }>;
  withdrawnSourceIds: Readonly<{ library: readonly string[]; lexicon: readonly string[] }>;
  withdrawnIds: Readonly<{ books: readonly string[]; terms: readonly string[] }>;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const id = /^[a-z0-9][a-z0-9-]{0,159}$/;
const isId = (value: unknown): value is string => typeof value === 'string' && id.test(value);
const languageCode = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const hash = /^[a-f0-9]{64}$/;
const commit = /^[a-f0-9]{40}$/;
const date = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2}))?$/;
const formats = new Set(['html', 'pdf', 'epub']);
const validHistoricalDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !date.test(value)) return false;
  const day = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== value.slice(0, 10))
    return false;
  if (value.length === 10) return true;
  return (
    Number(value.slice(11, 13)) < 24 &&
    Number(value.slice(14, 16)) < 60 &&
    Number(value.slice(17, 19)) < 60 &&
    Number.isFinite(Date.parse(value))
  );
};
const canonicalObservation = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value))
    return false;
  const time = new Date(value);
  return Number.isFinite(time.getTime()) && time.toISOString() === value;
};
const containsBlockedCharacter = (value: string) =>
  Array.from(value).some((character) => {
    const code = character.codePointAt(0)!;
    return code <= 0x1f || (code >= 0x7f && code <= 0x9f) || character === '<' || character === '>';
  });
const plain = (value: unknown, max = 20_000): value is string =>
  typeof value === 'string' &&
  value === value.normalize('NFC') &&
  value.trim() === value &&
  utf8ByteLength(value) > 0 &&
  utf8ByteLength(value) <= max &&
  !containsBlockedCharacter(value);
const array = <T>(
  value: unknown,
  guard: (item: unknown) => item is T,
  max = 100,
): value is readonly T[] => Array.isArray(value) && value.length <= max && value.every(guard);
const stringArray = (value: unknown, max = 100) =>
  array(value, (item): item is string => plain(item, 500), max);
const languages = (value: unknown) =>
  array(
    value,
    (item): item is string =>
      typeof item === 'string' && item.length <= 35 && languageCode.test(item),
  );
const unique = (values: readonly string[]) => new Set(values).size === values.length;
export const isSafeKnowledgeUrl = (value: unknown): value is string => {
  if (
    typeof value !== 'string' ||
    value !== value.trim() ||
    containsBlockedCharacter(value) ||
    /\s/u.test(value)
  )
    return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    return (
      url.protocol === 'https:' &&
      url.username === '' &&
      url.password === '' &&
      host.includes('.') &&
      host !== 'localhost' &&
      !host.endsWith('.localhost') &&
      !host.endsWith('.local') &&
      !host.startsWith('[') &&
      !/^\d{1,3}(\.\d{1,3}){3}$/.test(host) &&
      url.href === value
    );
  } catch {
    return false;
  }
};
const source = (value: unknown): value is KnowledgeCatalogSource =>
  isRecord(value) &&
  isId(value.id) &&
  plain(value.name, 500) &&
  languages(value.languages) &&
  isSafeKnowledgeUrl(value.homepage) &&
  isSafeKnowledgeUrl(value.catalogUrl) &&
  array(
    value.formats,
    (item): item is 'html' | 'pdf' | 'epub' => typeof item === 'string' && formats.has(item),
  ) &&
  plain(value.description) &&
  stringArray(value.politicalScope) &&
  plain(value.status, 100) &&
  validHistoricalDate(value.verifiedAt) &&
  value.rights === 'metadata-and-links' &&
  value.descriptionRights === 'user-supplied-editorial-text';
const book = (value: unknown): value is KnowledgeBook => {
  if (
    !isRecord(value) ||
    !isId(value.id) ||
    !isId(value.sourceId) ||
    !plain(value.sourceName, 500) ||
    !plain(value.title, 500) ||
    value.rights !== 'metadata-and-links' ||
    !stringArray(value.authors) ||
    !languages(value.languages) ||
    !stringArray(value.topics) ||
    !array(
      value.formats,
      (item): item is 'html' | 'pdf' | 'epub' => typeof item === 'string' && formats.has(item),
    ) ||
    typeof value.readUrl !== 'string' ||
    (value.readUrl !== '' && !isSafeKnowledgeUrl(value.readUrl)) ||
    !isRecord(value.downloads) ||
    !validHistoricalDate(value.updatedAt)
  )
    return false;
  const available = new Set([...Object.keys(value.downloads), ...(value.readUrl ? ['html'] : [])]);
  return (
    available.size > 0 &&
    unique(value.formats as readonly string[]) &&
    available.size === value.formats.length &&
    value.formats.every((format) => available.has(format)) &&
    Object.entries(value.downloads).every(
      ([key, link]) => formats.has(key) && isSafeKnowledgeUrl(link),
    ) &&
    Object.keys(value.downloads).every((key) => (value.formats as readonly string[]).includes(key))
  );
};
const bilingual = (value: unknown, max = 20_000): value is { de: string; en: string } =>
  isRecord(value) &&
  Object.keys(value).length === 2 &&
  plain(value.de, max) &&
  plain(value.en, max);
const lexSource = (value: unknown): value is KnowledgeLexiconSource =>
  isRecord(value) &&
  isId(value.id) &&
  plain(value.name, 500) &&
  plain(value.language, 500) &&
  bilingual(value.description) &&
  isSafeKnowledgeUrl(value.url) &&
  array(
    value.downloads,
    (link): link is KnowledgeLink =>
      isRecord(link) && plain(link.label, 500) && isSafeKnowledgeUrl(link.url),
  ) &&
  value.rights === 'user-supplied-editorial-text' &&
  value.linkRights === 'metadata-and-links';
const term = (value: unknown): value is KnowledgeTerm =>
  isRecord(value) &&
  isId(value.id) &&
  plain(value.category, 100) &&
  stringArray(value.sources) &&
  bilingual(value.title, 500) &&
  isRecord(value.aliases) &&
  array(value.aliases.de, (item): item is string => plain(item, 500)) &&
  array(value.aliases.en, (item): item is string => plain(item, 500)) &&
  bilingual(value.summary) &&
  bilingual(value.practice) &&
  bilingual(value.debate) &&
  stringArray(value.related) &&
  value.rights === 'user-supplied-editorial-text';
export type KnowledgeValidation = Readonly<{
  ok: boolean;
  errors: readonly string[];
  value: MobileKnowledgeV1 | null;
}>;
export function validateMobileKnowledge(value: unknown): KnowledgeValidation {
  const errors: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ['root'], value: null };
  try {
    if (utf8ByteLength(JSON.stringify(value)) > mobileKnowledgeRuntimeMaxBytes)
      return { ok: false, errors: ['runtime-size'], value: null };
  } catch {
    return { ok: false, errors: ['serialization'], value: null };
  }
  if (
    value.schema !== mobileKnowledgeSchema ||
    value.contractVersion !== mobileKnowledgeContractVersion ||
    typeof value.sourceCommit !== 'string' ||
    !commit.test(value.sourceCommit) ||
    !canonicalObservation(value.observedAt) ||
    value.origin !== 'legacy-app-snapshot'
  )
    errors.push('header');
  const input = isRecord(value.input) ? value.input : null;
  if (
    input === null ||
    ![input.libraryFeedSha256, input.librarySourcesSha256, input.lexiconSha256].every(
      (item) => typeof item === 'string' && hash.test(item),
    ) ||
    !['libraryFeedBytes', 'librarySourcesBytes', 'lexiconBytes'].every(
      (key) =>
        Number.isSafeInteger(input[key]) &&
        (input[key] as number) > 0 &&
        (input[key] as number) <= mobileKnowledgeRuntimeMaxBytes,
    )
  )
    errors.push('input');
  if (!isRecord(value.library)) errors.push('library');
  else {
    if (!array(value.library.books, book, 2000)) {
      const invalidBook = Array.isArray(value.library.books)
        ? value.library.books.find((item) => !book(item))
        : undefined;
      errors.push(`library-book:${isRecord(invalidBook) ? String(invalidBook.id) : 'shape'}`);
    }
    if (!array(value.library.sources, source, 100)) errors.push('library-sources');
  }
  if (
    !isRecord(value.lexicon) ||
    !array(value.lexicon.terms, term, 250) ||
    !array(value.lexicon.sources, lexSource, 100)
  )
    errors.push('lexicon');
  if (
    !isRecord(value.withdrawnSourceIds) ||
    !array(value.withdrawnSourceIds.library, isId, 100) ||
    !array(value.withdrawnSourceIds.lexicon, isId, 100) ||
    !isRecord(value.withdrawnIds) ||
    !array(value.withdrawnIds.books, isId, 2000) ||
    !array(value.withdrawnIds.terms, isId, 250)
  )
    errors.push('withdrawals');
  if (errors.length) return { ok: false, errors, value: null };
  const document = value as unknown as MobileKnowledgeV1;
  const allBooks = document.library.books.map((item) => item.id),
    allSources = document.library.sources.map((item) => item.id),
    allTerms = document.lexicon.terms.map((item) => item.id),
    lexSources = document.lexicon.sources.map((item) => item.id);
  if (
    ![
      allBooks,
      allSources,
      allTerms,
      lexSources,
      document.withdrawnIds.books,
      document.withdrawnIds.terms,
      document.withdrawnSourceIds.library,
      document.withdrawnSourceIds.lexicon,
    ].every(unique)
  )
    errors.push('duplicate-ids');
  if (
    !document.library.books.every((item) => allSources.includes(item.sourceId)) ||
    !document.lexicon.terms.every(
      (item) =>
        item.sources.every((sourceId) => lexSources.includes(sourceId)) &&
        item.related.every((termId) => allTerms.includes(termId)),
    )
  )
    errors.push('references');
  if (
    !document.withdrawnIds.books.every((item) => allBooks.includes(item)) ||
    !document.withdrawnIds.terms.every((item) => allTerms.includes(item)) ||
    !document.withdrawnSourceIds.library.every((item) => allSources.includes(item)) ||
    !document.withdrawnSourceIds.lexicon.every((item) => lexSources.includes(item))
  )
    errors.push('withdrawal-references');
  return errors.length
    ? { ok: false, errors, value: null }
    : { ok: true, errors: [], value: document };
}
export function projectMobileKnowledge(value: MobileKnowledgeV1) {
  const withdrawnLibrary = new Set(value.withdrawnSourceIds.library),
    withdrawnBooks = new Set(value.withdrawnIds.books),
    withdrawnTerms = new Set(value.withdrawnIds.terms),
    withdrawnLexicon = new Set(value.withdrawnSourceIds.lexicon);
  const librarySources = value.library.sources.filter((item) => !withdrawnLibrary.has(item.id)),
    sourceIds = new Set(librarySources.map((item) => item.id)),
    books = value.library.books.filter(
      (item) => !withdrawnBooks.has(item.id) && sourceIds.has(item.sourceId),
    ),
    lexiconSources = value.lexicon.sources.filter((item) => !withdrawnLexicon.has(item.id)),
    lexSourceIds = new Set(lexiconSources.map((item) => item.id)),
    terms = value.lexicon.terms.filter(
      (item) =>
        !withdrawnTerms.has(item.id) &&
        item.sources.every((sourceId) => lexSourceIds.has(sourceId)),
    ),
    termIds = new Set(terms.map((item) => item.id));
  return Object.freeze({
    books,
    librarySources,
    lexiconSources,
    terms: terms.map((item) => ({
      ...item,
      related: item.related.filter((related) => termIds.has(related)),
    })),
  });
}
