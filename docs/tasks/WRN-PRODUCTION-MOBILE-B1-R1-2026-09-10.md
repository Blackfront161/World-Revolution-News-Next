# Production B1 R1 — three independent correctness findings

Parent B1-INDEPENDENT, candidate f61a8d4. Sol independently identifies M001–003.
Root accepts the causal findings; no broad redesign or additional admission
contract change. Root is sole writer after independent Terra QA handback and
this separate gate commit. No delegate writers/children. Sol can review frozen
native cb739a4 independently while Root corrects B1. Register remains canonical.

Exact product/test scope: apps/mobile/src/production-content-offline-store.ts,
production-content-offline-controller.ts, production-content-release.ts,
production-content-offline-controller.test.ts, tests/e2e/production-content-
offline-store.spec.ts and its authored production-content-offline-harness.ts.
Additionally packages/content-contracts/src/production-content-offline-v1.ts
and its existing tests/production-content-offline-v1.test.ts for M003 only.
Ninth adjacent path production-content-offline-profile.ts: deep-freeze the new
receipt array/records when projecting a control read from IndexedDB; no other
profile behavior change. This is needed to retain the existing immutable result API.
Own R1 evidence/handoff/source-pin inventory permitted. No shared transport,
fixture/Core-admission/package/public/UI/native/dependency changes.

M001: replace ambiguous finishRecheck boolean with named outcome `unverified`,
`safety-verified-payload-failed`, `ready`. Only unverified clears the prior
successful source time. Verified safety followed by failed payload preserves
that old time; ready sets its checked time. Old bundle checkedAt still owns TTL;
never renew age from partial source success. Revoked old bundles remain removed.
The controller projects any safe retained active on verified payload failure,
with explicit failed-update reason, rather than claiming fresh content success.

M002: Phase2 owns a local AbortController mirrored from caller. First payload
failure aborts every sibling and awaits their bounded settlement before return.
Remove caller listener in finally. Signal already aborted starts no request.
All4fetch promises are observed; no request remains owned by a completed check.
The existing15-second whole operation and5-second request deadline stay intact.

M003: add a bounded append-only acceptedIdentities list to production control,
up to512 receipts {revision,sequence,key}. Unique revision/key, strictly ascending
sequence, highestAcceptedSequence equals maximum receipt sequence (or0 forempty).
Stage adds the identity atomically, exact refresh reuses it. Clear/rollback retain
all receipts; at capacity no new identity is accepted, no eviction. Existing
256KiB control cap still applies. A previously accepted revision can never acquire
another key/sequence even after clear. The exact previously accepted highest
identity may be restored after clear; this cannot lower the sequence floor.
An older accepted identity cannot become a new candidate; only an already stored
previous slot can be explicitly rolled back. Unknown older control shape remains
read-only/fail-closed, never auto-rewritten; no production client has shipped B1.

Distinguishing oracles: real active old bundle + nonrevoking Safety2 + each of
4payload faults separately => durable Safety2/pending null/old active readable,
old TTL boundary still blocks; revoking variant exposes no old body. Immediate
failure plus3pending bodies/fetches => all siblings aborted/cancelled before
return; next check/dispose does not leave a prior request alive. Existing unknown
storage, quota, rollback, sequence, identity and fixture checks stay unchanged.
Also after clear: same revision with higher sequence/differentkey is rejected;
identical current-highest packet restores; old accepted packet stays rejected;
capacity/duplicate/inconsistent-floor contracts fail closed without eviction.

Focused tests/11existing productionChrome plus newcases/types/scoped static
and fullMobile regression, then own immutable candidate. Same Sol closes its
three findings independently; Terra can recheck final source pins and added
browser cases without repeating unrelated native/Website tests. Handoffs use
template/status/END-CHECK. B2 activation remains gated on independent closure.
