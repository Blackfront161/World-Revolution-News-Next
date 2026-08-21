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

Der aktuelle Zustand ist **Phase 0: Organisations- und Analysebasis**.

Bis der Product Owner das Gate `GO-IMPLEMENTATION` ausdruecklich freigibt:

- keinen Produktcode erzeugen;
- keine alten Produktdateien kopieren oder portieren;
- keine Abhaengigkeiten installieren;
- keine Apps, Server oder Datenbanken scaffolden;
- keine produktiven Dienste konfigurieren oder deployen;
- nur Dokumentation, Analyseartefakte, Agentenkonfiguration und sichere
  read-only-Pruefungen bearbeiten.

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
- Reserve-Agenten werden nur bei ihrem dokumentierten Ausloeser aktiviert.
- Der Main Agent synthetisiert Ergebnisse und bleibt fuer die Gesamtentscheidung
  verantwortlich. Sub-Agenten duerfen keine Freigabe des Product Owners ersetzen.

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
