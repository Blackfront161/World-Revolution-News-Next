# WRN-G3-020 P2-R1 – Integritaets-, Safety- und Evidenzkorrektur

Status: **GEBUNDEN – KORREKTURWRITE BIS FRISCHEM PRECHECK-GREEN GESPERRT**

## Grundlage und Ziel

Kandidat `cc800a2` bleibt eingefroren. Terra-QA `8609bd7` ist YELLOW;
Securityscan `91a91209-61ee-4f54-b824-45183c355bc9` / Commit `f4abec3` ist
RED mit drei Medium und null deferred. Dieses Paket bindet genau:

- QA `M-001` bis `M-003` und die acht neuen ESLintfehler;
- Security `P2-S-M-001` bis `P2-S-M-003`;
- QA `L-001` als geschlossen disponiert: `git show --name-only cc800a2`
  enthaelt keinen Registerpfad. Der Registerhunk stammt aus dem separaten
  Chief-Commit `cd08904`; der Rangevergleich hatte Governance mitgezaehlt.

Vor frischem unabhaengigem Sol-Precheck-GREEN besteht kein Korrekturwrite.
P3 und alle externen Gates bleiben gesperrt.

## R1-01 – schema-geordnete Hashpraeimages

- Der generische lexikographisch sortierende `canonicalJson` darf fuer keinen
  G3-020-R2-Hash verwendet werden.
- Fuer Taxonomie, Sources, Events, Media, Revocations, Eventcontent und Safety
  werden lokale Rekonstruktionsfunktionen implementiert. Sie erzeugen neue
  Plain Objects mit exakt der in P2-R1/R2 genannten Keyreihenfolge; Arrays
  werden vorher nur nach den R2-Tupeln sortiert; danach exakt
  `JSON.stringify` und SHA-256 ueber UTF-8.
- Tests berechnen das Orakel unabhaengig, vergleichen alle Praeimages und
  Hashes, vertauschen Eingabe-/Objektkeyreihenfolgen und beweisen identisches
  Ergebnis. Ein lexikographisches Gegenorakel muss fuer die gebundene Fixture
  abweichen und darf nicht akzeptiert werden.
- Die Fixture wird aus dem korrigierten Orakel neu gehasht. Alle internen
  Hashfelder und der externe Transportpin werden aktualisiert. Der neue
  Fixture-/Pinhash wird in Evidence gebunden.

## R1-02 – bytegenauer Pin vom Transport bis zum Store

- SHA-256 wird direkt ueber die empfangene `Uint8Array` vor jeder Dekodierung
  berechnet. Erst nach exaktem Pinvergleich folgt
  `new TextDecoder('utf-8', { fatal: true })`; BOM, invalid UTF-8 und Decode-
  Fehler sind fail-closed.
- Der Runtimepin muss Exact-keys und feld-/wertgleich zum kompilierten
  `mobileRegionalEventsBuildPin` sein. Alternativ darf der Produktionsloader
  keinen frei waehlbaren Pinparameter mehr anbieten. Missing/Extra/Typ/Wert-
  Abweichung bedeutet kein Request beziehungsweise reject.
- Der Store nimmt fuer Candidate keine frei kombinierbaren
  `rawJson + transportSha256`-Behauptungen an. Er erhaelt exakte Transportbytes
  und laesst sie durch den bytegenauen Pin-/Fatal-decode-/Contractpfad pruefen,
  bevor `rawJson` und selbst berechneter Hash gespeichert werden. Ein direkter
  Storecaller kann den Hash nicht vorgeben.
- Pflichtnegativtests: BOM, invalid UTF-8, Pin Missing/Extra/Typ/Wert,
  Bytes/Hash-Mismatch, Store-API-Bypass und kein Request vor exaktem Pin.

## R1-03 – verpflichtendes, gebundenes Safety persist-before

