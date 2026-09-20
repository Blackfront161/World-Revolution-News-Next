# WRN-G3-021 P3-A-R1 – sequenzielle Writerfortsetzung

Status: **GEBUNDEN – WIP RED; GENAU EIN FRISCHER ERSATZWRITER NACH COMMIT**

## 1. Anlass und feste Basis

- PO-101 startete P3-A mit exakt `START WRN-G3-021-P3-A`.
- P3-A-Writergatecommit:
  `0b6ee79a68557ac8005915fca1d4894d2986230e`.
- Der erste Writer gab alle Rechte zurück und hinterließ einen unstaged,
  uncommitted WIP ausschließlich in den zehn erlaubten neuen Pfaden.
- Unter exakt Node 24.19.0 sind Mobile-Typecheck, drei Vitestdateien mit vier
  Smokes und ein Chromium-Import-Smoke GREEN. Das ist kein Produktkandidat.
- Der unabhängige read-only WIP-Review endet RED mit exakt sieben Mediums,
  null High und null Low. Keine Reviewdatei und kein Git-Index wurden
  geschrieben.

Nach dem separaten Commit dieses Dokuments darf genau ein frischer
`frontend_brand_engineer` Terra/high ohne Kinder den erhaltenen WIP
sequenziell übernehmen. Es gibt keinen Parallelwriter. Der Ersatzwriter
berührt weder Git-Index noch Commit und gibt alle Rechte nach vollständiger
Übergabe oder erneutem Stop an den Chief zurück.

## 2. Unveränderte Zehn-Pfad-Allowlist

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

Kein elfter Pfad ist zulässig. Bestehende P2-, App-, UI-, Sprach-, Fixture-,
Asset-, Config-, Package-, Lock-, Website- und OUT-Pfade bleiben gesperrt.

## 3. Exakte R1-Korrekturmatrix

### R1-01 – Snapshot, Uhr, Safety und vollständige Laufidentität

- Snapshot zuerst, danach pro Senke eine frische Uhrprobe.
- `blocked`, `gone` und `replaced` dominieren `stale`.
- Die vollständige Identität bindet Controlgeneration, Active-Revision und
  Transporthash, Safetygeneration und -revision, Episode, Audioasset und
  Assethash.
- Vor Projektion, Request, URL, `src`, `load`, `play`, Seek, Resume-Save und
  Cleanup wird die vollständige Identität erneut verglichen.
- Kein gecachtes `last` trägt eine Trustentscheidung.
- Das reine P3-A-Viewmodel liefert außerdem die später benötigten sicheren
  Titel-/Summary-/Quellen-/Dauer-/Rechte-/Attributions-/Territoriums-/Expiry-/
  Deliveryfelder, ohne UI oder P4-B zu öffnen.

### R1-02 – Loader, Timeout und Object-URL-Ledger

- `Content-Length` ist optional. Wenn vorhanden, gilt strikt dezimal,
  höchstens 262144 und exakt Descriptorbytes; ohne Header gilt derselbe
  Streamingcap und der Body muss anschließend exakt Descriptorbytes haben.
- Controller und Timeoutgrund gehören unveränderlich genau einem Run. Ein
  alter Timeout darf keinen neuen Run abortieren.
- Aktiver Timeout bei 5000 ms endet sichtbar und vollständig; kein hängendes
  `loading`, Element, Reader, Request, Timer oder URL.
- Reader wird auf Cap-, Abort- und Readfehler beendet/cancelled.
- Pro Run besteht ein URL-Ledger mit explizitem Revokezustand. Jede erzeugte
  URL wird auf jedem Terminalpfad exakt einmal, vor Erzeugung nie revoked.

### R1-03 – Playback-/Availabilityautomaten und Late-events

- Ein expliziter Reducer erlaubt nur die vertraglichen Playbackübergänge und
  bestätigt unerlaubte DOM-Events als No-op.
- Fehlerzustand bleibt in `state()` erhalten, bis eine erlaubte Aktion ihn
  ersetzt.
- Unmount invalidiert, abortiert, stoppt, detacht und revoked ohne späteren
  `onState`-Sink.
- Pause/fortgesetztes User-Play, Ended, Reset, Snapshotwechsel, Clear,
  Expiry und Safetyblock sind explizit getrennt.
- Jeder Resolve-/Reject-/DOM-Eventpfad prüft Run, Abort, Mounted, Element und
  URL vor jeder Mutation.

### R1-04 – frische Resume-DB und Schema

