import { describe, expect, it } from 'vitest';
import {
  projectMobileKnowledge,
  validateMobileKnowledge,
} from '@wrn/content-contracts/mobile-knowledge-v1';
import packed from './packed/legacy-knowledge-v1.json';
import { learningPathsForKnowledge } from './learning-paths';
const current = () => {
  const validation = validateMobileKnowledge(structuredClone(packed.currentKnowledge));
  if (!validation.ok || !validation.value) throw Error('invalid test fixture');
  const document = validation.value;
  return {
    document,
    glossaryDocument: document,
    projection: projectMobileKnowledge(document),
  };
};
describe('learning paths use current catalogue records and original links', () => {
  it('resolves three paths and all thirty book relationships', () => {
    const data = current();
    expect(data.projection.books).toHaveLength(715);
    expect(data.projection.books.filter((b) => b.languages.includes('de'))).toHaveLength(53);
    const paths = learningPathsForKnowledge(data);
    expect(paths).toHaveLength(3);
    expect(paths.flatMap((p) => p.entries)).toHaveLength(30);
    expect(
      paths
        .flatMap((p) => p.entries)
        .every((e) => e.terms.length > 0 && e.originalUrl.startsWith('https://')),
    ).toBe(true);
  });
  it('hides withdrawn books, withdrawn terms and changed original URLs', () => {
    const data = current();
    const entry = learningPathsForKnowledge(data)[0]!.entries[0]!;
    Object.assign(data.document.withdrawnIds, { books: [entry.bookId] });
    data.projection = projectMobileKnowledge(data.document);
    expect(learningPathsForKnowledge(data).flatMap((p) => p.entries)).toHaveLength(29);
    const changed = current();
    const book = changed.document.library.books.find((b) => b.id === entry.bookId)!;
    Object.assign(book, { downloads: { epub: 'https://other.example/book' }, readUrl: '' });
    changed.projection = projectMobileKnowledge(changed.document);
    expect(learningPathsForKnowledge(changed).flatMap((p) => p.entries)).toHaveLength(29);
    const withdrawn = current();
    Object.assign(withdrawn.document.withdrawnIds, { terms: [entry.termIds[0]!] });
    withdrawn.projection = projectMobileKnowledge(withdrawn.document);
    expect(
      learningPathsForKnowledge(withdrawn)
        .flatMap((p) => p.entries)
        .some((e) => e.termIds.includes(entry.termIds[0]!)),
    ).toBe(false);
  });
});
