# WRN-G3-015 – Unabhaengige Abschlussgates

Stand: 29. August 2026. Historischer Gatebrief; alle vorgesehenen Reviews
wurden inzwischen beendet. P4-Q, P4-S und P4-A sind GREEN. Produktkandidat
`1dc087f3b3c9a73330f2481b3c2c444548eb00d6` ist technisch zur lokalen
PO-Sichtabnahme bereit. Keine Live-/Hosting-/Android-/Releasefreigabe.
Elternauftrag PO-074, Vertrag WEBSITE-OFFLINE-SHELL B1–B4/SHELL-01–12.
Chief bindet vor jedem Start genauen Produkt-/Test-/Evidencecommit und Slot.
Vorbedingung: P2 und P3 samt Sprachhelfer vollstaendig gesichert und beendet.
Alle Reviews direkt an Main/Chief, nacheinander; keine Kinder/Selbstkorrektur.

## P4-S – Security/Privacy

Frischer `security_privacy_reviewer` Sol/high, fokussierter Produktdiff seit
G3-014-Kandidat `44b5cb18b89bffc178312cee39f87175ee39a4d4`.
Kein allgemeiner Legacy-/Vollreponeustart. Eigene
`docs/evidence/WRN-G3-015/security/**` und Securityhandoff schreibbar, Produkt/
Tests/fremde Evidence read-only. Anwendbaren Security-Diff-Skill vor Review
laden; aktuelle Quellen und Tests sind Belege, nicht Implementiererzusagen.

Pruefziele: SWscope/Ownership, strikte URL-/Manifest-/MIME-/SHA-Grenzen,
keine Content/Safety/SEO-Antwort/Querypersistenz, bounded Storage/Netz,
Messageorigin/Source/Epoch/Jobvalidierung, fremde und Unknownschemas geschuetzt,
Remove/Restart/latewrites/Registrationjobs, opt-in und kein Dev-/Mobile-SW.
Erstbefunde konkret source-/ablaufgebunden, Unsicherheit als solche.
Kein Fix/Loeschen/Migrieren des Kandidaten oder Userprofils.

Der Security-Diff-Workflow inventarisiert den exakten ganzen Git-Diff. Alle
Inventarseiten/Dateien muessen nachvollziehbar disponiert werden, auch geloeschte
Dateien am Baselinecommit. Der fachliche Threat-Scope bleibt dieses Paket.
Historische rohe RED-Belege enthalten absichtlich alte generierte Worker und
synthetische/built Testpakete. Diese nicht als aktuellen Releasecode oder neues
Produktfinding ausgeben: Herkunft, Hash-/Generatorbindung und tatsaechlichen
Build-/Servingpfad pruefen. Gleichartige unveraenderte Kopien duerfen mit
konkreter Herkunfts-/Nicht-Runtimebegrenzung gruppiert dokumentiert werden,
nicht pauschal ohne Inventarpruefung uebergangen werden. Aktueller Generator,
Protokoll, Worker, Defaultadapter, UI, Tests und relevante Paket-/Buildgrenzen
bleiben vollstaendig in der fachlichen Pruefung. Keine erneute Legacyanalyse.

## P4-Q – Frische unabhaengige Gesamt-QA

Frischer `qa_release_engineer` Terra/high nach gesichertem Securityende und
Disposition allfaelliger Findings. Eigene `docs/evidence/WRN-G3-015/qa/**` und
QA-Handoff schreibbar. Produkt/Bestandstests bleiben unveraendert; eigene
read-only Probescripts/Belege in eigener Evidence. Bestehende Testausgaben
nicht als eigene Runs ausgeben oder historische RED-Rohberichte ueberschreiben.

Ausgabepfad-Praezisierung: Der unveraenderte Root-Coretest erzeugt mit
`mkdtemp` neue Runverzeichnisse unter `docs/evidence/WRN-G3-015/completion/`.
Diese ausschliesslich neu angelegten automatischen Testartefakte sind fuer
die beauftragte Vollmatrix erlaubt; historische Dateien, Scripts, Indizes
und Handoffs dort bleiben read-only. QA bindet nur ihre frisch erzeugten
Runpfade und Hashes an den eigenen Rootreport/QA-Index. Keine Produkt- oder
Harnessaenderung zur Umleitung. Alle eigenen Probescripts und sonstigen
Reports/Screenshots bleiben unter `qa/`, vor dem Start eindeutige Runpfade.
Stdout/stderr, maschinenlesbarer Report, Exitcode, Quellen vor/nach Lauf
und Bildhashes dauerhaft sichern, auch bei fehlgeschlagenen Versuchen.

