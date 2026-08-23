# WRN-G2-003 – Font- und Marken-Neuschaffungsbrief

Stand: 23. August 2026

## Entscheidung und Beweisgrenze

- `Qood.ttf` wird nicht uebernommen. In den verbindlichen App-/Website-
  Runtimes existiert keine CSS-, JavaScript- oder HTML-Referenz darauf.
- Ungeklaerte Legacylogos/-header/-masken werden nicht kopiert, nachgezeichnet,
  konvertiert oder als neue Masterdateien ausgegeben.
- Vorhandene G1-Screenshots duerfen fuer Wirkung, Proportion, Platzbedarf und
  Paritaetsvergleich betrachtet werden; sie sind keine Importquelle.
- Noch wurde keine Schrift heruntergeladen, kein Markenasset erzeugt und keine
  Produktdatei angelegt.

## Typografische Baseline

Die Legacyruntime verwendet keine eingebettete Qood-Schrift. Ihr
`typography.css` definiert vier Rollen mit lokalen Systemfallbacks:

| Rolle | Legacyrichtung | Ziel fuer spaeteren Vergleich |
|---|---|---|
| UI | Aptos/Segoe UI/Roboto/Noto/System | kompakt, neutral, bei kleinen Groessen klar |
| Display | Aptos/Segoe UI Variable Display/Roboto Condensed/Arial Narrow/Noto Sans Display | kraeftige, leicht kondensierte Ueberschriften |
| Reading | Atkinson Hyperlegible/Aptos/Segoe UI/Roboto/Noto/System | lange Artikel, deutliche Zeichen, 200-Prozent-Reflow |
| Mono | Cascadia/IBM Plex/Roboto Mono/Consolas/System | Metadaten/Diagnostik, sparsam |

## Kosten- und datenschutzoptimierte Fontstrategie

Foundation und erste neutrale Shell duerfen ausschliesslich Systemfallbacks
verwenden. Vor sichtbarer Markenparitaet wird eine lokale, trackingfreie
A/B-Matrix mit hoechstens drei offenen Familien erstellt:

| Rolle | Kandidat | Begruendung | Lizenzbeleg |
|---|---|---|---|
| UI | Inter | fuer Bildschirmoberflaechen entwickelt; bestehende Legacy-CSS nennt Inter bereits, ohne es einzubetten | SIL OFL 1.1 im offiziellen Upstream |
| Display | Barlow Condensed | leicht gerundete, kontrastarme Groteskfamilie mit kondensierten Schnitten; passt zur beobachteten kompakten Newswirkung | SIL OFL 1.1 im offiziellen Upstream |
| Reading | Atkinson Hyperlegible Next | fuer bessere Zeichenerkennung/Lesbarkeit entwickelt; erweiterte Zeichen und sechs Gewichte | SIL OFL 1.1 im offiziellen Upstream |

Offizielle read-only Quellen:

- <https://github.com/rsms/inter>
- <https://github.com/jpt/barlow>
- <https://github.com/googlefonts/atkinson-hyperlegible-next>

Die Tabelle ist eine Shortlist, keine Download- oder Produktfreigabe. Nach
`GO-IMPLEMENTATION` braucht jede gewaehlte Datei: gepinnten Upstreamstand,
Original-Lizenzdatei, SHA-256, WOFF2-Subsetbeleg, Third-Party-Notice und
separate Dependency-/Downloadfreigabe. Externe Font-CDNs sind ausgeschlossen;
Auslieferung erfolgt lokal ohne Tracking oder Laufzeitkosten.

## Originaler Marken-Recreation-Brief

### Zu bewahrende Wirkung

- gemeinsamer Absender `SOLINARIDAO / WORLD REVOLUTION NEWS`;
- dunkle, redaktionelle Nachrichtenwirkung mit Cyan-/Magenta-Akzenten;
- kompakte Erkennbarkeit im mobilen Header und ruhige horizontale Variante
  fuer Tablet/Desktop;
- klare Schwarzweiss-/Einfarbversion fuer Accessibility, Druck und Fehlerfall;
- keine Abhaengigkeit von politischen Fremdsymbolen, Stockelementen oder
  ungeprueften Drittassets.

### Neu zu erstellende Mastervarianten

1. originale kombinierte Bild-/Wortmarke als sauberes SVG;
2. reduzierte quadratische App-/Favicon-Marke;
3. horizontale Headerwortmarke fuer Website/Desktop;
4. helle, dunkle und einfarbige Version aus demselben Master;
5. Android-Adaptive-Icon mit getrenntem Vorder-/Hintergrund;
6. reproduzierbar generierte PNG/WebP-Ableitungen, niemals manuell als
   unabhaengige Master gepflegt.

### Verbindliche visuelle Matrix

| Oberflaeche | Viewport | Zustand |
|---|---:|---|
| Mobile-App | 390 × 844 | Dark/Light, normal und 200 Prozent Schrift |
| Mobile-App | 600 × 960 | Tablet-Hochformat |
| Website | 390 × 844 | Dark/Light und sehr grosse Schrift |
| Website | 800 × 1280 | Tablet |
| Website | 1440 × 900 | Desktopfeed und statische Landingpage |
| App-/Favicon | 16, 32, 48, 192, 512 und 1024 px | hell/dunkel, Masken-/Safe-Zone-Pruefung |

### Abnahmebedingungen

- Product Owner sieht Altbaseline und mindestens zwei neue Originalvarianten
  nebeneinander und waehlt ausdruecklich eine aus.
- Kein Text/Detail wird bei 200-Prozent-Reflow abgeschnitten; Touchziele und
  Headeraktionen bleiben mindestens 44 × 44 CSS-Pixel.
- Kontrast, Fokus, Screenreader-Name, Motion-reduced und High-Contrast werden
  geprueft; die Wortmarke darf nicht der einzige zugaengliche Name sein.
- Neue Masterdateien dokumentieren Ersteller/Tool, Datum, Prompt/Brief,
  verwendete Quellen, Bearbeitung, Lizenz, SHA-256 und Exportpipeline.
- Kein Asset gelangt vor Product-Owner-Visualfreigabe oder ohne Rechtebeleg in
  einen Releasekandidaten.

## G3-Auswirkung

WRN-G3-001 darf mit neutralen selbst erzeugten Platzhaltern und Systemfonts
starten, sobald alle uebrigen G3-Gates erfuellt und `GO-IMPLEMENTATION`
ausdruecklich erteilt sind. Die Marken-Neuschaffung ist ein eigener spaeterer
UI-Task vor sichtbarer Paritaetsabnahme; sie blockiert nicht die leere
Foundation, wohl aber jeden behaupteten Marken-/Release-Paritaetsstand.
