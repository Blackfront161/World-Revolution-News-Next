# WRN-G3-021 P3-A-R8 – Storage-/Epoch-/Senkenmatrix-Korrektur

Status: **ZUR FRISCHEN ARCHITEKTURPRÜFUNG GEBUNDEN – KEIN PRODUKTWRITE**

## Basis und Findings

- Fester Kandidat:
  `7fe4b7a790c374ca6313554916b612b354c2a7ed`.
- Unabhängige QA und defensiver Integrity-/Privacy-Review im Evidencecommit
  `73cd6e3`: High 0, Medium 3, Low 0, Product 2, Privacy 0,
  Assurance/Coverage 1, deferred 0.
- Zu schließen:
  `P3-A-R7-R1-QA-M-001..003` beziehungsweise die unabhängigen Entsprechungen
  `P3-A-R7-R1-DIP-M-001..002` und `P3-A-R7-R1-DIP-A-M-001`.

Timer-A/B, seek-lose Hub-Fassade, frische Vollidentity-/Dauerbindung,
Result-State-/Generation-CAS, `blocked > stale`, URL-/Revoke-Ledger und echte
Live-DOM-Fehlertabelle bleiben geschlossen und dürfen nicht abgeschwächt
werden. Vor einem frischen unabhängigen Sol/high-Precheck mit null Findings
besteht kein Produkt-/Testwrite. P4-B und OUT/extern bleiben gesperrt.

## R8-01 – senkentreues `storage-failure`

`storage-failure` ist ein eigener fail-closed Zustand, kein `no-op`, kein
Netzwerkfehler und kein generischer Cleanupfehler. Literal gelten:

| aktuelle Senke | erforderlicher Zustand |
| --- | --- |
| Projektion | `projection().kind === 'storage-failure'` |
| Start oder Decoder-Recheck | Player: `availability === 'storage-failure'`, `error === 'storage-failure'`, kein aktives Element/`src`/Object URL |
| Pause-Save: `read`, Storeöffnung, Store-Snapshot oder `save` reject/throw | Player wird fail-closed gestoppt; `availability === 'storage-failure'`, `error === 'storage-failure'`; `resumeStatus() === 'storage-failure'`; kein Erfolg/Retry |
| Resume-Seek: `read`, Storeöffnung, Store-Snapshot oder frischer Recheck reject/throw | kein Seek; Player wird fail-closed gestoppt; `availability === 'storage-failure'`, `error === 'storage-failure'`; `resumeStatus() === 'storage-failure'`; kein Erfolg/Retry |

Der Hub-Resume-Status ergänzt ausschließlich hierfür den literalen Wert
`storage-failure`. Ein Player-Stop mit dieser Availability muss die
gleichnamige Fehlerklasse erhalten; alle anderen Stop-/Invalidierungszustände
behalten ihre bisherige Semantik.

Die Veröffentlichung ist nur zulässig, wenn der zu Beginn der Operation
aufgenommene Epoch noch aktuell und der Hub gemountet ist. Wird die Operation
vor dem Reject/Throw durch einen neueren Lauf, Expiry, Block, Navigation oder
Unmount überholt, ist der alte Fehler vollständig sinklos. Eine gleichzeitig
aktuelle monotone `blocked`- oder `stale`-Invalidierung darf nicht durch einen
alten Storagefehler überschrieben werden.

## R8-02 – originäre Epochbindung an jeder Asyncgrenze

Jede Huboperation erfasst vor ihrer ersten Asyncgrenze unveränderlich ihren
originären `operationEpoch`. Nach jedem `await` und unmittelbar vor jedem
Statussink, Playeraufruf oder Beginn einer Storemutation gelten gemeinsam:

```text
mounted === true && operationEpoch === lifecycleEpoch
```

Andernfalls endet der Pfad ohne Status-, Player-, URL-, Projektion-, Seek-
oder neue Storemutation. Ein Catch prüft dieselbe Bedingung; er darf nie einen
neueren Lauf überschreiben.

### Normales Cleanup

`cleanupKnown` erhält den beim Cleanuptrigger aufgenommenen unveränderlichen
`cleanupEpoch`. Es prüft ihn nach jedem Read-/Store-/Snapshot-Await und erneut
unmittelbar vor `deleteIfExact`. Verliert es die Gültigkeit vor dem
Deletebeginn, startet es keine Löschung. Nur ein bereits bei noch gültigem
Epoch gestartetes Exact-delete darf danach physisch enden; sein spätes Resultat
oder Reject bleibt sinklos.

### Privacy-Kompensation eines verspäteten Save

Die in R7-R1 gebundene Save-Kompensation ist die einzige Ausnahme, die nach
Verlust des ursprünglichen Save-Epochs noch genau eine physische Mutation
starten darf: Wenn das erfüllte alte `save()` im vollständigen
`result.state` den erwarteten Record feldgleich enthält, darf genau ein
`deleteIfExact(next.key, next, result.state.generation)` beginnen. Dieser
Privacy-Pfad ist **immer vollständig sinklos**: weder `deleted`, `no-op` noch
Reject/Throw verändern `resumeStatus`, Player oder einen neueren Lauf. Er
erhält keinen nachträglich gelesenen aktuellen Epoch und führt keinen zweiten
Snapshot oder Retry aus.

### Öffentliche Lifecyclegrenze

`hub.player` exponiert keinen eigenen `unmount()`-Einstieg. Ausschließlich
`hub.unmount()` setzt zuerst den Hub auf unmounted und invalidiert danach den
privaten Player. Damit gibt es keinen Player-only-Bypass. Bestehende
Start-/Pause-/Stop-/Invalidate-/State-Fähigkeiten bleiben innerhalb des
headless P3-A-Vertrags; Seek bleibt ausschließlich Hub-intern.

