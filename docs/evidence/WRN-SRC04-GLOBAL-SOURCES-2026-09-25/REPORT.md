# SRC-04: internationale Quellenpässe und Widerruf

Stand: 25. September 2026. Verantwortlich: `/root`.

## Erreichbares Ergebnis

Die bisher drei geprüften Profile werden in App und Website um 16 direkte
internationale Profile ergänzt. Der vollständige Pass umfasst 19 Profile,
22 Endpunkte und 95 zugeordnete Belege. Die bestehenden 532 Verzeichnis-IDs
bleiben unverändert. Neue Endpunkte sind nur als Verzeichnis/Metadatenlinks
zugelassen; weder Volltexte noch Bilder, Logos, Feeds oder Übersetzungsrechte
werden daraus abgeleitet. Ungeklärte Kandidaten bleiben ausgenommen.

Der vollständige Pass liegt in beiden öffentlichen Clients bytegleich vor und
ist SHA-256-gebunden. Ein kleiner, belegter Drei-Profil-Pass bleibt für den
Offline-Erststart der Website gebündelt. Die Android-App liefert den vollen
Pass auch beim frischen Offline-Start aus. Die getrennte, kumulative
Widerrufsliste kann direkte Endpunkte ausblenden. Ungültige, rückläufige oder
nicht dauerhaft speicherbare Widerrufszustände schalten direkte Karten sicher
ab. Mehrere Tabs serialisieren Änderungen mit einem exklusiven Browser-Lock;
ohne diese Fähigkeit bleiben direkte Karten geschlossen. Beim Online-Erststart
werden direkte Karten erst nach dem Widerrufsversuch sichtbar. Der
Produktionspackager verlangt den zuletzt ausgelieferten Widerrufs-Snapshot als
gebundenen Eingang und weist Rückschritte ab. Ausgehende Originallinks
verwenden HTTPS und unterdrücken den Referrer.

## Prüfung

- Quellen-/Widerrufsvertrag: 9/9 fokussierte Fälle.
- Loader: 9/9; Mobile-Verzeichnis: 8/8 einschließlich Offline-Erststart;
  Website-Verzeichnis: 4/4.
- Öffentliche Asset-Parität: 2/2; Produktionspaket: 13/13,
  einschließlich Widerruf rev2→rev1 abgewiesen und rev2→rev3 angenommen;
  Stagingpaket: 8/8.
- Mobile- und Website-Typprüfung, beide Produktionsbuilds und
  500.000-Byte-Chunk-Gate bestanden. Größte Chunks: 409.951 bzw. 415.233 Byte.
- Android `testReleaseUnitTest`, `lintRelease`, `assembleRelease` und
  Capacitor-Synchronisation bestanden. Der finale erneute `assembleRelease`
  nach der Offline-Korrektur ist ebenfalls grün. Finale unsignierte APK:
  8.341.076 Byte,
  SHA-256 `02173dbbdbadb2a7f4bc7b1dbb0a8c623c685edc2f4ee50d748379088ebf249d`.
- Im API36-Emulator wurde genau diese 2.2.0/27-APK nur testweise signiert,
  vor dem frischen Installieren offline geschaltet und über den Quellen-Deep-Link
  kalt gestartet. Die vollen neuen Karten erscheinen ohne vorherigen
  Onlinebesuch. Nach Wiederherstellung der Verbindung erscheinen sie auch nach
  dem Online-Widerrufsversuch. 0 FATAL-/ANR-Treffer. Die frühere Menü-Zurück-Probe
  gilt für den davor gebauten Kandidaten und wurde hier nicht wiederholt.
  Dies ist **kein** Nachweis eines datenerhaltenden Upgrades dieser exakten APK.
  Ein 2.1.1→2.2.0-Upgrade ist separat im bereits versionierten RC-Beleg geprüft.
- Der einzelne zuvor fehlgeschlagene StrictMode-Navigationstest wurde isoliert
  erneut geprüft: 2/2 Fälle bestanden. Die volle Release-Matrix wird erst am
  finalen RC wiederholt.

## Sichtbelege

- `android-sources.png`: Quellenansicht im frisch installierten Kandidaten.
- `android-source-cards.png`: neue internationale Karten.
- `android-offline-source-cards.png`: neue Karte beim frischen Offline-Erststart.

## Release-Grenze

Die neue Quellenliste ist lokal erreichbar und geprüft, aber noch nicht live
aktiviert. Der produktive Widerrufszeiger und dessen CORS-/Cache-Verhalten
müssen am echten Host geprüft werden. Der verpflichtend angegebene
`previousRevocationsFile` muss dabei nachweislich der zuletzt ausgelieferte
Host-Snapshot sein; das lokale Paket kann die externe Herkunft nicht selbst
beweisen. Eine frisch offline installierte Website erhält weiterhin nur die
drei gebündelten Profile, weil das vollständige 84-KB-Overlay das unveränderte
8-MiB-Shell-Limit überschreiten würde. SRC-04 bleibt deshalb **in Arbeit**.
Produktionssignatur, Play-interner Pre-Launch-Test und Hostingaktivierung sind
getrennte Release-Schritte. Das spätere Zine sowie World Revolution Map und
Action Radar bleiben im PO-Scope und werden durch dieses Quellenpaket nicht
geschlossen. Der unabhängige Korrekturreview der Sicherheitsfixes ist PASS.

END-CHECK: :)
