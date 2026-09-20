# WRN-G3-015 – visuelle Brandkorrektur V3-R4

Stand: 30. August 2026. Der Product Owner praezisiert die V3-R3-Sichtprobe:
Aktionsbuttons sollen im Pink-Theme nur beim Anklicken beziehungsweise in
einem semantisch ausgewaehlten `aria-pressed`-Zustand violett ausgefuellt
sein. Die Korrektur bleibt rein visuell.

## Verbindliches Ziel

- Inaktive Aktionsbuttons behalten im Pink-Theme die dunkle Flaeche `#240b19`
  und die violette Schrift `#9b82ff`.
- Nur der echte `:active`-Klickzustand und ein semantisch ausgewaehlter
  `aria-pressed='true'`-Zustand erhalten die violette Fuellung `#9b82ff` mit
  dunkler Kontrastschrift `#240012`.
- Der Magenta-Rot-Rand `#ff5a78` bleibt in beiden Zustaenden sichtbar.
- Aktionsbuttons sind nicht allein aufgrund einer Primaerrolle dauerhaft
  gefuellt. Links und Navigation bleiben von dieser Buttonregel getrennt.
- Sprache/Theme bleiben dunkel mit Cyan-Rand. Navigation bleibt Magenta-Rot
  und transparent. Panels, Marke und andere Themes bleiben unveraendert.

## Enger Schreibscope

Der Chief aendert ausschliesslich:

- `apps/website/src/styles.css`
- `tests/e2e/website-shell-ui-visual.spec.ts`
- neue Evidence unter
  `docs/evidence/WRN-G3-015/visual-brand-correction-v3-r4/**`
- `docs/handoffs/WRN-G3-015-visual-brand-correction-v3-r4.md`

Shared Tokens, Mobile, Assets, Backend, Worker, AAB, Altprojekte, Hosting,
Live, Android und Release bleiben read-only/OUT.

## Abnahme

- Mindestens drei sichtbare inaktive Pink-Aktionsbuttons besitzen berechnet
  `rgb(36, 11, 25)` als Flaeche, `rgb(155, 130, 255)` als Schrift und
  `rgb(255, 90, 120)` als Rand.
- Beim echten Pointer-Down besitzt derselbe Button `rgb(155, 130, 255)` als
  Flaeche und `rgb(36, 0, 18)` als Schrift; nach Pointer-Up ist er wieder
  dunkel. Ein `aria-pressed='true'`-Button bleibt waehrend seiner Auswahl
  violett gefuellt.
- Sprache und Theme behalten die dunkle Flaeche `rgb(36, 11, 25)` und den
  Cyan-Rand.
- Phone, Desktop, 200-%-Reflow, Axe, Fokus, Dialog, Overflow, 44-Pixel-Ziele,
  Website-Units, Typecheck, Lint/Format, Build, Tooltests, Boundaries und
  `git diff --check`.
- Danach lokale PO-Sichtabnahme. Keine breite Wiederholung unveraenderter
  Funktionsmatrizen ohne neues Finding.

Kein PO-, Hosting-, Live-, Android-, Signierungs-, Upload-, Deployment- oder
Release-GREEN folgt aus der technischen Korrektur.

END-CHECK: :)