Pflicht-Racebelege decken mindestens ab:

1. Save A, Invalidierung, neuer Run B, dann Save-A-Resolve und Delete-
   Resolve/Reject: Store darf exact bereinigen, B bleibt in allen Senken
   unverändert;
2. Save A und Unmount vor Save-Resolve: Exact-Kompensation darf enden, keine
   Status-/Playermutation;
3. `cleanupKnown` verliert Epoch vor Deletebeginn: null Deleteaufrufe;
4. bereits gestartetes Cleanup-Delete verliert danach Epoch: physisches
   Resultat darf enden, aber null spätere Senken;
5. spätes Resume-Seek-Read-/Store-/Catchresult nach Run B und Unmount:
   vollständiger No-op;
6. direkter `hub.player.unmount`-Zugriff ist typ- und laufzeitseitig nicht
   vorhanden.

## R8-03 – echte 6×7-Senkenmatrix

Die sechs Ursachen bleiben literal:

1. Release-Expiry;
2. Rights-Expiry;
3. Source-Block;
4. Series-Block;
5. Episode-Block;
6. Audioasset-Block.

Die sieben Matrixspalten sind echte, verschiedene Ausführungspunkte:

| Senke | erforderliche Injektion und Orakel |
| --- | --- |
| `pause` | Ursache wird unmittelbar vor dem echten gebundenen Pauseevent aktiv; null Save/Seek/Delete, erwartete `stale`/`blocked`-Dominanz |
| `save` | echter Save ist pending; Ursache invalidiert den Lauf vor Fulfillment; `saved` und Exact-`no-op` verwenden Result-State-Generation für genau eine sinklose Kompensation |
| `seek` | exakter Record liegt vor; Ursache wird unmittelbar vor der frischen Resume-Seek-Prüfung aktiv; Seek false/null Mutation, erwartete Dominanz und nur zulässiges exact Cleanup |
| `deleteIfExact` | normales Cleanup erreicht den Zustand vor Delete; Ursache/Runwechsel macht den Cleanup-Epoch vor Deletebeginn ungültig; null Deleteaufrufe |
| `success` | exact Delete startet bei gültigem Epoch und liefert `deleted`; nur aktueller Lauf darf den literalen Erfolgsstatus sehen |
| `no-op` | exact Delete startet bei gültigem Epoch und liefert getrennt Missing-, Generation- und Record-`no-op`; kein Erfolg, kein Retry, fremder/neuer Record unverändert |
| `late-result` | Save- oder Deleteoperation startet, dann neuer Run oder Unmount, erst danach Resolve und Reject; höchstens gebundene physische Mutation, sämtliche späten Senken null |

Jede der 42 Kombinationen muss die benannte Ursache **an der benannten
Senke** injizieren. Der Senkenparameter muss den Kontrollfluss und die
Assertions tatsächlich ändern; Name-/Regexverwendung oder 42 Wiederholungen
desselben Happy-Paths sind unzulässig. Pro Zelle werden mindestens
Assetrequest/Decoder, Seekaufruf, Save-/Delete-Aufrufzahl, Store-Nachzustand,
Playerzustand und Resume-Status literal geprüft. `stale` gilt für beide
Expiries; `blocked` gilt für alle vier Blockziele und dominiert.

Units müssen alle 42 Zellen ausführen. Die echte Chromium-/IndexedDB-Spec
führt dieselbe 6×7-Menge mit realer IDB-Persistenz aus; sie darf die 42 Zellen
innerhalb eines deterministischen Browserfalls sequenziell prüfen. Mindestens
die `no-op`-Spalte enthält reale Missing-, Generation- und Recordrace-
Subfälle; `late-result` enthält Resolve und Reject nach Runwechsel sowie
Unmount. Gekoppelt technisch unerreichbare Subvarianten werden nicht
dupliziert, sondern durch eine literale Unerreichbarkeitsinvariante plus die
nächstliegende echte Produktgrenze belegt.

## Exakte Allowlist erst nach Precheck-GREEN

1. `apps/mobile/src/mobile-media-hub.ts`
2. `apps/mobile/src/mobile-media-player.ts`
3. `apps/mobile/src/mobile-media-hub.test.ts`
4. `apps/mobile/src/mobile-media-player.test.ts`
5. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
6. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
7. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

Alle anderen Pfade, insbesondere Resume-Store, P2, Fixtures, Assets, App/UI,
Config, Dependencies und Git-Index, bleiben read-only. Nach Precheck-GREEN
bindet der Chief ein separates Writer-Gate; erst danach darf genau ein frischer
`frontend_brand_engineer` Terra/high ohne Kinder arbeiten.

## Pflichtabschluss

Writer und Chief reproduzieren unter exakt Node 24.19 mindestens:

- alle fokussierten Hub-/Player-/Resume-Tests mit echter 6×7-Matrix;
- zweimal die vollständige Chromium-/IndexedDB-Spec;
- sieben Typechecks, Mobile-Build, scoped Lint/Format;
- 19 Boundaries, Fixture-/Releasegrenzen, zwölf Schutz-Hashes;
- vollen Mobilelauf mit ehrlicher Disposition der drei gesperrten Baseline-
  Fehler;
- Diffcheck und exakte Sieben-Pfad-Allowlist.

Danach folgen erneut frische unabhängige Terra-QA, defensiver Integrity-/
Privacy-Recheck und finaler Architekturabschluss. P4-B startet vorher nicht.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R8-STORAGE-EPOCH-MATRIX-CORRECTION`
- Status: drei Mediums eng gebunden; frischer Sol/high-Precheck nötig
- Produkt-/Testwrite: gesperrt
- P4-B und OUT/extern: gesperrt
- END-CHECK: :)
