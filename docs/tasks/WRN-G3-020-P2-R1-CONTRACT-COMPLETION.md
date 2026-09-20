# WRN-G3-020 P2-R1 – ausfuehrbarer Datenvertrag

Status: **DOKUMENTARISCH GEBUNDEN – P2 BIS P1-R1-GREEN GESPERRT**

Nachtrag: P1-R1 `24454ec` fand vier letzte Semantikpraezisierungen.
`docs/tasks/WRN-G3-020-P2-R2-FINAL-CONTRACT.md` hat bei Abweichung Vorrang,
insbesondere fuer Hashpraeimages, Freshnessprioritaet, Safety/Rotation und die
starke Auswahlrevision in einer getrennten IndexedDB.

## Zweck und Vorrang

Dieses Paket schliesst `P1-R-M-001` bis `P1-R-M-004` aus dem unabhaengigen
Recheck `ab2644b`. Es ergaenzt
`docs/tasks/WRN-G3-020-P2-BACKEND-PACKET.md`. Bei Abweichung gilt dieses
engere R1-Paket. Alle C-01-bis-C-20-, OUT-, Hash- und Kostenregeln bleiben
unveraendert. Vor frischem Sol-P1-R1-GREEN besteht kein Produktrecht.

## R1-01 – exaktes Dokument- und Objektschema

Alle Objekte lehnen Zusatzkeys ab. Integer sind sichere, endliche JSON-
Ganzzahlen. Hashes sind exakt 64 lower-case Hexzeichen. Alle UTC-Felder nutzen
exakt `YYYY-MM-DDTHH:mm:ss.sssZ` und muessen durch Parse plus Reformat
bytegleich roundtrippen.

### Bundle

Required keys, exakt in kanonischer Reihenfolge:

1. `schema: "wrn.mobile-regional-events.v1"`
2. `contractVersion: "1.0.0"`
3. `minimumAppContractVersion: "1.0.0"`
4. `bundleRevision`: positive Ganzzahl
5. `taxonomyRevision`: positive Ganzzahl
6. `generatedAt`: kanonisches UTC
7. `validUntil`: kanonisches UTC
8. `locales`: exakt `['en','de','es','fr','it','pt','ru','el','tr']`
9. `taxonomySha256`, `sourcesSha256`, `eventsSha256`, `mediaSha256`,
   `revocationsSha256`
10. `continents`, `countries`, `regions`, `identityLinks`, `sources`,
    `events`, `media`
11. `revocationRevision`: Ganzzahl >= 0
12. `revocations`

Die fuenf internen Hashes verwenden kanonisches JSON der jeweils gebundenen
Arrays: rekursiv Exact-keys in der hier definierten Reihenfolge, Arrays in
kanonischer ID-/Linkreihenfolge, UTF-8, keine unbedeutenden Leerzeichen. Der
Hash ist SHA-256 der resultierenden Bytes. Der Whole-document-Pin bleibt
extern und bindet Pfad, Schema, Contractversion, `bundleRevision`,
`taxonomyRevision` und Transport-SHA-256.

### Lokalisierte Namen

`LocalizedText` besitzt exakt die neun Locale-Keys in der oben genannten
Reihenfolge. Jeder Wert ist NFC-normalisierter Plain text und erfuellt seine
Feldcap. `SourceNames` ist entweder exakt `LocalizedText` oder exakt
`{ "und": PlainText }`; nie eine Mischung. Die lokale Fixture verwendet
`LocalizedText`.

### Taxonomie und Identitaetslinks

- Continent: exakt `continentId`, `names`.
- Country: exakt `countryId`, `continentId`, `names`.
- Region: exakt `regionId`, `countryId`, `names`.
- IdentityLink: exakt `namespace`, `sourceId`, `targetId`, `relation`;
  Enums `continent|country|region|event|source` und `alias|successor`.

`taxonomyRevision` muss ueber Candidate gegen Active monoton steigen, wenn
Taxonomiearrays oder IdentityLinks andere kanonische Hashes besitzen. Gleiches
Taxonomiehash verlangt gleiche Revision; gleiche Revision verlangt gleichen
Hash. Rueckgang oder Konflikt verwirft Candidate. Der externe Pin bindet beide
Revisionen und verhindert stillen Austausch.

### Source

