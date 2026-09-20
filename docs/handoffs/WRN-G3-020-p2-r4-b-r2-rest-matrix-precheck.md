# Agent Handoff – WRN-G3-020 P2-R4-B-R2 Restmatrix-Precheck

- Agent: `/root/g3020_p2_r4_b_r2_precheck`
- Task-ID: `WRN-G3-020-P2-R4-B-R2-REST-MATRIX-PRECHECK`
- Ergebnis: **nicht bestanden – RED, ein Medium und ein Low**
- Eltern-/Kindbrief, Rolle und Instanz-ID: Chief `/root`; frischer
  unabhaengiger Sol/high-Precheck; keine Kinder
- Basiscommit / Ergebniscommit / Branch und Worktree: Basis
  `0ce9b1b67ef5297bba4d3179e83f5608fd018bac`; Ergebniscommit nur fuer diese
  zwei Belegpfade, falls Gitrecht moeglich; Branch
  `codex/g3-015-website-offline-shell`, gemeinsamer Hauptcheckout
- Slot-ID / zentraler Slotvergeber / Status aller Kinder: Chief `/root`;
  Precheckslot; keine Kinder
- Schreibarbeit beendet / Rechteuebergabe und Slotfreigabe bestaetigt durch:
  nur Evidence und Handoff geschrieben; alle Rechte zurueck an Chief
- Unabhaengiger Reviewadressat: Chief `/root`

## Kurzfazit

Der Writer darf noch nicht starten. Die behauptete Byte-Dominanz der
1.023/1.024/1.025-Referencegrenzen ist falsch, weil der produktive
Safetyvalidator historische Reference-Supersets akzeptiert und nur die
Coverage von Entries nach References, nicht die umgekehrte Beziehung fordert.
Gueltige eindeutige 1.023- und 1.024-Reference-Zustaende bleiben mit etwa
43 KiB unter dem 65.536-Bytecap und muessen deshalb als echte positive finale
Chrome-IDB-Merges belegt werden; 1.025 isoliert das Referencecap negativ.

Zusaetzlich ist die vorhandene Quota-Technik eine browserseitige
IDB-API-Grenz-Fehlerinjektion durch temporaeres Ueberschreiben von
`IDBObjectStore.prototype.put`, kein nativer oder physisch erzeugter
Quota-Fehler. Der Beleg soll dies exakt so benennen.

## Verwendete Quellen

- `AGENTS.md`
- `docs/tasks/WRN-G3-020-P2-R4-B-R2-REST-MATRIX.md`
- `docs/tasks/WRN-G3-020-P2-R4-TEST-COMPLETION.md`
- `docs/evidence/WRN-G3-020/P2-R4-B-R2-REST-MATRIX-DESIGN.md`
- `docs/handoffs/WRN-G3-020-p2-r4-b-r2-rest-matrix-design.md`
- `docs/evidence/WRN-G3-020/P2-R4-B-R1-IDB-MATRIX.md`
- `docs/handoffs/WRN-G3-020-p2-r4-b-r1-idb-matrix.md`
- `apps/mobile/src/mobile-regional-events.ts`
- `apps/mobile/src/mobile-regional-events-store.ts`
- `apps/mobile/src/mobile-regional-events-store.test.ts`
- `apps/mobile/src/mobile-regional-events-selection.ts`
- `apps/mobile/src/mobile-regional-events-selection.test.ts`
- `tests/e2e/g3-020-regional-events-store-harness.ts`
- `tests/e2e/g3-020-regional-events-store.spec.ts`

## Geaenderte Dateien

1. `docs/evidence/WRN-G3-020/P2-R4-B-R2-REST-MATRIX-PRECHECK.md`
2. `docs/handoffs/WRN-G3-020-p2-r4-b-r2-rest-matrix-precheck.md`

Keine Produkt-, Test-, Fixture-, Pin-, Config-, Dependency-, Website- oder
Governancedatei wurde geaendert.

## Findings und Disposition

1. `P2-R4-B-R2-PRE-M-001`: Die Werte 88.652/88.724/88.825 sind nur fuer
   kuenstlich entry-gekoppelte Records korrekt, aber keine Untergrenzen des
   akzeptierten Safetyzustands. Pflicht: echte finale Browser-Merges bei
   1.023/1.024 PASS und 1.025 `protected` vor erstem Safety-`put`.
2. `P2-R4-B-R2-PRE-L-001`: Quota nicht als nativen Sinkfehler bezeichnen.
   Pflicht: ehrlich als deterministische browserseitige IDB-API-Grenz-
   Fehlerinjektion ohne physische Speichermessung dokumentieren.

Die getrennte 511/512/513-Entry-, 65.535/65.536/65.537-Byte-, A1-H9-,
Hash-/Wildcard- und Failurephasenarchitektur ist nach dieser engen Korrektur
weiter nutzbar. Es wurde kein Produktfinding festgestellt.

## Tests und Belege

- Read-only Quell-/Vertragsvergleich auf HEAD `0ce9b1b`.
- Unabhaengige lokale Node-24.19-Byteberechnung:
  - Designobjekte: 88.652 / 88.724 / 88.825 Bytes;
  - eindeutige historische Reference-Supersets: 43.082 / 43.124 / 43.166
    Bytes fuer 1.023 / 1.024 / 1.025.
- Keine Produkt- oder Browserausfuehrung beansprucht.
- Token/Kosten: unbekannt.

## Naechster Schritt und Rechte

Chief korrigiert Design und Task Brief eng, bindet die drei echten
Reference-Finalmergefaelle und die Quota-Terminologie und startet danach einen
frischen unabhaengigen Sol-Recheck. Bis zu dessen null Findings bleiben alle
Testwrite-Rechte beim Chief. Kein automatischer Writer-, P2-, P3- oder
Release-Start.

## WRN-AGENT-STATUS

- Task: WRN-G3-020 P2-R4-B-R2 Restmatrix-Precheck
- Status: RED – ein Medium und ein Low offen; Testwrite gesperrt
- Basis: `0ce9b1b`; Produkt `cb0f6bc`; Design `6af249f`
- Erledigt: unabhaengige Caps-/Dominanz-/Pin-/Failure-/Scopepruefung
- Offen: korrigierter Vertrag und frischer Sol-Recheck
- Rechte: vollstaendig zurueck beim Chief; keine Kinder
- Handoff: dieser Pfad
- Naechster Schritt: Chief korrigiert nur Dokumentvertrag; kein Produktwrite
- END-CHECK: :)
