import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  projectMobileKnowledge,
  validateMobileKnowledge,
} from '@wrn/content-contracts/mobile-knowledge-v1';
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
  });
});
