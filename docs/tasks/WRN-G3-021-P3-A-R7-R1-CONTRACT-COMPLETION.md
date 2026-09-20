# WRN-G3-021 P3-A-R7-R1 – Privacy-/Faultorakel-Vertragsabschluss

Status: **ZUR FRISCHEN ABSCHLUSSPRÜFUNG GEBUNDEN – KEIN PRODUKTWRITE**

## Basis und unveränderte Grenzen

- Fester Produktkandidat:
  `67cc5921334867e97f5b0e124c934549b5605928`.
- R7-Vertrag:
  `docs/tasks/WRN-G3-021-P3-A-R7-PRODUCT-PRIVACY-ASSURANCE-CORRECTION.md`.
- Unabhängiger RED-Precheck: Evidencecommit `8c83a5e` mit genau
  `P3-A-R7-PRE-PRIV-M-001` und `P3-A-R7-PRE-A-M-001`.
- Dieser Nachtrag präzisiert ausschließlich R7-04 und R7-05. Alle früheren
  P3-/P3-A-Verträge, Schutzgrenzen und die unveränderte siebenpfadige
  Allowlist bleiben bindend.

Vor einem frischen unabhängigen Sol/high-R1-Abschlussrecheck mit null High-,
Medium-, Low-, Privacy-, Coverage- oder deferred Findings besteht kein
Produkt- oder Testwrite. P4-B und OUT/extern bleiben gesperrt.

## R7-R1-01 – erfülltes Save und exakte Privacy-Kompensation

Jeder Pause-Save hält unveränderlich `saveEpoch`, den vollständigen erwarteten
achtfeldrigen `next`-Record und die erwartete Eingangsgeneration. Nach jedem
erfüllten `save()` wird zuerst ausschließlich dessen zurückgegebener
`result.state` ausgewertet; `result.kind` allein autorisiert weder Behalten
noch Löschen.

### Noch aktueller Save

Ist `saveEpoch === lifecycleEpoch` und der Hub weiterhin gemountet, gelten
literal:

- `saved` und vollständiger feldgleicher `next` im Result-State:
  `knownRecord = next`, Status `saved`;
- `no-op` und vollständiger feldgleicher `next` im Result-State:
  `knownRecord = next`, Status `no-op`; der bereits vorhandene exakte Record
  ist bekannt;
- `saved` oder `no-op` ohne vollständigen feldgleichen `next`: kein
  `knownRecord`, Status `no-op` und keine Löschung;
- Reject/Throw: kein Erfolg, kein Retry, Status `resume-clear-failed` nur,
  solange derselbe Epoch noch aktuell und der Hub gemountet ist.

### Während des Save invalidierter Lauf

Gilt nach Fulfillment `saveEpoch !== lifecycleEpoch`, wird unabhängig von
`result.kind === 'saved'` oder `result.kind === 'no-op'` genau dann höchstens
ein kompensierendes
`deleteIfExact(next.key, next, result.state.generation)` gestartet, wenn der
vollständige `next`-Record im zurückgegebenen Result-State feldgleich
vorhanden ist. Ein fehlender oder abweichender Record bestätigt einen No-op;
hier erfolgt kein Delete. Es gibt keinen zweiten Snapshot, kein Auto-Retry und
keine Löschung anhand der alten Eingangsgeneration.

Der Delete-Ausgang ist literal:

| Rückgabe | persistente Wirkung | sichtbarer Resume-Status |
| --- | --- | --- |
| `deleted` | ausschließlich `next` ist generation-/recordexakt entfernt | `deleted` nur bei weiterhin gemountetem Hub und derselben auslösenden Invalidierung |
| `no-op` wegen Missing, Generation- oder Recordrace | keine weitere Mutation | `no-op` nur bei weiterhin gemountetem Hub und derselben auslösenden Invalidierung |
| Reject/Throw | keine Erfolgsbehauptung, kein Retry | `resume-clear-failed` nur bei weiterhin gemountetem Hub und derselben auslösenden Invalidierung |
| jedes Late-result nach neuerem Lauf oder Unmount | die bereits gestartete exakte Storemutation darf enden | keinerlei Status-, Player-, URL-, Projektion-, Seek- oder weitere Resume-Mutation |

