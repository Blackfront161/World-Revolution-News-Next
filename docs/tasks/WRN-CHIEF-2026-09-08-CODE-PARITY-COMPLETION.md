# WRN Chief – Codeprüfung, Livevergleich und Fortsetzung

Datum: 8. September 2026. Auftrag: aktueller PO-Chat in Task
`01a08163-50a9-7d10-aa40-0f9e9cc1f3c3`; der PO benennt diesen Main ausdrücklich
zum neuen Head Chief und verlangt Analyse, Bugkorrektur, Fortsetzung und
Empfehlungen mit sinnvoll gemischten Modellen. Delegation: erlaubt.

## Ausgangspunkt und Grenzen

HEAD bei Übernahme: `e84d839`; erhaltener unstaged WIP in den sieben Pfaden
des P3-A-R9-R2-Vertrags. Der jüngere lokale Stand ersetzt die verkürzte alte
P2-R5-Chatübergabe. Kein Reset und keine Übernahme historischer Arbeitskopien.
Die vorhandenen lokalen Folgegates bleiben verbindlich; der Auftrag erlaubt
keine Liveänderung, Installation, Signierung, Veröffentlichung oder Ausgaben.

## Reservierung und Besitz

- Slot 1: genau ein frischer `frontend_brand_engineer`, Terra/high, keine
  Kinder. Ausschließlich die sieben Pfade aus
  `WRN-G3-021-P3-A-R9-R2-WRITER-CONTINUATION.md`; kein Index oder Commit.
  Auftrag: erhaltenen WIP prüfen, fehlende 36 Browserzellen und sieben
  Provenienzregressionen vollständig beenden, vorgeschriebene Matrix zweimal
  und alle Endprüfungen ausführen, wahrheitsgemäße Evidence/Handoff liefern.
- Slot 2: `context_continuity_auditor`, Luna, keine Kinder, vollständig
  read-only. Disjunkter Auftrag: Paritäts-/Planungsinventar, offene Arbeit,
  widersprüchliche Statusangaben und bereits vorgeschlagene Nutzerfunktionen.
  Keine Tests, keine Produkt- oder Dokumentwrites. Bericht an Chief.
- Slot 3: zunächst frei; nach Writerabschluss für unabhängige Reviews.
- Chief: Live-/GitHub-Abgleich, andere bestätigte Fehler read-only eingrenzen,
  diese Auftragsdatei und eigenen Ergebnisbericht pflegen. Während des Writers
  keine Produktwrites oder konkurrierenden Browserläufe. Danach Reproduktion
  und verbindliche unabhängige Folgegates.

## Abnahme

Keine Vollständigkeit aus Testanzahlen ableiten. Pflichtmatrix, echte
IDB-Nachzustände, Quellen-/Versionsbelege und bekannte Baselinefehler explizit
ausweisen. Nicht abgeschlossene Releasefunktionen und Empfehlungen getrennt
kennzeichnen. Keine Freigabe durch einen bloßen grünen Teiltest.

## Reservierung nach Chief-Reproduktion

Der Writer hat seine Rechte abgegeben. Chief reproduziert auf demselben
WIP 148 fokussierte Tests, zweimal 18 echte Browserfälle, 7 Typechecks,
Build/Lint/Format, 19 Boundaries, Fixture-/Releasegrenzen und 12 Schutzhashes.
Der volle Mobilelauf ist 334/337 mit den drei getrennt gebundenen Clocktests.
Der exakt siebenpfadige Kandidat ist
`fe528fd5062cb515c03359ed612fee46d0579735` (Elternbasis `e84d839`).

Jetzt zwei disjunkte frische Prüfer, keine Kinder, keine Produktwrites:

- Terra-QA: eigener Beleg
  `docs/evidence/WRN-G3-021/P3-A-R9-R2-INDEPENDENT-QA.md` und Handoff
  `docs/handoffs/WRN-G3-021-p3-a-r9-r2-independent-qa.md`; reale Matrix,
  unabhängige Läufe, keine Testmutation oder konkurrierender Browserlauf.
- Sol-Integrity/Privacy: eigener Beleg
  `docs/evidence/WRN-G3-021/P3-A-R9-R2-INTEGRITY-PRIVACY.md` und Handoff
  `docs/handoffs/WRN-G3-021-p3-a-r9-r2-integrity-privacy.md`; defensiver
  Review des Kandidatendiffs und der R9/R1/R2-Senken/No-op-Provenienz.
  Keine automatisierte Fremdscan-/Uploadoperation; read-only Codeprüfung.

Chief schreibt währenddessen nur eigene Dokumente. Erst nach beiden GREENs
folgt der vertraglich vorgeschriebene frische Architekturabschluss. Die
beiden kleinen separat gebundenen Bug-/Testkorrekturen werden danach
sequenziell umgesetzt; der Medienkandidat bleibt für Reviews unverändert.

Runtimepräzisierung: Der Start einer zusätzlichen Sol-Instanz wurde mit
`agent thread limit reached` abgewiesen. Der vorhandene Sol-Reviewer der
unabhängigen Personalisierungs-Designprüfung übernimmt deshalb erstmals
die Medienpfade. Er hat keine Medienimplementierung oder frühere Medien-
Reviewrunde durchgeführt. Die Prüfung ist fachlich unabhängig, jedoch keine
neu erzeugte Runtimeinstanz; dies ist explizit im Beleg auszuweisen und ersetzt
keinen später vorgeschriebenen frischen Architekturabschluss.

Sequenzpräzisierung nach beendeter Terra-QA: Chief darf nun den separat
designgeprüften Personalisierungs-Zweipfadfix umsetzen. Kein Medienwriter und
kein QA-Testlauf ist aktiv. Der Sol-Recheck bleibt auf `fe528fd` eingefroren;
keiner seiner sieben Medienpfade oder zwölf Schutzpfade wird dabei verändert.
Die Home-/Reader-Teständerungen warten bis zum Ende dieses Rechecks.

## Erhaltene Historie bei kleinerem Agentenkontext

Der Chief darf die aktuelle `AGENTS.md` vollständig und byteidentisch unter
`docs/history/WRN-AGENTS-SNAPSHOT-2026-09-08.md` sichern. Im Original wird
ausschließlich die lange historische Gatekette in §2 durch einen Verweis
ersetzt und der aktuelle R10-Stand genannt. §1 und §3–§9 bleiben unverändert;
keine Regel, Freigabe oder historische Datei wird gelöscht oder verschoben.
Der alleinige Dokumentbesitz betrifft diese zwei Pfade. Ein unabhängiger
Luna-Abgleich prüft Snapshotidentität, erhaltene Normen und die aktuellen
Gateverweise. Produktdateien und die Rechte des aktiven Writers bleiben
unangetastet. Zweck: geringere Kontextkosten und weniger verwechselte Altgates.

Unabhängiger Luna-Abgleich: Dokumentparität GREEN, §1 und §3–§9 ohne
Differenz; 186 Normzeilen unverändert. Das Archiv stimmt nach CRLF-/EOF-
Normalisierung mit `1a87f5d:AGENTS.md` überein. Die vollständige gelesene
Arbeitskopie wurde zuvor byteidentisch kopiert; weder Datei noch Historie
ging verloren. Die aktive Anleitung enthält 2.673 Zeilen weniger.
Lunas zusätzlicher Hinweis auf das noch laufende alte Writer-Handoff ist an
den alleinigen Writer zur ohnehin vorgeschriebenen Endaktualisierung gegeben;
er betrifft keine Abweichung der archivierten Regeln.
