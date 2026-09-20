# A6 production media durable release and safety store

Delegation: erlaubt. After this separate gate commit Root reserves Slot2 for
existing production_capacity_core_writer, Terra/high. No children/index/network/
native/provider writes. Root owns integration; Sol independently reviews later.
Source baseline52ad6036 plus accepted A4/A6 reports in this gate. The binding
design is docs/evidence/WRN-PRODUCTION-MEDIA-A6-STORE-DESIGN-2026-09-11.md.
User value: checked podcast metadata and later withdrawals survive restart,
failed refresh, rollback and clear without restoring unsafe playback.

## Ownership and scope

Implement exactly the product/test paths enumerated in the accepted design:
A1 additive historical/safety helpers and their existing tests; new
production-media-offline-v1 contract/tests/public export; its four explicit
package/TS/alias paths; new shared offline profile/store; two thin profile/store
wrappers per client; production-media-offline-harness.ts and -store.spec.ts.
Own matching A6-IMPLEMENTATION evidence/handoff and uniquely named helper/output
directory. Existing core, A2/A3/A4/A5, V1 pins, UI, service workers, dependencies,
provider origins and audio remain outside the scope. You are not alone: preserve
Root/other agent changes; no shared-path edits or reversions.

Implement in two bounded checkpoints: first A1 helpers, durable schemas and
contract tests; then shared store/wrappers and real-IDB acceptance. Send the
first checkpoint before starting the second, including actual tests and any
unresolved design question. Do not invent a Ready, weaken old validation or
copy private A1 domain rules into the store. No unbounded retry loops.

## Binding acceptance

All exact models, transitions, provenance rules, CAS/attempt ownership,
high-water/512 identity no-eviction rules and required distinguishing cases in
the design apply. Control384KiB, three bundles1MiB each, total3456KiB; nested
canonical UTF-8 bytes include fixed-point byteLength. Test generic exact-size
helpers at minus/equal/plus one separately from semantic validity; never invent
an unreachable valid record solely to force a byte boundary.

Current safety is durably read back before ordinary A4 metadata can proceed.
Historical integrity is distinct from current availability; expired intact
metadata is unavailable, not corrupt. Current floor, origin admission and all
cumulative blocked/gone/replaced targets dominate rollback and stored releases.
Clear retains safety, high-water and identities. Every failed/protected write
preserves stored bytes; async hashing cannot resurrect a cleared attempt.
Only A1 can mint a fresh registered Ready. Never persist Ready or audio.

Reuse createOfflineIdbCore unchanged. Error surfaces are finite and omit stored
URLs/content. Unknown/future/corrupt schema remains untouched. Exact DB names
and client isolation are mandatory. Run relevant contract suites, both client
typechecks, focused lint/format, public-alias/boundary checks and actual IDB
tests. No visible UI change, so screenshots are not a substitute for IDB tests.

## Browser and handoff

Browser43173-75 stays exclusively with A5 independent QA until Root explicitly
returns it. Before that implement and run unit/static tests only. Then create
an own blank Vite harness and unique timestamp/UUID Playwright output, preserving
all old files and user43190/91/43176. Do not boot actual app on a QA DB origin.

Return exact file list, commands/results, limitations and template handoff with
WRN-AGENT-STATUS/END-CHECK. No client activation or provider/release GREEN. Root
secures the candidate and independent review. Reversal is a separate scoped
code change; no deletion or resetting existing user data.
