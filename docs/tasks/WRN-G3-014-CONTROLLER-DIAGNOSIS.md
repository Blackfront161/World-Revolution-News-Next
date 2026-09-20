# WRN-G3-014 – begrenzte Controller-Diagnose

PO-071, Chief-Disposition nach wiederholt unvollstaendigem S6-Zwischenstand.
Keine neue Funktion. P2-L/S bleiben gesichert; kein P3. Erst nach beendetem
S6 genau ein frischer `incident_debugger` (Sol/high), keine Kinder.

## Grund und Ziel

Die erste API-Oberflaechenprobe deckte nur Methodennamen ab. Die anschliessenden
vier Browser-PASS in `9e589b7` verwenden echte IDB, injizieren aber fertige
`check()`-Ergebnisse. Sie sind keine Default-Loader-/Controllerintegration.
Trotz Chief-Praezisierung bleiben Sessionguard, vollstaendige aktive/Kandidat/
Vorher-Metadaten, zulaessige Aktionen und die gesamtheitliche Abbruchgrenze
unvollstaendig. Weitere Teil-PASS ersetzen diese Pflicht nicht. Die Diagnose
soll einen kleinen eindeutigen Abschlussvertrag liefern, keinen Redesignplan.

## Besitz

Produkt-, Vertrags-, Test-, Konfigurations- und Altdaten strikt read-only.
Schreiben nur `docs/evidence/WRN-G3-014/CONTROLLER-DIAGNOSIS.md`, enges
reproduzierbares Diagnoseharness unter
`docs/evidence/WRN-G3-014/controller-diagnosis/` und
`docs/handoffs/WRN-G3-014-controller-diagnosis.md`.
Keine Korrektur, neuen Dependencies, Live-/Remote-/Android-/Releaseaktionen.
Nur isolierte lokale Browserkontexte, vorhandene Testtoolchain verwenden.

## Begrenzte Pruefung

1. Auf dem letzten S6-Checkpoint die kleinsten stabilen fehlgeschlagenen
   Aufrufsequenzen fuer Erststart -> Readerguard, A -> B check -> Guard,
   Save-Wiederholung und C -> Clear -> Restore ermitteln. UI nicht anfassen.
2. API-Datenfluss pruefen: jeder P3-Aufruf muss EINEN vollstaendigen aktiven
   Zustand liefern koennen; kein B-Runtimewechsel beim Staging, keine von
   React rekonstruierte Safety oder faelschlich verfuegbare Rollbackaktion.
3. Gesamte Restore-/Check-/Clear-/Disposegrenze einschliesslich ignorierter
   Abbruchsignale, spaeter open-Ergebnisse und Session-Safety untersuchen.
   Bereits gesicherte Storeprimitive nicht neu auditieren; konkrete echte
   Unterbaufehler gesondert melden statt gesamten Umfang zu wiederholen.
4. Genau benennen, welche aktuellen Belege reine injizierte Unit-/Storeflows
   sind und welche echten Default-Loader-/Controllerflows noch fehlen.
5. Minimalen implementierbaren Abschlussvorschlag mit verpflichtenden
   Ergebnisfeldern, Guard-/Session-/Candidate-Semantik und hoechstens zwei
   klar begrenzten sequenziellen Schreibauftraegen liefern. Keine neue
   Produktpolitik oder Paketarchitektur; bestehende Pflichten unveraendert.

Chief-Codebefunde sind Pruefansatz, keine behaupteten roten Runtimebelege.
Aktuelle Entwuerfe liefern im `check` Kandidatenmetadaten ohne aktiven
Snapshot, harte Aktionsarrays auch ohne vorhandenen Vorherstand, und
`restore` benutzt einen nackten Floor-0-Loader ausserhalb `run`. Die Ursache
fuer verfruehte GREEN-Naehe ist gegen Code UND tatsaechliche Tests zu pruefen.

## Abbruch und Uebergabe

Eine fokussierte Diagnose, keine Vollrepoanalyse oder iterative Fixarbeit.
Bei einer noetigen neuen Produktentscheidung an Chief melden. Bericht nennt
Checkpoint, genaue reproduzierte Sequenzen, vorhandene sichere Teilbelege,
kleinsten Abschlussweg und verbleibende Cb-/Transportpfade. Kein P2-GREEN.
Nur eigene Evidence/Handoff lokal committen, danach Instanz beenden.

END-CHECK: :)
