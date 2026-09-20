# WRN-G3-019 – P2-R3 Vertragsvervollstaendigung

Status: **GEBUNDEN – PRODUKTWRITE ERST NACH FRISCHEM SOL-RECHECK**

Stand: 31. August 2026

## Autoritaet und Ziel

PO-095 startete G3-019. Der P2-C-Vollstaendigkeitsaudit auf dem technisch
GREENen P2-R2-Stand `d66ee6e` meldet sechs Medium-Vertragsluecken. P2-R3
schliesst ausschliesslich diese Luecken, bevor P3 irgendeine Reader-v2-UI
schreibt.

P2-R3 veraendert weder Produktziel noch externe Rechte. Website, Shared Reader
v1, Reading State, bestehender Mobile-Reader, echte Inhalte/Medien, Provider,
Dependencies, Hosting/Live, Android/AAB/Play und Release bleiben OUT.

## R3-01 – Transformationsprovenienz und Blockanker

Jede `MobileReaderV2ArticleProjection` erhaelt zwei Pflichtfelder:

- `transformerId`: opake ASCII-ID, maximal 128 Zeichen;
- `transformerVersion`: opake ASCII-ID, maximal 128 Zeichen.

Sie werden exakt schluesselvalidiert und nie aus Text, Sprache oder Position
abgeleitet. Innerhalb eines Artikels sind alle `blockId` eindeutig; Duplikate
verwerfen das gesamte Sidecar atomar. Abschnitts-, Block-, Medien-, Quellen-
und Artikel-IDs bleiben getrennte semantische Namensraeume.

## R3-02 – Explizite Vorgaengerrelation

Die alte optionale Markerzeichenfolge wird durch ein optionales exaktes Objekt
ersetzt:

- `articleId`: stabile opake Vorgaenger-ID, ungleich aktuellem Artikel und in
  der bereits validierten Reader-v1-Artikelmenge vorhanden;
- `beforeBlockId`: existierender Blockanker derselben Section;
- `sourceFragmentSha256`: exakt der Hash der referenzierten Blockrange am
  Einfuegeanker;
- `label`: sichtbare, lokal fixtureverfasste Beschriftung, nicht leer,
  hoechstens 256 UTF-8-Bytes.

Nicht aktive Archiv- oder Fremd-IDs bleiben in diesem Slice OUT und benoetigen
spaeter einen eigenen archivegebundenen Vertrag. Die Relation entfernt,
ersetzt oder gruppiert keinen Originalblock. Fehlt ein
Feld, stimmt Anker/Hash nicht oder ist die Relation anderweitig ungueltig,
wird das Sidecar atomar verworfen und Reader v1 vollstaendig gezeigt.

## R3-03 – Lokales Quellenprofil

Das Dokument erhaelt ein Pflichtarray `sources`. Fuer jede eindeutige
`source.id`, die von den aktiven v1-Artikeln verwendet wird, existiert exakt
ein Profil; keine zusaetzlichen oder fehlenden IDs.

Jedes exakt schluesselvalidierte Profil bindet:

- `sourceId`;
- `selfDescription` und `editorialContext` als getrennte, nicht leere, jeweils
  hoechstens 2048 UTF-8-Bytes lange lokale Fixturetexte;
- `sourceType` als opake ID;
- eindeutige, sortierte `regions` und `languages`, je 1 bis 16 opake IDs;
- `freshness.status`: `current`, `stale` oder `unknown`;
- `freshness.reviewedAt`: feste ISO-Zeit oder `null`; bei `current`/`stale`
  Pflicht, bei `unknown` ausschliesslich `null`;
- `correctionContact`: `null` oder exakt `{ label, value }`, beide nur
  anzeigbarer Text, nicht leer und je hoechstens 256 UTF-8-Bytes.

Kein Quellenprofilfeld wird aus Artikeltext, Hostname, URL oder Vermutung
erzeugt. P2-R3 fuegt genau ein selbst erstelltes Profil fuer die bestehende
lokale Testquelle hinzu. Es bezeichnet die Fixture sichtbar als synthetisch
und macht keine Aussage ueber reale Organisationen. Ein Kontaktwert ist kein
Link und erzeugt keinen Navigations-/Netzwerksink.

Der Validator erhaelt neben Reader-v1-Bloecken die bereits validierten aktiven
v1-Artikel, um die Source-ID-Exact-cover-Regel zu pruefen. Snapshot- und
Artikel-ID-Exact-cover bleiben unveraendert.

## R3-04 – Alttext und buildgebundene Assetaufloesung

Jedes Medium erhaelt zusaetzlich den Pflichtwert `altText`, nicht leer und
hoechstens 1024 UTF-8-Bytes. `altTextProvenance` bleibt getrennt. Die aktuelle
Fixture behaelt `media: []`; sie behauptet kein Bild und P3 zeigt deshalb nur
einen ehrlichen Placeholder.

Der Mobileadapter stellt eine reine Aufloesungsfunktion bereit. Sie akzeptiert
ein validiertes `MobileReaderV2Media`, den aktuellen
`MobileReaderV2MediaSafetyLoad` und eine ausschliesslich codeeigene Registry.
Nur `ready` ohne passende Media-ID- oder Hashsperre darf weiterpruefen;
`protected` und `unavailable` liefern immer Placeholder/null. Ein
Registryeintrag bindet:

