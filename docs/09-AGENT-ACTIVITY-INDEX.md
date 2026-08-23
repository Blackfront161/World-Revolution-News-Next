# Mitarbeiter-Dashboard

Stand: 23. August 2026
Zweck: einfache, menschenlesbare Kontrolle aller sichtbaren Projekt-Tasks,
internen Subagenten, Modelle, Ergebnisse und Git-Nachweise.

## 1. Sichtbare Codex-Projekt-Tasks

| Task/Chat | Typ | Aufgabe | Umgebung | Status | Verweis |
|---|---|---|---|---|---|
| `WRN – Chief AI Architect & Orchestrierung` | sichtbarer, angehefteter Haupttask | `WRN-G3-001`: lokale Foundation; keine Legacy-/Livewirkung | `codex/g3-001-foundation` | IN ARBEIT – `GO-IMPLEMENTATION` FUER DIESEN TASK ERTEILT | `docs/tasks/WRN-G3-001-FIRST-CODE-READINESS.md` |
| `WRN G2 – Zielarchitektur & ADRs` | sichtbarer Phasentask | `WRN-G2-001`: Zielarchitektur und ADR-Paket; kein Produktcode | isolierter Codex-Git-Worktree | ABGESCHLOSSEN UND VOM PRODUCT OWNER AKZEPTIERT | `docs/handoffs/WRN-G2-001-target-architecture-adr-package.md` |

Sichtbarer G2-Codex-Thread: `01a02497-f526-7cf1-b398-dc664a90c044`.

Regel: Jede grosse Phase oder jedes eigenstaendige Ergebnis bekommt hoechstens
einen sichtbaren Projekt-Task. Kurzlebige Recherche-, Test- und Auditaufgaben
laufen als Subagenten innerhalb des zustaendigen sichtbaren Tasks.

## 2. Abgeschlossene G1-Mitarbeiterinstanzen

| Instanz/Rolle | Modell im Lauf | Task | Ergebnis | Dauerhafter Handoff | Git-Checkpoint |
|---|---|---|---|---|---|
| Legacy Product Analyst – App/Android | Terra/medium Runtime | `WRN-G1-001` | abgeschlossen, fachlich YELLOW | `docs/handoffs/WRN-G1-001-legacy_product_analyst.md` | `6fab0c6` |
| Visual/Accessibility Reviewer – App | Terra/high | `WRN-G1-002` | abgeschlossen, fachlich YELLOW | `docs/handoffs/WRN-G1-002-visual-app-baseline.md` | `b17506c` |
| Backend/Data Reliability Analyst | Terra/high | `WRN-G1-003` | abgeschlossen, fachlich YELLOW | `docs/handoffs/WRN-G1-003-backend-data-privacy-baseline.md` | `93547dd` |
| Security/Privacy Reviewer | Sol/high | `WRN-G1-004` | abgeschlossen, fachlich YELLOW | `docs/handoffs/WRN-G1-004-security-privacy-review.md` | `dfe06da` |
| Website/Brand Analyst | Luna/medium Runtime-Fallback fuer Spark | `WRN-G1-005` | abgeschlossen, fachlich YELLOW | `docs/handoffs/WRN-G1-005-website-brand-baseline.md` | `9596b11` |
| Website Visual Reviewer | Terra/high | `WRN-G1-006` | abgeschlossen, fachlich YELLOW | `docs/handoffs/WRN-G1-006-visual-website-baseline.md` | `845c2e7` |
| Context Continuity Auditor | Luna/medium | G1-Meilensteinaudits | alle Instanzen beendet; Audits GREEN | `docs/handoffs/WRN-G1-00*-context-audit.md` | letzter Audit in `86f2615` |

Die Instanzen sind beendet und verbrauchen keine weiteren Tokens. Ihre
Profile, Handoffs, Screenshots und Git-Nachweise bleiben erhalten.

## 3. Aktive oder reservierte Profile

Profile unter `.codex/agents/` sind Stellenbeschreibungen, keine laufenden
Mitarbeiter. `VERFUEGBAR` bedeutet deshalb: darf bei passendem Task Brief
gestartet werden, arbeitet aber aktuell nicht.

| Profil | Modellrouting | Status | Naechster typischer Einsatz |
|---|---|---|---|
| `legacy_product_analyst` | Spark/medium | VERFUEGBAR | kleine read-only Bestandsaufnahme |
| `frontend_brand_engineer` | Terra/high | VERFUEGBAR FUER WRN-G3-001 | neutrale Foundation/UI; kein Legacy-/Markenassetimport |
| `backend_data_reliability_engineer` | Terra/high | VERFUEGBAR FUER WRN-G3-001 | reine Domain-/Contract-/Test-Support-Pakete; keine Dienste |
| `qa_release_engineer` | Terra/high | VERFUEGBAR FUER QA | unabhaengige Tests und visuelle Belege |
| `independent_architecture_reviewer` | Sol/high | GENAU EINE INSTANZ ABGESCHLOSSEN – 3 HIGH/3 MEDIUM/1 LOW, ALLE AKZEPTIERT | `docs/handoffs/WRN-G2-001-independent-architecture-review.md` |
| `context_continuity_auditor` | Luna/medium | G2-AUDIT GREEN 10/12 – INSTANZ ABGESCHLOSSEN | `docs/handoffs/WRN-G2-001-context-audit.md` |
| Reserveprofile | Spark/Luna/Terra/Sol je Risiko | BEDARFSGESTEUERT | nur bei dokumentiertem Ausloeser |

## 4. Wo der Product Owner Arbeit kontrolliert

1. **Sichtbarer Codex-Task:** laufende Kommunikation, Status und Rueckfragen.
2. **`docs/tasks/`:** exakter Auftrag und Verbote vor Arbeitsbeginn.
3. **`docs/handoffs/`:** verdichtetes Mitarbeiterergebnis.
4. **`docs/evidence/`:** Screenshots und sonstige visuelle Belege.
5. **`docs/PROJECT-STATE.md`:** aktuelle Phase, aktive Instanz, naechste Aktion.
6. **Git-Verlauf:** unveraenderlicher Nachweis, wann welche Governance-Datei
   aufgenommen wurde.

## 5. Lifecycle-Regeln

- `START <Task-ID>` startet nur einen bereits schriftlich begrenzten Auftrag.
- `STATUS <Name/Task-ID>` fordert einen kompakten Zustand an.
- `STOPP <Name/Task-ID>` unterbricht ohne Loeschung.
- `FEUERN: <Name>` beendet die Instanz nach gesicherter Uebergabe.
- Profile, Handoffs, Evidenz und Git-Historie werden nicht automatisch geloescht.
- Ein fehlendes `END-CHECK: :)` ist nur ein Auditsignal; Ersatz erfolgt erst
  nach Continuity-Pruefung.

## WRN-AGENT-STATUS

- Task: Mitarbeiter-Dashboard
- Status: GREEN
- Quellstand: Governance ab `86f2615`
- Erledigt: sichtbare Tasks, G1-Instanzen, Profile und Kontrollorte kartiert
- Tests: Dokumentpruefung
- Offen: WRN-G3-001-Belege; Medien-/Codebelege pro Element, R-26/R-29 und
  SEC-001–003 fuer spaetere Slices
- Handoff: `docs/09-AGENT-ACTIVITY-INDEX.md`
- Naechster Schritt: lokale Foundation implementieren, testen und visuell
  belegen; keine automatische Folgefreigabe
- END-CHECK: :)
