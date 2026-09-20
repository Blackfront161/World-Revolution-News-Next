# Source choices: complete the Mobile Home archive projection

Independent source UI reviewer confirms candidate67b384df omits source
projection in MobileHomeDirectory. It still renders up to5 normal Home archive
references from directory endpoints that the user explicitly hid. This violates
the existing parent scope; no new product decision or source mapping is needed.

Root sole writer AFTER current independent reviewer returns rights/browser.
Allowed product paths:
- apps/mobile/src/features/directory/MobileHomeDirectory.tsx
- apps/mobile/src/features/directory/home-directory-selection.ts
Allowed tests:
- apps/mobile/src/features/directory/MobileHomeDirectory.test.tsx
- tests/e2e/source-preferences.spec.ts
Own correction evidence/handoff and state/register. No other product/core,
contract, native, publication, dependencies or admission bytes change.

The Home component consumes the already enabled/disabled shared source context.
The pure selector receives optional current LocalSourcePreferencesV1, preserving
existing empty/default callers. Keep existing language/date/ID sort unchanged,
then use shared projectSourcePreferences for catalog directory and endpointIds,
then cap at5. Removing hidden items must occur before the cap; source follow
priority must not be overwritten by later sorting. No name/URL organization join.

Tests demonstrate exact scoped following, hide dominance and refill before cap,
default order preserved, actual provider/context rerender and real Home browser
follow/hide/reversal using a known existing Evrensel endpoint. Negative behavior
must be demonstrated on unmodified67b384df before product correction. Re-run
full Mobile suite with bounded workers, both client types, scoped lint/format,
boundaries and source browser matrix with fresh retained PNGs. Recheck broader
Website only if a shared product file changes (not planned).

After separate candidate, same independent reviewer rechecks the exact finding,
new tests, retained screenshot manifest and earlier conclusions. Delegation:
erlaubt for this read-only recheck, no children or product/index writes. Root
binds candidate hash at dispatch; no whole-release or native-UI claim.
