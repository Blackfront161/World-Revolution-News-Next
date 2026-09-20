# Website/Brand Handoff – WRN-G1-005

- Agent: `legacy_product_analyst` als Luna/medium-Runtime-Fallback fuer das
  bevorzugte Spark-Profil
- Task-ID: `WRN-G1-005`
- Ergebnis: **YELLOW – statische Baseline vollstaendig, visuelle Abnahme offen**
- Website-Quellstand: `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`

## Executive Summary und Quellenstand

Die massgebliche Website liegt sauber auf `main@9a59b17`; `origin/main` ist
identisch. Sie ist ein eigenstaendiges statisches Webprodukt mit eigener
Navigation, Responsive-Schicht, SEO-Landingpages, Apache-Regeln, Service
Worker, Offlinevertrag und Hostinger-Releasekette. Diese Teile duerfen nicht
mit der Android-App zusammenkopiert werden.

Releaseangaben im Website-README:

- Website `r10n` vom 20. August 2026
- Website-CSS Release 37, JavaScript Release 24, Service Worker `r10n-r45`
- statisches Apache-/Hostinger-Paket
- historischer Pakethash
  `91fb096dffcf47200961f5e3925ff1aff41553aeb2204cb8f270a7006f21bfe3`

Der Hash und die Releasebeschreibung sind historische Repositorybelege, kein
Live-Hostingbeweis. Es wurden 935 statische Artikelverzeichnisse und 937
Sitemap-URLs gezaehlt. Der wichtigste neue Befund wurde vom Main Agent
unabhaengig bestaetigt: Das aktuelle `article-landing-manifest.json` enthaelt
weder `ids`, `articleCount` noch `revision`, obwohl Generator, Test und Runtime
diese Felder verwenden. Feed, Landingpages, Manifest und Sitemap sind deshalb
am Commit nicht als konsistenter gemeinsamer Releasevertrag bewiesen.

## Systemkontext und aktive Ladeordnung

`index.html` laedt nacheinander:

1. Konfiguration/Plattform: `news-app-2-config.js`,
   `native-device-bridge.js`, `offline-db.js`.
2. Kernruntime: `news-app-2-core.js`, `news-app-2-specialty.js`,
   `wrn-product-21.js`, `news-app-2-media.js`, `news-app-2-release.js`.
3. Artikel/Medien/Quellen/Solidaritaet: `article-summary-core.js`,
   `shared-translation-client.js`, `stories-core.js`, `lexicon-tab.js`,
   `prisoner-solidarity.js`, `zine-designer.js`, `media-player.js`,
   `audio-tools.js`, `source-passport-21.js`, `solidarity-network-21.js`,
   `source-profiles.js`, `source-verification.js`.
4. Website-Schicht: `website-language-origin.js`,
   `website-editorial-text.js`, `website-portal-core.js`, der grosse
   `news-app-2.js`, `news-app-2-website.js`, Translation State/Queue/Auto und
   `website-link-security.js`.
5. Styles: `news-app-2.css`, Release-, Solidaritaets-, Zine-, Quellen- und
   zuletzt `news-app-2-website.css` als Web-Ueberschreibung.

`news-app-2.js` bleibt ein grosser Monolith. Mehrere spezialisierte Schichten
koennen Verhalten doppeln oder ueberschreiben. `config.js`, `app.js`,
`data-control.js` und aeltere Release-/Recoverydateien sind nicht Teil dieser
primaeren Ladeordnung und duerfen nicht als aktive Hauptarchitektur gelten,
ohne ihren konkreten Importpfad zu beweisen.

## Feature-/Paritaetsinventar

### Marke, Navigation und Darstellung

| Bereich | Konkrete Baseline | Evidenzstatus / Entscheidung |
|---|---|---|
| Marke/Header | `index.html`, `solinaridao-header-mark-filled-r10e.png`, `solinaridao-header-logo-web.png`, `news-app-2-website.css` | Markenwirkung portieren; Web-Header website-spezifisch |
| Navigation | `.bottom-nav`, Website-JS/CSS; Desktop als horizontale Navigation | VERIFY, website-spezifisch |
| Mobile/Tablet/Desktop | Breakpoints in Website-CSS, historische `qa-r10m`-Vertraege | statisch belegt, visuell offen |
| Theme/Typografie | `light-theme.css`, `typography.css`, Basis-/Website-CSS | Semantik teilen, Implementierung neu strukturieren |
| Reflow/200 % | `data-font-size="200"`-Regeln und historische QA | KNOWN-ISSUE bis neuer visueller Beleg |
| Intro | `intro-screen.js/css` | PRODUCT DECISION |

