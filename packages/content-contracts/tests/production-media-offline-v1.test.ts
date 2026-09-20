import { describe, expect, it } from 'vitest';
import {
  createEmptyProductionMediaOfflineControlV1,
  isProductionMediaOfflineBundleV1,
  isProductionMediaOfflineControlV1,
  isProductionMediaOfflineIdentityV1,
  productionMediaOfflineFixedBytes,
  productionMediaOfflineFitsLimitV1,
  productionMediaOfflineBundleKeyV1,
  productionMediaOfflineLimitsV1,
  productionMediaOfflineStateBytesV1,
} from '../src/production-media-offline-v1.js';

const sha = (value: number) => value.toString(16).padStart(64, '0');
const safety = { revision: 0, floor: 0, revocationSha256: null, entries: [] } as const;
const identity = (sequence: number) => ({
  releaseRevision: `release-${sequence}`,
  sequence,
  descriptorSha256: sha(sequence + 5000),
  key: sha(sequence),
});

describe('production media offline contract v1', () => {
  it('uses the accepted durable caps and a frozen empty control', () => {
    const control = createEmptyProductionMediaOfflineControlV1();
    expect(productionMediaOfflineLimitsV1).toEqual({
      controlBytes: 393_216,
      bundleBytes: 1_048_576,
      totalBytes: 3_538_944,
      bundles: 3,
      identities: 512,
    });
    expect(isProductionMediaOfflineControlV1(control)).toBe(true);
    expect(Object.isFrozen(control)).toBe(true);
    expect(Object.isFrozen(control.acceptedIdentities)).toBe(true);
    expect(Object.isFrozen(control.safety)).toBe(true);
    expect(Object.isFrozen(control.safety.entries)).toBe(true);
  });
  it('hashes only the exact identity tuple even when a JavaScript caller supplies extra keys', async () => {
    const tuple = {
      releaseRevision: 'release-a',
      sequence: 1,
      descriptorSha256: sha(9),
    };
    const tupleWithExtraKey = { ...tuple, ignored: true };
    await expect(productionMediaOfflineBundleKeyV1(tuple)).resolves.toBe(
      await productionMediaOfflineBundleKeyV1(tupleWithExtraKey),
    );
  });
  it.each([
    ['control', 393_216],
    ['bundle', 1_048_576],
    ['total', 3_538_944],
  ] as const)(
    'applies the exact %s byte boundary independently of schema validity',
    (kind, cap) => {
      expect(productionMediaOfflineFitsLimitV1(kind, cap - 1)).toBe(true);
      expect(productionMediaOfflineFitsLimitV1(kind, cap)).toBe(true);
      expect(productionMediaOfflineFitsLimitV1(kind, cap + 1)).toBe(false);
      expect(productionMediaOfflineFitsLimitV1(kind, Number.NaN)).toBe(false);
    },
  );
  it('rejects malformed control, duplicate slots, pending mismatch and all identity collisions', () => {
    const full = Array.from({ length: 512 }, (_, index) => identity(index + 1));
    const control = {
      ...createEmptyProductionMediaOfflineControlV1(),
      acceptedIdentities: full,
      highestAcceptedSequence: 512,
    };
    expect(isProductionMediaOfflineControlV1(control)).toBe(true);
    expect(
      isProductionMediaOfflineControlV1({
        ...control,
        acceptedIdentities: [...full, identity(513)],
        highestAcceptedSequence: 513,
      }),
    ).toBe(false);
    expect(
      isProductionMediaOfflineControlV1({ ...control, activeKey: sha(1), previousKey: sha(1) }),
    ).toBe(false);
    expect(
      isProductionMediaOfflineControlV1({
        ...control,
        pendingRecheck: { operationId: 'attempt', generation: 1, clearEpoch: 0 },
      }),
    ).toBe(false);
    for (const key of ['releaseRevision', 'sequence', 'descriptorSha256', 'key'] as const) {
      const rows = full.map((entry, index) =>
        index === 1 ? { ...entry, [key]: full[0]![key] } : entry,
      );
      expect(isProductionMediaOfflineControlV1({ ...control, acceptedIdentities: rows })).toBe(
        false,
      );
    }
    expect(isProductionMediaOfflineIdentityV1({ ...identity(1), extra: true })).toBe(false);
  });
  it('uses a fixed-point canonical UTF-8 byteLength and rejects quote-heavy byte corruption', () => {
    const raw = '{"quoted":"\\\\\\""}';
    const basis = {
      format: 'wrn.production-media-offline.v1',
      key: sha(9),
      byteLength: 0,
      checkedAt: 1,
      admittedSafety: safety,
      pointerRaw: raw,
      descriptorRaw: raw,
      documentsRaw: { manifest: raw, admission: raw, rights: raw, consent: raw, revocation: raw },
    };
    const byteLength = productionMediaOfflineFixedBytes(basis);
    expect(byteLength).not.toBeNull();
    const bundle = { ...basis, byteLength: byteLength! };
    expect(isProductionMediaOfflineBundleV1(bundle)).toBe(true);
    expect(isProductionMediaOfflineBundleV1({ ...bundle, byteLength: byteLength! + 1 })).toBe(
      false,
    );
    expect(
      isProductionMediaOfflineBundleV1({
        ...bundle,
        documentsRaw: { ...bundle.documentsRaw, manifest: '\ud800' },
      }),
    ).toBe(false);
  });
  it('fails closed when a valid state exceeds a store cap or has more than three bundles', () => {
    const control = createEmptyProductionMediaOfflineControlV1();
    const bundle = {
      format: 'wrn.production-media-offline.v1' as const,
      key: sha(1),
      byteLength: 0,
      checkedAt: 1,
      admittedSafety: safety,
      pointerRaw: '{}',
      descriptorRaw: '{}',
      documentsRaw: {
        manifest: '{}',
        admission: '{}',
        rights: '{}',
        consent: '{}',
        revocation: '{}',
      },
    };
    const fixed = { ...bundle, byteLength: productionMediaOfflineFixedBytes(bundle)! };
    expect(productionMediaOfflineStateBytesV1(control, [fixed, fixed, fixed, fixed])).toBeNull();
    expect(productionMediaOfflineStateBytesV1(control, [fixed])).toBeGreaterThan(0);
  });
});
