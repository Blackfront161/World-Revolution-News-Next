# WRN Agentenorganisation und begrenzte Weiterdelegation

Stand: 28. August 2026
Status: Chief-Review GREEN; Organisationshunks im Hauptcheckout integriert
Auftrag: `WRN-GOV-001`; betrifft Arbeitsorganisation, nicht Produktarchitektur.

Chief-Referenz vom 28. August 2026: Hauptcheckout
`codex/g3-013-ui-language-preference@662b29c`, G3-013 akzeptiert;
`WRN-G3-014` war bei der Erstabstimmung nur dokumentarisch vorbereitet.
Eine nachfolgende, vom Chief direkt uebermittelte PO-Anweisung erlaubt ihm
den Beginn als groesseres Arbeitspaket erst nach dieser Organisationsabstimmung
und gezielter Integration. Der Chief bindet das neue Gate in seinem Checkout;
hier erfolgt kein Produktstart. Die sequenzielle Mitarbeiterfolge und
unabhaengigen Reviews werden durch diesen Vertrag nicht gelockert.
Der historische Foundation-Worktree `04e349d` darf keinen
neueren Produktstatus ueberschreiben; Chief integriert nur den geprueften
Organisationsdiff. Historische Einzelgenehmigungen starten keine alten
Auftraege neu.

## 1. Verantwortung statt dauerhafter Agentenmannschaft

Der Chief haelt Produktentscheidungen, Architekturgrenzen und die gemeinsame
Arbeitsplanung zusammen. Pro Arbeitspaket benennt er genau einen ausfuehrenden
Main und einen zentralen Slotvergeber. Das kann dieselbe Instanz sein. Ein
sichtbarer Phasentask eroeffnet keinen zweiten unabhaengigen Agentenpool.

Die bestehenden Profile werden wiederverwendet; es entstehen keine neuen
Managerprofile und keine dauerhaft laufenden Teams.

| Rolle | Auftrag | Grenze |
|---|---|---|
| Chief / ausfuehrender Main | Auftraege, Slots, Integration, Entscheidungen und Ergebnisvalidierung | ersetzt keine PO-Freigabe |
| Frontend-Fachlead | App-/Website-UI und Design-System fachlich zusammenhalten | nur im expliziten Brief als Lead; keine neuen Produktentscheidungen |
| Backend-/Daten-Fachlead | versionierte Vertraege, Datenfluesse und Adapter zusammenhalten | Live-/Rechte-/Securitygates bleiben bestehen |
| Helfer | eng benannte Teilaufgabe und Dateien | delegiert nicht weiter |
| QA / Security / Architekturreview | unabhaengige Befunde zum gebundenen Kandidaten | berichtet direkt an Main/Chief, nicht nur an den Implementierungslead |

Die Leadrolle ist optional. Bei kleinen Aufgaben arbeitet der passende
Spezialist direkt unter dem Main.

## 2. Tiefe, Slots und technische Grenzen

- Hoechstens zwei Delegationsstufen: Main -> Fachlead -> Helfer.
- Die technische Obergrenze dieser Runtime ist Main plus bis zu drei
  Subagenten; direkte Helfer, alle Nachkommen und wartende Instanzen zaehlen
  zusammen.
- Der Chief darf alle drei Slots nutzen, wenn jeder Teilauftrag einen klar
  unabhaengigen Scope, eigene Pfade/Vertraege und eine Integrationsreihenfolge
  besitzt. Hoechstens zwei Produktwriter laufen gleichzeitig; der dritte Slot
  dient read-only Analyse, QA, Security, Dokumentation oder disjunkter
  Testevidenz. Ein Task Brief darf enger begrenzen.
- Es gilt immer die niedrigere Grenze aus Projektregel, Task Brief und
  tatsaechlich verfuegbarer Runtime. Sichtbare Tasks und Fachleads duerfen die
  Projektgrenze nicht vervielfachen.
- Wartende oder pausierte Instanzen gelten bis zur bestaetigten Freigabe durch
  den Slotvergeber als belegt. Ein Spawnfehler erzeugt keinen Ersatzpool.
- Die vorhandene Sessionkonfiguration wird nicht erhoeht. Sie ersetzt keine
  projektweite Koordination zwischen mehreren sichtbaren Tasks.
- Ist verschachtelte Delegation nicht verfuegbar, uebergibt der Fachlead seinen
  Teilauftrag an den Main zum direkten Dispatch. Keine Umgehung ueber neue
  Tasks, externe Dienste oder weitere Agentensysteme.

## 3. Wann ein Fachlead weiterdelegieren darf

Ein freigegebener Eltern-Task-Brief muss `Delegation: erlaubt` UND
`Weiterdelegation: erlaubt` enthalten. Darin stehen:

1. ausfuehrender Main und alleiniger Slotvergeber;
2. erlaubter Fachlead, Helferprofile und Modelle/Reasoning;
3. gesamte Slotgrenze, Hoechsttiefe und Begruendung des Nutzens;
4. genaue Pfade, Vertragsowner, Quellencommit und Teilaufgaben;
5. Tests, Evidenzformat, Integrations- und unabhaengiger Reviewowner;
6. Aufwandsgrenze, Zwischencheckpoint und Stopbedingungen.

Kontextpakete enthalten nur relevante Quellen, Vertraege, Diff und Handoff;
keine pauschale Kopie der gesamten Gespraechshistorie.

Fehlt die ausdrueckliche Weiterdelegation, bleibt jeder Subagent ein Helfer
ohne Spawnrecht. Ein Kindbrief kann die Elternrechte nur einschraenken.
Organisationsfreigabe allein startet keinen Produktslice.

## 4. Zentraler Dispatch und Register

