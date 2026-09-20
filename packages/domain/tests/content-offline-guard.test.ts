import { describe, expect, it } from 'vitest';

import { contentOfflineGuardTtlMs, evaluateContentOfflineGuard } from '../src/index.js';

const base = {
  activeKey: 'bundle-a',
  lastSuccessfulSourceCheckAt: 1_000,
  lastObservedAt: 1_000,
  pendingRecheck: null,
  safety: { floor: 0, entries: [] },
};

describe('WRN-G3-014 reader and resume guard', () => {
  it('requires a source check before reader/resume when the persistent marker exists', () => {
    expect(
      evaluateContentOfflineGuard(
        { ...base, pendingRecheck: { operationId: 'check-a', generation: 2, clearEpoch: 0 } },
        2_000,
      ),
    ).toEqual({ kind: 'needs-source-check', reason: 'pending-recheck' });
  });
  it('does not let cache reads, expired source checks, or a backward clock preserve offline authority', () => {
    expect(
      evaluateContentOfflineGuard(
        { ...base, lastObservedAt: null },
        base.lastSuccessfulSourceCheckAt - 1,
      ),
    ).toEqual({
      kind: 'needs-source-check',
      reason: 'clock-regressed',
    });
    expect(evaluateContentOfflineGuard(base, 1_000 + contentOfflineGuardTtlMs + 1)).toEqual({
      kind: 'needs-source-check',
      reason: 'expired',
    });
    expect(evaluateContentOfflineGuard(base, 999)).toEqual({
      kind: 'needs-source-check',
      reason: 'clock-regressed',
    });
  });
  it('allows only an active checked bundle inside the bounded TTL', () => {
    expect(evaluateContentOfflineGuard(base, 1_000 + contentOfflineGuardTtlMs)).toEqual({
      kind: 'allowed',
      activeKey: 'bundle-a',
      checkedAt: 1_000,
    });
    expect(evaluateContentOfflineGuard(base, 2_000)).toEqual({
      kind: 'allowed',
      activeKey: 'bundle-a',
      checkedAt: 1_000,
    });
    expect(evaluateContentOfflineGuard({ ...base, activeKey: null }, 2_000)).toEqual({
      kind: 'unavailable',
      reason: 'no-active-bundle',
    });
  });
});