### News, Artikel und Herkunft

| Bereich | Konkrete Baseline | Evidenzstatus / Entscheidung |
|---|---|---|
| Feed/Suche/Filter | `news-feed.json`, Core-/Release-JS, `source-filters.js` | Kernvertrag portieren, Flows visuell pruefen |
| Reader/Teilen | Dialog in `index.html`, Website-JS, `article-actions.js` | Reader und Web-URL-Vertrag getrennt erhalten |
| Reading State/Offline | `reading-state.js`, `offline-db.js` | Verhalten portieren, Technik neu strukturieren |
| Uebersetzung | Website Auto/Queue/State plus Shared Client | KNOWN-ISSUE; G1-004-Gates gelten |
| Sprache/Quellenpass | Website Language Origin, Passport/Profile/Verification | Herkunftsregeln portieren |
| Historische Artikel | 935 `articles/*/index.html`, Archiv, Manifest, Sitemap | IDs/Redirect erhalten; Manifestinkonsistenz schliessen |
| Briefings/Dossiers | mehrere Briefingmodule | VERIFY und Product-Owner-Flowabnahme |

### Multimedia, Wissen und Solidaritaet

| Bereich | Konkrete Baseline | Evidenzstatus / Entscheidung |
|---|---|---|
| Podcast/Audio/Radio | Podcast-/Radio-JSON, Audio-Hub/-Catalog/-Tabs | Playerverhalten portieren; Podcast Admission/Rechte/Takedown neu entscheiden |
| Video | `video-hub.js`, lokale Feed-/Registrydateien | VERIFY; Remote Required/Optional-Vertrag fehlt |
| Events | lokale Eventdaten und `events.js` | Schema/Zeitzonen/Provenienz portieren |
| Bibliothek/Lexikon | lokale Librarydateien, `lexicon-tab.js` | Library Ownership/Optionalitaet offen; Lexikon portieren |
| Zine | `zine-designer.js/css` | PRODUCT DECISION |
| Gefangenensolidaritaet | JSON, Prisoner-/Solidarity-Module | Privacy, Rechte und redaktionelle Aktualitaet vor Portierung |
| Hilfe | Hilfe-/Solidaritydaten und Runtime | No-Geolocation-/Safetyvertrag portieren |
| Action Radar | `action-radar.js`, verifizierte Actions | getrennte PRODUCT DECISION |

### Betrieb

| Bereich | Konkrete Baseline | Evidenzstatus / Entscheidung |
|---|---|---|
| Offline-App-Shell | website-eigener `service-worker.js` | Verhalten erhalten, getrennt neu strukturieren |
| lokale Daten | `offline-db.js`, `reading-state.js` | versionierte Migration/Loeschung neu definieren |
| Spezialfeeds | lokale Dateien plus bewegliche Remote-Pfade | KNOWN-ISSUE; Required/Optional-Manifest |
| Diagnostik/QA | `qa-desktop`, `qa-r10j` bis `qa-r10m` | vorhandene Struktur, keine aktuelle Testaussage |
| Datenschutz/Security | `privacy.html`, `.htaccess`, CSP | G1-004 und Liveinventar bleiben Gates |
| Accessibility | `accessibility.js`, Typografie und QA | manuelle/automatische G4-Gates |
| Push | Config, Worker-/Runtimepfade | PRODUCT DECISION plus G1-004-Gates |

Android-/Playzeilen sind fuer die Website nicht anwendbar und bleiben strikt in
der App-Releasekette.

## Statischer Responsive-Vertrag

- unter 560 px: App-/Spendenbuttons werden 44 px gross; Labels visuell
  verborgen;
- ab 920 px: Desktopheader, zweispaltiges Hero und horizontale Navigation;
- 920–1140 px: flexiblere Navigation und angepasstes Hero-Raster;
- ab 1280 px: dreispaltiges Artikelraster;
- Websitebreiten um 1.400/1.480 px mit fluiden Seitenraendern;
- mobile Basisnavigation mit fuenf Spalten;
- bei `data-font-size="200"`: drei Navigationsspalten, umbrechende
  Dialogaktionen und zusaetzlicher unterer Inhaltsabstand;
- `prefers-reduced-motion` wird beruecksichtigt.

