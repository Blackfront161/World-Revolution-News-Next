# Real Events/Media metadata — deterministic data slice

Parent RELEASE-COMPLETION and completed read-only EVENTS-MEDIA-INVENTORY.
Delegation: erlaubt, existing Terra production_mobile_b1, Slot1 reserved by
Root after reading rights return. No children/browser/index/Website build rights.
This is disjoint from the frozen B2 reader and its two independent reviewers.

## Exact writer scope

- New packages/content-contracts/src/directory/production-events-media-v1.ts
  and tests/directory/production-events-media-v1.test.ts.
- Add exactly its new public subpath export in content-contracts/package.json;
  no root index, existing contracts or dependencies.
- New tools/directory/import-production-events-media.mjs and its .test.mjs.
- New generated apps/mobile/src/features/events-media/data/
  production-events-media-v1.json and identical Website sibling; no app route,
  UI, language-copy, build, offline-shell or B2-source edits.
- Own evidence/handoff WRN-PRODUCTION-EVENTS-MEDIA-DATA-2026-09-10.md, exact
  input/output pins and rejection/reconciliation manifest alongside evidence.

## Inputs and output

Read Source-of-Truth first. Only bound old Website checkout
C:/Users/patri/Documents/World Revolution News/wrn-web-portal-2026-08-20-r10n-work,
commit9a59b17cc9b3a6a7b7541c2e64862af208d02ace. Exact SHA256 pins in
WRN-WEBSITE-EVENTS-MEDIA-INVENTORY evidence: events.json, video-feed.json,
podcasts.json, podcast-sources.json. events-feed is a subset, editorial seed
and generated audio are not imported. Input events is11,568,814bytes, so bound
16MiB input before read/parse; other input limits also explicit. No source writes.

Pure versioned strict metadata-only contract: shared snapshot provenance records
repo/commit/path/exact input hash, observation date and historical status;
per row input provenance reference and original source row indices (dedup retains
all observations/counts). Separate events, videos, podcast episodes and sources
collections. Stable deterministic IDs from safe canonical original URL and
kind using full SHA256. Reuse existing normaliseDirectoryUrl/directoryPlainText
where they match; no duplicated weaker URL policy. HTTP metadata stays visible
but is not an actionable link. No invented HTTPS upgrade, no private/IP URL.

Project only title, supplied source name/ID, original URL, exact original
language or und, published/start/end instants, supplied timezone/country/city,
and useful bounded metadata. No prose descriptions, HTML, artwork, coordinates,
audio/media/embed URLs, excerpts, publisher license claims or binary files.
Strip no unexplained content silently: invalid rows counted with exact source
index and reason. Dates must have explicit zone, canonicalized with source value
retained where needed; malformed/ambiguous dates never silently treated as UTC.
Public date metadata is not current availability/cancellation verification.

Deduplicate episode original URLs deterministically, with explicit observation
count and conflicting-language review.27existing languageReviewRequired rows
must not acquire a verified language. Preserve recorded language plus review
flag or expose und with retained source observation; never derive article
language from the UI. Video old availability OK is only old observation and
must not be presented as freshly checked. No arbitrary ideological classification.

Bound output max4MiB; aim compact provenance references to avoid repetitive
per-row hashes. Collections bounded (events6000, episodes1000, videos100,
sources100). Exact ID/URL/set/count reconciliation and no silent truncation;
reject whole invalid/oversize input before writing. Existing target never
overwritten by the importer; output to explicit absent paths, deterministic
across input order where identity semantics require, no current-clock dependency.

## Acceptance and handback

Reconcile5630event input,13videos,908episode rows/875raw URLs,52sources against
actual accepted/dedup/rejected output; these are not forced acceptance counts.
Tests meaningful malformed URLs/dates/text, source mismatch/hash failure,
uncertain language, duplicate identity observations, byte cap and deterministic
output. Real generation twice to fresh evidence outputs, compare byte hashes;
install neither dependencies nor runtimes. Contract and builder tests, scoped
type/format/lint/boundary checks. B2 source pins remain exact.

Return coherent data contract/generated output and evidence, not a claim that
Events/Media are already in either UI or that media playback is implemented.
Root will bind UI/cache integration after this slice and frozen B2 QA.

END-CHECK: :)

## Chief correction after first preserved candidate

Same worker/file scope, no UI/Browser. Root found concrete completion gaps:
record collections expose Record<string,unknown> instead of typed records;
URL/plain text policy is copied despite the explicit reuse requirement;
instant validation accepts rolled-over calendar dates; reconciliation accepts
an arbitrary object; provenance refs are not collection-bound and row bounds,
snapshot ref/path uniqueness and original/canonical date equality are incomplete.
Episode sourceId cannot join sources because the original source.id was dropped.
Fix these with typed records, the existing shared URL/text validators, one strict
zoned date normalizer used by builder and contract, and exact count/index/ref
and source reconciliation. Preserve uncertain language observations and validate
that the display language/review flag agrees with them. Reconcile every input
row once as an accepted observation or indexed rejection; reject out-of-range,
duplicate observations/rejections and tampered counts. Keep all existing tests.

The3,813,078-byte output plus current Website shell leaves only17,723bytes under
8MiB before Website reader code. Reduce duplicated serialized values without
dropping provenance: canonicalUrl may be omitted only when identical to the
original canonical form, otherwise retain it explicitly. Export one typed
canonical URL accessor; stable IDs remain derived from canonical URLs. Preserve
all original URLs and dates, never raise shell/output caps to mask the issue.
Aim below3.4MiB and report actual bytes; do not make arbitrary cuts to source data.

Remove the pure builder's implicit claim of the real pinned input hashes for
arbitrary supplied objects: require explicit hashes or compute actual supplied
serialization hashes. The production CLI still verifies all four exact raw pins
before parse/projection; test a valid-format wrong hash through readPinnedJson,
existing-output byte preservation and actual byte limits, not only malformed
hash text or an empty invalid object. No new fabricated admission assertion.

Generate corrected data twice to new absent generation-c/d evidence paths,
compare hashes and only then replace the two generated app siblings. Preserve
generation-a/b and initial reconciliation evidence; add correction reconciliation
and report the exact before/after counts, rejected reason breakdown and hashes.
No silent overwrite of existing evidence or importer existing-target semantics.
Return after focused contract/builder/types/static/boundary tests and B2 pin
protection, then Root integrates and separately reviews before UI use.
# Chief continuation after incomplete data writer return

The existing Slot1 writer returned its source-ID fix and typed interfaces, but
not the appended reconciliation/policy-reuse/negative-test acceptance. Its
rights are returned. After this disposition commit Root alone completes the
same exact files and tests; no overlapping data writer. Preserve generations
A–F and the existing WIP; no validator weakening or schema relabeling as GREEN.
Latest E/F is3,317,607bytes, SHA256
35dfbb28e7c7c4be45b8a1c7b14aaeaaa6a2c79e506467154d20601d10e2e5c1;
51accepted source records plus an indexed missing-ID rejection. No whole data
acceptance follows from the three existing importer tests and typecheck.
