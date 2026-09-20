# WRN-G3-021 P2-R6 – test-only Writer-Gate

## Freigabe und feste Basis

Der frische unabhängige Sol/high-R6-Architekturprecheck ist im Commit
`cdaad4c` mit null Blocker-, High-, Medium-, Low-, Coverage-, Privacy- oder
deferred Findings gebunden. Der unveränderte Produktkandidat ist
`9de38687adad1bcf24a0dd65fc01b446a4f38bb1`.

Nach dem separaten Commit dieses Gates darf genau ein frischer
`backend_data_reliability_engineer` Terra/high ohne Kinder den R6-Vertrag
umsetzen. Es gibt keinen Parallelwriter. Der Writer verändert keinen
Git-Index und erstellt keinen Commit; er übergibt nur vollständig GREENen,
ungestagten WIP an den Chief.

## Exakte Vier-Pfad-Allowlist

1. `apps/mobile/src/mobile-media-release.test.ts`
2. `tests/e2e/g3-021-media-catalog-store.spec.ts`
3. `docs/evidence/WRN-G3-021/P2-R6-CAP-ORACLE-TEST-CORRECTION.md`
4. `docs/handoffs/WRN-G3-021-p2-r6-cap-oracle-test-correction.md`

Alle Produktquellen, Store, Contractmodul/-tests, Fixtures, Assets,
Releasepin, Packages, Lockfiles, Dependencies, App-/Website-UI und Player
bleiben read-only. Die bekannten unversionierten Codex-Verzeichnisse bleiben
OUT und unangetastet.

## Verbindliche Umsetzung

Der Writer liest R5, R5-R1, R5-R2, R5-DIP, R6 und den R6-Precheck vollständig
und setzt ausschließlich um:

1. Release `524289` aus validem JSON plus Whitespace mit exakt einem Request,
   null Digestaufrufen und zuverlässigem Spy-Restore; Equal `524288` bleibt
   bei einem Request/einem Digest;
2. sechs explizite, semantisch minimale und echt validierte Objektliterale
   mit literal geprüften Bytes `245/240/217/220/1949/277`;
3. die fünf literal geprüften Peer-/Zielpaare
   `2903/521385`, `2908/521380`, `2931/521357`, `2928/521360` und
   `1199/523089`, jeweils mit `totalJson = 524288`, vollständiger Neubindung,
   Save, Activate und exaktem Readback;
4. Revocation-Safetydominanz `2871`, `521417` und `521417 > 65536`, zusätzlich
   zu den bestehenden echten `65536`-/`65537`-Produktpfaden und Nullwrite-
   Orakeln;
5. unveränderte `totalJson + 1`-, Revision-2/Outer-1-, Streamtyping-,
   Rollback-, Privacy- und Schutzgrenzen;
6. ehrliche Writer-Evidence mit exakten Testnamen, Präimages, Senken, SHAs
   und Ergebnissen.

Keine Testabschwächung, kein `objectContaining()` für die gebundenen
Byteorakel, kein selbstreferenzielles Nur-Laufzeitorakel, kein gemockter
Digest-/Pin-/Safety-Erfolg und keine Fixtureableitung für die Minimalobjekte.

## Pflichtmatrix und Übergabe

Unter exakt Node 24.19 sind vor Übergabe Pflicht:

- beide direkten Typechecks;
- vollständige fokussierte Contract-/Loader-/Store-Vitestmatrix;
- vollständige echte Chrome-/IndexedDB-Spec mit
  `--project=mobile-390x844 --workers=1`;
- scoped Prettier und ESLint `--max-warnings=0`;
- 19 Boundarytests, Fixtureprovenienz und Releaseboundary;
- zehn Schutz-Hashes, `git diff --check` und exakte Vier-Pfad-Allowlist.

Bei Finding, Zusatzpfad, Produkt-/Fixture-/Pin-/Dependencybedarf oder nicht
reproduzierbarem Browserfall stoppt der Writer fail-closed. Der Chief prüft
und committet nur bei vollständig GREENer Matrix. Danach folgen frische
unabhängige Terra-QA und ein frischer defensiver Sol-Integrity-/Privacy-
Recheck; erst beide GREEN erlauben einen finalen frischen Sol-P2-
Architekturabschluss.

P3, UI/Player, reale Quellen/Medien, Provider, Website/Live, Android/AAB/Play,
Signierung, Upload, Deployment und Release bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R6-WRITER-GATE`
- Status: gebunden; Writer darf erst nach separatem Gatecommit starten
- Basis: `cdaad4c`
- Allowlist: exakt vier Pfade
- Produktcode: read-only
- P3/OUT/extern: gesperrt
- END-CHECK: :)
