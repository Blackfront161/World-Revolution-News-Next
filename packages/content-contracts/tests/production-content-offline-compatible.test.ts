import { describe, expect, it } from 'vitest';
import {
  createProductionContentOfflineBundle,
  validateProductionContentOfflineBundle,
} from '../src/production-content-offline-compatible.js';
import { canonicalJson, utf8ByteLength } from '../src/index.js';
import { productionContentCapacityPolicyV3 } from '../src/production-content-capacity-policy.js';
import { createV3Input, padV3ResourcesToMaximumBytes } from './production-capacity-support.js';

describe('versioned production offline bundles', () => {
  it('round-trips a V3 envelope with its original identity and rejects tampering', async () => {
    const input = await createV3Input(8);
    const bundle = await createProductionContentOfflineBundle({ ...input, checkedAt: 100 });
    expect(bundle.format).toBe('wrn.production-content-offline-bundle.v3');
    expect(bundle.byteLength).toBe(utf8ByteLength(canonicalJson(bundle)));
    const ready = await validateProductionContentOfflineBundle(bundle, {
      revision: 1,
      revokedIds: [],
    });
    expect(ready?.manifestSha256).toBe(input.descriptor.expectedManifest.sha256);
    expect(
      await validateProductionContentOfflineBundle(
        { ...bundle, key: 'f'.repeat(64) },
        { revision: 1, revokedIds: [] },
      ),
    ).toBeNull();
    expect(
      await validateProductionContentOfflineBundle(bundle, {
        revision: 2,
        revokedIds: [bundle.manifest.articleIds[0]!],
      }),
    ).toBeNull();
  });

  it('stores the largest constructible V3 packet below the four MiB envelope cap', async () => {
    const input = await createV3Input(64);
    await padV3ResourcesToMaximumBytes(input, productionContentCapacityPolicyV3.maxResourceBytes);
    const resourceBytes = input.manifest.resources.reduce(
      (total: number, resource: { readonly bytes: number }) => total + resource.bytes,
      0,
    );
    expect(resourceBytes).toBe(productionContentCapacityPolicyV3.maxBundleBytes);
    const bundle = await createProductionContentOfflineBundle({ ...input, checkedAt: 100 });
    expect(bundle.byteLength).toBe(utf8ByteLength(canonicalJson(bundle)));
    // Fixed keys, five fixed resources, 64 fixed-width IDs, SHA-256s and bounded revisions fit in 8 KiB.
    const schemaWrapperUpperBound = 8 * 1024;
    expect(bundle.byteLength - resourceBytes).toBeLessThanOrEqual(schemaWrapperUpperBound);
    expect(resourceBytes + schemaWrapperUpperBound).toBeLessThan(4 * 1024 * 1024);
    expect(bundle.byteLength).toBeLessThanOrEqual(4 * 1024 * 1024);
  });
});
