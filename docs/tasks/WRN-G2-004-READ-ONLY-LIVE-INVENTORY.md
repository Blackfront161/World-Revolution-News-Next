# Task Brief – WRN-G2-004 Liveinventar

## Identitaet

- Task-ID: `WRN-G2-004`
- Titel: Zeitgestempeltes read-only Liveinventar vor G3
- Paritaets-/Risiko-ID: R-12, R-23, R-30, R-34, G3
- Auftraggeber: Product Owner – `LIVE-INVENTAR STARTEN` am 23. August 2026
- Zustaendiger Agent: Backend/Data Reliability mit Security/Privacy-Review;
  Main Agent synthetisiert
- Modell/Reasoning: Terra/high fuer Inventar, Sol/high fuer kritischen Review
- Delegation: nach Start erlaubt mit maximal zwei getrennten read-only Agenten
- Status: **COMPLETE – LIVE ERFASST UND UNABHAENGIG GEPRUEFT**

## Ziel in beobachtbarer Sprache

Ein zeitgestempelter Bericht unterscheidet eingecheckte Legacykonfiguration
vom tatsaechlichen Livezustand. Er nennt nur nicht-geheime Dienstnamen,
Versionen, Bindingarten, Routes, Plaene, Nutzung, Kosten-, Retention-,
Lifecycle- und Rollbackgrenzen. Nichts wird veraendert.

## Ausgangslage und Belege

- Zielrepository ab Checkpoint `841d74c`
- lokales Inventar:
  `docs/evidence/WRN-G2-002-LOCAL-INFRASTRUCTURE-INVENTORY.md`
- akzeptierte Grenzen: ADR-005/006/008/009 und R-12/R-23/R-30/R-34
- lokale Config zeigt zwei Worker-Deployables; Ziel verlangt getrennte
  fachliche Deploy-/Rollbackeinheiten

## Scope

### Erlaubte read-only Bereiche nach ausdruecklichem Start

- Cloudflare: Worker/Versionen/Routes, Bindingarten, KV/R2/DO-Namen,
  Compatibility-Dates, Cron, Observability, Plan/Usage/Limits/Lifecycle;
- Hostinger/Website: aktives Paket/Releaseweg, Cache/CDN, Plan und Rollbackbeleg;
- eingesetzte optionale Provider: aktivierte Dienste, Region, Plan/Quota,
  Retention und Kostenstand, soweit im autorisierten Konto sichtbar;
- GitHub nur soweit noetig fuer aktuelle Deploy-/Workflowbeziehungen;
- offizielle aktuelle Plan-/Retentiondokumentation zum Abgleich.

### Nicht-Ziele

- Secretwerte, Tokens, API-Keys, Keystores oder Zugangsdaten anzeigen;
- Logs mit Nutzerdaten oder redaktionellen Inhalten oeffnen;
- Konfigurationen, Flags, Bindings, Budgets, Routes oder Ressourcen aendern;
- Deployment, Testrequest, Schreibprobe, Loeschung oder Providerwechsel;
- Google-Play-Upload, Signierung oder Produktionseingriff.

### Verbotene Aktionen

- `wrangler deploy`, `wrangler secret`, R2/KV/DO-Schreiboperationen;
- Hostinger-/Cloudflare-Publish, Purge oder Rollback;
- GitHub-Remote-/Workflow-/Permissionaenderungen;
- Kosten verursachende API-Aufrufe;
- Screenshots mit sichtbaren Account-, Billing-, E-Mail- oder Secretwerten
  ungefiltert im Repository speichern.

## Akzeptanzkriterien

1. Jeder Befund besitzt Quelle, UTC-Zeitstempel und Kennzeichnung
   `LIVE`, `LOCAL-CONFIG`, `OFFICIAL-DOC` oder `UNVERIFIED`.
2. Worker/Hosting/Provider werden mit Version, Deploy-/Rollbackgrenze und
   Abhaengigkeiten kartiert, ohne Secretwerte.
3. Plan, Usage, Kosten, Limits, Retention und Lifecycle werden belegt oder
   explizit als unbekannt markiert.
4. Aktive Hochrisikofunktionen und Kill-Switch-/Hard-Cap-Status sind ohne
   ausloesenden Request bewertet.
5. Soll-/Ist-Abweichungen erhalten Owner und spaetestes Gate.
6. Ein Security/Privacy-Reviewer bestaetigt, dass der Bericht keine Secrets
   oder unnoetigen personenbezogenen Daten enthaelt.
7. Keine externe Mutation ist erfolgt; Account-Auditlog bleibt unveraendert,
   soweit ein read-only Vergleich moeglich ist.

Abschlussbewertung: Kriterien 1–6 sind mit Livebericht und unabhaengigem
Security-/Privacy-Review erfuellt. Zu Kriterium 7 erfolgte keine Mutation;
Cloudflare-/Hostinger-Aktivitaetslogs wurden zum Schutz von E-Mail-, IP- und
sonstigen personenbezogenen Daten nicht geoeffnet. Der unabhaengige
Auditlogvergleich bleibt deshalb explizit `UNVERIFIED`.

## Tests und visuelle Belege

- Unit/Contract: Vollstaendigkeitsmatrix und Status-/Quellenpruefung
- Integration/E2E: keine Requests gegen Produktendpunkte
- visuell: nur geschwaerzte, notwendige Dashboardbelege; bevorzugt
  textbasierte, nicht-geheime Exporte
- Fehlerfall: fehlender Login/Zugriff wird `UNVERIFIED`, nie umgangen

## Daten, Privacy, Security und Kosten

Keine Secret- oder Contentlogs lesen. Keine kostenpflichtigen Calls. Account-
und Billingbelege werden auf die fuer Plan/Usage notwendige Aussage reduziert;
IDs, E-Mails und Zahlungsdaten werden nicht persistiert.

## Rollback/Ruecknahme

Der Task ist strikt read-only. Nur Dokumente im Zielrepository entstehen und
koennen per Git rueckgenommen werden.

## Startnachweis

Der Product Owner startete diesen Task mit `LIVE-INVENTAR STARTEN`. Fuer den
Cloudflare-/Hostinger-Kontoteil stellt er nach eigener Anmeldung die
Browsersitzung bereit. Der Startbefehl erteilt weder `GO-IMPLEMENTATION` noch
Deploymentauthority.
