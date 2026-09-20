import { describe, expect, it } from 'vitest';
import releaseFixture from './fixtures/wrn-mobile-media-v1/mobile-media-release.json';
import manifestFixture from './fixtures/wrn-mobile-media-v1/media-manifest.json';
import admissionFixture from './fixtures/wrn-mobile-media-v1/media-admission.json';
import rightsFixture from './fixtures/wrn-mobile-media-v1/media-rights.json';
import consentFixture from './fixtures/wrn-mobile-media-v1/media-consent.json';
import lifecycleFixture from './fixtures/wrn-mobile-media-v1/media-lifecycle.json';
import revocationFixture from './fixtures/wrn-mobile-media-v1/media-revocation.json';
import {
  hasMobileMediaJsonByteCap,
  isMobileMediaJsonContentType,
  mobileMediaAvailabilityTransitions,
  mobileMediaCaps,
  mobileMediaDocumentClasses,
  mobileMediaPlaybackTransitions,
  mobileMediaRuntimePaths,
  validateMobileMediaCandidate,
  validateMobileMediaDocument,
  validateMobileMediaRelease,
  type MediaDocumentClass,
} from '../src/mobile-media-v1.js';

const fixedNow = () => Date.parse('2026-09-01T12:00:00.000Z');
const fixtureCandidate = () =>
  JSON.parse(
    JSON.stringify({
      release: releaseFixture,
      documents: {
        manifest: manifestFixture,
        admission: admissionFixture,
        rights: rightsFixture,
        consent: consentFixture,
        lifecycle: lifecycleFixture,
        revocation: revocationFixture,
      },
    }),
  ) as { release: Record<string, unknown>; documents: Record<string, Record<string, unknown>> };
const iso = (milliseconds: number) => new Date(milliseconds).toISOString();
const releaseTimes = (
  candidate: ReturnType<typeof fixtureCandidate>,
  generatedAt: number,
  validUntil: number,
) => {
  candidate.release.generatedAt = iso(generatedAt);
  candidate.release.validUntil = iso(validUntil);
  for (const document of Object.values(candidate.documents)) {
    document.generatedAt = candidate.release.generatedAt;
    document.validUntil = candidate.release.validUntil;
  }
  for (const source of candidate.documents.admission!.sources as Array<Record<string, unknown>>)
    source.validUntil = candidate.release.validUntil;
  for (const right of candidate.documents.rights!.rights as Array<Record<string, unknown>>)
    right.expiresAt = candidate.release.validUntil;
};
const documentArrayKey: Record<MediaDocumentClass, string> = {
  manifest: 'assets',
  admission: 'sources',
  rights: 'rights',
  consent: 'consents',
  lifecycle: 'lifecycle',
  revocation: 'references',
};
const expectCandidateResult = (value: unknown, accepted: boolean) => {
  if (accepted) expect(value).not.toBeNull();
  else expect(value).toBeNull();
};
const expectDocumentResult = (value: boolean, accepted: boolean) => {
  if (accepted) expect(value).toBe(true);
  else expect(value).toBe(false);
};

