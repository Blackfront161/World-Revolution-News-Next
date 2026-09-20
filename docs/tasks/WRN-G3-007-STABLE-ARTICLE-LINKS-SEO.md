# Task Brief – WRN-G3-007 stabile Artikel-Links und Website-SEO-Basis

## Identitaet

- Task-ID: `WRN-G3-007`
- Titel: deterministische statische Artikel-Landingpages, stabile Website-URLs,
  Canonical und Sitemap aus einer lokalen Revision
- Phase/Welle: G3, zweiter eng begrenzter Wave-3-Slice nach dem akzeptierten
  lokalen Reader
- Paritaets-/Risiko-ID: primaer `WEB-01`, `WEB-02`, `WEB-03` und R-27; mit
  `NEWS-03`, `NEWS-10`, `SYS-07`, `SYS-08`, R-06, R-17, R-22 und R-32 als
  Vertragsgrenzen
- Auftraggeber: Product Owner
- Owner-Agent: Chief AI Architect
- spaetere sequenzielle Implementierungsowner: zuerst Backend/Data Reliability
  Engineer fuer Vertrag, Fixture und deterministischen Publisher; danach
  Frontend Brand Engineer ausschliesslich fuer Website-Komposition und
  Buildintegration
- unabhaengige Abnahme nach Implementierung: QA Release Engineer
- Reserve: Security/Privacy Reviewer nur bei HTML-Injection-, CSP-, Origin-,
  Pfadtraversal- oder External-Link-Finding; Architecture Reviewer nur bei
  notwendiger ADR-Aenderung
- Modellrouting: Terra/high fuer Vertrag, Generator und Websiteintegration;
  Luna/medium nur fuer mechanische Belegtabellen; Spark/medium nur fuer eine
  spaetere exakt spezifizierte Kleinkorrektur; Sol/high nur beim dokumentierten
  Security-/Architekturtrigger
- Delegation nach Start: erlaubt, aber strikt sequenziell; hoechstens ein
  Contract-/Publisher-Writer, danach ein Website-Writer, danach unabhaengige QA
- Status: **VISUELL AKZEPTIERT UND GESCHLOSSEN – KEIN FOLGEFEATURE**
- Vorbereitungsgate: PO-039 am 24. August 2026 mit exakt
  `BEREITE WRN-G3-007 VOR` erteilt
- Vorbereitungscheckpoint: `8a395c3`
- Implementierungsgate: PO-040 am 24. August 2026 mit exakt
  `START WRN-G3-007` erteilt
- Ausgangscheckpoint: G3-006-Abschluss `f2821fe`
- Contract-/Publisher-Checkpoint: `a37aff3`
- erster Website-Produktkandidat: `053e816`
- QA-Findingcheckpoint: `38728a7` mit Low `WRN-G3-007-L-001`
- korrigierter Produktkandidat: `5db27a5`
- GREEN-Re-QA-/Evidenzcheckpoint: `02a4e90`
- Product-Owner-Sichtabnahme PO-041: am 25. August 2026 mit exakt
  `G3-007 VISUELL AKZEPTIERT` erteilt
- Abschlusscheckpoint: `fe9a848`
- Arbeitsbranch: `codex/g3-007-stable-article-links-seo`

## Ziel in beobachtbarer Sprache

Eine bekannte lokale Testartikel-ID besitzt auf der Website einen stabilen
Pfad nach dem Muster `/articles/<id>/`. Wird dieser Pfad direkt in einem neuen
Browserfenster geoeffnet, erscheint eine eigenstaendige, responsive und
barrierearme statische Artikelseite. Sie zeigt denselben vollstaendigen,
selbst erstellten Testinhalt und dieselbe Herkunft wie der akzeptierte lokale
Reader. Ein klarer Link oeffnet denselben Artikel in der interaktiven
Websiteansicht `/?article=<id>`.

Landingpage, Canonical, Open-Graph-URL, strukturierte Daten, Sitemap und ein
hashgebundenes Publikationsmanifest muessen dieselbe Artikel-ID und dieselbe
immutable lokale Revision nennen. Unbekannte oder unsichere IDs erzeugen
keine Seite und duerfen niemals ausserhalb des vorgesehenen Ausgabeverzeichnisses
schreiben.

