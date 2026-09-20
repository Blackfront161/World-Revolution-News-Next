# Agent Handoff – WRN-G3-020 P2-R4-B-R2 Restmatrix-Design

- Agent: `/root/g3020_p2_r4_b_r2_design`
- Task-ID: `WRN-G3-020-P2-R4-B-R2-REST-MATRIX-DESIGN`
- Ergebnis: **bestanden – GREEN, kein Produktfinding**
- Eltern-/Kindbrief, Rolle und Instanz-ID: Chief `/root`; frischer
  unabhaengiger Sol/high-Architekturdesigner; keine Kinder
- Basiscommit / Ergebniscommit / Branch und Worktree: Basis `611b285`;
  Ergebniscommit durch Agent falls Gitrecht moeglich; Branch
  `codex/g3-015-website-offline-shell`, gemeinsamer Hauptcheckout
- Slot-ID / zentraler Slotvergeber / Status aller Kinder: Chief `/root`;
  Designslot; keine Kinder
- Schreibarbeit beendet / Rechteuebergabe und Slotfreigabe bestaetigt durch:
  nur diese Evidence und dieses Handoff geschrieben; alle Rechte zurueck an Chief
- Unabhaengiger Reviewadressat (Main/Chief): Chief `/root`

## Kurzfazit

Die verbleibende R4-B-Matrix ist ohne Produkt-Testhook oder Dependency
vollstaendig testbar. Die Referencepositionen 1.023/1.024/1.025 sind wegen des
65.536-Byte-Caps mathematisch unerreichbar und werden mit exakten
Untergrenzenwerten 88.652/88.724/88.825 als Units belegt. Die Entrygrenzen
511/512/513 sowie 65.535/65.536/65.537 Bytes bleiben echte finale
Chrome-IDB-Mergepfade.

Eine testseitige, fail-closed Vite-Antwortbindung emuliert nacheinander A1 bis
H9 als verschiedene App-Binaries und ermoeglicht damit oeffentliche
`saveCandidate`-/Activate-/Rollback- und Zwei-Tab-CAS-Belege bei erhaltener
Origin-IDB, ohne die Produktquelle oder den Pin auf Disk zu veraendern.

## Delegationsaufwand (falls zutreffend)

- Arbeits-/Koordinationszeit, Nacharbeitsrunden, Konflikte: eine read-only
  Designrunde; keine Konflikte und keine Kinder
- Gemessene Token/Kosten mit Beleg oder `unbekannt`: unbekannt
- Aufwands-/Versuchsgrenze eingehalten / Eskalation: eingehalten; keine
  Installation, kein Netz und keine Scopeausweitung
- Helferhandoffs, gepruefte Befunde und Disposition: keine

## Verwendete Quellen

- `AGENTS.md`
- `docs/tasks/WRN-G3-020-P2-R4-TEST-COMPLETION.md`
- `docs/tasks/WRN-G3-020-P2-R2-FINAL-CONTRACT.md`
- `docs/tasks/WRN-G3-020-P2-R3-CORRECTION.md`
- `docs/tasks/WRN-G3-020-P2-R4-R1-PRODUCT-CORRECTION.md`
- `docs/evidence/WRN-G3-020/P2-R4-B-R1-IDB-MATRIX.md`
- `docs/handoffs/WRN-G3-020-p2-r4-b-r1-idb-matrix.md`
- `packages/content-contracts/src/mobile-regional-events-v1.ts`
- `apps/mobile/src/mobile-regional-events.ts`
- `apps/mobile/src/mobile-regional-events-store.ts`
- `apps/mobile/src/mobile-regional-events-store.test.ts`
- `apps/mobile/src/mobile-regional-events-selection.ts`
- `apps/mobile/src/mobile-regional-events-selection.test.ts`
- `tests/e2e/g3-020-regional-events-store-harness.ts`
- `tests/e2e/g3-020-regional-events-store.spec.ts`

## Geaenderte Dateien

1. `docs/evidence/WRN-G3-020/P2-R4-B-R2-REST-MATRIX-DESIGN.md`
2. `docs/handoffs/WRN-G3-020-p2-r4-b-r2-rest-matrix-design.md`

Keine Produkt-, Test-, Fixture-, Pin-, Konfigurations-, Dependency- oder
Governancedatei wurde geaendert.

## Tests und Belege

- Read-only Vergleich des aktuellen Store-/Loader-/Selection-/E2E-Codes mit
  R2/R3/R4.
- Unabhaengige UTF-8-/JSON-Untergrenzenberechnung mit lokalem Node 24.19:
  1.023 = 88.652, 1.024 = 88.724, 1.025 = 88.825 Bytes.
- Keine Produkt- oder Testausfuehrung beansprucht; der Auftrag war Design,
  nicht Implementierung oder Gateabschluss.

## Feststellungen nach Prioritaet

1. **Kein Produktfinding.** Die offene Luecke ist Testcompletion.
2. **Vertragsinvariante:** Reference 1.023/1.024/1.025 kann nie ein positiver
   Storepfad sein, weil schon eine unrealistisch kleine Untergrenze das
   Bytecap deutlich ueberschreitet.
3. **Testarchitektur:** Mehrere gepinnte Releases lassen sich ohne Produktseam
   durch getrennte Seiten/Binaries und eine fail-closed lokale
   Testantwortbindung pruefen.
4. **Ehrliche Failuregrenze:** Quota wird deterministisch als browserseitige
   DOMException am IDB-Sink injiziert, nicht als reale Geraete-
   Speichererschoepfung behauptet.

## Annahmen und offene Fragen

Keine Produktentscheidung ist offen. Der R4-B-R2-Writer muss die
Einzeltreffer-Assertion fuer die Pinantwort einhalten; wenn die lokale
Vite-Quellform dies am Ausfuehrungsstand nicht erlaubt, ist das ein RED-
Testseam-Befund und keine Erlaubnis zu Produktmutation.

## Restrisiken

- Die testseitige Pinantwortbindung ist absichtlich an die aktuelle lokale
  Quellform gebunden und soll bei Drift hart fehlschlagen.
- Die Restmatrix kann bei ihrer ersten echten Ausfuehrung einen bisher
  unbekannten Produktfehler reproduzieren. Dann gilt die Stopregel; dieses
  Design erteilt keine Fixrechte.
- P2/P3 sowie alle externen Gates bleiben ungeprueft und gesperrt.

## Empfohlener naechster Schritt

Chief prueft den zweipfadigen Designdiff und bindet danach einen einzelnen
Terra/high-R4-B-R2-Testwriter an die vier bestehenden Testpfade plus eigene
Belege. Nach Writer und Chief-Reproduktion folgen frische unabhaengige QA,
Security/Privacy und ein Sol-P2-Abschluss.

Nur Empfehlung; keine automatische Ausfuehrung.

## WRN-AGENT-STATUS

- Task: WRN-G3-020 P2-R4-B-R2 Restmatrix-Design
- Status: GREEN
- Quellstand: `611b285`; Produkt `cb0f6bc`; R4-A `981ead6`; R4-B-R1
  `14a83c5` / `159077d`
- Erledigt: entscheidungsfreie Restmatrix und genaue Browser-/Unit-Zuordnung
- Tests: nur read-only Designbeleg und numerische Berechnung; keine
  Produkt-/Testausfuehrung
- Offen: Chief-Review, Testwriter, Gesamtmatrix, QA, Security/Privacy,
  finaler P2-Abschluss
- Handoff: dieser Pfad
- Naechster Schritt: Chief disponiert eng; kein automatischer Folgeauftrag
- END-CHECK: :)
