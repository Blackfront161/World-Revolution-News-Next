# WRN-G3-015 – frischer, eng begrenzter P3-Abschluss

28.08.2026, Chief-Disposition innerhalb PO-074. Noch kein Start; zuerst
S5-R1-Handoff/Commit und bestaetigtes Instanzende. P3 bleibt YELLOW.
Quelle wird beim Start im zentralen Register exakt gebunden.

## Aktuelle Unterbrechung und vorbereiteter Wiederanlauf

S6 hat in6987f78 korrekt nach dem exakten24.19-Core-RED gestoppt und ist
beendet. Kein jetziger Wiederstart: S7-R1 untersucht die Ergebnisabweichung;
erst gesicherte Chief-Disposition zu P2 erlaubt die nachfolgende Restarbeit.
Der Chiefvergleich8bb220a mit33PASS ist allein KEINE Incident-Schliessung.

Bei spaeterer Freigabe bleibt dasselbe Test-only-Eigentum unten bestehen.
Zusaetzlich konkretisieren diese bereits erkannten Runnerluecken die
geforderte dauerhafte Nachweissicherung, ohne neue Produktrechte:

- Der neue website-shell-ui-final-runner.mjs setzt PATH bisher auf
  dependencies/node statt dependencies/node/bin. Core mit process.execPath
  war zwar24.19; nachfolgende pnpm-Kinder duerfen nicht auf Systemnode24.16
  zurueckfallen. Korrigiere den Teststarter minimal, beachte Windows-PATH/
  Path-Doppelschluessel und belege die tatsaechliche Kindruntime. Keine
  globale Runtime-/Package-/Sessionkonfiguration oder Installation.
- stdout/stderr bereits waehrend des Laufs in den eindeutigen Runpfad
  streamen; nicht erst nach Ende aus Speichervariablen schreiben. Start-/
  Endrecord, Spawnfehler/Exitcode und maschinenlesbare Reports erhalten.
- Fuer finale Runs aktuelle Produkt-, Test-, Katalog- und Buildquellen
  vollstaendig binden, nicht bloss die vier bisherigen Rootdateien. Nach
  letztem Testedit einmaliger eingefrorener Kandidat fuer alle Schlussgates;
  bei Fehler Ursache klassifizieren statt pauschal alle Gates wiederholen.
- Neue runlokale Byteattribute und Gitblobs gegen Manifesthashes pruefen;
  originalen stdout/JSON/Bilder nicht nachtraeglich retypisieren oder durch
  Git-Zeilenendenkonvertierung mit ungeprueften Hashbehauptungen uebergeben.
  Historische Artefakte/Manifeste unveraendert, nur neue eigene Runpfade.
- Chief hat die beiden echten historischen Rootreste unter
  chief-p3-preservation-20260828-1332/ gesichert. b124b5d-late-preservation
  ist keine byteidentische Originalquelle; Details im CHIEF-P3-HANDOFF-CHECK.

Dies ist Vorbereitung, kein weiterer Agentstart oder Backendfixauftrag.

## Anlass und Orientierungsgate

Der erste P3-Handoff b5e2ea9/f201be7 war unvollstaendig. S5-R1 ergaenzte
gezielte SourceDev-/Bild-/Built-/Fremdtab-/Fehlerbelege, startete aber erneut
einen Rootlauf ohne die verbindliche dauerhafte Outputbindung. Die Session
ist verloren, der Prozess laeuft weiter. Fehlende Lifecycleassertions und
finale Gesamtmatrix bleiben offen. Chief beendet den Auftrag kontrolliert
nach Sicherung, nicht wegen Chatlaenge oder eines fehlenden Smileys.

Genau ein frischer `frontend_brand_engineer`, Terra/high, keine Kinder.
Zuerst read-only: aktuelles Gate, FRONTEND-PACKET, FRONTEND-COMPLETION samt
13:03-Disposition, letzter S5-Handoff, eigene UI-/Testquellen und gebundene
Belege. Ziel/Quelle/Scope/Restpunkte korrekt an Chief zurueckgeben; bis zur
Orientierungsbestaetigung keine Datei-/Test-/Git-Schreibarbeit.
Kein erneuter P2-Entwurf und keine umfassende Legacy-/Repoanalyse.

## Exaktes Eigentum nach Chief-Freigabe

Schreiben nur:

- `apps/website/src/offline-shell-ui/WebsiteShellPanel.test.tsx`;
- bestehende oder eng benoetigte neue `tests/e2e/website-shell-ui-*`;
- eigene neue `docs/evidence/WRN-G3-015/p3-final/**`;
- `docs/handoffs/WRN-G3-015-frontend-final.md`.

Produkt-UI, Kataloge, Backend/Generator/Coretests, Content/Safety, Mobile,
Root-/Packagekonfiguration und Dependencies read-only. Bei Produktfinding
konkreten RED und Ursache an Chief, keine eigene Produktkorrektur. Chief
fuehrt Status/Register allein. Andere Autoren nicht zuruecksetzen/stagen.
Keine Installationen, Live-/Legacyzugriffe, Remote/Cloud/CI, neue APIkosten,
Android, Signierung, Upload oder Release. Alte Evidenz nicht ueberschreiben.

## Restarbeit, nicht erneut bei Null anfangen

Chief-Nachtrag circa13:25: Der Rootlauf ist beendet. `.last-run.json` vom
13:22:18 meldet failed/eineTest-ID. Der vorhandene Core-error-context nennt
`C:/Program Files/nodejs/node.exe tests/e2e/website-shell-core-matrix.mjs`.
Chief pruefte beide Executables read-only: Systemnode24.16.0, gebundene
Runtime24.19.0. Der alte Rootlauf ist damit kein gueltiges Toolchaingate;
dies beweist noch nicht die genaue Ursache des Corefehlers. Originale in
S5-WIP sichern; Nachfolger prueft zuerst korrekte Toolchain auch in Kindern.

