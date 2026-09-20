# WRN-G3-021 P3-A – Player-/Lifecycle-/Resume-Writergate

Status: **GESTARTET DURCH PO-101 – GENAU EIN WRITER NACH DIESEM GATECOMMIT**

## 1. Freigabe und feste Basis

- Product-Owner-Startgate: exakt `START WRN-G3-021-P3-A`, 7. September 2026,
  gebunden als PO-101.
- Feste Gatebasis: `25cd45d6588025d8c455fc803e034f28ac58a068`.
- P2-Produktbasis:
  `c096d7d6ccfdb8bc08225c757bcf8cb86e101517`.
- P3-Vertrag:
  `docs/tasks/WRN-G3-021-P3-PLAYER-LIFECYCLE-UI-CONTRACT.md`.
- Vorrangiger Privacy-Nachtrag:
  `docs/tasks/WRN-G3-021-P3-R1-RESUME-PRIVACY-CORRECTION.md`.
- Finaler unabhängiger P3-P0-R2-Recheck: GREEN mit null High-, Medium-,
  Low-, Privacy-, Coverage- oder deferred Findings auf `2d4c629`;
  gesichert in `25cd45d`.

Dieses Gate erlaubt genau einem frischen `frontend_brand_engineer` Terra/high
ohne Kinder die sequenzielle lokale P3-A-Implementierung. Es erlaubt keinen
zweiten oder parallelen Produktwriter. Der Writer berührt weder Git-Index
noch Commit und gibt nach WIP, vollständigen Belegen oder Stop alle Rechte an
den Chief zurück.

## 2. Exakte Zehn-Pfad-Allowlist

Der Writer darf ausschließlich diese neuen Pfade schreiben:

1. `apps/mobile/src/mobile-media-hub.ts`
2. `apps/mobile/src/mobile-media-player.ts`
3. `apps/mobile/src/mobile-media-resume-store.ts`
4. `apps/mobile/src/mobile-media-hub.test.ts`
5. `apps/mobile/src/mobile-media-player.test.ts`
6. `apps/mobile/src/mobile-media-resume-store.test.ts`
7. `tests/e2e/g3-021-media-hub-lifecycle-harness.tsx`
8. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
9. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
10. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

Jeder zusätzliche oder bereits existierende Produkt-, Test-, Fixture-,
Asset-, Config-, Package-, Lock-, Website- oder Dokumentpfad ist gesperrt.
Eine notwendige Erweiterung ist ein Stop an den Chief, keine stillschweigende
Selbstfreigabe.

## 3. Verbindlicher Produktumfang

Umzusetzen sind ausschließlich:

- reines Active-only Media-Hub-Viewmodel mit frischem Snapshot-, Current-
  time-, Rights- und Safety-Recheck vor jeder sensiblen Senke;
- lokales WAV-Assetenforcement erst nach sichtbarer `user-play`-Aktion mit
  exakt 5000 ms, Status-/Redirect-/MIME-/Length-/Byte-/SHA-Prüfung vor Blob,
  Object URL, `src`, `load()` oder Decoder;
- streng run-, abort-, element-, URL- und Mounted-gebundener headless Player
  mit exakt einmaligem Revoke sowie wirkungslosen Late-results/-events;
- orthogonale Playback-/Availabilityautomaten, kein Autoplay, Preload,
  Remote- oder Streamingfallback und kein Auto-Retry;
- eigener minimaler IndexedDB-Resume-Store mit exakt acht Feldern ohne
  Aktivitätszeitpunkt, Caps, Generation-CAS, atomarem Readback und
  `deleteIfExact`;
- Nutzungssperre vor Expiry-/Revocation-/Mismatch-Bereinigung, sichtbare
  ehrliche Fehler und vollständige Fremddaten-Unverändertheit;
- die P3-A-Gruppen 1 bis 23 einschließlich der durch den R1-Nachtrag
  ersetzten Matrixpunkte 17 und 22 als Unit- und echte Chrome-/IndexedDB-
  Belege.

Die sichtbare `#media`-Route, App-Integration, Styles, Sprachen, sichtbare
UI, Visualmatrix und Accessibility-Projektion gehören ausschließlich zu
P4-B und bleiben gesperrt.

## 4. Schutzgrenzen

Vor Writerstart wurden alle zwölf Vertragshashes erneut geprüft und stimmen.
Insbesondere bleiben P2-Contracts, Release, Store, JSON, lokale Assets,
Package-/Lockfiles, Website und die fünf späteren P4-B-Bestandspfade
bytegleich. Der Writer installiert und repariert keine Dependency und nutzt
keinen Netz-, Provider-, Download-, Streaming-, Generierungs- oder Livepfad.

Reale Quellen/Medien, Provider, Website, Shared Reader, Service Worker,
Capacitor/Android/AAB/Play, Signierung, Hosting/Live, Upload, Deployment und
Release bleiben OUT.

## 5. Pflichtprüfung und Übergabe

Der Writer führt mit exakt Node 24.19 mindestens aus:

1. fokussierte P3-A-Unitfälle;
2. echte Chrome-/IndexedDB-/Request-/Race-/Cap-/Clear-Matrix;
3. Mobile- und Root-Typecheck über vorhandene direkte Binaries;
4. scoped Lint und Format;
5. Mobile-Gesamttests und 19 Boundarytests, soweit ohne Pfaderweiterung
   erreichbar;
6. Fixture-/Release-/Hash-, Diff- und Allowlistprüfung.

Der Writer dokumentiert exakte Befehle, Zähler, Laufzeit, Browserart,
Fault-injection, Hashes und Restgrenzen in den zwei erlaubten Belegpfaden.
Er meldet jeden fehlenden Testhook, jede mathematisch oder technisch
unerreichbare Pflichtsenke und jede Abweichung fail-closed an den Chief.

Nach der Übergabe reproduziert der Chief unabhängig die gesamte Matrix.
Danach folgen frische unabhängige Terra-QA und ein defensiver Sol-Integrity-/
Privacy-Recheck parallel sowie erst anschließend ein finaler Sol-P3-A-
Architekturabschluss. P4-B startet nicht automatisch.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-WRITER-GATE`
- Status: PO-101 gebunden; Writerrecht erst nach separatem Gatecommit
- Basis: `25cd45d6588025d8c455fc803e034f28ac58a068`
- Writer: genau ein frischer `frontend_brand_engineer` Terra/high ohne Kinder
- Allowlist: exakt zehn neue Pfade
- P4-B und OUT/extern: gesperrt
- END-CHECK: :)
