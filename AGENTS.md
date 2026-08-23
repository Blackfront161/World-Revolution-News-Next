# WRN Project Instructions

## 1. Auftrag und Prioritaet

Dieses Repository baut das neue, professionelle Grundgeruest fuer World
Revolution News und Solinaridao auf. Der Product Owner ist ein Solo-Entwickler,
der nicht selbst Code schreibt und Entscheidungen ueber klare Berichte,
automatisierte Tests und visuelle Belege abnimmt.

Prioritaeten in dieser Reihenfolge:

1. Korrektheit, Datenschutz und Schutz vor Datenverlust
2. Stabilitaet und reproduzierbare Releases
3. Wartbare, modulare Architektur und saubere Schnittstellen
4. Barrierefreiheit und visuelle Produktqualitaet
5. Kosten- und Token-Effizienz
6. Geschwindigkeit

Zeitdruck ist kein Freigabegrund. Unklarheit wird dokumentiert und nicht durch
eine erfundene Annahme verdeckt.

## 2. Aktuelles Phasengate

Der aktuelle Zustand ist **Phase G3 / Vorbereitung WRN-G3-002**.

`WRN-G3-001` ist technisch akzeptiert. Diese enge Akzeptanz bestaetigt die
neutrale, lokal getestete Foundation; sie ist keine Design-, Funktions-,
Markenasset- oder Paritaetsfreigabe. Der vorbereitete Folgeauftrag steht in
`docs/tasks/WRN-G3-002-LOCAL-MANIFEST-NEWSFEED.md`.

Bis der Product Owner exakt `START WRN-G3-002` erteilt:

- keinen weiteren Produktcode schreiben;
- keine Mitarbeiter oder Sub-Agenten fuer die Umsetzung starten;
- nur Task-, Abnahme-, Status- und Governance-Dokumentation bearbeiten;
- keine Legacydateien, echten Inhalte oder Markenassets importieren;
- keine Dependencies installieren und keine Apps oder Server starten.

Die aktuelle Live-App und ihr Repository, die aktuelle Website und ihr
Repository, das Contentrepository sowie Cloudflare, Hostinger und Google Play
bleiben in jedem Fall read-only und unveraendert. Auch nach dem Startgate ist
nur der schriftliche G3-002-Scope im neuen Repository erlaubt. Datenbank,
echte Dienste, Remote/CI, Deployment, Signierung, Upload und Veroeffentlichung
bleiben separate Gates.

Dependencydownload, Browserbinaries und externe Programme benoetigen weiterhin
eine eigene sichtbare Einzelgenehmigung. Jede Scopeausweitung braucht einen
neuen Task Brief und gegebenenfalls ein weiteres Product-Owner-Gate.

## 3. Verbindliche Quellen

Vor jeder Altanalyse zuerst `docs/01-SOURCE-OF-TRUTH.md` lesen.

- Massgebliche aktuelle App-Quelle:
  `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current`
