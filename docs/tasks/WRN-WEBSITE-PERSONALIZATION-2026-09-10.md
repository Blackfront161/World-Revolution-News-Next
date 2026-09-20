# Website For me parity

Parent RELEASE-COMPLETION, explicit PO completion request. Delegation: erlaubt
for independent QA only, no children. Root is sole product/test writer. Existing
Events/Media candidate and its browser remain separately gated. Root may prepare
new unimported files during independent directory QA; existing Mobile/Website
App/style/store adapters change only after that candidate closes independently.

Website following currently shows a migration placeholder. Mobile already offers
explicit local interests/regions/content languages, confirmed save/clear and
real production matches. Reuse this behavior through the source-only browser
library. No account, behavioral profiling, synchronization or remote preference
write. Both clients retain isolated localStorage keys and independent lifecycle.

## Exact scope

New shared packages/browser-content/src/local-personalization-state.ts,
local-personalization-ui.tsx and local-personalization-ui.css. Store is extracted
from apps/mobile/src/local-personalization-state.ts with one mandatory key
parameter; preserve authorization WeakMap, read/write verification, protected
unknown bytes, conflict epochs, one-use load receipts and dispose behavior.
Existing Mobile file becomes a thin signature/type-compatible adapter, unchanged
mobile key. New Website adapter apps/website/src/local-personalization-state.ts
owns wrn.website-local-personalization.v1. No migrations or reading-state writes.

Extract MobilePersonalizationHub/Dialog UI from apps/mobile/src/App.tsx: accept
copy, headingId/level/ref, store, loaded, onLoaded and rendered results. Keep
fixture article projection/rendering inside the Mobile wrapper, preserve old
Mobile tests and behavior. Shared UI uses exact supported domain preference
IDs and canonical createLocalPersonalizationState. An accessible native modal
confirmation returns focus after cleanup; no background interaction while open.
Guard stale save/clear receipts via unchanged store. Keep failed/corrupt values
preserved, explicit protected clear and reload messaging. Selection alone never
writes. All nine existing UI catalogs supply copy, content language unaffected.

New apps/website/src/local-personalization-ui.tsx owns its store lifecycle and
passes active saved preferences to the supplied real production results callback.
Website App adds following route; apps/website/src/production-content-ui.tsx
omits its extra H1 only for embedded results, preserving ordinary reader layout.
The shared packages/browser-content/src/production-content-ui.tsx factory gains
one optional embeddedCardHeadingLevel (3 or4, default4) dependency: Website
chooses3 beneath its H2 results, Mobile keeps4 beneath its H3 results. No other
reader semantics change; actual browser heading/Axe oracles cover both clients.
Allowed existing styles: apps/mobile/src/styles.css for removal of extracted
personalization blocks/import and apps/website/src/styles.css if needed for its
shell-specific spacing. No global brand token or other feature changes.

## Acceptance and files

New apps/website/src/local-personalization-state.test.ts validates key isolation,
cross-instance/consumed receipt rejection, conflict, malformed preservation and
explicit clear. New apps/website/src/local-personalization-ui.test.tsx verifies
save/clear confirmation, cancellation, empty selection, real preferences passed
to results and failure/reload. Existing Mobile personalization/App assertions stay.
New tests/e2e/website-personalization.spec.ts covers real article matches, reload,
unmatched selection, protected state, two-tab conflict, nine languages, keyboard,
320px/390px RU200/1440 and violet/dark/contrast. Actual same-origin client adapter
isolation test may extend tests/e2e/production-content-client-isolation.spec.ts
with explicit Website harness exports only if necessary; no deployment switch.
Both typechecks/builds, affected suites, boundaries and retained image hashes.
Independent Terra QA after source freeze, no self-approval.

The native dialog requires a local jsdom showModal/close shim in the existing
apps/mobile/src/App.test.tsx, restored after each test, as already used by the
production-reader tests. Root owns this exact test path for that environment
adapter only; existing behavioral assertions remain unchanged.

Root owns named files plus own matching evidence/handoff/source/image manifests,
PROJECT-STATE and delegation register. No dependencies, installs, data contract
changes, provider writes, signing/version bump or publication. Reversible local
candidate, old unknown bytes remain intact. No PO visual acceptance inferred.
END-CHECK: :)
