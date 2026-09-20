# WRN-G3-021 P3-A-R7 – Produkt-/Privacy-/Assurance-Korrektur

Status: **ZUR FRISCHEN ARCHITEKTURPRÜFUNG GEBUNDEN – KEIN PRODUKTWRITE**

## Basis und Findings

- Fester Kandidat: `67cc5921334867e97f5b0e124c934549b5605928`.
- Terra-QA: YELLOW mit `P3-A-QA-M-001`.
- Defensiver Integrity-/Privacy-Review: RED mit
  `P3-A-DIP-M-001..003`, `P3-A-DIP-PRIV-M-001` und
  `P3-A-DIP-A-M-001`; null High, Low und deferred.

Vor einem frischen unabhängigen Sol/high-Precheck mit null Findings besteht
kein Produkt-/Testwrite. P4-B und OUT/extern bleiben gesperrt.

## Korrekturen

1. **Runlokaler Timeout:** Jeder Start hält seinen eigenen Timer. Callback,
   Detach und `finally` löschen ausschließlich diesen Timer. Ein spät
   settelnder Run A darf Run Bs 5000-ms-Schutz nicht löschen.
2. **Seek ausschließlich über Hub:** Der rohe synchrone Player-Seek ist für
   Konsumenten nicht exportiert. Der Hub führt unmittelbar vor Seek einen
   asynchronen Snapshot-, Uhr-, Rights-, Safety- und vollständigen
   Identitycheck aus. `durationMs` muss dem frischen Active exakt entsprechen;
   minus/equal/plus eins und Clock-/Blockwechsel sind Negativfälle.
3. **Storagefailure:** Jede Snapshot-/Katalog-Rejection an Projektion, Start,
   Recheck vor Decoder, Seek und Save wird fail-closed als eigener
   `storage-failure`-Zustand abgebildet, niemals als Netzwerkfehler oder rohe
   Rejection. Keine ID oder Rawdaten werden ausgegeben.
4. **In-flight Pause-Save:** Save bindet Epoch/Run und den erwarteten Record.
   Wird während der Transaktion invalidiert, wird ein bestätigter alter Save
   ausschließlich mittels `deleteIfExact` und zurückgegebener Generation
   kompensiert. Neue/fremde Records bleiben CAS-geschützt. Späte Cleanup-
   Resolve/Reject dürfen nach neuem Lauf oder Unmount keinen Status-, Player-
   oder Resume-Sink mutieren; nur die exakte Privacy-Löschung darf enden.
5. **Senkentreue Belege:** Überlappende Runs, Direct-Seek-Bypass,
   Durationgrenzen, Storagefailure an allen fünf Senken und pending Save bei
   Unmount, beiden Expiries sowie vier Blockzielen werden in Units und echter
   Chromium-/IDB-Matrix geprüft. Die 6×7-Matrix muss Pause, Save, Seek,
   `deleteIfExact`, Success/No-op/Failure und Late-result wirklich ausführen;
   `player.stop()` oder Alternativmengen sind kein Ersatz. Faultorakel prüfen
   exakt Playback, Fehlerklasse, `src`, URL-Ledger und Revokezahl.

## Exakte Allowlist nach Precheck-GREEN

1. `apps/mobile/src/mobile-media-hub.ts`
2. `apps/mobile/src/mobile-media-player.ts`
3. `apps/mobile/src/mobile-media-hub.test.ts`
4. `apps/mobile/src/mobile-media-player.test.ts`
5. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
6. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
7. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

Alle anderen Pfade sind read-only. Nach Writer und Chief-Reproduktion folgen
frische unabhängige Re-QA und Integrity-/Privacy-Recheck. Der volle Mobilelauf
bleibt mit den drei vorbestehenden App-Baselinefehlern separat rot; diese
Korrektur darf sie nicht berühren.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P3-A-R7-PRODUCT-PRIVACY-ASSURANCE-CORRECTION`
- Status: fünf Security-/Privacy- und ein QA-Finding gebunden; Precheck nötig
- Basis: `67cc5921334867e97f5b0e124c934549b5605928`
- Produkt-/Testwrite: gesperrt
- P4-B und OUT/extern: gesperrt
- END-CHECK: :)
