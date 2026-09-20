# WRN-G3-021 P2-R7 – Writer-Gate

## Freigabe und feste Basis

Der finale unabhängige Sol/high-R7-R2-Abschlussrecheck ist im Commit
`1a4d706` mit null Blocker-, High-, Medium-, Low-, Coverage-, Privacy- oder
deferred Findings gebunden. Der unveränderte P2-Produktstand vor R7 ist
`9de38687adad1bcf24a0dd65fc01b446a4f38bb1`; der R6-Teststand ist
`baf622a94ca69f5eaaf63a1ed0bf0b80d5b45f36`.

Nach dem separaten Commit dieses Gates darf genau ein frischer
`backend_data_reliability_engineer` Terra/high ohne Kinder R7, R7-R1 und
R7-R2 umsetzen. Es gibt keinen Parallelwriter. Der Writer verändert keinen
Git-Index und erstellt keinen Commit; er übergibt nur vollständig GREENen,
ungestagten WIP an den Chief.

## Exakte Fünf-Pfad-Allowlist

1. `apps/mobile/src/mobile-media-catalog-store.ts`
2. `apps/mobile/src/mobile-media-catalog-store.test.ts`
3. `tests/e2e/g3-021-media-catalog-store.spec.ts`
4. `docs/evidence/WRN-G3-021/P2-R7-CANDIDATE-IDEMPOTENCY-CORRECTION.md`
5. `docs/handoffs/WRN-G3-021-p2-r7-candidate-idempotency-correction.md`

Loader, Contractmodul/-tests, Fixtures, Assets, Releasepin, Packages,
Lockfiles, Dependencies, App-/Website-UI und Player bleiben read-only. Die
bekannten unversionierten Codex-Verzeichnisse bleiben OUT und unangetastet.

## Verbindliche Produktkorrektur

Der Writer setzt ausschließlich um:

1. `validState()` erzwingt nach vollständiger Slot-/Rawprüfung genau einen
   Transporthash je Revision über Active, Candidate und Previous. Alle drei
   Same-revision-/Different-hash-Paare enden `protected`, read-only.
2. Equal Highest plus passender Slotrevision und -transporthash kann für
   Candidate-only, Active und Previous/highest idempotent den vollständigen
   unveränderten Vorherzustand zurückgeben.
3. Vor diesem No-op müssen Input/State, `expectedGeneration`, frische Clock
   und `nextSafety() !== null` bestanden sein. `nextSafety()` bleibt read-
   only; Safety wird weiterhin erst bei `activate()` persistiert und exakt
   zurückgelesen.
4. Equal Highest ohne passenden Slothash bleibt `conflict`. Lower bleibt
   `invalid-candidate`; Higher und Activate/Rollback behalten alle Safety-,
   Rights-, Reference-, Cap-, Block- und Readbackkontrollen.
5. Previous/highest-Retry staged oder aktiviert nichts; explizites
   `rollback()` bleibt der einzige Roll-forward-Tausch.

Candidate bleibt bewusst außerhalb der gespeicherten `validState()`-
Safetydeckung. Es gibt keine Verlagerung von Safetypersistenz zu
`saveCandidate()` und keine Änderung der bestehenden Expiry-, Quota-, Abort-
oder Activation-Safety-Readbacksinks.

## Verbindliche Testmatrix

Zusätzlich zur unverändert bestehenden Baseline müssen echte öffentliche
Store- und Chrome-/IndexedDB-Fälle belegen:

- drei No-ops: Candidate-only, Active, Previous/highest;
- drei Equal-revision-/Different-hash-Conflicts für dieselben Slotformen;
- drei Same-revision-/Different-hash-Split-brain-Paare:
  Active/Candidate, Active/Previous, Candidate/Previous;
- inkompatible Lower- und Equal-different-Safety als `protected` sowie
  kompatibles `nextSafety() !== null` ohne Safetypersistenz;
- für alle genannten No-op-, Conflict- und Schutzfälle vollständige Raw-/
  Snapshotidentität und je `mediaBundles`, `mediaControl`, `mediaSafety`
  `put/add/delete/clear = 0`; Prototype-Restore in `finally` und Cleanup
  außerhalb des Messfensters;
- Candidate-Paare können auch durch nachfolgenden Activateversuch keinen
  Hashwechsel oder Write auslösen.

Die bestehenden 92 Vitest-, 26 Browser- und 19 Boundaryfälle bleiben
unverändert vorhanden und GREEN; neue R7-Fälle kommen hinzu. Kein bestehender
Test, Titel oder gebundener Activation-/Faultsink darf entfernt, integriert
oder semantisch verschoben werden.

## Pflichtläufe und Übergabe

Unter exakt Node 24.19 sind vor Übergabe Pflicht:

- beide direkten Typechecks;
- vollständige fokussierte Contract-/Loader-/Store-Vitestmatrix;
- vollständige echte Chrome-/IndexedDB-Spec mit
  `--project=mobile-390x844 --workers=1`;
- scoped Prettier und ESLint `--max-warnings=0`;
- 19 Boundarytests, Fixtureprovenienz und Releaseboundary;
- zehn Schutz-Hashes, `git diff --check` und exakte Fünf-Pfad-Allowlist.

Bei Finding, Zusatzpfad, Fixture-/Pin-/Dependencybedarf oder nicht
reproduzierbarer Senke stoppt der Writer fail-closed. Nach Writer- und Chief-
GREEN folgen frische unabhängige Terra-QA und ein defensiver Sol-Integrity-/
Privacy-Recheck. Erst beide GREEN erlauben einen erneuten finalen frischen
Sol-P2-Architekturabschluss.

P3, UI/Player, reale Quellen/Medien, Provider, Website/Live, Android/AAB/Play,
Signierung, Upload, Deployment und Release bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R7-WRITER-GATE`
- Status: gebunden; Writer darf erst nach separatem Gatecommit starten
- Basis: `1a4d706`
- Allowlist: exakt fünf Pfade
- P3/OUT/extern: gesperrt
- END-CHECK: :)
