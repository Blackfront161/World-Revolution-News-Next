# Decision Log

Stand: 23. August 2026
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

| ADR | Status | G2-Entscheidung | Freigabe/Gate |
|---|---|---|---|
| ADR-001 Repository/Pakete | `ACCEPTED` | privates Plattform-Monorepo; zwei Apps, gemeinsame Contract-/Brandpakete, getrenntes Contentrepo | PO-001; Umsetzung erst nach `GO-IMPLEMENTATION` |
| ADR-002 Clientstack | `ACCEPTED` | React + TypeScript + Vite; Capacitor fuer Android; getrennte Websiteausgabe | PO-001; aktuelle Version/Lizenz vor G3 belegen |
| ADR-003 Design/Marke | `ACCEPTED` | gemeinsame semantische Tokens/Assets/Primitive, getrennte Navigation und Layouts | PO-001/009; Assetimport nur mit Rechtebeleg |
| ADR-004 Datenvertrag | `ACCEPTED` | immutable Revision, getrennte ID-Mengenhashes/-beziehungen, stabile IDs, Required/Optional und vorrangige Revocations | G2-Abnahme; Contracttests vor Nutzung |
| ADR-005 Backend/Worker | `ACCEPTED` | providerneutrale `/v1`-Vertraege; Cloudflare bedingt bevorzugt; eigene Deploy-/Rollbackeinheiten je fachlichem Dienst | PO-010/011; Liveinventar und Budgetgate offen |
| ADR-006 Medien | `ACCEPTED` | Referenz vor Kopie; Rechte/Lifecycle/Takedown; Generierung standardmaessig aus | PO-007/009/011; Rechte-/Securitygates offen |
| ADR-007 Offline/Cache | `ACCEPTED` | getrennte App-/Website-Storages, Migrationen und Rollbacks | G2-Abnahme; Tests vor Freigabe |
| ADR-008 Security/Privacy | `ACCEPTED` | SEC-001/002/003 schliessen; No-Content-Logging, Retention, Loeschung/Widerruf | PO-005–008; Findings bleiben Implementierungsblocker |
| ADR-009 QA/Release | `ACCEPTED` | getrennte reproduzierbare Pipelines; GitHub bedingt vorgeschlagen; CI ohne automatische Produktion | PO-013; Remote-/CI-Einrichtung separat |
| ADR-010 Map/Spiel | `ACCEPTED`, Feature `DEFERRED` | nur IDs/Vertraege/Deep Links/Textalternative; kein Release-1-Code | spaeteres eigenes Gate |

## 3. Product-Owner-Entscheidungen vom 23. August 2026

Der Product Owner bestaetigte mit „ja mach weiter bitte“ das unmittelbar zuvor
vollstaendig beschriebene sichere G2-Empfehlungspaket. Diese Abnahme ist keine
Freigabe fuer Produktcode, Remote-Setup, Deployment, Signierung oder Upload.

