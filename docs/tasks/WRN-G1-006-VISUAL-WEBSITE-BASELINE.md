# Task Brief – WRN-G1-006

## Identitaet

- Task-ID: `WRN-G1-006`
- Titel: visuelle Responsive- und Accessibility-Baseline der Website
- Zustaendiger Agent: kurze Visual-QA-Instanz
- Modellklasse: Terra/high wegen Browser-, Layout- und Bildbewertung
- Delegation: nicht erlaubt

## Ziel

Erzeuge reproduzierbare aktuelle Screenshots und beobachtete Interaktionsbelege
der massgeblichen Website auf Smartphone, Tablet und Desktop. Bestaetige oder
korrigiere die statischen Aussagen aus WRN-G1-005. Dies ist Baseline-QA, keine
Fehlerbehebung und kein Produktcode.

## Quellen und erlaubte Ausgaben

- Website read-only:
  `C:\Users\patri\Documents\World Revolution News\wrn-web-portal-2026-08-20-r10n-work`
- erwarteter Stand: `main@9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- Governance: aktueller sauberer `main`
- Pflichtdokumente: `AGENTS.md`, Browser-Skill, G1-005 Task/Handoff/Audit,
  Paritaetsmatrix, Quality Rules und Visual-QA-Template
- einzige dauerhafte Ausgaben:
  `docs/evidence/WRN-G1-006/` und Fachrueckgabe an den Main Agent

## Erlaubt

- lokalen statischen HTTP-Server im Websiteordner starten und danach beenden
- In-App-Browser fuer lokale Website verwenden
- Screenshots ausschliesslich im Governance-Evidenzordner speichern
- DOM, Accessibilitybaum, Konsole und lokales Netzwerkverhalten lesen
- Interaktionen ausfuehren, die nur fluechtigen Browserzustand veraendern

## Pflichtmatrix

Mindestens folgende vollstaendige Screenshots:

1. `390x844`: Start/Feed, Dark Theme
2. `800x1280`: Start/Feed oder Kernlayout
3. `1440x900`: Start/Feed, Desktopheader und Artikelraster
4. `390x844`: geoeffneter Artikel/Reader
5. `390x844`: Light Theme und 200-%-Reflow-Aequivalent
6. statische `/articles/<gueltige-id>/`-Landingpage auf geeignetem Viewport

Zusaetzlich pruefen:

- kein horizontaler Overflow oder verdeckte Kernaktion;
- Header, Hero, Navigation, Feed und Dialog in den drei Klassen;
- Tastaturfokus und Escape im Artikeldialog;
- Touchziele grob gegen 44x44 px;
- Light/Dark-Kontrast und Reduced-Motion-respektierende Oberflaeche;
- direkter Artikelpfad und unbekannter Artikel-Fallback nur lokal;
- Canonical und sichtbare Landingpage-/Readertrennung;
- Konsole/Netzwerkfehler kategorisieren: lokale Devserver-/Remote-Daten-
  Abweichung nicht als Hostingfehler ausgeben;
- Screenshotnamen enthalten Viewport und Zustand.

## Verboten

- keine Produktdatei oder Repositorymetadaten veraendern
- keine Testsuite, Generatoren, Builds, Installationen oder Deployments
- keine Live-Domain, Konten, Hosting, Secrets oder Provideraktionen
- kein Feedback, Push, Podcast, Uebersetzung oder sonstiger externer
  schreibender/verbrauchender Request
- keine weiteren Agenten

## Akzeptanzkriterien

1. Website bleibt sauber auf `9a59b17`.
2. Mindestens sechs aktuelle, lesbare Screenshots mit Quellenstand.
3. Beobachtet, nicht beobachtet und durch lokale Umgebung eingeschraenkt sind
   klar getrennt.
4. Pro Finding stehen Viewport, Zustand, Auswirkung und spaeterer Regressionstest.
5. Keine historische QA wird als neuer Lauf ausgegeben.
6. Vollstaendiger WRN-Statusblock mit `END-CHECK: :)`.

## Uebergabeformat

- Setup/Quellstand
- Screenshotmanifest
- Beobachtung je Viewport/Zustand
- Accessibility-/Keyboard-/Touchbefunde
- Konsole/Netzwerk und Evidenzgrenzen
- Findings mit Severity und Paritaetsauswirkung
- Zieltests fuer G4/G5
- geaenderte Dateien (nur Evidenz)
- WRN-Statusblock

