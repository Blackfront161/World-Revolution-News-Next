# A5 separate production resume store

Delegation: erlaubt. Root reserves Slot2 existing Terra/high for this bounded
writer package after the separate gate. No children/index/remote/native/network.
Standing completion mandate and accepted MEDIA-DELIVERY-DESIGN resume section.
Slot1 Sol reviews A3; Root handles disjoint A2/A4 files. Not alone in checkout;
preserve all other edits. No old V1, A1/player/transport, profiles/routes/aliases,
dependencies or common persistence-core changes.

Own only packages/browser-content/src/production-media-resume-store.ts,
apps/mobile/src/production-media-resume-store.test.ts,
tests/e2e/production-media-resume-store.spec.ts and optional own
tests/e2e/production-media-resume-harness.ts; plus matching A5 report/handoff
and evidence/helpers. Reuse existing createOfflineIdbCore low-level mechanics;
do not copy the old unbounded IDB request/open implementation.

Factory accepts only the two separately named client DBs
wrn.mobile-production-media-resume.v1 and wrn.website-production-media-resume.v1.
Version1, exactly one mediaResume keyPath:key store, no indexes/autoincrement;
control row {recordVersion:1,key:'control',generation:nonnegative safe integer}.
Open only initializes oldVersion0; future/corrupt/unknown fields/extra schema or
over-cap state remains protected without recovery/deletion. onversionchange
closes handle; close and signal cancellation cannot allow pending writes.

Exact timestamp-free record: recordVersion:1, key:'episode:'+episodeId,
episodeId, streamId, releaseRevision (A1 opaque IDs1..128), streamRevision
(lowerhex SHA256 identity, not audio hash), positionMs (safe integer0..<duration),
durationMs1000..14400000. No URLs/names/history/consent.64 records max,4096
canonical UTF8 per record/65536 total; do not manufacture padding fields to
reach byte boundaries that this strict schema cannot represent.

Public open/snapshot/save/deleteIfExact/clearExact/close. Inputs snapshot and
validate synchronously before await. Generation CAS, exact record comparison
independent of object property insertion order, no-op on legitimate generation
or record mismatch; corrupt/future state throws protected and stays unchanged.
Readback validate before commit, return immutable detached state only after
transaction completion. Overflow must fail atomically, no eviction. Whole
clear only exact listed records/current generation, preserving control.
Late save compensation belongs to later controller; this store provides exact
deletion, not consent/resume autoplay authority.

Tests standard unit validation plus actual isolated Chrome IDB: reopen/save,
concurrent CAS, readback failure/transaction failure where reproducible,
snapshot input mutation, stale delete and clear, corrupted/future/extra schema
unchanged,64/65 capacity, close/abort, DB/V1 isolation. Own browser43173–75
exclusive; preserve43176 and43190/91. Unique output per run and retain evidence.
No visible product change/screenshot matrix required for this non-UI store.
Use installed runtime, no install. Check types/scoped lint/format/boundaries.
Checkpoint within one bounded pass; return candidate paths/tests/findings and
all rights to Root using AGENT-HANDOFF. Independent review follows separately.
