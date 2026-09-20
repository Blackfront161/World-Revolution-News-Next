# WRN-G3-019 – P2-R2 reine Boundary-Evidence

Status: **DOKUMENTARISCH GEBUNDEN – TESTWRITE BIS ARCHITEKTUR-GREEN GESPERRT**

## Basis und Ziel

- R1-Kandidat: `a77d7b2ca23ab2996a1c1a6295379a914945bb49`.
- R1-QA/Securitybelege: `de5d45c`.
- Offen: nur `P2-QA-M-003`, unvollstaendige Nachweisabdeckung fuer
  Transport-/Decoded-JSON- sowie Dimensions-/Pixelflaechengrenzen.
- Security-Deltacheck: GREEN, Scan-ID
  `d32e155a-b2fa-4517-b481-6d3b6da9163c`, null Findings.

P2-R2 aendert keinen Produktcode. Es ergaenzt ausschliesslich echte
Produktpfadtests und mathematische Invarianten fuer zwei absichtlich
redundante Grenzpaare. Vor jedem Testwrite prueft ein frischer unabhaengiger
Sol-Architekturreview diese Disposition.

## Warum keine kuenstliche „isolierte +1“-Probe

### Transport versus decoded JSON

Beide exportierten Grenzen sind exakt `512 KiB`. Der Loader prueft den rohen
Responsebody vor Decode/Parse. Ein Body mit `512 KiB + 1` erreicht den
Decoded-JSON-Check daher definitionsgemaess nicht. Bei fataler UTF-8-
Dekodierung wird ungueltiges UTF-8 verworfen; gueltige Bytes werden beim
Re-Encoding nicht groesser, ein optionaler BOM kann nur entfallen. Ein
separater Decoded-JSON-`+1`-Fall hinter bestandenem Transportcap ist somit
unerreichbar und waere nur durch einen kuenstlichen Mock unterhalb der echten
Produktgrenze erzeugbar.

### Dimension versus Pixelflaeche

`mobileReaderV2MaxMediaPixels` ist exakt
`mobileReaderV2MaxMediaDimension ** 2`, also `2048 * 2048 = 4_194_304`.
Wenn Breite und Hoehe jeweils hoechstens 2048 sind, kann die Flaeche den
Pixelcap nicht ueberschreiten. Ein isolierter Pixel-`+1`-Fall bei gleichzeitig
gueltigen Dimensionen existiert mathematisch nicht.

Diese Redundanzen sind Defense-in-depth und bleiben im Produktcode erhalten.
Tests duerfen ihre Reihenfolge oder Wirksamkeit nicht durch private Mocks
umgehen.

## Verbindliche R2-Teststrategie

### R2-T-01 echter Loader-Grenzpfad

Ein Builder erzeugt aus der gueltigen lokalen Sidecarfixture bytegenaue,
hashgebundene JSON-Responses mit ausschliesslich erlaubtem nachgestelltem
JSON-Whitespace bei:

- `512 KiB - 1`: `ready`,
- `512 KiB`: `ready`,
- `512 KiB + 1`: `fallback/invalid-sidecar` vor Decode/Parse.

Jeder Fall verwendet den echten `loadMobileReaderV2`, echten Streamreader,
passenden externen Whole-document-Pin, echte v1-Entries und genau einen
Request. Zusaetzlich prueft der Test die Invariante
`mobileReaderV2MaxTransportBytes === mobileReaderV2MaxDecodedJsonBytes` und
belegt bei den zwei akzeptierten Faellen, dass fataler Decode/Parse und der
vollstaendige Validator wirklich erreicht werden. Kein Stub von
`readCappedBytes`, `TextDecoder`, `JSON.parse` oder Validator.

### R2-T-02 Dimension und Pixelflaeche

Contracttests gegen `validateMobileReaderV2Document` pruefen getrennt:

- Breite `2047`, `2048`, `2049` bei kleiner gueltiger Hoehe,
- Hoehe `2047`, `2048`, `2049` bei kleiner gueltiger Breite,
- Flaecheninvariante
  `mobileReaderV2MaxMediaPixels === mobileReaderV2MaxMediaDimension ** 2`,
- exakte maximale Flaeche `2048 x 2048` als gueltiger Equal-Fall.

Die beiden `2049`-Faelle werden korrekt als Dimensionsoverflow benannt; es
wird kein nicht existierender isolierter Pixel-`+1`-Fall behauptet.

### R2-T-03 bestehende Matrix und Bericht

Alle 27 Contract- und 17 Mobile-R1-Tests bleiben bestehen. Neue Tests duerfen
nicht durch grosse Snapshotdateien im Repository, Sleeps, Netzwerk oder neue
Dependencies erkauft werden. Der R2-Bericht listet fuer jede C-13-Grenze den
konkreten Testnamen oder die explizite Redundanzinvariante.

## Exakte spaetere Schreiballowlist

Erst nach Architektur-GREEN darf genau ein `qa_release_engineer` Terra/high
test-only schreiben:

- `apps/mobile/src/mobile-reader-v2.test.ts`,
- `packages/content-contracts/tests/mobile-reader-v2.test.ts`,
- neue `docs/evidence/WRN-G3-019/P2-R2-BOUNDARY-EVIDENCE.md`,
- neuer `docs/handoffs/WRN-G3-019-p2-r2-boundary-evidence.md`.

Alle Produktionsquellen, Fixtures, Package-/Lockdateien, Governance, Website,
Reader v1, UI, Provider und externe Bereiche bleiben read-only. Reicht der
Testscope nicht, stoppt der Writer beim Chief.

## Gates

1. frischer Sol-Architekturreview der Aequivalenz-/Redundanzdisposition,
2. nur bei GREEN genau ein Terra/high-Testwriter,
3. gesicherter Kandidat,
4. frische unabhaengige QA,
5. gezielter Security-Deltacheck,
6. erst bei beiden GREEN Chief-P2-Abschluss und P3-Paket.

P3 bleibt bis Schritt 6 gesperrt.

END-CHECK: :)
