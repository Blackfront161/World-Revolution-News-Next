# WRN-G3-021 P3-A-R11 – Fortsetzen eines pausierten Players

Datum: 9. September 2026. Delegation: erlaubt, keine Kinder.
Status: ZUM ENGEN UNABHÄNGIGEN PRECHECK GEBUNDEN; kein Produkt-/Testwrite.
Basis: Produkt `4b0070a21ccffd802afd6921c92adc9a893a531c`, vollständiger
Testkandidat `9dbccb934bb988fafb87497bd61b5ad69ce07b47`, Metadaten `e6fb358`.

## Konkreter Fehler und Ziel

Der frische P3-A-Architekturabschluss meldet `P3-A-FINAL-ARCH-M-001` und
reproduziert nach Play und Pause bei
10 ms einen zweiten Request, ein zweites Element und Position null, wenn
`start()` als öffentliche User-Play-Aktion erneut aufgerufen wird. Die
gebundene Transition `paused + user-play -> playing` und die sichtbare
Fortsetzen-Aktion benötigen dieselbe vorhandene Position. P4-B bleibt
gesperrt; die UI darf keine eigene Player-/Resumeentscheidung kompensieren.

## Enger Korrekturansatz zur Prüfung

1. Nur `start()` aus einem wirklich pausierten, weiterhin besessenen und
   byteverifizierten Element-/URL-Kontext erhält einen Fortsetzenpfad. Alle
   anderen Startpfade behalten die bestehenden Regeln. Keine neue öffentliche
   Hubfunktion, kein UI-Seek und keine neue Persistenz.
2. Bereits verifizierter Assetkontext, Element, URL und Position bleiben
   erhalten. Vor erneutem `play()` bestätigen frischer Snapshot/Context und
   frische Uhr exakt dieselbe gebundene Identität inklusive Safety und
   Rechte; das ersetzt keine Prüfung durch eine bloße alte `local`-Anzeige.
   Kein zweiter Request, Hashlauf, Blob, Decoder, `src`-Write oder `load()`.
3. Jede Nutzeraktion erhält monotone neue Run-/Abortbindung. Alte Timer,
   Handler, Promises und Pause-Save-Ergebnisse dürfen keine neuen öffentlichen
   Senken treffen. Bei der Übergabe werden alte Timer beendet, Handler an den
   neuen Run und dieselbe Element-/URL-Identität gebunden und genau ein
   Expirytimer neu gebunden. Hub-Lifecycleinvalidierung bleibt gewahrt.
4. Nach `play()` muss erneut derselbe aktuelle Context bestätigt werden.
   Nur dann `playing`. Während der Prüfung bleibt die pausierte Position
   unverändert; keine erfundene `paused -> loading`-Transition. Zeitablauf,
   Sperre, Identitätswechsel oder Storagefehler verwenden die bestehenden
   Invalidierungs-/Detach-/Cleanup-/Fehlerpfade. Keine Freigabe alter Bytes
   an einen geänderten Kontext. Revoke exakt einmal bei terminalem Ende.
5. Der Fortsetzenlauf hat ein eigenes rungebundenes 5000-ms-Zeitlimit für
   seine asynchronen Prüf-/Playgrenzen. Reject, Timeout, Stop und Unmount
   bleiben ehrlich und ohne Auto-Retry. Späte Resolve-/Reject-/DOM-Ergebnisse
   wirken nach Runverlust nicht mehr. Ein späterer regulärer Neustart darf
   nur nach erneuter ausdrücklicher Nutzeraktion neu laden.

Der unabhängige Precheck muss insbesondere die sichere Besitzübergabe,
die erneute Rechte-/Safetyprüfung, das Hub-Epochverhalten und die
Testbarkeit ohne neuen Produkt-Testhook bestätigen. Bei nötiger anderer
Semantik erst dieses Design präzisieren; kein Writer improvisiert.

## R1 – verbindliche Epoch- und Deadlinepräzisierung

Der erste Precheck benennt zwei Ausführungsentscheidungen. Diese R1-Bindung
schließt sie fachlich; vor dem unabhängigen Recheck-GREEN bleibt Write gesperrt.

**Hub-Epoch vor dem ersten Await:** Der preserving Fortsetzenpfad setzt
zuerst Run `+1`, abortiert den alten Controller und beendet alte Timer, bindet
den neuen Controller und Handler an dasselbe verifizierte Element/dieselbe
URL. Danach ruft er genau einmal `dependencies.onInvalidated?.('local')`
auf, bevor der erste Context-Await beginnt. Das ist der vorhandene Kanal zum
readonly Hub-`lifecycleEpoch`; kein `publish`, `detach`, `revoke`, `src`-,
`load`- oder Seekaufruf bei dieser Besitzübergabe. Spätere terminale Ursachen
verwenden weiter ihre eigenen bestehenden Invalidierungs-/Cleanup-Pfade.

Zusätzlich sind echte pending-Pause-Save→Continue-Fälle für `saved`, `no-op`
und Reject Pflicht: erst den echten Save-Aufruf halten, dann den pausierten
Player erfolgreich fortsetzen, danach das alte Ergebnis liefern und
abwickeln. Bestätigtes `saved` darf ausschließlich nach bestehender
Exact-Provenienz kompensieren; `no-op` darf nichts löschen; alter Reject darf
keinen neuen Resume-/Playerfehler veröffentlichen. Frische vollständige
Store-/Generations- und öffentliche Nachbilder belegen die Unterschiede.
Die bestehenden R10-Provenienzregeln werden weder kopiert noch verändert.