Der Slice erzeugt nur lokale, produktionsfoermige Buildartefakte aus den drei
bereits selbst erstellten Testartikeln. Er liest keine Livequelle, deployed
nichts und portiert weder die 935 historischen Legacyseiten noch echte
Nachrichten.

## Verifizierte Ausgangslage

### Akzeptierter neuer Stand

- G3-006-Abschluss: `f2821fe`
- korrigierter Readerkandidat: `6a4c64b`
- GREEN-Re-QA: `6da7339`
- der bestehende lokale Manifest-v1-Vertrag besitzt bereits getrennte Mengen
  `activeFeedIds`, `archiveIds`, `landingIds`, `redirectSourceIds` und
  `sitemapArticleIds` samt Einzelhashes
- die aktuell akzeptierte G3-002-Fixture haelt `landingIds`,
  `redirectSourceIds` und `sitemapArticleIds` bewusst leer
- die G3-006-Readerdetails sind separat hashgebunden und exakt an dieselben
  drei lokalen Artikel-IDs gebunden
- die Website kann bekannte Reader-IDs bereits clientlokal ueber
  `/?article=<id>` aufloesen; eine statische `/articles/<id>/`-Publikation
  existiert im neuen Repository noch nicht

### Autoritative Legacy-Website, nur read-only

- Quelle:
  `C:\Users\patri\Documents\World Revolution News\wrn-web-portal-2026-08-20-r10n-work`
- Commit: `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`, Arbeitsbaum bei der
  Vorbereitung sauber
- 935 Verzeichnisse unter `articles/<id>/`
- 937 Sitemap-URLs: 935 eindeutige Artikel-IDs plus zwei Nichtartikel-URLs
- `article-landing-manifest.json` enthaelt im eingecheckten Stand nur
  `schemaVersion`, `sitemap`, `articlePathPattern` und `fallback`; `ids`,
  `articleCount` und `revision` fehlen
- der vorhandene Generatorcode wuerde diese fehlenden Felder erzeugen und
  prueft Landingverzeichnisse, Sitemap-IDs, Canonical/JSON-LD, stabile IDs,
  transaktionale Wiederaufnahme und unveraenderte historische Seiten
- `.htaccess` laesst vorhandene statische Landingverzeichnisse passieren und
  leitet nur fehlende sichere Artikelpfade per 302 auf `/?article=<id>` um;
  dieser Apachevertrag wird hier nur analysiert und nicht kopiert
- G1 hat den Same-ID-Vertrag wegen des eingecheckten Manifestdrifts als
  verpflichtendes R-27-Gate festgehalten, aber keinen Same-ID-Canonicaldefekt
  fuer die zwei damals unterschiedlichen Beispielartikel behauptet

### Gebundene Legacy-Belege

| Beleg | SHA-256 |
|---|---|
| `tools/generate-article-landings.mjs` | `8FDF504EA527A869F5D62C3512F1571E57A3ED97B1FF7BB050735F4F3816AB86` |
| `qa-generator/article-generator.test.mjs` | `51B1FA3E6B2CD0D3CBF1735303B6261519D6F8D96A4A1C4921D88C46412668AB` |
| `article-landing-manifest.json` | `8F54D235B1C1D3B7D9870F41F74870AF2A5C329EAA9B3C9FBADE275B4F3B7D10` |
| `sitemap.xml` | `0EED4ABFFC5A814D514E5AD6B7F2172F88ED5801A02E19BE5DADBC9F4341200F` |
| `.htaccess` | `430FF790DD829658BE1BB50480C54058ADEE7056C25ABCC6CB3F54DC7466FF60` |
| Beispiel `articles/wrn-101o0me-1bymtda/index.html` | `0F2F74A68223B734BE18C120EDF7EDC593078D7639E908F9162BF753052B9363` |

