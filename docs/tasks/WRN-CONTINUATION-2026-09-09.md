# Fortsetzung: echte Startverweise und bestätigte Videoquellen

- Auftrag: ausdrückliche PO-Fortsetzung vom 9. September, bestätigte elf Videoquellen.
- Basis: `2b9e5da`; Chief `/root`, alleiniger Integrations- und Produktwriter.
- Delegation: erlaubt, höchstens zwei direkte read-only Helfer; keine Weiterdelegation.
- Register: `docs/WRN-G3-021-DELEGATION-REGISTER.md`, nur Chief schreibt.
- Slot 1: Luna/explorer, enges Startseiten-/Directory-Inventar ohne Dateiänderungen.
- Slot 2 nach Kandidat: Terra/QA, unabhängig, nur eigener Evidence/Handoff.
- Browser zunächst Chief; ein Ergebnis pro Helfer, keine unbegründeten Folgerunden.

## Ziel und Scope

Die elf angenommenen Videoquellen werden in beiden Clients unter Medien erreichbar,
mit neun Inhaltssprachen, Filter und Originalverweis. Keine erfundenen Einzelclips,
Kanal-IDs oder Verfügbarkeiten. Bestehende Nachrichtenmetadaten werden vom Appstart
direkt erreichbar; die Analyse bestimmt die kleinste sichere Integration.

Erlaubte Produktpfade: neue `packages/content-contracts/src/video-sources-v1.ts`
mit Tests und Export; neue `packages/ui-language/src/video-sources.ts` mit Export;
je Client `src/video-sources-ui.tsx` und Einbindung in `src/App.tsx`; neue
`.video-sources-*`-CSS-Regeln im gemeinsamen Brand-CSS. Mobile Startverweise nur
unter `apps/mobile/src/features/directory/` und enger Home-Einbau in `App.tsx`,
zugehöriger Test. Neue `tests/e2e/video-sources.spec.ts`, eigene Belege unter
`docs/evidence/WRN-CONTINUATION-2026-09-09/`, Handoff und Statusdokumente.

Keine Änderungen der Reader-/Artikelreleases, Persistenz, Mediencontroller,
Player, Offlineverträge, Dependencies, APIs, Altquellen oder Content-JSON-Snapshots.
Keine externen Writes, Installation, Signierung, Schlüssel oder Veröffentlichung.

## Abnahme

1. Genau elf bestätigte Quellen: stabile IDs, neun Sprachcodes, sichere HTTPS-
   Originalverweise und getrennte Quelle/Einzelvideo-Semantik.
2. Sprachfilter, Anzahl und Leerzustand; keine Drittrequests beim Aufruf.
3. Getrennte Clients/Builds; Audio bleibt unverändert. Rote Filterzustände und
   schwarzes Violetttheme; Tastatur, 44px-Ziele, 320px und RU 200%-Reflow.
4. Vertrags-/Filtertests, relevante Clienttests, Typen, scoped Lint/Format,
   beide Builds und Browsermatrix mit frischem Output/gesicherten Screenshots.
5. Unabhängige enge QA; keine PO-Sichtabnahme oder Releasefreigabe erfinden.

## Daten, Rücknahme und Übergabe

Metadaten aus dem gebundenen Empfehlungsbericht und der PO-Auswahl, Stand
9. September. Kein laufender Feed und kein Offlinevideo. Filter nur im
Komponentenstate, keine Speicherung politischer Interessen. Rücknahme durch
gezielten lokalen Git-Revert ohne Datenmigration. Übergabe nennt Dateien,
Tests, Bilder und verbleibende Releasegates; Agentenhandoff nach Vorlage mit
`END-CHECK: :)`. Dieser Brief konkretisiert bereits erteilte Umsetzungsvollmacht.

## Enger QA-Nachtrag am 10. September

Terra findet in2b4a303 ausschließlich an der neuen Website-Videoliste einen
Überschriftenebenen-Sprung. Nach Rückgabe der Browserrechte korrigiert Chief
Websitekarten h3→h2, passende gemeinsame CSS-Regel und E2E-Erwartung mit expliziter
Ebene2/3 je Client. Danach gezielter Recheck durch dieselbe unabhängige QA;
alle anderen Produktverträge unverändert. Kein neuer Gestaltungsauftrag.
