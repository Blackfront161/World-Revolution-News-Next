import { afterEach, describe, expect, it } from 'vitest';
import {
  emptyMobileReaderV2MediaSafetyLedger,
  isMobileReaderV2MediaAllowed,
  loadMobileReaderV2MediaSafety,
  mergeMobileReaderV2MediaSafety,
  mobileReaderV2MediaSafetyStorageKey,
  persistMobileReaderV2MediaSafety,
} from './mobile-reader-v2-media-safety';
import {
  mobileReaderV2MaxLedgerBytes,
  mobileReaderV2MaxLedgerEntries,
} from '@wrn/content-contracts/mobile-reader-v2';

const entry = { mediaId: 'wrn-v2-media-a', sha256: 'a'.repeat(64) };
afterEach(() => window.localStorage.clear());

describe('mobile reader v2 media safety ledger', () => {
  it('keeps a revocation through A/B/A and restart', () => {
    const a = emptyMobileReaderV2MediaSafetyLedger();
    const b = mergeMobileReaderV2MediaSafety(a, 1, [entry]);
    expect(b).not.toBeNull();
    expect(persistMobileReaderV2MediaSafety(window.localStorage, b!)).toBe(true);
    const restarted = loadMobileReaderV2MediaSafety();
    expect(isMobileReaderV2MediaAllowed(restarted, entry.mediaId, entry.sha256)).toBe(false);
    expect(
      mergeMobileReaderV2MediaSafety(restarted.kind === 'ready' ? restarted.ledger : a, 0, []),
    ).toBeNull();
  });
  it('fails closed for future/corrupt raw or a write error', () => {
    window.localStorage.setItem(
      mobileReaderV2MediaSafetyStorageKey,
      '{"schema":"future","revision":99,"entries":[]}',
    );
    expect(loadMobileReaderV2MediaSafety().kind).toBe('protected');
    const failing = {
      getItem: () => null,
      setItem: () => {
        throw new Error('full');
      },
    };
    expect(persistMobileReaderV2MediaSafety(failing, emptyMobileReaderV2MediaSafetyLedger())).toBe(
      false,
    );
  });
  it.each([-1, 0, 1] as const)('enforces the ledger raw-byte cap at limit %+d', (delta) => {
    const rawLedger = JSON.stringify({
      schema: 'wrn.mobile-reader-v2-media-safety.v1',
      revision: 0,
      entries: [],
    });
    const raw = rawLedger + ' '.repeat(mobileReaderV2MaxLedgerBytes + delta - rawLedger.length);
    window.localStorage.setItem(mobileReaderV2MediaSafetyStorageKey, raw);
    expect(loadMobileReaderV2MediaSafety().kind).toBe(delta > 0 ? 'protected' : 'ready');
  });
  it('enforces the ledger entry cap across limit minus one, limit, and limit plus one', () => {
    const entries = Array.from({ length: mobileReaderV2MaxLedgerEntries + 1 }, (_, index) => ({
      mediaId: `entry-${index}`,
      sha256: index.toString(16).padStart(64, '0'),
    }));
    const empty = emptyMobileReaderV2MediaSafetyLedger();
    expect(
      mergeMobileReaderV2MediaSafety(
        empty,
        1,
        entries.slice(0, mobileReaderV2MaxLedgerEntries - 1),
      ),
    ).not.toBeNull();
    expect(
      mergeMobileReaderV2MediaSafety(empty, 1, entries.slice(0, mobileReaderV2MaxLedgerEntries)),
    ).not.toBeNull();
    expect(
      mergeMobileReaderV2MediaSafety(
        empty,
        1,
        entries.slice(0, mobileReaderV2MaxLedgerEntries + 1),
      ),
    ).toBeNull();
  });
});
