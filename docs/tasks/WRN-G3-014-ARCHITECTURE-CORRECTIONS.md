# WRN-G3-014 – enge Korrekturen aus dem Architekturabschluss

Freigabe: Chief-Disposition innerhalb PO-071, keine neue Produktentscheidung.
Ausgang: Produkt `b187fc3`, unabhaengige QA `6168d46`, S14-Commit `97dc762`, Abschlussbericht
`docs/evidence/WRN-G3-014/ARCHITECTURE-FINAL.md`. S14 muss vor S15 beendet
und sein Handoff gesichert sein. Genau EIN Subagent, keine Kinder. Register
und Governance bleiben ausschliesslich beim Chief. Historische Evidence
bleibt unveraendert. Kein Kandidaten-GREEN aus alten Tests ableiten.

## S15 – fehlgeschlagener Quellencheck darf Uhrsperre nicht aufheben

Owner: ein frischer `backend_data_reliability_engineer`, Terra/high.
Lesen: Haupttask insbesondere Regel 21, S14 M-001 samt Partial-/Complete-A-
Vergleich und `docs/handoffs/WRN-G3-014-controller-completion.md`.

Schreiben ausschliesslich:

- `apps/mobile/src/content-offline-store.ts` und Websitegegenstueck;
- nur falls beweisbar notwendig die entsprechenden `content-offline-controller.ts`;
- enge vorhandene/neue Tests dieser Dateien sowie neue
  `tests/e2e/content-offline-clock-regression.spec.ts`;
- eigener Bericht `docs/evidence/WRN-G3-014/CLOCK-CORRECTION.md`, eigener
  Ordner `docs/evidence/WRN-G3-014/clock-correction/` und Handoff
  `docs/handoffs/WRN-G3-014-clock-correction.md`.

Keine UI, Kataloge, Loader, Domain-/Datenvertraege, Fixtures, Rootkonfiguration
oder fremde Evidence aendern. Falls eine andere Grenze erforderlich scheint,
zuerst belegen und Chief fragen, nicht eigenmaechtig ausweiten.

RED vor Korrektur in beiden Clients mit echtem Defaultloader und echter IDB:
A bei t0 speichern; Guard bei t0+10000; Uhr t0+5000; B-Check mit ungueltiger
Supplementalpayload bei gueltigem Safetyteil; Instanz beenden; frische Instanz
auf derselben DB bei t0+5000, Inhaltsnetz gesperrt. Diese darf A nicht freigeben
und keinen automatischen Quellenrequest starten. Raw-Control und Bundlezeiten
vor/nach, bestaetigte Generationen und Requests protokollieren; nur Testdaten.
Nach Fix gleicher Test GREEN; normaler fehlgeschlagener B-Check ohne
Uhrregression darf erlaubtes A weiterhin unverjuengt erhalten.

Korrekturgrenze: Ein Safety-only-/fehlgeschlagener Check ist KEIN erfolgreicher
vollstaendiger Quellencheck und darf deshalb den beobachteten Zeitanker nicht
nach unten verschieben oder die Uhrsperre nach Wiederanlauf vergessen.
Eine vollstaendige erfolgreiche erneute Quellenpruefung ist nach Regel 21
anders zu behandeln. S14 weist fuer Complete-A neue BundlecheckedAt und
lastSuccessfulSourceCheckAt nach. Kein pauschales Verbot eines legitimen neuen
Zeitankers, keine neue permanente Uhr-/Verfuegbarkeitspolicy und kein
manipulationssicherer Uhrschutz. Den Complete-A-Vergleich frisch erhalten und
seinen unveraenderten Sitzung-/Restartunterschied ehrlich dokumentieren.
Neue Candidatewrites nicht ohne entsprechenden RED-Nachweis umbauen.

Chief-Praezisierung nach S15-Erstversuch: Nur `recordSafety` monoton zu machen
schloss Partial-B, sperrte aber entgegen der Gegenprobe auch Complete-A nach
Restart. Dieser Zwischenstand ist nicht akzeptiert. Zweiter enger Fixpfad:
Safetywrite monoton; `completeRecheck` darf die bereits bestehende legitime
Vollcheck-Reankerung anhand einer ausschliesslich intern aus dem vollstaendig
validierten Checkresult abgeleiteten Erfolgsinformation ausfuehren. Ohne
diesen Beleg bleibt die Operation Safety-only/monoton. Bestehende Generation-,
Pending- und Ledgerpruefungen erhalten, kein UI-Flag, kein serialisierter
Schema-/Domainwechsel. Beide Store-/Controllergrenzen sind dafuer erlaubt.
Ein Abbruch vor dem passenden Complete-Recheck darf nicht vorzeitig reankern.
Die Gegenprobe erwartet wie S14 Complete-A nach Restart ALLOWED, nicht einen
an die unbeabsichtigte neue Sperre angepassten Test.

