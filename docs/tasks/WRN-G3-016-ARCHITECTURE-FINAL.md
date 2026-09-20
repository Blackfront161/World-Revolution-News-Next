# WRN-G3-016 – unabhaengiger Architekturabschluss

## Identitaet und Rechte

- Task-ID: `WRN-G3-016-P5`.
- Auftraggeber/Integrationsowner: Main/Chief `/root`.
- Reviewowner: genau ein frischer `independent_architecture_reviewer`,
  Sol/high; keine Kinder und keine Weiterdelegation.
- Basis: `f4d357b`; Produktscope bleibt der eingefrorene Kandidat bis
  `b689f11` plus reine Governance-/Reviewdokumente.
- Produkt, Tests, Fixtures, Assets und Governance sind read-only.
- Erlaubte Writes: nur
  `docs/evidence/WRN-G3-016/P5-ARCHITECTURE-FINAL.md` und
  `docs/handoffs/WRN-G3-016-architecture-final.md`.
- Kein Commit durch den Reviewer; Chief integriert nach eigener Pruefung.

## Ziel

Unabhaengig feststellen, ob der abgeschlossene G3-016-Slice die gebundene
Zielarchitektur modular, deterministisch und ohne verdeckte Folgepflichten
umsetzt. Findings werden gemeldet, nicht selbst korrigiert.

## Pflichtumfang

1. P1-Bedingungen gegen P2-Vertrag/Fixture und P3-Appprojektion nachpruefen.
2. Atomare Release-/Hash-/Admissiongrenze, additive `homePresentation`,
   exakt `1 + 5 + 1 + 2`, eindeutige IDs und Freshness/Fail-Closed pruefen.
3. App-/Website-Trennung, Erhalt vorhandener Reader/Saved/Discover-Vertraege
   und den festen vorhandenen Discoverfilter `topic: Sport` bestaetigen.
4. Neun UI-Sprachen, vier Themes, lokale Placeholder und getrennten spaeteren
   Contentvertrag `WRN-CONTENT-SPORT-001` architektonisch einordnen.
5. QA-/A11y- und Security-Handoffs gegen den implementierten Scope sowie
   offene Baseline-/OUT-Punkte auf unzulaessige Freigabevererbung pruefen.
6. Wartbarkeit, Erweiterbarkeit fuer G3-017 bis G3-021, Daten-/Privacygrenzen,
   Kosten/Dependencies, Rollback und Releasegrenzen beurteilen.

## OUT und Stopregeln

- Keine allgemeine Vollrepoanalyse, kein Produkt-/Testwrite, keine
  Selbstkorrektur und keine neuen Tests.
- Keine Website-, Content-, Hosting-, Live-, Android-, AAB-, Play-,
  Deployment- oder Releaseaktion.
- Bei High/Medium oder ungeklaerter Vertragsabweichung RED/YELLOW mit exakten
  Quellen und Chief-Disposition. Null offene Scopefindings ergibt nur P5-
  Architektur-GREEN, noch keine PO-Sicht- oder Releasefreigabe.

## Uebergabe

Bericht und Handoff nennen Basis, vollstaendig gelesene Quellen, Dateiscope,
Findings nach Prioritaet, Test-/Evidenceabgleich, Restrisiken, Token/Kosten
(`unbekannt`, falls nicht messbar), Rechteende und `END-CHECK: :)`.

