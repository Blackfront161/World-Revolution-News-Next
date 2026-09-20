# WRN-G3-014 – kritischer Controllerabschluss nach S7

PO-071; kein neues Produktziel. Start erst nach gesicherter S7-Diagnose und
abgeschlossenem Safety-Equality-Fix. Genau eine frische Schreibinstanz,
keine Kinder. Chief reserviert im kanonischen Register.

## Einmaliges risikobasiertes Modellrouting

Fachlicher Backend/Data-Owner als generischer `worker`, ausdruecklich
`gpt-5.6-sol` / high. Dies ist die einmalige Incident-Behebung der belegten
H-001/H-003 und M-001/M-002 nach wiederholt unvollstaendiger S6-Umsetzung,
keine neue permanente Rolle oder Profilkonfiguration. Das akzeptierte
Kostenrouting erlaubt die hoehere Klasse bei belegtem Risiko/Unklarheit.
Keine kostenpflichtige externe Modell-API, keine neuen Befugnisse. Anschliessend
wieder regulaeres Terra-Frontend/QA und unabhaengiger Sol-Architekturabschluss.

## Schreibrechte

- Beide `content-offline-controller.ts` und ihre Tests.
- Beide `content-offline-store.ts` NUR fuer eine revalidierte, generation-
  gebundene Leseprojektion der gespeicherten Kandidat-/Vorhermetadaten.
  Persistenzformat, Schema, Schreibtransaktionen und Loeschregeln unveraendert.
- Beide `local-content-release.ts` und enge Tests nur fuer gebundene
  Transport-/Abbruchgrenzen und bekannte-Safety-Verwendung.
- Bestehende externe Controller-E2E und enge neue Controller-/Transport-
  Harnesses im Elternscope. Testsetup nur fuer realistische Stream-/Cancel-
  Mocks. Keine Lockerung vorhandener Negativ-/Releaseboundary-Tests.
- Aktueller Controller-Evidence-/Handoffbericht darf den S6-Draft ersetzen,
  unter klarer Nennung der gesicherten historischen Teilcheckpoints.
  Weitere Belege unter `docs/evidence/WRN-G3-014/controller-recovery/`.

Keine App.tsx, Styles, Sprachkataloge, Contracts/Domain (Equality separat),
Publisher/public-Releases, Root-/Packageconfig, Dependencies oder Liveaktionen.
Echter neuer Unterbaudefekt zuerst an Chief; kein stiller Schreibbereichwechsel.

## Verbindlicher Abschlussvertrag

Normativ sind CONTROLLER-COMPLETION-Brief und die beiden Abschnitte
`Kleiner verbindlicher Abschlussvertrag fuer P3` sowie `Noch offene Belege`
der gesicherten S7-Diagnose. Insbesondere jedes async Ergebnis mit
vollstaendiger nullable aktiver Projektion, Leseerlaubnis, Persistenzart,
eigener Pruef-/Ablaufzeit, Kandidat/Vorher-Metadaten, Controlbezug und
wahrheitsgemaessen Aktionen. Nicht nur optionale Deklarationen ohne Werte.

Sessionguard muss Erststart und eindeutiges IDB-aus erlauben, aber bekannten
Ledger, neue Sperren, Pending, unklaren Speicher und Safetywritefehler nie
umgehen. B-Staging liefert aktives A plus B-Metadaten. Clear entwertet auch
alte RAM-/Restoreergebnisse. Ein Operationsslot und eine ab Vorbereitung
laufende 15-s-Ergebnisgrenze umfassen alle Pfade; Abortbit allein genuegt nicht.
Spaete Arbeit darf weder committen noch Runtime liefern. Keine Autoretries.

## Test-first und Abschluss

S7 liefert bereits rote Default-Loader-Belege. Diese zuerst unveraendert
nachpruefen und als Ausgang binden. Dauerhafte Regressionen nutzen echte IDB
und Defaultloader auf gerouteten A/B/C-Bytes, NICHT fertige `check`-Resultate.
Fehlerinjektion nur zum jeweiligen ausgewiesenen Fehlerfall, nicht zum
Umgehen der normalen Transport-/Safetykette.

OFF-24 schliesst auch Wiederholungen bei bereits vorhandenem Kandidaten oder
Vorherstand ein: Ein neues Save/Recheck von A darf einen noch gestagten B-
Kandidaten nicht versehentlich aktivieren oder als aktive A-Runtime ausgeben.
Die Store-Identitaet und gesamte Ergebnisprojektion muessen zusammenpassen.
Quellharnesses starten auf isolierter Leerpage, ohne nebenher die React-App
zu mounten; dadurch bleiben sie auch nach P3 echte unabhaengige Speicherproben.

Alle S7-D01–D10-Pflichten und die offene Cb-/Transportmatrix abdecken; fuer
isolierte D10-Metadaten zusaetzlich einen Defaultloader-Nachweis liefern.
Storebelege aus P2-S gezielt wiederverwenden, nicht als Controllerbeleg
umetikettieren. Erst nach kompletten Flows volle Format-/Lint-/Boundary-/
Typecheck-/Unit-/Build-/Releaseboundary-Matrix. Historischer Sammelbefehl
`check` bleibt laut Baseline ungebunden. Exakte Toolchain, keine Installation.

Fachliche Zwischenupdates erlaubt, keine finale Teiluebergabe ohne echten
Blocker. Zwei erfolglose Fixrunden desselben Befunds -> Chief-Diagnose.
Vor Abschluss OFF-01–25 dispositionsgenau auf Contract/Store/Controller und
noch offene UI-Anteile abbilden. OFF-26 ausgeschlossen. Handoff nennt genaue
API und einen sicheren P3-Aufrufablauf, keine React-Safetyrekonstruktion.
Lokal nur eigene Dateien committen, danach Agent beenden. P2-GREEN ausschliesslich
durch Chief-Gesamtabgleich; unabhängige QA und PO-Abnahme stehen weiterhin aus.

END-CHECK: :)
