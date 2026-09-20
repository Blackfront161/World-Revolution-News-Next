# Agent Handoff

- Agent: `production_translation_design`
- Task-ID: `WRN-PRODUCTION-TRANSLATION-DESIGN-2026-09-11`
- Ergebnis: bestanden for bounded design; production activation blocked
- Eltern-/Kindbrief, Rolle (Main/Fachlead/Helfer/Review) und Instanz-ID:
  Root brief `5ee86511`; independent architecture review, reserved Slot2
- Basiscommit / Ergebniscommit / Branch und Worktree:
  `5ee865113cdb648db7d1ceed5c9a901f1e6a697c`; documentation WIP only;
  `codex/g3-015-website-offline-shell`; shared main checkout
- Slot-ID / zentraler Slotvergeber / Status aller Kinder:
  Slot2 / Root; no children created
- Schreibarbeit beendet / Rechteuebergabe und Slotfreigabe bestaetigt durch:
  review writes ended; only the two new owned docs changed; rights returned to Root
- Unabhaengiger Reviewadressat (Main/Chief): Root / Head Chief

## Kurzfazit

The design gate passes. The smallest safe implementation is one target-owned
v1 HTTP contract and translation Worker, the existing shared production-reader
renderer, and thin separately configured app/website adapters. The server alone
derives `translation:v2:<sha256(canonical payload)>`, validates cached entry
identity, never reads v1 and calls the existing service binding at most once.
Client lifecycle identity uses the validated admission hash as the exact
article revision; article/release IDs stay local and only the selected public
paragraph plus languages crosses the network.

Production activation does not pass: no target server candidate/deployment,
upstream no-fallback/provenance evidence, verified quota/privacy/cost facts or
enabled client artifacts exist yet. The vulnerable route must be corrected or
retired before SEC-001 is closed.

## Accepted narrow clarification

- The minimal first adapter enforces both the new 32768-UTF-8-byte contract cap
  and the pinned legacy upstream's narrower 6000-JavaScript/UTF-16-code-unit
  cap before cache/upstream I/O. It rejects rather than truncates. This is
  sufficient for initial reuse and avoids a backend rewrite. Only a reviewed
  target-owned exact-text upstream contract plus adapter-version bump may raise
  the 6000-unit adapter cap.
- The legacy seam is not proof of `sourceLanguage`, no-fallback, or provider
  provenance behavior. Production activation stays disabled until the target
  adapter proves those properties.
- Read/abuse quota applies to every admitted request including cache hits.
  Provider request/input-character quota is reserved separately on a miss, and
  cache-write/storage budget is separate again. Any missing required quota port
  fails closed. Once provider dispatch may have occurred, an ambiguous outcome
  is not refunded or retried.
- The new target candidate can be isolated local GREEN with those source and
  mocked tests while the old-route exposure remains open. Overall SEC-001
  production closure and rollout approval still require correction or
  retirement of that route. The exact proposed file list is unchanged.

## Delegationsaufwand (falls zutreffend)

- Arbeits-/Koordinationszeit, Nacharbeitsrunden, Konflikte: one bounded pass;
  one checkpoint to Root; current Home writer overlap documented for later
  sequential ownership
- Gemessene Token/Kosten mit Beleg oder `unbekannt`: unbekannt; zero provider/network cost
- Aufwands-/Versuchsgrenze eingehalten / Eskalation: yes; no escalation
- Helferhandoffs, gepruefte Befunde und Disposition: none

## Verwendete Quellen

- `AGENTS.md`, `docs/01-SOURCE-OF-TRUTH.md`, current task brief and handoff template
- `docs/03-TARGET-ARCHITECTURE.md`, ADR-005, ADR-008,
  `architecture/MIGRATION-WAVES.md`, `architecture/G2-OPEN-DECISIONS.md`
- `docs/security/WRN-G1-004/SEC-001-translation-cache-poisoning.md` and
  `docs/07-RISK-REGISTER.md`
