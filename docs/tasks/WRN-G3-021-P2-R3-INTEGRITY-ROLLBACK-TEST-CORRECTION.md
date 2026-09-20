# WRN-G3-021 P2-R3 – Integrity-, Rollback- und Testkorrektur

Status: **R2 PRAEZISIERT – WRITE BIS FRISCHEM SOL-RECHECK-GREEN GESPERRT**

## 1. Anlass und Basis

Feste Produktbasis ist
`1826ed55bd8bd4f2d5b48fe6c3c20279485a03fb`. Chief-Reproduktion und alle
vorhandenen 13 Unit-, 7 Chrome-/IDB- und 19 Boundaryfaelle sind GREEN. Die
unabhaengige Terra-QA `a32d3c1` meldet jedoch `P2-R2-QA-M-001`: Die
verpflichtende Negativmatrix ist unvollstaendig. Der defensive Sol-Review
`aa055ee` meldet zusaetzlich vier Medium-Integritaetsfindings:

- `P2-R2-DIP-M-001`: bestehende Safetyentries werden bei Higher nicht
  byteinhaltlich erhalten;
- `P2-R2-DIP-M-002`: Revocationreferences sind keine Exact-cover-Union;
- `P2-R2-DIP-M-003`: erfolgreicher Previous-Rollback ist nicht erreichbar;
- `P2-R2-DIP-M-004`: Future-/Corrupt-IDB-Records werden zu flach validiert.

Privacy-, Tracker-, Provider- oder Loggingfindings bestehen nicht. P3 bleibt
gesperrt. Vor jedem Produkt-/Testwrite muss ein frischer unabhaengiger
`independent_architecture_reviewer` Sol/high diesen Vertrag mit null offenen
Findings GREEN bestaetigen.

Der erste Precheck `f6feb41` ist RED mit genau `P2-R3-PRE-M-001`. Die
folgenden R1-Saetze praezisieren ausschließlich die Bundle-Selbstbindung und
ihre vier echten IDB-Negativfaelle. Ein frischer unabhaengiger Sol-Recheck
bleibt Pflicht.

Der frische R1-Recheck `56a59bc` schliesst `P2-R3-PRE-M-001`, bleibt aber
RED mit genau `P2-R3-R1-M-001`: R3-01 erlaubte neue References sprachlich
nur fuer neue Revocation-Zielkeys, waehrend R3-02 sie auch fuer neue aktuelle
Katalog-IDs verlangt. Die folgenden R2-Saetze praezisieren ausschließlich
diese Additionsregel und den zugehoerigen positiven Grenzfall. Ein weiterer
frischer unabhaengiger Sol-Recheck mit null Findings bleibt Pflicht.

## 2. Normative Produktkorrekturen

### R3-01 – byteidentische monotone Safetyentries

- Der eindeutige Zielkey eines Entry bleibt
  `(targetKind,targetId,targetHash)`; zwei Entries mit demselben Zielkey sind
  immer ungueltig.
- Bei `incoming.safetyRevision > stored.safetyRevision` muss fuer jeden
  gespeicherten Entry exakt ein Incoming-Entry mit allen sechs
  recordeigenen Feldern byte-/strukturidentisch vorhanden sein:
  `targetKind,targetId,targetHash,status,replacementKind,replacementId`.
- Gleicher Zielkey mit anderem Status oder anderen Replacementfeldern ist
  kein additiver Eintrag, sondern `protected` mit null Writes.
- Stored Entries und References duerfen weder entfernt noch umgeschrieben
  werden. Vollstaendig neue Zielkeys duerfen nur byteidentisch additiv
  hinzukommen. Neue References duerfen genau dann additiv hinzukommen, wenn
  R3-02 sie fuer neue aktuelle Source-, Series-, Episode- oder Asset-IDs,
  neue Entrytargets oder neue Replacementtargets verlangt. Jede andere
  historische oder ungenutzte Reference bleibt unzulaessig. Eine gespeicherte
  Reference, die im neuen Candidate weder aktuelle ID noch Entry- oder
  Replacementtarget ist, macht den Candidate `protected` mit null Writes;
  sie darf nicht still erhalten, entfernt oder normalisiert werden.
- Lower, Equal/same und Equal/different bleiben gemaess R1 fail-closed/no-op.
  Entry-/Reference-/Bytecaps, Sortierung, Graph und Readback laufen vor jeder
  Slotmutation.