Konkrete P3-Lehren fuer die unabhaengige Probe: Sprach-/Themen-/Viewport- und
Fontzustand vor dem Bild assertieren; Initialreflow vor Mount von Reflow nach
stabilem Normalmount trennen. Panel UND Dialog auf Axe, Fokus/Tab/ShiftTab/
Escape, erreichbare Aktionen, Overflow und Zielgroesse pruefen. Ein direkter
Control-/Register-Testaufbau belegt keinen Opt-in ueber die Produkt-UI.
SourceDev-Schutz anhand Register-/Storage-Aufrufen nach Settlement messen,
nicht anhand einer kurzzeitig noch leeren Registrierungsliste. Verlorene
historische Rohbelege und erst nach einem Fix ausgefuehrte Baselineproben
ehrlich kennzeichnen; nicht als damaliges Test-first-RED rekonstruieren.

- Exakte vorhandene Toolchain. Toolchain, Format, Lint/19 bisherige Boundaries,
  alle tatsaechlichen Typechecks, Fixture-/Brandgrenzen, gesamte Unitmatrix,
  beide Builds, Releaseboundary. Neue Generator-/Workertypechecks mit erfassen.
  Kein historisches `check` reparieren. Tatsächliche neue Anzahlen berichten.
- Ganze Rootbrowsermatrix, Default zwei Worker/seven projects, plus isolierte
  neue Built-Shellmatrix. Auslassungen nicht in PASS umdeuten. Neuer Versuch
  mit eigenen Pfaden bei Umweltproblem, Rohfehler/Wirkung dokumentieren.
- Jeden SHELL-01–12-Punkt mit konkreter Testassertion und Report verbinden;
  mock/unit/echter Browser/echter Restart sauber unterscheiden. Extra eigene
  Benutzerfolge unabhaengig von den Implementiererscreenshots ausfuehren.
- Echter kompletter Prozessneustart mit gleichem kurzen isolierten Profil
  und gesperrtem gesamten Netz, kein HTTP-Cachebeleg als SW-Ersatz. Root,
  Hash/Queryreader, gespeicherte/fehlende/gesperrte Inhalte sicher unveraendert.
- A/B alte Tabs, waiting/C-Slot, automatische Aktivierung nach Clientschluss,
  kompatibler Paketrollback, fruehe/spaete Unterbrechung, Fehler/Quote/Timeout,
  durable removing/Wiederanlauf und spaete Jobs/Cachewrites. Eigene API-
  Fehlerbarrieren nur als solche benennen, keine reale Diskfullbehauptung.
- G3-014-IDB/Safety, Readingstate, Theme/Sprache und fremde Sentinels bleiben
  unveraendert; keine unbekannten Caches/Registrierungen/Marker mitloeschen.
- Neun Sprachen, alle Websiteviewports/Querformate nach Quality Rules, hell/
  dunkel/weitere relevante Themes, 200% initial und nach Mount, Tastatur/Fokus,
  Axe, 44-Pixel-Ziele, Overflow, Konsole, Requests, no new side effects.
- Screenshots eindeutig mit Kandidat/Datum/Viewport/Sprache/Theme/Generation,
  SHA256 von Produktquellen und Report/Bildern, maschinenlesbare Summen.

## P4-A – Gezielter Architekturabschluss

Frischer `independent_architecture_reviewer` Sol/high nach QA/Ende. Nur
aktueller Produktdiff, B1–B4/SHELL-Belege und API-/UI-/Pilot-Handoffs; keine
weitere Vollanalyse. Eigene architecture-Evidence/Handoff schreiben.
Prueft getrennte Verantwortungen, Built-/Manifestgeschlossenheit, fehlende
Runtime-/Datenkopplung, Crash-/Zeit-/Lifecycle-/Removegarantien anhand echter
Belege, ehrliche Budget-/Rollbackgrenze und offene Fragen. Kein eigener Fix.

## Finding-Disposition und sichtbare Uebergabe

Chief disponiert reproduzierte enge Vertragsfehler innerhalb PO-074; zuerst
Test/Diagnose, dann genau ein benannter Schreiber, danach frische unabhaengige
Nachpruefung/bei Kernmutation erneute Gesamtabdeckung. Keine Stillfreigabe von
Mediums oder abgeschwaechten Zusagen. Neue ADR-/Privacy-/Datenverlust-/Kosten-
Entscheidungen erfordern PO. Reviewer erteilen keine Release-/Produktabnahme.

Nach technischem GREEN und allen Enden: Chief uebernimmt Hashbindungen,
schliesst Register/Pilotauswertung, kurzer Continuity-Audit, lokale
PO-ACCEPTANCE.md mit konkretem visuellen Ablauf und Grenzen. App/Website-
Livebetrieb, Androidpaketierung, Signierung, Cloud/Remote/CI/Upload bleiben
gesperrt. Finale Buttonfeinheiten bleiben UX-POLISH-001, keine jetzige Mutation.

END-CHECK: :)
