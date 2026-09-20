# Task Brief – WRN-G3-005 Entdecken: lokale Suche und Filter

## Identitaet

- Task-ID: `WRN-G3-005`
- Titel: funktionales `Entdecken` mit lokaler Suche und Filtern
- Phase/Welle: G3, erster Funktionsslice nach akzeptierter Navigation
- Paritaets-/Risiko-ID: primaer `NEWS-02`; mit `NEWS-08`, `NEWS-09`,
  `UX-03`, `UX-04`, `UX-05`, `UX-07` und lokaler Offlinegrenze
- Auftraggeber: Product Owner
- Owner-Agent: Chief AI Architect
- spaeterer Implementierungsowner: Frontend Brand Engineer
- unabhaengige Abnahme nach Implementierung: QA Release Engineer
- Modellrouting: Terra/high fuer Vertrag, Domainlogik und beide Clients;
  Luna/medium nur fuer deterministische Matrizen; Sol/high nur bei einem
  Architektur-, Security- oder Releaseblocker
- Delegation nach Start: hoechstens ein schreibender Implementierungsagent und
  danach ein unabhaengiger QA-Agent; keine parallele Schreibarbeit
- Status: **TECHNISCH, UNABHAENGIG UND VISUELL AKZEPTIERT – SCOPE GESCHLOSSEN**
- Vorbereitungsgate: PO-031 am 24. August 2026 erteilt
- benoetigtes Implementierungsgate: exakt `START WRN-G3-005`
- Implementierungsgate: PO-032 am 24. August 2026 erteilt
- visuelle Product-Owner-Abnahme: PO-034 am 24. August 2026 mit exakt
  `G3-005 VISUELL AKZEPTIERT` erteilt
- Ausgangs-Produktkandidat: `3d89fbc05c5349aed4f7caff11099d40b26febb2`
- Ausgangs-QA-/Evidenzcheckpoint: `febe7cd57f2c8c3c71498c12f983f59ec96f2771`
- G3-004-Abschlusscheckpoint: `539ee020c553b1b158eaefe56e997c7671bb9d3f`
- G3-005-Produktkandidat: `9a9a2216a4fa734596c0742f4c2eaf70d4a75fce`
- G3-005-QA-/Evidenzcheckpoint: `a84c445`
- ergaenzender identischer 100-Prozent-Hell-/Dunkel-Vergleich nach
  Product-Owner-Rueckfrage: `472088e`; keine Geometrieabweichung und keine
  Produktaenderung
- finale QA: 61 Unit-/Contract-/Komponententests, 16 Boundarytests, beide
  Builds, 32 ausgefuehrte Browser-E2E-Tests und 13-Screenshot-Matrix GREEN;
  null offene Findings

## Ziel in beobachtbarer Sprache

Das bereits erreichbare Ziel `Entdecken` wird in App und Website zu einer
echten, rein lokalen Such- und Filteransicht. Nutzer koennen die vorhandenen,
manifestgeprueften Testartikel nach Titel, Teaser, Quelle und expliziter
Klassifikation durchsuchen sowie nach Region, Thema, Quelle, Originalsprache
und Format filtern. Ergebniszahl, aktive Filter und Zuruecksetzen sind immer
klar erkennbar.

Die fachliche Auswertung ist eine gemeinsame reine Domainfunktion. App und
Website erhalten weiterhin eigene responsive Oberflaechen. Der akzeptierte
`Start`-Feed, seine Reihenfolge und Provenienz bleiben unveraendert. Andere
Navigationsziele bleiben ehrliche Zwischenzustaende.

Dieser Slice verwendet ausschliesslich selbst erstellte lokale Fixtures. Er
ruft keine Livequelle, keine Uebersetzung und keine KI/API auf und speichert
keinen Suchtext oder Nutzungsverlauf.

## Verifizierte Ausgangslage

- Die Legacy-App und -Website fuehren die Header-Suche in `Entdecken` und
  bieten dort Freitext, Region, Thema, Quelle, Quellsprache, Herkunft und
  Format sowie Zeitraum, Sortierung und Ansichtsmodi an.
- Die Legacy-Freitextsuche vergleicht Titel, Einleitung, Quelle, primaere
  Region und primaeres Thema; Filter werden gemeinsam eingeschraenkt.
- Region und Thema sind einzelne aktive Werte. Quelle, Sprache, Herkunft und
  Format sind ebenfalls Einzelauswahlen. Die Legacy-Quelle persistiert einen
  Teil dieser Auswahl lokal, aber nicht den Suchtext.
- Der G1-Sichtbeleg fand keinen eindeutigen expliziten Such-/Filterreset. Das
  Zielsystem muss einen klaren Reset besitzen.
