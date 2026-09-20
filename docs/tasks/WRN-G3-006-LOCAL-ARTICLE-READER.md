# Task Brief – WRN-G3-006 lokale Artikel-/Readeransicht

## Identitaet

- Task-ID: `WRN-G3-006`
- Titel: lokale, sichere und barrierefreie Artikel-/Readeransicht
- Phase/Welle: G3, erster eng begrenzter Reader-Slice aus Wave 3
- Paritaets-/Risiko-ID: primaer `NEWS-03`; mit `NEWS-04`, `NEWS-08`,
  `NEWS-09`, `SYS-03`, `SYS-07`, `WEB-02` als lokaler Fallbackvorlauf sowie
  den Risiken R-17 und R-27
- Auftraggeber: Product Owner
- Owner-Agent: Chief AI Architect
- spaetere sequenzielle Implementierungsowner: zuerst Backend/Data Reliability
  Engineer fuer Vertrag/Domain/Fixture, danach Frontend Brand Engineer fuer
  beide getrennten Clients
- unabhaengige Abnahme nach Implementierung: QA Release Engineer
- Modellrouting: Terra/high fuer Vertrag und Implementierung; Luna/medium nur
  fuer rein mechanische Belegtabellen; Spark/medium nur fuer eine spaetere,
  exakt begrenzte Kleinkorrektur; Sol/high nur bei Architektur-, Security-
  oder Releaseblocker
- Delegation nach Start: erlaubt, aber nie parallel schreibend; hoechstens ein
  Contract-/Domain-Writer, danach ein Frontend-Writer, danach unabhaengige QA
- Status: **TECHNISCH, UNABHAENGIG UND VISUELL AKZEPTIERT – SCOPE GESCHLOSSEN**
- Vorbereitungsgate: PO-035 am 24. August 2026 mit exakt
  `BEREITE WRN-G3-006 VOR` erteilt
- Implementierungsgate: PO-036 am 24. August 2026 mit exakt
  `START WRN-G3-006` erteilt
- Vorbereitungscheckpoint: `8b7e292f91393a20251954265cd3419b36c73e5c`
- Ausgangscheckpoint: G3-005-Abschluss `3c97cc303c94579b07bd44df22ed6f006e2d66ca`
- Ausgangs-Produktkandidat: `9a9a2216a4fa734596c0742f4c2eaf70d4a75fce`
- Contract-/Domain-/Fixture-Checkpoint: `678e6cf`
- G3-006-Produktkandidat: `206a7e1`
- YELLOW-QA-/Evidenzcheckpoint: `67fea9e`
- RED-QA-/Evidenzcheckpoint: `baa97f8`
- Amendmentgate: PO-037 am 24. August 2026 mit exakt
  `G3-006 H-002 UND M-001 BEHEBEN` erteilt
- M-001-Langtextfixture-Checkpoint: `31b96b4`
- korrigierter H-002-/M-001-Produktkandidat: `6a4c64b`
- GREEN-Re-QA-/Evidenzcheckpoint: `6da7339`
- visuelle Product-Owner-Abnahme: PO-038 am 24. August 2026 mit exakt
  `G3-006 VISUELL AKZEPTIERT` erteilt

## Ziel in beobachtbarer Sprache

Nutzer koennen aus dem akzeptierten Start-Feed und aus den Treffern unter
`Entdecken` einen lokalen Testartikel oeffnen, vollstaendig lesen und sicher
zum ausloesenden Element zurueckkehren. App und Website zeigen denselben
validierten Artikelinhalt und dieselbe Herkunft, erhalten aber eigene,
bildschirmgerechte Reader-Kompositionen.

Der Reader zeigt Titel, vollstaendigen selbst erstellten Text, Quelle, Datum,
Originalsprache, Themen und einen klar gekennzeichneten Weg zur externen
Originalquelle. Unbekannte IDs, fehlende Detaildaten, Integritaetsfehler und
Offlinezustand werden ehrlich behandelt. Es gibt keinen stillen Rueckfall, der
einen Teaser als vollstaendigen Artikel ausgibt.

