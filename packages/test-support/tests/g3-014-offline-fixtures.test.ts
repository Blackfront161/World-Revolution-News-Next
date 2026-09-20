import { describe, expect, it } from 'vitest';

import {
  createContentOfflineSafetyLedger,
  validateLocalContentReleaseSafetyEvidenceV1,
} from '@wrn/content-contracts';

import { createG3014OfflineFixtures } from '../src/index.js';

describe('WRN-G3-014 A/B/C offline fixtures', () => {
  it('builds complete, independently valid releases with changed B content and a higher C revocation', async () => {
    const fixtures = await createG3014OfflineFixtures();
    expect(fixtures.a.ready.descriptor.releaseRevision).not.toBe(
      fixtures.b.ready.descriptor.releaseRevision,
    );
    expect(fixtures.a.documents.payloads.articles.articles[0]?.title).not.toBe(
      fixtures.b.documents.payloads.articles.articles[0]?.title,
    );
    expect(fixtures.c.ready.archiveLifecycle.revocations).toMatchObject({
      revision: 2,
    });
    expect(fixtures.c.ready.archiveLifecycle.revocations.entries).toContainEqual({
      id: fixtures.cRevokedAId,
      status: 'blocked',
      category: 'rights-or-safety',
    });
    expect(fixtures.c.ready.articleIds).not.toContain(fixtures.cRevokedAId);
    await expect(
      validateLocalContentReleaseSafetyEvidenceV1({
        descriptor: fixtures.c.descriptor,
        manifest: fixtures.c.documents.manifest,
        articles: fixtures.c.documents.payloads.articles,
        readerDetails: fixtures.c.documents.readerDetails,
        archiveLifecycle: fixtures.c.documents.archiveLifecycle,
        knownSafety: createContentOfflineSafetyLedger(fixtures.a.documents.archiveLifecycle),
      }),
    ).resolves.toMatchObject({ floor: 2 });
  });
});
