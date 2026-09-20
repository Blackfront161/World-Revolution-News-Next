# WRN-G3-021 P2-R4 – Readback-, Control- und Matrixkorrektur

Status: **VERTRAG GEBUNDEN – PRODUKT-/TESTWRITE BIS FRISCHEM SOL-PRECHECK-GREEN GESPERRT**

## 1. Anlass und feste Basis

Fester Produktkandidat ist
`d0830f8f6e7e0b39291178dea95391b4fc5aa5ca`; feste Chiefbasis ist
`4bd6f001550f6520f959797cd41eca784d086995`. Chief und Writer reproduzieren
unter exakt Node 24.19 beide Typechecks, Format/Lint, 70 fokussierte, 9 echte
Chrome-/IDB- und 19 Boundarytests sowie Fixture-/Releasechecks GREEN.

Die frische Terra-QA und der defensive Sol-Integrity-/Privacy-Deltarecheck
sind im Evidencecommit `873ba96` dennoch nicht GREEN:

- `P2-R3-QA-M-001`: JSON-/Raw-/Aggregat-/Safety-Caps sind nur an einem
  Helfer, nicht an den gebundenen Loader-/Store-Produktpfaden belegt;
- `P2-R3-QA-M-002`: die 4x3-Blockmatrix und Asset-Hashvarianten fehlen im
  realen Store-/IDB-Pfad;
- `P2-R3-QA-M-003`: Future-IDB und die vollstaendigen Descriptor-Schema-/
  Revisions-Selbstbindungen fehlen;
- `P2-R3-DIP-M-001`: `rotate()` liest den vollstaendigen Sollzustand von
  Active/Previous/Candidate nach dem Write nicht zurueck;
- `P2-R3-DIP-M-002`: ein bundleloser, aber nichtkanonischer Controlrecord mit
  positiver Generation/Highest kann mutiert werden;
- `P2-R3-DIP-M-003`: die Pflichtmatrix bleibt sachlich unvollstaendig,
  insbesondere Current-IDs-only, Raw-/HTTP-, Rollbackfault- und Futureformen.

Die QA- und Assurancefindings werden gemeinsam ueber die folgenden drei
Produkt-/Testgrenzen geschlossen. Es gibt null Privacyfindings und null
deferred Findings. Vor jeder Produkt- oder Testmutation muss ein frischer
unabhaengiger `independent_architecture_reviewer` Sol/high ohne Kinder diesen
gesamten Vertrag mit null offenen Findings GREEN bestaetigen.

## 2. P4-01 – vollstaendiger atomarer Rotationsreadback

Vor jedem `rotate()`-Write werden die vollstaendigen `before`-Bundles und der
Sollnachzustand fest gebunden. Nach allen Bundle-, Safety- und Controlwrites,
aber vor `done(transaction)`, muss `state()` byte-/strukturgenau bestaetigen:

### Candidate-Aktivierung

- `after.active` ist exakt `before.candidate` mit ausschließlich
  `slot:"active"` geaendert;
- `after.previous` ist exakt `before.active` mit ausschließlich
  `slot:"previous"` geaendert oder `null`, wenn vorher kein Active bestand;
- `after.candidate === null`;
- `after.control` entspricht exakt dem gebundenen neuen Controlrecord;
- `after.safety` entspricht exakt dem zuvor persistierten/gebundenen Safety-
  Sollwert.

### Previous-Rollback

- `after.active` ist exakt `before.previous` mit ausschließlich
  `slot:"active"` geaendert;
- `after.previous` ist exakt `before.active` mit ausschließlich
  `slot:"previous"` geaendert oder `null`, wenn vorher kein Active bestand;
- `after.candidate` ist byte-/strukturidentisch `before.candidate`;
- `after.control` entspricht exakt dem gebundenen neuen Controlrecord;
- `after.safety` ist byte-/strukturidentisch `before.safety`.

