# Independent A2 lifecycle handoff

- Agent/task: Slot1 independent Sol reviewer,
  `WRN-PRODUCTION-MEDIA-PLAYER-A2-INDEPENDENT-2026-09-11`.
- Candidate: `8e90d0d6d7fac651d3b79b8f64610375b8d398c2`, reviewed against
  accepted A1 base `2e35b964` under gate `bc6d1de5`.
- Scope: four frozen A2 product/test paths plus own independent report,
  handoff, helpers and outputs. No product, test, index, browser, network,
  provider, storage or A3 writes/review.
- Result: **RED**, exactly one Medium finding,
  `A2-INDEPENDENT-M-001`.

## Finding and smallest closure

Reentrant context/clock/connectivity/observer calls are not followed by a
uniform command-epoch and ownership check. Preparation can mint a prompt after
stop; confirm-time online stop can be overwritten; loading can turn offline
before source assignment without cancelling; no final online getter is
consulted before source/play; and `owns` can allow an old event to replace the
state produced by a reentrant stop.

The correction must guard epoch/liveness after authority and online callbacks,
make `owns` recheck run/epoch after authority resolution, and check current
online plus run/epoch immediately before both initial `src` and initial play.
Offline `continue()` of the same buffered run remains allowed. Five exact
independent witnesses and the existing offline-continue positive oracle define
the closure. The report contains line references, impact and the full oracle.

## Evidence

- Frozen A2 focused suite: 42/42 PASS.
- Independent finding harness: 5/5 PASS with vulnerable behavior reproduced.
- Two client typechecks, scoped lint/format, seven alias/boundary tests and the
  actual boundary scanner: PASS.
- Four scoped paths and exact delta: 4/4; protected V1 pins: 5/5.
- Root's 660 Mobile result was not repeated because no reviewed product changed
  and the new direct harness is the distinguishing evidence.

All Slot1 review rights, helper/output ownership and any lifecycle review
authority are returned to Root. No browser, port, product or test rights were
acquired.

## WRN-AGENT-STATUS

- Task: A2-INDEPENDENT
- Status: RED
- Quellstand: immutable A2 `8e90d0d6` over accepted A1 `2e35b964`
- Erledigt: exact lifecycle/privacy review, focused/static/pin reproduction,
  five-case reentrancy proof
- Tests: 42 focused + 5 independent; 2 types; 7 tools; scanner/static PASS
- Offen: close `A2-INDEPENDENT-M-001`, then same-reviewer narrow verification
- Handoff: this path
- Naechster Schritt: Root binds and implements the exact narrow correction
- Rechte: all returned; Slot1 free
- END-CHECK: :)
