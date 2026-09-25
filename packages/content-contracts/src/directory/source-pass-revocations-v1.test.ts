import { describe, expect, it } from 'vitest';
import {
  isSourcePassRevocationsV1,
  mergeSourcePassRevocationsV1,
  type SourcePassRevocationsV1,
} from './source-pass-revocations-v1.js';

const one = `source-${'1'.repeat(64)}`;
const two = `source-${'2'.repeat(64)}`;
const snapshot = (revision: number, endpointIds: string[]): SourcePassRevocationsV1 => ({
  schema: 'wrn.source-pass-revocations.v1',
  contractVersion: '1.0.0',
  revision,
  observedAt: `2026-09-2${revision}T00:00:00.000Z`,
  endpointIds,
});

describe('source pass revocations v1', () => {
  it('accepts sorted cumulative ids and rejects malformed ordering', () => {
    expect(isSourcePassRevocationsV1(snapshot(1, [one, two]))).toBe(true);
    expect(isSourcePassRevocationsV1(snapshot(1, [two, one]))).toBe(false);
  });

  it('prevents rollback, same-revision equivocation and removal of known ids', () => {
    const known = snapshot(2, [one]);
    expect(mergeSourcePassRevocationsV1(known, snapshot(1, [one]))).toBeNull();
    expect(
      mergeSourcePassRevocationsV1(known, {
        ...known,
        observedAt: '2026-09-25T00:00:00.000Z',
      }),
    ).toBeNull();
    expect(mergeSourcePassRevocationsV1(known, snapshot(3, []))).toBeNull();
    expect(mergeSourcePassRevocationsV1(known, snapshot(3, [one, two]))?.endpointIds).toEqual([
      one,
      two,
    ]);
  });
});
