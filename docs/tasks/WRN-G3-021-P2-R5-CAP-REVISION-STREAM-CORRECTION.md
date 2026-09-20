# WRN-G3-021 P2-R5 – Cap-, Revisions- und Streamkorrektur

## Gate und feste Basis

Die unabhängige Terra-QA ist auf Reviewbasis
`0e0a5665e01eadf8b843703be1e96ed344516ad2` GREEN. Der defensive
Sol-Integrity-/Privacy-Deltarecheck ist auf derselben Basis RED mit genau
`P2-R4-R3-DIP-M-001`, `P2-R4-R3-DIP-M-002` und
`P2-R4-R3-DIP-L-001`, bei null Privacy und null deferred. Produktkandidat ist
`fcc0aa9206ed59edf7420cd913c4e25073ce7faf`.

Dieser Vertrag bindet ausschließlich diese drei Findings. Vor einem frischen
unabhängigen Sol/high-Precheck mit null Findings gibt es keinen Produkt-,
Test-, Fixture-, Browser- oder Assetwrite. P3, UI/Player, echte Quellen/
Medien, Provider, Dependencies, Website, Hosting/Live, Android/AAB/Play,
Signierung, Upload, Deployment und Release bleiben gesperrt.

## R5-01 – senkentreue Cap-Preimages

### Erreichbare Produktfälle

1. Release-Rawbytes werden über `loadMobileMediaRelease` bei exakt `524288`
   akzeptiert und bei `524289` als `invalid` abgelehnt. Beide Preimages sind
   valides JSON; für den Equal-Fall werden Release-Transporthash und voller
   Buildpin frisch gebunden.
2. Gesamt-Dokumentbytes bleiben bei exakt `524288` ein erfolgreicher
   `saveCandidate`-/Activate-/Readback-Fall. Für `524289` werden der
   geänderte Dokumentdescriptor, Release-Raw, Transporthash und vollständige
   Rootpin neu gebunden. Der Fall muss nachweislich erst an der
   `totalJson`-Senke scheitern und das LKG vollständig erhalten.
3. Revocation-/Safetyraw bleibt bei exakt `65536` über Save, Activate und
   Readback erfolgreich. Für `65537` werden Revocationdescriptor, Release,
   Transporthash und vollständige Rootpin neu gebunden. Der Candidate muss
   bis `nextSafety()` gelangen, dort `invalid-candidate` liefern und das LKG
   vollständig erhalten.

### Gekoppelte Dokumentgrenzen

Der pro Dokumentklasse geltende Raw-/JSON-Cap `524288` ist identisch mit dem
Gesamtcap aller sechs gemeinsam verpflichtenden, nichtleeren Dokumente. Ein
einzelnes Dokument mit exakt `524288` kann daher in keinem vollständigen
Candidate zusammen mit den fünf weiteren nichtleeren Dokumenten akzeptiert
werden; bereits der Equal-Fall ist als nachgelagerter End-to-End-Erfolg
mathematisch unerreichbar.

Für jede der sechs Klassen Manifest, Admission, Rights, Consent, Lifecycle
und Revocation sind deshalb genau diese drei Belege Pflicht:

1. größter real erreichbarer, hash-/descriptor-/rootpin-korrekter
   Produktfall, bei dem das benannte Dokument den nach Minimierung der fünf
   Peerdokumente verbleibenden Byteanteil erhält und der Gesamtcandidate
   erfolgreich speichert/aktiviert;
2. vorhandene isolierte Validatorgrenze `524288` Equal / `524289` Ablehnung;
3. explizite, aus den tatsächlichen minimalen Peerbytezahlen berechnete
   Redundanzinvariante, dass `524288 + sum(peerBytes) > 524288` gilt.

Keine erfundene Fixture, kein Assetwrite und kein Helper-only-Ersatz für die
erreichbaren Produktfälle. Der frische Precheck muss diese erweiterte
Dreierdisposition ausdrücklich als vertragstreu bestätigen oder den Writer
sperren.

## R5-02 – isolierte äußere/raw Revisionsbindung