Dieser Slice erzeugt keine echte Contentquelle, keine Landingpage und keine
Remoteaktion. Er speichert weder Lesefortschritt noch Artikel. Uebersetzung,
Zusammenfassung, Podcast, Zine, Teilen und native Android-Deep-Links bleiben
separate Arbeitspakete.

## Verifizierte Ausgangslage

### Legacy-App

- Autoritative Quelle:
  `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current`
- Gesamt-HEAD: `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- sichtbarer Runtime-Stand:
  `968c320adfe87d1e11e88f99f448a435d4242750`
- `index.html` enthaelt einen nativen Artikeldialog mit Zurueck, Speichern und
  sechs weiteren Aktionen.
- `news-app-2.js` koppelt Detailhydrierung, Archivfallback, Dialog/History,
  Lesefortschritt, Speichern, Uebersetzung, Zusammenfassung, Podcast, Zine,
  Lesestatus, Teilen, Bilder, verwandte Artikel und Originalquelle.
- Sichtbaseline G1-002: Reader und funktionierender Zurueckweg vorhanden;
  Escape schloss den Dialog nicht; die horizontale Aktionsleiste war breiter
  als der mobile Sichtbereich; einzelne Ziele unterschritten 44 CSS-Pixel.

### Legacy-Website

- Autoritative Quelle:
  `C:\Users\patri\Documents\World Revolution News\wrn-web-portal-2026-08-20-r10n-work`
- HEAD: `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- Website besitzt denselben interaktiven Dialog plus 935 statische
  `/articles/<id>/`-Verzeichnisse und einen `?article=<id>`-Fallback.
- `news-app-2-website.js` mutiert URL, Canonical, OpenGraph, Twitter- und
  JSON-LD-Metadaten zur Laufzeit und versucht direkte Artikel-IDs aus mehreren
  Feedpfaden wiederherzustellen.
- Das vorhandene `article-landing-manifest.json` nennt Schema, Sitemap,
  Pfadmuster und Fallback, aber keine IDs, Artikelzahl oder Contentrevision.
  935 Artikelverzeichnisse und 937 Sitemap-URLs sind beobachtet; ihre
  Same-Revision-/Same-ID-Beziehung ist nicht bewiesen.
- Sichtbaseline G1-006 bestaetigt Reader und statische Landingpage, aber auch
  das wirkungslose Escape. Apachefallback und Same-ID-Canonical bleiben offen.

### Neues Zielrepository

- `LocalArticle` enthaelt sichere Feedmetadaten, aber bewusst keinen
  Artikelkoerper.
- Der Manifest-v1- und Discover-v1-Vertrag sowie der akzeptierte Feed und die
  Suche duerfen nicht in-place gebrochen werden.
- Drei selbst erstellte, manifestgepruefte Artikel-IDs sind die einzige
  erlaubte Inhaltsbasis dieses Slices.
- Start und Entdecken sind getrennte Clientansichten; bislang existiert kein
  echter Reader und keine Artikel-Oeffnen-Aktion.

Details und die Paritaetsentscheidung stehen in
`docs/evidence/WRN-G3-006-READER-PARITY-AND-ACCEPTANCE-BRIEF.md`.

## Verbindlicher fachlicher Vertrag

### Additiver Reader-Detailvertrag

Der bestehende Artikel-/Manifest-v1-Vertrag bleibt unveraendert. Nach dem
separaten Startgate darf ein eigener `wrn.local-reader-details.v1`-Vertrag
entstehen. Er besitzt mindestens:

- explizite Contract-/Schemaversion und immutable Fixture-Revision;
- einen Integritaets-SHA-256 ueber die kanonische Detailressource;
- pro Eintrag genau eine bestehende `articleId`;
- exakt dieselbe ID-Menge wie die zur Laufzeit bereits manifestvalidierten
  `LocalArticle`-Records;
- ausschliesslich strukturierte, selbst erstellte Inhaltsbloecke;
- keine duplizierten Quellen-, Datums-, Sprach-, Rechte-, Transformations-
  oder Uebersetzungsmetadaten; diese bleiben autoritativ im Artikelrecord.

