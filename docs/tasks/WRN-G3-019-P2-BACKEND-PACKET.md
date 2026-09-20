# WRN-G3-019 – P2 Backend-/Datenpaket

Status: **P1-R GREEN – P2 FUER GENAU EINEN TERRA/HIGH-WRITER BEREIT**

## Autoritaet und Baselines

- Product-Owner-Gate: PO-095, exakt `START WRN-G3-019`.
- Produktbaseline: `fd3b0f9704deef3d1ee179f2027067713a94ff67`.
- Start-/Governancebasis: `c4d3b822998300b7e4e0276e54995f0043954c7a`.
- P1-Bericht: `eea5f70`, vier Medium-Vertragsfindings.
- Aktueller Hauptbranch: `codex/g3-015-website-offline-shell`.

Dieser Vertrag schliesst P1-M-001 bis P1-M-004 dokumentarisch. Der frische
unabhaengige Sol-P1-R-Recheck auf `12d208c` bestaetigt alle Bedingungen mit
null Findings. Genau ein Terra/high-Backend-/Data-Writer darf P2 nach
gesicherter Chief-Uebergabe bearbeiten. Der Writer erweitert den Scope nie
selbst.

## Unveraenderliche Grenzen

- G3-019 ist Mobile-only. Website, Shared Reader v1, bestehende v1-Release-
  und Offlinepfade bleiben byteunveraendert.
- Reader v1 bleibt alleinige autoritative Originaltext- und Fallbackquelle.
- Das Sidecar ist eine optionale, atomar validierte Darstellungsschicht.
- Reading State, Save, Progress, History, Back, Fokus, Share und externe
  Originalquelle behalten ihre bestehenden Schluessel und Semantik.
- Nur selbst erstellte lokale Medien- und Uebersetzungsfixtures; keine echten
  Inhalte, Remoteziele, Provider, Netzrequests, neue Dependencies oder Kosten.
- Produktdefault fuer Uebersetzung ist `disabled`.

## C-01 bis C-05 – Sidecar, Pin, Atomizitaet und Fallback

- **C-01 Externer Pin:** Der Mobilecode besitzt einen ausserhalb des Sidecars
  liegenden, buildgebundenen Pin. Er bindet festen lokalen Pfad,
  Sidecarrevision und Whole-document-SHA-256 an die vollstaendige
  Snapshotidentitaet. Fehlt der Pin, erfolgt null Sidecarrequest und v1 bleibt
  unveraendert sichtbar.
- **C-02 Fester Pfad:** Der einzige G3-019-Pfad ist same-origin und im
  Mobilecode fest definiert. Kein Pfad oder keine URL stammt aus Sidecar,
  Manifest, Query, Storage oder Nutzereingabe.
- **C-03 Pruefreihenfolge:** Transportcap und externer Whole-document-Hash
  werden vor JSON-Parsing geprueft; danach exakte Schluessel, Schema,
  Version/Revision, alle Caps und die komplette Snapshotbindung.
- **C-04 Atomar:** Missing, invalid, mismatch, future, over-cap, revoked oder
  jeder Teilfehler verwirft das gesamte Sidecar. Keine Artikel- oder
  Abschnittsteilmenge wird aktiviert.
- **C-05 v1-Wahrheit:** Aktiver v1-Release, Offlinebundle und Readerdetails
  bleiben Wahrheitsquelle. Das Sidecar darf nicht in
  `localContentReleaseResourceIds`, `LocalContentReleaseDescriptorV1` oder
  `LocalContentReleaseReadyV1` aufgenommen werden.

Die vollstaendige Snapshotidentitaet enthaelt mindestens Release-Revision,
erwarteten Manifest-Whole-document-Hash, Reader-v1-Revision, extern gepinnten
Reader-v1-Whole-document-Hash und internen Reader-v1-Integritaetshash.

## C-06 bis C-09 – Originalerhalt und Struktur

- **C-06 Exact cover:** v2 dupliziert keinen autoritativen Originaltext.
  Jeder v2-Block referenziert genau einen expliziten v1-Blockindex oder einen
  zusammenhaengenden Indexbereich. Fuer `original`, `structured` und
  `ambiguous` bildet die geordnete Referenzmenge die komplette v1-Blockliste
  lueckenlos, nicht ueberlappend und in Originalreihenfolge ab. Fragmenthash
  ist SHA-256 ueber kanonisches JSON genau der referenzierten v1-Bloecke.
  Luecke, Duplikat, Ueberlappung, Umordnung oder Hashabweichung verwirft das
  Sidecar atomar und zeigt v1.
