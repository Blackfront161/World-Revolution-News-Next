# Agent Handoff

- Agent: g3_001_frontend_foundation
- Task-ID: WRN-G3-001
- Ergebnis: teilweise

## Kurzfazit

Die lokale Frontend-Foundation besteht aus zwei getrennten React-/TypeScript-
Shells: einer mobilen Capacitor-Vertragsshell und einer responsiven Website.
Beide konsumieren ausschliesslich die plattformneutralen Pakete
`@wrn/domain` und `@wrn/brand-tokens`; sie importieren einander nicht. Die
Oberflaechen zeigen nur neutrale lokale Preview-Zustaende und enthalten weder
Legacycode noch Markenassets, echte Inhalte oder Remotezugriffe.

Die Erzeugung eines nativen Android-Ordners wurde bewusst nicht ausgefuehrt.
Der Capacitor-Vertrag benennt `com.world.revolution` und `dist`, wie im Task
Brief verlangt.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/tasks/WRN-G3-001-FIRST-CODE-READINESS.md`
- `docs/architecture/ADR-001-REPOSITORY-AND-PACKAGE-STRUCTURE.md`
- `docs/architecture/ADR-002-CLIENT-STACK.md`
- `docs/architecture/ADR-003-DESIGN-AND-BRAND-SYSTEM.md`
- `docs/architecture/ADR-009-QA-CI-CD-AND-RELEASE.md`
- `docs/templates/AGENT-HANDOFF.md`

## Geaenderte Dateien

- `apps/mobile/**`: eigenstaendige Vite-/React-Shell, Capacitor-Vertrag,
  app-lokales Layout, Zustands- und Accessibilitytests.
- `apps/website/**`: eigenstaendige Vite-/React-Shell, responsive
  Website-Navigation, Zustands- und Accessibilitytests.
- `packages/brand-tokens/**`: neutrale semantische Tokens und Theme-CSS ohne
  Logo, Schriftdatei oder sonstiges Markenasset.
- `docs/handoffs/WRN-G3-001-frontend-foundation.md`: diese Uebergabe.

## Tests und Belege

- `git diff --check -- apps/mobile apps/website packages/brand-tokens`:
  bestanden.
- Die drei Paketmanifeste wurden mit PowerShell `ConvertFrom-Json` gelesen:
  bestanden.
- Nach Root-Typecheck: `state.charAt(0)` statt des unter
  `noUncheckedIndexedAccess` unsicheren Indexzugriffs verwendet und Vite-CSS-
  Deklarationen pro App ergänzt. Die anschliessenden lokalen Toolchain-Checks
  werden in dieser Uebergabe nachgetragen.
- Bei der ersten Unit-Testausfuehrung wurde fehlendes DOM-Cleanup zwischen
  Testfaellen erkannt. Beide app-lokalen Test-Setups registrieren deshalb
  explizit `afterEach(cleanup)`; das ist eine Testisolation, keine
  Produktverhaltensaenderung.
- Statische Sichtpruefung: keine gegenseitigen Appimporte; alle gemeinsamen
  Importe gehen nur an `@wrn/domain` und `@wrn/brand-tokens`.
- Geplante Unit-Tests: `apps/mobile/src/App.test.tsx` und
  `apps/website/src/App.test.tsx` pruefen Landmarken, semantische Zustaende
  und Tastaturaktivierung sowie dynamische Theme-Wechselziele und
  `aria-busy` im Loading-Zustand.
- Nicht ausgefuehrt: Typecheck, Vitest, Vite-Build und Screenshot-Smokes.
  Dieser Zwischenstand ist durch die nachfolgenden Toolchain-Ergebnisse
  ueberholt.
- Nach genehmigter lokaler Toolchain: `pnpm --filter @wrn/mobile typecheck`
  und `pnpm --filter @wrn/website typecheck`: bestanden.
- Nach genehmigter lokaler Toolchain: beide app-lokalen `test:unit`-Laeufe:
  je 3 von 3 Tests bestanden.
- Nach genehmigter lokaler Toolchain: beide app-lokalen `build`-Laeufe:
  bestanden. Mobile-Output: JavaScript 193.10 kB / gzip 60.89 kB; Website-
  Output: JavaScript 193.71 kB / gzip 61.02 kB. Dies sind Foundation-
  Messwerte, keine freigegebenen Produktbudgets.
- Nicht ausgefuehrt: Screenshot-/Browser-E2E-Smokes. Sie bleiben ein
  separates QA-Gate mit Browserbinary und unabhaengigem Review.
- Nach Playwright-Viewport-Smoke: Ein 404-Konsolenbefund je Shell war auf den
  automatischen Request nach `/favicon.ico` zurueckzufuehren. Beide
  `index.html` deklarieren deshalb das neutrale leere Data-Icon `data:,`;
  kein Asset wurde importiert. Die anschliessenden Mobile- und Website-
  Rebuilds bestanden.

## Feststellungen nach Prioritaet

- High: Keine direkte technische Abweichung in meinem Scope.
- Medium: Die visuelle Matrix, 200-%-Reflow im Browser und Touchzielmasse
  sind im CSS vorgesehen, aber noch nicht mit Browser-Screenshots belegt.
- Low: Die Foundation verwendet bewusst Systemschrift und neutrale Farben.
  Das ist kein Marken-/Paritaetsversprechen und muss im spaeteren
  Rechte-/Visualtask ersetzt beziehungsweise freigegeben werden.

## Annahmen und offene Fragen

- `@wrn/domain` exportiert den nun vorhandenen Vertrag `ShellState` und
  `parseShellState(value)`. Queryparameter werden mit
  `URLSearchParams(...).get("state")` gelesen und bei unbekannten Werten
  fail-closed auf `ready` gesetzt.
- Die Root-Toolchain stellt die im Task Brief festgelegten React-, Vite-,
  Vitest-, Testing-Library- und jsdom-Versionen fuer die bestandenen
  app-lokalen Checks bereit.

## Restrisiken

- Screenshot- und Browser-A11y-Evidenz fehlen noch; diese Foundationtests
  decken semantische Landmarken und Tastaturaktivierung ab, nicht die volle
  visuelle Matrix.
- Es gibt bewusst keine Android-Plattformartefakte; deren Generierung und
  Geraetetest brauchen einen spaeteren, einzeln freigegebenen Task.

## Empfohlener naechster Schritt

Im eigenen QA-Paket die vereinbarte Screenshot-/Browser-E2E-Matrix mit
getrennten Mobile-/Website-Viewports ausfuehren und unabhaengig bewerten;
kein Deployment, keine Signierung und kein Remotezugriff.

## WRN-AGENT-STATUS

- Task: WRN-G3-001 Frontend Foundation
- Status: YELLOW
- Quellstand: Produktcharter, Source-of-Truth, Zielarchitektur,
  Qualitaetsregeln, Task Brief und ADR-001/002/003/009 gelesen
- Erledigt: getrennte Mobile-/Website-Shells, lokale Zustaende, neutraler
  Tokenverbrauch, Capacitor-Vertrag, Unit-Testquellen, dynamische
  Theme-Wechselziele und Loading-`aria-busy`
- Tests: Whitespace-Diff und JSON-Manifeste bestanden; beide Typechecks,
  beide Unit-Testlaeufe (je 3/3) und beide Vite-Builds bestanden
- Offen: Screenshot-/Browser-E2E-Ausfuehrung und unabhaengiger QA-Review
- Handoff: `docs/handoffs/WRN-G3-001-frontend-foundation.md`
- Naechster Schritt: Screenshot-/Browser-E2E-Matrix im eigenen QA-Paket
  ausfuehren und unabhaengig bewerten
- END-CHECK: :)
