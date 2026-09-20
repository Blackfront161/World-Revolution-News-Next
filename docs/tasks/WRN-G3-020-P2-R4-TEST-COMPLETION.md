# WRN-G3-020 P2-R4 – vollstaendige Test- und IDB-Evidenz

Status: **GEBUNDEN; R3-SPLIT FACHLICH GREEN, KANONISCHER SOL-SCHLUSSRECHECK OFFEN**

## Ziel und Ausgangslage

Der korrigierte Produkt-/Testkandidat `cb0f6bc` ist technisch stabil und wird
fuer dieses Paket als Produktquelle eingefroren. Beim R4-R1-Ausgangskandidaten
`c86735f` schloss die unabhaengige Terra-QA in `bf3ffc2`
`P2-R4-PRE-M-001/M-002` ohne neue Findings. Der
versiegelte Security-/Privacy-Scan
`d93e59fb-bf81-41a5-931d-d4c4fe09d9be`, Commit `b1725bd`, deckt 18/18
Diffpfade ab und endet mit null reportable/deferred Findings sowie keinem
Privacyfinding. Die fruehere Terra-QA `afd4c05` bleibt nur fuer
`P2-R3-QA-M-001` offen: Die explizite R3-05-/R1-05-/R2-Pflichtmatrix fehlt.

Der erste R4-B-Lauf `fd6da12` fand anschliessend den Selection-Bytecapfehler
`P2-R4-R2-M-001` und stoppte ohne verbleibende Testmutation. Der enge Fix
`cb0f6bc`, unabhaengige QA `f140a1c` und der versiegelte Securityscan
`976086cb-2ba9-4c92-aed1-1dbe45a683fe` in `93f581a` sind GREEN. R4-A ist in
`981ead6` beendet. R4-B-R1 und der A1-H9-Teilstand sind inzwischen in
`14a83c5` und `47a6fc3` gesichert; die verbliebene Restmatrix folgt nur noch
ueber die unten priorisierten R3-A-/R3-B-Splitbriefe.

Dieses Paket fuegt nur Tests und eigene Belege hinzu. Produktquellen,
Fixture/Pin, Packageindex, UI, Website, Dependencies, Config/Lock, Provider
und externe Gates bleiben bytegleich. Zeigt ein neuer Test einen Produktfehler,
stoppt der betreffende Writer mit reproduzierbarem RED; er korrigiert den
Produktcode nicht ohne neuen Chief-Vertrag.

## Historische Modell- und Writeraufteilung

Der erste R4-Testdurchlauf plante nach damaligem Sol-Precheck-GREEN zwei
disjunkte Writer:

- **R4-A – Spark/medium:** rein tabellengesteuerte Contract-/Loader-Matrix;
  keine Browser-/IDB- oder Produktarbeit.
- **R4-B – Terra/high:** echte persistente IDB-, Rotation-, Failure- und
  Selectionmatrix; keine Contract-/Loaderdatei.

Pro Datei bestand genau ein Schreiber; Kinder und Agent-Indexzugriff waren
verboten. Chief integrierte R4-A vor den historischen R4-B-Teillaeufen. Dieser
Abschnitt beschreibt ausschliesslich den beendeten Ablauf und erteilt keine
aktuellen Rechte. Fuer offene Arbeit gelten nur die R3-Splitbriefe und die
Vorrangklausel weiter unten.

## R4-A – Contract- und Loader-Matrix (Spark)

Exakte Schreibpfade:

1. `packages/content-contracts/tests/mobile-regional-events-v1.test.ts`
2. `apps/mobile/src/mobile-regional-events.test.ts`
3. `docs/evidence/WRN-G3-020/P2-R4-A-CONTRACT-LOADER-MATRIX.md`
4. `docs/handoffs/WRN-G3-020-p2-r4-a-contract-loader-matrix.md`

Explizite, einzeln identifizierbare Assertions:

1. Alle sieben Praeimages: Taxonomie, Sources, Events, Media, Revocations,
   Eventcontent und Safety inklusive References; vertauschte Eingabe- und
   Objektkeyreihenfolge; lexikografisches Gegenorakel wird nicht akzeptiert.
2. Externer Pin: Missing/Extra/Typ/Wert, no-request vor Exact-Pin,
   Bundle-/Taxonomierevision, Transportbytehash, BOM, fatales UTF-8,
   abgeschnittener und chunked Stream, HTTP/Abort sowie Transport- und
   decoded-JSON limit-1/limit/limit+1 plus Dominanzinvarianten.
