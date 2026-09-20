# WRN-G3-015 – kohaerente P2-Kernvervollstaendigung

Chief-Disposition 28. August 2026: S3-H-001/002 mit zwei echten REDs und null
Harnesserrors bestaetigt; kanonischer Bericht/Rohreport vom Chief gelesen.
Start nach gesichertem S3-Ergebnis/Ende, gebunden im Register. Elternauftrag
bleibt PO-074, B1–B4 und BACKEND-PACKET unveraendert.

Der fuenfstufige kleinste Wiederaufnahmeplan in
`../evidence/WRN-G3-015/diagnosis/CORE-DIAGNOSIS.md` wird hier verbindlich:
gemeinsame streng validierte bounded Control-/Messageform und Transitionen;
Ready je Generation/geschuetzte Retention; getrennte epoch-/jobgebundene native
Operationen; nicht erzeugende Reads und quieszente Writes/Recovery;
vollstaendige Defaultplattform mit Beobachtung/Dispose. Keine neue ADR.
Kanonischer RED `run-p55U0d/raw-report.json` SHA256
`c200b2f5e17f6653e690da7aa2bb998db701cc957fac0b9ba27f19be02eb8ee3`.
Der historische Diagnoseharness nutzt fuer D02 noch D01s unrechtmaessigen
Aufbau; nicht einfach dessen zwei Summen nach Fix als GREEN umdeuten. Dauerhafte
neue Regression trennt missing-Ablehnung von legal autorisiertem A/B-Aufbau.

## Routing und Eigentum

Fuer den belegten kritischen Control-/Generations-/Jobbereich ist genau ein
frischer `worker` als fachlicher Backendowner mit `gpt-5.6-sol` / high vorgesehen.
Risikogrund: unvollstaendige gemeinsame Kontrollstruktur, fehlende durable
Enablebarriere und Koppelung alter Clients an wartende Generation; vier direkte
Proben deckten den eigentlichen Integrationsvertrag nicht ab. Kein allgemeiner
Modellwechsel oder externes APIbudget. Kein Urteil aus Chatlaenge/Marker.

Einziger Produktwriter im unveraenderten BACKEND-PACKET-Dateiscope, keine Kinder.
Interne kohaerente Neuordnung innerhalb `apps/website/src/offline-shell/**`
ist erlaubt, soweit die S3-Diagnose sie benoetigt. Keine Files/History loeschen,
keine schlechteren Assertions oder geheimen Test-only-Schalter in Releasecode.
S2-Checkpoint/RED-Zusammenfassung und S3-Rohbelege bleiben unveraendert.
Eigene Evidence `docs/evidence/WRN-G3-015/completion/**` und Handoff
`docs/handoffs/WRN-G3-015-core-completion.md`. Chief schreibt nur Governance.
Du bist nicht allein, fremde Änderungen/Attachments nicht anfassen/stagen.

## Verbindliche Reihenfolge

1. S3-Ergebnis/Quellen/rohe Diagnose lesen; zwei Red-Sollablaeufe am unveraenderten
   Kandidaten nachvollziehen und als dauerhafte Regressionen binden. Keine
   Rueckkehr zu bloßem Mock-PASS. Dokumentierte weitere Contractluecken in
   konkrete rote Solltests ueberfuehren, bevor ihre Implementierung erfolgt.
2. Gemeinsamen validierten Control-/Generations-/Registrationjobvertrag auf
   Basis S3 vervollstaendigen. Missing/malformed/unknown/disabled eindeutig,
   bounded Generationen/Metadaten, alte Operationen per Epoch gefenced.
   Window und Worker nicht mit verschiedenen JSON-Annahmen betreiben.
3. Vollstaendigen Install/Ready/Waiting/Fetch/Activate/Cleanup-/Rollbackpfad und
   Defaultbrowseradapter sauber verbinden. B1–B4/S3-Grenzen sind bindend;
   Daten-/Safetyentscheidungen verbleiben unveraendert in G3-014.
4. Alle P2-SHELL-Kernablaeufe real belegen und Handoff integrieren. P2-GREEN
   erst nach kompletter Kernmatrix, nicht nach zwei geschlossenen Findings.

Ein erster gesicherter Zwischencheckpoint nach gemeinsamen Contracttests und
mindestens einer echten Defaultadapterprobe; bei ~45 Minuten belastbaren
Stand/Rest melden, bei sinnvollem Fortschritt weiter. Zwei erfolglose gleichartige
Fixrunden oder neue notwendige Garantie/Scopegrenze -> Chief. Keine stille
Garantieabschwaechung, neuer Provider, Root-/Dependencyumbau oder Produktentscheidung.

## Was die frischen Belege enthalten muessen

- Tests nennen fachliche Invarianten, nicht nur `#root` ist nicht leer.
  Builtwebsite + echten bestehenden G3-014-Inhalts-Save, echten ganzen
  Browserneustart offline, Root/Hash/Queryreader mit bekannten Artikelassertions.
- Defaultadapter, nicht direkte register-Abkuerzung, prueft Enable, Update,
  Entfernen, Wiederanlauf. S2-Direktproben bleiben als Workerunitintegration
  erlaubt; ihr Harness darf vor direkter Registration gueltiges Test-Opt-in
  setzen, aber Produktionsinstall darf fehlende Enableerlaubnis nie erfinden.
- P/A/B-waiting/C-Block, B-Aktivierung mit A-Rollbackschutz, lokaler kompletter
  G3-015-Paketrollback, Abbruch vor/nach Ready/waehrend Activate, fehlendes GC.
