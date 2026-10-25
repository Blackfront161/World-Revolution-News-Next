# ADR-011 – World Revolution Atlas als Android-Beta

- Status: angenommen durch neuen PO-Auftrag vom 27. September 2026
- Ersetzt ADR-010 nur für die hier beschriebene freiwillig geöffnete Android-Beta
- Weiterhin offen: kartografische Darstellung, historische Ereignisschichten und ein eigenes Strategiespiel

## Entscheidung

Unter „Mehr“ erhält die Android-App den **World Revolution Atlas (Beta)**:
eine nach erfasstem Land filterbare Quellenübersicht und ein Quellen-Länder-Quiz.
Die Nutzer*innen wählen diese Spielmechanik ausdrücklich am 27.09. Die Beta
verwendet nur das bereits vertraglich validierte WRN-Quellenverzeichnis. Sie
lädt keine Kartenkacheln, Geocodingdienste oder Quellseiten. Eine
Quellenangabe ist ein historischer Verzeichniseintrag und behauptet weder
den aktuellen Standort noch die politische Einordnung der Quelle.

Nur Quellen mit genau einer eindeutig normalisierbaren Länderangabe aus
nicht als inaktiv markierten Beobachtungen gelangen in die Beta. Ein
Widerruf oder eine uneindeutige Angabe schließt die Quelle aus. Vier
verschiedene Länder bilden eine Quizfrage; Antworten und Zähler leben nur
im React-Zustand der geöffneten Ansicht. Die Beta liest weder
Nutzerstandort noch ein Konto und speichert keinen Spielstand.

Die neun UI-Sprachen bleiben verfügbar; Ländernamen liefert die lokale
`Intl.DisplayNames`-Funktion mit Code-Fallback. Tastaturbedienbare Auswahl,
44-Pixel-Ziele und Textlisten sind die barrierefreie Darstellung. Dieselbe
geprüfte lokale Verzeichnisdatei funktioniert ohne Netz, während die
vorhandene sichere Aktualisierung neuere öffentliche Metadaten übernehmen
kann. Keine neuen Provider-, API- oder Hostingkosten.

Das ältere öffentliche
[World-Revolution-Map-Repository](https://github.com/Blackfront161/World-Revolution-Map)
ist als Vorarbeit geprüft. Seine historische Ereigniskarte bezieht
Bibliotheken aus zwei CDNs, fragt alle Ereignisse aus Supabase ab, lädt
externe Basiskarten und ruft bei Klick Bilder von Wikipedia ab. Ein Popup
setzt Datenfelder direkt als HTML ein. Diese externen Datenflüsse, Rechte,
Quoten und HTML-Grenze sind für die neue App nicht freigegeben; der alte
Code wird deshalb nicht ungeprüft eingebettet. Die Beta nutzt bereits
gebundene WRN-Metadaten; eine spätere historische Kartenschicht braucht
einen eigenen, geprüften Daten- und Rechtevertrag.

Die Website erhält diese Beta **noch nicht**: Die bestehende geschlossene
Offline-Shell hat ein verbindliches 8-MiB-Limit. Ein gemeinsamer Import
überschritt dieses Limit in einem echten Pakettest. Das Limit wird nicht
angehoben und die vorhandene Web-Offlinefunktion bleibt erhalten. Für
Website-Parität braucht die Beta ein gesondert versioniertes Offlinepaket
mit eigener Prüfung. Dieser offene Teil darf nicht als abgeschlossen gelten.

## Abgrenzung und Prüfung

Keine Map-, Tile-, Standort-, Konto-, Multiplayer-, Ranking- oder
Trackingfunktion wird eingeführt. ADR-010 bleibt für diese künftigen
Module und die vorhandenen Content-/Geo-Verträge gültig. Vor einer
Play-Freigabe sind mobiler Build, bestehender Upgrade-/Speichertest,
barrierefreie Sichtprobe, exakte AAB-Prüfung und die Gesamt-RC-Matrix auf
dem neuen Commit erforderlich.
