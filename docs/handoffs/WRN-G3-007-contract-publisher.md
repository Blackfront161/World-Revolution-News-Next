# Agent Handoff

- Agent: Backend/Data Reliability Engineer
- Task-ID: WRN-G3-007 / Sequenz 1 Contract, Fixture und lokaler Publisher
- Ergebnis: bestanden

## Kurzfazit

Der additive G3-007-Vertrag bindet exakt die drei bereits akzeptierten,
selbst erstellten lokalen Artikel und Readerdetails an eine statische
Websitepublikation. Die neue Fixture enthaelt keinen kopierten Artikeltext.
Der Publisher reserviert ein explizit uebergebenes, noch nicht vorhandenes
lokales Ausgabeverzeichnis atomar und erzeugt darin drei Landingpages,
`sitemap.xml`, `robots.txt` und ein hash-/bytegebundenes Publikationsmanifest.
Staging liegt im selbst reservierten Ziel auf demselben Volume. Bereits
vorhandene Caller-Ziele werden fail-closed und byteunveraendert abgewiesen. Er
verwendet weder Netzwerk noch Clientuhr, echte Inhalte oder Legacycode.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/architecture/ADR-004-IMMUTABLE-CONTENT-CONTRACT.md`
- `docs/tasks/WRN-G3-007-STABLE-ARTICLE-LINKS-SEO.md`
- `docs/handoffs/WRN-G3-007-preparation.md`
- bestehende lokale G3-002-Artikel-, Manifest- und G3-006-Readerfixtures
- Legacy-Website nur als bereits im Task Brief hashgebundene Read-only-Analyse;
  kein Legacyfile wurde geoeffnet, kopiert oder veraendert

## Geaenderte Dateien

### Contract und Tests

- `packages/content-contracts/src/index.ts`
- `packages/content-contracts/tests/manifest-v1.test.ts`

### Lokale Fixture und Loader

- `packages/test-support/fixtures/wrn-g3-007/content-manifest.json`
- `packages/test-support/fixtures/wrn-g3-007/publication.json`
- `packages/test-support/src/index.ts`
- `packages/test-support/tests/shell-state-fixtures.test.ts`

### Publisher und Tests

- `apps/website/tools/generate-static-article-landings.mjs`
- `apps/website/tools/generate-static-article-landings.test.mjs`
- `apps/website/package.json` (der vorhandene Website-Unitlauf fuehrt die vier
  lokalen Publisherpruefungen mit aus)

Es wurden keine generierten Artefakte, keine Dateien unter `apps/website/src`,
keine Mobiledateien und keine Legacy-/Live-Dateien angelegt oder geaendert.

## Tests und Belege

- vollstaendlicher Hauptcheck mit gebundener lokaler Toolchain Node `24.19.0`
  und pnpm `11.19.0`: GREEN
- 84 Unit-/Contract-/Komponententests: GREEN
- 16 bestehende Boundary-/Provenienz-/Asset-/Previewtests: GREEN
- beide getrennten Builds: GREEN
- Publisher-Doppelgenerierung in zwei unabhaengigen temporaeren Verzeichnissen:
  Seiten, Sitemap, Robots und Publikationsmanifest byteidentisch
- fuenf Publisher-Tests: drei feste Pfade, kein kopierter Fixture-JSON-Ausstoß,
  fehlendes Ziel fail-closed, bestehende leere und markerhaltige Caller-Ziele
  byteunveraendert sowie HTML-/Attribut-/JSON-LD-Escaping: GREEN
- Contract-Negativtests: Origin-Credentials, Pfadtraversal-ID und
  Quellmanifesthashdrift werden fail-closed abgewiesen
- `git diff --check`: GREEN

Der zuerst aufgerufene Hauptcheck mit der global installierten Node-Version
`24.16.0` endete erwartbar am Toolchaingate. Der erneut ausgefuehrte Check mit
der im Workspace bereitgestellten, verbindlichen Node-Version `24.19.0` ist
vollstaendig GREEN.

## Feststellungen nach Prioritaet

- Die G3-007-Quellrevision ist
  `wrn-g3-007-local-publication-source-v1-d8ff4f1`; sie haelt alle drei
  `landingIds` und `sitemapArticleIds` sortiert und exakt gleich.
- `publication.json` speichert nur Revisionen, Hashes, Origin,
  ID-Mengen und Generatorversion. Artikel- und Readerinhalte kommen weiterhin
  ausschliesslich aus den vorher validierten lokalen Fixtures.
- Der Publisher erzeugt den kanonischen Pfad nur nach
  `articles/<opaque-id>/index.html`; unsichere IDs werden vor jeder Ausgabe
  abgewiesen. Er besitzt das konkrete Ziel via exklusivem `mkdir` selbst,
  nutzt kein Cross-Volume-`rename` und bereinigt bei einem eigenen Fehler nur
  dieses nachweislich selbst erzeugte Ziel. Bestehende Caller-Ziele, Backups
  oder Verzeichnisse werden nie rekursiv geloescht, umbenannt oder ersetzt.
- Canonical, `og:url`, JSON-LD `url`, JSON-LD `mainEntityOfPage` und Sitemap
  verwenden pro Artikel exakt dieselbe HTTPS-URL. Originalquellen bleiben
  externe, nicht automatisch aufgerufene Links mit `noopener noreferrer` und
  `referrerpolicy=no-referrer`.

## Annahmen und offene Fragen

- `https://solinaridao.com` ist wie im Source-of-Truth und Task Brief die
  deklarative Produktionsorigin; ihre Nennung erzeugt keinen Netzwerkzugriff
  und kein Deployment.
