# WRN-G3-021 P3-A-R7-R1 – Writer-Gate

Status: **GREEN GEBUNDEN – GENAU EIN FRISCHER WRITER NACH DIESEM COMMIT**

## Autorität und feste Basis

- Product-Owner-Gate: PO-101, exakt `START WRN-G3-021-P3-A`.
- Unveränderter Produktkandidat:
  `67cc5921334867e97f5b0e124c934549b5605928`.
- R7-Parentvertrag:
  `docs/tasks/WRN-G3-021-P3-A-R7-PRODUCT-PRIVACY-ASSURANCE-CORRECTION.md`.
- R7-R1-Nachtrag:
  `docs/tasks/WRN-G3-021-P3-A-R7-R1-CONTRACT-COMPLETION.md`, Commit
  `fa8940642e9b155f404e165c0723dba66a644a95`.
- Unabhängiger R7-R1-Abschlussrecheck: GREEN im Evidencecommit `9025f22` mit
  High 0, Medium 0, Low 0, Privacy 0, Coverage 0 und deferred 0.

Alle früheren P3-/P3-A-Verträge bleiben bindend. Dieses Gate erteilt genau
einem frischen `frontend_brand_engineer` Terra/high ohne Kinder und ohne
Git-Index das Recht, die R7-/R7-R1-Korrektur sequenziell fertigzustellen.

## Exakte und vollständige Allowlist

1. `apps/mobile/src/mobile-media-hub.ts`
2. `apps/mobile/src/mobile-media-player.ts`
3. `apps/mobile/src/mobile-media-hub.test.ts`
4. `apps/mobile/src/mobile-media-player.test.ts`
5. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
6. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
7. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

Alle anderen Pfade sind read-only. Insbesondere sind Resume-Store, P2-
Katalog, Fixtures, Assets, App/Route, Config, Dependencies, Lockfiles,
Website, Shared Reader und Git-Index gesperrt.

## Pflichtumsetzung

Der Writer schließt ohne Erweiterung oder Abschwächung:

1. runlokale Timeout-ID pro Start einschließlich eines überlappenden A/B-
   Falls, in dem spät settelndes A Bs exakten 5000-ms-Schutz nicht löscht;
2. ausschließlich asynchronen Hub-Seek nach frischem Snapshot, Uhr-, Rights-,
   Safety-, Vollidentity- und exaktem Durationcheck; roher Player-Seek ist für
   Konsumenten nicht erreichbar;
3. fail-closed `storage-failure` an Projektion, Start, Decoder-Recheck, Seek
   und Save ohne rohe Rejection oder falschen Netzwerkfehler;
4. result-state-/generationexakte Kompensation für verspätetes `saved` und
   Exact-`no-op`, mit höchstens einem `deleteIfExact`, ehrlichen Success-/
   Missing-/Generation-/Record-/Failure-Ausgängen und sinklosen Late-results;
5. die echte 6×7-Resume-/Cleanupmatrix an den tatsächlichen Pause-, Save-,
   Seek- und Delete-Senken, nicht durch bloßen `stop()`;
6. die literale siebenzeilige Faulttabelle aus R7-R1 für Reader, Digest,
   CreateURL, `src`, `load`, Play und echtes live DOM-`error`, einschließlich
   genauem Playback, Availability, Fehler, leerem `src`, URL- und Revokezähler;
7. alte Timer, Results und DOM-Events nach Runwechsel/Unmount als vollständige
   No-ops; `blocked` dominiert `stale`.

Es gibt keinen Auto-Retry, keinen neuen Datenpfad, keine neue Persistenz und
keinen Testhook im Produkt.

## Pflichtbelege vor Rückgabe

Unter exakt Node `24.19.0` sind mindestens auszuführen und vollständig zu
dokumentieren:

- direkte Typechecks aller sieben Workspace-Configs;
- die fokussierten Hub-/Player-/Resume-Tests, einschließlich aller neuen
  R7-/R7-R1-Fälle;
- zwei unmittelbar aufeinanderfolgende vollständige Läufe der echten
  Chromium-/IndexedDB-Spec;
- Mobile-Build;
- scoped ESLint und Prettier für sämtliche geänderten Produkt-/Testpfade;
- 19 Boundarytests, Fixture-Provenance und Release-Boundary;
- zwölf unveränderte Schutz-Hashes;
- `git diff --check`, exakte Allowlist und Nachweis, dass kein gesperrter Pfad
  verändert wurde.

Der volle Mobile-Testlauf bleibt separat ehrlich: Die drei vorbestehenden,
außerhalb der Allowlist liegenden `App.test.tsx`-Fehler dürfen weder geändert
noch als P3-A-GREEN ausgegeben werden. Jeder neue Fehler, Flake, unvollständige
Matrix oder Pfadbedarf stoppt fail-closed ohne Commit.

## Rückgabe und Folgegate

Der Writer hinterlässt einen unstaged, uncommitted WIP ausschließlich in den
sieben Pfaden, aktualisiert die beiden vorhandenen Implementation-Belege und
gibt alle Rechte an den Chief zurück. Der Chief reproduziert die Matrix und
erstellt nur bei GREEN den Produktkandidatencommit. Danach folgen frische
unabhängige Terra-QA und ein defensiver Integrity-/Privacy-Deltarecheck;
anschließend ist ein finaler frischer Architekturabschluss Pflicht.

P4-B, echte Quellen/Medien, Provider, Streaming/Download/Generierung,
Website, Hosting/Live, Android/AAB/Play, Signierung, Upload, Deployment und
Release bleiben gesperrt beziehungsweise OUT.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R7-R1-WRITER-GATE`
- Status: R7-R1-GREEN gebunden; genau ein Writer nach Gatecommit
- Kandidat: `67cc5921334867e97f5b0e124c934549b5605928`
- Allowlist: exakt sieben Pfade
- P4-B und OUT/extern: gesperrt
- END-CHECK: :)
