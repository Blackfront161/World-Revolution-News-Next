# WRN-G3-018 – Discover kompakter und professioneller

Status: **TECHNISCH GREEN UND DURCH PO-093 VISUELL AKZEPTIERT**

Vorbereitungsbasis: `c78a804`; Branch
`codex/g3-015-website-offline-shell`. G3-017 ist durch PO-089 technisch und
visuell geschlossen. Die Abhaengigkeitsvoraussetzung ist damit erfuellt;
Das exakte Produktstartgate `START WRN-G3-018` wurde am 31. August 2026 als
PO-091 erteilt. Zuerst laeuft ausschliesslich P1; Produktcode bleibt bis zu
einem gesicherten P1-GREEN gesperrt.

## Ziel und gebundener Iststand

Der bestehende Discover-Such-/Filterkern bleibt fachlich erhalten. Dieser
Slice darf nur die Informationsdichte, Anordnung und responsive Darstellung
verbessern; ein Vertragsneubau ist ohne belegten Befund ausgeschlossen.

Der read-only Pre-Start-Abgleich bestaetigt: `MobileDiscover` besitzt bereits
lokale Suche, fuenf Facetten, Einzelentfernung aktiver Kriterien, Gesamtreset,
Ergebniszahl, No-results, Reader- und Spaeter-lesen-Aktionen. Die Dichte entsteht
aus der immer vollstaendig sichtbaren Filtergruppe und den vollstaendigen
Textkarten; sie ist kein Backendfehler.

## IN/OUT und Vertrag

IN: ausschliesslich die Mobile/App-Projektion; kompaktere Suche, eine klar
beschriftete zugaengliche Filteroffenlegung, weiterhin sichtbare aktive
Kriterien und Ergebniszahl, kompaktere Ergebnisdarstellung, klare aktive
Zustaende, neun UI-Sprachen mit EN-Erststart und vorhandener Persistenz,
Phone/Tablet/Landscape/200-%-Reflow sowie ehrliche Lade-, Leer-, Fehler- und
Offlinezustaende. Keine Information oder Aktion darf nur ueber horizontales
Scrollen erreichbar sein; Bedienziele bleiben mindestens 44 x 44 CSS-Pixel.

OUT: Websiteprojektion, neue Such-/Sortier-/Rankinglogik, Aenderung der
Discover-Kriterien oder Facettenwerte, neue Datenquellen/Fixtures,
Personalisierung, Content-Import, neue Dependencies/Kosten, Hosting/Live,
native Android-/AAB-/Play-/Releasearbeit. UX-POLISH-001 bleibt ein spaeterer
repo-weiter Feinschliff und darf hier nicht still vorgezogen werden.

## Eingefrorene Vertraege

- `packages/domain/src/index.ts` mit `DiscoverCriteria`,
  `filterDiscoverArticles`, `createDiscoverFacets` und
  `hasActiveDiscoverCriteria` bleibt fachlich und schreibend OUT.
- `packages/content-contracts/**`, alle Release-/Discover-JSONs, P2-/P3-
  Persistenz und G3-017-Personalisierung bleiben unveraendert/read-only.
- Kriterien bleiben fluechtig: nicht in URL, Local Storage, Session Storage,
  Cookies, Netzwerk oder Telemetrie schreiben.
- Reader-/Zurueckfokus, Speichern, Sportfilterziel und Offlineprojektion
  muessen unveraendert funktionieren.
- Die neun vorhandenen UI-Sprachen werden vollstaendig abgedeckt; neue
  sichtbare Texte brauchen kataloggebundene Keys in allen neun Katalogen.

## Zielaufbau

1. Kompakter Seitenkopf mit Ueberschrift, kurzem Zwecktext und primaerer Suche.
2. Native, tastaturbedienbare Filteroffenlegung mit klarer Anzahl aktiver
   Kriterien; kein selbst gebauter unzugaenglicher Akkordeonmechanismus.
3. Aktive Kriterien und `Alles zuruecksetzen` bleiben ausserhalb einer
   geschlossenen Filterflaeche sichtbar und einzeln bedienbar.
4. Ergebnisstatus folgt direkt vor den Ergebnissen und bleibt per Live-Region
   verstaendlich, ohne doppelte oder stoerende Ansagen.
5. Karten werden visuell verdichtet, behalten aber Quelle, Titel, notwendige
   Metadaten, Themen, Reader- und Speicheraktion. Keine erfundenen Bilder,
   Rangfolge, Popularitaet oder Aktualitaetsaussage.
6. Phone bleibt einspaltig; Tablet/Landscape darf ein robustes Raster nutzen.
   Bei 200 Prozent Reflow faellt alles wieder in eine lesbare Spalte.

## Writer- und Reviewpakete nach Start

P1: ein frischer unabhaengiger Architektur-/Vertragsreviewer, Produkt und Tests
read-only. Er bestaetigt insbesondere Mobile-only-Scope, unveraenderten
Suchvertrag, fluechtige Kriterien, Offline/Reader/Fokus und den zugaenglichen
Offenlegungsvertrag.

P2: nur bei P1-GREEN ein `frontend_brand_engineer` Terra/high als alleiniger
Produktschreiber fuer die gebundenen Mobile-UI-/CSS-/Sprach-/Testpfade. Keine
Kinder und keine Backend-/Fixture-/Websiteaenderung.

P3: nach gesichertem Writerende unabhaengige Terra-QA mit eigener
Phone/Tablet/Landscape/Reflow-Matrix, neun Sprachen, vier repraesentativen
Themes, Axe/Fokus/Touch/Overflow, Offline/Empty/Error und Reader-/Save-Smokes.

P4: frischer Sol-Security-/Privacy-Deltareview und danach gezielter finaler
Sol-Architekturreview. Technisches GREEN ersetzt keine lokale PO-Sichtabnahme.

## Gates

Bestehende Backend-/Suchvertraege zuerst read-only bestaetigen, danach ein
Frontend-Schreiber. Unit-, E2E-, responsive Visual-, A11y- und gezielter
Architekturreview muessen Paritaet und keine Regression nachweisen. Bei
unbelegter Vertragsabweichung stoppen. Umsetzung erst mit
`START WRN-G3-018`. Zusaetzliche Voraussetzung: G3-017 ist technisch geprueft
und durch den Product Owner geschlossen; diese Voraussetzung ist durch PO-089
erfuellt. PO-090 band die Pre-Start-Pflege. PO-091 erteilt am 31. August 2026
exakt `START WRN-G3-018` und aktiviert damit die sequenziellen Gates dieses
Briefs, beginnend mit P1; keine externen Rechte folgen daraus.

## Technischer Abschluss

Produktkandidat `fd3b0f9` ist nach P3/P3-R1, versiegeltem P4-S-Scan
`e52275b4-ce9c-42db-a144-204f638ad833` und finalem P4-A mit null Findings
technisch GREEN. Es besteht kein Produkt-/Testdelta nach dem Kandidaten.
Der Product Owner akzeptierte den Kandidaten am 31. August 2026 mit exakt
`G3-018 VISUELL AKZEPTIERT`. G3-018 ist geschlossen. G3-019 sowie Website,
Live, Android/AAB/Play und Release starten nicht automatisch.

END-CHECK: :)