### R3-02 – exakte Revocation-Reference-Union

Fuer jeden Candidate muss `revocation.references` exakt, sortiert und ohne
Dublette der Mengenunion entsprechen aus:

1. allen aktuellen Source-, Series-, Episode- und Asset-IDs;
2. allen `(targetKind,targetId)` jedes Revocationentry;
3. allen nicht-null `(replacementKind,replacementId)` jedes
   `status="replaced"`-Entry.

Fehlende Entry-/Replacementtargets und jede zusaetzliche ungenutzte
historische Reference verwerfen den gesamten Candidate. Isolierte
Revocation-Dokumentvalidierung verlangt mindestens Deckung aller Entry- und
Replacementtargets; der Candidatecheck ergaenzt die aktuellen IDs und
erzwingt die exakte Gesamtunion. Keine stillen historischen References.

### R3-03 – erfolgreicher Previous-Rollback unter aktuellem Safety-Floor

- Candidate-Aktivierung merged wie bisher zunaechst eine gleichhohe oder
  hoehere additive Incoming-Safety und liest sie bytegleich zurueck.
- Ein expliziter Rollback auf `previous` merged **nicht** dessen aelteres
  Revocationdokument in den globalen Safetyrecord und senkt Safety nie.
- Rollback validiert Previous-Rawbundle, Root-/Dokumentpins, Current-time,
  Admission, Health und Rights frisch. Danach verwendet er den bereits
  gespeicherten tief validierten Safetyrecord unveraendert als Floor.
- `storedSafety.revision >= previous.release.revocationFloor` ist Pflicht.
  Alle Previous-IDs und der Asset-Manifest-SHA werden gegen gespeicherte
  `blocked|gone|replaced`-Entries geprueft. Treffer = `protected`, null Writes.
- Bei Erfolg werden nur `active` und `previous` in einer Transaktion atomar
  getauscht; `candidate` bleibt unveraendert, Safety inklusive Generation und
  Raw bleibt bytegleich, `highestAcceptedRevision` bleibt das jemals hoechste
  akzeptierte Release und Controlgeneration steigt exakt um eins.
- Readback muss den vollstaendigen Slottausch, Pointerkonsistenz und
  unveraenderte Safety bestaetigen; sonst kompletter Rollback.

### R3-04 – versionierte, exakte und tiefe IDB-Records

Jeder neu geschriebene Record traegt `recordVersion: 1`. Exakte Keys:

- Bundle:
  `recordVersion,slot,rawBundle,transportSha256,revision`;
- Control:
  `recordVersion,key,generation,highestAcceptedRevision,active,candidate,previous`;
- Safety:
  `recordVersion,key,generation,revision,raw,entries,references`.

Es gelten vor jeder Mutation und fuer `snapshot()`:

- keine Extra-/Missing-Keys; `recordVersion` exakt `1`; Generation und
  Revision nichtnegative Safe-Integer, Release-/Acceptedrevisionen positiv;
- Bundle-Slot stimmt mit Object-Store-Key; Transporthash ist kanonischer
  SHA-256; Rawbundle besitzt exakt `releaseRaw,documentsRaw`, DocumentsRaw
  exakt die sechs Dokumentklassen in kanonischer Reihenfolge und nur Strings;
- fuer jedes nichtleere Bundle gilt wortwoertlich
  `transportSha256 === SHA256(UTF8(rawBundle.releaseRaw))`;
- `rawBundle.releaseRaw` parst als exakter Release-v1-Umschlag und die
  aeussere Bundlerevision ist exakt dessen `revision`;
- der geparste Releaseumschlag passt vollstaendig zu genau einem erlaubten
  Rootpin: `schema`, `contractVersion`, kanonischer Release-Runtimepfad,
  `revision` und SHA-256 der exakten Release-Transportbytes stimmen. Ein nur
  nach Revision/Hash teilweise passender oder unbekannter Pin ist ungueltig;
- fuer jeden der sechs Release-Descriptoren stimmt das zugehoerige
  `documentsRaw[documentClass]` in UTF-8-Bytes, SHA-256, Dokumentklasse,
  Schema, Contractversion, Releaserevision und gemeinsamen Releasefeldern.
  Das vollstaendig daraus geparste Dokumentset muss den Candidatevertrag tief
  erfuellen; kein aeusseres Bundlefeld darf diese Rawwahrheit ueberschreiben;
