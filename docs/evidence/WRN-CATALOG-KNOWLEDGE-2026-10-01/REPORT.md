# Gemeinsamer Katalog und Wissensbereich – lokaler Website-Kandidat

Noch nicht veröffentlicht. Kein neues Android-Bundle, keine Play-Mutation.

## Gebundene Inhalte

App: `6428cfef51e50818eba79950970ccef2a30ae170`.
Daten: `4153d5f2baccbc0d7ccc16a546d08e7808dff753`.
`input-bindings.json` enthält die SHA-256- und Bytebindungen aller Eingänge.
Der App-Lexikoncode wird als Datenliteral per AST ausgewertet, nicht ausgeführt.

- 715 Bibliotheks-IDs, 53 deutsche Titel, im durchsuchbaren Hauptkatalog.
- 155 Begriffe, 32 Referenzen; 19 bestehende DE-/EN-Begriffe substanziell überarbeitet.
- Drei ausdrücklich als Entwurf markierte Lernpfade mit 30 vorhandenen Werken.
  Originallinks und Originalsprachen sichtbar; Begriffsschaltflächen öffnen das Lexikon.
  Widerrufene Bücher/Begriffe und abweichende Originallinks erscheinen nicht im Lernpfad.
- 1.310 aktive Podcastdatensätze ergeben 1.256 eindeutige Originallinks:
  54 GUID-Datensätze teilen eine Originalseite. Die App bewahrt alle IDs.
  Widersprüchliche Sprachen einer Originalseite werden `und`, keine Verifizierung erfunden.
- 27 Radios, 17 Video-Originallinks, sechs Ereignis-Originallinks aus dem
  unverändert bestehenden Datenkatalog; nur Metadaten und Originalseiten.
- 35 ausgeschlossene chinesische Leftover-Talk-Datensätze erscheinen nicht öffentlich.
  Vier Intake-Holds und sechs neue Quellenkandidaten bleiben offen.
- Die drei FAQ-Nachweise heißen korrekt Kontext-/Sekundärtexte.

Der bestehende Nachrichten-/Quellenprojektionsstand `0349e131` ist getrennt
gebunden und bleibt unverändert. Neue Bücher/Podcasts stammen aus den oben
genannten lokalen Commits; eine bereits veröffentlichte Remote-Parität wird
dafür nicht behauptet. 12 bereits separat freigegebene Volltextartikel bleiben
unverändert; keine neue Fremdtext-, Bild- oder Audionutzung wird zugelassen.

Historische Wissensdatei unverändert: SHA-256
`26eb4c118d0483788f07ef0b103c97e1cf53fbf75d36a61ae47456146240726b`.
Historische Mediendatei unverändert: SHA-256
`003c32358ebe0d5ad22fb9c0b059bf82c242aa0b99a4d869fb67960c86acdc07`.
Der neue Wissenswrapper v2 bindet die bestehende mobile-knowledge.v1-Struktur
für den vollständigen aktuellen Bestand und bewahrt den historischen Vertrag.

## Prüfung

Website: 231 Vitest und 84 Node-Fälle bestanden. Nach Quellenklassifikations-
und Testtypkorrektur 24 betroffene Wissens-/Katalogfälle erneut bestanden.
Typprüfung und fokussierter Lint bestanden. Nachrichtenprojektionsverträge:
12 Node-Fälle bestanden. Produktionsbuild mit 12 Artikel-Landings bestanden.
Offline-Shell 7.025.513 Bytes, weiterhin unter dem harten 8-MiB-Limit.

Vier Browserfälle bestanden: 390/800/1440 sowie 200-%-Reflow. Podcastpagination,
Originalsprache, sichere Originallinks, 715-Bücher-Suche, Lernpfade und
Lexikon-Direktaufruf geprüft; Lernpfade in neun UI-Sprachen, ehrlicher EN-Fallback
außerhalb DE/EN. Axe-Prüfung für den sichtbaren Wissensbereich ohne Befunde.
Repräsentative Screenshots und ein Hashmanifest liegen in diesem Verzeichnis.
Der sichtbare Einstieg bezeichnet den aktuellen lokalen Katalog statt des
veralteten Alt-App-Katalogs; dieser UI-Text ist in neun Sprachen vorhanden.
Nach dieser Copy-Korrektur Typprüfung/Lint/Build und 36 Sprach-/Breitenkombinationen
bei 320/390/768/1440 erneut ohne Überlauf geprüft.

Frische Vorschau: `http://127.0.0.1:43231/?lang=de#knowledge`.
App: `http://127.0.0.1:8794/index.html?preview=8&catalog=20261001`.
Unabhängiger Website-Abschlussreview: GREEN für Produktcommit
`83abb0f3cc3ac385b5df3409edc623cf592e733a`, ausschließlich lokal.
Siehe `controller-review.md`: 13/13 Eingangsbindungen, 4/4 Manifesthashes,
24 Wissens-/Katalogtests, 12 Projektionsverträge, Typprüfung/Lint und vier
Browserfälle unabhängig bestätigt. Kein offener Produktblocker.

Das nach dem Produktcommit erzeugte `release-candidate.json` wird als
gesonderter Dokument-/Paketnachtrag gebunden: Quellcommit `83abb0f`,
Status LOCAL-PASS, 45 Website- und 48 Hostingdateien, Veröffentlichung false.
SHA-256 `c02ced3a08e18956eade87b7ef8aa5db371bf3df9def80174022ebb12d226905`.
Der bestehende Paketvalidator hat die beiden Pakete vor READY vollständig geprüft.
Der Nachtrag ändert keine Produktbytes. Live-CSP/CORS, letzter Widerrufsreceipt,
Zeiger-/Rollback-Nachweise und artefaktgebundene Veröffentlichung bleiben offen.

## Google Play

Einreichung 43 weiterhin **Wird überprüft**, zuletzt read-only am 1. Oktober
2026 gegen 11:49 UTC / 19:49 Singapur bestätigt. Einreichung seit 14:25 Singapur;
frühere Einreichungen 41/42 abgebrochen. 14 Änderungen enthalten Code32 und
Store-Medien. Richtlinienseite meldete keine Probleme, Managed Publishing aus.
Kein interner Warteschlangengrund sichtbar. Die aktuelle lokale Erweiterung
ist nicht Teil von Code32. Details im App-Beleg PLAY-REVIEW-DIAGNOSIS-2026-10-01.md.
