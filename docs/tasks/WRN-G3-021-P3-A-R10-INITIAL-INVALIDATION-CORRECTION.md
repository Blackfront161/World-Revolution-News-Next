# WRN-G3-021 P3-A-R10 – initiale Sperre und Resume-Bereinigung

Chief-Disposition vom 8. September 2026. Status: zur engen unabhängigen
Designprüfung, noch kein Produktwrite. PO-Auftrag: Fehler korrigieren und
lokale Fertigstellung fortsetzen. Keine neue Produktfunktion.

## Beleg und Ursache

Basis `1a87f5d61f507a53e79d29e3d89e1eb0df49bf64`, unveränderter R9-R3-WIP
in dessen vier Pfaden. Der Writer hat alle Prozesse beendet und Rechte
zurückgegeben. Seine fokussierte Node-24.19-Ausführung endet 142/148:
genau release/rights/source/series/episode/asset × success scheitern nach
Pause-Save, tatsächlichem Ablauf/Sperre und erneutem öffentlichem Start.
`resumeStatus()` bleibt `saved` statt `deleted`. Der Chief und der unabhängige
Sol-API-Reviewer bestätigen dieselbe Ursache im Code.

`mobile-media-player.ts:start()` invalidiert zuerst mit der alten
Availability. Erkennt der folgende frische Initialkontext stale/blocked,
setzt der Zweig nur Felder und publiziert. Der Hub erhält dadurch keine
Invalidierung mit der neuen Ursache und startet kein `cleanupKnown()`.
Die Wiedergabe ist gesperrt; der bereits bekannte private Resume-Record
bleibt entgegen dem bestehenden P3-R1-Vertrag bestehen.

## Enge Korrektur

Der initiale nicht lokale/abgelaufene Zweig von `start()` leitet die bereits
vorhandene Availabilityentscheidung durch den bestehenden gemeinsamen
`invalidate(nextAvailability)`-Pfad. Die Priorität bleibt unverändert:
blocked, storage-failure, sonst stale. Dadurch erfolgen Run-/Abort-/Detach-,
Fehler-/State- und Callbacksemantik gemeinsam, bevor der Start zurückkehrt.
Keine zweite UI-Entscheidung, kein zusätzlicher Storezugriff im Player und
kein eigener Löschalgorithmus. Der vorhandene Hub muss unverändert allein
seinen exakten, generationgebundenen Privacy-Cleanup ausführen.

Die bestehenden Mounted-/Run-/Abortguards vor diesem Zweig bleiben erhalten.
Null/Fehlerkontext, alte asynchrone Starts und neue Startläufe dürfen keine
falsche neue Löschung oder Publikation erhalten. Kein Auto-Retry. Kein Seek,
Request oder Decoderstart gegen stale/blocked. Storage-failure darf keine
physische Bereinigung behaupten.

## Besitz nach GREEN und separatem Chief-Gatecommit

Genau derselbe Terra/high-Frontendwriter übernimmt sequenziell den erhaltenen
WIP, ohne Kinder, Index oder Commit. Exakt fünf Pfade:

1. `apps/mobile/src/mobile-media-player.ts`
2. `apps/mobile/src/mobile-media-hub.test.ts`
3. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
4. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
5. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

Alle R9-R3-Orakel und Zuordnungen bleiben vollständig verbindlich. Die sechs
Success-Zellen müssen durch die tatsächliche Expiry-/Blockbereinigung löschen;
reguläres ended oder ein zusätzlicher UI-/Test-stop als Ersatz ist unzulässig.
Die sechs Unitregressionen werden gegen Altcode RED und gegen Fix GREEN
ausgewiesen; die Browsermatrix belegt dieselbe Kette mit echter IndexedDB.
Die vorhandenen Player-Negativtests müssen weiterhin bestehen.

## Endnachweise und unveränderte Grenzen

Vollständige R9-R3-Endmatrix nach letzter Änderung: Node 24.19, drei
fokussierte Suites, Browser zweimal seriell, sieben Typechecks, Mobile-Build,
scoped Lint/Format, 19 Boundaries, Fixture/Release, voller Mobilelauf,
Diff-/Fünfpfadcheck. Keine alten GREEN-Läufe als neue ausgeben.

Player-Vorhash SHA-256:
`2f8c3c9aec5e898d90dfbe9db11cd469db651438b85aa6eb5b3c6ceab991b701`.
Nachhash im Ergebnis belegen. Hub bleibt
`62b7ff0d0b5ab846e82023fd3cc4e57d4a86db04ec6e60fce57cc7c084109f2b`,
Resume-Store bleibt
`c1b8e97c9ab73619f4adc8505bd01a21eaffb3f5bab4359802cded92232232f1`.
Die zwölf R9-R3-Schutzpfade einschließlich des dort aktualisierten
App-Testhashes sowie die separaten Clear-/Readerfixes bleiben unverändert.

P2, weitere Produktdateien/Tests, Harness, Fixtures, Assets, Config,
Dependencies, Website, echte Inhalte/Provider und externe Gates bleiben OUT.
Nach Chief-Reproduktion folgen unabhängige Delta-QA und Integritätsprüfung;
der vorgeschriebene finale Architekturabschluss bleibt offen. P4-B erhält
durch diesen Korrekturvertrag kein Schreibrecht.
