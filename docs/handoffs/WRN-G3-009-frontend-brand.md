# Agent Handoff

- Agent: frontend_brand_engineer
- Task-ID: WRN-G3-009
- Ergebnis: bestanden mit dokumentierter lokaler Toolchain-Abweichung

## Kurzfazit

Der Produktkandidat `973c129` korrigiert ausschliesslich die belegte
Header-Rollenabweichung. `app-background.webp` ist aus beiden Headern entfernt
und im Manifest nur noch fuer `body-recovery` registriert. Mobile verwendet
die vorhandene, unveraenderte Solinaridao-Marke mit korrektem Seitenverhaeltnis
in der belegten Breite von 94 bis 118 CSS-Pixeln. Die Website behielt ihre
getrennte kompakte Headerkomposition und verwendet ebenfalls eine semantische
Chrome-Oberflaeche statt des redaktionellen Hintergrundbilds.

Eine enge Website-Reflowkorrektur erlaubt dem bereits vorhandenen
`Nachrichtenarchiv`-Ziel im Header-Mehrmenue bei 200 Prozent Textgroesse den
Umbruch innerhalb seines bestehenden Ziels. Navigation, Ziel, Funktion und
Reihenfolge wurden nicht geaendert.

## Verwendete Quellen

- `AGENTS.md`
- `docs/00-PRODUCT-CHARTER.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/04-QUALITY-RULES.md`
- `docs/tasks/WRN-G3-009-BRAND-HEADER-PARITY-CORRECTION.md`
- `docs/evidence/WRN-G3-009-BRAND-HEADER-PARITY-AND-ACCEPTANCE-BRIEF.md`
- `docs/handoffs/WRN-G3-009-preparation.md`
- aktuelle App `2216ff3` und Runtime-CSS `968c320`, strikt read-only
- aktuelle Website `9a59b17`, strikt read-only
- Product-Owner-Screenshot vom 25. August 2026, nur lokal als
  Kompositionsreferenz betrachtet; weder importiert noch versioniert

## Geaenderte Dateien

- `packages/brand-tokens/assets/asset-manifest.json`
  - `app-background.webp`: Headeroberflaechen durch `body-recovery` ersetzt;
    Herkunft, Rechte, Bytes und SHA-256 unveraendert.
- `packages/brand-tokens/src/styles.css`
  - gemeinsames semantisches `--wrn-color-chrome`; nicht mehr verwendete
    direkte Hintergrundasset-Variable entfernt.
- `apps/mobile/src/styles.css`
  - dunkle/themegerechte Chrome-Flaeche, unverzerrte responsive Marke.
- `apps/website/src/styles.css`
  - Chrome-Flaeche ohne redaktionelles Headerbild, unverzerrte kompakte Marke
    und notwendiger Reflowumbruch im bestehenden Mehrmenue.
- `tools/check-brand-assets.mjs`
  - Manifest-Pin und fail-closed Headerregel fuer das redaktionelle Asset.
- `tools/check-brand-assets.test.mjs`
  - zwei absichtlich fehlschlagende Clientheader-Faelle.
- `tests/e2e/foundation.spec.ts`
  - Header-Chrome-/Markentest und mobile Pflichtviewportmatrix.

Keine Legacyquelle, keine Fixture, kein Produktinhalt, keine Dependency und
kein Product-Owner-Screenshot wurden geaendert oder versioniert.

## Tests und Belege

- Ausgangscheckpoint: `fc6c106` (dokumentiertes Startgate `5e9f64b`)
- Produktkandidat: `973c129` (`fix: restore header brand parity`)
- `prettier --check .`: bestanden.
- `pnpm run lint`: bestanden, einschliesslich 17 Boundarypruefungen.
- `pnpm run typecheck`: bestanden.
- `pnpm run check:fixture-provenance`: bestanden.
- `pnpm run check:local-preview`: bestanden.
- `pnpm run check:brand-assets`: bestanden.
- `pnpm run test`: bestanden; 93 Vitest-Tests, zusaetzlich 8
  Website-Static-Tests und 17 Boundarytests.
- `pnpm run build`: beide Clients bestanden; Websiteintegration erzeugte die
  drei bereits freigegebenen lokalen Landingpages.