- Der initiale Upgradevorgang legt Store und Controlrecord atomar an.
- Version 1, exakt ein Store, `keyPath:'key'`, `autoIncrement:false` und null
  Indizes werden vollständig geprüft.
- Future-Version, Zusatzstore, falsches Schema sowie unknown/future/corrupt/
  over-cap Record sind `protected` und read-only.
- Open-, blocked-, abort- und Storagefehler enden deterministisch ohne
  Repairwrite oder Auto-Retry.

### R1-05 – vollständiger CAS- und Readbackschutz

- Save, `deleteIfExact`, selektives und globales Clear bilden vorab den
  vollständigen erwarteten Nachzustand.
- Readback vergleicht Generation, Ziel und alle übrigen Records vollständig;
  Fremddaten bleiben bytegleich.
- Ergebnisse unterscheiden literal `saved`, `deleted` und `no-op`.
- Nur eine bestätigte Mutation erhöht Generation exakt um eins. Missing,
  Generation- oder Recordmismatch sind No-op ohne Erfolgsbehauptung.

### R1-06 – Resume-Orchestrierung und Privacy

- Der Hub bindet den Resume-Store injizierbar und validiert jeden Record
  vollständig gegen einen frisch verifizierten Active-Kontext.
- Nur ausdrückliche Pause speichert. `timeupdate`, Mount, Reload und Unmount
  schreiben nichts.
- Seek erfolgt erst nach Assetvalidierung und neuer Nutzeraktion; niemals
  Autoplay oder Resume-Autostart.
- Ended, Expiry, Revocation und Mismatch verwenden ausschließlich
  `deleteIfExact`; Nutzungssperre und Laufinvalidierung geschehen vor Cleanup.
- Success, No-op und Failure bleiben ehrlich sichtbar; kein Retry und keine
  Ausgabe fremder IDs, Hashes oder Positionen.

### R1-07 – vollständige Pflichtbelege

- Hub-Units belegen Matrix 1 bis 5, 14 und 16.
- Player-Units belegen Matrix 6 bis 16 einschließlich 4999/5000/5001,
  headerlosem Streaming, Body-/Digestfehlern, vollständigem URL-Ledger und
  allen Late-results/-events.
- Resume-Units und echte Chrome-/IndexedDB-Fälle belegen Matrix 17 bis 23
  einschließlich aller R1-Varianten, CAS-Races, Future/Corrupt, Caps,
  Clear-/Teilerfolg und Fremdsentinels.
- Der Browserbeleg ist kein Import-Smoke, sondern führt echte IDB-, Request-,
  Race-, Cap-, Clear- und Late-result-Orakel aus.
- Evidence und Handoff ersetzen ihren WIP-Status nur bei wahrheitsgemäß
  vollständig GREENer Matrix und enthalten exakte Befehle, Zähler,
  Browserart, Fault-injection, Laufzeit, Hashes und Restgrenzen.

## 4. Toolchain und Pflichtabschluss

Verbindliches Node:
`C:\Users\patri\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`
mit exakt `v24.19.0`. Playwright wird über
`node_modules\@playwright\test\cli.js` aufgerufen. Vorhandene direkte
Binaries sind zu verwenden; keine Installation, Reparatur oder Lockänderung.

Vor Übergabe müssen fokussierte und vollständige Mobiletests, beide
Typechecks, echte Chromium-/IndexedDB-Matrix, Build, scoped Lint/Format,
19 Boundarytests, Fixture-/Releasechecks, zwölf Schutz-Hashes, Diffcheck und
Zehn-Pfad-Allowlist GREEN sein. Bei Zusatzpfad, nicht erreichbarer Matrix,
Hashdrift, Dependencybedarf oder verbleibendem Finding gilt Stop an den
Chief.

## 5. Folgetore

Erst der Chief reproduziert den fertigen WIP und erstellt bei vollständigem
GREEN den Produktkandidaten. Danach folgen frische unabhängige Terra-QA und
ein defensiver Sol-Integrity-/Privacy-Recheck parallel sowie zuletzt ein
frischer Sol-P3-A-Architekturabschluss. P4-B startet nicht automatisch.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R1-WRITER-CONTINUATION`
- Status: sieben Mediums gebunden; Ersatzwriter erst nach separatem Commit
- Basis: Gate `0b6ee79`; WIP unstaged und uncommitted
- Writer: genau ein frischer `frontend_brand_engineer` Terra/high ohne Kinder
- Allowlist: unverändert zehn Pfade
- P4-B und OUT/extern: gesperrt
- END-CHECK: :)
