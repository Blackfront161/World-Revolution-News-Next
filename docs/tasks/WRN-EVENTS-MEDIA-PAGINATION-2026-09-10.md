# Narrow pagination completion after independent diagnostic

Parent RELEASE-COMPLETION / Events UI. Root sole writer; delegation allowed
only for independent narrow QA, no children. Candidate0ed9a04 independently
passes Slot3 UI/runtime QA and Slot2 protocol checks, but Sol's additional
Mobile full run observes536/537: Show-more expects60, sees30 at UItest134.
Root identifies a post-render pagination reset effect keyed by newly loaded
data/filter/mode. A page increment issued before that pending reset can be lost.
Do not hide this diagnostic behind otherwise passing runs or longer timeouts.

Root may change exactly packages/browser-content/src/events-media-directory.tsx
and apps/mobile/src/features/events-media/production-events-media-ui.test.tsx,
plus own matching PAGINATION evidence/handoff and PROJECT-STATE/register.
For the required immediate-click browser oracle, Root additionally owns only
tests/e2e/production-events-media.spec.ts (two new cases; retain all old cases).
No loader/model/copy/protocol/data/store/reader/App changes. Bind pagination to
the current memoized data/mode/section/filter identity during render. Identity
change displays30 immediately; current-identity increments use a functional
state update. No passive effect may reset a valid current click. Keep consent
reset semantics unchanged. Language-only change preserves page extent.

Retain original real-data pagination oracle. Add actual loaded-directory mode,
section, replacement-data and language transitions proving reset/retention and
subsequent increment; do not mock the implementation/effect or weaken timeout.
Run focused cases repeatedly and full537+new Mobile; both types/builds/scoped
static. Real two-client events pagination/source cases plus RU200/CSS are already
covered: rerun the two actual Events and two actual Media cases, add exact test
with immediate first available Show-more click through its final60 count.
Retain fresh output/images only; original0ed9a04 evidence stays untouched.
Independent existing Slot3 Terra closes the tiny delta with own two matching
PAGINATION-INDEPENDENT-QA reports and fresh probes. Slot2 finishes original
protocol report; no new architectural round for this UI-state correction.
No install/signing/version/publication or PO visual acceptance.
END-CHECK: :)
