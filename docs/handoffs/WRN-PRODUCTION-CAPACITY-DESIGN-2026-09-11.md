# Agent Handoff

- Agent/role: `production_translation_design`, independent architecture reviewer
- Task: `WRN-PRODUCTION-CAPACITY-DESIGN-2026-09-11`; Slot2, Root allocator
- Basis: `38f9553ce45df142c736a48895f74e5b4bc7f450`; no children
- Result: GREEN design; implementation/admission/release remain incomplete
- Rights: only this new handoff and matching evidence; all rights returned

## Result

Add V3 capacity without changing V1/V2: max64 articles, 3.75 MiB resources and
unchanged 4 MiB bundle/12 MiB store. Per-resource caps are 384/384/128/128 KiB
and 2.75 MiB reader details. Keep V2 image limits and add 1.5 MiB raw image
aggregate. A policy-parameterized validator prevents duplication.

Phase 1 validates descriptor/manifest/archive safety before other payloads;
phase 2 uses version-specific transport caps. Existing sequence, Clear,
rollback, operation epoch, stable-ID reading history and separate stores stay
unchanged. Old clients reject V3 before payload and expire their old bundle;
higher-sequence V2 safety releases provide the compatibility emergency path.

## Evidence and findings

Read the exact brief, pinned news reuse report, V1/V2/compatible/offline
contracts, shared transport/store/controller, builder, delivery and website
site tools. No tests run; this was a read-only design pass.

- HIGH: cap3 makes the real 1+5 release impossible; global cap increase would
  alter old contracts.
- HIGH: new capacity must retain safety-first persistence and monotone sequence.
- MEDIUM: base64 image expansion needs an aggregate budget.
- MEDIUM: the 27 MB feed and its flags do not establish admission or language.

Exact files, version identity, byte arithmetic, compatibility and tests are in
`docs/evidence/WRN-PRODUCTION-CAPACITY-DESIGN-2026-09-11.md`.

## Next and status

Root may bind one writer after Home ownership returns. Capacity mechanics come
before the separately versioned local ingestion candidate; no new service or
raw client feed. Actual EFF packets/fixture pins stay immutable.

WRN-AGENT-STATUS: GREEN design only; implementation and real supply open.
Handoff: this path. All rights/Slot2 returned. END-CHECK: :)