- opake `localAssetId`;
- festen same-origin Pfad unter `/wrn-mobile-reader-v2/assets/` ohne Query,
  Fragment, Backslash, `..`, Schema oder Host;
- MIME, Bytes, Breite, Hoehe und SHA-256 exakt gleich dem validierten Medium.

Nur ein vollstaendiger exakter Treffer liefert einen lokalen Assetdescriptor.
Missing, mismatch, revoked/protected Ledger oder ungueltiger Pfad ergibt
Placeholder/null und null Request. Das Sidecar selbst liefert niemals einen
Pfad oder eine URL. Reales Laden/Decodieren/Objekt-URL-Management bleibt P3-
Scope und benoetigt eigene UI-/Securitytests.

## R3-05 – Translation-Key und zwingender Staleschutz

Der lokale Adapter erhaelt eine opake `version`. Die Translationrequest bindet
die vollstaendige strukturierte `MobileReaderV2SnapshotIdentity`, keinen frei
erfundenen Snapshotstring. Ein deterministischer Resultat-Key ist SHA-256 ueber
kanonisches JSON und bindet exakt:

- die vollstaendige Snapshotidentitaet, Artikel-ID, Abschnitts-ID und
  Quellfragmenthash;
- Ausgangs- und Zielsprache;
- Adapter-ID und Adapterversion.

Eine Trennzeichenverkettung oder unvollstaendige Snapshotabkuerzung ist nicht
zulaessig. Die Translate-Funktion besitzt keinen freigebenden Default fuer Currentness.
Der Aufrufer muss `isCurrent` explizit liefern; vor Adapterstart und vor
Resultatrueckgabe wird Currentness geprueft. Abort oder Stale gibt niemals
Uebersetzungstext zurueck. Produktionsdefault bleibt `null/disabled`.

`loading` und `offline` sind UI-Zustaende, keine persistierten Vertragsergebnisse.
P3 muss sie spaeter explizit modellieren, Original immer sichtbar lassen und
bei Offline, Snapshot-, Artikel-, Abschnitts-, Fragment-, Sprach- oder
Adapterwechsel abbrechen/verwerfen. P2-R3 fuehrt weder Provider noch Netzwerk,
Storage, History, Cookie, Log oder Telemetrie ein.

## Exakte Writer-Allowlist

Nach einem frischen Sol-R3-Recheck mit GREEN darf genau ein
`backend_data_reliability_engineer` Terra/high nur diese Pfade schreiben:

- `packages/content-contracts/src/mobile-reader-v2.ts`
- `packages/content-contracts/tests/mobile-reader-v2.test.ts`
- `apps/mobile/src/mobile-reader-v2.ts`
- `apps/mobile/src/mobile-reader-v2.test.ts`
- `apps/mobile/public/wrn-mobile-reader-v2/v1/mobile-reader-v2.json`
- eigene neue P2-R3-Evidence und ein eigener Handoff

`apps/mobile/src/mobile-reader-v2-media-safety.ts` bleibt read-only; seine
bestehende API wird von der reinen Resolverpruefung nur konsumiert, nicht
geaendert. Alle anderen Produkt-, Test-, Fixture-, Katalog-, UI-, CSS-,
Website-, Shared-v1-, Reading-State-, Lock- und Paketpfade sind OUT.

## Pflichtmatrix

- alte gueltige Fixture wird bewusst auf den neuen exakten Vertrag migriert;
  alte/fehlende/future/extra Keys fallen atomar auf v1 zurueck;
- Transformer-ID/-Version fehlend, extra, ungueltig und gueltig;
- doppelte Block-ID innerhalb und zwischen Sections wird abgelehnt;
- Vorgaengerrelation gueltig sowie falsche Artikel-ID, Self-ID, Anker, Hash,
  Label und Extra-Key;
- Sourceprofile exact cover, fehlend, extra, doppelt, unsortierte/duplizierte
  Region/Sprache, Freshnesskombinationen, Kontakt `null`/Text/Extra-Key;
- Alttext fehlend/leer/gleich Cap/ueber Cap;
- Assetregistry exact match sowie Missing, Remote-/Traversalpfad und jede
  einzelne MIME-/Byte-/Dimensions-/Hashabweichung; Ledger explizit als
  `ready+allowed`, `ready+revoked`, `protected` und `unavailable`, wobei nur
  der erste Fall einen Descriptor liefern darf;
- Translation-Key aendert sich bei jedem einzelnen Bindungsfeld; Currentness
  false vor Start und nach Await, Abort, No-op, Disabled, Error, Resultatcap;
- null Remote-/Storage-/History-/Log-/Telemetrysenken;
- Contract- und Mobile-Gesamtregression, beide Typechecks, Boundaries,
  Fixture-Provenienz und eingefrorene Website-/Shared-v1-/Release-/Reading-
  State-Hashes.

## Gatefolge

1. frischer Sol-R3-Vertragsrecheck, nur eigener Bericht/Handoff;
2. bei GREEN genau ein Terra/high-Writer gemaess Allowlist;
3. frische unabhaengige Terra-QA und Sol-Security-Deltacheck;
4. frischer Sol-Abschluss der sechs P2-C-Findings;
5. erst danach exakter P3-Frontendvertrag und ein Frontendwriter.

Kein Schritt startet automatisch den naechsten externen Slice oder ein
Deployment.

END-CHECK: :)
