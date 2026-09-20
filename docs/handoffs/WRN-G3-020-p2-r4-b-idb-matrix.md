# Agent Handoff – WRN-G3-020 P2-R4-B IDB Matrix

- Agent: `/root/g3020_p2_r4_b_terra`
- Task-ID: `WRN-G3-020-P2-R4-TEST-COMPLETION / R4-B`
- Ergebnis: **blockiert durch reproduzierten Produktfehler**
- Eltern-/Kindbrief, Rolle und Instanz-ID: Chief `/root`; einziger
  `backend_data_reliability_engineer` Terra/high-Testwriter, keine Kinder
- Basiscommit / Ergebniscommit / Branch und Worktree: Aktivierungsbasis
  `78bdf8c`; kein Ergebniscommit; Hauptcheckout auf
  `codex/g3-015-website-offline-shell`
- Slot-ID / zentraler Slotvergeber / Status aller Kinder: Chief `/root`;
  keine Kinder
- Schreibarbeit beendet / Rechteuebergabe und Slotfreigabe bestaetigt durch:
  Testausbau gestoppt, alle Produkt-/Testrechte beim Chief
- Unabhaengiger Reviewadressat (Main/Chief): Chief `/root`

## Kurzfazit

Die verpflichtende reale IndexedDB-Auswahlgrenze ist aktuell nicht
einhaltbar: ein uebergrosser, vom `validRegions`-Set akzeptierter `regionId`
wird erfolgreich persistiert. Damit kann R4-B keine vollstaendige GREEN-
Matrix beanspruchen. Kein Produktcode wurde von diesem Writer geaendert.

## Delegationsaufwand (falls zutreffend)

- Arbeits-/Koordinationszeit, Nacharbeitsrunden, Konflikte: eine echte
  Browserreproduktion, danach Stopregel angewandt
- Gemessene Token/Kosten mit Beleg oder `unbekannt`: unbekannt
- Aufwands-/Versuchsgrenze eingehalten / Eskalation: eingehalten; Befund
  unmittelbar an Chief gemeldet
- Helferhandoffs, gepruefte Befunde und Disposition: keine Kinder

## Verwendete Quellen

- `AGENTS.md`
- `docs/tasks/WRN-G3-020-P2-R4-TEST-COMPLETION.md`
- `docs/tasks/WRN-G3-020-P2-R4-R1-PRODUCT-CORRECTION.md`
- `docs/tasks/WRN-G3-020-P2-R2-FINAL-CONTRACT.md`
- `docs/tasks/WRN-G3-020-P2-R3-CORRECTION.md`
- R4-R1-Evidence und Handoff

## Geaenderte Dateien

- `docs/evidence/WRN-G3-020/P2-R4-B-IDB-MATRIX.md`
- `docs/handoffs/WRN-G3-020-p2-r4-b-idb-matrix.md`

Keine Produkt-, Fixture-, Konfigurations-, Dependency- oder bestehende
Testdatei bleibt geaendert.

## Tests und Belege

- Bestehende G3-020-Playwright-Spec auf `mobile-390x844`, ein Worker: 6 PASS
  vor der Probe.
- Temporäre echte Chrome-/IndexedDB-Probe: RED. Ein `regionId` mit deutlich
  mehr als 4.096 serialisierten UTF-8-Bytes konnte durch `save()` mit einem
  passenden `validRegions`-Set erfolgreich gespeichert werden.
- Erwartung `storage-failure`, erhalten `saved`.
- Die Probe wurde nach Reproduktion entfernt und nicht eingecheckt.

## Feststellungen nach Prioritaet

1. **Medium/Produktvertrag:** Die Bytecap aus R2-04, R3-05 und R4-B-8 wird im
   produktiven Selection-Savepfad nicht vor dem Sink erzwungen.
2. Kein Hinweis auf Datenloeschung, Auto-Retry oder fremde Datenmutation;
   die Begrenzungs-/Fail-closed-Garantie fehlt dennoch.

## Annahmen und offene Fragen

Der öffentliche Storevertrag nimmt `validRegions` als Caller-Eingang.
Deshalb ist die Cap nicht allein durch die heutige Taxonomie-ID-Länge
abgedeckt. Falls der Chief die API absichtlich weiter eingrenzen will, muss
das in einem neuen, engen Produktvertrag begruendet und getestet werden;
dieser R4-B-Writer hat keine solche Semantikaenderung vorgenommen.

## Restrisiken

Weitere R4-B-Pflichttests koennten weitere Produktbefunde zeigen. Sie wurden
nicht spekulativ ausgefuehrt, weil der erste reproduzierte Produktbefund die
Teilinstanz fail-closed stoppt.

## Empfohlener naechster Schritt

Chief bindet eine minimale Produktkorrektur: ueberpruefe die UTF-8-Groesse
des exakt zu persistierenden Selection-Records vor `put`; bei `4097` darf
weder Record noch Generation entstehen. Danach Sol-Precheck, enger Writer,
frische QA/Security und erneute R4-B-Matrix.

## WRN-AGENT-STATUS

- Task: WRN-G3-020 P2-R4-B IDB-Matrix
- Status: RED – Produktkorrektur erforderlich
- Quellstand: `78bdf8c`, Produkt `c86735f`
- Erledigt: reproduzierbarer echter Browser-/IDB-Befund
- Tests: 6 bestehende G3-020-Playwrightfälle PASS; Capprobe RED
- Offen: enger Produktfix, Precheck, neue R4-B-Instanz und Restmatrix
- Handoff: dieser Pfad
- Naechster Schritt: Chief entscheidet und disponiert Korrektur
- END-CHECK: :)
