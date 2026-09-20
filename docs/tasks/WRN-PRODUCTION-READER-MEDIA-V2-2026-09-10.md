# Production reader media V2

Parent: WRN-REQUIREMENTS-AND-DEVICE-COMPLETION-2026-09-10; PO authorizes missing
article images and full original additions. Chief accepts corrected independent
PRODUCTION-IMAGES-DESIGN: explicit V2 dispatch, unchanged V1 acceptance rules,
inline bounded image bytes inside the versioned JSON release. Existing
article/release safety governs image visibility; no independent revocation
ledger, no hotlinks, no new provider or deployment.

## Stage1: reusable image block contract

- Root owns integration/native/evidence. Delegation: erlaubt, one direct writer
  in Slot1 (Terra regular implementation; single attempt after prior limits,
  inherited fallback if unavailable). Slot2 existing independent reviewer later
  reviews candidate; no children. Register WRN-G3-021-DELEGATION-REGISTER.
- Writer owns ONLY NEW packages/content-contracts/src/production-reader-media-v2.ts
  and packages/content-contracts/tests/production-reader-media-v2.test.ts.
  No index/old V1/fixtures/package/dependency/client/IDB/file-export edits.
- New block: kind=image, mediaId stable wrn-media- +32lowercaseSHA256(originalURL),
  sourceUrl HTTPS, sourcePageUrl HTTPS, sourceSnapshotSha256, mime image/png or
  image/jpeg, byteLength, width, height, sha256, base64, altText, altLanguage,
  altTextProvenance='original-source'|'editorial', attribution, licenseId,
  licenseUrl, evidenceUrl, checkedAt UTC, thirdPartyMaterialReviewed:true.
- Exact keys, nonempty bounded text, safeHTTPS, no SVG/remote rendering fields.
  Per image256KiB, dimensions1..2048,pixels<=4194304. Decode bounded canonical
  base64 and check magic/header dimensions for PNG/JPEG and raw-byte SHA256.
  Reject malformed/truncated headers, mismatch, unsafe links, HTML text, invalid
  IDs/hashes; source identity is based on canonicalURL string, not image bytes.
- Exports named ProductionReaderImageBlockV2, productionReaderMediaLimitsV2,
  validateProductionReaderImageBlockV2(unknown):Promise<boolean>,
  decodeProductionReaderImageBytesV2(unknown):Uint8Array|null (structural only,
  never implies admission). No DOM/node-only dependency or network/filesystem.
- Use existing safe core utilities/type-only imports. Avoid runtime cycles;
  module also must execute with Node24 native TypeScript for local builder.

## Acceptance and follow-through

Meaningful positive PNG/JPEG cases; mutated bytes/hash/length/dimension/MIME,
overlimit, malformedbase64/truncatedheader, exactkey, unsafeURLs, emptyalt and
incorrectstableID reject. Unit/contract type/lint/format pass. Preserve every
existing V1 test assertion. Same new file boundary, evidence/handoff inline is
allowed then Root saves it. No broad testing/child delegation/retry loops.

Root binds later integration paths after Stage1: explicit V2 descriptor/manifest
dispatch, strict compatibility, unchanged monotone safety/atomicIDB/4MiB and
12MiB quotas, builder and admitted image packet, both shared readers/BlobURL
cleanup, CSP and offline bothclients/screenshots. Stage1 alone is not image
feature completion. Do not claim root old artifact image support.

New input assets live only in image admission evidence; original content/data
and unsignedAPK remain preserved. Freshrelease seq>1, immutable priorrevision.
No versionCode, productionkey, deployment, paid API, install or artifact deletion.
Handoff includes files/tests/openrisks and END-CHECK: :).

## Stage2: Chief integration contract (independent design conditions bound)

Root alone owns new release-v2.ts, production-content-compatible.ts and
production-content-offline-compatible.ts in packages/content-contracts/src,
their matching tests and package.json/index export declarations. Stage1 writer
retains its two files exclusively. Existing V1 validators/schemas remain byte
unchanged. V2 descriptor/manifest are explicitly2.0.0/.v2; only readerDetails
uses a V2 document. Other V1 documents keep their own genuine schema/version.

Validate original V2 resource hashes/bytes/record counts, exact structures,
component/revision bindings and admittedContentSHA(article+originalV2detail).
Images additionally bind sourcePageUrl to article.originalUrl and snapshot to
the article admission, with at most8images/article and32/release. Then derive
an ephemeral V1 text projection solely to reuse unchanged V1 full validation:
remove validated image blocks, switch reader schema/version, recompute only
internal admission and component/manifest/descriptor hashes. Never expose or
persist the projection. ReadyV2 retains original immutable V2 objects/digests.
Private WeakMap may retain validation-only V1 proof for synchronous lifecycle
and share projection; only resolution/share outputs leave it.

Phase1 safety checks original V2 descriptor/manifest/lifecycle identities;
image bytes must NOT be fetched before durable safety commits. This explicitly
resolves the review's over-broad 'image bindings before Safety' phrasing:
phase1 binds declared reader hash, phase2 validates actual image bytes. A local
structural V1 metadata conversion reuses lifecycle/safety checks only after
original hashes match. Receipts always contain original V2 metadata. Bundle
formatV2 is distinct; controlformat, DB schema, durable safety and sequencefloor
stay unchanged. Generic dispatch supports actualV1 andV2 without coercingV1.

Later Root integration scope: existing shared production-content-release,
production-content-offline-profile/store/controller, production-content-view,
production-reader-blocks, production-content-ui/css; client type adapter seams;
new V2 builder/tool tests and fresh admitted release directories (bothclients)
plus current.json pointers only after contract tests. Website productionbuild,
staging/package validators and CSP declarations only as needed to preserve
existing closure/headers with verified blob images. No fixture expectation
weakening. Native SystemBars fix remains separate follow-up, not mixed here.

Tests bind unmodifiedV1 acceptance/rejection, originalV2 tamper/resource/bytes/
article-snapshot/admission hashes, malformed extra fields, projection nonescape,
V2 atomic offline serialize/reopen, phase1beforepayloads, preserved safety on
failedpayload, rollback/clearfloor, rendererposition/blobcleanup and bothclients.
Independent reviewer delivery_correction_review closes candidate before release
claims. Final image feature includes live local preview and saved screenshot.

Builder implementation precision: reuse existing generic
tools/build-production-content-release.mjs with explicit build-input.v1/v2
dispatch, preserving V1 byte output and filesystem rules; add focused tests in
tools/build-production-content-release-v2.test.mjs. This replaces the proposed
duplicate V2 writer tool. Website adapters may use the same generic release
dispatcher while retaining own publication/closure contracts.

Integration test paths: apps/mobile/src/production-reader-blocks.test.tsx;
new tests/e2e/production-reader-images-v2.spec.ts; Root image evidence scripts,
screenshots and manifests. Static Website landings embed only the already
admitted canonical PNG/JPEG bytes as data URLs (existing CSP already allows
data images); interactive clients use scoped Blob URLs. No remote image hosts
or additional allowed frame/media/connect origins. This explicitly replaces
the earlier overly broad 'no data anywhere' design wording, preserving the
preexisting site favicon/data allowance and avoiding extra asset routes.

Integration precision: root package.json standard tests include both builder
generations. Existing production-website-content.spec.ts network assertion
counts real HTTP(S) origins; local data/Blob URLs are not provider requests.
Existing license focus tests keep their exact article-license name; image
license accessible name includes its attribution to distinguish the controls.
