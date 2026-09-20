# Capacity — one count defect and remaining acceptance evidence

Parent CAPACITY-CORE, same accepted design. Delegation: erlaubt; Root reserves
returned production_capacity_core_writer Terra in Slot2 after this gate. No
children/index/browser/network/dependencies. Read-only source QA is complete.
Own exactly existing packages/content-contracts/src/production-content-validation-internal.ts,
tests/production-content-release-v3.test.ts, tests/production-content-offline-compatible.test.ts,
tests/production-capacity-support.ts; new CORRECTION-WRITER evidence/handoff/output.
All other product files and immutable CoreV1 stay unchanged. Sol reviews
translation correction in Slot1; Root prepares next transport/builder scope.

Fix CAPACITY-INDEPENDENT-M-001 againstd40aadd0: phase1 before ledger output
must bind four nonarchive recordCounts to manifest.articleIds.length; existing
archive count stays lifecycle-bound. Add negative regressions for all five
resource IDs with rebound manifest/descriptor hashes so a hash mismatch cannot
masquerade as the count guard. Preserve one valid safety-positive result.

Complete the already bound missing actual byte resource matrix, not just
declared lengths. Use independently constructed valid resources immediately
below/at/above each V3 cap, recomputing admission and every resource hash/count.
Expandable source metadata/reader text must remain within per-field constraints;
never make a malformed field be the reason an over-cap test fails. Resource
cap tests should distinguish removing that cap. Shared fixture padding helper
is allowed but assertions name actual canonical bytes. Retain oldV1/V2 limits.

Where a bound is mathematically unreachable under stricter valid resource caps
(e.g. full4MiB envelope if its maximum overhead+3.75MiB resources is below4MiB),
give explicit numeric upper-bound derivation from actual schema fields and
exercise the largest constructible packet plus full-envelope equality. Do not
claim impossible limit/limit+1 valid acceptance or add dead tests. Reuse Sol's
independent lifecycle/media proof as evidence instead of duplicating it blindly.
Record exact oldV1/V2 compatibility restoration tests or run existing ones with
named evidence; add only genuinely absent distinguishing oracles.

Run complete contracts --root packages/content-contracts --maxWorkers=2,
package types, old4buildertests, scoped static/boundary/corepin. No broad visual
matrix. One completed candidate then sameSol narrow finding/evidence closure.
Do not return merely because moving padding fixtures is work; finish the named
acceptance gap or provide a concrete reproducible impossibility proof. No extra
design round. Handoff exacttests/files/limits, returnrights and END-CHECK: :).
