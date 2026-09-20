# Task Brief – WRN-G3-004 Navigation und Informationsarchitektur

## Identitaet

- Task-ID: `WRN-G3-004`
- Titel: gemeinsame Zielstruktur, getrennte App-/Website-Navigation
- Phase/Welle: G3, naechster sichtbarer Slice nach akzeptierter Markenbasis
- Paritaets-/Risiko-ID: `UX-02`, `UX-03`, `UX-04`, `UX-05`, `UX-07`;
  vorbereitend fuer `NEWS-02`, `NEWS-05`, `MEDIA-01` bis `MEDIA-04`,
  `INFO-01` bis `INFO-04` und `HELP-01` bis `HELP-03`
- Auftraggeber: Product Owner
- Owner-Agent: Chief AI Architect
- Spaeterer Implementierungsowner: Frontend Brand Engineer
- Unabhaengige Abnahme nach Implementierung: QA Release Engineer
- Modellrouting: Terra/high fuer Navigation, History/Fokus und responsive
  Integration; Luna/medium nur fuer deterministische Evidenztabellen; Sol/high
  nur bei Architektur-, Security- oder Releaseblocker
- Delegation nach Start: hoechstens ein schreibender Frontend-Agent und danach
  ein unabhaengiger QA-Agent; keine parallele Schreibarbeit
- Status: **ABGESCHLOSSEN – TECHNISCH GREEN UND VISUELL DURCH PO AKZEPTIERT**
- Vorbereitungsgate: PO-028 am 24. August 2026 erteilt
- benoetigtes Implementierungsgate: exakt `START WRN-G3-004`
- Implementierungsgate: am 24. August 2026 erteilt
- Ausgangs-Produktkandidat: `f54a2993e1eca52b75c1af3ddefd48ca434716b1`
- Ausgangs-QA-/Evidenzcheckpoint: `21351f7`
- finaler G3-004-Produktkandidat: `3d89fbc05c5349aed4f7caff11099d40b26febb2`
- finaler G3-004-QA-/Evidenzcheckpoint: `febe7cd57f2c8c3c71498c12f983f59ec96f2771`
- finale QA: 51 Unit-/Contracttests, 16 Boundarytests, beide Builds und 30
  Browser-E2E-Tests bestanden; null offene Findings
- visuelle Product-Owner-Abnahme: am 24. August 2026 mit
  `G3-004 VISUELL AKZEPTIERT – TEMP-ORDNER LOESCHEN` erteilt

## Ziel in beobachtbarer Sprache

Die App erhaelt wieder ihre fuenf vertrauten mobilen Hauptziele `Start`,
`Für mich`, `Entdecken`, `Medien` und `Gespeichert`. Die responsive Website
erhaelt eine fuer Smartphone, Tablet und Desktop passende eigene Navigation.
Beide Oberflaechen verwenden stabile gemeinsame Ziel-IDs, aber keine
erzwungene identische Anordnung.

Noch nicht migrierte Zielinhalte werden ehrlich als lokaler Zwischenstand
gekennzeichnet. Sie duerfen weder leere Attrappen noch scheinbar fertige
Funktionen sein. Der bestehende Newsfeed bleibt auf `Start` voll funktionsfaehig
und unveraendert. Dieser Slice entscheidet Navigation, Erreichbarkeit,
History-/Zurueckverhalten, Fokus und Responsive-Reflow; er implementiert noch
keine Suche, Personalisierung, Medienkataloge, Speicherung oder Readerlogik.

## Ausgangslage und Belege

- neues Zielrepository: Branch `codex/g3-003-brand-design`, akzeptierter
  Produktkandidat `f54a2993e1ec`
- read-only App-Baseline:
  `wrn-github-app-current@2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`,
  sichtbare Runtime `968c320adfe87d1e11e88f99f448a435d4242750`
