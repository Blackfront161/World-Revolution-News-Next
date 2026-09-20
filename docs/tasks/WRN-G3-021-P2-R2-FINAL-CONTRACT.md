# WRN-G3-021 P2-R2 – finale Typ-, Runtime- und Ablaufbindung

Status: **REIN DOKUMENTARISCH – P2 BIS FRISCHEM P1-R2-GREEN GESPERRT**

Dieser Nachtrag schliesst nur `P1-R1-M-001` bis `P1-R1-M-004` aus dem
Review `6355e3b`. Er hat bei Widerspruch Vorrang vor P2 und P2-R1.

## R2-01 – korrigierte Commitbindung

Der tatsaechliche volle R1-Vertragscommit ist
`679450eb5f6495656b99bbcdfae4766586ac3845`; der zuvor im Register genannte
nicht existierende SHA ist verworfen. P1-R1 lief auf
`edf5bb9818d70f7e1f11b307a7bfbde63430b774`, sein Belegcommit ist
`6355e3b`. Nach Sicherung dieses R2 bindet der Chief dessen tatsaechlichen
vollen SHA in einem separaten Commit. Nur dieser folgende feste HEAD darf
P1-R2-Reviewbasis sein; ein Writer startet weiterhin nicht.

## R2-02 – primitive JSON-Typen und Textklassen

- `PositiveRevision`: JSON number, `Number.isSafeInteger`, 1 bis
  `9007199254740991`.
- `NonNegativeCount`: JSON number, Safe-Integer, 0 bis jeweiliger Cap.
- `ByteCount`: JSON number, Safe-Integer, 1 bis jeweiliger Cap.
- `Boolean`: ausschliesslich JSON `true|false`, nie 0/1/String.
- `Sha256`: JSON string, Regex `^[a-f0-9]{64}$`.
- alle IDs: JSON string, Regex aus P2 C-02, 1 bis 128 ASCII-Bytes.
- `OwnerId`: JSON string, `^[a-z0-9]+(?:-[a-z0-9]+)*$`, 1 bis 128 Bytes.
- `UtcInstant`: JSON string nach R1-01.
- `Language`: exakt `en|de|es|fr|it|pt|ru|el|tr`.
- `PlainText512`/`PlainText2048`: JSON string, gueltiges UTF-8, NFC, 1 bis
  512/2048 UTF-8-Bytes; keine unpaired Surrogates, HTML/Markdown und keine
  Codepoints U+0000..U+001F oder U+007F..U+009F.
- `LocalizedText512`/`LocalizedText2048`: Exact-key-Objekt in fester
  Einfuegereihenfolge `en,de,es,fr,it,pt,ru,el,tr`; jeder Wert entsprechende
  PlainTextklasse. Der Validator akzeptiert keine fehlenden/extr Keys und
  serialisiert/normalisiert nicht.
- `Nullable<T>` ist ausschliesslich `T|null`. Nur die unten explizit als
  nullable genannten Felder duerfen `null` sein; `undefined` existiert in JSON
  nicht.

## R2-03 – voll typisierte Shapes

### Release und Descriptor

Releasefelder aus R1-02 haben Typen:

- `schema`/`contractVersion`: gebundene Stringliterale;
- `releaseId`: Release-ID; `revision`/`revocationFloor`: PositiveRevision;
- `generatedAt`/`validUntil`: UtcInstant; `owner`: OwnerId;
- `documents`: JSON array, exakt sechs Descriptoren in fester Reihenfolge
  `manifest,admission,rights,consent,lifecycle,revocation`.

Descriptorfelder:

- `documentClass`: exakt einer der sechs Werte oben;
- `path`: der zugehoerige Runtimepfad aus R2-05;
- `schema`: exakt das der Klasse zugehoerige Schema aus R1;
- `contractVersion="1.0.0"`; `revision`: PositiveRevision und gleich Release;
- `bytes`: ByteCount, max. 524288; `sha256`: Sha256;
- `recordCount`: NonNegativeCount nach der jeweiligen R1-Definition;
- `compatibility`: Exact-key-Objekt
  `{minReaderContract:"1.0.0",maxReaderContract:"1.0.0"}`.

Duplikat-/Sortierschluessel: `documentClass` gemaess fester Reihenfolge;
jede Klasse exakt einmal.

### Manifest

- Roots: Literale/IDs/Revision/Zeit/Owner wie oben.
- `series`: Array, sortiert/dupliziert nach `id`. Record:
  `id:SeriesId`, `sourceId:SourceId`, `title:LocalizedText512`,
  `episodeIds:EpisodeId[]`, streng ASCII-sortiert und nicht leer.
- `episodes`: Array, sortiert/dupliziert nach `id`. Record:
  `id:EpisodeId`, `seriesId:SeriesId`, `sourceId:SourceId`,
  `title:LocalizedText512`, `summary:LocalizedText2048`,
  `audioAssetId:AssetId`,
  `thumbnailAssetId:Nullable<AssetId>`,
  `transcriptAssetId:Nullable<AssetId>`,
  `durationMs:PositiveRevision` zusaetzlich begrenzt auf 1..60000.
