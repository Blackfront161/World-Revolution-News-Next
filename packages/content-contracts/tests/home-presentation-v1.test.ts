import { describe, expect, it } from 'vitest';

import {
  localHomePresentationContractVersion,
  localHomePresentationSchema,
  projectLocalHomePresentationV1,
  type LocalHomePresentationV1,
} from '../src/index.js';

const ids = [
  'wrn-test-art-alpha',
  'wrn-test-art-bravo',
  'wrn-test-art-charlie',
  'wrn-test-art-delta',
  'wrn-test-art-echo',
  'wrn-test-art-foxtrot',
  'wrn-test-art-golf',
  'wrn-test-art-hotel',
  'wrn-test-art-india',
] as const;

const articles = ids.map((id) => ({ id }));
const now = Date.parse('2026-08-30T12:00:00.000Z');

function candidate(): LocalHomePresentationV1 {
  return {
    contractVersion: localHomePresentationContractVersion,
    schema: localHomePresentationSchema,
    revision: 'wrn-g3-016-home-v1',
    leadId: ids[0],
    mainIds: ids.slice(1, 6),
    sport: {
      featureId: ids[6],
      secondaryIds: ids.slice(7),
      categories: ['football', 'fanculture', 'women'],
      checkedAt: '2026-08-30T10:00:00.000Z',
      validUntil: '2026-09-01T10:00:00.000Z',
    },
  };
}

describe('WRN-G3-016 local home presentation', () => {
  it('admits exactly one lead, five ordered main cards and a disjoint 1+2 sport projection', () => {
    const result = projectLocalHomePresentationV1({ homePresentation: candidate() }, articles, now);

    expect(result).toEqual({
      kind: 'ready',
      revision: 'wrn-g3-016-home-v1',
      leadId: ids[0],
      mainIds: ids.slice(1, 6),
      sport: {
        featureId: ids[6],
        secondaryIds: ids.slice(7),
        categories: ['football', 'fanculture', 'women'],
      },
    });
  });

  it.each([
    ['foreign sport id', { featureId: 'wrn-test-art-unknown' }],
    ['cross-role duplicate', { featureId: ids[0] }],
    ['wrong sport count', { secondaryIds: [ids[7]] }],
    ['wrong category', { categories: ['football', 'fanculture', 'unknown'] }],
    ['expired freshness', { validUntil: '2026-08-30T11:59:59.999Z' }],
    ['future freshness', { checkedAt: '2026-08-30T12:00:00.001Z' }],
  ] as const)(
    '%s preserves the primary roles and returns sport-not-current',
    (_label, sportPatch) => {
      const value = candidate();
      const patched = {
        ...value,
        sport: { ...value.sport, ...sportPatch },
      };
      const result = projectLocalHomePresentationV1({ homePresentation: patched }, articles, now);

      expect(result).toMatchObject({
        kind: 'sport-not-current',
        leadId: ids[0],
        mainIds: ids.slice(1, 6),
        sport: null,
      });
    },
  );

  it('rejects a wrong main-card count before projecting any home role', () => {
    const value = candidate();
    const patched = { ...value, mainIds: ids.slice(1, 5) };
    const result = projectLocalHomePresentationV1({ homePresentation: patched }, articles, now);

    expect(result).toEqual({
      kind: 'sport-not-current',
      revision: 'wrn-g3-016-home-v1',
      leadId: null,
      mainIds: [],
      sport: null,
    });
  });

  it('never chooses a fallback when the optional presentation is absent', () => {
    expect(projectLocalHomePresentationV1({}, articles, now)).toEqual({
      kind: 'sport-not-current',
      revision: null,
      leadId: null,
      mainIds: [],
      sport: null,
    });
  });
});