- read-only Website-Baseline:
  `wrn-web-portal-2026-08-20-r10n-work@9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- App-Baseline: `docs/handoffs/WRN-G1-002-visual-app-baseline.md`
- Website-Baseline: `docs/handoffs/WRN-G1-006-visual-website-baseline.md`
- Navigations-Paritaetsbrief:
  `docs/evidence/WRN-G3-004-NAVIGATION-PARITY-BRIEF.md`
- Zielarchitektur: ADR-001, ADR-002, ADR-003, ADR-007 und ADR-009
- bekannte zu schliessende Navigationsbefunde: ueberlappende mobile Labels bei
  200-Prozent-Reflow, teilweise zu kleine Touchziele, unvollstaendiges
  Tastatur-/Zurueckverhalten

## Verbindlicher Zielkatalog

Gemeinsam sind nur stabile fachliche Ziel-IDs und ihre Bedeutung. Reihenfolge,
Darstellung, URL-/History-Adapter und Responsive-Komposition bleiben pro
Client getrennt.

### Mobile-App – primaere Ziele

1. `home` – `Start`: bestehender lokaler Newsfeed
2. `following` – `Für mich`: spaeter lokale Personalisierung
3. `discover` – `Entdecken`: spaeter Suche, Regionen, Themen und Quellen
4. `media` – `Medien`: spaeter Video, Audio, Podcasts und Radio
5. `saved` – `Gespeichert`: spaeter lokale Lese-/Merkliste

Projekt, Hilfe, Einstellungen, Datenschutz und andere Nebenfunktionen gehoeren
in einen klar getrennten, spaeter erweiterbaren Sekundaerbereich. Sie werden
nicht als sechstes primaeres Tab zwischen die fuenf Baselineziele geschoben.

### Website – responsive Hauptgruppen

- `home` – Start
- `discover` – Entdecken: Regionen, Themen, Quellen und spaetere Suche
- `media` – Medien: Video, Audio, Podcasts und Radio
- `events` – Termine
- `knowledge` – Wissen: Briefing, Entwicklungen, Bibliothek, Lexikon und Zine
- `solidarity` – Solidarität
- `saved` – Gespeichert
- `more` – Mehr: Projekt, Hilfe, Einstellungen und sonstige Nebenfunktionen

Auf Smartphone darf die Website die sichtbaren Hauptziele auf `Start`,
`Entdecken`, `Medien`, `Gespeichert` und `Mehr` verdichten. Tablet und Desktop
duerfen mehr Hauptgruppen direkt zeigen. Kein Legacyziel wird dadurch
gestrichen; die Zuordnung steht im Paritaetsbrief.

## Scope

### Erlaubte Schreibpfade erst nach `START WRN-G3-004`

- `packages/domain/src/**`: stabile Ziel-IDs und reine, clientneutrale
  Navigationsvertraege; keine UI-Komponente
- `packages/domain/tests/**`: Katalog-, Eindeutigkeits- und Grenztests
- `apps/mobile/src/**`: mobile Bottom-/Breitbildnavigation, clientlokaler
  Zustand, Fokus und ehrliche Zwischenansichten
- `apps/website/src/**`: responsive Webnavigation, clientlokaler URL-/History-
  Adapter, Fokus, Ueberlauf-/Mehr-Menue und ehrliche Zwischenansichten
- eng notwendige Tests unter den vorhandenen App- und `tests/e2e/**`-Pfaden
- neue WRN-G3-004-Dokumentation, Screenshots und rein lokale Bildgeneratoren
  unter `docs/**` beziehungsweise `tools/**`

Rootkonfiguration oder Dependencies duerfen nur nach einer neuen sichtbaren
Einzelfreigabe geaendert werden. Der vorhandene Stack reicht fuer diesen Slice.

### Nicht-Ziele

- keine Such-/Filterlogik oder Ergebnisse (`NEWS-02`)
- keine echte Personalisierung, gespeicherten Artikel oder Lesestatus
- keine Reader-/Dialog-, Teilen-, Archiv-, Canonical-, Sitemap- oder SEO-Logik
- keine Medienplayer, Medienfeeds, Briefings, Termine, Bibliothek, Lexikon,
  Solidaritaets- oder Hilfedaten
- keine neuen Inhalte, Liveadapter, Datenbank, Worker oder API-Aufrufe
- keine Uebersetzung, Push-, Feedback- oder Standortfunktion
- kein Fontdownload, kein weiteres Legacyasset und kein Redesign der Marke
- keine Androidhuelle, Remote-/CI-, Deployment-, Signier- oder Play-Arbeit

### Verbotene Aktionen

- jede Aenderung in Live-App, Website, ihren Repositories oder Infrastruktur
- Navigation als gemeinsame plattformuebergreifende UI-Komponente erzwingen
- nicht migrierte Ziele als funktionsfaehig oder datenhaltig darstellen
- tote Links, leere Klickflaechen oder Bedienelemente ohne sichtbare Reaktion
- Browserhistory, Fokus oder `aria-current` nur visuell simulieren
- bestehende Feed-, Marken-, Asset-, Footer- oder externe Linkvertraege aendern
- Tests abschwaechen oder Screenshots ohne fachliche Pruefung ersetzen

## Akzeptanzkriterien

1. Der gemeinsame Zielkatalog besitzt eindeutige, stabile IDs und deckt jedes
   im Paritaetsbrief registrierte Legacyziel genau einer Zielgruppe zu.
2. Die App zeigt die fuenf primaeren Baselineziele in der festgelegten
   Reihenfolge; `Start` zeigt unveraendert den akzeptierten G3-003-Feed.
3. Die Website zeigt auf Smartphone eine kompakte Navigation und auf Tablet/
   Desktop eine passende erweiterte Anordnung ohne riesige Zusatzflaeche.
4. Aktives Ziel, Navigation-Landmark, Name, `aria-current`, Tastaturreihenfolge,
   Fokus und mindestens 44x44-CSS-Pixel grosse Zielzonen sind korrekt.
5. Bei 200-Prozent-Reflow ueberlappen oder kuerzen sich `Entdecken`,
   `Gespeichert` und andere normale Woerter nicht; kein horizontaler
   Hauptseiten-Overflow entsteht.
6. Zielwechsel, Browser-Zurueck/Vorwaerts und direkte lokale Wiederherstellung
   funktionieren nach dem clientlokalen Vertrag und setzen Fokus sinnvoll auf
   die neue Hauptueberschrift beziehungsweise zur ausloesenden Aktion zurueck.
7. Noch nicht migrierte Ziele zeigen eine eindeutige, barrierefreie Meldung
   `Noch nicht migriert` mit benanntem spaeteren Slice; keine falschen Daten,
   Ladeanimationen oder externen Requests.
8. Alle bisherigen Feed-, Marken-, Asset-, Privacy-, Boundary- und
   External-Link-Tests bleiben unveraendert gruen.
9. Unabhaengige QA meldet null offene Blocker/High; Medium braucht eine
   dokumentierte Product-Owner-Entscheidung.
10. Der Product Owner akzeptiert oder korrigiert App- und Website-Navigation
    anhand beschrifteter Vergleichstafeln.

## Tests und visuelle Belege

### Automatisiert

- Format, Lint, Typen, Workspace-/Importgrenzen und bestehende Tests
- Unittests fuer eindeutige IDs, erlaubte Zielgruppen, App-/Websiteprojektionen
  und das Fehlen nicht registrierter Ziele
- Komponententests fuer aktives Ziel, `aria-current`, Zwischenzustand,
  Tastatursteuerung und Fokus
- Browser-E2E fuer jeden primaeren App-Tab, jede sichtbare Websitegruppe,
  Mehr-Menue, Zurueck/Vorwaerts, Direktstart, Refresh und unbekannte Ziel-ID
- Axe-Smoke, 44-px-Zielmessung, Reflow, Overflow, Konsole und externe Requests
- beide Produktionsbuilds; keine Android- oder Deploymentausfuehrung

### Verbindliche visuelle Matrix

- Mobile-App: 320x568, 360x800, 390x844, 412x915, 600x960 und mindestens
  844x390 Querformat; Dark, Light und 200-Prozent-Reflow
- Website: 390x844, 800x1280, 1024x800, 1440x900 und 1920x1080; Dark, Light
  und 200-Prozent-Reflow
- App: `Start`, `Entdecken`, `Medien`, `Gespeichert` und geoeffneter
  Sekundaerbereich; `Für mich` mindestens als fokussierter Zustandsbeleg
- Website: Smartphone-Menue geschlossen/geoeffnet, Tablet- und
  Desktopnavigation sowie aktive Hauptgruppen
- beschriftete Alt-vs.-Neu-Tafeln, getrennt fuer App und Website; jeder neue
  Beleg an Kandidatencommit, Viewport, Theme, Zustand und Datum gebunden

## Daten, Privacy, Security und Kosten

- ausschliesslich lokaler Navigationszustand; keine Nutzer-, Live- oder
  redaktionellen Daten
- keine Telemetrie, Geolocation, externe Runtimeanfrage oder neue Persistenz
- noch nicht migrierte Funktionen erzeugen keinerlei Seiteneffekt
- API-/KI-Laufzeitkosten: 0 CHF
- vorhandene Dependencies und Browserbinaries; kein Download vorgesehen
- maximal ein schreibender Implementierungsagent, danach unabhaengige QA

## Rollback/Ruecknahme

Vor Implementierung wird nach dem separaten Startgate ein eigener Branch/
Checkpoint vom dokumentierten Vorbereitungsstand angelegt. Produktseitiger
Rueckkehrpunkt ist der akzeptierte Kandidat
`f54a2993e1eca52b75c1af3ddefd48ca434716b1` plus PO-027-Evidenzcheckpoint
`21351f7`. Legacy-App, Website und Live-Systeme sind nie Teil des Rollbacks.

## Uebergabeformat

- Ausgangs-, Produktkandidaten- und Evidenzcheckpoint
- geaenderte Dateien nach Eigentumsbereich
- Route-/Paritaetstabelle und begruendete Abweichungen
- Testergebnisse, Konsolen-/Requestbericht und Buildstatus
- beschriftete Screenshots und Visual-QA-Bericht
- Annahmen, Findings, Restrisiken und exakter Rueckkehrpunkt
- Handoff nach `docs/templates/AGENT-HANDOFF.md` mit `END-CHECK: :)`
- keine ungefragte Folgefunktion oder externe Aktion

## Freigabegrenze

PO-028 erlaubte nur die Dokumentvorbereitung. Der Product Owner hat danach am
24. August 2026 exakt `START WRN-G3-004` erteilt. Dieser Startbefehl erlaubt
nur den hier beschriebenen lokalen Navigations-Slice; alle Nicht-Ziele und
externen Gates bleiben unveraendert gesperrt.