Zulaessige Inhaltsbloecke fuer diesen ersten Slice:

- Absatz: nichtleerer reiner Text;
- Zwischenueberschrift: Ebene 2 oder 3, nichtleerer reiner Text;
- Zitat: nichtleerer Text, optionale nichtleere Zuschreibung;
- geordnete oder ungeordnete Liste mit mindestens einem nichtleeren Eintrag.

Raw HTML, Markdownausfuehrung, eingebettete Skripte, Iframes, Formulare,
Trackingparameter, Inline-Eventhandler, Remote-Medien und beliebige
Inhaltslinks sind im Detailvertrag verboten. Der Originalquellenweg stammt
ausschliesslich aus dem bereits validierten `originalUrl` des Artikelrecords.

Fehlende, doppelte, fremde oder hashabweichende Detail-IDs verhindern einen
Reader-Ready-Zustand fail-closed. Ein Feedteaser wird niemals als angeblich
vollstaendiger Artikel gerendert.

### Readerauflosung und lokale Routen

Eine reine Domainfunktion loest eine angeforderte Artikel-ID gegen die bereits
validierten Artikel und Readerdetails auf. Sie kennt kein DOM, Storage,
Netzwerk, Browser-History oder Clientlayout.

- bekannte ID plus valides Detail: `ready`;
- syntaktisch ungueltige oder unbekannte ID: `not-found` ohne erfundenen Inhalt;
- Detail-/Hash-/Mengenfehler: `error` und kein Readerbody;
- Offline plus bereits valides lokales Detail: weiterhin `ready` mit sichtbarer
  lokaler Offlineinformation;
- Loading bleibt ein ehrlicher Zwischenzustand und erzeugt keinen Fakeinhalt.

Mobile Preview verwendet eine stabile clientlokale Route auf Basis der
Artikel-ID, empfohlen `#article/<encoded-id>`. Die Website verwendet fuer
diesen begrenzten interaktiven Fallback `?article=<encoded-id>`. Routing wird
je Client implementiert und darf nicht im Domainpaket versteckt werden.

Die Website-URL ist in G3-006 noch keine SEO-Canonical- oder Sharezusage.
Statische `/articles/<id>/`-Landingpages, Sitemap, Redirects, Archivmengen und
Canonical-Ausgabe brauchen einen separaten revisionsgebundenen Folge-Slice.

### Bedienvertrag

- Feed- und Discoverkarten erhalten eine klar benannte Aktion
  `Artikel lesen` beziehungsweise eine gleichwertige, vom Product Owner
  sichtbare Formulierung.
- Der Reader ist eine eigene semantische Clientansicht, kein ungeprueft
  kopierter Legacydialog.
- Nach dem Oeffnen liegt der Fokus sinnvoll auf Readerueberschrift oder
  Zurueckziel.
- Sichtbares `Zurueck`, Browser-Zurueck/Vorwaerts und Escape schliessen den
  Reader ohne doppelten Historyeintrag.
- Nach Schliessen kehrt der Fokus zum ausloesenden Feed-/Discoverziel zurueck;
  bei direktem Kaltstart fuehrt Zurueck ehrlich zu `Start`.
- Refresh eines validen lokalen Deep Links stellt denselben Artikel wieder her.
- unbekannte IDs erhalten eine klar benannte Nicht-gefunden-Ansicht mit
  erreichbarem Rueckweg; die ID wird nicht als Inhalt oder Quelle interpretiert.
- Mobile Bottom-Navigation und Websitehauptnavigation bleiben erhalten und
  duerfen den Reader nicht verdecken.

### Herkunft und externer Originalquellenweg

Quelle, Datum, Originalsprache beziehungsweise `Unbekannt`, Themen und
Originalquellenziel werden aus dem validierten Artikelrecord unveraendert
angezeigt. Der Reader kennzeichnet deutlich, dass die Originalquelle eine
externe Website ist.

