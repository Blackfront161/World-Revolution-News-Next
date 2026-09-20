# WRN-G3-016 – P5-M-001 unabhaengige Re-QA

## Identitaet und Scope

- Task-ID: `WRN-G3-016-S5-Q1`.
- Basis: Fixkandidat `e320de0` gegen Writerbasis `12db80e`.
- Auftraggeber/Integrationsowner: Main/Chief `/root`.
- Reviewowner: ein frischer `qa_release_engineer`, Terra/high; keine Kinder.
- Produkt, bestehende Tests, Fixtures, Governance und Git sind read-only.
- Erlaubte Writes: genau eine eigene unabhaengige Spec
  `tests/e2e/g3-016-legacy-home-independent-qa.spec.ts`,
  `docs/evidence/WRN-G3-016/p5-m001-reqa/**` und
  `docs/handoffs/WRN-G3-016-p5-m001-independent-reqa.md`.
- Kein Commit durch QA.

## Pflichtpruefungen

1. Diff `12db80e..e320de0` vollstaendig auf Scope und Semantik pruefen.
2. Den zuvor roten bestehenden `S12 A/B/A`-Pfad und den bestehenden R02-
   Neustart-/Aktivierung-/Rollbackpfad frisch ausfuehren.
3. Unabhaengig belegen: fehlendes `homePresentation` plus valider Ready-State
   zeigt alle validierten Artikel in Reihenfolge, Revision, Reader und
   Save/Remove; keine Lead/Main/Sportrollen und kein Sportlink.
4. Unabhaengig belegen: vorhandener ungueltiger Homevertrag bleibt Error ohne
   Artikel/Legacyfallback; aktueller G3-016-Homepfad bleibt `1 + 5 + 1 + 2`.
5. Legacyansicht in allen vier Themes bei Mobile 390x844 sowie 200-%-Reflow
   pruefen: Axe, Keyboard/Fokus, kein horizontales Overflow, 44x44-Bedienung,
   keine externen Requests/Cookies/Console-/Pageerrors. Bestehende neun
   Sprachkataloge sind unveraendert; mindestens EN und DE dynamisch pruefen.
6. 73 Mobileunits, Mobile-Typecheck, P3-Visualspec, Prettier der geaenderten
   Quellen und `git diff --check 12db80e..e320de0` frisch ausfuehren.

## Gate

Bei Finding Bericht/Handoff und Stop ohne Selbstkorrektur. GREEN schliesst
nur S5-Q1; danach bleibt ein enger Security-Deltacheck und frischer P5-
Architektur-Recheck erforderlich. Keine PO-, Live-, Android- oder
Releasefreigabe.

Bericht/Handoff muessen exakte Befehle, Ergebnisse, Bildanzahl/-hashbindung,
Findings, Restrisiken, Rechteende, Token/Kosten (`unbekannt`, falls nicht
messbar) und `END-CHECK: :)` enthalten.

