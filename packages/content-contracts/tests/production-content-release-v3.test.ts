import { describe, expect, it } from 'vitest';
import {
  createProductionArticleShareUrlV3,
  createValidatedProductionContentReleaseV3,
  resolveProductionContentArticleV3,
  validateProductionContentSafetyEvidenceV3,
} from '../src/production-content-release-v3.js';
import {
  createValidatedProductionContentReleaseV1,
  isProductionContentManifestV1,
} from '../src/production-content-release-v1.js';
import { createValidatedProductionContentReleaseV2 } from '../src/production-content-release-v2.js';
import { productionContentCapacityPolicyV3 } from '../src/production-content-capacity-policy.js';
import {
  addCapacityImages,
  createV3Input,
  padV3ResourceToExactBytes,
  rebindV3ManifestOnly,
  type V3ResourceId,
} from './production-capacity-support.js';

describe('production content release v3 capacity contract', () => {
  it('accepts authored 6, 8 and 64 article packets, while 65 fails', async () => {
    for (const count of [6, 8, 64]) {
      expect(
        await createValidatedProductionContentReleaseV3(await createV3Input(count)),
      ).not.toBeNull();
    }
    expect(await createValidatedProductionContentReleaseV3(await createV3Input(65))).toBeNull();
  });

  it('keeps V1 and V2 public entrypoints closed to the V3 descriptor', async () => {
    const v3 = await createV3Input(6);
    expect(await createValidatedProductionContentReleaseV1(v3)).toBeNull();
    expect(await createValidatedProductionContentReleaseV2(v3)).toBeNull();
    expect(isProductionContentManifestV1(v3.manifest)).toBe(false);
  });

  it('preserves the private Ready proof and original V3 hash for resolution and sharing', async () => {
    const input = await createV3Input(6);
    const ready = await createValidatedProductionContentReleaseV3(input);
    expect(ready).not.toBeNull();
    const id = ready!.articleIds[0]!;
    const resolution = resolveProductionContentArticleV3(ready!, id);
    expect(resolution).toEqual({ kind: 'canonical-active', canonicalId: id });
    expect(createProductionArticleShareUrlV3(ready!, resolution)).toBe(
      `https://solinaridao.com/articles/${id}/`,
    );
    expect(resolveProductionContentArticleV3(structuredClone(ready!), id).kind).toBe('invalid');
    input.documents.articles.articles[0].title = 'Caller mutation';
    expect(ready!.documents.articles.articles[0]!.title).not.toBe('Caller mutation');
  });

  it('rejects hash, safety, version and resource-cap drift before creating Ready', async () => {
    for (const mutation of ['hash', 'safety', 'version', 'resource']) {
      const input = await createV3Input(6);
      if (mutation === 'hash') input.descriptor.expectedManifest.sha256 = 'f'.repeat(64);
      if (mutation === 'safety') input.documents.archiveLifecycle!.revocations.previousRevision = 1;
      if (mutation === 'version') input.descriptor.contractVersion = '2.0.0';
      if (mutation === 'resource') input.manifest.resources[0].bytes = 384 * 1024 + 1;
      expect(await createValidatedProductionContentReleaseV3(input), mutation).toBeNull();
    }
  });

  it('enforces raw and actual base64 aggregate limits with valid mixed-padding images', async () => {
    const accepted = await createV3Input(6);
    await addCapacityImages(accepted, 32, [49_153, 49_146, ...Array(30).fill(49_152)]);
    expect(await createValidatedProductionContentReleaseV3(accepted)).not.toBeNull();

    // Raw is one byte under 1,536 KiB, while per-string padding makes encoded data exceed 2 MiB.
    const encodedOverflow = await createV3Input(6);
    await addCapacityImages(encodedOverflow, 32, [49_153, 49_150, ...Array(30).fill(49_152)]);
    expect(await createValidatedProductionContentReleaseV3(encodedOverflow)).toBeNull();

    // Any raw total above 1,536 KiB necessarily exceeds 2 MiB encoded as well; both guards reject.
    const rawOverflow = await createV3Input(6);
    await addCapacityImages(rawOverflow, 32, 49_153);
    expect(await createValidatedProductionContentReleaseV3(rawOverflow)).toBeNull();

    const countOverflow = await createV3Input(6);
    await addCapacityImages(countOverflow, 33, 64);
    expect(await createValidatedProductionContentReleaseV3(countOverflow)).toBeNull();
  });

  it('returns safety without accepting payloads, and rejects a forged lifecycle receipt', async () => {
    const input = await createV3Input(6);
    expect(
      await validateProductionContentSafetyEvidenceV3({
        descriptor: input.descriptor,
        manifest: input.manifest,
        archiveLifecycle: input.documents.archiveLifecycle,
        knownSafety: { revision: 0, revokedIds: [] },
      }),
    ).toEqual({ revision: 1, revokedIds: [] });
    input.documents.archiveLifecycle.revocations.entries.push({
      id: 'wrn-art-ffffffffffffffffffffffffffffffff',
      status: 'blocked',
      category: 'rights-or-safety',
    });
    expect(
      await validateProductionContentSafetyEvidenceV3({
        descriptor: input.descriptor,
        manifest: input.manifest,
        archiveLifecycle: input.documents.archiveLifecycle,
        knownSafety: { revision: 0, revokedIds: [] },
      }),
    ).toBeNull();
  });

  it('binds every phase-one resource count to the manifest article IDs before payload access', async () => {
    const resourceIds: readonly V3ResourceId[] = [
      'articles',
      'admission',
      'discoverIndex',
      'readerDetails',
      'archiveLifecycle',
    ];
    for (const id of resourceIds) {
      const input = await createV3Input(6);
      const resource = input.manifest.resources.find((entry: { id: string }) => entry.id === id)!;
      resource.recordCount = input.manifest.articleIds.length + 1;
      await rebindV3ManifestOnly(input);
      expect(
        await validateProductionContentSafetyEvidenceV3({
          descriptor: input.descriptor,
          manifest: input.manifest,
          archiveLifecycle: input.documents.archiveLifecycle,
          knownSafety: { revision: 0, revokedIds: [] },
        }),
        id,
      ).toBeNull();
      expect(await createValidatedProductionContentReleaseV3(input), id).toBeNull();
    }
    const valid = await createV3Input(6);
    expect(
      await validateProductionContentSafetyEvidenceV3({
        descriptor: valid.descriptor,
        manifest: valid.manifest,
        archiveLifecycle: valid.documents.archiveLifecycle,
        knownSafety: { revision: 0, revokedIds: [] },
      }),
    ).toEqual({ revision: 1, revokedIds: [] });
  });

  it('uses actual canonical resource bytes at every V3 per-resource boundary', async () => {
    const resourceIds: readonly V3ResourceId[] = [
      'articles',
      'admission',
      'discoverIndex',
      'readerDetails',
      'archiveLifecycle',
    ];
    for (const id of resourceIds) {
      const maximum = productionContentCapacityPolicyV3.maxResourceBytes[id];
      for (const delta of [-1, 0, 1] as const) {
        const input = await createV3Input(64);
        await padV3ResourceToExactBytes(input, id, maximum + delta);
        const resource = input.manifest.resources.find((entry: { id: string }) => entry.id === id)!;
        expect(resource.bytes, `${id}/${delta}`).toBe(maximum + delta);
        const safety = await validateProductionContentSafetyEvidenceV3({
          descriptor: input.descriptor,
          manifest: input.manifest,
          archiveLifecycle: input.documents.archiveLifecycle,
          knownSafety: { revision: 0, revokedIds: [] },
        });
        expect(safety, `${id}/${delta}`).toEqual(
          delta === 1 ? null : { revision: 1, revokedIds: [] },
        );
        expect(await createValidatedProductionContentReleaseV3(input), `${id}/${delta}`).toEqual(
          delta === 1 ? null : expect.anything(),
        );
      }
    }
  });
});
