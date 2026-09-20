# Agent Handoff

- Agent: Frontend Navigation Engineer
- Task-ID: WRN-G3-004
- Ergebnis: bestanden

## Kurzfazit

Der lokale Navigations-Slice ist innerhalb des freigegebenen Bereichs
implementiert. App und Website verwenden denselben kleinen, clientneutralen
Zielkatalog, besitzen jedoch bewusst getrennte Navigationen und Layouts.
`Start` behaelt den bestehenden lokalen Feed. Alle anderen sichtbaren Ziele
melden ehrlich `Noch nicht migriert`, nennen ihren Folgeslice und haben einen
Rueckweg zu `Start`.

### Korrekturrunde nach unabhängiger QA `7ab895a`

Die roten QA-Belege zum Kandidaten `206e758` blieben unveraendert. Diese
Produktkorrektur schliesst nur die drei dokumentierten Befunde: Die Website-
Kompaktnavigation nutzt jetzt intrinsisch ausreichend breite, umbrechende
Ziele; Header-/Panelkomposition sind bei 200-Prozent-Reflow min-width- und
box-sizing-sicher; und die mobile Hauptnavigation ist als untere
App-Shell-Navigation unterhalb eines eigenen scrollbaren Inhaltsbereichs
verankert. Mobile Ziele behalten vollstaendige, nicht innerhalb eines Wortes
umgebrochene Beschriftungen und umbrechen als ganze 44-Pixel-Ziele. Es wurden
keine Inhalte, Datenquellen, externen Links oder Vertraege erweitert.

### Letzte Korrektur nach QA `5559f72` (M-002)

Die QA-Belege zum Kandidaten `31411d1` und alle vorangehenden roten Belege
blieben unveraendert. Die Website-Marke nutzt im kompakten Header jetzt
reflowfeste Bild-, Abstand- und Schriftgroessen; die Marken-Kopie darf ihre
Flexbreite wirklich verkleinern. Bei 390 CSS-Pixeln und 200-Prozent-
Rootschrift bleiben Marke und Marken-Kopie ohne internen Scrolloverflow,
vollstaendig beschriftet sowie von der Theme-Schaltflaeche getrennt. Die
kompakten Navigationstasten behalten eine feste 44-CSS-Pixel-Mindesthoehe,
damit die Headerhoehe nicht mit den `rem`-Tokens unnoetig anwächst. Die
Normalansicht bei 390 Pixeln bleibt vollstaendig und kompakt. Es gab keine
weitere Produktaenderung.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/architecture/ADR-001-REPOSITORY-AND-PACKAGE-STRUCTURE.md`
- `docs/architecture/ADR-002-CLIENT-STACK.md`
- `docs/architecture/ADR-003-DESIGN-AND-BRAND-SYSTEM.md`
- `docs/architecture/ADR-007-OFFLINE-AND-CACHE-CONTRACTS.md`
- `docs/architecture/ADR-009-QA-CI-CD-AND-RELEASE.md`
- `docs/tasks/WRN-G3-004-NAVIGATION-SHELL.md`
- `docs/evidence/WRN-G3-004-NAVIGATION-PARITY-BRIEF.md`

## Geaenderte Dateien

- `packages/domain/src/index.ts`: stabile Ziel-IDs, fail-closed Parser und
  reine App-/Websiteprojektionen ohne UI- oder Plattformimport.
- `packages/domain/tests/shell-state.test.ts`: Eindeutigkeit, Projektionen und
  fail-closed Verhalten des Zielkatalogs.
- `apps/mobile/src/App.tsx` und `styles.css`: fuenf geordnete primäre mobile
  Ziele als Bottom-Navigation, separater Mehr-/Hilfe-Zugang, lokaler Verlauf,
  Fokus und Zwischenansichten.
- `apps/mobile/src/App.test.tsx`: Reihenfolge, aktives Ziel, Fokus,
  Zwischenansicht, direkter Start und unbekannte ID.
- `apps/website/src/App.tsx` und `styles.css`: kompakte Websitegruppen unter
  1024 CSS-Pixel, erweiterte Desktopprojektion ab 1024 CSS-Pixel, explizites
  Mehr-Menue, lokaler Verlauf, Fokus und Zwischenansichten.
- `apps/website/src/App.test.tsx`: Gruppen, Mehr-Menue, Fokus und direkter
  Start sowie Rueck-/Vorwaertssynchronisierung des Menuezustands.
- `tests/e2e/foundation.spec.ts`: Browserverhalten fuer Navigation,
  Verlauf/Zurueck/Vorwaerts, Refresh, unbekannte IDs, Fokus und Mehr-Menue;
  zudem Labelrechtecke, Reflowzustände und Bottom-Navigation.

## Tests und Belege

Ausgefuehrt am 24. August 2026 mit der vorhandenen lokalen Toolchain
Node 24.19.0 und pnpm 11.19.0; keine Downloads oder externen Requests:

- `pnpm run check`: bestanden; 51 Unit-/Contracttests und 16 Boundarytests.
- `pnpm run build:mobile`: bestanden.
- `pnpm run build:website`: bestanden.
- `pnpm run test:e2e`: 30 bestanden, 61 erwartete
  projekt-/viewport-spezifische Ueberspruenge, 0 Fehler.
- Die erweiterten E2E pruefen sichtbare Zielreihenfolge, `aria-current`,
  44-px-Ziele, Fokuswechsel, Zwischenansichten, Zurueck/Vorwaerts, Refresh,
  unbekannte IDs, Reflow/Overflow und das lokale Mehr-Menue. Die neue
  datengetriebene Abdeckung prueft jedes sichtbare App-Tab sowie jede sichtbare
  kompakte oder erweiterte Websitegruppe mit aktivem Zustand und Zielansicht.
  Sie prueft zusaetzlich die intrinsischen, nicht ueberlappenden
  800-Pixel-Websitezielrechtecke, alle primaeren und sekundären
  390-Pixel-Reflowziele sowie die Bottom-Verankerung bei 320, 390, 844x390
  und 200-Prozent-Reflow. Fuer den mobilen Reflow prueft sie ausserdem den
  scrollbaren Inhaltsbereich und die sichtbare, vollstaendige Zielueberschrift
  nach Fokussierung; damit wird kein Overflow durch Clipping versteckt.
  Der Website-Reflowtest prueft zusaetzlich Marken- und Marken-Kopie-
  `scrollWidth`, sichtbaren vollstaendigen Markentext, Trennung von der
  Theme-Schaltflaeche, angemessene Headerhoehe und Dokumentoverflow; die
  Normalansicht bei 390 Pixeln ist separat abgesichert.

Keine Screenshots oder visuelle Abnahme erzeugt: das bleibt bewusst der
unabhaengigen QA gemaess Task Brief vorbehalten.

## Feststellungen nach Prioritaet

- Blocker: keine.
- High: keine.
- Medium: keine.
- Low: keine.

## Annahmen und offene Fragen

- Hashziele (`#home`, `#discover` usw.) sind der rein lokale Vorschauadapter.
  Sie sind keine zugesagte finale oeffentliche URL-/SEO-Struktur.
