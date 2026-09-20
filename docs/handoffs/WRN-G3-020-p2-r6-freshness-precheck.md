# Agent Handoff – WRN-G3-020 P2-R6 Freshness-Precheck

- Agent: `/root/g3020_p2_r6_precheck`
- Task-ID: `WRN-G3-020-P2-R6-FRESHNESS-PRECHECK`
- Ergebnis: **blockiert / FAIL; ein Low-Vertragsfinding**
- Eltern-/Kindbrief, Rolle und Instanz: Chief `/root`; unabhaengiger
  Architekturreview; Sol/high; keine Kinder
- Basiscommit / Ergebniscommit / Branch / Worktree: `dffcf64` / kein Commit
  durch Reviewer / `codex/g3-015-website-offline-shell` / Hauptcheckout
- Slot / Rechte: durch Chief reservierter read-only Precheckslot; nur Evidence
  und dieser Handoff schreibbar; kein Index/Commit
- Schreibarbeit beendet / Rechteuebergabe: ja; beide Berichte fertig, alle
  Rechte und Slot an Chief
- Unabhaengiger Reviewadressat: Chief `/root`

## Kurzfazit

Semantik, Grenzmatrix und Vierpfad-Allowlist des R6-Freshnessfixes sind
vollstaendig und minimal. Das Gate bleibt dennoch FAIL: Die geforderten
„acht Schutz-Hashes“ sind nicht eindeutig, weil die tatsaechlich geaenderte
Contractquelle nicht zur bisherigen Achtermenge gehoert. Nur null Findings
duerfen den Writer starten; daher bleibt Produktwrite gesperrt.

## Delegationsaufwand

- Keine Kinder, Unterdelegation oder Konflikte.
- Gemessene Token/Kosten: unbekannt.
- Aufwands-/Versuchsgrenze eingehalten.

## Verwendete Quellen

- `AGENTS.md`
- `docs/tasks/WRN-G3-020-P2-R6-FRESHNESS-CORRECTION.md`
- `docs/tasks/WRN-G3-020-P2-R1-CONTRACT-COMPLETION.md`, R1-02
- `docs/evidence/WRN-G3-020/P2-R4-B-R5-FINAL-ARCHITECTURE-CLOSURE.md`
- `docs/handoffs/WRN-G3-020-p2-r4-b-r5-final-architecture-closure.md`
- `packages/content-contracts/src/mobile-regional-events-v1.ts`
- `packages/content-contracts/tests/mobile-regional-events-v1.test.ts`
- bisherige acht Hashgrenzpfade und deren kanonische Abschlussbelege

## Geaenderte Dateien

1. `docs/evidence/WRN-G3-020/P2-R6-FRESHNESS-PRECHECK.md`
2. dieser Handoff

Keine andere Datei, kein Git-Index und kein Commit wurden geaendert.

## Tests und Belege

- Exakte Node-Version: 24.19.0.
- Fokussierte bestehende Contractdatei: 8/8 PASS.
- Quelltrace der vier Relationen und acht Equal-/`+1 ms`-Richtungen: PASS.
- Allowlist-/Modularitaets-/Folgegatepruefung: PASS bis auf die Hashmatrix.
- Aktueller Contractmodulhash:
  `8c42bade5807cb03709b8b987dda596b1f2fd9ab77b2a6fd4d04e33dd549a6eb`.
- Bisherige acht Grenzen enthalten Fixture/Pin, Contract-Index und sechs
  Clientgrenzen, nicht das zu aendernde Contractmodul.

## Feststellungen nach Prioritaet

### Low – `G3-020-P2-R6-PRE-L-001`

`docs/tasks/WRN-G3-020-P2-R6-FRESHNESS-CORRECTION.md:60-62` vermischt die
bisherige Achtermenge mit dem neuen, erwartbar veraenderten Contractmodul.
Wenn dieses hinzukommt, sind neun Positionen zu pruefen; wenn eine alte Grenze
entfallen soll, ist sie nicht benannt. Dadurch kann Writer/QA keinen
objektiven Hashabschluss liefern. Vollstaendige Begruendung und engste
Korrektur stehen in der Evidence.

Keine weiteren Blocker-, High-, Medium- oder Low-Findings.

## Annahmen und offene Fragen

Das Finding beruht nicht auf einer Produktannahme. Offen ist nur, welche
Hashmenge der Chief bewusst binden will. Die engste und staerkste Variante ist
der Vor-/Nachhash der Contractquelle plus die unveraenderten bisherigen acht
Grenzen.

## Restrisiken

Nach eindeutiger Hashbindung bleibt das uebliche Implementierungsrisiko der
vier neuen Vergleiche. Es wird durch die gebundene hashkorrekte Matrix, volle
Regression, frische QA, Security und finalen Sol-Abschluss angemessen gedeckt.

## Empfohlener naechster Schritt

Chief korrigiert ausschliesslich die Hashmatrix im R6-Vertrag und bindet die
Pfade samt Soll-/Vorhashes explizit. Danach frischer enger Sol-Recheck. Keine
Produkt- oder Testarbeit vor dessen null-Findings-GREEN.

## WRN-AGENT-STATUS

- Task: `WRN-G3-020-P2-R6-FRESHNESS-PRECHECK`
- Status: **RED / FAIL; ein Low offen**
- Quellstand: `dffcf64`; Findingbasis `91824d2`
- Erledigt: Freshnesssemantik, Matrix, Allowlist, Folgegates, Hash- und
  Zukunftsgrenzen unabhaengig geprueft
- Tests: bestehende fokussierte Contractdatei 8/8 PASS; Quell-/Hashtrace PASS
- Offen: `G3-020-P2-R6-PRE-L-001`; Produktwrite und P3 gesperrt
- Handoff: dieser Pfad
- Naechster Schritt: enge Chief-Dokumentkorrektur und frischer Recheck
- Token/Kosten: unbekannt
- END-CHECK: :)
