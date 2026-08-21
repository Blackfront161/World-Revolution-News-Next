# Task Brief – WRN-G1-002

## Identitaet

- Task-ID: `WRN-G1-002`
- Titel: Visuelle und interaktive Baseline der aktuellen WRN-App
- Paritaets-IDs: UX-01 bis UX-08 sowie repraesentative Zustaende aus NEWS,
  MEDIA, INFO/HELP und SYS
- Auftraggeber: Product Owner ueber Chief AI Architect
- Zustaendiger Agent: `visual_accessibility_reviewer`
- Delegation: nicht erlaubt

## Ziel in beobachtbarer Sprache

Dokumentiere, wie die aktuelle App tatsaechlich aussieht und reagiert, damit
die spaetere neue Implementierung gegen stabile visuelle und funktionale
Referenzen verglichen werden kann. Die Aufnahme umfasst Smartphone, Tablet und
beobachtend auch Desktop. Desktopdarstellung der App ist keine automatische
Zielvorgabe fuer die spaetere gemeinsame Website.

## Verbindliche Quelle

- App-Repository:
  `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current`
- erwarteter Branch: `main`
- erwarteter HEAD: `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Runtime-Stand: `968c320adfe87d1e11e88f99f448a435d4242750`
- G1-Strukturbericht:
  `docs/handoffs/WRN-G1-001-legacy_product_analyst.md`

Vor dem Start muessen HEAD und sauberer Git-Status read-only bestaetigt werden.

## Scope

### Erlaubte Aktionen

1. Einen rein lokalen, nicht oeffentlichen statischen Server fuer die
   massgebliche App starten und nach der Aufnahme beenden.
2. Die App im kontrollierten Browser oeffnen, Viewports setzen, navigieren,
   klicken, Tastaturpfade pruefen und Screenshots aufnehmen.
3. Browserkonsole und fehlgeschlagene Requests fuer die untersuchten Flows
   lesen, ohne externe Zustaende zu veraendern.
4. Lokalen Browserzustand nur innerhalb der Testsession fuer Theme-, Schrift-
   oder Onboardingvarianten verwenden; keine Cookies, Passwoerter oder
   bestehende Browserprofile untersuchen.
5. Screenshots ausschliesslich im neuen Repository unter
   `docs/evidence/WRN-G1-002/` speichern.
6. Ergebnisse im vorbereiteten Visual-QA-Handoff dokumentieren.

### Pflicht-Viewports

| Klasse | Viewport |
|---|---:|
| kleines Smartphone | 320 × 568 |
| aktuelles Smartphone | 390 × 844 |
| Tablet hoch | 600 × 960 |
| Tablet/kleiner Desktop | 1024 × 800 |
| Desktopbeobachtung | 1440 × 900 |

Mindestens 390 × 844, 600 × 960 und 1440 × 900 benoetigen eine dokumentierte
Start-/Feedansicht. 320 × 568 und 1024 × 800 werden mindestens auf Reflow,
Overflow und Navigation geprueft.

### Repraesentative Flows und Zustaende

1. Start-/Introverhalten und sichtbare Marke.
2. Hauptnavigation, aktiver Bereich und Rueckweg.
3. Newsfeed mit mindestens einem Artikel-/Detailzustand.
4. Suche oder Filter inklusive Reset, sofern ohne produktive Schreibaktion
   erreichbar.
5. Theme und vorhandene Schriftgroessenfunktion.
6. Je ein erreichbarer Einstieg fuer Multimedia sowie Hilfe/Information.
7. Tastaturfokus, Escape/Zurueck bei Dialogen, Touchzielauffaelligkeiten und
   horizontaler Overflow.
8. Lade-, Leer- oder Fehlerzustand nur dann, wenn er ohne Manipulation
   produktiver Daten sicher beobachtbar ist.

### Nicht-Ziele

- keine Website-Baseline
- keine vollstaendige Accessibility-Zertifizierung
- kein Android-Emulator-/Geraetetest
- keine Offline-/Service-Worker-Migrationspruefung
- keine Aussage, dass App-Desktoplayout unveraendert Websiteziel wird
- keine Designverbesserung oder Zielarchitekturentscheidung

### Verbotene Aktionen

- Produkt-, Legacy- oder Konfigurationsdateien aendern
- Tests, Builds, Gradle, Capacitor oder Dependency-Installationen starten
- Service Worker, Caches oder lokale Daten ausserhalb der Testsession loeschen
- Formulare mit realen personenbezogenen Daten absenden
- Standort-, Benachrichtigungs-, Kamera- oder andere Geraeteberechtigungen
  erteilen
- externe Konten anmelden oder produktive Inhalte veraendern
- deployen, pushen, signieren oder Play-/Cloudflare-Aktionen
- weitere Agenten starten

## Akzeptanzkriterien

1. App-HEAD, Branch und sauberer Ausgangsstatus sind belegt.
2. Die Pflicht-Viewports sind mit exakten Groessen und beobachtetem Verhalten
   dokumentiert.
3. Mindestens drei aussagekraeftige Screenshots liegen mit stabilen Dateinamen
   und kurzer Beschreibung vor.
4. Marke, Navigation, Newsdetail, Theme/Schrift und repraesentative
   Multimedia-/Hilfeeinstiege sind entweder beobachtet oder als Blocker
   erklaert.
5. Visuelle Besonderheiten werden als `ERHALTEN`, `OPTIMIEREN`,
   `PLATTFORMSPEZIFISCH` oder `DEFEKTVERDACHT` klassifiziert.
6. Konsolen-/Netzwerkprobleme sind fuer die ausgefuehrten Flows zusammengefasst;
   keine Rohlogflut.
7. Keine Aesthetikbewertung wird mit Funktions- oder Accessibilityfreigabe
   verwechselt.
8. Handoff endet mit vollstaendigem WRN-Statusblock und `END-CHECK: :)`.

## Belege und Kosten

- Primaerbeleg sind lokale Screenshots und beobachtete Browserinteraktionen.
- Keine kostenpflichtige Modell-API oder externe Analyseplattform verwenden.
- Gemini-Zweitmeinung ist in diesem Task nicht notwendig; sie kann spaeter auf
  eine kleine, vom Product Owner ausgewaehlte Screenshotmenge angewendet werden.
- Screenshots enthalten keine Secrets oder persoenliche Browserinformationen.

## Rollback

- Lokalen Server beenden.
- Testtab schliessen oder ungenutzt lassen.
- Keine Legacydatei darf geaendert sein.
- Belegdateien im neuen Repository bleiben als versionierte Baseline erhalten.

## Uebergabeformat

- Executive Summary
- verifizierter Quellstand und Testumgebung
- Viewport-/Flowmatrix
- Screenshotindex
- visuelle Erhaltungsmerkmale
- Accessibility-/Interaktionsauffaelligkeiten
- Konsolen-/Netzwerkbeobachtungen
- Blocker, Unsicherheiten und naechste Folgepruefung
- WRN-Statusblock
