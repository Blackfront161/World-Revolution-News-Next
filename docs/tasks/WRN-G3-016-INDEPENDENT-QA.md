# WRN-G3-016 P4 – unabhaengige Mobile-QA

Stand: 30. August 2026. Produktkandidat `4113a72`, Governance `056ec03`.

## Auftrag

Ein frischer `qa_release_engineer` prueft den gesamten G3-016-Mobile-Scope
unabhaengig. P1/P2/P3-Berichte sind Orientierung, kein zu uebernehmendes
GREEN. Produkt, bestehende Tests und historische Evidence bleiben read-only.

## Schreibscope

- neu `tests/e2e/g3-016-home-independent-qa.spec.ts`
- eigene Evidence `docs/evidence/WRN-G3-016/qa/**`
- eigener Handoff `docs/handoffs/WRN-G3-016-independent-qa.md`

Keine andere Datei ist schreibbar. Keine Selbstkorrektur, keine Kinder.

## Pflichtmatrix

1. Diff-/Scope-/Quellreview `5f293b1..4113a72`, einschliesslich aller neun
   Kataloge und der beiden Chief-Nachkorrekturen.
2. Frisch: Mobileunits, Mobile-/Sprach-Typecheck, Format/Lint, Mobilebuild,
   Releaseboundary, 19 Boundaries und Mobile-Foundation.
3. Unabhaengige Browserassertionen fuer 9 UI-Sprachen x 4 Themes x
   4 Viewports (390x844, 412x915, 600x960, 844x390): exakt 1+5+1+2 Rollen,
   Reihenfolge/Eindeutigkeit, kein horizontaler Overflow, keine verdeckten
   Aktionen, 44px-Ziele, Axe, keine Rohkeys/externe Requests/Cookies.
4. 200-%-Reflow fuer alle neun Sprachen und vier Themes, initial und nach
   Mount; eine Dokument-Scrollachse, Header/Navigation/Sektionen erreichbar.
5. Interaktion: Lesen und Browser-Zurueck mit Fokus aus Aufmacher, Main und
   Sport; Save/Remove; Sportlink mit genau drei Treffern und Zurueck; stale
   Sport ohne Karten; ungueltige Primaerrollen fail-closed; Sprachpersistenz.
6. Frische QA-Sichtbelege muessen mindestens Top, Main und Sport fuer jede
   Viewport/Theme-Kombination sowie die vier Themes jeder Sprache im
   390px-Reflow abdecken. Jeder Beleg ist benannt/hashgebunden; Assertions
   und sichtbare Abdeckung werden getrennt beschrieben.

## Finding- und Stopregel

Jede Abweichung mit Schweregrad, Reproduktion, Quelle und sichtbarem Beleg an
Chief. Keine Korrektur. HARNESS-/Umgebungsfehler von Produktfindings trennen.
Bekannte Website-Brand/Header-REDs sind ausser Scope und werden nicht als
neue G3-016-Mobilefindings gezaehlt. Kein PO-, Live-, Android- oder Release-
GREEN aus P4.

END-CHECK: :)
