# WRN-G3-020 P2-R2 – finale Semantikpraezisierung

Status: **P1-R2 GREEN IN `10615b1` – P2-WRITERGATE OFFEN**

## Zweck und Vorrang

Dieses Paket schliesst `P1-R1-M-001` bis `P1-R1-M-004` aus `24454ec`.
Es ergaenzt P2 und P2-R1; bei Abweichung gilt R2. Geschlossene Rechte-, Text-,
Medien-, Cap-, IDB-Beleg-, Allowlist-, OUT- und Boundaryregeln bleiben
unveraendert. P2 erhaelt erst nach frischem unabhaengigem P1-R2-GREEN Rechte.

## R2-01 – kanonische Hashpraeimages und Revisionen

`canonicalJson(value)` ist exakt `JSON.stringify` eines neu konstruierten
Plain Objects mit den im Schema genannten Keys in genannter Reihenfolge.
Arrays sind vorher wie unten sortiert. Werte enthalten kein `undefined`,
BigInt, `NaN`, Infinity oder `-0`; Strings sind zuvor NFC-/Plain-text-validiert.
UTF-8-Bytes dieses Strings sind die SHA-256-Praeimage.

- `taxonomySha256 = sha256(canonicalJson({continents,countries,regions,identityLinks}))`
  mit exakt dieser Keyreihenfolge.
- `sourcesSha256 = sha256(canonicalJson(sources))`.
- `eventsSha256 = sha256(canonicalJson(events))`.
- `mediaSha256 = sha256(canonicalJson(media))`.
- `revocationsSha256 = sha256(canonicalJson(revocations))`.
- Event-`contentSha256` hasht das neu konstruierte Eventobjekt in
  Event-Schemareihenfolge ohne den Key `contentSha256`.

Sortierung erfolgt mit ASCII-Codepointvergleich, nie locale-aware:

- Continents `(continentId)`; Countries `(countryId)`; Regions `(regionId)`;
- IdentityLinks `(namespace,sourceId,relation,targetId)`;
- Sources `(sourceId)`; Events `(eventId)`; Media `(mediaId)`;
- Revocations/SafetyEntries
  `(namespace,id,objectSha256-or-empty,status,replacementId-or-empty)`.

Der buildexterne Pin ist ein kompiliertes Exact-key-Objekt in dieser
Reihenfolge: `schema`, `contractVersion`, `path`, `bundleRevision`,
`taxonomyRevision`, `transportSha256`. Typen: die zwei Versionfelder und Pfad
exakte Strings, beide Revisionen positive sichere Ganzzahlen, Hash lower-case
64 Hex. Zusatz-/Missingkeys oder ein Wertunterschied bedeutet kein Request.

Candidate-Regeln gegen Active:

1. `bundleRevision < active.bundleRevision`: reject.
2. Gleich und Transporthash gleich: `no-change`, kein Candidatewrite.
3. Gleich und Transporthash verschieden: conflict/reject.
4. Hoeher: nur nach allen Validierungen Candidate.
5. Expliziter Rollback verwendet ausschliesslich den gespeicherten Previous-
   Slot und ist kein Candidateupdate. A/B/A per Netzrelease braucht steigende
   Revisionen A1/B2/A3.

Taxonomierevision folgt zusaetzlich der bereits gebundenen Hashregel: geaenderte
Taxonomie verlangt strikt hoehere Revision; gleicher Hash verlangt gleiche
Revision; Rueckgang oder gleiche Revision mit anderem Hash verwirft.

## R2-02 – totale Freshness- und Ergebnisprioritaet

Die Projektion berechnet zuerst einen `contentStatus`, getrennt vom
Transport-/Offlinemodus:

1. Future/corrupt Store oder ungesunde Safety => `protected`.
2. Kein Active => online `error`, offline `offline-none`.
3. Active Bundle bei `referenceInstant > bundle.validUntil` => `stale`.
4. Kanonisiere die bewusst gespeicherte Region; ohne gueltige Auswahl =>
   `empty` ohne globale Ersatztermine.
