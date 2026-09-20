# WRN-G3-015 – visuelle Marken- und Groessenkorrektur

Stand: 29. August 2026. Durch den Product Owner mit
`G3-015 AENDERUNG:` beauftragt. Ausgang `1dc087f`; Korrektur `9136cec` und
unabhaengiger Visual-/A11y-Recheck `d05150b` GREEN. Neue lokale PO-Sichtabnahme
offen; die vorherige lokale Sichtabnahme wurde nicht erteilt.

## PO-Befund

- Buttons wirken zu gross.
- Das Website-Logo ist zu klein.
- Die farbliche Identitaet der akzeptierten App ist in der Website zu schwach.

## Gebundene Korrektur

1. Website-Logo responsiv deutlich vergroessern: Smartphone ungefaehr
   72–94 px, Tablet 80–94 px, Desktop 56–64 px. Kein Abschneiden, keine
   Kollision mit Sprach-/Themeauswahl oder Navigation.
2. Bedienflaechen visuell kompakter gewichten. Das barrierefreie Mindestziel
   44 x 44 CSS-Pixel bleibt unveraendert. Weniger horizontales Padding,
   kompaktere Abstaende und Akzentflaechen nur bei aktiven/primaeren Aktionen.
3. Website-eigenes, rein dekoratives und tokenbasiertes Cyan/Pink-Markenfeld
   fuer Dark, Light und Pink. Contrast bleibt ohne dekoratives Muster.
4. Markenassets, Shared Tokens und Mobile/App bleiben read-only. Das alte
   redaktionelle Hintergrundbild wird nicht als Headerbild reaktiviert.
5. Funktionen, Texte, Outcome-A-Vertrag, Offline-/Update-/Entfernungssemantik
   und neun Sprachen bleiben unveraendert.

## Eigentum

Ein Frontend-Brand-Owner schreibt ausschliesslich:

- `apps/website/src/styles.css`
- `tests/e2e/website-shell-ui-visual.spec.ts`
- neue Evidence unter
  `docs/evidence/WRN-G3-015/visual-brand-correction/**`
- `docs/handoffs/WRN-G3-015-visual-brand-correction.md`

Chief schreibt allein Governance. Keine Kinder. App/Mobile, Shared Tokens,
Assets, Backend, Worker, Hosting, Live und Release sind read-only/OUT.

## Abnahme- und Testgate

- test-first: messbare Logo- und Kontrollregeln vor Produkt-CSS;
- mindestens 44 x 44 px Touchziele, kein horizontaler Overflow;
- Dark, Light, Pink, Contrast; Smartphone, Tablet und Desktop;
- 200-Prozent-Reflow und alle neun UI-Sprachen;
- Fokus, Tastatur, Dialogtrap, Escape, Fokusrueckgabe und Axe unveraendert;
- frischer Website-Typecheck, relevante Unit-/Boundarytests und Build;
- neue eindeutig benannte Screenshots, danach unabhaengige visuelle/A11y-QA;
- erst neue PO-Sichtabnahme schliesst G3-015.

Keine Hosting-, Testadress-, Live-, Mobile-, Android-, Google-Play-,
Signierungs-, Upload-, Deployment- oder Releasefreigabe.

END-CHECK: :)
