# Handoff – WRN-G3-013-M-001 Incident-Diagnose

- Agent: frischer read-only `incident_debugger`
- Task-ID: `WRN-G3-013-M-001` / PO-068
- Ergebnis: teilweise / YELLOW
- Quellstand: Gate `e8e5758`, Bindung `7c29c9f`, Kandidat `b21b02e`

## Kurzfazit

Der historische Re-QA-RED-Zustand ist belegt, aber am unveraenderten Kandidaten
nicht als persistenter Produktfehler reproduzierbar. Mobile und Website
wechseln bei initialem und echtem Nach-Mount-Reflow auf den Wide-Pfad und
zurueck. Die exakte historische Re-QA-Sequenz lief zusaetzlich 12/12 je Client
GREEN.

Die Timeline reproduziert jedoch den kritischen Zwischenzustand: Root-Font ist
bereits 32px und der MutationObserver hat geliefert, waehrend React das
Wide-Attribut im ersten Microtask/Animationsframe noch nicht committed hat.
Die feste 150-ms-Re-QA-Abtastung ist daher kein deterministischer Testvertrag.
Ohne reproduzierbares RED darf die PO-068-Produktkorrektur nicht beginnen.

## Verwendete Quellen

- vollstaendiges `AGENTS.md`, Charter, Source-of-Truth, Zielarchitektur,
  Qualitaetsregeln, Task Brief und Handoff-Template
- Ausgangsreview/Handoff/Harness `3125cd5`
- PO-067-Handoff und Runtimematrix `f181d0d`
- Re-QA-Bericht/Handoff/Harness/Error `01a0e07`
- exakter Produkt-/Testdiff `b29196d..b21b02e`

## Geaenderte Dateien

Nur neue, autorisierte Diagnoseartefakte:

- `docs/evidence/WRN-G3-013/M001-incident-diagnosis/`
- `docs/handoffs/WRN-G3-013-M001-incident-diagnosis.md`

Produkt-, Test-, Package-, Rootconfig- und bestehende Evidence-Dateien blieben
read-only. `.codex-remote-attachments/` blieb unberuehrt.

## Tests und Belege

- Node `24.19.0`, pnpm `11.19.0`, Chrome `151.0.7922.174`.
- Mobile und Website: initial 200%, Nach-Mount style-only, style+class,
  synthetischer/echt ausgelöster Resize und Rueckkehr auf 100% GREEN.
- Exakte Re-QA-Sequenz: 12/12 Mobile und 12/12 Website GREEN.
- Mobile EL: `326 x 88px`, Text `204.5px`; Website PT: `326 x 88px`, Text
  `225.16px`; kein Clipping im stabilen Zustand.
- Maschinenlesbare Eventtimeline und commitgebundene Screenshots im
  Diagnoseverzeichnis.

## Feststellungen nach Prioritaet

- Kein neuer Blocker, High, Medium oder Low gegen den stabil beobachteten
  Kandidaten.
- Diagnose-YELLOW: Die historische 150-ms-Einzelprobe trennt
  Observerzustellung und spaeteren React-Commit nicht.
- Wartbarkeitsrisiko: duplizierter JS-Lifecycle plus nicht aequivalente
  CSS-`13rem`-Doppelspur; Mobile koppelt daran auch den Shell-Dokumentfluss.

## Annahmen und offene Fragen

Die historische Ausfuehrung besitzt keinen Trace nach dem roten Snapshot.
Darum bleibt offen, ob sie einen selten verlorenen Callback oder nur einen zu
fruehen Snapshot traf. Die frische Stressmatrix stuetzt die zweite Erklaerung.

## Restrisiken

Browser-Zoom, OS-Textgroesse und Android WebView sind nicht durch PO-068
freigegeben. Keine Produkt-, Remote-, Build-, Deployment- oder Secretaktion
wurde ausgefuehrt.

## Empfohlener naechster Schritt

Der frische Frontend-Agent soll zuerst den im Bericht definierten Test mit
normalem Mount, Effects-bereit-Signal, anschliessendem 200%-Wechsel,
beobachtbarem Poll, allen neun IDs, 100%-Rueckkehr, Resize, Remount, Mobile-
Dokumentfluss und Websiteheader unveraendert ausfuehren und RED sichern.

Bleibt er wie hier GREEN: stoppen, kein Produktdiff. Wird er reproduzierbar
RED: kleinster Fixvertrag ist ein einziger Lifecyclepfad mit synchronem Check
in `useLayoutEffect`, `ResizeObserver` plus benoetigten Viewportsignalen und
vollstaendigem Unmount-Cleanup; MutationObserver und tote CSS-Doppelspur eher
entfernen als weitere Wege addieren.

## WRN-AGENT-STATUS

- Task: WRN-G3-013-M-001 Incident-Diagnose
- Status: YELLOW
- Quellstand: `b21b02e`, Gate `e8e5758`, Bindung `7c29c9f`
- Erledigt: Quellen-/Difftrace, beide Clients, Initial-/Nach-Mount-/Resize-/
  Restore-Reproduktion, Hypothesenranking und RED-Testvertrag
- Tests: Node 24.19/pnpm 11.19; exakte Re-QA-Sequenz 24/24 GREEN
- Offen: reproduzierbarer RED-vor-Korrektur-Beleg fehlt
- Handoff: `docs/handoffs/WRN-G3-013-M001-incident-diagnosis.md`
- Naechster Schritt: gebundenen Regressionstest zuerst ausfuehren; ohne RED
  keine Produktmutation
- END-CHECK: :)
