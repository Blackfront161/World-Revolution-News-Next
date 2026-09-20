# WRN-G3-021 P2-R4-R2 – Bypass-, Produktpfad- und Matrixabschluss

Status: **ENGER FORTSETZUNGSVERTRAG – PRODUKT-/TESTWRITE ERST NACH EIGENEM CHIEF-COMMIT**

## 1. Anlass und feste Basis

Der erste R4-Writerkandidat
`9a2499ba596620206d315c86b989e328750aaacb` auf Writergate
`1a8bfaeca4aea39ed9e61be19cfc3f8559da25f3` besteht 74 fokussierte,
10 echte Chrome-/IDB- und 19 Boundarytests sowie beide Typechecks,
Format/Lint, Fixture- und Releasechecks. Chief reproduziert diese Zaehler.

Der danach gemaess `codex-security:fix-finding` ausgefuehrte frische,
read-only Bypass-/Regression-Review endet dennoch RED mit fuenf Medium und
zwei Low, null Privacy und null deferred. Die Befunde sind keine neuen
Produktentscheidungen. Sie belegen unvollstaendig umgesetzte, bereits
wortwoertlich in P4/P4-R1 gebundene Fehler-, Entry-Point- und Testgrenzen.

Dieser Vertrag bindet ausschliesslich deren Abschluss. Normativ gelten
weiterhin vollstaendig:

1. `docs/tasks/WRN-G3-021-P2-R4-READBACK-CONTROL-MATRIX-CORRECTION.md`;
2. `docs/tasks/WRN-G3-021-P2-R4-R1-CONTRACT-COMPLETION.md`;
3. `docs/tasks/WRN-G3-021-P2-R4-R1-WRITER-GATE.md`;
4. alle dort referenzierten strengeren P2-R1-/R2-/R3-Vertraege.

Der bereits ausgefuehrte Bypass-/Regression-Review ist der eine unabhaengige
Patch-Candidate-Reviewzyklus. Die bestaetigten Hypothesen werden jetzt im
engsten bestehenden Scope korrigiert; danach laufen die vollstaendige
Chief-Reproduktion und die separat gebundenen Folgegates. Safetygeneration 0
bei positiver Safetyrevision ist ausdruecklich **kein Finding** und wird ohne
neue Vertragsentscheidung nicht verschaerft.

## 2. R4-R2-01 – Rotationsreadback und Fehlerkategorie

Jeder Fehler des Post-Write-`state()`-Readbacks innerhalb von `rotate()` wird
an dieser Writegrenze in `MobileMediaCatalogError('storage-failure')`
uebersetzt. Das gilt auch, wenn `state()` eine tief ungueltige Slot-, Control-
oder Safetyform intern als `protected` klassifiziert. Vor dem ersten Write
erkannter korrupter Vorzustand bleibt dagegen `protected`.

Nach den Writes und vor `done(transaction)` werden weiterhin Active,
Previous, Candidate, Control und Safety vollstaendig gegen ihren gebundenen
Sollzustand verglichen. Jede Abweichung abortiert die ganze Transaktion.

Echte Chrome-/IDB-Fehlerinjektionen umfassen mindestens:

- Candidate-Aktivierung: falscher, fuer sich tief gueltiger Active-Write;
- Previous-Rollback: falscher, fuer sich tief gueltiger Previous-Write;
- Candidate-Aktivierung: abweichender oder tief ungueltiger Safetyreadback;
- je einen Rotations-Quota- und expliziten Transaktionsabortfall;
- einen Post-Write-Zustand, dessen `state()` selbst `protected` wirft.

Alle liefern oeffentlich `storage-failure`, null Teilwrites und bytegleiches
LKG aller drei Stores. Die bestehenden Vorzustandskorruptionsfaelle liefern
weiter `protected`.

## 3. R4-R2-02 – Source-Freshness an beiden exportierten Entry-Points

`validateMobileMediaDocument('admission', value)` erzwingt anhand des eigenen
Dokumentfelds `generatedAt` dieselben drei Relationen wie der volle Candidate:

- `source.healthAt <= admission.generatedAt`;
- `admission.generatedAt - source.healthAt <= 86400000` Millisekunden;
- `source.validFrom <= admission.generatedAt`.