- **C-07 Stabile IDs:** Artikel-, Abschnitts-, Block- und Media-IDs besitzen
  getrennte Namensraeume, werden vom lokalen Publisher/Fixture vergeben und
  nie aus Text, Sprache, Ueberschrift oder Position heuristisch erzeugt.
- **C-08 Ehrliche Mehrdeutigkeit:** `ambiguous` zeigt den vollstaendigen
  Originaltext plus sichtbare Kennzeichnung. `rejected` und jede
  Inkonsistenz zeigen ausschliesslich v1.
- **C-09 Vorgaengerrelation:** Historische-Vorgaenger-Markierungen sind nur
  Einfuegemarker vor expliziten Block-IDs. Sie entfernen, ersetzen oder
  gruppieren keine Bloecke. Eine ungueltige Relation ergibt Original ohne
  Separator.

## C-10 bis C-13 – Medien, Rechte, Sperre und numerische Caps

- **C-10 Admission:** Nur Rechte-/Auslieferungswert
  `self-authored-local-fixture` plus lokal eingebettet/gepackt ist erlaubt.
  Unbekannt, denied, missing oder remote ergibt Placeholder und null Abruf.
- **C-11 Elementvertrag:** Freigabe verlangt `mediaId`, Artikel-/Abschnitt-/
  Blockanker, Provenienz, Rechte/Lizenz, Attribution, Delivery, MIME, Bytes,
  Dimensionen, Inhalts-Hash, Revision und Alttextprovenienz.
- **C-12 Monotone Sperre:** Exakter lokaler Key
  `wrn.mobile-reader-v2-media-safety.v1`. Gespeichert werden nur
  Schemaversion, monotone Revocationrevision und sortierte opaque Media-ID-/
  Hashsperren, nie Inhalt, URL oder Nutzungsdaten. Verifizierte Sperren werden
  vereinigt und vor Renderfreigabe persistiert. Schreibfehler, unbekanntes/
  kuenftiges oder beschaedigtes Rohformat ergibt fuer v2-Medien Placeholder/
  read-only und ueberschreibt vorhandene Bytes nicht. Content-Clear, v1-
  Rollback und Reading-State-Migration loeschen den Ledger nicht. A/B/A,
  Neustart und Cachewiederherstellung reaktivieren keine bekannte Sperre.
- **C-13 Caps vor Decode/DOM:** Exportierte Konstanten binden:
  - Transport und dekodiertes Sidecar-JSON: je `512 KiB`,
  - Artikel: hoechstens `64` und exakt gleich der aktiven v1-ID-Menge,
  - je Artikel hoechstens `64` Abschnitte und `256` v1-Blockreferenzen,
  - je Artikel hoechstens `8` Medien, je Sidecar hoechstens `64`,
  - je Medium `256 KiB`, gleichzeitig dekodiert je Artikel `1 MiB`,
  - Breite und Hoehe je hoechstens `2048 px`, Flaeche `4_194_304 px`,
  - Uebersetzungsinput und -resultat je `32 KiB` UTF-8,
  - Mediensicherheitsledger `64 KiB` und `512` Eintraege,
  - alle ID-Felder hoechstens `128` ASCII-Zeichen.

Jede Grenze wird mit `limit - 1`, `limit` und `limit + 1` geprueft, soweit die
Einheit diskret zulaesst. Grenzverletzung ist fail-closed; alle Objekt-URLs
werden bei Snapshotwechsel, Sperre und Unmount widerrufen. Andere Werte
benoetigen eine neue Chief-Disposition.

## C-14 bis C-17 – Lokale Uebersetzung, Navigation und Daten

- **C-14 Adapter:** Produktionsdefault `disabled`; nur explizit injizierter,
  deterministischer lokaler Fixtureadapter. Keine Runtime-Providerauswahl,
  neue Dependency, `fetch`, XHR, Beacon, WebSocket, Worker oder URL-Senke.
- **C-15 Aktion und Stale-Schutz:** bewusste Aktion je Abschnitt, gleiche
  Sprache als No-op, Original immer sichtbar. `AbortSignal` und Stale-discard
  bei Snapshot-, Artikel-, Abschnitt-, Fragmenthash-, Zielsprach- oder
  Adapterwechsel.
- **C-16 Keine Nebeneffekte:** Bild-/Uebersetzungsaktionen erzeugen keine
  Historyeintraege und schreiben weder Reading State noch Content-Offline-
  Zustand, Cookie, Storage, Telemetrie oder Inhaltslog. Schliessen, Back,
  Runtimeverlust und Sprachwechsel brechen asynchrone Arbeit ab.
