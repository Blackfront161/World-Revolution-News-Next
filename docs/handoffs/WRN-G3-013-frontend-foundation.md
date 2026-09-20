# WRN-G3-013 – Frontend-Sprachfundament Handoff

- Agent: Frontend Brand Engineer
- Task-ID: WRN-G3-013
- Ergebnis: bestanden / GREEN-Fundament
- Produktcheckpoint: `d5d3417` + Katalogfehlerkorrektur `a0de01f`

## Kurzfazit

Das englische Fundament ist vollständig abgeschlossen. `@wrn/ui-language`
bindet die neun erlaubten IDs `en`, `de`, `es`, `fr`, `it`, `pt`, `ru`, `el`
und `tr`, registriert und zeigt aber bewusst ausschließlich `en`. Sein
typisierter englischer Keyset umfasst alle dynamischen Shell-, Navigation-,
Formular-, Status-, Dialog-, Fehler-, Offline- und Accessibilitytexte beider
Clients. Artikel, Quellen, Titel, Metadaten und Fixtures wurden nicht geändert.

Mobile und Website beziehen ihre dynamische Shellkopie quellnah aus diesem
Katalog. Beide nutzen ein natives mindestens 44 x 44 Pixel großes Headerselect,
setzen `html[lang="en"]` und `dir="ltr"`, und besitzen getrennte sichere
Preferenceadapter. Fehlende, ungültige, nicht lesbare oder noch nicht
registrierte Werte fallen auf Englisch zurück, ohne den Rohwert zu verändern.
Ein fehlgeschlagenes `setItem` meldet keinen falschen Persistenzerfolg.

## Verwendete Quellen

- `AGENTS.md`
- `docs/tasks/WRN-G3-013-HEADER-UI-LANGUAGE-PREFERENCE.md`
- `docs/evidence/WRN-G3-013-UI-LANGUAGE-PARITY-AND-ACCEPTANCE-PLAN.md`
- der übernommene uncommittete WIP und die bestehenden getrennten Theme- und
  Reading-State-Adapter beider Clients

## Geaenderte Dateien

- `packages/ui-language/package.json`, `tsconfig.json`, `src/index.ts` und
  `src/index.test.ts`: typisierter Sprachvertrag, vollständiger englischer
  Katalog, EN-only-Registry und Contracttests.
- `apps/mobile/src/ui-language-preference.ts` und `.test.ts`: separater Key
  `wrn.mobile-ui-language.v1` und fail-closed Persistenzvertrag.
- `apps/website/src/ui-language-preference.ts` und `.test.ts`: separater Key
  `wrn.website-ui-language.v1` und gleicher Vertrag.
- `apps/mobile/src/App.tsx`, `App.test.tsx`, `styles.css` sowie
  `apps/website/src/App.tsx`, `App.test.tsx`, `styles.css`: katalogisierte
  Shellprojektionen, EN-Auswahl, Sprache/Schriftrichtung und Abdeckung der
  Hauptbereiche.
- die beiden Client-`package.json` und `pnpm-lock.yaml`: Workspacebindung an
  `@wrn/ui-language`.

## Tests und Belege

- PASS: Node `24.19.0` und pnpm `11.19.0`; der gesperrte Workspace-Link wurde
  mit `CI=1 pnpm install --frozen-lockfile` reproduzierbar hergestellt.
- PASS: `pnpm run format`, `pnpm run lint`, `pnpm run check:boundaries` (19).
- PASS: `pnpm run typecheck` (8 Workspace-Projekte).
- PASS: `pnpm run test:unit`: 148 Tests insgesamt: UI-Sprachpaket 3,
  Content-Contracts 19, Domain 29, API-Contracts 4, Mobile 38, Website 35,
  statische Website-Integration 8, Test-Support 20.
- PASS: `pnpm run build`: Mobile- und Website-Build einschließlich der drei
  unveränderten statischen Landingpages.
- PASS: `git diff --check` und anschließender enger Scopecheck.
- Noch nicht begonnen, absichtlich: Browser-, Screenshot- und
  Neunsprachen-Visualmatrix. Der Acceptance-Plan ordnet sie dem vollständigen
  Neunsprachenstand nach den acht Katalogen zu; eine EN-only-Matrix wäre kein
  ehrlicher Ersatz.

## Feststellungen nach Prioritaet

- Keine Blocker, Highs, Mediums oder Lows im englischen Fundament.
- Bei Reader- und Archivfehlern wird kein möglicherweise anderssprachiger
  Domain-Rohtext mehr als Shellfehler ausgegeben; die Anzeige nutzt den
  englischen Katalog.

## Annahmen und offene Fragen

- `registeredUiLanguages` bleibt exakt bei `en`, bis die Kataloge vollständig
  vorliegen und erst die nachfolgende Integrationsinstanz sie registriert.
- Für die anschließenden Spark-Mikroaufgaben sind ausschließlich diese
  disjunkten, noch nicht existierenden Pfade reserviert:
  `packages/ui-language/src/catalogs/de.ts`, `es.ts`, `fr.ts`;
  `it.ts`, `pt.ts`, `tr.ts`; `ru.ts`, `el.ts`. Sie dürfen keine Client-,
  Adapter-, Registry- oder Testdateien berühren.

## Restrisiken

- Das GREEN-Fundament ist absichtlich kein kompletter
  Neunsprachen-Produktkandidat: acht Kataloge, ihre Registrierung, die
  anschließende Integrationsprüfung und die unabhängigen Security-/Visual-
  Reviews folgen gemäß Phasenvertrag.
- Es wurden keine externen Dienste, Cookies, Remoteaufrufe, Cache/Service
  Worker, Android-, CI- oder Deploymentpfade berührt.

## Empfohlener naechster Schritt

Nach diesem gesicherten Fundamentcheckpoint können ausschließlich die drei
vertraglich getrennten Spark-Kataloggruppen erstellt werden. Danach folgt eine
frische Frontendintegrationsinstanz für Registrierung, vollständige
Neunsprachenmatrix und Produktkandidat; anschließend die vorgeschriebenen
read-only Security- und Visual-Reviews.

## WRN-AGENT-STATUS

- Task: WRN-G3-013 Frontend-Sprachfundament
- Status: GREEN
- Quellstand: `a0de01f` (Fundament `d5d3417`)
- Erledigt: vollständiger EN-Keyset und Routing beider Clients, EN-only-Select,
  getrennte sichere Keys, lokale Sprach-/Richtungsprojektion und Tests.
- Tests: Format, Lint, 19 Boundaries, 8 Typechecks, 148 Unit-/Contract-/
  Komponententests und beide Builds PASS.
- Offen: ausschließlich acht reservierte Katalogdateien, deren spätere
  Registrierung/Integration und die vertraglich nachgelagerte Browsermatrix
  sowie unabhängige Reviews.
- Handoff: `docs/handoffs/WRN-G3-013-frontend-foundation.md`
- Naechster Schritt: nur Spark-Kataloggruppen nach Main-Agent-Steuerung.
- END-CHECK: :)