Die Hashes binden nur die read-only Analyse. Sie erlauben kein Kopieren des
Legacycodes oder echter Artikeltexte.

## Verbindlicher Zielvertrag

### 1. Neue lokale Publikationsrevision

- Eine neue G3-007-Fixture referenziert die bereits akzeptierten lokalen
  Artikel- und Readerdaten, dupliziert sie aber nicht als zweite manuell
  gepflegte Inhaltsquelle.
- Ihr Manifest verwendet eine neue immutable Revision und setzt fuer die drei
  lokalen IDs `landingIds` und `sitemapArticleIds` exakt gleich.
- `activeFeedIds subseteq archiveIds`, `landingIds subseteq archiveIds`,
  `sitemapArticleIds = landingIds` und
  `redirectSourceIds` disjunkt zu kanonischen IDs bleiben fail-closed.
- Jede benannte ID-Menge ist sortiert, eindeutig und mit ihrem eigenen
  kanonischen SHA-256 gebunden.
- Redirect-, Gone-, Revocation- und echte Archivmengen bleiben in dieser
  Fixture leer und werden nicht als implementiert ausgegeben.

### 2. Deterministisches Website-Publikationsmanifest

Das erzeugte Website-Publikationsmanifest nennt mindestens:

- eigene versionierte Vertragskennung;
- Quellrevision und Quellmanifesthash;
- explizite HTTPS-Site-Origin ohne Credentials, Query oder Fragment;
- sortierte Landingpageeintraege mit Artikel-ID, relativem Pfad, Canonical,
  SHA-256 und Bytezahl;
- Sitemap- und Robots-Pfad, SHA-256 und Bytezahl;
- die getrennten Artikelmengenhashes aus der Quellrevision;
- verwendete Generatorversion sowie feste, reproduzierbare Zeitprovenienz aus
  der Quellrevision statt aktueller Clientuhr.

Das Manifest behauptet weder Deployment noch Suchmaschinenindexierung.

### 3. Statische Landingpage

- Zielpfad exakt `articles/<opaque-id>/index.html` innerhalb eines expliziten
  Staging-/Ausgabeverzeichnisses.
- `canonical`, `og:url`, JSON-LD `url` und `mainEntityOfPage` sind bytegenau
  dieselbe `https://solinaridao.com/articles/<id>/`-URL.
- JSON-LD verwendet `NewsArticle`, die sichtbare Seite aber keine erfundene
  redaktionelle Verifikation, Autorenschaft, Uebersetzung oder Bildquelle.
- Titel, vollstaendiger lokaler Readertext, Quelle, Datum und
  Originalsprache stammen ausschliesslich aus validierten G3-007-Eingaben.
- alle textlichen Werte werden kontextgerecht escaped; keine ungepruefte
  `innerHTML`-, Script-, Eventhandler- oder URL-Injektion.
- der Link `Interaktiv lesen` fuehrt zur gleichen ID unter
  `/?article=<id>`; die Originalquelle bleibt klar als extern gekennzeichnet
  und besitzt `noopener noreferrer` sowie `referrerpolicy="no-referrer"`.
- keine externen Bilder, Fonts, Scripts, Tracker oder automatischen Requests.
- Darstellung nutzt die akzeptierte Marke und gemeinsame Tokens, aber eine
  eigenstaendige statische Website-Komposition.

### 4. Sitemap und Robots

- Die Sitemap enthaelt jeden Landingartikel exakt einmal und keine andere
  Artikel-ID.
- Nichtartikel-URLs werden separat deklariert und gezaehlt; ihre Anwesenheit
  darf die Artikelmengengleichheit nicht verdecken.
- Jede Artikel-`loc` entspricht exakt dem Canonical der zugehoerigen Seite.
- `lastmod` wird nur aus einem validierten Inhaltsdatum abgeleitet, nicht aus
  Build- oder Dateisystemzeit.
- `robots.txt` verweist auf genau die konfigurierte Sitemap-URL und enthaelt
  keine unbemerkte Umgebungs- oder Secretinformation.

### 5. Build- und Fehlergrenze