- Der aktuelle Zielvertrag `LocalArticle` besitzt sichere Felder fuer Titel,
  Teaser, Quelle, Originalsprache und Tags, aber noch keine getrennte
  redaktionelle Region, Themenklassifikation oder Formatklassifikation.
- Das bestehende Fixture enthaelt drei selbst erstellte Artikel und bleibt die
  einzige Datenquelle dieses Slices.

Details und bewusst aufgeschobene Legacyfunktionen stehen in
`docs/evidence/WRN-G3-005-DISCOVER-PARITY-BRIEF.md`.

## Verbindlicher fachlicher Vertrag

### Suchfelder

Die einfache Suche vergleicht ausschliesslich diese expliziten lokalen Felder:

1. Titel
2. Teaser
3. sichtbarer Quellenname
4. redaktionell gesetzte Region
5. redaktionell gesetzte Themen
6. sichtbares Formatlabel

Keine Volltextsuche in nicht vorhandenen Artikelkoerpern, keine Suche in
Uebersetzungen und keine Ableitung aus URLs, Rechtehinweisen oder internen
Referenzen. Normalisierung ist deterministisch: trimmen, mehrere Leerzeichen
zusammenfassen, Unicode-NFKC und locale-unabhaengige Kleinschreibung. Keine
unsichtbare Fuzzy-Suche, kein Stemming, keine Synonyme und kein Ranking.

Mehrere Suchwoerter werden als gemeinsame Einschraenkung behandelt: Jeder
nichtleere normalisierte Suchterm muss in mindestens einem erlaubten Feld des
Artikels vorkommen. Exakte Wortgrenzen sind nicht erforderlich; Teilstrings
sind erlaubt und werden getestet.

### Filterfacetten

- Region: genau eine oder `Alle Regionen`
- Thema: genau eines oder `Alle Themen`
- Quelle: genau eine oder `Alle Quellen`
- Originalsprache: genau eine oder `Alle Sprachen`; `und` bleibt sichtbar als
  `Unbekannt` und wird nie geraten
- Format: genau eines oder `Alle Formate`; fuer diesen Slice kontrollierte
  Werte `news`, `analysis`, `commentary`, `interview`, `press-release`

Suche und alle aktiven Facetten gelten mit logischem `AND`. Themen duerfen in
einem Artikel mehrere Werte besitzen; die Themenauswahl trifft, wenn einer
davon exakt passt. Ergebnisreihenfolge bleibt die manifestgebundene Reihenfolge
des akzeptierten Feeds. Es gibt weder Relevanzscore noch verdeckte
Quellengewichtung.

### Klassifikationsvertrag ohne v1-Umschreibung

Der bestehende Artikel-/Manifest-v1-Vertrag darf nicht still um neue
Pflichtfelder erweitert werden. Nach dem Start ist fuer Region, Themen und
Format ein eigener, hashgepruefter lokaler Discover-Index v1 zulaessig. Jeder
Indexeintrag referenziert genau eine vorhandene Artikel-ID; fehlende,
doppelte oder fremde IDs lassen den Discover-Ready-Zustand fail-closed
scheitern. Quelle und Originalsprache bleiben autoritativ im Artikelrecord und
werden im Index nicht dupliziert.

Der Index enthaelt nur selbst erstellte Testklassifikationen, eine deklarierte
Schema-/Revisionskennung und einen Integritaetshash. Er veraendert weder die
akzeptierte Artikelressource noch den produktiven Contentvertrag. Eine spaetere
Anbindung echter Inhalte braucht einen eigenen versionierten Datenrelease-
Task.

### Sichtbare Zustaende

- Initial: alle drei lokalen Artikel, Ergebniszahl und vollstaendige Facetten
- Aktiv: Suchtext/Filter, Ergebniszahl und einzelne entfernbare Auswahl klar
  sichtbar
- Keine Treffer: klare Meldung, aktive Kriterien und erreichbarer
  `Alle Filter zuruecksetzen`-Button
- Loading/Error/Offline/Integritaetsfehler: vorhandene ehrliche lokale
  Zustandslogik ohne erfundene Ergebnisse; Offline mit validiertem Fixture ist
  weiterhin bedienbar
- Rueckkehr nach `Start` und erneutem `Entdecken`: innerhalb derselben offenen
  Sitzung darf der Clientzustand erhalten bleiben; Refresh/Neustart startet
  bewusst leer. Suchtext und Filter landen weder in Local Storage noch in
  URL-Parametern, Telemetrie oder Netzwerkrequests.

## Scope

### Erlaubte Schreibpfade erst nach `START WRN-G3-005`

- `packages/content-contracts/src/**` und `tests/**`: additive Definition und
  fail-closed Validierung des lokalen Discover-Index; Manifest-/Artikel-v1
  bleibt kompatibel
- `packages/domain/src/**` und `tests/**`: reine Normalisierung, Facetten,
  Filterkombination, ID-/Reihenfolge- und Zustandsvertraege
