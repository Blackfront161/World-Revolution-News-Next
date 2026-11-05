# WRN-V11: Hostinger-Livewechsel und Verzeichnisaktualisierung · 27.09.2026 UTC

Der PO hat die Live-Schaltung der neuen Website und die Übergabe eines
Play-fähigen AAB ausdrücklich beauftragt. Vor dem Transfer zeigte Hostinger
für `solinaridao.com` ein abgeschlossenes manuelles Website-Backup vom
27.09. 05:47 in der dort angezeigten Zeitzone. Die alte Webwurzel und die
früheren Zeiger wurden vor der Änderung in
[Hostinger-Staging](../WRN-V11-HOSTINGER-STAGING-2026-09-26/REPORT.md)
festgehalten. Eine Wiederherstellung wurde nicht ausgelöst.

Aus dem lokalen, 47/47 rückverifizierten Hostingpaket zum Produktcommit
`a4cbbff92b08219e28f4f84894fea3bcb1fa91b6` wurden im Hostinger-
Dateimanager zuerst die Dateien und anschließend der Produktions- und
Verzeichniszeiger in `public_html` entpackt. Danach wurde ein neuer
Verzeichnissnapshot aus dem exakten Alt-Datenrepo-Commit
`e275db280b172dd1160087d04f3d088d0dfef924` vorbereitet. Die
Aufnahmeprüfung verwarf elf Metadatenkandidaten, darunter zukünftige
Publikationsdaten. Der neue Snapshot enthält **959 Nachrichten-Metadatenlinks,
532 Quellen und drei redaktionell gebundene Sport-Lesehinweise**; er kopiert
keine fremden Artikeltexte oder Bilder. Der Snapshot wurde vor dem neuen
`current.json` veröffentlicht.

Öffentliche GET-Prüfung mit Cache-Bypass am 27.09. gegen 00:00 UTC:

| Ressource | Status | SHA-256 |
| --- | --- | --- |
| `/index.html` | 200 | `901f32ace1eb9a0960495ffbb5e892a8e1d35a084c4e40e276903c41c3e16019` |
| `/wrn-production-content/current.json` | 200 | `16c1644e9f4205e334279f206d1d63202603d22adbd47edeb17175e7a65cf8be` |
| `/wrn-content-directory/current.json` (Sequence `202609262354`) | 200 | `5413b74c72723e877550b474072f750eca5d22a5f83032a378e01ecb00da8b57` |
| `/wrn-content-directory/snapshots/directory-202609262354-8f3dd3da4e9405f68a88c56111b2b27a18ceaa9848a52eddabd7fb6659e59e00.json` | 200 | `8f3dd3da4e9405f68a88c56111b2b27a18ceaa9848a52eddabd7fb6659e59e00` |
| `/wrn-source-passes/current.json` | 200 | `bcef5d2fa88ae4acfb0dce294d3d8245598308c99e992de735babcc8717556aa` |
| `/wrn-source-pass-revocations/current.json` | 200 | `030aa883148b5378ac0821a7ddc0f48935178fe13058508439155423f83bb617` |

Die Zeiger antworteten als JSON mit `Cache-Control: no-store`; der
Snapshot als unveränderliche JSON-Ressource. Von 41 öffentlich geprüften
Nicht-Zeigerdateien waren **39 bytegleich** zum Manifest. Zwei PNG-Antworten
lieferten über Hostingers CDN abweichende Bytes, obwohl der Dateimanager
für beide Originalgrößen anzeigte. Sichtprobe: Bilder, Startseite,
Unterstützungsdialog und Artikel-Leseansicht wurden gerendert. Der
HTTP-Bytebeleg für diese zwei Bildantworten bleibt offen; deshalb wird
kein pauschaler 47/47-Live-Hash behauptet.

Nach einem frischen Neuladen zeigte die Live-Website unter
`https://solinaridao.com/#discover/news` den **Stand 2026-09-26,
30 von 959** sowie aktuelle Einträge von ANRed und Evrensel. Die fünf
Übertragungs-ZIP-Dateien wurden in den nicht öffentlichen Kontobereich
verschoben; zwei zuletzt geprüfte ZIP-URLs antworteten anschließend 404.

**Betriebsgrenze:** Der vorhandene GitHub-Workflow für den neuen
Inhaltsbetrieb ist `dry-run` und hat nur Leserechte. Diese manuelle
Verzeichnisaktualisierung beweist keine geplante Veröffentlichung alle
paar Stunden. Im neuen Volltext-Feed bleiben zwölf einzeln aufgenommene
Artikel; die 959 Verzeichniseinträge verlinken zu den Originalen. Echte
laufende Metadaten- und Volltextversorgung, Provider-Decodierung sowie
die komplette Release-Matrix sind weiterhin offen. Der aktuelle
sechsprojektige Browserlauf hatte 1574 PASS, 25 FAIL und 1557 SKIP;
die Ursachen und ein gezielter Nachlauf werden getrennt geprüft.

Nachlauf: Die 134 gezielt wiederholten Browserfälle hatten 132 PASS und
zwei Fehler in `source-preferences.spec.ts`. Einer wartete nur fünf
Sekunden auf ein lokal ladendes Verzeichnis; der andere erwartete einen
konkreten Link aus einem alten Live-Snapshot. Diese Quelleinstellungen-
Szenarien verwenden nun ausdrücklich den gebündelten Verzeichnisstand
bei simulierter Nichtverfügbarkeit des Live-Zeigers; die gesonderten
Aktualisierungstests bleiben für den echten Remote-Vertrag zuständig.
Der vollständige Nachlauf dieser Datei im Website-390-Projekt bestand
mit **14/14 PASS**. Der frühere vollständige Sechsprojektlauf wurde
dadurch nicht nachträglich zu einem PASS umgedeutet.

Das lokal signierte AAB für **die bestehende** Play-App ist
`work/wrn-android-release-jIHM2Q/WorldRevolutionNews-2.2.0-code27-upload-signed-20260926-171848.aab`
(SHA-256 `d0fdbf0e8fcd0cdcd7f2b29035a4c278da17e26f286c1a1e980454106e2dfaa2`).
Paketkennung, Versionscode, Signatur und 108/108 Bundle-Assets wurden
geprüft; das Uploadzertifikat entspricht dem in der Play Console
angezeigten Zertifikat. `keytool -printcert -jarfile` bestätigte zusätzlich
den von Play beim fehlgeschlagenen `.rc`-Upload verlangten SHA-1
`3C:CA:D7:1D:8B:95:AA:D8:81:B6:C2:07:E7:31:DC:C2:7F:CB:99:F2`.
Es wurde **nicht hochgeladen**. Ein echter
Play-signierter Upgrade auf einem Gerät ist weiterhin unbewiesen.
