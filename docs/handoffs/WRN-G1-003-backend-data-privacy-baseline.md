# Agent Handoff – WRN-G1-003

- Agent: `backend_data_reliability_engineer` im read-only Modus
- Task-ID: `WRN-G1-003`
- Ergebnis: **YELLOW – Analyse abgeschlossen, konkrete High-Risiken**
- App-Quellstand: `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Daten-Snapshot: `acec88ef40814f70c1bb45001e397a6ca5872ed7`

## Kurzfazit

Der aktuelle Datenvertrag besteht primaer aus beweglichen JSON-Feeds auf
GitHub Pages mit Raw-GitHub-Mirror. Kosten- und personenbezogene Sonderpfade
laufen ueber einen Uebersetzungs-Cache-Worker und einen Proxy-Worker mit KV,
R2, Durable Objects und Rate Limits. Die beabsichtigten Schutzmechanismen sind
im Code konkret, ihr aktueller Deploymentzustand ist aber unbekannt.

Am fest gebundenen Datencommit fehlen mehrere Dateien, die die produktive
Clientkonfiguration anfordert: Bibliothek, Video und redaktionelle
Entscheidungen. Das ist eine reale Vertragsluecke, nicht nur ein historischer
Hinweis. Weitere High-Risiken betreffen bewegliche Datenrevisionen,
Uebersetzungsuebertragung an externe KI-Anbieter sowie Retention und Loeschung
von Feedback- und Pushdaten.

Der Main Agent bestaetigte die Datenrepo-404s, die Clientpfade,
Worker-Bindings, Limits und Retentionskonstanten unabhaengig. Dabei wurde ein
zusaetzlicher Driftbefund sichtbar: Die wirksame Podcast-Speichergrenze liegt
laut Code und Wrangler bei 9 GiB, waehrend ein Codekommentar noch 7 GiB nennt.

## Quellenstaende und Evidenzgrenze

| Quelle | Stand | Bewertung |
|---|---|---|
| App | `wrn-github-app-current@2216ff3` | lokal sauber; massgebliche App-Baseline |
| Runtime | `968c320` | historischer sichtbarer Releasecommit |
| Datenrepo | `Blackfront161/Revolution-News-Data@acec88e` | commitgebunden mit GitHub-Connector gelesen |
| Feedstatus | `generatedAt 2026-08-21T11:36:54.799310Z`, Version `2.0.0` | 2.000 Newsarchiv-, 500 Feed-, 1.000 Eventarchiv- und 365 Eventfeedeintraege |
| Quellenaggregation | gleicher Feedstatus | 257 konfiguriert, 216 versucht, 41 durch Health uebersprungen |
| Quellenregistry | Schema 2, Version `1.8.2` | 410 aktive Quellen, 17 bekannte Sprachcodes |
| Website | `9a59b17` | nur als getrennter Verbraucher desselben Datenvertrags beruecksichtigt |
| Workerbericht | `cloudflare/DEPLOYMENT-REPORT.md`, 27. Juli 2026 | historischer Beleg, kein aktueller Livebeweis |

`main` des Datenrepositories bleibt beweglich. Der Analysehash ist ein
reproduzierbarer Beleg, keine dauerhaft eingefrorene Produktionsrevision.

## Systemkontext und Vertrauensgrenzen

```text
Externe RSS-, Radar-, Podcast- und Medienquellen
                       |
                       v
Revolution-News-Data: bewegliche JSON-Feeds, Health, Registries
                       |
              GitHub Pages + Raw-Mirror
                       |
             +---------+----------+
             v                    v
         Android/App           Website
       eigener Cache       eigener Cache/SEO
             |
             +-- lokale IndexedDB/localStorage/Cache Storage

Bewusste Sonderaktionen
  Uebersetzung --> Translation Cache/KV --> Proxy --> Gemini/Hugging Face
  Podcast      --> Proxy --> Azure Speech --> R2
  Feedback     --> Proxy --> R2 + optional E-Mail --> Admin-Inbox
  Push         --> Proxy --> PushGateway DO --> Endgeraete
