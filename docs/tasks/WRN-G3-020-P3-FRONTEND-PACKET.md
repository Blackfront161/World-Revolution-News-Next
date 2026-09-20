# WRN-G3-020 P3 – Mobile-Frontend-/Lifecycle-Paket

## Identitaet

- Task-ID: `WRN-G3-020-P3`
- Auftraggeber: Product Owner mit PO-098 `START WRN-G3-020`
- Zustaendig: genau ein frischer `frontend_brand_engineer`, Terra/high
- Delegation: nicht erlaubt; keine Kinder
- Slot-, Register- und Integrationsowner: Chief `/root`
- Quellencommit: `00eaebf`
- Reviewowner: danach frische Terra-QA und Sol-Security/-Architektur

Dieser Brief erteilt genau einem Writer Schreibrecht. Er startet weder
G3-021 noch echte Inhalte, Website, Hosting, Live oder Release.

## Ziel

Der vorhandene Mobile-Platzhalter `Termine` wird durch eine professionelle,
lokale Termineoberflaeche ersetzt. Der User waehlt bewusst
`Kontinent > Land > Region`; die stabile Regions-ID bleibt lokal gespeichert.
Die App zeigt deterministisch hoechstens fuenf kommende Termine und benennt
Leer-, Alt-, Offline-, Update-, Schutz- und Fehlerzustaende ehrlich.

Das gebundene Produktionsfixture ist absichtlich leer. Die reale App zeigt
deshalb zunaechst den ehrlichen Leerzustand. Nichtleere Presentational-Belege
entstehen nur in einem getrennten test-only Harness mit selbst erstelltem
Viewmodel und gelten nicht als Inhalts-, Store- oder Pinbeweis.

## Verbindliche Quellen

1. `docs/tasks/WRN-G3-020-REGIONAL-EVENTS.md`
2. `docs/tasks/WRN-G3-020-P3-FRONTEND-PRECHECK.md`
3. `docs/evidence/WRN-G3-020/P3-FRONTEND-PRECHECK.md`
4. `docs/handoffs/WRN-G3-020-p3-frontend-precheck.md`
5. `docs/tasks/WRN-G3-020-P2-BACKEND-PACKET.md` plus gebundene
   P2-Korrekturvertraege
6. `mobile-regional-events.ts`, `mobile-regional-events-store.ts` und
   `mobile-regional-events-selection.ts` – vollstaendig read-only

Bei Widerspruch, unmoeglichem Adapter, benoetigter Allowlistenerweiterung oder
unklarem Zustand stoppt der Writer fail-closed und berichtet dem Chief.

## Exakte Writer-Allowlist

Nur diese 19 Pfade duerfen geschrieben werden:

1. `apps/mobile/src/mobile-regional-events-ui.tsx` neu
2. `apps/mobile/src/App.tsx`
3. `apps/mobile/src/styles.css`
4. `packages/ui-language/src/index.ts`
5. `packages/ui-language/src/catalogs/de.ts`
6. `packages/ui-language/src/catalogs/es.ts`
7. `packages/ui-language/src/catalogs/fr.ts`
8. `packages/ui-language/src/catalogs/it.ts`
9. `packages/ui-language/src/catalogs/pt.ts`
10. `packages/ui-language/src/catalogs/ru.ts`
11. `packages/ui-language/src/catalogs/el.ts`
12. `packages/ui-language/src/catalogs/tr.ts`
13. `apps/mobile/src/mobile-regional-events-ui.test.tsx` neu
14. `apps/mobile/src/App.test.tsx`
15. `packages/ui-language/src/index.test.ts`
16. `tests/e2e/g3-020-regional-events-visual-harness.tsx` neu
17. `tests/e2e/g3-020-regional-events-visual.spec.ts` neu
18. `docs/evidence/WRN-G3-020/P3-FRONTEND-IMPLEMENTATION.md` neu
19. `docs/handoffs/WRN-G3-020-p3-frontend-implementation.md` neu

Der Writer darf weder stagen noch committen.

## Architektur und Verhalten

- Controller, reines Viewmodel, reine View und Zeitformatierung liegen im
  neuen Modul; `App.tsx` erhaelt nur Import, Routenintegration, vorhandenen
  `now`-Adapter und Fokusgrenze.
- Pro Lauf genau eine Referenzzeit; nur explizites Neuladen startet einen
  neuen Lauf. Unmount/Navigation abortiert; spaete Ergebnisse werden ignoriert.
- Zuerst Store-Snapshot, dann exakter Produktions-Pinload. Ready wird
  bytegenau gespeichert und genau einmal aktiviert. Kein Auto-Retry.