Die „dieselbe auslösende Invalidierung“ wird mit einem nach der Invalidierung
erfassten Cleanup-Epoch gebunden. Eine spätere Invalidierung oder ein neuer
Lauf verdrängt jeden älteren Statussink. `blocked` dominiert `stale` auf der
Availability-Achse; ein alter Save-/Delete-Reject darf weder `blocked` noch
`stale` durch `storage-failure` oder einen Resume-Status überschreiben. Ein
aktueller Snapshot-/Storefehler ohne konkurrierende Invalidierung bleibt
hingegen ehrlich `storage-failure` beziehungsweise
`resume-clear-failed` gemäß R7.

Pflichtbelege unterscheiden mindestens:

1. aktuelles `saved` mit exact record;
2. aktuelles `no-op` mit exact record;
3. altes `saved` mit exact record;
4. altes `no-op` mit exact record;
5. `saved`/`no-op` mit Missing- und Mismatch-State;
6. Delete `deleted`, Missing-/Generation-/Record-`no-op` und Reject/Throw;
7. jedes vorgenannte Resultat rechtzeitig sowie spät nach neuem Lauf und
   Unmount.

## R7-R1-02 – literale Fault-Solltabelle

Die Faultfälle laufen isoliert und sequenziell. `URL erzeugt` zählt nur eine
erfolgreich zurückgegebene Object URL. Nach terminalem Cleanup ist der
Elementwert `src` literal leer. Für den festen weiterhin gültigen lokalen
Kontext gelten exakt:

| Fault | Playback | Availability | Fehlerklasse | Element-`src` | URL erzeugt | Revoke |
| --- | --- | --- | --- | --- | ---: | ---: |
| Bodyreader-Reject/Throw | `error` | `local` | `network-error` | `''` | 0 | 0 |
| SHA-256-Digest-Reject/Throw | `error` | `local` | `network-error` | `''` | 0 | 0 |
| `createObjectURL`-Throw | `error` | `local` | `network-error` | `''` | 0 | 0 |
| `src`-Setter-Throw | `error` | `local` | `network-error` | `''` | 1 | 1 |
| synchroner `load()`-Throw | `error` | `local` | `network-error` | `''` | 1 | 1 |
| `play()`-Reject | `error` | `local` | `network-error` | `''` | 1 | 1 |
| live gebundenes DOM-`error`-Event nach erfolgreichem Start | `error` | `local` | `invalid` | `''` | 1 | 1 |

Der live DOM-Fall muss nach einem nachweislich erfolgreichen Start den noch
gebundenen aktuellen `onerror`-Handler auslösen. Ein `load()`-Throw mit einem
anschließend bereits detachierten Handler ist kein DOM-Event-Beleg. Für alle
Fälle gilt außerdem: niemals `loading` als Endzustand, keine Alternativmenge,
kein beliebiger String, keine zusätzliche URL und kein zweiter Revoke. Ein
nach Runwechsel, Stop, Navigation oder Unmount gespeichertes altes DOM-Event
ist vollständiger No-op und verändert weder den neuen Lauf noch dessen URL-
Ledger.

Die Fehlerklassen in der Tabelle klassifizieren ausschließlich lokale
Player-/Loaderfaults des weiterhin gültigen Kontexts. Wird derselbe Lauf
gleichzeitig durch frischen Snapshot, Expiry oder Safety invalidiert, gilt die
R7-Dominanz: `blocked` vor `stale`; der alte Fault darf keinen terminalen
Playerfehler veröffentlichen.

## Unveränderte Writer-Allowlist nach R1-GREEN

1. `apps/mobile/src/mobile-media-hub.ts`
2. `apps/mobile/src/mobile-media-player.ts`
3. `apps/mobile/src/mobile-media-hub.test.ts`
4. `apps/mobile/src/mobile-media-player.test.ts`
5. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
6. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
7. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

Keine Store-, Fixture-, Asset-, Config-, Dependency- oder neue Pfadänderung
ist erlaubt. Nach R1-GREEN bindet der Chief ein separates Writer-Gate; erst
danach darf genau ein frischer `frontend_brand_engineer` Terra/high ohne
Kinder und ohne Git-Index arbeiten.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R7-R1-CONTRACT-COMPLETION`
- Status: zwei Precheck-Mediums literal nachgeschärft; frischer Recheck nötig
- Produkt-/Testwrite: gesperrt
- P4-B und OUT/extern: gesperrt
- END-CHECK: :)
