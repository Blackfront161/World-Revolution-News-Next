# WRN-G2-004 – Read-only Live-Infrastruktur-Inventar

Stand der Erhebung: 23. August 2026, 10:21 UTC
Status: **TEILWEISE – GITHUB LIVE VERIFIZIERT; CLOUDFLARE/HOSTINGER-LOGIN OFFEN**

## Beweisgrenze

Der Product Owner startete den Task mit `LIVE-INVENTAR STARTEN`. Es wurden
keine Einstellungen, Ressourcen, Dateien oder Daten in externen Systemen
veraendert, keine Produktendpunkte aufgerufen und keine Secretwerte, Account-
IDs, E-Mail-Adressen, Zahlungsdaten oder Inhaltslogs persistiert.

Kennzeichnungen:

- `LIVE`: read-only aus dem verbundenen Konto oder dem aktuellen Repository;
- `LOCAL-CONFIG`: nur aus dem festgelegten Legacy-Quellstand;
- `OFFICIAL-DOC`: aktuelle oeffentliche Herstellerdokumentation;
- `UNVERIFIED`: im autorisierten Konto noch nicht belegt.

## Vollstaendigkeitsmatrix

| Bereich | Status | Beweisstand |
|---|---|---|
| GitHub-Repositories/Commits | `LIVE` | drei oeffentliche Legacy-Repositories und aktuelle `main`-Commits verifiziert |
| GitHub-Workflows/Berechtigungen | `LIVE` | Workflowdateien auf aktuellem `main` gelesen; Ausfuehrungshistorie nicht inventarisiert |
| GitHub-Branchschutz | `LIVE` | `main` ist bei App, Website und Daten ungeschuetzt |
| Cloudflare-Deployments/Routes/Bindings | `UNVERIFIED` | Dashboard verlangt Anmeldung; lokale Config ist separat dokumentiert |
| Cloudflare-Plan/Usage/Kosten | `UNVERIFIED` | nur aktuelle offizielle Tarif-/Limitdokumentation erfasst |
| Hostinger-Plan/Release/Cache/Rollback | `UNVERIFIED` | hPanel verlangt Anmeldung; nur allgemeine Backupdokumentation erfasst |
| Google/Azure/Hugging-Face-Konten | `UNVERIFIED` | keine Kontositzung; nur aktuelle offizielle Privacy-/Limitangaben erfasst |
| Security-/Privacy-Review | `OFFEN` | unabhaengiger Review erst nach vollstaendigem Accountinventar sinnvoll |

## GitHub – verifizierter Livezustand

Read-only Quelle: verbundener GitHub-Zugriff und GitHub REST, abgefragt am
23. August 2026 zwischen 09:50 und 10:21 UTC.

| Repository | Sichtbarkeit / Default | `main` bei Erhebung | Branchschutz |
|---|---|---|---|
| `Blackfront161/World-Revolution-News-App` | public / `main` | `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`; entspricht Source-of-Truth | aus |
| `Blackfront161/World-Revolution-News-Website` | public / `main` | `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`; entspricht Source-of-Truth | aus |
| `Blackfront161/Revolution-News-Data` | public / `main` | `4928f474d02c41e196775e9b7c4f38dede06cbc1`, „Refresh current news feed“, 23.08.2026 09:38:40 UTC | aus |

Der Datenstand lag bei G1 noch auf `acec88e...` und bewegt sich durch
Automationen weiter. Das bestaetigt, dass `main` oder ein Raw-URL ohne
immutable Revision keine reproduzierbare Releasequelle ist.

### Aktuelle Workflowbeziehungen

| Produkt | Workflow | Trigger / Schreibrecht | Bewertung |
|---|---|---|---|
| App | `quality-gate.yml`, `validate-app.yml` | manuell/push/PR; `contents: read` | pruefend, kein Deploymentpfad in diesen Dateien |
| Website | `website-generator-readonly.yml` | manuell/push/PR; `contents: read` | pruefend, kein Hostinger-Publish in dieser Datei |
| Daten | `quality-gate.yml`, `validate-app.yml` | pruefend; `contents: read` | read-only Qualitaetspruefung |
| Daten | `update-fast.yml` | stuendlich bei Minute 7, manuell und Pfadtrigger; `contents: write` | erzeugt Inhalte und pusht direkt auf `main` ueber Safe-Push |
| Daten | `update-podcasts.yml` | alle vier Stunden bei Minute 37 plus manuell; `contents: write` | erzeugt/aktualisiert Podcastdaten und pusht auf `main` |
| Daten | `update.yml` | alle sechs Stunden bei Minute 37 plus manuell; `contents: write` | erzeugt mehrere Feeds/Healthdaten und pusht direkt mit Retry |
| Daten | `merge-multilingual-sources.yml`, `repair-audio.yml` | manuell; `contents: write` | veraendern Daten/Audio und pushen auf `main` |

