# WRN-G3-020 P2-R4-B-R3-A – isolierte Safety-Cap-Matrix

Status: **GEBUNDEN; TESTWRITE BIS ZU KANONISCHEM SOL-SCHLUSSRECHECK-GREEN GESPERRT**

## Ziel

Produkt `cb0f6bc` und die elf echten Browserfaelle bis `47a6fc3` bleiben
eingefroren. Dieses test-only Paket schliesst ausschliesslich die noch offenen
Safety-Reference-, Entry- und Bytegrenzen aus dem korrigierten R2-Vertrag:

- echte erfolgreiche Finalmerges bei 1023 und 1024 eindeutigen References;
- 1025 References isoliert `protected` vor erstem Safety-`put`;
- 511 Entries bei 65535 Bytes und 512 bei 65536 erfolgreich;
- 513 Entries unter 65536 sowie 512 Entries bei 65537 isoliert `protected`
  vor erstem Safety-`put`;
- jeder Builder assertiert Schema, Sortierung, Eindeutigkeit, Hash,
  Referencecoverage, Counts und exakte Bytes vor DB-Setup;
- positive Faelle: genau ein Safety-`put`, Generation +1, Readback/Restart;
  negative Faelle: null Mutation, unveraenderte Generation/Slots und Restart.

## Exakte Allowlist

Nach kanonischem Sol-Schlussrecheck-GREEN genau ein
`backend_data_reliability_engineer` Terra/high:

1. `apps/mobile/src/mobile-regional-events-store.test.ts`
2. `tests/e2e/g3-020-regional-events-caps.spec.ts`
3. `docs/evidence/WRN-G3-020/P2-R4-B-R3-A-CAP-MATRIX.md`
4. `docs/handoffs/WRN-G3-020-p2-r4-b-r3-a-cap-matrix.md`

Der neue Spec ist absichtlich ein eigener E2E-Pfad. Bestehender Harness und
alle bestehenden Specs sind read-only; lokale Builder bleiben im neuen Spec.
Produkt, Fixture/Pin, Config/Dependencies und externe Gates sind OUT. Keine
Kinder, kein Git-Indexzugriff, kein Produkt-Testhook/Flag/Export.

## Pflichtlaeufe und Stop

Fokussierte Units, alle Mobileunits, beide Typechecks, neuer Playwright-Spec
`mobile-390x844`/ein Worker/null Zielskips, Lint/Prettier, Boundaries und acht
Hashes. Unerreichbarer Grenzwert, ungueltiger Builder oder Produktabweichung
stoppt RED ohne Produktfix.

## Parallele Rechte und Integration

R3-A und R3-B duerfen nach kanonischem Sol-Schlussrecheck-GREEN parallel
ausschliesslich
ihre disjunkten Dateien editieren und zielgerichtet testen. Beide verwenden
keinen Git-Index. Nach beiden Handoffs integriert Chief exklusiv zuerst R3-A,
prueft den leeren Cached-Diff sowie exakt dessen vier Pfade und committet;
danach integriert Chief R3-B auf dem A-Commit mit derselben Kontrolle. Kein
Writer formatiert, importiert oder uebernimmt Dateien des anderen Pakets.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R4-B-R3-A-CAP-MATRIX
- Status: gebunden; Testwrite gesperrt
- Basis: Produkt `cb0f6bc`; Browserstand `47a6fc3`; R1-Recheck `8ed72f7`
- Rechte: beim Chief
- Naechster Schritt: kanonischer Sol-Schlussrecheck
- END-CHECK: :)
