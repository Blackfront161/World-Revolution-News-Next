# Agent Handoff – WRN-G3-020 P2-R4-B-R3 Split-Precheck

- Agent: `/root/g3020_p2_r4_b_r3_split_precheck`
- Task-ID: `WRN-G3-020-P2-R4-B-R3-SPLIT-PRECHECK`
- Ergebnis: **blockiert – RED, ein Medium und ein Low**
- Eltern-/Kindbrief, Rolle und Instanz-ID: Chief `/root`; frischer
  unabhaengiger Sol/high-Review; keine Kinder
- Basiscommit / Ergebniscommit / Branch und Worktree: Basis
  `f739de1c1215f9357cfbe9080c8d4c34ce27516c`; Ergebniscommit nur fuer diese
  zwei Belegpfade, falls Gitrecht moeglich; Branch
  `codex/g3-015-website-offline-shell`, gemeinsamer Hauptcheckout
- Slot-ID / zentraler Slotvergeber / Status aller Kinder: Chief `/root`;
  `S2-R4-B-R3-P`; keine Kinder
- Schreibarbeit beendet / Rechteuebergabe und Slotfreigabe bestaetigt durch:
  nur Evidence/Handoff geschrieben; keine Produkt-/Testrechte; alle Rechte an
  Chief zurueck
- Unabhaengiger Reviewadressat: Chief `/root`

## Kurzfazit

Die zwei neuen Testpakete sind numerisch und technisch machbar, ihre Pfade
sind disjunkt und Playwright entdeckt beide neuen Specs ohne Configmutation.
Sie sind aber nicht vollstaendig: Replacement-Negativ-/Historienfaelle,
Equal-conflict, Rollback-lower mit Coverage und die Eventstore-Future-/Corrupt-
/Extra-/Missing-Matrix haben nach elf Browserfaellen weiterhin keinen Owner.
Ausserdem sind Runtimeimport bestehender Specs und die Parallel-/Integrations-
folge nicht entscheidungsfrei formuliert.

Beide Testwriter bleiben gesperrt. Es wurde kein Produktfinding festgestellt.

## Delegationsaufwand

- Arbeits-/Koordinationszeit, Nacharbeitsrunden, Konflikte: eine frische
  Reviewrunde; keine Kinder, keine Schreibkonflikte
- Gemessene Token/Kosten mit Beleg: unbekannt
- Aufwands-/Versuchsgrenze: eingehalten
- Helferhandoffs: keine

## Verwendete Quellen

- `AGENTS.md`
- beide R3-A-/R3-B-Briefs
- korrigierter R2-/R1-Vertrag und R4-Gesamtvertrag
- R2-Design, Prechecks, Recheck, Writerbelege und Handoffs
- Store-/Contractquellen, aktuelle Store-Spec, Harness, Fixture und
  Playwrightconfig
- Gitstaende `cb0f6bc`, `47a6fc3`, `0650aec`, `8ed72f7`, `f739de1`

## Geaenderte Dateien

1. `docs/evidence/WRN-G3-020/P2-R4-B-R3-SPLIT-PRECHECK.md`
2. `docs/handoffs/WRN-G3-020-p2-r4-b-r3-split-precheck.md`

Keine Produkt-, Test-, Fixture-, Pin-, Config-, Dependency-, Website- oder
Governancedatei wurde durch diesen Agenten geaendert.

## Tests und Belege

- Read-only Quell-, Vertrags-, Commit- und Testinventar auf HEAD `f739de1`.
- Lokale Node-24.19-Byte-/Hashrechnung bestaetigt alle 1023/1024/1025-,
  511/512/513- und 65535/65536/65537-Ziele als isoliert erreichbar.
- Statische Transaktionspruefung bestaetigt alle benannten S-/R-Failureseams.
- Keine Produkt-, Browser- oder externe Ausfuehrung beansprucht.

## Feststellungen nach Prioritaet

1. `P2-R4-B-R3-PRE-M-001`: Split laesst bindende Restmatrixpositionen ohne
   Owner; auch zwei gruene Writer koennten das QA-Finding nicht schliessen.
2. `P2-R4-B-R3-PRE-L-001`: Runtimeimport bestehender Specs und Parallel-/
   Chief-Integrationsfolge sind mehrdeutig.

## Annahmen und offene Fragen

Keine Produktannahme. Chief entscheidet nur die dokumentarische Zuordnung:
fehlende Faelle in R3-B aufnehmen oder als eigenen sequenziellen Restbrief
binden. Ein bestehender Spec darf nicht runtime-importiert werden.

## Restrisiken

Der Review pruefte Machbarkeit und Vertragsvollstaendigkeit, nicht eine spaetere
Testimplementierung. Nach Vertragskorrektur bleiben Writer, Chief-Matrix,
unabhaengige QA, Security/Privacy und finaler P2-Abschluss verpflichtend.

## Empfohlener naechster Schritt

Chief bindet eine enge Dokumentkorrektur mit vollstaendiger Restmatrix,
eindeutigen Writerpfaden und serieller Integration. Danach frischer Sol-
Recheck; keine Testaktivierung vorher.

Nur Empfehlung; keine automatische Ausfuehrung.

## WRN-AGENT-STATUS

- Task: WRN-G3-020 P2-R4-B-R3 Split-Precheck
- Status: RED
- Quellstand: `f739de1`; Produkt `cb0f6bc`; Browserstand `47a6fc3`
- Erledigt: Machbarkeit, Disjunktheit, Discovery und Restabdeckung geprueft
- Tests: read-only Inventar plus lokale Byte-/Hashrechnung
- Offen: Vertragskorrektur und frischer Recheck
- Handoff: dieser Pfad
- Naechster Schritt: Chief korrigiert die Splitvertraege
- END-CHECK: :)
