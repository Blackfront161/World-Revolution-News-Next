# WRN-G3-020 P2-R4-R1 – enge Storekorrektur vor Testcompletion

Status: **GEBUNDEN; PRODUKTWRITE BIS ZU FRISCHEM SOL-PRECHECK-GREEN GESPERRT**

## Ziel und Bindung

Der unabhaengige R4-Precheck `5b3ba82` blockiert die test-only Writer mit
zwei Medium-Produktfindings:

- `P2-R4-PRE-M-001`: Activate akzeptiert eine niedrigere Safetyrevision bei
  voller Coverage statt `protected`;
- `P2-R4-PRE-M-002`: gueltige mehrfach verwendete `(namespace,id)`-
  Referencekeys werden nicht dedupliziert.

Dieses Paket korrigiert nur diese beiden Ursachen und fuegt drei echte IDB-
Regressionen hinzu. `P2-R4-PRE-L-001` wird getrennt im R4-Commitprotokoll
geschlossen. Alle anderen R3-Produktpfade und der Kandidat `4ec5fe6` bleiben
eingefroren. Kein R4-A-/R4-B-Writer startet vor Abschluss dieses Pakets und
einem neuen R4-Precheck.

## R1-01 – operationstypisierte Lower-Semantik

`persistSourceSafety` erhaelt die konkrete Operation `activate|rollback` als
internen, nicht callerwaehlbaren Parameter aus `rotate()`.

- `activate` mit `source.revocationRevision < stored.revision` endet immer
  `protected`;
- `rollback` mit niedrigerer Revision darf nur weiterlaufen, wenn jeder
  Source-Entry-Key durch das gespeicherte Ledger blockierend abgedeckt und
  jede Original-/Replacementreference im gespeicherten Katalog vorhanden
  ist;
- Reject aendert Safety, Control, Slots und Generation nicht, rotiert nicht,
  loescht nichts und wiederholt nicht automatisch;
- gleiche und hoehere Revision bleiben exakt nach P2-R3.

Echter isolierter IDB-Test: neueres valides Safetyledger plus gueltiger
Candidate mit niedrigerer, vollstaendig abgedeckter Revision. `activate()`
muss `protected` liefern; Active/Candidate/Previous, Controlgeneration,
Safetyrecord und Restartzustand bleiben bytegleich.

## R1-02 – eindeutige Reference-Union

`referencesFromBundle` validiert zuerst jede Source-Revocation und ihre
Original-/Replacementziele gegen das vollstaendig validierte Sourcebundle.
Erst danach werden References per exaktem `(namespace,id)`-Key dedupliziert,
ASCII-sortiert und als monotone Union weiterverarbeitet.

- Mehrere Revocations derselben ID mit unterschiedlichen `objectSha256`
  erzeugen genau einen Original-Referencekey;
- mehrere Entries mit demselben Replacementziel erzeugen genau einen
  Replacement-Referencekey;
- Missing, falscher Namespace/Prefix, ungueltige oder Self-Reference bleiben
  `protected`;
- Dedupe darf keine Revocation, keinen Status und keinen blockierenden
  Entry-Key entfernen;
- Count-/Bytecaps, Hashpraeimage und Vorabvalidierung bleiben unveraendert vor
  dem ersten `put`.

Zwei echte positive IDB-Regressionen:

1. dieselbe ID mit zwei unterschiedlichen Objekthashes: erfolgreicher Merge,
   genau ein Original-Referencekey und bytegleicher Restart;
2. zwei Entries mit gemeinsamem Replacementziel: erfolgreicher Merge, genau
   ein Replacement-Referencekey und bytegleicher Restart.

## Exakte Allowlist

Erst nach frischem Sol-Precheck-GREEN darf genau ein
`backend_data_reliability_engineer` Terra/high ohne Kinder schreiben:

1. `apps/mobile/src/mobile-regional-events-store.ts`
2. `tests/e2e/g3-020-regional-events-store-harness.ts`
3. `tests/e2e/g3-020-regional-events-store.spec.ts`
4. `docs/evidence/WRN-G3-020/P2-R4-R1-PRODUCT-CORRECTION.md`
5. `docs/handoffs/WRN-G3-020-p2-r4-r1-product-correction.md`

Contract-/Loader-/Selectiontests, Fixture/Pin, Contractquelle, Packageindex,
UI, Governance, Config/Lock, Dependencies, Website, Provider und externe
Gates bleiben OUT. Zusatzpfad oder neues Testhook/Produktflag = Stop.

## Pflichtpruefungen

- drei neue echte Chrome-IDB-Regressionen ohne stille Skips;
- bestehende drei G3-020-IDB-Faelle bleiben GREEN;
- fokussierte und volle Contract-/Mobiletests, beide Typechecks;
- zehnpfadiger ESLint und Prettier;
- 19 Boundaries, Releaseboundary, Fixtureprovenienz;
- Fixture/Pin plus sieben Boundaryhashes und Diffcheck;
- Produktcommit enthaelt nur die drei Produkt-/E2E-Pfade, Dokumentcommit nur
  Evidence/Handoff.

## Gatefolge

1. Frischer unabhaengiger Sol-Precheck dieses Pakets.
2. Nur bei null Findings genau ein Terra/high-Writer.
3. Chief reproduziert Scope, Tests, IDB-Regressionen und Hashes.
4. Frische Terra-QA schliesst `P2-R4-PRE-M-001/M-002`.
5. Versiegelter Sol-Security-/Privacy-Deltacheck endet mit null
   reportable/deferred Findings.
6. Chief aktualisiert den R4-Testvertrag und bindet exklusive Stage+Commit-
   Reihenfolge A, danach B.
7. Frischer Sol-R4-Precheck vor jedem Spark-/Terra-Testwriter.
8. P3, G3-021 und alle externen Gates bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R4-R1-PRODUCT-CORRECTION
- Status: Vertrag gebunden; Produktwrite bis Sol-Precheck-GREEN gesperrt
- Basis: Produkt `4ec5fe6`; QA `afd4c05`; R4-Precheck `5b3ba82`
- Findings: `P2-R4-PRE-M-001/M-002`; Low wird im R4-Protokoll gebunden
- Rechte: beim Chief; noch kein Writer aktiviert
- Naechster Schritt: frischer Sol-Precheck
- END-CHECK: :)
