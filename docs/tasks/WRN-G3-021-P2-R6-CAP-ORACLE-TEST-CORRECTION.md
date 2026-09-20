# WRN-G3-021 P2-R6 – test-only Cap-Orakelkorrektur

## Feste Basis und Zweck

Der P2-R5-Produktkandidat
`9de38687adad1bcf24a0dd65fc01b446a4f38bb1` ist auf Chief- und
unabhängiger Terra-QA-Ebene funktional GREEN. Der defensive Sol-Integrity-/
Privacy-Recheck auf Reviewbasis
`c10a7d0a91d0856783e7072eee370a047a2eff56` bestätigt null Produkt-, null
Privacy- und null deferred Findings, bleibt aber RED mit genau
`P2-R5-DIP-M-001`: Drei verpflichtende Caporakel sind nicht vollständig an
die im R5-R2-Vertrag gebundenen Präimages und Senken gekoppelt.

Dieser Vertrag schließt ausschließlich diese Assurance-Lücke. Produktcode,
Store, Contractmodul/-tests, Fixtures, Assets, Releasepin, Packages,
Dependencies, App-/Website-UI und Player bleiben byteidentisch. Vor einem
frischen unabhängigen Sol/high-Precheck mit null Findings besteht kein Test-
oder Browserwrite. P3 und alle OUT-/externen Bereiche bleiben gesperrt.

## R6-01 – Release-`524289` endet nachweislich vor Digest

Der vorhandene Loader-`+1`-Fall verwendet dasselbe valide Release-JSON wie
der Equal-Fall und erweitert es ausschließlich durch erlaubtes JSON-
Whitespace auf exakt `524289` UTF-8-Bytes. Er prüft wortwörtlich:

- Ergebnis `{ kind: 'invalid' }`;
- exakt einen Release-Request und keinen Dokumentrequest;
- `crypto.subtle.digest` wurde exakt `0`-mal aufgerufen;
- Equal `524288` bleibt bei exakt einem Digest und einem Request.

Der Spy wird auch bei fehlgeschlagener Assertion zuverlässig restauriert.
Kein neuer Pin, kein gemockter Erfolgs-Hash und keine Fixtureänderung sind
zulässig.

## R6-02 – fünf Target-max-Fälle mit literal gebundenen Minimalpeers

Der Browser-/IndexedDB-Test konstruiert sechs semantisch minimale,
vollständig vom unveränderten Contract akzeptierte Dokumente als explizite
lokale Objektliterale. Das bloße Leeren der Arrays der Produktionsfixture
genügt nicht. Vor Padding müssen die UTF-8-Bytes exakt lauten:

| Dokumentklasse | minimale Bytes |
| --- | ---: |
| Manifest | 245 |
| Admission | 240 |
| Rights | 217 |
| Consent | 220 |
| Lifecycle | 1949 |
| Revocation | 277 |

Der Test validiert zunächst jedes Minimaldokument und den gemeinsamen
ungepaddeten Candidate über die echten Produktvalidatoren. Für Manifest,
Admission, Rights, Consent und Lifecycle werden danach je ein vollständig
neu gebundener Candidate, Save, Activate und exakter Readback ausgeführt.
Die Assertion bindet für jeden Fall den Zielnamen, die Summe seiner fünf
Peerbytes, den Zielwert, `total = 524288`, Save-/Activategeneration,
Readback und isolierte Redundanzinvariante literal:

| Ziel | Peerbytes | Zielbytes |
| --- | ---: | ---: |
| Manifest | 2903 | 521385 |
| Admission | 2908 | 521380 |
| Rights | 2931 | 521357 |
| Consent | 2928 | 521360 |
| Lifecycle | 1199 | 523089 |

Kein `objectContaining()` oder nur dynamisch gegen sich selbst berechnetes
Orakel darf die literal gebundenen Bytewerte ersetzen. Descriptorbytes und
-hashes, Release-Transporthash und voller erlaubter Rootpin werden weiterhin
aus jedem Präimage neu gebunden. Der vorhandene `totalJson + 1`-Produktsink
und sein Nullwrite-/LKG-Orakel bleiben erhalten.

## R6-03 – Revocation-Safetydominanz literal und orthogonal

Der Revocation-Browserfall verwendet dieselben fünf semantisch minimalen
Nicht-Revocation-Dokumente wie R6-02 und prüft zusätzlich wortwörtlich:

- Nicht-Revocation-Peersumme `2871`;
- verbleibender Revocationanteil `524288 - 2871 = 521417`;
- `521417 > 65536` ist wahr;
- Revocation Equal `65536`, vollständig gebunden, Save/Activate und exakter
  Safetyreadback;
- Revocation `65537`, vollständig auf höhere Revision gebunden, erreicht
  `nextSafety()`, liefert `protected` und lässt Active, Previous, Candidate,
  Control und Safety vollständig byte-/strukturidentisch;
- die isolierte Dokumentvalidatorgrenze `524288` Equal / `524289` Ablehnung
  bleibt getrennt vom erfolgreichen Storefall.

Ein erfolgreicher Revocationfall über `65536`, ein gemockter Safetyguard oder
eine abweichende Peerbasis ist verboten.

## Exakte Vier-Pfad-Allowlist

1. `apps/mobile/src/mobile-media-release.test.ts`
2. `tests/e2e/g3-021-media-catalog-store.spec.ts`
3. `docs/evidence/WRN-G3-021/P2-R6-CAP-ORACLE-TEST-CORRECTION.md`
4. `docs/handoffs/WRN-G3-021-p2-r6-cap-oracle-test-correction.md`

Keine weitere Datei darf der Writer verändern. Insbesondere bleiben
`apps/mobile/src/mobile-media-release.ts` und
`apps/mobile/src/mobile-media-catalog-store.ts` read-only. Die bekannten
unversionierten Codex-Verzeichnisse bleiben OUT und unangetastet.

## Pflichtmatrix und Folgegates

Nach einem gesicherten Sol-Precheck-GREEN darf genau ein frischer
`backend_data_reliability_engineer` Terra/high ohne Kinder die vier Pfade
sequenziell umsetzen. Vor einem Ergebniscommit sind unter exakt Node 24.19
Pflicht:

- beide direkten Typechecks;
- vollständige Contract-/Loader-/Store-Vitestmatrix, mindestens 92 plus neue
  oder verschärfte Fälle;
- vollständige echte Chrome-/IndexedDB-Spec, mindestens 26 Fälle;
- scoped Prettier und ESLint `--max-warnings=0`;
- 19 Boundarytests, Fixtureprovenienz und Releaseboundary;
- zehn unveränderte Schutz-Hashes, `git diff --check` und exakte
  Vier-Pfad-Allowlist.

Nach Writer- und Chief-GREEN folgen eine frische unabhängige Terra-QA und ein
frischer defensiver Sol-Integrity-/Privacy-Recheck. Erst beide GREEN erlauben
den finalen frischen Sol-P2-Architekturabschluss. Kein Gate öffnet P3, UI/
Player, reale Quellen/Medien, Provider, Website/Live, Android/AAB/Play,
Signierung, Upload, Deployment oder Release automatisch.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R6-CAP-ORACLE-TEST-CORRECTION`
- Status: gebunden; frischer unabhängiger Sol/high-Precheck erforderlich
- Finding: `P2-R5-DIP-M-001`
- Produktfinding/Privacy/deferred: 0/0/0
- Allowlist: exakt vier Pfade, davon zwei Tests und zwei Writerbelege
- P3/OUT/extern: gesperrt
- END-CHECK: :)