- `docs/evidence/WRN-TRANSLATION-REUSE-2026-09-11.md` and its byte-pinned,
  zero-network harness (not rerun)
- original G2 requirement excerpt and 10 September requirements reconciliation
- current production content contracts, offline controller/view/shared renderer,
  both client wrappers/package configs, UI-language catalogs and G3-019 local
  translation guards

## Geaenderte Dateien

- `docs/evidence/WRN-PRODUCTION-TRANSLATION-DESIGN-2026-09-11.md` (new)
- `docs/handoffs/WRN-PRODUCTION-TRANSLATION-DESIGN-2026-09-11.md` (new)

No product, test, fixture, config, lock, legacy or Git-index writes.

## Tests und Belege

- Read-only source/contract inspection against `5ee86511`.
- No executable test was needed or authorized for this design-only pass.
- Existing SEC-001 reproduction was reused as instructed; it already records
  exit 0 and zero network calls. It was not presented as live evidence.
- Exact proposed files, contract, key material, cache transition, caps,
  timeouts, lifecycle, nine-language copy, local tests and activation evidence
  are in the matching evidence report.
- The accepted addendum binds the dual 6000-code-unit/32768-byte first-adapter
  cap, three separate quota ledgers and isolated-local versus production SEC-001
  disposition; no executable test was added.

## Feststellungen nach Prioritaet

1. HIGH: SEC-001 remains open until server-derived v2 keying is implemented,
   tested and deployed and the vulnerable route is corrected/retired.
2. MEDIUM: the disabled Mobile-only G3-019 fixture adapter is not the shared
   production-reader integration and must not be wired as one.
3. MEDIUM: upstream single-provider behavior, provenance, retention, quota and
   cost are not current evidence; local mocked implementation can proceed but
   activation cannot.
4. LOW: one minimal service workspace entry is needed; no framework or shared
   deployment coupling is justified.

## Annahmen und offene Fragen

- Design inference: `admittedContentSha256`, already validated over article and
  detail, is the exact article revision identity. A new content schema field is
  unnecessary.
- The actual `PROXY_SERVICE` transport mapping must come from the existing
  upstream seam. If it cannot enforce one attempt/no fallback and return exact
  provider provenance, preserve exact source language and avoid truncation,
  keep the target service disabled rather than invent a provider contract.
- Actual live endpoint, binding targets, quota/cost values and provider privacy
  facts are intentionally not guessed.

## Restrisiken

- A safe new client endpoint does not remediate an independently reachable
  vulnerable legacy endpoint.
- Platform-level logs/retention can differ from application log policy and need
  activation evidence.
- A compile-time disabled client is an intermediate rollback state, not feature
  completion; intercepted success in both real readers is mandatory locally.

## Empfohlener naechster Schritt

After the Home writer returns the overlapping shared paths, Root should bind
one implementation owner to the exact file list in the evidence report. Finish
contract/service/client code and mocked/intercepted validation locally. Then
collect only the enumerated external activation evidence; no additional generic
architecture ladder is needed unless the upstream fails the explicit
single-provider/provenance condition.

## WRN-AGENT-STATUS

- Task: `WRN-PRODUCTION-TRANSLATION-DESIGN-2026-09-11`
- Status: GREEN for bounded design; activation RED/incomplete
- Quellstand: `5ee865113cdb648db7d1ceed5c9a901f1e6a697c`
- Erledigt: exact implementable contract, service/client boundaries, SEC-001
  closure condition, cache transition, lifecycle, tests and activation evidence
- Tests: no new execution; read-only review; existing pinned harness reused
- Offen: implementation candidate, independent validation, deployed correction,
  provider/quota/privacy/cost evidence and enabled client releases
- Handoff: `docs/handoffs/WRN-PRODUCTION-TRANSLATION-DESIGN-2026-09-11.md`
- Naechster Schritt: Root binds sequential implementation after Home ownership returns
- END-CHECK: :)
