# Agent Handoff

- Agent: `backend_data_reliability_engineer`
- Task-ID: WRN-G3-014 P2
- Ergebnis: **teilweise**
- Eltern-/Kindbrief, Rolle und Instanz: Chief-P2 / Fachinstanz `/root/g3014_backend`
- Basiscommit: `48310da`; Ergebniscommit: `21de12f` (Chief-Zuordnung)
- Slot-ID: S2, Chief; keine Kinder
- Unabhängiger Reviewadressat: Main/Chief

## Kurzfazit

Es existiert ein kompiliertes additive Offline-Control-/IDB-API. P3 darf es
nicht integrieren: der Pflichtnachweis für vollständige A/B/C-Transaktionen
und beide Browseradapter fehlt.

## Geänderte Dateien

- `packages/content-contracts/src/index.ts`, `packages/domain/src/index.ts`
- `apps/mobile/src/content-offline-store.ts`, `apps/website/src/content-offline-store.ts`
- beide `local-content-release.ts`
- zwei enge Contract-/Guardtests und ein Mobile-IDB-Playwright-Harness

## API- und UI-Pflichten für eine spätere Integration

Vor Quellencheck bei aktivem Offlinebundle: `snapshot` → `prepareRecheck`;
alle folgenden Aufrufe verwenden die zurückgegebene Generation/Clear-Epoch.
Nach semantisch gebundener Safety-Evidence: `recordSafety`; ein erfolgreicher
Check ohne Aktivierung benötigt `completeRecheck`. Kandidaten werden mit
`saveCandidate` gespeichert, erst anschließend mit `activateCandidate` aktiv.
Vor Readerzugriff und Resume ist `evaluateContentOfflineGuard` aufzurufen.
Rollback benötigt bestätigte Aktion, aktuelle CAS-Werte und eine gültige TTL.
Kein UI darf Pending, Storagefehler oder abgelaufene Prüfzeit als Offlineerfolg
darstellen.

## Tests und offene Arbeit

Die tatsächlich grünen Tests stehen in
`docs/evidence/WRN-G3-014/BACKEND-IMPLEMENTATION.md`. Offen sind A/B/C-
Fixtures, vollständige echte IDB-Failuretests pro Client, Teilfehlersafety,
Quota/Abort/CAS-Tabrennen, Wiederanlauf und Stream-/Gesamtzeitgrenzen. Die
anfängliche Test-first-Abweichung ist dokumentiert. Kein GREEN und keine
Weitergabe an P3.

## WRN-AGENT-STATUS

- Task: WRN-G3-014 P2
- Status: YELLOW
- Quellstand: `48310da` plus ungesicherter P2-Zwischenstand
- Erledigt: Vertrag, Guard, getrennte Stores, erster echter IDB-Fall
- Tests: siehe Evidence
- Offen: vollständige P2-Failurematrix
- Handoff: dieser Pfad
- Nächster Schritt: Chief entscheidet über gesicherten Zwischencheckpoint und frische P2-Fortsetzung, nicht P3
- END-CHECK: :)
