# B2: admitted articles, production reading state and visible reader

Parent RELEASE-COMPLETION; approved Stage-B design acceptance6–7 applies.
Starts only after B1 R1 independent Terra and Sol GREEN. No additional architecture
round: the following additions make the existing approved UI cut concrete.
Root reserves implementation/browser after both reviewers return. Delegation:
erlaubt, one bounded existing Terra worker for reading persistence only, on an
explicit later dispatch. No children, at most two disjoint writers. Root owns
integration; shared B1 source remains frozen.

Root scope: new apps/mobile/src/production-content-view.ts/test,
production-reader-blocks.tsx/test, production-content-ui.tsx/test and adjacent
production-content-ui.css. Existing content-offline-ui.ts/test may extract the
private inferred session/hook mechanics while preserving fixture exports.
App.tsx/App.test.tsx integrate the separate concrete production component into
the existing brand/navigation/history/support-draft shell. Main/archive use one
four-kind block renderer and the existing validated lifecycle/share contracts.
Production metadata is never cast to fixture LocalArticle/Ready. Additive
integration seam: production-content-offline-controller.ts and its test expose
expiresAt from the actual active bundle checkedAt plus the existing24h TTL;
inactive results expose null. UI must not use the newer global source time after
rollback or bypass the controller by reading IDB. No store/transport/guard change.

Reading worker scope: apps/mobile/src/production-reading-state.ts/test; additive
pure removal/unread/progress-reset/clear helpers in packages/domain/src/
production-reading-state-v2.ts and its existing tests only. Existing domain root
wildcard export suffices. Never touch old reading-v1 module/key or fixtures.
Own storage key wrn.mobile-production-reading-state.v2, ready/read-only/
write-failed/capacity-conflict results, invalid storage unchanged. Reconciliation
retains both valid replicas and existing bytes on capacity conflict. Explicit
mutations read the latest valid stored state; no invented localStorage CAS or
automatic union resurrecting removed bookmarks. No eviction/trimming.

Shared copy: additive packages/ui-language/src/production-content.ts with nine
registered languages, index/package export and dedicated tests. Existing copy
may be reused where semantics match; original article language stays explicit.
Attribution includes source/authors/date/language/full-or-partial/license and
transformation/reference; original/license opening requires accessible explicit
confirmation. No provider calls, embeds or inferred translations.

Default App activates production. Explicit initialState/loader continues static
fixture injection. Add contentMode='fixture-offline' only for explicit component
injection into existing offline acceptance harness; there is no query-string,
storage or deployed environment switch. tests/e2e/global-setup.ts may inject
that prop in the43173 test-only entry transform, preserving every old test
assertion and real fixture store. New43177 production server receives untouched
main entry. Add tests/e2e/production-content-ui.spec.ts and authored harness data
only as needed; existing fixture modules/pins/bytes remain unchanged.

The separately admitted generated-core-e8506a4 two-EFF packet is copied byte-
identically into apps/mobile/public/wrn-production-content (current plus seven
immutable files). Bind all input/output hashes. No raw feed, remote polling or
fulltext beyond those two admitted articles. Bootstrap may check once only on
pristine empty control; clear/failed/expired states require explicit refresh.
Guard restore on route/history/resume/focus/visibility and TTL, hide stale body
and pending external links when authority changes. Controller remains sole
content authority; latest safety overlays lifecycle without mutating Ready proof.

Production home/discover/saved/main/archive and offline controls use the real
content area. Existing knowledge/help/solidarity/directory/brand navigation stay
in the same shell. Following must not expose fixture news as real production;
connect existing neutral preferences if their contract permits, otherwise bind
the remaining concrete preference adapter separately before release. Media and
event real-metadata migration remains the next separate parity slice.

Required evidence: read/save/read-marker/progress/reload with real IDs; v1 key
never accessed or changed; corrupt v2/write failure/capacity conflict retained;
safe original/license confirmation; canonical share/alias/gone/revoked no-body;
four block kinds/heading/list/quote semantics in both readers; actual default
production Chrome, restart/TTL guards and smoke of unchanged explicit fixture
path. DE/EN/RU,320/390 desktop, RU200%, both themes, keyboard/dialog/Axe screenshots
in fresh outputs and durable hashmanifest. Types/build/static/focused and full
Mobile appropriate regression; independent Terra visual QA and Sol content/
storage review on frozen candidate before Website reuse/final package.

No install/sign/version/push/deploy/device action. No PO visual GREEN invented.
Own B2 evidence/handoff/pins and PROJECT-STATE/register updates allowed.

Start disposition after6741ed6 independently GREEN: Root owns all UI/copy/
entry/controller additions and browser. Slot1 existing production_mobile_b1
owns only the four reading paths and own B2-READING evidence/handoff. No export
index edits needed. Root may add a new authored test-data helper under Mobile
src for unit tests (no publisher prose), plus explicit all-four-block browser
fixtures. Real pilot has paragraph and heading only; quotes/lists are tested
with authored input, never inserted into publisher content. Following may reuse
existing neutral preference controls via a ReactNode results slot in App; its
production results use actual topic/region/language matching without casts.

Concrete real-packet integration correction: the approved generator emits the
descriptorPath relative to /wrn-production-content/current.json, while B1's path
helper accepts only an absolute app path. The first actual default-UI browser
run fails all3cases after current.json200 and before descriptor fetch. Add exact
packages/content-contracts/src/production-content-offline-v1.ts and its existing
test to B2 scope: accept the exact canonical relative revision/descriptor name
and retain the exact existing absolute equivalent, derive one fixed same-origin
absolute path. No arbitrary relative paths, traversal, URL, query or extra file.
Generator/admitted packet bytes stay unchanged. Add distinguishing path oracle,
retain all old negatives and rerun real production UI/contract tests. This is
a concrete producer/consumer bug fix within the existing unshipped v1 contract.