Bestehende Zeit-/TTL-, Pending-, Safety-/Quota-, Clear-/Generation- und
Controllerregressionen frisch pruefen. Toolchain 24.19.0/11.19.0; Format,
Lint/Boundaries, tatsaechliche Typechecks, Unit-/statische Tests, beide Builds
und Releaseboundary. Gesamte Browsermatrix erfolgt nach S16 frisch unabhaengig;
S15 muss seine eng betroffenen bestehenden Browserfaelle ausfuehren und nennen.
Quellcommit und Evidence/Handoff sichern; danach Schreibarbeit beenden.

## S16 – Quellenbestaetigung an den aktiven Snapshot binden

Start erst nach Chief-Abgleich und gesichertem/beendetem S15. Ein frischer
`frontend_brand_engineer`, Terra/high. S14 M-002 lesen und vor Fix reproduzieren.
Schreiben nur beide `App.tsx`, falls eng notwendig beide `content-offline-ui.ts`
und zugehoerige Tests; neuer
`tests/e2e/content-offline-source-confirmation.spec.ts`; eigene Evidence
`docs/evidence/WRN-G3-014/SOURCE-CONFIRMATION-CORRECTION.md`, Ordner
`source-confirmation-correction/`, Handoff
`docs/handoffs/WRN-G3-014-source-confirmation-correction.md`.
Backend, Vertraege, Fixtures, Kataloge, Styles und allgemeines Design read-only.

Echte zwei Tabs je Client, gemeinsame echte IDB, Defaultcontroller; Website-UI
gebaut. Tab 1: A-Reader mit offener Quelle. Tab 2: vollstaendig geprueftes B
mit gleicher Artikel-ID, anderer Quelle/Original-URL aktivieren. Tab 1:
Resume/Guard; Reader darf B darstellen, aber alte Quellenbestaetigung muss
sicher verworfen sein. Eine neue ausdrueckliche Quellenaktion muss B anzeigen.
Keinen externen Link anklicken oder durch Testnavigation oeffnen.

Kein stilles Umbiegen eines bereits zur Bestaetigung angebotenen Links.
Dialog an aktive Snapshotidentitaet binden, bei Wechsel schliessen, Fokus
sinnvoll zur aktuellen Ansicht zurueckgeben. Keine zweite Safety-/Storagepolicy.
Unveraenderter Snapshot/normaler Guard darf Dialog nicht unnoetig schliessen;
Null-/Schutzruntime, Clear, gleiche-ID-Navigation, Cancel/Escape/Fokus und
spaete Ergebnisse bleiben abgesichert. S15-Dateien nicht veraendern.

RED/GREEN, beide Clients, Quellenname/Host/URL und Runtimeidentitaet belegen,
zugehoerige Original-PNGs binden, null externe Requests und Konsolenfehler.
Passende UI-/Lifecycle-/Dialogregressionen sowie volle statische Matrix und
beide Builds pruefen. Eigenen Kandidaten und Handoff sichern, dann beenden.

## Gemeinsame Grenze und Abschluss

Keine Installationen/Dependencies, Alt-/Live-/Nutzdaten, SW/Cache Storage,
Android, externe APIs, Cloud, Remote/CI, Deployment, Signierung oder Release.
Fremde Aenderungen erhalten, ausschliesslich eigene explizite Pfade stagen.
Gesperrte Git-Indexschreibrechte mit normaler gezielter Freigabe anfordern,
keine Lock-/ACL-/Konfigurationsumgehung. Nur eigene Testserver beenden.
Chief-Vorschauen 43113/43114 nicht stoppen; Testports sequenziell besitzen.

Hoechstens zwei erfolglose Korrekturversuche pro Befund, danach gesichertes
Handoff an Chief und gezielte Diagnose. Kein endloser Blindfix. Fakten,
Harnessfehler und Produktfindings trennen. Tokenwerte ohne Messung unbekannt.
Nach S16 frische unabhaengige gesamte Re-QA und frischer gezielter P5-Recheck.
Erst danach technische Sichtabnahmebereitschaft; PO-Abnahme bleibt offen.

END-CHECK: :)
