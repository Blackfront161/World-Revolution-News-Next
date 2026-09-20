# Binding controller design amendment

Root accepts all six findings in WRN-MEDIA-CONTROLLER-DESIGN-INDEPENDENT-
2026-09-12. Its exact required amendments and test oracles are binding and
supersede conflicting paragraphs of the original Terra design. This is a
bounded correction contract, not acceptance of the rejected original design.

## H-001: uncertain durable safety and playback-only invalidation

Implement dropPlaybackAuthority separately from command cancellation. It clears
the active context and resume ownership, stops A2 before observers, and preserves
the current source epoch/signal. Use it both for a returned control that removes
or changes the installed key and for every attempted A6 safety write whose exact
control did not return. An aborted/timed-out/failed readback after entering A6
is indeterminate and cannot retain playing authority. Only fresh A6 readActive
and the key/generation fence may reinstall it. Successful removal must allow
the same safe source recheck to continue. Never finish a lease with stale expected
state or infer safe rollback from A4's generic failed result.

## H-002: true Ready is an external precondition

A6-READY-H-001 is corrected under its separate three-path brief, with real
A6→A1→A2 provenance/consent test. A6-IND-M-001 origin908f7b50 and this Ready fix
must independently close before controller implementation. Controller never
recreates, serializes or shallow-copies a Ready to bypass its provenance check.

## M-001: bounded operations and reentrant ownership

All async public commands mount/recheck/rollback/clearLocal begin one new epoch,
cancel prior command work and have one non-resetting30000ms wall-clock deadline
from invocation through final readback/reconciliation. A4's own12000ms bound
remains unchanged. Do not rely solely on the injected article/rights clock for
the timer. Detect thrown/nonfinite/regressive domain-clock readings, invalid or
throwing operationId and dependency failures as finite outcomes. At total
deadline abort, revoke ownership, settle timeout and close/drop late results;
callback-entered safety uncertainty also drops playback authority.

Guard every awaited result, timer, observer return and A2 call against epoch,
signal and handle ownership before more work. Swallow observer exceptions;
observer-triggered clear/dispose wins. Dispose is synchronous to public state.
Detached late store opens close themselves. The 29999/30000/30001 boundaries,
competing commands, stalled open/hash, clock failure and reentrancy are mandatory.

## M-002: exact API-compatible active key

From A6 readActive's genuine Ready pointer, derive the key using the existing
public productionMediaOfflineBundleKeyV1. Then fetch a fresh A6 snapshot and
compare activeKey, generation and clearEpoch with that result before installing
A2 context. No API/schema change. Null/mismatched/late key or context yields
conflict and no provisional Ready. Generation string remains
media:<generation>:<clearEpoch>:<derivedKey> within A2's128character boundary.

## M-003: exact resume ownership and non-atomic clear

Only A5 kind:saved grants ownership of the particular returned row/generation;
no-op never grants compensation rights. Continue invalidates its pause token
before A2 continue, preserves buffer/position without awaiting cleanup, and
deletes only its exact owned saved row whether save was pending or completed.
Changed/new concurrent rows must survive. Resume save plus its dependent cleanup
has a fixed30000ms budget from the pause job start; cleanup first requested after
an already-completed save is a new bounded cleanup job. Never allow an unhandled
void-callback rejection or an unbounded cleanup promise.

Clear waits for tracked save-and-compensation jobs within its own remaining
total deadline. It clears A6 first and then only the original exact A5 snapshot
rows. A single conflict/no-op retry may use a new observed generation but never
new or changed rows as deletion targets. Any remaining/new row means residual
resume data, not all-clear. Failed A6 clear leaves A5 unchanged; successful A6
plus failed A5 is explicitly partial. Clear cannot lower A6 safety/high-water.

Dispose publishes disposed and drops playback immediately; hidden A5 cleanup
may only drain already-owned jobs under their remaining fixed bounds, then close
the handle. It may not notify, reopen a store, install state or acquire new work.
At timeout/uncertain abort close and report no successful deletion; retained
protected data is preferable to deleting a concurrent row by inference.

## M-004 and exact implementation ownership

The shared test matrix belongs to Mobile's existing standard Vitest graph.
The complete future writer scope is exactly these eight new paths:

1. packages/browser-content/src/production-media-controller.ts
2. apps/mobile/src/production-media-controller-core.test.ts
3. apps/mobile/src/production-media-controller.ts
4. apps/website/src/production-media-controller.ts
5. apps/mobile/src/production-media-controller.test.ts
6. apps/website/src/production-media-controller.test.ts
7. tests/e2e/production-media-controller-harness.ts
8. tests/e2e/production-media-controller.spec.ts

No shared-package test script, aliases, App/routes, A1-A6 edits, provider, native
or UI activation. Own bound evidence runners may expose a blank local harness
using existing aliases. Wrapper defaults are source:null and empty origins;
their explicit injections must share the same immutable compiled origins as A4.
All original15 test groups plus independent six-finding oracles are required;
count aggregated subcases honestly. Real A4/A6 and A2/A5 seams are mandatory,
including successful new-source activation, failed commit readback and completed
pause-save continue. Pure mocked controller tests alone are insufficient.

Root will name the one writer and browser only after the separate A6 combined
closure. No implementation authority is granted by this amendment alone.
