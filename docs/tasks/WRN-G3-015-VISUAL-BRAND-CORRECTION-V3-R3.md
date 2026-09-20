# WRN-G3-015 – visuelle Brandkorrektur V3-R3

Stand: 30. August 2026. Der Product Owner hat die V3-R2-Sichtprobe
praezisiert: Nicht die dunkle Buttonflaeche, sondern die Schrift der Buttons
soll im Pink-Theme violett sein. Die Korrektur bleibt rein visuell und trifft
keine Daten-, Backend-, Architektur-, Kosten-, Hosting- oder
Releaseentscheidung.

## Verbindliches Ziel

- Inaktive Aktionsbuttons verwenden im Pink-Theme die violette AAB-Farbe
  `#9b82ff` fuer ihre Beschriftung.
- Ihre dunkle Kontrollflaeche `#240b19` und ihr Magenta-Rot-Rand `#ff5a78`
  bleiben unveraendert.
- Aktiv beziehungsweise primaer Magenta-Rot gefuellte Buttons behalten ihre
  dunkle Kontrastschrift; violette Schrift auf der Magenta-Rot-Flaeche wird
  wegen unzureichender Lesbarkeit nicht eingefuehrt.
- Navigation bleibt gemaess der frueheren PO-Vorgabe Magenta-Rot; Sprache und
  Theme bleiben eigenstaendige Cyan-Systemkontrollen mit kontrastreicher
  Beschriftung.
- Panels, Karten, Hintergrund, Logo, Wordmark, Glow, Light, Dark und Contrast
  bleiben unveraendert.

## Enger Schreibscope

Der Chief aendert ausschliesslich:

- `apps/website/src/styles.css`
- `tests/e2e/website-shell-ui-visual.spec.ts`
- neue Evidence unter
  `docs/evidence/WRN-G3-015/visual-brand-correction-v3-r3/**`
- `docs/handoffs/WRN-G3-015-visual-brand-correction-v3-r3.md`

Shared Tokens, Mobile, Assets, Backend, Worker, AAB, Altprojekte, Hosting,
Live, Android und Release bleiben read-only/OUT.

## Abnahme

- Berechnete Schriftfarbe mindestens eines inaktiven Website-Shell-Buttons
  und zweier inaktiver Local-Content-Buttons im Pink-Theme:
  `rgb(155, 130, 255)`.
- Berechnete Buttonflaeche bleibt `rgb(36, 11, 25)`; Rand bleibt
  `rgb(255, 90, 120)`.
- Primaer/aktiv gefuellte Aktion behaelt die vorhandene kontrastreiche
  Beschriftung.
- Gezielte Phone-/Desktopbilder, 200-%-Reflow, Axe/Fokus/Overflow sowie
  Website-Units, Typecheck, Lint/Format, Build, Tooltests, Boundaries und
  `git diff --check`.
- Danach lokale PO-Sichtabnahme; eine erneute Vollmatrix ist nur bei einem
  unerwarteten Finding erforderlich.

Kein PO-, Hosting-, Live-, Android-, Signierungs-, Upload-, Deployment- oder
Release-GREEN folgt aus der technischen Korrektur.

END-CHECK: :)
