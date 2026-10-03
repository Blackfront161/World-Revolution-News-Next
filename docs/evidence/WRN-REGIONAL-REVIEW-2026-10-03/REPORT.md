# Regionalerneuerung, 3. Oktober 2026

Vier vorhandene Termine wurden erneut anhand ihrer Originalankündigungen geprüft. Revision4 ist bis **10. Oktober 2026, 09:10 Uhr Singapurzeit / 01:10 UTC** gültig. São Paulo bleibt zur erneuten Prüfung im [Quellbeleg](source-review.json) erhalten; die zeitweise nicht erreichbare Ankündigung wurde nicht als frisch geprüft oder abgesagt ausgegeben.

Produktcommit: `03c2aaadcc4988a4911a97522aafd4246fae04bb`, Basis: veröffentlichter Website-Stand `566422758241190f432d8c8a09d67a5f589d90ac`. Der bestehende Website-Arbeiter und sein Gefangenenkandidat wurden nicht in diesen isolierten Kandidaten übernommen oder verändert.

Geändert wurden ausschließlich Katalog/Hashpin, datierte Regionaltestorakel, die genaue Workflow-Statusbindung und Quellbelege. Der Workflow vergleicht die tatsächliche Revision, Zeitgrenzen, SHA und Anzahl mit dem geprüften Input. Sieben-Tage-Gültigkeit, 48-Stunden-Vorlauf, Metadatenrechte und alle übrigen Schutzmechanismen bleiben erhalten.

Prüfungen: acht Werkzeug-/Workflowtests, 38 Regional-/Mobile-Content-Verträge und 46 Mobile-Auswahl-/Cache-/UI-Tests bestanden. Der Kontrolleur reproduzierte unabhängig acht Werkzeugtests, zwölf Regionalverträge und sieben Regional-UI-Tests und akzeptierte den Produktcommit. Sein Review bindet Quellhashes/Feldzuordnung und Guards; ein zweiter unabhängiger Liveabruf der externen Originalseiten wurde nicht behauptet.

Der Website-Build mit Node24.19.0/Vite8.2.2 besteht. Die Offline-Shell umfasst 7805953 Bytes bei unverändertem 8-MiB-Limit; größtes JavaScriptpaket 418517 Bytes bei 500000-Byte-Limit. [Shellmanifest](shell-manifest.json): `c984dab422a322c12cc090d5cc0a4ec6ce639d58e1dd25bfa90ab62096822c8d`.

Mit dem tatsächlichen öffentlichen Widerrufsstand wurde das bestehende Produktionspaketwerkzeug ausgeführt und anschließend die Datei-/Metadatenclosure rekonstruktiv geprüft: **46/46 Dateien**, Paketshell `e0a50e0cd362402653bd5257b7e9a41a551900d070d31f2ccdf1230039da2c82`. Lokaler Paketpfad: `work/regional-site-candidate`; Dateimanifest: `work/regional-site-candidate.manifest.json`. Shell- und Paketshell unterscheiden sich durch die gebundene Produktionsheader-Konfiguration.

Echte Browserprüfung der gebauten [Vorschau](http://127.0.0.1:43241/#home): Europa zeigt London/Manchester mit Originalverweisen und neuen Prüf-/Gültigkeitsdaten; Brasilien zeigt den ehrlichen Leerzustand. Es wurde keine Region dauerhaft gespeichert und keine Standortabfrage ausgelöst.

Status: **Quellkorrektur unabhängig akzeptiert; lokales Paket geprüft.** Produktionsupload, Serverheader, Live-Readback und Offline-Neustart des veröffentlichten Pakets stehen noch aus. Die bisherige Live-Website und der interne Android-Code27 wurden durch diesen Arbeitsgang nicht geändert.
