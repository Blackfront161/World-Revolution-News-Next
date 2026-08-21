# Task Brief – WRN-G1-003

## Identitaet

- Task-ID: `WRN-G1-003`
- Titel: Read-only Backend-, Daten-, Kosten- und Privacy-Baseline
- Paritaets-/Risiko-IDs: NEWS-07 bis NEWS-10, MEDIA-01 bis MEDIA-05,
  HELP-01 bis HELP-03, INFO-05/INFO-06, SYS-01 bis SYS-09 sowie R-05 bis
  R-09, R-12 und R-22
- Auftraggeber: Product Owner ueber Chief AI Architect
- Zustaendiger Agent: `backend_data_reliability_engineer` im ausdruecklich
  read-only Analysemodus
- Unabhaengige Folgekontrolle: `security_privacy_reviewer` nur bei konkretem
  High-/Privacy-Ausloeser und mit eigenem Task Brief
- Delegation: nicht erlaubt

## Ziel in beobachtbarer Sprache

Erstelle eine beweisgestuetzte Karte aller aktuellen Backend- und Datenvertraege,
die App oder spaetere Website benoetigen: produktives Datenrepository,
Cloudflare Worker, externe Quellen, Caches, Quoten, Push/Feedback,
Uebersetzung, sensible Hilfe-/Standortpfade, Offlinekopien und Fehlerfallbacks.
Trenne dabei eindeutig nachgewiesenes Verhalten, historische Deploymentbelege
und unbekannten Livezustand. Noch keine Zielarchitektur entscheiden und keinen
Code schreiben.

## Verbindliche Quellen und Snapshots

### Lokale App-Quelle

- `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current`
- Branch `main`
- erwarteter HEAD `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Cloudflare-Pfad `cloudflare/`

### Produktives Datenrepository

- GitHub: `Blackfront161/Revolution-News-Data`
- Default-Branch: `main`
- beobachteter Snapshot am 21. August 2026, 11:36:55 UTC:
  `acec88ef40814f70c1bb45001e397a6ca5872ed7`
- Der Branch ist hochdynamisch. Alle Connector-Lesezugriffe muessen nach
  Moeglichkeit an diesen Commit gebunden oder mit neuem exaktem Commit und
  Zeitpunkt dokumentiert werden.

### Erlaubte Zusatzquellen

- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/handoffs/WRN-G1-001-legacy_product_analyst.md`
- `docs/handoffs/WRN-G1-002-visual-app-baseline.md`
- die beiden vom Product Owner uebergebenen Dateiuebersichten
- aktuelle Website nur fuer nachweisbare Konsumenten desselben Datenvertrags;
  keine visuelle oder allgemeine Website-Baseline

## Scope

### Erlaubte read-only Untersuchungen

1. App-, Cloudflare- und bei Bedarf Website-Gitstand pruefen.
2. GitHub-Connector ausschliesslich lesend fuer das Datenrepository verwenden:
   Repositorymetadaten, Commit, Dateien, Workflows und Schemabeispiele.
3. Clientkonfiguration und alle Netzwerk-Origins, Endpunkte, Methoden,
   Request-/Responseformen und Fallbackreihenfolgen kartieren.
4. Cloudflare Worker, Routen, Bindings **nur nach Namen und Zweck**, CORS,
   Auth-Grenzen, Cache/TTL, Quoten, Observability und Fehlerverhalten
   inventarisieren.
5. Keine Secretwerte lesen oder suchen. Statische Variablennamen wie
   `env.<BINDING_NAME>` duerfen als benoetigte Konfiguration genannt werden.
6. Fuer die Hauptdaten `news`, `events`, `podcasts`, erzeugte Podcasts,
   Bibliothek, Video, Radio, Quellenprofile, Aktionen und Hilfe jeweils
   Produzent, Speicherort, Konsument, Schema-/Versionssignal, Aktualisierung,
   Provenienz, Offlinekopie und Fallback erfassen.
7. Datenfluesse fuer Uebersetzung, Feedback/Admin-Inbox, Push/Notifications,
   Action-Radar-Standort, Hilfe, gespeicherte Artikel und Diagnostik von Quelle
   bis Senke beschreiben.
8. Externe Kosten-/Quotenpunkte identifizieren: Provider, Ausloeser, Cache,
   Rate Limit, Kill-Switch/Fallback und unbekannte Preisannahmen.
