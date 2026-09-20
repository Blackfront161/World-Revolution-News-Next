# WRN-G3-014 – sequenzielle Teilauftraege

PO-071, 28. August 2026: `START WRN-G3-014` und „und danach weiterfahren“.
Verbindlicher Umfang: `WRN-G3-014-LOCAL-CONTENT-OFFLINE-TRANSACTIONS.md` plus
`../evidence/WRN-G3-014-OFFLINE-PARITY-AND-ACCEPTANCE-PLAN.md`.
Chief reserviert jeden Einsatz im kanonischen Register vor Spawn. Genau ein
Subagent, keine Kinder. Repoausgang `3fa3d3f`; jeder Dispatch bindet den
neuesten gesicherten Checkpoint. Fremde Aenderungen erhalten, keine Livezugriffe.

## P1 – Architektur-Vorcheck

- Profil/Modell: `independent_architecture_reviewer`, Sol/high.
- Read-only gegen Taskvertrag und aktuelle Content-/Domain-/Clientgrenzen.
- Schreiben nur `docs/evidence/WRN-G3-014/ARCHITECTURE-PRECHECK.md` und
  `docs/handoffs/WRN-G3-014-architecture-precheck.md`; keine Produkt-/Testaenderung.
- Pruefen: Sicherheitsledger/Teilfehlersperren, IDB-Transaktionsreihenfolge,
  Generation/Clear-Epoch, Lebenszyklus/TTL, UI-Integration, scopegenaue Tests.
- Eine vollstaendige Pruefung, konkrete reproduzierbare/vertragliche Findings
  priorisieren, keine allgemeine Vollrepoanalyse. Bei realer Wahl ausserhalb
  des Vertrags Optionen an Chief statt selbst entscheiden.

## P2 – Backend/Data

- Profil/Modell: `backend_data_reliability_engineer`, Terra/high.
- Erst nach GREEN P1. Exklusive Schreibpfade: additive Contentcontracts und
  reine Domain samt Tests, beide `content-offline-store.ts`, eng benannte
  Offline-/Transporthelfer und `local-content-release.ts` samt Tests,
  neue A/B/C-Fixtures und E2E-Storageharness im Elternscope.
- Kein App.tsx/Styling/UI-Katalog, keine Package-/Rootconfigaenderung.
- Zuerst Schnittstellen/Fehlervertraege und rote Regressionen, dann echte IDB.
  Exporte/Imports frueh kompilieren; kein Gruen nur ueber gemockte Speicher.
- Handoff beschreibt exakte UI-API, Safetyguard/Reader/Resume-Verpflichtungen,
  Implementierungstests, verbleibende Frontendintegration. Gesicherter Commit.

### P2-Rest nach den Teilcheckpoints 21de12f und 2bf3aee

Beide Einsaetze sind beendet; keiner hat vollstaendiges P2-GREEN. Der Chief
teilt den vorhandenen Scope sequenziell weiter auf, damit nicht erneut ein
zu breiter Restauftrag als scheinbar fertige Frontendgrundlage uebergeben wird:

1. P2-L: Offline-Safetyvalidatoren und reine Zeit-/Guardregeln mit roten
   Regressionen pruefen/korrigieren. Eigentum nur additive G3-014-Bloecke in
   Contentcontracts/Domain samt Tests und enger Testfixtureerweiterung.
2. P2-S: echte beidseitige IDB-Semantik und Fehlerfalltests schliessen:
   Transaktionsabschluss, Abort/late-open, geschuetzte unbekannte Daten,
   Budgets, Pointer/CAS, Pending/Recovery/Clear, Safetypruning und TTL.
3. P2-C: vollstaendige UI-neutrale Clientcontroller samt Tests fuer Restore,
   Save, expliziten Check, Staging/Aktivierung, Rollback, Clear und Guard.
   Die Reihenfolge Pending -> Quellenbeleg -> Safetycommit -> vollstaendiger
   Kandidat -> passender Abschluss bleibt Backendverantwortung, nicht P3.
