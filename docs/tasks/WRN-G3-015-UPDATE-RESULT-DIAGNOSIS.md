# WRN-G3-015 – gezielte Diagnose falscher Update-Ergebnisse

28.08.2026, Chief-Disposition innerhalb PO-074. Genau ein frischer
`incident_debugger` Sol/high nach gesichertem S6-Ende. Keine Kinder.
P2-Abschlussfreigabe wieder offen, P3 YELLOW; kein Produktfix hier.

## Konkrete Frage und Belege

Ein fehlgeschlagenes Update liefert gelegentlich `active` statt des
vertraglichen `error`, obwohl die alte Generation weiter korrekt erhalten
bleibt. Noch nicht geklaert: Produkt-/Plattformrace, Testinterferenz oder
falsche Beobachtung. Keine unbewiesene Schuldzuweisung an Node oder UI.

- Unveraenderter Coretest `tests/e2e/website-shell-core-matrix.mjs`, Schleife
  hash/mime/404/redirect/body-timeout, direkte Rueckgabe von shell.update().
- Alter Rootlauf: `completion/matrix-cDTMCQ/raw-report.json`, Node24.16.0,
 32PASS/einfalscher Bodytimeout-Ergebnisstatus. Erhaltene echte Rootreste in
 `chief-p3-preservation-20260828-1332/`; abweichende alte Kopien werden in
 CHIEF-P3-HANDOFF-CHECK.md disponiert.
- Neue exakte24.19-Probe: `p3-final/runs/core-16012-1787916883542/`, Exit1;
 companion `completion/matrix-KhPKHo/raw-report.json`,32PASS/einfalscher
 Redirect-Ergebnisstatus; Bodytimeout diesmal korrekt.
 SHA256: DAB45CFA0372FD404C0B6BA6DB9D94A77F230F329059753C63643E564E025CDA.
 Chief bestaetigte13Quellen vor/nach/aktuell identisch. Keine Kernmutation.
- Historischer P2-Schluss b062ab7/5ede03d/7256d6a bestand dieselbe Matrix.
 Das alte GREEN darf die neue Abweichung nicht ueberstimmen.

## Eigentum und Grenzen

Produkt, aktuelle Tests und alte Evidenz strikt read-only. Schreiben nur
eigene neue `docs/evidence/WRN-G3-015/update-result-diagnosis/**` und
`docs/handoffs/WRN-G3-015-update-result-diagnosis.md`. Chief besitzt Governance.
Du bist nicht allein im Repository; fremde Aenderungen nicht revertieren/stagen.
Keine Repo-/Legacyvollanalyse, UI-Umbauten, Dependencies/Installationen,
Live-/Cloud-/Remote-/CI-/Android-/Releaseaktionen oder neue APIkosten.
Nicht userseitige Browserprofile/Registrierungen/Caches lesen oder aendern.

Normale neue mkdtemp-Ausgaben bestehender Coretests unter completion/ sind
als neue Testartefakte erlaubt; alte Dateien dort niemals ueberschreiben.
Eigene Instrumentierung nur in eigenen Probescripts/isolierten Testkopien,
keine temporaere Mutation der echten Produktdateien oder Bestandstests.

## Arbeitsfolge

1. Kurzer Quellen-/Scopeabgleich; nur Adapter, Browserplattform, relevante
   Protokoll-/Workerpfade, aktuelle Matrix/Helper und noetige APIvertraege.
   Erklaere, was direkt gemessen wird und welche Hypothesen noch offen sind.
2. Sichere instrumentierte reale Defaultadapterprobe im isolierten Browser.
   Primaer schneller Redirectpfad, Bodytimeout nur falls zur Unterscheidung
   noetig. Rueckgabewert versus spaeterer Snapshot, Zeitfolge der Nativejobs,
   install/updatefound/redundant-Zustaende, Control/Ready/Jobidentitaet und
   Observations-/Cleanupreihenfolge getrennt erfassen.
3. Nicht nur immer wieder die ganze33erMatrix ausfuehren. Maximal drei
   Hypothesenrunden mit je klarer neuer Aussage; initial hoechstens zwoelf
   schnelle Redirectwiederholungen, Timeout hoechstens drei. Bei fehlender
   Erkenntnis vorhandene Belege/Unsicherheit sichern und Chief melden.
4. Wenn reproduzierbar, moeglichst deterministische enge Reihenfolge/Barriere
   isoliert belegen. Injektionen offen benennen, nicht als uninstrumentierte
   Browsernatur ausgeben. Failing-Sollassertion vor jeder spaeteren Korrektur.
5. Ursache, konkrete Quellstellen, minimale Korrekturgrenze, alternative
   Erklaerungen und erforderliche Regressionen an Chief. Kein eigener Fix,
   kein Abschwaechen der Sollassertion zur Erzielung von GREEN.

Ein plausibler Pfad allein ist noch keine bewiesene Ursache. Insbesondere
pruefen, ob eine Observation die Operationsrueckgabe mit altem active ersetzt
oder ob der Test eine legitime andere Situation ausloest; nichts vorwegnehmen.
Alte Inhalte bleiben laut vorliegenden32Checks erhalten; Datenverlust nicht
behaupten, wenn nur falsche Ergebnisprojektion nachgewiesen ist.

## Nachweise, Runtime und Ende

Exakte Node24.19.0:
`C:/Users/patri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`.
Nodebin vor PATH, pnpm11.19 nur ueber passende node_modules/pnpm/bin/pnpm.mjs;
verify-deps/error, GlobalVirtualStore=false, keine Installation.
Jeder Lauf VOR Start eindeutiger dauerhafter Ordner, Command/Runtime/
Quellhashes, danach stdout/stderr/JSON/Exitcode und Vor-/Nachhashes. Bei
verlorener Toolsession Ergebnisse aus echten Dateien, niemals rekonstruieren.
Originalrohdaten bytegenau kopieren, nicht mit Escaping neu tippen.

Testbrowser ausschliesslich isoliert; Browser-Skill fuer erforderliche
Browserarbeit beachten. Vorhandene dokumentierte Playwright-Testharness-
Faehigkeit fuer echte separate Prozesse nutzen, keine Nutzerbrowsermigration.
Gesicherter Diagnosebericht, konkrete Rohbelege/Handoff, exakter Folgecommit,
danach Instanzende. Erst Chief disponiert engste Korrektur und frische Tests.

END-CHECK: :)
