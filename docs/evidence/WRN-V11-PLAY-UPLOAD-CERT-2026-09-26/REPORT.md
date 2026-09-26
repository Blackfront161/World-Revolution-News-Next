# Play-Uploadzertifikat · schreibgeschützter Abgleich · 26.09.2026

Am 26.09.2026 gegen 11:21 UTC zeigte die angemeldete Google Play Console für
**World Revolution News** (`com.world.revolution`) unter
**Mit Google Play geschützt → Play App-Signatur verwalten** als SHA-256 des
registrierten **Uploadzertifikats**:

`7E:4E:00:0A:93:69:8A:50:DB:F3:31:A8:C6:93:1A:0A:27:68:30:BF:34:D2:4E:3B:50:F9:73:4D:F8:2D:79:A8`

Der lokale, bereits signierte Kandidat
`work/wrn-android-release-jIHM2Q/WorldRevolutionNews-2.2.0-code27-upload-signed-20260926-171848.aab`
aus Produktcommit `a4cbbff92b08219e28f4f84894fea3bcb1fa91b6` lieferte mit
`keytool -printcert -jarfile` **denselben** SHA-256-Fingerabdruck. Sein
Datei-SHA-256 ist
`d0fdbf0e8fcd0cdcd7f2b29035a4c278da17e26f286c1a1e980454106e2dfaa2`;
Signatur- und 108/108-Assetprüfung stehen im
[AAB-Beleg](../WRN-V11-SIGNED-AAB-2026-09-26/REPORT.md).

Die Play Console verwendet für die ausgelieferte App einen **anderen**
App-Signaturschlüssel (Digital-Asset-Links-Fingerabdruck beginnt mit
`B1:37:8B:09`). Das ist von der Uploadschlüsselprüfung zu trennen. Die
**Interne App-Freigabe** verwendet nochmals ein eigenes Testzertifikat. Diese
Beobachtung beweist die registrierte Uploadschlüsselzuordnung, aber weder die
Annahme des neuen AAB durch Play noch einen Play-signierten Geräte-Upgrade.
Es wurde kein Bundle hochgeladen, kein Track verändert und die Live-App nicht
ersetzt. Der getrennte `com.world.revolution.rc`-Test bleibt die erste
PO-Testoption.

Nachtrag 27.09. (lokale Zeit): Auf einem vom PO gezeigten Play-Console-Bildschirm
für einen **geschlossenen Testrelease** wurde die separate Datei
`WRN-Test-2.2.0-code27-com.world.revolution.rc.aab` abgewiesen. Play verlangte
für die bestehende App SHA-1
`3C:CA:D7:1D:8B:95:AA:D8:81:B6:C2:07:E7:31:DC:C2:7F:CB:99:F2`,
die hochgeladene Testdatei trug
`CD:B5:4D:67:2E:4D:73:B4:FA:B2:32:46:90:87:6F:F1:81:4A:9A:3E`.
`keytool -printcert -jarfile` bestätigte den zweiten Wert für die lokale
Testdatei und ihre später verifizierte Variante. Der Fehler ist erwartbar:
Die `.rc`-App hat eine andere Paketkennung und einen nur für den Paralleltest
verwendeten Schlüssel. Sie ist kein Update für den bestehenden Play-Track.
Der Screenshot zeigt keine angenommene Bundle-Datei oder freigegebenen Release.
Für den parallelen Ersttest bleibt die direkte separate APK der eindeutigste
Weg; eine spätere Trackprobe mit der Haupt-App braucht deren JKS-signiertes
`com.world.revolution`-AAB und ersetzt die App auf teilnehmenden Testgeräten.
