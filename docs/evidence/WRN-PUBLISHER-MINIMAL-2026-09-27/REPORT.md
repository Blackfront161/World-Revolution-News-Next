# Getrennter Metadaten-Publisher · 27.09.2026 UTC

Dieser Branch ergänzt den abgeschalteten sechs-stündlichen Publisher separat
zum größeren App-Release-Entwurf. Er übernimmt nur den geprüften
FTPS-Publisher, seine Tests und den Workflow. Die bestehenden historischen
Nachweise und das Paketmanifest bleiben unverändert.

Der Workflow prüft die Vorbereitungs- und Veröffentlichungsverträge bei jedem
Lauf und baut einen Kandidaten aus einem exakten Commit des öffentlichen
Alt-Datenrepositorys. Er überträgt ausschließlich Metadaten und Originallinks,
erst nach Setzen von `WRN_DIRECTORY_PUBLISH_ENABLED=1` und fünf scoped
Hostinger-Secrets. Der Adapter prüft Schema, Herkunft, Alter, Hashes,
öffentlichen Snapshot und Zeiger-Reihenfolge; fehlende oder widersprüchliche
Bestätigungen stoppen den Lauf. Volltext- und Bildrechte werden dadurch nicht
erteilt.

Die unabhängige Erstprüfung fand einen Rollback-Fehler nach einem unbestätigten
Zeigerwechsel. Der Publisher sichert nun die exakten Bytes des zuvor öffentlich
gelesenen und validierten Zeigers als separate FTPS-Datei. Kann er den neuen
Zeiger nach der Aktivierung nicht bestätigen, versucht er die atomare
Rückbenennung dieser Sicherung auf `current.json` und prüft den vorherigen
Zeiger erneut. Bei unbestätigter Wiederherstellung meldet er ausdrücklich
`directory-rollback-unverified`; bei einer erkennbar dritten Publikation stoppt
er ohne deren Zeiger zu überschreiben. Nach dem Backup-Upload wird der Livezeiger
unmittelbar vor der Aktivierung noch einmal geprüft. Die lokalen Tests simulieren
einen fehlenden Readback, eine erfolglose Rücksetzung und eine parallele
Publikation während des Backup-Uploads. FTPS bietet für die abschließende
Umbenennung kein serverseitiges Compare-and-Swap. Vor einer Aktivierung muss
deshalb die Alleinzuständigkeit dieses Workflows für genau diesen Zeiger
nachgewiesen werden; die GitHub-`concurrency`-Gruppe serialisiert nur seine
eigenen Läufe. Eine echte FTPS-Rename-Probe am verzeichnisbegrenzten
Hostinger-Konto steht ebenfalls noch aus.

Lokal: `node --test` für die betroffenen Content-Betriebsfälle **31/31 PASS**;
Prettier für die drei neuen Dateien und `git diff --check` PASS. Kein
Hostinger-Konto angelegt, kein Secret übertragen, kein Publisher aktiviert und
keine öffentliche Aktualisierung behauptet. Vor der Aktivierung fehlen ein
verzeichnisbegrenztes FTPS-Konto, die authentisierte TLS-/Rename-Probe und ein
erster nachgewiesener Live-Durchlauf. Die neue AAB bleibt davon getrennt.
