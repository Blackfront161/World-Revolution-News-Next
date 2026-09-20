# WRN-G3-016 – P5-M-001 Architektur-Recheck

## Identitaet und Rechte

- Task-ID: `WRN-G3-016-S5-R1`.
- Ausgangsfinding: P5-M-001 in `cb1771e`.
- Fix: `e320de0`; unabhaengige QA: `6721f83`; enger Securityabschluss:
  `0c6ae2e`.
- Owner: ein frischer `independent_architecture_reviewer`, Sol/high; keine
  Kinder, keine Weiterdelegation.
- Produkt, Tests, Fixtures, Assets, Governance und Git read-only.
- Erlaubte Writes: `docs/evidence/WRN-G3-016/P5-R1-ARCHITECTURE-RECHECK.md`
  und `docs/handoffs/WRN-G3-016-architecture-recheck.md`; kein Commit.

## Pflichtumfang

1. Den exakten Produktfix `12db80e..e320de0`, S5-Q1 und S5-S1 vollstaendig
   lesen; keine allgemeine Vollrepoanalyse.
2. Bestaetigen, dass ein bereits validiertes altes Manifest ohne
   `homePresentation` benutzbar bleibt und keine neuen Rollen erfindet.
3. Bestaetigen, dass ein vorhandener ungueltiger aktueller Homevertrag weiter
   fail-closed bleibt und der aktuelle G3-016-Pfad unveraendert `1+5+1+2`
   projiziert.
4. Bestehende A/B/A-, Neustart-, Aktivierungs- und Rollbackbelege sowie
   Manifest-/Descriptor-/Publicationbindung gegen das Finding abgleichen.
5. App-/Website-, Reader/Saved/Discover-, Content-, Dependency-, Kosten-,
   Security- und Releasegrenzen auf neue Drift pruefen.
6. Alle anderen im ersten P5 bereits GREENen Punkte nur auf eine durch den
   Fix verursachte Regression pruefen; nicht pauschal neu freigeben.

## Gate

Bei offenem High/Medium oder ungeklaerter Abweichung RED/YELLOW und Stop ohne
Selbstkorrektur. Ist P5-M-001 geschlossen und entsteht kein neues Finding,
ergibt dies P5-R1-GREEN und technische Bereitschaft zur lokalen PO-
Sichtabnahme – keine Live-, Android-, Hosting- oder Releasefreigabe.

Bericht/Handoff nennen Quellen, Deltas, Findings, Restrisiken, Rechteende,
Token/Kosten und `END-CHECK: :)`.