9. Vorhandene Contract-/Worker-/Privacy-/Failure-Tests mit exakten Pfaden
   inventarisieren; keine Tests ausfuehren.
10. Mindestens zehn priorisierte Reliability-, Privacy-, Security- oder
    Kostenrisiken mit konkreter Evidenz liefern.
11. Pro Hauptkomponente `KOPIEREN`, `PORTIEREN`, `NEU SCHREIBEN`,
    `ARCHIVIEREN` oder `NOCH ENTSCHEIDEN` empfehlen.

### Nicht-Ziele

- kein Live-Cloudflare-Dashboard- oder Accountaudit
- keine Behauptung, welche Worker aktuell deployed sind, wenn nur ein alter
  Deploymentbericht vorliegt
- keine Live-Endpoint-Penetration, Last-, Quoten- oder Kostenpruefung
- keine vollstaendige Website-, Android- oder UI-Baseline
- keine Zieltechnologie- oder Hostingentscheidung
- kein Security-Scan des gesamten Repositories; konkrete High-Findings werden
  separat an das Security-Profil uebergeben

### Verbotene Aktionen

- lokale oder GitHub-Dateien aendern
- GitHub-Issues, Commits, Branches, PRs, Kommentare oder Reaktionen erzeugen
- Tests, Builds, Generatoren, Worker, Server oder Workflows starten
- Wrangler, Cloudflare, GitHub Actions oder andere Deployments ausfuehren
- Secrets, Tokens, Passwortdateien, Keystores oder Secretwerte suchen/anzeigen
- APIs mit produktiven Schreiboperationen oder personenbezogenen Daten aufrufen
- Daten herunterladen oder klonen, wenn gezieltes Connector-Lesen genuegt
- Dependencies installieren oder kostenpflichtige API-Aufrufe ausloesen
- weitere Agenten starten

## Akzeptanzkriterien

1. Jede Quelle besitzt exakten Commit/Stand oder ist explizit als beweglich/
   unbekannt gekennzeichnet.
2. Ein Systemkontext zeigt Produzenten, Speicher, Worker, Clients und externe
   Provider ohne App/Website-Releaseketten zu vermischen.
3. Alle statisch erkennbaren Cloudflare-Routen und Bindings sind nach Zweck,
   Datenklasse, Auth-/CORS-Grenze, Cache/Quota und Fallback dokumentiert.
4. Eine Datenvertragsmatrix deckt die genannten Hauptdaten ab und nennt
   konkrete Dateien sowie relevante Tests.
5. Privacy-Flows trennen klar: `Hilfe finden` ohne Geolocation,
   optionaler Action-Radar-Standort, Uebersetzung, Feedback, Push,
   lokale Speicherung und Logs.
6. Historische Deployments/Tests werden nicht als aktueller Livebeweis
   ausgegeben.
7. Kostenpunkte enthalten keine erfundenen Preise; fehlende Messwerte werden
   als Anforderungen an G2 dokumentiert.
8. Mindestens zehn Risiken sind priorisiert und besitzen eine pruefbare
   Gegenmassnahme oder Folgefrage.
9. Die Migrationsklassifikation ist komponentenbezogen und begruendet.
10. Handoff endet mit vollstaendigem WRN-Statusblock und `END-CHECK: :)`.

## Kosten- und Sicherheitsgrenze

- Abo-/Connector-first, keine zusaetzliche Modell-API.
- Nur benoetigte Dateien lesen; grosse JSON-Datensaetze ueber Struktur,
  Stichproben und Metadaten untersuchen, nicht vollstaendig in den Chat laden.
- Adminrechte des verbundenen GitHub-Kontos sind keine Schreibfreigabe.
- Keine Secretwerte in Handoff, Logs oder Prompts.

## Uebergabeformat

- Executive Summary und Quellenstaende
- Systemkontext und Trust Boundaries
- Cloudflare-Service-/Endpointmatrix
- Datenvertrags-/Ownershipmatrix
- Privacy- und lokale Speicherfluesse
- Kosten-/Quota-/Fallbackmatrix
- exakte Testpfade und historische Belege
- priorisierte Findings
- Migrationsklassifikation
- unbekannte Livezustaende und Folgepruefungen
- ausdruecklich keine Aenderungen
- WRN-Statusblock
