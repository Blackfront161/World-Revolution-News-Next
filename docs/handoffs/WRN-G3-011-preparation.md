# Agent Handoff

- Agent: Chief AI Architect / Main Agent
- Task-ID: WRN-G3-011
- Ergebnis: bestanden

## Kurzfazit

WRN-G3-011 ist ausschliesslich dokumentarisch vorbereitet. Der Slice ersetzt
die ehrliche leere `Gespeichert`-Zwischenansicht spaeter durch eine rein lokale
Merkliste, Gelesen/Ungelesen und minimalen Lesefortschritt. Er verwendet
kanonische Artikel-IDs und getrennte clientlokale V1-Storageadapter.

Offline-Volltexte/Medien, echte Legacydaten, Androidmigration, Sync, Cloud und
Deployment bleiben ausgeschlossen. Kein Produkt-/Testcode wurde geaendert und
kein Mitarbeiter gestartet.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/02-FEATURE-PARITY-MATRIX.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/07-RISK-REGISTER.md`
- `docs/architecture/ADR-004-IMMUTABLE-CONTENT-CONTRACT.md`
- `docs/architecture/ADR-007-OFFLINE-AND-CACHE-CONTRACTS.md`
- `docs/architecture/MIGRATION-WAVES.md`
- G3-006-bis-G3-008-Reader-/ID-/Lifecyclevertraege
- aktuelle App `2216ff3`/Runtime `968c320`, read-only
- aktuelle Website `9a59b17`, read-only
- akzeptierter G3-010-Stand `39f95ec`/`e8e736d`
- Product-Owner-Befehl `fahre fort` nach Ankuendigung einer reinen
  Folgeslice-Vorbereitung

## Geaenderte Dateien

- `docs/tasks/WRN-G3-011-LOCAL-SAVED-READING-STATE.md`
- `docs/evidence/WRN-G3-011-SAVED-READING-PARITY-AND-ACCEPTANCE-PLAN.md`
- `docs/handoffs/WRN-G3-011-preparation.md`
- notwendige Governance-/Statusdokumente

Kein Produkt-, Test-, Fixture-, Asset-, Legacy- oder Livecode.

## Tests und Belege

- separater lokaler Branch `codex/g3-011-local-saved-reading-state`
- dokumentarischer Vorbereitungscheckpoint `fc248f1`
- Legacy-App-/Website-`reading-state.js` read-only verglichen; beide verwenden
  `wrn_bookmarks`, `wrn_read_list`, `wrn_read_positions` und dieselbe
  Save-/Read-/Progress-Basis
- aktive App-Runtime fuer Saved-Ansicht, Offlinekopplung und Loeschpfade
  read-only geprueft
- Zielprojekt: stabile `saved`-Navigation und ehrlicher
  `Noch nicht migriert`-Zustand bestaetigt
- G3-006-bis-G3-008-Kandidaten liefern kanonische lokale IDs und sichere
  Lifecyclezustaende
- keine Produkttests erforderlich, weil kein Produktcode geaendert wurde

## Feststellungen nach Prioritaet

### Medium – Datenverlust- und Inhaltsleckrisiko bei blinder Portierung

Die Legacybasis mischt URLs, Artikelobjekte, Lesepositionen und in der
neueren App Offlinepayload/Assetcache. Eine direkte Kopie koennte instabile
Schluessel, still verlorene Eintraege oder widerrufene Inhalte reaktivieren.
R-40 bindet deshalb kanonische IDs, validierten V1-Zustand, fail-closed
Lifecycleprojektion und explizite Loeschtests.

### Produktgrenze

G3-011 ist lokaler Nutzerzustand, nicht der gesamte Wave-4-Offline-Slice.
Volltexte, Medien, IndexedDB, Cache Storage, Service Worker und echter
Android-/Website-Cutover bleiben spaeter.

## Annahmen und offene Fragen

- `Gespeichert` ist wegen der bereits sichtbaren Navigation und klaren
  Release-1-MUST-Klassifikation der naechste sinnvollste lokale Slice.
- Speichern und Gelesen bleiben unabhaengig; Entfernen aus der Merkliste
  loescht keinen Lesestatus.
- Fortschritt wird minimal und normalisiert gespeichert; konkrete
  Schwellwerte gehoeren zentral in die Domain und nicht in beide UIs.
- App und Website verwenden dieselbe Semantik, aber getrennte Keys, Adapter,
  Layouts und spaetere Migrationen.

## Restrisiken

- Storage-full/blockiert muss ohne falsche Erfolgsanzeige behandelt werden.
- Legacy-URL-zu-ID-Mapping kann unvollstaendig sein; unbekannte sichere
  Identitaeten duerfen nicht still geloescht werden.
- Automatische Gelesen-Markierung darf nicht durch blosses Oeffnen ausgeloest
  werden.
- Loeschaktionen duerfen Theme und andere Einstellungen nicht beruehren.
- Reale Android-WebView-/Website-Origin-Migration bleibt ausserhalb dieses
  lokalen Slices.

## Empfohlener naechster Schritt

Nur Empfehlung; keine automatische Ausfuehrung.

Der Product Owner prueft Task Brief und Abnahmeplan. Erst mit exakt
`START WRN-G3-011` darf der Backend/Data-Agent Vertrag, Domain und lokale
Migrationsfixture implementieren. Nach gesichertem Handoff folgt der
Frontend-Agent; danach unabhaengige Visual-/Accessibility-QA.

## WRN-AGENT-STATUS

- Task: WRN-G3-011 Lokale Merkliste und Lesestatus
- Status: GREEN – NUR DOKUMENTARISCH VORBEREITET
- Quellstand: neues Repository G3-010-Abnahme `39f95ec` mit Bindung
  `e8e736d`, G3-011-Vorbereitung `fc248f1`; App `2216ff3`/Runtime `968c320`;
  Website `9a59b17`; Legacyquellen unveraendert read-only
- Erledigt: Altparitaet, V1-Vertrag, ID-/Lifecycle-, Storage-, Migrations-,
  Loesch-, UI-, Test-, Sichtabnahme-, Kosten- und Rollbackgrenzen vorbereitet
- Tests: Quellstaende und relevante Legacy-/Zielpfade read-only geprueft;
  Dokumentformat und Diff werden vor Checkpoint geprueft
- Offen: separates sichtbares Implementierungsgate `START WRN-G3-011`
- Handoff: `docs/handoffs/WRN-G3-011-preparation.md`
- Naechster Schritt: Product-Owner-Pruefung, danach optional
  `START WRN-G3-011`
- END-CHECK: :)
