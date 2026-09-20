# WRN-G3-019 – P2-R1 enge Korrektur

Status: **FREIGEGEBEN FUER GENAU EINEN FRISCHEN TERRA/HIGH-WRITER**

## Basis und Zweck

- Produktkandidat: `d47ef470c0cce4fcf97e1f5deec0fee57a0f9d8a`.
- QA-/Securitybelege: `2cbd55a`.
- QA: YELLOW mit `P2-QA-M-001` bis `M-003` und `P2-QA-L-001`.
- Security: GREEN, Scan-ID `7269a526-96f6-4a7f-8ffd-e6dbd2c78e08`,
  null reportable/deferred; alle drei QA-Mediums bleiben P3-Blocker.

P2-R1 schliesst ausschliesslich diese vier Findings. Es integriert keine UI,
keine echten Medien und keinen Provider. P3 bleibt bis zu frischer QA und
gezieltem Security-Deltacheck gesperrt.

## R1-01 – Pinrevision

Nach Raw-Hash, Decode/Parse und vollstaendiger Dokumentvalidierung, aber vor
`ready`, muss `sidecar.document.revision === pin.revision` gelten. Abweichung
ergibt atomar `fallback/invalid-sidecar`. Ein Test verwendet ein sonst
gueltiges Dokument mit bewusst abweichender Pinrevision und belegt genau einen
Request, aber keine Aktivierung.

## R1-02 – Medienrechte und URL-freie lokale Paketbindung

- `rights` akzeptiert nur einen exportierten exakten Wert
  `self-authored-local-fixture`; `denied`, `missing`, `remote`, unbekannte
  Werte und unbekannte Schluessel werden validatorseitig abgelehnt.
- `delivery` bleibt exakt `self-authored-local-fixture`.
- Jedes Medium benoetigt eine opaque, hoechstens 128 ASCII-Zeichen lange
  `localAssetId`. Sie ist nur eine URL-freie Paket-ID und darf weder Pfad noch
  URL, Query, Origin oder Storagewert darstellen.
- P3 darf spaeter nur eine codeeigene, statische Zuordnung von `localAssetId`
  zu bereits gebuendelten lokalen Assets verwenden. In P2-R1 werden weder
  Assetdatei noch Resolver, Decoder, DOM oder Objekt-URL eingefuehrt.
- Positive und negative Contracttests pruefen exakten Rights-/Deliverywert,
  vorhandene `localAssetId` und Ablehnung von denied/missing/remote/unbekannt.

Die bestehende lokale Fixture enthaelt null Medien und bleibt bytegleich; ihr
Build-Pin muss sich nicht aendern.

## R1-03 – direkt erzwungene Caps und Grenzmatrix

- `mobileReaderV2MaxTranslationBytes` wird direkt fuer Input und Resultat
  verwendet; keine arithmetisch abgeleitete Ersatzkonstante.
- Pro Artikel wird die Summe der deklarierten `byteLength` aller erlaubten
  Medien vor Freigabe gegen
  `mobileReaderV2MaxDecodedMediaBytesPerArticle` geprueft. Ueberschreitung
  verwirft das Sidecar atomar. P3 muss dieselbe Grenze spaeter zusaetzlich vor
  tatsaechlichem Decode/DOM anwenden.
- Alle exportierten C-13-Grenzen werden unmittelbar an der jeweiligen
  Validierungs-/Loader-/Ledger-/Translationsgrenze verwendet.
- Fokussierte Tests belegen fuer jede diskret anwendbare Grenze
  `limit - 1`, `limit`, `limit + 1`: Transportbytes, dekodiertes JSON,
  Artikelanzahl, Abschnitte je Artikel, Blockreferenzen je Artikel, Medien je
  Artikel, Medien je Sidecar, Medienbytes, Aggregat je Artikel, Breite/Hoehe,
  Pixelflaeche, Uebersetzungsinput/-resultat, Ledgerbytes/-eintraege und
  ID-Laenge. Wenn eine Gesamtstruktur zusaetzliche Exact-cover-/Schemawerte
  benoetigt, darf der Test eine rein lokale Builderfixture verwenden; er darf
  die Produktionsregel nicht umgehen.
- Tests unterscheiden Contractablehnung, Loaderfallback und Ledger-
  `protected`/`null`/`false` eindeutig. Keine realen Remoteziele.

## R1-04 – Format

Nur die zwei nachgestellten Leerzeichen in
`docs/evidence/WRN-G3-019/P2-BACKEND-IMPLEMENTATION.md` werden entfernt.
`git diff --check 2e76dcd..R1-Kandidat` muss PASS ergeben.

## Exakte Schreiballowlist

Genau ein frischer `backend_data_reliability_engineer` Terra/high darf nur
folgende Pfade schreiben:

- `packages/content-contracts/src/mobile-reader-v2.ts`,
- `packages/content-contracts/tests/mobile-reader-v2.test.ts`,
- `apps/mobile/src/mobile-reader-v2.ts`,
- `apps/mobile/src/mobile-reader-v2.test.ts`,
- `apps/mobile/src/mobile-reader-v2-media-safety.test.ts`,
- `docs/evidence/WRN-G3-019/P2-BACKEND-IMPLEMENTATION.md` nur R1-04,
- neue `docs/evidence/WRN-G3-019/P2-R1-CORRECTION.md`,
- neuer `docs/handoffs/WRN-G3-019-p2-r1-correction.md`.

`apps/mobile/src/mobile-reader-v2-media-safety.ts`, Packageexport und lokale
JSON-Fixture bleiben read-only, sofern die vorhandene API die gebundene
Ledger-Grenzmatrix erlaubt. Reicht die Allowlist nicht, stoppt der Writer beim
Chief statt sie selbst zu erweitern.

## Pruefung und Stopbedingungen

Pflicht: beide Typechecks; vollstaendige fokussierte Contract-/Mobileunits im
korrekten Paket-CWD; `git diff --check`; vier eingefrorene Boundaryhashes;
Fixturehash; exakte Allowlist. Root-CWD ohne Mobile-jsdom ist kein gueltiger
Mobile-Harness.

Stop bei erforderlicher Shared-v1-, Website-, App.tsx-, Reading-State-,
Offline-, Package-/Dependency-, Fixture-, Provider- oder externer Aenderung.
Keine Kinder, kein Browser/Visual, kein Netz und kein Commit durch den Writer.

END-CHECK: :)