3. Exact-keys, ID-Praefixe/Laenge/Eindeutigkeit, Parentketten, Locales,
   Alias/Successor, Identitaetslinks, Replacementreferences und Dedupe nur ID.
4. UTC/IANA: kanonisch/unbekannt/nichtkanonisch, Gap, beide Fold-Instants,
   Offset/Wall-clock/Ende und Start exakt Referenzinstant.
5. Freshness/Projektion: fresh+expired, expired-only, cancelled+expired,
   region-mismatch+expired, beide `validUntil`-Gleichheiten, Status,
   0/1/4/5/6 und stabile Event-ID-Tie-Breaks.
6. Bundle-/Taxonomie-/Eventrevision kleiner, gleich-identisch,
   gleich-konflikt und hoeher; per-Event Replay; A1/B2/A3-Datenfolgen soweit
   rein vertraglich pruefbar.
7. Alle Count-/Text-/URL-/Selection-/Safety-/Media-/Dimensiontriples
   limit-1/limit/limit+1; wenn ein nachgelagerter Grenzfall mathematisch von
   einem strengeren Cap dominiert wird, explizite Konstanteninvariante statt
   unerreichbarem Erfolgstest.
8. Rechte/Provenienz, Plaintext/HTML/Control/Bidi, Remote-Media, null Geo,
   Permission, Telemetrie, Analytics und Consolepayload.

Die Tests duerfen lokale Builder/Fakes ausschliesslich im Testpfad enthalten.
Keine neue Dependency, kein Netz und kein Snapshot-Grossblob.

## R4-B – echte IDB-/Rotation-/Failure-Matrix (Terra)

Exakte Schreibpfade:

1. `apps/mobile/src/mobile-regional-events-store.test.ts`
2. `apps/mobile/src/mobile-regional-events-selection.test.ts`
3. `tests/e2e/g3-020-regional-events-store-harness.ts`
4. `tests/e2e/g3-020-regional-events-store.spec.ts`
5. `docs/evidence/WRN-G3-020/P2-R4-B-IDB-MATRIX.md`
6. `docs/handoffs/WRN-G3-020-p2-r4-b-idb-matrix.md`

Der historische erste Lauf hat die Positionen 5 und 6 als RED-Beleg in
`fd6da12` versiegelt; sie bleiben read-only. Der R4-B-R1-Lauf nutzte
stattdessen bei identischen vier Testpfaden ausschliesslich:

5. `docs/evidence/WRN-G3-020/P2-R4-B-R1-IDB-MATRIX.md`
6. `docs/handoffs/WRN-G3-020-p2-r4-b-r1-idb-matrix.md`

Diese historischen R4-B-/R4-B-R1-Allowlists erteilen keine aktuellen
Schreibrechte. Fuer die noch offene Restmatrix ersetzen mit Vorrang und
vollstaendig:

- R3-A ausschliesslich
  `docs/tasks/WRN-G3-020-P2-R4-B-R3-A-CAP-MATRIX.md`;
- R3-B ausschliesslich
  `docs/tasks/WRN-G3-020-P2-R4-B-R3-B-BLOCK-FAILURE-MATRIX.md`;
- gemeinsame Rechte-/Integrationskorrektur
  `docs/tasks/WRN-G3-020-P2-R4-B-R3-R1-SPLIT-CORRECTION.md`.

Beide Writer bleiben bis zum kanonischen Sol-Schlussrecheck-GREEN
gesperrt. Danach duerfen sie parallel nur ihre disjunkten Splitpfade
editieren/testen, verwenden nie den Git-Index, und Chief integriert exklusiv
R3-A vor R3-B. Bestehende Specs duerfen nicht runtime-importiert werden.

Echte Browser-/IndexedDB-Assertions, keine reine Quellinspection:

1. Replacement: Missingreference, falscher Namespace, falsches Prefix und
   legitimer historischer Replacementanker nach mindestens vier Releases;
   Failures `protected`, null Mutation und bytegleicher Restartzustand.
   Zusaetzlich Positive: dieselbe ID mit zwei verschiedenen Objekthashes und
   zwei Entries mit gemeinsamem Replacementziel ergeben jeweils genau einen
   Referencekey, erfolgreichen Merge und bytegleichen Restart.
2. Finaler Safetymerge: 511/512/513 Entries, 1023/1024/1025 References und
   exakt 65535/65536/65537 UTF-8-Bytes. Positive Grenzen muessen am echten
   Mergepfad akzeptiert werden, Overflow vor erstem `put` abgelehnt werden.
   Dominierte Faelle brauchen eine explizite Groesseninvariante.