Exakt: `sourceId`, `names`, `originalUrl`, `rightsStatus`, `licenseId`,
`rightsReference`, `provenanceReference`, `publishedAt`, `observedAt`,
`correctionContactLabel`.

### Event

Required exakt: `eventId`, `regionId`, `sourceId`, `status`, `titles`,
`locationNames`, `summaries`, `startInstant`, `startLocal`,
`startUtcOffsetMinutes`, `timeZone`, `publishedAt`, `observedAt`,
`validUntil`, `contentRevision`, `contentSha256`, `rightsStatus`, `licenseId`,
`rightsReference`, `provenanceReference`.

Optional nur als vollstaendige Gruppen:

- Ende: `endInstant`, `endLocal`, `endUtcOffsetMinutes`; alle drei oder keine.
- Medium: `mediaId`; hoechstens eines und muss auf genau ein Mediaobjekt zeigen.

`status` ist `scheduled|changed|cancelled`. `startLocal`/`endLocal` verwenden
exakt `YYYY-MM-DDTHH:mm:ss`; Offsets sind Integer `-840..840`. Der Eventhash
ist SHA-256 des kanonischen Eventobjekts ohne `contentSha256`.

### Revocation

Exakt: `namespace`, `id`, `status`, optional `objectSha256`, optional
`replacementId`. Namespace wie IdentityLink; Status `blocked|gone|replaced`.
`replacementId` ist nur und zwingend bei `replaced`; sonst verboten und im
selben Namespace. `objectSha256` ist optional lower-case SHA-256.

### Medium

Exakt: `mediaId`, `eventId`, `assetId`, `assetPath`, `mimeType`, `bytes`,
`width`, `height`, `pixelArea`, `sha256`, `altTexts`,
`altTextProvenanceReference`, `rightsStatus`, `licenseId`, `rightsReference`,
`provenanceReference`, `attributionLabel`.

Die P2-Produktfixture besitzt `media: []`; Medienobjekte werden nur mit
synthetischen In-memory-Vertragsfaellen geprueft. Kein Assetfile wird durch P2
freigegeben.

## R1-02 – Freshness und Auswahlalgorithmus

- Bundle: `generatedAt < validUntil <= generatedAt + 7 Tage`.
- Source: `publishedAt <= observedAt <= generatedAt`.
- Event: `publishedAt <= observedAt <= generatedAt < event.validUntil <=
  bundle.validUntil`.
- Alle Vergleiche erfolgen auf geparsten UTC-Epoch-Millisekunden nach
  bytegleichem Kanonizitaetscheck.
- Bundle ist stale bei `referenceInstant > bundle.validUntil`; Event ist stale
  bei `referenceInstant > event.validUntil`. Gleichheit ist noch gueltig.
- Ein Event muss zugleich Bundle- und Eventfreshness erfuellen. Ungueltige
  Reihenfolge verwirft das Bundle; abgelaufener, sonst valider Inhalt erzeugt
  den ehrlichen `stale`-Zustand.
- DST-Roundtrip, Statusfilter und Totalordnung bleiben exakt C-05 bis C-08.

## R1-03 – exakter IndexedDB-Vertrag

### Datenbank und Stores

- Name: `wrn-mobile-regional-events-v1`; Version `1`.
- Open erfolgt ohne Versionsargument, wenn eine bestehende DB nur geschuetzt
  inspiziert wird. Version > 1 ergibt `protected-future-store`, sofortiges
  Schliessen und null Upgrade/Transaktion/Write/Delete.
- Bei erstmaliger Anlage wird exakt Version 1 mit drei Object Stores erzeugt:
  - `eventBundles`, keyPath `slot`;
  - `eventControl`, keyPath `key`;
  - `eventSafety`, keyPath `key`.
- Keine Indizes, AutoIncrement oder weiteren Stores.

Exact record schemas:

- BundleRecord: `storeSchema:1`, `slot:'active|candidate|previous'`,
  `bundleRevision`, `taxonomyRevision`, `transportSha256`, `rawJson`.
- ControlRecord: `storeSchema:1`, `key:'control'`, `generation` >= 0,
  `active`, `candidate`, `previous` je null oder exakt
  `{bundleRevision,taxonomyRevision,transportSha256}`,
  `safetyRevision` >= 0.
- SafetyRecord: `storeSchema:1`, `key:'safety'`, `revision` >= 0,
  `sha256`, `entries`.

