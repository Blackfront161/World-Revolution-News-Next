# Vorgeschlagene Zielarchitektur

Status: Architekturvorschlag, noch keine Implementierungsfreigabe

## 1. Grundentscheidung

Das lokale Repository `Sauberes Wo Rev Ne` soll als privates Plattform-Monorepo
gefuehrt werden. Mobile App und Website bleiben getrennte Anwendungen, teilen
aber bewusst gepflegte Marken-, UI-, Domain- und Testpakete.

Content-Erzeugung und grosse generierte Nachrichtendaten bleiben in einem
separaten, versionierten Content-/Datenrepository. World Revolution Map und das
spaetere Spiel bleiben bis zu einem eigenen Integrationsgate getrennte Projekte.

## 2. Geplante Struktur nach `GO-IMPLEMENTATION`

```text
Sauberes Wo Rev Ne/
├── apps/
│   ├── mobile/                 # Web-App/PWA plus Capacitor-Android-Integration
│   └── website/                # responsive oeffentliche Website und SEO
├── packages/
│   ├── brand/                  # Logos, Tokens, Typografie- und Markenregeln
│   ├── design-system/          # gemeinsam geeignete UI-Komponenten
│   ├── domain/                 # fachliche Modelle ohne Plattformkopplung
│   ├── api-contracts/          # versionierte Ein-/Ausgabevertraege
│   ├── content-contracts/      # News-, Medien-, Quellen- und Eventschemata
│   └── test-support/           # Fixtures, Screenshot- und Testhilfen
├── services/
│   ├── content-gateway/        # stabile Lesegrenze zu Datenquellen
│   ├── translation/            # nutzergesteuerte Uebersetzung und Cache
│   └── operations/             # begrenzte Backend-/Betriebsfunktionen
├── tests/
│   ├── contracts/
│   ├── e2e/
│   ├── visual/
│   └── release/
├── docs/
└── tools/                      # reproduzierbare lokale Build-/QA-Werkzeuge
```

Diese Verzeichnisse werden erst nach Freigabe angelegt. Die Darstellung ist
eine Zielskizze, kein bereits implementierter Stack.

## 3. Technische Leitplanken

Der bevorzugte Startpunkt fuer die Architekturpruefung ist:

- React mit TypeScript und Vite fuer klar typisierte Weboberflaechen;
- Capacitor fuer Android, sofern die Baseline-Analyse keine tragenden
  Gegenargumente findet;
- gemeinsame Pakete nur fuer wirklich gemeinsame Regeln, nicht fuer
  plattformspezifische Sonderfaelle;
- schema-validierte JSON-/HTTP-Vertraege zwischen App, Website, Content und
  Diensten;
- Cloudflare Workers/R2/KV nur dort, wo vorhandene Anforderungen und
  Betriebskosten dies rechtfertigen;
- lokale/offline Faehigkeiten als eigener Architekturvertrag;
- automatisierte Browser- und Android-Abnahme.

Der Stack wird erst nach Legacy-, Kosten-, Offline- und Deploymentanalyse als
ADR freigegeben. Diese Datei erlaubt noch keine Installation oder Generierung.

## 4. Gemeinsame Marke, getrennte Produkte

Gemeinsam:

- Farb-, Typografie-, Icon- und Abstands-Tokens;
- Markenassets und Nutzungsregeln;
- geeignete atomare UI-Komponenten;
- fachliche Datenmodelle und Validierung;
- Uebersetzungs-, Herkunfts- und Quellenregeln;
- Accessibility-Grundsaetze und Testhilfen.

Getrennt:

- Navigation und Informationsdichte;
- Android-/Capacitor-Bruecken;
- Website-SEO, Apache-/Hostingregeln und statische Landingpages;
- Service-Worker-, Cache- und Releaseversionen;
- Deployment, Rollback und produktive Konfiguration;
- plattformspezifische Performancebudgets.

## 5. Daten- und Backendgrenzen

- Clients konsumieren keine unvalidierten Rohdaten direkt als stillen Vertrag.
- Jeder Vertrag besitzt eine Version, Schema-Tests und dokumentierte Fallbacks.
- Quelle, Original-URL, Datum, Herkunft und Uebersetzungsprovenienz bleiben
  unverfaelscht nachvollziehbar.
- Fehlende optionale Feeds erzeugen einen kontrollierten Zustand statt
  wiederkehrender unklarer 404-Warnungen.
- Caching, Quoten und Uebersetzung erhalten explizite Kosten- und Fehlerbudgets.
- Secrets verbleiben ausschliesslich in Secret-Stores und nie im Repository.
- Deployments sind eigenstaendige, autorisierte Operationen und keine
  Nebenwirkung von Tests oder Builds.

## 6. Map-/Spiel-Erweiterungsgrenze

Vor dem ersten Release werden keine Karten- oder Spielfunktionen implementiert.
Das Domainmodell soll jedoch spaeter folgende Referenzen aufnehmen koennen:

- `contentId`, `eventId`, `locationId`, `actorId`, `topicId`;
- ISO-/IANA-Zeit- und Sprachangaben;
- GeoJSON-kompatible Geometrien ausserhalb des News-Kernobjekts;
- Zeitraeume und Unsicherheitskennzeichnung;
- Quellen- und Rechteprovenienz;
- Deep-Link-Schema mit Version;
- textuelle/barrierefreie Alternative fuer raeumliche Informationen.

## 7. Architektur-Gates

Vor Produktcode muessen mindestens genehmigt sein:

1. Baseline- und Paritaetsbericht
2. Datenfluss- und Systemkontextdiagramm
3. ADR fuer Repository- und Stackentscheidung
4. API-/Content-Vertragsstrategie
5. Offline-, Cache- und Updatekonzept
6. Security-/Privacy-Threat-Review
7. Migrations-, Rollback- und Kostenplan
8. erstes vertikales Slice mit konkreten Abnahmekriterien
