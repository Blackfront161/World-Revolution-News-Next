# WRN-G2-004 – Read-only Live-Infrastruktur-Inventar

Stand der Erhebung: 23. August 2026, 09:50–11:02 UTC
Status: **COMPLETE – LIVE VERIFIZIERT, UNABHAENGIG GEPRUEFT**

## Beweisgrenze

Der Product Owner startete den Task mit `LIVE-INVENTAR STARTEN`. Es wurden
keine Einstellungen, Ressourcen, Dateien oder Daten in externen Systemen
veraendert, keine Produktendpunkte aufgerufen und keine Secretwerte, Account-
IDs, E-Mail-Adressen, Zahlungsdaten oder Inhaltslogs persistiert.

Ein unabhaengiger Vergleich mit Cloudflare- oder Hostinger-Aktivitaetslogs ist
`UNVERIFIED`: Diese Protokolle wurden nicht geoeffnet, um unnoetige E-Mail-,
IP- oder sonstige personenbezogene Daten zu vermeiden. Die Nichtmutation ist
durch den ausgefuehrten read-only Arbeitsablauf belegt, nicht durch einen
nachtraeglichen Account-Auditlogvergleich.

Kennzeichnungen:

- `LIVE`: read-only aus dem verbundenen Konto oder dem aktuellen Repository;
- `LOCAL-CONFIG`: nur aus dem festgelegten Legacy-Quellstand;
- `OFFICIAL-DOC`: aktuelle oeffentliche Herstellerdokumentation;
- `UNVERIFIED`: im autorisierten Konto noch nicht belegt.

Quellen- und Zeitregel fuer alle folgenden Einzelbefunde:

| Abschnitt | Kennzeichnung | UTC-Erhebungsfenster |
|---|---|---|
| GitHub | `LIVE` | 23.08.2026, 09:50–10:21 |
| aktuelle Herstellerdokumentation | `OFFICIAL-DOC` | 23.08.2026, 10:01–10:21 |
| Cloudflare-Dashboard | `LIVE` | 23.08.2026, 10:31–10:57 |
| Hostinger-hPanel | `LIVE` | 23.08.2026, 10:57–11:02 |

Jeder Tabellen-/Listenbefund erbt Kennzeichnung und UTC-Fenster seines
Abschnitts, sofern in der Zeile keine engere Quelle oder Zeit genannt ist.

## Vollstaendigkeitsmatrix

| Bereich | Status | Beweisstand |
|---|---|---|
| GitHub-Repositories/Commits | `LIVE` | drei oeffentliche Legacy-Repositories und aktuelle `main`-Commits verifiziert |
| GitHub-Workflows/Berechtigungen | `LIVE` | Workflowdateien auf aktuellem `main` gelesen; Ausfuehrungshistorie nicht inventarisiert |
| GitHub-Branchschutz | `LIVE` | `main` ist bei App, Website und Daten ungeschuetzt |
| Cloudflare-Deployments/Routes/Bindings | `LIVE` | drei Worker, Versionen, Bindings, Trigger, Observability und Rollbackgrenze erfasst |
| Cloudflare-Plan/Usage/Kosten | `LIVE` | Workers Free; Worker/KV/R2/DO-Nutzung liegt im beobachteten Zeitraum innerhalb der Free-Kontingente |
| Hostinger-Plan/Release/Cache/Rollback | `LIVE` | Business Web Hosting, PHP/HTML, `public_html`, CDN, Cache, Backups und Abonnements erfasst |
| Google/Azure/Hugging-Face-Konten | `UNVERIFIED` | keine separate Kontositzung; Legacy besitzt Providerkonfiguration, neues Ziel bleibt bei 0 CHF und aus |
| Security-/Privacy-Review | `COMPLETE` | unabhaengiger read-only Review und finale Nachpruefung ohne Secret-/PII-Befund bestanden |

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

### Livekonto, Plan und Gesamtnutzung

Read-only Dashboardquelle: 23. August 2026, 10:31–10:57 UTC.

- aktiver Workers-Plan: **Free**, 0 USD Grundpreis;
- im Account sind keine Cloudflare-Domains/Zonen vorhanden;
- die Worker sind nur ueber je eine `workers.dev`-Domain erreichbar; keine
  benutzerdefinierten Domains oder Routes;
- R2-Nutzung 1.–23. August: 2.550 Class-A-, 570 Class-B-Operationen und
  8,36 MB Speicher;
- KV-Nutzung am 23. August: 16 Reads, 10 Writes, 0 Deletes, 0 Lists und
  508 kB Speicher;