- `packages/test-support/fixtures/**`, `src/**` und `tests/**`: ausschliesslich
  selbst erstellter, hashgebundener Discover-Index und Testfaelle
- `apps/mobile/src/**`: eigene mobile Entdecken-Ansicht und clientlokaler
  ephemerer Zustand
- `apps/website/src/**`: eigene responsive Website-Entdecken-Ansicht und
  clientlokaler ephemerer Zustand
- eng notwendige vorhandene Tests unter den App- und `tests/e2e/**`-Pfaden
- WRN-G3-005-Dokumentation, Screenshots und rein lokale Evidenzgeneratoren
  unter `docs/**` beziehungsweise `tools/**`

Rootkonfiguration, Dependencies und Lockfile duerfen nur nach einer neuen
sichtbaren Einzelfreigabe geaendert werden. Der vorhandene Stack reicht fuer
diesen Slice.

### Nicht-Ziele

- keine echte Contentquelle, Archive, 7-/30-Tage-Nachladung oder Quellenarchiv
- keine Zeitraumfilter, Sortierwahl, Relevanzranking oder Ansichtsmodi
- keine Herkunftsland-/Quellenregisterlogik ueber die sichtbare Region hinaus
- kein Autocomplete, Suchvorschlag, Fuzzy Matching, Stemming oder Synonymdienst
- keine URL-/SEO-Suchseiten und keine persistierten oder teilbaren Suchabfragen
- keine Uebersetzung und keine Suche in uebersetzten Texten
- kein Reader, Speichern, Personalisieren, Teilen oder Lesestatus
- keine Events, Bibliothek, Lexikon, Hilfe, Medien oder andere Spezialmodule
- keine echten Daten, Datenbank, Worker, API, Telemetrie oder KI-Aufrufe
- kein Fontdownload, Android, Remote/CI, Deployment, Signierung oder Upload

### Verbotene Aktionen

- jede Aenderung in Live-App, Website, ihren Repositories oder Infrastruktur
- bestehendes Manifest-/Artikel-v1-Schema in-place brechen
- Region, Thema, Sprache oder Format aus Textmustern erraten
- Suchtext, Filter oder Treffer fuer Personalisierung oder Analyse speichern
- unechte Treffer, erfundene Facetten oder Ergebnisse aus Integritaetsfehlern
- gemeinsame plattformuebergreifende UI-Komponenten erzwingen
- `Start`-Feed, Navigation, Marke, Links oder Provenienz unbemerkt veraendern
- Tests abschwaechen oder alte Erwartungen nur passend umschreiben

## Akzeptanzkriterien

1. Der neue Discover-Index ist separat versioniert, hashgebunden und besitzt
   exakt dieselbe Artikel-ID-Menge wie die manifestgebundene lokale
   Artikelressource; jede Abweichung wird fail-closed getestet.
2. Eine reine Domainfunktion normalisiert Abfragen, erzeugt Facetten und
   filtert ohne DOM, Storage, Uhrzeit, Zufall, Netzwerk oder Clientwissen.
3. Suchfelder, Mehrwortsemantik, Teilstrings, Unicode, Leerzeichen und leere
   Abfrage entsprechen exakt diesem Task Brief.
4. Region, Thema, Quelle, Originalsprache und Format funktionieren einzeln und
   in allen fachlich relevanten Kombinationen; Suche gilt zusaetzlich mit AND.
5. Ergebnis-IDs und Reihenfolge bleiben in App und Website identisch zum
   Domainergebnis; Provenienzfelder werden unveraendert weitergegeben.
6. `Alle Filter zuruecksetzen` loescht Suchtext und jede Facette in einem
   beobachtbaren Schritt, setzt die Ergebniszahl zurueck und fuehrt den Fokus
   sinnvoll zum Suchfeld oder zur Ergebnisueberschrift.
7. Leere Treffer, unbekannte Sprache, ungueltige Filterwerte und
   Indexintegritaetsfehler zeigen ehrliche, barrierefreie Zustaende ohne
   stillen Fallback auf falsche Ergebnisse.
8. Suchfeld, Facettengruppen, aktive Werte, Ergebniszahl und Reset sind per
   Tastatur und Screenreader benannt; Live-Updates sind hoeflich, nicht
   spamartig; Zielzonen sind mindestens 44x44 CSS-Pixel.
9. App und Website bleiben bei 320 bis 1920 Pixeln, Querformat, Dark/Light und
   200-Prozent-Reflow ohne verlorene Funktion oder horizontalen
   Hauptseiten-Overflow.
10. Kein Testlauf erzeugt externe Requests. Storage-/URL-Negativtests belegen,
    dass Suchtext und Filter nicht persistent oder uebertragen werden.