- Generierte Landingpages, Sitemap, Robots und Publikationsmanifest sind
  Buildartefakte, keine manuell gepflegte Produktquelle.
- Die Generierung arbeitet zuerst in einem isolierten Stagingverzeichnis.
  Erst nach vollstaendiger Validierung darf ein lokales Website-Buildziel
  ersetzt werden.
- Fehler lassen keinen gemischten oder angeblich erfolgreichen Teilstand
  zurueck.
- Unit-/Contracttests schreiben ausschliesslich in kontrollierte temporaere
  Verzeichnisse; sie veraendern weder Legacy noch akzeptierte Belege.

## Scope nach spaeterem `START WRN-G3-007`

### Erlaubte Schreibpfade

- `packages/content-contracts/src/**` und zugehoerige Tests: additive
  Website-Publikationsvertraege, Mengen-/Hash-/Originvalidierung
- `packages/domain/src/**` und Tests nur fuer plattformneutrale reine
  ID-/Publikationsprojektion; kein HTML, DOM oder Dateisystem
- `packages/test-support/fixtures/wrn-g3-007/**`, Loader und Tests: neue
  manifestgebundene lokale Publikationsfixture ohne Duplikation echter Inhalte
- `apps/website/src/**`, `apps/website/tools/**`, Website-Package-/Buildconfig
  und zugehoerige Tests: statische Landing-Komposition, sicherer Generator und
  lokale Buildintegration
- `tests/e2e/**`: direkte bekannte/unbekannte Landingpfade, Same-ID-Readerlink,
  Metadaten, Reflow und Fehlergrenzen
- `tools/**` nur fuer neue lokale, repositoryeigene G3-007-QA-/Evidenzskripte;
  keine Kopie des Legacygenerators
- `docs/tasks/WRN-G3-007-*`, `docs/evidence/WRN-G3-007/**`,
  `docs/handoffs/WRN-G3-007-*` und notwendige Projektstatusdokumente

### Nicht-Ziele

- keine Aenderung an `apps/mobile/**`, Capacitor oder Android
- keine 935 Legacyseiten, echten Artikel, Bilder, Autorenwerte oder
  Medienassets importieren
- kein produktives Archiv, Redirect-/Aliasregister, Gone-/Tombstone- oder
  Revocation-Overlay
- keine Teilen-Schaltflaeche, Web Share API oder native Sharefunktion
- kein Speichern, Lesestatus, Uebersetzen, Zusammenfassen, Podcast oder Zine
- keine Livefeeds, Datenbank, API, Worker, R2, Analytics oder KI
- keine Apache-/.htaccess-Portierung, Service-Worker-, Cache- oder
  Performancearbeit; diese bleiben spaetere Website-/Releasegates
- kein Fontdownload oder weiterer Markenassetimport
- kein Remote-/CI-Setup, Deployment, Hostinger-Upload, DNS-, Cache- oder
  Suchmaschinenaktion

### Verbotene Aktionen

- Legacy-App, Legacy-Website, Contentrepository oder Liveinfrastruktur
  veraendern, bereinigen oder Generatoren dort mit `--write` ausfuehren
- generierte Landingpages als manuell gepflegte Quelldateien einchecken
- fehlende IDs, Revisionen, Hashes, Herkunft oder Sprache erfinden
- externe URLs waehrend lokaler Tests wirklich aufrufen
- vorhandene G3-001-bis-G3-006-Tests abschwaechen oder ihre freigegebenen
  Erwartungen blind aktualisieren
- Dependencies, Browser oder Programme ohne separates sichtbares Gate laden
- Git-Remote, Push, Deployment, Signierung, Upload oder Veroeffentlichung

## Akzeptanzkriterien

1. Eine neue lokale G3-007-Revision validiert alle Ressourcen, IDs,
   Mengenbeziehungen und Einzelhashes fail-closed.
2. `landingIds` und `sitemapArticleIds` enthalten exakt dieselben drei
   sortierten lokalen IDs; Redirect-/Gone-/Revocationfunktion wird nicht
   behauptet.
