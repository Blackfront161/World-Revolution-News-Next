# Website: Artikelbilder und interner Nachrichtenleser

Produkt `f6649dc804a6029bdcceb4eafe47041aace9587b`, Basis der weiterhin
öffentlichen Website `d738a9454161f1f6aff624bcb9c2a9f0bc2ccf60`.
Veröffentlichung noch nicht ausgeführt; unabhängiger Abschlussreview PENDING.
Der Review umfasst auch die zuvor unveröffentlichte aktuelle Startauswahl aus
`20b677c`, einschließlich ihrer separat gebundenen Quellenprüfung.

## Sichtbares Ergebnis

Start, Nachrichten und Für mich öffnen zugelassene Nachrichten im eigenen
Website-Leser. Der Leser bietet Speichern, Gelesen/Ungelesen, Teilen, einen
kopierbaren kanonischen Website-Link und Textgrößen bis 200 Prozent. Eigene WRN-
Schlagzeilen und Lesetexte der 15 Startbeiträge können zwischen DE, EN, ES, FR,
IT, PT, RU, EL und TR gewechselt werden. Die Oberfläche und Bildhinweise sind in
denselben neun Sprachen verfügbar. Vorlesen verwendet den bestehenden App-
Baustein mit lokalen Gerätestimmen und startet nur auf Nutzeraktion.

Dies importiert keine fremden Originalvolltexte. Bei den 465 neuen zugelassenen
Feed-Metadatensätzen zeigt der Leser die verfügbare Information und einen klaren
Hinweis zum Originaltext mit separat gekennzeichnetem Originalquellen-Link.
Der bestehende zwölfteilige freigegebene Volltextbestand und sein bisheriger
Leser bleiben erhalten. Online-Maschinenübersetzung beliebiger Originaltexte
ist nicht als funktionierende Leistung behauptet; der bestehende strikte
Übersetzungsadapter ist ohne Providerkonfiguration nicht aktiv.

Das Zeitungsraster verwendet die bisherigen eigenen Reiter und Themen in allen
Themes. Autonom besitzt eine kompakte Bild-und-Schlagzeilen-Darstellung. Der
gespeicherte Theme-Vertrag bleibt `editorial`; der URL-Alias `autonom` wählt diese
Darstellung. Vorhandene Farbpaletten werden verwendet. Zwei zusätzliche eigene
Artikelillustrationen ergänzen das bereits gebundene Elitsha-Leitbild. Ihre
Identitäten, Herkunft und Generierung stehen in ILLUSTRATIONS.md und dem
versionsgebundenen Bildregister. Keine Fremdfotos wurden übernommen.

## Speicherung und Sicherheit

Neue Nachrichten-Lesedaten verwenden ausschließlich stabile öffentliche IDs und
zwei boolesche Merkmale im separaten Schlüssel
`wrn.website-news-reading-state.v1`. Grenzen: 500 Einträge und 128 KiB. Keine
Titel, Artikelkörper, URLs oder persönlichen Angaben werden dort gespeichert.
Der vorhandene Website-Lock-Koordinator wird wiederverwendet. Beschädigte,
zukünftige oder übergroße Daten werden schreibgeschützt erhalten; Kapazitäts-
und Schreibfehler führen nicht zu stiller Verdrängung. Die bisherigen V1/V2-
Lesespeicher werden nicht migriert oder überschrieben. Löschen erfordert eine
explizite zweite Nutzeraktion. Ausgeblendete oder zurückgezogene Artikel verlieren
sofort Inhalt und Aktionen im Leser, ohne gespeicherte IDs automatisch zu löschen.

Teilen überträgt erst nach Nutzeraktion den ausgewählten Titel, Quellennamen und
die kanonische Website-Adresse. Private Queryparameter und Originalanbieter-URLs
werden nicht übernommen. Fehlt natives Teilen, stehen Zwischenablage und ein
manuell auswählbares Linkfeld zur Verfügung. Browser-Modifikatoren zum Öffnen in
einem neuen Tab werden erhalten. Direkte Reader-Links und Zurücknavigation sind
Teil der Browserprüfung.

## Bindungen und Veröffentlichungsweg

Directory-Sequenz `202610030004`, SHA-256
`f09accb635582fa41764a38cbf987d9085502a3c9694cb72d8dc630a03deadb2`.
Tatsächliche erneute Beobachtung: `2026-10-03T05:58:12.439Z`; Data-Commit
`5304fa0032a6761071962e4b74b66cb6f114c49f`. Die drei Upstream-Dateien blieben
bytegleich. Klassifikation: 465/500 Feed-Metadaten, 35 Ausschlüsse, 946
Directory-Artikel und 547 Quellen, kein neuer Originalvolltext. GlobalSourcePass
bleibt unverändert 19 Profile / 22 Endpunkte; Widerruf `030aa883…` wurde öffentlich
erneut gebunden. Quellen- und Bildzuordnung bleiben exakt ID-/URL-/Titel-/Commit-
gebunden. Die vorherigen eingefrorenen Belege werden nicht überschrieben.

Das konkrete lokale Paket liegt unter
`work/website-news-reader-release-f6649dc-final/READY.json`: 48 Website-Dateien,
51 Hosting-Dateien, unverändertes 8-MiB-Shell-Limit und 700-KiB-Einzelbildlimit.
Website-Manifest `999c7ba0a088523afa89d9515922af088677e80dead366bf2a711c011d58714f`,
Hosting-Manifest `16bfa570e112e4e765832f4a5a52c666baf712616943a766a1c73cacdb8ff45e`.
Fünf Aktivierungs-ZIPs und das vollständige 49-Dateien-Rollback-Paket liegen unter
`work/roadmap-website-live-20261002/upload-f6649dc/`. Alle Archive wurden lokal
rückgelesen und gehasht. Die alte öffentliche Version wurde erneut 45/45 exakt
rückgelesen; vier private Apache-Dateien sind aus dem vorher geprüften Paket
gebunden, nicht als öffentlich rückgelesen behauptet.

Nach unabhängiger Prüfung: immutable → policy/SW → index → production-pointer →
directory-pointer; anschließend öffentliche Hash-/Header- und Browserprüfung.
Die Veröffentlichung ist vom Benutzer autorisiert. Kein Push und kein Android-
Release gehören zu diesem Paket.

## Validierung

TypeScript und ScopedESLint der betroffenen TS-/TSX-Produktion: PASS. Ganze
Website-Suite: 42 Dateien / 286 Tests PASS. Die zwölf konfigurierten Node-/
Protokollmodule: 88 Tests, die zunächst zwei veralteten Paketanzahl-Erwartungen
wurden auf die tatsächlichen zwei zusätzlichen gebundenen Bilddateien korrigiert;
der betroffene Paketmodul-Neulauf besteht 13/13. Die übrigen Module bestanden
unverändert. Fokussierte Offline-/Graph-Tests: 39/39 PASS. Keine Schwächung von
Grenzen, MIME-, Hash-, Herkunfts-, Revocation- oder Rollback-Prüfungen.

Produktionsbuild, Projektionsprüfung und bestehende Paketvalidatoren: PASS.
Die endgültige Browserprüfung und Shell-Größe sind in validation.json und
package-browser-result.json gebunden; diese Dokumentation behauptet keinen
unabhängigen Review-PASS und keine vollständige App-/Website-/RC-Freigabe.
