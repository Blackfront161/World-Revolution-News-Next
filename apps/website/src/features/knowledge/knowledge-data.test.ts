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
    expect(packed.currentKnowledge.lexicon.sources).toHaveLength(54);
    expect(packed.currentKnowledge.input.lexiconSha256).toBe(
      '7b6fbd2d214fdde5f1df4c88da2771b0026e1083d68942d742b27024e06f40b5',
    );
    expect(packed.currentKnowledge.sourceCommit).toBe('e9c8088806f60ad8b9605705f686cc91f2536f90');
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