- drei SQLite-Durable-Object-Namespaces, am 23. August jeweils 0 Requests,
  0 Fehler und 0 Dauer;
- beobachtete Nutzung liegt weit innerhalb der aktuellen Free-Kontingente.
  Fuer die inventarisierten Cloudflare-Produkte ergibt sich damit zum
  Erhebungszeitpunkt eine **Kostenprognose von 0 USD**. Es wurde keine Rechnung
  oder Zahlungsmethode geoeffnet.

### Live-Worker und Rollback

| Worker | Aktive Version / Alter | Bindings | 24 h | Trigger / Route | Rollback |
|---|---|---|---|---|---|
| `wrn-translation-cache` | `4652db41`, vor 12 Tagen, manuell via Wrangler | 1 Rate Limiter, 1 Service Binding zu `revolution-proxy`, 1 SQLite-DO, 1 KV | 124 Aufrufe, 0 Fehler, 862 µs angezeigte CPU-Zeit | kein Cron; eine `workers.dev`-Domain | 10 sichtbare Versionen; Plattform erlaubt Rollback auf bis zu 100 gespeicherte Versionen |
| `revolution-proxy` | `039864f6`, vor 13 Tagen, manuell via Wrangler | 4 Rate Limiter, 1 R2-Bucket, 2 SQLite-DO | 85 Aufrufe, 0 Fehler, 3.356 µs angezeigte CPU-Zeit | stuendlich bei Minute 23; zusaetzlich Service-Binding-`fetch()` vom Cache-Worker; eine `workers.dev`-Domain | 40 Versionen; Plattform erlaubt Rollback auf bis zu 100 gespeicherte Versionen |
| `wrn-shared-translations` | `b91af433`, vor 34 Tagen, manuell via Dashboard | keine | 0 Aufrufe, 0 Fehler, 0 µs | kein Cron; eine `workers.dev`-Domain | 2 sichtbare Versionen; historische oder anderweitige Nutzung `UNVERIFIED` |

Der dritte Worker `wrn-shared-translations` fehlt im lokalen
`LOCAL-CONFIG`-Inventar. Er hatte im beobachteten 24-Stunden-Fenster 0 Aufrufe,
besitzt keine Bindings und keinen Cron, bleibt aber ueber `workers.dev`
adressierbar. Historische oder anderweitige Nutzung ist `UNVERIFIED`; er darf
nicht ohne separaten Lifecycle-/Loeschentscheid entfernt werden.

Alle drei Worker haben Workers Logs aktiviert und Traces deaktiviert. Auf dem
Free-Plan bedeutet das laut aktueller Dokumentation drei Tage native
Logaufbewahrung. Es wurden keine Logs oder Loginhalte geoeffnet.

### Laufzeit und Featureflags

| Worker | Compatibility | Livebeleg |
|---|---|---|
| `wrn-translation-cache` | `2026-07-27`, Flag `global_fetch_strictly_public` | 5 Textvariablen, 0 Secrets; nur freigegebene Werte gelesen: Cache-TTL 604.800 Sekunden, Translation aktiv, KV-Write-Limit 950/Tag |
| `revolution-proxy` | `2026-08-05`, Flag `nodejs_compat` | 8 Textvariablen, 7 verschluesselte Secrets; Secret-Namen/-Werte nicht inventarisiert. Freigegebene Werte: Translation aktiv, Podcastgenerierung aktiv, Translation 950/Tag, Feedback 250/Tag, Azure 475.000 Zeichen/Monat, R2-Appgrenze 9.663.676.416 Bytes |
| `wrn-shared-translations` | `2026-07-19`, keine sichtbaren Flags | keine Bindings, kein Cron; 0 Aufrufe im beobachteten 24-Stunden-Fenster |

Die Livewerte entsprechen der lokalen Legacykonfiguration. Translation und
Podcast sind damit im Altbetrieb nicht nur historische Kommentare, sondern
aktivierte Laufzeitpfade. Die Quoten sind Anwendungskontrollen, keine
verifizierten Hard Caps in Google/Azure/Hugging Face.

### Hochrisikofunktionen, Kill-Switches und Hard Caps

Die Workeraufrufe wurden nicht ausgeloest oder nach Inhalt analysiert. Ein
aktiver Konfigurationswert belegt deshalb einen freigeschalteten Laufzeitpfad,
nicht dessen tatsaechliche Nutzung oder die Wirksamkeit eines Schalters.

