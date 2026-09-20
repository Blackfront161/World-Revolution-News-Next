# Agent Handoff – WRN-G3-014 Controller-Diagnose

- Rolle: `incident_debugger`, Helfer `/root/g3014_controller_diagnosis`.
- Auftrag/Slot: PO-071, CONTROLLER-DIAGNOSIS-Brief, S7 durch Chief.
- Basis: `aa3f5b1758325e6095791ebed736c3fdca52645e`; Produkt `5e7c0da`.
- Branch: `codex/g3-014-content-offline-transactions`, Hauptcheckout.
- Ergebnis: Diagnose abgeschlossen, **P2 weiterhin YELLOW, kein P3**.
- Kinder: keine. Keine Produkt-/Test-/Contract-/Konfigurationskorrektur.
- Geschrieben: nur Diagnosebericht, enges Evidenceharness/Rohreports und
  dieser Handoff. Chief-Governance und Remoteattachments unangetastet.

## Gesicherte Befunde

1. **Safetybypass:** A speichern -> echtes C mit gueltiger Safety und falschem
   Supplementalhash -> Floor 2/Pruning -> Clear -> A-Restore liefert den
   bekannten widerrufenen Artikel wieder. Gleiche und neue Controllerinstanz,
   beide Clients. Store-Clear/Ledger sind korrekt; nackter Restoreloader falsch.
2. **Neue enge Unterbauursache:** `sameContentOfflineSafetyLedger` vergleicht
   `JSON.stringify(entries)`; kanonische Property-Umordnung gleicher Fakten
   wird bei gleichem Floor als Konflikt abgelehnt. Direkter D09-Beleg plus echte
   Defaultloader A->A und A->B: Safety null, Pending bleibt, kein Staging.
3. **Operationsfence:** Defaultrestore liefert nach Dispose oder Clear eine
   spaete Runtime und besitzt keinen Busy-Slot. Mit ausdruecklich injiziertem
   ignoriertem Fetchabort settled der Check auch nach 16 s/Dispose nicht.
4. **Session/Projektion:** Erstrestore und IDB-aus-Restore laden A korrekt
   sitzungsweise, Guard/Resume verlieren den Stand. Isolierter Checkzweig staged
   B korrekt, liefert aber keinen A-Snapshot und bietet Rollback ohne Vorherstand.

Wichtig: `repeatedSave` funktioniert im injizierten Controller-/Storepfad
bereits. Sein echter Defaultfehler ist die vorgelagerte Equalitygrenze.
Eine Korrektur nur des Controllers wuerde diesen Fehler nicht schliessen.

## Beleg und Wiederholung

`docs/evidence/WRN-G3-014/CONTROLLER-DIAGNOSIS.md` enthaelt genaue Reproduktion,
Codeorte, Soll/Ist, Timeline, Pflichtfelder und die noch fehlende Cb-/Transportmatrix.
Unter `controller-diagnosis/` stehen der importierbare Evidence-Test, eigene
Runnerkonfiguration, zwei unveraenderte JSON-Rohreports und ein lesender Decoder.

Gesicherter Gesamtlauf D01–D10: 20 RED in 30,904 s (`runtime-run.json`).
Zusaetzlich diskriminierende D09/D10: 4 RED in 3,420 s. Jeweils beide Clients,
0 Skips/Flaky/Runnerfehler. Alle Beobachtungen: 0 externe Requests und 0 Pageerrors.
RED gegen Sollassertions ist hier der
Diagnosebeleg, kein erfolgreich bestandener Produkt- oder QA-Lauf.

D01–D07 verwenden Defaultloader/Store mit echten gerouteten Fixturebytes;
D08 injiziert nur Nichtkooperation von Fetch, D09 ist direkte Equality plus
Defaultloader, D10 injiziert `check()` ausschliesslich zur Ursachenisolation.
Die Website wurde im getrennten Quellharness untersucht, nicht visuell abgenommen.

## Genau zwei empfohlene sequenzielle Schreibpakete

1. **Safety-Equality:** Backend/Data, enger Bereich
   `packages/content-contracts/src/index.ts` samt Contracttests und externer
   Defaultloaderregression. Propertyreihenfolge darf keine neue Autoritaet sein;
   echte Konflikte/fehlende Sperren/niedrigere Floors bleiben verboten.
   Pflicht: D09 GREEN, Default-A-Recheck und B-Staging erreichen ihre echten
   Pfade; kein injiziertes `check()` als Integrationsersatz.
2. **Controllerabschluss:** frischer Backend/Data nach gesichertem Paket 1;
   beide Controller/Tests, externe E2E, enge bereits gebundene Loader-Abbrueche.
   Chief muss zusaetzlich beide `content-offline-store.ts` **nur fuer eine
   revalidierte Kandidat-/Vorher-Metadaten-Leseprojektion** schriftlich uebertragen:
   bestehendes Snapshot exportiert keine Revisionen. Keine persistente
   Formataenderung, kein Store-Neubau, keine React-IDB-Orchestrierung.
   Pflicht: vollstaendige Ergebnisfelder/Sessionguard, D01–D08 Defaultpfade,
   A/B/C+Activate/Rollback und Cb-/Transportmatrix laut Bericht. Null neue
   Produktrechte oder Architekturentscheidungen.

Die Paketempfehlung ist keine Selbstfreigabe. Chief disponiert Eigentum und
Handoffs; unabhaengige QA/Review und sichtbare PO-Abnahme bleiben erforderlich.
Keine Android-, Cloud-, Remote-, Deployment-, Release- oder Liveaktionen.

## WRN-AGENT-STATUS

- Task: WRN-G3-014 / S7 Controller-Diagnose.
- Status: beendet, zur Chief-Disposition; keine P2-/P3-Freigabe.
- Offen: exakt die zwei empfohlenen Abschlussauftraege und anschliessender
  Chief-Gesamtabgleich; UI-/Visual-QA unveraendert spaeter.
- Token/Kosten: unbekannt, keine kostenpflichtigen externen Aufrufe.
- END-CHECK: :)
