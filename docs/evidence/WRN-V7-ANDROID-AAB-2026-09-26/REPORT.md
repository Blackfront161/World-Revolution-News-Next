# V7-Android-Bundle · lokaler RC-Kandidat · 26.09.2026

Aus dem Produktcommit `a2d9c5af495635dc2da4f2d25d065dfb6546502e`
wurde ein frischer, providerfreier Mobile-Build erstellt. Die
[Receipt](receipt.json) bindet 96 Webdateien und fünf native Brückenassets an
genau diesen Commit. Gradle `:app:bundleRelease` lief mit `--offline`,
`--no-daemon` und der Receipt-prüfenden Initialisierung erfolgreich;
`lintVitalRelease` bestand im selben Lauf.

Das neue Bundle hat Version 2.2.0, Code 27 und Target SDK 36. Die
[AAB-Verifikation](aab-verification.json) bestätigte **101/101 Assets**
bytegleich: 8.755.983 Byte, SHA-256
`08137e18b3f5438c9ca7d0a1aae676acb30347f9156c4975044f1716a9a1cb80`.
`jarsigner -verify` meldete ausdrücklich „JAR-Datei ist nicht signiert“.
Eine hashgleiche Kopie liegt nur lokal und ignoriert unter
`work/wrn-android-release-u8WdMb/wrn-a2d9c5a-unsigned.aab`.
Das [Hashmanifest](manifest.json) bindet die versionierten Belege und den
AAB-Hash; das Bundle selbst wird nicht ins öffentliche Repository gelegt.

Der vollständige `pnpm check` desselben Produktcommits bestand vor dem
Bundle-Bau. Nicht geprüft sind die test-signierte Installation oder das
datenerhaltende Upgrade **dieses** Bundles, eine unabhängige
Rechte-/Inhaltsabnahme des neuen Sportfotos, die vollständige finale
Browser-/Android-Matrix, Live-Hosting und Play-internes Pre-Launch.
Produktionssignatur, Upload, Push und Deployment erfolgten nicht.