Gesicherte Basis:1fe8060/23fdc67/b124b5d, Handoff
`docs/handoffs/WRN-G3-015-frontend-r1-wip.md`. Alte frontend.md-Aussagen sind
Historie. Kanonische erhaltene Rootrohkopie:
`p3/runs/r1-root-intermediate-20260828-1322-late-preservation/`.
Der vorhandene `completion/matrix-cDTMCQ/raw-report.json` nennt selbst
Node24.16.0,32PASS/einefalsche Assertion: failed body-timeout update lieferte
active statt failure. Vor weiteren Vollruns einmal unveraenderten Core-Matrix-
Starter mit exakter24.19/gesicherter Ausgabe ausfuehren. Scheitert dieselbe
Assertion, enger Bericht an Chief; Backend/Coretest nicht selbst korrigieren.
Eine einzelne bestandene Reproduktion belegt noch nicht die alte Fehlerursache.

1. Vorhandene belastbare Belege uebernehmen, fehlende ehrlich nennen.
   SourceDev06dad6f wurde vor instrumentiertem RED geschrieben; spaetere
   b5-Probe meldet Register1/CacheOpen2. Als post-hoc kennzeichnen, nicht als
   urspruengliches RED. Verlorener Modalrohbeleg bleibt verloren.
2. Zwei neue Units belegen erst Deferred-Enable/Doppelklick und Copywechsel/
   Dispose. Ergänze genau die noch verlangten Update-, Remount-/spaeten
   Settlement-/echten Themewechsel-Faelle. Kein Testname statt Assert;
   adapterinjizierte Komponentenfaelle von echten Browserfaellen trennen.
3. Built-UI A/B, sichtbare Speicherung, Controller nach Restart/Reload,
   Waiting, B-Aktivierung nach Ende alter Clients, Cancel/Remove/pending,
   echter Fremdtab mit offener alter Bestaetigung und 503-Fehler sind bereits
   gezielt berichtet. Aktuelle Specs/Belege pruefen und an den finalen Stand
   binden. Synthetisches Core-B ist nur Hybridbeleg; echter Built-B-Test nutzt
   zwei isolierte Kopien plus harmlosen Marker und vorhandenen Generator.
4. Die 48 normalen plus36 Initial-/Nach-Mount-Reflowfaelle haben204Bilder
   (Panel/Dialog und zusaetzlich Reflow-Dialogviewport). Locale/Theme/Font/
   Viewport, Axe, Fokus/Tab/ShiftTab/Escape, Zielgroesse, Overflow und
   erreichbare Inhalte belegen. Bestehende Visualspec nutzen, keine neue
   allgemeine Designarbeit. Schlusslauf darf keine alten Bilder ersetzen.
5. Nach letzten erlaubten Testaenderungen alle zehn Einzelgates und die ganze
   Rootmatrix frisch ausfuehren: exakte Node24.19/pnpm11.19, Default2Worker/
   sieben Projekte. Keine unbekannten Sourceaenderungen waehrend der Runs.
   Root-`check` nicht reparieren. Echte Zahlen/Skips/Flaky/Errors berichten.
6. Jeder Lauf bekommt VOR Start eigenen dauerhaften Runpfad, JSONreport,
   stdout/stderr/Exitcode und Quelle vor/nach Lauf. Runner als eigene Datei,
   damit Ergebnisse auch bei verlorener Toolsession erhalten bleiben. Die
   vorhandenen completion/run-gates.mjs und run-root-browser.mjs read-only
   als Muster verwenden, nicht direkt alte Handoffs/Indizes ueberschreiben.
   Kein normaler pnpm-Rootlauf ohne durable Ausgabe; `.last-run.json` allein
   ist kein finales Gate. Fehlerhafte Rohlaeufe behalten.
7. Unveraenderte Coretests duerfen ihre normalen neuen mkdtemp-Ausgaben unter
   completion/ erzeugen; nur neue Pfade an eigenen Rootreport/Index binden,
   keine historischen Artefakte dort veraendern. Keine gleichzeitig
   konkurrierenden Builds oder Testausgaben.
8. Abschliessender maschinenlesbarer Index bindet aktuelle Produkt-/Test- und
   Katalogquellen, Buildmanifest/Shellidentitaet, Rohreports und alle finalen
   Bilder per SHA256. Endbericht nennt konkrete SHELL-01–12-/P3-Zuordnung,
   Abweichungen und offene Fragen. Gesicherte Folgecommits, Handoff, dann Ende.

## Toolchain und Aufwand

Node: `C:/Users/patri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`
(24.19.0). pnpm11.19 ueber denselben Node und
`C:/Users/patri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs`.
Nodebin vor PATH, `pnpm_config_verify_deps_before_run=error`,
`--config.enableGlobalVirtualStore=false`; keine Installation.

Auftragsumfang ist dieser Rest, kein neues Feature. Bei zwei gleichartigen
erfolglosen Versuchen ohne neue belegte Erkenntnis Chief informieren und die
betroffene Schleife stoppen. Zwischenstaende ehrlich, keine Teilabgabe als
vollstaendige P3-Freigabe. Endgueltige unabhaengige Security/QA/Architektur
bleiben anschliessend zusaetzlich erforderlich; keine PO-Abnahme oder Release.

END-CHECK: :)
