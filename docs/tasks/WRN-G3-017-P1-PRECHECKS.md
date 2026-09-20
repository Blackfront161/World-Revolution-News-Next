# WRN-G3-017 – parallele P1-Vorpruefungen

## Gemeinsame Grenze

Basis `e1caf4b`. Alle drei Instanzen sind produkt-, test-, fixture-,
governance- und git-read-only. Keine Kinder, kein Commit, keine Netzrecherche,
kein echter Content und keine Produktentscheidung ausserhalb des Briefs.

### P1-L – Luna Kontinuitaet und Inventar

- Profil: `context_continuity_auditor`, Luna/medium.
- Ziel: bestehende Entscheidungen, Datenzustaende, Persistenzadapter,
  Reading-State-Grenzen, UI-Sprachen und alte Handoffs fuer `Fuer mich`
  inventarisieren; Widersprueche und Wiederverwendung als GREEN/YELLOW/RED.
- Writes: `docs/evidence/WRN-G3-017/P1-L-CONTINUITY-INVENTORY.md` und
  `docs/handoffs/WRN-G3-017-p1-luna.md`.
- Keine Architekturentscheidung oder Quellmutation.

### P1-T – Terra technische Machbarkeit

- Profil: `frontend_brand_engineer`, Terra/high, aber vollstaendig read-only
  gegen Produkt und Tests.
- Ziel: genaue Mobile-/Package-/Testpfade, bestehende Navigation, lokale
  Speicher-/Sprach-/Reading-State-Komponenten, UI-Zustaende, A11y-/Visual-
  Harness und konfliktfreie P2/P3-Dateipakete kartieren.
- Writes: `docs/evidence/WRN-G3-017/P1-T-TECHNICAL-MAPPING.md` und
  `docs/handoffs/WRN-G3-017-p1-terra.md`.
- Keine Implementierung oder verbindliche Datenmodellentscheidung.

### P1-S – Sol Architektur, Privacy und Migration

- Profil: `independent_architecture_reviewer`, Sol/high.
- Ziel: Vertrag auf Datenminimierung, explizite Zustimmung, Loeschung,
  unbekannte Zukunftsversion, atomare/idempotente Migration, Downgrade,
  Korruption, Neustart, getrennte anonyme Startseite und keine stille
  Ableitung aus Lesestatus pruefen. Konkrete bindende Bedingungen fuer P2/P3.
- Writes: `docs/evidence/WRN-G3-017/P1-S-ARCHITECTURE-PRECHECK.md` und
  `docs/handoffs/WRN-G3-017-p1-sol.md`.
- Keine Selbstkorrektur oder Produkt-/Testmutation.

## Gemeinsame Uebergabe

Jeder Bericht nennt vollstaendig gelesene Quellen, Befunde nach Prioritaet,
offene Entscheidungen, empfohlene P2/P3-Grenzen, Token/Kosten (`unbekannt`,
falls nicht messbar), Rechteende und `END-CHECK: :)`. Der Chief synthetisiert
erst nach allen drei Enden; kein einzelnes GREEN startet P2.

