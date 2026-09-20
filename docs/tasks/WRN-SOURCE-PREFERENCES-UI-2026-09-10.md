# Source follow/hide and profile integration

Parent WRN-SOURCE-PREFERENCES-COMPLETION Stage2 and original G2/PO092 scope.
Core writer returned; Root reviewed and reproduced21tests, removing repeated
per-item document validation from projection without changing semantics. Root
is sole product/UI writer. No helper writes while this integration is active.

Allowed existing paths: packages/browser-content/src/production-content-ui.tsx,
local-personalization-ui.tsx; packages/ui-language/package.json;
apps/mobile/src/App.tsx and features/directory/MobileContentDirectoryRoute.tsx;
apps/website/src/App.tsx, local-personalization-ui.tsx and
features/directory/WebsiteContentDirectoryRoute.tsx.
Allowed NEW paths: packages/browser-content/src/source-preferences-ui.tsx and
source-preferences-ui.css; packages/ui-language/src/source-preferences.ts and
source-preferences.test.ts; apps/mobile/src/source-preferences-ui.test.tsx;
tests/e2e/source-preferences.spec.ts. Own evidence/handoff under
WRN-SOURCE-PREFERENCES-UI-2026-09-10, plus state/register. Core eight paths
stay frozen unless a separately documented actual finding requires correction.

One shared provider per client owns the source store and lifecycle; inside
App's existing top-level provider, enabled only for production. It reads without
writing and handles storage events (own key or null), focus/visibility refresh,
cleanup/StrictMode, unavailable/protected data and explicit result feedback.
No source choices derived from reading history or sent externally. Successful
actions use verified store results; uncertain writes are visibly reported.

Add accessible two-state follow/hide buttons using existing red outline/fill
styles. Choosing an already active action returns to neutral. Labels name the
source, pressed state is explicit, disabled/error handling honest. Hidden cards
must not strand keyboard focus when removed. Profiles use existing validated
metadata only; current production sources and historical directory endpoints
remain explicitly separate. Never claim inferred organization relationships,
freshness, logos, source approval, ideology or additional licenses.

Normal production lists project follow/hide after safety and existing filters;
saved/direct/archived readers remain accessible and label hidden-source status.
Directory news/sport use only existing endpointIds. Source directory keeps
hidden endpoints available for reversal, follow-first order, current search and
language filters. Expandable profiles show recorded metadata, with historic
status clearly described. Original links keep existing consent/referrer rules.

A source-selection management panel in More and source directories lists
stored choices (including temporarily absent IDs), lets the user reverse an
individual choice and explicitly clear only this sidecar after a keyboard-safe
cancel/confirm dialog. Invalid/future raw is never rendered or overwritten;
only explicit confirmed clear can remove it. Normal reading controls unaffected.

For-me remains driven by saved interest/region/language preferences when ready.
With no such choices and explicit source choices, render the real source-aware
production results through an optional inactiveResults seam in the existing
personalization UI. No source-only fallback for protected/unavailable old data.
No fixture recommendation becomes real production content. Nine offered UI
languages receive complete new labels, with independent content language kept.

Acceptance: both actual clients demonstrate follow, hide, undo, reload/offline
persistence, future-state preservation and confirmed isolated clear; no existing
reading or interest data loss, no cross-client or cross-catalog ID collision.
Source-only For-me works; saved/direct hidden article survives; directory
endpoint hide affects matched news without guessing names. Unit tests cover
provider lifecycle/errors; browser covers real V2 pilot plus real directory,
keyboard/focus, RU200%,320px, both black red/violet and red/cyan themes, fresh
PNGs/hashmanifest and no unexpected external requests/errors. Re-run relevant
Mobile/Website suites, alltypes, boundaries, scoped static and both builds.
Independent narrow QA after candidate freeze; no deployment/native resigning
or whole-release claim. Current news/media supply and other roadmap gaps persist.

Stage3 additive resolution correction: tsconfig.base.json and
tools/browser-content-aliases.mjs each receive only the new public
@wrn/ui-language/source-preferences mapping, matching the package export.
No dependency or resolution-policy change. Domain core receives only its
remaining Prettier line wrap; semantic core remains frozen at48df1ba3.

Observed build correction: first real Browser globalSetup fails with Node24
ERR_MODULE_NOT_FOUND for the new content-contracts source-preferences export.
Root may correct only that export to an explicit .ts import with the existing
repository's documented TypeScript suppression pattern. No domain semantics
change. Reproduce the Node import and full actual Website build afterward.
