# Unsigiertes Android-Bundle zum SRC-04-Kandidaten

Stand: 25. September 2026. Source-Commit:
`30c5aaea533f3dcecdbf3c33d846050fb190a7f3`.

`prepare-android-release.mjs` erzeugte einen frischen, von geerbten
Provider-/Vite-Variablen bereinigten Vite-Build und band 94 native Assets an
`receipt.json`. Der receiptgebundene Gradle-Aufruf `:app:bundleRelease`
bestand. Die unsignierte AAB-Datei umfasst 8.161.000 Byte und hat SHA-256
`e725d279db7b889619179a5f861ae0723d28423cc53661666e56e01991aca673`.
Eine Kopie liegt lokal unter
`work/wrn-android-release-92jGSg/wrn-2.2.0-27-unsigned.aab`.

Alle 94/94 Einträge unter `base/assets/` des tatsächlichen AAB wurden gegen
Pfad, Größe und SHA-256 des Receipts geprüft. Darin sind der volle
Quellenpass (`bcef5d2fa88ae4acfb0dce294d3d8245598308c99e992de735babcc8717556aa`)
und der gebündelte Widerrufsstand
(`030aa883148b5378ac0821a7ddc0f48935178fe13058508439155423f83bb617`)
enthalten. `receipt.json` und `native-assets.json` sind als Belege versioniert;
ihre SHA-256 sind
`a09d94da1dad4b934321a76f9065deeef28f10ebb19fbca3f65d788bbfa9a6ef`
und `aabd69d4972147c3a050310e986b3f6188acc23583bf7ee0416ff1c4e7629241`.

Die App-Version bleibt 2.2.0/27 bei Target SDK 36. Das separate API36-
Emulatorpaket wurde ausschließlich testweise signiert und frisch installiert;
der vollständige Quellenpass war beim netzlosen Erststart sichtbar. Das AAB
ist **nicht** produktionssigniert, nicht in Play hochgeladen und nicht dort
geprüft. Vor einem Austausch der Play-Version fehlen außerdem Live-Hosting,
Play-interner Upgrade-/Pre-Launch-Test und die finale RC-Matrix.

END-CHECK: :)