11. Alle bisherigen Tests und beide Produktionsbuilds bleiben gruen.
12. Unabhaengige QA meldet null offene Blocker/High; Medium braucht eine
    dokumentierte Product-Owner-Entscheidung. Der Product Owner nimmt die
    sichtbare Funktion anhand beschrifteter Belege ab.

## Tests und visuelle Belege

### Automatisiert

- Format, Lint, Typen, Importgrenzen und bestehende Tests
- Contracttests fuer Indexschema, Hash, Version, exakte ID-Menge, Duplikate,
  fremde/fehlende IDs und ungueltige Facetten
- tabellengetriebene Domaintests fuer Suchnormalisierung, Mehrwort-/Teilstring,
  Unicode, alle Facetten, AND-Kombinationen, Reset und stabile Reihenfolge
- Komponenten-/Integrationstests fuer Initial-, Aktiv-, Nulltreffer-, Offline-
  und Integritaetsfehlerzustand sowie Fokus und Live-Region
- Browser-E2E fuer Header-/Navigationsweg nach `Entdecken`, direkte lokale
  Wiederherstellung, Such-/Filterkombination, Einzelreset, Gesamtreset,
  Zurueck/Vorwaerts und Refresh ohne Persistenz
- Axe-Smoke, Tastatur-only, 44-px-Zielmessung, Reflow, Overflow, Konsole,
  Storage-/URL-/Request-Negativtest
- beide Produktionsbuilds; kein Android- oder Deploymentlauf

### Verbindliche visuelle Matrix

- Mobile-App: 320x568, 360x800, 390x844, 412x915, 600x960 und 844x390;
  Dark, Light sowie mindestens ein 200-Prozent-Reflowbeleg
- Website: 390x844, 800x1280, 1024x800, 1440x900 und 1920x1080; Dark, Light
  sowie mindestens ein 200-Prozent-Reflowbeleg
- pro Client sichtbar: Initialzustand, Textsuche, kombinierte Filter,
  Nulltreffer mit Reset und mindestens eine lange/mehrsprachige Beschriftung
- beschriftete App-/Website-Kontaktboegen mit Kandidatencommit, Viewport,
  Theme, Zustand und Datum; Legacybilder nur als read-only Richtungsreferenz

## Daten, Privacy, Security und Kosten

- ausschliesslich selbst erstellte lokale Fixturetexte und Klassifikationen
- keine Nutzerkonten, Telemetrie, Geolocation oder Remote-Runtimeanfrage
- Suchtext und Filter nur im Arbeitsspeicher der offenen Clientinstanz
- API-/KI-Laufzeitkosten: 0 CHF
- vorhandene Dependencies und Browserbinaries; kein Download vorgesehen
- maximal ein schreibender Implementierungsagent, danach unabhaengige QA

## Rollback/Ruecknahme

Nach dem separaten Startgate wird ein eigener Branch/Checkpoint vom
dokumentierten Vorbereitungsstand angelegt. Produktseitiger Rueckkehrpunkt ist
der akzeptierte G3-004-Kandidat
`3d89fbc05c5349aed4f7caff11099d40b26febb2` plus Abschlusscheckpoint
`539ee020c553b1b158eaefe56e997c7671bb9d3f`. Legacy-App, Website und
Live-Systeme sind nie Teil des Rollbacks.

## Uebergabeformat

- Ausgangs-, Produktkandidaten- und Evidenzcheckpoint
- geaenderte Dateien nach Eigentumsbereich
- Such-/Facettenvertrag und begruendete Legacyabweichungen
- Testergebnisse, Konsolen-/Storage-/URL-/Requestbericht und Buildstatus
- beschriftete Screenshots und Visual-QA-Bericht
- Annahmen, Findings, Restrisiken und exakter Rueckkehrpunkt
- Handoff nach `docs/templates/AGENT-HANDOFF.md` mit `END-CHECK: :)`
- keine ungefragte Folgefunktion oder externe Aktion

## Freigabegrenze

PO-031 erlaubte nur die Dokumentvorbereitung. Der Product Owner erteilte am
24. August 2026 exakt `START WRN-G3-005`. PO-032 erlaubt damit ausschliesslich
den hier beschriebenen lokalen Slice und die festgelegte Mitarbeitersequenz;
alle Nicht-Ziele und externen Gates bleiben gesperrt.

Der Kandidat `9a9a2216a4fa` ist technisch und unabhaengig GREEN. Der Product
Owner erteilte am 24. August 2026 mit exakt `G3-005 VISUELL AKZEPTIERT` die
visuelle Produktfreigabe fuer diesen lokalen Slice. WRN-G3-005 ist damit
geschlossen. Es wird weder nachgebessert noch ein Folgefeature automatisch
begonnen; alle Nicht-Ziele und externen Gates bleiben gesperrt.
