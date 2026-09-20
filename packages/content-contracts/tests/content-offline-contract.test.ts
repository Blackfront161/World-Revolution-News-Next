import { describe, expect, it } from 'vitest';

import {
  canonicalJson,
  createEmptyContentOfflineControlV1,
  isContentOfflineControlV1,
  mergeContentOfflineSafetyLedger,
  sameContentOfflineSafetyLedger,
} from '../src/index.js';

const blocked = {
  id: 'wrn-test-art-blocked',
  status: 'blocked' as const,
  category: 'rights-or-safety' as const,
};
const replaced = {
  id: 'wrn-test-art-replaced',
  status: 'replaced' as const,
  category: 'rights-or-safety' as const,
};

describe('WRN-G3-014 offline control contract', () => {
  it('creates a payload-free, exact control record with no implicit active bundle', () => {
    const control = createEmptyContentOfflineControlV1();
    expect(isContentOfflineControlV1(control)).toBe(true);
    expect(control).toMatchObject({
      activeKey: null,
      candidateKey: null,
      previousKey: null,
      pendingRecheck: null,
      safety: { floor: 0, entries: [] },
    });
  });

  it('accepts a changed content/lifecycle hash outside the relevant equal-floor revocation facts', () => {
    const left = { floor: 4, entries: [blocked] };
    const right = { floor: 4, entries: [blocked] };
    expect(sameContentOfflineSafetyLedger(left, right)).toBe(true);
    expect(mergeContentOfflineSafetyLedger(left, right)).toEqual(left);
  });

  it('treats a canonical JSON roundtrip of identical same-floor safety facts as equal', () => {
    const ledger = {
      floor: 4,
      entries: [blocked],
    };
    const canonicalRoundtrip = JSON.parse(canonicalJson(ledger)) as typeof ledger;

    expect(Object.keys(ledger.entries[0]!)).toEqual(['id', 'status', 'category']);
    expect(Object.keys(canonicalRoundtrip.entries[0]!)).toEqual(['category', 'id', 'status']);
    expect(sameContentOfflineSafetyLedger(ledger, canonicalRoundtrip)).toBe(true);
    expect(mergeContentOfflineSafetyLedger(canonicalRoundtrip, ledger)).toEqual(canonicalRoundtrip);
  });

  it('fails closed on a lower floor, omitted known blocked ID, or equal-floor contradictory revocation', () => {
    const known = { floor: 4, entries: [blocked] };
    expect(mergeContentOfflineSafetyLedger(known, { floor: 3, entries: [blocked] })).toBeNull();
    expect(mergeContentOfflineSafetyLedger(known, { floor: 4, entries: [] })).toBeNull();
    expect(
      mergeContentOfflineSafetyLedger(known, {
        floor: 4,
        entries: [{ ...blocked, status: 'replaced' as const }],
      }),
    ).toBeNull();
  });

  it('does not accept a higher floor that forgets a previously verified revocation', () => {
    expect(
      mergeContentOfflineSafetyLedger(
        { floor: 4, entries: [blocked] },
        { floor: 5, entries: [replaced] },
      ),
    ).toBeNull();
  });
});
