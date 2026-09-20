# Agent Handoff

- Agent: Backend/Data Reliability Engineer (WRN-G3-008 Contract/Domain/Fixture)
- Task-ID: WRN-G3-008
- Ergebnis: bestanden

## Kurzfazit

Der erste und einzige schreibende Implementierungsschritt fuer WRN-G3-008 ist
lokal abgeschlossen und im Commit `5d01d77` gesichert. Der additive
Lifecyclevertrag trennt aktive, historische, aliasierte, gone, revoked,
unbekannte und ungueltige IDs fail-closed. Revocation wird vor Alias,
Contentprojektion und Share behandelt. Gone- und Revocationrecords besitzen
keinen Titel, Teaser, Volltext, Quellen- oder Sharepayload.

Eine neue selbst erstellte, separat hashgebundene G3-008-Fixture umfasst zwei
kanonische Artikel, einen historischen Alias, einen Gonefall und eine bereits
widerrufene ehemalige Alias-ID. Es wurden weder App- noch Websiteoberflaechen,
Legacyquellen, Liveinfrastruktur, Storage, Netzwerk oder Shareadapter geaendert.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/04-QUALITY-RULES.md`
- `docs/tasks/WRN-G3-008-ARCHIVE-LINK-LIFECYCLE.md`
- `docs/architecture/ADR-004-IMMUTABLE-CONTENT-CONTRACT.md`
- `docs/architecture/ADR-007-OFFLINE-AND-CACHE-CONTRACTS.md`
- `docs/templates/AGENT-HANDOFF.md`

## Geaenderte Dateien

### Vertrag und Domain

- `packages/content-contracts/src/index.ts`
- `packages/content-contracts/tests/archive-lifecycle-v1.test.ts`
- `packages/domain/src/index.ts`
- `packages/domain/tests/shell-state.test.ts`

### Lokale Fixture und Loader

- `packages/test-support/fixtures/wrn-g3-008/articles.json`
- `packages/test-support/fixtures/wrn-g3-008/reader-details.json`
- `packages/test-support/fixtures/wrn-g3-008/lifecycle.json`
- `packages/test-support/src/index.ts`
- `packages/test-support/tests/shell-state-fixtures.test.ts`

### Nicht geaendert

- `apps/mobile/**`, `apps/website/**`, `tests/e2e/**`
- Legacy-App, Legacy-Website, Contentrepository, Cloudflare, Hostinger und
  Google Play

## Tests und Belege

- drei betroffene Typechecks PASS
- Contract-Unit: 16 PASS
- Domain-Unit: 22 PASS
- Fixture-Unit: 13 PASS
- vollstaendiger lokaler statischer/restlicher Hauptcheck ohne Toolchain-Gate
  PASS: Preview-Boundary, Format, Lint, Boundarytests, alle Workspace-
  Typechecks, Fixture-Provenienz, Markenassets und alle Unit-/Boundarytests
- beide Builds PASS
- `git diff --check` PASS
- `pnpm run check` als Gesamtbefehl nur am vorhandenen Toolchaingate gestoppt:
  Node `24.16.0` aktiv, exakt `24.19.0` verlangt. Die nachgelagerten Checks
  wurden einzeln vollstaendig erfolgreich ausgefuehrt; keine Toolchain oder
  Dependency wurde veraendert.

## Feststellungen nach Prioritaet

### Kein offener Blocker im Contractscope

- Aliasziele muessen kanonische Archiv-IDs sein. Dadurch sind Ketten, Zyklen,
  Selbstverweise, unbekannte Ziele und Mehrfachquellen fail-closed.
- Eine Revocation darf eine vorherige Aliasquelle blockieren und wird bei der
  Aufloesung vor dem Alias geprueft.
- Eine niedrigere als die bekannte Revocationrevision lehnt der Loader ab.
- Share wird ausschliesslich aus einem kanonischen aktiven oder historischen
  Ergebnis als feste `https://solinaridao.com/articles/<id>/`-URL gebildet.

## Annahmen und offene Fragen

- Die zwei lokalen Testartikel dienen ausschliesslich als selbst erstellte
  G3-008-Daten; sie behaupten keine reale historische Zuordnung.
- Der Frontend-Schritt muss die validierte Fixture verwenden und darf keine
  neue Aufloesungs-, Alias- oder Sharelogik duplizieren.

## Restrisiken

- Produktive HTTP-Redirects/410, Hostinger, echte 935-ID-Migration und
  Revocation-Purge aus Offlinecaches bleiben weiterhin ausgeschlossen.
- Native Android-Share und echte Browser-Shareeffekte sind nicht implementiert
  und muessen im folgenden Frontendslice nur ueber kontrollierte lokale Stubs
  behandelt werden.
- Die registrierte Node-Toolchainabweichung verhindert weiterhin nur den
  Top-Level-Toolchain-Check; sie ist keine durch diesen Slice verursachte
  Codeabweichung.

## Empfohlener naechster Schritt

Der Main Agent prueft diesen Handoff und den Commit. Danach darf ausschliesslich
der Frontend-Brand-Schritt die getrennten App-/Website-Projektionen auf Basis
der exportierten Domainfunktionen implementieren. Anschliessend folgt
unabhaengige QA; kein eigener Folgefeature- oder Releasepfad.

## WRN-AGENT-STATUS

- Task: WRN-G3-008 Contract, lokale Fixture und reine Aufloesungsdomain
- Status: GREEN
- Quellstand: `5d01d77`
- Erledigt: additiver Lifecyclevertrag, Hashbindung, fail-closed Loader,
  Revocationvorrang, Archivprojektion, kanonische Sharezielbildung und Tests
- Tests: Typechecks PASS; 51 betroffene Unit-Tests PASS; vollstaendige
  nachgelagerte Hauptchecks und beide Builds PASS; nur Top-Level-Toolchain-Gate
  wegen registriertem Node-Mismatch nicht ausfuehrbar
- Offen: getrennte App-/Website-Projektionen und unabhaengige QA
- Handoff: `docs/handoffs/WRN-G3-008-contract-domain.md`
- Naechster Schritt: gesicherter Main-Agent-Handoff, danach Frontend Brand
- END-CHECK: :)
