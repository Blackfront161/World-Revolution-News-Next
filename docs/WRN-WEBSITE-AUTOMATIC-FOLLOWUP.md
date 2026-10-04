# Automatische Inhaltsnachführung: konkreter Stand

Stand 5. Oktober 2026. Eine vollständige automatische App/Data→Website-Nachführung ist noch nicht aktiviert oder fertig implementiert. Der aktuelle Website-Stand ist weiterhin an die geprüfte App-/Data-Übergabe gebunden.

Der vorhandene GitHub-Workflow `.github/workflows/wrn-directory-publication.yml` bereitet alle sechs Stunden ein Metadata-only-Verzeichnis aus einem exakten Commit von `Blackfront161/Revolution-News-Data` vor. Sein bestehender FTPS-Transport lädt den geprüften Snapshot vor dem Pointer hoch, prüft die öffentlichen Bytes und aktiviert atomar; bei fehlender Bestätigung stellt er die vorherigen Pointerbytes wieder her. Scheduler, Uploadziele, Transport und Rückrollvertrag wurden nicht erweitert.

Die neue kleine Diagnosekorrektur prüft die bestehende Konfiguration vor der Datenvorbereitung. Ein deaktivierter Lauf meldet ausdrücklich `publication-disabled`; ein ausdrücklich angeforderter Upload ohne Schalter sowie ein aktivierter Lauf mit fehlenden Secrets scheitern früh mit ausschließlich Konfigurationsnamen. Kein Secretwert wird ausgegeben. Zwei neue Tests und acht bestehende Veröffentlichungs-/Rollbacktests PASS. Unabhängiger Review PASS, einschließlich acht echten CLI-Konfigurationsfällen. Diese Änderung ist lokal geprüft; kein Push oder Aktivierungsnachweis.

Erforderliche GitHub-Konfigurationsnamen:

| Typ | Name | Zweck |
| --- | --- | --- |
| Repository-Variable | `WRN_DIRECTORY_PUBLISH_ENABLED` | Bestehender Schalter, Wert `1` für Veröffentlichung |
| Secret | `WRN_FTPS_HOST` | Bestehender zugelassener FTPS-Host |
| Secret | `WRN_FTPS_IP` | Bestehende gebundene Host-IP |
| Secret | `WRN_FTPS_USER` | Bestehender Benutzer |
| Secret | `WRN_FTPS_PASSWORD` | Bestehendes Passwort |
| Secret | `WRN_FTPS_DIRECTORY` | Bestehender begrenzter Verzeichnispfad |

Die tatsächliche Existenz/Werte dieser Repository-Einstellungen sind hier unbekannt: die lokale GitHub-CLI liefert401. Es wäre falsch, daraus das Fehlen einzelner Secrets abzuleiten. Es wurden keine Credentialwerte gelesen, erzeugt oder an einen anderen Empfänger übertragen. Root prüft den vorhandenen GitHub-Zugang. Neue Credentials oder eine Zugriffsweiterung sind kein Bestandteil dieser Änderung.

Noch erforderliche Produktarbeit für vollständige Inhaltsparität:

1. Die Home-Auswahl aus dem ausdrücklich gebundenen App-Release und dem exakt selben neuen Data-Commit erzeugen. Der ältere CLI-Helper `prepare-app-home-layout.mjs` ist an einen alten App-Stand gebunden und darf nicht unverändert als aktueller kanonischer Generator verwendet werden. Neue App-Releases benötigen eine neue nachvollziehbare Übergabe; beliebiger App-WIP-HEAD ist keine Freigabequelle.
2. Directory, Website-Admissionreport, Home-Rollen/Topics und Originalbildregister als ein gemeinsames geprüftes Tuple binden. Der vorhandene Bildgenerator überprüft bereits Titel, Quelle, ID und Original-URL; diese Bindung weiterverwenden. SourceAdmission, Quellenaliase, Podcast-Overrides, Withdrawals und alle bisherigen Rechtebeschränkungen erhalten. Unbekannte Rechte bleiben unbekannt; keine Bildbytes hosten/offline aufnehmen.
3. Den Browserloader auf die vollständig validierte gemeinsame Übergabe erweitern. Er verwirft aktuell zu Recht ein neues Remote-Verzeichnis, dessen Hash nicht zum eingefrorenen Website-Report passt. Diese Prüfung nicht einfach löschen. Home und Bildregister sind derzeit statisch importiert; ein neuer Directory-Pointer allein aktualisiert sie nicht.
4. Erst nach Integritäts-, Schema-, Commit-, Aktualitäts- und Admissionprüfung alle Teile gemeinsam aktivieren. Fehler, Abbruch, unvollständige Dateien, veraltete Sequenz oder Policyausfall erhalten die letzte geprüfte zulässige Darstellung; aktuelle Rücknahmen müssen weiter greifen. Sichtbare Frische muss an diese tatsächlich bestätigte Übergabe gebunden sein.
5. Die vollständige Browser-/CI-Übergabe unabhängig prüfen und im bestehenden Shellbudget unter8.388.608Bytes halten. Der aktuelle Root-Shellstand hat nur ungefähr29KiB Spielraum. Keine Aufnahme von Atlas- oder fremden Bildbytes in das Root-Shellpaket. Erst nach tatsächlicher Konfiguration, Upload und öffentlicher Abnahme als laufend melden.

Das vollständige Atlas-Offlinepaket ist separat geprüft und unter Commit33c36d2 erhalten. Drei kleine Upload-ZIPs samt Rückrollpaket sind konkret vorbereitet; die derzeit erreichbare Hostinger-Seite verlangt erneut die Anmeldung. Neue Musik Horizonte ist ebenfalls separat geprüft, aber noch kein kanonischer Atlas-Snapshot und keine Liveänderung.
