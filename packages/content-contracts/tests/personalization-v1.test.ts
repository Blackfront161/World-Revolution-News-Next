import { describe, expect, it } from 'vitest';

import {
  localPersonalizationContentLanguageIds,
  localPersonalizationContractVersion,
  localPersonalizationInterestIds,
  localPersonalizationMaxBytes,
  localPersonalizationRegionIds,
  localPersonalizationRevision,
  localPersonalizationSchema,
  validateLocalPersonalizationStateV1,
} from '../src/index.js';

function candidate() {
  return {
    contractVersion: localPersonalizationContractVersion,
    schema: localPersonalizationSchema,
    revision: localPersonalizationRevision,
    interestIds: ['football', 'movement-news'],
    regionIds: ['europe'],
    contentLanguageIds: ['de', 'en'],
  } as const;
}

describe('WRN-G3-017 local personalization v1 contract', () => {
  it('accepts only the exact minimal closed-catalog document within its byte cap', () => {
    const result = validateLocalPersonalizationStateV1(candidate());
    expect(result).toMatchObject({ ok: true, errors: [] });
    expect(result.bytes).toBeGreaterThan(0);
    expect(result.bytes).toBeLessThanOrEqual(localPersonalizationMaxBytes);
    expect(localPersonalizationInterestIds).toHaveLength(7);
    expect(localPersonalizationRegionIds).toHaveLength(8);
    expect(localPersonalizationContentLanguageIds).toHaveLength(9);
  });

  it('fails closed for future versions, foreign fields, unknown IDs and noncanonical lists', () => {
    const valid = candidate();
    const invalid = [
      { ...valid, contractVersion: 2 },
      { ...valid, schema: 'wrn.local-personalization.v2' },
      { ...valid, revision: 'wrn-local-personalization-v2' },
      { ...valid, extra: 'must-not-persist' },
      { ...valid, interestIds: ['future-interest'] },
      { ...valid, regionIds: ['europe', 'europe'] },
      { ...valid, contentLanguageIds: ['en', 'de'] },
      { ...valid, interestIds: [...localPersonalizationInterestIds, 'future-interest'] },
    ];
    for (const value of invalid) expect(validateLocalPersonalizationStateV1(value).ok).toBe(false);
  });

  it('never treats malformed, null or a different object shape as V1', () => {
    for (const value of [
      null,
      [],
      'not-json',
      { contractVersion: 1 },
      { ...candidate(), interestIds: [], regionIds: [], contentLanguageIds: [] },
    ]) {
      expect(validateLocalPersonalizationStateV1(value).ok).toBe(false);
    }
  });
});
