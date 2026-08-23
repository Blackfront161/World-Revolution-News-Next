import { describe, expect, it } from 'vitest';

import {
  foundationContractVersion,
  isShellStateContract,
  parseShellStateContract,
} from '../src/index.js';

describe('Foundation ShellState contract', () => {
  it('accepts each valid local ShellState contract', () => {
    for (const state of ['ready', 'loading', 'error', 'offline'] as const) {
      const candidate = { contractVersion: foundationContractVersion, state };

      expect(isShellStateContract(candidate)).toBe(true);
      expect(parseShellStateContract(candidate)).toEqual(candidate);
    }
  });

  it('rejects a different contract version', () => {
    const candidate = { contractVersion: '0.1.1', state: 'ready' };

    expect(isShellStateContract(candidate)).toBe(false);
    expect(parseShellStateContract(candidate)).toBeUndefined();
  });

  it('rejects invalid state and non-record payloads', () => {
    expect(
      isShellStateContract({ contractVersion: foundationContractVersion, state: 'READY' }),
    ).toBe(false);
    expect(isShellStateContract({ contractVersion: foundationContractVersion })).toBe(false);
    expect(
      isShellStateContract({
        contractVersion: foundationContractVersion,
        state: 'ready',
        ignored: true,
      }),
    ).toBe(false);
    expect(isShellStateContract([foundationContractVersion, 'ready'])).toBe(false);
    expect(isShellStateContract(null)).toBe(false);
  });

  it('returns a detached contract object', () => {
    const input = { contractVersion: foundationContractVersion, state: 'offline' as const };
    const parsed = parseShellStateContract(input);

    expect(parsed).toEqual(input);
    expect(parsed).not.toBe(input);
  });
});