| ID | Status | Dokumentierte Entscheidung |
|---|---|---|
| PO-001 | `ACCEPTED` | Zielarchitektur, Plattform-Monorepo, React/TypeScript/Vite und Capacitor werden akzeptiert. |
| PO-002 | `ACCEPTED-CONDITIONAL` | Intro/Onboarding bleibt nur als Paritaetsfunktion, wenn es im verbindlichen Runtime-Stand bestaetigt ist; kein neuer Intro-Scope. |
| PO-003 | `ACCEPTED-LATE` | Zine-/Druckwerkzeuge bleiben als eigener spaeter Release-1-Slice, blockieren aber nicht das erste Fundament-Slice. |
| PO-004 | `ACCEPTED-CONDITIONAL` | Action Radar bleibt nur mit freiwilliger lokaler Standortverarbeitung und nachgewiesenem No-Transmission-Vertrag; sonst deaktiviert. |
| PO-005 | `ACCEPTED-GATED` | Push bleibt im Release-1-Scope, ist aber standardmaessig aus und bis SEC-003 sowie bestaetigtem Widerruf gesperrt. |
| PO-006 | `ACCEPTED` | Remoteuebersetzung erfolgt nur nach expliziter Nutzeraktion; keine automatische Uebertragung als Default. |
| PO-007 | `ACCEPTED-GATED` | Podcastkatalog/Player bleibt; generierte Podcasts nur redaktionell freigegeben und erst nach SEC-002, Rechte-, Quoten- und Takedowngate. Kein anonymes Self-Service. |
| PO-008 | `ACCEPTED-AS-MAXIMUM` | Technische Obergrenzen: Logs 30 Tage, Translation 7 Tage, Feedback 90 Tage, Push-Revalidierung 180 Tage, Podcast 30 Tage; kuerzere notwendige Fristen haben Vorrang. |
| PO-009 | `ACCEPTED` | Nur Assets mit belastbarem Rechte-/Lizenzbeleg werden uebernommen; sonst neu erstellen, lizenzieren oder ausschliessen. |
| PO-010 | `ACCEPTED-CONDITIONAL` | Cloudflare darf nach read-only Liveinventar bedingt weiterverwendet werden; Provider bleiben austauschbare Adapter. |
| PO-011 | `ACCEPTED-ZERO-DEFAULT` | Neue optionale API-/Providerbudgets starten bei 0 CHF. Jeder bezahlte Aufruf braucht spaeter Einzelbudget, Messpunkt, Hard Cap und Kill-Switch. |
| PO-012 | `ACCEPTED-G2-ONLY` | G2 ist abgenommen. `GO-IMPLEMENTATION` wird ausdruecklich nicht miterteilt und bleibt separates G3-Gate. |
| PO-013 | `ACCEPTED-CONDITIONAL` | Privates GitHub-Remote und GitHub Actions werden fuer das neue Plattformrepo vorgesehen, aber erst in einem eigenen autorisierten Task mit Least Privilege und geschuetzten Environments eingerichtet. |

## 4. Sichere Rechteentscheidungen vom 23. August 2026

Der Product Owner antwortete auf die unmittelbar zuvor angebotenen sicheren
Rechteoptionen mit „ok weiterfahren bitte“. Um keine unbelegte Eigentumsangabe
zu erfinden, wird dies als Zustimmung zur konservativen Variante dokumentiert.

| ID | Status | Dokumentierte Entscheidung |
|---|---|---|
| PO-014 | `ACCEPTED-EXCLUDE` | `Qood.ttf` wird weder kopiert noch lizenziert. Read-only Git-Greps belegen keine Runtimeverwendung in App-Runtime `968c320`, App-HEAD `2216ff3` oder Website `9a59b17`; fuer Paritaet ist kein Qood-Ersatz erforderlich. |
| PO-015 | `ACCEPTED-RECREATE` | Ungeklaerte Legacy-Markenassets werden nicht importiert. Sie dienen nur als visuelle Baselinereferenz; neue originale Markenassets erhalten einen eigenen Product-Owner-Visualgate und eine neue Rechte-/Hashkette. |

## 5. Entscheidungsdisziplin

- Die vollstaendigen Optionen, Kosten, Risiken, Migrationen und Gates stehen in
  `docs/architecture/ADR-*.md`.
- Der Abschlussstand der Product-Owner-Entscheidungen steht in
  `docs/architecture/G2-OPEN-DECISIONS.md`; technische Evidenzgates bleiben
  auch nach der Entscheidung offen.
- Fehlendes Liveinventar, Rechtebelege oder bestandene Tests sind keine
  Entscheidung und koennen nicht durch eine Freigabeformulierung ersetzt
werden.
- `ACCEPTED` fuer G2 erteilt weder automatisch `GO-IMPLEMENTATION` noch
  Deployment-, Signier- oder Uploadauthority.