Vor dem externen Oeffnen erscheint eine einfache, neutrale Bestaetigung mit
Quellenname und Zielhost. Erst die zweite bewusste Aktion darf das sichere
HTTPS-Ziel oeffnen. Externe Links verwenden mindestens `noopener`,
`noreferrer` und `no-referrer`; es gibt kein automatisches Prefetching, keine
Telemetrie und keine Weitergabe der Reader-ID als Zusatzparameter.

## Scope

### Erlaubte Schreibpfade erst nach `START WRN-G3-006`

- `packages/content-contracts/src/**` und zugehoerige Tests: additiver lokaler
  Readerdetailvertrag, Hash- und exakte ID-Mengenvalidierung
- `packages/domain/src/**` und Tests: reine Readerauflosung und ehrliche
  Zustandsprojektion ohne Clientwissen
- `packages/test-support/fixtures/**`, `src/**` und Tests: ausschliesslich
  selbst erstellte, hashgebundene Readerdetails fuer die drei bestehenden IDs
- `apps/mobile/src/**`: eigene mobile Readeransicht, lokale Route, History,
  Fokus, Escape und Originalquellenbestaetigung
- `apps/website/src/**`: eigene responsive Readeransicht, lokaler
  `?article=`-Fallback, History, Fokus, Escape und Quellenbestaetigung
- eng notwendige Tests unter `tests/e2e/**`
- WRN-G3-006-Dokumentation, Screenshots und lokale Evidenzgeneratoren unter
  `docs/**` beziehungsweise `tools/**`

Rootkonfiguration, Dependencies und Lockfile bleiben gesperrt. Der vorhandene
Stack reicht fuer diesen Slice.

### Nicht-Ziele

- keine Legacydateikopie und kein Import echter Artikeltexte oder Bilder
- keine echte Contentquelle, Detailchunks, Archivabfrage oder Datenbank
- keine statischen Landingpages, Sitemap, Canonical-, OpenGraph-, JSON-LD-,
  Apache- oder SEO-Generatoraenderung
- keine historischen IDs, Redirects, Aliase, Tombstone-/Revocationmigration
  oder Gone-Content-Auslieferung; nur der sichere Unknown-ID-Zustand
- kein Teilen und keine Share-URL-Zusage
- kein Speichern, Lesestatus, Lesefortschritt oder Scrollpositionspersistenz
- keine Uebersetzung, Zusammenfassung, Podcast, Text-to-Speech oder Zineaktion
- keine verwandten Artikel, Empfehlungslogik oder Ranking
- keine Remote-Bilder, Galerie, Video, Audio oder andere Medien
- keine Nutzerkonten, Telemetrie, Analytics oder Contentlogging
- kein nativer Android-/Capacitor-Deep-Link, Android-Back-Adapter oder Share-
  Bridge; dies folgt spaeter mit getrenntem Geraetegate
- kein Fontdownload, Remote/CI, Deployment, Signierung, Upload oder
  Veroeffentlichung

### Verbotene Aktionen

- jede Aenderung in Legacy-App, Legacy-Website, Contentrepository oder
  Liveinfrastruktur
- `LocalArticle`, Manifest v1 oder Discover v1 in-place inkompatibel erweitern
- Teaser, Titel oder andere Metadaten als vollstaendigen Artikel ausgeben
- Raw HTML oder unbereinigte externe Inhalte in die lokale Fixture uebernehmen
- Originalquelle, Sprache, Rechte oder Transformation aus Text heuristisch
  erraten
- beim Rendern oder Teststart externe Requests ausloesen
- nicht implementierte Legacyaktionen als funktionsfaehige Buttons anzeigen
- Tests abschwaechen, Snapshots blind aktualisieren oder Warnungen ausblenden

## Akzeptanzkriterien

1. Readerdetails sind separat versioniert, kanonisch hashgebunden und besitzen
   exakt dieselbe Artikel-ID-Menge wie die zur Laufzeit validierten
   Artikelrecords; jede Abweichung stoppt fail-closed.