Maximal drei BundleRecords, ein ControlRecord und ein SafetyRecord. `rawJson`
ist die bytegleiche dekodierte Transportzeichenfolge eines bereits komplett
validierten v1-Bundles. Record-/Control-/Safety-Exact-keys gelten auch beim
Readback. Ein Record mit `storeSchema > 1`, unbekanntem Key/Store oder
inkonsistenter Controlreferenz erzeugt `protected` und null Write/Upgrade/
Delete. Corrupt v1 erzeugt `error` und null Mutation.

### Future-Raw-Disposition

- Neu geladener Future-Transport wird nach Transportcap/Parse nur im lokalen
  Funktionsspeicher gehalten, nicht persistiert, nicht an UI/Log uebergeben
  und als `future-bundle` beendet. Der Fetchpfad fuehrt keinen Storewrite aus.
- Bereits vorhandene Future-DB/-Recorddaten werden read-only erkannt und nicht
  normalisiert, migriert, geloescht oder ueberschrieben. Der Client behauptet
  nicht, unbekannte Records semantisch lesen zu koennen.
- Future-Raw belegt keinen der drei v1-Payloadslots und kann Safety/LKG nicht
  umgehen.

### Operationen und Gegenrevision

Jede Mutation erhaelt `expectedGeneration` und liest in derselben Transaktion
Control erneut. Abweichung, `versionchange`, Abort, Quota, Permission oder
Readback-Mismatch bricht ohne Auto-Retry ab. Korrektheit beruht auf der
Generation, nicht auf Benachrichtigung.

1. Candidate wird vollstaendig in memory validiert.
2. Readwrite-Transaktion ueber `eventBundles,eventControl,eventSafety` liest
   Control/Safety, prueft Generation/Safety, schreibt genau Candidate,
   liest ihn bytegleich zurueck, aktualisiert Candidatepointer und
   `generation+1`; erst `transaction.complete` ist Erfolg.
3. Neue Safetyeintraege werden in einer eigenen vorherigen Readwrite-
   Transaktion vereinigt, geschrieben, hash-/bytegleich gelesen und committed.
4. Activate startet danach eine neue Transaktion ueber alle drei Stores,
   liest die bereits persistierte Safetyrevision und erwartete Generation,
   rotiert atomar Active -> Previous, Candidate -> Active, loescht Candidate,
   aktualisiert Pointer/Generation und prueft Readback vor Complete.
5. Rollback verwendet dieselbe persist-before-Safety- und Gegenrevisionsfolge,
   rotiert Previous -> Active und wendet Safety bei jeder Projektion vorrangig
   an. Ein blockierter Payload wird nie wieder sichtbar.
6. Nach erfolgreichem Commit sendet optional
   `BroadcastChannel('wrn-mobile-regional-events-v1')` nur
   `{generation}`. Kein Payload/Region/Rawwert. Ohne BroadcastChannel bleibt
   das Protokoll korrekt; jeder Tab muss vor Mutation Generation neu lesen.

## R1-04 – Rechte-, URL-, Text- und Medienorakel

- `rightsStatus` einzig `self-authored-local-fixture`.
- `licenseId` einzig `CC0-1.0`.
- `rightsReference`:
  `^wrn-rights-[a-z0-9]+(?:-[a-z0-9]+)*$`, maximal 128 Bytes.
- `provenanceReference` und `altTextProvenanceReference`:
  `^wrn-provenance-[a-z0-9]+(?:-[a-z0-9]+)*$`, maximal 128 Bytes.
- `correctionContactLabel`/`attributionLabel`: Plain text 1..512 Bytes.
- URL: 1..2048 UTF-8-Bytes, absolute `https:`, Username/Password leer,
  Host vorhanden, kein Fragment. P2-Fixturehost endet exakt auf `.invalid`.
- `mediaId`/`assetId` nutzen Praefixe `wrn-event-media-` bzw.
  `wrn-event-asset-` plus die C-01-Suffixgrammatik.
- `assetPath`:
  `^/wrn-mobile-regional-events/v1/assets/[a-z0-9]+(?:-[a-z0-9]+)*\.(png|webp)$`;
  keine Backslashes, Prozentzeichen, Query, Fragment oder `..`.
- MIME nur `image/png|image/webp`; Bytes 1..262144; Dimensionen 1..2048;
  `pixelArea === width * height <= 4_194_304`.
