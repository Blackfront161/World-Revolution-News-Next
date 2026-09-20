# Production update source completion

Parent RELEASE-COMPLETION and conditional DELIVERY-DESIGN. Root sole client
writer. Delegation: erlaubt for Slot2 narrow design clarification and subsequent
independent source review; no children. Slot3 currently owns Website QA/browser;
Root may prepare own documents/scripts now, modify client source only after
that snapshot closes. Slot1 owns only disjoint delivery tools.

Goal: Android's bundled pilot bootstrap is followed by genuine manual updates
from fixed https://solinaridao.com/wrn-production-content/current.json. Website
retains same-origin delivery and its independent store. No live request or
deployment is needed to implement/test transport with intercepted responses.

Root confirms the design source choice can use store.snapshot's atomic checked
control/bundle result before prepareRecheck. Its generation/clearEpoch optimistic
transaction rejects a changed selection before transport. Virgin means exactly
the canonical empty control (generation0,clearEpoch0,all keys/pending/times null,
floor0,acceptedIdentities empty,safety revision0/revocations empty) and no bundles.
Source is captured once for both phases. After any attempt/generation or Clear,
bundled bootstrap is forbidden, including after remount. No fallback between
safety/payload, no polling. Explicit legacy verifySafety/completeRelease injection
continues to use that explicit pair without implicit Mobile sources; this is a
code dependency seam, never query/storage/provider-controlled configuration.

## Necessary clarification of conditional design

Existing store.finishRecheck('unverified') deliberately clears
lastSuccessfulSourceCheckAt. Therefore the earlier proposal 'finish then project'
cannot preserve an active body: project denies the missing global check time.
Do not weaken that established outcome or relabel unverified as safety-verified.
Proposed narrow additional internal outcome `unverified-preserve-check-time`
retains only the previous lastSuccessfulSourceCheckAt, clears pending and advances
lastObservedAt as before; it grants no new checkedAt or TTL. Controller uses it
only when the captured source is exactly the configured refreshSource; bootstrap
and legacy pairs retain the old unverified outcome. Its project still checks
active.checkedAt24h, clock regression, current cumulative safety and same
generation. Existing legacy unverified behavior and tests stay unchanged.
Website adapter explicitly supplies same-origin Source to share this refresh
behavior; Mobile supplies fixed remote plus virgin-only bundled source.

Slot2 read-only Sol must check this exact clarification against store/controller
code and give one concrete answer in matching UPDATE-SOURCE-DESIGN reports.
No new general architecture cycle. Root holds these dependent source writes
until the clarification is resolved and Website QA returns.

## Exact source/test scope after both gates

Shared packages/browser-content/src/content-release-transport-core.ts,
production-content-release.ts, production-content-offline-controller.ts,
production-content-offline-store.ts (only additional finish outcome).
Existing apps/mobile/src/production-content-offline-controller.ts,
content-release-transport-core.test.ts, production-content-offline-controller.test.ts;
apps/website/src/production-content-offline-controller.ts. New Mobile
production-content-delivery-profile.ts/.test.ts and production-content-release.test.ts.
New tests/e2e/production-update-source.spec.ts plus existing
tests/e2e/production-content-offline-harness.ts only for explicit same-origin
test exports when actual IDB proves necessary. Own evidence/handoff/manifests,
PROJECT-STATE/register. No UI/store-schema/fixture/data changes.

Transport extracts one common bounded response reader, retains old relative
URL guard and5s/abort/MIME/bytes/UTF8/JSON/error semantics. New trusted-origin
factory accepts canonical HTTPS origin at construction, rejects userinfo,
query, fragment, path and non-HTTPS origins; only /wrn-production-content/
relative paths, no dot/encoded segments, query/fragment/foreign origin. Mobile
passes only compiled solinaridao.com. Credentials omit, referrer none, cache
no-store, redirects error. Existing relative Website paths remain unchanged.
Factory source closes over transport for both phases; keeps old public functions
with optional transport or equivalent signature-preserving wrappers.

Tests: actual bundled first8URLs then higher-sequence remote8URLs, remount uses
remote, higher/colliding/lower identities and Clear floor retained; first-phase
failed remote preserves unexpired active identity/bytes/expiry. Preserve the
existing inclusive24h boundary: equality is allowed, +1ms and backwards clock
block. Verified revocation before later payload failure still
removes affected body. Stop before payload if safety write fails. Concurrent
Clear/stale snapshot/late timeout cannot use bootstrap or save. Unknown/corrupt
storage preserved. No external request escapes browser interception. Same-origin
Website and Mobile databases/reading remain isolated. Test URL/mime/byte/UTF8,
timeout/dispose and no source switching with meaningful distinct packets.
Both types/builds, affected full suites, scoped static and IDB/runtime evidence;
independent review required. No deployment, installation, signing/version or
PO visual acceptance. Fixed endpoint may still be absent until authorized deploy.
END-CHECK: :)

Runtime test seam clarification: existing production-content-offline-store.spec.ts
and production-content-ui.spec.ts intercept only relative resource strings.
The new compiled remote source requires their same authored packet interceptor
to normalize exactly https://solinaridao.com/wrn-production-content/ to the
existing relative key. These two test files are additionally in scope solely
for that narrow transport mapping; assertions and old safety oracles stay intact.
New source tests independently assert the actual origin and no external escape.
