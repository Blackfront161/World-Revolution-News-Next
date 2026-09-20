# G3-015 – verbindlicher Outcome-A-Vertrag fuer Updateabschluesse

Status: **ACCEPTED am 29. August 2026.**

Exakte Product-Owner-Freigabe: `G3-015 OUTCOME A FREIGEGEBEN`.
Diese Freigabe bindet die Ergebnis-, Wiederanlauf- und UI-Semantik. Sie ist
keine eigenstaendige Freigabe fuer Produkt-/Testaenderungen, P2, P3, P4,
Livebetrieb oder Release.

## Belegte Entscheidungsgrenze

Eine bereits gespeicherte Website kann weiterhin funktionieren, obwohl sich
das Ergebnis eines einzelnen Updateversuchs nicht sicher feststellen laesst.
Der Browser liefert nicht fuer jeden nativen Installationsvorgang eine
eindeutig zuordenbare Job-ID. Deshalb darf eine vorhandene funktionierende
Shell nicht automatisch als erfolgreicher Updateversuch gelten. Ebenso darf
ein Fehler eines anderen Browserjobs nicht dem eigenen Versuch zugeschrieben
werden.

Nachweis/Beweiskraft: S8-Review `1296a50`, Handoff `d088a6f`. Die Grenze folgt
aus zwei zulaessigen, nach aussen gleich aussehenden Browsermodellen. Sie ist
keine bewiesene Erklaerung der zwei historischen Chrome-Fehllauefe.

## Verbindliches Typ- und API-Modell

Der oeffentliche Zustand hat zwei getrennte Achsen:

| Achse | Zulaessige Bedeutung |
|---|---|
| `readiness` | aktuell separat belegte Shellbereitschaft; sie sagt nichts ueber den Abschluss des letzten Updateversuchs aus |
| `operation` | Ergebnis und Laufstatus genau des aktuellen oder letzten sitzungsbezogenen Vorgangs |

`operation` besitzt mindestens die disjunkten Zustaende `idle`, `running`,
`succeeded`, `failed` und `indeterminate`. Nur ein `update` darf terminal
`indeterminate` mit dem stabilen Grund `native-outcome-unbound` liefern.
`indeterminate` bedeutet: Der native Abschluss kann dem eigenen Versuch nicht
sicher zugeordnet werden. Er ist weder Erfolg noch Fehler noch laufende Arbeit.

`enable` und `remove` behalten ihre strengeren bestaetigten Ergebnisse. Fuer
sie wird `indeterminate` durch diesen Vertrag nicht eingefuehrt: Erfolg bleibt
an ihren jeweils vorhandenen positiven Nachweis und Fehler an den eigenen
belegten Fehler gebunden.

Die Implementierung darf bestehende Feldnamen intern abbilden, muss nach
aussen aber diese beiden Achsen und Bedeutungen verlustfrei unterscheiden.
Eine Zeitgrenze, ein spaetes ungebundenes Event oder die blosse Verfuegbarkeit
einer Shell darf kein terminales Ergebnis umdeuten.

## Zustands- und Beweismatrix

| Beobachtung | `readiness` | `operation` | Busy |
|---|---|---|---|
| eigener Updateversuch laeuft und Zaun ist aktiv | separat zuletzt/geprueft | `running` | ja |
| eigener Updateerfolg eindeutig bestaetigt | separat neu pruefen | `succeeded` | nein |
| eigener Updatefehler eindeutig bestaetigt | unveraendert separat | `failed` | nein |
| nativer Abschluss nicht sicher an eigenen Updateversuch bindbar | unveraendert separat | `indeterminate` / `native-outcome-unbound` | nein |
| bestaetigtes Enable-Ergebnis | separat pruefen | bestaetigtes `succeeded` oder `failed` | nein |
| bestaetigtes Remove-Ergebnis | separat pruefen | bestaetigtes `succeeded` oder `failed` | nein |

Eine positive `readiness` darf neben `failed` oder `indeterminate` stehen. Das
ist kein Widerspruch: Die Shell kann bereit sein, obwohl der einzelne Versuch
fehlgeschlagen oder nicht sicher zuordenbar abgeschlossen ist.

## Busy, UI und bewusster Retry

- Busy gilt ausschliesslich fuer `operation = running` und endet bei jedem
  terminalen Ergebnis, einschliesslich `indeterminate`.
- Es gibt keinen automatischen Retry und keine Endlosschleife.
- Ein Retry ist nur als bewusste neue Nutzeraktion erlaubt, nachdem alle
  Pending-, Removal- und Epochzaeune frei sind und die Plattformvoraussetzungen
  erneut geprueft wurden.
- Die UI zeigt Shellbereitschaft und Vorgangsergebnis getrennt. Bei
  `indeterminate` behauptet sie weder Aktualitaet noch Erfolg und bietet erst
  bei freien Zaeunen einen bewussten Retry an.
- Die spaetere Copy muss in allen neun Sprachen dieselbe Bedeutung tragen.
  Ein allgemeines UI- oder Buttonredesign gehoert nicht zu diesem Vertrag.

## Sitzung, Neustart und Persistenz