- `altTexts` ist exakt `LocalizedText`, jeder Wert 1..512 Bytes.
- SHA-Felder exakt lower-case `[0-9a-f]{64}`.

PlainText-Policy fuer jedes sichtbare Feld: gueltiges Unicode ohne unpaired
surrogate, NFC-bytegleich, kein U+0000..U+001F, U+007F..U+009F, U+200E,
U+200F, U+202A..U+202E oder U+2066..U+2069; keine fuehrenden/abschliessenden
Whitespacezeichen; nach Trim nicht leer. `<`, `>`, `&` und Markdownzeichen
duerfen als inert sichtbarer Text vorkommen, muessen aber via Textknoten/
React-Escaping literal bleiben. Kein Parser, HTML, Markdown oder DOM-Sink.

## R1-05 – verpflichtende Belege und Cap-Disposition

Die zwei Pfade
`tests/e2e/g3-020-regional-events-store-harness.ts` und
`tests/e2e/g3-020-regional-events-store.spec.ts` sind verpflichtend, nicht
optional. Sie verwenden einen isolierten DB-Namen pro Testlauf und pruefen
reale IndexedDB-Transaktionsabbrueche, simulierte Quota-/Readbackfehler,
A/B/A, Neustart, Future-DB/-Record, Generationkonflikt und persist-before-
Revocation. Keine Produkt-/Visualinjektion.

| Grenze | Pflichtbeleg |
|---|---|
| Transport 512 KiB | echter chunked Loaderpfad 524287/524288/524289 Bytes |
| dekodiertes JSON 512 KiB | Konstantengleichheit plus Produktpfadbeleg; `+1` ist wegen identischer UTF-8-Transportbytes redundant/unerreichbar |
| Kontinent 8, Land 256, Region 2048, Source 512, Event 4096, Link 4096, Revocation 512, Media 64 | je eigener Contractvalidator limit-1/limit/limit+1; Arraylaenge wird vor Elementiteration geprueft |
| ID 128, Text 512, Summary 2048, URL 2048 | je UTF-8 limit-1/limit/limit+1 mit Mehrbytefall |
| Auswahl 4096 | LocalStorage-Raw 4095/4096/4097 Bytes |
| Safety 64 KiB | Safety-Serialize/Store 65535/65536/65537 Bytes |
| Safety count 512 | 511/512/513 Eintraege |
| Media bytes 256 KiB | Metadatenvalidator 262143/262144/262145 |
| Breite/Hoehe 2048 | je 2047/2048/2049 bei Gegenachse 1 |
| Pixelflaeche 4_194_304 | 2048x2048 Equal; `+1` ist unter beiden Dimensionscaps mathematisch unerreichbar, deshalb Konstanteninvariant `pixelCap === widthCap * heightCap` plus 2049x1-Dimensionsreject |
| Storepayloads 3 | reale IDB-Slots 2/3; vierter Slotkey und unbekannter Slot fail-closed, Exact-key-Enumbeleg |

Count-Triples duerfen den reinen Contractvalidator direkt aufrufen; der echte
Loader beweist separat, dass Transport/Decodecaps vor Parse greifen. Kein Test
darf einen unmoeglichen nachgelagerten Produktzustand als erreichbar behaupten.

## R1-Allowlistkorrektur und Gatefolge

Die dreizehn P2-Pfade aus dem Hauptpaket bleiben exakt; Position 11 und 12
sind nun verpflichtend. Keine Assetdatei, App-UI, Config, Lockdatei oder
Dependency kommt hinzu. Der Writer muss alle hier genannten Orakel und Belege
innerhalb dieser Pfade umsetzen oder stoppen.

Nach frischem P1-R1-GREEN: genau ein Terra/high-P2-Writer. Danach Chief-
Reproduktion, frische Terra-QA, Sol-Securitydelta und finaler Sol-P2-
Architekturabschluss. P3 bleibt bis P2-GREEN gesperrt.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R1-Vertragskorrektur
- Status: dokumentarisch gebunden; P2 gesperrt
- Basis: P1-R `ab2644b`
- Adressiert: P1-R-M-001 bis P1-R-M-004
- Offen: frischer Sol-P1-R1-Recheck
- Rechte: keine Produkt-/Test-/Fixture-/Browserrechte
- Naechster Schritt: P1-R1
- END-CHECK: :)
