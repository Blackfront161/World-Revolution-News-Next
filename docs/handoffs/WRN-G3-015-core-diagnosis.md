# Agent Handoff – WRN-G3-015 S3 Core-Diagnose

- Agent: `incident_debugger`, Sol/high.
- Task-ID: WRN-G3-015 S3, `/root/g3015_diagnosis`.
- Ergebnis: Diagnose abgeschlossen; zwei echte RED-Kernfindings, P2 YELLOW.
- Elternbrief/Rolle: `docs/tasks/WRN-G3-015-CORE-DIAGNOSIS.md`, read-only Incident.
- Basis: `d218ff51373c3efb70198f56f754cb950652e7b0`; Produkt-WIP
  `115d8a7`/`38f5375`, S2-Handoff `5460f34`; Ergebniscommit folgt in Uebergabe.
- Branch/Worktree: `codex/g3-015-website-offline-shell`, gemeinsames Repository.
- Slot: S3, Chief `/root`; keine Kinder oder Weiterdelegation.
- Schreibarbeit nach Sicherung eigener Evidence/Handoff beendet;
  Rechte-/Slotfreigabe bleibt beim Chief.
- Unabhaengiger Reviewadressat: Main/Chief.

## Kurzfazit

Zwei Highs auf unveraendertem Worker echt reproduziert. Kein Produktfix und
kein P2-/P3-GREEN. Benoetigt wird eine kohaerente interne Vervollstaendigung
des Control-/Generations-/Jobmodells plus Defaultplattform im vorhandenen
P2-Scope, kein Generatorneuaufbau oder neue ADR. Einzelne Guardpatches allein
reichen fuer B1–B4 nicht.

## Feststellungen nach Prioritaet

- **S3-H-001, hohe Sicherheit:** Worker macht aus missing Control selbst
  enabled/Epoch1 und legt Payload an. Native Registrierung war bewusst
  Testausloeser, kein Nachweis einer automatischen Registrierung bei Besuch.
- **S3-H-002, hohe Sicherheit:** B-ready ueberschreibt globale Readybindung;
  A bleibt Browsercontroller, beide A-Tabs scheitern bei Assetabruf und eine
  Rootnavigation scheitert, obwohl A-Cache unveraendert vorhanden ist.
- Weitere Punkte nur Sourcebefunde: divergente Window-/Worker-Controlform,
  verlorene Generationsfelder, unvollstaendige Tickets/Ownershipreconciliation,
  remove startet im Adapter zuerst register, Read-open-Race gegen Entfernen,
  fehlende Gesamtdeadline/Restart-/Slotcleanup-/Defaultstatusintegration.

## Tests und Belege

Bericht: `docs/evidence/WRN-G3-015/diagnosis/CORE-DIAGNOSIS.md`.
Reproduzierbarer eigener Harness: `diagnosis/reproduce.mjs`.

- Kanonisch `diagnosis/run-p55U0d/raw-report.json`: Chrome152.0.7977.64,
  Node24.19.0, echte eigene Origin62230, neuer kurzer Profilpfad;
  **2 RED-Sollassertions, 0 Harnesserrors, Exit1**.
- Echte native SW-/Cache-/Netzwerkabfolge auf synthetischen A/B-Paketen durch
  unveraenderten produktiven Generator; keine Routenmocks/Workerinstrumentierung.
- Erstlauf `diagnosis/run-HiR0rF/raw-report.json`: D01 RED, D02 zu frueh vor
  waiting/ready abgefragt. Dessen gruene Assertion ist ausdruecklich KEIN
  qualifizierter PASS. Rohdateien/Fixtures nicht ueberschrieben; enger
  Harnessfix vor kanonischem Lauf, keine Produktkorrektur.
- Kein voller Website-/G3-014-Content-/Prozessrestart-/Remove-/Rollbacklauf.
  Keine bisherigen S2-Tests oder Units als eigene Ergebnisse beansprucht.
- Node-Syntaxcheck `node --check diagnosis/reproduce.mjs`: PASS / Exit0.
  Read-only Produktdiff gegen d218ff5 leer; keine Rootformat-/Gesamtsuite
  behauptet. Eigener staged Diffcheck folgt vor lokaler Sicherung.

