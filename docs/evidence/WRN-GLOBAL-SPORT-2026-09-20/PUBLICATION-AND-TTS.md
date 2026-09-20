# Veröffentlichung und Artikel-TTS – 20. September 2026

## Verifizierter Stand

- Sportverzeichnis: 40 Einträge, davon 17 neu; sechs bewohnte Kontinente, neun Oberflächensprachen. Lokaler Commit cbbbf36c, getrenntes GitHub main 92128dc. Alle elf übertragenen Dateien mit identischen Git-Blobs und Modi geprüft; Push erfolgreich.
- Repository World-Revolution-News-Next weiterhin privat. Öffentlich ist vom PO beauftragt; GitHub verlangt erneut Kontobestätigung. Keine erfolgreiche Sichtbarkeitsänderung behaupten.
- Der übertragene GitHub-Workflow ist auf alle sechs Stunden vorbereitet, läuft absichtlich nur bei öffentlichem Repository und erzeugt geprüfte Vorbereitungsartefakte ohne Veröffentlichung. Eine bloße öffentliche Sichtbarkeit schließt die laufende Artikelaufnahme und Live-Aktivierung noch nicht ab.
- Cloudflare-GitHub-Verbindung vorbereitet, ausschließlich dieses Repository ausgewählt. Installation verlangt dauerhafte Schreibrechte unter anderem für Code, Administration und Deployments. Browserregel fordert Bestätigung am konkreten Zugriffsschritt; Anfrage offen. Keine Installation, neue Ressource oder Live-Veröffentlichung erfolgt.
- Vorhandene Play Console enthält World Revolution News, zuletzt VersionCode26/2.1.1. Lokale nächste Version27/2.2.0, ApplicationId com.world.revolution, Target SDK36. Diese Vorbereitung ist weder Signierung noch Upload noch Release. Play-Hinweis zur Android-Entwicklerverifizierung bis30.09.2026 sichtbar; Erledigung nicht belegt.
- Google Cloud Console und Google Play Console sind unterschiedliche Ziele. Rückfrage offen; aufgrund der tatsächlich vorhandenen App läuft die Android-Vorbereitung weiter. Keine Google-Cloud-Abrechnung aktiviert.
- Lokale Android-Prüfung der Version27:16 JVM-Tests bestanden; Lint ohne Fehler,13 Warnungen. Gradle8.14.3/Java21/SDK36 offline, keine Signierung oder Installation. Der erste Sandboxlauf konnte vorhandene Buildberichte nicht schreiben; derselbe gezielte Lauf mit genehmigtem Cachezugriff war erfolgreich.
- Aktuelles unsigniertes AAB erfolgreich offline gebaut, Root-Commit de8b641e.90 Staging-Assets plus die separat gegen die installierte Capacitor-Quelldatei geprüfte native-bridge.js:91/91 Hashes identisch.8.131.238 Bytes, SHA-256 `70c9cf4b937152ea5f56bc32e9f54ea5cd7d4d066e2f146e5f8a5b0fef19b76a`. ZIP ohne Signaturdateien; jarsigner bestätigt unsigniert. Lokale Kopie: `work/wrn-android-release-D3IvGN/wrn-27-unsigned.aab`. Vorbereitungstool unabhängig PASS,4 Tests bestanden/1 Windows-Linktest EPERM übersprungen. Erster Bundleversuch stoppte sicher am von AGP auch ohne Schlüssel benötigten Finalisierungstask; exakt begrenzte Ausnahme unabhängig geprüft, Folgelauf erfolgreich. Kein Upload, keine Installation, keine Gesamt-RC-Freigabe. Dist-Provenienz bleibt im automatischen Receipt ausdrücklich unverified; Paket-Bytegleichheit ist separat belegt.

## Artikel vorlesen – empfohlener nächster Funktionsumfang

Noch nicht implementiert; PO038 bleibt offen/später. Im Reader eine Schaltfläche „Vorlesen“ mit Pause, Fortsetzen, Stoppen, Tempo und Absatzwechsel. Nur den tatsächlich sichtbaren Artikel beziehungsweise die bewusst ausgewählte Übersetzung lesen; Vorlesesprache folgt dem Text, nicht blind der Oberflächensprache.

Android: TextToSpeech mit lokal installierter Stimme, deren isNetworkConnectionRequired false ist. Website: SpeechSynthesis nur mit localService true. Fehlende lokale Stimme verständlich anzeigen; kein stiller Cloudfallback und keine kostenpflichtige API. Stimmenverfügbarkeit und Qualität hängen vom Gerät ab.

Integration über den bestehenden gemeinsamen Mediencontroller: keine gleichzeitige Podcast-/Video-/TTS-Wiedergabe; Stoppen bei Artikelwechsel, Widerruf oder Löschen. Geräteprüfung umfasst Sprachwechsel, lange Texte, Absatzgrenzen, Pause/Fortsetzen, Hintergrund/Unterbrechung und Offlinebetrieb. Eine zusätzliche Google-Cloud-TTS-Abrechnung ist für diesen Ansatz nicht erforderlich.

Primärreferenzen: https://developer.android.com/reference/android/speech/tts/Voice#isNetworkConnectionRequired() und https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService

Zine, World Revolution Map und Action Radar bleiben ebenfalls offen. Die neue Quellenliste ersetzt weder laufende Inhaltsversorgung noch den finalen RC-Abgleich.
