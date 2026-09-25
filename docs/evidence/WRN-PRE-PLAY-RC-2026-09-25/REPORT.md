# WRN Pre-Play Release Candidate – 25. September 2026

Dieser Bericht bindet den aktuellen kostenneutral vorbereiteten Kandidaten. Er
ist noch unsigniert und wurde weder installiert noch hochgeladen oder live
geschaltet.

## Kandidat

- Quellcommit: `b981c676b9d0a8e0df785dddac9e2ec0181e313d`.
- Android: `com.world.revolution`, Version 2.2.0, VersionCode 27, Target SDK 36.
- Unsigniertes AAB: 8.144.389 Bytes, SHA-256
  `ea5c730bfc7a5c5de4e0b014b9ea15ee525dacab70192109ad571360492c8892`.
- 91/91 Receipt-Assets sind im Bundle bytegleich; ZIP-Signatureinträge: 0.
- Der frisch wiederholte Mobile-Produktionsbuild stimmt in allen 86 Vite-Dateien
  bytegleich mit dem AAB-Stage überein. Zwei Cordova-Brückendateien und drei
  weitere native Bridge-Assets sind separat im selben Receipt gebunden.
- Android: 16/16 Release-Unit-Tests und `lintRelease` bestanden.

## Website und Hosting

Der Websitebuild aus demselben Commit enthält 33 Dateien und 9.907.203 Bytes.
Das kombinierte Paket verbindet ihn mit dem öffentlich geprüften
Metadatenverzeichnis aus GitHub-Lauf 36028488433:

- 36 Dateien, 11.837.153 Bytes;
- Manifest 53.877 Bytes, SHA-256
  `50a6d71568465b58350a58a36844af384881916029c77067dea0d0c82e184f04`;
- Verzeichnissequenz `202609241636`;
- Aktivierung weiterhin unveränderliche Dateien zuerst und beide
  `current.json`-Zeiger zuletzt;
- vollständige reale Rekonstruktion und Byteprüfung bestanden;
- `publicationPerformed: false`.

## Produktprüfung

Mobile 939/939, Website 154/154 plus 68/68 Paket-/Offlinefälle, 16/16
Regionalbrowserfälle, beide Typprüfungen und beide Produktionsbuilds sind grün.
Die fünf aktuellen Regionaltermine und der 48-Stunden-Freshness-Guard sind im
[Regionalbeleg](../WRN-REGIONAL-EVENTS-REFRESH-2026-09-25/REPORT.md) gebunden.

## Noch außerhalb dieses lokalen Kandidaten

Vor einer Veröffentlichung fehlen weiterhin die authentisierte
Produktionshosting-Aktivierung samt HTTPS-/Header-/Rollbackprobe, die vorhandene
Produktionssignatur, der Upload in den internen Play-Testtrack, das echte
Play-Upgrade von 2.1.1, der Play-Pre-Launch-Bericht und die anschließend bewusst
freigegebene gestufte Veröffentlichung. Cloud-Übersetzung und Online-Podcast
bleiben ohne nachweislich kostenlose Ressourcen-/Quotenbindung deaktiviert;
Originaltext und lokales Artikelvorlesen funktionieren ohne diese Anbieter.

Zine, World Revolution Map und Action Radar bleiben als spätere Erweiterungen
erhalten und blockieren diesen Kandidaten nicht.