# WRN-G3-021 P2-R5 – Writer-Gate

## Freigabe und feste Basis

Der finale unabhängige Sol/high-R5-R2-Abschlussrecheck ist im Commit
`28fa39f487bb034016a03a36a2cc779a9d0c2545` mit null Blocker-, High-,
Medium-, Low-, Coverage-, Privacy- oder deferred Findings gebunden. Der
unveränderte Produktkandidat vor dieser Korrektur ist
`fcc0aa9206ed59edf7420cd913c4e25073ce7faf`.

Nach dem separaten Commit dieses Gates darf genau ein frischer
`backend_data_reliability_engineer` Terra/high ohne Kinder den R5/R5-R1/R5-
R2-Vertrag umsetzen. Es gibt keinen Parallelwriter. Der Writer verändert
keinen Git-Index und erstellt keinen Commit, bevor seine vollständige Matrix
GREEN ist.

## Exakte Fünf-Pfad-Allowlist

1. `apps/mobile/src/mobile-media-release.ts`
2. `apps/mobile/src/mobile-media-release.test.ts`
3. `tests/e2e/g3-021-media-catalog-store.spec.ts`
4. `docs/evidence/WRN-G3-021/P2-R5-CAP-REVISION-STREAM-CORRECTION.md`
5. `docs/handoffs/WRN-G3-021-p2-r5-cap-revision-stream-correction.md`

Store, Contractmodul/-tests, Fixtures, Assets, Package-/Lockfiles,
Dependencies, App-/Website-UI, Player und Governance bleiben read-only. Die
bekannten unversionierten Codex-Verzeichnisse bleiben unangetastet.

## Verbindliche Umsetzung

Der Writer liest R5, R5-R1, R5-R2 und den finalen Sol-Recheck vollständig und
setzt ausschließlich um:

1. typisierten Bodyreader: Fetch- und Stream-Read-Reject werden
   `network-error`; Inhalts-, Status-, MIME-, Range-, Cap-, Decode- und JSON-
   Fehler bleiben `invalid`; kein Logging;
2. Releasebelege 2838 `ready`, 524288 bis realer Digest-/Hashguard und 524289
   Bodycap vor Digest/Folgerequest, ohne neuen Pin oder Fixture;
3. fünf echte Target-max-Candidates für Manifest, Admission, Rights, Consent
   und Lifecycle mit tatsächlichen Minimalpeers, Gesamt 524288,
   Descriptor-/Release-/Rootpinbindung, Save/Activate/Readback;
4. Revocation 65536 erfolgreich und 65537 vollständig neu gebunden bis
   `nextSafety()` `protected` mit Nullwrite; isolierte Dokumentcap und
   tatsächliche Dominanzinvariante;
5. `totalJson + 1` ausschließlich an der Gesamtsenke;
6. intern vollständig gültiges Revision-2-Rawbundle mit ausschließlich
   falscher äußerer Bundle-Revision 1 und byteidentischem IDB-Record;
7. ehrliche Traceability jedes früheren Findings auf konkrete Testnamen,
   Preimages, Senken, Kategorien und Ergebnisse.

Keine Testabschwächung, kein Mockerfolg für Pin/Safety, kein Helper-only-
Ersatz für erreichbare Produktfälle und keine erfundene Fixture.

## Pflichtläufe und Commitregel

Unter exakt Node 24.19 sind vor einem Ergebniscommit Pflicht:

- beide direkten Typechecks;
- scoped Prettier und ESLint `--max-warnings=0`;
- vollständige fokussierte Contract-/Loader-/Store-Vitestmatrix;
- vollständige echte Chrome-/IndexedDB-Spec mit
  `--project=mobile-390x844 --workers=1`;
- 19 Boundarytests, Fixtureprovenienz und Releaseboundary;
- zehn Schutz-Hashes, `git diff --check` und exakte Fünf-Pfad-Allowlist.

Nur bei vollständigem GREEN darf der Writer exakt einen linearen
Ergebniscommit erstellen und alle Rechte zurückgeben. Bei Finding,
Zusatzpfad, Fixture-/Asset-/Dependencybedarf oder nicht reproduzierbarem
Browserfall stoppt er fail-closed mit uncommittetem WIP.

Nach dem Writercommit reproduziert der Chief unabhängig. Danach folgen
frische Terra-QA und ein frischer defensiver Sol-Integrity-/Privacy-Recheck
parallel nur mit eigenen Evidence/Handoffs. Erst beide GREEN erlauben den
finalen frischen Sol-Architekturabschluss. P3 und alle OUT-/externen Bereiche
bleiben bis dahin gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R5-WRITER-GATE`
- Status: gebunden; Writer darf erst nach separatem Gatecommit starten
- Basis: `28fa39f487bb034016a03a36a2cc779a9d0c2545`
- Allowlist: exakt fünf Pfade
- P3/OUT/extern: gesperrt
- END-CHECK: :)