3. Activate: niedrigere Revision immer `protected`, gleich-identische,
   gleich-konfligierende und hoehere Safetyrevision. Rollback-lower nur bei
   voller Entry-/Referencecoverage.
4. Safety-persist-before und Rotation jeweils Write-, Readback-, Abort- und
   Quota-Fehler. Slots bleiben bytegleich; nur bereits erfolgreich strengere
   Safety darf erhalten bleiben. Kein Auto-Retry.
5. Generation exakt: Candidate, Activate mit Safetymerge, B2, A3, Rollback,
   No-change und Reject. Zwei echte Tabs gegen den Eventstore: exakt ein
   Erfolg und ein Conflict; Selection-CAS bleibt getrennt ebenfalls belegt.
6. Vollstaendige Activate-/Rollback-Slottabelle: Candidate-Loeschung, altes
   Previous verwerfen, Readback, Restart, A1/B2/A3, mehr als drei weitere
   Releases, Wildcard-/Hashblock, Rollback und keine Resurrection.
7. Future-DB; Future-Record fuer `eventBundles`, `eventControl`, `eventSafety`;
   Extra- und Missing-Eventstore; unbekannter Recordkey; pre-R3-, corrupt
   Bundle-/Control-/Safetyrecord; Foreign-DB-Sentinel; kein Produktdelete oder
   stilles Upgrade.
8. Selection Missing/Save/Clear/Restart/Future, 4095/4096/4097 Bytes,
   stale generation, Storage-/Transaktionsfehler, Abort/Quota/Readback,
   Fremdkeys und Zwei-Tab-CAS. Content-/Selection-Clear aendert EventSafety
   nicht.

Failure Injection darf nur im E2E-Test-/Harnesspfad erfolgen. Kein Testhook,
Export, Flag oder Bypass wird in Produktquellen aufgenommen. Ist eine
verpflichtende echte Fehlerart ohne Produktmutation nicht deterministisch
injektierbar, stoppt R4-B und dokumentiert exakt den fehlenden Testseam; keine
Simulation wird als echter IDB-Beleg ausgegeben.

## Gemeinsame Gates

Jeder Writer prueft seinen Scope; nach beiden Commits reproduziert Chief die
Gesamtmatrix mit exakt Node 24.19:

- fokussierte und volle Contract-/Mobiletests;
- beide Typechecks;
- ESLint und Prettier aller zehn G3-020-TS-Pfade;
- G3-020-Playwright `mobile-390x844`, ein Worker, keine stillen Skips;
- 19 Boundaries, Releaseboundary und Fixtureprovenienz;
- Fixture-/Pin- plus sieben Boundaryhashes;
- exakte Pfade, `git diff --check` und null Produkt-/Fixturedelta.

## Stopregeln und Gatefolge

1. Historische R4-A- und R4-B-R1-/R2-Teillaeufe sind beendet; sie erteilen
   keine neuen Schreibrechte.
2. Nur bei null Findings im kanonischen Sol-Schlussrecheck aktiviert
   Chief die aktuellen R3-A- und R3-B-Splitwriter mit ihren disjunkten
   Vorrang-Allowlists.
3. Beide Terra-Writer schreiben keine Produktquelle, verwenden keinen
   Git-Index und importieren keine bestehenden Specs zur Laufzeit. Ein
   reproduziertes RED stoppt nur den betroffenen Teilauftrag.
4. Chief integriert und reproduziert exklusiv R3-A vor R3-B.
5. Frische Terra-QA muss `P2-R3-QA-M-001` explizit schliessen.
6. Ein gezielter Sol-Security-/Privacy-Review bestaetigt null neue Testbypaesse
   und weiterhin null reportable/deferred Findings.
7. Finaler unabhaengiger Sol-P2-Abschluss mit null Findings ist Pflicht.
8. P3 startet erst danach separat. Website, Provider, Live, Android/AAB/Play,
   Signierung, Upload, Deployment und Release bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R4-TEST-COMPLETION
- Status: R3-Split fachlich geschlossen; kanonischer Sol-Schlussrecheck offen
- Produktkandidat: `cb0f6bc` eingefroren; R4-A `981ead6` GREEN
- Bytecap-QA/Security: `f140a1c`; `93f581a`, Scan
  `976086cb-2ba9-4c92-aed1-1dbe45a683fe`; beide GREEN
- Offen: kanonischer Sol-Schlussrecheck, R3-A/R3-B, Chief-Matrix, neue
  Testcompletion-QA, Testbypass-Security und P2-Abschluss
- Rechte: alle Testschreibrechte beim Chief; keine Writer aktiviert
- Naechster Schritt: kanonischer Sol-Schlussrecheck
- END-CHECK: :)
