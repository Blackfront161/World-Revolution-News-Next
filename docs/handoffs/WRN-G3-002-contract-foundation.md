# Agent Handoff

- Agent: Backend/Data Reliability Engineer
- Task-ID: WRN-G3-002 / Contract Foundation
- Ergebnis: bestanden

## Kurzfazit

Der lokale Newsfeed konsumiert jetzt einen persistierten Manifest-v1-Vertrag
und zwei statische, selbst erstellte Payloads. Der einzige Clientpfad
`createPinnedLocalNewsfeedFixture()` validiert zuerst Struktur, Manifesthashes,
Bytezahlen, Recordzahlen, ID-Mengen und den gebundenen echten Seed-Commit. Erst
bei vollstaendigem Erfolg entsteht ein `ready`-Zustand.

Der unabhaengige Architekturreview hatte den frueheren Generatorpfad korrekt
als RED bewertet: Er berechnete Manifestwerte zur Laufzeit und erlaubte damit
eine gemeinsame Aenderung von Payload und Erwartungswert. Dieser Blocker ist
behoben. Der dynamische Generator verbleibt ausschliesslich als klar begrenzter
Testkandidat; App und Website importieren nur den validierenden gepinnten Pfad.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/tasks/WRN-G3-002-LOCAL-MANIFEST-NEWSFEED.md`
- `docs/architecture/ADR-001-REPOSITORY-AND-PACKAGE-STRUCTURE.md`
- `docs/architecture/ADR-004-IMMUTABLE-CONTENT-CONTRACT.md`
- `docs/templates/AGENT-HANDOFF.md`
- echter Fixture-Seed-Commit `675cd13c0863ade6a72d631e27283a29810eef10`

Es wurden keine Legacy- oder Livequellen gelesen, veraendert oder kopiert.

## Geaenderte Dateien

- `packages/content-contracts/package.json`
- `packages/content-contracts/tsconfig.json`
- `packages/content-contracts/src/index.ts`
- `packages/content-contracts/tests/manifest-v1.test.ts`
- `packages/domain/package.json`
- `packages/domain/src/index.ts`
- `packages/domain/tests/shell-state.test.ts`
- `packages/test-support/package.json`
- `packages/test-support/src/index.ts`
- `packages/test-support/tests/shell-state-fixtures.test.ts`
- `packages/test-support/fixtures/wrn-g3-002/manifest.json`
- `tools/check-fixture-provenance.mjs`
- `tools/check-fixture-provenance.test.mjs`
- `package.json` (nur `check:fixture-provenance` und dessen Aufnahme in `check`)
- dieser Handoff

## Tests und Belege

Bestanden:

- Typechecks fuer `@wrn/content-contracts`, `@wrn/domain` und `@wrn/test-support`
- Contract-/Domain-/Test-Support-Units: 3 Testdateien, 18 Tests bestanden
- `node --test tools/check-fixture-provenance.test.mjs`
  - 3 Tests bestanden: echter Seed akzeptiert, falscher Commit fail-closed,
    Payloaddrift fail-closed
- `node tools/check-fixture-provenance.mjs`
  - Revision `wrn-g3-002-local-fixture-v1-675cd13c0863`, echter Seed
    `675cd13c0863ade6a72d631e27283a29810eef10`
- `node_modules/.bin/eslint.cmd packages/content-contracts packages/domain packages/test-support --max-warnings=0`
- `node_modules/.bin/prettier.cmd --check packages/content-contracts packages/domain packages/test-support pnpm-lock.yaml`
- `node tools/check-boundaries.mjs`
- `git diff --check`

Contracttests beweisen positiv und negativ: exakte Manifestfelder,
Required/Optional-empty/Optional-absent, ausschliesslich
`local-fixture://wrn-g3-002/...`-Resourcepfade, keine Pfadduplikate, genau
eine Required-Artikelressource, ungueltige Branchquelle,
Provenienzabweichung, fehlender Hash, Mengenbeziehungsfehler, aktive IDs ohne
passende Records, unvollstaendige Teaser, veraenderter Inhalt bei altem Hash,
fehlende Required- oder Optional-empty-Ressource und unzulaessiger Payload
einer optional abwesenden Ressource.

