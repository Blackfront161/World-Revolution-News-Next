# WRN-G3-020 P3-R1 – enge Lint-/Cleanup-Korrektur

Status: **SCHREIBBAR fuer genau einen Terra/high-Frontendwriter**

## Befund

Chief reproduziert auf dem uncommitteten P3-Kandidaten 144 Mobile-, 5 UI-
Sprach- und 92 Contracttests, beide Typechecks sowie 19 Boundaries GREEN.
Der diffbegrenzte ESLintlauf ist RED mit fuenf Errors und einer Warning:

1. unbenutztes `useMemo`;
2. zwei Fast-Refresh-Meldungen fuer Nicht-Komponentenexporte;
3. eine nutzlose Initialzuweisung von `loadKind`;
4. ein bereits vor P3 vorhandener, durch Formatierung nun diffberuehrter
   unbenutzter `_input` in `App.test.tsx`;
5. Cleanup liest `runRef.current` ohne an die gestartete Run-ID gebundene
   lokale Kopie.

Das ist kein Freigabe-GREEN. Die Korrektur darf keine Produktsemantik,
Testschaerfe oder API-Grenze veraendern.

## Exakte Allowlist

1. `apps/mobile/src/mobile-regional-events-ui.tsx`
2. `apps/mobile/src/App.test.tsx`
3. `docs/evidence/WRN-G3-020/P3-FRONTEND-IMPLEMENTATION.md`
4. `docs/handoffs/WRN-G3-020-p3-frontend-implementation.md`

Kein Index/Commit, keine Kinder, keine weiteren Pfade.

## Korrekturregeln

- unbenutzten Import entfernen;
- `loadKind` ohne nutzlose Vorbelegung, aber mit vollstaendiger Zuweisung in
  Erfolg und Catch fuehren;
- Controllerhook intern halten, sofern kein echter Consumer ihn importiert;
  den fuer Units benoetigten reinen Formatter mit enger begruendeter ESLint-
  Ausnahme exportieren, statt Regeln global abzuschalten;
- Effect-Cleanup an die lokal erfasste gestartete Run-ID binden, spaete
  Ergebnisse weiter sicher invalidieren und Stores weiterhin schliessen;
- `_input` entfernen, ohne Mockaufruf/-beleg abzuschwaechen;
- Report/Handoff auf tatsaechlich 18 geaenderte der 19 erlaubten Pfade sowie
  die R1-Lintreproduktion korrigieren. Der unveraenderte Sprachtest bleibt
  trotzdem durch den bestandenen generischen Paritaetstest belegt.

## Pflichtpruefungen

- diffbegrenztes ESLint `--max-warnings=0` GREEN;
- Prettier GREEN;
- 144 Mobile-, 5 UI-Sprach- und 92 Contracttests GREEN;
- beide Typechecks GREEN;
- fokussierte P3-Visualspec 3/3 GREEN, keine neue Evidence erforderlich,
  sofern Quell-/Sichtsemantik unveraendert bleibt;
- `git diff --check` GREEN.

P2-IDB-Vollmatrix, unabhaengige QA, Security und finaler Architekturreview
bleiben anschliessende Chief-Gates. Keine externe Freigabe.
