# Mobile production integration: narrow profile design check

Parent release completion; Delegation: erlaubt. This document requests a
bounded read-only precheck AFTER native closure; no new runtime writes yet.
Root will reserve the same Sol reviewer only after its current job ends.
Core writer is correcting four findings. StageB implementation may start only
after those are independently closed. No new package/dependency/provider.

## Proposed implementation cut

Retain all fixture-v1 APIs, IDs and bytes. The existing Mobile IDB/store and
controller should each have ONE mechanics implementation parameterized by a
small typed profile, with current v1 wrapper/default behavior unchanged in its
tests. Add a production profile and a separate DB, not a union-cast pretending
Production documents are LocalContentReleaseReady. Keep controller ordering,
abort/operation/clear fences, transaction timeouts,3slots/TTL/quota, cumulative
safety and previous-only rollback from the existing tested implementation.

Required profile differences: fixed DB name; typed initial/validate control;
create/validate bundle; safety initial/merge/equality/floor projection;
descriptor/docs/Ready/runtime conversion; and candidate eligibility by strictly
higher descriptor.sequence than active. Same revision with another hash is
rejected; restored bundles are validated against current monotonic safety.
Fixture profile performs its unchanged revision checks, not a fake sequence.
Production safety {revision,revokedIds} is not fixture {floor,entries}; conversions
must never pass production IDs through fixture validators. The UI guard may
consume a neutral time/generation/floor projection, not fictitious fixture data.

The production offline contract belongs to content-contracts and is pure:
new production-content-offline-v1.ts, with own format string, exact control,
bundle and safety functions, original24h TTL/4MiB bundle/12MiB total/3slots
bounds. A partial safety-evidence API must validate pinned descriptor, manifest
and archive revocation component before later Reader/Discover failures so a
valid newer revocation cannot be lost. No mutable Ready references are exposed.
Clients use existing frozen production core, with no WebsitePublication fetch.

Transport stays local same-origin: fixed /wrn-content-release/v1/current.json,
exact pointer fields/revision/sequence/hash, derived immutable descriptor and
five core resource paths. Never fetch path/URL supplied by article metadata.
Use current bounded stream/MIME/timeout/abort mechanics; snapshot+hash checks.
No GitHub/raw-main polling, source scrape, external provider or claimed automatic
live feed from this first bundled2-article pilot.

Mobile own Reading-v2 localStorage key is wrn.mobile-production-reading-state.v2.
Old v1 bytes and DB stay untouched. Catch the explicit reconcile capacity
conflict without replacing stored state; distinguish readonly/incompatible and
write failure. App fixtures keep explicit loader/initialState injection; default
content uses production runtime. Use one shared block rendering path for main
and archive reader, with source authors/license/changes/completeness/original
link. No cast to LocalArticle and no parallel duplicate article reader. Existing
Reader-v2 media sidecar remains bound only to its fixture contract and must not
be forged for real articles. Production save/read/position and clear need real
typed reducers/projection; source opening remains explicit.

## Intended implementation paths

Shared: new production offline contract/tests and additive content-contracts
index/subpath export; production domain reader/projection helpers and tests.
Mobile: existing local-content-release,content-offline-store/controller/ui,
local-reading-state and tests; new narrowly named profile/core helpers and
tests alongside them; App.tsx/App.test.tsx and one local shared block component
if extraction is cleaner. Additive production copy module only after Website
writer releases ui-language/package.json. Generated public/wrn-content-release
artifacts come only from the separate pinned input/builder, never hand-edit.
Own browser tests/evidence/handoff and current old pins. Website remains OUT.

## Precheck deliverable and limits

One bounded pass to identify actual type/semantic seams, approve or correct this
cut, name exact helper files and minimal tests. Especially evaluate: profile
inference without unsafe casts, partial safety validation and candidate sequence
vs controlled rollback. Do not redesign the complete platform or spend another
round re-inventorying all App views. If this seam is unnecessarily broad, state
a demonstrably smaller implementation preserving the same behavior and tests.
Own only new evidence/handoff WRN-PRODUCTION-MOBILE-STAGE-B-DESIGN-2026-09-10.
No product/test/index/Browser/native/dependency writes or children.

Required acceptance: old fixture suite unchanged; real-ID reader with all4block
kinds and honest attribution; v2 save/position/reload with byte-preservedv1;
higher/lower/equal sequence, same-revision hash conflict; staged/active/previous
revocation; partial failure safety; timeout/abort/stale/clear/quota; network-off
restart and TTL/clock regression; main/archive safe-link and accessibility.
