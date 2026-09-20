# Agent Handoff – WRN-G3-020 P2-R4-R2 Selection-Bytecap-Precheck

- Agent: `/root/g3020_selection_cap_precheck`
- Task-ID: `WRN-G3-020-P2-R4-R2-SELECTION-BYTE-CAP-PRECHECK`
- Ergebnis: **bestanden / GREEN / null Findings**
- Eltern-/Kindbrief, Rolle (Main/Fachlead/Helfer/Review) und Instanz-ID:
  Chief `/root`; unabhaengiger Sol/high-Review; keine Kinder
- Basiscommit / Ergebniscommit / Branch und Worktree: `b097464`; Ergebniscommit
  bei Uebergabe noch ausstehend; `codex/g3-015-website-offline-shell`;
  Hauptcheckout
- Slot-ID / zentraler Slotvergeber / Status aller Kinder: Chief `/root`;
  keine Kinder
- Schreibarbeit beendet / Rechteuebergabe und Slotfreigabe bestaetigt durch:
  nur die zwei erlaubten Reviewdokumente geschrieben; Produkt-/Testrechte
  blieben beim Chief und werden mit diesem Handoff vollstaendig zurueckgegeben
- Unabhaengiger Reviewadressat (Main/Chief): Chief `/root`

## Kurzfazit

Der Vertrag trifft die reproduzierte Ursache exakt: Der bestehende Readpfad
erzwingt das 4096-Byte-Cap, der Savepfad prueft `next` vor `put()` noch nicht.
Die drei Gesamtrecordgrenzen und ein trennscharfer Mehrbytefall sind exakt
konstruierbar. Fehlercode, Nullmutation, Restart, CAS/Clear/Isolation,
Allowlist und Gatefolge sind vollstaendig und entscheidungsfrei gebunden.
Gate: GREEN fuer genau einen engen Terra/high-Writer.

## Delegationsaufwand (falls zutreffend)

- Arbeits-/Koordinationszeit, Nacharbeitsrunden, Konflikte: eine unabhaengige
  Reviewrunde; keine Konflikte
- Gemessene Token/Kosten mit Beleg oder `unbekannt`: unbekannt; vorhandenes
  Codex-Kontingent
- Aufwands-/Versuchsgrenze eingehalten / Eskalation: eingehalten; kein
  Netzwerk, keine Installation, keine externe Aktion
- Helferhandoffs, gepruefte Befunde und Disposition: keine Kinder

## Verwendete Quellen

- `AGENTS.md` vollstaendig
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/tasks/WRN-G3-020-P2-R4-R2-SELECTION-BYTE-CAP.md`
- `docs/tasks/WRN-G3-020-P2-R4-TEST-COMPLETION.md`
- `docs/tasks/WRN-G3-020-P2-R4-R1-PRODUCT-CORRECTION.md`
- `docs/tasks/WRN-G3-020-P2-R2-FINAL-CONTRACT.md`
- `docs/tasks/WRN-G3-020-P2-BACKEND-PACKET.md`
- `docs/evidence/WRN-G3-020/P2-R4-B-IDB-MATRIX.md`
- `docs/handoffs/WRN-G3-020-p2-r4-b-idb-matrix.md`
- `apps/mobile/src/mobile-regional-events-selection.ts`
- `apps/mobile/src/mobile-regional-events-selection.test.ts`
- `tests/e2e/g3-020-regional-events-store-harness.ts`
- `tests/e2e/g3-020-regional-events-store.spec.ts`
- `packages/content-contracts/src/index.ts`
- `docs/WRN-G3-020-DELEGATION-REGISTER.md`

## Geaenderte Dateien

- `docs/evidence/WRN-G3-020/P2-R4-R2-SELECTION-BYTE-CAP-PRECHECK.md`
- `docs/handoffs/WRN-G3-020-p2-r4-r2-selection-byte-cap-precheck.md`

Keine Produkt-, Test-, Fixture-, Package-, Konfigurations- oder
Dependencydatei wurde veraendert.

## Tests und Belege

- Exakte Node-Version 24.19.
- `mobile-regional-events-selection.test.ts`: 1 Testdatei, 1 Test, PASS.
- Seiteneffektfreie Recordgroessenberechnung: leere Recordbasis 215 Bytes;
  exakte 4095/4096/4097-Paddings fuer Generation 1 und 2; Mehrbytefall zeigt
  4096 Codeunits gegen 4097 UTF-8-Bytes.
- Quellvergleich `c86735f..HEAD`: Selectionprodukt und Selectionunit bytegleich.
- `git diff --check`: vor Reviewdokumenten PASS.
- Historischer echter Chrome-/IDB-RED `fd6da12` quellseitig bestaetigt; keine
  temporaere Reproduktion und keine Testmutation in diesem Review.

## Feststellungen nach Prioritaet

Keine Findings.

Fakt: Die fehlende Vor-Sink-Pruefung liegt exakt zwischen `next`-Erzeugung und
`store.put(next)`. Fakt: Alle geforderten Bytewerte sind erreichbar. Bewertung:
Der Vertrag ist minimal, fail-closed und fuehrt keine neue Architektur- oder
Produktentscheidung ein.

## Annahmen und offene Fragen

Keine offene Vertragsentscheidung. Der Writer muss die Byteziele dynamisch am
gesamten serialisierten Record ableiten und darf sie nicht als feste
`regionId.length`-Werte behandeln.

## Restrisiken

Die restliche R4-B-Failure-/Rotationmatrix wurde wegen des historischen
Stopbefunds noch nicht fertiggestellt. Dieser Precheck schliesst sie nicht;
sie wird erst nach Fix, Chief-Reproduktion und QA/Security neu aktiviert.

## Empfohlener naechster Schritt

Chief aktiviert genau einen `backend_data_reliability_engineer` Terra/high
auf der fuenfpfadigen Allowlist. Danach unveraendert Chief-Reproduktion,
frische Terra-QA, versiegelter Sol-Security-/Privacy-Deltacheck und neue
R4-B-Runde. Kein P2-, P3- oder Release-GREEN aus diesem Handoff.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R4-R2 Selection-Bytecap-Precheck
- Status: GREEN – null Findings
- Quellstand: `b097464`; Produkt `c86735f`; R4-A `981ead6`; RED `fd6da12`
- Erledigt: vollstaendiger enger Architektur-/Privacy-/Testbarkeitsreview
- Tests: 1/1 Mobile-Vitest PASS; Bytekonstruktion PASS
- Offen: Writer, Chief-Reproduktion, QA/Security, neue R4-B-Matrix, P2-Abschluss
- Handoff: dieser Pfad
- Naechster Schritt: Chief aktiviert den engen Terra/high-Writer
- END-CHECK: :)