Das sind CSS-/Fixture-Belege, keine visuelle Bestaetigung. Smartphone, Tablet,
Desktop, Querformat und 200-%-Reflow benoetigen einen eigenen Browsertask.

## Markenvertrag

Spaeter gemeinsam nutzbar, jeweils erst nach Rechtepruefung:

- Farbsemantik Cyan, Rot/Pink, Gruen und dunkle Oberflaechen;
- Typografievariablen und Fokus-/Kontrast-/Touchzielprinzipien;
- `site-icon-*`, `brand-icon-*`, aktive Solinaridao-Headermarke/-unterzeile und
  Weblogo;
- stabile Artikel-, Quellen- und Provenienzsemantik.

Website-spezifisch bleiben sticky/kompakter Desktopheader, App-/Spendenbuttons,
horizontale Desktopnavigation, Hero-/Breitenraster, Artikel-Landingpage-Layout,
SEO/Apache/Hostinger und der Website-Service-Worker.

Im Repository fehlt eine `LICENSE`. `Qood.ttf`, Logos, Icons, Hintergruende,
Headergrafiken, Inhaltsbilder und Medien sind Rechte-/Provenienzkandidaten;
keine freie Wiederverwendung wird behauptet.

## SEO-, Artikel- und Sitemapvertrag

Belegt sind Canonical, Robots, Sitemaplink, OpenGraph/Twitter und
Organization-/Website-JSON-LD in `index.html`. Die Website-JS setzt fuer offene
Artikel Titel, Canonical, Social Metadaten, `NewsArticle`-JSON-LD und stabile
Artikelpfade. `robots.txt` verweist auf die Sitemap; `.htaccess` leitet einen
unbekannten gueltig geformten Artikelpfad auf `/?article=<id>` um.

`tools/generate-article-landings.mjs` ist standardmaessig read-only. `--write`
erzeugt append-only Landingpages und tauscht Manifest/Sitemap mit Lock,
Staging, Hashjournal und Recovery aus. Der Generator hat keine Deployfunktion.

**Bestaetigte Inkonsistenz:** Das eingecheckte Manifest enthaelt nur
`schemaVersion`, `sitemap`, `articlePathPattern` und `fallback`. Generator,
Tests und Runtime verwenden `revision`, `articleCount` und `ids`. Deshalb ist
die ID-/Revisionsgleichheit trotz vorhandener 935 Verzeichnisse und 937
Sitemap-URLs nicht belegt.

## Daten-, Offline- und Service-Worker-Vertrag

- Primaerquelle: GitHub Pages des Datenrepositories; Raw-`main` als Mirror.
- Lokale Kopien existieren fuer News, Events, Podcasts, Radio, Video, Library,
  Quellen, Solidaritaet und Archive und koennen von Remote abweichen.
- Cache `wrn-web-portal-2026-08-20-r10n-r45` fuer App-Shell und
  `wrn-web-data-2026-08-20-r10n-r45` fuer Daten.
- Network-first fuer Navigation und Daten, Cache-/synthetischer JSON-Fallback;
  Timeout-/Cachepfade fuer Assets.
- Beim Aktivieren werden alte `wrn-*`-Caches entfernt und die Websiteclients
  uebernommen.

Releasehash, HTML/CSS/JS und Cacheversion muessen zusammengehoeren. Die
bewegliche Remote-Datenrevision und unklare Optionalitaet bleiben R-06/R-22.

## Hosting, CI, Release und Rollback

`.htaccess` definiert HTTPS, Artikelrouting, HSTS, CSP,
`X-Content-Type-Options`, Frame-, Referrer-, Permissions- und COOP-Header,
Cache-Control sowie Dateischutz. Das ist ein Apachevertrag, nicht auf einen
generischen Devserver uebertragbar.

`.github/workflows/website-generator-readonly.yml` verwendet Node 22 und
enthaelt Syntax-, Clean-Tree-, 935-Seiten-, Generator- und Hashpruefungen.
Nichts davon wurde in G1-005 ausgefuehrt.

Das README verlangt ein unveraenderliches Paket, SHA-256, externes
`public_html`-Backup, atomaren Austausch, Live-Smoke und Restore. Unbekannt
bleiben aktueller Live-Stand, reale Hostinger-/Apachekonfiguration,
Service-Worker, Datenrevision und ein tatsaechlich ausgefuehrter Restore.

## Vorhandene Tests/QA – nicht ausgefuehrt