`wrn-safe-push.sh` prueft einen sauberen Arbeitsbaum, holt/rebased den
Zielbranch und versucht den Push bis zu dreimal. Das reduziert Konflikte,
ersetzt aber keinen Branchschutz, Review oder immutable Release-Promotion.

In den gelesenen Workflowdateien gab es keine textuelle `secrets.*`-Referenz.
Dies ist kein vollstaendiger Beweis fuer alle Repository-/Environment-Secrets.
Alle gelesenen Dritt-Actions verwenden bewegliche Major-Tags wie `@v4` oder
`@v5`, keine unveraenderlichen Commit-SHAs.

### Soll-/Ist-Abweichungen

| Ist | Zielsoll | Owner / spaetestes Gate |
|---|---|---|
| drei Legacy-Repositories sind public | neues Plattformrepo gemaess ADR-001 privat | Chief / autorisierter Remote-Setup-Task |
| alle drei `main`-Branches ungeschuetzt | geschuetztes `main`, PR-/Gatepflicht, minimale Rechte | Chief + QA / vor neuer CI-Nutzung |
| Datenbots schreiben direkt auf bewegliches `main` | immutable Revision erzeugen, pruefen und getrennt promoten | Backend/Data + QA / W2/G5 |
| Actions nur auf Major-Tags gepinnt | Dritt-Actions auf gepruefte Commit-SHAs pinnen | QA/Security / CI-Setup |
| kein Website-Deploymentworkflow sichtbar | getrennten, ruecknehmbaren Hostinger-Releasepfad belegen | Website + QA / vor G5 |

## Cloudflare – lokale Hinweise und aktuelle offizielle Grenzen

### Noch nicht live belegt

Der In-App-Browser zeigt nur die Cloudflare-Anmeldeseite. Daher bleiben
tatsaechlicher Accountplan, deployte Worker/Versionen/Routes, Bindingziele,
aktive Flags, Cron, R2-Lifecycle, Logsampling/-retention, Usage, Rechnungen,
Hard Caps, Kill-Switches und Rollbackstand `UNVERIFIED`.

`LOCAL-CONFIG` zeigt weiterhin zwei Legacy-Deployables:
`wrn-translation-cache` und `revolution-proxy`. Darin sind KV, R2, Durable
Objects, Rate-Limits, Service Binding und Cron konfiguriert. Translation und
Podcast stehen lokal auf aktiv; Translation 950/Tag, Feedback 250/Tag, Azure
475.000 Zeichen/Monat und Podcast-R2 9 GiB sind Anwendungskonfiguration, aber
kein nachgewiesener Provider-Hard-Cap oder Livezustand.

### Kosten-/Limitbaseline aus offiziellen Dokumenten

Die Zahlen gelten nur fuer den jeweils genannten Tarif und beweisen nicht den
aktiven WRN-Plan.

| Produkt | `OFFICIAL-DOC` am 23.08.2026 | WRN-Auswirkung |
|---|---|---|
| Workers Free | 100.000 Requests/Tag, 10 ms CPU/Invocation, 5 Cron Trigger/Account | kann hart fehlschlagen; aktiver Plan/Verbrauch unbekannt |
| Workers Paid Standard | mindestens 5 USD/Monat; 10 Mio. Requests und 30 Mio. CPU-ms/Monat enthalten, danach 0,30 USD/Mio. Requests und 0,02 USD/Mio. CPU-ms | Service Bindings erzeugen im Standardmodell keine zweite Requestgebuehr; CPU summiert sich |
| Workers KV Free | 100.000 Reads/Tag; je 1.000 Writes/Deletes/Lists pro Tag; 1 GB Storage | Dashboard-/Wrangler-Operationen zaehlen ebenfalls; Liveverbrauch unbekannt |
| R2 Standard Free Tier | 10 GB-Monate, 1 Mio. Class-A- und 10 Mio. Class-B-Operationen/Monat; Internet-Egress frei | lokale 9-GiB-Appgrenze ist wegen GB/GiB und Operationen kein belastbarer Kosten-Cap |
| R2 Standard danach | 0,015 USD/GB-Monat; 4,50 USD/Mio. Class A; 0,36 USD/Mio. Class B | Lifecycle und Operationsmessung vor Aktivierung erforderlich |
| Durable Objects Free | SQLite-Backend; 100.000 Requests und 13.000 GB-s pro Tag | Legacy-Backend und Liveusage unbekannt |
| Workers Logs Free/Paid | Free: 200.000 Events/Tag und 3 Tage; Paid: 20 Mio./Monat enthalten, danach 0,60 USD/Mio., 7 Tage | native Retention ist kuerzer als PO-008-Maximum 30 Tage; kein Widerspruch, aber Supportkonzept muss 3/7 Tage beruecksichtigen |

Offizielle Quellen:

