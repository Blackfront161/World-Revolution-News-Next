# Aktueller lokaler Inhalts- und Hostingkandidat

26. September 2026 (lokal), Datenbeobachtung 25.09.2026, 19:29:02 UTC.
Verantwortlich: `/root`. **Dry-run; keine Veröffentlichung.**

Der neu aufgelöste Daten-Commit
`50d8a4905815c5fb1fecfbc1ec84793d14c82d56` wurde für Feed, Status
und Quellenregister gemeinsam gebunden. Die [Quittung](directory-receipt.json)
weist `dryRun: true` und `publicationPerformed: false` aus. Der Snapshot
enthält 958 aktuelle Nachrichtenlinks, 532 Quellenendpunkte und drei
Sportnotizen. Gegen den vorherigen lokalen Snapshot `202609251453` enthält
er 899 gleiche Links mit unveränderten IDs, 59 neue und 69 entfallene Links.
Das ist ein rollierendes Metadatenverzeichnis, keine Volltext- oder
Archivaufnahme. Der neue Snapshot hat 1.931.371 Byte und SHA-256
`b0ab98cf0bade581d623bf6fb51369ea1721e72cfdb18a94e3c7771bddd4cf7d`;
Vertrag, Hash und Sequenz `202609251928` gegen die vorherige Sequenz wurden
erneut geprüft. Der Guard für fünf kuratierte Regionaltermine bestand mit
148,454 Stunden Restzeit bei 48 Stunden Mindestvorlauf.

Aus dem unveränderten Produktquellstand
`cdd7c946f9b00314760a90acad5fab6789a77750` wurde die Website neu
gebaut. Das [Website-Manifest](website-package.manifest.json) bindet 41/41
rückverifizierte Dateien mit zusammen 10.049.934 Byte und SHA-256
`d8b029e0b81d7a0b3d07f604dff855438a07842575ae2f92ffa71da40241b49c`.
Das [Hosting-Manifest](hosting-packet.manifest.json) bindet Website und
neuen Verzeichnis-Snapshot mit 44/44 byteweise rekonstruierten Dateien und
zusammen 11.982.631 Byte; Manifest-SHA-256
`707400b3b0cae1354b4075a03e95fb5aeffa70eb7c89c181f4539765fe654f9e`.
Die beiden `current.json`-Zeiger stehen in der Aktivierungsreihenfolge
zuletzt. Vollständige, ignorierte Arbeitskopien liegen im separaten Checkout
unter `work/wrn-final-website-cdd7c94-20260925/`,
`work/wrn-live-directory-202609251928/` und
`work/wrn-final-hosting-cdd7c94-20260925/`.

Die Website-Verpackung verwendet weiterhin die lokale, hashgebundene
Widerrufsbasis `source-pass-revocations-v1.json`. Sie ist **kein Nachweis**
des zuletzt ausgelieferten Host-Widerrufsstands. Vor einer Aktivierung sind
der echte vorige Host-Root und beide Pointerantworten zu sichern sowie
Widerrufsprovenienz, HTTPS, CORS, Cache, Header, Client-Refresh und Rollback
am authentisierten Host zu prüfen. Die alte Live-Website bleibt unverändert.
Ungeprüfte Volltexte und Bilder werden durch diesen Metadatenlauf nicht
aufgenommen. Vollständige Browser-/Gerätematrix, Produktionssignatur und
Play-interner Test bleiben eigene Release-Bedingungen.

**Betriebsabgleich am 26.09.2026, nur lesend:** Das öffentliche neue
GitHub-Repository stand auf `8be0fae28b555ff9080efc6af7dbc59f68dcd53b`,
also vor diesem lokalen Kandidaten. Der dort vorhandene Workflow
`wrn-content-supply.yml` läuft alle sechs Stunden, verlangt aber ausdrücklich
`dry_run` und besitzt nur `contents: read`. Die letzten drei eingesehenen
Läufe waren erfolgreich. Die Workflow-Definition erzwingt
`publicationPerformed: false` und enthält keinen Pointer-Transfer.
Ein grüner Workflow-Lauf belegt daher keine Live-Aktualisierung.
Der zuletzt eingesehene Lauf war
[`36165282791`](https://github.com/Blackfront161/World-Revolution-News-Next/actions/runs/36165282791).

Die drei separat im Browser geöffneten Live-Adressen
`/wrn-content-directory/current.json`,
`/wrn-production-content/current.json` und
`/wrn-source-pass-revocations/current.json` zeigten jeweils
„This Page Does Not Exist“. Ein HTTP-Statuscode wurde dabei nicht ermittelt.
Der Hostinger-hPanel-Aufruf leitete zur Anmeldung weiter; ein
authentisierter Host-Root und seine vorherigen Pointerbytes sind somit noch
nicht geprüft oder gesichert. Weder Upload noch Aktivierung wurden ausgeführt.