- App-Gesamtstand: Commit
  `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- Massgeblicher App-Runtime-Release: Commit
  `968c320adfe87d1e11e88f99f448a435d4242750`
- Massgebliche Website-Quelle:
  `C:\Users\patri\Documents\World Revolution News\wrn-web-portal-2026-08-20-r10n-work`
- Website-Stand: Commit
  `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`

Aehnlich benannte historische Verzeichnisse sind keine automatische Quelle.
Bei widerspruechlichen Dokumenten gilt die juengere, explizite Uebergabe vom
21. August 2026; Widersprueche muessen im Bericht genannt werden.

## 4. Produktgrenzen

- Mobile App und Website gehoeren zur gleichen Marke und teilen spaeter
  Design-System, Domainmodelle und API-Vertraege.
- Sie bleiben getrennte Anwendungen mit getrennten Cache-, Test-, Deployment-
  und Rollbackketten.
- Website-spezifische SEO-, Apache-, Landingpage- und Desktoplogik darf nicht
  blind in die App kopiert werden.
- App-spezifische Android-, Capacitor-, Offline- und Update-Logik darf nicht
  blind in die Website kopiert werden.
- Das Content-/Datenrepository bleibt getrennt und wird nur ueber versionierte
  Vertraege angebunden.
- World Revolution Map und das historische Kartenspiel sind nicht Teil des
  ersten Implementierungsziels. Jetzt sind nur stabile IDs, Deep Links,
  Geo-/Zeitdatenvertraege und barrierefreie Alternativen zu planen.

## 5. Agenten- und Delegationsregeln

- Custom Agents unter `.codex/agents/` sind Mitarbeiterprofile, keine
  dauerhaft laufenden Prozesse.
- Kein Profil startet sich selbst.
- Delegation ist nur erlaubt, wenn der Product Owner sie direkt verlangt oder
  ein freigegebener Task Brief `Delegation: erlaubt` enthaelt.
- Standardmaessig maximal zwei Sub-Agenten gleichzeitig einsetzen. Drei sind
  nur fuer klar unabhaengige, ueberwiegend lesende Aufgaben zulaessig.
- Parallele Schreibarbeit am gleichen Verzeichnis oder Vertrag ist verboten.
- Schreibende Agenten erhalten einen engen Dateibereich und ein eigenes
  Arbeitspaket; spaeter nach Git-Freigabe bevorzugt einen eigenen Worktree.
- Jeder Sub-Agent liefert eine kurze Evidenzuebergabe mit gelesenen Quellen,
  geaenderten Dateien, ausgefuehrten Tests, offenen Fragen und Risiken.
- Jede Agentenuebergabe verwendet `docs/templates/AGENT-HANDOFF.md`, aktualisiert
  bei laengerer Arbeit einen Checkpoint unter `docs/handoffs/` und endet mit dem
  vorgeschriebenen `WRN-AGENT-STATUS` einschliesslich `END-CHECK: :)`.
- Das fehlende `:)` ist nur ein Hinweis auf eine moeglicherweise unvollstaendige
  Uebertragung (`YELLOW`), kein automatischer Beweis fuer Context Rot.
- `context_continuity_auditor` bewertet Kontextgesundheit read-only anhand von
  Task Brief, Source-of-Truth, Handoff, Git-Diff und Belegen. Er darf Agenten
  weder starten, stoppen noch loeschen.
- Reserve-Agenten werden nur bei ihrem dokumentierten Ausloeser aktiviert.
- Der Main Agent synthetisiert Ergebnisse und bleibt fuer die Gesamtentscheidung
  verantwortlich. Sub-Agenten duerfen keine Freigabe des Product Owners ersetzen.

### Agenten-Lebenszyklus und einfache Befehle

- `PAUSIEREN: <name>`: laufenden Einsatz unterbrechen; Profil und Belege bleiben.
- `FEUERN: <name>`: laufende Instanz stoppen beziehungsweise einen abgeschlossenen
  Sub-Agent-Thread schliessen, nachdem Uebergabe und Arbeitsstand gesichert sind.
  Das wiederverwendbare Profil unter `.codex/agents/` bleibt erhalten.
- `ERSETZEN: <alter-name> -> <neues-profil>`: alten Einsatz sichern und stoppen;
  frischen Nachfolger zuerst read-only aus Handoff und Task Brief orientieren.
- `PROFIL LOESCHEN: <name>`: das exakt benannte TOML-Mitarbeiterprofil entfernen.
  Dieser ausdrueckliche Befehl ist erforderlich; automatische Profilloeschung
  ist verboten. Git bleibt der Wiederherstellungsweg.

Der Product Owner hat den Main Agent autorisiert, eine aktive Sub-Agent-Instanz
bei `RED`, unkontrollierter Schreibkonkurrenz oder akuter Scopeverletzung sofort
zu stoppen, wenn der vorhandene Git-/Dateistand zuvor soweit sicher moeglich
gesichert wird. Der Main Agent meldet den Stopp und den Wiederherstellungsstand.
Ein Nachfolger startet nie allein wegen eines fehlenden Zeichens, sondern erst
nach dokumentierter Rotation gemaess `docs/08-CONTEXT-CONTINUITY.md`.

## 6. Modellrouting

- `gpt-5.6-sol`: Architektur, schwierige Ursachenanalyse, Security, kritische
  Migrationen und unabhaengige Releasegates.
- `gpt-5.6-terra`: regulaere Implementierung, Integration und umfangreiche
  Code-/Dateianalyse.
- `gpt-5.6-luna`: klare, wiederholbare Extraktion, Berichte, Testmatrizen und
  kostenguenstige Routineaufgaben.
- `gpt-5.3-codex-spark`: eng begrenzte textbasierte Codekartierung und kleine,
  exakt spezifizierte Aenderungen. Spark trifft keine Architektur-, Security-
  oder Releaseentscheidung allein.
- Gemini Advanced ist eine externe Zweitmeinung fuer Screenshots oder einen
  abgegrenzten Architekturreview. Ergebnisse werden nie ungeprueft uebernommen.

Immer die niedrigste Modellstufe verwenden, die das definierte Risiko sicher
beherrscht. Fehlende Evidenz ist kein Grund, ein Ergebnis schoenzureden.

## 7. Arbeitsweise

Vor jeder Aenderung:

1. Product Charter, Source-of-Truth, Architekturgrenzen und Qualitaetsregeln lesen.
2. Einen Task Brief nach `docs/templates/TASK-BRIEF.md` anlegen oder bestaetigen.
3. Scope, erlaubte Dateien, Nicht-Ziele und Abnahmekriterien benennen.
4. Bestehenden Git-Status pruefen und fremde Aenderungen erhalten.

Bei Aenderungen:

- kleinste fachlich vollstaendige Aenderung bevorzugen;
- keine verdeckten globalen Nebenwirkungen;
- keine unversionierten API- oder Datenvertragsaenderungen;
- keine Duplikation gemeinsamer Domainregeln;
- keine generierten Artefakte als manuell gepflegte Quelle behandeln;
- keine Tests abschwaechen, Erwartungen blind anpassen oder Fehler ausblenden;
- keine Kommentare oder Dokumente mit unbewiesenen Produktionsbehauptungen.

Nach Aenderungen:

1. passende Tests und statische Pruefungen ausfuehren;
2. bei sichtbaren Funktionen die festgelegte Screenshotmatrix erzeugen;
3. Abweichungen und Konsolen-/Netzwerkfehler dokumentieren;
4. Diff auf ungewollte Dateien und Secrets pruefen;
5. Ergebnis in verstaendlicher Sprache mit Belegen uebergeben.
6. Bei Meilensteinen `docs/PROJECT-STATE.md` und den Task-Handoff aktualisieren.

## 8. Verbotene Aktionen ohne ausdrueckliche Einzelgenehmigung

- Dateien oder historische Arbeitsstaende loeschen oder verschieben
- Git-Historie umschreiben, Hard Reset oder Force Push
- Remote-Repositories erstellen, verbinden oder pushen
- Dependencies oder externe Programme installieren
- Wrangler-, Hostinger-, Firebase-, Supabase- oder sonstige Deployments
- Cloudflare-Secrets, Konfigurationen oder produktive Daten veraendern
- Keystores, Passwoerter, Tokens oder Secrets suchen, anzeigen oder kopieren
- AAB/APK signieren, Versionscode aendern oder Play-Console-Upload ausfuehren
- Website veroeffentlichen oder produktiven Cache umstellen
- kostenpflichtige API-Aufrufe ohne Budget- und Zweckfreigabe
- Mitarbeiterprofile, Handoffs oder Agentenbelege automatisch loeschen

## 9. Definition of Done

Eine Aufgabe ist nur abgeschlossen, wenn:

- alle Akzeptanzkriterien nachvollziehbar erfuellt sind;
- geforderte automatisierte Tests bestehen;
- visuelle Aenderungen mit Screenshots belegt sind;
- keine unerkannten Konsolen-, Netzwerk- oder Barrierefreiheitsfehler bleiben;
- Daten-, Datenschutz-, Offline- und Rollbackauswirkungen bewertet sind;
- geaenderte Dateien und Restrisiken aufgelistet sind;
- ein unabhaengiger Review stattgefunden hat, falls das Qualitaetsgate ihn fordert;
- der Product Owner bei visuellen oder produktrelevanten Aenderungen freigegeben hat.

Die vollstaendigen Gates stehen in `docs/04-QUALITY-RULES.md`.
