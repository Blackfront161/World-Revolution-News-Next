# Website App-Startinhalte, 2. Oktober 2026

Produktfreeze: `abd0209dc45a41dbc4e4c41225ed9d7ad5371003`.

Der vorherige Import hatte die aktuellen Startmeldungen lediglich als Überschrift und Originallink dargestellt. Dieses Paket ergänzt für dieselben 21 Beiträge kurze, von WRN verfasste Lesenotizen in Deutsch und Englisch und eigene deutsche Schlagzeilen. Originaltitel und Originaladresse bleiben in der Bindung erhalten. Es sind keine behaupteten Übersetzungen oder vollständigen Kopien der Originalbeiträge.

Alle 21 kanonischen App-Themen und ihre neun Sprachkataloge stammen aus dem geprüften App-Commit `b89b7fbfbf6c4f1531c2623cdec367aaab29199d`. Die Artikelreihenfolge bleibt beim vorherigen geprüften App-Home-Freeze und dem Directory-Commit `d7da528c9a996a2ec13bf3912c45e18e7d58bdfa`. Der Resolver verwendet eine Notiz nur bei identischer ID, Originaladresse, Originalüberschrift und Directory-Revision, für aktuelle Artikel, nachdem die bestehenden Source-/Withdrawal- und Benutzerfilter angewendet wurden.

Die Nachrichtenansicht zeigt den Aufmacher und zwei Hauptmeldungen links, aktuelle Nachrichten rechts, anschließend die übrigen Hauptmeldungen, Sport, Veranstaltungen, weitere Nachrichten und das Fünf-Meldungen-Briefing. Die frühere freie Fläche unter dem Aufmacher wird so mit Nachrichten gefüllt. Neue Besucher erhalten das vorhandene helle Farbschema; explizit gespeicherte Farbschemata bleiben erhalten. Eigene fünf Hauptreiter und das bereits veröffentlichte WRN-Favicon bleiben erhalten. 20min.ch dient als Strukturvorbild, seine Inhalte und Bilder werden nicht kopiert.

„Heute bei WRN“ zeigt tatsächliche 24-Stunden-Zählung und Quellen-/Sprach-/Regionsbreite aus bis zu 160 aktuellen Meldungen der letzten sieben Tage. Unbekannte Sprachen, zukünftige und historische Artikel werden nicht als aktuelle Abdeckung gezählt. Die Tagesausgabe lässt sich öffnen und schließen und zeigt fünf gebundene Lesenotizen samt Original-Link. Sie behauptet keinen vollständigen Originalartikel-Download.

## Prüfung

- Website-Gesamtsuite am vollständigen Lesenotizpaket: 35 Dateien, 244/244 PASS. Nach Layout-/Defaulttheme-/ARIA-Anpassung: 46/46 gezielte App-/Home-Tests PASS.
- TypeScript PASS. Frischer Build PASS; Shell 7.268.970 Bytes, unter 8 MiB. Kein Drittanbieteraufruf für Bilder oder Übersetzung hinzugefügt.
- Browser: echte App-Auswahl-IDs und Original-Links unverändert; 21 Lesenotizen; nutzbare Tagesausgabe; 21 Themen in allen neun UI-Sprachen; Breiten 1440/1024/768/390 ohne Überlauf; keine PageErrors.
- Bereitgestellter Kandidat `work/website-home-content-release-abd0209`: 45 Website-/48 Hostingdateien. Website-Manifest SHA256 `580533676772868ebb30005684c2f86e1f2c07c738b1d852107b5f1c32392b5e`; Hostingmanifest `05d99bb0594b09465f5f35660b81640f762c047db26f31834cab0c66d5379d0c`.
- Unabhängiger Abschlussreview: GREEN für genau dieses Teilpaket; Umfang und Grenzen in `REVIEW.md`.
- Live auf `https://solinaridao.com/?lang=de#home`, 2. Oktober 2026, 15:04:58 UTC: normale HTTPS-Readbacks 44/44 PASS einschließlich Bytehashes, MIME und Sicherheitsheadern. Vorherige Stufen 40/40 und 42/42 PASS; beide Zeiger zuletzt umgeschaltet. Private Sicherung des vorherigen 734425e-Stands mit 48 lokal geprüften Dateien vorhanden; kein tatsächlicher Live-Rollback behauptet.
- Frische Live-Browserprüfung PASS: 16 Home-Artikel plus fünf Briefing-Beiträge, 21 gebundene Lesenotizen, echte Tagesausgabe, Themenfilter und alle neun Themen-Sprachkataloge; vier Breiten ohne horizontalen Überlauf. Alle bisherigen App-Kataloge und 155 Lexikoneinträge online sowie nach vollständigem Chrome-Neustart offline PASS. Favicon online/offline bytegleich, SHA256 `78b3dbd6c6de3876c6a15012dd0ea683136ace682382f50036d68d2250d2314f`; keine PageErrors. Live-Katalog-/Offline- und Home-Belege separat beigefügt.

## Rechteforschung und verbleibender Gesamtauftrag

Das tatsächliche ANRed-Aufmacherfoto wurde nicht kopiert oder hotlinked. Die direkt gelesene Artikelseite hat einen allgemeinen CC-BY-SA-4.0-Footer; der unabhängige Kontrolleur fand im konkreten Bilddatensatz keine Urheber-/Credit-/Lizenzangabe. Entscheidung: `needs-review`. Eine konkrete spanische Nachfrage an die auf der ANRed-Selbstdarstellung bestätigte Redaktion ist separat vorbereitet, nicht versendet.

Der vom UAWD-Beitrag verlinkte historische NARA-Fotobeleg weist auf Wikimedia Commons ausdrücklich auf US-begrenzten Public-Domain-Status und mögliche andere Rechte außerhalb der USA hin. Deshalb ebenfalls keine automatische Bildaufnahme. EFF erlaubt eigenes Originalmaterial unter CC BY4.0, aber der allgemeine Hinweis allein klärt hier nicht die Urheberschaft jedes Banners. Agência Pública unterscheidet unveränderte Wiederveröffentlichung und Übersetzungsfreigabe; keine pauschale Foto-/Übersetzungsfreigabe abgeleitet.

Der vollständige Nutzerauftrag bleibt **offen**: aktuelle App-Fotos und Originalvolltexte benötigen noch tragfähige Einzelrechte; Lesenotizen sind hier nur de/en (andere UI-Sprachen zeigen mit `lang=en` gekennzeichnete englische Notizen); weitergehende Today-/Action-Kit-/Edition-Funktionen und eine dynamisch nachgeführte App-Auswahl fehlen. Die bereits zugelassenen zwölf Reader-Artikel, vorhandenen Kataloge und Offline-/Recovery-/Widerrufsverträge werden nicht ersetzt. Kein Gesamt-App-Parity-PASS aus diesem Paket ableiten.
