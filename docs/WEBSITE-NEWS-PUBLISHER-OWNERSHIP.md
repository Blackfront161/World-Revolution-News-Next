# Automatische Website-Nachrichten: vorbereitete Schreibzuständigkeit

24. Oktober 2026. Diese Regel beschreibt die verbindliche Zielzuständigkeit.
Die Freischaltung ist erst nach geprüfter Zugangseinrichtung und erfolgreichem
ersten Livevergleich abgeschlossen. Der aktuelle Stand steht in der Website-Roadmap.

Einziger regulärer Writer von `/wrn-website-content/current.json` wird der
geprüfte bestehende `wrn-website-news-update.yml`. Er besitzt neue unveränderliche
Snapshots, Aktivierung, transaktionsbezogenen Fehlerrollback und Wiederanlauf.
Seine Concurrencygruppe `wrn-current-directory-publication` bleibt exklusiv.
Der frühere lokale `wrn-directory-publication.yml` ist nur noch eine manuelle
Vorbereitung ohne Zeitplan, Secrets oder Veröffentlichungsschritt.

Manuelle Website-, Source-, Shell- und Atlaspakete dürfen den Tuplebereich
einschließlich current.json und temporärer Pointer-/Rollbacknamen nicht
überschreiben oder rekursiv spiegeln. Ihre Uploadlisten müssen diese Dateien
ausschließen. Mitgelieferte lokale historische Fallbacks sind kein Liveauftrag.
Ein bei einem Mainfreeze beobachteter Livepointer ist ein lesender Guard;
ändert die Automatik ihn inzwischen, wird neu beobachtet statt zurückgespielt.
Andere Inhaltszeiger, insbesondere das getrennte Volltextrelease, haben ihre
eigene Zuständigkeit und werden durch den Nachrichtenjob nicht verändert.

Automatik verwendet einen unveränderlichen geprüften Codepin, die darin
gebundene Bild-Originpolicy und die aktuellen restriktiven SourcePass- und
Rücknahmedokumente. Sie importiert nur Metadaten, keine neuen Volltexte oder
Bildfreigaben. Snapshotbytes und HTTP-Header werden vor der Aktivierung geprüft;
der Pointer muss vor und nach dem Wechsel die erwarteten monotonen Sequenzen
und Bytes haben. Die aktuelle Hosting-CSP wird für den einzelnen Lauf gebunden.
Exakte vorherige Bytes dienen nur dem eigenen Fehlerrollback dieses Vorgangs.

Der FTP-Zugang ist ausschließlich auf den Ordner
`public_html/wrn-website-content` beschränkt; der Workflow sieht dessen Root `/`.
Er erhält keinen Zugang zu Websitehauptdateien, Atlas, Volltexten oder Appdaten.
Zugangsdaten liegen nur als verschlüsselte Secrets im eigenen GitHub-Projekt,
keine Werte in Quellcode, Berichten oder Logs. FTPS mit Zertifikatsprüfung ist
zwingend. Der vorhandene andere Zugang für `wrn-content-directory` genügt nicht.

FTPS-Rename ist kein atomarer serverseitiger Compare-and-Swap. Deshalb sind
exklusive Schreibzuständigkeit und die gemeinsame Concurrencygruppe
Betriebsanforderungen. Ein Notfallwechsel erfordert: Automatik deaktivieren,
beendete Läufe bestätigen, aktuelle Bytes/Sequenzen neu beobachten und die
neue alleinige Zuständigkeit ausdrücklich dokumentieren. Keine parallelen
manuellen Pointerwriter und keine erfundenen Downgradesequenzen.

Der Client aktualisiert schon regelmäßig sowie bei Fokus und wiederhergestellter
Verbindung. Ein stündlicher GitHub-Zeitplan kann verzögert laufen und ist keine
minutengenaue Frischegarantie. Fehlgeschlagene oder ausgelassene Veröffentlichung
darf nicht als frische erfolgreiche Lieferung angezeigt werden.

Die Automatik vergleicht die gebundenen Rohdatenhashes und die vollständige
Inhalts-/Auswahlsemantik. Nur Beobachtungszeiten, Datencommit-Verweise und
abgeleitete Auditzusammenfassungen dürfen dabei abweichen. Bei gleichem Codepin
und jüngerem als sechs Stunden alten Pointer entfällt ein identischer Upload.
Ab sechs Stunden erfolgt auch bei unveränderten Inhalten eine echte neue
Prüfung und Veröffentlichung; kein Zeitstempel wird ohne Lieferung erneuert.

Eigene Dateien werden erst oberhalb der festen Sequenz `202610241355` verwaltet.
Alle bestehenden Dateien bis einschließlich dieser Grenze bleiben erhalten.
Eine kleine FTPS-Metadatei `.wrn-news-auto-state-v1.json` bindet aktive und direkt
vorherige Version sowie eine gegebenenfalls unterbrochene Aktivierung. Diese
Versionen bleiben geschützt. Snapshots und gescheiterte Transaktionstempdateien
werden frühestens nach sieben Tagen entfernt, nur bei eindeutigen MLSD-Fakten
für reguläre Dateien und passenden eigenen Namen. Unbekannte Namen, Links,
ungültige Größen/Zeitangaben und zukünftige Sequenzen werden niemals gelöscht.
Vor jedem DELE und nach der Serie müssen die aktuellen Pointerbytes unverändert
sein. Pro Lauf höchstens 24 alte Dateien; maximal 256 eigene Snapshots und 1 GiB
einschließlich reserviertem Platz für den nächsten Upload. Reicht eine sichere
Bereinigung nicht aus, stoppt der Lauf vor dem Upload. Erfolgreich aktivierte
eigene Rollbacktempdateien werden nach verifiziertem State-Readback entfernt.
Fehlschläge dieser Nacharbeit melden ausdrücklich eine erfolgte Veröffentlichung
mit ausstehender Bereinigung, niemals einen erfundenen Fehlerrollback.

Vor Freischaltung prüft ein rein lesender Runnerlauf den tatsächlich geschützten
FTPS-Root und dessen Bindung an den öffentlichen Pointer. `..` muss im gleichen
Chroot bleiben; Hauptdateien und Geschwisterordner müssen unzugänglich sein.
Der Prüflauf verwendet keine Schreib-, Umbenennungs- oder Löschbefehle.
