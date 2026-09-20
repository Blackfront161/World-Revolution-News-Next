# Task Brief – WRN-G1-004

## Identitaet

- Task-ID: `WRN-G1-004`
- Titel: Scoped Security-/Privacy-Review der G1-Datenfluesse
- Ausloeser: High-Findings 4 bis 6 aus `WRN-G1-003` sowie R-08/R-23
- Auftraggeber: Product Owner ueber Chief AI Architect
- Zustaendiger Agent: `security_privacy_reviewer`
- Modellklasse: Sol/high wegen konkreter personenbezogener Daten-, Auth- und
  Providergrenzen
- Delegation: nicht erlaubt

## Ziel

Validiere oder korrigiere die konkreten Security-/Privacy-Risiken der aktuellen
App statisch von Quelle bis Senke. Der Review muss fuer Uebersetzung, Feedback,
Push, generierte Podcasts sowie Hilfe/Action Radar eindeutig zeigen: Welche
Daten entstehen, wo sie das Geraet verlassen, wer sie verarbeitet, wo sie
gespeichert oder geloggt werden koennen, wie Auth/CORS/Quota/Loeschung wirken
und welche Bedingungen vor einer Portierung zwingend sind.

Dies ist kein Vollscan und keine Rechtsberatung. Ein Risiko darf nur als
Vulnerability bezeichnet werden, wenn ein konkreter missbrauchbarer Pfad im
Quellstand belegt ist.

## Verbindliche Quellen

- App: `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current`
- App-HEAD: `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Backend/Data-Handoff:
  `docs/handoffs/WRN-G1-003-backend-data-privacy-baseline.md`
- Task Brief und Quality/Privacy-Regeln:
  `docs/tasks/WRN-G1-003-BACKEND-DATA-PRIVACY-BASELINE.md`,
  `docs/04-QUALITY-RULES.md`, `docs/07-RISK-REGISTER.md`
- relevante Hauptpfade:
  - `cloudflare/revolution-proxy/src/index.js`
  - `cloudflare/revolution-proxy/src/push-gateway.js`
  - `cloudflare/shared/quota-client.js`
  - `cloudflare/shared/quota-coordinator.js`
  - `cloudflare/wrn-translation-cache/src/index.js`
  - beide `wrangler.jsonc`
  - `shared-translation-client.js`, `feedback.js`, `push-notifications.js`
    beziehungsweise die tatsaechlich referenzierten Clientmodule
  - `action-radar.js`, relevante Bereiche in `news-app-2.js`,
    `offline-db.js`, `privacy.html`
  - Admin-Inbox und zugehoerige vorhandene Tests

## Scope

### Pflichtpruefungen

1. Pro Datenfluss eine Source-to-Sink-Kette mit Datenfeldern, Ausloeser,
   Transport, Provider, Speicher, Retention, Zugriff, Logs und Loeschung.
2. Uebersetzung: bewusster Ausloeser, Payloadbegrenzung, Cachekey/-inhalt,
   Providerfolge, CORS, Rate/Quota, moegliche Contentlogs und Privacytext.
3. Feedback: optionale E-Mail, Nachricht/Metadaten, Honeypot/Validierung,
   R2-Key/Metadata, Adminauth, E-Mailpfad, 90-Tage-Pruning und Loeschluecken.
4. Push: Permission/Opt-in, Subscriptionfelder, DO-Speicher, Adminversand,
   Unsubscribe, 404/410-Pruning, Quiet Hours und Androidgrenzen.
5. Podcast: Artikeltext an Azure, oeffentliches Audio/Metadaten,
   Zugriffskontrolle, Ablauf/Pruning und Takedown-/Abuserisiko.
6. Hilfe versus Action Radar: kein Standort im Hilfe-Finder; freiwilliger
   Standort im Radar; statisch pruefen, ob Koordinaten an Netzwerk-, Log-, URL-
   oder Speicherpfade weitergegeben werden.
7. Admin- und CORS-Grenzen: konkrete Umgehbarkeit, Default-/Fail-open-
   Verhalten und Secret-Namen nur abstrakt bewerten.
8. Client-, Worker- und Privacytext auf Widersprueche pruefen.
9. Vorhandene Tests mit exakten Pfaden nennen und benoetigte Negativ-/Loesch-
   tests spezifizieren; nichts ausfuehren.
10. Jeden G1-003-High-Privacy-Befund als `BESTAETIGT`, `PRAEZISIERT`,
    `HERABGESTUFT` oder `NICHT BELEGT` klassifizieren.

### Verboten

- kein gesamter Repository-Securityscan oder automatisches Scan-Plugin
- keine Dateien veraendern
- keine Tests, Server, Worker, Browser, Live-Endpunkte oder Angriffe starten
- keine Cloudflare-/GitHub-/Providerkonten oder Dashboards lesen
- keine Secrets, Tokens, Keystores, Umgebungsdateien oder Secretwerte suchen,
  anzeigen oder auf Gueltigkeit testen
- keine Authumgehung, kein Rate-Limit-, CORS-, Push- oder Admin-Livetest
- keine externen Daten uebertragen, keine Provider-API aufrufen
- keine weiteren Agenten starten

## Akzeptanzkriterien

1. Fuenf Source-to-Sink-Ketten sind mit konkreten Dateien/Funktionen belegt.
2. Keine statische Absicht wird als live wirksame Retention, Binding-, Secret-
   oder Deploymentgarantie ausgegeben.
3. Severity trennt bestehende technische Schutzmassnahme, Privacy-/Governance-
   Luecke und konkret ausnutzbare Schwachstelle.
4. Adminauth, CORS, Cache, R2/DO, Logs und Loeschung werden getrennt bewertet.
5. Hilfe-/Radar-Aussage wird ohne Spekulation eindeutig bestaetigt oder
   korrigiert.
6. Pro bestaetigtem Risiko stehen minimale Portierungsanforderung,
   Negativtest und Gate.
7. Es werden keine Secretwerte oder personenbezogenen Beispieldaten ausgegeben.
8. Ergebnis nennt, ob weitere Securityarbeit vor G2 zwingend ist oder als G2-
   Architekturinput reicht.
9. Vollstaendiger WRN-Statusblock mit `END-CHECK: :)`.

## Uebergabeformat

- Executive Summary
- Scope und Evidenzgrenze
- Source-to-Sink-Matrix
- Validierung der G1-003-High-Findings
- Findings nach Severity und konkreter Ausnutzbarkeit
- vorhandene Schutzmechanismen
- Portierungsanforderungen, Negativtests und Gates
- offene Live-/Rechts-/Providerfragen
- ausdruecklich keine Aenderungen
- WRN-Statusblock