- Controlpointer sind nur `null` oder ihr eigener Slotname und exakt
  konsistent mit vorhandenen Bundles; kein verwaister oder versteckter Slot;
  `highestAcceptedRevision` ist mindestens jede gespeicherte Bundlerevision;
  ein Candidate entspricht dem Highest-Wert;
- Safety-`raw` bleibt unter Bytecap, parst als exaktes v1-Revocationdokument,
  `revision`, `entries` und `references` stimmen byte-/strukturidentisch mit
  dem Rawdokument; Caps, Exact-keys, Typen, Sortierung, Referenzen und Graph
  sind vollstaendig gueltig;
- leere Erstwerte sind ausschließlich die kanonischen versionierten
  Generation-/Revision-0-Records mit leerem Raw und leeren Arrays;
- unbekannte Version, Extra-Key, falscher Typ, negative/zu grosse Zahl,
  inkonsistenter Pointer, Corrupt-/Future-Raw oder Deep-Mismatch liefert
  `protected`, erzeugt null Writes und laesst jeden gespeicherten Bytewert
  unveraendert. Keine automatische Normalisierung oder Migration in P2.

### R3-05 – sofortiger Aufrufer-Abort und Cleanup

Der bereits gebundene Requesttimeout bleibt produktiv exakt 5000 ms pro
Request. Zusaetzlich muss ein Aufrufer-Abort vor oder waehrend eines Requests
die Operation unmittelbar terminal und fail-closed beenden, selbst wenn ein
Testtransport das Abortsignal ignoriert. Timeout, externer Abort und
Transportsettlement sind drei explizite Race-Ausgaenge. Timer und externe
Listener werden genau einmal auf jedem Ausgang entfernt; ein spaetes Resolve
oder Reject bleibt behandelt, erzeugt keinen unhandled Fehler und keinen
nachtraeglichen Zustandswechsel.

## 3. Vollstaendige automatisierte Pflichtmatrix

Jede folgende Gruppe benoetigt direkt benannte, parametrisierbare Tests mit
erwarteter Fehlerkategorie und – bei Storepfaden – Nullwrites/LKG-Erhalt:

1. Release plus jede der sechs Dokumentklassen: Extra-/Missing-Key, falscher
   Typ, nichtkanonische Reihenfolge, Dublette und Cross-document-Fehlbezug.
2. Zeit: `generatedAt` Future/Equal; `validUntil` minus eins/Equal;
   Sieben-Tage-TTL unter/equal/`+1`; Admission `validFrom` Future/Equal,
   `validUntil` minus eins/Equal; Healthalter `86400000` equal/`+1` und
   Future; Rights `expiresAt` minus eins/Equal.
3. Caps: einzelne JSON-/Rawbytes, Aggregatbytes, Release-/Recordcounts,
   Safetyentries/-bytes, Assetbytes, Audio-/Thumbnail-/Transcriptcaps,
   Thumbnailbreite/-hoehe/-Pixelflaeche jeweils Equal und `+1`, einschliesslich
   maximalem gueltigem Equal-Fall mit Gegenachse eins.
4. Raw-/Pinpfad: fehlendes, zusaetzliches und vertauschtes Dokument,
   Descriptorbytes/-hash, Rootpin/-raw, manipuliertes `releaseRaw`, BOM,
   ungueltiges UTF-8, MIME/206/Range, Future-/Corrupt-Raw.
5. Safety: lower; equal/same; equal/different; higher/additive; gleicher
   Zielkey mit geaendertem Status/Replacement; fehlender bestehender Entry;
   fehlende/zusaetzliche Reference; Entrytarget/Replacementtarget; Zyklus;
   Count-/Bytecap; positiver `higher/additive-current-ids-only`-Fall mit neuen
   aktuellen Episode-/Asset-IDs und genau deren neuen References, ohne neue
   Entries, bei bytegleichem Erhalt aller gespeicherten Entries/References
   und erfolgreicher Aktivierung.
6. Blockmatrix: `source|series|episode|asset` jeweils getrennt fuer
   `blocked|gone|replaced`; Nicht-Assets mit `targetHash=null`, Asset mit
   Equal-/Different-/Missing-Hash zum Manifest.
