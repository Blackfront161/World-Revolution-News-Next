# Agent Handoff

- Agent: frischer unabhängiger Sol/high-Architektur-/Privacy-Precheck
- Task-ID: `WRN-G3-021-P3-A-R9-PRECHECK`
- Ergebnis: **RED**
- Basis: Vertrag `dd6bbad`, Produkt `c2265af`, Reviewbelege `ca43167`
- Vollbeleg:
  `docs/evidence/WRN-G3-021/P3-A-R9-PRECHECK.md`
- Kinder: keine
- Schreibrechte: nur dieser Handoff und der Vollbeleg; mit Übergabe beendet

## Priorisiertes Ergebnis

### `P3-A-R9-PRE-M-001` – Product/Integrity/Datenverlust Medium

R9 bindet für einen während des Save invalidierten Lauf eine
Nachlaufkompensation sowohl bei bestätigt `saved` als auch bei bestätigt
`no-op`. Der Storeausgang `no-op` beweist aber keine Mutation durch Save A:
Er tritt auch ein, wenn der exakte Record schon vorhanden ist oder die
Generation nicht mehr passt.

Der Kandidat prüft nach Save-Fulfillment nur, ob `next` im Result-State
feldgleich vorkommt (`mobile-media-hub.ts:392-398`). Bei Epochverlust ruft er
dann unabhängig von `result.kind` `compensateLateSave()` auf, das den Record
mit Result-State-Generation exakt löscht (`:261-280`).

Deterministische Reproduktion am unveränderten Kandidaten:

```text
Store vor Save A: generation=0, records=[exact next]
Save A: pending
danach Run B
Save A resolve: kind=no-op, state generation=0, records=[exact next]
Ergebnis: deleteCalls=1, store generation=1, records=[]
Run B: playback=playing, availability=local, error=null
```

Der öffentliche Sinkschutz funktioniert, aber ein gültiger, nicht von Save A
geschriebener Resume-Record geht verloren. High 0, Medium 1, Low 0, Privacy 0,
Coverage 0, formal security-reportable 0, deferred 0.

## Vertrags- und Allowlistfolge

Der R9-Vertrag muss vor einem Writer festlegen:

1. bestätigtes altes `saved`: höchstens eine exakte sinklose Kompensation;
2. altes `no-op`: ohne zusätzlichen Mutationsnachweis keinerlei
   Nachlaufmutation;
3. Unit und echtes Chromium/IndexedDB erhalten einen vorbestehenden exakten
   Record über Run B und spätes `no-op`-Resolve bytegleich;
4. `apps/mobile/src/mobile-media-hub.ts` wird eng in die Allowlist aufgenommen.

Die aktuelle Sechs-Pfad-Allowlist ist unzureichend, weil der Fehler im
gesperrten Hubpfad liegt. Ein neues Store-Provenienzprotokoll oder P2-/Schema-
Delta ist nicht nötig und wäre unnötige Komplexität.

## Sonstige Precheckergebnisse

- R9-01 und alle fünf Player-Storage-Rechecks sind über `context()` und die
  Player-Seams test- und implementierbar.
- Die 6×7-Unit-/Browser-IDB-Matrix ist über Katalog-`snapshot`, Audioevents,
  deferred Save/Delete, Pre-delete-Read, Run B/Unmount und echte IDB-Races
  technisch erreichbar; kein Hub-Testhook ist erforderlich.
- Die zwei vorhandenen Evidence-/Handoffpfade reichen für R9-04.
- Fokussierte Baseline: 134/134 PASS unter Node `v24.19.0`; sie deckt den
  neuen vorbestehenden-Record-Fall nicht ab.
- Keine neue Privacy-, Remote-, Provider-, Website- oder Appkopplung.

## Nächster zulässiger Schritt

Chief bindet eine enge Vertragskorrektur und eine Allowlist mit dem Hubpfad.
Danach folgt ein frischer unabhängiger Precheck. Vor dessen GREEN besteht kein
Produkt-/Testwrite. P4-B und alle OUT-/externen Gates bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R9-PRECHECK`
- Status: RED
- Finding: `P3-A-R9-PRE-M-001`
- High/Medium/Low: `0/1/0`
- Privacy/Coverage/deferred: `0/0/0`
- Sechs-Pfad-Allowlist: nicht ausreichend
- Schreibrechte: beendet und an Chief zurückgegeben
- END-CHECK: :)