| Funktion | Legacy-Livestatus | Beobachtbarer lokaler Schalter | Globaler/Provider-Hard-Cap | Fail-closed-Beleg | Status und Gate |
|---|---|---|---|---|---|
| Translation | Konfigurationswert aktiv; funktionsbezogene Requests `UNVERIFIED` | benannte Variable sichtbar; Abschaltung ohne Codeaenderung/Deploy nicht getestet | lokale Tages-/Monatsquoten sichtbar, aber kein Provider- oder globaler Billing-Cap belegt | `UNVERIFIED`, da kein Request ausgeloest wurde | `YELLOW`; SEC-001, R-12/R-24/R-30 vor Portierung |
| Podcast | Konfigurationswert aktiv; funktionsbezogene Requests `UNVERIFIED` | benannte Variable sichtbar; Abschaltung ohne Codeaenderung/Deploy nicht getestet | lokale R2-Grenze sichtbar, aber kein globaler Operations-/Provider-Cap belegt | `UNVERIFIED` | `YELLOW`; SEC-002, R-25/R-26/R-29 vor Aktivierung |
| Feedback | lokale Tagesquote 250 sichtbar; Aktivitaet `UNVERIFIED` | kein separater Kill-Switch im freigegebenen Livewertsatz belegt | lokale Quote ist kein globaler Kosten-/Kapazitaets-Hard-Cap | `UNVERIFIED` | `YELLOW`; R-25/R-26/R-29 vor Portierung |
| Push | Aktivitaet `UNVERIFIED` | kein Schalter im freigegebenen Livewertsatz belegt | kein globaler Kapazitaets-/Kosten-Cap belegt | `UNVERIFIED` | `YELLOW`; SEC-003/R-25 vor Aktivierung |

Ein dienstuebergreifender globaler Kosten-Kill-Switch oder Billing-Hard-Cap ist
ebenfalls `UNVERIFIED`. Fuer das neue Ziel bleiben alle vier Funktionen aus,
bis ein eigener Task Schalter, harte Obergrenzen, Fail-closed-Tests und Owner
belegt. Die Tabelle ist eine Inventarbewertung, keine Live-Aenderungsanweisung.

### R2, Lifecycle und Zugriff

Es existiert ein Standardklasse-Bucket `worldrevnews-podcasts`, Region
Osteuropa (EUR), erstellt am 15. Juli 2026. Oeffentliche Entwicklungs-URL,
Custom Domain, CORS, Data Catalog, Event Notifications und On-Demand-Migration
sind deaktiviert. Es gibt keine Bucket-Locks.

Ohne Objekte oder Inhalte zu oeffnen wurden vier Praefixe sichtbar:
`podcasts/`, `feedback/`, `operations/` und `usage/`. Nur `podcasts/` besitzt
eine aktive Loeschregel nach 30 Tagen. Multipart-Uploads werden nach sieben
Tagen abgebrochen. Fuer `feedback/`, `operations/` und `usage/` ist **keine
R2-Lifecycle-Loeschregel** sichtbar. Damit ist die akzeptierte 90-Tage-
Feedbackobergrenze nicht auf Bucketebene belegt; ein Worker-interner Loeschpfad
bleibt unbewiesen. Das ist ein Privacy-/Retention-Gate vor jeder Portierung.

### Kosten-/Limitbaseline aus offiziellen Dokumenten

Die Zahlen gelten nur fuer den jeweils genannten Tarif. Diese Dokumentquellen
allein beweisen den WRN-Livezustand nicht; der separate Livebefund zu aktivem
Free-Plan und aktueller Nutzung steht oben.

| Produkt | `OFFICIAL-DOC` am 23.08.2026 | WRN-Auswirkung |
|---|---|---|
| Workers Free | 100.000 Requests/Tag, 10 ms CPU/Invocation, 5 Cron Trigger/Account | kann hart fehlschlagen; separater Livebefund oben bestaetigt Free-Plan und beobachtete Gesamtnutzung |
| Workers Paid Standard | mindestens 5 USD/Monat; 10 Mio. Requests und 30 Mio. CPU-ms/Monat enthalten, danach 0,30 USD/Mio. Requests und 0,02 USD/Mio. CPU-ms | Service Bindings erzeugen im Standardmodell keine zweite Requestgebuehr; CPU summiert sich |
| Workers KV Free | 100.000 Reads/Tag; je 1.000 Writes/Deletes/Lists pro Tag; 1 GB Storage | Dashboard-/Wrangler-Operationen zaehlen ebenfalls; separater Liveverbrauch steht oben |
| R2 Standard Free Tier | 10 GB-Monate, 1 Mio. Class-A- und 10 Mio. Class-B-Operationen/Monat; Internet-Egress frei | lokale 9-GiB-Appgrenze ist wegen GB/GiB und Operationen kein belastbarer Kosten-Cap |
| R2 Standard danach | 0,015 USD/GB-Monat; 4,50 USD/Mio. Class A; 0,36 USD/Mio. Class B | Lifecycle und Operationsmessung vor Aktivierung erforderlich |
| Durable Objects Free | SQLite-Backend; 100.000 Requests und 13.000 GB-s pro Tag | drei SQLite-Namespaces und deren Tagesnutzung sind separat live erfasst; Backenddetails bleiben ausserhalb des Liveinventars |
| Workers Logs Free/Paid | Free: 200.000 Events/Tag und 3 Tage; Paid: 20 Mio./Monat enthalten, danach 0,60 USD/Mio., 7 Tage | native Retention ist kuerzer als PO-008-Maximum 30 Tage; kein Widerspruch, aber Supportkonzept muss 3/7 Tage beruecksichtigen |

