# WRN-G3-019 – P2-R4 vollständige Negativmatrix

Status: **TEST-ONLY KORREKTUR BEREIT; P3-PRODUKTWRITE BLEIBT GESPERRT**

## Autorität und Basis

- Product-Owner-Gate: PO-095, exakt `START WRN-G3-019`.
- Produktkandidat: `2a7d9833561af3ac57850a7115f69b42fd8e6d6a`.
- Finaler P2-Review: `f19590d`; Finding `P2-FINAL-M-001`.
- Unabhängige P2-R3-QA: GREEN in `b2e71ad`.
- Versiegelter Securityscan:
  `da04a9c5-7d47-4e6b-9a8e-5fc2cd8f7fbf`, null Findings.

Der Produktcode bildet alle sechs P2-C- und drei P2-R3-A-Bedingungen ab.
Offen ist ausschließlich die im R3-Vertrag zugesagte vollständige
Negativtestmatrix. R4 darf weder Produktlogik noch Fixture, Vertrag, Pin oder
Runtime ändern.

## Exakte Schreiballowlist

Genau ein kostengünstiger, eng instruierter Testwriter darf ausschließlich
schreiben:

- `packages/content-contracts/tests/mobile-reader-v2.test.ts`
- `apps/mobile/src/mobile-reader-v2.test.ts`
- `docs/evidence/WRN-G3-019/P2-R4-NEGATIVE-MATRIX.md`
- `docs/handoffs/WRN-G3-019-p2-r4-negative-matrix.md`

Alle Produkt-, Fixture-, UI-, CSS-, Katalog-, Website-, Dependency-, Lock-,
Governance- und Releasepfade bleiben read-only beziehungsweise OUT. Keine
Kinder und keine neuen Tests außerhalb der beiden bestehenden Dateien.

## Pflichtmatrix

### Vertragsvalidator

Jede Variation muss den vollständigen Sidecar atomar mit `null` verwerfen:

1. Artikel: `transformerId` fehlt, ist leer/ungültig oder zu lang;
2. Artikel: `transformerVersion` fehlt, ist leer/ungültig oder zu lang;
3. Artikel enthält einen unbekannten Extra-Key;
4. Vorgaenger: unbekannte v1-Artikel-ID, Self-ID, falscher Blockanker,
   falscher Fragmenthash, leeres/zu langes Label und Extra-Key;
5. Quellenprofil: fehlende/zusätzliche/duplizierte Source-ID; leere oder zu
   lange Selbstbeschreibung, redaktionelle Einordnung und Typ; unsortierte,
   duplizierte oder leere Regionen/Sprachen; jede unzulässige
   Freshness-/`reviewedAt`-Kombination; unvollständiger, leerer, zu langer oder
   Extra-Key enthaltender Korrekturkontakt;
6. Gesamt-Sidecar: alte Vertragsversion, Future-Vertragsversion sowie
   unbekannter Root-Extra-Key.

Bestehende Tests dürfen tabellarisch erweitert werden. Es wird keine
Produktanforderung durch einen Test neu erfunden; maßgeblich sind die bereits
implementierten exakten Validatorregeln.

### Translation-Key

Ausgehend von genau einem gültigen Baseline-Key muss jede einzelne Mutation
einen anderen Key ergeben:

- alle fünf Snapshotfelder einzeln;
- `articleId`, `sectionId`, `sourceFragmentSha256`;
- `sourceLanguage`, `targetLanguage`;
- `adapter.id`, `adapter.version`.

Der Testname darf vollständige Feldbindung erst nach dieser Matrix behaupten.
Zusätzlich bleiben Vorstart- und Nach-`await`-Stale sowie Abort ohne
übersetzten Text belegt.

## Pflichtläufe

Mit Node `v24.19.0` und den vorhandenen lokalen Runnern:

1. vollständige Content-contract-Suite;
2. vollständige Mobile-Suite aus `apps/mobile`;
3. beide relevanten Typechecks;
4. 19 Boundary-/Fixture-/Preview-/Brandprüfungen;
5. Fixtureprovenienz und Releaseboundary;
6. gezielter Prettiercheck der zwei Testdateien;
7. `git diff --check` und Nachweis, dass außerhalb der Allowlist kein Delta
   entstand.

## Abschlussgate

Der Writer sichert einen eigenen Ergebniscommit und gibt alle Rechte zurück.
Danach prüft ein frischer unabhängiger Reviewer read-only die vollständige
Matrix und den unveränderten Produktkandidaten. Erst dessen GREEN erlaubt dem
Chief, P2 zu schließen und den separat vorbereiteten P3-Writervertrag zu
aktivieren.

Website, echte Quellen/Medien, Provider, Hosting/Live, Android/AAB/Play,
Signierung, Upload und Release bleiben gesperrt.

END-CHECK: :)

