# Independent A3 raw-transport handoff

- Agent/task: Slot1 independent Sol reviewer,
  `WRN-PRODUCTION-MEDIA-RAW-TRANSPORT-A3-INDEPENDENT-2026-09-11`.
- Candidate: `d4f8456a96bb97ff0b037969b48135eee661f57a`, reviewed against
  parent `0aef655c` under gate `4a70bc0f`.
- Scope: two frozen A3 source/test files plus own report, handoff, helpers and
  outputs. No product, standard-test, index, browser, network, native or A2
  writes/review.
- Result: **RED**, exactly one Medium finding,
  `A3-INDEPENDENT-M-001`.

## Finding and smallest closure

Thrown clock errors at session creation, initial operation checks and header
deadline creation bypass the finite transport error and `fail()` boundaries.
The raw injected error/message escapes; in-session failures leave the signal
live and allow a later distinct read. A three-case independent harness proves
all three effects on the frozen candidate.

Normalize every clock acquisition. Before session construction, throw a new
fixed `timeout` transport error. Within a session, thrown or non-finite clock
values must call `fail('timeout')`, abort the signal and remain the terminal
result. Cover begin, public check/read/wait, header deadline and post-header
clock boundaries with private-text exclusion, no-request and later-work
oracles. No design or architecture expansion is required.

## Evidence

- Frozen A3 focused suite: 62/62 PASS.
- Independent finding harness: 3/3 PASS with vulnerable behavior reproduced.
- Two client typechecks, scoped lint/format, five boundary tests and the actual
  boundary scanner: PASS.
- Two scoped candidate paths/delta: exact; shared transport core and A1
  contract unchanged from the candidate parent.
- No unrelated full suite was repeated.

All Slot1 review rights and helper/output ownership are returned to Root. No
browser, port, product, standard-test, network, native or A2 rights were
acquired.

## WRN-AGENT-STATUS

- Task: A3-INDEPENDENT
- Status: RED
- Quellstand: immutable A3 `d4f8456a` over `0aef655c`
- Erledigt: byte/deadline/cancellation/origin/privacy review, focused/static/
  boundary reproduction, three-case clock-failure proof
- Tests: 62 focused + 3 independent; 2 types; 5 boundaries; scanner/static PASS
- Offen: close `A3-INDEPENDENT-M-001`, then narrow independent verification
- Handoff: this path
- Naechster Schritt: Root binds the exact clock-normalization correction
- Rechte: all returned; Slot1 free
- END-CHECK: :)
