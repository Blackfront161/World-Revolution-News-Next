# Migrationswellen – vertikale Slices und Gates

Status: `PROPOSED`
Task: `WRN-G2-001`
Grundsatz: Keine Implementierungswelle beginnt ohne `GO-IMPLEMENTATION`.

## 1. Steuerungsregeln

- G2 erzeugt nur Dokumentation. Die hier genannten Dateien, Tests, Builds und
  Umgebungen existieren noch nicht als Zielprodukt.
- Jede Welle erhaelt einen eigenen Task Brief mit erlaubten Pfaden,
  Paritaets-/Risiko-IDs, Daten-/Privacy-/Kostenwirkung und Ruecknahmegrenze.
- Ein vertikales Slice liefert einen beobachtbaren Nutzerfluss durch Contract,
  Datenadapter, UI und QA; keine Schicht wird monatelang isoliert aufgebaut.
- App und Website koennen denselben Contract nutzen, werden aber getrennt
  gebaut, gecacht, getestet und zurueckgerollt.
- Keine Welle loescht oder veraendert Legacyquellen. Ablösung erfolgt erst nach
  nachgewiesener Paritaet und eigener Product-Owner-Freigabe.
- Blocker/High stoppen die naechste Welle. Medium braucht Owner, Frist und am
  Releasegate eine Product-Owner-Entscheidung.

## 2. Gateabfolge

```text
G2 Architekturfreigabe
        |
GO-IMPLEMENTATION / G3
        |
W1 Foundation -> W2 News -> W3 Reader/SEO -> W4 Offline
        |              |             |              |
       QA             QA            QA             QA
        +--------------+-------------+--------------+
                       |
          W5 Kernbereiche Wissen/Medien/Hilfe
                       |
          W6 sichere/gated Funktionen
                       |
          W7 Android/Website Releaseketten
                       |
                 W8 / G5 Release Candidate
                       |
            G6 nur Product-Owner-Release
```

## 3. Wave 0 – G2-Abschluss und Implementierungsbereitschaft

Diese Welle bleibt Dokumentation/read-only und ist vor `GO-IMPLEMENTATION`
erlaubt.

| Inhalt | Beleg | Gate |
|---|---|---|
| ADR-Paket und unabh. Review | ADR-001–010, Findingsdisposition | keine offenen Review-Blocker |
| Product Decisions | `G2-OPEN-DECISIONS.md` | fuer W1/W2 notwendige Entscheidungen getroffen |
| Liveinventar | Worker/Bindingsarten/Hosting/Provider/Usage/Retention, keine Secrets | zeitgestempelter read-only Bericht |
| Rechteinventar | Code, Fonts, Logos, Bilder, Medien | jedes W1/W2-Asset erlaubt oder ersetzt |
| Contractfixtures | nur Spezifikation und gebundene G1-Beispiele | Daten-/Fallbackfaelle benannt |
| Implementierungsgate | ausdruecklicher Product-Owner-Befehl | `GO-IMPLEMENTATION` |

Rollback: nicht erforderlich; Dokumentaenderungen sind ueber Git nachvollziehbar.

## 4. Wave 1 – Plattformfoundation ohne Produktfunktionsverlust

Erst nach `GO-IMPLEMENTATION`.

### Slice

Leere, reproduzierbare Workspacegrundlage mit zwei getrennten Clients,
Contract-/Domainpaketen, Test-Support, Importgrenzen und CI ohne Deployment.

### Akzeptanz

- `apps/mobile` und `apps/website` bauen/testen getrennt.
- Keine App importiert die andere; gemeinsame Pakete bleiben plattformneutral.
- Lockfile, Toolchain, Lizenzscan und Secretgrenzen sind reproduzierbar.
- CI besitzt keine produktive Deployment-, Signier- oder Uploadauthority.
- Noch keine Legacydatei oder ungeprueftes Asset ist kopiert.

### Ruecknahme

Neuen Foundationcommit verwerfen; Legacyprodukte bleiben unveraendert und
produktiv unberuehrt.

## 5. Wave 2 – Newsfeed als erstes End-to-End-Slice

Paritaet: NEWS-01/02/04/08/09, SYS-03/04
Risiken: R-05, R-06, R-22
Owner: Backend/Data fuer Contract/Gateway, Frontend/Brand fuer beide Clients,
QA fuer unabhaengige Abnahme

### Slice

Immutable Manifest v1 -> Content Gateway/Adapter -> Domainmodelle -> getrennte
Mobile-/Website-Feedansichten mit Quelle, Datum, Sprache, Tags, Lade-, Leer-,
Fehler- und Optional-absent-Zustand.

### Gates

- Required/Optional-, Schema-, Hash- und Provenienztests.
- Gleiche gebundene Revision in beiden Clients; keine Raw-`main`-Drift.
- G1-Referenzviewports, Themes, grosse Schrift, Touchziele und Tastatur.
- Slow-/Offline-Fehlerzustand ehrlich, aber noch kein vollstaendiger Offlinecache.
- Privacygate: nur oeffentliche Content-/Provenienzdaten; keine Nutzerdaten,
  kein Contentlogging im Gateway.
