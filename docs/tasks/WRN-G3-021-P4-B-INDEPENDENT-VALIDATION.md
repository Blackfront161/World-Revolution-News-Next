# G3-021 P4-B – unabhängige Abschlussprüfung

Status: AKTIV nach separatem Commit dieses Nachtrags. Writer beendet,
Kandidat `03025f6dda91d3e23b9ccf0ee56be036a86cb52f` eingefroren; eigene
Chief-Reproduktion ist in P4-B-CHIEF-REPRODUCTION.md vollständig GREEN.
Grundlage: Zwölfpfadgate `0f52389` und ursprünglicher UI-Vertrag §5–§9.
Dieser Ausführungsplan ergänzt keine Produktsemantik oder Freigabehürde.

## Rollen und Besitz

Delegation: erlaubt. Chief vergibt zentral zwei Slots nach Writerende.
Keine Kinder, kein Git-Index, keine Produkt- oder Testwrites. Der konkrete Kandidatencommit steht im aktuellen Kopf.
Fremde Änderungen bleiben erhalten. Beide berichten unabhängig an Chief.

- Frischer `qa_release_engineer`, Terra/high: eigener Beleg
  `docs/evidence/WRN-G3-021/P4-B-INDEPENDENT-QA.md` und Handoff
  `docs/handoffs/WRN-G3-021-p4-b-independent-qa.md`. Exklusiver Browserbesitz.
- Frischer `independent_architecture_reviewer`, Sol/high: eigener Beleg
  `docs/evidence/WRN-G3-021/P4-B-INTEGRITY-ARCHITECTURE.md` und Handoff
  `docs/handoffs/WRN-G3-021-p4-b-integrity-architecture.md`. Zunächst rein
  statischer defensiver Privacy-/Architekturreview; finaler Schluss nach QA.

## QA-Abnahme

Den tatsächlichen Zwölfpfaddiff gegen das Gate prüfen; keine Ableitung von
Fertigstellung aus Testanzahlen. Node exakt 24.19, vorhandene Binaries direkt,
kein Paketmanager oder Installationsversuch. Mobile-Vitest aus `apps/mobile`.
Die vollständige Mobile- und UI-Sprachsuite, betroffene Typechecks, Build,
Lint/Format, 19 Boundaries sowie Fixture-/Releasegrenzen reproduzieren.
Sieben unveränderliche P4-Schutzpositionen und die drei P3-Pins prüfen;
die fünf erlaubten Bestandsdateien erhalten nachvollziehbare Nachhashes.

Alle UI-Vertragszustände müssen wirksame Orakel haben. Insbesondere prüfen:
echte Route mit gültiger injizierter Testuhr sowie ehrliche Ablehnung am/ab
Ablauf; leere Daten und Reload; laufende/späte Fehler nach Reload/Unmount;
pausiertes Continue ohne neuen Download oder alten gespeicherten Seek;
gespeichertes Resume nur nach Nutzeraktion; keine Medienrequests vor Play.
Asynchrone Projektionen dürfen nicht fortlaufend IndexedDB abfragen.

Bei der Chief-Begleitung des frühen WIP sind folgende Integrationsstellen
zur Korrektur an den Writer gegangen; im finalen Kandidaten ausdrücklich
prüfen: native Audiocontrols dürfen die Playerfassade nicht umgehen;
gespeichertes Resume muss nach einem neuen Mount erreichbar sein;
idle-ready muss am vom Hub gelieferten Ablaufzeitpunkt neu projiziert
werden; jede Bootstrap-Mutation braucht den aktuellen Lauf und die eigene
beobachtete Generation, statt einen fremden Candidate zu übernehmen;
der Controller schließt auch verspätet geöffnete Resume-Handles.
Diese Liste ist keine Behauptung offener Befunde im späteren Kandidaten.