- Der Mehr-Menuezustand wird bei `popstate` und `hashchange` deterministisch
  aus dem aufgeloesten Ziel abgeleitet. Komponenten- und E2E-Regressionstests
  belegen `Mehr` -> Zurueck (geschlossen) -> Vorwaerts (offen).
- `Für mich`, `Gespeichert`, Medien, Suche, Hilfe und weitere Bereiche bleiben
  ausschliesslich ehrliche Zwischenansichten; es gibt keine neue Persistenz,
  Personalisierung, Datenquelle oder externe Laufzeitanfrage.

## Restrisiken

- Die geforderte vollständige visuelle Screenshotmatrix, insbesondere 1920
  Pixel und 200-Prozent-Reflow pro Zwischenziel, ist noch nicht von der
  unabhängigen QA erzeugt und bewertet. 1440 x 900 zeigt nun die erweiterte
  Websiteprojektion direkt, bei bestandenem kompaktem Header- und
  Overflow-Check.
- Die erneute unabhängige visuelle QA ist weiterhin erforderlich; dieser
  Implementierungsagent erzeugte bewusst keine Ersatz- oder Abschlussbelege.
- Browserhistory ist im lokalen Preview mit Hashadapter geprüft. Native
  Android-/Capacitor-Lifecycle-Prüfungen bleiben nach Task Brief gesperrt.

## Empfohlener naechster Schritt

Produktdiff auf den gemeinsamen Kandidatencheckpoint sichern; danach einen
unabhaengigen QA-Agenten nur lesend gegen Kandidat, Browsermatrix und
Screenshotanforderungen einsetzen. Keine Folgefunktion beginnen.

## WRN-AGENT-STATUS

- Task: WRN-G3-004 Frontend-Navigation
- Status: GREEN
- Quellstand: Ausgangs-HEAD `10d4f24`; final korrigierter Produktkandidat
  `3d89fbc05c5349aed4f7caff11099d40b26febb2`
- Erledigt: Zielkatalog, getrennte App-/Website-Navigation, lokale History,
  Fokus, Zwischenansichten und Tests innerhalb des Eigentumsbereichs
- Tests: `pnpm run check` (51 Unit-/Contract, 16 Boundary), beide Builds und
  `pnpm run test:e2e` (30 bestanden, 61 erwartete Skips) bestanden
- Offen: erneute unabhängige visuelle QA und Product-Owner-Abnahme
- Handoff: `docs/handoffs/WRN-G3-004-frontend-navigation.md`
- Naechster Schritt: Kandidat sichern und unabhängige QA starten
- END-CHECK: :)