Der zentrale gepinnte Loader prueft vor `ready` vollstaendig das persistierte
Manifest gegen die statischen Payloads. Ein Negativtest manipuliert den
Manifesthash und beweist, dass dieser Pfad fail-closed wirft. Das lokale
Provenienzgate liest ausschliesslich die zwei bekannten oeffentlichen
Fixturepfade mit `git show <sourceCommit>:<path>` und prueft Commitexistenz,
Pfadverfuegbarkeit, kanonische Hashes, Bytezahlen, Recordzahlen, Artikel-IDs
und Mengenhashes. Es verwendet weder Branches noch Remotezugriffe.

Es gab keine externen Requests und keine kostenpflichtigen API-Aufrufe.

## Feststellungen nach Prioritaet

1. **Behoben / Immutability-RED:** Der fruehere Wert
   `6c9ca5521f7338334d2e443155f0a5f2bf5392a6` ist keine aktive
   Fixture-Provenienz mehr. Das persistierte Manifest und die separate
   Integrationskonstante referenzieren exakt
   `675cd13c0863ade6a72d631e27283a29810eef10`.
2. **Behoben / Persistierte Erwartungswerte:** Der echte Seed-Commit pinnt die
   statischen Payloads. Das danach angelegte Manifest enthaelt feste
   kanonische Hashes, Bytezahlen, Recordzahlen und Mengenhashes; der gepinnte
   Clientpfad berechnet diese Erwartungswerte nicht neu.
3. **LOW / Testsentinel:** Die Contracttests verwenden den syntaktischen Wert
   `0123456789abcdef0123456789abcdef01234567` ausschliesslich als
   Negativ-/Formattestwert. Er wird nicht als reale Fixture-Provenienz
   ausgegeben oder in einer Produktions-/Clientfixture hinterlegt.

## Annahmen und offene Fragen

- Die unveraenderliche Fixture verwendet jetzt den echten Seed-Commit
  `675cd13c0863ade6a72d631e27283a29810eef10`. Generator und statische
  Payloads sind durch die Seed- und Manifeststufen ohne Selbstreferenz
  gebunden. Das entspricht dem Task Brief und ADR-004.
- Die getrennten Feed-Zustaende sind `loading`, `empty`, `error`, `offline`,
  `optional-absent` und `ready`; `offline` ist ausschliesslich ein ehrlicher
  lokaler Testzustand.
- Medien bleiben bewusst `optional-absent`; kein Bild, Asset oder Drittmedium
  wurde eingefuehrt.

## Restrisiken

- Kein offener Contract-/Provenienzblocker im autorisierten Scope.
- Sichtbare Paritaet, Browser-E2E, Accessibility und Screenshotabnahme bleiben
  Aufgaben des integrierten Frontend-/QA-Gates.

## Empfohlener naechster Schritt

Der Main Agent integriert nur den nun gruen validierten Kandidaten mit dem
Frontend-Handoff und uebergibt danach den gemeinsamen Stand an die
unabhaengige QA. Keine neue Contentquelle oder Erweiterung des Slices starten.

## WRN-AGENT-STATUS

- Task: WRN-G3-002 Contract Foundation
- Status: GREEN
- Quellstand: `codex/g3-002-newsfeed`; Fixture-Seed `675cd13c0863ade6a72d631e27283a29810eef10`
- Erledigt: persistiertes Manifest, statische Payloads, zentraler fail-closed Loader, Seed-Provenienzgate, Negativtests
- Tests: 3 Typechecks; 18 Contract-/Domain-/Test-Support-Tests; 3 Provenienztooltests; Lint, Format, Boundary und Diffcheck bestanden
- Offen: nur nachgelagerte Frontend-/QA-Gates ausserhalb dieses Eigentumsbereichs
- Handoff: `docs/handoffs/WRN-G3-002-contract-foundation.md`
- Naechster Schritt: Main-Agent-Integrationsgate wie oben
- END-CHECK: :)
