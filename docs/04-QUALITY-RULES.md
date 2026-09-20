# Qualitaets-, Test- und Release-Regeln

## 1. Grundsatz

Qualitaet wird durch reproduzierbare Belege nachgewiesen, nicht durch die
Selbsteinschaetzung eines implementierenden Agenten. Eine visuell plausible
Oberflaeche ohne Funktions-, Fehler- und Datenpruefung ist nicht fertig.

## 2. Phasen- und Freigabegates

| Gate | Zweck | Mindestbelege | Freigabe |
|---|---|---|---|
| G0 – Organisation | Regeln und Quellen stehen | Charter, Source Register, Matrix, Agentenprofile | Chief + Product Owner |
| G1 – Baseline | Altverhalten ist aufgenommen | Featureinventar, Datenfluesse, Screenshots, Fehlerliste | Product Owner |
| G2 – Architektur | Zielsystem ist entscheidbar | ADRs, Systemkontext, Datenvertraege, Kosten-/Migrationsplan | Product Owner + unabh. Review |
| G3 – Implementation Start | erstes Slice ist bereit | Task Brief, Tests vorab, UX-Referenzen, Rollbackgrenze | Product Owner |
| G4 – Feature Done | Feature funktioniert isoliert und integriert | Tests, Screenshots, Logs, Review | QA + Product Owner bei UI |
| G5 – Release Candidate | gesamter Kandidat ist stabil | volle Matrix, Security, Offline, Android/Web-Builds | unabh. Reviewer |
| G6 – Production | externe Veroeffentlichung | signierter Auftrag, Backups, Rollback, Hashes | ausschliesslich Product Owner |

Das in `AGENTS.md` genannte `GO-IMPLEMENTATION` entspricht der expliziten
Freigabe von G3. Bis dahin entsteht kein Produktcode.

## 3. Definition of Ready fuer jedes Arbeitspaket

- klarer Nutzerwert und betroffene Paritaets-ID
- Ausgangsverhalten mit Quelle oder Reproduktion
- erlaubte und verbotene Pfade
- Nicht-Ziele
- Akzeptanzkriterien in beobachtbarer Sprache
- benoetigte Testebenen und Viewports
- Daten-, Offline-, Security- und Kostenwirkung
- Rollback- oder Ruecknahmemethode
- Modell und Delegationsfreigabe
- bei Weiterdelegation: Eltern-/Kindbrief, zentral bestaetigte Slots,
  Quellencommit, disjunkte Schreib-/Vertragsowner, Aufwands-/Versuchsgrenze
  und unabhaengiger Reviewowner gemaess `docs/10-AGENT-ORCHESTRATION.md`

Fehlt ein Punkt, bleibt der Task in Analyse/Planung.

## 4. Definition of Done

- Akzeptanzkriterien vollstaendig erfuellt
- keine ungeplante Funktions- oder Designabweichung
- Unit-/Contract-/Integrationstests fuer die Aenderung bestanden
- relevante End-to-End-Flows bestanden
- visuelle Matrix ohne ungeklaerte Differenzen
- kein unerwarteter horizontaler Overflow oder verdeckter Inhalt
- Tastaturbedienung, Fokus und Touchziele geprueft
- keine neuen ungeklaerten Konsolen-, Netzwerk- oder CSP-Fehler
- Online-, langsames Netz-, Offline- und Wiederanlaufverhalten bewertet
- keine Secrets, privaten Daten oder Buildartefakte im Diff
- Dokumentation, Entscheidungslog und Paritaetsmatrix aktualisiert
- unabhaengiger Review bei hohem Risiko
- Fachlead integriert erst nach beendeter Helferarbeit und gesichertem
  Handoff; QA/Security melden Befunde direkt an Main/Chief und nehmen keine
  eigene Implementierung unabhaengig ab
- Product-Owner-Freigabe bei sichtbarer oder fachlicher Produktveraenderung

## 5. Testpyramide

1. **Statisch:** Format, Lint, Typen, verbotene Imports, Secret-/Artefaktscan.
2. **Unit:** reine Domain-, Formatierungs-, Filter- und Zustandslogik.
3. **Contract:** JSON-Schemata, API-Versionen, Herkunft, Fallbacks.
4. **Integration:** Datenquelle, Cache, Offline-DB, Uebersetzung, Medien.
5. **Browser E2E:** Hauptflows, Fehlerzustaende, Tastatur, Deep Links.
6. **Visual Regression:** freigegebene Referenzbilder pro Viewport/Theme.
7. **Android:** Unit, Lint, Instrumentation, WebView, Lifecycle, Offline.
8. **Release:** reproduzierbare Pakete, Hashes, Manifest, Version, Rollback.

Tests duerfen nie durch pauschales Ueberschreiben von Snapshots oder Absenken
einer Erwartung „repariert“ werden. Jede geaenderte Erwartung braucht eine
fachliche Begruendung.

## 6. Verbindliche visuelle Matrix

### Smartphone

- 320 × 568
- 360 × 800
- 390 × 844
- 412 × 915
- mindestens ein Querformat mit begrenzter Hoehe

