# WRN-G3-021 P3-A-R9 – Late-Storage-/Senkenmatrix-Korrektur

Status: **ZUR FRISCHEN ARCHITEKTURPRÜFUNG GEBUNDEN – KEIN PRODUKTWRITE**

## Basis und offene Findings

- Fester Produktkandidat:
  `c2265afd8cb4c8391f6a34d8f9b97533cba3e8d9`.
- Gemeinsame Reviewbasis: `f8f99d4c7a5b774a9bf2be950a6337f84766e702`.
- Unabhängige Reviewbelege: `ca43167`.
- Zu schließen:
  - `P3-A-R8-DIP-M-001` – ein aktueller später Player-Storage-Recheck
    veröffentlicht `availability === 'local'` neben
    `error === 'storage-failure'`;
  - `P3-A-R8-QA-M-001` beziehungsweise das deckungsgleiche
    `P3-A-R8-DIP-A-M-001` – die benannte 6×7-Matrix erreicht und beweist
    mehrere Senken nicht wirklich.

High, Low, Privacy, formell security-reportable und deferred sind jeweils
null. Die R8-Epoch-/Mountguards, das Verbot normalen Cleanupbeginns nach
Epochverlust, die sinklose record-/generationsexakte Late-Save-Kompensation,
der entfernte `hub.player.unmount`-Bypass, CAS/Retention/IDB und alle
geschlossenen Fault-/URL-/Revokegrenzen dürfen nicht abgeschwächt werden.

Vor einem frischen unabhängigen Sol/high-Precheck mit null Findings besteht
kein Produkt- oder Testwrite. P4-B, UI, Website, reale Quellen/Medien,
Provider, Dependencies und alle externen Gates bleiben gesperrt.

## R9-01 – atomarer später Player-Storagefehler

Nur wenn ein **aktueller** Player-Recheck `storage-failure` feststellt, muss
der terminale Übergang atomar genau dies veröffentlichen:

```text
playback === 'error'
availability === 'storage-failure'
error === 'storage-failure'
element/src === leer
object URL === einmal widerrufen, falls zuvor erzeugt
keine nachgelagerte Request-, Decoder-, src-, play- oder Seek-Senke
```

Die bestehende Network-/Invalid-/Timeouttabelle bleibt unverändert. Der
allgemeine terminale Helper darf Availability deshalb nicht pauschal für
andere Fehler überschreiben; entweder erhält er eine ausdrücklich gebundene
Availability oder nur der Storagezweig setzt sie vor der gemeinsamen
Bereinigung.

Alle fünf Recheckgrenzen des Playerstarts werden mit aktuellen
Storagefehlern belegt:

1. vor dem Assetrequest;
2. vor dem Decoder beziehungsweise nach Raw-/Digestprüfung;
3. vor dem Setzen von `src`;
4. unmittelbar vor `play()`;
5. nach erfülltem `play()` vor der finalen Erfolgsveröffentlichung.

Für jede Grenze gelten die literalen Zustands-, Request-/Decoder-, Element-,
URL- und Revokeorakel. Ein Recheckresultat, das erst nach Runwechsel,
Invalidierung oder Unmount eintrifft, bleibt vollständig sinklos und darf
insbesondere einen neueren `blocked`-, `stale`- oder `storage-failure`-Zustand
nicht überschreiben.

## R9-02 – ausführungsgebundener 6×7-Unitdriver

Die sechs Ursachen bleiben literal und unverändert:

1. Release-Expiry;
2. Rights-Expiry;
3. Source-Block;
4. Series-Block;
5. Episode-Block;
6. Audioasset-Block.

Jede Ursache wird mit jeder der sieben Senken `pause`, `save`, `seek`,
`deleteIfExact`, `success`, `no-op` und `late-result` kombiniert. Das ergibt
42 benannte Top-Level-Zellen. Jede Zelle muss die Ursache an der benannten
Produktgrenze aktivieren; der Senkenparameter muss Setup, kontrollierten
Asynczeitpunkt und Assertions ändern.

| Senke | verpflichtender echter Ablauf |
| --- | --- |
| `pause` | Ursache unmittelbar vor echtem Pauseevent; null Save, Seek und Delete |
| `save` | Save bleibt pending; Ursache invalidiert vor Fulfillment; Resolve mit bestätigtem `saved` oder exact `no-op` führt höchstens zu einer sinklosen generation-/recordexakten Kompensation |
| `seek` | passender Record existiert; Ursache wird vor der frischen Seekprüfung aktiv; null Seek und nur das erlaubte Exact-cleanup |
| `deleteIfExact` | normales Cleanup erreicht die letzte Asyncgrenze vor Delete; dann Epochverlust; **null** Deleteaufrufe |
| `success` | Exact-delete startet bei gültigem Epoch und liefert `deleted`; nur der noch aktuelle Lauf sieht den literalen Erfolgsstatus |
| `no-op` | Exact-delete startet bei gültigem Epoch und liefert die unten fest gebundene reale Missing-, Generation- oder Recordrace-Variante; null Erfolg/Retry und fremder/neuer Record bleibt erhalten |
| `late-result` | Save oder Delete startet, danach Run B oder Unmount, erst danach Resolve oder Reject; physisches Exact-result darf enden, aber alle späten öffentlichen Senken bleiben null |

