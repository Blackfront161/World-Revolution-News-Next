# Agent Handoff – WRN-G3-020 P2-R4 Precheck

- Agent: `/root/g3020_p2_r4_precheck`
- Task-ID: `WRN-G3-020-P2-R4-PRECHECK`
- Ergebnis: teilweise / **YELLOW, fail-closed**
- Eltern-/Kindbrief, Rolle und Instanz-ID: Chief `/root`; frischer
  unabhaengiger Sol/high-Precheck; Instanz `/root/g3020_p2_r4_precheck`;
  keine Kinder
- Basiscommit / Ergebniscommit / Branch und Worktree: gebundene Basis
  `290e585`; Produkt `4ec5fe6`; Review-HEAD `595e092` nur mit
  Registeraktivierung; dieser Zwei-Dateien-Commit / Branch
  `codex/g3-015-website-offline-shell` / Hauptcheckout
- Slot-ID / zentraler Slotvergeber / Status aller Kinder: Chief `/root`;
  keine Kinder
- Schreibarbeit beendet / Rechteuebergabe und Slotfreigabe bestaetigt durch:
  nur Evidence und dieses Handoff; nach Commit vollstaendig an Chief
- Unabhaengiger Reviewadressat: Chief `/root` direkt

## Kurzfazit

R4 ist als breite test-only Nachlieferung grundsaetzlich realistisch. Die
Capgrenzen sind erreichbar, beide Writerbereiche sind dateiseitig disjunkt,
und Write-/Readback-/Abort-/Quota-Fehler koennen im Harness gezielt gegen
echte Chrome-IDB injiziert werden, ohne eine Produktseam einzufuehren.

Das Gate bleibt trotzdem YELLOW. Der eingefrorene Store akzeptiert
Activate-lower bei voller Coverage, obwohl R3 und R4 `protected` verlangen.
Zudem verwirft er gueltige mehrfach verwendete Referencekeys, statt die
R3-Union zu deduplizieren; R4 bindet die dafuer noetigen positiven Faelle
nicht explizit. Beide notwendigen Tests waeren am Produkt RED und duerfen in
einem test-only-Paket nicht repariert werden. Ferner muss der gemeinsame
Git-Index ueber Stage **und** Commit serialisiert werden.

## Delegationsaufwand

- Arbeits-/Koordinationszeit, Nacharbeitsrunden, Konflikte: ein direkter
  read-only Review; parallele Chief-Registeraenderung erhalten
- Gemessene Token/Kosten mit Beleg oder `unbekannt`: unbekannt
- Aufwands-/Versuchsgrenze eingehalten / Eskalation: eingehalten; kein Spawn,
  kein Netz, keine Produkt-/Test-/Fixturemutation
- Helferhandoffs, gepruefte Befunde und Disposition: keine Kinder

## Verwendete Quellen

- `AGENTS.md` vollstaendig, Source-of-Truth, Qualitaetsregeln und
  Handofftemplate
- G3-020-Produktbrief; P2, P2-R1 Contract Completion, P2-R2 Final Contract,
  P2-R1 Correction, P2-R3 Correction und massgeblich P2-R4 Test Completion
- QA `afd4c05`, Security `13bb86f` / Scan
  `2a13c8f3-4052-404c-8074-93e4e37e3bf0`, Design `0108fc3`, Precheck
  `219ae55`, Writer `4ec5fe6` / Docs `b2e730d`
- Contract-, Loader-/Projektions-, Eventstore-, Selection- und G3-020-E2E-
  Quellen und Tests

## Geaenderte Dateien

- `docs/evidence/WRN-G3-020/P2-R4-PRECHECK.md`
- `docs/handoffs/WRN-G3-020-p2-r4-precheck.md`

Keine Produkt-, Test-, Fixture-, Browserquell-, Governance-, Dependency-,
Config-, Lock- oder externe Datei geaendert.

## Tests und Belege

- exakt Node `v24.19.0`
- vier fokussierte Contract-/Mobiledateien: 12/12 PASS
- Contract- und Mobile-Typecheck: beide Exit 0
- 511/512/513, 1023/1024/1025 und 65535/65536/65537 unabhaengig als
  erreichbar berechnet
- Chrome-IDB-Prototypen `put`, `get`, `abort`: writable/configurable; enge
  test-only Failure Injection ohne Produktseam moeglich
- `git diff --check 4ec5fe6..290e585`: PASS
- Produkt-/Test-/Fixture-/Dependencydelta seit `4ec5fe6`: leer
- Fixture-/Pin plus sieben Boundaryhashes: 8/8 exakt

## Feststellungen nach Prioritaet

- **Medium `P2-R4-PRE-M-001`:** Activate-lower rotiert am Produkt bei voller
  Coverage statt `protected`; der verpflichtende R4-B-Test wird RED.
- **Medium `P2-R4-PRE-M-002`:** gleiche Referencekeys aus mehreren gueltigen
  Revocations werden nicht dedupliziert; notwendige positive R4-Faelle fehlen
  und waeren am Produkt RED.
- **Low `P2-R4-PRE-L-001`:** Disjunkte Dateipfade schuetzen nicht den globalen
  Shared-Worktree-Index; Stage und Commit muessen exklusiv serialisiert werden.

## Annahmen und offene Fragen

Keine Freigabeannahme. Injizierte Quota-/Readbackfehler duerfen als echte
Produktoperation gegen echte IDB, aber nicht als natuerlich erzeugter Browser-
Quotaausfall bezeichnet werden. Direkte IDB-Setuprecords fuer historische
Releases muessen von oeffentlichen Produktmutationen getrennt ausgewiesen
werden.

## Restrisiken

Ohne Produktkorrektur kann R4 die eigene Pflichtmatrix nicht GREEN ausfuehren.
Ohne explizite Reference-Dedupe-Regression bliebe eine bekannte
Verfuegbarkeits-/Vertragsabweichung unsichtbar. Ohne Indexprotokoll koennen
Writercommits vermischt werden. P2, P3 und alle externen Gates bleiben
gesperrt.

## Empfohlener naechster Schritt

Chief bindet einen engen Produktkorrekturvertrag fuer operationstypisierte
Lower-Revisionsemantik und eindeutige Reference-Union, ergaenzt die zwei
positiven R4-Regressionen und serialisiert im Shared Worktree R4-A-Stage+
Commit vor R4-B-Stage+Commit. Nach Produktfix und frischen QA-/Securitygates
folgt ein neuer unabhaengiger R4-Precheck. Keine automatische Ausfuehrung.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R4-PRECHECK
- Status: YELLOW / fail-closed
- Quellstand: `290e585`; Produkt `4ec5fe6`; Review-HEAD `595e092`
- Erledigt: vollstaendiger R4-Vertrags-/Machbarkeits-/Quellreview
- Tests: 12 fokussierte PASS; beide Typechecks PASS; Cap-, IDB-, Diff- und
  Hashpruefungen abgeschlossen
- Offen: zwei Medium, ein Low; keine R4-A/B-Aktivierung
- Handoff: dieser Pfad
- Naechster Schritt: enger Chief-Korrekturvertrag und frischer Precheck
- Rechte: nach Ergebniscommit vollstaendig an Chief zurueck
- END-CHECK: :)
