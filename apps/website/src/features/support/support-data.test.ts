import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  projectMobileSupport,
  validateMobileSupport,
} from '@wrn/content-contracts/mobile-support-v1';
describe('website support snapshot', () => {
  it('keeps the approved byte-identical snapshot, contract and visible counts', async () => {
    const bytes = await readFile(
      resolve(process.cwd(), 'src/features/support/data/legacy-support-v1.json'),
    );
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      'bbd721dc73f0b67e4065618248a1bcd6c86938beb164684e1ccdf1ad54c2e75f',
    );
    const validation = validateMobileSupport(JSON.parse(bytes.toString('utf8')));
    expect(validation.ok).toBe(true);
    expect(validation.value).not.toBeNull();
    const projection = projectMobileSupport(
      validation.value!,
      new Date('2026-08-01T00:00:00.000Z'),
    );
    expect(projection.organizations).toHaveLength(11);
    expect(projection.persons).toHaveLength(30);
  });
});
