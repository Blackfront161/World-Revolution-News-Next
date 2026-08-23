# ADR-003 – Gemeinsames Design- und Markensystem

- Status: `ACCEPTED` am 23. August 2026; Assetimport nur mit Rechtebeleg
- Entscheidungseigner: Product Owner fuer sichtbare Marke/Abweichungen
- Technischer Owner nach Freigabe: Frontend Brand Engineer
- Betroffene Risiken: R-04, R-16, R-18

## Kontext

App und Website zeigen dieselbe Solinaridao-/WRN-Marke, nutzen aber
unterschiedliche Header, Navigation, Informationsdichte und Responsive-
Vertraege. G1 bestaetigte Reflow-, Escape- und Touchzielbefunde. Rechte fuer
Logos, `Qood.ttf`, Bilder und weitere Assets sind nicht pauschal belegt.

## Entscheidung

Ein gemeinsames Markensystem liefert semantische Tokens, freigegebene Assets,
primitive Komponenten und Accessibility-Regeln. Screenlayouts, Navigation,
Routing und Plattformaktionen bleiben in `apps/mobile` beziehungsweise
`apps/website`.

Gemeinsam vorgesehen:

- semantische Farb-, Typografie-, Abstands-, Radius-, Motion- und
  Fokus-Tokens;
- Assetmanifest mit Herkunft, Rechteinhaber, Lizenz, erlaubten Oberflaechen,
  Varianten, Hash und Alt-Text-Regel;
- primitive Bausteine wie Button, Link, Icon, Text, Karte, Dialoggrundlage,
  Status-/Fehleranzeige;
- Theme- und Schriftgroessensemantik;
- Accessibility-Testhilfen und 44x44-CSS-px-Grundregel.

Bewusst getrennt:

- mobile Bottom-Navigation und Androidaktionen;
- Website-Desktopheader, SEO-Landingpage und Inhaltsraster;
- Reader-Komposition, Responsive-Breakpoints und Performancebudgets je App;
- App-/Website-Service-Worker und Persistenz.

## Alternativen

1. **Komplett getrennte Designs:** senkt technische Kopplung, erhoeht aber
   Markendrift und doppelte Accessibilitykorrekturen.
2. **Eine universelle Komponentenbibliothek bis auf Screenebene:** maximiert
   Wiederverwendung, verwischt jedoch Plattformnavigation und Responsive-UX.
3. **Nur lose Styleguide-Dokumentation:** billig im Start, aber schlecht
   automatisierbar und driftanfaellig.

## Kosten

- Einmalig: Tokeninventar, Rechte-/Assetmanifest und Basiskomponenten.
- Laufend: visuelle Regressionen in beiden Apps und gepflegte Varianten.
- Assets ohne nachweisbare Rechte muessen neu erstellt, lizenziert oder
  ausgeschlossen werden; Kostenentscheidung bleibt beim Product Owner.

## Risiken und Gegenmassnahmen

- Tokenaenderungen koennen beide Apps brechen: semantische Versionierung und
  Screenshotmatrix je Consumer.
- Gemeinsame Dialoggrundlage kann plattformspezifische Navigation stoeren:
  Fokus-/Escapevertrag teilen, Komposition getrennt halten.
- Unklare Rechte: kein Assetimport ohne Assetmanifest und Freigabe.

## Konsequenzen

Marke und Accessibility-Grundregeln bleiben konsistent, ohne Website und App
visuell gleichzuschalten. Sichtbare Aenderungen benoetigen Product-Owner-
Freigabe; Bugfixes wie Escape und 44-px-Ziele sind Quality Gates, keine
stillschweigende Neugestaltung.

## Migration

1. G1-Screenshots und vorhandene Tokens inventarisieren.
2. Rechte pro Asset klaeren; nicht freigegebene Dateien nicht kopieren.
3. Tokens und primitive Komponenten mit beiden Apps als Consumer aufbauen.
4. Zuerst Feedkarte/Status/Link, danach Dialoggrundlage und Navigation nur
   app-lokal.

## Verifikationsgate

Bestanden, wenn Mobile und Website dieselben semantischen Tokens konsumieren,
aber getrennte Navigationen besitzen; Referenzviewports, Light/Dark,
groesste Schrift, Tastaturfokus, Escape, Screenreader-Smoke und 44x44-Ziele
ohne ungeklaerte Abweichung bestehen; jedes ausgelieferte Asset einen
Rechte-/Provenienzbeleg besitzt.
