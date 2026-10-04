import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  projectMobileKnowledge,
  validateMobileKnowledge,
} from '@wrn/content-contracts/mobile-knowledge-v1';
import packed from './packed/legacy-knowledge-v1.json';
describe('website knowledge snapshot', () => {
  it('keeps the approved byte-identical snapshot, contract and visible counts', async () => {
    const bytes = await readFile(
      resolve(process.cwd(), 'src/features/knowledge/data/legacy-knowledge-v1.json'),
    );
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      '26eb4c118d0483788f07ef0b103c97e1cf53fbf75d36a61ae47456146240726b',
    );
    const validation = validateMobileKnowledge(JSON.parse(bytes.toString('utf8')));
    expect(validation.ok).toBe(true);
    expect(validation.value).not.toBeNull();
    const projection = projectMobileKnowledge(validation.value!);
    expect(projection.books).toHaveLength(609);
    expect(projection.terms).toHaveLength(22);
    expect(packed.history).toEqual(JSON.parse(bytes.toString('utf8')));
    expect(validateMobileKnowledge(packed.currentKnowledge).ok).toBe(true);
    expect(packed.currentKnowledge.lexicon.terms).toHaveLength(177);
    expect(packed.currentKnowledge.lexicon.sources).toHaveLength(55);
    expect(packed.currentKnowledge.input.lexiconSha256).toBe(
      '737cf5e7264ffcfbbca93245fffe0c8f567b477b6e9107648d0b659536f2a903',
    );
    expect(packed.currentKnowledge.sourceCommit).toBe('6a8edf0b8e2ddd462db2e750f672c3f114801171');
    expect(packed.currentKnowledge.library.books).toHaveLength(741);
    const approved = new Set(
      [
        'ba62ecff09594a0105cded9a',
        '174b8a1c8b31483104c78134',
        '53f177951cf6dc3525a55ad2',
        '433b2ba94777b2cbc1a40583',
        'cdd0f47e1835707d18dfbc69',
        'a66f144a48eed29e9330ce16',
        'dbfc419a36310497917860c0',
        '37f710aeecdeffbe215e526b',
        '4bf827a262200fb3dc1dcf0b',
        'b3828bd26e2871d376d62575',
      ].map((id) => 'anarchist-library-de-' + id),
    );
    const metadataOnly = packed.currentKnowledge.library.books.filter((book) =>
      approved.has(book.id),
    );
    expect(metadataOnly).toHaveLength(10);
    expect(
      metadataOnly.every(
        (book) =>
          Object.keys(book.downloads).length === 0 &&
          book.readUrl.startsWith('https://de.anarchistlibraries.net/library/'),
      ),
    ).toBe(true);
    const added = packed.currentKnowledge.lexicon.terms.filter((term) =>
      [
        'agroecology',
        'seed-sovereignty',
        'energy-democracy',
        'climate-reparations',
        'environmental-racism',
        'community-supported-agriculture',
        'digital-commons',
        'federated-networks',
        'interoperability',
        'open-standards',
        'free-knowledge',
        'collective-access',
      ].includes(term.id),
    );
    expect(added).toHaveLength(12);
    expect(
      added.every(
        (term) =>
          term.rights === 'user-supplied-editorial-text' &&
          term.sources.every((id) =>
            packed.currentKnowledge.lexicon.sources.some((source) => source.id === id),
          ),
      ),
    ).toBe(true);
  });
});
