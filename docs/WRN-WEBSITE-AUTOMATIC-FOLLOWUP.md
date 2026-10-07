# Automatische Inhaltsnachführung

Stand 8. Oktober 2026. Die gemeinsame Nachrichtenübergabe ist implementiert und unabhängig geprüft. Directory, Admissionreport, Coverage, App-Startauswahl, Themen und Originalbildreferenzen bilden ein einziges hashgebundenes Release. Der Browser aktiviert nur eine vollständig validierte Übergabe und bewahrt bei Fehlern den vorherigen Stand. Neue Rücknahmen werden vor der Aktivierung gespeichert und bleiben auch bei Quota-Fehlern und Browser-Neustart wirksam.

Der bestehende Workflow `.github/workflows/wrn-directory-publication.yml` nutzt unverändert einen einzelnen Publisher und den Sechs-Stunden-Takt. Er beobachtet einen exakten Data-Commit, prüft dessen öffentliche Bytes und erzeugt die Startauswahl mit dem eingefrorenen App-Selector. FTPS lädt zuerst den Snapshot hoch, prüft die öffentlichen Bytes und aktiviert danach den Pointer. Eine fehlgeschlagene Aktivierung stellt die vorherigen Pointerbytes wieder her. Ohne bestehende Konfiguration ist Veröffentlichung ausdrücklich deaktiviert. Die tatsächliche GitHub-Aktivierung ist weiterhin **nicht nachgewiesen**; lokale Tests oder eine manuelle Hostinger-Veröffentlichung ersetzen keinen erfolgreichen Scheduler-Lauf.

| Konfiguration | Zweck |
| --- | --- |
| Variable `WRN_DIRECTORY_PUBLISH_ENABLED=1` | Bestehender Veröffentlichungsschalter |
| Secrets `WRN_FTPS_HOST`, `WRN_FTPS_IP`, `WRN_FTPS_USER`, `WRN_FTPS_PASSWORD` | Bestehender begrenzter FTPS-Zugang |
| Secret `WRN_FTPS_DIRECTORY` | Bereits autorisiertes Website-Verzeichnis `/wrn-website-content/`; keine Zugriffsweiterung |

Der neue Endpunkt benötigt vor dem ersten Publisher-Lauf einen geprüften initialen Snapshot und Pointer aus der normalen Website-Veröffentlichung. Der Publisher verweigert eine Aktivierung ohne gültigen Vorgänger. Ein FTPS-Rename ist kein serverseitiges Compare-and-Swap; der bestehende einzelne CI-Writer bleibt Voraussetzung.

Der aktuelle App-Selector ist an Commit `7dd4e9e428cae4ae5c25caa98402df901f861981`, die Übergabe `59bbc8f5d4a0d1962297239df514e59beea0976c` und deren überprüfte Bytes gebunden. Neue App-Releases benötigen eine neue geprüfte Übergabe. App-WIP-HEAD wird nicht automatisch importiert.

Die Bibliothek mit 745 Büchern, fünf Lernpfaden und 177 Lexikonbegriffen sowie alle 17 App-Videooriginale sind aus dieser Übergabe ergänzt. Der Website-Katalog enthält insgesamt 22 Videos, 28 Radiosender und 1839 Podcasts einschließlich zuvor vorhandener Data-Inhalte. Diese übrigen Inhaltsbereiche bleiben eingefrorene, reproduzierbare Übergaben; sie sind nicht Bestandteil der automatischen Nachrichtenversorgung. Historische Daten bleiben erhalten. Unbekannte Rechte und Sprachen bleiben unbekannt; externe Bilder werden weder gehostet noch in die Offline-Shell aufgenommen.

Der separate Atlas-Offlinestand unter Commit 33c36d2 ist jetzt veröffentlicht. Ein echter öffentlicher Download mit 215 Ressourcen und 104.461.436 Bytes wurde nach Browser-Neustart ohne Netzwerk geprüft. Neue Musik Horizonte bleibt separat vorbereitet und wird erst mit einer freigegebenen App-Übergabe übernommen.

Aktuelle Belege: `docs/evidence/WRN-WEBSITE-CONTENT-TUPLE-2026-10-08/` und `docs/evidence/WRN-ATLAS-HOST-OFFLINE-LIVE-2026-10-08/`.
