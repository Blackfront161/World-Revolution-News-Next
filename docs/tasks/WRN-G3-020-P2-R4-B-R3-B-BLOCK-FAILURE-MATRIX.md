# WRN-G3-020 P2-R4-B-R3-B – Block- und Failure-Matrix

Status: **GEBUNDEN; TESTWRITE BIS ZU KANONISCHEM SOL-SCHLUSSRECHECK-GREEN GESPERRT**

## Ziel

Produkt `cb0f6bc` und die elf echten Browserfaelle bis `47a6fc3` bleiben
eingefroren. Dieses test-only Paket schliesst ausschliesslich:

1. Hashentry V1 gegen gueltigen V2-Candidate: Rotation erlaubt;
2. exakter Candidatehash sowie Wildcardentry: Safety zuerst strenger
   persistiert, Rotation `protected`, alte Generation/Slots, Restart
   bytegleich, kein Auto-Retry;
3. S-W/S-R/S-A: `AbortError` vor Safety-`put`, beim Readback-`get` und nativer
   Transaktionsabort direkt nach originalem `put`;
4. R-W/R-R/R-A/R-Q: Fehler bei Sourceslotdelete, finalem Bundle-Readback,
   Control-`put` plus Abort und Active-`put` mit `QuotaExceededError`;
5. nach Rotationsfehler darf nur der zuvor erfolgreich committete strengere
   Safetyrecord bleiben; Controlgeneration/Slots/Rawrecords/Restart bleiben
   unveraendert, kein Retry.
6. Replacementmatrix: fehlende Reference, falscher Namespace, falsches
   Prefix und ein legitimer historischer Replacementanker nach mindestens
   vier Releases; Fehler `protected` und null Mutation/Restart.
7. Safetyrevision: gleich-identisch erfolgreich, gleich-konfligierend
   `protected`; Rollback-lower nur bei vollstaendiger Entry- und
   Referencecoverage erfolgreich, sonst `protected`.
8. Eventstore-Fail-closed-Matrix: Future-Records fuer `eventBundles`,
   `eventControl` und `eventSafety`; Extra- und Missing-Eventstore,
   unbekannter Recordkey sowie corrupt Bundle-, Control- und Safetyrecord.
   Kein Produktdelete, stilles Upgrade, Retry oder Zustandserfinden.

Quota wird als deterministische browserseitige IDB-API-Grenzinjektion
bezeichnet, nicht als physischer Speichermangel. Bereits vorhandener S-Q und
die elf bestehenden Browserfaelle werden nicht dupliziert.

## Exakte Allowlist

Nach kanonischem Sol-Schlussrecheck-GREEN genau ein
`backend_data_reliability_engineer` Terra/high:

1. `tests/e2e/g3-020-regional-events-failures.spec.ts`
2. `docs/evidence/WRN-G3-020/P2-R4-B-R3-B-BLOCK-FAILURE-MATRIX.md`
3. `docs/handoffs/WRN-G3-020-p2-r4-b-r3-b-block-failure-matrix.md`

Der neue Spec ist eigenstaendig. Er darf Konstanten aus dem bestehenden
Harness runtime-importieren; bestehende `*.spec.ts` werden nur gelesen und
niemals runtime-importiert, weil dies ihre Tests erneut registrieren wuerde.
Produkt, Units, Fixture/Pin, Config/Dependencies und externe Gates sind OUT.
Keine Kinder, kein Git-Indexzugriff, kein Produkt-Testhook/Flag/Export.

## Pflichtlaeufe und Stop

Neuer Playwright-Spec `mobile-390x844`/ein Worker/null Zielskips, volle
Contract-/Mobileunits, beide Typechecks, Lint/Prettier, Boundaries und acht
Hashes. Nicht deterministisch isolierbare Phase oder Produktabweichung stoppt
RED ohne Simulation als PASS und ohne Produktfix.

## Parallele Rechte und Integration

R3-A und R3-B duerfen nach kanonischem Sol-Schlussrecheck-GREEN parallel
ausschliesslich
ihre disjunkten Dateien editieren und zielgerichtet testen. Beide verwenden
keinen Git-Index. Nach beiden Handoffs integriert Chief exklusiv zuerst R3-A,
prueft den leeren Cached-Diff sowie exakt dessen vier Pfade und committet;
danach integriert Chief R3-B auf dem A-Commit mit derselben Kontrolle. Kein
Writer formatiert oder uebernimmt Dateien des anderen Pakets.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R4-B-R3-B-BLOCK-FAILURE-MATRIX
- Status: gebunden; Testwrite gesperrt
- Basis: Produkt `cb0f6bc`; Browserstand `47a6fc3`; R1-Recheck `8ed72f7`
- Rechte: beim Chief
- Naechster Schritt: kanonischer Sol-Schlussrecheck
- END-CHECK: :)
