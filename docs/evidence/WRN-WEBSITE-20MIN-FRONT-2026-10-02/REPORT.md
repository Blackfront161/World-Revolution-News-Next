# WRN: App-Inhalte mit Nachrichtenfront nach 20min

Produktstand `815c27d94b1a4b8e28e11b4c50110e961e07f365` auf der bereits
unabhängig akzeptierten Inhaltsbasis `7533fe1`. Direkter PO-Auftrag vom
2. Oktober: veröffentlichen, App-Inhalte/Marke erhalten, Aufbau nach 20min.ch.

## Sichtbares Ergebnis

Kompakter zweizeiliger Desktopkopf mit WRN-Marke, fünf App-Zielen und
Rubrikleiste. Zentrierte Nachrichtenfront mit großem lizenziertem Bild,
großer Überschrift, aktueller Meldungsspalte und dreispaltigen weiteren
Lesestücken. Auf dem Telefon einspaltig mit erhaltener App-Navigation.
Bildcredits und Lizenzschaltfläche bleiben lesbar und bedienbar. Ein bereits
bestehender Kontrastfehler im regionalen Terminbereich wurde Website-lokal
korrigiert. Neun Sprachen, Theme-Präferenzen und DOM-Reihenfolge bleiben
erhalten. Nur zwei Website-CSS-Dateien verändert; keine App-/Shared-Writes.

Die Bildgeschichte ist ein datiertes Lesestück vom 10. September, keine
neu erfundene aktuelle Nachricht. Aktuelle App-Nachrichten bleiben separat
als 482 Metadaten-/Originallinks aus 500 Feedzeilen erreichbar. 18 Einträge
mit fehlender Provenienz, unsicherer URL oder Identitätskonflikt ausgeschlossen.
Bestehende zwölf Volltexte und ihre Bilder unverändert freigegeben.

Aktueller eingebundener App-Katalog: 27 Radios, 1.722 eindeutige Podcast-
Originalseiten, 16 Video-Links, 728 Bibliothekstitel, sechs Ereignislinks,
155 Lexikonbegriffe, 32 Referenzen und drei Lernpfade. Metadaten und
Originallinks sind keine zusätzliche Fremdtext-/Bild-/Audiofreigabe.
Originale rot-schwarze Windrose als Favicon unverändert (8.845 Bytes,
SHA-256 `78b3dbd6c6de3876c6a15012dd0ea683136ace682382f50036d68d2250d2314f`).

## Validierung und Paket

- Website-Typprüfung und 233 Vitest-Fälle PASS.
- Produktionsbuild/Projektionsprüfung PASS; Shell unter 8 MiB.
- 36 Sprach-/Breitenkombinationen (320/390/800/1440) ohne Überlauf;
  Menü jeweils erreichbar. Der erste Lauf erreichte alle 36 Fälle, danach
  wurde der Axe-Testharness auf expliziten Browserkontext korrigiert.
- Fokussierte Axe-Prüfung der gesamten Startseite ohne Befunde nach
  Termin-Kontrastkorrektur; Lizenzdialog/Fokusrückgabe und 200-%-Reflow PASS.
- Exaktes Hostingpaket über echtes Brotli übertragen: Online-Kataloge,
  Quellen-/Nachrichtenlinks, anschließend vollständiges Schließen und
  Offline-Neustarten von Chrome mit allen Katalogen/Lexikon/Favicon PASS.
- Fremder WIP-Testpfad und historische Vorschauartefakte erhalten.

Finales Paket `work/website-20min-release-815c27d/READY.json`: 45 Website-
und 48 Hostingdateien. Website-Manifest SHA-256
`d3812869d57399d602166a3e969eb4baca4b06dbdf3c454c1f8d0c52dde86ecb`,
Hosting-Manifest `a02aaa1f76710fd3b3d06644006b2ce1a6ff467470156db741eea13525ba1831`.
Shell-ID `27216a886c5d8031bb54d21bbaa7d19d92f68c5d221ec42b6092eaebdca6d210`.

48 bisherige verwaltete Hostingdateien als Rücksicherung gebunden:
44 öffentliche Dateien frisch von normalen Live-URLs byte-/hashgleich
abgerufen; vier Policies aus dem vorher unabhängig verifizierten Paket.
Beide alte Zeiger und zuletzt ausgelieferter Widerrufsstand erhalten.
Privates Rücksicherungs-ZIP SHA-256
`da793c8b6b2dd7cfba51f350cde4a50d552d0a4d272b4c6a8299d0c8560f0724`.
Vor der Live-Umschaltung Widerrufe und alten Index erneut prüfen.

## Abschlussstatus

Veröffentlichung durch direkten PO-Auftrag autorisiert. Head Chief hat
paralleles Website-Deployment beendet und Website-/Hostinger-Zuständigkeit
an diesen Chat übergeben. Neues UI-Delta benötigt den in AGENTS.md
vorgeschriebenen unabhängigen Abschlussreview. Erlaubnis zum Anschreiben
des bestehenden Kontrolleur-Chats ist angefragt. Noch kein Live-PASS.
Vorbereitete ZIPs liegen im privaten Hostingroot; Consumer-Umschaltung
erst nach diesem Review. Aktueller Liveindex weiter auf altem `f202ec5`.

Vorschau: http://127.0.0.1:43240/?lang=de#home
Die vier finalen Ansichten sind über `hashmanifest.json` gebunden.