- Das statische HTML ist absichtlich eine minimale semantische Publisherausgabe.
  Der nachfolgende Frontend-Owner integriert es erst in die akzeptierte
  Websitekomposition und den Build, ohne diesen Contract umzudeuten.

## Restrisiken

- Der Slice beweist nur die lokale Drei-ID-Publikation, nicht die Migration der
  935 Legacyseiten oder deren Apache-/Hosting-/Indexierungsverhalten.
- Direkte Browserpfade, visuelle Paritaet, Accessibilitymatrix,
  Request-/Storagebeobachtung und Buildintegration sind absichtlich noch nicht
  Teil dieser Sequenz und brauchen den nachfolgenden Website-Owner sowie QA.

## Empfohlener naechster Schritt

Nur Empfehlung; keine automatische Ausfuehrung.

Der Main Agent prueft Diff und Handoff, sichert einen Git-Checkpoint und startet
erst danach den Frontend Brand Engineer ausschliesslich fuer die freigegebene
Website-Komposition und Buildintegration.

## WRN-AGENT-STATUS

- Task: WRN-G3-007 Contract, lokale Publikationsfixture und Publisher
- Status: GREEN – SEQUENZ 1 FERTIG, FRONTEND-HANDOFF BEREIT
- Quellstand: Startcheckpoint `d8ff4f1`; lokale G3-002-/G3-006-Fixtures;
  Legacy unveraendert
- Erledigt: fail-closed Vertrag, Drei-ID-Revision, deterministischer Publisher,
  Hash-/Byteinventar, Negative- und Doppelgenerierungstests
- Tests: Hauptcheck GREEN (84 Unit-/Contract-/Komponententests, 16
  Boundarytests), beide Builds GREEN, `git diff --check` GREEN
- Offen: Website-Komposition/Buildintegration, Browser-/Visual-QA und
  Product-Owner-Abnahme
- Handoff: `docs/handoffs/WRN-G3-007-contract-publisher.md`
- Naechster Schritt: Main-Agent-Diffpruefung und Git-Checkpoint, danach
  sequenzieller Website-Owner
- END-CHECK: :)