### Tablet

- 600 × 960
- 800 × 1280
- mindestens ein Querformat

### Desktop-Website

- 1024 × 800
- 1280 × 800
- 1440 × 900
- 1920 × 1080
- layoutaequivalenter 200-%-Reflow

### Zustaende

- erstes Laden, geladener Inhalt, leerer Zustand und Fehlerzustand
- mindestens helles und dunkles/alternatives freigegebenes Theme
- geoeffneter Artikel/Dialog
- lange Titel, lange Uebersetzungen und unbekannte Sprache
- Tastaturfokus und groesste freigegebene Schrift
- Online, langsames Netz und Offline soweit relevant

Screenshots benoetigen eindeutige Namen, Kandidatencommit, Viewport, Theme und
Testdatum. Ein QA-Bericht folgt `docs/templates/VISUAL-QA-REPORT.md`.

## 7. Accessibility-Mindestregeln

- semantische Bedienelemente statt Klick-Container
- sichtbarer Fokus und logische Fokusreihenfolge
- Tastaturbedienbarkeit aller Kernaktionen
- sinnvolle Namen/Labels fuer Bedienelemente
- keine alleinige Farbcodierung
- ausreichender Kontrast
- Touchziele grundsaetzlich mindestens 44 × 44 CSS-Pixel
- Vergroesserung ohne Inhaltsverlust oder horizontalen Hauptseiten-Scroll
- Dialogfokus, Escape/Zurueck und Screenreader-Smoke
- Kartenfunktionen spaeter immer mit textueller Alternative

## 8. Daten-, Privacy- und Security-Regeln

- keine erfundene Herkunft, Sprache, Verifikation oder redaktionelle Bestaetigung
- Quelle, Original-URL, Datum und Provenienz unveraendert erhalten
- „Hilfe finden“ ohne Geolocation, URL-/Analytics-Persistenz oder Suchprofiling
- externe Uebertragung nur bewusst und transparent, besonders Uebersetzung
- minimale Logs ohne Artikel-, Feedback- oder personenbezogene Inhalte
- Secrets ausschliesslich ueber Secret-Stores
- CSP-/Origin-Aenderungen nur nach Review
- Dependency- und Lizenzpruefung vor Aufnahme
- Security-/Privacy-Review vor G5

## 9. Kostenregeln

- primaer vorhandene Abokontingente statt zusaetzlicher API-Ausgaben nutzen
- Gemini AI Plus als manuelle Zweitmeinung, nicht automatisch kostenpflichtig integrieren
- Spark/Luna fuer klar begrenzte Routine; Terra fuer regulaere Umsetzung; Sol fuer hohe Risiken
- global maximal zwei Subagenten neben dem ausfuehrenden Main im Normalbetrieb,
  inklusive Nachkommen und wartender offener Instanzen; die begruendete
  Ausnahme und zentrale Reservierung stehen in `docs/10-AGENT-ORCHESTRATION.md`
- keine redundanten Vollanalysen ohne neue Fragestellung
- grosse Kontexte durch Source Register, Task Briefs und zielgerichtete Dateilisten begrenzen
- Cloud-/KI-Kosten vor Implementierung mit Messpunkt und Abbruchgrenze dokumentieren

## 10. Release-Regeln

### Website

- eigener versionsgebundener QA-Vertrag
- statische Artikel, Manifest, Feed und Sitemap aus gleicher Revision
- unveraenderliches Paket und SHA-256
- externer Rollback vor Upload
- Live-Smoke nach Veroeffentlichung
- keine Veroeffentlichung ohne Einzelgenehmigung

### Android / Google Play

- eindeutiger Commit, Versionsname und neuer Versionscode
- Webassets nur aus dem freigegebenen Quellstand synchronisieren
- Lint, Unit-, Instrumentation-, API-Ziel- und Geraetests
- Online, Flugmodus, langsames Netz, Lifecycle und Updatepfad
- zwei unabhaengige Releasebuilds oder gleichwertiger Reproduzierbarkeitsbeleg
- Signatur-/Zertifikat-/Payloadpruefung
- AAB-Hash und Releasebericht
- Upload, Trackwahl und Rollout ausschliesslich nach Einzelgenehmigung
- Pre-Launch-Report und Play-Verarbeitung als eigenes externes Gate

## 11. Schweregrade

- **Blocker:** Datenverlust, Security/Privacy, falsche Signierung, unbenutzbarer
  Kernflow, nicht reproduzierbarer Release oder fehlender Rollback.
- **High:** wesentliche Funktionsluecke, Offline-/Upgradebruch, schwere
  Accessibility-Barriere, falsche Herkunft oder systematischer Backendfehler.
- **Medium:** begrenzte Fehlfunktion mit Workaround oder sichtbare Abweichung.
- **Low:** kleine, nicht blockierende Qualitaetsabweichung.

G5 erlaubt keine offenen Blocker oder High-Findings. Medium-Findings brauchen
eine ausdrueckliche Product-Owner-Entscheidung und ein dokumentiertes Folgeticket.
