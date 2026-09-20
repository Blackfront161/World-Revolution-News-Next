# WRN-G3-017 P4-A-M-001 – Offline-Projektion fuer `Für mich`

Stand: 30. August 2026

Status: **VORBEREITET; START ERST NACH VERSIEGELTEM P4-A-BERICHT**

## Befund

Kandidat `8efa7e4` reicht dem Personalisierungshub Artikel und Discoverindex
nur bei `displayedState === 'ready'` weiter. Der bestehende Discoverpfad
verwendet dieselben validierten lokalen Daten dagegen vertragsgemaess auch bei
`offline`. Dadurch zeigt eine gueltig gespeicherte Auswahl im Offlinezustand
faelschlich keine Treffer und verliert ihre lokalen Reader-Einstiege.

## Eigentum und Schreibscope

Genau ein `spark_micro_task_worker` als enger Korrekturwriter; keine Kinder,
kein Commit. Schreiben nur:

- `apps/mobile/src/App.tsx` fuer die vorhandene gebundene Contentbedingung;
- `apps/mobile/src/App.test.tsx` fuer den gezielten Offline-Hub-/Readerbeleg;
- `tests/e2e/g3-017-personalization-visual.spec.ts` nur fuer einen sichtbaren
  Offline-Hub-Beleg, falls ohne Harness- oder Fixtureaenderung moeglich;
- eigener Korrekturbericht, eigener kleiner Visual-Unterbaum und Handoff.

Alle anderen Produkt-, P2-, Sprach-, CSS-, Foundation-, Website-, Fixture-,
Dependency-, Governance-, Hosting-, Android- und Releasepfade sind read-only.

## Exakte Korrektur

- Verwende fuer `MobilePersonalizationHub` dieselbe bereits berechnete
  `discoverHasContent`-Wahrheit wie der bestehende Discoverpfad, statt
  `isReady`.
- Keine neue Datenquelle, kein Fallback, keine neue Navigation, Copy oder
  Zustandsmaschine.
- Offline werden ausschliesslich die bereits validierten lokalen Artikel und
  der zugehoerige Discoverindex projiziert.
- Ready-, Loading-, Error-, Protected-, Unavailable-, Save-/Clear-,
  StrictMode- und Cross-tab-Verhalten bleiben unveraendert.

## Pflichtbelege

1. gespeicherte passende Auswahl + `initialState="offline"` zeigt den lokalen
   Treffer statt `No validated local articles match this selection`;
2. Reader-Einstieg und Rueckfokus funktionieren aus dem Offline-Hub;
3. Ready- und No-match-Regressionsfaelle bleiben GREEN;
4. Mobile Units, Mobile Typecheck, Scope-Lint, Boundaries, Releaseboundary,
   Mobile-/Website-Build, Prettier und Diffcheck;
5. wenn der enge Visualtest ohne fremde Mutation erweiterbar ist: ein
   Offline/Dark-Bild mit Axe, 44px, Overflow und No-request/No-cookie. Sonst
   transparent `NOT-RUN` und unabhaengige Re-QA bindet den sichtbaren Fall.

## Stopregeln

Jede notwendige Fixture-/Index-/P2-/Copy-/CSS-/Harnessaenderung, echte Inhalte,
Netzwerk, neue Kosten oder externe Mutation: Stop an Chief. Writer-GREEN ist
keine P4-A-, PO-, Live-, Android- oder Releasefreigabe.

END-CHECK: :)
