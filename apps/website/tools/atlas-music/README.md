# Horizonte – Atlas-Musikalternative

Originale lokale Synthesekomposition,72BPM,106,667Sekunden, zweiKanäle. Weiche Tasten-/Saitenklänge, langsame harmonische Entwicklung. Keine fremden Samples, externen Aufnahmen, historischen Tonaufnahmen oder externen Abrufe. Der Renderer benötigtPython/NumPy; die gebundene OGG wurde mitFFmpeg/Vorbis erzeugt. Die externe Generierung wurde vor Joberzeugung durch den verbundenen Free-Tarif abgewiesen; dieser Track ist keine externe KI-Aufnahme.

Dieser Ordner ist ein geprüftes Integrationspaket. Er ist noch nicht in einen kanonischen Atlas-Snapshot importiert oder öffentlich veröffentlicht. Code33 und der eingefrorene r77-Elternstand werden nicht verändert. Der menschliche Musikwunsch liegt im Chat vor; eine neue Turn-ID nach r77 wurde nicht unabhängig belegt. Keine erfundene Zeit-/Releasebindung.

Import durch den Atlas-/App-Writer in einen neuen unveränderlichen Snapshot:

- `src/atlas-audio.js` → Atlas `src/atlas-audio.js`.
- `src/atlas-score.js` → Atlas `src/atlas-score.js`.
- `media/horizonte.ogg` → Atlas `media/audio/horizonte.ogg`.

Der neue Snapshot braucht seine eigene Version, vollständiges Datei-/Bytehashmanifest und Sourcebindung. Den bisherigen r77-Ordner mit immutableCachepolitik nicht überschreiben. Anschließend Websitevertrag auf den fertig gebundenen neuen Snapshot aktualisieren und die tatsächliche App-/Websiteintegration prüfen. Das separate hostverwaltete Offlinepaket unter Commit33c36d2 bleibt erhalten.

Die bestehende Audiooberfläche, neun Sprachfassungen, Effekte, Lautstärke, Stummschalten, sensible Inhalte und Hintergrundpause werden weiterverwendet. Aufnahmeabruf ausschließlich nach manuellem Einschalten, SameOrigin, ohne Credentials/Referrer. Exakte Byte-/SHA256-/Stereodecodeprüfung und15Sekunden Gesamtdeadline über Abruf/Hash/Decode. Abgebrochene Aktivierung darf weder einen verspäteten Abruf noch Wiedergabe starten. Das Aufnahmedekodieren benötigt etwa39MiBPCM bei48kHz; native App-/Emulatorprüfung gehört zum nächsten Integrationskandidaten.

Fünf fokussierte LifecycletestsPASS, einschließlich echter15Sekunden bei blockierter Dekodierung und anschließendemRetry. Elf realeBrowserchecksPASS: vollständiger Prozessneustart mit geleertemHTTPcache offline, Karte674Ereignisse bereit, echteStereoBufferSource alsLoop gestartet, Musikslider aufGain0, PMTiles206/416, gezielteCachelöschung mit fremdenCaches bytegleich, keineJavaScriptfehler. Der QA-Overlay ist ausdrücklich nicht publizierbar; Baseline und dreiMusikänderungen sind darin getrennt gebunden.

Lokale Vorschau: http://127.0.0.1:43243/atlas/?lang=de – Atlas starten, Ton öffnen und einschalten. Die Vorschau verändert keine Produktionsdateien und lädt Musik erst auf Wunsch.
