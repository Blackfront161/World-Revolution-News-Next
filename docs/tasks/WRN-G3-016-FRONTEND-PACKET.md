# WRN-G3-016 P3 – Mobile Home und Sport & Fankultur

Stand: 30. August 2026. Schreibbasis: `c9cbf5c`.

## Ziel

Die lokale Mobile-App erhaelt eine professionelle, nicht personalisierte
Startseite aus der atomar gebundenen G3-016-Neunerfixture:

- ein visueller Aufmacher;
- genau fuenf kompakte Hauptmeldungen;
- danach `Sport & Fankultur` mit einer grossen und zwei kleinen Karten;
- ein ehrlicher Link `Alle Sportmeldungen`, der den bestehenden lokalen
  Discoverfilter `topic: Sport` oeffnet;
- ehrlicher Nichtaktuell-Zustand ohne Ersatzkarten.

Website, echte Inhalte/Medien und G3-017 bis G3-021 bleiben getrennt.

## Alleiniger Schreibscope

- `apps/mobile/src/App.tsx`
- `apps/mobile/src/styles.css`
- `apps/mobile/src/App.test.tsx`
- `packages/ui-language/src/index.ts`
- alle acht bestehenden Dateien unter `packages/ui-language/src/catalogs/`
- `tests/e2e/foundation.spec.ts` nur fuer direkt betroffene Mobile-Home-
  Erwartungen; Website-Erwartungen muessen getrennt und unveraendert bleiben
- neu `tests/e2e/g3-016-home-visual.spec.ts`
- eigene Evidence `docs/evidence/WRN-G3-016/frontend/**`
- eigener Handoff `docs/handoffs/WRN-G3-016-frontend.md`

Keine andere Datei ist schreibbar. Read-only bleiben insbesondere
`apps/website/**`, P2-Contracts/Fixtures/Public-JSONs, Domain, Loader,
Offlinecontroller/-store/-UI, Reader-/Reading-State-Quellen, Brand-Tokens,
Playwright-Konfiguration, Live/Legacy und Governance.

## Gebundener Datenfluss

Die UI darf nur das bereits validierte Manifest und den Artikelpayload derselben
Release-Revision verwenden. Genau ein Aufruf
`projectLocalHomePresentationV1(manifest, articles, now)` erzeugt die Rollen.
Ein ID-Map loest die Rollen ohne Sortierung, Ersatzwahl oder Fallback auf die
gesamte Artikelliste auf.

- `leadId`: Aufmacher;
- `mainIds`: exakt fuenf Karten in Vertragsreihenfolge;
- `sport.featureId`: grosse Sportkarte;
- `sport.secondaryIds`: zwei kleine Sportkarten in Vertragsreihenfolge.

Die Produktionsuhr ist `Date.now()`. Fuer deterministische Unit-/Visualtests
darf `App` eine optionale reine Uhrfunktion erhalten; sie darf keine
Persistenz, URL oder Produktlogik aendern. Bei `sport-not-current` mit
gueltigen Primärrollen bleiben Aufmacher und Hauptmeldungen sichtbar, waehrend
der Sportblock einen lokalisierten Nichtaktuell-Status ohne Karten zeigt. Bei
ungueltigen Primärrollen wird keine Homekarte erfunden.

## Informationsarchitektur und Interaktion

1. Kompakter Homekopf `Aktuell` beziehungsweise vollstaendig lokalisiertes
   Aequivalent; kein sichtbarer Text `Current test edition` als Produkttitel.
2. Aufmacher mit grossem lokalem Medienplaceholder, Quelle/Datum, Titel,
   Teaser, Themen sowie Lesen-/Speichernaktionen.
3. Fuenf kompakte Hauptmeldungen mit kleinen Medienplaceholdern, Quelle/Datum,
   Titel und unveraenderten Lesen-/Speichernfunktionen. Keine Zahlersatzkarten.
4. Sportblock nach den Hauptmeldungen: Featurekarte plus zwei kompakte Karten,
   lokalisierte Labels fuer Fussball/Fankultur/Frauen und keine
   Aufmacherdublette.
5. Semantischer Link `Alle Sportmeldungen`: `href="#discover"`, setzt vor
   der bestehenden Navigation exakt `emptyDiscoverCriteria` plus
   `topic: 'Sport'`. Browser-Zurueck kehrt zur Home zurueck; Fokus folgt der
   vorhandenen Discover-Navigation. Keine neue Filter-/URLsemantik.
6. Der bisherige lokale Testzustandsblock erscheint nicht in der normalen
   Produktprojektion. Bestehende deterministische Testzustaende bleiben ueber
   ihre bisherigen Testwege pruefbar.

