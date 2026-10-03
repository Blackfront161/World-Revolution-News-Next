import { describe, expect, it } from 'vitest';
import raw from './data/prisoner-review-v1.json';
import legacy from './packed/legacy-support-v1.json';
import {
  localPrisonerReviewDay,
  prisonerReviewState,
  validateWebsitePrisonerReview,
  websitePrisonerReview,
} from './prisoner-review';

describe('source-bound prisoner review supplement', () => {
  it('binds all existing profiles and five public originals without address, biography or mail-rule fields', () => {
    expect(validateWebsitePrisonerReview(raw)).toBe(true);
    expect(raw.profiles.map((p) => p.id).sort()).toEqual(legacy.persons.map((p) => p.id).sort());
    expect(raw.profiles.filter((p) => p.status === 'dated-address-match')).toHaveLength(13);
    expect(raw.profiles.filter((p) => p.status === 'needs-review')).toHaveLength(17);
    for (const field of [
      'mailingAddress',
      'prisonerId',
      'context',
      'birthday',
      'mailRules',
      'institution',
    ])
      expect(JSON.stringify(raw)).not.toContain('"' + field + '"');
    const injected = structuredClone(raw) as unknown as { profiles: Record<string, unknown>[] };
    injected.profiles[0]!.mailingAddress = { lines: ['unreviewed address'] };
    expect(validateWebsitePrisonerReview(injected)).toBe(false);
    const spoof = structuredClone(raw);
    spoof.links[0]!.url = 'https://example.org/';
    expect(validateWebsitePrisonerReview(spoof)).toBe(false);
  });
  for (const zone of ['Asia/Singapore', 'Pacific/Kiritimati', 'America/Los_Angeles']) {
    it(
      'expires after the local review day in ' + zone + ' and cannot revive after a clock rollback',
      () => {
        const prior = process.env.TZ;
        process.env.TZ = zone;
        try {
          const p = websitePrisonerReview.profiles.find((p) => p.status === 'dated-address-match')!;
          const expired = new Set<string>();
          const before = new Date(2026, 10, 8, 23, 59),
            after = new Date(2026, 10, 9, 0, 1);
          expect(localPrisonerReviewDay(before)).toBe('2026-11-08');
          expect(localPrisonerReviewDay(after)).toBe('2026-11-09');
          expect(prisonerReviewState(p, before, expired)).toBe('dated-address-match');
          expect(prisonerReviewState(p, after, expired)).toBe('expired');
          expect(prisonerReviewState(p, before, expired)).toBe('expired');
          for (const open of websitePrisonerReview.profiles.filter(
            (p) => p.status === 'needs-review',
          ))
            expect(prisonerReviewState(open, before, expired)).toBe('needs-review');
        } finally {
          if (prior === undefined) delete process.env.TZ;
          else process.env.TZ = prior;
        }
      },
    );
  }
  it('fails closed for invalid dates and clocks without converting date labels through UTC', () => {
    const p = websitePrisonerReview.profiles.find((p) => p.status === 'dated-address-match')!;
    expect(
      prisonerReviewState({ ...p, nextReviewAt: '2026-02-30' }, new Date(2026, 9, 3), new Set()),
    ).toBe('expired');
    expect(prisonerReviewState(p, new Date(NaN), new Set())).toBe('expired');
    expect(prisonerReviewState(p, new Date(2026, 9, 2), new Set())).toBe('needs-review');
    expect(p.verifiedAt).toBe('2026-10-03');
  });
});
