# Agent Handoff – WRN-G2-003

> Historischer Handoff. Die damaligen Vorsichtsentscheidungen PO-014/015 wurden
> spaeter durch PO-016/017 ersetzt; der aktuelle Rechteweg steht in
> `docs/06-DECISION-LOG.md`.

- Agent: Chief AI Architect / Main Agent
- Task-ID: `WRN-G2-003`
- Ergebnis: bestanden

## Kurzfazit

Der konservative Rechteweg ist entschieden, ohne eine unbelegte
Eigentumsbehauptung zu erfinden. Qood wird ausgeschlossen und braucht wegen
fehlender Runtimeverwendung keinen Ersatz. Ungeklaerte Markenassets werden
nicht importiert; ein neuer Originalentwurf folgt spaeter mit visueller
Product-Owner-Abnahme. Das read-only Liveinventar bleibt vor G3 offen.

## Verwendete Quellen

- Governance, Source-of-Truth, Zielarchitektur und Qualitaetsregeln
- App-Runtime `968c320`, App-HEAD `2216ff3`, Website `9a59b17`
- Legacy-`typography.css`, Qood-Hinweis und G1-App-/Website-Screenshots
- offizielle Upstreams/Lizenzen von Inter, Barlow und Atkinson Hyperlegible
  Next; keine Fontdatei heruntergeladen

## Geaenderte Dateien

- Decision Log, Risikoregister, G2-Entscheidungsuebersicht, Projektstatus und
  Mitarbeiter-Dashboard
- `docs/evidence/WRN-G2-002-ASSET-RIGHTS-REGISTER.md`
- `docs/evidence/WRN-G2-003-FONT-AND-BRAND-RECREATION-BRIEF.md`
- `docs/tasks/WRN-G2-003-RIGHTS-DECISION-AND-G3-GATE.md`
- `docs/tasks/WRN-G2-004-READ-ONLY-LIVE-INVENTORY.md`
- `docs/tasks/WRN-G3-001-FIRST-CODE-READINESS.md`
- dieser Handoff

## Tests und Belege

- `git grep` nach Qood in CSS/JS/HTML auf App-Runtime, App-HEAD und Website:
  jeweils keine Referenz
- Legacy-`typography.css` beider Clients read-only verglichen; identische
  Rollen/Fallbackrichtung beobachtet
- G1-App-/Website-Screenshots fuer Markenwirkung und Pflichtviewports visuell
  geprueft
- Dokument-, Tabellen-, Scope-, Whitespace- und Diffpruefung vor Checkpoint

## Feststellungen nach Prioritaet

1. Qood ist eine ungenutzte, lizenzrechtlich ungeeignete Altdatei; Ausschluss
   ist sicherer und guenstiger als Ersatz oder Kauf.
2. Aktuelle sichtbare Typografie beruht auf Systemfallbacks, nicht Qood.
3. Eine lokal selbst gehostete OFL-Shortlist kann spaeter visuell getestet
   werden; Foundation benoetigt sie nicht.
4. Marken-Neuschaffung ist vor Markenparitaet, aber nicht vor einer neutralen
   technischen Foundation erforderlich.
5. Die akzeptierte Zielarchitektur verlangt das Liveinventar vor G3; der
   vorherige lokale Configbericht ersetzt es nicht.

## Annahmen und offene Fragen

- „ok weiterfahren bitte“ wird nur als Zustimmung zur sichersten angebotenen
  Rechtevariante verstanden, nicht als Behauptung eigener Rechte und nicht als
  `GO-IMPLEMENTATION`.
- Welche neue Markenvariante der Product Owner bevorzugt, entscheidet erst ein
  spaeterer visueller Vergleich.
- Livekontozustand bleibt unbekannt, bis WRN-G2-004 separat gestartet wird.

## Restrisiken

- einzelne Legacycode-/Medienrechte bleiben pro Element offen;
- neue Fontdateien brauchen trotz OFL-Shortlist spaeter gepinnte Herkunft,
  Lizenzkopie, Hash und Tests;
- Liveinventar kann weitere Kosten-, Privacy- oder Rollbackblocker zeigen.

## Empfohlener naechster Schritt

Product Owner startet den strikt read-only Task mit `LIVE-INVENTAR STARTEN`.
Erst nach dessen Bericht bleibt als separates Gate `GO-IMPLEMENTATION` fuer
WRN-G3-001.

## WRN-AGENT-STATUS

- Task: `WRN-G2-003`
- Status: GREEN
- Quellstand: Ziel ab `be3a43e`; App `2216ff3`/Runtime `968c320`; Website `9a59b17`
- Erledigt: PO-014/015, Qood-Runtimebeleg, Font-/Markenbrief, G2-004 vorbereitet
- Tests: Git-Grep, Typografievergleich, G1-Visualbelege, Dokument-/Diffpruefung
- Offen: WRN-G2-004, SEC-001–003, Einzelrechte und `GO-IMPLEMENTATION`
- Handoff: `docs/handoffs/WRN-G2-003-rights-decision-and-g3-gate.md`
- Naechster Schritt: `LIVE-INVENTAR STARTEN`
- END-CHECK: :)
