# WRN-G3-021 P3-A-R11 – unabhängige Kandidatenprüfung

Status: aktiv nach separatem Chief-Metadatencommit. Eingefrorener Kandidat
`ad9488fd30d26808e4f6e704496d104d291778be`, Writer und Chief-Endmatrix
beendet. Delegation erlaubt,
keine Kinder. Kein Prüfer hat Produkt- oder Testschreibrecht.

## Zwei unabhängige Zuständigkeiten

Eine frische Terra-QA prüft die R11/R1-Akzeptanzmatrix und reproduziert
fokussierte sowie vollständige Mobiletests, die ganze Lifecycle-Browserdatei
zweimal seriell, Typechecks und betroffene statische Grenzen. Nur sie besitzt
während dieser Runde die Browserressource. Eigene Belege:

- `docs/evidence/WRN-G3-021/P3-A-R11-INDEPENDENT-QA.md`
- `docs/handoffs/WRN-G3-021-p3-a-r11-independent-qa.md`

Ein unabhängiger Sol-Reviewer prüft gleichzeitig defensiv den Playerdelta,
dessen Zusammenspiel mit dem unveränderten Hub und die neuen Testorakel.
Er hat nicht an der Implementierung mitgewirkt. Keine Wiederholung einer
vollen historischen Scanreihe; bei neuer Evidenz konkrete Regressionen melden.
Eigene Belege:

- `docs/evidence/WRN-G3-021/P3-A-R11-INTEGRITY-PRIVACY.md`
- `docs/handoffs/WRN-G3-021-p3-a-r11-integrity-privacy.md`

Kein Git-Index/Commit und keine fremden Änderungen zurücksetzen. Beide
Belege binden denselben vollständigen Ergebnis-SHA. Erst beide GREENs
ermöglichen einem frischen unabhängigen Architekturprüfer den engen
Abschluss von `P3-A-FINAL-ARCH-M-001` ohne erneute ungezielte Vollprüfung.
P4-B bleibt bis zu dieser Schließung ohne Produktrechte.

## Konkrete Prüfpunkte

- Nichtnull Pauseposition bleibt nach ausdrücklichem Fortsetzen erhalten;
  dieselbe URL, dasselbe Element, keine neue Fetch-/Hash-/Blob-/Src-/Load-
  oder Seeksenke. Vorher abgeschlossenes Pause-Save als positiver Vergleich.
- Neue Run-/Abort-/Handlerbindung sowie genau ein local-Epochcallback vor
  erstem Await; komplette Pre-/Post-Play-Context-/Clock-/Safetyrelationen.
- Echte pending Pause-Save→Continue-Fälle mit `saved`, `no-op` und Reject:
  jeweilige vollständige öffentliche und neue persistente Nachbilder prüfen,
  zulässige exakte Kompensation nicht mit öffentlicher Mutation verwechseln.
- 3 Awaitphasen × 4999/5000/5001; literal gebundene Fehlerkategorien,
  Promiseabschluss trotz gehaltenem Fremd-Promise, echte Lateauflösung/
  Rejection ohne neue Senke oder unhandled rejection, Expirydominanz bei
  Gleichheit, alte Timer/Events nach Runverlust inert.
- Reale Chromium-/IndexedDB-Integration und ungeschwächte vorhandene
  6×7-/Provenienz-/Ressourcenorakel. Testanzahl ist kein Abdeckungsbeleg.
- Exakt fünf Ergebnisdiffpfade; Player-Vor-/Nachhash belegt, Hub/Stores/
  Contracts/Fixture/Pins/Dependencies und alle zwölf Schutzpositionen stabil.

Die Prüfungen bewerten ausschließlich lokale Technik und Datenschutz des
Kandidaten. Kein versiegelter Securityscan, keine visuelle Abnahme, keine
Provider-/Live-/Android-/Releasefreigabe.

## Laufzeitdisposition für unabhängige Prüfer

Der Versuch, eine frische QA-Instanz zu starten, wurde vom Runtime-Threadlimit
abgewiesen. Daher übernimmt die vorhandene Terra-Instanz media_ui_preparation
die QA und nach Ende ihres disjunkten Terminvertrags die vorhandene Sol-
Instanz events_sol_assurance den defensiven R11-Review. Beide haben weder
den R11-Produktcode noch seine Tests geschrieben. Ihre R11-Prüfung bleibt
unabhängig; frische Instanzen werden ausdrücklich nicht behauptet. Ein enger
abschließender Architekturentscheid folgt als gesonderter read-only Schritt.
Dies ist eine Toolkapazitätsdisposition, keine Abschwächung der Prüforakel.
