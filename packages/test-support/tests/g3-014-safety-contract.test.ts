import { describe, expect, it } from 'vitest';

import {
  archiveLifecycleIntegrityPayload,
  canonicalJson,
  createContentOfflineBundleV1,
  readerDetailsIntegrityPayload,
  sha256Utf8,
  validateContentOfflineBundleV1,
  validateLocalContentReleaseSafetyEvidenceV1,
} from '@wrn/content-contracts';
import type { LocalArticleResourcePayload } from '@wrn/content-contracts';

import { createG3014OfflineFixtures } from '../src/index.js';

describe('WRN-G3-014 offline safety bundle contract', () => {
  it('rejects an incoming higher-floor bundle that forgets a known revocation', async () => {
    const fixtures = await createG3014OfflineFixtures();

    await expect(
      createContentOfflineBundleV1({
        descriptor: fixtures.c.descriptor,
        documents: fixtures.c.documents,
        checkedAt: 10_000,
        knownSafety: {
          floor: 2,
          entries: [
            {
              id: 'wrn-test-art-known-blocked',
              status: 'blocked',
              category: 'rights-or-safety',
            },
          ],
        },
      }),
    ).rejects.toThrow('kumulativen Safety-Ledger');
  });

  it('rejects a stored bundle carrying a known blocked article even at the same floor', async () => {
    const fixtures = await createG3014OfflineFixtures();
    const bundle = await createContentOfflineBundleV1({
      descriptor: fixtures.a.descriptor,
      documents: fixtures.a.documents,
      checkedAt: 10_000,
    });

    await expect(
      validateContentOfflineBundleV1(bundle, {
        floor: 1,
        entries: [
          {
            id: fixtures.cRevokedAId,
            status: 'blocked',
            category: 'rights-or-safety',
          },
        ],
      }),
    ).resolves.toBeNull();
  });

  it('returns an immutable deep snapshot rather than retaining caller-owned document objects', async () => {
    const fixtures = await createG3014OfflineFixtures();
    const descriptor = JSON.parse(JSON.stringify(fixtures.a.descriptor));
    const documents = JSON.parse(JSON.stringify(fixtures.a.documents));
    const bundle = await createContentOfflineBundleV1({ descriptor, documents, checkedAt: 10_000 });
    const bundleArticles = bundle.documents.payloads.articles as LocalArticleResourcePayload;
    const originalTitle = bundleArticles.articles[0]!.title;

    documents.payloads.articles.articles[0].title = 'caller mutation must not reach bundle';

    expect(
      (bundle.documents.payloads.articles as LocalArticleResourcePayload).articles[0]!.title,
    ).toBe(originalTitle);
    await expect(
      validateContentOfflineBundleV1(bundle, { floor: 1, entries: [] }),
    ).resolves.not.toBeNull();
  });

  it('revalidates a stored bundle from an immutable descriptor snapshot and returns that snapshot', async () => {
    const fixtures = await createG3014OfflineFixtures();
    const created = await createContentOfflineBundleV1({
      descriptor: fixtures.a.descriptor,
      documents: fixtures.a.documents,
      checkedAt: 10_000,
    });
    const stored = JSON.parse(JSON.stringify(created));
    const ready = await validateContentOfflineBundleV1(stored, { floor: 1, entries: [] });

    expect(ready).not.toBeNull();
    const originalRevision = ready!.descriptor.releaseRevision;
    stored.descriptor.releaseRevision = 'wrn-test-art-mutated-stored-descriptor';

    expect(ready!.descriptor.releaseRevision).toBe(originalRevision);
    expect(Object.isFrozen(ready!.descriptor.expectedManifest)).toBe(true);
    expect(Object.isFrozen(ready!.payloads.articles)).toBe(true);
  });

  it('rejects rehashed safety evidence whose reader proof and article IDs no longer match the pinned manifest', async () => {
    const fixtures = await createG3014OfflineFixtures();
    const descriptor = JSON.parse(JSON.stringify(fixtures.a.descriptor));
    const documents = JSON.parse(JSON.stringify(fixtures.a.documents));
    const originalId = documents.payloads.articles.articles[0].id;
    const replacementId = 'wrn-test-art-rehashed-proof-swap';

    documents.payloads.articles.articles[0].id = replacementId;
    documents.readerDetails.entries[0].articleId = replacementId;
    documents.readerDetails.integritySha256 = await sha256Utf8(
      canonicalJson(readerDetailsIntegrityPayload(documents.readerDetails)),
    );
    for (const key of ['activeArticleIds', 'archiveArticleIds', 'shareableArticleIds']) {
      documents.archiveLifecycle[key] = documents.archiveLifecycle[key].map((id: string) =>
        id === originalId ? replacementId : id,
      );
    }
    documents.archiveLifecycle.sourceContent.articlePayloadSha256 = await sha256Utf8(
      canonicalJson(documents.payloads.articles),
    );
    documents.archiveLifecycle.sourceContent.readerDetailsIntegritySha256 =
      documents.readerDetails.integritySha256;
    documents.archiveLifecycle.integritySha256 = await sha256Utf8(
      canonicalJson(archiveLifecycleIntegrityPayload(documents.archiveLifecycle)),
    );
    const articleResource = documents.manifest.resources.find(
      (resource: { id: string }) => resource.id === 'articles',
    );
    articleResource.sha256 = await sha256Utf8(canonicalJson(documents.payloads.articles));
    descriptor.expectedManifest.sha256 = await sha256Utf8(canonicalJson(documents.manifest));
    descriptor.expectedComponents.readerDetails.sha256 = await sha256Utf8(
      canonicalJson(documents.readerDetails),
    );
    descriptor.expectedComponents.archiveLifecycle.sha256 = await sha256Utf8(
      canonicalJson(documents.archiveLifecycle),
    );

    await expect(
      validateLocalContentReleaseSafetyEvidenceV1({
        descriptor,
        manifest: documents.manifest,
        articles: documents.payloads.articles,
        readerDetails: documents.readerDetails,
        archiveLifecycle: documents.archiveLifecycle,
        knownSafety: {
          floor: 1,
          entries: fixtures.a.documents.archiveLifecycle.revocations.entries,
        },
      }),
    ).resolves.toBeNull();
  });

  it('does not treat an outer-rehashed reader proof as authoritative when its own integrity is stale', async () => {
    const fixtures = await createG3014OfflineFixtures();
    const descriptor = JSON.parse(JSON.stringify(fixtures.a.descriptor));
    const documents = JSON.parse(JSON.stringify(fixtures.a.documents));

    documents.readerDetails.entries[0].blocks[0].text =
      'Rehashed outer proof with stale reader integrity.';
    descriptor.expectedComponents.readerDetails.sha256 = await sha256Utf8(
      canonicalJson(documents.readerDetails),
    );

    await expect(
      validateLocalContentReleaseSafetyEvidenceV1({
        descriptor,
        manifest: documents.manifest,
        articles: documents.payloads.articles,
        readerDetails: documents.readerDetails,
        archiveLifecycle: documents.archiveLifecycle,
        knownSafety: {
          floor: 1,
          entries: fixtures.a.documents.archiveLifecycle.revocations.entries,
        },
      }),
    ).resolves.toBeNull();
  });

  it('takes one immutable input snapshot before asynchronous safety hashing', async () => {
    const fixtures = await createG3014OfflineFixtures();
    const descriptor = JSON.parse(JSON.stringify(fixtures.a.descriptor));
    const documents = JSON.parse(JSON.stringify(fixtures.a.documents));
    const knownSafety = { floor: 0, entries: [] };
    const evidence = validateLocalContentReleaseSafetyEvidenceV1({
      descriptor,
      manifest: documents.manifest,
      articles: documents.payloads.articles,
      readerDetails: documents.readerDetails,
      archiveLifecycle: documents.archiveLifecycle,
      knownSafety,
    });

    descriptor.expectedManifest.sha256 = '0'.repeat(64);

    await expect(evidence).resolves.toEqual({
      floor: 1,
      entries: fixtures.a.documents.archiveLifecycle.revocations.entries,
    });
  });
});