3. Derselbe Input erzeugt in zwei unabhaengigen temporaeren Verzeichnissen
   byteidentische Landingpages, Sitemap, Robots und Publikationsmanifest.
4. Jede Landingpage liegt nur unter `articles/<id>/index.html`; unsichere,
   doppelte oder unbekannte IDs sowie Pfadtraversal stoppen vor Publikation.
5. Canonical, `og:url`, JSON-LD `url`, JSON-LD `mainEntityOfPage`, Sitemap-URL
   und Manifestpfad stimmen pro ID exakt ueberein.
6. Alle drei bekannten Direktpfade funktionieren bei lokalem Kaltstart ohne
   clientseitiges Vorwissen; unbekannte Pfade liefern einen ehrlichen 404- oder
   Not-found-Zustand und niemals einen fremden Artikel.
7. `Interaktiv lesen` oeffnet genau dieselbe ID im akzeptierten Website-Reader;
   Zurueck/History und Fokus bleiben nachvollziehbar.
8. Statische Seiten zeigen den vollstaendigen lokalen Inhalt, Quelle, Datum
   und Originalsprache; kein Teaser wird als Volltext ausgegeben.
9. HTML-, Attribut-, JSON-LD-, URL- und Dateipfadinjektionen sind durch
   Negativtests blockiert; externe Quelle wird nie automatisch angefragt.
10. Smartphone, Tablet und Desktop sind markenkonsistent, lesbar und besitzen
    keinen horizontalen Hauptseiten-Overflow; 200-Prozent-Reflow verliert
    keinen Inhalt.
11. Tastaturreihenfolge, sichtbarer Fokus, semantische Ueberschriften,
    Linknamen, Kontrast, Screenreader-Smoke und mindestens 44-Pixel-Ziele sind
    geprueft.
12. Beide bestehenden Clientbuilds und der vollstaendige Hauptcheck bleiben
    GREEN; der Website-Build enthaelt die hashgebundenen Publikationsartefakte,
    der Mobile-Build nicht.
13. Browserlauf meldet null unerwartete Konsolenfehler, null externe Requests,
    null Storage-Schreibzugriffe und null unbeabsichtigte Service-Worker-
    Registrierung im statischen Landingflow.
14. Unabhaengige QA bestaetigt technische, visuelle, Accessibility-, Privacy-
    und Determinismusmatrix mit null offenen Blocker/High; Medium braucht eine
    ausdrueckliche Product-Owner-Entscheidung.
15. Der Product Owner nimmt die sichtbare statische Website-Landingpage anhand
    beschrifteter Kontaktboegen ab. Technische QA ersetzt diese Abnahme nicht.

## Tests und visuelle Belege

### Statisch, Unit und Contract

- Format, Lint, Typen, Importgrenzen und Secret-/Artefaktscan
- Manifest-/Ressourcen-/Hash-/Byte-/Mengenbeziehungsvalidierung
- HTTPS-Origin ohne Credentials, Pfad, Query oder Fragment
- ID-Sortierung, Eindeutigkeit, Subset/Gleichheit/Disjunktheit
- Canonical-/Sitemap-/JSON-LD-Same-ID-Vertrag
- HTML-/JSON-LD-/Attribut-/URL-Escaping und Pfadtraversal-Negativmatrix
- deterministische Doppelgenerierung und absichtlich fehlerhafte
  Zwischenpublikation

### Build und Browser E2E

- beide getrennten Builds; nur Website enthaelt G3-007-Artefakte
- direkter Kaltstart jedes bekannten `/articles/<id>/`-Pfads
- Same-ID-Wechsel von statischer Seite zu `/?article=<id>` und Zurueckweg
- unbekannte sichere ID, syntaktisch unsichere ID, fehlender Inhalt und
  Hash-/Revisionsfehler
- Canonical, Open Graph, JSON-LD, Sitemap und Publikationsmanifest im gebauten
  Paket lesen und vergleichen
- keine echten externen Ziele aufrufen; Originalquelle im Test intercepten

### Verbindliche Screenshotmatrix

