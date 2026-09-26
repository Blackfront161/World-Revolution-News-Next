# Live-Feed-Störung und Releasepfad · 26.09.2026 UTC

Lesende Prüfung gegen die veröffentlichten Endpunkte am 26.09.2026 zwischen
21:16 und 21:23 UTC. Keine Veröffentlichung, kein Workflow-Dispatch, kein
Play-Upload und keine Änderung am alten Backend.

Die alte Live-Website konfiguriert GitHub Pages als Datenbasis und
`raw.githubusercontent.com/Blackfront161/Revolution-News-Data/main/` als
Spiegel. Der veröffentlichte Client versucht im Livebetrieb den Spiegel zuerst
(`liveNewsCandidates` in `news-app-2.js`); ein lokaler 30-Sekunden-Timeout beim
GitHub-Pages-Feed erklärt daher für sich allein keinen vollständigen Ausfall.
Der Spiegel antwortete mit HTTP 200, CORS `*` und 500 Feed-Einträgen.

Der öffentliche `feed-status.json` des alten Repositories meldete
`generatedAt=2026-09-26T19:48:40.778585+00:00`, 500 Feed-Einträge und
172 Quellen mit Einträgen. Der zugehörige schnelle GitHub-Lauf
[#36267217547](https://github.com/Blackfront161/Revolution-News-Data/actions/runs/36267217547)
war erfolgreich. Er war um 21:16 UTC der neueste sichtbare Lauf. Obwohl der
Workflow `update-fast.yml` `7 * * * *` deklariert und aktiv ist, kamen die
letzten geplanten Läufe unregelmäßig (u. a. 17:04 und 19:46 UTC). Das belegt
eine Verzögerung/ausgefallene Takte im beobachteten Fenster, nicht die Ursache
oder einen dauerhaften GitHub-Ausfall.

Der Status nennt fälschlich `newestArticleAt=2026-10-01T13:00:00+00:00`, also
einen zukünftigen Zeitpunkt. Genau dieser Eintrag steht im Feed an erster
Stelle; der nächste Eintrag ist vom 26.09. 17:39 UTC. Der offene
[PR #38](https://github.com/Blackfront161/Revolution-News-Data/pull/38)
schließt zukünftige Artikel bei der Berechnung des **Statusdatums** aus und
hat einen Test dafür; er entfernt zukünftige Zeilen nicht aus dem Feed.
Der PR war lesend geprüft: offen, `mergeable_state=clean`, nicht gemergt.
Damit kann der sichtbare Aufmacher trotz neuer Feeddaten stehen bleiben.
Die konkrete Wahrnehmung auf dem Gerät ist ohne Gerätesichtprobe nicht belegt.

Der getrennte neue Inhaltslauf wurde gegen den aktuellen alten `main`-Commit
`e0eaa5565103167f58242cc8f412f749c17dba4f` **nur lokal** ausgeführt:
`node tools/run-legacy-news-supply.mjs ... --dry-run`. Die Quittung in
`work/wrn-feed-emergency-check-20260926/receipt.json` meldet
`state=awaiting-admission`, 499 Kandidaten, einen abgewiesenen Eintrag,
`publicationPerformed=false` und die Warnung
`news-newest-article-at-future`. Das ist der vorgesehene Rechte-/Provenienzstopp,
kein automatisch veröffentlichungsfähiger Volltextbestand.

Die neue App verwendet feste Inhaltszeiger auf `solinaridao.com`. Drei
öffentliche GETs antworteten erneut HTTP 404:
`/wrn-production-content/current.json`, `/wrn-content-directory/current.json`
und `/wrn-source-pass-revocations/current.json`. Der 47-Dateien-Hostingkandidat
ist lokal rückverifiziert, der zuletzt ausgelieferte Widerrufsstand aber ohne
authentisierten Hostzugriff unbewiesen. hPanel leitete in der verbundenen
Browser-Sitzung zur Anmeldung weiter. Ein Play-Update allein behebt diese
fehlende Live-Auslieferung nicht.

Für den kontrollierten Play-Test der bestehenden Paketkennung liegt ein
JKS-signiertes `com.world.revolution`-AAB 2.2.0/Code27 mit dem in Play
registrierten **Upload**zertifikat bereit. Die vom PO im geschlossenen Track
versuchte separate `.rc`-AAB trägt eine andere Paketkennung und Signatur und
wurde deshalb abgewiesen. Der richtige Haupt-App-Test auf einem geschlossenen
oder internen Track benötigt zuerst die Hosting-/Widerrufsprüfung und danach
eine tatsächliche Play-Annahme samt Geräte-Upgrade. Produktionsfreigabe und
vollständige RC-Matrix bleiben offen.

Schnellster sicherer Ablauf: authentisierten Host-Root und bisherigen
Widerrufsstand prüfen; dann den gebundenen Inhaltspakettransfer mit Pointer
zuletzt ausführen und externen Refresh/Rollback prüfen. Anschließend die
JKS-signierte Haupt-AAB im Testtrack annehmen lassen, auf dem Gerät die
Aktualisierung nachweisen und die restlichen RC-Prüfungen abschließen.
Spätere Inhaltsläufe brauchen eine echte Veröffentlichungsbindung; der
GitHub-Workflow im neuen Repository ist derzeit nur Dry-run.