- **C-17 Bestandserhalt:** normaler und Archivreader behalten Back, Fokus,
  Save/Read/Progress, Share, Offline und sichere External-source-Grenzen.

## C-18 bis C-20 – Nachweis und Sequenz

- **C-18 P2-Testpflicht:** valide/fehlende/falsche Pins, null-Request-
  Fallback, Whole-document-Hash, Version, Caps und Snapshot; Exact-cover,
  Gap/Duplikat/Ueberlappung/Umordnung, stabile IDs A/B, `ambiguous`/`rejected`;
  Medienrechte, Hash, MIME, Bytes, Dimensionen, Alttext; Sperre A/B/A,
  Neustart, Write-fail und Future-Raw; Uebersetzung No-op, Error, Offline,
  Abort und Stale ohne Storage, History, Log oder Netz.
- **C-19 Boundarybeleg:** Produkt-/Testdiff gegen `fd3b0f9`; SHA-/Diffbeleg
  fuer Website, Shared v1, `apps/mobile/src/local-content-release.ts` und
  Reading State; relevante Contract-/Mobileunits, Typechecks, Boundaries und
  Releaseboundary. Keine Browser-/Visualarbeit in P2.
- **C-20 Sequenz:** erst P1-R GREEN, dann genau ein P2-Writer; erst gesichertes
  P2-GREEN und Rechteende, dann P3. Keine parallelen Produktwriter oder Kinder.

## Exakte P2-Allowlist

Genau ein `backend_data_reliability_engineer` mit Terra/high darf nach P1-R-
GREEN nur folgende Pfade schreiben:

- `packages/content-contracts/package.json` – nur additiver Export
  `./mobile-reader-v2`, keine Dependency,
- `packages/content-contracts/src/mobile-reader-v2.ts` – neu,
- `packages/content-contracts/tests/mobile-reader-v2.test.ts` – neu,
- `apps/mobile/src/mobile-reader-v2.ts` – neu,
- `apps/mobile/src/mobile-reader-v2.test.ts` – neu,
- `apps/mobile/src/mobile-reader-v2-media-safety.ts` – optional neu,
- `apps/mobile/src/mobile-reader-v2-media-safety.test.ts` – nur passend zum
  optionalen vorherigen Pfad,
- `apps/mobile/public/wrn-mobile-reader-v2/v1/mobile-reader-v2.json` – neu,
  ausschliesslich selbst erstelltes lokales Fixture,
- `packages/test-support/src/g3-019-reader-v2-fixtures.ts` – optional neu,
- `packages/test-support/src/index.ts` – optional nur Export des Testhelpers,
- `packages/test-support/tests/g3-019-reader-v2-fixtures.test.ts` – optional
  neu,
- eigene neue P2-Berichte/Handoffs unter `docs/evidence/WRN-G3-019/` und
  `docs/handoffs/`.

P2 darf keinen Runtimeimport aus `@wrn/test-support` einfuehren. Shared Root-
Contentvertrag, Domain, `App.tsx`, UI-Copy/CSS, Reading State, Content-
Offlinecontroller/-store, `apps/mobile/src/local-content-release.ts`, der
bestehende Public-v1-Releasepfad, Website, E2E/Browser/Visualtests, Root-/
Lockdateien, Provider, Worker, Hosting und Release sind OUT.

## Eingefrorene Boundary-Hashes am P1-Stand

- `packages/content-contracts/src/index.ts`:
  `6dc6288929c199932c346de185b4b871b1e5e06da5a0b9051f8162ee56e4a263`
- `apps/mobile/src/local-content-release.ts`:
  `cb2fa06fd6c94f8b078030ab5eecd81031b178647d653d99fd56ef6ca94a9df4`
- `apps/website/src/local-content-release.ts`:
  `4a0c8e651d9549ace0ba75cdfdef30b02ff5b96657cde96e0c3a51a1e73c6a01`
- `apps/mobile/src/local-reading-state.ts`:
  `23202ae7e9d3ce7b13b179184dfaf4b963407be81d3b47251ce5cc3b29d237ab`

Die Gross-/Kleinschreibung des Hexstrings ist bei Vergleich zu normalisieren;
der Byteinhalt darf sich in P2 nicht aendern.

## Stopbedingungen

Stop beim Chief statt Selbstkorrektur bei unzureichender Allowlist,
notwendiger Shared-v1-/Website-/Reading-State-Aenderung, neuen Dependencies,
echten Medien/Quellen, Remotezugriff, unklarer Rechte-/Revocationsemantik,
Testflakiness oder nicht reproduzierbarer Hash-/Fallbackabweichung.

END-CHECK: :)
