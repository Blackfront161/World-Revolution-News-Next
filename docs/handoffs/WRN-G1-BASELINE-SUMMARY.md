# G1 Baseline Summary – Sauberes Wo Rev Ne

Stand: 21. August 2026  
Gateergebnis: **G1-ANALYSE VOLLSTAENDIG – fachlich YELLOW**

## Bedeutung des Ergebnisses

Die bestehende App und Website sind ausreichend commitgebunden, statisch,
visuell und betrieblich kartiert, um G2 – Zielarchitektur und verbindliche
Produkt-/Daten-/Securityentscheidungen – zu beginnen. YELLOW bedeutet nicht,
dass die Baseline unzuverlaessig ist: Alle sechs Task-Handoffs bestanden den
Continuity Audit mit 12/12 GREEN. YELLOW bezeichnet konkrete Risiken, die vor
der jeweiligen Portierung oder Releasefreigabe geschlossen werden muessen.

G1 erteilt **keine** Freigabe fuer Produktcode. `GO-IMPLEMENTATION` wurde nicht
gegeben.

## Gebundene Quellen

| Quelle | Stand | Zustand |
|---|---|---|
| App | `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0` | `main`, sauber |
| sichtbarer App-Runtime-Release | `968c320adfe87d1e11e88f99f448a435d4242750` | historischer Referenzstand |
| Website | `9a59b17cc9b3a6a7b7541c2e64862af208d02ace` | `main`, sauber |
| Daten-G1-Snapshot | `acec88ef40814f70c1bb45001e397a6ca5872ed7` | commitgebundener Beobachtungsstand; Produktions-`main` bleibt beweglich |

## Abgeschlossene G1-Auftraege

| Task | Ergebnis | Continuity |
|---|---|---|
| WRN-G1-001 App-/Android-/Funktionsbaseline | YELLOW mit konkreten Portierungsregeln | 11/12 GREEN |
| WRN-G1-002 visuelle Appbaseline | YELLOW mit Reflow/Touch/Escape-Befunden | 12/12 GREEN |
| WRN-G1-003 Backend-/Daten-/Kosten-/Privacybaseline | YELLOW mit sechs High-Risiken | 12/12 GREEN |
| WRN-G1-004 scoped Security-/Privacyreview | YELLOW mit SEC-001/002 und bedingtem SEC-003 | 12/12 GREEN |
| WRN-G1-005 statische Website-/Markenbaseline | YELLOW mit Manifest-/Live-/Rechtefragen | 12/12 GREEN |
| WRN-G1-006 visuelle Websitebaseline | YELLOW mit Escape-/Touchbefunden | 12/12 GREEN |

WRN-G1-001 erreichte 11/12 und war dennoch GREEN nach dem definierten Raster;
der fehlende Punkt ist in seinem Audit dokumentiert und kein verdeckter
Blocker.

## Bestaetigte Staerken der Baseline

- Das aktuelle Frontend besitzt eine klare, wiedererkennbare Marke und bildet
  eine gute visuelle Produktreferenz.
- App-Screenshots liegen fuer Mobile, Tablet/Intermediate, Desktopdarstellung,
  Reader, Light und 200-%-Aequivalent vor.
- Website-Screenshots bestaetigen Mobile 390, Tablet 800 und Desktop 1440 ohne
  horizontalen Overflow sowie Reader, Themes, Reflow und Landingpage.
- App und Website besitzen reale Offline-, Reader-, Daten-, SEO-, Medien-,
  Hilfe-, Quellen- und Accessibility-Ansaetze sowie umfangreiche historische
  Test-/QA-Artefakte.
- Android-Baseline, API 36 und reproduzierbarer AAB-Prozess sind dokumentiert;
  in G1 wurde kein neuer Build erzeugt.
- Website besitzt stabile Artikelpfade, 935 Landingpageverzeichnisse,
  Sitemap/Robots, Apache-/Hostingervertrag und einen transaktional gedachten
  Generator.
- Providerkosten sind bereits durch Caches, Quoten und Kill-Switches begrenzt;
  ihr aktueller Livezustand bleibt bewusst unbehauptet.

## Verbindliche G2-/Portierungsgates

### Architektur und Daten

1. App und Website bleiben getrennte Anwendungen in einer gemeinsamen
   Plattformstruktur; keine Legacy-Verzeichnisse zusammenkopieren.
