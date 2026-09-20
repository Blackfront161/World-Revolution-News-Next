# Agent Handoff

- Agent: `backend_data_reliability_engineer`
- Task-ID: WRN-G3-014 / P2-S Storage Completion
- Ergebnis: P2-S-Kandidat nach enger S5-Nachbesserung; **P2 insgesamt YELLOW**
- Eltern-/Kindbrief, Rolle und Instanz-ID: Chief-P2-S / Helfer
  `/root/g3014_storage_completion`
- Basiscommit / Ergebniscommit / Branch und Worktree: `cef6902` / `6b51419`
  (nach Erstkandidat `142fcac`) / `codex/g3-014-content-offline-transactions`,
  Hauptcheckout
- Slot-ID / zentraler Slotvergeber / Kinder: S5 / Chief / keine Kinder
- Unabhaengiger Reviewadressat: Main/Chief `/root`

## Kurzfazit

Chief-Uebernahme: Die belegte Speichergrundlage wird fuer P2-C angenommen;
dies ist keine unabhaengige Gesamt-QA oder Produktabnahme. Die beiden lokalen
IndexedDB-Primitiven sind fuer P2-C nutzbar:
vollstaendige Transaktionsabschluesse, Bundlebudget/Pointer-CAS, Safetypruning,
Pending/Clear/Recoveryfences, echte Tabrennen, Zeitmetadata und konsistente
aktive Snapshots sind belegt. Es gibt keine UI- oder Controlleraenderung, kein
neues Runtimepaket, keinen Service Worker und keine externe Aktion.

## P2-C API- und Ordnungsvertrag

1. `snapshot()` vor jeder Operation lesen und Generation/Clear-Epoch als
   `expected` weitergeben. `stale-operation` bedeutet neu lesen und den
   Nutzerfluss erneut entscheiden, nie alten Erfolg behaupten.
2. `prepareRecheck(operationId, expected)` muss vor jedem Quellenabruf
   erfolgreich komplettiert sein. Den nicht-null `pendingRecheck`-Token
   (`operationId`, `generation`, `clearEpoch`) aus dem Rueckgabekontrollstand
   behalten.
3. Nach verifiziertem Safetybeleg zuerst `recordSafety`; nur nach dessen
   abgeschlossenem Ledgercommit darf `completeRecheck(operationId, token,
   safety, checkedAt, currentExpected)` die Pflicht entfernen. Contentfehler
   ohne Safetybeleg lassen Pending bestehen. Ein nach Clear alter Token wird
   auch mit frischem Snapshot abgewiesen.
4. `saveCandidate` erzeugt/staged nur einen vollstaendigen, gegen den aktuellen
   Safetyledger validierten Bundle-Snapshot. Ein frisches aktives A ersetzt
   dessen eigene Pruefzeit; B verjuengt A nie. `activateCandidate(now, expected)`
   ist erst bei `pendingRecheck === null` und innerhalb der Kandidatfrist
   erlaubt und aktiviert nicht implizit beim Check. Danach ist A vorheriger
   Stand. `rollback(now, expected)` setzt die Frist auf das revalidierte A-
   Bundle, nie auf B.
5. Reader/Resume mussen `snapshot()` + `evaluateContentOfflineGuard(control,
   now)` verwenden. Bei `pending-recheck`, `expired`, `clock-regressed` oder
   fehlender Control keine lokale Inhaltsansicht freigeben. Bei erlaubter
   Zeit `observeTime(now, expected)` aufrufen und seine neue Generation
   uebernehmen. Diese metadata-only Beobachtung erhoeht niemals
   `lastSuccessfulSourceCheckAt` oder Bundle-`checkedAt`; eine Rueckwaertuhr
   wird `stale-operation` und fuehrt in denselben erneuten Quellencheck.
6. `readActive()` liefert `{ ready, generation, clearEpoch, checkedAt }` nur
   als gegen den nach der Hashpruefung erneut gelesenen Controlstand
   konsistenten Snapshot. P2-C darf keine eigenen direkten IDB-Lesewege
   erfinden.

## Test- und Evidenzstatus

Vollstaendige Befehle, RED-Herkunft und 32-PASS/2-erwartete-Skips-Run stehen
in `docs/evidence/WRN-G3-014/STORAGE-COMPLETION.md`. Format, Lint/19
Boundaries, sieben Typechecks, Unitmatrix, Releaseboundary, beide Builds und
`git diff --check` sind PASS. Quota ist ein explizit injizierter echter
IDB-Pfad, keine Speicherplatzbehauptung.

## Restrisiken und naechster Schritt

P2-C muss die komplette Reihenfolge in UI-neutralen Controllern verbinden:
Restore, Save, expliziter Check, Safety/Teilfehler, Stage, bewusste Aktivierung,
Rollback, Clear, Reader-/Resume-Guard und Fehlertexte. Danach muss der Chief
OFF-01–25 ohne UI gegen konkrete P2-Belege abgleichen. P3 bleibt bis dahin
gesperrt; P2-S ist keine Gesamtfreigabe oder sichtbare Abnahme.

## WRN-AGENT-STATUS

- Task: WRN-G3-014 / P2-S Storage Completion.
- Status: P2-S-Kandidat zur Chief-Uebernahme; P2 gesamt YELLOW.
- Erledigt: beidseitige IDB-Failure-/Race-/Safety-/Recoverysemantik,
  Schemafail-closed, Pre-Abort/Close-/Timeout- und externe Browserharnessbelege.
- Offen: P2-C und Chief-P2-Abgleich, danach erst P3.
- Handoff: dieser Pfad.
- END-CHECK: :)