Jede Abweichung ist `storage-failure`; die gesamte IndexedDB-Transaktion wird
abgebrochen und der Vorzustand bleibt in allen drei Stores bytegleich. Es
genuegt nicht, nur Control, Nicht-null-Active oder tiefe Einzelgueltigkeit zu
pruefen. Echte IDB-Fehlerinjektionen muessen je einen falschen, aber fuer sich
tief gueltigen Write an `active`, `previous` und Safetyreadback ausloesen und
den vollstaendigen Vor-/Nachzustand vergleichen. Candidate-Aktivierung und
Previous-Rollback benoetigen je einen Slotfault; Safetyfault und blockierter
Previous-Rollback sind getrennt zu belegen.

## 3. P4-02 – kanonische und erreichbare Controlformen

`validState()` akzeptiert einen bundlelosen Zustand ausschließlich, wenn
Control byte-/strukturidentisch dem kanonischen leeren Record entspricht:

`recordVersion:1,key:"control",generation:0,highestAcceptedRevision:0,active:null,candidate:null,previous:null`.

Fuer jeden nichtleeren Zustand gelten zusaetzlich:

- `generation` und `highestAcceptedRevision` sind positive Safe-Integer;
- mindestens `active` oder `candidate` ist vorhanden; `previous` ohne
  `active` und `candidate + previous` ohne `active` sind unerreichbar und
  ungueltig;
- jeder Pointer entspricht exakt seinem vorhandenen Slot und umgekehrt;
- `highestAcceptedRevision` ist mindestens jede gespeicherte Bundlerevision;
  falls Candidate besteht, ist dessen Revision exakt Highest;
- die erlaubten Slotformen sind damit nur `candidate`, `active`,
  `active+candidate`, `active+previous` und
  `active+candidate+previous`;
- der tiefe Bundle-, Safety-, Raw- und Pinvertrag bleibt unveraendert.

Ein exact-key/typkorrekter, aber nichtkanonischer Leer-Controlrecord sowie
jede unerreichbare Slotform liefert `protected`, erzeugt null Writes und
bleibt vor/nach versuchter Save-/Activate-/Rollbackmutation bytegleich. Keine
Normalisierung, Migration oder Loeschung.

## 4. P4-03 – produktpfadgleiche Pflichtmatrix

Jeder folgende Fall wird direkt benannt, parametrisiert und mit erwarteter
Fehlerkategorie sowie Nullwrites/bytegleichem LKG belegt. Direkte Validatoren
sind nur fuer gekoppelt unerreichbare isolierte Grenzorakel zulaessig.

### A. Raw-, JSON- und Cap-Produktpfade

- Release und jede der sechs Dokumentklassen: einzelne Raw-/JSONbytes Equal
  und `+1` ueber `loadMobileMediaRelease` beziehungsweise den vollstaendigen
  Store-Candidatepfad;
- Aggregatbytes und Release-/Recordcounts Equal und `+1` ueber denselben
  Produktpfad;
- Safetyraw Equal/`+1` ueber `saveCandidate` plus `activate`, einschliesslich
  Readback und Nullwrites;
- Asset-/Audio-/Thumbnail-/Transcriptbytes sowie Breite, Hoehe und
  Pixelflaeche Equal/`+1`, Gegenachse eins und maximaler Equal-Fall;
- gekoppelt unerreichbare Grenzen: groesster real erreichbarer Produktfall,
  isolierte Equal-/`+1`-Validatorgrenze und explizite Redundanzinvariante,
  niemals eine erfundene End-to-End-Fixture.

### B. Safety- und Blockproduktpfade

- positiver `higher/additive-current-ids-only`: neue aktuelle Episode und
  neues Asset samt exakt neuen References, keine neuen Entries, Aktivierung
  erfolgreich und vorhandene Safety bytegleich/additiv erhalten;
- `source|series|episode|asset` jeweils fuer
  `blocked|gone|replaced` im exportierten Store beziehungsweise echten IDB;
