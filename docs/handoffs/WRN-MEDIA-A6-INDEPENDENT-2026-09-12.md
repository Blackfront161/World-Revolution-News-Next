# Handoff — WRN media A6 independent durability acceptance

## Decision

Bounded A6 candidate `1f62abdd25d227792dcb725f4e05df9f0b628ac2`
is **FAIL** with one open Medium, `A6-IND-M-001`. No product or shared test fix
was made.

## Finding and evidence

Historical A1 activation checks only that `allowedOrigins` is nonempty, while
ordinary A1 validation enforces one-to-eight canonical origins. Independent
Chrome reproduced genuine registered Ready for nine origins and for a set with
`not-an-origin`, both directly through the helper and through A6 `readActive`;
the ordinary validator rejected the same inputs. Exact paths, lines, impact and
closure conditions are in
`docs/evidence/WRN-MEDIA-A6-INDEPENDENT-2026-09-12/REPORT.md`.

The rest of the bounded matrix reproduced: 143 focused and 387 full contracts,
13 bound Chrome/IndexedDB cases, 4 independent probes, three typechecks, alias,
boundary and scoped static checks. The two A4 probes show real A6 postcommit
readback before any ordinary payload and safe durable state when readback or a
later payload fails.

## Rights and residual gates

Ports 43173-43175 are closed. All product/test/browser rights are returned.
Only this evidence folder and handoff were written. Provider, production
controller/A4 integration, UI, audio, native and full release remain open and
outside this review.

## WRN-AGENT-STATUS

- Task: `WRN-MEDIA-A6-INDEPENDENT-2026-09-12`
- Status: **FAIL**, one Medium open
- Finding: `A6-IND-M-001`
- Candidate: `1f62abdd25d227792dcb725f4e05df9f0b628ac2`
- Browser/product/test rights: returned
- END-CHECK: :(
