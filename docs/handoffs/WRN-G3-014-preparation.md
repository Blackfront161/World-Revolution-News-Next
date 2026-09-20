# Handoff – WRN-G3-014 Vorbereitung

- Agent: Main Agent; keine Mitarbeiterinstanz gestartet
- Task-ID: WRN-G3-014 / PO-070
- Ergebnis: Dokumentvorbereitung abgeschlossen; Implementierung nicht gestartet
- Datum: 28. August 2026
- Ausgang: `0f1cd7e` (G3-013-Abnahme), Produkt `0462b4c`, Re-QA `40f37f6`

## Kurzfazit

`weiter bitte` wurde entsprechend dem zuvor angebotenen naechsten Schritt
als reine Vorbereitung gebunden. G3-014 plant gespeicherte Inhaltsrevisionen
in getrennten IDB-Datenbanken, atomare Wechsel, zulaessige Rueckwechsel und
eng begrenzte Inhaltsloeschung. Ein Inhaltscache ist kein Shellcache:
Service Worker, Cache Storage und echter Offline-Kaltstart bleiben eigene
Folgeslices. Der gesamte Offline-MUST-Umfang bleibt bestehen.

## Verwendete Quellen

AGENTS.md, Product Charter, Source-of-Truth, Zielarchitektur, Qualitaetsregeln,
ADR-001/004/007, Migrationswellen, Risikoregister und Paritaetsmatrix;
G3-012-/G3-013-Task-/QA-Belege; aktuelle lokale Adapter, Content-/Domain-
vertraege, Packagegrenzen, Releasefiles und Browsertests. Ausgewaehlte
Legacy-Storage-/Workerquellen read-only anhand der gebundenen Repo-HEADs.
Oeffentliche MDN-/W3C-Dokumentation zur IndexedDB-/Quota-/SW-Grenze; genaue
Links und daraus abgeleitete Projektentscheidungen stehen im Inventar.

## Geaenderte Dateien

Nur Markdowndokumente: G3-014-Task Brief, Inventar/Vorpruefung, Abnahmeplan,
dieser Handoff; AGENTS.md, Source-of-Truth, Project State, Decision Log,
Mitarbeiter-Dashboard, Paritaetsmatrix, Risikoregister und Migrationswellen.
R-41/R-42 wurden auf ihre bereits bestehenden Abschlussbelege gebunden;
R-43 beschreibt die neue geplante Transaktions-/Revocationkontrolle.
Produkt, Tests, Fixtures, Assets, Builds und Legacyquellen bleiben gleich.
`.codex-remote-attachments/` bleibt unberuehrt.

## Tests und Belege

Vorbereitung: Git-/Dateidiff, Referenz-/Gatekonsistenz und `git diff --check`.
Je Client acht lokale JSON-Dateien mit insgesamt 18.258 Dateibytes erfasst.
Keine Browser-/Produkt-/DB-Tests ausgefuehrt, keine Datenbanken angelegt,
keine Offlinefunktion aktiviert. Vorhandene G3-013-Testergebnisse bleiben
historische Referenz, kein G3-014-GREEN. OFF-01 bis OFF-26 sind geplante Tests.

## Feststellungen nach Prioritaet

Keine neue behobene Produktstoerung behauptet. Die kritischen geplanten
Grenzen sind Crash-/Mehrtab-Atomizitaet, kumulative Revocation, IDB-Quota/
Schemaverweigerung, Clear-Rennen und ehrliche Offline-/Rollbackaussagen.
Sie muessen zuerst unabhaengig geprueft und danach implementiert/getestet werden.

## Annahmen und offene Fragen

Die Trennung Contentpersistenz vor Shellpersistenz ist der vorgeschlagene
risikoarme Schnitt. Mit einem spaeteren Startgate wird der schriftliche
Scope gebunden; davor kann der Product Owner diese Teilung korrigieren.
Datenbanknamen, 4-MiB-Bundle-/12-MiB-Gesamtbudget, Controlbudget und 24-h-
Offlinefrist sind lokale Entwurfswerte, keine produktiven Last-/Rechtebelege.
Der frische Architektur-Vorreview nach Start entscheidet vor Produktcode,
ob der Vertrag ausreichend und implementierbar ist; Findings stoppen.

## Restrisiken

Keine Garantie gegen vollstaendige Browserdatenloeschung, unerreichbare
neue Takedowns ohne Netz oder manipulierte Geraetezeit. Reale Inhalte,
authentisierte Provenienz, Legacy-Cutover, echte Shell-/Android-Upgrades,
vollstaendiges Clear-all und externe Veroeffentlichung bleiben separate Gates.
Kein neues Paket, keine Installation und keine zusaetzliche API-Ausgabe geplant.

## Empfohlener naechster Schritt

Product Owner prueft die Abgrenzung und erteilt bei Zustimmung
`START WRN-G3-014`. Erst dann read-only Architekturreview, bei GREEN
Backend/Data, Frontend, unabhaengige QA und Architekturabschluss sequenziell.
Keine automatische Ausfuehrung und keine vorweggenommene Sichtabnahme.

## WRN-AGENT-STATUS

- Task: WRN-G3-014 Vorbereitung
- Status: GREEN nur Dokumentvorbereitung; Produkt- und Reviewgates offen
- Quellstand: `0f1cd7e` / `0462b4c`
- Erledigt: Inventar, Taskvertrag, Risiko-/Abnahmematrix, Governance
- Tests: nur Dokument-/Referenz-/Diffpruefung; keine Runtimepruefung
- Offen: `START WRN-G3-014`, danach unabhaengiger Vorreview
- Handoff: `docs/handoffs/WRN-G3-014-preparation.md`
- Naechster Schritt: Product-Owner-Entscheidung
- END-CHECK: :)
