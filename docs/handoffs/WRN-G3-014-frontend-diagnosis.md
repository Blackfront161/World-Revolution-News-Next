# Handoff – WRN-G3-014 / S11 Frontenddiagnose

28. August 2026; PO-071; incident_debugger Sol/high; keine Kinder.
    Basis `ec0e021`, Produkt `058e156`, Backend `7b449c7`.
    Diagnose abgeschlossen; Produkt P3 bleibt YELLOW. Keine Produktkorrektur.

## Übergabeentscheidung

Der Original-A/B-RED hat eine bewiesene Harnessursache: Das bereits sichtbare
A nach Restore wird als Save-complete missverstanden; der Test wechselt die
Antwortbytes noch während oder sogar vor Save auf B. Mobile bekam gemischtes
A/B und scheiterte später an fehlendem Previous; Website speicherte schon B
und erwartete danach fälschlich B als neuen Kandidaten. Die letzte G3-007-
Sollrevision ist zusätzlich falsch. Geordnetes Save-complete → B → Aktivieren
→ Rollback besteht beidseitig mit echten Default-UI-/Loader-/IDB-Pfaden.

Zwei echte Produktfehler bleiben davon unabhängig:

- **S11-UI-001 / High:** Doppelte Routeguards sowie ausbleibender Wiederanlauf
  nach Busy/Restore halten History und frischen Direktreader dauerhaft in
  Loading trotz erlaubter Runtime. Echte Back-Navigation und echter neuer
  Dokument-Mount sind für beide Clients gesichert.
- **S11-UI-002 / Medium:** Sichtbar angebotene Aktionen werden bei Busy still
  verworfen. Ein Check während Save erhöht das UI-Ticket; Save endet bestätigt
  stored in IDB, die UI behauptet weiterhin „not stored“. Save während eines
  real verzögerten Resume-Guards wird ebenfalls nicht ausgeführt/erklärt.

Clear gegen laufenden Check besteht eng beidseitig: alte Operation aborted,
keine Bundles, Clear-Epoch erhöht, Pending erhalten, keine späte A-/B-Anzeige.
Leere LocalStoragewerte bleiben leer; gefüllte Lesedaten sind damit nicht geprüft.

Die B-Teilfehlerprobe erhält zulässiges A, zeigt aber keinen erklärenden
Operationsfehler im Panel. Der grüne Erhalt ist deshalb kein voller Fehler-UI-
Nachweis. Keine weiteren breiten Flows in S11 nachgeholt.

## Belegindex und Ergebniszahlen

Vollständige Reproduktion, Timeline, Rootcause, Sicherheitsgrenzen und kleinste
Fixgrenzen: [FRONTEND-DIAGNOSIS.md](../evidence/WRN-G3-014/FRONTEND-DIAGNOSIS.md).
Maschinenindex: [summary.json](../evidence/WRN-G3-014/frontend-diagnosis/summary.json).

- Original: 2 RED, unveränderte Bestandsspec, Originaltrace inklusive Bytes.
- Fokus: 12 Proben, 4 PASS / 8 RED, beide echte UIs.
- Enge Beweismethodenbestätigung: 4 RED für echte Back-/Direktmountfälle.
- Null Runnerfehler, null Skips, null beobachtete externe Requests im Fokus,
  null Instrumentierungs-/Browserfehler. Mehrere rote Tests sind dieselben
  zwei Produktfehlergruppen, keine künstlich vervielfachte Findingzahl.

Die eigenen `run-original.mjs`, `run-focused.mjs`, `run-routes.mjs` binden
Node24.19 über process.execPath an die direkte vorhandene Playwright-CLI.
Reports, 22 technische Snapshots und zugehörige Trace/PNG liegen ausschließlich
unter `docs/evidence/WRN-G3-014/frontend-diagnosis/`.

Provenienzhinweis: Ein späteres `--list` überschrieb den JSON-Fokusreport.
Der jetzige `focused-results.json` ist transparent aus vorher gesicherten
Statistiken und dem unveränderten vollständigen `focused-run.json` abgeleitet,
nicht die ursprüngliche Reporterdatei. Roh-Ausgabe, Snapshots, Traces und PNGs
sind vollständig erhalten; der Listingreport zählt nicht als Testlauf.

## Sicherer nächster Auftrag

Chief disponiert genau einen frischen P3-Frontend-Owner. Backendvertrag,
Controller, Store und Loader bleiben read-only. Korrekturgrenze: beide App.tsx
für Operationsbesitz/Busy, lebensdauergebundene Resulttickets und einmalige
Routefreigabe nach aktuellem Guard; enge reaktive Aktions-/Fehlermeldungen und
UI-E2Es. Die zwei Harnessfehler getrennt korrigieren. Keine eigene Safety-/TTL-
Orchestrierung, keine automatische Quellenretry-Politik, Clear-Präemption erhalten.
Danach übriger vorhandener P3-Vertrag und unabhängige QA; kein P3-GREEN aus S11.

Eigene Dateien werden exakt selektiv lokal committed. Chief-Governance und
`.codex-remote-attachments/` bleiben fremd. Commit-ID wird mit der direkten
Chief-Nachricht gebunden. Token-/Kostenverbrauch nicht gemessen. Keine externen
APIs, Installationen, Cloud-/Android-/Releaseaktionen.

## WRN-AGENT-STATUS

- Task: WRN-G3-014 / S11 FRONTEND-DIAGNOSIS.
- Status: Diagnose vollständig; Produkt YELLOW; keine Schreibfortsetzung.
- Erledigt: Original-RED getrennt erklärt, zwei reproduzierbare Produktgruppen,
  enge Clear-Kontrolle, dauerhafte Evidence/Handoff.
- Offen: allein Chief-Disposition und nachfolgende P3-Korrektur/QA.
- END-CHECK: :)
