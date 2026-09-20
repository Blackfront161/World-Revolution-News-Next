# WRN-G3-021 P2-R3-R1 – Writer-Continuation nach Kontextstopp

Status: **WIP ERHALTEN – GENAU EIN ERSATZWRITER DARF SEQUENZIELL FORTSETZEN**

## Anlass und feste Basis

Der alleinige S2-R3-Writer arbeitete gegen Gatecommit
`6a4f03e28d4d0af95d8a6817b2ef36b1b36ca2ea` innerhalb der zehn erlaubten
Pfade. Er implementierte den Kern von R3-01 bis R3-05 und erweiterte die
Matrix schrittweise, beendete aber mehrere Fortsetzungsturns vor dem
vollstaendigen Literal-/Cap-Audit. Er erzeugte keinen Commit und keinen
Indexwrite. Der erhaltene Arbeitsbaum enthaelt ausschließlich sechs erlaubte
Produkt-/Testdeltas plus die zwei erlaubten neuen Evidence-/Handoff-Dateien;
die bekannten Codexordner bleiben OUT.

Die zuletzt vollstaendig gelaufene Matrix vor dem allerletzten ungetesteten
Cap-Helferdelta bestaetigte unter exakt Node 24.19 unter anderem 51
fokussierte und 9 echte Chrome-/IDB-Faelle, zwei direkte Typechecks, scoped
Lint/Format, 19 Boundaries sowie Fixture-/Releasechecks GREEN. Dieser Stand
ist wegen des nachfolgenden begonnenen, noch nicht produktpfadgleich
eingebundenen `hasMobileMediaJsonByteCap` **kein aktuelles Gesamt-GREEN**.

Der Kontextstopp ist kein Produktfinding und keine Scopeerweiterung. Die
urspruengliche Instanz ist beendet und besitzt keine Rechte mehr. Zu keinem
Zeitpunkt arbeiten zwei Produktwriter parallel.

## Alleinige Fortsetzungsrolle

Genau ein frischer Ersatz derselben Rolle
`backend_data_reliability_engineer` Terra/high darf ohne Kinder den
uncommitteten WIP uebernehmen. Feste Quellen sind:

1. Gatecommit `6a4f03e28d4d0af95d8a6817b2ef36b1b36ca2ea`;
2. `docs/tasks/WRN-G3-021-P2-R3-WRITER-GATE.md`;
3. `docs/tasks/WRN-G3-021-P2-R3-INTEGRITY-ROLLBACK-TEST-CORRECTION.md` auf
   Vertragsstand `7c3e051`;
4. der erhaltene uncommittete WIP und sein Evidence/Handoff;
5. dieser folgende Continuation-/Registercommit als volle neue
   Fortsetzungsbasis.

Die Zehn-Pfad-Allowlist, alle OUT-Grenzen, Stopregeln und Pflichtlaeufe des
Writergates bleiben wortwoertlich unveraendert. Der Ersatz darf vorhandene
korrekte Arbeit nicht zuruecksetzen, sondern muss sie diffbasiert pruefen,
vervollstaendigen und bei Fehlern eng korrigieren.

## Enger erster Auftrag

Zuerst wird der begonnene Matrix-3-Cap-Schritt abgeschlossen:

- `hasMobileMediaJsonByteCap` muss entweder produktpfadgleich mit denselben
  UTF-8-Bytes und Produktkonstanten eingebunden und vollstaendig getestet oder
  als falscher WIP-Ansatz sauber innerhalb derselben erlaubten Quellen ersetzt
  werden;
- Release und alle sechs Dokumentklassen: einzelne JSON-/Rawbytes Equal und
  `+1`;
- Aggregatbytes und Release-/Recordcounts Equal und `+1`;
- Safetyentries/-bytes: realer Maximalfall, isolierte Equal-/`+1`-Grenzen und
  Redundanzinvariante;
- Asset-/Audio-/Thumbnail-/Transcriptbytes sowie Breite, Hoehe und
  Pixelflaeche Equal/`+1`, Gegenachse eins und maximaler Equal-Fall.

Danach folgt der mechanische Soll/Ist-Abgleich jeder Literalzeile aus Matrix
1 bis 8 gegen konkrete parametrisierte Testnamen und Orakel. Keine pauschale
Gruppenzuordnung und kein erfundener unerreichbarer E2E-Fall.

## Abschlussgrenze

Erst wenn Evidence keine offene oder unvollstaendige Matrixzeile mehr nennt,
werden unter exakt Node 24.19 alle Pflichtlaeufe frisch wiederholt. Der
gebuendelte pnpm-Wrapper darf den vorhandenen Dependencybaum nicht entfernen,
installieren oder neu verlinken; gleichwertige direkte vorhandene Binaries
duerfen dieselben Configs/Entry-Points nichtmutierend ausfuehren, und der
Wrapperblocker wird dokumentiert.

Nur bei vollstaendigem GREEN darf der Ersatz exakt die zehn erlaubten Pfade
stagen und einen einzigen linearen Ergebniscommit erstellen. Andernfalls
Stop mit exakt benanntem technischem Blocker, unveraendertem Index und ohne
Teilfreigabe. Danach bleiben Chief-Reproduktion, frische Terra-QA, defensiver
Sol-Integrity-/Privacy-Deltarecheck und finaler Sol-Architekturabschluss
Pflicht. P3 und alle OUT-/externen Bereiche bleiben gesperrt.

## WRN-AGENT-STATUS

- Task: `WRN-G3-021-P2-R3-R1-WRITER-CONTINUATION`
- Status: uncommitteter WIP erhalten; ein sequenzieller Ersatzwriter erlaubt
- Ursprungsbasis: `6a4f03e28d4d0af95d8a6817b2ef36b1b36ca2ea`
- Schreibscope: unveraendert exakt zehn Pfade
- Parallelwriter: null
- P3/extern: gesperrt
- END-CHECK: :)