**Ein Gesamtdeadline ab Useraktion:** Der eigene 5000-ms-Timer beginnt am
Eintritt in den preserving Fortsetzenpfad, vor dem ersten Context-Await.
Er wird beim Wechsel zwischen Pre-Context, `play()` und Post-Context nicht
neu gestartet. Die aktuelle Awaitphase wird vor ihrem Eintritt gebunden.
Bei Deadline liefert Pre-/Post-Context exakt
`{playback:'error',availability:'storage-failure',error:'storage-failure'}`;
bei `play()` exakt
`{playback:'error',availability:'local',error:'network-error'}`.
Die terminale Deadline abortiert den Lauf und detacht/revokt genau einmal;
nachfolgende Resolve/Reject/Events bleiben auch nach echten Awaitfortsetzungen
wirkungslos. Keine Abhängigkeit von einem trotz Abort nie erfüllten Promise.
Der zurückgegebene Fortsetzen-Promise endet auch bei Deadline, Stop oder
Unmount, ohne auf das gehaltene fremde Promise zu warten. Späte Rejections
werden weiterhin konsumiert; keine unhandled rejection. Die Tests prüfen
diese Fertigstellung ausdrücklich, nicht nur einen Fehlerstate neben einer
endlos offenen Nutzeraktion.

Der genau eine Expirytimer bleibt auf die früheste bereits gebundene Asset-
Expiry gerichtet und gilt auch während der Awaitphasen. Ist `clock() >=`
dieser Expiry am Deadlinezeitpunkt, dominiert `stale` über den Timeoutfehler;
eine bereits bekannte Sperre bleibt `blocked`. Timerreihenfolge darf diese
fachliche Dominanz nicht verändern. Runwechsel/Stop/Unmount beendet beide
Timer; alte Timer können den neuen Lauf nicht beeinflussen.

4999/5000/5001 ms werden in jeder der drei gehaltenen Awaitphasen literal
simuliert, jeweils mit vollständigem State-, Position-, Element-/URL-/
Request-/Load-/Revoke-Nachbild. Repräsentative echte Chromiumfälle ergänzen
die gesamte Unit-Grenzmatrix. Context-Reject bleibt wie bisher sichtbarer
Storagefehler; Play-Reject bleibt Netzwerk-/Playbackfehler. Alle positiven
und negativen neuen Fortsetzenpfade bleiben innerhalb derselben fünf Pfade.

## Exakte mögliche Allowlist

Erst nach Precheck-GREEN und separatem Gatecommit darf genau ein Terra/high-
Frontendwriter ohne Kinder oder Index diese fünf Pfade schreiben:

1. `apps/mobile/src/mobile-media-player.ts`
2. `apps/mobile/src/mobile-media-player.test.ts`
3. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
4. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
5. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

Hub, Resume-/Katalogstore, Contracts, bestehender Harness, Fixtures/Assets,
Pins, Dependencies, UI und sämtliche OUT-/externen Bereiche bleiben read-only.
Kein Parallelwriter; fremde Änderungen erhalten.

## Gebundene Nachweise

- Regression muss am alten Player scheitern: Pause an nichtnull Position und
  bestätigter Abschluss des dadurch ausgelösten Pause-Saves,
  zweite Useraktion, volle Statefolge, Position unverändert, Requests/
  Factory/URL jeweils weiterhin eins, keine neue Load-/Src-/Seekmutation,
  keine zweite Persistenz durch Fortsetzen. Späteres Stop/Unmount revokt
  genau einmal. Reale Chromium-/IDB-Integration des öffentlichen Hubpfads.
- Contextwechsel sowie Release-/Rightsablauf und vier Safetyziele vor und
  nach dem neuen Play-Await: kein unberechtigtes `playing`, ehrliche
  Availability, Detach/Revoke und vorhandene Resume-Cleanupwirkung.
- Unmount/Stop während des neuen Context- oder Play-Await; danach echter
  Late-Resolve und Late-Reject sowie alte DOM-Callbacks: vollständige
  öffentliche und Ressourcen-Nachbilder bleiben unverändert.
  Zulässige bereits bestätigte Late-Save-Bereinigung bleibt gemäß R10
  separat an echten Store-/Generationsbildern zu prüfen; öffentliche
  Unveränderlichkeit ist keine Behauptung verbotener physischer Bereinigung.
- 4999/5000/5001 ms des neuen Timers, alte Timer nach Runwechsel wirkungslos;
  neue Context-/Play-Rejections mit vollständigen Fehler-/Ressourcenorakeln.
- Bestehende 6×7-Hub-/Browsermatrix unverändert erhalten. Keine beliebige
  Anpassung alter Erwartungen. Notwendige legitime Testanpassungen vorher
  konkret an Chief melden; keine verdeckte Regression oder Senkenreduktion.

Node exakt 24.19: fokussierte Hub/Player/Resume-Suites, volle Mobiletests,
gesamte Browserdatei zweimal seriell, sieben Typechecks, Build, scoped
Lint/Format, 19 Boundaries, Fixture/Release, Schutzpositionen, Diff/Allowlist.
Player erhält dokumentierten Vor-/Nachhash; alle anderen Produktpins bleiben
identisch. Nach Kandidat folgen unabhängige QA und defensiver Deltarecheck,
danach der enge Abschluss des noch offenen Architekturfindings. P4-B bleibt
bis vollständigem P3-A-GREEN gesperrt.