Website, beschriftet mit Kandidatencommit, Viewport, Theme/Zustand und Datum:

- 390 x 844: helle bekannte Landingpage
- 390 x 844: dunkle/alternative bekannte Landingpage
- 390 x 844: 200-Prozent-Reflow mit langem Cedar-Artikel
- 600 x 960 oder 800 x 1280: Tablet-Landingpage
- 1024 x 800: Landingpage und sichtbarer Fokus
- 1440 x 900: Desktop-Landingpage
- 1920 x 1080: breite Landingpage
- mindestens ein ehrlicher Unknown-/404-Beleg ohne Artikelinhalt
- Kontaktbogen Legacy-Landingreferenz gegen neue statische Websitekomposition
- Kontaktbogen neue statische Landingpage gegen denselben interaktiven Reader

## Daten, Privacy, Security und Kosten

- ausschliesslich selbst erstellte lokale Testartikel; keine echten Inhalte,
  Bilder, Personen- oder Drittmedien
- kein Netzwerk, keine API, keine KI, keine Cloud und keine laufenden Kosten
- oeffentliche Fixture-IDs und Metadaten; kein Nutzer-, Such-, Lese- oder
  Standortzustand
- kein Local Storage, Session Storage, IndexedDB, Cookie oder Analytics
- Produktionsorigin ist Konfiguration/Metadatum, kein Remoteaufruf
- externe Quellen werden nur nach bewusster Nutzeraktion geoeffnet und in QA
  abgefangen
- erwartete Zusatzkosten: 0 CHF; vorhandene lokale Toolchain verwenden

## Rollback/Ruecknahme

Produktseitiger Rueckkehrpunkt ist der visuell akzeptierte G3-006-Abschluss
`f2821fe`. G3-007 ist additiv und nur Website-spezifisch. Ruecknahme entfernt
den G3-007-Publikationsvertrag, die neue lokale Publikationsfixture, den
statischen Websitegenerator und seine Build-/Testintegration. Der akzeptierte
interaktive Reader, Feed, Entdecken, Navigation, Marke und die Mobile-App
bleiben unveraendert.

Ein spaeteres Websitepaket wird immer als Ganzes auf seinen vorherigen
kompatiblen Commit und seine Contentrevision zurueckgenommen. Dieser Task fuehrt
keinen produktiven Rollback aus.

## Uebergabeformat

- Ausgangs-, Contract-/Publisher-, Websitekandidaten- und QA-Checkpoint
- gelesene Quellen und begruendete Abweichungen vom Legacygenerator
- geaenderte Dateien getrennt nach Contract/Fixture, Publisher und Website
- vollstaendige Test-, Build-, Determinismus-, Same-ID-, Konsole-/Request- und
  Accessibilitybelege
- Publikationsinventar mit Pfaden, Hashes, Bytes, Revision und ID-Mengen
- beschriftete Screenshots und unabhaengiger Visual-QA-Bericht
- offene Findings, Restrisiken und exakter Rueckkehrpunkt
- Handoff nach `docs/templates/AGENT-HANDOFF.md` mit `END-CHECK: :)`
- keine ungefragte Folgefunktion, Remoteaktion oder Deployment

## Freigabegrenze

PO-039 erlaubte ausschliesslich die Dokumentvorbereitung. PO-040 erteilte am
24. August 2026 exakt `START WRN-G3-007`. Damit ist nur der hier geschriebene
Scope in der festgelegten Sequenz Contract/Publisher, Website und unabhaengige
QA freigegeben.

Auch nach einem spaeteren Start bleiben echte Inhalte, das historische Archiv,
Redirects/Gone/Revocation, Share, Apache/Hosting, Android, Remote/CI,
Deployment, Signierung, Upload und Veroeffentlichung separate Gates.

PO-041 akzeptierte am 25. August 2026 den korrigierten Kandidaten `5db27a5`
und die GREEN-Re-QA `02a4e90` visuell. Der WRN-G3-007-Scope ist geschlossen;
die Abnahme startet keinen Folge-Slice und erweitert keine der genannten
Freigabegrenzen.
