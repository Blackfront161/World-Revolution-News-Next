# Verlustfreie Ergänzung aus der bestehenden Nachrichtenversorgung

Root, 14. September 2026. Technischer RC4-Teilabschluss; keine automatische
Quellenfreigabe oder Veröffentlichung.

## Geschlossene Lücke

Der erste Import konnte nur Artikel binden, die alle im neuesten 500er-Feed
standen. Das genügt für eine einzelne Aufnahme, aber nicht für wiederholbare
Erweiterungen: Ein älterer Beitrag kann aus diesem begrenzten Feed verschwinden,
obwohl sein geprüfter Text samt Bildern weiterhin verfügbar bleiben soll.

`appendReviewedLegacyArticles` bindet deshalb die vollständige bisherige
V3-Eingabe an ihren Canonical-JSON-SHA-256 und fügt ausschließlich neue,
separat geprüfte Artikel hinzu. Für jede neue ID werden Artikel, Reader,
Admission und Discover-Eintrag gemeinsam übernommen. Sämtliche bisherigen
Artikel/Bildblöcke und Lifecycle-Historien bleiben erhalten. Identitätskollisionen,
unvollständige Bündel, falsche Sequenzen und ungeprüfte Rücknahmen werden
abgewiesen. Bestehende Artikel zu korrigieren oder zu widerrufen bleibt eine
ausdrückliche Operation des vorhandenen Veröffentlichungswegs.

## Benutzbarer Ablauf

Der bestehende Importbefehl bleibt erhalten. Der neue Modus erzeugt eine
vollständige Eingabedatei für den vorhandenen V3-Publisher:

```text
node tools/legacy-news-ingestion.mjs --append previous.json PREVIOUS_CANONICAL_SHA256 reviewed-batch.json bindings.json news-feed.json feed-status.json COMMIT new-input.json
```

Alle Eingaben sind lokal und größenbegrenzt. Feed und Status werden erneut
einschließlich Aktualität, Byte-/Eintragszahlen und Commit-Format geprüft.
Das Ausgabeziel muss neu sein. Anschließend verwenden wir unverändert
`build-production-content-release.mjs` und `prepare-production-content-delivery.mjs`
mit der bestehenden Versions-/Ledgerkette. Die Merge-Ausgabe ist lediglich
Publisher-Eingabe, kein Genuine-Ready-Paket; insbesondere wird sie nicht direkt
an Clients ausgeliefert. Bei Abbruch während des Schreibens kann eine neue
Eingabedatei unvollständig bleiben und muss verworfen werden. Bestehende Dateien
werden nicht überschrieben, und der Publisher muss die komplette Eingabe prüfen.

## Belege

- 18/18 Import-/Append-Tests bestanden.
- Gesamter betroffener Backendlauf: 32/32 Tests bestanden, einschließlich
  vorhandenem V3-Publisher und Delivery-/Ledger-/Windows-Junctionprüfungen.
- Positiver Test verwendet die tatsächlich zugelassenen sechs Artikel und vier
  Bilder, aufgeteilt in fünf bisherige und einen neu hinzukommenden Beitrag.
  Nur der neue Beitrag ist im synthetischen Transportfeed enthalten. Nach der
  Zusammenführung sind alle sechs Bündel unverändert und bestehen erneut den
  echten V3-Publisher. Der Test ist kein neuer produktiver Quellenabruf.
- CLI-Test beweist die vollständige Dateiausgabe, V3-Verarbeitung und Schutz
  einer bereits vorhandenen Ausgabe; Größenüberschreitungen werden abgewiesen.
- Unabhängiger Review im selben Paket; Lint und Format bestanden.

## Tatsächliche lokale Aufnahme

Version 4 ergänzt den italienischen C4SS-Artikel /content/61302 mit 20
Originalabsätzen und ausdrücklicher Übersetzerangabe Enrico Sanna. Offizielle
HTML-Seite und WordPress-API stimmen nach dokumentierter Normalisierung überein.
Alle sechs bisherigen Artikel und vier Originalbilder bleiben unverändert.
Der neue Beitrag hat kein aufgenommenes Artikelbild; generisches Seitenbranding
wird nicht als Nachrichtenfoto ausgegeben. Quellen- und Kandidatenreview PASS.

Die vollständige freigegebene Publisher-Eingabe liegt dauerhaft unter
candidate/production-build-input-v3.json. Der vorhandene V3-Publisher akzeptiert
das Paket; beide lokalen Clients verwenden denselben Descriptor
0fc717af52471b711fd8c585adef398032d8acf74ce6de14d4650357cf6c90c8.
Die Ressourcen wurden vor den current.json-Zeigern geschrieben. Ältere
Revisionen und Bilder bleiben erhalten; keine externe Veröffentlichung.

Die bisher fehlenden lokalen Delivery-Ledger 2 und 3 wurden mit dem vorhandenen
Werkzeug jetzt vorbereitet und an den bestehenden Ledger 1 angeschlossen.
Ihre originalen Kern-Descriptoren stimmen unverändert überein. Das sind heutige
Vorbereitungsbelege, keine Behauptung historischer Veröffentlichungen. Ledger 4
ist die Grundlage für die nächste Erweiterung. Alle drei Ledger samt tatsächlichen
Zeitpunkten liegen unter delivery-ledgers/.

Beide gebauten Chrome-Clients: sieben erreichbare Artikel, exakte 20 italienische
Originalabsätze, erhaltene Übersetzerangabe, neun UI-Sprachen, Reflow bei 320px,
keine axe-Verletzung im Reader, keine externen Requests oder Seitenfehler.
Erneutes Öffnen des Readers ohne Netz bestanden; kein neuer Nachweis eines
kalten Offline-Starts oder einer nativen Installation daraus abgeleitet.
Die Browserprobe zählt ausdrücklich Originalabsätze; zusätzliche übersetzbare
Bedien-/Statusabsätze gehören nicht zum Quelltextvergleich.
Alle vier bisherigen Originalbilder wurden in beiden Readern tatsächlich dekodiert; natürliche Pixelmaße stimmen mit den aufgenommenen Bildblöcken überein. Fixture-Parität 16/16 und Fixture-Provenienz bestanden. Finale Buildbindungen
und vier repräsentative Screenshots sind im Paketmanifest festgehalten. Produktcommit 294464bd: App70/Website62 Builddateien, Websitepaket samt Headern verifiziert, Offlinegraph8.257.104 Bytes unter8MiB. Aktive lokale Vorschauen43212/43213, Prozess4984. Kein Produktcode nach diesem Build geändert.

## Weiter offen

Die Übernahme ist weiterhin geprüft und manuell angestoßen. Wiederholbare
Betriebsanbindung, neue Quellenpässe, breiter Sportbestand, konkrete Videoclips,
laufende Medien/Übersetzungen und abschließender RC bleiben offen. Der markierte
Upstream-Identitätskonflikt NEWS-IDENTITY-H-001 bleibt offen. Zine, Artikel-TTS,
World Revolution Map und Action Radar bleiben später vorgemerkt.
