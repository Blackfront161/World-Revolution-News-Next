# B1 Chief continuation after incomplete writer return

Parent and acceptance: original B1 writer brief and independently reviewed
StageB design remain binding. WIP6d49c52 is preserved, not accepted. After
repeated partial returns, production_mobile_b1 is ended, no further writes or
browser rights. Root takes the same B1 files and Browser43173–75 sequentially;
native cc79606 remains frozen for independent Sol QA. No parallel B1 writer.

Concrete gaps from Root source inspection: operation deadline rejects its race
without aborting underlying work; late opens/transactions can escape lifecycle
ownership. Transport lacks noncooperative-promise cancellation, precise MIME,
fatal UTF8 and reliable rejected-body cleanup. Shared fixture transport and
controller remain unbound. Partial production safety validation duplicates
incomplete core predicates, omitting component byte/revision and exact-schema
checks. Current pointer revision needs safe path grammar and descriptor identity
binding. Receipt deep immutability is incomplete. Full acceptance not executed.

Root completes the smallest coherent correction and shared mechanics under the
original allowed paths. Add exact shared-mechanics unit tests in
apps/mobile/src/content-release-transport-core.test.ts and
content-offline-controller-core.test.ts; these are narrow missing test seams.
Use existing Core predicates through additive exports/reuse only, no altered
Core acceptance semantics. Existing fixtures/IDs/bytes/test-support stay intact.
No weakened tests. Full relevant suites, actual IDB error ordering and independent
review follow; no B2 activation until then.

Further causal store inspection: crypto validation awaited inside a readwrite
transaction can make it inactive before the write; most writes did not advance
generation and a crashed pending recheck could never be reclaimed. Root moves
validation outside the transaction and uses a full observed-state comparison
plus generation/clear fences within each atomic write. Every mutation advances
generation; a fresh explicit check may replace a crashed pending attempt, fencing
the old one. Stored historical bundles retain their original validated receipt
and are checked against the durable cumulative ledger; unchanged safe rollback
content survives a newer safety revision, revoked content does not. Core's
source-admission semantics stay unchanged. These paths need real browser proofs.

The attempted Luna read-only Website inventory dispatch failed with runtime
agent-thread-limit before starting. No retry pool or unstarted-agent result is
claimed. Root will do that bounded inventory after B1; Slot3 reservation released.
Slot2 existing Sol native QA remains active. Root owns integration and reports.
No children/install/signing/deploy/remote writes. Browser outputs always fresh.

Final regression uncovered two pre-existing test locator failures: the migrated
News-directory navigation now precedes the main navigation. Root additionally
owns tests/e2e/content-offline-lifecycle.spec.ts ONLY to replace its positional
navigation locator with the explicit Mobile/Website main-navigation name.
Both focus assertions and held-source timing remain unchanged. Also distinguish
encoded transfer Content-Length from the decoded Fetch body before checking exact
length; enforce the streamed decoded cap for both. Reference: WHATWG Fetch
https://fetch.spec.whatwg.org/#http-network-fetch, content-coding steps.
