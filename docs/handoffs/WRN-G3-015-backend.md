# Agent Handoff – WRN-G3-015 P2 Backend/Data (gesicherter WIP-Stopp)

- Agent: `backend_data_reliability_engineer`, Terra/high.
- Task-ID: WRN-G3-015 P2 / `/root/g3015_backend`.
- Ergebnis: teilweise / **YELLOW**, weitere Runtime-Produktarbeit angehalten.
- Elternbrief, Rolle und Instanz-ID: `docs/tasks/WRN-G3-015-BACKEND-PACKET.md`;
  Backend/Data-Owner, kein Lead, keine Kinder.
- Basiscommit / Ergebniscommits / Branch und Worktree: `a906dbf` /
  `115d8a7`, `38f5375` / `codex/g3-015-website-offline-shell`, gemeinsames
  Zielrepository.
- Slot-ID / zentraler Slotvergeber / Status aller Kinder: S2 / Chief `/root` /
  keine Kinder.
- Schreibarbeit beendet / Rechteuebergabe und Slotfreigabe bestaetigt durch:
  nach diesem Handoff an Chief; keine eigene Slotfreigabe behauptet.
- Unabhaengiger Reviewadressat: Main/Chief.

## Kurzfazit

Der enge Generator-/Worker-/Adapter-WIP ist lokal gesichert, aber P2 ist nicht
vollstaendig und nicht integrationsreif. Die frischen Build-/Browserproben
belegen nur begrenzte, direkte Workerregistrierungsfluesse. Sie sind weder ein
Defaultadapter-Enable-/Remove-Nachweis noch ein G3-014-Content-Save-
Kaltstartbeweis. Eine Safety-Pause verhindert weitere punktuelle Runtimefixes,
bis ein frischer gezielter Incident-/Vertragsabgleich das Control-/Generation-/
Registrationmodell bindet.

## Verwendete Quellen

- `docs/tasks/WRN-G3-015-WEBSITE-OFFLINE-SHELL.md`, B1–B4.
- `docs/tasks/WRN-G3-015-BACKEND-PACKET.md`.
- P1-R1-Recheck und Handoff; `docs/templates/AGENT-HANDOFF.md`.
- Eigene Checkpoint-Evidence:
  `docs/evidence/WRN-G3-015/p2/CORE-CHECKPOINT.md` und
  `docs/evidence/WRN-G3-015/p2/EARLY-RED.md`.

## Geaenderte Dateien

Gesicherter WIP in `115d8a7` und `38f5375`:

- `apps/website/src/offline-shell/**`
- `apps/website/tools/build-offline-shell.{mjs,test.mjs}`
- `apps/website/package.json`
- `tests/e2e/global-setup.ts`
- `tests/e2e/website-shell-built.spec.ts`
- `docs/evidence/WRN-G3-015/p2/**`

Dieser Abschluss schreibt nur diese Datei. Die parallele
`docs/handoffs/WRN-G3-015-chief-handoff.md`-Aenderung und
`.codex-remote-attachments/` bleiben unberuehrt.

## Tests und Belege

- `@wrn/website test:offline-shell`: PASS, 1 Vitest + 3 Node-Contracttests.
- `@wrn/website typecheck`: PASS.
- `@wrn/website build`: PASS; Shell-ID
  `e43d4fc762e0a042a90fbfcdf91463140e57bd9ea94e97019170663215661325`,
  1.841.533 Bytes.
- Isolierte Built-Shell-E2E: 4/4 PASS (Opt-in/Provenienz/Offline Query+Hash,
  fremdes HTML, malformierter Controlrecord, Remove-Schutz).
- Root `format` und `git diff --check`: PASS vor diesem Handoff.

