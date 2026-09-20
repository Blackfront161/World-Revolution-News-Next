# Agent Handoff

- Agent: WRN-G3-005 Frontend-/Domain-Implementierungsowner
- Task-ID: WRN-G3-005
- Ergebnis: bestanden – technische Implementierung fuer unabhaengige QA bereit

## Kurzfazit

`Entdecken` ist in beiden getrennten Clients eine rein lokale Such- und
Filteransicht. Ein neuer separater Discover-Index v1 liefert ausschliesslich
selbst erstellte Region-, Themen- und Formatklassifikationen. Er wird mit
Schema, SHA-256 und exakter Artikel-ID-Menge gegen genau die Artikelrecords des
jeweils injizierten Loaders fail-closed validiert. Das bestehende
Artikel-/Manifest-v1-Schema wurde nicht erweitert oder umgeschrieben.

Die Domainlogik ist DOM-, Storage-, Uhrzeit-, Zufalls- und netzwerkfrei:
NFKC, Leerzeichenkollaps, Kleinschreibung, Teilstrings und Mehrwort-AND sind
deterministisch. Die Ergebnisreihenfolge folgt ausschliesslich der schon
manifestgebundenen Feedreihenfolge. App und Website behalten eigene
Oberflaechen; sie teilen nur den fachlichen Vertrag.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/tasks/WRN-G3-005-DISCOVER-LOCAL-SEARCH-FILTERS.md`
- `docs/evidence/WRN-G3-005-DISCOVER-PARITY-BRIEF.md`
- `docs/templates/AGENT-HANDOFF.md`
- Bestehende lokale G3-002/G3-004-Contracts, Fixture-, Client- und E2E-Tests

Die Legacy-App und die Legacy-Website wurden nicht verändert. Beide
Arbeitsbäume waren beim Abschluss sauber auf `main...origin/main`.

## Geaenderte Dateien

- `packages/content-contracts/src/index.ts`
- `packages/content-contracts/tests/manifest-v1.test.ts`
- `packages/domain/src/index.ts`
- `packages/domain/tests/shell-state.test.ts`
- `packages/test-support/fixtures/wrn-g3-005/discover-index.json`
- `packages/test-support/src/index.ts`
- `packages/test-support/tests/shell-state-fixtures.test.ts`
- `apps/mobile/src/App.tsx`, `App.test.tsx`, `styles.css`
- `apps/website/src/App.tsx`, `App.test.tsx`, `styles.css`
- `tests/e2e/foundation.spec.ts`
- dieser Handoff

## Such- und Facettenvertrag

- Suchfelder: Titel, Teaser, sichtbarer Quellenname, explizite Region,
  explizite Themen und sichtbares Format.
- Suche: NFKC, trimmen, Leerzeichenkollaps, Kleinschreibung; jeder nichtleere
  Suchterm muss als Teilstring in mindestens einem erlaubten Feld vorkommen.
- Facetten: eine Auswahl oder Alle fuer Region, Thema, Quelle,
  Originalsprache und Format; alle Kriterien gelten mit AND.
- Indexwerte: `Europa`/`Nordamerika`/`Lateinamerika`, selbst erstellte Themen
  und `news`/`analysis`/`commentary`. Zulässige, aber in diesem Dreierfixture
  nicht belegte Formatwerte bleiben als Vertragsmenge zugelassen.
- Sprache bleibt autoritativ im Artikelrecord. `und` wird als `Unbekannt`
  angezeigt und nie geraten.
- Suchtext und Filter existieren nur im React-Arbeitsspeicher. Es gibt keine
  URL-Parameter, Local-Storage-, Telemetrie- oder Netzwerknutzung.
- Ein mismatch- oder manipuliertes Loaderfixture führt zu einem benannten
  Discover-Fehlerzustand, nie zu einem Renderthrow oder unechten Treffern.
- Loading, Error, Empty und Optional-absent haben unter `Entdecken` eine echte
  Überschrift und Statusmeldung. Der frühere Migrationsplatzhalter erscheint
  dort nicht mehr; Offline bleibt mit einem validierten lokalen Fixture nutzbar.

## Tests und Belege

- `pnpm typecheck`: GREEN, alle 7 Workspace-Pakete/Clients
- `pnpm format`: GREEN
- `pnpm lint`: GREEN
- Boundary-/Provenance-/Local-preview-/Brand-Checks: 16/16 GREEN
- `pnpm test:unit`: 61/61 GREEN
  - Content contracts 8, Domain 12, API contracts 4, Test support 7,
    Mobile 15, Website 15
- `pnpm build`: beide Produktionsbuilds GREEN
- vollständige lokale Browsermatrix (98 definierte Projekt-/Testfälle) ohne
  gemeldeten Fehler abgeschlossen; die vorgesehenen Viewport-Skips blieben
  Skips. Der neue Browserflow prüft Suche plus Facette, Reset, Fokus, URL- und
  Local-/Session-Storage-Negativbedingungen sowie keine externen Requests in
  App und Website bei 390 Pixeln.
- `git diff --check`: GREEN

Main-Review-Korrektur: Ein zunächst ergänzter Mobile-Test importierte
`@wrn/test-support` direkt. Die bestehende Local-preview-Boundary erlaubt
diesen Import nur in `apps/mobile/src/App.tsx`; der Testimport und die
davon abhängige Fixturekonstruktion wurden deshalb entfernt, ohne Boundary
oder Tooling zu lockern. Die produktive Loaderbindung bleibt durch die
test-support-API zentral validiert; Contract-/Fixture-/Domain-Gegenbelege
prüfen Hash- und exakte ID-Mengenabweichungen. Der bereits bestehende
Clienttest eines abgelehnten Integritätsloaders belegt den ehrlichen
Fehlerzustand.

Toolchain-Hinweis: Ein erster Aufruf von `pnpm run check` nutzte über den
Wrapper versehentlich Node 24.16 und wurde korrekt durch die Toolchain-Prüfung
gestoppt. Der finale vollständige Check lief danach mit dem gebündelten
Node 24.19.0 und pnpm 11.19.0 explizit im `PATH` vollständig GREEN.

Die geforderten visuellen Kontaktboegen und eine unabhaengige visuelle
Bewertung wurden absichtlich nicht erzeugt. Sie gehoeren zum nachfolgenden
QA-Auftrag, nicht zu diesem Implementierungspaket.

## Feststellungen nach Prioritaet

- Blocker: keine bekannten
- High: keine bekannten
- Medium: keine bekannten
- Low: Die lokale Fixture ist absichtlich klein; sie demonstriert nicht jeden
  erlaubten Formatwert mit einem sichtbaren Artikel. Das ist kein
  Produktionsdaten- oder API-Versprechen und bleibt im schriftlichen Scope.

## Annahmen und offene Fragen

- Die in der Taskvorbereitung festgelegte Einzelwahl je Facette wurde exakt
  umgesetzt; Mehrfachauswahl, Sortierung, Zeitraum und Archive bleiben
  ausgeschlossen.
- Bestehende Vorschau-Zustandsbuttons bleiben fuer die bereits vorhandene
  lokale Testmatrix erhalten. Im expliziten Offline-Zustand kann ein bereits
  validiertes lokales Discover-Fixture weiter benutzt werden.

## Restrisiken

- Die selbst erstellten Klassifikationen sind nur Testdaten. Eine spätere
  Anbindung echter Inhalte verlangt einen neuen, versionierten Datenrelease-
  und Redaktionsfreigabe-Task.
- Visuelle Qualität bei sämtlichen geforderten Viewports/Themes/Reflow und
  die vollstaendige Accessibility-/Requestprüfung benötigen weiterhin die
  unabhängige QA; keine automatische Product-Owner-Freigabe ist daraus
  abzuleiten.

## Empfohlener naechster Schritt

Unabhaengige WRN-G3-005-QA ausschliesslich gegen diesen Arbeitsstand:
vollstaendige Browser-/Axe-/Reflow-/Screenshotmatrix, Konsolen- und
Requestpruefung sowie Scope-/Diffreview. Erst danach ein Produktkandidat und
visuelle Product-Owner-Abnahme vorbereiten.

## WRN-AGENT-STATUS

- Task: WRN-G3-005 lokale Suche und Filter
- Status: GREEN
- Quellstand: `codex/g3-005-discover-search`, Ausgangspunkt
  `c47a33c83797` (Vorbereitung); kein Commit durch diesen Agenten
- Erledigt: separater Discover-Index, fail-closed Contract, reine Domainlogik,
  getrennte App-/Website-Ansichten, Unit-/Client-/Browsertests
- Tests: Format, Lint, 16 Boundarychecks, 61 Unit-/Komponententests, beide
  Builds und lokale Browsermatrix GREEN
- Offen: unabhängige QA, visuelle Evidenz und Product-Owner-Abnahme
- Handoff: `docs/handoffs/WRN-G3-005-implementation.md`
- Naechster Schritt: unabhaengige QA starten; keine Folgefunktion implementieren
- END-CHECK: :)
