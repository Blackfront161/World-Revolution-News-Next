# Mobile production B1 — typed persistence and two-phase transport

Parent WRN-RELEASE-COMPLETION-2026-09-10; Core e8506a4 independently GREEN.
Binding design: WRN-PRODUCTION-MOBILE-STAGE-B-DESIGN-2026-09-10 evidence.
Chief accepts H001/H002 and M003 exactly; no further architecture round needed.
Delegation: erlaubt; Root reserves Slot1 for one fresh backend_data_reliability_
engineer Terra/high, no children/index/native/network/install/App/UI writes.
Root owns integration, Website is frozen for independent QA. Browser initially
belongs to Website QA; B1 may write browser tests but runs them only after an
explicit handback. No fake-indexeddb dependency may be installed.
While Website QA runs, limit writes to the listed NEW B1 files and own evidence.
Do not modify existing wrappers/shared exports/Core until Root confirms QA
handback; this keeps the Website's transitive build inputs stable. Use the time
for the pure new contract/tests and concrete profile/transport files.

## Outcome and paths

Implement the exact19 B1 files listed in the independent design: new production
offline contract/test; common Mobile transport/store/controller cores; concrete
Production release/profile/store/controller and tests; existing fixture
transport/store/controller/test wrappers; content-contract index/package export.
Additionally allow production-content-release-v1.ts ONLY additive exports or
reuse extraction needed by the partial safety validator; no duplicate manifest/
lifecycle validation and no change to Core acceptance semantics. All existing
Core tests must remain effective. Allow new tests/e2e/production-content-offline-
store.spec.ts and production-content-offline-harness.ts for real IDB mechanics,
plus own WRN-PRODUCTION-MOBILE-B1-2026-09-10 evidence/handoff/probes. Existing
fixture/browser harnesses, pins, test-support, domain, App/UI, public assets and
dependencies remain OUT. Notify Root of a concrete adjacent path requirement.

## Binding behavior

Use the design's exact pointer/control/bundle APIs, own production DB and same
ledger. Generic engines infer one concrete profile and own shared IDB/operation
mechanics, with no Ready union-casts or full duplicate store/controller.
Preserve fixture APIs/IDs/storage and all old test behavior. Production bundle
identity binds release sequence/revision/hash; atomic `highestAcceptedSequence`
survives rollback and clear. Same revision/sequence with another key is a
conflict; exact-key refresh preserves its slot. Only explicit previous↔active
rollback lowers the active sequence. Candidate save returns exact key and
disposition; activate only the returned candidate, never infer by revision.

Production source flow is current→descriptor→manifest→archive safety receipt,
then durable safety transaction, then Articles/Admission/Discover/Reader. No
remaining payload request starts before safety is committed; write failure
blocks it. A later abort/timeout/error cannot erase confirmed safety. Immutable
receipt validates against manifest.articleIds and exact component revision,
hash/bytes, fixed filename mapping and cumulative known safety. Eight bounded
same-origin requests maximum;5s/request and15s/operation, abort/late completion,
3slots/24h/4MiB per bundle/12MiB total/control cap as in design.

## Acceptance and execution

Write distinguishing focused tests first where practical, then implement the
smallest coherent extraction. Do not return after contract alone. Complete B1
transport/controller and actual IDB tests with H001/H002 causal order proof;
all old fixture tests unchanged. Required cases are design acceptance1–5:
identity/conflict/floor, exact-key refresh, rollback/clear, revocation of all
slots, failure between phases, quota/timeout/abort/stale/clear/late/dispose,
clock/TTL/restart and read-only incompatible state. No mocked-only store pass.

First concise checkpoint after a bounded code pass; if a genuine type seam
blocks implementation, explain the smallest correction instead of broadening
architecture. No extra child/reviewer loop. Finish source/types/scoped static
and relevant suites; keep incomplete work candid. Independent QA after freeze
is required before B2 activation. Produce template handoff/WRN-AGENT-STATUS.

Current real input is separately verified local two-EFF pilot f111254 and the
generated-core-e8506a4 packet, descriptor SHA
a7ef8c16cdd6120a119071bc6aa7a8fb7f45f96d1b7d531b74c6e0f1d7d26d13.
It is a transport integration candidate, not a running live feed. Use synthetic
authored production IDs/text in unit fixtures, no copied publisher prose.
