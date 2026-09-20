# WRN-G3-014 – gezielte P3-Diagnose

PO-071; S11 nach gesichertem S10-WIP `058e156`, Backendbasis `7b449c7`.
Profil `incident_debugger`, Sol/high. Genau ein Slot, keine Kinder.
Produktdateien und vorhandene Tests read-only; keine Korrektur/Installation.
Schreiben nur `docs/evidence/WRN-G3-014/FRONTEND-DIAGNOSIS.md`,
`docs/evidence/WRN-G3-014/frontend-diagnosis/` und
`docs/handoffs/WRN-G3-014-frontend-diagnosis.md`.

## Frage und Grenze

Der neue integrierte A/B-Test in `tests/e2e/content-offline.spec.ts` sieht nach
Save und Check keine Kandidatenzeile. Gruene isolierte Controllerbelege
beweisen nicht, dass die Ursache React ist. Unterscheide Testdaten/Routing,
Operationsreihenfolge, Controller-Endwert und React-Publikation.

1. Originaltest beidseitig reproduzieren; Ausgabe/technische Beobachtung
   dauerhaft sichern. Danach kontrollierte Variante mit echten Quellenbytes
   und beobachtbarem Save-complete, keine feste Schlafzeit oder API-Mocks.
2. Chief-Lesehinweise, noch keine Ursachenbeweise: Der Test wartet nach Save
   nur auf die schon vorher aus Restore sichtbare aktive A-Revision, nicht
   auf gespeicherten Stand/Operationsabschluss. Sein letzter erwarteter
   A-Revisionstext nennt G3-007 statt G3-012. Beobachte auch zulassige schnelle
   Klickfolgen: Werden Aktionen sichtbar angeboten und still verworfen?
3. Enge benachbarte P3-Integration pruefen: Guard gegen aktive Operation,
   History/Direct Route vor Guardfreigabe, Clear und spaete Publikation.
   Keine erneute Vollrepo-/Backend- oder visuelle Gesamt-QA.
4. Liefere reproduzierbare Befunde mit Produkt-vs-Harness-Klassifikation,
   kleinster Korrekturgrenze und konkreten roten Regressionen fuer P3.
   Alle noch fehlenden breiteren P3-Flows bleiben beim Folgeimplementierer.

## Belege und Aufwand

Node 24.19/pnpm 11.19, vorhandene Tools, keine Installation. Playwrightfilter
direkt ueber gebundene Node-Binary und vorhandene Playwright-CLI ausfuehren.
Mobile 43173 und gebaute Website 43174 fuer UI; echte isolierte Browserkontexte.
Keine Aufzeichnung echter Inhalte/privater Daten; A/B/C nur eigene Testdaten.
Maximal eine fokussierte Untersuchungsrunde mit den oben genannten Varianten;
bei unerwartet breiterem Befund an Chief statt Scope selbst vergroessern.
Keine WIP-Finalantwort ohne nachvollziehbaren Diagnose-/Handoffstand.
Nur eigene Dokument-/Harnesspfade lokal committen; Chief-Governance und
`.codex-remote-attachments/` niemals stagen. Danach Schreibarbeit beenden.

END-CHECK: :)
