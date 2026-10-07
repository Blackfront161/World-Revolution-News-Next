# Bildgeführte Website-Titelseite veröffentlicht

Die jüngste PO-Vorgabe verlangt den Nachrichtenaufbau von 20min mit Bildern am
Anfang. Sie ersetzt für die Website die vorherige einspaltige App-Anordnung.
Produktcommit: `8f5d06fbc746f5be76716e1b3acef982c3a4ae33`.
Live-Abschluss: 30.09.2026, 05:55 UTC, https://solinaridao.com/?theme=dark#home.

Oben stehen ein großer lizenzgeprüfter Originalbild-Aufmacher und bebilderte
Nebenmeldungen. Desktop und Tablet haben zwei Spalten, Handys eine Spalte.
Die eigene Originalmarke, Farben und fünf Hauptziele bleiben; die vorhandenen
Directory-Links stehen darunter. Keine fremden Referenzbilder wurden kopiert.
Ein konkreter Tastaturfehler aus CSS-Sortierung wurde vor Veröffentlichung
behoben: Bildpriorität sortiert jetzt stabil im DOM. Das optionale Shared-UI-Flag
ist nur für die Website aktiviert; die App behält ihre bisherige Reihenfolge.

## Prüfung

- Unabhängiger Kontrolleur: PASS bei 390/820/1440 px, kein horizontaler Überlauf,
  Bild vor Titel, Attribution und Lizenz, fünf Mainkarten und fünf Directorylinks.
  Reader, Zurück, Medien und Mehr-Menü bestanden; keine beobachteten Pageerrors.
- Website: 197 Vitest-Fälle am finalen UI-Stand; 71 Node-Paket-/Privacy-/Rollback-
  Fälle bestanden. Der konkrete Sortierfix bestand zusätzlich sechs Home-/Queue-
  Fälle und 13 Mobile-Home-Fälle. Beide Typprüfungen, Lint und Format bestanden.
- Website-Build: 8.370.263 Bytes unter unverändertem 8-MiB-Limit (8.388.608).
  Der vorhandene Produktionsbuilder rekonstruierte und verifizierte 44 Dateien.
  Drei Archive wurden dekomprimiert auf Pfadabschluss und SHA-256 geprüft.
- Live bei 390/820/1440 px: kein Überlauf; 1200px-Originalbild geladen; Bildkarten
  auch im DOM zuerst, CSS-Kartenorder 0. Reader-Volltext, Zurück und Medien mit
  Live-TV-Bereich funktionieren. Keine beobachteten Browserfehler.

## Gebundene Veröffentlichung

Die ausdrückliche PO-Autorisierung für Hostinger und solinaridao.com wurde genutzt.
Vorherige Startseite, Offline-Shell, vier Zeiger und Serverregeln wurden gesichert;
direkt vor Umschaltung entsprach die öffentliche Startseite noch dem Backup.
Der vorhandene Hostinger-Backupstand vom 30.09., 09:20 (Anzeigezeit) bleibt erhalten.
Upload ausschließlich 13 Assets, .htaccess, website-shell-sw.js und index.html;
Archive außerhalb public_html, Entpackreihenfolge Assets → Regeln/Shell → Startseite.
Alte Assets bleiben für Wiederherstellung. Hostinger bestätigte geleerten Cache.

20 öffentliche Antworten wurden überprüft: 18 bytegleich, einschließlich neuer
Startseite und Offline-Shell, vier unveränderter Inhalts-/Quellen-/Widerrufszeiger
und bestehender Artikelseite. Elf Code-/CSS-/JSON-Assets bytegleich. Die zwei
bereits bekannten unveränderten Marken-PNGs liefert das CDN mit abweichenden
Bytes; keine Behauptung vollständiger Live-Hashparität oder neuer Offline-Shell-
Installation. no-store, nosniff, CSP, no-referrer und SW-Scope / geprüft;
alle 24 Inlineblöcke der zwölf bestehenden Artikelseiten bleiben in der CSP erlaubt.

Kein neuer Feed-Publisher, Übersetzungsanbieter, Android-Build oder Play-Upload.
Die bestehende Originaltext-Anzeige bei nicht verfügbarer Übersetzung bleibt ehrlich.
Vorher-/Nachher-Hashes, Uploadpfade, Live-DOM und repräsentative Bilder liegen in
diesem einen Belegpaket; temporäre Builds, Backups und Logs bleiben unter work.
