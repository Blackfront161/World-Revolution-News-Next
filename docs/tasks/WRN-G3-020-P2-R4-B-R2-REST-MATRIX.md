# WRN-G3-020 P2-R4-B-R2 – finale IDB-Restmatrix

Status: **R1 KORRIGIERT; TESTWRITE BIS ZU FRISCHEM SOL-RECHECK-GREEN GESPERRT**

## Bindung und Ziel

Ausgangsdesign ist der unabhaengige Sol-Bericht
`docs/evidence/WRN-G3-020/P2-R4-B-R2-REST-MATRIX-DESIGN.md`, Commit
`6af249f`. Dessen Reference-Dominanz ist durch den unabhaengigen Precheck
`9cb8e6d` widerlegt und wird ausschliesslich durch
`docs/tasks/WRN-G3-020-P2-R4-B-R2-R1-CONTRACT-CORRECTION.md` ersetzt.
Produktstand `cb0f6bc`, R4-A `981ead6` und die zehn echten
R4-B-R1-Browserfaelle `14a83c5` bleiben eingefroren. Dieses Paket ergaenzt
nur die noch fehlende Safety-Cap-, Mehrrelease-/Rollback- und Failurematrix.
Es aendert keine Produktquelle, Fixture, Pin auf Disk, Dependency oder Config.

## Verbindliche Matrix

1. Echte Chrome-/IndexedDB-Finalmerges belegen 1023 und 1024 eindeutige,
   schemafoermige References als erfolgreiche positive Grenzen sowie 1025
   vor dem ersten Safety-`put` als `protected`. Historische Reference-
   Supersets sind gueltig; keine falsche Entry- oder Byte-Dominanzannahme.
2. Echte Chrome-/IndexedDB-Finalmerges belegen exakt:
   511 Entries bei 65535 Bytes und 512 bei 65536 erfolgreich; 513 Entries
   unter 65536 sowie 512 Entries bei 65537 vor erstem Safety-`put`
   `protected`, null Mutation und bytegleicher Restart.
3. Eine fail-closed testseitige App-Binary-Emulation bindet pro frischer Seite
   genau einmal Revision und kompilierten Pin in der lokalen Vite-Antwort.
   Diskprodukt/Pin bleiben bytegleich; null oder mehrere Treffer stoppen RED.
4. Die im Design Abschnitt 6 exakte A1/B2/A3/C4/D5/E6/F7/G8/H9-Tabelle wird
   mit Generationen 0 bis 18, Slots, Rawhash, Restart, Zwei-Tab-Eventstore-
   CAS, Candidate-/Previous-Verwerfen und keiner Resurrection belegt.
5. Hashblock V1/V2, exakter Candidatehash und Wildcardblock pruefen erlaubte
   Rotation gegen strengere Safety-persist-before-Blockade ohne Auto-Retry.
6. Die Failure-Restmatrix S-W/S-R/S-A sowie R-W/R-R/R-A/R-Q prueft echte
   browserseitige Write-/Readback-/Abortfehler und deterministische
   `QuotaExceededError`-Injektion an der IDB-API-Grenze. Bereits vorhandener
   S-Q bleibt kanonisch und wird nicht dupliziert. Jeder Fall bindet
   Fehlercode, erlaubten strengeren Safetyzustand, unveraenderte
   Generation/Slots/Rawrecords, Restart und keinen Retry.

Alle Builder muessen ihre Sortierung, Eindeutigkeit, Counts, exakten Bytes,
Hashpraeimages und Schema-/Referencecoverage vor DB-Setup selbst assertieren.
Quota wird ehrlich als deterministische IDB-API-Grenz-Fehlerinjektion benannt,
nicht als nativer Speicherfehler oder physische Geraetespeichererschoepfung.

## Exakte Allowlist

Erst nach frischem Sol-Precheck-GREEN darf genau ein
`backend_data_reliability_engineer` Terra/high ohne Kinder schreiben:

1. `apps/mobile/src/mobile-regional-events-store.test.ts`
2. `apps/mobile/src/mobile-regional-events-selection.test.ts`
3. `tests/e2e/g3-020-regional-events-store-harness.ts`
4. `tests/e2e/g3-020-regional-events-store.spec.ts`
5. `docs/evidence/WRN-G3-020/P2-R4-B-R2-REST-MATRIX.md`
6. `docs/handoffs/WRN-G3-020-p2-r4-b-r2-rest-matrix.md`

Selectionunit darf nur bei fachlich erforderlicher gemeinsamer Testinvariante
veraendert werden; andernfalls bleibt sie bytegleich. Produkt, historische
Belege, R4-A, Fixture/Pin, Website, Provider und externe Gates sind OUT.
Kein Produkt-Testhook, Flag, Export, Direktseeding-Ersatz oder neuer Pfad.

## Pflichtlaeufe und Integration

- fokussierter Store-Unitlauf und alle Contract-/Mobileunits;
- G3-020-Playwright `mobile-390x844`, ein Worker, null Zielprojektskips;
- beide Typechecks, zehnpfadiger ESLint/Prettier;
- 19 Boundaries, Releaseboundary, Fixtureprovenienz, acht Hashgrenzen;
- exakte Scope-/Diffchecks und null Produkt-/Fixturedelta.

Writer editiert/testet ohne Git-Indexzugriff. Chief integriert zuerst die
tatsaechlich geaenderten Testpfade als einen isolierten Commit, danach nur
Evidence/Handoff. Ein unerreichbares Ziel, eine mehrdeutige Pinroute, ein
fehlender deterministischer Seam oder eine Produktabweichung stoppt RED.

## Gatefolge

1. Frischer unabhaengiger Sol-R1-Recheck dieses korrigierten Briefs.
2. Nur bei null Findings genau ein Terra/high-Testwriter.
3. Chief reproduziert Gesamtmatrix und Hashgrenzen.
4. Frische unabhaengige Terra-Testcompletion-QA und versiegelter Sol-
   Testbypass-/Security-/Privacy-Review muessen GREEN sein.
5. Finaler unabhaengiger Sol-P2-Abschluss mit null Findings.
6. P3 startet erst danach separat. Website, Live, Android/AAB/Play,
   Signierung, Upload, Deployment, G3-021 und Release bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R4-B-R2-REST-MATRIX
- Status: R1-Korrektur gebunden; Testwrite bis Sol-Recheck-GREEN gesperrt
- Basis: Produkt `cb0f6bc`; R4-A `981ead6`; R4-B-R1 `14a83c5`/`159077d`
- Design: `6af249f`; Precheck `9cb8e6d` RED; R1 ersetzt nur dessen falsche
  Reference-Dominanz und Quota-Bezeichnung
- Rechte: beim Chief; kein Writer aktiviert
- Naechster Schritt: frischer unabhaengiger Sol-R1-Recheck
- END-CHECK: :)