- Product Owner bestaetigt sichtbare Paritaet.

### Ruecknahme

Featureflag/Route auf Legacyprodukt oder statische Testansicht; Contentrevision
bleibt immutable und kann auf die letzte valide Revision zurueckzeigen.

## 6. Wave 3 – Reader, stabile Links, Archiv und Website-SEO

Paritaet: NEWS-03/06/10, WEB-01/02/03
Risiken: R-17, R-27
Owner: Website + Backend/Data; Mobile fuer App-Deep-Link; QA fuer ID-Mengen-
und Accessibilitybelege

### Slice

Artikelreader, Originalquelle, Share, stabile IDs, historischer Fallback,
Landingpages, Manifest, Canonical und Sitemap aus derselben Revision.

### Gates

- Getrennte Hashes fuer aktiven Feed, Archiv, Landingpages, Redirects und
  Sitemap-Artikel sowie die Mengenbeziehungen aus ADR-004.
- Direkter Kaltstart, `?article=`-Fallback, historische ID und Unknown/Gone.
- Escape, Fokus-Rueckkehr, Screenreader-Smoke und vollstaendiger erster Satz.
- Websitepaket bleibt statisch/Apache-kompatibel; Mobile-Deep-Link getrennt.
- Keine Landingpage wird bei normaler Generation geloescht.
- Takedown-/Revocation-Overlay ueberstimmt auch alte Revisionen und Caches.

### Ruecknahme

Vollstaendiges vorheriges Websitepaket plus kompatible Contentrevision;
Mobile-Readerfeature separat deaktivierbar.

## 7. Wave 4 – lokale Daten, Offline und Update

Paritaet: NEWS-05, HELP-02, SYS-01/02/03, AND-03
Risiken: R-07, R-22, R-26
Owner: Backend/Data fuer Storage/Migration, Mobile/Website fuer Adapter, QA fuer
Upgrade/Rollback, Security fuer Loesch-/Takedownwirkung

### Slice

Getrennte Mobile-/Website-Storages, gespeicherte Artikel, immutable
Contentrevisionen, Offline-Hilfe, Erst-/Zweitstart, Upgrade, Clear-all und
Rollbackverhalten.

### Gates

- Legacy-Key-/Store-Inventar und idempotente Migration gegen Fixtures.
- Online, Slow, Offline, Teilupdate, Storage-full, Upgrade und Rollback.
- App- und Website-Caches/Namensraeume sind getrennt.
- Keine Standortdaten im Hilfepaket; Aktualitaet und Loeschung sichtbar.
- Clear-all meldet lokalen und serverseitigen Status getrennt.

### Ruecknahme

Letzte valide Revision bleibt lesbar; kein automatisches Downgrade mit
stillem Datenverlust. Sicherer Read-only-/Bestaetigungszustand bei
Schema-Inkompatibilitaet.

## 8. Wave 5 – bestaetigte Kernbereiche Wissen, Medien und Hilfe

Diese Bereiche sind Release-1-MUST, werden aber als getrennte kleine Slices
implementiert. Jeder Slice baut auf ADR-004 auf und darf separat
zurueckgenommen werden.

| Slice / Paritaet | Owner | Daten-/Privacygate | Testbeleg | Ruecknahme |
|---|---|---|---|---|
| Briefings, Tageslage, Dossiers `NEWS-11` | Content/Data + Frontend | Provenienz, Revision, Uebersetzung nur nach W6-Vertrag | Contract, Flow, Visual, Fehler/Offline | Route/Featureflag auf letzten freigegebenen Datensatz |
| Termine `INFO-01` | Content/Data + Frontend | Zeitzone, Ort, Quelle; keine Nutzerposition | Schema, TZ-/DST-Faelle, Filter, Accessibility | Events-Slice deaktivieren, Newskern bleibt |
| Bibliothek und Lexikon `INFO-02/03` | Content/Data + Frontend | Required/Optional-Owner, Rechte, keine erfundene Verifikation | Schema, Suche, Deep Link, Offline-/Fallback | je Katalogadapter auf letzte valide Revision |
| Gefangenensolidaritaet `INFO-05` | Product Owner/Redaktion + Content/Data + Security | Aktualitaet, Sensibilitaet, Quelle, Redaction und Takedown | redaktioneller Review, Contract, Privacy, UI/A11y | Datensatz sperren/tombstonen, Modul separat deaktivieren |
| Hilfe `HELP-01–03` | Product Owner/Redaktion + Backend/Data + Security | No-Geolocation, No-Persistence, Safetygrenzen, Offlineaktualitaet | Filtermatrix, Safetytext, Offline, Loeschung, No-Transmission | letzte sichere Revision; veraltetes Paket sichtbar sperren |
| Podcastkatalog/Radio/Audio/Video `MEDIA-01–05` ohne Generierung | Media/Data + Frontend + Security | Rechte, Consent, Health, Required/Optional, kein Autoplay | Schema, Player, CSP, Tastatur, Fehler, Offline/Takedown | Adapter/Katalog einzeln deaktivieren; Kernnews bleibt |