2. Die Detailressource akzeptiert nur die definierten semantischen Bloecke und
   weist Raw HTML, leere Texte, unzulaessige Headingebenen, fremde Links,
   Zusatzfelder und doppelte IDs ab.
3. App und Website zeigen fuer dieselbe ID dieselben Titel-, Quellen-, Datums-,
   Sprach-, Themen- und Textinformationen ohne Metadatenduplikation.
4. Jeder bestehende Feed- und Discovertreffer besitzt genau einen klaren
   Reader-Einstieg; unbekannte oder ungueltige IDs zeigen keine fremden oder
   erfundenen Inhalte.
5. Oeffnen, sichtbares Zurueck, Escape, Browser-Zurueck/Vorwaerts, Refresh und
   direkter Kaltstart verhalten sich je Client deterministisch und erzeugen
   keine Historyschleife.
6. Nach normalem Schliessen kehrt der Fokus zum exakten Ausloeser zurueck; bei
   direktem Einstieg existiert ein ehrlicher Rueckweg zu Start.
7. Offline mit bereits validierter Fixture bleibt lesbar. Loading,
   Integritaetsfehler, fehlendes Detail und Unknown-ID sind klar, semantisch
   benannt und ohne stillen Teaserfallback.
8. Originalquelle ist als extern gekennzeichnet, benoetigt eine zweite
   bewusste Bestaetigung und besitzt sichere Linkattribute. Vor Bestaetigung
   und in allen automatischen Standardflows entstehen null externe Requests.
9. Reader und Quellenbestaetigung sind per Tastatur und Screenreader
   bedienbar; Fokus ist sichtbar, Escape wirkt, Dialogfokus ist eingeschlossen
   falls ein Dialog genutzt wird, und alle sichtbaren Ziele sind mindestens
   44 x 44 CSS-Pixel.
10. App und Website funktionieren von 320 bis 1920 Pixeln, im Querformat,
    Hell/Dunkel und bei 200-Prozent-Reflow ohne verlorenen Text, verdeckte
    Navigation oder horizontalen Hauptseiten-Overflow.
11. Artikeltext bleibt bei langen Absaetzen, Zitaten, Listen, unbekannter
    Sprache und fehlenden optionalen Metadaten lesbar; keine willkuerliche
    Ellipsenkuerzung ersetzt vollstaendigen Inhalt.
12. Alle bestehenden Tests, Importgrenzen und beide Produktionsbuilds bleiben
    gruen. Unabhaengige QA meldet null offene Blocker/High; Medium benoetigt
    eine dokumentierte Product-Owner-Entscheidung.
13. Der Product Owner nimmt App- und Website-Reader anhand beschrifteter,
    commitgebundener Screenshots ab. Diese Abnahme gilt nicht fuer die
    ausgeschlossenen Aktionen oder SEO-/Archivfunktionen.

## Tests und visuelle Belege

### Automatisiert

- Format, Lint, Typen, Importgrenzen, Fixtureprovenienz und bestehende Tests
- Contracttests fuer Schema, Version, kanonischen Hash, exakte ID-Menge,
  Duplikate, fremde/fehlende IDs, Blocktypen und Zusatzfelder
- Domaintests fuer bekannte, unbekannte, ungueltige und fehlende IDs sowie
  stabile Metadatenbindung und fail-closed Zustandsprojektion
- Komponenten-/Integrationstests fuer Oeffnen aus Start und Entdecken,
  Ready/Loading/Error/Offline/Not-found, Rueckkehrfokus, Escape und
  Quellenbestaetigung
- Browser-E2E fuer App-Hash und Website-Query, Kaltstart, Refresh,
  Zurueck/Vorwaerts, direkte Unknown-ID, keinen Historyloop und null
  unerwartete Requests
- Axe-Smoke, Tastatur-only, Fokusfalle bei Bestaetigungsdialog, 44-Pixel-
  Messung, 200-Prozent-Reflow, Overflow, Konsole und Storage-/Requestcheck
- beide Produktionsbuilds; kein Android-, SEO-Generator- oder Deploymentlauf

