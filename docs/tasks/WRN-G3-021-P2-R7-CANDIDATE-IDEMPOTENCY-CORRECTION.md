# WRN-G3-021 P2-R7 – Candidate-Idempotenzkorrektur

## Feste Basis und Finding

Der finale unabhängige Sol-P2-Architekturabschluss auf Basis
`e1eedab2c95768335499c48ed2498465cbc4876f` bestätigt R6 und alle früheren
Findingketten, bleibt aber RED mit genau dem Product-Medium
`G3-021-P2-FINAL-M-001`: Ein identischer Retry des bereits gespeicherten
Candidate-only-Stands endet am öffentlichen `saveCandidate()`-Pfad mit
`conflict`, obwohl R1 bei gleicher höchster Revision und gleichem Release-
Transporthash ein idempotentes No-op bindet.

Der Zustand blieb in der Reproduktion vollständig unverändert. Es gibt null
Privacy-, Datenverlust-, separate Coverage- oder deferred Findings. Dieser
Vertrag korrigiert ausschließlich die gleiche-Revision-/gleicher-Hash-
Entscheidung und bindet sie für alle erreichbaren Slots. Vor einem frischen
unabhängigen Sol/high-Precheck mit null Findings besteht kein Produkt-, Test-
oder Browserwrite. P3 und alle OUT-/externen Bereiche bleiben gesperrt.

## R7-01 – slotvollständiges identisches No-op

Nach vollständigem Parse, Rootpin-, Freshness-, Admission-, Rights-, Consent-
und Candidatecheck sowie nach `expectedGeneration`-Prüfung gilt bei
`incoming.revision === control.highestAcceptedRevision`:

1. Befindet sich in mindestens einem aktuell validierten Slot `candidate`,
   `active` oder `previous` ein Bundle mit derselben Revision und demselben
   SHA-256 der exakten Release-Transportbytes, liefert `saveCandidate()` den
   vollständigen unveränderten Vorherzustand als Erfolg zurück.
2. Dieses No-op erhöht weder `generation` noch `highestAcceptedRevision`,
   schreibt keinen Slot, keinen Controlrecord und keinen Safetyrecord und
   rotiert nichts.
3. Die Reihenfolge ist verbindlich: `expectedGeneration`, frische Clock und
   der vollständige Candidatevalidator bleiben vor der No-op-Entscheidung.
   Ein abgelaufener, korrupter, future oder falsch gepinnter Input darf nicht
   allein wegen eines Hashvergleichs akzeptiert werden.
4. Ein Match ist nur gültig, wenn Slotrevision und Transporthash beide dem
   eingehenden Candidate entsprechen. Es gibt keine Normalisierung, keinen
   Vergleich nur von IDs und keinen Hash über andere Bytes.

Die drei positiven Slotformen werden echt und getrennt belegt:

- **Candidate-only:** erster Save erzeugt Generation 1 und `candidate`; der
  identische Retry mit `expectedGeneration: 1` liefert denselben vollständigen
  Snapshot und null Writes.
- **Active:** der bereits bestehende identische Active-Retry bleibt
  idempotent und vollständig unverändert.
- **Previous/highest nach explizitem Rollback:** A aktivieren, höheren B-
  Candidate speichern und aktivieren, anschließend explizit auf A
  zurückrollen. B liegt danach als `previous`, während
  `highestAcceptedRevision` B bleibt. Ein identischer B-Retry ist ein No-op;
  er staged B nicht erneut. Das vorhandene explizite Roll-forward bleibt der
  einzige Weg, `previous` wieder nach `active` zu tauschen.

## R7-02 – gleicher Revisionsstand mit anderem Hash bleibt Konflikt

Ist die eingehende Revision gleich `highestAcceptedRevision`, aber kein
validierter Slot besitzt zugleich dieselbe Revision und denselben Release-
Transporthash, liefert `saveCandidate()` weiterhin `conflict`.

Für `candidate`, `active` und `previous/highest` wird je ein vollständig
gültiger, gleichrevidierter, anders gebundener Candidate verwendet. Jeder
Fall prüft:

