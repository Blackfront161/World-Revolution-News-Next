# WRN Project Instructions

Stand: 12. September 2026. Chief /root; Gesamtauftrag bis Release Candidate aktiv.

## Verbindlicher Auftrag

Alle PO-Anforderungen bleiben erhalten. Einzige RC-MUST-Matrix:
[WRN-PO-SCOPE-STATUS](docs/evidence/WRN-PO-SCOPE-STATUS-2026-09-10.md).
Nur offen, in Arbeit oder geschlossen; geschlossen erfordert eine erreichbare
Produktfunktion mit Testbeleg. PO092 entfernt „Globale Lage“ weiterhin.
[PROJECT-STATE](docs/PROJECT-STATE.md) ist die aktuelle operative Seite;
[Delegationsregister](docs/WRN-G3-021-DELEGATION-REGISTER.md) bindet Schreibrechte.

PO-Prozessauftrag aus Task 01a05cc6-05ee-7561-8895-597e174355eb, 12.09.,
15:32/15:35 UTC, von Root anhand der Originalnachrichten verifiziert:
Ablauf verschlanken, keine Anforderung unterlassen, Zielarchitektur beibehalten.
Diese neuere Prozessregel ersetzt historische Mikrogatepflichten; sie ändert
keine Architektur-, Daten-, Privacy-, Rechte- oder Releasegarantie.

## Arbeitsweise

- Sechs vertikale RC-Pakete gemäß PROJECT-STATE. Ein Writer behält sein Paket
  und korrigiert Findings bis zum Abschluss. Klare Pfade und Verantwortungen.
- Keine neuen Precheck-/Gate-/Writer-Runden für reine Test-, Bericht-, Hash-,
  Locator- oder Belegkorrekturen. Neuer Architekturvertrag nur bei wirklicher
  Architektur- oder Sicherheitsvertragsänderung.
- Risikobasiert unabhängig prüfen: Storage, Migration, Datenverlust, Privacy,
  Provider, Rechte und Release. Normale UI: fokussierte Tests und genau ein
  unabhängiger Abschlussreview. Dokument-/Hashkorrekturen prüft Root.
- Während Umsetzung fokussierte Tests; betroffene Gesamtsuite einmal je
  vollständigem Paket. Volle Workspace-/Browser-/Android-/Website-Matrix am
  finalen RC. Bei neuen relevanten Änderungen/Fehlern gezielt erneut prüfen.
  Keine Abschwächung von Sicherheitsorakeln oder Tests.
- Maximal zwei disjunkte Produktwriter und drei Subslots insgesamt, keine Kinder
  und kein zweiter Agentenpool durch unterstützende Tasks. Delegation erlaubt
  nur mit konkretem Paket-/Pfadbesitz; existierende Instanzen bevorzugen.
  Kein Writer verändert fremde WIP-Pfade oder nimmt sich selbst unabhängig ab.
- Künftig finale repräsentative Screenshots, ein Hashmanifest und ein
  Abschlussbericht je Paket versionieren. Temporäre Läufe, Traces, Builds,
  Logs und Zwischenbilder bleiben ignorierte Arbeitsartefakte. Bestehende
  Historie bewahren. Funktionsfähige Pakete committen statt Mikocommits.
- Nach jedem sichtbaren Paket frische App-/Website-Vorschau bereitstellen.
  Keine PO-Sichtabnahme oder Gesamtfreigabe aus lokalen Teilprüfungen ableiten.

## Unveränderte technische Grenzen

Priorität: Korrektheit/Datenschutz/Datenverlustschutz, Stabilität/Reproduzierbarkeit,
Modularität, Barrierefreiheit/Produktqualität, Kosten, Geschwindigkeit.
Bestehende Architektur, Paketgrenzen, APIs, versionierte Content-/Storageverträge,
Offline/Rollback/Revocation, Genuine-Ready-Provenienz, Rechte und Privacy erhalten.
Alt-Backend und vorhandene Komponenten prüfen und integrieren, nicht duplizieren.
Keine erfundene Quelle, Lizenz, Aktualität, Übersetzung oder Prüfbehauptung.
Keine externen Datenübertragungen ohne gebundene Grundlage; keine Secrets in
Code/Logs. Signierung, Installation, Versionsänderung, Play-Upload, Push und
Live-Deployment bleiben jeweils ausdrücklich gebundene externe Operationen.
Bestehende einzelne Testinstallationsgenehmigungen nicht erweitern.
Regeln: docs/03-TARGET-ARCHITECTURE.md, docs/04-QUALITY-RULES.md und
docs/10-AGENT-ORCHESTRATION.md, soweit die neuere Prozessregel nicht vorgeht.

## Aktueller Schreibbesitz

Root führt Integration, Matrix, Status und RC2-Vorschauen43198/99; die akzeptierten
RC3-Vorschauen43196/97 bleiben erhalten. RC3/A7 unabhängig PASS und eingefroren.
Sol /root/media_durability_completion hat sieben geprüfte Providerpfade und zwei
First-Boot-E2E-Pfade nach2/2 Chrome-PASS zurückgegeben; alle Testports frei.
Terra /root/media_ui_completion hat sechs korrigierte UI-/Copy-/Testpfade an Root
zurückgegeben. Root ist alleiniger Produktwriter des integrierten RC2-Pakets.
/root/a7_final_review hat die28-Pfad-Integration unabhängig mit PASS abgeschlossen;
keine offenen Findings, keine aktiven Schreib-/Prozessrechte. Keine Kinder.
Quelle/Providerpolicy unabhängig PASS; echte Provider-/Native-Decodierung und
laufende Metadatenversorgung weiter offen. Kein Gesamt-Medien-/Release-GREEN
aus den lokalen Teilprüfungen ableiten. Jüngste Prozesslenkung erhält sämtliche
Inhalte sowie Frontend-/Backendumfang.

## Historie

Der vollständige vorherige Stand ist bytegleich in
[AGENTS-Historie](docs/history/WRN-AGENTS-BEFORE-RC-WORKFLOW-2026-09-12.md)
archiviert. Historische Dispositionen starten keine alten Writer erneut.
