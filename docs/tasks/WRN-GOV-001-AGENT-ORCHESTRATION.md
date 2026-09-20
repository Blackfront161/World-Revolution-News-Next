# Task Brief – WRN-GOV-001 Agentenorganisation

## Identitaet

- Task-ID: `WRN-GOV-001`
- Status: GREEN – Chief-Abstimmung und gezielte Hauptcheckoutintegration abgeschlossen;
  Beleg: `docs/handoffs/WRN-GOV-001-chief-integration.md`
- Auftraggeber: Product Owner, 28. August 2026
- Auftrag: begrenzte Fachlead-/Subagentenorganisation in Absprache mit dem Chief integrieren
- Zustaendiger Agent: Main im Task `WRN G2 – Zielarchitektur & ADRs`
- Abstimmung: `WRN – Chief AI Architect & Orchestrierung`
- Delegation: keine neuen Subagenten in diesem Governancepaket; explizit
  autorisierte Abstimmung mit dem bestehenden Chief-Task

## Ziel in beobachtbarer Sprache

Vorhandene Frontend-/Backendprofile koennen bei ausdruecklich freigegebenen
Teilauftraegen eng begrenzte Helfer koordinieren. Zustands-, Rechte-, Kosten-,
Schreib- und QA-Grenzen sind ueber alle Ebenen eindeutig. Kein Produktteam
startet allein durch diese Dokumentaenderung.

## Ausgangslage und Belege

- Worktree: `C:\Users\patri\.codex\worktrees\0a7b\Sauberes Wo Rev Ne`
- Branch/Startcheckpoint: `codex/wrn-g3-foundation@04e349d`, sauber
- Produktstand: WRN-G3-001 abgeschlossen; Live-/Releasegates bleiben geschlossen
- Dieser Worktree ist historisch. Massgeblicher Hauptcheckout laut Chief:
  `codex/g3-013-ui-language-preference@662b29c`, G3-013 akzeptiert;
  G3-014 nur vorbereitet, `START WRN-G3-014` nicht erteilt. Keine Uebernahme
  alter Produktstatusabschnitte in den Hauptcheckout.
- Nachfolgende Chief-Nachricht: PO erlaubt dem Chief G3-014 als groesseres
  Paket nach abgeschlossener Organisationsabstimmung/-integration. Dieses
  Governancepaket startet nichts; Chief bindet das neue Gate separat.
- Quellen: AGENTS.md, Product Charter, Source-of-Truth, Zielarchitektur,
  Quality Rules, Roster, Continuity, Cost Routing, Task-/Handoff-Vorlagen
- Technische Referenz: https://learn.chatgpt.com/docs/agent-configuration/subagents
- Vorhandene Config: maximal drei Subagenten je Session; keine Erhoehung geplant

## Scope

Erlaubt: `AGENTS.md`, `docs/03-TARGET-ARCHITECTURE.md`,
`docs/04-QUALITY-RULES.md`, `docs/05-AGENT-ROSTER.md`,
`docs/06-DECISION-LOG.md`, `docs/08-CONTEXT-CONTINUITY.md`,
`docs/09-AGENT-ACTIVITY-INDEX.md`, neues `docs/10-AGENT-ORCHESTRATION.md`,
`docs/architecture/COST-AND-MODEL-ROUTING.md`, Task-/Handoff-/Delegationsvorlagen,
dieser Brief, Task-Handoff, Project State und die drei bestehenden Profile
Frontend, Backend und QA. Geschuetzte Profilpfade nur mit erforderlicher
Sandboxfreigabe bearbeiten.

Nicht-Ziele/Verbote: Produktcode, neue Profile oder sichtbare Tasks, Pilotstart,
Modellwechsel, Dependencies, Tests/Builds/Server der Produkte, Legacyzugriffe,
Liveaenderungen, Kostenfreigaben, Remoteaktionen oder eigenmaechtiger Merge in
den Chief-Hauptcheckout. Kein zweiter Schreiber auf denselben Dateien.

## Akzeptanzkriterien

1. Chief-Rueckmeldung mit nachvollziehbarer Disposition dokumentiert.
2. Maximal zwei Delegationsstufen, globales Slotbudget inklusive Nachkommen und
   zentrale Slotvergabe; kein neuer Slotpool je Lead/Task.
3. Explizite Weiterdelegation, Teilauftraege, Dateibesitz, Integration,
   unabhängige QA und Stop-/Recoveryregeln sind operationalisiert.
4. Aufwand und Nutzen des spaeteren Piloten sind messbar; fehlende Tokenwerte
   bleiben unbekannt statt geschaetzt als Tatsache ausgegeben.
5. Keine Schutzgrenze/Modellkonfiguration unbemerkt erweitert; keine neuen
   Agenten automatisch gestartet.
6. Dokumente/Profile konsistent, Diff geprueft, Handoff und State aktuell,
   lokaler Git-Checkpoint gesichert und Chief informiert.

## Tests und Belege

- Dokument-/Link-, Scope- und Widerspruchspruefung
- TOML-Syntax/Profilmetadaten mit vorhandenen Werkzeugen, keine Installation
- `git diff --check`; Chief-Review des fertigen Pakets
- Produkt-/Visualtests: nicht zutreffend, keine Produktveraenderung

## Daten, Privacy, Security und Kosten

Keine Nutzerdaten, Produktrequests oder Zusatz-APIs. Dokumentierte Grenzen
gelten auch fuer Kindagenten. Organisationsfreigabe ersetzt keine Produkt-,
Live-, Budget- oder Releasefreigabe.

## Ruecknahme und Handoff

Gezielter Revert des Governancecheckpoints nach Freigabe; keine Loeschung von
Profilen/Handoffs. Handoff:
`docs/handoffs/WRN-GOV-001-agent-orchestration.md`.
