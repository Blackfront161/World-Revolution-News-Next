# Agent Handoff

- Agent: Backend/Data Reliability Engineer – WRN-G3-006 Contract/Domain/Fixture
- Task-ID: `WRN-G3-006`
- Ergebnis: bestanden

## Kurzfazit

Der erste strikt sequenzielle Readerkern ist implementiert. Der additive
`wrn.local-reader-details.v1`-Vertrag besitzt einen kanonischen SHA-256,
akzeptiert nur sichere semantische Textbloecke und wird fail-closed an exakt
dieselbe ID-Menge wie die drei bereits manifestvalidierten Artikelrecords
gebunden. Die Readerdomain kennt weder DOM, Storage, Netzwerk noch Routing und
liefert nur `loading`, `ready`, `not-found` oder `error`; ein Teaser wird nie
als Artikelkoerper verwendet.

## Verwendete Quellen

- `AGENTS.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/tasks/WRN-G3-006-LOCAL-ARTICLE-READER.md`
- `docs/templates/AGENT-HANDOFF.md`
- bestehende G3-002-Manifest-/Artikelfixture, G3-005-Discoverfixture und die
  zugehoerigen Vertrags-/Domaintests im neuen Zielrepository

Die Legacy-App und Legacy-Website wurden in diesem Arbeitsschritt nicht
geoeffnet oder veraendert. Ihre in Task Brief und Source Register fixierten
Commits bleiben die read-only Baseline.

## Geaenderte Dateien

### Contract und Tests

- `packages/content-contracts/src/index.ts`
- `packages/content-contracts/tests/manifest-v1.test.ts`

### Domain und Tests

- `packages/domain/src/index.ts`
- `packages/domain/tests/shell-state.test.ts`

### Lokale Fixture, Test-Support und Tests

- `packages/test-support/fixtures/wrn-g3-006/reader-details.json`
- `packages/test-support/src/index.ts`
- `packages/test-support/tests/shell-state-fixtures.test.ts`

Keine App-, Website-, E2E-, Rootkonfigurations-, Dependency-, Lockfile-,
Legacy- oder Live-Datei wurde geaendert.

## Tests und Belege

Bestanden am 24. August 2026:

- `pnpm.cmd run format`
- `pnpm.cmd run lint` mit 16 Boundary-, Provenance-, Brand- und
  Preview-Grenztests
- `pnpm.cmd run typecheck`
- `pnpm.cmd run test` vor der abschliessenden Domainhaertung mit 11
  Content-Contract-, 16 Domain-, 4 API-Contract-,
  9 Test-Support-, 15 Mobile- und 15 Website-Unit-Tests sowie 16
  Boundarytests
- nach der abschliessenden Domainhaertung: `pnpm.cmd --filter @wrn/domain
  test:unit` mit 17 Domain-Tests, `pnpm.cmd --filter @wrn/domain typecheck`,
  gezielter Domain-ESLint-Check, Gesamtformat und `git diff --check`
- `pnpm.cmd run build` fuer Mobile und Website
- `git diff --check`

Der direkte Root-Befehl `vitest run` wurde einmal versucht und ist kein
gueltiger Projekt-Runner: Er laedt Playwright- und Node-Testdateien als
Vitest-Suites und verwendet nicht die je App konfigurierte jsdom-Umgebung.
Dadurch entstanden `document/window is not defined`-Fehler ausserhalb dieses
Scopes. Der vorgesehene Workspace-Befehl `pnpm.cmd run test` ist vollstaendig
gruen; es gibt keinen Produktbefund aus diesem Fehlaufruf.

## Feststellungen nach Prioritaet

- Keine Blocker, High-, Medium- oder Low-Findings im Contract-/Domain-/
  Fixturebereich.
- Der bestehende allgemeine Fixture-Provenance-Check prueft weiterhin nur die
  G3-002-Feedbasis. Die neue G3-006-Fixture ist durch eigene Contract- und
  Test-Support-Tests an Hash und exakte ID-Menge gebunden; eine spaetere
  allgemeine Toolerweiterung ist fuer diesen Slice nicht erforderlich und
  wurde nicht vorweggenommen.

## Annahmen und offene Fragen

- `originalUrl`, Quelle, Datum, Sprache und Themen bleiben ausschliesslich im
  bereits validierten `LocalArticle`; Readerdetails duplizieren diese Felder
  bewusst nicht.
- Der spaetere Client muss `validateLocalReaderDetailsV1` ueber den
  Test-Support-Loader vor der Domainauflosung ausfuehren und die resultierende
  Validierung uebergeben. Die Domain prueft zusaetzlich fail-closed, dass die
  positiven Validierungs-IDs, Detail-IDs und Artikel-IDs exakt dieselbe
  eindeutige Menge bilden.
- App-/Website-Routen, Fokus, Escape, Browserhistory, die externe
  Quellenbestaetigung, Screenshots und E2E sind ausschliesslich der folgenden
  Frontend- und QA-Sequenz zugeordnet.

## Restrisiken

- Der Readertext ist absichtlich nur eine selbst erstellte lokale Testfixture;
  er belegt weder eine kuenftige echte Contentquelle noch Archiv-, SEO- oder
  Medienparitaet.
- Die Regel fuer sicheren Text weist sichtbare HTML-/Linkmuster zurueck. Die
  sichere Ausgabe ohne HTML-/Markdownausfuehrung bleibt zusaetzliche
  Clientverantwortung und wird im Frontend-Slice getestet.

## Empfohlener naechster Schritt

Main Agent sichert zuerst diesen Stand als Checkpoint. Danach darf ausschliesslich
der sequenzielle Frontend-Owner die getrennten mobilen und Website-Readeransichten
innerhalb des G3-006-Task-Briefs umsetzen. Keine automatische Ausfuehrung.

## WRN-AGENT-STATUS

- Task: WRN-G3-006 Contract/Domain/Fixture
- Status: GREEN
- Quellstand: `codex/g3-006-reader-preparation`, Vorbereitung `8b7e292f91393a20251954265cd3419b36c73e5c`
- Erledigt: additiver Readerdetailvertrag, kanonischer Hash, sichere Blockvalidierung, exakte Mengenbindung inklusive Validation-/Detail-/Artikel-Dreifachbindung, lokale Drei-ID-Fixture, fail-closed Domain und Tests
- Tests: Format, Lint/Boundaries, Typen, Unit/Contract, Build und Diff-Check bestanden
- Offen: getrennte Clientansichten, lokale Routen/History/Fokus/Escape, Quellenbestaetigung, E2E, visuelle Matrix und unabhaengige QA
- Handoff: `docs/handoffs/WRN-G3-006-contract-domain-fixture.md`
- Naechster Schritt: Main-Agent-Checkpoint, danach strikt sequenzielle Frontend-Implementierung
- END-CHECK: :)
