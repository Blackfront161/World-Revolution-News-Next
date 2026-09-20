# WRN-G3-015 – visuelle Kontroll- und Navigationskorrektur V3

Stand: 29. August 2026. Durch die zweite konkrete PO-Aenderungsmeldung
innerhalb der offenen G3-015-Sichtabnahme beauftragt. Ausgang ist der
Korrekturkandidat `9136cec`, Review `d05150b`, Governance `58d8ee4`.

## Designreferenz

Die vom Product Owner bereitgestellte signierte App ist als gebundene,
ausschliesslich lesende Designreferenz unter
`docs/evidence/WRN-G3-015/AAB-DESIGN-BASELINE.md` inventarisiert. Ihre
Cyan-/Magenta-Sprache, kompakte Kontrollen, Headerwirkung und transparente
aktive Navigation werden professionell in die neue semantische Website-
Architektur uebersetzt. Alter Laufzeitcode, historische CSS-Kaskaden, das AAB
selbst und sein Hintergrundbild werden in diesem Auftrag nicht uebernommen.

## Verbindliche visuelle Regeln

1. Normale Website-Aktionsbuttons sind etwas kompakter und magenta/rot
   umrandet. Aktive oder eindeutig primaere Aktionsbuttons duerfen
   magenta/rot gefuellt sein. Das reale Touchziel bleibt mindestens 44 x 44 px.
2. Die Website-Sprachauswahl zeigt fuer die neun Optionen nur die Codes
   `EN`, `DE`, `ES`, `FR`, `IT`, `PT`, `RU`, `EL`, `TR`. Werte, Reihenfolge,
   ARIA-Bezeichnung und Persistenz bleiben unveraendert. Mobile behaelt die
   vollstaendigen nativen Sprachbezeichnungen.
3. Sprach- und Themeauswahl sind kompakt und cyan umrandet. Theme-Namen
   bleiben vollstaendig und verstaendlich; `Dunkel`/`Dark` wird nicht zu einem
   unbekannten Code gekuerzt.
4. Hauptnavigation und Mehr-Menue verwenden magenta/rote Schrift/Akzente.
   Die aktive Seite ist die ausdrueckliche Ausnahme von der Fuellregel:
   keine runde gefuellte Pille, sondern transparente Flaeche mit klarer
   magenta/roter Unterstreichung oder Innenleiste und erhoehtem Gewicht.
5. Die linke Akzentleiste der Artikel-Originalquellenseite `.reader-source`
   erhaelt in normalen Themes einen Verlauf von Cyan nach Magenta/Rot.
   Contrast verwendet eine eindeutige einfarbige, nicht dekorative Leiste.
6. Keine Funktions-, Text-, Offline-, Daten-, Backend-, Worker-, App-,
   Mobile-, Shared-Token- oder Assetaenderung ausser den Website-Sprachcodes.

## Eigentum und Dateiscope

Ein Frontend-Brand-Owner schreibt test-first ausschliesslich:

- `apps/website/src/App.tsx`
- `apps/website/src/styles.css`
- `apps/website/src/App.test.tsx`
- `tests/e2e/foundation.spec.ts`
- `tests/e2e/website-shell-ui-visual.spec.ts`
- neue Evidence unter
  `docs/evidence/WRN-G3-015/visual-brand-correction-v3/**`
- `docs/handoffs/WRN-G3-015-visual-brand-correction-v3.md`

Chief schreibt allein Governance. Keine Kinder. Alle anderen Produkt-, Test-,
App-, Paket-, Asset- und externen Pfade sind read-only/OUT.

## Test- und Abnahmegate

- RED zuerst fuer exakt neun sichtbare Website-Codes bei unveraenderten Werten;
- Mobile-Sprachlabels in Foundationtests unveraendert vollstaendig;
- alle sichtbaren Navigationen, Actions und Selects mindestens 44 x 44 px;
- berechnete Rollen: normale Action magenta Outline, aktive Action magenta
  Fill, aktive Navigation transparent/nicht pillenfoermig, Selects cyan Border;
- Reader-Quellenleiste Cyan-nach-Magenta; Contrast ohne dekorativen Verlauf;
- neun Sprachen, sieben Themes funktionsseitig; Visualmatrix mindestens Dark,
  Light, Pink und Contrast auf Smartphone, Tablet, Desktop und 200-%-Reflow;
- kein horizontaler Overflow, Fokus/Keyboard/Dialog/Axe unveraendert;
- Websiteunits, Foundation-Scope, Typecheck, Boundaries und Build frisch;
- danach unabhaengige visuelle/A11y-Pruefung und neue PO-Sichtabnahme.

Keine Hosting-, Live-, Mobile-, Android-, Google-Play-, Signierungs-, Upload-,
Deployment- oder Releasefreigabe.

END-CHECK: :)
