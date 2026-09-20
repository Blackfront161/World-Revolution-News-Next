# Handoff – WRN-G3-013 M-001 Reflowkorrektur

- Agent: Frontend-Brand-Implementierung (einzige PO-067-Schreibinstanz)
- Task-ID: WRN-G3-013 / `WRN-G3-013-M-001`
- Ergebnis: bestanden / GREEN-Produkt- und Testkandidat
- Ausgangsgate: `af0138f`, Bindung: `c6f01f0`
- Kandidat: `b21b02e` (`fix(g3-013): preserve language labels at reflow`)

## Kurzfazit

M-001 ist im Kandidaten geschlossen: Bei 390 x 844 und 200-%-Reflow zeigen
beide geschlossenen nativen Sprachselects für alle neun gebundenen IDs den
vollständigen unveränderten Optionsnamen samt Code. Insbesondere zeigen die
ursprünglichen Reproduktionen Mobile/EL `Ελληνικά (EL)` und Website/PT
`Português (PT)` ohne Ellipse oder Clipping.

Die native Optionsliste und die lokalisierten zugänglichen Namen bleiben
unverändert. Ein natives Select hat keinen portablen Vertrag für eine andere
geschlossene als offene Beschriftung; die Korrektur reserviert deshalb im
engen Reflow eine vollständige Headerzeile für den bestehenden Select. Kein
Custom-Popup, keine transparente Beschriftung und keine geänderten Optionen
sind eingeführt worden.

Die zusätzliche, durch diese Zeile sichtbar gewordene Mobile-Überdeckung ist
im selben ausdrücklichen PO-067-Reflowscope geschlossen: Nur wenn die
Wide-Language-Bedingung aktiv ist, verwendet die Mobile-Shell den bestehenden
reader-sicheren Dokumentfluss. Header, Main, vollständige Navigation und
Footer können dadurch nicht einander überdecken. Normale Mobile-Viewports,
Website außerhalb des Wide-Reflowpfads und Navigationstexte/-ziele/-reihenfolge
bleiben unverändert.

## Verwendete Quellen

- `AGENTS.md`, `docs/01-SOURCE-OF-TRUTH.md`, `docs/04-QUALITY-RULES.md`
- `docs/tasks/WRN-G3-013-HEADER-UI-LANGUAGE-PREFERENCE.md`
- Gate `af0138f`, Bindung `c6f01f0`, Kandidat `56057dd`
- unabhängiger YELLOW-Review `3125cd5` einschließlich der beiden Reflow-PNGs
  und `docs/handoffs/WRN-G3-013-visual-accessibility-review.md`

## Geaenderte Dateien

Produkt-/Testkandidat `b21b02e`:

- `apps/mobile/src/App.tsx`, `apps/mobile/src/styles.css`
- `apps/website/src/App.tsx`, `apps/website/src/styles.css`
- `tests/e2e/foundation.spec.ts`

Die getrennten Clients behalten ihre getrennten Projektionen. Es wurden keine
Kataloge, Storageadapter/-keys, Content-IDs/-Hashes/-Revisionen,
`originalLanguage`, Fixtures, Contracts, Publisher, statischen Landingpages,
Rootkonfiguration oder externen Systeme geändert.

Neue commitgebundene Evidenz:

- `docs/evidence/WRN-G3-013/M001-correction/b21b02e-runtime-matrix-2026-08-27.json`
- 18 Sprach-Reflow-PNGs und ein Mobile-Reader/Dialog-PNG mit Präfix `b21b02e_`

`.codex-remote-attachments/` blieb unberührt.

## Tests und Belege

- Toolchain: exakt Node `24.19.0`, pnpm `11.19.0` GREEN.
- Format und Lint GREEN; 19 Boundarytests GREEN.
- Alle sieben im Workspace vorhandenen `tsconfig.json`-Typechecks GREEN.
- 148 Vitest-Unit-/Contract-/Komponententests GREEN; 8 Website-Static-Tests
  GREEN.
- Mobile- und Website-Build GREEN.
- Voller Browserlauf: **65 PASS, 159 erwartete Skips, 0 Fehler**.
- Gezielte Reflow-Evidence: 3 PASS, 11 erwartete Skips. Sie prüft beide
  Clients und alle IDs `en,de,es,fr,it,pt,ru,el,tr` bei 390 x 844/200 %:
  unveränderte neun Namen-plus-Code-Optionen, geschlossene vollständige
  Beschriftung, Fokus, 44-Pixel-Ziel, Axe 0 und horizontaler Overflow 0.
- Der Mobile-Reflowtest prüft zusätzlich Saved als Dokumentfluss mit nach dem
  Main erreichbarer Navigation, Keyboardfokus und 44-Pixel-Zielen; ein weiterer
  Test belegt Home → Discover → Reader → Source-Dialog/Escape mit Fokusrückgabe.

## Feststellungen nach Prioritaet

- Blocker: 0
- High: 0
- Medium: 0
- Low: 0

## Annahmen und offene Fragen

Die Lösung beruht auf der standardisierten nativen Select-Semantik von Chrome:
Optionstexte bleiben vollständig `Eigenname (CODE)`; die geschlossene
Darstellung erhält im engen Reflow genug physische Breite statt eine abweichende
Beschriftung. Die vollständige unabhängige Re-QA bleibt gemäß Gate zwingend.

## Restrisiken

Keine neue Produktions-, Cache-, Service-Worker-, Provider-, Storage- oder
Releasewirkung. G3-014 und alle gesperrten Bereiche bleiben unverändert.
Technisches GREEN ersetzt keine sichtbare Product-Owner-Abnahme.

## Empfohlener naechster Schritt

Den unveränderten Kandidaten `b21b02e` ausschließlich durch einen frischen,
unabhängigen `visual_accessibility_reviewer` mit der vollständigen
G3-013-Matrix re-QA prüfen lassen. Keine weitere Implementierung starten.

## WRN-AGENT-STATUS

- Task: WRN-G3-013 M-001 responsive native Sprachselect-Reflowkorrektur
- Status: GREEN
- Quellstand: Gate `af0138f`, Bindung `c6f01f0`, Kandidat `b21b02e`
- Erledigt: beide Reflowprojektionen, enger Mobile-Dokumentfluss, gezielte
  Komponenten-/Browserregressionen und commitgebundene Nachherbelege
- Tests: Node 24.19/pnpm 11.19, Format, Lint, 19 Boundaries, 7 vorhandene
  Typechecks, 148 Vitest- plus 8 Static-Tests, beide Builds, 65 Browser-PASS/
  159 erwartete Skips/0 Fehler
- Offen: keine Produktfindings; vollständige unabhängige Re-QA und sichtbare
  Product-Owner-Abnahme ausstehend
- Handoff: `docs/handoffs/WRN-G3-013-M001-correction.md`
- Naechster Schritt: frische unabhängige Visual-/Accessibility-Re-QA
- END-CHECK: :)
