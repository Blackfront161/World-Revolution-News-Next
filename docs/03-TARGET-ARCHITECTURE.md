# Zielarchitektur – Migration Release 1

Status: `ACCEPTED` – G2-Abnahme durch den Product Owner am 23. August 2026; `GO-IMPLEMENTATION` nicht erteilt
Quellen: G1-Baseline App `2216ff3`, Website `9a59b17`, Datenbeobachtung
`acec88e` sowie SEC-001 bis SEC-003
Stand: 23. August 2026

## 1. Architekturziel

World Revolution News und Solinaridao werden als eine Marke mit zwei getrennt
lieferbaren Clients geplant:

- eine Android-orientierte Mobile-App als Web-App mit Capacitor-Huelle;
- eine responsive, oeffentliche Website mit SEO-Landingpages;
- gemeinsame, versionierte Brand-, Domain- und Vertragsbausteine;
- getrennte Navigation, Cache-, Build-, Deployment- und Rollbackketten;
- ein weiterhin getrenntes Content-/Datenrepository mit immutable Releases;
- eng begrenzte Dienste fuer Contentzugriff, Uebersetzung und optionale
  zustandserzeugende Operationen.

Die monolithischen Legacy-Runtimes werden nicht kopiert. Sichtbares Verhalten,
stabile IDs, Provenienz, Offlinefaehigkeiten und Releasebelege werden als
Vertraege migriert.

## 2. Kleines Systembild

```text
  Content-/Datenrepo (immutable Revision + Hashmanifest)
                         |
                  Content Gateway
                         |
          +--------------+---------------+
          |                              |
  Mobile-App + Capacitor          Responsive Website
  eigener Cache/Release           eigener Cache/SEO/Release
          |                              |
          +--------- versionierte -------+
                    HTTP-Vertraege
                         |
         +---------------+----------------+
         |               |                |
   Translation       Operations       Media Storage
   Cache/Provider   Feedback/Push/    nur autorisierte,
   SEC-001-Gate      Podcast-Gates     rechtegepruefte Daten

  Map und Spiel: ausserhalb Release 1; nur stabile IDs/Deep Links
```

Trust Boundaries liegen an jedem Client, am Content Gateway, an jedem Worker,
an Drittanbietern und an lokalem persistentem Speicher. CORS ist nur eine
Browserkontrolle und niemals Authentisierung oder Admission.

## 3. Zielbausteine

| Baustein | Verantwortung | Harte Grenze |
|---|---|---|
| Mobile-App | mobile Navigation, Android-Bruecken, App-Offline, lokale Einstellungen | kein Website-SEO oder Website-Service-Worker |
| Website | responsive Webnavigation, SEO, Sitemap, Landingpages, Apache-kompatibles Paket | kein Android-/Play-Code |
| Brand/Design System | Tokens, freigegebene Assets, geeignete atomare Komponenten, Accessibility-Grundregeln | keine gemeinsame Navigation erzwingen |
| Domain/Contracts | IDs, Modelle, Schemas, Provenienz, Fehler- und Kompatibilitaetsregeln | kein direkter Provider- oder Plattformzugriff |
| Content Gateway | validierter, revisionsgebundener Lesezugriff und kontrollierte Fallbacks | keine Redaktion im Requestpfad, keine stillen Roh-`main`-Vertraege |
| Translation | nutzergesteuerte Uebersetzung, serverseitiger kanonischer Cachekey | kein clientbestimmter Speicherkey, kein Contentlogging |
| Operations | getrennte Endpunkte fuer Feedback, Push und optionale Podcastgenerierung | keine Admission ueber CORS, keine unendliche Retention |
| Media | Referenzen, Rechte, Lifecycle, Auslieferung und Takedown | keine ungepruefte Kopie oder oeffentliche Generierung |
| Content-/Datenrepo | Generatoren, Quellenaggregation, immutable Publikationsrevisionen | getrennt vom Plattform-Monorepo und dessen Releases |

## 4. Geplante Repositoryform nach `GO-IMPLEMENTATION`

Die folgende Struktur ist nur ein Sollbild; die Verzeichnisse werden in G2
nicht angelegt.

