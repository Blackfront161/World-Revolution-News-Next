# Core four-finding correction

Parent release completion; Delegation: erlaubt. Candidate1ab6d10 is independently
RED with CORE-H-001/002 and CORE-M-003/004. Existing production_content_core Terra
is sole shared content/domain writer, Slot1. Website writer owns separate
Website/ui-language paths. No children, index, Browser, Android, dependencies,
real article/client/default activation or provider operations.

## Exact scope

- packages/content-contracts/src/production-content-release-v1.ts and, only
  for a shared pure helper, content-release-core-v1.ts.
- packages/content-contracts/tests/production-content-release-v1.test.ts;
  existing synthetic production fixture only if a deterministic helper needs it.
- packages/domain/src/production-content-v1.ts,
  production-reading-state-v2.ts, index.ts (additive exports only).
- packages/domain/tests/production-reading-state-v2.test.ts and new
  production-content-v1.test.ts if needed for shared-resolver parity.
- Own evidence/handoff WRN-PRODUCTION-CONTENT-CORE-CORRECTION-2026-09-10.

## Required corrections

H-001: enforce unique, sorted, consistent lifecycle sets; reject duplicate alias
sources and revocations, overlapping contradictory states, alias cycles/chains,
unknown/gone/revoked targets. An exported resolver must recheck its target and
never expose a revoked/gone target. Bind the two public resolution helpers to
the same pure rule where possible rather than adding divergent domain logic.
Every accepted Ready safetyLedger must pass its own validator.

H-002: canonical deep snapshot BEFORE any asynchronous validation/hash step,
validate and derive ALL Ready fields exclusively from that snapshot, recursively
freeze every exposed object/array. Never freeze or mutate caller-owned input.
Inputs altered during or after validation cannot change the trusted outcome;
test source, descriptor, manifest, components, nested author/blocks/lists and
known-safety references. Do not use casts to treat unchecked objects as Ready.

M-003: bind descriptor.releaseRevision, expectedManifest/manifest revision,
articles revision, every component revision and expectedComponents revision to
one exact immutable revision. Separate drift tests recompute matching hashes
so rejection proves identity binding rather than incidental hash mismatch.

M-004: no silent eviction. Merge the full per-ID union with explicit savedAt/
readAt maxima and progress fraction maximum (timestamp tie-break), then check
the200-entry/32KiB capacity. Over-capacity returns no candidate: throw a named,
exported capacity-conflict error, preserving BOTH caller states unchanged.
Existing successful <=limit return type stays unchanged. StageB must catch and
surface this conflict instead of writing partial data. Merge must not invoke
the UI progress reducer and synthesize a new readAt merely during reconciliation.
Test commutativity/associativity/idempotence below and at capacity; all orders
of an over-capacity union reject identically, including byte-only overflow,
without mutation or loss of either input. No ID trimming or arbitrary eviction.

## Verification

Use original Sol probe triggers as before/after oracles, preserving its evidence
files. Original Core input is synthetic; real source snapshots remain separate.
Run contracts/domain/builder, both typechecks, scoped lint/format, all unchanged
fixture-v1 pins, real boundaries and16fixture pair guard. No unnecessary browser
run. Return exact candidate paths and expected exception/API impact. Same Sol
reviewer independently closes all four findings before StageB product writes.
Builder operates solely in a Chief-owned single-process local output directory;
no shared/untrusted producer concurrency claim or broader builder changes here.