Offizielle Quellen:

- <https://developers.cloudflare.com/workers/platform/pricing/>
- <https://developers.cloudflare.com/workers/platform/limits/>
- <https://developers.cloudflare.com/kv/platform/pricing/>
- <https://developers.cloudflare.com/r2/pricing/>
- <https://developers.cloudflare.com/durable-objects/platform/pricing/>
- <https://developers.cloudflare.com/workers/observability/logs/workers-logs/>
- <https://developers.cloudflare.com/workers/configuration/cron-triggers/>

## Hostinger – Livehosting, Kosten und Rollback

Read-only hPanelquelle: 23. August 2026, 10:57–11:02 UTC.

| Bereich | `LIVE`-Befund | Bewertung |
|---|---|---|
| Produkt | `Business Web Hosting`, Websiteart PHP/HTML | entspricht der statischen Websitegrenze; kein Website Builder |
| Kapazitaet | 2,22 GB von 200 GB, 2.690 von 600.000 Inodes, 4 von 100 Websites; Bandbreite unbegrenzt | viel Reserve; keine Kapazitaetsmigration noetig |
| Standort | Server Frankfurt, Backups Frankreich | Region im Datenfluss-/Privacyregister festhalten |
| Releasepfad | Uploadpfad `public_html`; Hostinger-Git-Seite bietet erst „Mit GitHub verbinden“ an | kein GitHub-Deployment verbunden; aktuell kein commitgebundener Release-/Rollbackbeleg |
| CDN | Hostinger CDN aktiv | Website-CDN liegt bei Hostinger, nicht Cloudflare; Cloudflare-Account besitzt keine Zone |
| Cache Manager | automatischer Cache aus; UI nennt sonst 30-Minuten-Leerung | kein Hostinger-Auto-Cache; CDN-Cache bleibt getrennt zu behandeln |
| Backups | taeglich; letztes 23.08.2026 10:54, naechstes 24.08.2026 | 24 sichtbare Datei-Restorepunkte vom 12.07. bis 23.08.2026; keine Datenbankbackups sichtbar |

Ein Restore wurde nicht gestartet. Die Website kann dateibasiert auf einen
sichtbaren Backupzeitpunkt zurueckgesetzt werden; dies ist aber kein
commitgebundener Release-Rollback. Dateiinhalte, Aktivitaetsprotokoll, IPs und
FTP-Zugangsdaten wurden nicht geoeffnet oder persistiert.

### Verifizierte spaetere Verlaengerungskosten

| Abonnement | Ablauf | Auto-Renew | naechster Zeitraum / Preis inkl. Steuern |
|---|---:|---|---:|
| Business Web Hosting | 09.08.2028 | aus | 48 Monate / 383,52 EUR = 7,99 EUR pro Monat |
| `.com`-Domain `solinaridao.com` | 14.10.2028 | an | 36 Monate / 50,97 EUR = 16,99 EUR pro Jahr |

Diese Werte sind zukuenftige Verlaengerungspreise, keine aktuelle monatliche
Abbuchung. Die deaktivierte automatische Hostingverlaengerung ist ein spaeteres
Betriebskontinuitaetsrisiko, aber wegen des Ablaufs 2028 kein aktueller Blocker.

Offizielle Quellen:

- <https://www.hostinger.com/support/5981435-how-to-download-backups-at-hostinger/>
- <https://www.hostinger.com/support/6436203-hostinger-website-builder-how-to-create-and-restore-website-backups/>

## Optionale Provider – offizieller Privacyrahmen, Konten offen