Der Browser-/IndexedDB-Fall erzeugt ein intern vollständig gültiges
Revision-2-Rawbundle:

- Release, alle sechs Dokumente und alle sechs Descriptorrevisionen sind 2;
- Descriptorbytes und -hashes, Release-Transporthash und ein erlaubter voller
  Revision-2-Rootpin sind frisch und konsistent gebunden;
- nur die persistierte äußere Bundle-Revision bleibt absichtlich 1.

Beim öffentlichen Reopen/Snapshot muss die interne Validierung bis zur
äußere/raw Bundle-Revisionsrelation gelangen, dort `protected` liefern und
das manipulierte Raw-IDB-Record byteidentisch erhalten. Ein Descriptor- oder
Releasevalidator darf den Fall nicht vorher dominieren. Der bestehende
getrennte Outer-Revision-Gegenfall bleibt erhalten.

## R5-03 – Streamtransportfehler

Die interne Bodyreader-Grenze unterscheidet typisiert:

- Status-, MIME-, Range-, Cap-, BOM-, UTF-8- und JSON-Inhaltsfehler:
  `invalid`;
- unmittelbarer Fetch-Reject und jeder `ReadableStreamDefaultReader.read()`-
  Reject: `network-error`;
- Timeout und äußerer Abort behalten ihre bereits gebundene öffentliche
  Netzwerk-/Abortsemantik.

Der Fehlerpfad loggt weder URL, Pfad, Rawbytes noch Inhalte. Mindestens ein
unmittelbarer Fetch-Reject- und ein Body-Stream-Reject-Test müssen den
exportierten Loader durchlaufen und `network-error` erwarten. Bestehende
Status-/MIME-/Range-/Cap-/Decode-Negativfälle bleiben `invalid`.

## Exakte Writer-Allowlist

Nach frischem Sol-Precheck-GREEN darf genau ein frischer
`backend_data_reliability_engineer` Terra/high ohne Kinder ausschließlich
diese fünf Pfade schreiben:

1. `apps/mobile/src/mobile-media-release.ts`
2. `apps/mobile/src/mobile-media-release.test.ts`
3. `tests/e2e/g3-021-media-catalog-store.spec.ts`
4. `docs/evidence/WRN-G3-021/P2-R5-CAP-REVISION-STREAM-CORRECTION.md`
5. `docs/handoffs/WRN-G3-021-p2-r5-cap-revision-stream-correction.md`

Store, Contractmodul und Contracttests bleiben read-only. Jede weitere Datei,
Dependency, Fixture, jedes Asset oder jeder Providerzugriff ist ein Stop.

## Pflichtmatrix und Sequenz

Writer und Chief reproduzieren unter exakt Node 24.19:

- beide direkten Typechecks;
- scoped Prettier und ESLint;
- vollständige fokussierte Contract-/Loader-/Store-Vitestmatrix;
- vollständige echte Chrome-/IndexedDB-Spec mit einem Worker;
- 19 Boundarytests, Fixtureprovenienz und Releaseboundary;
- zehn Schutz-Hashes, Diffcheck und exakte Fünf-Pfad-Allowlist.

Der Writer committet nur bei vollständig grünem Ergebnis und gibt alle Rechte
zurück. Danach folgen Chief-Reproduktion, frische unabhängige Terra-QA und ein
frischer defensiver Sol-Integrity-/Privacy-Recheck parallel. Erst beide GREEN
erlauben den finalen frischen Sol-Architekturabschluss. Der vorherige
`fix-finding`-Patch-Candidate-Reviewzyklus wird nicht wiederholt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R5-CAP-REVISION-STREAM-CORRECTION`
- Status: gebunden; Produkt-/Testwrite wartet auf frischen Sol-Precheck
- Basis: `0e0a5665e01eadf8b843703be1e96ed344516ad2`, Kandidat
  `fcc0aa9206ed59edf7420cd913c4e25073ce7faf`
- Findings: 2 Assurance-Medium, 1 Product-Low; Privacy/deferred 0/0
- Allowlist: fünf Pfade erst nach Precheck-GREEN
- END-CHECK: :)