5. Betrachte nur Events dieser Region. Regionsfremde Events beeinflussen den
   Zustand nicht.
6. Entferne blocked/gone/replaced und `cancelled` aus der kommenden Liste.
7. Teile verbleibende `scheduled|changed` in fresh
   (`referenceInstant <= event.validUntil`) und expired.
8. Fresh wird nach Start>=Referenz gefiltert, total geordnet und auf fuenf
   begrenzt. Bei 1..5 Ergebnissen => `ready-1` bis `ready-5`, unabhaengig von
   weiteren expired/cancelled/regionsfremden Events.
9. Kein Fresh-Ergebnis, aber mindestens ein passendes expired
   `scheduled|changed` => `stale`.
10. Sonst => `empty`.

Verbindliche Mischfaelle: fresh+expired=`ready-n`; expired-only=`stale`;
cancelled+expired nur dann `stale`, wenn expired scheduled/changed vorhanden,
sonst `empty`; region-mismatch+expired=`empty` fuer die gewaehlte Region.
Gleichheit an Bundle-/Event-`validUntil` ist fresh.

Bei gueltigem LKG und offline wird der Auslieferungsmodus `offline-lkg` plus
dieser `contentStatus` ausgegeben; ein fehlgeschlagenes Onlineupdate ergibt
`invalid-update-lkg` plus denselben LKG-`contentStatus`. Diese Modi veraendern
nicht Filter, Sortierung oder Daten. Lifecycleliste bleibt getrennt und zeigt
hoechstens fuenf sichere `changed|cancelled`; blocked zeigt nur ID/Status.

## R2-03 – Safetyhash, Merge und Slotrotation

SafetyEntry ist exakt das R1-Revocationobjekt. Sein Identitaetskey ist
`(namespace,id,objectSha256-or-empty)`. Innerhalb eines Ledgers ist jeder Key
einmalig. Allgemeiner leerer Hash blockiert alle Objektversionen derselben
Namespace/ID; ein Hashkey blockiert genau diese Version. Alle drei Statuswerte
halten das Original gesperrt.

`SafetyRecord.sha256 = sha256(canonicalJson({revision,entries}))` mit exakt
dieser Keyreihenfolge und der R2-01-Sortierung; das Selbstfeld `sha256` gehoert
nicht zur Praeimage.

Merge gegen gespeichertes Ledger:

- incoming Revision kleiner => reject/protected, kein Write;
- gleich => nur identischer Hash und bytegleiche Entries sind `no-change`;
  jede Abweichung ist conflict/protected;
- hoeher => vereinige nach Identitaetskey. Neue Keys werden aufgenommen. Bei
  bestehendem Key ersetzt der Incoming-Eintrag den Metadatensatz; weil jeder
  Status das Original blockiert, wird die Sperre nicht geschwaecht.
  `replacementId` ist nur bei `replaced` erlaubt und muss gueltig sein.
- Doppelte Incomingkeys, Hashfehler oder ungueltige Referenz => gesamtes
  Incomingledger reject; gespeichertes Ledger bleibt bytegleich.

Safety wird in eigener Transaktion vor jedem Activate/Rollback committed und
readback-validiert. Vollstaendige Slottabellen:

| Operation | Vorher Active | Vorher Candidate | Vorher Previous | Nachher Active | Nachher Candidate | Nachher Previous |
|---|---|---|---|---|---|---|
| Activate | A oder null | C erforderlich | P oder null | C | null/Record geloescht | A oder null; altes P verworfen |
| Rollback | A erforderlich | C oder null | P erforderlich | P | null/Record geloescht | A |

Alle Record-`slot`-Felder und Controlpointer werden in derselben atomaren
Rotation umgeschrieben. Vor Commit werden Stores und Pointer bytegleich
readback-geprueft. Generation steigt exakt um eins. Fehler laesst Vorzustand
unveraendert; bekannte Safety bleibt bereits persistiert und vorrangig.

## R2-04 – starke atomare Auswahlrevision in eigener IndexedDB