Wave-5-Gesamtgate: alle enthaltenen MUST-Zeilen besitzen einen aktuellen
Contentowner, deterministische Fixture, G1-Paritaetsbeleg und beobachtbaren
Rollback. Fehlende Rechte oder redaktionelle Aktualitaet stoppen nur den
betroffenen Slice, werden aber nicht als bestandene Release-1-Paritaet
ausgegeben.

## 9. Wave 6 – sichere oder Product-Owner-gated Funktionen

Jeder Unterpunkt ist ein eigener Slice. Manuelle nutzergesteuerte Uebersetzung
ist MUST; ihr automatischer Modus ist optional. Die uebrigen Zeilen koennen nur
entfallen, wenn sie in der Paritaetsklassifikation als `OPTIONAL-PO` bestaetigt
sind.

| Slice / Klasse | Owner | Vorbedingung/Pflichtgate | Testbeleg und Ruecknahme |
|---|---|---|---|
| nutzergesteuerte Uebersetzung `NEWS-07` / MUST; Automatik OPTIONAL-PO | Backend/Data + Security + Frontend | PO-006 fuer Default; Provider/Privacy; SEC-001; No-Content-Logging | Cachemanipulation, Race/Fehler, expliziter Ausloeser; Kill-Switch zeigt Original |
| Feedback / optionaler Betriebsflow | Backend/Data + Security | Retention/Prozess/Owner | Referenz, Auskunft/Loeschung end-to-end; Route deaktivierbar, Daten weiter geloescht |
| generierte Podcasts `MEDIA-01`-Teil / OPTIONAL-PO | Product Owner + Backend/Data + Security | PO-007/011, SEC-002, Rechte, Moderation/Takedown | No-Side-Effect/Quota/Takedown; Kill-Switch, Lifecycle bleibt aktiv |
| Push `SYS-09` / OPTIONAL-PO | Product Owner + Backend/Data + Security | PO-005, SEC-003, Challenge/Expiry/Caps | Fantasieendpoint, Pruning, Widerruf; Versand aus, Loeschung bleibt |
| Action Radar `INFO-06` / OPTIONAL-PO | Product Owner + Frontend + Security | PO-004, getrennte Permission | Standort-No-Transmission; Modul deaktivierbar |
| Intro `UX-08` / OPTIONAL-PO | Product Owner + Frontend + QA | PO-002 und UX-Referenz | Persistenz/Visual/A11y; Route deaktivierbar |
| Zine `INFO-04` / OPTIONAL-PO | Product Owner + Frontend + QA | PO-003, Rechte/Exportumfang | Visual/Export/Print/A11y; Modul deaktivierbar |

Ruecknahme: jede optionale Route hat einen Kill-Switch/Featureflag ohne Verlust
der Kernfaehigkeiten. Bereits erzeugte Daten werden gemaess Retention/Takedown
behandelt, nicht durch Featureabschaltung vergessen. Eine deaktivierte
MUST-Uebersetzung faellt sichtbar auf den unveraenderten Originalinhalt zurueck
und ist bis zur Wiederfreigabe eine offene Paritaetsluecke.

## 10. Wave 7 – Android- und Website-Releaseketten

Paritaet: WEB-04/05, AND-01–06
Risiken: R-13, R-14
Owner: QA Release Engineer; Mobile/Website fuer ihre getrennten Kandidaten;
Product Owner allein fuer Signierung, Upload oder Deployment

### Slice

Reproduzierbare getrennte Kandidatenpipelines, Provenienzmanifeste,
Websitepaket/Hash/Rollback und Android-AAB/Hash/Signaturpruefung.

### Gates

- zwei unabhaengige Builds oder gleichwertiger Determinismusbeleg;
- Android Lint/Unit/Instrumentation/WebView/Lifecycle/API-Ziel;
- Website Apache-Smoke, Service-Worker-Upgrade/Rollback und CWV-Budgets;
- native Share-/Kalender-/Update-/Lifecyclepfade; Push nur falls PO-005/W6
  freigegeben wurde;
- Artefakt, Commit, Lockfile, Contentrevision, Tests und Hash stimmen ueberein;
- Signierung/Upload/Deployment nicht als Pipeline-Nebenwirkung.

Ruecknahme: Websitepaket auf gesicherten Stand; Worker vorherige Version;
Android ueber Compatibility-/Kill-Switch und korrigierten Build, nicht
unkontrolliertes Downgrade.

## 11. Wave 8 – G5 Release Candidate

- volle MUST-Paritaetsmatrix;
- visuelle Matrix gemaess Quality Rules;
- null offene Blocker/High;
- Security/Privacy-, Accessibility-, Offline- und Kostenreview;
- unabhaengiger Release-/Architekturreview;
- reproduzierbare getrennte Mobile-/Websiteartefakte und Rollbackbelege;
- Product Owner entscheidet ueber jede sichtbare Medium-Abweichung.

G5 erzeugt keinen Produktionsrelease. G6 bleibt eine gesonderte, explizite
Product-Owner-Operation.