Kanonischer Rohreport SHA256:
`c200b2f5e17f6653e690da7aa2bb998db701cc957fac0b9ba27f19be02eb8ee3`.
Workerquellhash:
`9fdcbcf65c3faacf4b9b59a2bd5b8a1a9b9b37847d3c65bfd1deb584bf425258`.
Weitere Source-, Harness-, Payload- und Workerhashes stehen im Bericht/Rohreport.

## Verwendete Quellen und geaenderte Dateien

Gelesen: kompletter Diagnosebrief, Elternvertrag B1–B4, BACKEND-PACKET,
beide PRECHECKs/Handoffs, S2-Handoff, aktuelle AGENTS-Grenzen/3–9,
Charter/Source-of-Truth/Quality/ADR-007/Handofftemplate; enge Shellsources,
vorhandene Direktregistrierungsprobe und Generatorform. Primaerreferenzen
W3C-Lifecycle und MDN CacheStorage.open eng gegengeprueft.

Geschrieben ausschliesslich:

- `docs/evidence/WRN-G3-015/diagnosis/CORE-DIAGNOSIS.md`
- `docs/evidence/WRN-G3-015/diagnosis/reproduce.mjs`
- `docs/evidence/WRN-G3-015/diagnosis/.gitattributes` nur fuer bytegetreue
  Sicherung der eigenen Rohbelege/Generatorausgaben, kein Root-Gitattributes;
- beide dortigen `run-*`-Ordner: eigene rohe Reports, synthetische A/B-Pakete,
  generierte Originalworker, kanonische ausgefuehrte Harnesskopie;
- dieser Handoff.

Keine fremden Aenderungen gestaged, Produkt/Bestandstests/Governance read-only.
Tempprofile erhalten, nur eigene Browserprozesse/Server sauber beendet.

## Empfohlener naechster Schritt und Grenzen

Chief bindet eine frische Backendfortsetzung: gemeinsame strikt validierte
begrenzte Controlform; Ready je manifestgebundener Generation; eigene erwartete
Epoch/Job-ID fuer Mutationen; getrennte Enable/Update/Removejobs mit Settlement
ausserhalb Lock und Reconciliation darunter; read-only Cachezugriff ohne
Neueroeffnung; nichtkritische Activate-Nacharbeit; ehrliche Pending-/Recovery-
und Defaultadapterzustaende. Tests zuerst, keine P3-Sicherheitsorchestrierung.

Kleinste weitere diskriminierende Probe: Workerfetch vor Payload-open pausieren,
zweites Fenster entfernt dauerhaft, dann alten open freigeben; kein neuer
Payloadcachename. Bisher Sourcebefund, kein behaupteter Browserbeleg.
Danach echte Job-/Quieszenz-/P-A-B-waiting-C-/Rollback-/Restartmatrix und voller
Defaultweg mit fachlichen G3-014-Readerassertions; `#root` nichtleer reicht nicht.

Stale Writes duerfen keine neue Enable-Epoch uebernehmen. Daraus wird kein
neues pauschales Verbot abgeleitet, dass ein alter noch kontrollierender Worker
identische vollstaendige, erneut ausdruecklich autorisierte Shellbytes liest.
Identitaet, Storageberechtigung und Operationsautoritaet getrennt behandeln.

## Delegationsaufwand

Eine fokussierte Runde, zwei kurze Browserlaeufe und eine enge Harnesskorrektur;
keine Helfer, keine Produktnacharbeit, keine Vollrepoanalyse. Kein Konflikt mit
Chief-Governance. Tokenkosten unbekannt, neue externe APIausgaben 0 CHF.
Keine Installation, Legacy/Live, PO-Origin/Userprofil, Android, Cloud, Remote,
Deployment, Signierung, Upload oder Release.

## WRN-AGENT-STATUS

- Task: WRN-G3-015 S3.
- Status: Diagnose abgeschlossen, zwei RED-Kernfindings; P2 YELLOW.
- Quellstand: d218ff5, Produkt-WIP115d8a7/38f5375 unveraendert.
- Erledigt: zwei echte Reproduktionen und enger kohaerenter Wiederaufnahmeplan.
- Tests: kanonisch 2 RED/0 Harnesserrors/Exit1; Erstlauf separat disponiert.
- Offen: P2-Fortsetzung und unabhaengige Nachweise; kein P3-GREEN.
- Handoff: docs/handoffs/WRN-G3-015-core-diagnosis.md.
- Naechster Schritt: Chief uebernimmt und disponiert nach gesichertem Ende.
- END-CHECK: :)