```

App und Website duerfen Datenvertraege teilen, aber keine Service Worker,
Cacheversionen oder Releaseketten. Externe Inhalte, KI-/Speech-Provider,
R2/KV/DO und lokale Geraetespeicher sind jeweils eigene Trust Boundaries.

## Cloudflare-Service- und Endpointmatrix

| Dienst / Aktion | Zweck und Daten | Schutz / Cache / Quota | Unbekannt oder Fallback |
|---|---|---|---|
| Translation Cache `POST /`, `action=translate` | Titel bis 500, Text bis 6.000 Zeichen, Zielsprache/Modus | explizite Origins; 60/min nach IP+Client; SHA-256-Key; KV `TRANSLATIONS`; TTL mindestens 3.600, konfiguriert 604.800 s | Cache-HIT vor Upstream; ohne KV Edge Cache; aktuelles Deployment unbekannt |
| Proxy `POST translate` | Uebersetzung, Legacy-Prompt bis 12.000 Zeichen | max. 40 KB Body; 20/min; DO-Quota vor Upstream | fail-closed bei Quota-Ausfall; Providerfolge im Code Gemini/Hugging Face |
| `GET podcast.list/status/audio` | oeffentliche Metadaten und R2-Audio, Range-Support | Originpruefung; kein Nutzerkonto | fehlendes R2 ergibt Fehler; abgelaufene Objekte sollen bereinigt werden |
| `POST podcast.generate` | Artikeltext/Titel an Azure Speech, Audio nach R2 | 2/min; 475.000 Zeichen/Monat; 25 MB je MP3; Kill-Switch | lokale Browserstimme als Clientfallback; reale Azure-/R2-Konfiguration unbekannt |
| `POST feedback.submit` | Kategorie, Nachricht, optionale Kontaktadresse | 3/min; 250/Tag; R2 unter `feedback/`; Code-Retention 90 Tage | optionale E-Mail; UI-Mailto/Kopieralternative; deployed Loeschung unbewiesen |
| Admin-Feedback/-Operations/-Push | Inbox, Quoten, Pushstatus und Versand | Bearer-Admin-Token plus Origin | Werte nicht untersucht; Liveaktivierung unbekannt |
| `GET push.config`, `POST push.subscribe/unsubscribe` | Endpoint, Pushschluessel, Praeferenzen, Sprache, Zeitzone, Appversion | Opt-in; 6/min; PushGateway DO | fehlende VAPID-Konfiguration fail-closed; 404/410-Abos werden geloescht |
| QuotaCoordinator DO | Tages-/Monatszaehler | starke Koordination je Metrik | unverfuegbarer Guard blockiert neue kostenrelevante Arbeit |
| PushGateway DO | Pushsubscriptions und Broadcast | max. 2.500 Empfaenger; Batches zu 40; Quiet Hours/Filter | reales Android-/VAPID-Verhalten offen |

Statische Bindings: `TRANSLATIONS` (KV), `PODCAST_BUCKET` (R2),
`QUOTA_COORDINATOR`, `PUSH_GATEWAY`, `PROXY_SERVICE` und vier Rate-Limiter.
Nur Namen und Zweck wurden geprueft; keine Secretwerte.

Der historische Bericht nennt bestimmte Worker-Versionen und Workers-Free,
aber nur fuer den 27. Juli 2026. Tarif, Deploymentversionen, Bindings,
R2-Lifecycle, CORS und Usage am 21. August sind dadurch nicht bewiesen.

## Datenvertrags- und Ownershipmatrix

| Bereich | Produzent / Speicher | Konsument / Vertrag | Aktualisierung, Offline und Luecke |
|---|---|---|---|
| News | Datenrepo: `news-feed.json`, `news.json`, Archiv | App/Website; Herkunft, Original-URL, Datum, Sprache, Inhalt, Klassifikation | hochdynamisch; News besitzt IndexedDB-/Legacy-Fallback |
| Events / Action Radar | `events-feed.json`, `events.json`, externe Quellen | Eventmodule; Zeit, TZ, Ort, Koordinaten, Tags, Links | Events offline; freiwilliger Nutzerstandort getrennt und laut Code lokal |
| Quellen/Health | `sources-registry.json`, `source-health.json` | Quellenpass, Filter und Aggregator | Registry/Health enthalten URL, Status und Fehlerhistorie; defekte Quellen nachweisbar |
| Originalpodcasts/Radio | `podcasts.json`, `radio-stations.json`, `radio-health.json` | Audio-Hub | externe Hosts; Health kann leer/`unknown` sein; UI soll nicht automatisch starten |
| generierte Podcasts | Proxy/R2; Snapshot `generated-podcasts.json` | ID, Titel, Quelle, Sprache, Modus, Stimme, Zeit, Groesse, Audio-/Artikel-URL | 30-Tage-Absicht; Metadaten oeffentlich und nicht zwingend unkritisch |
| Bibliothek | Config fordert `library-sources/feed/health.json` | Bibliotheksmodule | alle drei Dateien bei `acec88e` nicht vorhanden; Ownership/Fallback ungeklaert |
| Video | Config fordert `video-feed/health/sources-registry.json` | Video-Hub | alle drei Dateien bei `acec88e` nicht vorhanden; lokale App-Artefakte sind kein Produktionsbeweis |
| Aktionen | verifizierte Aktionen plus Event-/Dossierdaten | Solidaritaets-/Action-UI | Keywords duerfen nicht als redaktionell verifiziert gelten; Ownership offen |
| Hilfe/Gefangenensolidaritaet | lokale Daten- und UI-Module | Hilfe-Finder/Solidaritaet | Hilfe ohne Geolocation; kuenftige redaktionelle Ownership und Aktualitaet offen |
| Feedback | Client --> Proxy --> R2 / optional E-Mail | Admin-Inbox | Nachricht/Kontakt bis Loeschung; Code-Retention ist kein Livebeweis |
| Push | Client --> Proxy --> PushGateway DO | Browser/Android | Endpoint, Kryptomaterial und Praeferenzen bis Unsubscribe/Pruning |
| Diagnostik | lokale Module | Nutzerexport | behauptete Redaction/Maximalzahl braucht spaetere Runtimepruefung |

Zusaetzlich fehlte am Snapshot `editorial-decisions.json`, obwohl die
Clientkonfiguration diese Datei sowohl fuer Pages als auch Raw-Mirror nennt.

## Privacy- und lokale Speicherfluesse

- **Uebersetzung:** bewusste Aktion, Cache, Proxy, dann Gemini/Hugging Face.
  Artikeltext und Titel verlassen das Geraet. Providerkonfiguration, Retention
  und produktive Logs sind unbekannt.
- **Azure-Podcast:** bewusste Aktion, Proxy, Azure Speech, danach oeffentliche
  R2-Audio-/Metadaten. Kein Username bedeutet nicht automatisch keine
  Privacy-/Abusegrenze.
- **Feedback:** Nachricht und optionale E-Mail gehen an Proxy, R2 und eventuell
  E-Mail. Adminroute ist statisch token-geschuetzt; realer Lifecycle und
  Auskunfts-/Loeschprozess sind unbewiesen.
- **Push:** explizites Opt-in; DO speichert Endpoint, Kryptomaterial,
  Praeferenzen, Sprache, Zeitzone und Version. Unsubscribe ist implementiert,
  reale Loeschung/Permission nicht getestet.
- **Hilfe:** laut Code/Visualbeleg ohne Standort und ohne dauerhafte
  Eingabe. Diese Grenze darf nicht mit Action Radar vermischt werden.
- **Action Radar:** Standort nur nach Nutzeraktion; Distanzberechnung ist
  statisch lokal plausibel. End-to-End-Netzwerkbeleg fehlt.
- **Offline:** IndexedDB `world-revolution-news` mit Stores `datasets` und
  `translations`; News/Events besitzen explizite Network-first-Fallbacks.
  Weitere Feeds, TTL, Loeschung und Migration sind uneinheitlich.

## Kosten-, Quota- und Fallbackmatrix

| Abhaengigkeit | Statischer Schutz | Offener G2-Messpunkt |
|---|---|---|
| Gemini/Hugging Face | cache-first, 950 neue Uebersetzungen/Tag, 20/min, Kill-Switch | aktive Modelle/Keys, Tarife, Usage, Retention |
| Azure Speech | 475.000 Zeichen/Monat, 2 Generierungen/min, Kill-Switch | Tarif, Istverbrauch, Zeichen-/Audioverhaeltnis |
| KV | 950 persistente Writes/Tag, Edge-Fallback | Binding und realer Writeverbrauch |
| R2 | 9 GiB Grenze, 25 MB/MP3, 30-Tage-Absicht | Bucketgroesse, Public Access, Lifecycle und Pruning |
| Worker Runtime | Observability 10-%-Sampling, fail-closed Quoten | aktueller Plan, Requests, CPU, Alarme |
| Feedback-E-Mail | optionales Binding, Rate/Quota | Provider, Preis, Zustellung und Datenvertrag |
| Push | VAPID, max. 2.500/Broadcast | Aktivierung, Anzahl Abos, Androidverhalten |
| externe RSS/Medien | Health/Fallbacks | Rechte, Rate Limits, Verfuegbarkeit je Quelle |

Keine Preise wurden erfunden. Der Kommentar oberhalb der wirksamen
9-GiB-Grenze spricht faelschlich von 7 GiB; G2 darf Kommentare nicht als
Kostenquelle verwenden.

## Vorhandene Testpfade – nicht ausgefuehrt

### Cloudflare und Quoten

- `cloudflare/tests/quota-client.test.mjs`
- `cloudflare/tests/operations.test.mjs`

### Daten, Herkunft und Medien

- `tests/test_news_app_2_live_data.js`
- `tests/test_sources_registry_metadata.py`
- `tests/test_source_passport_21.js`
- `tests/test_source_filters.js`
- `tests/test_source_archive.py`
- `tests/test_source_archive_assets.py`
- `tests/test_language_origin.js`
- `tests/test_audio_source_schema.py`
- `tests/test_event_source_expansion.py`
- `tests/test_generated_podcast_library.js`
- `tests/test_library_catalog.py`
- `tests/test_video_portal_contract.js`
- `tests/test_video_pipeline.js`
- `tests/test_video_pipeline_assets.py`
- `tests/test_video_hub.js`
- `tests/test_video_assets.py`

### Offline, Privacy, Feedback und Translation

- `tests/test_offline_persistence_21.js`
- `tests/test_product_21_offline_assets.py`
- `tests/test_fast_start_atomic_cache.js`
- `tests/test_shared_translation_client.js`
- `tests/test_home_translation_layout.js`
- `tests/test_feedback_delivery.js`
- `tests/test_origin_safety.js`
- `tests/test_operations_status.py`
- `tests/test_solidarity_worker_fallback.js`
- `tests/test_prisoner_solidarity.js`
- `tests/test_prisoner_solidarity_assets.py`

Weitere Gates: `tests/run_contract_matrix.py`, `tests/validate_app.py`,
`.github/workflows/quality-gate.yml` und `.github/workflows/validate-app.yml`.
Keine dieser Pruefungen wurde in diesem Task ausgefuehrt.

## Priorisierte Findings

### Hoch

1. **Fehlende Feeddateien:** Library-, Video- und Editorialpfade stehen in der
   Produktionsconfig, fehlen aber am gebundenen Datencommit. Required/Optional,
   Schema, Owner, Revision und UI-Fallback muessen ein Manifest bilden.
2. **Keine Releasebindung der Daten:** Pages und Raw-`main` koennen
   unterschiedliche Revisionen liefern. Ziel braucht immutable Revision/
   Hashmanifest und sichtbare Datenversion.
3. **Deploymentbeleg veraltet:** Der Workerbericht ist mehrere Wochen aelter
   als App-/Datenbaseline. Ein spaeter autorisiertes read-only Liveinventar
   muss Version, Bindings, Plan, Lifecycle und Zeitstempel belegen.
4. **Externe KI-Uebersetzung:** Artikelinhalt geht an Drittanbieter. Es fehlen
   ein verbindlicher Privacy-/Logging-/Retentionvertrag und ein bewusster
   Provider-/Fallbackentscheid.
5. **Feedback-Retention:** R2 speichert optionale Kontaktadresse und Nachricht;
   90 Tage sind nur Codeabsicht. Lifecycle, Pruner, Datenminimierung,
   Auskunft/Loeschung und Admin-Negativtests fehlen.
6. **Pushdaten:** Endpoint, Kryptomaterial und Praeferenzen werden persistiert.
   Opt-in/Widerruf sind vorhanden, reale Loeschung und Androidverhalten fehlen.

### Mittel

7. Offline bedeutet je Datenklasse Unterschiedliches; nur News/Events besitzen
   den expliziten gemeinsamen IndexedDB-Pfad.
8. Zwei Service-Worker-Vertraege erhoehen Upgrade-/Rollbackrisiko.
9. Eventfeeds enthalten praezise Orte/Koordinaten; sie duerfen nicht mit
   Nutzerstandort zu Profilen oder Telemetrie kombiniert werden.
10. Medienverfuegbarkeit, Health und Rechte sind uneinheitlich.
11. Quoten schuetzen Provider-/Storagekosten, nicht ohne Planbeleg alle
    Worker-Request-/CPU-Kosten.
12. Oeffentliche Podcastmetadaten koennen sensible Titel, Quelle und
    Artikelbezug offenlegen; Takedown-/Abuseprozess fehlt.
13. Quellenhealth enthaelt dauerhaft defekte Quellen; Ausschluss und
    Nutzerwarnung brauchen einen Vertrag.
14. 9-GiB-Code/Config widerspricht dem 7-GiB-Kommentar und kann
    Kostenentscheidungen fehlleiten.

### Niedrig

15. Clientkonfiguration und Legacy-Defaultnamen koennen auseinanderlaufen; eine
    versionierte Contract Registry soll ungenutzte/fehlende Schluessel pruefen.

## Migrationsklassifikation

| Komponente | Entscheidung | Bedingung |
|---|---|---|
| News/Event/Quellen-Schema und Provenienz | PORTIEREN | Original-URL, Datum, Sprache und Herkunft unveraendert |
| Datenpipeline/Publikationsmodell | NOCH ENTSCHEIDEN | Owner, Generatoren, immutable Releases und fehlende Feeds klaeren |
| Archiv, stabile IDs und Deep Links | PORTIEREN | append-only-/Redirectvertrag |
| Cloudflare-HTTP-/Quota-Verhalten | PORTIEREN | CORS, Fehlercodes, Limits und fail-closed als Vertrag |
| Workerimplementierung/Bindingtopologie | NEU SCHREIBEN | erst Ziel-Privacy-, Kosten- und Betriebsvertrag |
| Translation Cache | PORTIEREN | Key/TTL/HIT/MISS erhalten; Security/Privacy Review vorher |
| Offline/IndexedDB/Service Worker | NEU SCHREIBEN | Verhalten und Tests erhalten, Migration/Loeschung vereinheitlichen |
| Medienadapter | NEU SCHREIBEN | Rechte, Health, Required/Optional und Fallbacks explizit |
| Hilfe finden | PORTIEREN | No-Geolocation, No-Persistence und Safetygrenzen unveraendert |
| Gefangenensolidaritaet | NOCH ENTSCHEIDEN | Sensibilitaet, Aktualitaet und Redaktion klaeren |
| Action Radar | NOCH ENTSCHEIDEN | Product Decision; Nutzerstandort separat absichern |
| Feedback | PORTIEREN | nur mit Datenminimierung, Retention, Admin- und Loeschvertrag |
| Push | NOCH ENTSCHEIDEN | Product Decision; Permission-, Widerruf- und Loeschbeleg |
| Legacy-/Preview-Datenpfade | ARCHIVIEREN | nur Evidenz und Regressionstests |

## Unbekannte Livezustaende und Folgepruefungen

- aktuell deployte Worker-Versionen, Bindings, Migrationen und R2-Lifecycle;
- Aktivierung von VAPID, Azure, Gemini/HF, E-Mail und Adminpfad – ohne
  Secretwerte zu lesen;
- Cloudflare-Tarif, Istzaehler, Kosten-/Usage-Alarme und reale Limits;
- beabsichtigte Optionalitaet und Ownership der fehlenden Feeddateien;
- Revision von GitHub Pages relativ zum Raw-Mirror je Release;
- Datenrepo-Generatoren/Workflows und verantwortlicher Owner;
- No-content-/No-personal-data-Logging im tatsaechlichen Deploy;
- Android-Trennung von Hilfe und Action-Radar-Permission;
- Push Permission, Unsubscribe, Endpointloeschung und Quiet Hours;
- kontrollierte Neuausfuehrung der Contract-/Failure-Tests gegen feste
  Fixtures.

## Geaenderte Dateien und Aktionen

- Fachagent: keine Aenderungen.
- Main Agent: nur dieser Handoff, Register und Projektstatus im neuen
  Governance-Repository.
- GitHub: ausschliesslich commitgebundene Lesezugriffe; keine Issues, Branches,
  Commits oder sonstige Mutationen.
- Keine Tests, Builds, Generatoren, Server, Live-Endpunkte, Deployments oder
  Secretzugriffe.

## Empfohlener naechster Schritt

Continuity Audit fuer diesen Handoff. Wegen der konkret festgestellten
High-Privacy-Risiken danach ein separater read-only Review durch
`security_privacy_reviewer`, eng begrenzt auf Uebersetzung, Feedback, Push,
Podcastmetadaten sowie Hilfe/Action-Radar-Trennung.

## WRN-AGENT-STATUS

- Task: `WRN-G1-003`
- Status: YELLOW
- Quellstand: App `2216ff3`; Daten `acec88e`
- Erledigt: Backend-, Daten-, Kosten-, Privacy- und Migrationsbaseline
- Tests: keine; lokale und GitHub-gebundene read-only Evidenzpruefung
- Offen: Continuity Audit, Security/Privacy Review und unbekannte Livezustaende
- Handoff: `docs/handoffs/WRN-G1-003-backend-data-privacy-baseline.md`
- Naechster Schritt: Continuity Audit
- END-CHECK: :)