2. Daten muessen immutable releasegebunden werden. Feed, lokale Pakete,
   Landingpages, Manifest und Sitemap brauchen eine Revision und Hashgleichheit.
3. Library-, Video- und Editorialpfade benoetigen Required/Optional, Schema,
   Owner, Fallback und Contracttests.
4. Offline-, Service-Worker- und Cachemigration werden pro Oberflaeche neu
   entworfen; sichtbares Verhalten bleibt Paritaetsvertrag.

### Security, Privacy und Kosten

5. SEC-001: Translation-Key ausschliesslich serverseitig aus einem
   versionierten kanonischen Payload ableiten.
6. SEC-002: Podcastgenerierung braucht echte Admission, kanonische Artikel,
   harte Quoten sowie Moderation/Takedown.
7. SEC-003: vor Pushfreigabe Subscription-Nachweis, Ablauf, Caps, Pruning und
   bestaetigten Widerruf entscheiden.
8. Automatische Uebersetzung, Feedbackreferenz/-loeschung, Push-Clear-all und
   oeffentliche Podcastdaten muessen Privacytext und Implementierung decken.
9. Ein spaeter autorisiertes read-only Liveinventar muss Worker, Bindings,
   Hosting, Provider, Retention, Quoten und Kosten erfassen – ohne Secretwerte.

### UX, Accessibility und SEO

10. Escape schliesst Artikelreader in App und Website nicht verlaesslich.
11. Mehrere Ziele unterschreiten 44x44 px; App zeigt zusaetzlich eine
    ueberlappende Bottom-Navigation bei 200-%-Aequivalent.
12. Website-Manifest ohne `ids`, `articleCount` und `revision` muss mit
    Generator/Runtime vereinheitlicht werden.
13. Same-ID-Canonical, Apachefallback, Kontrast, Reduced Motion, Screenreader,
    weitere Randviewports und Androidruntime bleiben spaetere Regressiongates.

### Rechte und Release

14. Code, `Qood.ttf`, Logos, Bilder, Audio/Video und Inhaltsquellen benoetigen
    ein Rechte-/Lizenzregister; keine vorhandene `LICENSE` erlaubt pauschale
    Wiederverwendung.
15. Signierung, Play Upload, Websiteveroeffentlichung und Live-Cachewechsel
    bleiben bis zu ihren separaten Freigaben verboten.

## In G2 erforderliche Entscheidungen

- Plattform-Monorepo und konkrete App-/Website-Paketgrenzen bestaetigen.
- Zielstack und Hosting-/Daten-/Medienvertraege als ADRs festlegen.
- Product Decisions fuer Intro, Zine, Action Radar, Push, automatische
  Uebersetzung, generierte Podcasts und spaetere Map-/Spiel-Schnittstelle.
- Kostenbudget, Quoten, Warnschwellen, Kill-Switch-Owner und Providerfallbacks.
- Datenklassifikation, Retention, Loeschung, Auskunft, Moderation/Takedown.
- Canonical-/Archiv-/Redirectvertrag und append-only historische IDs.
- Rechte-/Lizenzentscheid vor jeder Asset- oder Codeuebernahme.

## Naechster erlaubter Auftrag

`WRN-G2-001`: Zielarchitektur und ADR-Paket entwerfen – weiterhin nur
Dokumentation. Der Main Agent darf dazu einen Architect-Entwurf erstellen;
kritische ADRs werden anschliessend vom `independent_architecture_reviewer`
auf Sol/high geprueft. Erst nach G2-Abnahme und ausdruecklichem
`GO-IMPLEMENTATION` darf Produktcode beginnen.

## WRN-AGENT-STATUS

- Task: G1 Baseline
- Status: YELLOW
- Quellstand: App `2216ff3`; Website `9a59b17`; Daten `acec88e`
- Erledigt: sechs G1-Fachauftraege und sechs Continuity Audits
- Tests: historische Tests inventarisiert; in G1 nur autorisierte manuelle lokale Visual-Smokes
- Offen: verbindliche G2-ADRs und alle aufgefuehrten Portierungs-/Releasegates
- Handoff: `docs/handoffs/WRN-G1-BASELINE-SUMMARY.md`
- Naechster Schritt: `WRN-G2-001` Zielarchitektur-/ADR-Paket
- END-CHECK: :)

