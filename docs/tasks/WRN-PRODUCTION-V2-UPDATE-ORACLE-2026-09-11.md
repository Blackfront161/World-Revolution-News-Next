# Actual bundled V2 update-source regression

Parent: RELEASE-COMPLETION, image integration9aa75a68 and source integration
e77767d3. Root found a stale real-data expectation during read-only review:
tests/e2e/production-update-source.spec.ts still expects bundled EFF v1 and
chooses remote sequence2. The committed current.json now points to V2 sequence2.
The test therefore needs a genuinely higher remote sequence, while retaining
its unchanged lower/collision rejection, Clear floor and fixed-origin checks.

Root owns only that existing test path plus new matching evidence/handoff.
Delegation: erlaubt for a narrow independent QA recheck after the candidate;
no additional product writer. No product/controller/store/data/fixture changes.
Do not execute browser work until the Home writer returns exclusive test ports.

First reproduce the old test against the actual V2 bundled files. Then change
only the first test's real release expectation to wrn-production-eff-2026-09-10-v2,
remote update/remount/floor to3, lower to2, colliding identity to3 and higher to4.
Keep all original safety, transport, time, reading bytes, identity and request
count assertions. Add an explicit first-sequence2 observation if needed to bind
the actual package. Other authored packet sequences in this file are synthetic
and remain unchanged. No broad search-and-replace of version or sequence values.

Run the complete production-update-source spec once with explicit selected
mobile-390x844 project, bounded workers and a fresh output directory. Preserve
the initial RED and final results. Home/source/browser integration gates remain
separate; this corrects a regression oracle after a legitimate content migration,
not a reason to relabel failed update behavior as success.

No external requests may escape interception. No browser preview/data clearing,
dependencies, native install, deployment or release claim. Preserve43176/79/80
and emulator5558. Handoff states exact tests and remaining product-upgrade limits.
END-CHECK: :)
