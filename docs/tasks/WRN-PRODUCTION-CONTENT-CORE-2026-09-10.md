# WRN production content core and deterministic builder

- Parent: `WRN-RELEASE-COMPLETION-2026-09-10.md`; PO: finish all release work.
- Design: completed independent Sol report
  `docs/evidence/WRN-RELEASE-COMPLETION-CONTENT-DESIGN-2026-09-10.md`.
- Chief/integration `/root`; Stage A only. Delegation allowed to one direct
  backend_data_reliability_engineer Terra/high after an explicit free writer
  slot is recorded. No children, browser, index or commits.
- This brief alone does not start a third product writer. Website and native
  bridge ownership remain intact until their handoffs.

## Outcome

A genuine article can be represented, rights-checked, saved and projected by
the shared pure domain without pretending to be a fixture. A local offline
producer deterministically creates a bounded production release with verified
admissions. Current fixture behavior remains unchanged. No client activation
or claim of production readiness is included in Stage A.

## Exact ownership

- New `packages/content-contracts/src/content-release-core-v1.ts` and
  `production-content-release-v1.ts`.
- `packages/content-contracts/src/index.ts`: narrow internal shared validation
  extraction only; all public fixture schemas, limits and behavior unchanged.
- `packages/content-contracts/package.json`: explicit production subpath export.
- New `packages/content-contracts/tests/production-content-release-v1.test.ts`
  and self-authored synthetic fixtures under
  `packages/content-contracts/tests/fixtures/wrn-production-content-v1/`.
- `packages/content-contracts/tests/manifest-v1.test.ts`: additive rejection pins.
- New `packages/domain/src/production-reading-state-v2.ts` and
  `production-content-v1.ts`; `packages/domain/src/index.ts`: additive exports
  and narrow extraction of existing shared reducer/projection/lifecycle logic.
  An internal `reading-state-core.ts` is allowed if needed to avoid duplication.
- New `packages/domain/tests/production-reading-state-v2.test.ts` and
  `production-content-v1.test.ts`; `reading-state.test.ts`: rejection pins only.
- New `tools/build-production-content-release.mjs` and matching `.test.mjs`.
- Own `docs/evidence/WRN-PRODUCTION-CONTENT-CORE-2026-09-10.md` and matching handoff.

No apps, brand/UI packages, test-support, existing fixtures, fixture-provenance
tools, dependencies, platform configuration or other files. No real article text
in test fixtures. Do not broaden scope by copying the existing large validators.

## Binding design decisions

Use the independent report's Stage A: strict additive production-v1 admission,
opaques `wrn-art-<32 lowercase hex>`, stable registered IDs, explicit author list,
safe original/license/evidence URLs, checkedAt, scope, original language,
full/partial text status, reviewed third-party-material status and transformation.
Admission binds original snapshot bytes/hash and canonical article+reader hash.
Reject missing/inconsistent fields and unknown keys; positive finite integer
release sequence. Separate production reading-state-v2 rejects fixture IDs;
v1 rejects production IDs and retains all existing behavior. Reuse neutral
reader blocks, deterministic hashes and monotone reading-state logic internally.

Production Core excludes website-publication. The separate website projection
must be representable and bound to the same core manifest hash and exact article
ID sets. Export enough typed APIs for subsequent Mobile and Website adapters,
including safe archive/alias/gone/revoked/share resolution and a cumulative
safety ledger. Invalid metadata/URL never becomes a fetch target. All paths are
derived from a bounded immutable revision rather than trusted upstream paths.

The builder is a pure local producer: explicit input/output paths, fixed times,
no network, no overwrite of an existing target, strict UTF8 and size limits,
canonical deterministic output. It consumes the versioned admission input;
publish that exact input schema and an invocation in the handoff. Synthetic
test input suffices in this stage. Chief owns later real admission records.
Output resources <=512KiB each, full bundle <=4MiB; max3 articles for this first
versioned slice, exact manifest/discover/reader/lifecycle/admission ID sets.
Use a new staging directory and leave failed attempts distinct; do not delete
historical output. A run cannot partially promote invalid data into a usable
current pointer. The pointer binds revision, sequence, relative descriptor path
and descriptor hash. Generated resources are immutable client artifacts, not a
new manually maintained content repository.

Real source evidence is separately pinned at data commit
`8913b4517b04d85a1f1a1e47231f4a15620bca7d` and the exact EFF original snapshots
in `docs/evidence/WRN-RELEASE-COMPLETION-SOURCES-2026-09-10/`. These are a
read-only captured input package, not a new clone or moving-main release source.
The producer CLI can later be run in the separate content repository; this
stage neither connects a remote nor publishes data. Do not read the27MB rawfeed
at runtime or infer fulltext from its shortened feed companion.

## Required evidence

Unchanged fixture-v1 negative behavior for real IDs/URLs/provenance; full existing
contract/domain suites and typechecks. Production negative cases cover every
admission binding, unsafe URL/ID/text, mismatched resource hash/count/ID set,
sequence bounds, current-ledger omission/conflict and oversized data.
Reading state tests prove save/read/progress convergence and invalid-ID rejection.
Builder tests compare two fresh outputs byte-for-byte, different input ordering
and working directory, preexisting target refusal, invalid input and size refusal.
No user storage mutation exists in this stage; client key preservation and
actual update/rollback/expiry/clock/quota execution are required in Stages B/C.

Run scoped lint/format, actual workspace-boundary and public fixture-parity
checks, diff check. Use installed direct Node/Vitest/tsc only, no pnpm/install.
Return API/file list, tests and precise downstream integration steps. Independent
QA on the frozen candidate will follow; no production or release GREEN from
contract tests alone. Rollback is a separate local commit; old data is untouched.
Checkpoint at first implemented/tested boundary, stop a concrete loop rather
than silently widening scope. Handoff `END-CHECK: :)`.
