# Website-Aufbau an App angleichen

PO-Auftrag 30.09.2026: Website soll denselben Aufbau wie die App haben, mit
Code26-Markenbild und den vorgenommenen Ergänzungen. Der eigenständige
Website-News-Masthead und das zusätzliche Titelblatt-Raster entfallen.

Referenz ist die aktuelle ergänzte App in apps/mobile, nicht ein neuer Entwurf.
Code26-Originalmarke ist im unveränderten Asset-Manifest (Quellcommit
2216ff3c1305f6d474712892a36dc9b0ea7cb0a0) belegt. Der lokale historische
Release wrn-unsigned-a-968c320a-20260820-final-r3 trägt versionCode 26 / 2.1.1.
Seine historische Home-Sequenz (Latest-Hero, Briefing, Today/Services,
personalisierte Gruppen, More News) ist von der inzwischen erweiterten
React-App-Sequenz zu unterscheiden; dieses Paket gleicht die Website an die
aktuelle App an und behauptet keine vollständige historische Funktionsparität.

## Konkrete Korrektur

- Zentrierte Marke mit Aktionsleiste statt seitlichem Website-Masthead.
- Fünf App-Navigationspunkte und gleiche Lesespaltenbreite an allen Breakpoints.
- App-Reihenfolge Aktuelle Meldungen, Artikel, weitere Lesestücke, Sport, Termine.
- App-Kartenfluss mit Titel/Teaser vor Bild statt Website-Bild-Lead und Seitenrail.
- Bestehende Reader-, Quellen-, Übersetzungs-, Personalisierungs-, Medien-,
  Live-TV-, Wissens-, Hilfe-, Termin- und Speicherwege bleiben erhalten.

Keine App-, Backend-, Storage-, Daten- oder Provideränderung. Der Website-
Offline-Shell-Vertrag bleibt unverändert: kein neuer CSS-Hintergrundasset und
keine Erweiterung erlaubter Assetklassen.

## Prüfung und Vorschau

- Website-Vollsuite: 196 Vitest- und 71 Node-Tests bestanden.
- Website-Typprüfung, gezielter ESLint, Prettier und git diff --check bestanden.
- Finaler Website-/Offline-Build bestanden: 8.365.446 Bytes unter unverändertem
  8-MiB-Limit; Shellidentität
  83af0584c8b7e8566a740cfd3bab83b05f87e11e36df88bbe62c66426594819c.
- Unabhängiger Kontrolleur: keine Funktions-/Release-Stopper. Handy, Tablet und
  Desktop ohne horizontalen Überlauf; auf Desktop 672 px Lesespalte.
  Fünf untere Hauptziele sowie App laden, Spenden, Wissen, Termine und Hilfe
  bleiben erreichbar. Aufmacherbild geladen; keine Seitenfehler beobachtet.
- Abschließender DOM-Vergleich nach Entfernen alter Titel-/Intro-Regeln:
  Website bei 390 und 1440 px wie App mit 24-px-Überschrift und 16-px-Intro.
  Der goldene Rahmen im App-Screenshot ist ein Fokusindikator, kein fehlendes
  Gestaltungselement. Keine künstliche Rahmenregel hinzugefügt.
- Vergleichsscreenshots: website-390.png, website-1440.png und app-390.png;
  SHA256SUMS.txt bindet Quellen, Bericht und Bilder.

Lokale Vorschau: http://127.0.0.1:8766/?theme=dark#home.
Keine Live-Veröffentlichung und kein neues natives Bundle in diesem Paket.
Visueller Restunterschied: Website-Farbverlauf statt des App-Hintergrundbilds
wegen des unveränderten Offline-Shell-Assetvertrags. Feedstand und bestehende
Übersetzungsverfügbarkeit wurden durch dieses Layoutpaket nicht geändert.
