# WRN-G3-020 P3-R3 – spaete Selection-Rejection

Status: **SCHREIBBAR fuer genau einen frischen Terra/high-Frontendwriter**

## Ausgangslage

- korrigierter P3-R2-Kandidat: `daf83ea876fba05d4b2ac9ce7c2250b5aea2b60b`
- unabhaengige QA: `c952374`, Finding `P4-R1-QA-M-001`
- Terra-Architektur-Ersatzreview: `c952374`, Finding
  `G3-020-P5-R1-TERRA-M-001`
- Ursache: `saveSelection` und `clearSelection` pruefen nach erfolgreichem
  Await den aktuellen Run, aber nicht in ihrem Fehlerpfad. Eine alte
  Rejection kann deshalb nach Reload den neuen Lauf sperren oder nach
  Unmount noch Ref-/Statewrite versuchen.

## Identitaet und Grenzen

- Writer: genau ein frischer `frontend_brand_engineer`, Terra/high
- keine Kinder, keine Unterdelegation, kein Git-Index/Commit
- Integrationsowner: Chief `/root`
- keine neue Dependency, Config, Fixture, Pin, P2-API, Copy, CSS oder externe
  Kopplung
- alle nicht genannten Pfade sind read-only; bei erforderlicher Erweiterung
  fail-closed stoppen

## Exakte Vierpfad-Allowlist

1. `apps/mobile/src/mobile-regional-events-ui.tsx`
2. `apps/mobile/src/mobile-regional-events-ui.test.tsx`
3. `docs/evidence/WRN-G3-020/P3-R3-LATE-SELECTION-REJECTION.md` neu
4. `docs/handoffs/WRN-G3-020-p3-r3-late-selection-rejection.md` neu

## Verbindliche Korrektur

1. Beide Catchpfade muessen vor jeder Mutation von
   `mutationDisabledRef`, Drafts oder React-State dieselbe Run-ID-, aktive
   Run-ID- und Abortpruefung wie der Erfolgsweg ausfuehren.
2. Eine Rejection des aktuellen Runs bleibt ehrlich `reload-required` und
   sperrt weitere Selectionmutation bis zum expliziten Reload.
3. Eine Rejection eines alten oder abgebrochenen Runs ist wirkungslos: kein
   Refwrite, kein Statewrite, kein Retry und keine Mutation des neuen Runs.
4. Die bestehende Store-/Selection-/Offline-/LKG-/Privacysemantik bleibt
   byteunveraendert.

## Pflichtorakel

Mit kontrollierten Deferred-Adaptern getrennt fuer Save und Clear:

1. Rejection nach vollstaendig erfolgreichem Reload: neuer Run bleibt
   `ready:none`, seine Mutation bleibt bedienbar.
2. Rejection nach Unmount: kein spaeter Ref-/Statewrite; kein React-Warnpfad.
3. unmittelbare Rejection im aktuellen Run: weiterhin
   `ready:reload-required`, Mutation gesperrt.

Mindestens vier neue Deferred-Regressionsfaelle decken Save/Clear mal
Reload/Unmount ab. Vorhandene Immediate-Rejection-Tests bleiben GREEN.

## Pflichtpruefungen

Mit exakt Node 24.19:

1. fokussierte Controllerunits einschliesslich der vier neuen Orakel;
2. komplette Mobileunits;
3. 92 Contract- und 5 UI-language-Tests;
4. beide Typechecks;
5. diffbegrenztes ESLint `--max-warnings=0`, Prettier und
   `git diff --check`;
6. 19 Boundaries sowie Release-/Fixturegrenzen;
7. bestehende 16 Chrome-/IndexedDB-P2-Faelle;
8. P3-Visualspec und Mobile-Build als Nichtregression, ohne neue PNG-
   oder CSS-Anforderung.

## Folgegates

Nach Writerende folgen Chief-Reproduktion, frische unabhaengige Terra-QA,
Security-/Privacy-Diffscan und Architekturabschluss. Der Securitylauf darf
bei fehlendem Sol-Kontingent transparent durch einen Chief-Scan ergaenzt,
aber nicht als unabhaengiger Sol-Beleg bezeichnet werden. Erst danach lokale
PO-Sichtprobe. G3-021 und alle externen Gates bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-020-P3-R3`
- Status: schreibbar fuer genau einen Terra/high-Frontendwriter
- Quellstand: `c95237484e512320036b15888c1be33af3019624`
- Offen: enger Catch-Guard, vier Deferred-Orakel, Folgegates
- END-CHECK: :)
