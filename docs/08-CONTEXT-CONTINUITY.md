# Context-Continuity- und Agenten-Lebenszyklus-Protokoll

Status: verbindlich ab 21. August 2026

## 1. Ziel

Dieses Protokoll verhindert, dass lange Agentenkontexte unbemerkt zu
Quellenverwechslung, Wiederholung, Scopeverlust, schlechteren Antworten oder
unnuetzen Tokenkosten fuehren. Es ersetzt keine fachlichen Tests.

## 2. Was `:)` bedeutet

Jede formale Agentenuebergabe endet mit `END-CHECK: :)`.

- vorhanden: Der Agent hat den vorgesehenen Statusblock ausgegeben.
- fehlend: Die Kommunikation koennte unvollstaendig sein; Status mindestens
  `YELLOW` und gezielte Kontrolle.
- niemals: alleiniger Beweis fuer gute oder schlechte Kontextgesundheit.

Ein Agent kann den Marker trotz inhaltlicher Fehler ausgeben. Umgekehrt kann er
durch Abbruch oder Formatierung fehlen. Deshalb entscheidet Evidenz, nicht das
Zeichen allein.

## 3. Praevention

- ein Sub-Agent pro klar begrenztem Task Brief;
- neue groessere Aufgabe bevorzugt mit frischer Instanz desselben Profils;
- Rohlogs und lange Exploration nicht in den Main Task kopieren;
- Meilensteine in `docs/PROJECT-STATE.md` und `docs/handoffs/` sichern;
- Git-Commit/Branch, erlaubte Pfade und Tests in jeder Uebergabe nennen;
- maximal zwei aktive Agenten im Normalbetrieb;
- niemals zwei Schreibagenten an denselben Dateien.

## 4. Bewertungsdimensionen

Der `context_continuity_auditor` vergibt pro Dimension 0 bis 2 Punkte:

| Dimension | 2 Punkte | 1 Punkt | 0 Punkte |
|---|---|---|---|
| Zieltreue | korrektes Ziel/Done | kleinere Unklarheit | falsches/verlorenes Ziel |
| Quelltreue | richtige Quelle/Commit | unvollstaendig | falscher Bestand |
| Scopedisziplin | nur erlaubte Arbeit | erklaerbare Randabweichung | klare Scopeverletzung |
| Evidenz | konkrete Tests/Dateien | teilweise belegt | unbelegte Behauptungen |
| Konsistenz | widerspruchsfrei | einzelne Spannung | zentrale Widersprueche/Wiederholung |
| Handoff | aktuell/vollstaendig | kleine Luecke | fehlt oder nicht uebernehmbar |

- `GREEN`: 10–12 Punkte und kein Nullpunkt bei Ziel-/Quelltreue
- `YELLOW`: 7–9 Punkte oder fehlender Statusblock/Marker
- `RED`: 0–6 Punkte, falsche Quelle, schwere Scopeverletzung,
  unkontrollierte Schreibkonkurrenz oder nicht nachvollziehbarer Arbeitsstand

Der Score ist eine Entscheidungshilfe. Konkrete kritische Evidenz kann auch bei
hoeherer Summe `RED` rechtfertigen.

## 5. Ausloeser fuer ein Audit

- Statusblock oder `:)` fehlt;
- falscher Repositorypfad, Branch, Commit oder Task wird genannt;
- bereits entschiedene Fragen werden wiederholt gestellt;
- nicht freigegebene Dateien werden bearbeitet;
- Tests werden ohne Ergebnisbeleg behauptet;
- zwei Versuche scheitern ohne neue Hypothese oder Erkenntnis;
- Antwort wird widerspruechlich, stark irrelevant oder ungewoehnlich roh;
- ein Meilenstein, Phase, Migration oder Releasegate endet;
- Main Agent oder Product Owner fordert `KONTEXTCHECK: <name>` an.

## 6. Rotation bei RED

1. Bei aktivem Risiko den alten Agenten pausieren/stoppen.
2. Git-Status, Diff, Branch/Worktree und vorhandene Artefakte sichern.
3. Handoff aus vorhandenen Dateien rekonstruieren, falls der alte Agent es nicht
   mehr verlaesslich erstellen kann.
4. Offene Aenderungen nicht ungeprueft mergen, loeschen oder ueberschreiben.
5. Eine frische Instanz mit minimalem Continuity Packet starten:
   `AGENTS.md`, Task Brief, Source-of-Truth-Auszug, aktueller Handoff,
   relevanter Diff, Tests und offene Fragen.
6. Nachfolger orientiert sich zuerst read-only und gibt Ziel, Quelle, Scope,
   Arbeitsstand und naechsten Test korrekt wieder.
7. Erst nach bestandenem Orientierungscheck Schreibarbeit erlauben.
8. Alter und neuer Agent schreiben niemals gleichzeitig.

## 7. Stoppen, Feuern, Ersetzen und Loeschen

| Befehl | Wirkung |
|---|---|
| `KONTEXTCHECK: <name>` | Auditor prueft die Instanz read-only |
| `PAUSIEREN: <name>` | laufende Instanz unterbrechen; alles erhalten |
| `FEUERN: <name>` | Instanz nach Sicherung stoppen/schliessen; Profil und Belege erhalten |
| `ERSETZEN: <alt> -> <profil>` | sichere Rotation zu frischer Instanz |
| `PROFIL LOESCHEN: <name>` | exakt benanntes TOML-Profil entfernen; Git bleibt Recovery |

Der Main Agent darf bei evidenzbasiertem `RED` oder akuter
Schreibkonkurrenz eine Instanz automatisch stoppen. Er meldet danach Name,
Grund, gesicherten Stand, offene Aenderungen und Recoverypfad.

Der Auditor selbst darf nicht stoppen, starten oder loeschen. Profile,
Handoffs, Git-Historie und Belege werden nie automatisch entfernt.

## 8. Abschluss eines normalen Einsatzes

Ein Mitarbeiter muss nicht „geloescht“ werden, wenn seine Aufgabe fertig ist.
Der Task endet, die Sub-Agent-Instanz wird geschlossen und folgende Dinge
bleiben erhalten:

- wiederverwendbares Mitarbeiterprofil;
- Task Brief und Handoff;
- Git-Commit/Diff;
- Tests und QA-Belege;
- Entscheidungen und Restrisiken.

Damit kann derselbe Beruf spaeter mit einer frischen Kontextinstanz erneut
eingestellt werden, ohne alte Chatlast mitzunehmen.
