# Agent Handoff

- Agent: Frontend Brand Engineer
- Task-ID: WRN-G3-007 / Sequenz 2 Website-Komposition und Buildintegration
- Ergebnis: bestanden

## Kurzfazit

Der Website-Build erzeugt nun zusaetzlich zu der getrennten interaktiven
React-Website exakt drei lokale, statische Artikelseiten unter
`articles/<id>/index.html`, dazu Sitemap, Robots und das hash-/bytegebundene
Publikationsmanifest. Die statischen Seiten verwenden eine eigenstaendige,
responsive WRN-/Solinaridao-Komposition mit den bereits akzeptierten
semantischen Markenwerten, hellem/dunklem Systemtheme, vollstaendig lokalem
Readertext, Metadaten, sicherer externer Quelle und dem Same-ID-Link zum
interaktiven Website-Reader.

Der lokale Browsertest bedient das gebaute Websitepaket als strikte statische
Ausgabe: unbekannte Artikelpfade sind echte 404 und werden nicht in die
SPA-Startseite umgeschrieben. Beim Zurueckkehren vom interaktiven Reader wird
der klar bezeichnete Einstieg `Interaktiv lesen` wieder fokussiert. Die
Mobile-App, Legacy-Quellen, Live-Systeme und generierte Buildartefakte blieben
unveraendert.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/tasks/WRN-G3-007-STABLE-ARTICLE-LINKS-SEO.md`
- `docs/handoffs/WRN-G3-007-contract-publisher.md`
- bestehende Website-Komposition unter `apps/website/src/**`
- bereits akzeptierte `@wrn/brand-tokens`-Werte und lokale Assetregelung

## Geaenderte Dateien

### Website-Publisher und Build

- `apps/website/package.json`
- `apps/website/tools/generate-static-article-landings.mjs`
- `apps/website/tools/generate-static-article-landings.test.mjs`
- `apps/website/tools/integrate-static-article-landings.mjs`
- `apps/website/tools/integrate-static-article-landings.test.mjs`

Die statische Seite verwendet eine in den HTML-Ausgaben enthaltene,
deterministische CSS-Komposition. Ihre Werte spiegeln die vorhandenen
semantischen Brand-Tokens, weil eine statische Einzelseite nicht stabil auf den
hashbenannten Vite-Stylesheetpfad angewiesen sein darf. Sie enthaelt keine
externen Assets, Fonts, Tracker oder Requests.

### Browser-Integrationstests

- `tests/e2e/global-setup.ts`
- `tests/e2e/foundation.spec.ts`

Der Testserver baut die Website lokal, integriert die statischen Artefakte und
liefert sie ohne SPA-Fallback aus. Das ist reine Testinfrastruktur und kein
Hosting-, Apache- oder Deploymentcode.

## Tests und Belege

- Verbindliche lokale Toolchain: Node `24.19.0`, pnpm `11.19.0`
- `pnpm run check`: GREEN – 87 Unit-/Contract-/Komponententests und 16
  Boundary-/Provenienz-/Assettests bestanden; Format, Lint, Typen,
  Importgrenzen und `git diff --check` GREEN.
- `pnpm run build`: GREEN – Mobile- und Website-Build getrennt bestanden.
  Nur `apps/website/dist` enthaelt danach die drei Landingpages, Sitemap,
  Robots und Publikationsmanifest; `apps/mobile/dist` bleibt frei von
  G3-007-Artefakten.
- Voller Playwright-Lauf: GREEN – 41 PASS, 106 erwartete Skips, 0 Fehler.
  Der Lauf prueft das gebaute Websitepaket, die vorhandenen Mobile-Flows und
  die neue statische Direktpfadmatrix.
- Neue Direktpfadmatrix: jede der drei bekannten IDs bei Kaltstart, Canonical,
  Open Graph, JSON-LD `url`/`mainEntityOfPage`, sicherer externer Link,
  Same-ID-Link zum Reader, History und Rueckkehrfokus, kein externer Request,
  Unknown-404 ohne Artikelinhalt, Dark-Theme und 200-Prozent-Reflow.
- Keine Storage-Schreibzugriffe, keine Service-Worker-Registrierung und keine
  externen Requests im statischen Landingflow beobachtet.

Die finale commitbeschriftete Screenshotmatrix wurde absichtlich nicht erzeugt:
Sie gehoert erst zum Main-Checkpoint und zur unabhaengigen QA, damit kein
vorlaeufiger Quellstand als freigegebener Produktkandidat erscheint.

## Feststellungen nach Prioritaet

- High behoben: Ein allgemeiner Vite-Preview-Fallback lieferte unbekannte
  `/articles/<id>/`-Pfade mit HTTP 200 und Startseiteninhalt. Die Testumgebung
  liefert das gebaute Paket nun strikt dateibasiert; unbekannte Pfade erhalten
  HTTP 404 ohne fremden Artikel.
- Medium behoben: Browser-Back stellte auf der statischen Seite den Linkfokus
  nicht immer wieder her. Ein rein lokaler `pageshow`-Fokushook setzt ihn beim
  Back/Forward-Ereignis auf `Interaktiv lesen`; der Same-ID-Vertrag wird in
  Browser-E2E geprueft.
- High behoben: Eine absichtlich nach zwei erfolgreichen Promotionen
  unterbrochene Vier-Artefakt-Integration stellte zuvor einen gemischten
  Teilstand in Aussicht. Die Integration rollt nun ausschliesslich die zuvor
  als nicht vorhanden geprueften, eigenen Artefakte in ihr reserviertes
  Staging zurueck und entfernt nur dieses eigene Staging. Der Failure-
  Injection-Test prueft danach das gesamte urspruengliche Buildziel inklusive
  `index.html` und Caller-Marker byte-/inventargleich und ohne
  G3-007-Teilreste.
- Kein Buildartefakt ist im Git-Diff. Keine Mobile-, Contract-, Fixture-,
  Legacy- oder Infrastrukturdatei wurde durch diese Sequenz geaendert.

## Annahmen und offene Fragen

- Die vorhandene deklarative Origin `https://solinaridao.com` bleibt eine
  lokale Vertragsangabe; es gab keinen Netzwerkzugriff oder Deployment.
- Der strikte Static-Server dient nur der lokalen E2E-Pruefung. Das spaetere
  Hosting-/Apache-Verhalten ist ein separates Gate und wird nicht behauptet.

## Restrisiken

- Der Slice deckt ausschliesslich drei selbst erstellte lokale Artikel ab,
  nicht die 935 Legacyseiten, Archive, Redirects/Gone/Revocation oder eine
  Suchmaschinenveroeffentlichung.
- Die eingebettete Fokuslogik ist absichtlich klein, besitzt keine externe
  Abhaengigkeit und verarbeitet keine Eingaben. Sie sollte dennoch in der
  unabhaengigen Accessibility- und Sichtpruefung explizit nachvollzogen
  werden.

## Empfohlener naechster Schritt

Nur Empfehlung; keine automatische Ausfuehrung.

Der Main Agent prueft den Website-Diff, sichert den Kandidatencheckpoint und
startet danach ausschliesslich die unabhaengige QA fuer technische,
visuelle, Accessibility-, Privacy- und Determinismusbelege.

## WRN-AGENT-STATUS

- Task: WRN-G3-007 Website-Komposition und Buildintegration
- Status: GREEN – SEQUENZ 2 FERTIG, QA-HANDOFF BEREIT
- Quellstand: Startcheckpoint `a37aff3`; Contract-/Publisher-Handoff
  unveraendert uebernommen
- Erledigt: statische Drei-ID-Komposition, Buildintegration, strikte
  Direktpfadpruefung, Same-ID-Readeruebergang, 404, Theme/Reflow und Fokus
- Tests: Hauptcheck GREEN (87 Unit-/Contract-/Komponententests, 16
  Boundarytests), beide Builds GREEN, Playwright GREEN (41 PASS, 106
  erwartete Skips), `git diff --check` GREEN
- Offen: Main-Checkpoint, unabhaengige QA, finale beschriftete Kontaktboegen
  und Product-Owner-Abnahme
- Handoff: `docs/handoffs/WRN-G3-007-website-landing.md`
- Naechster Schritt: Main-Agent-Diffpruefung und Git-Checkpoint, danach
  unabhaengige QA
- END-CHECK: :)