| Provider | `OFFICIAL-DOC` | Noch `UNVERIFIED` |
|---|---|---|
| Gemini Developer API | Paid Services nutzen Prompts/Antworten nicht zur Produktverbesserung, protokollieren sie aber begrenzt zur Missbrauchserkennung; echte Zero-Data-Retention erfordert eine genehmigte ZDR-Konfiguration. Search/Maps Grounding speichert Kontext und Ausgabe 30 Tage. | aktives Projekt, Paid-/Unpaidstatus, ZDR, Grounding, Region, Quota und Budget |
| Azure Translator | Text Translation verarbeitet ohne Speicherung; Document Translation speichert nur waehrend der Verarbeitung und loescht danach hart. Standardtranslation wird nach Zeichen berechnet; F0 nennt 2 Mio. Zeichen/Stunde. | aktive Ressource, Region, Tarif, 475.000-Zeichen-Cap und Diagnoseeinstellungen |
| Hugging Face Inference Providers | Hugging Face speichert beim Routing keine Request-/Response-Bodies; Debuglogs bis 30 Tage enthalten laut Dokumentation keine Nutzerdaten/Tokens. Die Richtlinie des tatsaechlichen Inference Providers gilt zusaetzlich. | aktiver Provider/Modellweg, Plan, Region, Providerpolicy, Quota und Kill-Switch |

Das Cloudflare-Livekonto belegt acht Klartextvariablen, sieben verschluesselte
Secrets und aktivierte Legacy-Translation-/Podcastpfade. Es wurden keine
Secret-Namen oder -Werte in den Bericht uebernommen. Separate Google-, Azure-
oder Hugging-Face-Konten waren nicht Teil der bereitgestellten Sitzungen;
deren aktiver Plan, echte Providerquota, Region und Rechnung bleiben daher
`UNVERIFIED`. Fuer die neue Architektur bleiben diese Adapter gemaess PO-011
bei 0 CHF und deaktiviert, bis ein eigener Provider-/Budgettask sie freigibt.

Offizielle Quellen:

- <https://ai.google.dev/gemini-api/docs/zdr>
- <https://ai.google.dev/gemini-api/terms>
- <https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/translator/data-privacy-security>
- <https://learn.microsoft.com/en-us/azure/ai-services/translator/service-limits>
- <https://huggingface.co/docs/inference-providers/en/security>

## Kosten-/Privacyurteil nach Review

1. Cloudflare Free ist beim beobachteten Alttraffic kostenneutral und fuer die
   spaetere modulare Workertrennung technisch plausibel. Das ist noch keine
   Freigabe, die drei Legacyworker unveraendert zu portieren.
2. Neue optionale Provider bleiben gemaess PO-011 auf 0 CHF Default und aus.
   Die live bestaetigten lokalen Quoten sind kein Abrechnungs-Hard-Cap.
3. Remoteuebersetzung darf gemaess PO-006 nur nach expliziter Nutzeraktion
   erfolgen. Provideradapter muessen No-Content-Logging, Retention und
   providerbezogene Kill-Switches erzwingen.
4. Die R2-Podcast-Loeschung nach 30 Tagen ist live belegt; Feedback/Operations/
   Usage besitzen keine sichtbare Lifecycle-Loeschung. R-26/R-29 bleiben offen.
5. Worker-Rollback ist versioniert, Hostinger-Rollback dagegen backupbasiert
   und nicht an Git-Commits gebunden. Der neue Releaseweg muss beides strikt
   trennen und reproduzierbar machen.
6. Hostinger ist bis 2028 vorausbezahlt; die spaetere bekannte Hosting-/Domain-
   Verlaengerung entspricht zusammen 112,87 EUR pro Jahr im jeweiligen
   Folgezeitraum. Automatische Hostingverlaengerung ist aktuell aus.

## Abschlussreview und verbleibende Produktgates

Der Bericht enthaelt absichtlich keine Account-/Namespace-IDs, E-Mail-, IP-,
FTP-, Zahlungs-, Secret- oder Logdaten. Der unabhaengige Security-/Privacy-
Review bestaetigte die Redaktionsgrenze und Retentionbewertung nach den oben
eingearbeiteten Praezisierungen. Providerkonten sowie Live-Kill-Switch-/Hard-
Cap-Wirkung bleiben als `UNVERIFIED` dokumentiert und werden im neuen Produkt
nicht aktiviert. R-26/R-29, SEC-001–003 und die jeweiligen Servicegates bleiben
offen; sie verhindern nicht die rein lokale, dienstfreie Foundation.