- `activate` und `rollback` akzeptieren kein optionales oder callerdefiniertes
  Safetyargument. Safety wird ausschliesslich aus dem voll validierten,
  gespeicherten Sourcebundle der Rotation abgeleitet.
- Jede SafetyEntry wird mit dem exakten Revocationvalidator geprueft:
  Exact-keys, Namespace/ID/optional Hash/Status/Replacement, Referenzen,
  Duplikate, Sortierung, 512-Entry- und 64-KiB-Cap. Hash und Revision muessen
  bytegleich zu `revocations`, `revocationsSha256` und `revocationRevision`
  dieses Bundles passen.
- Candidate-Activate: niedrigere Safetyrevision reject; gleiche Revision nur
  bei identischem Ledger; hoehere Revision wird nach R2-Merge in einer eigenen
  Transaktion geschrieben und readback-validiert. Erst danach darf Rotation
  beginnen.
- Rollback: bestehendes monotones Ledger darf nie sinken. Die Revocations des
  Previousbundles muessen vollstaendig vom aktuellen Ledger abgedeckt sein;
  andernfalls `protected`, keine Rotation. Ein no-change Safetyreadback ist
  vor Rotation verpflichtend.
- `ControlRecord.safetyRevision` muss in Snapshot, Candidate, Activate und
  Rollback exakt dem validierten SafetyRecord entsprechen. Abweichung ist
  `protected`, null Mutation.
- Eventblock: Entry ohne `objectSha256` blockiert jede Revision derselben
  Namespace/ID; mit Hash nur den bytegleichen `contentSha256`. `gone` und
  `replaced` halten das Original ebenfalls gesperrt.
- DB-Storeliste muss sortiert exakt `eventBundles,eventControl,eventSafety`
  beziehungsweise fuer Selection exakt `selection` sein. Extra/Missing Store,
  Future Record/DB oder unbekannter Control-/Safetykey => `protected`, null
  Upgrade/Write/Delete.
- Pflichtgrenzen: 511/512/513 Entries, 65535/65536/65537 UTF-8-Bytes,
  malformed/wildcard/hash/replaced/Duplikat, Revision kleiner/gleich-identisch/
  gleich-konflikt/hoeher, persist/write/readback fail und kompletter
  Activate-/Rollback-Slottabellenbeleg.

## R1-04 – per-Event Replay-Schutz

Beim Candidatevergleich wird das voll validierte Activebundle gelesen. Fuer
jede gemeinsame `eventId` gilt vor Candidatewrite:

1. Candidate `contentRevision < active`: reject;
2. gleich und `contentSha256` gleich: erlaubt/no content change;
3. gleich und Hash verschieden: conflict/reject;
4. hoeher: erlaubt, wenn gesamter Candidate sonst gueltig ist.

Neue IDs sind erlaubt; entfernte IDs werden nicht heuristisch rekonstruiert.
Expliziter gespeicherter Rollback ist von Candidateupdate getrennt und bleibt
durch monotones Safety gefiltert. Pflichttests: kleiner, gleich/gleich,
gleich/konflikt, hoeher, A1/B2/A3 und Rollback.

## R1-05 – vollstaendige Test- und reale IDB-Matrix

Die Zahl der Testfaelle darf zusammengefasst sein, aber jede folgende Zeile
braucht eine explizite Assertion und Zuordnung im Ergebnisbericht:

1. Exact-keys, alle ID-Praefixe/Case/Laenge, Parents, neun Locales,
   Aliasziel/-zyklus/-namespace, Successor ohne Autoauswahl, Dedupe nur ID;
2. UTC-Kanonizitaet, IANA unbekannt/nichtkanonisch, Gap, beide Fold-Instants,
   Offset/Wall-clock/Ende und Start-gleich-Referenz;
3. Freshness-/Mischmatrix, status, 0/1/4/5/6, gleiche Zeit und stabile ID-
   Tie-Breaker;
