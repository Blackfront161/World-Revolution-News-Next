# WRN-G3-021 P2-R7 – Architekturprecheck-Handoff

## Ergebnis

**RED / FAIL** auf fester Basis
`c83c9c71119b3f85449d701cebb5b2abc2d29af7`.

Counter:

- 0 Blocker;
- 0 High;
- 2 Medium;
- 1 Low, davon 1 separate Coverage-/Assurance-Low;
- 0 Privacy;
- 0 deferred.

## Offene Findings

### P2-R7-PRE-M-001 – Same-revision-Split-brain nicht fail-closed

R7-01 erlaubt No-op, sobald irgendein Slot Revision und Transporthash matcht.
Der aktuelle `validState()`-Pfad erlaubt aber mehrere Slots derselben Revision
mit verschiedenen Transporthashes. Active H1 plus Candidate H2 derselben
Highest-Revision kann den Zustandscheck passieren; ein H1-Retry wuerde als
No-op quittiert, und das bestehende `activate()` koennte H2 anschliessend nach
Active rotieren. Damit waere der R1-Equal-different-Konflikt nach Corrupt-IDB
umgehbar.

Erforderlich: Alle vorhandenen Slots derselben Revision muessen denselben
Transporthash besitzen, sonst `protected`, read-only und keine Reparatur. Ein
echter IDB-Split-brain-Fall muss Retry und nachfolgende Aktivierungsmoeglichkeit
fail-closed belegen. Previous/highest nach regulaerem Rollback bleibt gueltig,
weil nur Previous die hoechste Revision traegt.

### P2-R7-PRE-M-002 – Safetykompatibilitaet fehlt vor Equal-No-op

Der Vertrag bindet Inputparse, Current-time, Rootpin, Rights und
Candidatevalidator, nicht aber `nextSafety(candidate, rawBundle,
before.safety) !== null`. `validState()` prueft Safety nur gegen Active und
Previous, nicht Candidate. Candidate-only plus extern hoeherer oder
gleichrevidiert anders gebundener, fuer sich gueltiger Safetyrecord kann daher
den Zustandscheck passieren und wuerde vom Slotmatch falsch positiv quittiert.

Erforderlich: Equal-No-op erst nach read-only `nextSafety`-Kompatibilitaet;
sonst `protected` und null Writes. `candidateBlocked()` bleibt wie bisher erst
Aktivierungssemantik.

### P2-R7-PRE-L-001 – echtes Nullwrite-Orakel unterbestimmt

Snapshotidentitaet beweist keine Schreibfreiheit. Die echte Chrome-/IDB-
Matrix muss fuer positive No-ops, Equal-different-Konflikte und neue
Schutzfaelle `put/add/delete/clear` auf allen drei Stores zaehlen und literal
exakt null binden; Prototypen werden in `finally` restauriert.

## Was bereits tragfaehig ist

- Candidate-only-, Active- und Previous/highest-No-op sind regulaer
  erreichbar.
- Equal-different-Praeimages sind durch echte, neu gepinnte Releasebytes bei
  gleicher Revision erreichbar.
- Slotrevision plus Release-Transporthash, Input-Freshness, Rootpin,
  Descriptor-/Raw-, Admission-/Rights-/Consentchecks koennen vor dem No-op
  bleiben.
- Lower bleibt `invalid-candidate`; Higher bleibt hinter allen bestehenden
  Safety-/Reference-/Rights-/Capkontrollen.
- Die unveraenderte Fuenf-Pfad-Allowlist reicht aus; kein Harness-, Contract-,
  Fixture-, Asset-, Package- oder Dependencywrite ist erforderlich.

## Naechstes Gate

Chief bindet einen rein dokumentarischen R7-R1-Nachtrag fuer die drei Punkte.
Danach ist ein frischer unabhaengiger Sol/high-Recheck erforderlich. Vor
dessen null Findings besteht kein Produkt-, Test- oder Browserwrite.

P3, UI/Player, reale Quellen/Medien, Provider, Website/Live,
Android/AAB/Play, Signierung, Upload, Deployment und Release bleiben
gesperrt. Zukuenftige Map-/Game-Vertraege bleiben ausserhalb dieses Scopes.

## Rechteende

- Produkt-/Test-/Fixture-/Browserwrites: keine
- Git-Index/Commit: nicht beruehrt
- Eigene Writes: nur Evidence und dieser Handoff
- Status: Rechte beendet
- END-CHECK: :)
