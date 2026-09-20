# WRN-G3-021 P3-A-R9-R1 – Writer-Gate

Status: **GREEN GEBUNDEN – GENAU EIN FRISCHER WRITER NACH DIESEM COMMIT**

## Autorität und feste Basis

- PO-101: exakt `START WRN-G3-021-P3-A`.
- Fester zu korrigierender Produktkandidat:
  `c2265afd8cb4c8391f6a34d8f9b97533cba3e8d9`.
- R9-Vertrag:
  `docs/tasks/WRN-G3-021-P3-A-R9-LATE-STORAGE-MATRIX-CORRECTION.md`, Commit
  `dd6bbad6dfebbffc4bb46b765c9b25914c01e128`.
- Vorrangiger R9-R1-Nachtrag:
  `docs/tasks/WRN-G3-021-P3-A-R9-R1-NOOP-PROVENANCE-COMPLETION.md`, Commit
  `56705ed410d3eb91569b2ba9e05bb2eb07514988`.
- Frischer unabhängiger Sol/high-R1-Abschlussrecheck: GREEN im
  Evidencecommit `192997d` mit null Findings in allen Klassen.

Genau ein frischer `frontend_brand_engineer` Terra/high darf nach diesem
separaten Gatecommit ohne Kinder und ohne Git-Index ausschließlich R9/R1
umsetzen. Alle früheren P3-/P3-A-Verträge bleiben bindend.

## Exakte Allowlist

1. `apps/mobile/src/mobile-media-hub.ts`
2. `apps/mobile/src/mobile-media-player.ts`
3. `apps/mobile/src/mobile-media-player.test.ts`
4. `apps/mobile/src/mobile-media-hub.test.ts`
5. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
6. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
7. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

Alle anderen Pfade einschließlich Resume-Store, P2, Fixtures, Assets,
App/UI, Harness, Config, Dependencies, Lockfiles und Git-Index sind read-only.
Es gibt keinen neuen Produkt-Testhook.

## Nicht verhandelbare Abnahmepunkte

1. Ein aktueller Storagefehler an jeder der fünf Player-Recheckgrenzen setzt
   atomar Playback `error`, Availability und Fehler `storage-failure`, räumt
   Element/`src`/Object URL ab und erreicht keine nachgelagerte Senke. Alte
   Recheckresultate bleiben vollständig sinklos. Network-/Invalid-/Timeout-
   Semantik bleibt unverändert.
2. Nur bestätigtes `result.kind === 'saved'` mit feldgleichem vollständigem
   Record im Result-State darf nach Epochverlust genau eine generation-/
   recordexakte, vollständig sinklose Kompensation starten.
3. Jedes alte Save-`no-op` startet null Delete und null weitere Storemutation.
   Vorbestehender exakter Record und Generation bleiben nach Run B, Unmount
   und Generationmismatch erhalten.
4. Die sieben R1-Datenverlustregressionen belegen zusätzlich den weiterhin
   erlaubten `saved`-Kompensationspfad, fehlenden Exact-record, Delete-`no-op`,
   Reject und Throw ohne öffentliche Folgesenke oder Retry.
5. Alle 42 Kombinationen aus sechs Ursachen und sieben Senken ändern real
   Setup, Asyncgrenze und literale Assertions. Die feste Save-, Cleanup-
   `no-op`- und Late-result-Zuordnung aus R9/R1 gilt in Unit und echter
   Chromium-/IndexedDB-Ausführung. Pauschale Zähler oder breite Zustandsmengen
   sind verboten.
6. R8-Epoch-/Mountguards, normales No-delete nach Epochverlust,
   `hub.player.unmount`-Entfernung, CAS/Retention/IDB, `blocked > stale`,
   Faulttabelle, URL-/Revoke-Ledger und alle früher geschlossenen Grenzen
   dürfen nicht abgeschwächt werden.
7. Die zwei Writerbelege nennen alle tatsächlichen Pfade, exakten Testzahlen,
   Matrixzuordnungen, IDB-Nachzustände und die ehrliche volle Mobile-Baseline.

## Pflichtläufe und Rückgabe

Writer und Chief reproduzieren unter exakt Node 24.19:

- alle fokussierten Hub-/Player-/Resume-Units einschließlich fünf Rechecks,
  echter 42-Zellen-Matrix und sieben Datenverlustregressionen;
- zweimal die vollständige Chromium-/IndexedDB-Spec;
- sieben Typechecks, Mobile-Build und scoped ESLint/Prettier;
- 19 Boundaries, Fixture-/Releasechecks und alle gebundenen Schutz-Hashes;
- vollen Mobilelauf mit ehrlicher Abgrenzung der drei gesperrten
  `App.test.tsx`-Baselinefehler;
- Diffcheck und exakte Sieben-Pfad-Allowlist.

Der Writer hinterlässt nur einen unstaged, uncommitted WIP, aktualisiert die
zwei vorhandenen Belege und gibt alle Rechte zurück. Jeder zusätzliche Pfad,
Flake, unvollständige Matrix oder neue Produktannahme ist Stop an den Chief.
Nach Chief-GREEN folgen erneut frische unabhängige Terra-QA, defensiver
Integrity-/Privacy-Recheck und erst bei beiden GREEN ein finaler
Architekturabschluss.

P4-B, echte Quellen/Medien, Provider, Website, Hosting/Live, Android/AAB/
Play, Signierung, Upload, Deployment und Release bleiben gesperrt/OUT.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R9-R1-WRITER-GATE`
- Status: Precheck-GREEN gebunden; genau ein Writer nach Gatecommit
- Allowlist: exakt sieben Pfade
- P4-B und OUT/extern: gesperrt
- END-CHECK: :)
