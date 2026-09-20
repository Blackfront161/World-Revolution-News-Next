# Handoff – WRN-G3-021 P3-P0-T Visual/A11y

## Ergebnis

Read-only-Precheck auf `46b20d40afbdc629ad95dd2bb658dc4813ae4079` beendet:
**YELLOW**. P2 bleibt technisch GREEN; P3 darf noch nicht schreiben. Der
vollständige Befund steht in
`docs/evidence/WRN-G3-021/P3-P0-T-VISUAL-A11Y-PRECHECK.md`.

## Drei zu bindende Medium-Punkte

1. DOM-Audio braucht einen injizierbaren Playeradapter samt Run-/Abortguard,
   damit `play()`-Rejects, Navigation und Unmount keine späten Zustandswechsel
   verursachen.
2. Die ehrliche reale lokale `#media`-Route muss getrennt von einem
   ausschließlich test-only Presentational-Harness geprüft werden.
3. Der einzige aktuelle UI-Sprachkatalog ist `packages/ui-language/src/index.ts`;
   P3 braucht vollständige neue Copy-Parität und spec-gesteuerte zusätzliche
   Mobile-Viewports ohne Configänderung.

## Wesentliche Vertragsgrenzen

- Nur Mobile-`#media`; Website-Media bleibt erwarteter Skip und read-only.
- Kein Autoplay, Preload vor Aktion, Remotefallback, Tracking oder Hörprofil.
- `local`, `offline`, `stale` und `blocked` bleiben separat. `stale`/`blocked`
  stoppen und lösen den Decoder; lokale P2-Assets werden nicht durch einen
  bloßen Offlineindikator fälschlich als nicht verfügbar ausgegeben.
- Die spätere Visualmatrix bindet 72 Sprach-/Theme-/Reflow- und 32
  Viewport-/Theme-Kernfälle plus Zustands-, Axe-, Keyboard-, Request- und
  Screenreaderbelege. Bilder ohne Funktionsbeleg sind keine Abnahme.
- Der mögliche künftige Writerumfang enthält 14 konkrete Pfade; P2,
  Website, globale Config, Dependencies, reale Medien und alle externen
  Bereiche bleiben OUT.

## Arbeitsbaum und Rechte

Geschrieben wurden ausschließlich diese Übergabe und der zugehörige
Evidencebericht. Kein Produkt-, Test-, Fixture-, Asset-, Browser-, Index- oder
Commitwrite; keine Kinder; bekannte unversionierte Codex-Verzeichnisse wurden
nicht berührt.

END-CHECK: :)