### Verbindliche visuelle Matrix

- Mobile-App: 320 x 568, 390 x 844, 600 x 960 und 844 x 390; Hell/Dunkel,
  langer Reader, Quellenbestaetigung, Not-found und 200-Prozent-Reflow
- Website: 390 x 844, 800 x 1280, 1024 x 800, 1440 x 900 und 1920 x 1080;
  Hell/Dunkel, enger/breiter Reader, Quellenbestaetigung, Not-found und
  200-Prozent-Reflow
- pro Client mindestens: Einstieg aus Start, Einstieg aus Entdecken,
  vollstaendiger Reader, Rueckweg/Fokus, Offline und Fehler/Unknown
- Alt-vs.-Neu-Bezug auf G1-Appreader, G1-Webreader und statische
  Landingpagereferenz; sichtbare Abweichungen werden erklaert
- Kontaktboegen tragen Kandidatencommit, Viewport, Theme, Zustand und Datum

## Daten, Privacy, Security und Kosten

- ausschliesslich selbst erstellte lokale Artikelbloecke; keine echten Texte,
  Bilder, personenbezogenen Daten oder fremden Medien
- kein Netzwerk im Standardflow, keine APIs, keine KI und keine Cloudkosten
- URL enthaelt nur eine oeffentliche lokale Fixture-ID, keinen Suchtext,
  Lesestatus oder Nutzerwert
- keine Speicherung in Local Storage, Session Storage oder IndexedDB
- externe Quelle nur nach bewusster Bestaetigung; im Test sicher gemockt oder
  interceptiert, nicht real aufgerufen
- Laufzeitkosten: 0 CHF; vorhandene Dependencies und Browserbinaries
- nach Start maximal zwei schreibende Fachinstanzen nacheinander plus eine
  unabhaengige QA; keine parallele Dateiarbeit

## Rollback/Ruecknahme

Produktseitiger Rueckkehrpunkt ist der akzeptierte G3-005-Abschluss
`3c97cc303c94579b07bd44df22ed6f006e2d66ca`. Der Reader wird additiv hinter
den neuen lokalen Artikelaktionen und Routen aufgebaut. Ruecknahme entfernt
nur Readerdetailvertrag, Fixture, Clientprojektion und deren Tests; Feed,
Entdecken, Navigation und Marke bleiben unveraendert.

Legacy-App, Website, Content und Live-Systeme sind nie Teil dieses Rollbacks.

## Uebergabeformat

- Ausgangs-, Contract-, Produktkandidaten- und Evidenzcheckpoint
- gelesene Quellen und begruendete Legacyabweichungen
- geaenderte Dateien getrennt nach Contract/Domain, Mobile und Website
- vollstaendige Test-, Build-, URL-/History-, Konsole-/Request- und A11ybelege
- beschriftete Screenshots und unabhaengiger Visual-QA-Bericht
- offene Findings, Restrisiken und exakter Rueckkehrpunkt
- Handoff nach `docs/templates/AGENT-HANDOFF.md` mit `END-CHECK: :)`
- keine ungefragte Folgefunktion, Remoteaktion oder Deployment

## Freigabegrenze

PO-035 erlaubte ausschliesslich die Dokumentvorbereitung. PO-036 erteilte am
24. August 2026 exakt `START WRN-G3-006`. Damit ist nur der hier geschriebene
lokale Readerkern freigegeben. Die Mitarbeiter arbeiten strikt sequenziell:
zuerst Contract/Domain/Fixture, danach Frontend und danach unabhaengige QA.
SEO, Archive, Share, Persistenz, Uebersetzung, Medien, Android und Produktion
bleiben eigene Gates.

Der Product Owner erteilte am 24. August 2026 mit exakt
`G3-006 VISUELL AKZEPTIERT` die visuelle Abnahme des korrigierten Kandidaten
`6a4c64b` und der GREEN-Re-QA `6da7339`. WRN-G3-006 ist geschlossen. Diese
Abnahme erweitert keinen der ausgeschlossenen Bereiche und startet keinen
Folgetask.
