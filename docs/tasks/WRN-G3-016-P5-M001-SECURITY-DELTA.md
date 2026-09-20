# WRN-G3-016 – P5-M-001 enger Security-Deltacheck

## Identitaet und Scope

- Task-ID: `WRN-G3-016-S5-S1`.
- Exakter Diff: `12db80e..6721f83`.
- Scan-ID: `4c416926-2a45-43a6-9ff7-9659133aa536`; keinen Ersatzscan starten.
- Owner: ein frischer `security_privacy_reviewer`, Sol/high; keine Kinder.
- Produkt, Tests, Fixtures, Governance und Git read-only.
- Erlaubte Writes: verwalteter Scanordner,
  `docs/evidence/WRN-G3-016/p5-m001-security/**` und
  `docs/handoffs/WRN-G3-016-p5-m001-security.md`; kein Commit.
- Preflight READY; TAC-Advisory fuer diesen Scan einmal ausgefuehrt: `unknown`,
  Grants leer.

## Fokus

Pruefe nur, ob die Legacy-Home-Korrektur oder ihre unabhaengige QA einen
Security-/Privacy-Regressionspfad erzeugt:

- kein Umgehen von Manifest-/Descriptor-/Publication-Hash und Admission;
- Legacy nur bei abwesendem Homevertrag, niemals bei vorhandenem ungueltigem;
- nur bereits validierte Artikel, sichere React-Text-/URLbehandlung,
  Source-Confirmation und bestehende Reader-/Reading-State-Grenzen;
- keine neue Netz-, Cookie-, Telemetrie-, Storage-, Berechtigungs- oder
  Datenabflussflaeche;
- test-only Legacyroute/-hashkopie nicht aus Produktionsinput erreichbar;
- Evidencebilder/Dokumente nur auf Provenienz und Datenleckage pruefen.

## Verfahren und Gate

Den bereits gestarteten Codex-Security-Diffscan gemaess `security-diff-scan`
vollstaendig fortsetzen: Threat Model, Inventar, Discovery, gegebenenfalls
Validation/Attack Path, finaler complete Draft, genau eine Versiegelung und
Completed-Read. Jede geaenderte Datei accounted for. Keine Remediation.

Reportable/deferred Finding geht an Chief und blockiert P5. Null Findings bei
vollstaendiger Coverage ergibt nur S5-S1-GREEN; danach bleibt ein frischer
P5-Architektur-Recheck. Bericht/Handoff mit Scan-ID, Coverage, Findings,
Artefakten, Token/Kosten und `END-CHECK: :)`.