Zusätzlich den tatsächlichen Ressourcenabschluss prüfen: Ein bereits
laufender Pause-Save kann nach Hub-Unmount noch die bestehende exakte
P3-Kompensation benötigen. Sofortiges Schließen des IDB-Handles darf diese
nicht verhindern. Der enge Controller-Wrapper darf laufende Storeoperationen
zählen und das Schließen bis nach der direkt folgenden Kompensation
verschieben; keine P3-/Storeänderung und kein Retry. Ein reales Hub-/IDB-
Orakel muss die endgültigen Records, Generation und einmaliges Schließen
nachweisen, statt die Hubfortsetzung in einem Test nachzubauen.

Die unverändert geforderten 104 Visualvarianten plus Status-, Keyboard-,
Request- und Accessibilityfälle in einem frischen Temp-Verzeichnis erzeugen.
Echte Produktintegration und selbst erstellte Präsentationsdaten ausdrücklich
trennen. CSS-Größenänderung ist als Reflowprüfung zu benennen, sofern kein
nativer Browserzoom verwendet wird. Die relevanten Bilder tatsächlich ansehen.
Konsolen-/Netzwerkfehler, Fokus, 44-Pixel-Touchziele und Overflow ausweisen.

Für alle Läufe Prozessabschluss und Exitcode sichern; PNG-Zahl allein reicht
nicht. Das Writer-Manifest anhand direkter regulärer Bilddateien und seiner
definierten kanonischen Liste unabhängig nachrechnen. QA-Bilder und ihre
eigenen Hashes dürfen bei anderem Rendering abweichen, müssen aber klar dem
gleichen eingefrorenen Code und den tatsächlich gelaufenen Fällen zugeordnet
sein. Logs außerhalb des Bildroots halten; keine Git-Configänderung.

## Integrität und Architektur

P4 muss die bestehenden öffentlichen P3-APIs verwenden. Prüfschwerpunkte:
Active-only-Projektion und kanonisch leerer Bootstrap; Besitz jeder
asynchronen Fortsetzung; Unmount vor dem Schließen eigener Handles;
Scope von Timern/Listenern; Zeit-/Rechte-/Safetyentscheidungen ausschließlich
im P2/P3-Kern; keine zusätzlichen Persistenzfelder oder Aktivitätslogs;
keine vorzeitigen Medien-/Providerrequests; keine unversionierten Verträge,
Fixture-/Pin-/Dependency-/Websiteänderungen oder HTML-Senken.

Nach QA-GREEN schließt derselbe unabhängige Sol-Reviewer eng die gemeldeten
Abweichungen und die UI-Vertragserfüllung ab. Kein versiegelter Scan wird
behauptet. Konkrete offene Befunde verhindern Gesamt-GREEN; unbelegte
Hypothesen werden als solche eingegrenzt und nicht zu Produktfehlern erklärt.

## Abschluss und Rücknahme

Handoffs nach `docs/templates/AGENT-HANDOFF.md` mit Quellen, exakten Dateien,
gelaufenen Checks, offenen Befunden, Rechteabgabe und `END-CHECK: :)`.
Der lokale Kandidat bleibt über seinen Git-Diff separat rücknehmbar; kein
Schema- oder Datenmigrationsdelta. Keine Rücknahme ohne Chief-Disposition.
Erst das technische Gesamt-GREEN führt zur konkreten lokalen PO-Sichtprobe.
Reale Inhalte, Provider, Website, Android, Play und Veröffentlichung bleiben
eigene Aufträge mit ihren bestehenden Grenzen.

## Startdisposition

Chief gibt die bisherigen Writer-/Luna-Slots frei. Zuerst frischer Sol/high
für die statische Integritätsprüfung, danach frische Terra-QA mit exklusivem
Browserbesitz. Beide prüfen ausschließlich 03025f6 und schreiben ihre oben
genannten eigenen Belege. Root schreibt bis Ende der Prüfungen nur eigene
Dokumente; keine Produkt-/Testwrites. Headerclipping, fremder Vollrepo-Lint
und Formatbestand werden separat eingegrenzt, nicht als P4-Ursache erfunden.
