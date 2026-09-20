# WRN-WEB-ANALYSIS-003 – lokales Staging-Paket

Stand: 29. August 2026. Auftrag: S11 aus dem Chief-Thread. Noch kein Upload
oder Deployment.

## Identitaet

- Task-ID: `WRN-WEB-ANALYSIS-003`
- Titel: Parametrisiertes, lokal pruefbares Analysewebsite-Staging-Paket
- Paritaets-/Risiko-ID: Website Release, SEO/Indexierung, Security Header,
  Service-Worker-Rollback
- Auftraggeber: Product Owner ueber Chief/S11
- Zustaendiger Agent: separater Analysewebsite-Owner S11
- Delegation und Weiterdelegation: nicht erlaubt; keine Kinder
- Quellcommit: `eced0bbbe1b894120aef53ebd5873949752bdc6f`
- Schreibowner: S11 nur fuer staging-spezifische Paket-/Konfigurationslogik,
  zugehoerige Tests und diesen Task/Handoff
- Integrations- und Freigabeowner: Chief/Product Owner

## Ziel in beobachtbarer Sprache

Ein lokaler Befehl erzeugt erst nach ausdruecklicher Angabe einer separaten
HTTPS-Origin und einer Canonical-Strategie ein geschlossenes Apache-kompatibles
Analysepaket. Es ist standardmaessig nicht indexierbar, bindet Netz- und
Service-Worker-HTML an denselben Sicherheitsheadervertrag, besitzt eine exakte
Datei-/SHA-256-Liste und liefert ein getrenntes Retirementpaket. Nichts wird
hochgeladen.

## Ausgangslage und Belege

- Die zwei Findings aus WRN-WEB-ANALYSIS-002 sind auf der Basis technisch
  geschlossen.
- Der normale Publisher erzeugt bisher oeffentliche Robots-/Sitemap-/Canonical-
  Werte fuer `solinaridao.com`.
- Der Worker rekonstruiert validierte Antworten bisher nur mit Content-Type,
  No-Store und Shell-ID; Server-Sicherheitsheader gehen dabei verloren.
- Zieladresse und finale Canonical-Entscheidung sind offen. Daher sind beide
  zwingende, validierte Buildparameter; es wird keine Adresse erfunden.

## Scope

### Erlaubte Pfade

- `apps/website/package.json`
- `apps/website/tools/` fuer Stagingpublisher, Paket, Header und Retirement
- enge Offline-Shell-Dateien fuer staging-parametrisierte HTML-Header
- zugehoerige Node-/Website-Tests
- `.gitignore`
- dieser Task und `docs/handoffs/WRN-WEB-ANALYSIS-003-staging-package.md`

### Nicht-Ziele und verbotene Aktionen

- keine Hauptwebsite-, Mobile-, Android- oder G3-015-Outcome-Aenderung
- keine neue Dependency, Installation, API oder Kosten
- kein hPanel-, DNS-, Cloud-, Live-, Upload- oder Deploymentzugriff
- keine erfundene Zieladresse, keine Secrets oder Zugangsschutzwerte im Paket
- kein automatisches Loeschen fremder Browserdaten oder Caches

## Akzeptanzkriterien

1. Fehlende/unsichere Origin oder fehlende Canonical-Strategie stoppen vor
   Paketfreigabe; erlaubt sind nur eine separate HTTPS-Origin sowie `self` oder
   `source` als explizite Strategie.
2. Staging-HTML traegt Meta-Noindex; `robots.txt` sperrt `/` und bewirbt keine
   Sitemap. Sitemap und Canonicals folgen der ausdruecklich gewaehlten Strategie.
3. Apache und workerrekonstruiertes `/index.html` verwenden denselben CSP-,
   Noindex-, MIME-, Frame-, Referrer-, Permissions-, COOP-/CORP-Vertrag.
4. Das oeffentliche Paket enthaelt nur die erlaubte Runtime, keine `.vite`,
   Quellen, Tests, Dokumentation oder Secrets. Ein externes Manifest bindet jede
   Datei mit Bytes/SHA-256, Basiscommit, Lockfile, Origin und Contentrevision.
5. Ein getrenntes Retirementpaket loescht nur `wrn.website-shell.*`-Caches,
   deregistriert den eigenen Worker und enthaelt eine sichere Noindex-Seite.
6. Normale Websitebuilds bleiben semantisch unveraendert; Staging ist ein
   separater Buildbefehl und keine Releasefreigabe.

## Tests und Belege

- Test-first Node-Tests fuer Parameterfail-closed, SEO-Ausgabe, CSP/Header,
  geschlossene Paketliste/Hashes und Retirement-Scope
- bestehende Publisher-/Worker-Node-Tests, Websiteunits, Boundaries,
  Typecheck und Websitebuild soweit die vorhandene lokale Toolchain dies ohne
  Installation erlaubt
- zwei lokale Stagingbuilds mit gleicher Konfiguration muessen identische
  Runtime-Dateihashes und Paket-ID liefern
- keine Screenshots: keine sichtbare Produktfunktion wird geaendert

## Daten, Privacy, Security und Kosten

Nur vorhandene lokale Testfixtures. Keine externen Requests im Build, keine
Zugangsdaten, keine neue Dependency und 0 CHF externe Kosten. Noindex ist kein
Zugriffsschutz; der spaetere Hosting-Schutz bleibt ein eigenes Gate.

## Rollback/Ruecknahme

Aktiv- und Retirementpaket bleiben getrennt. Retirement entfernt nur eigene
WRN-Shell-Caches und Registrierung. Lokaler Lesestatus/Content-IndexedDB sowie
fremde Caches bleiben unangetastet. Ein spaeterer Upload oder `Clear-Site-Data`
braucht eine eigene Product-Owner-Freigabe.

## Uebergabeformat

- Basis- und Ergebniscommit, geaenderte Dateien, Tests und Paketbelege
- offene Hosting-/Zugriffsschutzentscheidungen und Restrisiken
- keine automatische Folgeaktion

## Abschluss

Lokal GREEN auf Produkt-/Testcommit
`33902523e9dee6e1e3217186c2daf1ccaa63c8cf`. 26 Node-, 101 Website- und
19 Boundarytests, Website-Typecheck, Lint, Format, Normalbuild sowie ein
byteidentischer Staging-/Retirement-Doppelbuild PASS. Die Probe verwendet nur
die reservierte, nicht deploybare Test-Origin `https://preview.example.test`.
Reale Origin, Canonical-Entscheidung, Provider-/Zugriffsschutzbeleg und Upload
bleiben gesperrte Folgegates. Handoff:
`../handoffs/WRN-WEB-ANALYSIS-003-staging-package.md`.

END-CHECK: :)