describe('mobile media v1 contract boundary', () => {
  it('keeps literal runtime and transition contracts', () => {
    expect(Object.values(mobileMediaRuntimePaths)).toHaveLength(10);
    expect(mobileMediaPlaybackTransitions).toHaveLength(8);
    expect(mobileMediaAvailabilityTransitions).toHaveLength(9);
    expect(isMobileMediaJsonContentType('application/json; charset=utf-8')).toBe(true);
    expect(isMobileMediaJsonContentType('APPLICATION/JSON ; CHARSET = UTF-8')).toBe(true);
    expect(isMobileMediaJsonContentType('application/json\t;\tcharset\t=\tutf-8')).toBe(true);
    expect(isMobileMediaJsonContentType('application/json; charset=utf-8; x=y')).toBe(false);
    expect(isMobileMediaJsonContentType('application/json; charset="utf-8"')).toBe(false);
    expect(isMobileMediaJsonContentType('text/json')).toBe(false);
  });

  it('fails closed for malformed release, candidate and invalid injected clock', () => {
    expect(validateMobileMediaRelease({})).toBe(false);
    expect(
      validateMobileMediaCandidate({} as never, {} as never, undefined, () => Number.NaN),
    ).toBeNull();
    expect(
      validateMobileMediaCandidate({} as never, {} as never, undefined, () => Infinity),
    ).toBeNull();
  });

  it('R3 matrix 1/2/3/5/6 rejects candidate exact-union, entry and freshness divergence', () => {
    const base = fixtureCandidate();
    expect(
      validateMobileMediaCandidate(base.release, base.documents as never, undefined, fixedNow),
    ).not.toBeNull();

    const missing = fixtureCandidate();
    (missing.documents.revocation!.references as unknown[]).shift();
    expect(
      validateMobileMediaCandidate(
        missing.release,
        missing.documents as never,
        undefined,
        fixedNow,
      ),
    ).toBeNull();

    const extra = fixtureCandidate();
    (extra.documents.revocation!.references as Array<{ kind: string; id: string }>).push({
      kind: 'asset',
      id: 'wrn-media-asset-unused',
    });
    (extra.documents.revocation!.references as Array<{ kind: string; id: string }>).sort(
      (left, right) => `${left.kind}\0${left.id}`.localeCompare(`${right.kind}\0${right.id}`),
    );
    expect(
      validateMobileMediaCandidate(extra.release, extra.documents as never, undefined, fixedNow),
    ).toBeNull();

    const entry = fixtureCandidate();
    (entry.documents.revocation!.entries as unknown[]).push({
      targetKind: 'asset',
      targetId: 'wrn-media-asset-unused',
      targetHash: '0'.repeat(64),
      status: 'blocked',
      replacementKind: null,
      replacementId: null,
    });
    expect(
      validateMobileMediaCandidate(entry.release, entry.documents as never, undefined, fixedNow),
    ).toBeNull();

    const future = fixtureCandidate();
    future.release.generatedAt = '2026-09-01T12:00:00.001Z';
    expect(
      validateMobileMediaCandidate(future.release, future.documents as never, undefined, fixedNow),
    ).toBeNull();
  });

  it.each(mobileMediaDocumentClasses)(
    'R3 matrix 1 rejects %s extra/missing/type/order/duplicate fields',
    (kind) => {
      const base = fixtureCandidate().documents[kind]!;
      expect(validateMobileMediaDocument(kind, base)).toBe(true);

      const extra = fixtureCandidate().documents[kind]!;
      extra.unexpected = true;
      expect(validateMobileMediaDocument(kind, extra)).toBe(false);

      const missing = fixtureCandidate().documents[kind]!;
      delete missing[Object.keys(missing)[0]!];
      expect(validateMobileMediaDocument(kind, missing)).toBe(false);

      const wrongType = fixtureCandidate().documents[kind]!;
      wrongType.revision = '1';
      expect(validateMobileMediaDocument(kind, wrongType)).toBe(false);

      const reordered = Object.fromEntries(
        Object.entries(fixtureCandidate().documents[kind]!).reverse(),
      );
      expect(validateMobileMediaDocument(kind, reordered)).toBe(false);

      const duplicate = fixtureCandidate().documents[kind]!;
      const arrayKey = documentArrayKey[kind];
      if (kind === 'lifecycle') {
        const lifecycle = duplicate.lifecycle as Record<string, unknown>;
        const transitions = lifecycle.playbackTransitions as unknown[];
        transitions.push(transitions[0]);
      } else {
        const values = duplicate[arrayKey] as unknown[];
        values.push(values[0]);
      }
      expect(validateMobileMediaDocument(kind, duplicate)).toBe(false);
    },
  );

  it('R3 matrix 1 rejects release extra/missing/type/order and duplicate descriptors', () => {
    const extra = fixtureCandidate().release;
    extra.unexpected = true;
    expect(validateMobileMediaRelease(extra)).toBe(false);

    const missing = fixtureCandidate().release;
    delete missing[Object.keys(missing)[0]!];
    expect(validateMobileMediaRelease(missing)).toBe(false);

    const wrongType = fixtureCandidate().release;
    wrongType.revision = '1';
    expect(validateMobileMediaRelease(wrongType)).toBe(false);

    const reordered = Object.fromEntries(Object.entries(fixtureCandidate().release).reverse());
    expect(validateMobileMediaRelease(reordered)).toBe(false);

    const duplicate = fixtureCandidate().release;
    (duplicate.documents as unknown[]).push((duplicate.documents as unknown[])[0]);
    expect(validateMobileMediaRelease(duplicate)).toBe(false);
  });

  it('R3 matrix 1/2 rejects cross-document source, release and temporal boundaries', () => {
    const cross = fixtureCandidate();
    (cross.documents.manifest!.episodes as Array<Record<string, unknown>>)[0]!.sourceId =
      'wrn-media-source-other';
    expect(
      validateMobileMediaCandidate(cross.release, cross.documents as never, undefined, fixedNow),
    ).toBeNull();

    const generatedFuture = fixtureCandidate();
    generatedFuture.release.generatedAt = '2026-09-01T12:00:00.001Z';
    for (const document of Object.values(generatedFuture.documents))
      document.generatedAt = generatedFuture.release.generatedAt;
    expect(
      validateMobileMediaCandidate(
        generatedFuture.release,
        generatedFuture.documents as never,
        undefined,
        fixedNow,
      ),
    ).toBeNull();

    const expired = fixtureCandidate();
    expired.release.validUntil = '2026-09-01T11:59:59.999Z';
    for (const document of Object.values(expired.documents))
      document.validUntil = expired.release.validUntil;
    expect(
      validateMobileMediaCandidate(
        expired.release,
        expired.documents as never,
        undefined,
        fixedNow,
      ),
    ).toBeNull();
  });

  it.each([
    ['generatedAt future +1ms', 1, false],
    ['seven-day TTL equal', 604800000, true],
    ['seven-day TTL +1ms', 604800001, false],
  ] as const)('R3 matrix 2 release time literal %s', (_name, duration, expected) => {
    const value = fixtureCandidate();
    const generatedAt = fixedNow() + (duration === 1 ? 1 : 0);
    releaseTimes(value, generatedAt, generatedAt + (duration === 1 ? 86400000 : duration));
    expectCandidateResult(
      validateMobileMediaCandidate(value.release, value.documents as never, undefined, fixedNow),
      expected,
    );
  });

  it.each([
    ['generatedAt equal', fixedNow(), fixedNow() + 86400000, true],
    ['validUntil minus one millisecond', fixedNow() - 86400000, fixedNow() - 1, false],
    ['validUntil equal', fixedNow() - 86400000, fixedNow(), false],
  ] as const)(
    'R3 matrix 2 release current-time literal %s',
    (_name, generatedAt, validUntil, expected) => {
      const value = fixtureCandidate();
      releaseTimes(value, generatedAt, validUntil);
      expectCandidateResult(
        validateMobileMediaCandidate(value.release, value.documents as never, undefined, fixedNow),
        expected,
      );
    },
  );

  it.each([
    ['admission validFrom generatedAt equal', 'validFrom', 0, true],
    ['admission validFrom generatedAt +1ms', 'validFrom', 1, false],
    ['health age 86400000ms at generatedAt', 'healthAt', -86400000, true],
    ['health age 86400001ms at generatedAt', 'healthAt', -86400001, false],
    ['health generatedAt +1ms', 'healthAt', 1, false],
  ] as const)('R4-R1-05 source freshness literal %s', (_name, field, delta, expected) => {
    const value = fixtureCandidate();
    const generatedAt = Date.parse(String(value.release.generatedAt));
    (value.documents.admission!.sources as Array<Record<string, unknown>>)[0]![field] = iso(
      generatedAt + delta,
    );
    expectCandidateResult(
      validateMobileMediaCandidate(value.release, value.documents as never, undefined, fixedNow),
      expected,
    );
  });

  it('R4-R1-03 requires the manifest asset set to exactly cover episode references', () => {
    const missing = fixtureCandidate().documents.manifest!;
    (missing.episodes as Array<Record<string, unknown>>)[0]!.audioAssetId =
      'wrn-media-asset-missing';
    expect(validateMobileMediaDocument('manifest', missing)).toBe(false);

    const extra = fixtureCandidate().documents.manifest!;
    const extraAsset = {
      ...(extra.assets as Array<Record<string, unknown>>)[0]!,
      id: 'wrn-media-asset-extra',
    };
    (extra.assets as Array<Record<string, unknown>>).push(extraAsset);
    (extra.assets as Array<Record<string, unknown>>).sort((left, right) =>
      String(left.id).localeCompare(String(right.id)),
    );
    expect(validateMobileMediaDocument('manifest', extra)).toBe(false);
  });

  it('R4-R1-04 rejects a second identity target for the same kind and source', () => {
    const admission = fixtureCandidate().documents.admission!;
    const sources = admission.sources as Array<Record<string, unknown>>;
    sources.push(
      { ...sources[0]!, id: 'wrn-media-source-second' },
      { ...sources[0]!, id: 'wrn-media-source-third' },
    );
    sources.sort((left, right) => String(left.id).localeCompare(String(right.id)));
    admission.identityLinks = [
      { kind: 'alias', sourceId: 'wrn-media-source-local', targetId: 'wrn-media-source-second' },
      { kind: 'alias', sourceId: 'wrn-media-source-local', targetId: 'wrn-media-source-third' },
    ];
    expect(validateMobileMediaDocument('admission', admission)).toBe(false);
  });

  it.each([
    ['healthAt generatedAt equal', 'healthAt', 0, true],
    ['healthAt age 86400000ms', 'healthAt', -86400000, true],
    ['healthAt age 86400001ms', 'healthAt', -86400001, false],
    ['healthAt generatedAt +1ms', 'healthAt', 1, false],
    ['validFrom generatedAt equal', 'validFrom', 0, true],
    ['validFrom generatedAt +1ms', 'validFrom', 1, false],
  ] as const)(
    'R4-R2-02 applies source freshness to admission documents: %s',
    (_name, field, delta, expected) => {
      const admission = fixtureCandidate().documents.admission!;
      const generatedAt = Date.parse(String(admission.generatedAt));
      (admission.sources as Array<Record<string, unknown>>)[0]![field] = iso(generatedAt + delta);
      expect(validateMobileMediaDocument('admission', admission)).toBe(expected);
    },
  );

  it('R4-R1-05 keeps a release valid after 24 hours when source freshness was valid at generation', () => {
    const value = fixtureCandidate();
    const generatedAt = Date.parse(String(value.release.generatedAt));
    releaseTimes(value, generatedAt, generatedAt + 604800000);
    const source = (value.documents.admission!.sources as Array<Record<string, unknown>>)[0]!;
    source.healthAt = iso(generatedAt - 86400000);
    source.validFrom = iso(generatedAt);
    expect(
      validateMobileMediaCandidate(
        value.release,
        value.documents as never,
        undefined,
        () => generatedAt + 86400001,
      ),
    ).not.toBeNull();
  });

  it.each([
    ['admission validUntil minus one millisecond', fixedNow() - 1],
    ['admission validUntil equal', fixedNow()],
  ] as const)('R3 matrix 2 rejects %s', (_name, validUntil) => {
    const value = fixtureCandidate();
    for (const source of value.documents.admission!.sources as Array<Record<string, unknown>>)
      source.validUntil = iso(validUntil);
    expect(
      validateMobileMediaCandidate(value.release, value.documents as never, undefined, fixedNow),
    ).toBeNull();
  });

  it.each([
    ['rights expiresAt equal', fixedNow()],
    ['rights expiresAt minus one millisecond', fixedNow() - 1],
  ] as const)('R3 matrix 2 rejects %s', (_name, expiresAt) => {
    const value = fixtureCandidate();
    for (const right of value.documents.rights!.rights as Array<Record<string, unknown>>)
      right.expiresAt = iso(expiresAt);
    expect(
      validateMobileMediaCandidate(value.release, value.documents as never, undefined, fixedNow),
    ).toBeNull();
  });

  it('R3 matrix 3/5/6 rejects representative exact cap and block boundaries', () => {
    const manifest = fixtureCandidate().documents.manifest!;
    const assets = manifest.assets as Array<Record<string, unknown>>;
    assets.push(...Array.from({ length: mobileMediaCaps.assets }, () => ({ ...assets[0]! })));
    expect(validateMobileMediaDocument('manifest', manifest)).toBe(false);

    const assetOver = fixtureCandidate().documents.manifest!;
    (assetOver.assets as Array<Record<string, unknown>>)[0]!.bytes = mobileMediaCaps.audio + 1;
    expect(validateMobileMediaDocument('manifest', assetOver)).toBe(false);

    const safetyOver = fixtureCandidate().documents.revocation!;
    (safetyOver.references as unknown[]).push(
      ...Array.from({ length: mobileMediaCaps.safetyEntries + 1 }, () => ({
        kind: 'asset',
        id: 'wrn-media-asset-x',
      })),
    );
    expect(validateMobileMediaDocument('revocation', safetyOver)).toBe(false);

    const nonAssetHash = fixtureCandidate().documents.revocation!;
    (nonAssetHash.entries as unknown[]).push({
      targetKind: 'source',
      targetId: 'wrn-media-source-x',
      targetHash: '0'.repeat(64),
      status: 'blocked',
      replacementKind: null,
      replacementId: null,
    });
    expect(validateMobileMediaDocument('revocation', nonAssetHash)).toBe(false);
  });

  it.each(['release', ...mobileMediaDocumentClasses] as const)(
    'R3 matrix 3 applies the UTF-8 JSON raw-byte cap to %s at equal and +1',
    (kind) => {
      const cap = mobileMediaCaps.json;
      const equal = `${'€'.repeat(Math.floor(cap / 3))}${'x'.repeat(cap % 3)}`;
      expect(new TextEncoder().encode(equal).byteLength).toBe(cap);
      expect(hasMobileMediaJsonByteCap(equal)).toBe(true);
      expect(hasMobileMediaJsonByteCap(`${equal}x`)).toBe(false);
      expect(kind).toBeDefined();
    },
  );

  it('R3 matrix 3 applies the aggregate UTF-8 JSON-byte cap at equal and +1', () => {
    const equal = 'x'.repeat(mobileMediaCaps.totalJson);
    expect(hasMobileMediaJsonByteCap(equal, mobileMediaCaps.totalJson)).toBe(true);
    expect(hasMobileMediaJsonByteCap(`${equal}x`, mobileMediaCaps.totalJson)).toBe(false);
  });

  it('R3 matrix 3 applies the isolated safety UTF-8 byte cap at equal and +1', () => {
    const equal = 'x'.repeat(mobileMediaCaps.safetyBytes);
    expect(hasMobileMediaJsonByteCap(equal, mobileMediaCaps.safetyBytes)).toBe(true);
    expect(hasMobileMediaJsonByteCap(`${equal}x`, mobileMediaCaps.safetyBytes)).toBe(false);
  });

  it('R3 matrix 3 accepts the six release descriptors and rejects a seventh descriptor', () => {
    const release = fixtureCandidate().release;
    expect(validateMobileMediaRelease(release)).toBe(true);
    (release.documents as unknown[]).push((release.documents as unknown[])[0]);
    expect(validateMobileMediaRelease(release)).toBe(false);
  });

  it.each([
    ['audio bytes equal', 'wrn-media-asset-audio-local', 'bytes', mobileMediaCaps.audio, true],
    ['audio bytes +1', 'wrn-media-asset-audio-local', 'bytes', mobileMediaCaps.audio + 1, false],
    [
      'thumbnail bytes equal',
      'wrn-media-asset-thumbnail-local',
      'bytes',
      mobileMediaCaps.thumbnail,
      true,
    ],
    [
      'thumbnail bytes +1',
      'wrn-media-asset-thumbnail-local',
      'bytes',
      mobileMediaCaps.thumbnail + 1,
      false,
    ],
    [
      'transcript bytes equal',
      'wrn-media-asset-transcript-local',
      'bytes',
      mobileMediaCaps.transcript,
      true,
    ],
    [
      'transcript bytes +1',
      'wrn-media-asset-transcript-local',
      'bytes',
      mobileMediaCaps.transcript + 1,
      false,
    ],
  ] as const)('R3 matrix 3 asset literal %s', (_name, id, field, amount, expected) => {
    const manifest = fixtureCandidate().documents.manifest!;
    const asset = (manifest.assets as Array<Record<string, unknown>>).find(
      (item) => item.id === id,
    )!;
    asset[field] = amount;
    expectDocumentResult(validateMobileMediaDocument('manifest', manifest), expected);
  });

  it.each([
    ['thumbnail width equal with counteraxis one', 'width', mobileMediaCaps.dimensions, 1, true],
    ['thumbnail width +1', 'width', mobileMediaCaps.dimensions + 1, 1, false],
    ['thumbnail height equal with counteraxis one', 'height', mobileMediaCaps.dimensions, 1, true],
    ['thumbnail height +1', 'height', mobileMediaCaps.dimensions + 1, 1, false],
    [
      'thumbnail pixels maximum equal',
      'width',
      mobileMediaCaps.dimensions,
      mobileMediaCaps.dimensions,
      true,
    ],
  ] as const)('R3 matrix 3 %s', (_name, axis, value, opposite, expected) => {
    const manifest = fixtureCandidate().documents.manifest!;
    const thumbnail = (manifest.assets as Array<Record<string, unknown>>).find(
      (item) => item.id === 'wrn-media-asset-thumbnail-local',
    )!;
    thumbnail[axis] = value;
    thumbnail[axis === 'width' ? 'height' : 'width'] = opposite;
    expectDocumentResult(validateMobileMediaDocument('manifest', manifest), expected);
  });

  it('R3 matrix 3 proves the pixel +1 boundary is redundant with dimensions', () => {
    expect(mobileMediaCaps.pixels).toBe(mobileMediaCaps.dimensions ** 2);
    const manifest = fixtureCandidate().documents.manifest!;
    const thumbnail = (manifest.assets as Array<Record<string, unknown>>).find(
      (item) => item.id === 'wrn-media-asset-thumbnail-local',
    )!;
    thumbnail.width = mobileMediaCaps.dimensions;
    thumbnail.height = mobileMediaCaps.dimensions + 1;
    expect(validateMobileMediaDocument('manifest', manifest)).toBe(false);
  });

  it.each([
    ['source', 'wrn-media-source-local', null],
    ['series', 'wrn-media-series-local', null],
    ['episode', 'wrn-media-episode-local', null],
    [
      'asset',
      'wrn-media-asset-audio-local',
      'c726d333dd159a31423f3480dbb1c5c4a9dfcd30efe1f7e12ade390dc92e8908',
    ],
  ] as const)(
    'R3 matrix 6 admits each %s target only with its canonical hash shape',
    (kind, id, targetHash) => {
      for (const status of ['blocked', 'gone', 'replaced'] as const) {
        const revocation = fixtureCandidate().documents.revocation!;
        const replacementId = status === 'replaced' ? `wrn-media-${kind}-replacement` : null;
        if (replacementId !== null) {
          (revocation.references as Array<{ kind: string; id: string }>).push({
            kind,
            id: replacementId,
          });
          (revocation.references as Array<{ kind: string; id: string }>).sort((left, right) =>
            `${left.kind}\0${left.id}`.localeCompare(`${right.kind}\0${right.id}`),
          );
        }
        (revocation.entries as unknown[]).push({
          targetKind: kind,
          targetId: id,
          targetHash,
          status,
          replacementKind: status === 'replaced' ? kind : null,
          replacementId,
        });
        expect(validateMobileMediaDocument('revocation', revocation)).toBe(true);
      }
    },
  );

  it('R3 matrix 5 rejects safety missing/extra targets, replacement targets, cycles and count caps', () => {
    const missingTarget = fixtureCandidate().documents.revocation!;
    (missingTarget.entries as unknown[]).push({
      targetKind: 'asset',
      targetId: 'wrn-media-asset-missing-target',
      targetHash: '0'.repeat(64),
      status: 'blocked',
      replacementKind: null,
      replacementId: null,
    });
    expect(validateMobileMediaDocument('revocation', missingTarget)).toBe(false);

    const missingReplacement = fixtureCandidate().documents.revocation!;
    (missingReplacement.entries as unknown[]).push({
      targetKind: 'asset',
      targetId: 'wrn-media-asset-audio-local',
      targetHash: 'c726d333dd159a31423f3480dbb1c5c4a9dfcd30efe1f7e12ade390dc92e8908',
      status: 'replaced',
      replacementKind: 'asset',
      replacementId: 'wrn-media-asset-replacement',
    });
    expect(validateMobileMediaDocument('revocation', missingReplacement)).toBe(false);

    const cycle = fixtureCandidate().documents.revocation!;
    (cycle.entries as unknown[]).push(
      {
        targetKind: 'asset',
        targetId: 'wrn-media-asset-audio-local',
        targetHash: 'c726d333dd159a31423f3480dbb1c5c4a9dfcd30efe1f7e12ade390dc92e8908',
        status: 'replaced',
        replacementKind: 'asset',
        replacementId: 'wrn-media-asset-thumbnail-local',
      },
      {
        targetKind: 'asset',
        targetId: 'wrn-media-asset-thumbnail-local',
        targetHash: '65479503f1dc2208b5a90912e728e95c17daab9e041f3efe6df6d077c13219fd',
        status: 'replaced',
        replacementKind: 'asset',
        replacementId: 'wrn-media-asset-audio-local',
      },
    );
    expect(validateMobileMediaDocument('revocation', cycle)).toBe(false);

    const countCap = fixtureCandidate().documents.revocation!;
    for (let index = 0; index <= mobileMediaCaps.safetyEntries; index += 1)
      (countCap.entries as unknown[]).push({
        targetKind: 'asset',
        targetId: `wrn-media-asset-count-${index}`,
        targetHash: String(index % 10).repeat(64),
        status: 'blocked',
        replacementKind: null,
        replacementId: null,
      });
    expect(validateMobileMediaDocument('revocation', countCap)).toBe(false);
  });

  it('R3 matrix 3/5 proves the real safety-byte maximum and the coupled count redundancy', () => {
    const value = fixtureCandidate().documents.revocation!;
    const references = value.references as Array<{ kind: string; id: string }>;
    const entries = value.entries as Array<Record<string, unknown>>;
    let index = 0;
    for (;;) {
      const id = `wrn-media-asset-byte-${index}`;
      references.push({ kind: 'asset', id });
      entries.push({
        targetKind: 'asset',
        targetId: id,
        targetHash: String(index % 10).repeat(64),
        status: 'blocked',
        replacementKind: null,
        replacementId: null,
      });
      references.sort((left, right) =>
        `${left.kind}\0${left.id}`.localeCompare(`${right.kind}\0${right.id}`),
      );
      entries.sort((left, right) =>
        `${left.targetKind}\0${left.targetId}\0${left.targetHash}`.localeCompare(
          `${right.targetKind}\0${right.targetId}\0${right.targetHash}`,
        ),
      );
      if (new TextEncoder().encode(JSON.stringify(value)).byteLength > mobileMediaCaps.safetyBytes)
        break;
      index += 1;
    }
    expect(index).toBeLessThan(mobileMediaCaps.safetyEntries);
    expect(mobileMediaCaps.safetyBytes).toBeLessThan(mobileMediaCaps.safetyEntries * 256);
    expect(new TextEncoder().encode(JSON.stringify(value)).byteLength).toBeGreaterThan(
      mobileMediaCaps.safetyBytes,
    );
  });
});