- `qa-desktop/`
- `qa-r10j/`, `qa-r10k/`, `qa-r10l/`, `qa-r10m/`
- `qa-generator/article-generator.test.mjs`
- `.github/workflows/website-generator-readonly.yml`
- `tools/generate-article-landings.mjs` im Checkmodus
- mobile Layout-/Reflow-, Browser-Reflow- und r10m-P1-Vertraege

Historische Screenshots und Testberichte sind Referenzen, kein aktueller Pass.

## Findings, Owner und Gates

| Prioritaet | Befund | Owner / Mindestmassnahme | Gate |
|---|---|---|---|
| High | Feed, Landingpages, Manifest und Sitemap nicht revisionsgebunden; aktuelles Manifest widerspricht Generator/Runtime | Website + Data: immutable Revision/Hashmanifest und ein Generatorvertrag | G2–G5 |
| High | Library-/Video-/Editorialpfade besitzen unklare Remote-Optionalitaet | Website + Data: Required/Optional, Owner, Fallback | G2–G4 |
| High | Translation-/Privacy-/Cachekey-Risiken gelten fuer den Webflow | Security + Backend: G1-004-Gates | vor G3 |
| High | Live-Hosting-/Worker-/Cachezustand unbekannt | Website Operations: autorisiertes read-only Inventar | G2 |
| Medium | Responsive-Regeln noch nicht aktuell visuell bestaetigt | Visual QA: Screenshot-/Interaktionsmatrix | G1/G4 |
| Medium | Touchziele, Reflow, Fokus/Escape und Landingpage-Alttexte offen | Accessibility/QA: manuelle und automatische Smokes | G4–G5 |
| Medium | Rechte fuer Code, Fonts, Assets und Inhalte unklar | Product Owner + Security: Rechte-/Lizenzregister | G2/G5 |
| Entscheidung | Intro, Zine, Action Radar, Push, automatische Translation und oeffentliche Podcasts | Product Owner | G2/G3 |

## Migrationsklassifikation

- `PORTIEREN`: Daten-/Provenienzschemas, stabile IDs, SEO-Anforderungen,
  Markenwirkung und Hilfe-Sicherheitsgrenzen.
- `NEU SCHREIBEN`: monolithische Runtime, Offline-/Cachemigration,
  Translation-/Medienadapter, Datenrevision und Feed-Fallbackvertraege.
- `WEBSITE-SPEZIFISCH BEHALTEN`: Apache/Hostinger, Sitemap/Robots,
  Landingpages, Webnavigation/Desktopheader und Website-Service-Worker.
- `ARCHIVIEREN`: historische QA-/Recovery-/nicht aktive Configpfade als
  Evidenz, nicht als Produktionsimplementierung.
- `PRODUCT DECISION`: Intro, Zine, Action Radar, Push, automatische
  Uebersetzung und oeffentliche Podcasts.

## Visuelle Folgecheckliste

- Viewports: 320x568, 360x800, 390x844, 412x915; 600x960, 800x1280 jeweils
  Hoch/Quer; 1024x800, 1280x800, 1440x900, 1920x1080.
- Zustaende: Erstladen, Feed, leer/Fehler, Artikel, statische Landingpage,
  unbekannter Artikel, Suche/Filter, Medien, Hilfe, Themes, 200 %, groesste
  Schrift, Tastaturfokus, Offline/langsames Netz.
- Belege mit Commit, Datum, Viewport, Theme und Zustand benennen.
- Konsole, Netzwerk, CSP, Canonical, JSON-LD und Service-Worker-Version
  dokumentieren; ID-/Revisionsgleichheit von Feed, Manifest, Landingpages und
  Sitemap separat pruefen.

## Aenderungen und Aktionen

- Fachagent: keine Dateien veraendert.
- Main Agent: nur dieser Governance-Handoff, Register, Matrix und Projektstatus.
- Keine Tests, Generatoren, Builds, Server, Browser, Live-URLs, Deployments,
  Konten oder Secrets verwendet.

## WRN-AGENT-STATUS

- Task: `WRN-G1-005`
- Status: YELLOW
- Quellstand: Website `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- Erledigt: statische Website-, Marken-, SEO-, Daten-, Offline-, Hosting- und QA-Baseline
- Tests: keine; gemaess Task Brief nicht ausgefuehrt
- Offen: visuelle Responsive-Baseline, Manifestkonsistenz, Liveinventar und Rechteaudit
- Handoff: `docs/handoffs/WRN-G1-005-website-brand-baseline.md`
- Naechster Schritt: Continuity Audit, danach separater visueller Website-Task
- END-CHECK: :)
