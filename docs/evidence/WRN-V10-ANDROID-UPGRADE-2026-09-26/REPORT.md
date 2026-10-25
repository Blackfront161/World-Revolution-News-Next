# Android-Testkandidat 26.09.2026

Der frühere V8-Testkandidat ist für den Upgrade-Test ersetzt: Er zeigte die
vorhandene 2.1.1-Merkliste nicht. Commit `88d15283` übernahm die alte Merkliste
und Offline-Artikel in ein getrenntes, nur lesbares Archiv sowie die alte
Sprachwahl. Der direkte V9-Test fand danach einen Theme-Fehler. Commit
`4cfaafdb3f149be15469d20f33cd9117e0a4cae3` liest zusätzlich das in der
tatsächlich ausgelieferten 2.1.1-App verwendete JSON
`wrn_next_ui_settings_v1`; die sieben bekannten alten Theme-Werte werden nur
importiert, wenn noch keine neue Theme-Präferenz existiert. Unbekannte Werte
werden nicht erfunden oder gelöscht. Unabhängiger Migrationsreview: PASS.

Das neue unsignierte AAB `work/wrn-android-release-755Vcf/wrn-4cfaafd-unsigned.aab`
ist Version 2.2.0/Code 27/Target 36. Es wurde offline aus dem receiptgebundenen
Snapshot gebaut. Gradle-Build PASS; 108/108 verpackte Assets stimmen mit dem
Manifest überein. SHA-256:
`5e367d98b417c755f00df65aa21e828e974468a9c11f66aec5f1cbc1867460bf`.
`pnpm check` ist auf diesem Source-Commit PASS.

Für **Interne App-Freigabe** liegt die lokal mit einem separaten Testschlüssel
signierte Kopie
`work/wrn-android-release-755Vcf/WorldRevolutionNews-2.2.0-code27-internal-sharing.aab`
bereit. JAR-Signaturprüfung und erneuter 108/108-Assetvergleich: PASS. SHA-256:
`7b07902de2b6a6bcce099020eee6bdf690f9bb18b893f9878780f956eb899d86`.
Dieser Testschlüssel ist **kein** Play-Upload-Schlüssel. Kein Play-Upload wurde
vorgenommen.

Die vom PO bereitgestellte lokale JKS-Datei signierte danach dasselbe geprüfte
Original-AAB. Die stabile Kopie für einen **manuellen** Play-Upload heißt
`work/wrn-android-release-755Vcf/WorldRevolutionNews-2.2.0-code27-play-upload.aab`,
9.731.795 Byte, SHA-256
`525ed95a7751d970a59471fce19755b5fed36e3d287c11fe0d52be184db3e610`.
Der Zertifikatsfingerabdruck
`7E4E000A93698A50DBF331A8C6931A0A276830BF34D24E3B50F9734DF82D79A8`
stimmt mit dem signierten 2.1.1-Basispaket überein. Unabhängige Prüfung der
JAR-Signatur und aller 108 Assets: PASS. Das Passwort wurde weder ins
Repository noch in den Beleg geschrieben. Ob Play dieses Zertifikat als
registrierten Upload-Schlüssel akzeptiert, ist bis zum Upload unbestätigt.

Der isolierte Android-AVD wurde vollständig geleert. Die alte Version 2.1.1/
Code 26 zeigte die bewusst gewählte Einstellung „Pink“
([Bild](old-2.1.1-pink.png)). Installation der aus dem exakten neuen AAB
erzeugten Test-APK mit `adb install -r` war erfolgreich; die Android-
`firstInstallTime` blieb 08:16:34, Code wechselte auf 27. Der erste Start zeigte
weiter „Pink“ ([Bild](updated-2.2.0-pink.png)). Die vorherige V9-Probe hatte
Deutsch und einen alten Offline-Merklistenartikel im Archiv sichtbar gemacht;
das wurde mit diesem neuen AAB noch nicht erneut als ganzer Fall geprüft.

Release bleibt **nicht GREEN**: Der vorher gestartete vollständige Browserlauf
hat 2001 PASS, 1598 planmäßige SKIP und 83 FAIL gemeldet, vor allem
Personalisierungsfälle mit geänderter Artikelanzahl. Diesen Befund behebt die
Android-Theme-Korrektur nicht. Der exakte vollständige Browser-/Geräte-/Website-
Abschluss, Host-Provenienz, Play-Pre-Launch und die Bestätigung des
registrierten Play-Upload-Zertifikats sind offen. Der signierte Testkandidat darf nicht als reguläres App-Update oder
Produktionsrelease ausgegeben werden.

[SHA-256-Manifest](SHA256SUMS.txt) bindet die zwei repräsentativen Bilder, das
unsignierte Original, das Test-AAB und die JKS-signierte AAB-Datei. Der
temporäre Emulator-Privatschlüssel samt Passwortdatei wurde nach Abschluss
entfernt; Emulator-APKs und Logs bleiben ignorierte lokale Arbeitsdateien.
