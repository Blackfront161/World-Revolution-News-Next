import { describe, expect, it } from 'vitest';
import {
  createEmptyProductionContentOfflineControlV1,
  deriveProductionContentReleasePathsV1,
  isProductionContentCurrentPointerV1,
  isProductionContentOfflineControlV1,
  mergeProductionContentOfflineSafetyV1,
  productionContentOfflineBundleMaxBytes,
  productionContentOfflineMaxBundles,
  productionContentOfflineMaxIdentities,
} from '../src/production-content-offline-v1.js';
import type { ProductionContentSafetyLedgerV1 } from '../src/production-content-release-v1.js';

const pointer = Object.freeze({
  schema: 'wrn.production-content-current.v1' as const,
  releaseRevision: 'wrn-production-2026-09-10-v1',
  sequence: 9,
  descriptorPath: '/wrn-production-content/wrn-production-2026-09-10-v1/release-descriptor.json',
  descriptorSha256: 'a'.repeat(64),
});

describe('production offline contract v1', () => {
  it('resolves the actual generator relative descriptor path to the same fixed app resource', () => {
    const relative = `${pointer.releaseRevision}/release-descriptor.json`;
    expect(deriveProductionContentReleasePathsV1({ ...pointer, descriptorPath: relative })).toEqual(
      deriveProductionContentReleasePathsV1(pointer),
    );
    for (const descriptorPath of [
      `../${relative}`,
      `./${relative}`,
      `${relative}?x=1`,
      `${relative}#x`,
      `https://example.org/${relative}`,
      `${pointer.releaseRevision}/other.json`,
      relative.replace('/', '%2f'),
    ]) {
      expect(deriveProductionContentReleasePathsV1({ ...pointer, descriptorPath })).toBeNull();
    }
  });
  it('bounds immutable identity receipts and rejects duplicate revisions, keys and inconsistent sequence floors', () => {
    const empty = createEmptyProductionContentOfflineControlV1();
    const acceptedIdentities = Array.from(
      { length: productionContentOfflineMaxIdentities },
      (_, index) => ({
        revision: `accepted-${index + 1}`,
        sequence: index + 1,
        key: (index + 1).toString(16).padStart(64, '0'),
      }),
    );
    const full = {
      ...empty,
      acceptedIdentities,
      highestAcceptedSequence: acceptedIdentities.length,
    };
    expect(isProductionContentOfflineControlV1(full)).toBe(true);
    expect(
      isProductionContentOfflineControlV1({
        ...full,
        acceptedIdentities: [
          ...acceptedIdentities,
          { revision: 'overflow', sequence: 513, key: 'f'.repeat(64) },
        ],
        highestAcceptedSequence: 513,
      }),
    ).toBe(false);
    expect(isProductionContentOfflineControlV1({ ...full, highestAcceptedSequence: 511 })).toBe(
      false,
    );
    expect(
      isProductionContentOfflineControlV1({
        ...full,
        acceptedIdentities: acceptedIdentities.map((entry, index) =>
          index === 1 ? { ...entry, revision: acceptedIdentities[0]!.revision } : entry,
        ),
      }),
    ).toBe(false);
    expect(
      isProductionContentOfflineControlV1({
        ...full,
        acceptedIdentities: acceptedIdentities.map((entry, index) =>
          index === 1 ? { ...entry, key: acceptedIdentities[0]!.key } : entry,
        ),
      }),
    ).toBe(false);
    expect(
      isProductionContentOfflineControlV1({
        ...full,
        acceptedIdentities: [...acceptedIdentities].reverse(),
      }),
    ).toBe(false);
    expect(empty.acceptedIdentities).toEqual([]);
    expect(Object.isFrozen(empty.acceptedIdentities)).toBe(true);
  });
  it('accepts only the exact immutable pointer and fixed seven-path allowlist', () => {
    expect(isProductionContentCurrentPointerV1(pointer)).toBe(true);
    expect(deriveProductionContentReleasePathsV1(pointer)).toEqual({
      descriptor: pointer.descriptorPath,
      manifest: '/wrn-production-content/wrn-production-2026-09-10-v1/manifest.json',
      admission: '/wrn-production-content/wrn-production-2026-09-10-v1/admission.json',
      archiveLifecycle:
        '/wrn-production-content/wrn-production-2026-09-10-v1/archive-lifecycle.json',
      articles: '/wrn-production-content/wrn-production-2026-09-10-v1/articles.json',
      discoverIndex: '/wrn-production-content/wrn-production-2026-09-10-v1/discover-index.json',
      readerDetails: '/wrn-production-content/wrn-production-2026-09-10-v1/reader-details.json',
    });
    expect(
      deriveProductionContentReleasePathsV1({ ...pointer, descriptorPath: '/elsewhere.json' }),
    ).toBeNull();
    expect(isProductionContentCurrentPointerV1({ ...pointer, sequence: 0 })).toBe(false);
    expect(isProductionContentCurrentPointerV1({ ...pointer, extra: true })).toBe(false);
  });

  it('keeps a bounded, frozen, exact control with the accepted sequence floor', () => {
    const control = createEmptyProductionContentOfflineControlV1();
    expect(Object.isFrozen(control)).toBe(true);
    expect(control.highestAcceptedSequence).toBe(0);
    expect(isProductionContentOfflineControlV1(control)).toBe(true);
    expect(isProductionContentOfflineControlV1({ ...control, highestAcceptedSequence: -1 })).toBe(
      false,
    );
    expect(
      isProductionContentOfflineControlV1({ ...control, activeKey: 'same', previousKey: 'same' }),
    ).toBe(false);
    expect(productionContentOfflineMaxBundles).toBe(3);
    expect(productionContentOfflineBundleMaxBytes).toBe(4 * 1024 * 1024);
  });

  it('merges safety monotonically and fails closed for forgotten or contradictory revisions', () => {
    const base: ProductionContentSafetyLedgerV1 = Object.freeze({
      revision: 2,
      revokedIds: Object.freeze(['wrn-art-0123456789abcdef0123456789abcdef'] as const),
    });
    const expanded: ProductionContentSafetyLedgerV1 = Object.freeze({
      revision: 3,
      revokedIds: Object.freeze([
        'wrn-art-0123456789abcdef0123456789abcdef',
        'wrn-art-ffffffffffffffffffffffffffffffff',
      ] as const),
    });
    expect(mergeProductionContentOfflineSafetyV1(base, expanded)).toEqual(expanded);
    expect(mergeProductionContentOfflineSafetyV1(expanded, base)).toBeNull();
    expect(
      mergeProductionContentOfflineSafetyV1(base, { revision: 2, revokedIds: [] as const }),
    ).toBeNull();
  });
});
