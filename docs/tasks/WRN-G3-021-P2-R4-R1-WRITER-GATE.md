# WRN-G3-021 P2-R4-R1 – Chief-Writergate

Status: **VERTRAG GREEN – GENAU EIN TERRA/HIGH-KORREKTURWRITER DARF NACH DIESEM GATECOMMIT STARTEN**

## 1. Geschlossene Gatekette

- Produktkandidat:
  `d0830f8f6e7e0b39291178dea95391b4fc5aa5ca`.
- Chief-Reproduktion:
  `4bd6f001550f6520f959797cd41eca784d086995`.
- QA-/Integrity-Findingbasis:
  `873ba96ba1a7ac219458b7af58c4e490754e2c3f`.
- erster R4-Vertrag:
  `884b5403fe6ff6677acd01bdffe71d1a23379a0a`.
- unabhaengiger R4-Precheck RED:
  `0bf4140d5fa686b81ef459257b9e882a257e3710` mit fuenf Medium und einem
  Low, null Privacy/deferred.
- R4-R1-Vertragsbasis:
  `cbf4d98781223f9222f05ea28cd0dfe7d1dc3ff1`.
- frischer unabhaengiger R4-R1-Recheck GREEN:
  `0299859b794c0388d55bbd35bfe20d5e2e05683c` mit
  `0 High / 0 Medium / 0 Low / 0 Privacy / 0 Coverage / 0 deferred`.

Normativ gelten vollstaendig und gemeinsam:

1. `docs/tasks/WRN-G3-021-P2-R4-READBACK-CONTROL-MATRIX-CORRECTION.md`;
2. `docs/tasks/WRN-G3-021-P2-R4-R1-CONTRACT-COMPLETION.md`;
3. alle dort weitergeltenden strengeren P2-R1-/R2-/R3-Vertraege.

Bei Widerspruch hat der R4-R1-Nachtrag fuer seine sechs ausdruecklichen
Praezisierungen Vorrang. Eine fehlende oder unklare Regel, ein elfter Pfad,
Migration, Dependency-, Fixture-, Asset-, Provider-, Netz- oder Kostenbedarf
ist Stop beim Chief und keine stillschweigende Writerentscheidung.

## 2. Alleiniger Writer und feste Rechte

Genau ein frischer `backend_data_reliability_engineer` Terra/high arbeitet
sequenziell und ohne Kinder. Die volle SHA dieses Gate-/Registercommits ist
seine feste Writerbasis. Er ist nicht Integrationsowner, erweitert keine
Allowlist, veraendert keine zentrale Governance und benutzt keinen fremden
Git-Index. Ein Ergebniscommit ist nur nach vollstaendig eigener GREEN-Matrix
zulaessig; bei Finding bleibt ein enger, klar dokumentierter WIP uncommittet.

Wortwoertliche Zehn-Pfad-Allowlist:

1. `packages/content-contracts/src/mobile-media-v1.ts`
2. `packages/content-contracts/tests/mobile-media-v1.test.ts`
3. `apps/mobile/src/mobile-media-release.ts`
4. `apps/mobile/src/mobile-media-release.test.ts`
5. `apps/mobile/src/mobile-media-catalog-store.ts`
6. `apps/mobile/src/mobile-media-catalog-store.test.ts`
7. `tests/e2e/g3-021-media-catalog-store-harness.ts`
8. `tests/e2e/g3-021-media-catalog-store.spec.ts`
9. `docs/evidence/WRN-G3-021/P2-R4-READBACK-CONTROL-MATRIX-CORRECTION.md`
10. `docs/handoffs/WRN-G3-021-p2-r4-readback-control-matrix-correction.md`

Alle JSONs, Assets, `.gitattributes`, Packageexporte, Dependencies,
UI/Player, Website, Shared Reader, bestehende Evidence/Handoffs und zentrale
Governance bleiben bytegleich/read-only. Die bekannten unversionierten
`.codex-remote-attachments/` und `.codex/environments/` sind OUT.

## 3. Pflichtumsetzung

### P4-01 und P4-02

- Candidate-Aktivierung und Previous-Rollback lesen vor Commit den
  vollstaendigen erwarteten Active-/Previous-/Candidate-/Control-/Safety-
  Zustand zurueck; jede Abweichung ist `storage-failure` und abortiert atomar.
- Empty-Control ist exakt kanonisch. Nichtleere Slotformen sind ausschliesslich
  `candidate`, `active`, `active+candidate`, `active+previous` und
  `active+candidate+previous`.
- Ihre Generationsminima sind wortwoertlich `1/2/3/4/5`; Higher-
  Generation bleibt legitim. `highestAcceptedRevision` ist exakt das Maximum
  aller gespeicherten Slotrevisionen; Candidate ist, falls vorhanden, exakt
  Highest. Pointer und Slots decken einander bidirektional.
- Active und Previous verlangen positiven, tief gueltigen Safetyrecord,
  mindestens ihren `revocationFloor` sowie byte-/strukturidentische Deckung
  aller Bundle-Entries und -References. Additive Higher-Safety bleibt erlaubt,
  Absenkung oder Umschreiben verboten. Initiales Candidate-only mit
  kanonischem Empty-Safety bleibt legitim.

