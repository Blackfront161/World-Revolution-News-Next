# Handoff — independent media controller design precheck

## Decision

Frozen design blob `08ebef1c328b349f4e6b541413f63c3941eeca64`
is **FAIL / not implementation-ready after A6 closure alone**. Findings: two
High and four Medium. No product/test/browser/index/provider work was performed.

## Binding corrections

1. Treat every A6 safety callback that entered but lacked exact readback as an
   indeterminate commit: synchronously drop playback authority. A known removed
   active key uses the same playback-only drop without aborting its own safe
   recheck. Fresh A6 reconciliation is the only reinstall path.
2. Close the additional A6 provenance blocker first: `readActive` currently
   JSON-clones its genuine Ready and destroys A1 WeakSet identity, so A2 rejects
   every A6 context. Freeze the wrapper without cloning Ready and prove both the
   A1 predicate and actual A6-to-A2 consent preparation.
3. Give mount/recheck/rollback/clear one non-resetting 30,000 ms total deadline
   and one shared winner epoch; validate ports and fence every await, callback,
   observer and A2 return.
4. Derive `activeKey` using public `productionMediaOfflineBundleKeyV1`, then
   require a fresh A6 snapshot with the same generation, clear epoch and key
   before constructing A2 generation/installing context.
5. Compensate only A5 mutations with `kind:'saved'`; `no-op` never grants row
   ownership. Continue deletes an already-completed or later-completed owned
   pause record without waiting. Clear never rebases deletion onto newly read
   concurrent records, and dispose defers the hidden handle close through owned
   cleanup/abort settlement.
6. Move the shared unit matrix under the Mobile Vitest root because
   `packages/browser-content` has no workspace test script. Bind observer
   reentrancy/exception and void-callback rejection cases there.

Exact source evidence, impacts and distinguishing tests are in
`docs/evidence/WRN-MEDIA-CONTROLLER-DESIGN-INDEPENDENT-2026-09-12.md`.

## Scope and rights

The A6 correction WIP and provider-policy draft remain OUT. All rights are
returned; no browser was used.

## WRN-AGENT-STATUS

- Task: `WRN-MEDIA-CONTROLLER-DESIGN-INDEPENDENT-2026-09-12`
- Gate: **FAIL**
- Findings: 2 High, 4 Medium
- Product/test/browser/index/provider rights: returned
- END-CHECK: :(
