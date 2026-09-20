import { describe, expect, it } from 'vitest';

import {
  classifyLocalContentReleaseTransportOutcome,
  createLocalContentReleaseRequestPlan,
  localContentReleaseMaxTransportBytes,
  resolveLocalContentReleaseResourcePath,
  validateLocalContentReleaseTransportReceipt,
  validateLocalContentReleaseV1,
} from '@wrn/content-contracts';
import {
  createLocalContentReleaseLoadingState,
  projectLocalContentReleaseValidation,
} from '@wrn/domain';

import { createPinnedLocalContentReleaseFixture } from '../src/index.js';

describe('WRN-G3-012 local content release fixture preparation', () => {
  it('creates one atomically valid release for feed, discover, reader, lifecycle and publication', async () => {
    const fixture = await createPinnedLocalContentReleaseFixture();

    expect(fixture.ready.descriptor.releaseRevision).toBe(
      'wrn-g3-012-local-content-release-v1-d8ff4f1',
    );
    expect(fixture.ready.manifest.revision).toBe(
      fixture.ready.descriptor.expectedManifest.revision,
    );
    expect(fixture.ready.manifestSha256).toBe(fixture.ready.descriptor.expectedManifest.sha256);
    expect(fixture.ready.articleIds).toEqual([
      'wrn-test-art-cedar',
      'wrn-test-art-ember',
      'wrn-test-art-fern',
    ]);
    expect(fixture.ready.archiveLifecycle.archiveArticleIds).toEqual(fixture.ready.articleIds);
    expect(fixture.ready.websitePublication.landingIds).toEqual(fixture.ready.articleIds);
  });

  it('never turns a partial or tampered release into ready', async () => {
    const fixture = await createPinnedLocalContentReleaseFixture();
    const badDiscover = {
      ...fixture.documents,
      discoverIndex: { ...fixture.ready.discoverIndex, integritySha256: '0'.repeat(64) },
    };
    const badLifecycle = {
      ...fixture.documents,
      archiveLifecycle: { ...fixture.ready.archiveLifecycle, integritySha256: '0'.repeat(64) },
    };
    const badPublication = {
      ...fixture.documents,
      websitePublication: {
        ...fixture.ready.websitePublication,
        sourceManifest: {
          ...fixture.ready.websitePublication.sourceManifest,
          integritySha256: '0'.repeat(64),
        },
      },
    };

    await expect(
      validateLocalContentReleaseV1(fixture.descriptor, badDiscover),
    ).resolves.toMatchObject({
      ok: false,
      failureCodes: ['component-hash'],
    });
    await expect(
      validateLocalContentReleaseV1(fixture.descriptor, badLifecycle),
    ).resolves.toMatchObject({
      ok: false,
      failureCodes: ['component-hash'],
    });
    const publicationValidation = await validateLocalContentReleaseV1(
      fixture.descriptor,
      badPublication,
    );
    expect(publicationValidation.ok).toBe(false);
    expect(
      projectLocalContentReleaseValidation(
        fixture.descriptor.releaseRevision,
        publicationValidation,
      ),
    ).toEqual({
      kind: 'error',
      failureCodes: ['component-hash'],
    });
  });

  it('pins revision and manifest hash outside the manifest itself', async () => {
    const fixture = await createPinnedLocalContentReleaseFixture();
    const changedRevision = {
      ...fixture.descriptor,
      expectedManifest: { ...fixture.descriptor.expectedManifest, revision: 'other-revision' },
    };
    const changedHash = {
      ...fixture.descriptor,
      expectedManifest: { ...fixture.descriptor.expectedManifest, sha256: '0'.repeat(64) },
    };
    const changedComponentHash = {
      ...fixture.descriptor,
      expectedComponents: {
        ...fixture.descriptor.expectedComponents,
        readerDetails: {
          ...fixture.descriptor.expectedComponents.readerDetails,
          sha256: '0'.repeat(64),
        },
      },
    };

    await expect(
      validateLocalContentReleaseV1(changedRevision, fixture.documents),
    ).resolves.toMatchObject({ ok: false, failureCodes: ['revision'] });
    await expect(
      validateLocalContentReleaseV1(changedHash, fixture.documents),
    ).resolves.toMatchObject({
      ok: false,
      failureCodes: ['manifest-hash'],
    });
    await expect(
      validateLocalContentReleaseV1(changedComponentHash, fixture.documents),
    ).resolves.toMatchObject({ ok: false, failureCodes: ['component-hash'] });
  });

  it('uses an immutable allowlist and makes unknown IDs impossible to request', () => {
    const plan = createLocalContentReleaseRequestPlan();

    expect(plan.map((entry) => entry.id)).toEqual([
      'manifest',
      'articles',
      'supplemental-items',
      'discover-index',
      'reader-details',
      'archive-lifecycle',
      'website-publication',
    ]);
    expect(resolveLocalContentReleaseResourcePath('unknown')).toBeNull();
    expect(
      validateLocalContentReleaseTransportReceipt({
        resourceId: 'unknown',
        path: '/anything.json',
        status: 200,
        mimeType: 'application/json',
        redirected: false,
        byteLength: 1,
      }),
    ).toEqual({ ok: false, failureCode: 'resource-not-allowed' });
  });

  it('fails closed for path, status, MIME, redirect and transport-cap violations', () => {
    const base = {
      resourceId: 'manifest',
      path: resolveLocalContentReleaseResourcePath('manifest'),
      status: 200,
      mimeType: 'application/json',
      redirected: false,
      byteLength: 2,
    };
    expect(validateLocalContentReleaseTransportReceipt(base)).toEqual({
      ok: true,
      failureCode: null,
    });
    expect(
      validateLocalContentReleaseTransportReceipt({ ...base, path: '/outside.json' }),
    ).toMatchObject({
      failureCode: 'path-not-allowed',
    });
    expect(validateLocalContentReleaseTransportReceipt({ ...base, status: 404 })).toMatchObject({
      failureCode: 'http-status',
    });
    expect(
      validateLocalContentReleaseTransportReceipt({ ...base, mimeType: 'text/html' }),
    ).toMatchObject({
      failureCode: 'mime-type',
    });
    expect(
      validateLocalContentReleaseTransportReceipt({ ...base, redirected: true }),
    ).toMatchObject({
      failureCode: 'redirect',
    });
    expect(
      validateLocalContentReleaseTransportReceipt({
        ...base,
        byteLength: localContentReleaseMaxTransportBytes + 1,
      }),
    ).toMatchObject({ failureCode: 'transport-too-large' });
  });

  it('keeps timeout, abort and unknown transport errors as safe categories', () => {
    expect(classifyLocalContentReleaseTransportOutcome('timeout')).toBe('timeout');
    expect(classifyLocalContentReleaseTransportOutcome('aborted')).toBe('aborted');
    expect(classifyLocalContentReleaseTransportOutcome('https://secret.invalid/path')).toBe(
      'transport-error',
    );
    expect(createLocalContentReleaseLoadingState()).toEqual({ kind: 'loading' });
  });
});
