# Handoff – WRN-G3-013-M-001 PO-068 Lifecyclekorrektur

- Agent: einzige frische `frontend_brand_engineer`-Schreibinstanz
- Task: `WRN-G3-013-M-001` / PO-068
- Ergebnis: Kandidat GREEN, unabhängige Re-QA ausstehend
- Ausgangsstand: `764357d`, Produktbasis `b21b02e`, RED-Beleg `91a9971`

## Kurzfazit

Die nach dem Mount fehlende Reflow-Aktivierung ist mit einem minimalen,
beobachtbaren Lifecyclefix in beiden getrennten Clientheadern adressiert. Die
Messung findet jetzt im `useLayoutEffect` statt, wird unmittelbar nach der
Registrierung ausgeführt und reagiert weiterhin auf Root-Style/-Class sowie
Viewportänderungen. Observer und Listener werden beim Unmount entfernt.

Die neue Browserregression bewahrt den echten roten Ablauf: normal mounten,
UI-Sprachwahl sichtbar, Sprache wählen, erst danach Root-Font auf 200 Prozent
setzen und auf den Wide-Endzustand pollen. Sie deckt 12 Wiederholungen je
Client mit allen neun IDs, 100-Prozent-Rückkehr, Resize und Reload ab.

## Geänderte Dateien

- `apps/mobile/src/App.tsx`
- `apps/website/src/App.tsx`
- `tests/e2e/foundation.spec.ts`
- `docs/evidence/WRN-G3-013/M001-po068-correction/WRN-G3-013-M001-PO068-CORRECTION.md`
- diese Übergabe

Nicht geändert: Kataloge, Storageadapter, Content, Contracts, Fixtures,
Publisher, statische Landingpages, Rootkonfiguration, Dependencies, Assets,
Legacy-/Livesysteme und externe Systeme. `.codex-remote-attachments/` blieb
unberührt.

## Ausgeführte Checks

- Node `24.19.0`; neuer Nach-Mount-Test Mobile+Website GREEN (2 PASS,
  5 erwartete Skips), 12 × 9 Reflowtransitions je Client.
- Reflow-Funktionsmatrix GREEN: 6 PASS, 22 erwartete Skips.
- 148 Vitest- plus 8 Node-Tests GREEN; sieben Typechecks GREEN.
- Format/Lint/Diff-Whitespace GREEN; 19 Boundaries GREEN; beide Builds GREEN.
- Toolchain und Releaseboundary GREEN; voller Browserlauf: 67 PASS,
  164 erwartete Skips, 0 Fehler.

## Nächster zwingender Schritt

Genau ein frischer unabhängiger `visual_accessibility_reviewer` prüft den
unveränderten Kandidaten mit der vollständigen G3-013-Matrix: alle Sprachen,
beide Clients, initialer und Nach-Mount-Reflow, 100-Prozent-Rückkehr,
Resize/Remount, Mobile-Dokumentfluss, Websiteheader, lokale Persistenz,
No-side-effects, Axe, Fokus/Tastatur, Overflow, Targets, Konsole und volle
Regression. Bei einem Finding wird gestoppt; der QA-Agent korrigiert nichts.

Technisches GREEN ist keine sichtbare Product-Owner-Abnahme.

END-CHECK: :)