### P4-03 und R4-R1-Validatorgrenzen

- Manifest-Asset-IDs sind exakt und bidirektional die Union aller nicht-null
  Episode-Audio-/Thumbnail-/Transcript-IDs; Missing und formal vollstaendiges
  Extra-Asset werden ueber Loader und Store verworfen.
- Admission erlaubt je `(kind,sourceId)` hoechstens einen Identitylink,
  unabhaengig vom Target; Alias und Successor sind getrennte Arten.
- `healthAt <= generatedAt`, Sourcealter hoechstens 86400000 ms und
  `validFrom <= generatedAt` werden am Releasezeitpunkt geprueft. Nur die
  gebundenen Current-time-/Expiryregeln verwenden die je API-Grenze frisch
  gezogene Clock.
- JSON-MIME akzeptiert ASCII-case-insensitiv parameterloses
  `application/json` oder genau ein unquoted `charset=utf-8`, mit optionalem
  SP/HTAB um `;` und `=`; doppelte, zusaetzliche, quoted oder fremde Parameter
  bleiben invalid.
- Die gesamte Raw-/JSON-/Cap-, 4x3-Block-/Assethash-, HTTP-/MIME-, Future-/
  Corrupt-IDB-, Descriptor-/Rootpin-, Quota-/Abort-/Readback- und
  Rollbackmatrix aus P4 bleibt Pflicht. Helper-only ist nur fuer ausdruecklich
  gekoppelt unerreichbare Grenzorakel zulaessig.

Jeder negative Fall bindet die exakte API-Kategorie, Nullwrites und
bytegleiches LKG aller Stores. Positive Save-/Activate-/A-B-A-/Rollback-,
Higher-/Current-IDs-only-, erlaubte MIME- und mehr-als-24h-Current-time-Faelle
verhindern eine ueberstrenge Korrektur.

## 4. Evidence, Pflichtlaeufe und Stop

Die Writer-Evidence bildet alle IDs `P2-R3-QA-M-001..003`,
`P2-R3-DIP-M-001..003`, `P2-R4-PRE-M-001..005` und
`P2-R4-PRE-L-001` wortwoertlich auf Produktbedingung, konkreten
Testnamen/Parameter, Fehlerkategorie, Nullwrite-/LKG-Orakel und tatsaechliches
Ergebnis ab. Sie bindet volle Basis-/Ergebnis-SHAs, Branch, Checkout, exakte
Diffpfade, Kommandos, Exitcodes und Fallzahlen.

Writer und danach Chief reproduzieren unter exakt Node 24.19:

- beide direkten Typechecks;
- scoped Format/Lint;
- die vollstaendige fokussierte Contract-/Loader-/Storematrix;
- echte lokale Chrome-/IndexedDB-Faelle;
- alle 19 Boundaries;
- Fixture-/Releasechecks und alle gebundenen Schutz-Hashes;
- Diffcheck und exakte Allowlist.

Der nicht autorisierte pnpm-Dependency-Repairpfad bleibt unbenutzt. Direkte
vorhandene Binaries duerfen dieselben Configs und Entry-Points nichtmutierend
ausfuehren. Stop bei Finding, Test-/Hash-/Formatfehler, nicht reproduzierbarer
Browserpruefung, Zusatzpfad, Migration, Dependency, Fixture-/Assetwrite,
Provider-/Netz-/Kostenwirkung oder unklarer Regel. Keine Teilfreigabe.

## 5. Unabhaengige Folgegates

Nach einem Writerkandidaten folgen zwingend und getrennt:

1. Chief-Diff-/Allowlist-/Hash-/Testreproduktion;
2. frische unabhaengige Terra-QA;
3. frischer defensiver Sol-Bypass-/Integrity-/Privacy-Deltarecheck;
4. finaler frischer Sol-Architekturabschluss.

Der defensive Sol-Recheck erhaelt Findingursachen, festen Scope, geltende
Policies und den tatsaechlichen Diff, aber keine Writer-Patchbegruendung und
keine behaupteten Testergebnisse. Er prueft eigenstaendig Umgehungen,
alternative Eingaben, Error-/LKG-Semantik, Privacy und Regressionen.

P2 ist erst bei allen vier GREEN-Ergebnissen und null offenen Produkt-,
Coverage-, reportable-, Privacy- oder deferred Findings geschlossen. P3,
UI/Player, echte Quellen/Medien, Provider, Website/Live, Android/AAB/Play,
Signierung, Upload, Deployment und Release bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R4-R1-WRITER-GATE`
- Status: Vertrag GREEN; genau ein Terra/high-Writer darf nach Gatecommit starten
- Produktbasis: `d0830f8f6e7e0b39291178dea95391b4fc5aa5ca`
- Vertragsbasis: `cbf4d98781223f9222f05ea28cd0dfe7d1dc3ff1`
- GREEN-Recheck: `0299859b794c0388d55bbd35bfe20d5e2e05683c`
- Schreibscope: exakt zehn Pfade
- P3/extern: gesperrt
- END-CHECK: :)
