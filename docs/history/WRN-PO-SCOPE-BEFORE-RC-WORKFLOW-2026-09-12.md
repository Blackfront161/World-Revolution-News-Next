# Abgleich deiner vereinbarten Erweiterungen

Stand: 12. September 2026, regionale Auswahl in beiden Clients unabhängig geprüft.
Grundlage ist der ursprüngliche Task „WRN G2 – Zielarchitektur &
ADRs“, die gespeicherte G2-Chatübergabe, PO092 sowie deine neueren Präzisierungen
zu Inhalten, Quellen, Videos und Schwarz/Violett/Rot. Frühere Prozentangaben
nach abgeschlossenen Tasks beschreiben die tatsächliche Produktintegration
nicht zuverlässig. Dieser Abgleich zählt nur erreichbare Funktionen.

**Noch nicht alles ist umgesetzt.** Ein Teil der früher als fertig gemeldeten
Erweiterungen funktionierte nur mit Testdaten. Diese Lücke wird jetzt in den
echten App- und Websitepfaden geschlossen.

| Dein Wunsch | Tatsächlicher Stand |
| --- | --- |
| Schwarzer Hintergrund, Violett/Rot als Standard; Rot/Cyan weiter wählbar; rote Buttonränder und rote Auswahlfüllung | In beiden Anwendungen umgesetzt und visuell geprüft. |
| Inhalte/Quellen aus der alten App, ergänzt um unsere neuen Bereiche | Historische Verzeichnisse übernommen:973 Nachrichtenverweise,532 Quellen-Endpunkte,3 Sportnotizen. Das sind keine973 vollständig importierten Artikel und keine laufend aktualisierten Feeds. |
| Bibliothek/Lexikon und Solidarität/Hilfe übernehmen/erweitern |609 Bücher,22 Begriffe,11 Hilfsangebote und30 historische Solidaritätsprofile lokal integriert. Historische Einträge werden nicht als aktuell bestätigte Angebote ausgegeben. |
| Artikel mit Originalbildern und sauberer Lesedarstellung | Sechs echte Originalartikel und vier einzeln belegte Bilder in beiden Produktionsclients integriert. Bilder, Alternativtexte, Lizenzen, Originalabsätze und Offline-Neustart geprüft. Zwei Artikel haben derzeit kein aufgenommenes Bild; es wurde kein ungesicherter Bildrechtebeleg erfunden. |
| Quellen folgen/ausblenden, Profile und „Für mich“ | Quellenwahl, Rücknahme, Verwaltung und vorhandene Profilmetadaten in beiden Produktionsclients umgesetzt. Gemerkte Artikel/Direktlinks bleiben erreichbar. Der zusätzliche Startseitenfehler ist in e77767d3 korrigiert und unabhängig geschlossen:5 Home-Tests, beide Typprüfungen,14 Browserfälle und23 Bildhashes bestanden. Vollständige Quellenpässe, geprüfte Logos, Aktualität und Korrekturkontakte fehlen weiterhin teilweise. |
| Neue Startseite mit Aufmacher, fünf kompakten Meldungen, Sport und weiteren Nachrichten | Beide Clients zeigen einen Aufmacher und fünf Meldungen. Die vier aufgenommenen Originalbilder erscheinen jetzt auch dort: eines im Aufmacher, drei in den kompakten Meldungen. Sport-Lesehinweise und Archivverweise folgen. Weitere Meldungen erscheinen, sobald mehr als sechs Artikel zugelassen sind. |
| Artikel zuverlässig weiterlesen | Lokales Merken, Lesestatus/Position und Offline-Lesen produktiv vorhanden und geprüft. |
| Absatzweise direkt im Artikel übersetzen | In beiden echten Produktionsreadern umgesetzt und unabhängig geprüft (c239aec4). Original bleibt sichtbar, Übersetzen nur auf Knopfdruck, Zeitlimit und sichere Abbruchregeln. Der lokale Dienst ist ebenfalls geprüft; der externe Anbieter ist noch nicht aktiviert. |
| Aktualisierbarer Podcast-, Audio-, Radio- und Video-Hub; Podcasts fortsetzen | Verzeichnisse vorhanden, produktiver In-App-Player mit Fortsetzung und laufende Versorgung noch offen. |
| Angenommene YouTube-Kanäle, einschließlich DerDaraUncut | Die11 angenommenen Kanalvorschläge sind im Verzeichnis integriert. Das ist keine automatische Übernahme aller Shorts oder eine bereits geprüfte Einzelclip-Auswahl. |
| Fünf kuratierte regionale Termine nach Kontinent, Land und Region | Aktuelle Auswahl auf Start- und Terminseite in beiden Clients integriert und unabhängig geprüft: explizite Kontinent-/Land-/Regionswahl, freiwilliges lokales Speichern, bis zu fünf passende kommende/laufende Termine. Der erste geprüfte Stand enthält fünf Originalverweise insgesamt in fünf Regionen, drei Kontinenten und vier Ländern; keine weltweite Abdeckung oder fünf Termine je Region. Quellenstand vom11./12.September, gültig bis19.September00UTC; danach werden diese Termine nicht weiter als aktuell angezeigt. Laufende Aktualisierung und breitere Abdeckung bleiben offen. |
| Neue geprüfte internationale Quellen | Kandidatenumfang dokumentiert; vollständige Quellenprüfung und produktive Aufnahme noch offen. Die Endpunktliste ersetzt keinen Quellenpass. |
| Hinweise auf Korrekturen/wesentliche Artikelaktualisierungen | Produktiver Revisions-/Hinweisweg noch offen. |
| „Seit deinem letzten Besuch“ und Erklärung der Auswahl | Noch offen; Quellenwahl wird ausschließlich aus ausdrücklichen Entscheidungen abgeleitet. |
| Freiwillige lokale Benachrichtigungen mit Ruhezeiten | Im früheren Chat als späteres eigenes Paket vorgesehen, noch nicht umgesetzt. Keine automatische Benachrichtigungsfreigabe oder laufende Zustellung. |
| Android und Release | Die neue unsignierte APK enthält jetzt auch die aktuelle Regionsauswahl, zusätzlich zu Quellenwahl, Übersetzungsoberfläche und sechs Artikeln/vier Bildern. Unabhängig bestätigt: 68 exakte Assets, 83 unveränderte native Quellbindungen und der tatsächliche neue Regionalcode. Der Offline-Build hatte 131 Tasks, davon 9 ausgeführt und 122 unverändert; 16 vorhandene JVM-Testnachweise und 0 Lintfehler/13 bekannte Warnungen. Diese APK wurde nicht signiert oder auf einem Gerät installiert. Gerätestest, Produktionssignatur, echtes Play-Upgrade, Hosting und finale Freigabe fehlen. |
| „Globale Lage“ | Auf deinen späteren ausdrücklichen Wunsch entfernt; wird nicht wieder eingebaut. |

