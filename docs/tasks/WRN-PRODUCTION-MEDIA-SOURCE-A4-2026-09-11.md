# A4 two-phase production media source

Root-only writer; no children. Accepted delivery design, A1 and A3 raw reader.
Own new packages/browser-content/src/production-media-release.ts,
apps/mobile/src/production-media-release.test.ts and
apps/mobile/src/production-media-test-fixture.ts plus matching A4 evidence/handoff.
The test helper extracts a copy of the already independently accepted local
A2 reserved-origin input constructor; do not alter frozen A2 or private package
tests. No A1/A3/A5/core/alias/profile/routes/dependencies/provider edits.

Factory snapshots compiled metadata origin and allowed publisher origins and
uses one A3 session. load(signal, knownSafety, commitSafety) has no public
reusable receipt; its closed invocation preserves the two-phase ordering.
Read raw pointer, validate path/schema; descriptor, exact raw bytes/hash/identity;
revocation only; validate A1 safety; invoke trusted durable commit callback with
immutable safety and the session signal. Ordinary manifest/admission/rights/
consent cannot be requested until that callback resolves with exactly the
committed/read-back safety. A newer concurrent ledger causes a failed refresh
and remains durable; do not weaken it to complete this older invocation.

Only then read four ordinary documents with declared caps and validate full A1
release against committed safety and current time. Return immutable {kind:ready,
ready, raw:{pointerRaw,descriptorRaw,documentsRaw}} or finite {kind:failed}.
No public error/provider text. Snapshot input safety before first await, copy
the origin set at construction, never canonicalize wire text. One12s deadline
includes hashing, durable wait and final validation; caller abort/late callback
cannot lead to payload fetch or a returned ready. Always close session.

The callback is a trusted persistence port: this source cannot independently
prove an arbitrary implementation wrote to disk. Later real IDB adapter and
browser tests must establish that; passing this source alone does not claim it.
Failed payload never asks storage to roll back already committed safety.

Tests: genuine A1 ready and exact raw bytes, enforced request/commit order,
pointer/descriptor/revocation tampering stops before ordinary data; reject/throw/
hang/mismatched commit prevents payload; safety retained after each payload
failure; invalid origin/rights/full release fails; abort/deadline before/during
commit and late settlement; input snapshots and independent invocations. Both
client types/scoped static/boundaries. No browser needed for this pure source;
independent review follows with future IDB adapter before activation.
