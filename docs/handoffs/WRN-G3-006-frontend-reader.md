# Agent Handoff

- Agent: Frontend Brand Engineer – WRN-G3-006 Reader
- Task-ID: `WRN-G3-006`
- Ergebnis: bestanden

## Kurzfazit

Der lokale Reader ist getrennt fuer Mobile und Website umgesetzt. Beide Clients
verwenden ausschliesslich den bereits GREEN validierten G3-006-Readerdetail-
Loader und die gemeinsame, reine Domainfunktion `resolveLocalReaderState`.
Mobile nutzt `#article/<id>`, die Website nutzt `?article=<id>`; beide zeigen
sichere Textbloecke, Artikelrecord-Metadaten, ehrliche Fehlerzustaende,
Rueckkehrfokus und eine zweistufige externe Quellenbestaetigung.

## Verwendete Quellen

- `AGENTS.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/tasks/WRN-G3-006-LOCAL-ARTICLE-READER.md`
- `docs/handoffs/WRN-G3-006-contract-domain-fixture.md`
- `docs/templates/AGENT-HANDOFF.md`
- vorhandene lokale App-/Website-Shells, Readerdomain und Test-Support im
  neuen Zielrepository

## Geaenderte Dateien

### Mobile

- `apps/mobile/src/App.tsx`
- `apps/mobile/src/styles.css`
- `apps/mobile/src/App.test.tsx`

### Website

- `apps/website/src/App.tsx`
- `apps/website/src/styles.css`
- `apps/website/src/App.test.tsx`

### Browser-E2E

- `tests/e2e/foundation.spec.ts`

Keine Contract-, Domain-, Fixture-, Rootkonfigurations-, Dependency-,
Lockfile-, Legacy- oder Live-Datei wurde geaendert.

## Umgesetztes Verhalten

- Jede lokale Start- und Discoverkarte besitzt genau einen sichtbaren Einstieg
  `Artikel lesen`.
- Der Reader rendert ausschliesslich die bereits validierten Paragraph-,
  Heading-, Quote- und Listbloecke als React-Text, niemals HTML oder Markdown.
- Quelle, Datum, Sprache und Themen kommen nur aus `LocalArticle`.
- Mobile-Hash- und Website-Queryroute funktionieren bei Kaltstart und Refresh.
- Sichtbares Zurueck, Escape sowie Browser Zurueck/Vorwaerts nutzen keine
  Historyschleife. Nach einem normalen Rueckweg erhaelt der exakte Ausloeser
  wieder Fokus; ein direkter Einstieg geht ehrlich zu Start zurueck.
- Reader-History-State bewahrt lokale Herkunft und Ausloeser ueber Browser
  Zurueck/Vorwaerts. Ein von Entdecken geoeffneter Reader kehrt daher auch
  nach Vorwaerts und sichtbarem Zurueck zu Entdecken und zum exakten
  `Artikel lesen`-Ausloeser zurueck.
- Loading, Integritaetsfehler und Unknown-ID sind klar benannt und zeigen
  keinen Teaserfallback. Offline bleibt mit validierter Fixture lesbar.
- Die Originalquelle oeffnet sich niemals automatisch. Erst eine zweite
  bewusste Aktion im Dialog exponiert den sicheren externen Link mit
  `target=_blank`, `noopener noreferrer` und `referrerpolicy=no-referrer`.
  Escape oder Abbrechen stellt den Fokus auf die Quellenaktion zurueck. Die
  Tastatur-Fokusfalle schliesst Tab und Shift+Tab robust zwischen Abbrechen
  und dem bewussten externen Link ein.
- Navigation, getrennte responsive Clientlayouts, Hell/Dunkel und
  44-Pixel-Ziele bleiben erhalten.

## Tests und Belege

Bestanden am 24. August 2026:

- Mobile Unit: 17/17
- Website Unit: 17/17
- `pnpm.cmd run lint` mit allen 16 Boundary-/Provenance-/Brand-/Previewtests
- `pnpm.cmd run typecheck`
- `pnpm.cmd run format`
- `pnpm.cmd run build` fuer Mobile und Website
- `git diff --check`
- gezielte Browser-E2E: 4/4 fuer App/Website, Readerroute, Refresh,
  Browser-Zurueck/Vorwaerts, Discover-Rueckkehr mit exaktem Fokus,
  sichtbares Zurueck ohne Historyloop, Quellenbestaetigung samt
  Tab/Shift+Tab-Fokusfalle, sichere Attribute, null externe Requests,
  Unknown-ID und Overflow/Touch-Ziele
- vollständiger Playwrightlauf unter der bereitgestellten lokalen
  Node-24.19-/pnpm-11.19-Toolchain: 36 bestanden, 76 bewusst projektspezifisch
  übersprungen, Exitcode 0. Die gezielten Reader-E2E bleiben die präzise,
  wiederholbare Detailbelegung.
- regulärer `pnpm run check` unter Node `24.19.0` und pnpm `11.19.0`
  vollständig bestanden.

Die Standard-Shell liefert Node `24.16.0`; fuer den verbindlichen Lauf wurde
nur pro Prozess der bereits gebündelte lokale Node-24.19-Pfad vorangestellt.
Es wurde weder eine Dependency installiert noch eine Konfiguration verändert.

## Feststellungen nach Prioritaet

- Keine bekannten Produkt-, Datenschutz-, Security- oder Scopeblocker im
  Frontendbereich.
- Die doppelten Readeransichten sind bewusst: Mobile und Website haben
  getrennte Routen, Navigation und responsive Layouts. Gemeinsame fachliche
  Logik bleibt im bestehenden Domain-/Fixturekern; ein vorgezogener
  UI-Shared-Package-Refactor waere ausserhalb des freigegebenen Scopes.

## Annahmen und offene Fragen

- Die drei selbst erstellten lokalen Fixtures sind ausschliesslich ein
  Readerkernbeleg und keine echte Inhalts- oder Medienquelle.
- Die visuelle Matrix, beschriftete Screenshots und der unabhängige
  Accessibility-/Browserreview folgen ausschliesslich im QA-Schritt.

## Restrisiken

- Die Standard-Shell hat weiterhin eine ältere Node-Version. Die verbindliche
  Checkkette ist jedoch mit der bereits bereitgestellten Node-24.19-Toolchain
  gruen; künftige QA-Läufe müssen denselben gebündelten Runtimepfad verwenden.
- Es wurden absichtlich keine SEO-, Share-, Persistenz-, Uebersetzungs-,
  Medien-, Android- oder Liveaktionen implementiert.

## Empfohlener naechster Schritt

Main Agent sichert den Frontendkandidaten als Checkpoint. Danach darf nur die
unabhaengige QA den G3-006-Task-Brief, Diff, automatischen Checks, die gesamte
visuelle Matrix und die Toolchainabweichung bewerten. Keine automatische
Folgefunktion oder Deploymentaktion.

## WRN-AGENT-STATUS

- Task: WRN-G3-006 getrennte Mobile-/Website-Readeransichten
- Status: GREEN
- Quellstand: `codex/g3-006-local-reader`, Contractcheckpoint `678e6cf`
- Erledigt: lokale Readeransichten, Start-/Discover-Einstieg, Hash-/Queryroute,
  History/Fokus/Escape, sichere Textausgabe, Fehler-/Offlinezustaende,
  Quellenbestaetigung sowie Unit- und Browser-E2E
- Tests: Mobile 17/17, Website 17/17, Lint/Boundaries, Typecheck, Format,
  Builds, Diff-Check und gezielte Reader-E2E 4/4 bestanden
- Offen: unabhaengige QA, visuelle Matrix und Product-Owner-Abnahme
- Handoff: `docs/handoffs/WRN-G3-006-frontend-reader.md`
- Naechster Schritt: Main-Agent-Checkpoint, danach unabhängige QA
- END-CHECK: :)