- `assets`: Array, sortiert/dupliziert nach `id`. Record:
  `id:AssetId`, `kind:"audio"|"thumbnail"|"transcript"`,
  `path` als zu Kind passender Runtimeassetpfad R2-05,
  `mime` als zu Kind passendes Literal, `bytes:ByteCount`, `sha256:Sha256`,
  `width:Nullable<PositiveRevision>`, `height:Nullable<PositiveRevision>`.
  Nur Thumbnail hat beide Dimensionen non-null; andere exakt null.

### Admission

Der Admission-Root erhaelt gegenueber R1 exakt die Payloadkeys
`sources,identityLinks`. `sources` ist nach `id` sortiert/dupliziert. Record:

`id:SourceId`, `displayName:LocalizedText512`,
`selfDescription:LocalizedText2048`,
`editorialDescription:LocalizedText2048`, `language:Language`,
`region:PlainText512`, `healthAt:UtcInstant`, `healthStatus:"ok"`,
`deliveryClass:"admitted-local-fixture"`,
`admissionRevision:PositiveRevision`, `validFrom:UtcInstant`,
`validUntil:UtcInstant`, `owner:OwnerId`,
`correctionContact:PlainText512`.

`identityLinks` ist ein JSON-Array und darf leer sein. Record exakt
`kind:"alias"|"successor",sourceId:SourceId,targetId:SourceId`; sortiert und
dupliziert nach `kind + "\u0000" + sourceId + "\u0000" + targetId`.
Source/Target existieren, sind verschieden, jede `(kind,sourceId)`-Kombination
ist hoechstens einmal vorhanden und beide gerichteten Graphen sind zyklenfrei.
Ein Nachfolger aendert nie still Episode-/Resumeidentitaet. Admission-
`recordCount = sources.length + identityLinks.length`.

### Rights

`rights` ist nach `assetId` sortiert/dupliziert. Record:

`assetId:AssetId`, `assetHash:Sha256`, `status:"allowed"`,
`license:"WRN-self-authored-fixture"`, `attribution:PlainText512`,
`territory:"global"`, `offlineAllowed:true`, `cacheAllowed:true`,
`expiresAt:UtcInstant`, `provenance:PlainText512`,
`correctionContact:PlainText512`.

### Consent

`consents` ist nach `episodeId` sortiert/dupliziert. Record:

`episodeId:EpisodeId`, `deliveryClass:"packaged-local-audio"`,
`origin:"same-origin-local"`, `dataCategories:[]`,
`mode:"local-no-third-party"`, `requiresPrompt:false`.

### Lifecycle

Alle Statearrays und Transitionen sind die in R1 genannten Stringliteral-
Arrays exakt in dortiger Reihenfolge; keine Sortierung. Transitionrecord ist
exakt `{from:<passender State>,event:<gebundenes Eventliteral>,to:<passender
State>}`. Duplikatschluessel ist die exakte ASCII-Tupelzeichenfolge
`from + "\u0000" + event`; doppelte Tupel sind invalid.

`dominanceRules` ist exakt dieses Array in dieser Reihenfolge und Shape:

```json
[
  {"availability":"local","stopPlayback":false,"detachDecoder":false,"allowNewStart":true,"allowResumeWrite":true},
  {"availability":"online","stopPlayback":false,"detachDecoder":false,"allowNewStart":true,"allowResumeWrite":true},
  {"availability":"offline","stopPlayback":false,"detachDecoder":false,"allowNewStart":false,"allowResumeWrite":true},
  {"availability":"stale","stopPlayback":true,"detachDecoder":true,"allowNewStart":false,"allowResumeWrite":false},
  {"availability":"blocked","stopPlayback":true,"detachDecoder":true,"allowNewStart":false,"allowResumeWrite":false}
]
```

Duplikatschluessel ist `availability`; alle fuenf genau einmal.

### Revocation

- `safetyRevision`/`revocationFloor`: PositiveRevision;
  Revocation-`revocationFloor` muss exakt Release-`revocationFloor` sein,
  sonst Candidateabbruch vor dem ersten Write.
- `references`: sortiert/dupliziert nach ASCII-Tupel
  `kind + "\u0000" + id`. Record exakt
  `kind:"source"|"series"|"episode"|"asset", id:<passende ID>`.
- `entries`: sortiert/dupliziert nach ASCII-Tupel
  `targetKind + "\u0000" + targetId + "\u0000" + (targetHash ?? "")`.
  Record exakt: `targetKind` gleicher Kind-Enum,
  `targetId` passende ID, `targetHash:Nullable<Sha256>` (nur Asset non-null),
  `status:"blocked"|"gone"|"replaced"`,
  `replacementKind:Nullable<Kind>`, `replacementId:Nullable<passender ID>`.
  Nur `replaced` verlangt beide Replacementwerte; andere exakt null.