Die E2E-Proben registrieren den Worker direkt. Sie belegen nicht die
Browserplattform/den Adapter als Standardintegrationsweg, keine Persistenz eines
G3-014-Content-Saves vor dem Offlinekaltstart, keine volle Prozessneustart-
oder Mehrtabmatrix. `EARLY-RED.md` ist ausdrücklich nur eine Zusammenfassung;
fehlende rohe Fehlerruns wurden nicht nachkonstruiert.

## Feststellungen nach Prioritaet

1. **B2/B4 Kernrisiko, offen:** Der installierte Worker ersetzt bei einem
   `missing`-Controlrecord diesen innerhalb `install` durch `enabled: true`.
   Das ist kein bereits fachlich gebundener Nachweis fuer sichere Recovery oder
   durable Enable-Ownership und darf nicht als vollstaendiges fail-closed-
   Verhalten ausgegeben werden.
2. **B1/B2 Generationrisiko, offen:** Der Fetchpfad bindet Antworten an den
   globalen Wert `control.ready === MANIFEST.shellId`. Ein wartendes B kann
   damit das Controlfeld veraendern, waehrend aktive A-Tabs noch A bedienen
   muessen. Aktiv/Waiting/Ready sind nicht belastbar getrennt modelliert.
3. **B3/B4 offen:** Drei-Slot P/A/B-waiting/C, Updatejobticket-/Lockreihenfolge,
   spaete Promise-Ergebnisse, Remove-Quieszenz, Workertermination und Recovery
   sind nicht als echte Browserablaufmatrix belegt.
4. **SHELL-03/04/05/06/07/08/09 offen:** Kein vollständiger Defaultadapter-
   Enablefluss mit gespeicherten G3-014-Inhalten; kein sauberer echter
   Prozessneustart, Paketrollback, Quote-/Abort-/Timeout-/Activatefehler oder
   Mehrtab-/Fremdregistrationsnachweis. SHELL-09 ist nur für die vier engen
   erlaubten Workerpfade teilbelegt.

## Annahmen und offene Fragen

- Der nächste Owner übernimmt keinen Produkt-GREEN-Status aus den vier
  direkten Proben.
- Ein frischer, eng begrenzter Incident-/Vertragsabgleich muss zuerst das
  Ownership-/Epoch-/Generationmodell und die deadlockfreie
  Registrationjob-Reconciliation entscheiden; keine weiteren punktuellen
  Runtimepatches vorher.
- UI-Copy und UI-Orchestrierung bleiben P3-Owner. Die WIP-Adaptertypen sind
  nur ein vorläufiger Vertrag und keine Freigabe für UI-Speicherlogik.

## Restrisiken

Vor dem Abgleich wäre ein weiterer Enable-, Update- oder Remove-Fix anfällig
für Datenverlust-, gemischte Generation- oder falsche Ready-Behauptungen.
Keine Live-/Cloud-/Legacy-/Android-/Content-/Safetydaten wurden verändert;
jedoch besteht aktuell keine ausreichende fachliche Aussage über sicheren
Shellbetrieb.

## Empfohlener naechster Schritt

Chief startet einen frischen, read-only, gezielten Incident-/Vertragsabgleich
für Controlrecord, aktive/wartende Generationen, Install/Activate und
Registrationjobs. Erst danach eine neu gebundene Backendfortsetzung mit
test-first B1–B4/SHELL-Matrix; keine automatische P3-Freigabe.

## WRN-AGENT-STATUS

- Task: WRN-G3-015 P2 Backend/Data.
- Status: YELLOW / WIP gesichert, Runtimearbeit pausiert.
- Quellstand: `a906dbf`; WIP-Commits `115d8a7`, `38f5375`.
- Erledigt: Generator-/AST-/begrenzter Worker- und Testgrundbestand.
- Tests: oben; keine vollständige P2-Matrix.
- Offen: B1–B4-/SHELL-Kernrisiken und vollständige Defaultintegration.
- Handoff: `docs/handoffs/WRN-G3-015-backend.md`.
- Naechster Schritt: Chief disponiert frischen Incident-/Vertragsabgleich.
- END-CHECK: :)