- Playwright vollstaendig in den vorhandenen sieben Projekten ausgefuehrt, um
  die lokale 30-Sekunden-Prozessgrenze nicht zu ueberschreiten: 51 PASS, 117
  erwartete projektbezogene Skips, 0 Fail. Darin enthalten sind die neue
  Mobilematrix 320 x 568, 360 x 800, 390 x 844 Dark/Light, 412 x 915,
  600 x 960, 844 x 390 und 390 x 844 bei 200 Prozent Reflow.
- Die neuen Asset-Negativtests schlagen absichtlich fehl, wenn
  `app-background.webp` erneut im Mobile- oder Website-Header eingetragen
  wird.

`pnpm run check` als Gesamtwrapper bleibt lokal YELLOW, weil dessen erste
Toolchainpruefung Node `24.19.0` verlangt, aber die Umgebung `24.16.0`
bereitstellt. Alle nachfolgenden, lokal ohne Download ausfuehrbaren Pruefungen
sind oben einzeln bestanden. Dies ist eine bereits vorhandene lokale
Umgebungsabweichung, kein Produkt- oder Testfehler.

## Feststellungen nach Prioritaet

### Geschlossen – WRN-BRAND-PARITY-M-001

Die direkte sichtbare Headerrolle von `app-background.webp` ist entfernt und
gegen Regression abgesichert. Die aktuelle Appquelle wurde nur gelesen; ihre
aktive `.next-header`-Chrome-Rolle und Markenproportion dienten als Referenz.

### Geschlossen – Reflowregression im bestehenden Website-Mehrmenue

Die erste Browsermatrix fand bei 200 Prozent einen Ueberlauf des bestehenden
`Nachrichtenarchiv`-Ziels (`scrollWidth 298`, `clientWidth 274`). Die minimale
lokale Wrap-Regel schliesst dies; der vollstaendige erneute Browserlauf meldet
0 Fail.

## Annahmen und offene Fragen

- Der Product-Owner-Screenshot ist eine Kompositionsreferenz, keine genaue
  CSS-Pixelvorgabe. Deshalb wurden keine nicht freigegebenen Web-, Menue- oder
  Sprachaktionen ergaenzt.
- Die sichtbare Produktabnahme und eine unabhaengige Screenshot-/A11y-/Request-
  QA stehen noch aus und werden durch diesen Handoff nicht ersetzt.

## Restrisiken

- Die echte Android-WebView-/Safe-Area-Wirkung bleibt ausserhalb des Slices.
- Die lokale Node-Version verhindert nur den zusammenfassenden
  Toolchainwrapper; ein Runtimewechsel oder Download ist nicht autorisiert.
- Die vollstaendige Funktionsparitaet des aktuellen Legacyheaders bleibt
  bewusst ausserhalb von WRN-G3-009.

## Empfohlener naechster Schritt

Nur Empfehlung; keine automatische Ausfuehrung.

Ein unabhaengiger `visual_accessibility_reviewer` prueft den unveraenderten
Kandidaten `973c129` nach der G3-009-Abnahmematrix. Er erstellt die
beschrifteten visuellen Belege, prueft A11y, Konsole, Requests, Storage,
Touchziele, Reflow und Diff. Erst danach entscheidet der Product Owner sichtbar
ueber die Abnahme.

## WRN-AGENT-STATUS

- Task: WRN-G3-009 Marken- und Headerparitaetskorrektur
- Status: YELLOW – Produktkandidat GREEN, lokaler Gesamtwrapper durch
  festgestellte Node-Toolchainabweichung nicht vollstaendig ausfuehrbar
- Quellstand: Start `fc6c106`; Produktkandidat `973c129`; Legacy-App
  `2216ff3`/Runtime `968c320`; Legacy-Website `9a59b17`, alle Legacyquellen
  unveraendert read-only
- Erledigt: Assetrolle, semantische Chrome-Flaechen, unverzerrte Markenwirkung,
  Websitekompaktheit, Reflowschutz und Negativtests
- Tests: alle lokal ausfuehrbaren statischen, Unit-, Boundary-, Build- und
  Browserpruefungen GREEN; Playwright 51 PASS/117 erwartete Skips/0 Fail
- Offen: unabhaengige technische und visuelle QA sowie sichtbare
  Product-Owner-Abnahme
- Handoff: `docs/handoffs/WRN-G3-009-frontend-brand.md`
- Naechster Schritt: unveraenderter Kandidat an
  `visual_accessibility_reviewer`
- END-CHECK: :)
