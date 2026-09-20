# Production selection explanation

PO continuation and original G2 excerpt lines654-660 authorize this completion:
"Warum sehe ich das?" only for personalized results under "Für mich", using
explicit local choices. No explanation is added to the anonymous Home route.
Current production cards expose source profiles but no article-specific reason.

Root is the sole writer for this small independent UI slice after this separate
gate commit. A7 Terra retains its eight NEW files and43173-75. Maximum two
disjoint product writers, no children. Root gets no browser until Terra returns
it and coordinates broad CPU use. Existing Sol media_resume_independent is the
later read-only reviewer; review start needs a frozen candidate and own brief.

Exact product/test paths:

1. packages/browser-content/src/production-content-view.ts
2. packages/browser-content/src/production-content-ui.tsx
3. packages/browser-content/src/production-selection-explanation.tsx (NEW)
4. packages/ui-language/src/source-preferences.ts
5. apps/mobile/src/production-selection-explanation.test.tsx (NEW)
6. tests/e2e/production-selection-explanation.spec.ts (NEW)
7. packages/browser-content/src/source-preferences-ui.css

Pre-write refinement: the disclosure uses its own semantic CSS class, added to
the existing shared wrapping/summary selectors in path7. Reusing source-profile
would falsely classify the explanation as a source-management control and
break existing scoped flows. No existing selector behavior changes.

Own reports/runners/build outputs: docs/evidence/WRN-PRODUCTION-SELECTION-
EXPLANATION-2026-09-12/ and matching handoff. Root may update canonical state
and this brief. No store/schema/contract/ranking/alias/native/provider or media
changes. Existing local source provider and UI strings/styles are reused.

Implementation: extract actual matched interest/region/content-language IDs
from the existing production preference predicate; make that same function
decide filtering and explanation, retaining all existing AND/OR and empty-filter
semantics. A missing discover row never supplies a reason. For visible following
cards only, a native details disclosure shows matched explicit choices with
existing localized labels and exact followed-source name where applicable.
Neutral sources may still appear after followed sources: say that honestly,
never invent a follow or a behavioral inference. No disclosure when neither
personal choices nor applicable production source choices are active. UI copy
exists in all nine languages; original article language remains unchanged.

Acceptance: reasons agree with the filter for topics/tags, exact region and
original language; nonmatching selections are not listed. Follow/hide/reload
immediately changes explanations through existing provider state. No disclosure
on Home/Discover/Saved/More/reader. Opening it writes no storage and makes no
network call. Local choices are the only input; no profile, tracking or account.
Expired/unavailable content cannot leave stale cards/reasons. Existing detail
styling supplies wrapping, keyboard operation and44px targets without a new
theme or layout system.

Validation: meaningful shared helper/component/integration tests in Mobile's
standard graph; existing view tests and both client types/static/boundaries.
After browser return, actual both-client following flows, other-route absence,
keyboard/320px/RU200 and existing viewport/theme matrix with captured evidence.
Run full affected client suites once together with A7 when both candidates are
stable; do not duplicate unchanged native/contract suites. Builds bind final
candidate; new preview only after independent scope acceptance. Rollback is
revert of these exact additions; no local-data migration or deletion. No new
runtime/service cost. "Since last visit" remains a separate pending feature.