4. P2-Abgleich: alle OFF-01–25-Pflichten ohne UI an konkrete Belege binden;
   offene UI-Anteile exakt P3/P4 zuordnen. Kein pauschales PASS fuer eine ID.

Jeweils genau ein frischer `backend_data_reliability_engineer`, keine Kinder;
naechster Unterauftrag erst nach gesichertem Handoff. Umfang/Modell unveraendert.
Berichte benennen nur ihren Teilabschluss; P2-GREEN erst nach Chief-Abgleich.
Die nachfolgenden engen Briefs stehen in
`WRN-G3-014-STORAGE-COMPLETION.md` (P2-S) und
`WRN-G3-014-CONTROLLER-COMPLETION.md` (P2-C) im selben Ordner.

Nach S7-Diagnose `600eefe` gilt die engere Restfolge in
`WRN-G3-014-SAFETY-EQUALITY-CORRECTION.md` und
`WRN-G3-014-CONTROLLER-RECOVERY.md`: zuerst Terra-Equality-Fix, danach einmalig
Sol/high als generischer Worker fuer die belegte kritische Controllerbehebung.
Das ist risikobasiertes Routing innerhalb PO-071, keine Profil-/API-Kosten-
aenderung. Beide Auftraege bleiben strikt sequenziell; P3-Gate unveraendert.

## P3 – Frontend

- Profil/Modell: `frontend_brand_engineer`, Terra/high; nach P2-Handoff.
- Exklusive Schreibpfade: beide App.tsx, eng notwendige Offlinekomponenten,
  Styles/Tests, neue Offline-Schluessel in allen neun vorhandenen Katalogen,
  E2E-Inhaltsflows und exakt eingegrenzte neue IDB-Nebenwirkungsassertions.
- Keine eigenmaechtige Vertragskorrektur; Vertragsbefund zuerst an Chief,
  Schreibrecht vor Rueckgabe an P2 sichern. Kein allgemeines Redesign.
- Atomarer aktiver Snapshot fuer alle Consumer, ehrliche Status-/Fehlertexte,
  Bestaetigungsdialoge, Keyboard/Fokus/200%-Reflow. Voller lokaler Testlauf.

### P3-Integrationscheck vor Kandidatenuebergabe

Diese Punkte konkretisieren den bestehenden Elternvertrag, kein Zusatzscope:

- Den P2-Controller verwenden; weder eigene IDB-Zugriffe noch einen zweiten
  Loader-/Safety-/TTL-Vertrag in React erfinden. Fehlende P2-API zurueckmelden.
- Lesen richtet sich nach `readAccess === 'allowed'` und nicht-null `runtime`,
  nicht nach `status === 'active'`. Auch eine erlaubte Sitzung ohne Speicherung
  und A nach einem fehlgeschlagenen B-Check koennen lesbar bleiben; die
  Operationsmeldung wird getrennt angezeigt. Kandidatenmetadaten sind keine
  aktive Runtime und loesen keinen stillen Inhaltswechsel aus.
- Feed, Discover, Reader, Archiv und Lesestatus-Reconciliation aus EINEM
  aktiven Runtime-Snapshot ableiten; Schutzmodus entfernt auch bereits offene
  Reader-/Archiv-/Quellendialogansichten mit nicht mehr zulaessigem Inhalt.
- Readerzugriff, Browser-History, Resume und Zeitablauf pruefen. Ein schon
  geoeffneter Artikel darf nicht allein durch fehlende Navigation weiterlaufen;
  ein Fristwaechter darf pruefen/sperren, aber keine Quellen nachladen.
- `Auf neuen Stand pruefen` aktiviert keinen Kandidaten still. Erfolgreich
  abgeschlossenes Staging ohne neue Sperre macht A wieder nutzbar; ein
  ausstehender Sicherheitsabgleich bleibt dagegen ehrlich als Schutz sichtbar.
- Clear und Rueckwechsel bestaetigen; Escape/Abbrechen schreiben nichts und
  stellen den Fokus wieder her. Clear entfernt keinen Sprach-/Theme-/Lesekey.
