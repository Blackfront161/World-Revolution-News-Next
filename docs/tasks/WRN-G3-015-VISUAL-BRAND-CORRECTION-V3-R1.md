# WRN-G3-015 – visuelle Brandkorrektur V3-R1

Stand: 30. August 2026. Der unabhaengige sichtbare Review des Kandidaten
`d3b8398` meldete zwei Medium-Abnahmeluecken. Dieser enge Folgeauftrag liegt
vollstaendig innerhalb der bereits gebundenen V3-Richtung und trifft keine
neue Produkt-, Daten-, Architektur-, Kosten- oder Releaseentscheidung.

## Zu schliessende Findings

1. `M-001`: Im Pink-Theme loesen die gemeinsamen Theme-Tokens die funktionalen
   Rollen sichtbar als Pink/Violett auf. Website-Systemkontrollen muessen auch
   dort erkennbar Cyan und Aktions-/Navigationskontrollen Magenta/Rot bleiben.
   Logo, Hintergrundflaeche, Wordmark und sonstige Atmosphaere duerfen weiterhin
   mit dem Pink-Theme interagieren. Shared Tokens bleiben unveraendert.
2. `M-002`: Die 200-%-Reflowmatrix prueft bisher nur Dark und Light. Sie muss
   Dark, Light, Pink und Contrast fuer alle neun Sprachen und beide
   Mount-Reihenfolgen abdecken.

## Enger Schreibscope

Ein Frontend-Brand-Owner schreibt ausschliesslich:

- `apps/website/src/styles.css`
- `tests/e2e/website-shell-ui-visual.spec.ts`
- neue Evidence unter
  `docs/evidence/WRN-G3-015/visual-brand-correction-v3-r1/**`
- `docs/handoffs/WRN-G3-015-visual-brand-correction-v3-r1.md`

Alle anderen Produkt-, Test-, Token-, Mobile-, Asset-, Backend-, Worker-,
AAB-, Alt-, Hosting- und Livepfade sind read-only/OUT. Keine Kinder.

## Verbindliche Umsetzung und Tests

- Website-lokale funktionale Farbvariablen duerfen fuer Pink stabil Cyan und
  Magenta/Rot abbilden; Light/Dark behalten ihre kontrastgeprueften Rollen,
  Contrast seine eindeutige Weiss-/Gelb-Ersatzsprache.
- Selects, normale/aktive Actions, Navigation und Readerleiste verwenden diese
  funktionalen Website-Rollen. Markenwordmark/-glow bleibt theme-reaktiv.
- Tests muessen die tatsaechlich sichtbaren Pink-Farben gegen explizite
  erwartete Rollen pruefen, nicht nur gegen semantisch benannte Shared Tokens.
- Reflow umfasst `dark`, `light`, `pink`, `contrast`: neun Sprachen mal vier
  Themes mal zwei Mount-Reihenfolgen = 72 Reflowfaelle.
- Alle Ziele bleiben mindestens 44 x 44 px; Axe, Fokus, Dialog, Overflow,
  Sprachcodes und Themefunktion bleiben unveraendert.
- Frische exakte Node-24.19-Visualmatrix, gezielte Units/Typecheck/Lint,
  19 Boundaries und Build; danach frische unabhaengige Visual-/A11y-Re-QA.

Keine PO-, Hosting-, Live-, Android-, Signierungs-, Upload-, Deployment- oder
Releasefreigabe.

END-CHECK: :)