- WebLock/Cacheopen/put/delete und native Jobqueues, späte Ergebnisse,
  durable removing/Restart; keine Nachfuellung nach wahrheitsgemaesser Entfernung.
  Ungewisser Abschluss pending, nicht Erfolg. Alter Controller kann bis zum
  Schliessen bestehen; identische neu ausdrücklich erlaubte Shellbytes nicht
  mit unerlaubter Wiederfreigabe alter Schreiboperationen verwechseln.
- Malformed/unknown Control, foreignRegistration/Cache, Quota/Netz/Bodytimeout,
  harte Bytes/Metadaten/Slots, gespeicherte/private Content/Safety unveraendert.
- Keine fremden/SEO/unknown/Content-/Safetyantworten oder Querypersistenz;
  klare API-/Dispose-/Subscriptions- und Stale-Result-Semantik fuer P3.
- Generator/Graph/Workerfassung deterministisch, keine nur passend behauptete
  Versionsnummer. Neue Generatortests dauerhaft im vorhandenen Testpfad.
  Bestehende Hartcode-Assetnamen nur durch manifestgebundene Erwartungen ersetzen,
  nicht durch lockere `enthaelt irgendeine Datei`-Assertions.
- Exakte vorhandene Toolchain, alle statischen/Unit-/Build-/Releasegates,
  volle vorhandene Rootbrowsermatrix mit zwei Workern plus neue isolierte
  Kernmatrix. Tests/Coveragegrenzen transparent, Rohberichte nicht ueberschreiben.

P3 bleibt gesperrt bis Chief API/Belege/Handoff uebernommen hat und Instanz
beendet ist. Frontend bekommt fertige beobachtbare Zustaende, keine versteckte
Storage-/Epochverantwortung. Danach noch unabh. Security/QA/Architektur und
Sichtabnahme; P2 ist weder gesamtes Paket noch Release.

## Enge Re-enable-Disposition im laufenden S4

Der erste Zusatzlauf `completion/matrix-bVT52g/raw-report.json` meldet neben
getrennt dokumentierten Harnessfehlern eine fehlgeschlagene Wiederbereitstellung:
nach unregister bei noch kontrolliertem Tab kann dieselbe native Workerfassung
ohne neues install wiederverwendet werden; die neue Epoch hat dann keine Bytes.
Chief bestaetigt am 28.08.2026 die vom Owner vorgeschlagene enge Schliessung
innerhalb PO-074/B4, ohne neuen Produkt-/Storagebereich:

- Eine streng validierte prepare-Nachricht darf nur den aktuell persistierten,
  expliziten register-Job abschliessen: exakte Epoch, Jobticket, Same-Origin-
  Window und eingebettete Worker-/Manifestidentitaet.
- Keine freien URLs/Cachenamen; keine Bereitstellung aus Observe/Mount und
  kein Uebertragen alter Installauftraege in neue Epochs. Dieselbe gepruefte
  Aufbauimplementierung bleibt unter dem gemeinsamen Lock.
- Negative Proben fuer altes Ticket, falsche Epoch, fehlenden pendingJob und
  Remove-vs-prepare; positive echte Default-Re-enable-Probe erforderlich.
- Zwei separat mit Deferred-Units gemeldete Adapter-REDs (Doppelaktion/Dispose
  waehrend Initialobserve und Refresh verdrängt Operationspublikation) werden
  vor engen Lifecyclekorrekturen roh gesichert. Keine UI-Verantwortungsverlagerung.

Dies ist eine Implementierungsdisposition, keine Schliessung dieser Befunde
oder P2-Freigabe. Die gesamte bisherige Kernmatrix bleibt verbindlich.

## Enge Build-Paritaetsdisposition vor P3

S4 meldet auf Produkt-/Testcheckpoint `b062ab7` zwei verschiedene Built-
Artefaktketten: regulare CLI-Website 1.841.533 Bytes, bestehender direkter
Globalsetup-Build 2.058.534 Bytes. Der Globalsetup startet vorher den mobilen
Vite-Devserver im gleichen Nodeprozess. Die damaligen Quell-/Reporthashes
bleiben getrennt, keine nachtraegliche Gleichheitsbehauptung.

Chief disponiert innerhalb des bereits erlaubten global-setup-Buildscopes:

1. Enge rote Byte-/Manifestparitaetsprobe und konkrete Prozess-/Buildmodus-
   Ursache sichern; nur benoetigte NODE_ENV-/Moduswerte, keine Env-Dumps.
2. Websitebuild vom Devprozess isolieren, bevorzugt vorhandene Vite-CLI in
   eigenem Nodeprozess mit explizitem NODE_ENV=production. Unveraenderter
   Publisher/Generator und strikter statischer Server bleiben erhalten.
   Kein globales Umschalten der Mobile-/Source-Devumgebung, keine Rootconfig,
   Dependencies, Produkt-/Contentlogik oder abgeschwaechten Assertions.
3. Root-Builtmanifest und regulaere CLI-Ausgabe muessen byteidentisch
   belegt werden. Danach neuer gesicherter Testcheckpoint und vollstaendige
   frische Gates/Rootmatrix mit aktuellen Hashbindungen, bevor P3 beginnt.

Diese Testaufbaukorrektur konkretisiert den bestehenden B1-Buildvertrag und
verhindert eine mehrdeutige Source-/Production-Grenze fuer das neue Panel.
Sie ist keine neue Produktarchitektur oder Ruecknahme historischer Abnahmen.

END-CHECK: :)
