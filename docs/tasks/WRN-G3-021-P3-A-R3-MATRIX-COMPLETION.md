# WRN-G3-021 P3-A-R3 – Lifecycle-/Failure-Matrixcompletion

Status: **GEBUNDEN – ZWEI REST-MEDIUMS; KEIN WRITER VOR COMMIT**

## 1. Basis

- PO-101 und alle P3-A-Verträge bleiben bindend.
- R2-Continuationcommit:
  `dbe37ae4853fdaeffb24e5adc5fb1a174de13b87`.
- Der R2-WIP liegt unstaged und uncommitted ausschließlich in den zehn
  erlaubten P3-A-Pfaden.
- Exakt Node 24.19: sieben Typechecks, 21/21 fokussierte Units, 6/6 echte
  Chromium-/IndexedDB-/Request-Fälle sowie 12/12 Schutz-Hashes GREEN.
- Offen bleiben exakt `P3-A-R2-WIP-M-001` und
  `P3-A-R2-WIP-M-002`; deshalb existiert noch kein Produktkandidat.

Nach dem separaten Commit darf genau ein frischer
`frontend_brand_engineer` Terra/high ohne Kinder, Git-Index oder Commit den
WIP in denselben zehn Pfaden sequenziell vervollständigen. Kein Parallelwriter
und kein elfter Pfad.

## 2. Exakte Completion

### R3-01 – Lifecycle-Senken

Tabellengesteuerte Unit- und echte Chromiumfälle belegen jeweils Release-
Expiry, Rights-Expiry sowie Block von Source, Series, Episode und Audioasset
an diesen sieben Senken:

1. vor Assetload;
2. während Body/Digest;
3. nach Object-URL-Erzeugung;
4. während Play/Pause;
5. vor Resume-Save;
6. vor User-Seek;
7. direkt nach bestätigtem Resume-Save beziehungsweise vor Cleanup.

Für jeden Fall gilt: Nutzung/Seek sofort gesperrt, Run zuerst invalidiert,
danach Abort/Stop/Detach/Revoke, anschließend höchstens ein recordexaktes
`deleteIfExact`. Success, Missing-/Generation-/Record-No-op und Storefailure
bleiben ehrlich; späte Resolve/Reject/DOM-Events mutieren nichts. Blocked
dominiert stale.

### R3-02 – Loader-/Playergrenzen

Konkrete Orakel schließen 4999/5000/5001, Response/Header/Body/Digest,
CreateURL, `src`, `load`, Decoder und `play()` Resolve/Reject, Supersession,
alte Timer sowie pause/ended/error nach Runwechsel, Navigation und Unmount.
Das URL-Ledger beweist für jede erzeugte URL exakt einen Revoke und vor
Erzeugung null Revokes. Body- und Readerpfade decken 262143/262144/262145
mit und ohne `Content-Length` sowie Descriptor minus/equal/plus eins ab.

### R3-03 – Resume-/IndexedDB-Grenzen

Echte Chrome-/IndexedDB-Fälle schließen:

- Count 63/64/65 und Recordbytes 4095/4096/4097 sowie Totalbytes
  65535/65536/65537;
- Future-DB, Zusatzstore, falsches Schema, Unknown/Future/Corrupt/Over-cap;
- zwei Tabs mit gleicher Generation, Missing-, Generation- und Recordrace;
- Quota, Abort, Transaction, Storage und Readback für Save,
  `deleteIfExact` und Clear;
- selektives/globales Clear und Teilerfolg;
- bytegleiche andere Resume-Records und fremde DB-/LocalStorage-Sentinels;
- Mismatch von Episode, Asset, Revision und Hash ohne Nutzung, genau einem
  Cleanupversuch und ohne sensible Ausgabe oder Retry.

Gekoppelt physisch unerreichbare Capkombinationen müssen durch reale
erreichbare Grenzfälle plus explizite Redundanzinvarianten belegt werden;
keine erfundene Browserabdeckung.

### R3-04 – Traceability und Hauptläufe

Evidence ordnet Matrix 1 bis 23 jeweils konkreten Testnamen und Orakeln zu.
Danach laufen unter exakt Node 24.19:

1. fokussierte P3-A-Units;
2. echte P3-A-Chromium-/IDB-Matrix;
3. vollständige Mobiletests;
4. Mobile- und Root-/Workspace-Typechecks;
5. Mobile-Build;
6. scoped ESLint und Prettier;
7. 19 Boundarytests;
8. Fixture-/Releasechecks;
9. zwölf Schutz-Hashes, Diffcheck und Zehn-Pfad-Allowlist.

Nur vollständig reproduzierte PASS-Zähler dürfen Evidence/Handoff von WIP
auf GREEN setzen.

## 3. Grenzen und Stop

Bestehende P2-, App-, UI-, Sprach-, Fixture-, Asset-, Config-, Package-,
Lock-, Website- und OUT-Pfade bleiben gesperrt. Keine Dependencyinstallation,
kein Netzprovider, kein P4-B. Ein Test darf keine schwächere Produktregel,
keinen Produkt-Testschalter und keine globale Configänderung einführen.

Bei zusätzlichem Pfad, produktseitig nicht erreichbarer Pflichtsenke,
Hashdrift, Dependencybedarf, verbleibendem Finding oder nicht
reproduzierbarem Lauf gilt erneut Stop an den Chief. Erst der Chief darf nach
eigener Reproduktion committen und unabhängige QA/Security öffnen.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R3-MATRIX-COMPLETION`
- Status: zwei Rest-Mediums gebunden; Writer erst nach separatem Commit
- Basis: `dbe37ae` plus unstaged Zehn-Pfad-WIP
- Writer: genau ein frischer `frontend_brand_engineer` Terra/high ohne Kinder
- P4-B und OUT/extern: gesperrt
- END-CHECK: :)
