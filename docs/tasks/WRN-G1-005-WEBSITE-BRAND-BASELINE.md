# Task Brief – WRN-G1-005

## Identitaet

- Task-ID: `WRN-G1-005`
- Titel: Read-only Website-, SEO-, Hosting- und Markenbaseline
- Zustaendiger Agent: neue kurze Instanz des Profils `legacy_product_analyst`
- Modellklasse: Spark/medium; kostenguenstige Evidenzsammlung ohne
  Hochrisikoentscheidung und ohne Code
- Delegation: nicht erlaubt

## Ziel

Kartiere die massgebliche Website als eigenstaendiges Produkt derselben Marke.
Dokumentiere ihren aktuellen Funktions-, Daten-, SEO-, Offline-, Hosting- und
Markenvertrag so konkret, dass danach eine getrennte visuelle Responsive-
Baseline und spaeter die Zielarchitektur geplant werden koennen. App- und
Website-Legacy duerfen nicht zusammenkopiert werden.

## Verbindliche Quellen

- Website:
  `C:\Users\patri\Documents\World Revolution News\wrn-web-portal-2026-08-20-r10n-work`
- erwarteter Branch/HEAD: `main` / `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- Governance-Repository: aktueller sauberer `main`
- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/02-FEATURE-PARITY-MATRIX.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/07-RISK-REGISTER.md`
- G1-001 bis G1-004 Handoffs
- Website-`README.md`, `.github/workflows`, `index.html`, `config.js`,
  `manifest.json`, `service-worker.js`, `.htaccess`, `robots.txt`, `sitemap.xml`,
  Landingpage-Generator/-Manifest, `articles/`, `news-archive/`, relevante QA-
  Verzeichnisse sowie geladene Marken-/Responsive-Dateien

## Pflichtpruefungen

1. Gitstand, Arbeitsbaum und Herkunft der Baseline bestaetigen.
2. Einstiegspunkt und wirksame Ladeordnung der Hauptskripte/-styles kartieren;
   Monolithen, Doppelimplementierungen und globale Kopplungen benennen.
3. Funktionsinventar gegen jede Website-Spalte der Paritaetsmatrix abgleichen.
4. Smartphone-, Tablet- und Desktopregeln statisch kartieren, aber nicht als
   visuell bestaetigt ausgeben.
5. Gemeinsame Markenassets, Typografie, Farben und Headerregeln von bewusst
   website-spezifischer Navigation/Layoutlogik trennen.
6. SEO-Vertrag pruefen: stabile Artikelpfade, Generator, Manifest, Sitemap,
   Robots, Canonical/OpenGraph/Structured Data und unbekannte Fallbacks.
7. Hosting-/Releasevertrag pruefen: Apache/Hostinger, `.htaccess`, Service
   Worker, Cacheversion, Build-/Generatorablauf, CI und Rollbackbelege.
8. Datenquellen/-revisionen sowie Offline-/Fallbackpfade mit G1-003 abgleichen;
   lokale Kopien nicht als aktuelle Produktionsquelle missverstehen.
9. Asset-/Font-/Lizenzkandidaten inventarisieren, ohne Rechte zu behaupten oder
   Dateien zu kopieren.
10. Vorhandene Tests/QA-Artefakte mit exakten Pfaden nennen; nichts ausfuehren.
11. Pro Bereich klassifizieren: `PORTIEREN`, `NEU SCHREIBEN`,
    `WEBSITE-SPEZIFISCH BEHALTEN`, `ARCHIVIEREN` oder `PRODUCT DECISION`.
12. Konkrete Anforderungen und Screenshot-/Flowliste fuer die anschliessende
    visuelle Website-Baseline liefern.

## Verboten

- keine Datei veraendern oder kopieren
- keine Tests, Generatoren, Builds, Server, Browser oder Live-URLs starten
- kein Deployment, GitHub-Schreibzugriff oder Hostingzugriff
- keine Secrets, Tokens, Konten, `.env`-Inhalte oder Signierdaten lesen
- kein Vollscan und keine Produktcodebewertung ausserhalb des Website-Scope
- keine weiteren Agenten starten

## Akzeptanzkriterien

1. Jede Website-Paritaetszeile besitzt konkrete Dateien und einen Evidenzstatus.
2. SEO-/Landingpage-/Sitemapgleichheit ist als pruefbarer Vertrag beschrieben.
3. Website-spezifische und spaeter gemeinsam nutzbare Markenelemente sind
   eindeutig getrennt.
4. Hosting, Service Worker, Datenrevision und Generator sind nicht mit der App-
   Releasekette vermischt.
5. Responsive-Aussagen trennen statische Regeln von visueller Bestaetigung.
6. Risiken enthalten Owner, Mindestmassnahme und spaeteres Gate.
7. Keine historische QA-Aussage wird als aktueller Testlauf ausgegeben.
8. Vollstaendiger WRN-Statusblock endet mit `END-CHECK: :)`.

## Uebergabeformat

- Executive Summary und Quellenstand
- Website-Systemkontext und Ladeordnung
- Feature-/Paritaetsinventar
- Responsive- und Markenvertrag
- SEO-/Artikel-/Sitemapvertrag
- Daten-/Offline-/Service-Worker-Vertrag
- Hosting/CI/Release/Rollback
- Asset-/Font-/Rechtekandidaten
- vorhandene Tests/QA, nicht ausgefuehrt
- Findings/Risiken und Migrationsklassifikation
- konkrete visuelle Baseline-Checkliste
- geaenderte Dateien: keine
- WRN-Statusblock
