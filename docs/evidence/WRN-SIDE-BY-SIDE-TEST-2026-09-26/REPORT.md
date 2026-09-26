# Separater Android-Testkandidat, 26.09.2026

Produktbasis: `a4cbbff92b08219e28f4f84894fea3bcb1fa91b6`. Die Testvariante wurde offline mit einem nur lokal angewandten Gradle-Override gebaut. Sie hat die eigene Paketkennung `com.world.revolution.rc` und den Anzeigenamen **WRN Test**. Die Haupt-App `com.world.revolution` wurde weder ersetzt noch hochgeladen.

Artefakte im ignorierten Arbeitsverzeichnis `work/wrn-android-release-jIHM2Q/side-by-side/`:

| Artefakt | SHA-256 |
| --- | --- |
| `WRN-Test-2.2.0-code27-com.world.revolution.rc-verified.aab` | `00a19ae5aad7d33180a656d5a034808273a33e35df3965b98fb64e128b2720be` |
| `wrn-test-universal.apk` | `160d328be9dca1aa335034cc89bf128f6d349a64acc84d401551ce6265a19395` |

Das AAB hat Version 2.2.0/Code 27/Target 36 und eine gültige lokale JAR-Signatur mit selbstsigniertem Android-Debugzertifikat. Der Offline-Gradle-Build einschließlich `lintVitalRelease` bestand. Alle 108 gebündelten Assets wurden einzeln per SHA-256 mit dem zuvor geprüften aktuellen Kandidaten verglichen: 108 gleich, 0 abweichend, 0 zusätzlich. Das daraus abgeleitete APK meldet `com.world.revolution.rc` und `WRN Test`.

Auf dem lokalen Emulator `emulator-5580` wurde die Test-App **neben** der Haupt-App installiert und gestartet. Die Haupt-App blieb bei Version 2.2.0/Code 27 mit unveränderter `firstInstallTime` `2026-09-26 08:16:34`; die Test-App bekam eine eigene Installation. Der repräsentative Screenshot zeigt den gerenderten Feed. Die fokussierte Browser-Personalisierung bestand danach mit einem Worker 11/11; ein paralleler Lauf mit Emulatorlast hatte 8/11 bestanden, dessen drei Auffälligkeiten waren seriell nicht reproduzierbar.

Ein separater direkter Emulator-Upgradeversuch 2.1.1/Code 26 → 2.2.0/Code 27 war technisch erfolgreich und behielt die `firstInstallTime`. Die Übernahme der zuvor angezeigten Sprache DE blieb aber unklar: nach dem Update wurde EN angezeigt, während der isolierte Emulator bei einer kontrollierten Wiederholung vor der abschließenden Persistenzkontrolle unerwartet stoppte. Das ist **kein** bestandener End-to-End-Datenmigrationstest. Vor einem echten Update der Live-App müssen Sprache, Merkliste, Offline-Texte und Theme auf einem stabilen Gerät mit dem Play-signierten Pfad erneut geprüft werden.

Die Testvariante behält den bisherigen externen Deep-Link-Scheme `com.world.revolution`; Deep-Link-Zuordnung zwischen beiden nebeneinander installierten Apps ist daher nicht Gegenstand dieses Tests. Kein Play-Upload, Push oder Live-Deployment fand statt. Die separate Test-App ersetzt keine Live-Installation.

## Nachtrag: kontrollierter Sprach-Upgrade-Test

Auf der eigens neu angelegten AVD `WRN_RC_UPGRADE_FRESH` wurde zuerst die alte App 2.1.1/Code 26 installiert. Die Sprache **FR** wurde ausdrücklich in der alten App gewählt und blieb nach einem Prozessneustart erhalten ([vorher](wrn-211-fr-before-upgrade.png)). Danach wurde ausschließlich in diesem Emulator das aus `a4cbbff` abgeleitete, lokal testsignierte APK mit derselben Paketkennung per `adb install -r` auf 2.2.0/Code 27 aktualisiert. Installation und Start waren erfolgreich; `firstInstallTime` blieb `2026-09-26 10:20:23`, `lastUpdateTime` wurde `2026-09-26 10:26:17`. Header und Oberfläche zeigten weiterhin **FR** ([nachher](wrn-220-fr-after-upgrade.png)). Damit ist die zuvor unklare Sprachübernahme für diesen kontrollierten lokalen Pfad bestanden. Die frühere DE-Beobachtung stammte aus einem wiederverwendeten instabilen Emulator und wird nicht als reproduzierter Fehler gewertet.

Dieser Test deckt weder die gesamte Merkliste/Offline-Datenmigration noch den Play-signierten Upgradepfad auf einem echten Gerät ab. Die an den PO weitergegebene separate Test-App hat weiterhin die eigene Paketkennung `com.world.revolution.rc` und ersetzt die Live-App nicht.
