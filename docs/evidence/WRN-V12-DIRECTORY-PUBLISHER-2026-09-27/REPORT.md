# WRN-V12: laufende Verzeichnisveröffentlichung vorbereitet · 27.09.2026 UTC

Der neue Hostinger-Stand versorgt die Clients derzeit mit einem manuell
aktivierten, hashgebundenen Nachrichtenverzeichnis. Der vorhandene
sechsstündliche Workflow `.github/workflows/wrn-content-supply.yml` ist
absichtlich nur ein Dry-run. Dieses Paket ergänzt einen **separaten,
standardmäßig abgeschalteten** Veröffentlichungsweg für Metadaten und
Original-Links. Es aktiviert weder neue Volltexte noch externe Bilder.

`tools/directory/publish-live-content-directory.mjs` prüft vor einer
Übertragung das exakte Alt-Datenrepo-Commit, Alter, Schema, Provenienz,
stabile IDs und SHA-256 des vorbereiteten Snapshots. Der Publisher liest
den aktuellen Live-Zeiger ohne Cookies, Redirects oder Referrer und lehnt
ältere bzw. konfliktierende Sequenzen ab. Er lädt zuerst den Snapshot,
prüft dessen öffentliche Bytes und vergewissert sich erneut, dass niemand
den Zeiger inzwischen geändert hat. Erst danach lädt er einen temporären
Zeiger und versucht dessen Umbenennung auf `current.json`; anschließend
prüft er den öffentlichen Live-Zeiger. Auch ein identischer Wiederholungslauf
prüft den bereits veröffentlichten Snapshot. Fehlende Aktivierung oder
abweichende Bytes werden gemeldet und nicht als Erfolg ausgegeben.

Der FTPS-Adapter erzwingt TLS, Zertifikatsprüfung und die aus hPanel
bekannte Hostinger-IP mit einem `*.hstgr.io`-Hostnamen. Ein Kennwort gelangt
nur über die Standardeingabe der `curl`-Konfiguration in den Prozess;
es wird weder als Argument noch im Repository oder Bericht gespeichert.
Ein zusätzliches FTP-Konto soll auf
`/public_html/wrn-content-directory` begrenzt werden. **Dieses Konto wurde
noch nicht angelegt und keine Zugangsdaten wurden übertragen.** Die
Umbenennung eines bestehenden `current.json` über den konkreten Hostinger-
FTP-Server und dessen TLS-Vertrauenskette sind bis zu einem echten,
verschlüsselt verifizierten Test noch nicht bewiesen.

`.github/workflows/wrn-directory-publication.yml` verwendet den normalen
`ubuntu-24.04`-Runner, nur `contents: read`, gepinnte Checkout-/Node-Actions
und keine Paket- oder Cache-Artefakte. Er läuft nur bei einem öffentlichen
Repository. Der Job bereitet alle sechs Stunden
einen lokalen Kandidaten vor; eine externe Übertragung erfolgt nur, wenn
die Repository-Variable `WRN_DIRECTORY_PUBLISH_ENABLED` exakt `1` ist.
Ein manueller Aufruf benötigt zusätzlich `publish: true`. Die fünf
Hostinger-Werte bleiben GitHub-Secrets. GitHubs [aktuelle
Abrechnungsdokumentation](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
weist Standardrunner in öffentlichen Repositories als kostenlos aus;
das WRN-Next-Repository war am 27.09. öffentlich erreichbar. Größere
Runner und zusätzliche kostenpflichtige Dienste werden nicht verwendet.

Die vorhandene Business-Webhosting-Oberfläche zeigt Cronjobs und FTP-Konten,
aber SSH war `INACTIVE`. Der Anbieter beschreibt
[Cronjobs](https://support.hostinger.com/en/articles/1583465-how-to-set-up-a-cron-job-at-hostinger)
für dieses Hosting, während
[Node.js auf Webhosting](https://support.hostinger.com/en/articles/1583661-is-node-js-supported-at-hostinger)
laut Hostinger nicht verfügbar ist. Der Generator muss daher auf dem
GitHub-Runner laufen. Ein anonymes, rein lesendes Protokoll-Handshake an
Port 21 erhielt `AUTH TLS` mit Erfolg; die Zertifikatskette ließ sich in
der lokalen Windows-Python-Umgebung noch nicht vertrauenswürdig prüfen.
Es wurde kein Kennwort gesendet und keine unsichere FTP-Fallbackoption
eingebaut.

**Prüfstand:** Fünf neue Publisher-Tests bestanden, darunter falscher Hash,
veraltetes Paket, Rollback, gleichzeitige Zeigeränderung, identische
Wiederholung und Standard-Sperre. `pnpm run test:content-operations`
bestand mit 34/34. Der vollständige `pnpm check` bestand ebenfalls am
27.09. Die Veröffentlichung bleibt aus, bis das auf ein
Verzeichnis begrenzte Konto sicher eingerichtet, seine TLS-Verbindung
verifiziert, die GitHub-Secrets gesetzt und ein erster Live-Durchlauf
mit öffentlichem Hash- und Browserbeleg bestanden ist. Die lokale
GitHub-Authentifizierung war bei der Prüfung abgelaufen; der neue
Workflow ist daher noch nicht im öffentlichen Repository angekommen.
