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

Lokal: `node --test` für die betroffenen Content-Betriebsfälle **28/28 PASS**;
Prettier für die drei neuen Dateien und `git diff --check` PASS. Kein
Hostinger-Konto angelegt, kein Secret übertragen, kein Publisher aktiviert und
keine öffentliche Aktualisierung behauptet. Vor der Aktivierung fehlen ein
verzeichnisbegrenztes FTPS-Konto, die authentisierte TLS-/Rename-Probe und ein
erster nachgewiesener Live-Durchlauf. Die neue AAB bleibt davon getrennt.
