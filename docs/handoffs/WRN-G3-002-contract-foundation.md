# Agent Handoff

- Agent: Backend/Data Reliability Engineer
- Task-ID: WRN-G3-002 / Contract Foundation
- Ergebnis: teilweise

## Kurzfazit

Der lokale Manifest-v1-Vertrag, seine fail-closed Validatoren, neutrale
deterministische Testdaten und das plattformneutrale Feed-Zustandsmodell sind
im erlaubten Paketbereich umgesetzt und vor dem Seed-Checkpoint gehaertet. Der
Vertragskern ist lokal gruen. Die abschliessende paketuebergreifende Ausfuehrung
der neuen Test-Support-Fixture ist allein durch eine fehlende lokale
pnpm-Workspace-Verknuepfung blockiert; es wurde bewusst keine Installation oder
Dependency-Aktion ausgefuehrt.

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
- `pnpm-lock.yaml` (nur lokale Workspace-Importer fuer Content-Contracts)
- dieser Handoff

## Tests und Belege

Bestanden:

- `node_modules/.bin/tsc.cmd --noEmit -p packages/content-contracts/tsconfig.json`
- `node_modules/.bin/vitest.cmd run packages/content-contracts/tests/manifest-v1.test.ts packages/domain/tests/shell-state.test.ts`
  - 2 Testdateien, 12 Tests bestanden
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

Nicht ausfuehrbar ohne lokale Workspace-Verknuepfung:

- `packages/test-support/tests/shell-state-fixtures.test.ts` importiert den
  neuen Paketnamen `@wrn/content-contracts`, der im vorhandenen
  `node_modules` noch nicht verlinkt ist. Der Versuch endete fail-closed mit
  `Cannot find package '@wrn/content-contracts'`.
- Der direkte Domain-Typecheck endet aus demselben lokalen
  Aufloesungsgrund mit `Cannot find module '@wrn/content-contracts'`; die
  Domain-Unit-Tests selbst bestehen, weil ihr Type-only-Import zur Laufzeit
  korrekt entfernt wird.

Es gab keine externen Requests und keine kostenpflichtigen API-Aufrufe.

## Feststellungen nach Prioritaet

1. **HIGH / Integrationsgate:** Vor Frontendkonsum muss der Main Agent die
   lokale pnpm-Workspace-Verknuepfung mit bestehendem Lockfile herstellen und
   danach `pnpm --filter @wrn/test-support test:unit`, `pnpm -r typecheck`
   sowie die gesamten Contracttests ausfuehren. Das ist keine neue Dependency,
   benoetigt wegen der ausdruecklichen Installationsgrenze aber eine bewusste
   Integratorentscheidung.
2. **MEDIUM / Fixture-Provenienzgate:** `createLocalNewsfeedFixture` nimmt
   absichtlich keinen erfundenen Defaultwert an. Der folgende echte
   Fixture-Seed-Commit muss den Generator **und** die selbst erstellten,
   unveraenderlichen Payloads gemeinsam pinnen. Erst danach wird in einem
   separaten Integrationsschritt eine Konstante mit genau diesem 40- oder
   64-stelligen Hash hinzugefuegt und als `sourceCommit` an die Fixture
   uebergeben. Der Manifestgenerator referenziert dadurch weder sich selbst
   noch einen beweglichen Branchalias.
3. **LOW / Testsentinel:** Die Contracttests verwenden den syntaktischen Wert
   `0123456789abcdef0123456789abcdef01234567` ausschliesslich als
   Negativ-/Formattestwert. Er wird nicht als reale Fixture-Provenienz
   ausgegeben oder in einer Produktions-/Clientfixture hinterlegt.

## Annahmen und offene Fragen

- Die unveraenderliche Fixture ist vorerst ein Generator mit explizitem
  Seed-Parameter, damit Manifest und Seed-Commit einander nicht selbst
  referenzieren. Der anschliessende Seed-Commit pinnt Generator und
  selbst erstellten Payload gemeinsam; eine getrennte Integrationskonstante
  bindet danach exakt dessen Hash. Das entspricht dem Task Brief und ADR-004.
- Die getrennten Feed-Zustaende sind `loading`, `empty`, `error`, `offline`,
  `optional-absent` und `ready`; `offline` ist ausschliesslich ein ehrlicher
  lokaler Testzustand.
- Medien bleiben bewusst `optional-absent`; kein Bild, Asset oder Drittmedium
  wurde eingefuehrt.

## Restrisiken

- Bis zum lokalen Workspace-Link ist die paketuebergreifende Typ- und
  Fixture-Ausfuehrung nicht als gruen belegt.
- Der echte Fixture-Seed-Commit ist noch nicht gesetzt. Vor diesem Gate darf
  kein Client einen realen Ready-Feed als vollstaendig manifestgebunden
  behaupten.

## Empfohlener naechster Schritt

Der Main Agent entscheidet sichtbar ueber die rein lokale, offline/frozen
Workspace-Synchronisation ohne neue Dependencies. Nach bestandenem Link-Test
erstellt er den Fixture-Seed-Checkpoint, uebergibt dessen Hash an beide
Clientimplementierungen und laesst danach die Frontendarbeit gegen den
unveraenderten Vertrag fortsetzen.

## WRN-AGENT-STATUS

- Task: WRN-G3-002 Contract Foundation
- Status: YELLOW
- Quellstand: `codex/g3-002-newsfeed`, unvercommitteter Sub-Agent-Scope
- Erledigt: Manifest-v1, Validator/Hash-/Mengen-/Provenienzpruefung, lokale Pfad- und Ressourceneindeutigkeit, vollstaendige Teaserregel, drei neutrale Artikel, alle sechs Feedzustaende, lokale Workspace-Importer
- Tests: Contract-Typecheck bestanden; 12 Contract-/Domain-Units bestanden; Lint, Format, Boundary und Diffcheck bestanden
- Offen: lokale pnpm-Workspace-Verknuepfung, danach paketuebergreifender Typecheck/Test-Support-Test; echter Fixture-Seed-Commit durch Main Agent
- Handoff: `docs/handoffs/WRN-G3-002-contract-foundation.md`
- Naechster Schritt: Main-Agent-Integrationsgate wie oben
- END-CHECK: :)
