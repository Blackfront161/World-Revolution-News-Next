# Agent Handoff

- Agent: Backend/Data Reliability Engineer (WRN-G3-011 Contract/Domain/Fixture)
- Task-ID: WRN-G3-011
- Ergebnis: bestanden

## Kurzfazit

Der erste und einzige schreibende Implementierungsschritt fuer WRN-G3-011 ist
im Commit `b0aee26` gesichert. Der additive lokale V1-Vertrag speichert nur
kanonische, syntaktisch sichere Artikel-IDs, Zeitwerte und normalisierten
Lesefortschritt. Titel, Teaser, Volltexte, URLs, Bilder, Quellen, Cookies und
Providerdaten sind weder im Vertrag noch in der Testmigration vorhanden.

Die reine Domain trennt Speichern, Gelesen/Ungelesen und Fortschritt. Alias
wird kanonisiert; Gone, Revoked und sichere unbekannte IDs bleiben payloadfrei
und entfernbar. Eine stale Lifecyclebindung faellt fail-closed und veraendert
keinen V1-Zustand. Die selbst erstellte Migrationsfixture modelliert nur die
drei bekannten Keybereiche und erzeugt idempotent keinen Artikelpayload.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/architecture/ADR-004-IMMUTABLE-CONTENT-CONTRACT.md`
- `docs/architecture/ADR-007-OFFLINE-AND-CACHE-CONTRACTS.md`
- `docs/tasks/WRN-G3-011-LOCAL-SAVED-READING-STATE.md`
- `docs/evidence/WRN-G3-011-SAVED-READING-PARITY-AND-ACCEPTANCE-PLAN.md`
- `docs/handoffs/WRN-G3-011-start.md`
- G3-008 Lifecyclebasis aus dem bereits lokalen, hashgebundenen Vertrag

## Geaenderte Dateien

### Vertrag und Domain

- `packages/content-contracts/src/index.ts`
- `packages/content-contracts/tests/reading-state-v1.test.ts`
- `packages/domain/src/index.ts`
- `packages/domain/tests/reading-state.test.ts`

### Selbst erstellte Fixture und Loader

- `packages/test-support/fixtures/wrn-g3-011/legacy-migration.json`
- `packages/test-support/src/index.ts`
- `packages/test-support/tests/shell-state-fixtures.test.ts`

### Nicht geaendert

- `apps/mobile/**`, `apps/website/**`, `tests/e2e/**`, Rootkonfiguration und Dependencies
- aktuelle App, aktuelle Website, Contentrepository, Cloudflare, Hostinger und Google Play
- der user-eigene unversionierte Ordner `.codex-remote-attachments/`

## Tests und Belege

- Format: PASS
- Lint und Boundarytests: PASS, 17 Boundarytests
- Workspace-Typechecks: PASS
- Workspace-Unit-/Contract-/Komponententests: PASS, 114 Tests
  - Content-Contracts: 19
  - Domain: 28
  - API-Contracts: 4
  - Test-Support: 14
  - Mobile: 22
  - Website: 19 plus 8 statische Publikationstests
- Mobile- und Website-Build: PASS
- `git diff --check`: PASS
- `pnpm run check`: erwartbar nur am registrierten Toolchaingate beendet:
  Node `24.16.0` aktiv, exakt `24.19.0` verlangt. Alle nachgelagerten
  statischen, Test- und Buildpruefungen wurden einzeln erfolgreich ausgefuehrt.

## Feststellungen nach Prioritaet

### GREEN – Contractscope

- Der V1-Vertrag erlaubt nur exakte, sortierte und begrenzte ID-only-Records.
- Fremde Felder, falsche Version, doppelte/unsichere IDs, falsche Zeitwerte,
  nicht endliche sowie zu kleine Fortschrittswerte werden fail-closed abgewiesen.
- Die zentralen Fortschrittsgrenzen sind `0.01` (Speichern) und `0.9`
  (deterministisch als gelesen markieren).
- Der lokale Zustand bleibt auf maximal 200 Eintraege und 32 KiB begrenzt.
- Kein Domainpfad beruehrt Storage, Netzwerk, Zeitquelle oder Contentpayload.

## Annahmen und offene Fragen

- App und Website implementieren danach ausschliesslich getrennte,
  versionierte `localStorage`-Adapter auf Basis dieser Domain; die beiden Keys
  sind im Task Brief festgelegt und nicht im Contract hartkodiert.
- Die Migrationsfixture ist kein realer Cutover und liest keine Nutzer- oder
  Legacydatei.

## Restrisiken

- Storagefehler, Reload, UI-Aktionen, Bestatigungsdialoge, Fokus und die
  sichtbare Saved-Ansicht liegen beim folgenden getrennten Frontendslice.
- Offlinepayload, IndexedDB, Cache Storage, Service Worker, Android,
  Synchronisation, Remote/CI, Cloud, Deployment und Release bleiben gesperrt.
- Das registrierte Node-Toolchaingate ist eine lokale Umgebungsabweichung,
  nicht durch diesen Slice verursacht.

## Empfohlener naechster Schritt

Nur Empfehlung; keine automatische Ausfuehrung.

Der Main Agent prueft Commit und Handoff. Erst danach darf genau ein
`frontend_brand_engineer` die getrennten App-/Website-Adapter, Oberflaechen
und zugehoerigen lokalen Tests auf dem unveraenderten Contractkandidaten
implementieren. Anschliessend folgt unabhaengige QA.

## WRN-AGENT-STATUS

- Task: WRN-G3-011 Contract, reine Domain und lokale Migrationsfixture
- Status: GREEN
- Quellstand: Start `b4c72bc` / `e30f648`; Contractcheckpoint `b0aee26`
- Erledigt: V1-Vertrag, Validierung, Save/Remove, Read/Unread, Progress,
  Reconciliation, selektive/Gesamtloeschung, idempotente payloadfreie
  Migrationsdomain und Fixturetests
- Tests: Format, Lint, 17 Boundarytests, Typechecks, 114 Workspace-Unittests,
  beide Builds und Diffcheck PASS; Top-Level-Toolchain-Gate siehe oben
- Offen: getrennte Frontendadapter/-oberflaechen und unabhaengige QA
- Handoff: `docs/handoffs/WRN-G3-011-contract-domain.md`
- Naechster Schritt: gesicherter Main-Agent-Handoff, danach Frontend Brand
- END-CHECK: :)