```text
platform-repository/
  apps/
    mobile/
    website/
  packages/
    brand/
    design-system/
    domain/
    api-contracts/
    content-contracts/
    test-support/
  services/
    content-gateway/
    translation/
    operations/
  infrastructure/
  tools/
  docs/
```

Generierte Feeds, Medienbinaries, Landingpage-Ausgaben und Releasepakete sind
keine manuell gepflegte Paketquelle. Archive und Legacyrepositories bleiben
read-only ausserhalb der neuen Runtime.

## 5. Leitentscheidungen

1. **Clientstack:** React + TypeScript + Vite fuer beide getrennten
   Weboberflaechen und Capacitor fuer Android wird empfohlen. Die Freigabe
   bleibt beim Product Owner; die Bewertung steht in ADR-002.
2. **Daten:** Jeder Client konsumiert ein immutable Release-Manifest mit
   Schemas, getrennten Hashes fuer aktive/archivierte/SEO-ID-Mengen,
   Required/Optional-Klassen, Ownern, Revision und vorrangigem
   Revocation-/Tombstone-Stand.
3. **SEO:** Feed, Artikel-IDs, Landingpages, Manifest und Sitemap muessen aus
   derselben Revision stammen; aktive, archivierte, Landing-/Redirect- und
   Sitemapmengen bleiben getrennt und folgen pruefbaren Teilmengen-/
   Gleichheitsregeln.
4. **Backend:** HTTP-Vertraege werden nach Lesezugriff und zustandserzeugenden
   Operationen getrennt. Content Gateway, Translation, Feedback, Podcast und
   Push sind eigene Deploy-/Rollbackeinheiten. Provider und Cloudflare bleiben
   austauschbare Adapter.
5. **Offline:** Mobile-App und Website haben eigene Storage- und
   Service-Worker-Versionen sowie getrennte Migrationen und Rollbacks; bekannte
   Tombstones duerfen durch alte Revisionen oder Caches nie reaktiviert werden.
6. **Security/Privacy:** SEC-001/002 sind vor Portierung zu schliessen;
   SEC-003 vor jeder Pushfreigabe. No-Content-Logging, Datenminimierung,
   Retention, Auskunft, Loeschung und Widerruf sind Vertragsbestandteile.
7. **Release:** CI darf pruefen und Pakete erzeugen, aber nicht ohne gesonderte
   Freigabe deployen, signieren oder hochladen.
8. **Map/Spiel:** kein Release-1-Code; nur versionierte IDs, Zeit/Geo-
   Metadaten, Deep Links und barrierefreie Textalternativen.

## 6. Nicht verhandelbare G3-Vorbedingungen

- Product Owner akzeptiert oder korrigiert die vorgeschlagenen ADRs.
- Offene Produktentscheidungen in `architecture/G2-OPEN-DECISIONS.md` sind fuer
  das erste Slice entschieden oder explizit aus dessen Scope entfernt.
- Rechte-/Lizenzregister erlaubt die konkret zu uebernehmenden Assets und
  Inhalte; fehlende Rechte bedeuten Neuschaffung oder Ausschluss.
- Read-only Liveinventar klaert aktive Worker, Bindings, Hosting, Provider,
  Retention, Quoten und Kosten ohne Secretwerte.
- Datenrelease-, Cachemigrations-, Security- und Rollbackvertraege sind in
  beobachtbare Tests uebersetzt.
- Ein vertikales Slice besitzt Task Brief, UX-Referenzen, vorab definierte
  Tests und Ruecknahmegrenze.
- Der Product Owner erteilt ausdruecklich `GO-IMPLEMENTATION`.

## 7. Evidenzgrenzen

G2 behauptet keine aktuellen Preise, Tarife, Live-Deployments, Rechte,
Provider-Retention, Secretkonfiguration oder Play-/Hostinger-Zustaende.
Historische Builds und Tests bleiben Baselinebelege, keine neue Freigabe. Die
lokal bestaetigten Legacycommits wurden in diesem Task nur read-only geprueft;
Tests, Builds, Server und Livezugriffe wurden nicht ausgefuehrt.
