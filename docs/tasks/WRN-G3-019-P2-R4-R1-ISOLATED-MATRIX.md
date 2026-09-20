# WRN-G3-019 – P2-R4-R1 isolierte Negativmatrix

Status: **TEST-ONLY KORREKTUR BEREIT; P3 BLEIBT GESPERRT**

## Basis und Ziel

- Product-Owner-Gate: PO-095, exakt `START WRN-G3-019`.
- Produktkandidat unveraendert: `2a7d983`.
- R4-Testkandidat: `61b7c47`; Metadaten: `7d98ad7`.
- unabhaengiger RED-Recheck: `633fdfb`.
- zu schliessen: `P2-R4-M-001`, `P2-R4-M-002`, `P2-R4-L-001`,
  `P2-R4-L-002`.

Es gibt kein Produkt- oder Securityfinding. R4-R1 korrigiert ausschließlich
die Aussagekraft und Vollständigkeit der Testmatrix.

## Exakte Schreiballowlist

Genau ein Spark-Mikrowriter darf nur schreiben:

- `packages/content-contracts/tests/mobile-reader-v2.test.ts`
- `apps/mobile/src/mobile-reader-v2.test.ts`
- `docs/evidence/WRN-G3-019/P2-R4-NEGATIVE-MATRIX.md` – nur Statussatz
  `QA + SECURITY DELTA REQUIRED` an die bedingte Security-Disposition angleichen
- `docs/evidence/WRN-G3-019/P2-R4-R1-ISOLATED-MATRIX.md` – neu
- `docs/handoffs/WRN-G3-019-p2-r4-r1-isolated-matrix.md` – neu

Produkt-, Fixture-, Contract-, Adapter-, UI-, Governance-, Website-,
Dependency- und Releasepfade bleiben read-only. Keine Kinder.

## M-001 – gültige Vorgaengerbaseline

1. Einen tatsächlichen Vorgängerblock als eigene v1-Entry erzeugen.
2. Den Fragmenthash aus exakt diesem Block berechnen.
3. Den zweiten Sidecarartikel mit genau dieser Range und diesem Hash bauen.
4. Den vollständigen Zwei-Artikel-Kandidaten samt gültigem Vorgaengerprofil
   vor jeder Negativschleife mit `not.toBeNull()` beweisen.
5. Danach pro Fall genau ein Feld des Vorgaengerobjekts mutieren:
   unbekannte v1-ID, Self-ID, falscher Blockanker, falscher Fragmenthash,
   leeres Label, zu langes Label, Extra-Key.
6. Jede Zeile muss ausschließlich aufgrund der benannten Mutation `null`
   ergeben; keine gemeinsame zweite Ungültigkeit.

## M-002 – isolierte Quellenprofilmatrix

Ein einmal positiv bewiesenes gültiges Quellenprofil ist die Baseline. Jede
Tabellenzeile mutiert exakt eine Eigenschaft:

- fehlende, zusätzliche und duplizierte Source-ID;
- Selbstbeschreibung leer und zu lang;
- redaktionelle Einordnung leer und zu lang;
- Quellentyp leer und zu lang;
- Regionen leer, unsortiert und dupliziert;
- Sprachen leer, unsortiert und dupliziert;
- `current + null`, `unknown + timestamp`, `stale + null`, unzulässiger
  Freshnessstatus;
- Korrekturkontakt unvollständig, leeres Label, leerer Wert, Label zu lang,
  Wert zu lang und Extra-Key.

Bestehende gekoppelte Fälle dürfen ersetzt oder auf je eine Ungültigkeit
reduziert werden. Die Matrix darf keine Ablehnung aus einem zweiten Fehler
erben.

## L-001/L-002

- Für jede Translation-Key-Mutation: Ergebnis zuerst explizit nicht `null`,
  danach direkter Vergleich `result.key !== baseline.key`.
- Der R4-Evidence-Status darf nur frischen unabhängigen Matrixrecheck fordern.
  Ein weiterer Securitydelta ist nur bei neuem Produkt-/Securityfinding
  erforderlich.

## Pflichtläufe und Gate

Writer führt mit exakt Node `v24.19.0` die vollständigen Contract- und
Mobile-Suiten, beide Typechecks, 19 Boundaries, Fixtureprovenienz,
Releaseboundary, gezielten Prettiercheck und `git diff --check` aus. Der
Writer sichert nur die Allowlist in einem eigenen Commit und beendet alle
Rechte.

Danach muss eine frische unabhängige Instanz read-only jede positive Baseline,
Einzelmutation und Laufmatrix prüfen. Erst ihr GREEN schliesst
`P2-FINAL-M-001` und erlaubt dem Chief, den vorbereiteten P3-Writervertrag zu
aktivieren.

Website, echte Quellen/Medien, Provider, Hosting/Live, Android/AAB/Play,
Signierung, Upload und Release bleiben gesperrt.

END-CHECK: :)

