# V8-AAB für die interne App-Freigabe · 26.09.2026

Auf ausdrücklichen Wunsch wurde das unveränderte V8-Produktbundle aus
`d03f966874cf08fc38be9dba43ed5ce9efd13e9a` für **Google Play Console →
Interne App-Freigabe** mit einem einmaligen lokalen Testschlüssel signiert.
Diese Play-Funktion akzeptiert laut
[Google-Hilfe](https://support.google.com/googleplay/android-developer/answer/9844679?hl=de)
einen beliebigen Signaturschlüssel und signiert ausgelieferte APKs mit ihrem
eigenen Testzertifikat neu. Dieses AAB ist deshalb kein Beleg für ein
datenerhaltendes Update der bestehenden Play-Installation und nicht als Upload
für den regulären internen Testtrack mit dem registrierten Upload-Schlüssel
ausgegeben.

Lokale, ignorierte Datei:
`work/wrn-android-release-mN283W/WorldRevolutionNews-2.2.0-code27-internal-sharing.aab`.
Sie ist 9.707.867 Byte groß und hat SHA-256
`5b72585e54e7d70a5356a4c06d2d676c2c175aff0a791268925c11fc457978ea`.
Das ursprüngliche, [bytegeprüfte V8-Bundle](../WRN-V8-ANDROID-AAB-2026-09-26/REPORT.md)
hat SHA-256 `30088120b24a1053cf1a68ba5300b0d4105147622a8272890b23e981573032cd`
und deklariert Paket `com.world.revolution`, Version 2.2.0, Code 27.

`jarsigner -verify` beendete sich mit Code 0 und „JAR-Datei verifiziert“.
`-strict` meldete erwartungsgemäß die nicht öffentlich vertrauenswürdige,
selbstsignierte Testzertifikatskette; sie wird nicht als Produktionssignatur
ausgegeben. SHA-256-Fingerprint des Testzertifikats:
`46:68:47:F4:C1:9D:DB:C2:04:9F:38:6D:65:CA:FF:63:20:B9:C9:60:F1:68:7A:8A:84:D9:B0:F4:FA:56:99:5E`.
Alle 557 ursprünglichen ZIP-Einträge blieben inhaltlich bytegleich; hinzu kamen
nur `META-INF/MANIFEST.MF`, `META-INF/WRN-INTE.SF` und
`META-INF/WRN-INTE.RSA`. Der zufällig erzeugte private Testschlüssel wurde nach
der Prüfung entfernt; weder Kennwort noch Schlüssel stehen in diesem Beleg
oder im Repository.

Die acht an V8 angepassten E2E-/Harnesspfade sind in `24689e0` gebunden.
Betroffene Inhalts-/Personalisierungsfälle bestanden in einem Lauf 91/91,
Home-Fälle 5/5 und der wiederholte IndexedDB-Schutzfall 10/10. Die vollständige
Browser-Matrix, das exakte datenerhaltende Play-Upgrade, Host-Provenienz und
Produktionsfreigabe bleiben offen. Kein Play-Upload oder Live-Deployment erfolgte.