Die sechs `no-op`-Zellen verteilen die echten Varianten deterministisch:

- Release-Expiry und Series-Block: Missing;
- Rights-Expiry und Episode-Block: Generationrace;
- Source-Block und Audioasset-Block: Recordrace.

Die sechs `late-result`-Zellen verteilen die Raceausgänge deterministisch:

- Release-Expiry: pending Save, Resolve nach Run B;
- Rights-Expiry: pending Save, Reject nach Run B;
- Source-Block: pending Save, Resolve nach Unmount;
- Series-Block: pending Save, Reject nach Unmount;
- Episode-Block: pending Delete, Resolve nach Run B;
- Audioasset-Block: pending Delete, Reject nach Unmount.

Pro Zelle sind mindestens Requestzahl, Decoderzahl, Seekzahl, Savezahl,
Deletezahl, Store-Nachzustand, Player-Playback, Player-Availability,
Playerfehler, Resume-Status, Element/`src`, Object-URL-Erzeugung und
Revokezahl literal zu prüfen. `stale` gilt für beide Expiries; `blocked` für
alle vier Blockursachen und dominiert. Pauschale Orakel wie `>= 0`, breite
Zustandsmengen oder lediglich unterschiedliche Testnamen sind unzulässig.

## R9-03 – dieselbe Matrix mit echtem Chromium/IndexedDB

Die Browser-Spec führt dieselben 42 Top-Level-Zellen mit realer IndexedDB-
Persistenz aus. Sie darf sie deterministisch innerhalb eines Browserfalls
sequenzieren, muss aber pro Zelle Datenbank und Instrumentierung isolieren.
Die festen `no-op`- und `late-result`-Zuordnungen aus R9-02 gelten identisch.

Mindestens folgende echte Grenzen sind im Browser kontrollierbar zu machen,
ohne Produktions-Fail-closed-Regeln abzuschwächen:

- pending Save und sein Resolve/Reject;
- letzte Cleanup-Asyncgrenze vor `deleteIfExact`;
- pending Exact-delete und sein Resolve/Reject;
- Missing-, Generation- und Recordrace durch reale IDB-Zustände;
- Run-B-Wechsel und Hub-Unmount vor dem späten Resultat.

Jede Zelle prüft literal die vollständige Senkenliste aus R9-02 sowie den
IDB-Nachzustand. Ein echter Browser-/IDB-Lauf mit trivialen Zählern oder
breiten Playerorakeln erfüllt den Vertrag nicht.

## R9-04 – wahrheitsgemäße Writerbelege

Implementation-Evidence und Handoff nennen:

- alle tatsächlich geänderten Pfade;
- die feste No-op-/Late-result-Zuordnung;
- exakte Testzahlen statt bloßer Matrixnamen;
- erreichbare und ausdrücklich als gekoppelt unerreichbar belegte Grenzen;
- die bekannte volle Mobile-Baseline mit exakt den drei unveränderten,
  gesperrten `App.test.tsx`-Fehlern.

Eine nicht ausgeführte oder nur indirekt behauptete Zelle darf nicht als
belegt gelten.

## Exakte Allowlist erst nach Precheck-GREEN

1. `apps/mobile/src/mobile-media-player.ts`
2. `apps/mobile/src/mobile-media-player.test.ts`
3. `apps/mobile/src/mobile-media-hub.test.ts`
4. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
5. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
6. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

`apps/mobile/src/mobile-media-hub.ts` und alle anderen Pfade bleiben
read-only. Insbesondere Resume-Store, P2, Fixtures, Assets, App/UI, Config,
Dependencies und Git-Index bleiben gesperrt. Nach Precheck-GREEN bindet der
Chief ein separates Writer-Gate; erst danach darf genau ein frischer
`frontend_brand_engineer` Terra/high ohne Kinder arbeiten.

## Pflichtabschluss

Writer und Chief reproduzieren unter exakt Node 24.19 mindestens:

- alle fokussierten Hub-/Player-/Resume-Tests einschließlich der echten
  42-Zellen-Matrix und der fünf Player-Recheckgrenzen;
- zweimal die vollständige Chromium-/IndexedDB-Spec;
- sieben Typechecks, Mobile-Build und scoped Lint/Format;
- 19 Boundaries, Fixture-/Releasegrenzen und alle gebundenen Schutz-Hashes;
- den vollen Mobilelauf mit ehrlicher Disposition der drei gesperrten
  Baselinefehler;
- Diffcheck und die exakte Sechs-Pfad-Allowlist.

Danach folgen erneut frische unabhängige Terra-QA, defensiver Integrity-/
Privacy-Recheck und erst bei beiden GREEN ein finaler Architekturabschluss.
P4-B startet vorher nicht.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R9-LATE-STORAGE-MATRIX-CORRECTION`
- Status: ein Product- und ein Assurance-Medium eng gebunden; frischer
  Sol/high-Precheck nötig
- Produkt-/Testwrite: gesperrt
- P4-B und OUT/extern: gesperrt
- END-CHECK: :)
