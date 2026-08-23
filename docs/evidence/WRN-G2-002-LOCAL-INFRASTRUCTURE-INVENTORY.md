# WRN-G2-002 – Lokales Infrastruktur-Inventar

Stand: 23. August 2026
Beweisgrenze: nur eingecheckte Dateien der autoritativen Legacyquellen; kein
Cloudflare-/Provider-Login, keine Secretwerte, keine Liveabfrage, keine Mutation.

## Nachweisbarer lokaler Iststand

| Bereich | Beobachtung | Bewertung fuer Zielarchitektur |
|---|---|---|
| Android-Wrapper | Capacitor 8.4.0; App-ID `com.world.revolution`; `minSdk 24`, `compileSdk/targetSdk 36`; VersionCode 26/Version 2.1.1 | brauchbare Baseline, aber keine neue Toolchainentscheidung |
| Website | statisches Apache-/Hostinger-Paket ohne Buildsystem | getrennte Website-Release-/Rollbackkette erhalten |
| Worker-Paket | Wrangler 4.114.0 und `web-push` 3.6.7 | lokale Versionsangabe, kein Livebeleg |
| Translation Cache | eigenes Worker-Config, KV-, Service-, Durable-Object- und Rate-Limit-Bindings; `compatibility_date` 2026-07-27 | Service ruft den Proxy ueber Binding auf; Cachekey-Finding SEC-001 bleibt offen |
| Revolution Proxy | ein Worker-Config fuer mehrere Verantwortungen; R2-, Durable-Object- und Rate-Limit-Bindings, Cron; `compatibility_date` 2026-08-05 | Ziel verlangt getrennte Deploy-/Rollbackeinheiten fuer Gateway, Translation, Feedback, Podcast und Push |
| Lokale Flags | Translation und Podcastgenerierung sind im eingecheckten Altconfig aktiviert | keine Aussage zum Livezustand; neue Hochrisikofunktionen bleiben gemaess PO-005–007 standardmaessig aus/gated |
| Lokale Quoten | Translation 950/Tag, Feedback 250/Tag, Azure 475.000 Zeichen/Monat, Podcast-R2 9 GiB | Konfigwerte sind kein nachgewiesener Hard Cap und kein Kostenbeleg |
| Retention | Translation-TTL 604.800 Sekunden; README/Privacy nennen u. a. Podcast 30 und Feedback 90 Tage | Live-Lifecycle, Providerretention und End-to-End-Loeschung unbewiesen |
| Clientendpunkte | Altclients referenzieren Raw/GitHub-Pages-Daten sowie zwei `workers.dev`-Endpunkte; Website-CSP erlaubt diese | Ziel braucht versionierte Adapter und immutable Revision statt beweglicher Quelle |

## Lokal erkennbare Dienstbeziehung

```text
Mobile App / Website
   |-- oeffentliche Contentquellen (Legacy: bewegliche GitHub-Pfade)
   |-- wrn-translation-cache Worker
   |       |-- KV
   |       |-- Rate Limit / QuotaCoordinator
   |       `-- Service Binding -> revolution-proxy
   `-- revolution-proxy Worker
           |-- Translation / Feedback / Podcast / Push-Logik gebuendelt
           |-- R2
           `-- Durable Objects / Rate Limits / Cron
```

Diese Darstellung beschreibt Code-/Konfigurationsbeziehungen, nicht den
aktuellen Cloudflare-Livezustand.

## Abweichung zum akzeptierten Ziel

Der Altstand besitzt zwei sichtbare Worker-Deployables. ADR-005 und R-34
verlangen dagegen mindestens getrennte physische Deploy-/Rollbackgrenzen fuer:

1. Content Gateway,
2. Translation,
3. Feedback,
4. Podcast,
5. Push.

Gemeinsame Bindings/Infra duerfen spaeter geteilt werden, muessen aber
rueckwaertskompatibel und unabhaengig migrierbar sein. Die Legacyworker werden
nicht veraendert.

## Vor Serviceimplementierung live zu verifizieren

- tatsaechlich deployte Worker, Versionen, Routes und `compatibility_date`;
- existierende Bindingarten und Zielressourcen, ohne Secretwerte anzuzeigen;
- Cloudflare-Plan, aktuelle Nutzung, Kosten und wirksame Limits;
- R2-Lifecycle, KV-/DO-Nutzung, Cron und Observability-Retention;
- aktive Featureflags und echte Aufrufpfade;
- Providervertraege/-regionen/-retention fuer Google/Azure/Hugging Face;
- Kill-Switches, Hard Caps, Loesch-/Widerrufpfade und Rollbackstand.

Dieses Liveinventar braucht einen eigenen, ausdruecklich autorisierten
read-only Task. Es blockiert Cloudflare-/Servicearbeit, aber nicht die spaetere
rein lokale Workspace-Foundation nach `GO-IMPLEMENTATION`.

## Cloudflare-Konfigurationsregeln fuer den Neustart

- Wrangler-Config bleibt deklarative Quelle der Wahrheit.
- Neue Worker verwenden JSONC und eine bewusst getestete aktuelle
  `compatibility_date`; kein blindes Datum-Upgrade.
- Secretwerte stehen nie unter `vars` oder im Repository.
- Ein behaupteter unabhaengiger Rollback erfordert ein eigenes Deployable.
- Keine lokale Konfiguration wird als Live-, Kosten- oder Sicherheitsbeweis
  ausgegeben.