Der volle Candidate prueft zusaetzlich die bytegleiche gemeinsame
Releasebindung und Current-time-/Expiryregeln. Dokument- und Candidatevalidator
duerfen fuer dieselbe Source-/`generatedAt`-Relation nie widersprechen.

Parametrische Positiv-/Negativtests binden an beiden Entry-Points fuer
`healthAt`: Equal, Alter 86400000, Alter 86400001 und Future +1 ms; fuer
`validFrom`: Equal und Future +1 ms. Das weiterhin gueltige Release mehr als
24 Stunden nach Erzeugung bleibt positiver Candidate-/Loader-/Storefall.

## 4. R4-R2-03 – Capmatrix an echten Produktpfaden

Die bisher helper-only belegten Grenzen werden durch echte Loader-/Store-
Durchstiche ergaenzt:

- Release und jede der sechs Dokumentklassen: Raw-/JSONbytes Equal und `+1`
  ueber `loadMobileMediaRelease` beziehungsweise den vollstaendigen
  `saveCandidate`-Pfad;
- Gesamt-JSONbytes und Release-/Recordcounts Equal und `+1` ueber denselben
  Produktpfad;
- Safetyraw Equal und `+1` ueber Save plus Activate mit Readback;
- Audio-, Thumbnail-, Transcript- und Episoden-Aggregatbytes sowie Breite,
  Hoehe und Pixelflaeche Equal/`+1` mit Gegenachse 1 und maximalem realen
  Equal-Fall.

Wo zwei identische Caps oder gekoppelte Vorgrenzen einen nachgelagerten `+1`-
End-to-End-Fall mathematisch unerreichbar machen, sind exakt drei Belege
Pflicht: groesster real erreichbarer Produktfall, isolierte Equal-/`+1`-
Validatorgrenze und explizite Redundanzinvariante. Keine erfundene Fixture und
kein Helper-only-Ersatz fuer erreichbare Produktfaelle.

Loader meldet `invalid`; Store `invalid-candidate`; IDB-/Storefaelle belegen
Nullwrites und bytegleiches LKG.

## 5. R4-R2-04 – vollstaendige reale Block-/Hash-/Rollbackmatrix

Der exportierte Store oder echte Chrome/IDB durchlaeuft alle zwoelf
Kombinationen:

`source|series|episode|asset × blocked|gone|replaced`.

- Nicht-Assets verwenden `targetHash:null` und blockieren bei ID-Gleichheit.
- Assets: gleicher Manifesthash blockiert; anderer kanonischer Hash blockiert
  dieses aktuelle Asset nicht; fehlender oder null Hash ist
  `invalid-candidate`.
- `replaced` besitzt gueltige Replacementart/-ID und vollstaendige References.
- Ein eigener echter Previous-Rollback-Fall wird vom hoeheren gespeicherten
  Safetyfloor blockiert.
- Der positive `higher/additive-current-ids-only`-Fall fuegt neue aktuelle
  Episode-/Asset-IDs samt exakt neuen References, aber keine neuen Entries
  hinzu und aktiviert erfolgreich.

Jeder Blockfall liefert `protected`, jeder Formfehler `invalid-candidate`;
negative Store-/IDB-Faelle schreiben nichts und erhalten das LKG bytegleich.

## 6. R4-R2-05 – Future-, Descriptor- und Failurematrix

Echte IndexedDB-Faelle binden fuer Bundle, Control und Safety jeweils:

- unbekannte/future `recordVersion`;
- Extra-Key, fehlender Key, falscher Typ und negative Generation/Revision;
- tief gueltige, aber semantisch ungebundene Raw-/Pointer-/Safetyform;
- `protected`, null Writes, keine Normalisierung/Reparatur und bytegleiches
  LKG vor/nach versuchter Mutation.

Fuer jede der sechs Descriptor-/Dokumentrelationen bestehen getrennte
hashkorrekte Faelle fuer Bytes-, Hash-, Schema- und Revisionsmismatch.
Zusaetzlich bleiben formell kanonischer falscher Transporthash, aeussere/raw
Revision und unvollstaendiger oder unbekannter voller Rootpin separat
sichtbar. Kein kombinierter Sammelfall ersetzt eine der vier Relationen je
Dokumentklasse.

Die Rotations-Failurematrix aus R4-R2-01 ergaenzt die bestehende Save-Fault-
Matrix. Quota, Abort und Readback muessen an Safety-, Active- und Previous-
Grenzen tatsaechlich die jeweilige Senke erreichen.

