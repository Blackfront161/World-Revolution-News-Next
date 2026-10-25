# WRN – aktueller RC-Emulatornachweis vom 25. September 2026

Dieser Nachweis bindet den aktuellen Quellkandidaten
`4dc1ad8e0ee6757fa4903365d5d59d2d7466e1e4` einschließlich der drei
kanonischen Quellenpässe. Das daraus frisch erzeugte, unsignierte AAB hat
SHA-256
`30560592ce6e6fee4aca1f02b9eccfac1cc027a9e6ba66eeefa9d5d193a7c77e`,
enthält 92 verifizierte Web-Assets und ist 8.147.511 Byte groß. Die lokale
Installation verwendet ausschließlich einen kurzlebigen Testschlüssel. Ein
Produktions- oder Uploadschlüssel wurde weder verwendet noch verändert.

## Gerät und Testartefakte

- isolierter AVD `WRN_API36_Play`, Android 16 / API 36, x86_64, 1080 × 2400;
- Paket `com.world.revolution`;
- Basis: Version 2.1.1 / Code 26, test-signierte APK SHA-256
  `0ebb8b56d7de30592fd17fe71232ca099c789ec72d3c285283b0379dc0383f6c`;
- Ziel: Version 2.2.0 / Code 27, test-signierte universelle APK SHA-256
  `ab82ba9b2297ee8d06f34005b37f902a02420bf662cda84836ae1bdc58a6203d`;
- Bundletool 1.18.1; beide Signaturen wurden vor der Installation verifiziert;
- Android-Release-Tests und `lintRelease` bestanden für denselben Kandidaten.

## Echter Upgradepfad und lokale Daten

Die alte 2.1.1/26 wurde frisch installiert. In ihr wurden Deutsch und das
Theme Violett/Rot gewählt sowie der EFF-Artikel
`wrn-art-a772ab86c915a036c6177f1bfe958d4d` gespeichert. Anschließend wurde die
2.2.0/27 mit `adb install -r` ohne Deinstallation installiert.

`firstInstallTime` blieb unverändert, `lastUpdateTime` wurde fortgeschrieben.
Nach dem Upgrade waren Paketidentität, Deutsch, Violett/Rot und der gespeicherte
Artikel erhalten. Die sichtbare Aktion lautete weiterhin „Aus Gespeichert
entfernen“. Damit ist der echte Android-Datenübernahmepfad auch für den
aktuellen Quellenpass-Kandidaten bestanden.

## Neue Quellenfunktion im installierten Kandidaten

Die app-eigene, allowlist-gebundene Route
`com.world.revolution://open/discover/sources` öffnete nach dem Upgrade die
deutsche Quellenansicht. Sichtbar waren:

- die getrennte Quellenrubrik mit Suche sowie Sprach-, Weltregions- und
  Länderfilter;
- der Bereich „Kuratierte aktive Quellen“ vor der vollständigen Endpunktliste;
- der EFF-Pass mit neutralen Initialen, getrennter Selbstbeschreibung und
  WRN-Einordnung, stabiler Quellen-ID, Alias, Region, Sprache, Themen, Medien,
  Endpunktstatus, letzter erfolgreicher Prüfung und Rechten je Medium;
- der Einzelprüfungsvorbehalt für Texte, Bilder und Audio sowie sichere Links
  zum Original und zum offiziellen öffentlichen Kontakt;
- der Beginn des folgenden C4SS-Profils. Africa Is a Country ist durch
  denselben bereits unabhängig geprüften Overlay-Vertrag gebunden.

Das Upgrade bewahrte die ältere lokale Inhaltsrevision erwartungsgemäß, während
die mit der App ausgelieferte Quellenpass-Erweiterung sofort verfügbar war.
Damit verlieren bestehende Nutzer*innen ihre gespeicherten Daten nicht und
erhalten zugleich die neue Quellenoberfläche.

## Stabilität und Grenze des Nachweises

In den letzten 5.000 Logcat-Zeilen gab es keinen Treffer für einen FATAL-Fehler
oder einen ANR von `com.world.revolution`. Die Android-Exit-Historie enthielt
nur den erwarteten Paketupdate-Stopp und das normale Ende eines isolierten
WebView-Prozesses.

Der frühere, ebenfalls testsignierte API-36-Nachweis für denselben 2.2.0-Codepfad
prüfte zusätzlich Offline-Deep-Link, vollständigen Offline-Reader, lokale
Gerätestimme, Menü-Rückweg sowie einen frischen v6-Erststart mit nativer
Bilddekodierung. Diese Prüfungen wurden durch die reine Quellenpass-Erweiterung
nicht ersetzt; der vorliegende Lauf ergänzt die exakte Bindung an den aktuellen
Commit und die installierte Quellenansicht.

**Ergebnis:** PASS für den echten Upgradepfad, Datenübernahme, installierte
Quellenpässe und den fokussierten Stabilitätssmoke des aktuellen Kandidaten.
Ein unabhängiger Read-only-Abschlussreview bestätigte Commit-, AAB-, APK-,
Versions-, Zertifikats-, Screenshot- und Hashbindung mit PASS ohne Finding.
Der Release bleibt offen, bis das vorbereitete Hosting aktiviert und live mit
HTTPS/CORS/Header/Rollback geprüft wurde, der produktive Uploadschlüssel
gebunden ist und der Kandidat den Play-internen Pre-Launch-Bericht durchlaufen
hat. Die internationale Kandidatenaufnahme SRC-04 benötigt außerdem einen
eigenen, monotonen Widerrufsvertrag für direkt aufgenommene Quellen; die
bestehende Verzeichnisprüfung wird dafür nicht abgeschwächt.

Zine, World Revolution Map und Action Radar bleiben als spätere Erweiterungen
vorgemerkt und blockieren diesen Releasekandidaten nicht.