- Lesestatus-Reconciliation nur aus einem vollstaendig gueltigen aktiven
  Inhaltsstand ausfuehren. `runtime: null` nach Clear/Schutz ist keine leere
  Inhaltsautoritaet und darf gespeicherte Leselisten-/Fortschrittsdaten nicht
  als angeblich entfernte Artikel bereinigen.
- Revision/Pruefzeit, sitzungsweise versus gespeichert, Kandidat und genaue
  naechste Aktion zeigen. Keine Meldung `gespeichert` vor IDB-complete.
- Neue Texte in allen neun Katalogen, keine sichtbaren technischen Fehlercodes
  oder Rohdaten. Bestehende Sprach-/Themeauswahl bleibt unveraendert.
- Inhaltsverwaltung im Hauptinhalt der vorhandenen Mehr-Ansicht anordnen,
  nicht als grosses Zusatzpanel im kompakten Websiteheader. Die akzeptierte
  Header-/Logogeometrie und vorhandene Navigationsziele bleiben erhalten.
- Bisherige No-IDB-Assertion in `tests/e2e/foundation.spec.ts` nur gezielt auf
  den jeweiligen neuen Datenbanknamen/Stores anpassen. Cache Storage, Service
  Worker, Cookies, fremde Datenbanken und ungebundene Keys bleiben verboten.
- Die vorhandene Loader-Testinjektion kann als explizite Testschnittstelle
  erhalten bleiben, darf aber im normalen Produktpfad keinen zweiten Loader
  neben dem Controller aufrufen. `?state=offline` ist kein Nachweis eines
  gespeicherten Inhalts und darf Schutz oder fehlende Bundles nicht umgehen.
- Pro Effect-Mount eine neue Controllerinstanz; Cleanup beendet genau diese.
  StrictMode-Remount darf keine bereits entsorgte Instanz wiederverwenden.
  Navigation/History und offene Dialoge nach jedem Schutzwechsel pruefen.
- Reine Store-/Controller-Quellharnesses duerfen beim Teststart nicht nebenher
  die integrierte React-App mounten und damit eine zweite IDB-Verbindung
  oeffnen. Falls nach P3 erforderlich, besitzt P3 die eng isolierte
  Leerpage-Initialisierung in den bestehenden Offline-E2E-Specs. Keine
  Store-/Safety-Assertion entfernen oder vereinfachen; echte UI-Flows bleiben
  getrennt auf der tatsaechlichen App und gebauten Website.

## P4 – unabhaengige QA

Chief-Zwischencheck waehrend S10 (kein fertiger Kandidat): Die erste
Save/Clear-UI-Probe reicht nicht fuer P3. Vor Uebergabe sind die bereits
gebundenen Guards vor Reader/Archiv/Quelle/History, Visibility-Resume,
guard-versus-operation-Busy-Reihenfolge, lokalisierten Fehlertexte ohne
Platzhalter, erklaerte erhaltene Sicherheitsmetadaten sowie Dialogfokus
vollstaendig zu belegen. Eine korrigierte alte Sofortassertion ist kein
Test-first-Nachweis fuer das neue Verhalten. Abweichende Testreihenfolge
wird ehrlich im Implementierungsbericht dokumentiert. Echte UI-Proben fuer
A/B/A, B-Teilfehlerschutz, C bei offenen Ansichten, Clear/Lesedaten,
StrictMode/Unmount und spaete Ergebnisse bleiben Implementierungsumfang.

- Profil/Modell: `qa_release_engineer`, Terra/high; nach gesichertem Kandidaten.
- Produktcode read-only; Schreiben nur G3-014-Evidence/Handoff und eng benannte
  unabhaengige Testharnessdateien. OFF-01 bis OFF-26 dispositionsgenau, alle
  Regressionen und frische Visual-/A11y-/Runtimebelege fuer beide Clients.
- Keine Snapshotblindupdates, keine Scope-/Testabschwaechung. Findings direkt
  an Chief. Korrekturen gehen an frischen passenden Implementierer, danach
  frische unabhaengige Re-QA. OFF-26 bleibt ehrliches Nichtziel.
