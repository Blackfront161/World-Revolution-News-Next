# WRN – reproduzierbare Home-Tests nach Fixtureablauf

PO-Auftrag vom 8. September 2026: Fehler korrigieren und geplante Arbeit
fortführen. Chief bindet einen separaten test-only Scope außerhalb des
unveränderten Medienkandidaten. Kein paralleler Produktwrite.

Quelle: `apps/mobile/src/App.test.tsx`, drei seit 7. September bekannte
Baselinefehler; Fixture `g3-016-home-fixtures.ts` bindet Sport gültig von
30. August 2026, 10:00 UTC bis 6. September 2026, 10:00 UTC.
Die drei Ready-/Sporttests rendern ohne `now` und laufen damit gegen die echte
Uhr. Ihr positives Orakel ist nach Ablauf nicht mehr erfüllbar.

Einziger erlaubter Testpfad: `apps/mobile/src/App.test.tsx`. Umsetzung durch
Chief erst nach Ende des exklusiven Medienwriters. Drei positive Tests
erhalten über den vorhandenen `App.now`-Parameter die gebundene gültige
Testzeit. Kein globales Clockmock, keine Fixture-/Hash-/Produktänderung und
keine abgeschwächte Erwartung. Der vorhandene explizite Stale-Test bleibt
unverändert und muss weiter sechs Hauptkarten ohne Sport belegen.

Abnahme: drei Fehler zuerst reproduzieren; danach vollständige App-Suite und
voller Mobilelauf, Mobile-Typecheck, scoped Format/Lint. Read-only Review des
minimalen Deltas; keine zusätzliche Screenshotmatrix bei reinem Testdelta.
Bestehende fachliche und externe Gates bleiben erhalten. Rücknahme ist eine
isolierte Teständerung ohne persistente Nutzerwirkung; Laufzeitkosten null.

## Enger zusätzlicher Test-Lintbefund

Der Chief-Lintlauf über beide Clients und alle Packages fand am selben Tag
genau einen Fehler: ungenutztes `_path` in
`apps/mobile/src/mobile-reader-v2.test.ts:120`. Dieser zweite Testpfad wird
ausschließlich zum Entfernen des ungenutzten Callbackparameters aufgenommen.
Kein Produktwrite, keine Assertionänderung; bestehende Reader-v2-Suite und
derselbe vollständige Source-/Package-Lintlauf müssen danach bestehen.

Abschlusskandidat: `9b6cc34`. Das Mock behält über einen expliziten Funktionstyp
seine prüfbaren Aufrufargumente; nur der ungenutzte Implementierungsparameter
entfällt. Die drei Homefälle sind an 30. August 2026, 10:00 UTC gebunden.
Vorher App 47/50, danach App 50/50; zusammen mit Store-/Readerprüfungen 82/82.
Nach dem separat implementierten Clearfix besteht der gesamte Mobilelauf
342/342. Typecheck, Format und Source-/Package-Lint sind GREEN.
