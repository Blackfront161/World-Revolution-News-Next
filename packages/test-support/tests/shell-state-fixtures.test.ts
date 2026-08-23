import { describe, expect, it } from 'vitest';

import { foundationContractVersion, isShellStateContract } from '@wrn/api-contracts';

import { createShellStateFixture, shellStateFixtures } from '../src/index.js';

describe('ShellState fixtures', () => {
  it('provides one deterministic, valid fixture per ShellState', () => {
    expect(Object.keys(shellStateFixtures)).toEqual(['ready', 'loading', 'error', 'offline']);

    for (const fixture of Object.values(shellStateFixtures)) {
      expect(fixture.contractVersion).toBe(foundationContractVersion);
      expect(isShellStateContract(fixture)).toBe(true);
      expect(Object.isFrozen(fixture)).toBe(true);
    }
  });

  it('creates detached fixture copies for test-specific mutation', () => {
    const fixture = createShellStateFixture('error');

    expect(fixture).toEqual(shellStateFixtures.error);
    expect(fixture).not.toBe(shellStateFixtures.error);
  });
});
