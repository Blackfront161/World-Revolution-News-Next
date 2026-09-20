# WRN-G3-020 P2-R4-B-R3-R1 – Split-Vertragskorrektur

Status: **GEBUNDEN; BEIDE TESTWRITER BIS KANONISCHEM SOL-SCHLUSSRECHECK-GREEN GESPERRT**

## Anlass und Schliessung

Der unabhaengige Split-Precheck `1da6511` bestaetigt Cap-/Failuremachbarkeit,
Disjunktheit und automatische Playwright-Entdeckung, meldet aber ein Medium
und ein Low. Die R1-Korrektur bindet deshalb ohne Produkt-/Testwrite:

- alle noch ownerlosen Replacement-, Safetyrevision-/Rollback-lower- und
  Eventstore-Future-/Corrupt-/Storestrukturfaelle exklusiv an R3-B;
- Runtimeimport bestehender Specs ist verboten; nur Harnesskonstanten duerfen
  importiert werden;
- R3-A/R3-B duerfen nach kanonischem Sol-Schlussrecheck-GREEN parallel nur
  disjunkt editieren/testen,
  nie den Git-Index verwenden;
- Chief integriert exklusiv R3-A zuerst und danach R3-B, jeweils nach leerem
  Cached-Diff und exakter Pfadkontrolle.

Die vollstaendigen korrigierten Pflichten stehen in den beiden aktualisierten
R3-A-/R3-B-Briefs. Produkt `cb0f6bc`, elf Browserfaelle `47a6fc3`, R4-A und
alle externen Gates bleiben unveraendert/read-only.

## Gate

Der kanonische unabhaengige Sol-Schlussrecheck muss
`P2-R4-B-R3-PRE-M-001/L-001` mit null neuen Findings schliessen. Vorher keine
Writeraktivierung. Danach hoechstens zwei disjunkte Terra/high-Testwriter,
keine Kinder und die oben gebundene serielle Chief-Integration.

## WRN-AGENT-STATUS

- Task: WRN-G3-020-P2-R4-B-R3-R1-SPLIT-CORRECTION
- Status: gebunden; beide Testwriter gesperrt
- Basis: Splitbriefs `f739de1`; RED-Precheck `1da6511`
- Findings: `P2-R4-B-R3-PRE-M-001/L-001`
- Rechte: beim Chief
- Naechster Schritt: kanonischer Sol-Schlussrecheck
- END-CHECK: :)
