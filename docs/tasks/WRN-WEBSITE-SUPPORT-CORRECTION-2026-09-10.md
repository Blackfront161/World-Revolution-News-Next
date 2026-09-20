# Website support correction after independent QA

Parent: full release completion; candidate9a86e5a. Independent report
`WRN-WEBSITE-KNOWLEDGE-SUPPORT-INDEPENDENT-QA-2026-09-10.md` binds four
concrete Medium findings. Chief accepts them. Delegation allowed to the same
direct `website_knowledge_support` Terra/high in Slot3; no children/index.
Corewriter Slot1 remains disjoint. Root freezes its native brand resource WIP
and does only read-only review/evidence while these two product writers run.
Browser43173–75 assigned exclusively to this correction writer; keep43176.

## Exact correction scope

- Existing Website Knowledge/Support feature TSX, CSS and tests, plus a new
  Website navigation-guard helper/test if needed in `features/support/`.
- `apps/website/src/App.tsx` only guarded navigation/history integration;
  `App.test.tsx` and `tests/e2e/website-knowledge-support.spec.ts` only effective
  new negative/positive oracles. No existing assertion weakened.
- For complete shared UI localization, extract the existing proven nine-language
  `apps/mobile/src/features/support/support-copy.ts` dictionary unchanged into
  new `packages/ui-language/src/support-copy.ts`, export via package.json
  subpath `./support`, and turn the original Mobile file into a typed re-export.
  Add only needed Website-specific copy keys with all nine translations;
  preserve existing Mobile copy/semantics and its copy tests. New shared copy
  tests allowed. No Mobile components, data, styles or App changes.
- Own evidence `docs/evidence/WRN-WEBSITE-SUPPORT-CORRECTION-2026-09-10.md`,
  matching handoff and new named screenshot/hash folder.

Do not alter either pinned JSON, content/domain contracts, loader format,
offline builder, or native resource WIP. You are not alone in this checkout.

## Four required outcomes

M-001: All feature UI including aria-labels, filter/status/error labels,
letter fields/actions and Knowledge's results landmark uses the current UI
language. Source text stays in its actual language (e.g. German historical
descriptions carry lang=de), not falsely translated by changing an ancestor.
Reuse the nine-language SupportCopy; don't default feature UI to English.

M-002: Dirty draft navigation through site links, browser Back/Forward or hash
change offers continue editing or explicit discard-and-continue, preserving the
original pending destination and draft while cancelled. Use one Website guard;
do not copy/import Mobile router code. Beforeunload remains guarded. Existing
candidate draft-key bytes are preserved except after explicit discard; do not
silently delete user drafts or change their storage format in this correction.

M-003: Recheck the current source/contact safety on actual contact activation.
A deadline passed after rendering must prevent navigation and display the
localized reason. Reproject on relevant deadline/visibility events; a timer
alone is not a click-time oracle. Reuse the shared support projector safety API.

M-004: Use a real modal dialog with initial focus on continue editing, trapped
tab order, Escape/cancel behavior and focus return to the correct trigger or
destination after completion. Screen-reader aria-modal alone is insufficient.

## Evidence and return

Each finding needs an oracle that fails on9a86e5a (existing English labels,
unprompted route escape, expired contact navigation, focus/Escape failure) and
passes after the correction. Pin9a client code in a temporary isolated reference
if needed; never rewrite the active shared checkout backward.
Run focused new tests then Website full unit/type/static/build and required
new Browser cases at390RU200,320 and desktop, actual labels in all nine
languages, contact clock advance and route/Back/cancel/discard/focus/Escape.
Check unchanged Mobile support copy tests, boundary and both data pins.
Every Browser output is fresh; preserve selected images/hashmanifest.
No pnpm/install/nativebuild/signing/deploy. Same independent reviewer rechecks
the frozen correction. Return exact files/tests, failures and remaining limits;
no release/PO-GREEN. END-CHECK: :).
