import { describe, expect, it } from 'vitest';
import {
  isSafeKnowledgeUrl,
  projectMobileKnowledge,
  validateMobileKnowledge,
} from './mobile-knowledge-v1.js';

const base = {
  schema: 'wrn.mobile-knowledge.v1',
  contractVersion: '1.0.0',
  sourceCommit: 'a'.repeat(40),
  observedAt: '2026-09-09T00:00:00.000Z',
  origin: 'legacy-app-snapshot',
  input: {
    libraryFeedSha256: 'b'.repeat(64),
    libraryFeedBytes: 1,
    librarySourcesSha256: 'c'.repeat(64),
    librarySourcesBytes: 1,
    lexiconSha256: 'd'.repeat(64),
    lexiconBytes: 1,
  },
  library: {
    sources: [
      {
        id: 'library',
        name: 'Library',
        languages: ['en'],
        homepage: 'https://example.org/',
        catalogUrl: 'https://example.org/catalogue',
        formats: ['html'],
        description: 'Catalogue',
        politicalScope: ['anarchist'],
        status: 'active',
        verifiedAt: '2026-08-04',
        rights: 'metadata-and-links',
        descriptionRights: 'user-supplied-editorial-text',
      },
    ],
    books: [
      {
        id: 'book',
        sourceId: 'library',
        sourceName: 'Library',
        title: 'Book',
        authors: ['Author'],
        languages: ['en'],
        topics: [],
        formats: ['html'],
        readUrl: 'https://example.org/read',
        downloads: {},
        updatedAt: '2026-08-04',
        rights: 'metadata-and-links',
      },
    ],
  },
  lexicon: {
    sources: [
      {
        id: 'lexsource',
        name: 'Source',
        language: 'English',
        description: { de: 'Deutsch', en: 'English' },
        url: 'https://example.org/source',
        downloads: [],
        rights: 'user-supplied-editorial-text',
        linkRights: 'metadata-and-links',
      },
    ],
    terms: [
      {
        id: 'term',
        category: 'basics',
        sources: ['lexsource'],
        title: { de: 'Begriff', en: 'Term' },
        aliases: { de: [], en: [] },
        summary: { de: 'Kurz', en: 'Brief' },
        practice: { de: 'Praxis', en: 'Practice' },
        debate: { de: 'Debatte', en: 'Debate' },
        related: [],
        rights: 'user-supplied-editorial-text',
      },
    ],
  },
  withdrawnSourceIds: { library: [], lexicon: [] },
  withdrawnIds: { books: [], terms: [] },
} as const;
describe('mobile knowledge v1', () => {
  it('validates a bounded local-only document', () =>
    expect(validateMobileKnowledge(base).ok).toBe(true));
  it('rejects unsafe URLs and unresolved references', () => {
    expect(
      validateMobileKnowledge({
        ...base,
        library: {
          ...base.library,
          books: [{ ...base.library.books[0], readUrl: 'https://localhost/read' }],
        },
      }).ok,
    ).toBe(false);
    expect(
      validateMobileKnowledge({
        ...base,
        lexicon: { ...base.lexicon, terms: [{ ...base.lexicon.terms[0], sources: ['missing'] }] },
      }).ok,
    ).toBe(false);
  });
  it('removes direct and source withdrawals before rendering and closes related links', () => {
    const projected = projectMobileKnowledge({
      ...base,
      withdrawnSourceIds: { library: ['library'], lexicon: [] },
      withdrawnIds: { books: [], terms: ['term'] },
    });
    expect(projected.books).toHaveLength(0);
    expect(projected.librarySources).toHaveLength(0);
    expect(projected.terms).toHaveLength(0);
  });
});

describe('knowledge migration safety regressions', () => {
  it.each([
    'https://[::1]/',
    'https://[2001:db8::1]/',
    'https://catalog.localhost/',
    'https://localhost./',
    'https://catalog.local./',
  ])('rejects non-public hostname %s', (url) => {
    expect(isSafeKnowledgeUrl(url)).toBe(false);
  });
  it('does not coerce absent or numeric IDs into valid strings', () => {
    for (const bad of [undefined, 42]) {
      expect(
        validateMobileKnowledge({
          ...base,
          library: { ...base.library, books: [{ ...base.library.books[0], id: bad }] },
        }).ok,
      ).toBe(false);
    }
  });
  it.each(['2026-02-30T00:00:00.000Z', '2026-09-09', '2026-09-09T00:00:00+02:00'])(
    'requires a real canonical observation time: %s',
    (observedAt) => {
      expect(validateMobileKnowledge({ ...base, observedAt }).ok).toBe(false);
    },
  );
  it('rejects phantom formats and books without any usable link', () => {
    for (const patch of [{ formats: ['html', 'pdf'] }, { formats: [], readUrl: '' }]) {
      expect(
        validateMobileKnowledge({
          ...base,
          library: { ...base.library, books: [{ ...base.library.books[0], ...patch }] },
        }).ok,
      ).toBe(false);
    }
  });
  it('keeps source and record withdrawal namespaces distinct', () => {
    const withSameId = {
      ...base,
      library: { ...base.library, books: [{ ...base.library.books[0], id: 'library' }] },
      withdrawnIds: { books: ['library'], terms: [] },
    };
    expect(validateMobileKnowledge(withSameId).ok).toBe(true);
    expect(projectMobileKnowledge(withSameId).books).toEqual([]);
    expect(projectMobileKnowledge(withSameId).librarySources).toHaveLength(1);
  });
  it('rejects unknown withdrawal references, invalid dates, bad language codes and mismatched rights', () => {
    expect(
      validateMobileKnowledge({ ...base, withdrawnIds: { books: ['missing'], terms: [] } }).ok,
    ).toBe(false);
    expect(
      validateMobileKnowledge({
        ...base,
        library: {
          ...base.library,
          sources: [{ ...base.library.sources[0], verifiedAt: '2026-02-30' }],
        },
      }).ok,
    ).toBe(false);
    expect(
      validateMobileKnowledge({
        ...base,
        library: {
          ...base.library,
          books: [{ ...base.library.books[0], languages: ['not a language'] }],
        },
      }).ok,
    ).toBe(false);
    expect(
      validateMobileKnowledge({
        ...base,
        lexicon: {
          ...base.lexicon,
          terms: [{ ...base.lexicon.terms[0], rights: 'metadata-and-links' }],
        },
      }).ok,
    ).toBe(false);
  });
  it('removes a whole term on source withdrawal and prunes surviving related references', () => {
    const term = base.lexicon.terms[0];
    const document = {
      ...base,
      lexicon: {
        sources: [...base.lexicon.sources, { ...base.lexicon.sources[0], id: 'second' }],
        terms: [term, { ...term, id: 'survivor', sources: ['second'], related: ['term'] }],
      },
      withdrawnSourceIds: { library: [], lexicon: ['lexsource'] },
    };
    expect(validateMobileKnowledge(document).ok).toBe(true);
    const projected = projectMobileKnowledge(document);
    expect(projected.terms.map((item) => item.id)).toEqual(['survivor']);
    expect(projected.terms[0]?.related).toEqual([]);
    expect(projected.lexiconSources.map((item) => item.id)).toEqual(['second']);
  });
  it('rejects oversized or non-serializable input without throwing', () => {
    expect(validateMobileKnowledge({ ...base, extra: 'x'.repeat(3 * 1024 * 1024) }).ok).toBe(false);
    const circular: Record<string, unknown> = { ...base };
    circular.circular = circular;
    expect(() => validateMobileKnowledge(circular)).not.toThrow();
    expect(validateMobileKnowledge(circular).ok).toBe(false);
  });
});