Alle vorhandenen Reader-, Saved-, Discover-, Offline-, Sprach- und
Zuruecknavigationsvertraege bleiben erhalten. Der Aufmacher `cedar` muss seine
bestehenden Reader-/Saved-Testanker behalten.

## Marke, Responsive und Barrierefreiheit

- akzeptierte theme-reaktive Solinaridao/WRN-Marke und alle vier Themes
  Dark/Light/Pink/Contrast unveraendert weiterverwenden;
- keine neuen Assets, Drittbilder oder Hotlinks: deutlich hochwertige lokale
  Placeholder mit sinnvoller lokalisierter Bildbeschreibung;
- Mobile-first ohne horizontales Kartenkarussell und ohne verdeckten Inhalt;
- 390x844 und 412x915 einspaltig; 600x960 darf kontrolliert verdichten;
  844x390 bleibt lesbar mit genau einer Dokument-Scrollachse;
- Interaktionsziele mindestens 44x44 px, aber keine unnoetig grossen Buttons;
- semantische Abschnittsueberschriften, sichtbarer Tastaturfokus, Axe ohne
  Verstoss, 200-%-Reflow initial und nach Mount ohne horizontalen Overflow;
- Buttonfeinschliff `UX-POLISH-001` wird nicht als globale Aenderung
  vorgezogen.

## Sprachvertrag

Alle neuen sichtbaren Texte werden ueber den bestehenden typisierten Katalog
in `en,de,es,fr,it,pt,ru,el,tr` geliefert. EN bleibt Erststart; die bestehende
persistierte Sprachauswahl bleibt unveraendert. Keine Rohkeys, keine
unuebersetzten deutschen Produktlabels ausser den absichtlich technischen
Fixturewerten in Testdaten.

Mindestens zu lokalisieren: Home/Aktuell, Aufmacher/Hauptmeldungen,
Sport-&-Fankultur, Alle Sportmeldungen, Fussball, Fankultur, Frauen,
Nichtaktuell-Titel/-Erklaerung und der Medienplaceholder mit Artikeltitel.

## Test- und Belegmatrix

Unit/Integration:

- exakt neun eindeutige Rollen-IDs in Reihenfolge `1 + 5 + 1 + 2`;
- kein Artikel doppelt; kein Fallback;
- stale/future Sport zeigt Hauptmeldungen plus Nichtaktuell-Status, null
  Sportkarten;
- Lesen/Speichern von Aufmacher, Haupt- und Sportkarten;
- Sportlink oeffnet Discover mit genau drei `Sport`-Treffern und Browser-
  Zurueck kehrt zur Home zurueck;
- alle neun Kataloge vollstaendig; bestehende Sprachpersistenz intakt;
- vorhandene Reader-/Saved-/Discover-/Offline-Regressionen GREEN.

Frontend-E2E/Visual:

- EN-Sichtmatrix: 390x844, 412x915, 600x960, 844x390 jeweils in Dark,
  Light, Pink, Contrast (16 Screenshots);
- alle neun Sprachen mindestens bei 390x844 mit stabiler Rollenstruktur;
- 200-%-Reflow fuer alle neun Sprachen, initial und nach Mount;
- Axe, Fokus, 44px-Ziele, keine horizontale Seite/Karte, keine externen
  Requests/Cookies/neuen Storagekeys;
- Mobile-/Website-Erwartungen in Foundation bleiben getrennt; Websitequelle
  und Websitefixture bleiben ohne Diff.

Format, Mobile- und Sprachtests, beide relevanten Typechecks, Lint, Mobile-
Build, Releaseboundary, 19 Boundaries und gezielte Foundationtests muessen
GREEN sein. Die vollstaendige unabhaengige 9x4x4-/Reflowmatrix folgt P4 und
wird nicht durch P3-Eigenbelege ersetzt.

## Stopbedingungen

Sofort Chief informieren bei Bedarf nach OUT-Pfad, Backend-/Fixtureaenderung,
neuem Filtervertrag, Websiteaenderung, echter Quelle/Medienlizenz, Dependency,
Netzwerk/Kosten, neuer Speicherung, Reader-/Offline-Semantik oder stiller
globaler Button-/Brandkorrektur. Keine Kinder, kein Commit durch den Fachagenten.

## Abschluss

Report und Handoff binden exakte Diffs, Testbefehle/Exitcodes, Screenshotliste
und Hashaggregat, bekannte Baseline-REDs sowie offene P4/P5-/PO-Gates. P3-GREEN
ist keine visuelle PO-, Live-, Android- oder Releasefreigabe.

END-CHECK: :)
