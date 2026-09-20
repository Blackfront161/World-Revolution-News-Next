# Agent Handoff – WRN-G1-001

- Agent: `legacy_product_analyst`
- Task-ID: `WRN-G1-001`
- Ergebnis: read-only Baseline abgeschlossen
- Arbeitsmodell: `gpt-5.6-terra`, Reasoning `medium`

## Kurzfazit

Die massgebliche App ist als professionell abgesicherter, aber stark
gekoppelter Web-/Capacitor-Bestand einzuordnen. Das sichtbare Produkt und seine
Datenvertraege sind portierbar. Die monolithische Runtime, Offline-/Cachelogik
und dynamischen Medienadapter sollten im neuen Grundgeruest nicht blind kopiert,
sondern verhaltensgleich neu strukturiert werden. Die Android-Releasekette ist
ungewoehnlich gut abgesichert und soll als nachweisbarer Vertrag erhalten
bleiben.

Der Main Agent hat die Rueckgabe unabhaengig gegen Git, Konfiguration und
ausgewaehlte Quellstellen geprueft. Zwei Analystenaussagen wurden dabei
praezisiert: Die Wahl des Service Workers ist statisch nachvollziehbar, und die
Android-Standortberechtigungen gehoeren zum optionalen Action Radar – nicht zur
Hilfefunktion.

## Verifizierter Quellstand

