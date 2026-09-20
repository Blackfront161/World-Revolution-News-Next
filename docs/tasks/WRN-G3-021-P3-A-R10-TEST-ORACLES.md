# WRN-G3-021 P3-A-R10 – letzte vollständige Testorakel

Status: nach diesem separaten Chief-Commit zur Ausführung freigegeben.
QA und Sol haben den Orakelrest gebündelt; der unabhängige QA-Abgleich dieses
engen reinen Testplans ist GREEN. Produktbasis bleibt unverändert
`4b0070a21ccffd802afd6921c92adc9a893a531c`. Keine neue Produktsemantik.
Delegation: erlaubt; keine Kinder, kein Index oder Commit durch den Writer.

## Bestehende Nachweislücke

Die unabhängige Re-QA und der Chief finden unvollständige Orakel im bereits
gebundenen R9-R3-/R10-Testumfang. A/B0/B1 sind über Readbarrieren geordnet,
werden aber noch nicht explizit pro Phase bezeichnet. Nach Unmount und Drain
der aktuellen B-Operationen fehlt ein vollständiges neues Nachbild. In der
Unitmatrix fehlen zusätzlich Requestanzahl, sechs Late-Store-/Zählerbilder
und ein durchgängig vollständiger Nicht-Late-Playerstate. Dies sind dieselben
bereits verlangten Nachweise, keine neuen Produktanforderungen.

## Exakter Test-only-Besitz

Aktuelle sequenzielle Übernahme am 9. September: Spark ist beendet, alle
Prozesse und Schreibrechte sind frei. Sein Unit-WIP bleibt erhalten. Chief
übernimmt nach diesem separaten Dispositionscommit ausschließlich dieselben
vier Pfade, weil der WIP zulässige persistente Late-Änderungen fälschlich mit
dem Vorzustand gleichsetzt und die Phasen noch nicht am Pending-Aufruf bindet.
Keine andere Test-/Produktrolle schreibt parallel. Die folgenden Spark-
Angaben dokumentieren nur die vorherige Zuteilung; alle fachlichen Orakel,
Checks und unveränderten Produktgrenzen bleiben maßgeblich.

Chief bindet nach Abschluss der eingefrorenen Reviewrunde genau einen
`spark_micro_task_worker` für diese klar spezifizierte, reine Testergänzung.
Bei nicht verfügbarem Spark-Kontingent übernimmt sequenziell der vorhandene
Terra-Frontendwriter; kein paralleler Writer, kein Retryloop.

1. `apps/mobile/src/mobile-media-hub.test.ts`
2. `tests/e2e/g3-021-media-hub-lifecycle.spec.ts`
3. `docs/evidence/WRN-G3-021/P3-A-PLAYER-LIFECYCLE-IMPLEMENTATION.md`
4. `docs/handoffs/WRN-G3-021-p3-a-player-lifecycle-implementation.md`

Sämtlicher Produktcode, andere Tests, Harness, Fixtures, Config und
Dependencies bleiben read-only. Keine Neustrukturierung der ganzen Matrix.

## Konkrete Ergänzung

1. Unit-Fetchmock in Variable halten und in allen 42 Zellen genau einen
   Request prüfen. Bestehende Requestform bleibt unverändert.
2. Bei allen Nicht-Late-Zellen den vollständigen Playerstate literal prüfen:
   `{playback:'idle', availability: erwartete Ursache, error:null}`.
3. Die sechs Late-Zeilen erhalten ein vollständiges literales Store-/Zähler-
   und Player-/Resumeorakel gemäß folgender Tabelle; alle vorhandenen URL-,
   Element-, Decoder-/Factory- und Seekorakel bleiben bestehen.

| Ursache | Save | Deleteaufruf | tatsächliche Löschung | Generation | Records | Availability | Resume |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| release | 1 | 1 | 1 | 2 | leer | stale | idle |
| rights | 1 | 0 | 0 | 0 | leer | stale | idle |
| source | 1 | 1 | 1 | 2 | leer | local | idle |
| series | 1 | 0 | 0 | 0 | leer | local | idle |
| episode | 1 | 3 | 1 | 2 | leer | blocked | saved |
| asset | 1 | 1 | 0 | 1 | exakter vollständiger bekannter Record | blocked | saved |

In allen sechs Zeilen: Request/Factory/Create/Revoke je 1, load 2, Seek 0,
Position 0.01, src leer, Playback idle und error null. Source/Series sind
unmounted, ohne dass ein neuer Kontext gelesen wurde; deshalb bleibt dort
die alte Availability local, wie im bereits korrekten Browserorakel.

4. Episode-Pendingeinträge in Unit und Browser erhalten explizite Phasen-
   Labels A/B0/B1 zum Zeitpunkt ihres tatsächlichen Eintritts. Vor Stop ist
   A aktiv; nach nachgewiesenem A-Eintritt beginnt B0, nach dessen echter
   Deletegrenze und vor Freigabe des gehaltenen Startkontexts beginnt B1.
   Die Listenfolgen werden an den drei Barrieren exakt assertiert. Nur A wird
   vor dem Late-Vergleich erfüllt. Keine Abschwächung dieser Readbarrieren.
5. Nach dem A-Vergleich: Unmount, vollständiges Public-/Store-/Zählerbild
   erfassen, dann B0/B1 erfüllen und vollständig abwickeln, anschließend alle
   Werte erneut vollständig erfassen und Gleichheit prüfen. B0/B1 müssen
   jeweils echte no-op-Ergebnisse liefern. Im Browser vor `actual.close()`
   eine echte neue IDB-Snapshotabfrage ausführen. Keine bloßen alten Kopien.
   Physical-Deletezähler darf nur bei `result.kind === 'deleted'` steigen,
   niemals bloß beim Aufruf eines späteren no-op. Ergebnisse klar vor/nach
   Testteardown unterscheiden; keine falschen UI-Wirkungen zuschreiben.
6. Tatsächliche Promiseabwicklung abwarten, keine triviale `waitFor(true)`-
   Ersatzbehauptung. Auflösung alter Ergebnisse muss nach dem gebundenen
   Runverlust liegen. Keine neuen Produkt-Testhooks.

## Prüfung und Rückgabe

Node 24.19: fokussierte drei Suites, vollständige Browserdatei zweimal
seriell, volle Mobiletests, sieben Typechecks, Build, scoped Lint/Format,
19 Boundaries, Fixture/Release und alle bestehenden R10-Schutzhashes.
Kein Test entfernen, keine alte Erwartung abschwächen oder Snapshot blind
aktualisieren. Produkt-Playerhash bleibt
`aec271b61cafedf998b3f0713659b98c5062fbc382e7a3fdbc0eebe9e3db246b`.
Nur kurze neue Evidence-/Handoff-Köpfe und eindeutiger Endstatus, Historie
erhalten. Chief reproduziert und bindet den Kandidaten; die unabhängigen
Rechecks prüfen danach ausschließlich diese offenen Orakel. P4-B bleibt
bis zum vollständigen P3-A-Endgate ohne Schreibrecht.