## R2-04 – lokale Expiry-/Stopdominanz

Availabilitytransitionen werden um exakt
`local/freshness-expired/stale` ergaenzt. Alle Transitionen bleiben in der
im Vertrag genannten Reihenfolge; dieser Uebergang steht direkt nach den
beiden bisherigen `freshness-expired`-Uebergaengen.

P3 muss mit injizierter Clock bei Load/Render, vor jedem Start, vor jedem
Resume-Write und durch genau einen abbrechbaren Timer auf das frueheste
`validUntil`/Rights-`expiresAt` pruefen. Bei `now >= expiry` wird zuerst der
Run invalidiert und Abort ausgeloest, dann Source/Decoder entkoppelt,
Playback auf `idle` und Availability auf `stale` gesetzt; Resume wird nicht
geschrieben. Resolve und Catch eines alten Runs bleiben wirkungslos. Timer
wird bei Medienwechsel, Clear und Unmount abgebrochen. P2 implementiert dies
nicht, validiert aber den fuer P3 unveraenderlichen Lifecyclevertrag.

`stale` und `blocked` haben dieselbe Stop-/Detach-/No-resume-Dominanz; blocked
bleibt gegenueber stale vorrangig und monoton. Release- und Revocation-
`revocationFloor` sind exakt gleich; Abweichung verwirft den Candidate vor
jeder Safety- oder Slotmutation.

## R2-05 – Repositorypfade und Runtimepfade getrennt

Die 21-Pfad-Writer-Allowlist aus R1-05 sind ausschliesslich Repositorypfade.
Sie werden nie an `fetch` uebergeben.

Die sieben einzig erlaubten JSON-Runtimepfade sind literal:

1. `/wrn-mobile-media/v1/mobile-media-release.json`,
2. `/wrn-mobile-media/v1/media-manifest.json`,
3. `/wrn-mobile-media/v1/media-admission.json`,
4. `/wrn-mobile-media/v1/media-rights.json`,
5. `/wrn-mobile-media/v1/media-consent.json`,
6. `/wrn-mobile-media/v1/media-lifecycle.json`,
7. `/wrn-mobile-media/v1/media-revocation.json`.

Descriptorzuordnung ist exakt Position 2 bis 7 in der festen Klassenfolge.
Die drei einzig erlaubten Asset-Runtimepfade sind:

- `/wrn-mobile-media/v1/episode-local.wav`,
- `/wrn-mobile-media/v1/episode-local.png`,
- `/wrn-mobile-media/v1/episode-local.txt`.

Alle R1-06-MIME-, Query-, Fragment-, Credential-, Backslash-, Prozent-,
Dotsegment-, Origin-, Redirect-, Range- und Normalisierungsverbote gelten
fuer diese Runtimewerte. Kein Repo-Praefix ist zur Laufzeit erlaubt.

## R2-06 – vollstaendig deterministische WAV-Praeimage

Node exakt `24.19.0`; dieses Programm definiert die gesamten 1644 Bytes. Der
Writer darf nur den finalen Zielpfad als erstes Argument einsetzen und muss
vorher Nichtvorhandensein pruefen:

```js
const fs = require("node:fs");
const out = process.argv[2];
const wav = Buffer.alloc(1644, 0);
wav.write("RIFF", 0, "ascii");
wav.writeUInt32LE(1636, 4);
wav.write("WAVEfmt ", 8, "ascii");
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(8000, 24);
wav.writeUInt32LE(16000, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36, "ascii");
wav.writeUInt32LE(1600, 40);
if (fs.existsSync(out)) throw new Error("target-exists");
fs.writeFileSync(out, wav, { flag: "wx" });
```

Erwartung unveraendert: 1644 Bytes, SHA-256
`c726d333dd159a31423f3480dbb1c5c4a9dfcd30efe1f7e12ade390dc92e8908`.
PNG-/TXT-Praeimages und Sollhashes aus R1 bleiben unveraendert.

## R2-07 – Pflichtrecheck

Ein frischer unabhaengiger Sol-P1-R2 muss alle vier R1-Findings gegen einen
festen existierenden Commit schliessen, Typ-/Sortier-/Exact-key-Negativorakel
und die Runtime-/Expiryregeln pruefen sowie alle elf Schutz-Prehashes
(Package plus zehn Boundaries) reproduzieren. Vor null offenen Findings und
separatem Chief-Gatecommit gibt es keinen Produkt-, Test-, Fixture-, Asset-
oder Browserwrite.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R2-FINAL-CONTRACT`
- Status: rein dokumentarisch; P2 gesperrt
- Adressiert: `P1-R1-M-001` bis `P1-R1-M-004`
- Rechte: keine Produkt-/Test-/Fixture-/Asset-/Browserrechte
- Naechster Schritt: R2-Commitbindung, dann frischer Sol-P1-R2
- END-CHECK: :)