4. alle Hashpraeimages, Pin/Bytepfade, Loadercaps und Revisionen;
5. alle direkten Count-/Text-/URL-/Selection-/Safety-/Media-/Dimensiontriples
   und die zwei gebundenen Dominanzinvarianten;
6. Rechte/Provenienz/URL/Plaintext/Control/Bidi/Remote-Media/no remote/Geo/
   Permission/Telemetry/Analytics/Console;
7. reale isolierte Browser-IDB-Pruefung fuer Candidate, Activate, Rollback,
   A1/B2/A3, Neustart, Abbruch, simulierte Quota-/Readbackfehler, Future-DB,
   Future-Record, Extra-Store, Safety persist-before und Resurrection;
8. zwei echte Pages/Tabs mit gleicher Selection-ExpectedGeneration: exakt ein
   Erfolg und ein Conflict; Clear, Restart, Future und Fremd-DB-Sentinel.

Mocks/Quellinspection ersetzen Zeile 7/8 nicht. Browserpruefungen verwenden
einen isolierten DB-Namespace pro Lauf und hinterlassen keinen Fremdzustand.

## R1-06 – Lint und Scope

- Alle zehn neuen TypeScript-Produkt-/Testpfade muessen ESLint mit null
  Fehlern bestehen. Leere Catchbloecke erhalten eine explizite sichere
  Behandlung/Kommentar gemaess Regel; `any`, Control-RegEx und ungenutzte
  Variablen werden typisiert beziehungsweise ohne Regelunterdrueckung entfernt.
- Keine globale ESLint-Deaktivierung und keine neue Config/Dependency.
- Alle sieben Boundaryhashes bleiben exakt. Contractindex, Website, G3-017,
  Reader, Contentstore/-controller und App-UI bleiben byteunveraendert.

## Exakte Korrektur-Allowlist

Genau ein frischer `backend_data_reliability_engineer` Terra/high darf nach
Sol-Precheck-GREEN ausschliesslich schreiben:

1. `packages/content-contracts/src/mobile-regional-events-v1.ts`
2. `packages/content-contracts/tests/mobile-regional-events-v1.test.ts`
3. `apps/mobile/src/mobile-regional-events.ts`
4. `apps/mobile/src/mobile-regional-events.test.ts`
5. `apps/mobile/src/mobile-regional-events-store.ts`
6. `apps/mobile/src/mobile-regional-events-store.test.ts`
7. `apps/mobile/src/mobile-regional-events-selection.ts`
8. `apps/mobile/src/mobile-regional-events-selection.test.ts`
9. `apps/mobile/public/wrn-mobile-regional-events/v1/mobile-regional-events.json`
10. `tests/e2e/g3-020-regional-events-store-harness.ts`
11. `tests/e2e/g3-020-regional-events-store.spec.ts`
12. eigene neue R1-Evidence und eigenes R1-Handoff.

Packageexport, Register/Governance, alle bestehenden fremden Dateien,
Dependencies/Config/Lock, UI/Website/Provider/Release sind OUT. Zusatzpfad =
Stop an Chief.

## Gatefolge

1. Frischer Sol-Precheck dieses Pakets.
2. Nur bei GREEN genau ein Terra/high-R1-Writer, keine Kinder.
3. Chief reproduziert fokussierte und breite Matrix, Scope, Lint, Hashes.
4. Frische Terra-QA und versiegelter Sol-Security-Deltacheck.
5. Nur bei beiden GREEN finaler Sol-P2-Architekturabschluss.
6. P3 bleibt bis zu diesem Abschluss gesperrt.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R1
- Status: Korrekturvertrag gebunden; Write bis Precheck gesperrt
- Basis/Kandidat: `929bbc1` / `cc800a2`
- QA/Security: `8609bd7`; Scan
  `91a91209-61ee-4f54-b824-45183c355bc9`
- Offen: frischer Sol-Precheck
- Rechte: keine Korrekturrechte vor GREEN
- Naechster Schritt: P2-R1-Precheck
- END-CHECK: :)
