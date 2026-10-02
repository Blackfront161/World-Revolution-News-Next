# WRN: App-Inhalte mit Nachrichtenfront nach 20min

Erster Produktstand `815c27d94b1a4b8e28e11b4c50110e961e07f365` auf der bereits
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
an diesen Chat übergeben. Der bestehende Kontrolleur hat das UI-Delta
unabhängig mit PASS abgenommen; Bericht SHA-256
`e299d817e4cb7abee7f2e2da0fa17a1d695ca606678e4018ca7005d91b2afbdb`.

Die vorherigen drei Uploadversuche im Hostingroot wurden mit HTTP 403
abgewiesen. In einem frisch angelegten privaten Geschwisterordner von
`public_html` funktionieren die normalen UI-Uploads. Alle sieben ZIPs
bestätigt; Assets, Rootpolicy, Teilbereichspolicies/SW, Index und beide
Zeiger nacheinander aktiviert. Keine Deaktivierung von Sicherheitsmaßnahmen.
Ursache der vorherigen 403 nicht abschließend bestimmt.

Liveindex SHA-256
`820dfaa6dc22ad8db1b59812c525cbdfbc0ce7c131ebcf6b5ca60e053c16fdec`.
Alle 44 öffentlichen Dateien über normale HTTPS-URLs byte-/hashgleich,
einschließlich MIME/CSP/CORS/Cacheheaders: PASS. Widerrufsstand vor der
Zeigerumschaltung frisch unverändert geprüft. Der echte Chrome-Livetest
mit vollständigem Offline-Prozessneustart bestätigt alle App-Kataloge,
155 Lexikonbegriffe und die exakten Faviconbytes, ohne Seitenfehler.
Die private Serverrücksicherung wurde heruntergeladen und SHA-256-genau
zu `da793c8b...` bestätigt (48 verwaltete Dateien, beide alten Zeiger).
Der Kontrolleur bestätigt anschließend unabhängig den Live-Abschluss.
Ein zusätzlicher frischer Erstaufruf bestätigt die automatische Freigabe
des großen Leitartikels ohne Aktualisierungsklick und das dekodierte
Originalbild. Desktop (1440) und Telefon (390) ohne Seiten-Overflow.
Die anfänglichen privaten Screenshot-Harnessfehler (zu breit gefasster
Lead-Locator bzw. alter Gridname) bleiben als Historie erhalten; der
auf das tatsächlich gerenderte Frontgrid begrenzte finale Lauf ist PASS.

Private Receipts: `work/website-projection-live-20261001/live-full-1790929446151/receipt.json`,
`work/website-20min-20261002/live-browser-815c27d/result.json`,
`server-backup-readback.json` und `publication-status.json`.

Vorschau: http://127.0.0.1:43240/?lang=de#home
Die vier lokalen und zwei veröffentlichten Ansichten, der unabhängige
UI-Bericht und `LIVE-VERIFICATION.json` sind über `hashmanifest.json` gebunden.

## Nachkorrektur: zuverlässiger Erststart

Nach der ersten Veröffentlichung trat bei frischen Browserprofilen ein echter
sporadischer Timeout auf. Der bestehende Bootstrap setzte seinen Einmalmerker
vor dem fehlgeschlagenen Check und ließ die Front anschließend ohne Lead.
Der Kontrolleur bestätigte den Befund und die anschließende Website-lokale
Korrektur unabhängig. Finaler Produktfreeze `4dfbf47ff8af9809ab537004f8ae5181144dec3e`: zwei
zusätzliche Websitepfade (Wrapper und Regressionstests), keine Shared-/App-Writes.
Nur ein zuvor vollständig unberührter Erststart bekommt maximal drei
Transportversuche beziehungsweise sechs busy/coalesced Versuche; vor jedem
Folgecheck erneuter Guard. Clear/Unmount, gespeicherte Inhalte, neue Safety
oder andere nicht-jungfräuliche Zustände beenden die Wiederholung.

237/237 Website-Tests mit zwei Workern, Typecheck und Build PASS. Der vorherige
maximal parallele Lauf hatte vier Directory-Ladezeitfehler; keine Testorakel
geändert. ESLint meldet weiterhin zwei bereits vorhandene Fast-Refresh-Exports
an den unveränderten Exportdeklarationen. Reale Browser-Fault-Injection lokal
und live bestätigt die automatische Front nach einem sowie zwei simulierten
Pointer-Timeouts, mit dekodiertem Leitbild und Headerlogo.

45/48-Dateipaket und Code unabhängig PASS. Website-Manifest
`d7fc4494d4744389ad52bce0f17de3fe464d3e91c088128207fc487c14b60ca5`,
Hosting-Manifest `fdc6d52562009448cacdcf36da529d421afbff04206f6a979fd72f975dfa87b2`.
Nur vier Serverdateien unterscheiden sich: Rootpolicy-Cacheliste, neues JS,
SW, Index; beide Inhaltszeiger und sämtliche Inhalte bleiben bytegleich.
Die frische vollständige Rücksicherung auf 815c27d wurde privat hochgeladen
und vom Server zurückgelesen: 48 Dateien, SHA-256
`5a30af2e82315a5d4c0e243b00fd49cb1dd1646fd1357a76369a9ce63369aee4`.
Alle 44 normalen öffentlichen URLs entsprechen dem finalen Manifest.
Die Live-Screenshots zeigen den finalen Freeze nach zwei simulierten Timeouts.

Finaler Liveabschluss: alle App-Kataloge, Lexikon und genaue Faviconbytes
auch nach vollständigem Chrome-Prozessneustart offline PASS, ohne Seitenfehler.
Der finale Test wartet auf das Vorhandensein der anfangs geschlossenen
Inhaltsabdeckung; ihre Sichtbarkeit ist kein korrektes Ladeorakel. Die
5-s-Transportgrenzen und sämtliche Inhalts-/Header-/Safety-Assertions bleiben
unverändert. Private Zwischenfehler bleiben erhalten. `LIVE-VERIFICATION.json`
bindet jetzt den finalen Freeze 4dfbf47, die Fault-Injection und die
zurückgelesene aktuelle Rücksicherung.
