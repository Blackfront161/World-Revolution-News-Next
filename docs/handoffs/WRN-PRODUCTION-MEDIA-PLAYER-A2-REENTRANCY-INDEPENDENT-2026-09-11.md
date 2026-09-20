# Independent A2 reentrancy closure handoff

- Agent/task: Slot1 same independent Sol reviewer,
  `WRN-PRODUCTION-MEDIA-PLAYER-A2-REENTRANCY-INDEPENDENT-2026-09-11`.
- Candidate: `8529d97a0051f82e2c2d6d50a47d03dee28b60ef`, compared with
  original A2 `8e90d0d6` under gate `ca645720`.
- Scope: exact player/test correction plus own report, handoff, helpers and
  output. No product, standard-test, index, browser, network, A3, A4 or A5
  writes/review.
- Result: **GREEN**; `A2-INDEPENDENT-M-001` **CLOSED**; no new finding.

## Closure

Post-callback command/run checks now cover context, clock, connectivity,
observer and factory boundaries. Current online state is checked before initial
source assignment and again before initial native play. A reentrant stop cannot
be overwritten, a stale event cannot mutate a replacement run, and offline
continue remains allowed only for the same paused run.

All five original independent witnesses now fail closed. The independent
closure helper also verifies post-source clock/online stop, replacement-run
survival and the offline same-run positive case.

## Evidence

- Corrected focused suite: 53/53 PASS.
- Independent closure: 4 tests, 9 recorded cases PASS.
- Two client typechecks, seven alias/boundary tests, actual scanner and scoped
  lint/format: PASS.
- Exact correction paths/delta: 2/2; protected V1 pins: 5/5.
- No unrelated full suite was repeated.

All Slot1 review rights and helper/output ownership are returned to Root. No
browser, port, product, standard-test, network, native, A3/A4/A5 rights were
acquired.

## WRN-AGENT-STATUS

- Task: A2-REENTRANCY-INDEPENDENT
- Status: GREEN
- Quellstand: correction `8529d97a` over original A2 `8e90d0d6`
- Erledigt: exact same-reviewer M-001 closure and independent positive/negative
  lifecycle proof
- Tests: 53 focused + 4 independent/9 cases; 2 types; 7 tools; scanner/static
  PASS
- Offen: separate media transport/store/client/provider gates only
- Handoff: this path
- Naechster Schritt: Root may accept narrow A2; A3/A5 continue separately
- Rechte: all returned; Slot1 free
- END-CHECK: :)
