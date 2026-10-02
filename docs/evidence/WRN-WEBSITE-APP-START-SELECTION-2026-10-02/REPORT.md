# Website: tatsächliche App-Startauswahl

Status: **Auswahl/Anordnung lokal PASS; vollständiger PO-Auftrag OFFEN; nicht live veröffentlicht.**

Der PO verlangt die tatsächlichen App-Startinhalte und eigenen Reiter mit einem
Seitenaufbau nach 20min.ch. Die bisherige Website-Front wählte zwölf ältere,
separat freigegebene Lesestücke. Das war keine Umsetzung dieser Startauswahl.

Die neue Website-Startansicht übernimmt den aktuellen Aufmacher, fünf
Topmeldungen, eine Sportmeldung, neun weitere Meldungen und fünf Briefingmeldungen
aus der App-Auswahl. Ihre Reihenfolge wurde mit dem echten `renderHome()` des
App-Freezes `ce2b5565e539cbd1373fef5684cf1997fab5b6e2` verglichen. Beide Vorschauen
verwendeten dafür denselben unveränderten Feed-Snapshot `d7da528…` mit SHA256
`471f6e6d3baefe8f6e4bc9a4dd91f75c002096ab58be840d3e69387020f307d1`.
Die App war ausschließlich eine gelesene Referenz; keine App-Datei wurde geändert.

## Tatsächlich umgesetzt

- App-Reiter Start, Für mich, Entdecken, Medien, Gespeichert bleiben erhalten.
- Themenreiter der App filtern den zugelassenen aktuellen Website-Datenbestand.
- Aktueller App-Aufmacher und Nachrichtenreihen ersetzen die alten Home-Lesestücke.
- Desktop: Aufmacher, aktuelle Nachrichtenspalte, drei Kartenspalten; mobil eine Spalte.
- Der vorhandene Content-Controller, Leser, Update-/Widerrufsprüfungen, lokaler
  Lesestand und alle anderen Routen bleiben über einen optionalen Home-Slot aktiv.
  Mobile verwendet unverändert den bisherigen Standardrenderer.
- Die ID-Liste gewährt keine Rechte: Es werden nur Artikel aus der aktuell
  zugelassenen, quellengefilterten Directory-Projektion angezeigt. Ausgeblendete
  oder widerrufene Artikel können durch diese Auswahl nicht zurückkehren.
- Das unveränderte WRN-App-Logo bleibt das Browser-Tab-Icon.

## Offene Unterschiede zum verlangten vollständigen Ergebnis

Der gebundene Website-Import `website-restricted-link-only-v1` enthält 482 aktuelle
Artikel ausschließlich als Metadaten und Originallinks. Er enthält **keine**
aktuellen App-Kurztexte, Originalbilder oder zusätzlichen Volltexte. Die
bisherigen zwölf zugelassenen Volltexte sind weiterhin über die bestehenden
Leser-/Entdeckenrouten erreichbar. Die aktuelle Home-Auswahl zeigt deshalb bisher
Überschriften/Originallinks, nicht die vollständig bebilderten App-Karten.

Auch automatische App-Übersetzung, Entwicklungen, Tagesausgaben, Zine und
Schablonen sind durch diese Änderung nicht als Website-Parität fertiggestellt.
Die Zusatzkarten werden bewusst als weitere App-Bereiche bezeichnet, nicht als
nachgebildete App-Tageslage oder funktionierende App-Werkzeuge.

Head Chief bestätigte für diesen Folgeauftrag: keine zusätzliche, allgemein für
Website-Bilder/Volltexte geltende Freigabe; die vorhandenen Admission-/Rechtebelege
und Widerrufe bleiben bindend. Die Nachfrage nach bereits dokumentierten
Freigaben/Lizenzen ist beim PO offen. Keine Rechte werden aus der bloßen
App-Darstellung abgeleitet und keine Source-Pass-Felder umgedeutet.

Read-only Quellenreview: ANRed zeigt auf öffentlich auffindbaren Themenseiten eine
CC-BY-SA-4.0-Angabe. Die konkrete Aufmacher-Seite war über das Recherchetool nicht
lesbar; daraus wurde keine Bild-/Artikeladmission abgeleitet. Agência Pública
erlaubt Fotos nur zusammen mit dem betreffenden Bericht und Credits; Übersetzungen
verlangen vorherige Zustimmung. Keine neuen Fremdbilder/-texte wurden importiert.
Quellen: https://www.anred.org/temas/fm-la-tribu/ und
https://apublica.org/republique/. Designreferenz: https://www.20min.ch/.

## Prüfung

- Website Vitest: 34 Dateien, **240/240 PASS**, maximal zwei Worker.
- Website TypeScript: PASS.
- Website Produktionsbuild und unveränderter Projection-Vertrag: PASS.
- Offline-Shell: final 7.234.447 Byte, unter dem bestehenden 8-MiB-Limit;
  Shell-ID `1ff6e1a0fd170897da59c5ffd4a09141f4b4344d80c800d4e5d073ebff1b8e90`.
- Tatsächlicher App-Renderer gegen Website: Aufmacher, Top-5, weitere neun und
  Briefing-5 exakt identisch; Sport-ID aus gleicher Auswahl, keine ausgeschlossene
  Auswahl-ID. Ergebnis `preview.json`.
- Browser: 1440/390 px ohne horizontalen Überlauf; Themenfilter Arbeitskämpfe PASS.
- Sicherheitsfälle: ausgeblendete/entfernte IDs werden nicht wiederhergestellt;
  eine fremde Directory-Revision erhält keine eingefrorene App-Auswahl.

Die ursprüngliche breite Testausführung fand sechs veraltete Home-Textorakel.
Der Controller blieb anschließend durch den Home-Slot eingebunden. Die
Adaptertests prüfen weiterhin konkrete Wiederholungszahlen, Widerrufs-/Clear-
Schutz und den tatsächlichen aktiven Offline-Ready-Status statt inzwischen
ersetzter Fixture-Home-Kartentitel. Die Navigation prüft neue Home-Ansicht,
entfernten Reader-Query und das Verschwinden des Lesertexts.

Kein Live-Upload, kein Pointerwechsel und keine neue komplette App-Paritäts-
oder PO-Sichtabnahme durch dieses Paket. Der bisherige Live-Stand bleibt `4dfbf47`.