Der V3-Inhaltsvertrag unterstützt bis zu64 Artikel innerhalb seiner geprüften
Bytegrenzen; die alten V1/V2-Verträge bleiben unverändert. Sechs Artikel aus
EFF und C4SS sind jetzt in beiden lokalen Clients aktiviert, nicht nur als
Testfixture vorbereitet. Die Übertragung schützt weiterhin Rücknahmen,
Versionsreihenfolge, Offline-Speicher und das Löschen lokaler Inhalte.

Die aktuelle App-Vorschau läuft unter [43192](http://127.0.0.1:43192/), die
Website unter [43193](http://127.0.0.1:43193/). Der neue App-Tab wurde in Codex
auf Deutsch bereitgestellt; nach dem Laden sind dort alle sechs Artikel, vier
Bilder und die neue Regionsauswahl per Browser bestätigt.43190/91 bleiben als
älterer geprüfter Stand erhalten. Das neue Webpaket ist375574b5; die zugehörige
unsignierte APK hat den SHA-256-Präfix654ca833 und enthält die aktuelle regionale
Auswahl. Ihr Inhalt ist unabhängig geprüft, die native Darstellung noch nicht
auf einem Gerät getestet.
Eine Sichtabnahme durch dich wird nicht behauptet.

Die Bildlücke hatte mehrere Ursachen: Der alte Produktionsvertrag enthielt nur
Textblöcke, während frühere Bildertests einen getrennten Testreader betrafen;
zusätzlich blieb das alte Vorschaufenster offen. In den kompakten Startkarten
fehlte außerdem die bereits mögliche Bilddarstellung; das ist ebenfalls korrigiert.
Die technische Bildintegration ist jetzt vorhanden. Weitere Bilder brauchen belastbare Herkunfts- und
Nutzungsbelege; es wurden keine fremden Bildrechte erfunden.

Aktuelle Prüfung:13 neue Browserfälle decken alle sechs Originaltexte/vier
Bilder, beide Themes,320/390RU200/1200 und den Website-Offline-Neustart ab.
Die105 bestehenden betroffenen Browserfälle bestehen nach dem Abgleich mit
dem neuen Inhalt (103 im Gesamtlauf, zwei nach Korrektur eines neuen Testorakels).
Folgen bedeutet laut vereinbartem Vertrag Vorrang, keinen exklusiven Filter;
Ausblenden entfernt die betreffende Quelle aus normalen Listen.134 Website-
Unitfälle bestehen.21 ausgewählte Prüfbilder sind mit Hashmanifest gesichert.
Die sechs Originaltexte/Bilder sind unabhängig geprüft, ein anschließend
gefundener Zeitstempelfehler im Websitepaket ist unabhängig geschlossen.
Für die kompakten Startbilder fand die zusätzliche Sichtprüfung einen echten
Fehler beim Wechsel auf schmale Fenster mit 200 Prozent Schrift. Der gezielte
Fix besteht den alten Fehlervergleich, 67 Unit- und 14 Browserfälle sowie den
neuen Android-Build. Die unabhängige Abschlussprüfung dieses letzten Pakets ist
bestanden: Bilddarstellung, große Schrift, Offline-Neustart sowie alle 68
Android-Assets bestätigt; keine neuen Befunde.

Die Medieninventur bestätigt: Der getestete Podcastplayer ist bisher nur im
getrennten Testpfad erreichbar. Die produktiven Verzeichnisse enthalten Links,
keine automatisch abspielberechtigten Episoden. Die fehlende Verbindung zu
einzeln zugelassenen Medien wird deshalb als offene Arbeit geführt.
Der neue Medienvertrag, die Wiedergabelogik und der begrenzte Metadatentransport
sind inzwischen unabhängig geprüft. Die Fortschrittsspeicherung besteht sieben
echte Browserfälle; die gemeinsame Mobile-Suite besteht772 Tests. Die Verbindung
dieser Bausteine mit dem produktiven Medienbereich und dem dauerhaften Speicher
für Medienaktualisierungen ist noch offen. Eine konkrete EFF-Folge
hat belegte Lizenzangaben; ihr Archive-Audioziel leitet jedoch auf einen anderen
Server um. Deshalb wurde sie noch nicht als direkt abspielbar freigegeben.

Nächste Reihenfolge: unabhängiger Abschluss der neuen Endpakete, laufende
Inhaltsversorgung, produktive Medien-/Regional- und Korrekturfunktionen sowie
vollständige Quellenpässe; anschließend Betriebs- und Releaseprüfung.
Die vorhandenen Alt-Backendlösungen werden dafür geprüft übernommen und
angebunden. Kein unnötiger Neubau funktionierender Dienste und keine unbemerkte
Veröffentlichung während dieser lokalen Arbeiten.
