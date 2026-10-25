# Aktuelles lokales Android-Bundle · 26.09.2026

Aus dem getrennten Produkt-Checkout `cdd7c946f9b00314760a90acad5fab6789a77750`
wurde nach der Header-/Großtext-Korrektur ein frisches, **unsigniertes** AAB
2.2.0/Version Code 27/Target 36 rein lokal gebaut. Die Vorbereitung verwendete
eine auf den Commit gebundene [Quittung](receipt.json), leere externe
Provider-Endpunkte und 94 Webassets. Gradle `:app:bundleRelease` lief mit
`--offline`; `lintVitalRelease` war erfolgreich.

Die [AAB-Prüfung](aab-verification.json) ergab **94/94** receiptgebundene
Webassets bytegleich. Das Bundle ist 8.164.333 Byte groß; SHA-256:
`819bcd20266255fc12e520d9d3c42f35fea3efe338854843137c81bea1d81bb8`.
`jarsigner -verify` meldete ausdrücklich „JAR-Datei ist nicht signiert“.
Eine hashgleiche lokale Kopie liegt ignoriert unter
`work/wrn-android-release-ScyBwf/wrn-cdd7c94-unsigned.aab` im getrennten
Checkout. Das [Hashmanifest](manifest.json) bindet die versionierten Belege;
das AAB selbst bleibt ein lokales Build-Artefakt.

Der vollständige `pnpm check` mit Node 24.19.0/pnpm 11.19.0 bestand für diesen
Commit: Format, Lint, Release-/Importgrenzen, Typen, Provenienz, Mobile
952/952, Website und Node-Betrieb 81/81. Die in
[Header-Beleg](../WRN-HEADER-REFLOW-2026-09-26/REPORT.md) beschriebenen
Browserproben und Sichtbilder gelten für dieselben Produktbytes.

**Release-Grenze:** Dieses exakte neue AAB wurde noch nicht test-signiert oder
auf einem Emulator/Gerät installiert. Der ältere API36-Upgradebeleg betrifft
`c8c0450`, nicht diesen Stand. Produktions-/Play-Signatur, echtes Play-Upgrade,
vollständige Browser-/Gerätematrix, authentisierte Website-Aktivierung und
PO-Sichtabnahme stehen aus. Es gab keinen Push, Upload und kein Live-Deployment.