Die fruehere localStorage-/`setItem`-Disposition wird ersetzt. Der sichtbare
Vertragsname bleibt `wrn.mobile-regional-events-selection.v1`, ist aber ein
Recordkey, kein LocalStoragekey.

- DB: `wrn-mobile-regional-events-selection-v1`, Version 1.
- Store: `selection`, keyPath `key`, keine Indizes/AutoIncrement.
- Exakt ein optionaler Record:
  `storeSchema:1`, `key:'wrn.mobile-regional-events-selection.v1'`,
  `generation` >= 1, `contractVersion:1`,
  `schema:'wrn.mobile-regional-events-selection'`,
  `revision:'wrn-mobile-regional-events-selection-v1'`, `regionId`.
- Serialisiertes Recordcap 4096 UTF-8-Bytes, Exact-keys. Missing=`inactive`.
  DB-Version/Record-storeSchema >1 oder malformed/over-cap=`protected`; null
  Upgrade/Write/Delete.

Save nimmt `expectedGeneration` (`0` fuer Missing). Eine einzelne readwrite-
Transaktion liest den Record, vergleicht Generation, validiert Region gegen
Active Taxonomie, schreibt exakt einen Record mit `generation+1`, liest ihn
bytegleich zurueck und meldet erst nach Complete Erfolg. Mismatch =>
`conflict`, null Write, kein Auto-Retry/Last-writer-wins-Erfolg. IDB serialisiert
konkurrierende Tabs; genau einer kann dieselbe ExpectedGeneration committen.

Clear nutzt dieselbe Transaktion/Gegenrevision, loescht nur diesen Record,
liest Missing zurueck und meldet erst nach Complete Erfolg. Eventupdate,
Rollback, Takedown und Content-Clear oeffnen diese DB nicht. Optionaler
BroadcastChannel sendet nur die neue Generation, nie Region/Rawwert; Korrektheit
haengt nicht davon ab.

Die bestehende Allowlist bleibt ausreichend: Implementierung in
`apps/mobile/src/mobile-regional-events-selection.ts`, Units dort und reale
Zwei-Tab-/Restart-/Future-/Abortbelege in den bereits verpflichtenden G3-020-
IDB-Harness-/Specpfaden. Keine neue Datei oder Dependency.

## R2-Pflichttests

- Hashpraeimages fuer jedes Array, vertauschte Eingabeordnung, IdentityLink-
  Sortiertupel, Pin Missing/Extra/Typ/Wert, Bundle Revision kleiner/gleich-
  gleich/gleich-konflikt/hoeher, A1/B2/A3 und gespeicherter Rollback.
- Mischfreshness exakt fuer fresh+expired, expired-only, cancelled+expired,
  region-mismatch+expired und beide validUntil-Gleichheiten; Offline-/Invalid-
  Update-Modi erhalten identischen Contentstatus.
- Safety Revision kleiner/gleich-identisch/gleich-konflikt/hoeher, General-
  vs Hashkey, Doppelte, Hashpraeimage, persist-before sowie komplette
  Activate-/Rollbacktabelle mit Candidate-Loeschung und Readback.
- Auswahl Missing/Save/Clear, zwei parallele Tabs mit gleicher Generation
  (genau ein Erfolg/ein Conflict), Restart, Future-DB/Record, Abort/Quota/
  Readback, Region ungueltig nach Taxonomiewechsel ohne stille Umschreibung.

## Gate

Frischer unabhaengiger Sol-P1-R2 prueft diese vier Korrekturen. Nur bei null
offenen Findings aktiviert der Chief separat genau einen Terra/high-P2-Writer
auf der unveraenderten dreizehnpfadigen Allowlist. Kein UI-, Website-, echter
Content-, Provider-, Kosten- oder externes Recht folgt daraus.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R2-Vertragskorrektur
- Status: dokumentarisch gebunden; P2 gesperrt
- Basis: P1-R1 `24454ec`
- Adressiert: P1-R1-M-001 bis P1-R1-M-004
- Offen: frischer Sol-P1-R2
- Rechte: keine Produkt-/Test-/Fixture-/Browserrechte
- Naechster Schritt: P1-R2
- END-CHECK: :)
