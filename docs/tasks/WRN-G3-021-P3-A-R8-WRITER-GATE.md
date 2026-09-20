# WRN-G3-021 P3-A-R8 – Writer-Gate

Status: **GREEN GEBUNDEN – GENAU EIN FRISCHER WRITER NACH DIESEM COMMIT**

## Autorität und feste Basis

- PO-101: exakt `START WRN-G3-021-P3-A`.
- Fester zu korrigierender Kandidat:
  `7fe4b7a790c374ca6313554916b612b354c2a7ed`.
- R8-Korrekturvertrag:
  `docs/tasks/WRN-G3-021-P3-A-R8-STORAGE-EPOCH-MATRIX-CORRECTION.md`, Commit
  `a812f5b896b7793dc26fe165bded877a3a339b50`.
- Frischer unabhängiger Sol/high-Precheck: GREEN im Evidencecommit `5905c2f`
  mit null Findings in allen Klassen.

Genau ein frischer `frontend_brand_engineer` Terra/high darf nach diesem
separaten Gatecommit ohne Kinder und ohne Git-Index ausschließlich R8
umsetzen. Alle früheren P3-/P3-A-Verträge bleiben bindend.

## Exakte Allowlist

1. `apps/mobile/src/mobile-media-hub.ts`
2. `apps/mobile/src/mobile-media-player.ts`
3. `apps/mobile/src/mobile-media-hub.test.ts`
4. `apps/mobile/src/mobile-media-player.test.ts`
5. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
6. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
7. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

Alle anderen Pfade einschließlich Resume-Store, Harness, P2, Fixtures,
Assets, App/UI, Config, Dependencies, Lockfiles und Git-Index sind read-only.

## Nicht verhandelbare Abnahmepunkte

1. Pause-Save und Resume-Seek bilden jeden aktuellen Read-/Store-/Snapshot-/
   Savefehler als Player-Availability, Player-Fehler und Resume-Status
   `storage-failure` ab; alte Fehler bleiben sinklos.
2. Jede Asyncfortsetzung prüft den originären Operations- oder Cleanup-Epoch
   und Mountstatus nach jedem Await sowie direkt vor Status, Playeraufruf oder
   neuer Storemutation.
3. Normales Cleanup startet nach Epochverlust kein Delete. Nur die Exact-
   Privacy-Kompensation eines erfüllten alten Save darf mit dem vollständigen
   Result-State und dessen Generation einmal löschen; sie ist für sämtliche
   Ergebnisse immer sinklos.
4. `hub.player.unmount` entfällt; ausschließlich `hub.unmount` schließt Hub
   und privaten Player.
5. Alle 42 Kombinationen aus sechs Ursachen und sieben Senken variieren real
   Kontrollfluss und Assertions in Units sowie echter Chromium-/IndexedDB-
   Ausführung. Regex-/Namensnutzung und duplizierte Happy-Paths sind verboten.
6. Timer-A/B, private Seek-/Duration-/CAS-Grenzen, `blocked > stale`, Fault-
   Tabelle und URL-Revoke bleiben unverändert geschlossen.

## Pflichtläufe und Rückgabe

Writer und Chief reproduzieren unter exakt Node 24.19:

- fokussierte Hub-/Player-/Resume-Units einschließlich echter 6×7-Matrix;
- zweimal die vollständige Chromium-/IndexedDB-Spec;
- sieben Typechecks, Mobile-Build, scoped ESLint/Prettier;
- 19 Boundaries, Fixture-/Releasechecks und zwölf Schutz-Hashes;
- vollen Mobilelauf mit ehrlicher Abgrenzung der drei gesperrten
  `App.test.tsx`-Baselinefehler;
- Diffcheck und exakte siebenpfadige Allowlist.

Der Writer hinterlässt nur einen unstaged, uncommitted WIP, aktualisiert die
zwei vorhandenen Belege und gibt alle Rechte zurück. Jeder zusätzliche Pfad,
Flake oder unvollständige Matrix ist Stop an den Chief. Nach Chief-GREEN
folgen erneut frische unabhängige QA, defensiver Integrity-/Privacy-Recheck
und finaler Architekturabschluss.

P4-B, echte Quellen/Medien, Provider, Website, Hosting/Live, Android/AAB/
Play, Signierung, Upload, Deployment und Release bleiben gesperrt/OUT.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R8-WRITER-GATE`
- Status: Precheck-GREEN gebunden; genau ein Writer nach Gatecommit
- Allowlist: exakt sieben Pfade
- P4-B und OUT/extern: gesperrt
- END-CHECK: :)