Ohne einen gesondert freigegebenen Persistenzvertrag bleibt das terminale
Vorgangsergebnis sitzungsbezogen. Dieser Vertrag fuehrt kein Ergebnisjournal,
keine neue Datenbankstruktur, keine Migration und keine Loeschung ein.

Nach Neuladen oder Neustart wird die Shellbereitschaft frisch und separat
ermittelt. Ein noch dauerhaft belegter aktiver Pending-Zaun darf als laufender
Vorgang rekonstruiert werden; andernfalls beginnt die Operation bei `idle`.
Ein alter ungebundener oder nicht gespeicherter Abschluss darf nach Neustart
niemals rueckwirkend zu `succeeded` werden. Erfordert die Umsetzung spaeter
Ergebnispersistenz, ist vorher eine eigene PO-Freigabe mit Daten-, Migrations-,
Datenschutz-, Mehrtab- und Ruecknahmevertrag erforderlich.

## Verbindliche Invarianten

1. `readiness` und `operation` werden nie als dieselbe Aussage behandelt.
2. Nur eindeutig gebundene positive Evidenz erlaubt `succeeded`.
3. Ein eindeutig eigener Fehler bleibt `failed`; ein fremder oder ungebundener
   Fehler wird nicht dem eigenen Versuch zugerechnet.
4. `indeterminate` ist terminal, beendet Busy und ist nur fuer `update`
   mit `native-outcome-unbound` zulaessig.
5. Kein Auto-Retry; bewusster Retry erst bei freien Pending-/Removal-/Epochzaeunen.
6. Kein Neustart erzeugt nachtraeglichen Erfolg.
7. Enable und Remove behalten die strengere bestaetigte Ergebnissemantik.
8. Keine Zeit-/Eventheuristik ersetzt fehlende Ergebnisbindung.
9. Die bisherigen zwei historischen REDs und ihre Ursache bleiben offen, bis
   eine eigene nachvollziehbare Disposition sie schliesst. Neue Begriffe oder
   bestandene Wiederholungen reichen dafuer nicht.

## Implementierungs- und Dateigrenzen

Der naechste Implementierungsbrief darf nur die bereits identifizierten
Website-Shell-Typen/Controller/Adapter, deren direkte UI-Darstellung, die neun
gebundenen Sprachkataloge und die eng zugehoerigen Tests/Evidence benennen.
Safety-, Inhalts-, IDB-, Cache- und Datenvertraege bleiben unveraendert.

Vor Codeaenderungen sind ein enger Dateiscope, RED-Testfaelle und ein
unabhaengiger Vertragsreview zu binden. Mindestens folgende RED-Faelle sind
vor der Umsetzung erforderlich:

- Update endet ohne sicher gebundenes natives Ergebnis: terminal
  `indeterminate`, Busy aus, kein Erfolg und kein Auto-Retry.
- Positive Shellbereitschaft plus `indeterminate`: beide Aussagen bleiben
  gleichzeitig und getrennt sichtbar.
- Bewusster Retry ist bei einem Pending-, Removal- oder Epochzaun gesperrt und
  erst nach Freigabe aller drei Zaunarten moeglich.
- Neuladen/Neustart ohne aktiven dauerhaften Zaun ergibt keinen rueckwirkenden
  Erfolg; Operation beginnt `idle`, Readiness wird frisch bestimmt.
- Spaetes ungebundenes natives Event aendert `indeterminate` nicht in Erfolg.
- Enable und Remove akzeptieren weiterhin nur ihre bestaetigten Erfolgs- oder
  Fehlerpfade und erhalten keinen neuen `indeterminate`-Ausgang.

## Abnahme und unveraenderte Gates

Die Umsetzung dieses Vertrags ist erst abgenommen, wenn alle folgenden Belege
vorliegen: unabhaengiger Vertragsreview; RED vor GREEN;
deterministische Unit-/Adapter-/Browser-/Neustart-/Mehrtabbelege; neunsprachige
UI- und Barrierefreiheitspruefung; unveraenderte Daten-/Cachegrenzen; frische
unabhaengige Gesamt-QA, Security und Architektur; anschliessende sichtbare
PO-Abnahme.

P1 bleibt GREEN. P2 bleibt offen, P3 bleibt unvollstaendig/YELLOW und P4 bleibt
nicht gestartet, bis jedes Gate mit seinen eigenen Belegen geschlossen wird.
Der historische RED-Ursachenbefund bleibt separat offen.

Nur lokale Website-Offlineshell. Keine Live-/Legacyveraenderung, Mobile-/
Androidarbeit, neuen Dependencies/APIkosten, Remote/CI/Cloud/Deployment,
Signierung, Upload oder Veroeffentlichung. Keine unbekannten Folgefeatures.

## Freigabestatus

Product-Owner-Entscheidung: **Outcome A angenommen.**
Noch nicht erteilt sind Implementierungs-, Persistenz-, P2-/P3-/P4-, Live-
oder Releasefreigaben. Die einzige spaeter erneut erforderliche PO-Entscheidung
innerhalb dieses Outcome-Vertrags waere eine gesonderte Freigabe, falls eine
Ergebnispersistenz eingefuehrt werden soll.

END-CHECK: :)