- Nicht-Assets verwenden `targetHash:null` und blockieren bei ID-Gleichheit;
- Assets: Equal-Manifesthash blockiert, anderer kanonischer Hash blockiert
  dieses aktuelle Asset nicht, fehlender/null Hash ist invalid-candidate;
- jeder blockierte/ungueltige Fall prueft Kategorie, Nullwrites und bytegleiches
  LKG; ein blockierter Previous-Rollback ist eigener echter IDB-Fall.

### C. Raw-/HTTP- und Deep-IDB-Negative

- Loader: BOM, ungueltiges UTF-8, falsche/fehlende JSON-MIME, HTTP 206,
  `Content-Range`/Rangeantwort sowie fehlendes, zusaetzliches und vertauschtes
  Rawdokument werden vor Candidateannahme fail-closed verworfen;
- Bundle, Control und Safety: unbekannte/future `recordVersion`, Extra-Key,
  falscher Typ, negative Generation/Revision und Raw-/Deep-Mismatch in echter
  IndexedDB;
- bundleloser nichtkanonischer Controlrecord und jede unerreichbare Slotform
  aus P4-02 in echter IndexedDB;
- fuer jede der sechs Descriptor-/Dokumentrelationen: Bytes-, Hash-, Schema-
  und Revisionsmismatch; zusaetzlich formal kanonischer falscher
  Transporthash, aeussere/raw Revisionsabweichung und unvollstaendiger oder
  unbekannter voller Rootpin;
- Quota, Abort und Readback an Safety-, Active- und Previous-Slotgrenzen;
  jeder Fehler laesst alle gespeicherten Bytes unveraendert.

Die Evidence enthaelt eine wortwoertliche Traceabilitytabelle von
`P2-R3-QA-M-001..003` und `P2-R3-DIP-M-001..003` zu Produktbedingung,
konkretem Testnamen/Parameter, Fehlerkategorie und Nullwrite-/LKG-Orakel.

## 5. Writer-Allowlist nach Precheck-GREEN

Genau ein frischer `backend_data_reliability_engineer` Terra/high darf ohne
Kinder ausschließlich diese zehn Pfade bearbeiten:

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

JSONs, Assets, `.gitattributes`, Packageexport, Dependencies, UI/Player,
Website, Shared-Vertraege, zentrale Governance und bestehende Evidence bleiben
bytegleich/read-only. Ein notwendiger elfter Pfad, eine Datenmigration oder
neue Dependency ist Stop beim Chief.

## 6. Pflichtlaeufe und Folgegates

Writer und Chief reproduzieren unter exakt Node 24.19 beide Typechecks,
scoped Lint/Format, die vollstaendige fokussierte Matrix, echte Chrome-/IDB-
Faelle, 19 Boundaries, Fixture-/Releasechecks, Schutz-Hashes, Diffcheck und
Allowlist. Der bekannte pnpm-Repairpfad bleibt gesperrt; nur gleichwertige
nichtmutierende vorhandene Binaries duerfen dieselben Configs/Entry-Points
ausfuehren.

Nach einem Produktkandidaten folgen getrennt: Chief-Reproduktion, frische
unabhaengige Terra-QA, ein frischer defensiver Sol-Bypass-/Integrity-/Privacy-
Deltarecheck und erst danach ein finaler frischer Sol-Architekturabschluss.
P2 ist erst bei vier GREEN-Ergebnissen und null offenen Produkt-, Coverage-,
reportable- oder deferred Findings geschlossen. P3, UI/Player, echte Quellen/
Medien, Provider, Website/Live, Android/Play und Release bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R4-READBACK-CONTROL-MATRIX-CORRECTION`
- Status: Vertrag gebunden; Produkt-/Testwrite wartet auf frischen Sol-Precheck
- Produktbasis: `d0830f8f6e7e0b39291178dea95391b4fc5aa5ca`
- Findingbasis: `873ba96`
- Privacy/deferred: `0/0`
- Allowlist nach GREEN: exakt zehn Pfade
- P3/extern: gesperrt
- END-CHECK: :)