- öffentliche Kategorie exakt `conflict`;
- Active, Previous, Candidate, Control und Safety vor/nach vollständig byte-
  und strukturidentisch;
- keine Rotation und keine Generationserhöhung.

Lower bleibt `invalid-candidate`; Higher durchläuft unverändert alle
Safety-/Reference-/Rights-/Capkontrollen vor dem ersten Write. Ein Hashmatch
in einem Slot mit anderer Revision, ein Match nur gegen `releaseId` oder ein
Testmock des Transporthashs ist unzulässig.

## R7-03 – Regressionen und reale Senken

Pflicht sind sowohl fokussierte Storetests als auch echte Chrome-/IndexedDB-
Fälle. Mindestens folgende Grenzen bleiben zusätzlich unverändert GREEN:

- R6-Loader-/Caporakel und alle 26 bestehenden Browserfälle;
- Candidate-/Active-/Previous-, Control- und Safety-Readback;
- Lower, Equal-different, Higher-additive, Block, Rollback/Roll-forward,
  Future-/Corrupt-, Timeout-/Abort- und Storagefailure-Semantik;
- Rootpin, Raw-/Descriptorbindung, Current-time, Rights/Admission, Caps,
  `totalJson + 1`, Revision-2/Outer-1 und Streamtyping;
- keine Logs, Telemetrie, externen Requests oder neue Datenverarbeitung.

Die neue Matrix darf parametrisiert sein, muss aber alle drei Slots und beide
Gleichheitsausgänge literal benennen. Ein Helper-only-Test ersetzt den
öffentlichen Store- und echten IDB-Pfad nicht.

## Exakte Fünf-Pfad-Allowlist

1. `apps/mobile/src/mobile-media-catalog-store.ts`
2. `apps/mobile/src/mobile-media-catalog-store.test.ts`
3. `tests/e2e/g3-021-media-catalog-store.spec.ts`
4. `docs/evidence/WRN-G3-021/P2-R7-CANDIDATE-IDEMPOTENCY-CORRECTION.md`
5. `docs/handoffs/WRN-G3-021-p2-r7-candidate-idempotency-correction.md`

Loader, Contractmodul/-tests, Fixtures, Assets, Releasepin, Packages,
Lockfiles, Dependencies, App-/Website-UI und Player bleiben read-only. Die
bekannten unversionierten Codex-Verzeichnisse bleiben OUT und unangetastet.

## Pflichtmatrix und Folgegates

Nach einem gesicherten Sol-Precheck-GREEN darf genau ein frischer
`backend_data_reliability_engineer` Terra/high ohne Kinder die fünf Pfade
umsetzen. Vor einem Ergebniscommit sind unter exakt Node 24.19 Pflicht:

- beide direkten Typechecks;
- vollständige fokussierte Contract-/Loader-/Store-Vitestmatrix, mit neuen
  R7-Slotfällen zusätzlich zu den bestehenden 92;
- vollständige echte Chrome-/IndexedDB-Spec, mit neuen R7-Fällen zusätzlich
  zu den bestehenden 26;
- scoped Prettier und ESLint `--max-warnings=0`;
- 19 Boundarytests, Fixtureprovenienz und Releaseboundary;
- zehn Schutz-Hashes, `git diff --check` und exakte Fünf-Pfad-Allowlist.

Der Writer verändert keinen Git-Index und erstellt keinen Commit; der Chief
reproduziert und integriert nur bei vollständigem GREEN. Danach folgen
frische unabhängige Terra-QA und ein defensiver Sol-Integrity-/Privacy-
Recheck. Erst beide GREEN erlauben einen erneuten finalen frischen Sol-P2-
Architekturabschluss.

P3, UI/Player, reale Quellen/Medien, Provider, Website/Live, Android/AAB/Play,
Signierung, Upload, Deployment und Release bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R7-CANDIDATE-IDEMPOTENCY-CORRECTION`
- Status: gebunden; frischer unabhängiger Sol/high-Precheck erforderlich
- Finding: `G3-021-P2-FINAL-M-001`
- Produkt/Privacy/deferred: 1 Medium / 0 / 0
- Allowlist: exakt fünf Pfade
- P3/OUT/extern: gesperrt
- END-CHECK: :)