Der Main fuehrt genau ein kanonisches Register pro koordiniertem Arbeitspaket
nach `docs/templates/DELEGATION-REGISTER.md`. Der Chief legt dessen absoluten
Pfad und schreibenden Owner vor dem ersten Spawn fest. Andere Tasks lesen
diesen Stand; Worktreekopien sind keine konkurrierenden Register.

Vor jedem Spawn fordert der Lead beim Slotvergeber eine Reservierung an. Dieser
prueft Kapazitaet und Schreibueberschneidungen und bestaetigt Slot-ID, Kindbrief
und Pfade. Erst danach darf der Lead starten. Start, Ende, Unterbrechung und
Freigabe werden an den Slotvergeber gemeldet. Ohne lesbare Bestaetigung startet
kein Helfer. Nicht erreichbarer Slotvergeber bedeutet keine Weiterdelegation.

Das Register enthaelt Parent/Kind, Instanz-ID, Profil/Modell, Branch/Commit,
Schreibrechte, Status, Checkpoint, Testbelege, Aufwand und Slotfreigabe.
Technische Laufstatus und dokumentierte Rechte werden bei jeder Reservierung
abgeglichen; ein alter Tabellentext allein ist kein Kapazitaetsbeleg.

## 5. Schreibbesitz und Integration

- Pro Dateibereich und gemeinsamem Vertrag genau ein Schreiber. Auch Lead und
  Main schreiben dort nicht, solange der Helfer den Bereich besitzt.
- Ein Worktree isoliert Dateien, nicht fachliche Vertragsaenderungen. Derselbe
  Vertrag wird auch in verschiedenen Worktrees nicht parallel umgestaltet.
- Parallel schreibende Aufgaben brauchen disjunkte Dateien UND unabhaengige
  Vertraege. Gemeinsame Aenderungen werden seriell eingeplant.
- Unabhaengige QA/Security kann parallel zu einem anderen disjunkten Writer
  nur einen eingefrorenen Commit pruefen. Veraendert sich ihr Kandidat, ist
  vor Gesamtfreigabe ein gezielter Integrationsrecheck Pflicht.
- Der Helfer liefert Diff/Commit, Tests, offene Punkte und Handoff. Der
  Slotvergeber bestaetigt die Rechteuebergabe, bevor der Lead integriert.
- Integration erfolgt gegen einen benannten Kandidaten mit erneuten passenden
  Tests. Ein gruener Helfertest beweist nicht automatisch Gesamtintegration.
- QA prueft danach den gebundenen Kandidaten unabhaengig und meldet Befunde
  direkt an Main/Chief. Kein Implementierungslead darf Findings unterdruecken
  oder sein eigenes Ergebnis als unabhaengig freigegeben markieren.

## 6. Stoppen, Recovery und Evidenz

Bei Scopeverletzung, Schreibkonflikt, unklarer Herkunft oder neu benoetigten
Rechten: keine neuen Helfer starten, betroffenen Schreibbereich anhalten und
Main/Chief informieren. Der Main stoppt die betroffene Kette im Rahmen seiner
bestehenden Befugnisse. Stop eines Elternagenten wird nicht als automatischer
Stop aller Kinder angenommen; jede Instanz ist zu kontrollieren.

Diff, Branch, aktive Kinder, Slotstatus, Tests und Handoffs bleiben erhalten.
Kein Revert, Loeschen oder Restart allein zur Bereinigung eines Konflikts.
Rotation folgt `docs/08-CONTEXT-CONTINUITY.md`; Nachfolger orientieren sich
zuerst read-only. Auditors erhalten dadurch keine Lifecyclebefugnisse.

## 7. Aufwand und spaeterer Pilot

Der erste Pilot startet nur mit eigenem freigegebenem Produkttask. Empfohlen:
Main + Frontend-Fachlead + ein Helfer fuer ein klar begrenztes UI-Element;
danach QA seriell, ohne die globale Slotgrenze zu erhoehen.

Vorher festhalten: Arbeitspaket, Begruendung gegen Einzelausfuehrung,
maximale Helferzahl, messbarer Arbeitsumfang, Zeit-/Checkpointgrenze und
zulässige Nacharbeitsrunden. Bestehendes risikoabhaengiges Modellrouting gilt.

Nachher berichten: aktive Arbeitszeit, Warte-/Abstimmungsaufwand,
Nacharbeitsrunden, Konflikte, gefundene Defekte, bestandene Abnahme und
Tokenverbrauch, soweit vom Werkzeug belegt. Fehlende Kosten-/Tokenmesswerte
sind `unbekannt`; keine erfundenen Einsparungen. Ein Promptbudget ist kein
technisch erzwungenes Kostenlimit. Bei Grenze oder ausbleibendem Nutzen kein
weiterer Dispatch, bis Main/Chief das Vorgehen neu festlegt; Zusatzkosten
benoetigen weiterhin ausdrueckliche PO-Freigabe.

Erfolg bedeutet bessere Belege oder weniger Nacharbeit bei vertretbarem
Aufwand, nicht bloss mehr parallel laufende Instanzen. Vergleich nur mit
aehnlichen dokumentierten Aufgaben, keine kuenstliche doppelte Vollumsetzung.

## 8. Technische Referenz und Evidenzgrenze

[OpenAI Docs: Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents),
geprueft am 28. August 2026: fokussierte Rollen, explizite Delegation,
Kontextentlastung und erhoehter Token-/Koordinationsaufwand. Die konkreten
WRN-Tiefen-, Slot-, Schreib- und Reviewregeln sind Projektentscheidungen, keine
Zusicherung eines technischen Sandbox- oder Kostenmechanismus.