- Quelle: `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current`
- Branch: `main`
- Gesamt-HEAD: `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Runtime-Releasecommit: `968c320adfe87d1e11e88f99f448a435d4242750`
- Arbeitsbaum: sauber zum Analysezeitpunkt
- Umfang: 632 Git-verwaltete Dateien, davon 88 Testdateien
- Delta Runtime-Commit zu Gesamt-HEAD: nur zwei Signer-Dateien,
  619 Einfuegungen; keine Runtime-Aenderung
- Android: Paket `com.world.revolution`, Version `2.1.1`, Code `26`,
  `minSdk 24`, `compileSdk/targetSdk 36`

## Struktur- und Verantwortungsmatrix

| Bereich | Hauptquellen | Beobachtung |
|---|---|---|
| Shell und Runtime | `index.html`, `news-app-2.js`, `news-app-2.css`, Konfiguration | Funktional reich, aber zentrale JS-Runtime ist ca. 712 KB und stark gekoppelt |
| News und Provenienz | News-/Archiv-/Event-JSON, Quellenprofile, Sprachdaten | Dateibasierte Vertraege benoetigen Schema, Eigentuemerkmale und Validierung |
| Offline und Lesestatus | `offline-db.js`, `reading-state.js`, `service-worker.js`, `news-app-2-sw.js` | Mehrere Cache-/Offlinevertraege muessen explizit migriert und getestet werden |
| Uebersetzung | gemeinsamer Client und Translation-Skripte | Externer Worker ist eine Privacy-, Ausfall- und Kosten-Schnittstelle |
| Multimedia | Audio-, Video-, Podcast- und Radioadapter | Dynamische Abhaengigkeiten benoetigen stabile Adaptervertraege |
| Hilfe und Solidaritaet | Hilfe-/Solidaritaetsdaten und UI | Sensible Inhalte erfordern Redaktion, Redaction und klare Datenverantwortung |
| Diagnostik | Diagnosemodule und Tests | Als beobachtbares Produktverhalten portieren, nicht als zufaellige Altstruktur |
| Android/Capacitor | Wrapper, Manifest, Gradle, native Bruecken | Native Share-/Print-/Kalender-/Update-Funktionen sind eigene Plattformvertraege |
| Release | Release-/Signer-Skripte, CI und vorhandene QA-Berichte | Stark abgesichert, zugleich komplex und wartungsintensiv |

## Wichtige Funktions- und Testgruppen

- Newsfeed, Artikelansicht, Suche, Filter, Quellen- und Sprachlogik sind in der
  Webruntime sowie Daten-/Vertragstests abgedeckt.
- Offline-Lesen, Lesestatus und Cachemigration besitzen eigene Module und
  bestehende Testgruppen.
- Audio, Video, Podcasts und Radio werden ueber mehrere Adapter und
  medienbezogene Tests getragen.
- Hilfe, Solidaritaet, Action Radar, Events, native Freigabe, Drucken,
  Kalender und In-App-Updates besitzen konkrete Quell- und Testpfade.
- Release-, Signatur-, Hash-, AAB- und API-36-Pruefungen liegen als Skripte
  beziehungsweise historische Testbelege vor. Sie wurden in diesem Task nicht
  erneut ausgefuehrt.

Die naechste Paritaetsarbeit muss die vorhandenen 88 Tests nicht pauschal
kopieren, sondern pro sichtbarem Verhalten entscheiden: Vertragstest erhalten,
Test neu schreiben oder historischen Test archivieren.

## Android- und Releasekette

1. Ein festgelegter Webquellstand wird ueber einen commit-gebundenen,
   abgetrennten Release-Worktree verarbeitet.
2. Die Webassets werden nach `android-wrapper/www` synchronisiert.
3. Hash-Manifeste und die Herkunft der Assets werden verifiziert.
4. Capacitor-Synchronisation, Android-Lint, Unit-Tests und `bundleRelease` sind
   als Releasegates vorgesehen.
5. Das erzeugte AAB wird auf Assets, Signatur, Zertifikat und Hash geprueft.
6. Der Releasebericht wird transaktional publiziert.
7. `MainActivity` registriert native Plugins und den Update-Controller.
8. Die bestehende Play-Update-Policy unterscheidet flexible und sofortige
   Updates, unter anderem anhand Prioritaet und Cooldown.

Die Kette ist dokumentiert, aber nicht in diesem read-only Task ausgefuehrt
worden. Vor einer spaeteren Uebernahme muss sie in einer isolierten Toolchain
reproduzierbar bewiesen werden.

## Priorisierte Findings

### Hoch

1. `news-app-2.js` ist ein grosser Monolith und vermischt UI, Zustand,
   Datenzugriff, Plattformlogik und Integrationen.
2. Die Synchronisation zwischen Webquelle und Android-Webassets ist eine
   kritische Vertrauensgrenze; falsche oder veraltete Assets koennen trotz
   funktionierendem Build ausgeliefert werden.
3. Zwei Service-Worker-Vertraege erhoehen Migrations- und Cache-Risiko. Die
   Auswahl ist jedoch klar: Produktion registriert `service-worker.js`,
   Preview `news-app-2-sw.js` – gesteuert durch
   `WRN_CONFIG.releaseChannel === 'production'`.
4. Standort ist ein optionales Action-Radar-Verhalten: Erst eine ausdrueckliche
   Benutzeraktion ruft `navigator.geolocation.getCurrentPosition` auf. Zu
   pruefen bleiben Android-Permission-Timing, lokale Verarbeitung,
   Nicht-Uebertragung und ob beide Manifestberechtigungen minimal notwendig
   sind. Die Hilfefunktion selbst ist laut Bestand ohne Geolocation gedacht.
5. Der externe Uebersetzungsdienst ist eine Privacy-, Verfuegbarkeits- und
   Kostenabhaengigkeit.
6. Die Releaseautomation bietet viele Schutzmechanismen, besitzt aber hohe
   operative Komplexitaet und muss modular dokumentiert werden.

### Mittel

7. Dateibasierte Datenvertraege koennen ohne zentrale Schemas, Ownership und
   Migrationsregeln auseinanderlaufen.
8. Signatur-, AAB- und API-36-Erfolge sind historische Belege, keine aktuelle
   Ausfuehrungsbestaetigung.
9. CI enthaelt potentiell schreibende Generierungsschritte; reproduzierbarer
   Input und unerwartete Diffs muessen spaeter streng gegatet werden.
10. Hilfe-/Solidaritaetsinhalte koennen sensible Daten enthalten und brauchen
    Redaktions-, Freigabe- und Redactionregeln.
11. Dynamische Medienquellen erzeugen Ausfall- und Formatrisiken.
12. Push, Benachrichtigungen, Kalender und weitere native Pfade benoetigen
    reale Android-Geraetetests, nicht nur Web- oder Unit-Tests.
13. Historische Releasebezeichnungen und zeitlich geschichtete Dokumente
    koennen aktuelle und veraltete Wahrheit vermischen.

## Vorlaeufige Migrationsklassifikation

| Bereich | Entscheidung | Bedingung |
|---|---|---|
| Marke und statische Assets | KOPIEREN | erst nach Rechte-/Provenienzpruefung |
| News-Domaene, Quellen, Sprachen | PORTIEREN | mit expliziten Schemas und Adaptern |
| UI-Verhalten und visuelle Identitaet | PORTIEREN | gegen Screenshot- und Paritaetsbaseline |
| Monolithische Runtime | NEU SCHREIBEN | modular, vertikale Slices, gleiche Nutzerwirkung |
| Offline, Cache, Lesestatus | NEU SCHREIBEN | bestehende Vertraege und Migrationen als Tests erhalten |
| Android Share/Print/Kalender | PORTIEREN | native Vertragstests und Geraeteabnahme |
| Play-In-App-Update-Policy | PORTIEREN | bestehende Regeln beweisbar uebernehmen |
| Signer-/Releaseautomation | NOCH ENTSCHEIDEN | erst reproduzierbare Toolchain- und Securitypruefung |
| alte Code-25-Signer und Preview-/Legacy-UI | ARCHIVIEREN | nur Belege behalten, nicht in neue Runtime uebernehmen |
| Cloudflare-/Backendteile | NOCH ENTSCHEIDEN | eigener G1-Backendauftrag |
| Hilfe und Solidaritaet | PORTIEREN | Privacy- und Redaktionsregeln vorher festlegen |
| Medienadapter | NEU SCHREIBEN | Verhalten und Fallbackvertraege erhalten |

## Offene Fragen und Folgepruefungen

1. Welche Daten-, Worker- und Cloudflare-Komponenten bilden den aktuellen
   Backendvertrag und welche sind noch produktiv?
2. Welche Service-Worker-/Cachemigrationen muessen bestehende Installationen
   beim Wechsel zum neuen Grundgeruest durchlaufen?
3. Werden Standortdaten des Action Radars in allen Pfaden ausschliesslich lokal
   verarbeitet und sind die Manifestberechtigungen Play-Policy-konform?
4. Welche dynamischen Medienquellen besitzen verbindliche Fallbacks,
   Nutzungsrechte und Monitoring?
5. Welche vorhandenen Releasebelege lassen sich mit der lokalen Toolchain
   reproduzieren?
6. Welche UI-Zustaende und Displayklassen muessen als visuelle Baseline
   aufgenommen werden?

## Geaenderte Dateien und ausgefuehrte Pruefungen

- Der Fachagent hat keine Datei veraendert.
- Der Main Agent hat ausschliesslich diesen Handoff und den Projektstatus im
  neuen Governance-Repository dokumentiert.
- Keine Tests, Builds, Server, Dependency-Installationen, Signierungen oder
  Deployments wurden ausgefuehrt.
- Read-only geprueft wurden Git-Metadaten, Dateizaehlungen, Groessen,
  ausgewaehlte Konfigurations- und Quellstellen sowie das Runtime-Commit-Delta.

## Empfohlener naechster Schritt

Zuerst diesen Handoff durch den `context_continuity_auditor` pruefen. Danach
folgen innerhalb G1 getrennt: visuelle App-Baseline, Backend-/Privacy-Baseline
und Website-Baseline. Noch keine Zielarchitektur und kein Produktcode.

## WRN-AGENT-STATUS

- Task: `WRN-G1-001`
- Status: GREEN
- Quellstand: `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Erledigt: App-/Android-Baseline, Risiken und Migrationsklassifikation
- Tests: keine; read-only Auftrag
- Offen: Continuity Audit und getrennte G1-Folgeanalysen
- Handoff: `docs/handoffs/WRN-G1-001-legacy_product_analyst.md`
- Naechster Schritt: Continuity Audit
- END-CHECK: :)
