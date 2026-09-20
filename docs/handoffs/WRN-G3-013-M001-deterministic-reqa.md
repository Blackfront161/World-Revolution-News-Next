# Handoff – WRN-G3-013 M-001 deterministische unabhängige Re-QA

- Agent: frischer unabhängiger Visual-/Accessibility-Reviewer
- Task-ID: `WRN-G3-013-M-001`
- Ergebnis: **teilweise / YELLOW, nicht freigabefähig**
- Quellstand: unveränderter Produktkandidat `b21b02e`; Ausgang
  `f181d0d`, `01a0e07`, `a0504ce`, Governance `b07ad89`

## Kurzfazit

M-001 bleibt offen. Die vollständige normale Nach-Mount-Reihenfolge wurde
unabhängig und ohne Produktinstrumentierung 12-mal pro Client wiederholt:
Mobile 12/12 und Website 12/12 enden nach 3-s beobachtbarem Polling falsch.
Bei Root-Font 32px bleibt `data-wide-language-layout` abwesend; der native
Select ist zu schmal und verliert sichtbaren Inhalt. Das ist ein stabiler
Endzustand, nicht die von `a0504ce` vermutete bloße Zwischenphase.

## Verwendete Quellen

- vollständiges `AGENTS.md`, `docs/04-QUALITY-RULES.md`, Task Brief,
  G3-013-Abnahmeplan, Visual-QA- und Handoff-Template;
- PO-067-Handoff `f181d0d`, historische Re-QA `01a0e07`, Incident-Diagnose
  `a0504ce` einschließlich beider Harnesses und Timeline-JSON;
- Kandidat `b21b02e` sowie `apps/mobile/src/App.tsx`,
  `apps/website/src/App.tsx` und bestehende Browsermatrix read-only.

## Geaenderte Dateien

Nur neue QA-Artefakte:

- `docs/evidence/WRN-G3-013/M001-deterministic-reqa/` – zwei Capture-
  Harnesses, maschinenlesbare Runtime-/Timeline-Matrizen, 64 PNGs und Bericht;
- diese Übergabe.

Produkt, Tests, Packages, Rootkonfiguration und historische Evidenz blieben
read-only; `.codex-remote-attachments/` blieb unberührt.

## Tests und Belege

- Node 24.19.0 / pnpm 11.19.0; Toolchaincheck, Format, Lint, 19 Boundaries
  und sieben Typechecks GREEN.
- 148 Vitest- plus acht Website-Static-Tests GREEN; beide Builds GREEN.
- Voller Playwrightlauf GREEN: 65 PASS, 159 erwartete Skips, 0 Fehler.
- Deterministischer Reflow: initial 200% vor Mount PASS; nach Mount 200%
  **24/24 FAIL** (Mobile 12/12, Website 12/12); Screenshots und Matrix sind
  commitgebunden unter `M001-deterministic-reqa/`.
- Timeline belegt Root-Mutation, Microtask und Animation-Frame, gefolgt vom
  weiterhin falschen 3-s-Endzustand in beiden Clients.
- Neun Sprachen, normale Viewports, Themes, ready/loading/empty/offline/error,
  Keyisolation/Persistenz/Fehlerpfade, Contentinvarianz, Axe, Overflow,
  Targets, Console, externe Requests, Cookies und andere Browserstorages sind
  in den nicht vom Wide-Fehler blockierten Zuständen GREEN.

## Feststellungen nach Prioritaet

- Blocker: 0
- High: 0
- Medium: 1 – `WRN-G3-013-M-001`, persistenter Nach-Mount-Reflowfehler in
  Mobile und Website.
- Low: 0

## Annahmen und offene Fragen

Der beobachtbare Fehlerpfad sitzt in der duplizierten
`useEffect`-Lifecycle-Registrierung: Der MutationObserver/Resize-Listener
führt nach Registrierung kein synchrones `update()` aus. Die Re-QA beweist
den fehlenden Wide-Endzustand; die genaue interne Schedulerursache bleibt
sekundär und muss vor einer minimalen Korrektur nicht weiter spekuliert werden.

## Restrisiken

Der Wide-Mobile-Dokumentfluss und die Wide-Website-Headeraufteilung dürfen
nicht als bestanden gelten, solange ihr Aktivierungsattribut stabil fehlt.
Normale Layout- und Funktionsbelege ersetzen diesen Accessibility-/Reflowfehler
nicht. Android-Textgröße, Browserzoom und produktive Offline-/Cachewirkung
bleiben außerhalb des Slices.

## Empfohlener naechster Schritt

Nur nach einem neuen engen Product-Owner-Gate: in beiden Headerprojektionen
den Lifecycle auf `useLayoutEffect` mit synchronem Initial-`update()` und
vollständigem Cleanup begrenzen; den hier roten Normalmount→Sprache→200%-Test
zuerst erhalten und nach der Korrektur mit Polling grün belegen. Danach ist
eine weitere frische vollständige unabhängige Re-QA zwingend. Keine
automatische Ausführung.

## WRN-AGENT-STATUS

- Task: WRN-G3-013 M-001 deterministische unabhängige Re-QA
- Status: YELLOW
- Quellstand: `b21b02e` / `f181d0d`, read-only Produktstand
- Erledigt: vollständige technische Regression, 24x stabile Nach-Mount-
  Reproduktion, Timeline, visuelle Prüfung und normale Restmatrix
- Tests: Node 24.19/pnpm 11.19, Format, Lint, 19 Boundaries, 7 Typechecks,
  148+8 Tests, beide Builds, 65 Browser-PASS/159 erwartete Skips/0 Fehler
- Offen: ausschließlich Medium `WRN-G3-013-M-001`; sichtbare
  Product-Owner-Entscheidung und neuer enger Fixauftrag erforderlich
- Handoff: `docs/handoffs/WRN-G3-013-M001-deterministic-reqa.md`
- Naechster Schritt: neues sichtbares Korrekturgate abwarten
- END-CHECK: :)
