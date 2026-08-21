# Decision Log

Stand: 21. August 2026
Regel: `ACCEPTED` benoetigt den genannten Entscheidungseigner. G2-Empfehlungen
bleiben `PROPOSED`, bis der Product Owner sie dokumentiert bestaetigt.

## 1. Bereits akzeptierte Governanceentscheidungen

Die fruehen Bezeichnungen `ADR-000` bis `ADR-008` waren ein vorlaeufiges
Governancelog. Damit sie nicht mit dem kanonischen G2-Paket kollidieren, werden
sie hier unter stabilen `GOV`-IDs weitergefuehrt.

| ID | Status | Entscheidung |
|---|---|---|
| GOV-001 | `ACCEPTED` | Dokumentation, Quellen, Agenten- und Qualitaetsbasis vor Produktcode; kein Produktcode ohne `GO-IMPLEMENTATION`. |
| GOV-002 | `ACCEPTED` | `Sauberes Wo Rev Ne` ist das neue lokale Arbeitsrepository; Legacyquellen bleiben unveraendert. |
| GOV-003 | `ACCEPTED` | Sol fuer hohe Risiken/Gates, Terra fuer regulaere Umsetzung, Luna fuer Routine, Spark fuer eng begrenzte Arbeit. |
| GOV-004 | `ACCEPTED` | Build, Test, Signierung, Upload, Deployment und Rollout sind getrennte Operationen. |
| GOV-005 | `ACCEPTED` | Statusblock/`END-CHECK: :)`, Continuity Audit und sichere Rotation; Marker allein ist kein Gesundheitsbeweis. |
| GOV-006 | `ACCEPTED` | Mitarbeiterprofile und Belege werden nie automatisch geloescht; `FEUERN` beendet nur eine Instanz. |

Die fruehen Vorschlaege zu Monorepo, Contenttrennung, UI-Stack und Map/Spiel
werden durch die folgenden kanonischen G2-ADRs praezisiert. Das ist keine
Product-Owner-Annahme ihrer Annahme.

## 2. Kanonisches G2-ADR-Paket

| ADR | Status | G2-Empfehlung | Offene Freigabe |
|---|---|---|---|
| ADR-001 Repository/Pakete | `PROPOSED` | privates Plattform-Monorepo; zwei Apps, gemeinsame Contract-/Brandpakete, getrenntes Contentrepo | PO-001 |
| ADR-002 Clientstack | `PROPOSED` | React + TypeScript + Vite; Capacitor fuer Android; getrennte Websiteausgabe | PO-001 |
| ADR-003 Design/Marke | `PROPOSED` | gemeinsame semantische Tokens/Assets/Primitive, getrennte Navigation und Layouts | PO-001/009 |
| ADR-004 Datenvertrag | `PROPOSED` | immutable Revision, getrennte ID-Mengenhashes/-beziehungen, stabile IDs, Required/Optional und vorrangige Revocations | Teil der G2-Abnahme |
| ADR-005 Backend/Worker | `PROPOSED` | providerneutrale `/v1`-Vertraege; Cloudflare bedingt bevorzugt; eigene Deploy-/Rollbackeinheiten je fachlichem Dienst | PO-010/011 |
| ADR-006 Medien | `PROPOSED` | Referenz vor Kopie; Rechte/Lifecycle/Takedown; Generierung standardmaessig aus | PO-007/009/011 |
| ADR-007 Offline/Cache | `PROPOSED` | getrennte App-/Website-Storages, Migrationen und Rollbacks | Teil der G2-Abnahme |
| ADR-008 Security/Privacy | `PROPOSED` | SEC-001/002/003 schliessen; No-Content-Logging, Retention, Loeschung/Widerruf | PO-005–008 |
| ADR-009 QA/Release | `PROPOSED` | getrennte reproduzierbare Pipelines; GitHub bedingt vorgeschlagen; CI ohne automatische Produktion | PO-013 und G2-Abnahme |
| ADR-010 Map/Spiel | `PROPOSED`, Feature `DEFERRED` | nur IDs/Vertraege/Deep Links/Textalternative; kein Release-1-Code | spaeteres eigenes Gate |

## 3. Entscheidungsdisziplin

- Die vollstaendigen Optionen, Kosten, Risiken, Migrationen und Gates stehen in
  `docs/architecture/ADR-*.md`.
- Echte offene Product-Owner-Entscheidungen stehen in
  `docs/architecture/G2-OPEN-DECISIONS.md`.
- Fehlendes Liveinventar, Rechtebelege oder bestandene Tests sind keine
  Entscheidung und koennen nicht durch eine Freigabeformulierung ersetzt
werden.
- `ACCEPTED` fuer G2 erteilt weder automatisch `GO-IMPLEMENTATION` noch
  Deployment-, Signier- oder Uploadauthority.
