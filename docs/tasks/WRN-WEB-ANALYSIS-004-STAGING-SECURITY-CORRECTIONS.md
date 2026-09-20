# Task Brief

## Identitaet

- Task-ID: WRN-WEB-ANALYSIS-004 / S11-R1
- Titel: Security-Korrekturen fuer das isolierte Analysewebsite-Stagingpaket
- Paritaets-/Risiko-ID: S11-R1
- Auftraggeber: Product Owner ueber Main-Agent
- Zustaendiger Agent: separater Analysewebsite-Agent
- Modell/Reasoning: GPT-5, hoch
- Delegation: nicht erlaubt
- Weiterdelegation: nicht erlaubt
- Zentraler Slotvergeber (Main/Chief) / kanonischer Registerpfad: Main-Agent
- Hoechsttiefe (maximal Main -> Fachlead -> Helfer): Main -> dieser Agent
- Erlaubte Helferprofile und Modelle / read-only oder exakt begrenzte Schreibrechte: keine
- Eltern-/Kindbrief / Quellencommit / bestaetigte Slot-ID vor jedem Start: S11-R1; `eced0bbbe1b894120aef53ebd5873949752bdc6f`; keine Kinder
- Begruendung des Nutzens / Aufwands-, Checkpoint- und Versuchsgrenze: fuenf konkrete Findings; eine RED/GREEN-Runde und volle bestehende Matrix
- Schreib-/Vertragsowner / Integrationsowner / unabhaengiger Reviewowner: dieser Agent / Main-Agent / Security-Reviewer

## Ziel in beobachtbarer Sprache

Das lokal erzeugte, nicht hochgeladene Stagingpaket bindet Browser, Worker,
Cache-Namensraum, Manifest und externe Uploadpruefung fail-closed an dieselbe
explizite Staging-Origin. Es akzeptiert exakt 21 aktive Dateien mit genau drei
gebundenen Artikeln, behauptet nie einen sauberen Commit bei Dirty-Quellen und
erkennt vorhandene Robots-/Canonical-Tags unabhaengig von Attributreihenfolge
und Whitespace.

## Ausgangslage und Belege

- Quellstand/Commit: `eced0bb` plus `3390252` und `a10b72e`
- Reproduktion oder Referenz: S11-Handoff und Security-Findings S11-R1
- Relevante Dateien: `apps/website/tools/*staging*`, Offline-Shell-Generator,
  Vite-Konfiguration, Pakettests und Handoff

## Scope

### Erlaubte Pfade

- staging-spezifische Paket-/Konfigurationsdateien und Tests in `apps/website`
- eng notwendige Offline-Shell-Generator-Isolation ohne Normalbuild-Drift
- dieser Taskbrief und eigener Handoff

### Nicht-Ziele

- Hauptwebsite, G3-015-Outcome, Mobile-/Android-Code
- neue Architektur oder Dependency
- produktive Adresse festlegen

### Verbotene Aktionen

- Upload, Deployment, Netzwerk-, hPanel-, DNS-, Cloud- oder Livezugriff
- Accounts, Passwoerter, Tokens oder Secrets suchen
- Kinder starten

## Akzeptanzkriterien

1. Runtime-Origin-Pin greift vor Workerregistrierung; Staging nutzt eigenen
   Workerpfad und `wrn.website-staging-shell.*`; `.test` ist nie uploadfaehig.
2. Vor CSP-Bindung und Kopie sind exakt vier HTML-Ziele und insgesamt exakt 21
   aktive Dateien erlaubt; jedes Extra wird abgelehnt.
3. Buildprovenienz verlangt einen vollstaendig sauberen relevanten Worktree;
   SEO-Duplikaterkennung ist attribut- und whitespaceunabhaengig.
4. Normalbuildartefakte werden gegen `eced0bb` byteweise vermessen; keine
   riskante Hash-/Protokollmanipulation.

## Tests und visuelle Belege

- Unit/Contract: fokussierte RED/GREEN-Tests und volle vorhandene Paketmatrix
- Integration/E2E: Typecheck, Lint, Format, Normalbuild, zwei deterministische Stagingbuilds
- Lokale `dist-normal-*`-Materialisierungen sind reine ignorierte
  Vergleichsausgaben und niemals Paketinput.
- Viewports/Themes: keine sichtbare Produktfunktion geaendert
- Offline/Fehlerfaelle: Worker-Header, falsche Origin, Extra-Dateien, Dirty-Tree, Retirement

## Daten, Privacy, Security und Kosten

Keine externen Daten, Secrets, neuen Abhaengigkeiten oder Kosten. Die noch
fehlende reale Zieladresse bleibt Konfiguration; keine Adresse wird erfunden.

## Rollback/Ruecknahme

Engen Korrekturcommit revertieren. Das getrennte Retirementpaket entfernt nur
den staging-eigenen Worker-/Cache-Namensraum.

## Uebergabeformat

- Basis-/Ergebniscommit und geaenderte Dateien
- RED/GREEN- und Vollmatrix-Ergebnisse
- deterministische Hash-/Dateiliste und Normalbuildvergleich
- offene PO-Entscheidungen und Restrisiken
- keine ungefragte Folgeaktion
