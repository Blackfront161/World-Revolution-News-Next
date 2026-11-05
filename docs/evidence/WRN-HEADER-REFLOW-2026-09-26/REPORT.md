# Header- und Großtext-Korrektur · 26.09.2026

Produktstand: Hauptcheckout `e1444b38`, separater öffentlicher Repo-Checkout
`cc6721c`; beide enthalten dieselben vier geänderten Produkt-/Testdateien.
Die Änderung ist lokal committed, weder gepusht noch live veröffentlicht.

## Ergebnis

- Die neue App- und Website-Kopfzeile bleibt beim kurzen Scrollen höhenstabil.
  Die alte Live-Seite `solinaridao.com` verwendet weiterhin eine animierte
  Sticky-Kopfzeile; sie wurde nicht verändert.
- Bei 390 px Breite und 200 % Schriftgröße liegen Menü und Sprach-/Suchwerkzeuge
  in der ersten, die Marke in der zweiten Zeile. Titel und Website-Link behalten
  mindestens 44 px Bedienfläche ohne übergroßen Mehrzeilenabstand.
- Die Bibliotheksüberschrift und ihre Listen brechen bei großer Schrift ohne
  horizontalen Überlauf um. Die normale Schriftansicht bleibt kompakt.

## Reproduzierbare Prüfung

- Mobile- und Website-Produktionsbuild: PASS; neun Website-Artikellandungen
  integriert und JS-Chunk-Grenzen eingehalten.
- Workspace-Typprüfung: PASS. Prettier für vier geänderte Dateien: PASS.
  ESLint für den E2E-Test: PASS. Import-/Fixture-/Release-Grenzen: 25/25 PASS.
- `header-scroll-stability.spec.ts`, Mobile und Website: 2 PASS, 2 projektspezifisch
  übersprungen. Der geprüfte 40-px-Scroll verändert die Headerhöhe nicht.
- Betroffene Foundation-Matrix auf Mobile/Website bei normaler und 200-%-Schrift:
  59 PASS, 96 projektspezifisch übersprungen; ein 0,1875-px-Rundungsfall
  im Scroll-Viewport-Orakel wurde auf 1 px Toleranz korrigiert und gezielt
  erneut mit PASS geprüft. Die Website-Großtextnavigation einschließlich
  Bibliothek, Hilfe und Solidarität bestand.
- Unabhängiger Read-only-Abschlussreview: PASS, keine offenen Findings.

Die vier PNGs in diesem Ordner sind die repräsentativen lokalen Mobile- und
Website-Sichtproben. Ihre SHA-256-Werte und Bytezahlen stehen im `manifest.json`.
Laufende Vorschauen: Mobile `http://127.0.0.1:43330/?theme=violet#home`,
Website `http://127.0.0.1:43331/?theme=violet#home`.

## Release-Grenze

Das frühere unsignierte AAB 2.2.0/27 aus `c8c0450` enthält diese neue CSS-Version
noch nicht. Vor Play-internem Test sind ein neuer exakt gebundener Android-Build,
der vollständige RC-Abgleich und die authentisierte Hosting-/Widerrufsprobe nötig.
Produktionssignatur, Push und Live-Deployment wurden nicht ausgeführt.