- Vorhandene deterministische Visualharnessstruktur aus
  `docs/evidence/WRN-G3-013/M001-po068-final-reqa/capture-po068-final-reqa.mjs`
  darf als Referenz dienen; historische Evidence niemals ueberschreiben.
  Fuer G3-014 neue Pfade und aktuellen Kandidaten binden, IDB-Whitelist eng
  anpassen. Alte `[]`-IDB-Erwartung ist keine aktuelle Produktanforderung.

### P4-Nachweisgrenze nach gesichertem P2

- Backendbasis `7b449c7`: finale S9-Reports sind `runtime-r24-final.json`,
  `full-browser-final.json` und `s9-diagnostics-r24-final.json` unter
  `docs/evidence/WRN-G3-014/controller-recovery/`; aeltere Reports dort sind
  historische Zwischenstaende. Der finale Produktkandidat wird erst nach P3
  gebunden. Implementierungsevidenz ersetzt keine unabhaengige UI-Pruefung.
- Echte integrierte UI auf Mobile und GEBAUTER dynamischer Website pruefen;
  Sourceharnesses sind nur fuer reine Controller-/Storefaelle ausreichend.
  A/B/C kontrolliert ueber Testrouten, keine Produktfixtures oder Livequellen.
- Nach B-Pruefung A in Feed/Suche/offenem Reader belegen; erst nach expliziter
  Aktivierung alle Consumer aus B. Bei Teilfehlern zulaessiges A erhalten;
  bei verifizierter C-Sperre auch bereits offene geschuetzte Ansichten schliessen.
- Clear/Schutz darf Leselisten-/Fortschrittsdaten nicht durch Reconciliation
  gegen eine kuenstlich leere ID-Menge loeschen. Snapshot der erlaubten
  Sprach-/Theme-/Lesekeys vor/nach bestaetigtem Clear und erneutem Laden.
- Mount -> Reflow, Mount -> Schutz, Reader -> Hintergrund/Resume und
  Clear -> verspaetetes Ergebnis als zeitliche Ablaufe pruefen. Nicht nur
  bereits vor dem Mount vorbereitete Endzustaende fotografieren.
- OFF-IDs mit konkreten neuen Belegen oder unveraenderten Backendnachweisen
  verbinden; keine globale PASS-Pauschale fuer nicht ausgefuehrte UI-Anteile.
  Rohdaten nur technischer Testzustand, keine Artikel-/Nutzdatenprotokolle.

## P5 – Architekturabschluss

- Frischer `independent_architecture_reviewer`, Sol/high; Kandidat read-only.
- Nur G3-014-Bericht/Handoff schreiben. Sicherheits-/Vertrags-/Packagegrenzen,
  Ledger/Rollback/Clear und QA-Nachweise pruefen; keine Selbstkorrekturen.
- Erst bei GREEN aller Gates Vorschau und kurze PO-Abnahmecheckliste.

## Aufwand, Recovery und Entscheidungen

Jeder Implementierungseinsatz liefert nach einem fachlich vollstaendigen
Teilstand ein Handoff; vor einem zweiten ungleichen Arbeitsbereich erneut
Scope pruefen. Hoechstens zwei erfolglose Korrekturrunden am selben Befund:
dann Schreibarbeit sichern und read-only Incident-Diagnose statt weiterer
Blindversuche. Ein Reviewer liefert maximal eine Erstpruefung plus eine eng
begruendete Rueckfrage; neue Vollpruefungen nur bei neuem Kandidaten/Beleg.
Tokenwerte nur werkzeugbelegt, sonst unbekannt. Keine Zusatz-API-Kosten.

Chief darf beweisgestuetzte Korrekturen innerhalb des vereinbarten Verhaltens
beauftragen und dokumentarische Praezisierungen ohne neue Produktentscheidung
binden. Keine Abschwaechung von Akzeptanz/Safety und keine Scopeausweitung.
Bei Architekturwahl ausserhalb des Vertrags, unkontrollierter Datenverlust-/
Privacywirkung, neuen Befugnissen/Kosten oder unloesbarem Problem PO fragen.
Der Paketmodus hebt die sichtbare Produktabnahme nicht auf.

END-CHECK: :)