- <https://developers.cloudflare.com/workers/platform/pricing/>
- <https://developers.cloudflare.com/workers/platform/limits/>
- <https://developers.cloudflare.com/kv/platform/pricing/>
- <https://developers.cloudflare.com/r2/pricing/>
- <https://developers.cloudflare.com/durable-objects/platform/pricing/>
- <https://developers.cloudflare.com/workers/observability/logs/workers-logs/>
- <https://developers.cloudflare.com/workers/configuration/cron-triggers/>

## Hostinger – offizieller Rahmen, Konto offen

Das hPanel zeigt nur die Anmeldeseite. Aktives Paket, Websiteart, Speicher,
Domains, Cache/CDN, aktive Dateien/Revision, Backupzeitpunkte und tatsaechlich
verfuegbare Restorepunkte bleiben `UNVERIFIED`.

Laut aktueller allgemeiner Hostinger-Dokumentation erhalten Web-/Cloudplaene
woechentliche Backups mit sechs Wochen Aufbewahrung; Business oder hoeher
erhaelt taegliche Backups mit sieben Tagen Aufbewahrung. Website-Builder-
Backups werden bei Publikationen/Aenderungen erzeugt und 30 Tage gespeichert.
Welcher Fall fuer WRN gilt, darf erst nach hPanel-Beleg behauptet werden.

Offizielle Quellen:

- <https://www.hostinger.com/support/5981435-how-to-download-backups-at-hostinger/>
- <https://www.hostinger.com/support/6436203-hostinger-website-builder-how-to-create-and-restore-website-backups/>

## Optionale Provider – offizieller Privacyrahmen, Konten offen

| Provider | `OFFICIAL-DOC` | Noch `UNVERIFIED` |
|---|---|---|
| Gemini Developer API | Paid Services nutzen Prompts/Antworten nicht zur Produktverbesserung, protokollieren sie aber begrenzt zur Missbrauchserkennung; echte Zero-Data-Retention erfordert eine genehmigte ZDR-Konfiguration. Search/Maps Grounding speichert Kontext und Ausgabe 30 Tage. | aktives Projekt, Paid-/Unpaidstatus, ZDR, Grounding, Region, Quota und Budget |
| Azure Translator | Text Translation verarbeitet ohne Speicherung; Document Translation speichert nur waehrend der Verarbeitung und loescht danach hart. Standardtranslation wird nach Zeichen berechnet; F0 nennt 2 Mio. Zeichen/Stunde. | aktive Ressource, Region, Tarif, 475.000-Zeichen-Cap und Diagnoseeinstellungen |
| Hugging Face Inference Providers | Hugging Face speichert beim Routing keine Request-/Response-Bodies; Debuglogs bis 30 Tage enthalten laut Dokumentation keine Nutzerdaten/Tokens. Die Richtlinie des tatsaechlichen Inference Providers gilt zusaetzlich. | aktiver Provider/Modellweg, Plan, Region, Providerpolicy, Quota und Kill-Switch |

Offizielle Quellen:

- <https://ai.google.dev/gemini-api/docs/zdr>
- <https://ai.google.dev/gemini-api/terms>
- <https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/translator/data-privacy-security>
- <https://learn.microsoft.com/en-us/azure/ai-services/translator/service-limits>
- <https://huggingface.co/docs/inference-providers/en/security>

## Vorlaeufiges Kosten-/Privacyurteil

1. Cloudflare bleibt technisch plausibel und Service Bindings koennen die
   geforderte modulare Trennung kostenguenstig unterstuetzen. Ohne Kontoplan,
   Usage und Ressourcenzustand ist es noch keine freigegebene Betriebswahl.
2. Neue optionale Provider bleiben gemaess PO-011 auf 0 CHF Default und aus.
   Eine lokale Quote ist kein Abrechnungs-Hard-Cap.
3. Remoteuebersetzung darf gemaess PO-006 nur nach expliziter Nutzeraktion
   erfolgen. Provideradapter muessen No-Content-Logging, Retention und
   providerbezogene Kill-Switches erzwingen.
4. Native Workers Logs halten 3 oder 7 Tage, nicht 30. Damit ist eine kuerzere
   datensparsame Retention moeglich; Debug-/Incidentprozesse muessen diese reale
   Beweisfrist kennen.
5. Solange Hosting- und Worker-Rollback nicht live belegt sind, bleiben
   Serviceimplementierung und produktive Migration gesperrt.

## Fortsetzung ohne Zugangsdatenuebergabe

Der Product Owner meldet sich selbst in den bereits geoeffneten Cloudflare-
und Hostinger-Tabs des Codex-Browsers an und antwortet danach
`LIVE-INVENTAR BEREIT`. Passwort, Passkey und Zwei-Faktor-Code werden nicht an
einen Agenten uebergeben. Danach werden ausschliesslich die oben genannten
nicht-geheimen Kontoangaben read-only erhoben.
