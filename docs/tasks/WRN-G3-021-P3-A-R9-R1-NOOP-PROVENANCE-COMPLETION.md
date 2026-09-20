# WRN-G3-021 P3-A-R9-R1 – No-op-Provenienzabschluss

Status: **ZUR FRISCHEN ABSCHLUSSPRÜFUNG GEBUNDEN – KEIN PRODUKTWRITE**

## Basis, Finding und Vorrang

- Produktkandidat:
  `c2265afd8cb4c8391f6a34d8f9b97533cba3e8d9`.
- R9-Vertrag: `dd6bbad6dfebbffc4bb46b765c9b25914c01e128`.
- RED-Precheckbeleg: `3241642`.
- Zu schließen: `P3-A-R9-PRE-M-001` – ein verspätetes Save-`no-op` kann
  einen bereits vor Save A vorhandenen exakten Resume-Record löschen.

Dieser R1-Nachtrag hat bei jeder Abweichung Vorrang vor R9. Alle nicht
ausdrücklich geänderten R9-01- bis R9-04-Regeln bleiben verbindlich. Vor einem
frischen unabhängigen Sol/high-R1-Abschlussrecheck mit null Findings besteht
kein Produkt- oder Testwrite. P4-B und OUT/extern bleiben gesperrt.

## R1-01 – Mutationsprovenienz ist Pflicht

Eine Nachlaufkompensation darf nur starten, wenn gemeinsam gilt:

```text
result.kind === 'saved'
&& result.state enthält next feldgleich
&& deleteIfExact verwendet next und result.state.generation
```

Dann und nur dann darf genau eine result-state-, generation- und
recordexakte `deleteIfExact`-Mutation beginnen. Resolve, `no-op`, Reject und
Throw dieser Kompensation bleiben vollständig sinklos: keine Änderung von
Resume-Status, Player, Projektion, URL, neuem Run oder anderem Record.

Für jedes verspätete `result.kind === 'no-op'` gilt dagegen unabhängig vom
Result-State:

```text
0 Kompensationsaufrufe
0 weitere Storemutationen
0 öffentliche Senken
```

Ein exakter Record im Result-State beweist bei `no-op` keine Mutation durch
Save A. Er kann bereits vorher vorhanden sein oder nach einem
Generationmismatch zum aktuellen Zustand gehören und muss erhalten bleiben.
Ein neues Provenienzfeld, Store-Schema, Retry oder zusätzlicher Snapshot ist
verboten.

Die kleinste Produktänderung liegt ausschließlich in
`apps/mobile/src/mobile-media-hub.ts`: Der bestehende Confirmed-Guard wird
zusätzlich an `result.kind === 'saved'` gebunden. Andere Hub-Lifecycle-,
Cleanup-, CAS-, Status- und Privacyregeln bleiben byte- beziehungsweise
semantikgleich.

## R1-02 – verpflichtende Datenverlust-Regressionen

Unit und echte Chromium-/IndexedDB-Spec belegen mindestens:

1. vor Save A vorhandener exakter Record, Save A pending, Run B, danach
   exact-`no-op`-Resolve: null Delete, Record bytegleich und Generation
   unverändert, Run B in allen öffentlichen Senken unverändert;
2. derselbe Fall mit Unmount vor `no-op`-Resolve: null Delete, Record
   bytegleich und keine öffentliche Senke;
3. Generationmismatch-`no-op` mit exaktem Record im zurückgegebenen aktuellen
   State: null Delete und aktueller State vollständig erhalten;
4. bestätigtes `saved` nach Run B: genau eine exakte Kompensation, kein
   anderer Record verändert und alle öffentlichen Senken unverändert;
5. bestätigtes `saved` nach Unmount: genau eine exakte Kompensation und keine
   öffentliche Senke;
6. `saved` ohne feldgleiches `next` im Result-State: null Kompensation;
7. Kompensations-`no-op`, -Reject und -Throw nach einem echten `saved`:
   jeweils keine Status-, Player- oder Folgemutation und kein Retry.

Die IDB-Fälle messen reale Transaktions-/Generation-/Record-Nachzustände;
bloße Mockaufrufzahlen reichen dort nicht.

## R1-03 – Präzisierung der 42-Zellen-Matrix

R9s `save`-Zeile wird ersetzt:

| Senke | verpflichtender echter Ablauf |
| --- | --- |
| `save` | Save bleibt pending und die Ursache invalidiert vor Fulfillment. Release-Expiry, Source-Block und Episode-Block liefern bestätigtes `saved` mit genau einer sinklosen Exact-Kompensation. Rights-Expiry, Series-Block und Audioasset-Block liefern ein vorbestehendes exact `no-op`; sie führen zu null Delete und erhalten Record sowie Generation. |

Damit erreichen alle sechs Ursachen dieselbe echte Savegrenze, belegen aber
sowohl zulässige `saved`-Kompensation als auch verbotene `no-op`-Kompensation.
Die festen R9-Zuordnungen der getrennten Cleanup-`no-op`-Spalte und der
`late-result`-Spalte bleiben zusätzlich verbindlich. Die sieben
Datenverlust-Regressionen aus R1-02 dürfen als Unterfälle passender
Matrixzellen ausgeführt werden, müssen aber jeweils separat literal
ausgewiesen sein.

## R1-04 – korrigierte exakte Sieben-Pfad-Allowlist

1. `apps/mobile/src/mobile-media-hub.ts`
2. `apps/mobile/src/mobile-media-player.ts`
3. `apps/mobile/src/mobile-media-player.test.ts`
4. `apps/mobile/src/mobile-media-hub.test.ts`
5. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
6. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
7. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

Diese Liste ersetzt R9s Sechs-Pfad-Allowlist und dessen Hub-Read-only-Satz.
Alle übrigen R9-Sperren gelten weiter. Insbesondere Resume-Store, P2,
Fixtures, Assets, App/UI, Config, Dependencies und Git-Index bleiben
read-only. Es gibt keinen neuen Testhook im Produktcode.

## Pflichtabschluss

Der spätere Writer- und Chiefabschluss umfasst die vollständige R9-Matrix,
alle fünf Player-Storage-Rechecks und alle sieben R1-02-Regressionen sowie
sämtliche in R9 genannten statischen, Browser-, Boundary-, Fixture-, Release-
und Hashgates. Die volle Mobile-Baseline bleibt ehrlich getrennt.

Nach einem frischen R1-Recheck-GREEN bindet der Chief erst ein separates
Writer-Gate. Danach darf genau ein frischer `frontend_brand_engineer`
Terra/high ohne Kinder die sieben Pfade ändern. Nach Kandidat und Chief-
Reproduktion folgen wieder frische unabhängige Terra-QA und defensiver
Integrity-/Privacy-Recheck. P4-B startet vor deren GREEN und finalem
Architekturabschluss nicht.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R9-R1-NOOP-PROVENANCE-COMPLETION`
- Status: `P3-A-R9-PRE-M-001` eng gebunden; frischer Sol/high-R1-Recheck nötig
- Produkt-/Testwrite: gesperrt
- P4-B und OUT/extern: gesperrt
- END-CHECK: :)
