# B2 R1 — share feedback and equivalent trigger focus

Parent B2/RELEASE-COMPLETION. Candidate57e28fa passes independent Terra QA;
the independent Sol bounded review identifies two Mediums. Root is sole writer
after Sol returns its final report/rights and this separate brief is committed.
Events/Media data writer remains strictly disjoint. No new architecture round.

Exact product/test scope: apps/mobile/src/production-content-ui.tsx,
production-content-ui.test.tsx, tests/e2e/production-content-ui.spec.ts. Own
B2-R1 evidence/handoff/pins plus PROJECT-STATE/register only. No backend/domain,
admitted data/fixture, reading storage or new UI layout change.

M001: delayed share success/rejection checks only the article route, allowing
feedback from an old activeKey/safety revision/expiry to appear on a newer or
unavailable same-route snapshot. Capture guarded authority identity and compare
against the latest allowed identity and exact time after either promise outcome.
Invalidate superseded/unmounted share attempts. Clear authority-specific old
feedback when authority changes; do not make unrelated saved state disappear.
Deferred resolve/reject tests for same-route identity replacement and expiry
must stay silent while a valid same-authority success/error still reports.

M002: the source/license trigger is detached while guard hides the reader.
The modal stores that old node and Escape/Cancel falls back to main, even after
the same article remounts. Give each article+original/license trigger a stable
DOM identity and restore the connected equivalent after modal close; only fall
back to main if no equivalent current trigger exists. Preserve native inert,
Tab trap, Escape propagation and no external request before confirmation.
Actual browser assertions must verify the exact original/license button after
both Escape and Cancel, for main/archive; include Contrast as third theme.

Prove distinguishing RED on57e28fa, fix, focused units/full Mobile/types/static,
full current production UI browser suite plus six added focus cases across
three themes and two routes. Old backend has not changed: no unrelated full
backend rerun required. Save fresh focused images/manifest. Freeze separate
candidate, same independent Sol closes exact findings and Terra reproduces the
focused browser/functional fixes. Shared extraction waits for both closures.
No PO/live/device/signing/installation/publication permission inferred.
