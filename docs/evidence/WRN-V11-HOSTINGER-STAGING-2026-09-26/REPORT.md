# Hostinger-Staging vor Livewechsel · 26.09.2026 UTC

Der PO hat am 27.09. lokaler Zeit ausdrücklich eine neue Live-App verlangt.
Die bestehende hPanel-Sitzung für `solinaridao.com` war nun angemeldet.
Der Dateimanager zeigte als Webwurzel `public_html` mit der bisherigen
Live-Website. Eine rekursive Dateisuche nach `revocation` ergab keinen Treffer;
dies beweist nur den suchbaren Dateimanagerbestand, nicht einen historischen
Widerrufsvertrag. Die drei neuen öffentlichen Inhaltszeiger blieben 404.

Im Hostinger-Menü **Backups** wurde vor einem Transfer ein manuelles
Website-Backup erstellt. Nach Abschluss zeigte hPanel als letztes Backup
`2026-09-27 05:47` in seiner angezeigten Zeitzone und den nächsten möglichen
manuellen Lauf am 28.09. Das Backup enthält laut UI Website-Dateien und
Datenbanken; Cache, Backup-Plugin-Archive und Datenbank-Exportdateien sind
ausgenommen. Eine Wiederherstellung wurde nicht ausgeführt.

Das lokal rückverifizierte 47-Dateien-Paket wurde nach seiner
`activationOrder` in drei ZIP-Dateien zerlegt. Nach Dekompression wurden alle
47 Einträge erneut gegen Manifest-Bytezahl und SHA-256 geprüft:

| Lokales Archiv | Einträge | Byte | Archiv-SHA-256 |
| --- | ---: | ---: | --- |
| `work/wrn-v11-live-transfer-20260926/01-files.zip` | 45 | 4.821.776 | `0517213525ee0faafc61bdf3cc6bb3c968c0a150dfad5d38edbd155abc6fc263` |
| `work/wrn-v11-live-transfer-20260926/02-production-pointer.zip` | 1 | 345 | `f1b990bd66c2616bccd8a2255fe0ec7dcee70a150584a064fc55846096518f6e` |
| `work/wrn-v11-live-transfer-20260926/03-directory-pointer.zip` | 1 | 476 | `2fc0ea239ef795265f840ad807d63496f431a10232a6fb8152207bf36edc74d9` |

**Nur `01-files.zip` wurde hochgeladen**, und zwar in `public_html`.
Ein erneuter Download aus dem Dateimanager hatte exakt 4.821.776 Byte und
denselben SHA-256 wie das lokale Archiv. Öffentlich antwortete
`https://solinaridao.com/01-files.zip` auf HEAD mit 200 und dieser Bytezahl.
Das Archiv enthält die zur Veröffentlichung vorbereiteten statischen Daten,
aber keine Provider- oder Uploadschlüssel. Es ist bis zur kontrollierten
Entpackung und anschließenden Aufräumung öffentlich erreichbar.

Vor der Entpackung brach die Browsersteuerung zum Dateimanager ab. Ein
zweiter Verbindungsversuch blieb erfolglos; deshalb wurde **kein Archiv
entpackt, kein Zeiger aktiviert und kein Play-Upload vorgenommen**. Der
öffentliche Startseiten-GET lieferte weiterhin den alten `news-app-2.js`-Client
und nicht den neuen `assets/index-CRqRUVlj.js`-Client. Alle drei neuen
Inhaltszeiger lieferten danach weiterhin 404. Die bisherige Website blieb
somit aktiv. Diese Zustandsprüfung kann einen späteren unabhängigen Eingriff
nicht ausschließen.

Bei wiederhergestelltem Hostzugriff zuerst das Archiv und dessen Inhalt im
Dateimanager erneut prüfen, dann gemäß Manifest entpacken und die 45 Dateien
öffentlich hashen. Erst anschließend die zwei getrennten Zeiger in
Manifestreihenfolge aktivieren und Hostheader, Client-Refresh und Rollback
prüfen. Das öffentliche ZIP nach erfolgreichem Transfer entfernen. Die
laufende sechs-stündliche Versorgung bleibt zusätzlich zu konfigurieren; das
neue GitHub-Workflow ist bisher Dry-run.