- Nach Activate-/Safetykonflikt genau ein frischer Snapshot; nur sicherer,
  erneut validierter Active darf als LKG erscheinen.
- Offline/ungueltiges Update mit sicherem LKG bleiben getrennt als
  `offline-lkg` bzw. `invalid-update-lkg`; ohne LKG ehrlich `offline-none`
  oder `error`. Future/Corrupt bleibt `protected` und unveraendert.
- Auswahl-IDB bleibt getrennt. Kontinent/Land sind fluechtige Entwuerfe; erst
  ausdrueckliche Regionsbestaetigung speichert generation-CAS-geschuetzt.
  Keine Ersatzwahl bei Successor, unbekannter, gesperrter oder entfernter ID.
- Keine Geolocation, Permission, IP-Ableitung, URL-/Hash-/LocalStorage-
  Standortwahl, Analytics, Cookies, Rohdaten-/Auswahllogs, Remote-Medien,
  Timer, Polling oder Hintergrundupdate.
- Maximal fuenf Karten, vertikaler Stack/Grid, kein horizontaler Carousel.
  `scheduled`/`changed` duerfen Karten sein; `cancelled`/`blocked` nur
  datensparsame Lifecycleeintraege ohne alten gesperrten Payload.
- Titel und Ort nur in der gebundenen UI-Sprache. Zeit nur aus `startInstant`
  mittels `Intl.DateTimeFormat` plus sichtbarer kanonischer IANA-Zone und
  semantischem `time`-Element.
- Alle Texte in neun UI-Sprachen. Keine erfundenen Produktinhalte oder Bilder.

## Tests und visuelle Belege

- Unit/Komponente: gesamte im GREEN-Precheck definierte Start-, Abort-, Save-/
  Activate-, CAS-, LKG-, Restart-, Selection-, Status-, Lifecycle-, Zeit-/DST-
  und Negativmatrix.
- Realer Produktpfad: `#events` mit unveraendertem leerem Produktionsfixture.
- Presentational Harness: nur unter `tests/e2e`, selbst erstelltes Viewmodel
  ueber lokale test-only Route; kein Produkt-Testschalter und keine Mutation
  von Pin, Fixture, Loader, Stores, Config oder globalem Setup.
- Visuell: 9 Sprachen x 4 Themes x `390x844`, normal und 200 Prozent = 72;
  zusaetzlich 8 Viewports x 4 Themes = 32 sowie die gebundene Statusmatrix.
- A11y: Axe, semantische Struktur, echte Labels, Fokus, Tastaturfolge,
  Status/Alert, 44x44 CSS-Pixel, Kontrast, keine reine Farbkodierung und kein
  horizontaler Overflow.
- Pflichtlaeufe mit exakt Node 24.19: fokussierte Units, komplette Mobile-
  Units, UI-Sprachtests, beide Typechecks, bestehende Mobile-E2E,
  P3-Visualspec, 19 Boundaries, Release-/Fixturegrenzen sowie ESLint/Prettier
  fuer den erlaubten Diff.

## OUT und Stopbedingungen

Read-only bleiben alle P2-Module/-Tests/-Fixtures/-Pins/-Browserharnesses,
Website, Shared Reader, globale Configs, Packages/Exports, Dependencies und
Lockfile, echte Inhalte/Medien/Provider sowie Map/Spiel. Hosting/Live,
Android/AAB/Play, Signierung, Upload, Deployment und Release bleiben gesperrt.

Der Writer stoppt bei Testfehler, Scopeabweichung, neuem Sicherheits-/Privacy-
Risiko, notwendiger Dependency, unklarer Rechte-/Quellenlage oder wenn die
ehrliche leere Produktprojektion nur durch einen Testhook umgangen werden
koennte. Keine Selbsterweiterung des Scopes.

## Uebergabe und Folgegates

Der Writer liefert exakte Dateiliste, Diffbasis, Testergebnisse, Report,
Handoff, Quellhashes, kanonischen Screenshotbestand samt Aggregathash,
bekannte Grenzen und `WRN-AGENT-STATUS` mit `END-CHECK: :)`. Danach enden
alle Rechte.

Chief reproduziert und integriert. Anschliessend folgen frische Terra-Visual-/
A11y-QA, ein versiegelter Sol-Security-/Privacy-Diffscan und ein finaler Sol-
Architekturabschluss. Erst dann darf der Product Owner die lokale Sichtprobe
abnehmen. Kein automatischer Start von G3-021.