## 7. R4-R2-06 – HTTP-Range- und MIME-Fehlersemantik

Der Loader akzeptiert nur eine vollstaendige Status-200-Antwort ohne
`Content-Range`. Status 206, jeder vorhandene `Content-Range`-Header auch bei
Status 200 und jede andere Range-/Partial-Responseform werden vor Hash- und
Candidateannahme als `invalid` verworfen.

Fehlende oder syntaktisch ungueltige JSON-MIME ist ebenfalls `invalid`, nicht
`network-error`. Transportwurf, Timeout und Abort bleiben die bereits
gebundenen Netzwerk-/Abortkategorien. Die interne Requestgrenze muss diese
Ursachen unterscheiden, ohne Rawbytes, URLs oder Inhalte zu loggen.

Loadernegative binden: HTTP 206, Status 200 mit `Content-Range`, fehlende MIME,
falscher Medientyp, falsches/quoted Charset, doppelte/zusaetzliche Parameter,
BOM und ungueltiges UTF-8. Positive case-insensitive SP-/HTAB-OWS-Formen
bleiben gueltig.

## 8. R4-R2-07 – ehrliche Evidence und Commitbindung

Die Writer-Evidence und das Handoff werden sachlich korrigiert:

- aktuelle Produktbasis `9a2499ba596620206d315c86b989e328750aaacb`;
- keine helper-only oder fehlende Matrix wird als Produktpfad-PASS bezeichnet;
- jede alte und neue Finding-ID verweist auf konkrete Testnamen/Parameter,
  Fehlerkategorie und Nullwrite-/LKG-Orakel;
- der folgende Produkt-/Testkorrekturcommit wird nach seiner Erstellung in
  einem separaten Chief-Metadatencommit mit voller SHA, Diffpfaden und
  reproduzierten Zaehlern gebunden. Keine Selbst-SHA wird vorgetaeuscht.

## 9. Unveraenderte Rechte und Abschluss

Der **gleiche** bisherige `backend_data_reliability_engineer` Terra/high darf
nach dem separaten Commit dieses Vertrags genau einmal ohne Kinder fortsetzen.
Es gibt keinen parallelen Produktwriter und keinen zweiten Patch-Candidate-
Reviewzyklus. Die zehnpfadige Allowlist aus dem R4-R1-Writergate bleibt
wortwoertlich unveraendert.

Alle anderen Pfade, insbesondere JSON-Fixtures, Assets, `.gitattributes`,
Packageexporte, Dependencies, Governance, UI/Player, Website und Shared Reader,
bleiben read-only. Stop bei elftem Pfad, neuer Produktentscheidung, Migration,
Dependency, Fixture-/Assetwrite, Provider-/Netz-/Kostenwirkung oder nicht
reproduzierbarer Pflichtmatrix.

Der Writer fuehrt unter exakt Node 24.19 beide Typechecks, scoped Format/Lint,
die vollstaendige fokussierte Matrix, echte Chrome-/IDB-Faelle, 19 Boundaries,
Fixture-/Releasechecks, Schutz-Hashes, Diffcheck und Allowlist aus. Erst bei
GREEN darf er einen linearen Korrekturcommit erstellen; danach enden alle
Rechte.

Anschliessend folgen Chief-Reproduktion und Metadatenbindung, frische
unabhaengige Terra-QA, defensiver Sol-Integrity-/Privacy-Deltarecheck und
finaler frischer Sol-Architekturabschluss. P2 ist erst bei allen GREENs und
null offenen Produkt-, Coverage-, Privacy-, reportable- oder deferred Findings
geschlossen. P3, UI/Player, echte Quellen/Medien, Provider, Website/Live,
Android/AAB/Play, Signierung, Upload, Deployment und Release bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R4-R2-BYPASS-CORRECTION`
- Status: enger Fortsetzungsvertrag; wartet auf eigenen Chief-Commit
- Findingbasis: `9a2499ba596620206d315c86b989e328750aaacb`
- Findings: `5 Medium / 2 Low`; Privacy/deferred `0/0`
- Writer: derselbe Terra/high-Writer, keine Kinder
- Allowlist: unveraendert zehn Pfade
- P3/extern: gesperrt
- END-CHECK: :)