7. Loader: Produktdefault 5000 ms; injizierter Testtimeout; externer Abort vor
   Fetch und waehrend ignorierendem Fetch; Timeout exakt an Grenze; Late
   Resolve; Late Reject; nachweisbarer Timer-/Listenercleanup.
8. Echte Chrome-/IDB-Matrix: successful A/B/A mit Neustart und atomarem
   Slottausch unter unveraenderter hoeherer Safety; blockierter Rollback;
   Candidateactivation higher-additive; Quota/Abort/Readback an Safety- und
   Slotgrenzen; Corrupt/Future Bundle, Control und Safety je Extra-Key,
   falscher Typ, negative Generation/Revision, inkonsistente Pointer,
   Raw-/Deep-Mismatch; zusaetzlich je ein echter IDB-Fall fuer (a) formal
   kanonischen, aber falschen `transportSha256`, (b) aeussere Bundlerevision
   ungleich geparster Releaserevision, (c) Release-Raw ohne vollstaendig
   erlaubten Rootpin und (d) Descriptor-/Dokument-Bytes-/Hash-/Schema-/
   Revisionsmismatch. Jeder Fehler erzeugt null Writes und bytegleichen LKG.

Gekoppelt unerreichbare Capgrenzen duerfen nicht durch erfundene End-to-End-
Fixtures scheinbar belegt werden. Insbesondere sind 512 Safetyentries unter
dem strengeren 65536-Bytecap nicht gemeinsam erreichbar. Dafuer sind der
groesste real erreichbare Produktfall, isolierte Equal-/`+1`-Validatorgrenzen
und eine explizite Redundanzinvariante Pflicht.

Unit-/Contracttests duerfen deterministische lokale Builder und direkte
Validatoren verwenden. Timeout-/Abort-, Raw-Persistenz-, Slot-, A/B/A-,
Future-/Corrupt- und Atomicitykernfaelle muessen den realen exportierten
Produktpfad beziehungsweise echtes Chrome/IndexedDB verwenden. Reine Tests
privater Hilfsfunktionen genuegen nicht. Evidence enthaelt eine
Traceabilitytabelle R3-01 bis R3-05 und Matrix 1 bis 8 zu konkreten Testnamen.

## 4. Writer-Allowlist nach Precheck-GREEN

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
9. `docs/evidence/WRN-G3-021/P2-R3-INTEGRITY-ROLLBACK-TEST-CORRECTION.md`
10. `docs/handoffs/WRN-G3-021-p2-r3-integrity-rollback-test-correction.md`

JSONs, Assets, `.gitattributes`, Packageexport, Dependencies, UI/Player,
Website, Shared-Vertraege und bestehende Evidence bleiben bytegleich/read-only.
Ein zusaetzlicher Pfad oder notwendige Datenmigration ist Stop beim Chief.

## 5. Pflichtlaeufe und Gates

Writer liefert mit exakt Node 24.19 beide Typechecks, scoped Lint/Format,
vollstaendige fokussierte Unitmatrix, echte Chrome-/IDB-Matrix, 19 Boundaries,
Release-/Fixturechecks, Diffcheck und alle Schutz-Hashes. Ein einziger linearer
Ergebniscommit ist nur bei vollstaendigem GREEN erlaubt.

Danach folgen getrennt: Chief-Reproduktion, frische Terra-QA, frischer
defensiver Sol-Integrity-/Privacy-Deltarecheck und finaler frischer Sol-
Architekturabschluss. P2 ist erst bei vier GREEN-Ergebnissen und null offenen
Produkt-, Coverage-, reportable- oder deferred Findings technisch beendet.
Dieser Vertrag erteilt kein P3-, UI-, Player-, Quellen-, Provider-, Live-,
Android-, Play- oder Releasegate.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R3-INTEGRITY-ROLLBACK-TEST-CORRECTION`
- Status: R2 praezisiert; Write wartet auf frischen Sol-Recheck
- Produktbasis: `1826ed55bd8bd4f2d5b48fe6c3c20279485a03fb`
- Findingbasis: QA `a32d3c1`, defensiver Review `aa055ee`, Precheck `f6feb41`,
  R1-Recheck `56a59bc`
- Produkt-/Testrechte: gesperrt
- Naechster Schritt: frischer unabhaengiger Sol/high-Vertragsreview
- END-CHECK: :)
