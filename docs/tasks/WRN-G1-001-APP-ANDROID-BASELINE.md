# Task Brief – WRN-G1-001

## Identitaet

- Task-ID: `WRN-G1-001`
- Titel: Read-only Baseline der aktuellen WRN-App und Android-Integration
- Paritaets-/Risiko-IDs: alle App-/Android-Zeilen aus
  `docs/02-FEATURE-PARITY-MATRIX.md`; besonders R-01, R-03, R-04, R-07,
  R-13 und R-19
- Auftraggeber: Product Owner ueber Chief AI Architect
- Zustaendiger Agent: `legacy_product_analyst`
- Ausfuehrungsmodell: kostenguenstiges read-only Analysemodell; keine
  Architektur- oder Releasefreigabe
- Delegation: nicht erlaubt

## Ziel in beobachtbarer Sprache

Erstelle eine beweisgestuetzte Bestandsaufnahme der massgeblichen aktuellen
WRN-App und ihrer Android-Integration. Die Bestandsaufnahme muss einem neuen
Agenten ermoeglichen, Funktionen, Dateiverantwortung, Tests, Releasegrenzen und
wesentliche Architekturprobleme zu verstehen, ohne historische Verzeichnisse
mit der aktuellen Quelle zu verwechseln.

## Ausgangslage und Belege

- Neue Governance-Quelle:
  `C:\Users\patri\Documents\ChatGPT\Sauberes Wo Rev Ne`
- Massgebliche App-Quelle:
  `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current`
- erwarteter Gesamt-HEAD:
  `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- erwarteter Runtime-Releasecommit:
  `968c320adfe87d1e11e88f99f448a435d4242750`
- erwarteter Branch: `main`
- erwartete Version: `2.1.1`, Code `26`
- erwartetes Paket: `com.world.revolution`
- verbindliche Vorinformationen:
  `AGENTS.md`, `docs/00-PRODUCT-CHARTER.md`,
  `docs/01-SOURCE-OF-TRUTH.md`, `docs/02-FEATURE-PARITY-MATRIX.md`,
  `docs/04-QUALITY-RULES.md`, `docs/08-CONTEXT-CONTINUITY.md`

## Scope

### Erlaubte read-only Untersuchungen

1. Git-Branch, HEAD, Status, Remote und Worktrees der massgeblichen App pruefen.
2. Git-verwaltete Dateistruktur, Groessen-/Monolithenindikatoren und
   Verantwortungsbereiche erfassen.
3. Sichtbare und dokumentierte App-Funktionen auf konkrete Dateien, Tests und
   Datenvertraege abbilden.
4. Android-/Capacitor-Struktur, Manifest, Gradle-Konfiguration, native Bruecken,
   In-App-Update-Policy und Webasset-Synchronisation kartieren.
5. Offline-, Service-Worker-, Cache-, Diagnose-, Uebersetzungs-, Medien-, Hilfe-
   und Releasepfade mit Belegen erfassen.
6. Vorhandene automatische Tests und Releasegates nach Zweck inventarisieren;
   keine Tests oder Builds ausfuehren.
7. Architektur- und Wartbarkeitsrisiken nur mit konkreter Evidenz benennen.
8. Pro Bereich vorlaeufig `KOPIEREN`, `PORTIEREN`, `NEU SCHREIBEN`,
   `ARCHIVIEREN` oder `NOCH ENTSCHEIDEN` empfehlen und die Unsicherheit nennen.
9. Widersprueche zwischen Dokumentation, Konfiguration und Quellstand melden.

### Nicht-Ziele

- keine Website-Baseline; Website nur nennen, wenn eine App-Schnittstelle darauf verweist
- keine tiefe Cloudflare-/Content-Backendanalyse; eigener G1-Teilauftrag folgt
- keine Zielarchitektur abschliessend entscheiden
- keine visuelle UI-Abnahme oder neuen Screenshots; eigener G1-Teilauftrag folgt
- keine Produktverbesserung implementieren

### Verbotene Aktionen

- Dateien in irgendeinem Repository erstellen, veraendern, verschieben oder loeschen
- Tests, Builds, Gradle, Capacitor-Sync, Service Worker oder lokale Server starten
- Dependencies installieren
- Worktrees anlegen, entfernen oder bereinigen
- Secrets, Passwoerter, Keystores oder Tokens suchen/anzeigen
- signieren, deployen, pushen oder Play-/Cloudflare-/Website-Zustaende veraendern
- weitere Agenten starten

## Akzeptanzkriterien

1. Branch, HEAD und Git-Status sind mit exakten Belegen bestaetigt oder als
   Abweichung gemeldet.
2. Jede grosse App-Funktionsgruppe besitzt konkrete Quell- und Testpfade.
3. Android-/Capacitor-/Releasekette ist vom Webquellstand bis zum AAB als
   nachvollziehbare, rein dokumentierte Sequenz beschrieben.
4. Mindestens die zehn wichtigsten Architektur-/Migrationsrisiken sind nach
   Schwere und Evidenz priorisiert; keine Spekulation wird als Fakt ausgegeben.
5. Eine vorlaeufige Migrationsklassifikation liegt pro Hauptbereich vor.
6. Ungeklaerte Punkte und benoetigte Folgepruefungen sind explizit getrennt.
7. Die Rueckgabe folgt `docs/templates/AGENT-HANDOFF.md` und endet mit dem
   vorgeschriebenen `WRN-AGENT-STATUS` sowie `END-CHECK: :)`.

## Tests und visuelle Belege

- Keine ausfuehrenden Tests in diesem Task.
- Belege stammen aus Git-Metadaten, Quellpfaden, vorhandenen Testdateien und
  vorhandenen Release-/QA-Berichten.
- Jede behauptete bestandene Pruefung muss als historischer vorhandener Beleg
  gekennzeichnet werden, nicht als in diesem Task neu ausgefuehrt.

## Daten, Privacy, Security und Kosten

- Nur lokale read-only Analyse.
- Keine externe Websuche erforderlich.
- Keine API-Aufrufe oder kostenpflichtigen Dienste.
- Rohlogs nur gezielt lesen; keine grossen Logs vollstaendig in die Rueckgabe kopieren.
- Ergebnis verdichten, damit der Main Task keinen unnoetigen Kontext erhaelt.

## Rollback/Ruecknahme

Nicht erforderlich, da der Agent keine Dateien oder externe Zustaende veraendern darf.

## Uebergabeformat

- Executive Summary
- verifizierter Quellstand
- Struktur- und Verantwortungsmatrix
- Funktions-/Datei-/Testmatrix
- Android-/Releasekette
- priorisierte Findings
- Migrationsklassifikation
- offene Fragen und Folgepruefungen
- ausdruecklich `keine Aenderungen`
- WRN-Statusblock mit `END-CHECK: :)`
