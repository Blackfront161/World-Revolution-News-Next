# WRN-G3-021 P4-B – sichtbarer lokaler Medienbereich

Status: zur Ausführung gebunden durch das separate P4-B-WRITER-GATE.
R11 ist durch Produkt `ad9488fd30d26808e4f6e704496d104d291778be`,
Testnachtrag `16b5c1027246c56ca3155846fb0d4d38042727f3` und unabhängigen
Abschluss `4c8ba4e` vollständig GREEN. Beide letzten Findings sind geschlossen;
P4-B API-Readiness ist PASS. Chief hat alle zwölf Vorhashes erneut geprüft.
Der separat abgesicherte App-Test-Clockfix bleibt berücksichtigt.

## Umfang und verbindliche Grundlage

Der bereits unabhängig GREEN geprüfte Vertrag
`WRN-G3-021-P3-PLAYER-LIFECYCLE-UI-CONTRACT.md`, insbesondere §5, §6,
§7 Punkte 24/25 und §9, bleibt vollständig maßgeblich. Dieses Paket
bereitet seine Ausführung vor und fügt keine Produktfunktion hinzu.
Die zwölf P4-B-Pfade aus §6 sind die vollständige mögliche Allowlist;
P2/P3, weitere Clients, Fixtures/Assets/Pins, Config und Dependencies bleiben
read-only. Kein Produkt-Testschalter, kein URL-/Query-Clockoverride.

Der neue Chief-PO-Auftrag zur lokalen Fertigstellung deckt die Fortsetzung
nach erfüllten Gates. Vor dem separaten Gatecommit besteht dennoch kein
Schreibrecht. Genau ein Terra/high-Frontendwriter arbeitet danach ohne Kinder
oder Index; unabhängige Reviewer schreiben getrennte Belege.

## Bereits geprüfter Integrationsweg

- Echte `#media`-Route; ausschließlich Active-only Projektion desselben
  validierten P2-Snapshots. Bootstrap bei kanonisch leerem Store über den
  bestehenden Loader, saveCandidate und activate; keine eigene Admissionregel.
- Controller besitzt Run/Abort und die geöffneten Store-Handles. Späte
  Open-Ergebnisse schließen sich; Unmount invalidiert zuerst den Hub und
  schließt danach die eigenen Stores. Kein Restore aus Candidate/Previous.
- `hub.projection()` ist async und liest den Snapshot: nur gezielt an
  Lifecycle-/Useraktionsgrenzen aufrufen. Ausschließlich `player.state()` und
  `resumeStatus()` eignen sich zur synchronen, abbrechbaren UI-Abfrage.
  Keine IDB-Abfrageschleife und keine kopierte Player-/Resumeentscheidung.
- Dieselbe `App.now`-Funktion gelangt an Loader, Katalogstore und Hub.
  Produktionsdefault bleibt Date.now. Positiver realer Pipeline-Test:
  `2026-09-01T12:00:00.000Z`; Ablaufgrenze der unveränderten Medienfixture:
  `2026-09-02T00:00:00.000Z`. Aktuelle Produktionszeit muss ehrlich ablehnen.
- Reine Präsentation für die typisierten, getrennten Vertragszustände,
  sichtbare lokale Play-/Pause-/Fortsetzenaktionen und alle neun Sprachen.
  IDs, Hashes und interne Runtimeangaben gehören nicht in Nutzertexte.
- Getrennter test-only Visualharness nach dem vorhandenen G3-020-Muster,
  ausschließlich selbst erzeugte Präsentationsdaten. 104 vertragliche
  Varianten mit dark/light/pink/contrast wie im vorhandenen G3-020-Beleg;
  zusätzlich die geforderten Status-, Keyboard-, A11y- und Requestassertionen.
  Bilder und reale Produktroute eindeutig auseinanderhalten.

## Eindeutige Basis statt scheinbarer Hashabweichung

`App.test.tsx` wurde vor P4-B separat in `9b6cc34` korrigiert: drei positive
Home-/Sporttests nutzen gültige Fixturezeit. Der unabhängige Sol-Fixreview
`docs/evidence/WRN-CHIEF-2026-09-08-FIX-REVIEW.md` ist GREEN. Deshalb gilt
vor dem P4-B-Writer als neuer exakter Vorhash
`40958504ba94a1eeff49b9341715af60e9d98b66ae86353e01d338b6780d6e5e`.
Die anderen elf ursprünglichen §8-Vorhashes bleiben bestehen. Die fünf
P4-B-Bestandsdateien dürfen nur nach eigenem Gate innerhalb ihrer Allowlist
ändern; für alle read-only Dateien gelten die Hashes weiter unverändert.

Der aktuelle R11-Playernachhash lautet
`c71b18ae2f384fbeb7280be7bb3f874405b454cb159a5b60aafcb68f814755a6`.
Der frühere `P4-B-API-M-001` ist erst durch den unabhängigen R10-Abschluss
geschlossen, nicht durch diese Vorbereitung oder eine UI-Kompensation.

## Abnahme

Node exakt 24.19, fokussierte UI-/App-/Sprachtests, volle betroffene Suites,
Typechecks, Build/Lint/Format, unveränderte 19 Boundaries, Fixture-/Release-
und Schutzprüfungen. Echte Route mit gültiger Testuhr und abgelaufener Uhr
belegen; Visualmatrix mit prüfbarem Manifest, Screenshots und A11y-/Reflow-
Ergebnissen. Keine Absicht als gelaufenen Test ausweisen.

Nach eingefrorenem Kandidaten folgen Chief-Reproduktion und die eigene
unabhängige QA-/Visual-/A11y-, Security-/Privacy- und Architekturfolge aus §9.
Erst technisches GREEN erlaubt die lokale PO-Sichtprobe. Reale Quellen,
Provider, Website, Android, Hosting/Upload/Deployment und Release bleiben OUT.

Aktuelle P3-A-Abschlussbindung: `4c8ba4e`, null offene Findings.
Die frühere R10-Basis ist Historie; der R11-Playerhash oben gilt unverändert.
