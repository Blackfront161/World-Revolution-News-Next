# WRN-G3-015 – visuelle Brandkorrektur V3-R2

Stand: 30. August 2026. Der Product Owner hat V3-R1 nicht sichtbar akzeptiert:
Die Button-/Selectflaechen im Pink-Theme wirken violett. Der read-only
AAB-Abgleich in `docs/evidence/WRN-G3-015/AAB-CONTROL-SURFACE-SCAN-V3-R2.md`
bestaetigt die Abweichung. Diese Korrektur trifft keine neue Daten-, Backend-,
Architektur-, Kosten-, Hosting- oder Releaseentscheidung.

## Verbindliches Ziel

- Inaktive Sprache-/Theme- und Aktionskontrollen verwenden im Pink-Theme die
  dunkle AAB-Kontrollflaeche `#240b19`, nicht das violette Raised-Surface
  `#3a1739`.
- Sprache/Theme behalten die sichtbare Cyan-Umrandung `#54e5f2`.
- Aktionen und Navigation behalten Magenta-Rot `#ff5a78`; aktive/primäre
  Aktionen bleiben Magenta-Rot gefuellt.
- Panels, Karten, Websitehintergrund, Logo, Wordmark und Glow bleiben
  theme-reaktiv und unveraendert.
- Light, Dark und Contrast bleiben visuell und funktional unveraendert.

## Enger Schreibscope

Ein alleiniger Schreiber aendert ausschliesslich:

- `apps/website/src/styles.css`
- `tests/e2e/website-shell-ui-visual.spec.ts`
- neue Evidence unter
  `docs/evidence/WRN-G3-015/visual-brand-correction-v3-r2/**`
- `docs/handoffs/WRN-G3-015-visual-brand-correction-v3-r2.md`

Alle Shared Tokens, Mobile-, Asset-, Backend-, Worker-, AAB-, Alt-, Hosting-,
Live-, Android- und Releasepfade bleiben read-only/OUT.

## Abnahme und Tests

- Test-first sichtbare RGB-Pruefung: inaktive Pink-Selects und mindestens eine
  inaktive Pink-Aktion haben `rgb(36, 11, 25)` als berechnete Hintergrundfarbe.
- Aktive/primäre Aktion bleibt `rgb(255, 90, 120)`; Cyan-/Magenta-Raender
  bleiben unveraendert.
- Frische Pink-Normal-/Dialog-/Readerbilder fuer Phone und Desktop sowie ein
  200-%-Reflowbeleg; keine gesamte 316-Bild-Wiederholung erforderlich, wenn die
  unveraenderten Vier-Theme-/72-Fall-Vertraege durch gezielte Regression und
  bestehende V4-R1-Evidence gebunden bleiben.
- Website-Units, Typecheck, Lint/Format, Build, 19 Boundaries, gezielte
  Playwright-Visual-/A11y-/Overflow-/Fokuspruefung und `git diff --check`.
- Danach frische unabhaengige read-only Visual-/A11y-Re-QA nur fuer den R2-Diff.

Keine PO-, Hosting-, Live-, Android-, Signierungs-, Upload-, Deployment- oder
Releasefreigabe folgt aus Implementierungs-GREEN.

END-CHECK: :)
