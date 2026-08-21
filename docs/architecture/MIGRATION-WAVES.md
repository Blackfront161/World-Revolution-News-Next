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
          W5 optionale sichere Funktionen
                       |
          W6 Android/Website Releaseketten
                       |
                 G5 Release Candidate
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

### Slice

Immutable Manifest v1 -> Content Gateway/Adapter -> Domainmodelle -> getrennte
Mobile-/Website-Feedansichten mit Quelle, Datum, Sprache, Tags, Lade-, Leer-,
Fehler- und Optional-absent-Zustand.

### Gates

- Required/Optional-, Schema-, Hash- und Provenienztests.
- Gleiche gebundene Revision in beiden Clients; keine Raw-`main`-Drift.
- G1-Referenzviewports, Themes, grosse Schrift, Touchziele und Tastatur.
- Slow-/Offline-Fehlerzustand ehrlich, aber noch kein vollstaendiger Offlinecache.
- Product Owner bestaetigt sichtbare Paritaet.

### Ruecknahme

Featureflag/Route auf Legacyprodukt oder statische Testansicht; Contentrevision
bleibt immutable und kann auf die letzte valide Revision zurueckzeigen.

## 6. Wave 3 – Reader, stabile Links, Archiv und Website-SEO

Paritaet: NEWS-03/06/10, WEB-01/02/03
Risiken: R-17, R-27

### Slice

Artikelreader, Originalquelle, Share, stabile IDs, historischer Fallback,
Landingpages, Manifest, Canonical und Sitemap aus derselben Revision.

### Gates

- Same-ID-Mengen-/Hashgleichheit fuer Feed, Landingpages, Manifest, Sitemap.
- Direkter Kaltstart, `?article=`-Fallback, historische ID und Unknown/Gone.
- Escape, Fokus-Rueckkehr, Screenreader-Smoke und vollstaendiger erster Satz.
- Websitepaket bleibt statisch/Apache-kompatibel; Mobile-Deep-Link getrennt.
- Keine Landingpage wird bei normaler Generation geloescht.

### Ruecknahme

Vollstaendiges vorheriges Websitepaket plus kompatible Contentrevision;
Mobile-Readerfeature separat deaktivierbar.

## 7. Wave 4 – lokale Daten, Offline und Update

Paritaet: NEWS-05, HELP-02, SYS-01/02/03, AND-03
Risiken: R-07, R-22, R-26

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

## 8. Wave 5 – optionale sichere Funktionen

Jeder Unterpunkt ist ein eigener Slice und kann entfallen. Keiner blockiert
News/Reader/Offline, wenn der Product Owner ihn nicht freigibt.

| Slice | Vorbedingung | Pflichtgate |
|---|---|---|
| Uebersetzung | Entscheidung ueber explizit/automatisch; Provider/Privacy | SEC-001 geschlossen, bewusster Default, No-Content-Logging |
| Feedback | Retention/Prozess/Owner | sichtbare Referenz, Auskunft/Loeschung end-to-end |
| Medienplayer | Rechte-/Providerinventar | Consent, CSP, Health, Fehler, Accessibility |
| generierte Podcasts | Produkt-/Budgetentscheid | SEC-002, kanonische IDs, Admission, Caps, Moderation/Takedown |
| Push | Produktentscheid | SEC-003, Challenge, Expiry, Caps, Pruning, bestaetigter Widerruf |
| Action Radar | Produktentscheid | getrennte Permission, Standort-No-Transmission |
| Intro/Zine | Produktentscheid und UX-Referenz | eigene visuelle/Funktionsabnahme |

Ruecknahme: jede optionale Route hat einen Kill-Switch/Featureflag ohne Verlust
der Kernfaehigkeiten. Bereits erzeugte Daten werden gemaess Retention/Takedown
behandelt, nicht durch Featureabschaltung vergessen.

## 9. Wave 6 – Android- und Website-Releaseketten

Paritaet: WEB-04/05, AND-01–06
Risiken: R-13, R-14

### Slice

Reproduzierbare getrennte Kandidatenpipelines, Provenienzmanifeste,
Websitepaket/Hash/Rollback und Android-AAB/Hash/Signaturpruefung.

### Gates

- zwei unabhaengige Builds oder gleichwertiger Determinismusbeleg;
- Android Lint/Unit/Instrumentation/WebView/Lifecycle/API-Ziel;
- Website Apache-Smoke, Service-Worker-Upgrade/Rollback und CWV-Budgets;
- Artefakt, Commit, Lockfile, Contentrevision, Tests und Hash stimmen ueberein;
- Signierung/Upload/Deployment nicht als Pipeline-Nebenwirkung.

Ruecknahme: Websitepaket auf gesicherten Stand; Worker vorherige Version;
Android ueber Compatibility-/Kill-Switch und korrigierten Build, nicht
unkontrolliertes Downgrade.

## 10. Wave 7 – G5 Release Candidate

- volle MUST-Paritaetsmatrix;
- visuelle Matrix gemaess Quality Rules;
- null offene Blocker/High;
- Security/Privacy-, Accessibility-, Offline- und Kostenreview;
- unabhaengiger Release-/Architekturreview;
- reproduzierbare getrennte Mobile-/Websiteartefakte und Rollbackbelege;
- Product Owner entscheidet ueber jede sichtbare Medium-Abweichung.

G5 erzeugt keinen Produktionsrelease. G6 bleibt eine gesonderte, explizite
Product-Owner-Operation.
