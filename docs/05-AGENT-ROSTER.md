# Agenten-Roster und Modellrouting

Status: Profile angelegt, **kein Agent gestartet**

## 1. Fuehrungsmodell

Der aktuelle Codex-Haupttask ist Chief AI Architect und Orchestrator. Der
Product Owner behaelt Produkt-, Budget-, Design- und Releasefreigaben.
Sub-Agenten bearbeiten nur klar begrenzte Task Briefs und geben Ergebnisse an
den Main Agent zurueck.

## 2. Kernteam

| Profil | Modell | Modus | Auftrag | Aktivierung |
|---|---|---|---|---|
| `legacy_product_analyst` | Spark, medium | read-only | App, Website, Daten und Funktionen kartieren | erster Analyseauftrag nach G0 |
| `frontend_brand_engineer` | Terra, high | workspace-write | Mobile-/Website-UI und gemeinsames Design-System | erst nach G3 |
| `backend_data_reliability_engineer` | Terra, high | workspace-write | APIs, Datenvertraege, Offline, Cache und Cloudflare-Stabilitaet | erst nach G3 |
| `qa_release_engineer` | Terra, high | workspace-write | unabhaengige Tests, Screenshots, Android-/Web-Releasebelege | ab Baseline-QA, kein Deployment |
| `independent_architecture_reviewer` | Sol, high | read-only | Architektur-, Risiko- und Releasegate | G2, G5 und kritische ADRs |

## 3. Reservepool

Reserveprofile stehen bereit, laufen aber niemals automatisch.

| Profil | Modell | Modus | Ausloeser |
|---|---|---|---|
| `incident_debugger` | Sol, high | read-only | schwer reproduzierbarer Fehler, widerspruechliche Logs, Releaseblocker |
| `security_privacy_reviewer` | Sol, high | read-only | Auth, Secrets, externe Datenfluesse, Hilfe-/Standort-/Uebersetzungsrisiken |
| `visual_accessibility_reviewer` | Terra, high | read-only | visuelle Abweichung, Responsive-, Fokus-, Kontrast- oder Reflowproblem |
| `data_migration_specialist` | Terra, high | workspace-write | Schemawechsel, ID-Migration, Backfill oder Content-Uebernahme |
| `documentation_cost_controller` | Luna, medium | workspace-write | grosse Berichtsmenge, Kostenvergleich, Register-/Matrixpflege |
| `spark_micro_task_worker` | Spark, medium | workspace-write | sehr kleine, exakt lokalisierte Routineaenderung mit fertigen Tests |

Weitere Profile duerfen spaeter erstellt werden, wenn ein klarer, wiederkehrender
Auftrag nicht sinnvoll durch ein vorhandenes Profil abgedeckt ist. Ein neues
Profil benoetigt Name, Ausloeser, Rechte, Modell, Nicht-Ziele und Ausgabevertrag.

## 4. Aktivierungsregeln

1. Zuerst Task Brief erstellen.
2. Pruefen, ob ein einzelner Agent genuegt.
3. Read-only-Arbeit darf parallelisiert werden, wenn die Fragestellungen
   unabhaengig sind.
4. Schreibarbeit wird standardmaessig seriell oder in getrennten Worktrees und
   nicht ueber dieselben Dateien ausgefuehrt.
5. Normalbetrieb: ein bis zwei Sub-Agenten. Technisches Maximum: drei.
6. Reserve nur bei dokumentiertem Ausloeser.
7. Jeder Agent muss warten/abbrechen, wenn neue Autorisierung, Deployment,
   Secretzugriff, Loeschung oder wesentliche Scopeausweitung erforderlich wird.

## 5. Routing nach Risiko

| Risiko | Primaer | Unabhaengige Kontrolle |
|---|---|---|
| Datei-/Featureinventar | Spark oder Luna | Main Agent Stichprobe |
| normale UI-/Backendumsetzung | Terra | QA; Sol nur am Gate |
| kleine isolierte Korrektur | Spark | Terra/QA bei Integration |
| Daten-/Schema-Migration | Terra | Sol + QA |
| schwerer unbekannter Fehler | Sol Incident Debugger | zustaendiger Engineer + QA |
| Security/Privacy | Sol | zweiter Sol-/Main-Review bei Blockern |
| Routineberichte/Testlisten | Luna | Main Agent Stichprobe |
| Release Candidate | Terra QA | Sol Reviewer + Product Owner |

## 6. Spark-Nutzung

Spark wird bewusst genutzt fuer:

- gezielte Dateikartierung und Symbolsuche;
- Extraktion in vorbereitete Tabellen;
- kleine UI-/CSS-/Testaufgaben nach exaktem Ticket;
- klar lokalisierte, risikoarme Aenderungen mit fertigen Akzeptanzkriterien.

Spark darf nicht allein Architektur, Security, Datenmigration, produktive
Konfiguration, Signierung oder Releasefreigabe entscheiden.

Ob Spark im Konto tatsaechlich ein getrenntes Kontingent besitzt, wird in der
jeweiligen Codex-Oberflaeche beobachtet; diese Projektregeln behaupten keine
nicht verifizierte Abrechnungszusage.

## 7. Gemini als Zweitmeinung

Das vorhandene Google-AI-Plus-Abo wird zunaechst manuell eingesetzt, nicht ueber
eine neue kostenpflichtige API:

- Screenshotvergleich und visuelle Kritik;
- alternative Architekturlesung eines freigegebenen Dokuments;
- Kontrolle einer klar abgegrenzten Fehlerhypothese.

Uebergabe an Gemini enthaelt keine Secrets, Keystores, privaten Logs oder
unnoetig grosse Repositories. Gemini-Ergebnisse sind Reviewinput und werden von
Codex gegen Quellen, Tests und Projektregeln geprueft.

## 8. Verbindliche Agentenausgabe

Jeder Sub-Agent liefert:

- Auftrag und Scope in einem Satz;
- verwendete Quellen und konkrete Dateipfade;
- Ergebnisse/Feststellungen nach Prioritaet;
- geaenderte Dateien oder ausdruecklich „keine Aenderungen“;
- ausgefuehrte Tests und deren Resultate;
- offene Fragen, Annahmen und Restrisiken;
- empfohlene naechste Aktion, ohne sie ungefragt auszufuehren.
