# Agent Handoff

- Agent: Frontend Brand Engineer (WRN-G3-008 App- und Website-Projektionen)
- Task-ID: WRN-G3-008
- Ergebnis: bestanden

## Kurzfazit

Der zweite und letzte schreibende Implementierungsschritt ist mit dem lokalen
Kandidaten `9affac8` abgeschlossen. Mobile App und Website projizieren die
bereits validierte G3-008-Fixture getrennt und ohne eigene Lifecycle- oder
Sharelogik: Unter `Mehr` ist ein kleines Archiv erreichbar; der historische
Testartikel ist lesbar und nur mit seiner kanonischen Website-URL teilbar.

Aliasaufrufe werden lokal auf die kanonische ID normalisiert. Gone, revoked,
unknown und invalid erhalten getrennte ruhige Statusseiten ohne Titel, Teaser,
Volltext, Quelle oder Shareaktion. Der Adapter fuer `Teilen` ist als App-Prop
injizierbar; der Standardadapter ist eine seiteneffektfreie lokale No-op-Stub.
Es gab keine Clipboard-, Native-Share-, Netzwerk-, Storage- oder
Service-Worker-Aktion.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/04-QUALITY-RULES.md`
- `docs/tasks/WRN-G3-008-ARCHIVE-LINK-LIFECYCLE.md`
- `docs/evidence/WRN-G3-008-ARCHIVE-LIFECYCLE-PARITY-AND-ACCEPTANCE-BRIEF.md`
- `docs/handoffs/WRN-G3-008-contract-domain.md`
- Contract-/Domain-/Fixture-Checkpoint `5d01d77`

## Geaenderte Dateien

### Mobile App

- `apps/mobile/src/App.tsx`
- `apps/mobile/src/App.test.tsx`
- `apps/mobile/src/styles.css`

### Website

- `apps/website/src/App.tsx`
- `apps/website/src/App.test.tsx`
- `apps/website/src/styles.css`

### Lokaler Flowtest

- `tests/e2e/foundation.spec.ts`

### Nicht geaendert

- `packages/**` (Contract, Domain und Fixture aus `5d01d77` unveraendert)
- Legacy-App, Legacy-Website, Contentrepository, Cloudflare, Hostinger und
  Google Play
- produktive Redirects/HTTP-410, Android-/Capacitor-Native-Share, Storage,
  Cache, Deployment und Remote/CI

## Tests und Belege

- Prettier PASS
- ESLint und alle Import-/Preview-/Fixture-/Asset-Boundarytests PASS
- alle Workspace-Typechecks PASS
- 74 Workspace-Unit-/Contract-/Komponententests PASS, davon 19 Mobile- und 19
  Website-Tests
- 16 Boundarytests PASS
- Fixture-Provenienz und Markenassetcheck PASS
- beide Builds PASS
- gezielter lokaler Browserflow `local archive lifecycle ...`: 2 PASS
  (Mobile 390 x 844 und Website 390 x 844), 5 erwartete Viewport-Skips
- `git diff --check` PASS

`pnpm run check` ist weiterhin nur am bereits registrierten Toolchaingate
gestoppt: Node `24.16.0` aktiv, genau `24.19.0` verlangt. Die nachgelagerten
Format-, Lint-, Typ-, Boundary-, Fixture-, Asset-, Unit- und Buildchecks wurden
einzeln vollstaendig ausgefuehrt und bestanden. Weder Toolchain noch
Dependencies wurden veraendert.

## Feststellungen nach Prioritaet

### Kein offener Blocker im Frontendscope

- App und Website rufen ausschliesslich die exportierte validierte Fixture und
  Domainfunktionen auf; keine Resolver-, Alias- oder Share-URL-Regel wurde im
  Client dupliziert.
- Der sichtbare Aliaszustand wird per History-Replacement auf die kanonische
  lokale Route normalisiert, ohne einen Redirectloop zu erzeugen.
- Für alle Nichtverfuegbar-Zustaende existiert kein Readerpayload und keine
  Teilaktion.
- Zurueck und Escape kehren aus Archiv, Reader und Nichtverfuegbar-Zustaenden
  ehrlich nach `Mehr` beziehungsweise in den vorherigen lokalen Verlauf zurueck.

## Annahmen und offene Fragen

- Die zwei englischen Texte, IDs und Quellenbezeichnungen bleiben ausschliesslich
  selbst erstellte lokale Testdaten; sie behaupten keine historische Zuordnung.
- Der lokale Share-Stub bestaetigt nur die bereitgestellte kanonische URL.
  Browser-Web-Share und Android-Native-Share bleiben explizit nicht implementiert.

## Restrisiken

- Die unabhaengige QA muss noch die vollständige Lifecycle-/Accessibility-/
  Reflow-/Konsolen-/Request-/Storagematrix sowie die verbindlichen beschrifteten
  Screenshots durchführen.
- Produktive 935-ID-Migration, HTTP-Redirects/410, Hosting, Cache-Purge und
  Revocation aus Offlinecaches bleiben ausserhalb des Slices.
- Das Node-24.16-vs-24.19-Top-Level-Gate bleibt ein bekannter, nicht von diesem
  Commit verursachter Toolchainrestpunkt.

## Empfohlener naechster Schritt

Der Main Agent prüft Commit `9affac8` und diesen Handoff. Danach darf nur die
unabhaengige QA die G3-008-Test- und visuelle Evidenzmatrix ausführen. Kein
Folgefeature, keine echte Datenmigration und keine Releaseaktion starten.

## WRN-AGENT-STATUS

- Task: WRN-G3-008 getrennte App-/Website-Projektionen
- Status: GREEN
- Quellstand: `9affac8`
- Erledigt: lokales Archiv unter Mehr, historischer Reader, Aliasnormalisierung,
  payloadfreie Nichtverfuegbar-Zustaende, injizierbarer lokaler Shareadapter,
  History-/Escape-/Fokuspfade sowie gezielte Tests
- Tests: Format/Lint/Boundary/Typen/Fixture/Assets/74 Tests/beide Builds und
  2 gezielte Browser-PASS; nur bekanntes Node-Top-Level-Gate nicht erfuellt
- Offen: unabhaengige QA und anschliessende sichtbare Product-Owner-Abnahme
- Handoff: `docs/handoffs/WRN-G3-008-frontend.md`
- Naechster Schritt: unabhaengige QA nach Main-Agent-Pruefung
- END-CHECK: :)
