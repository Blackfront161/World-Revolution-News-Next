# Website: Wissen, Hilfe und Solidarität

- Teil des PO-Gesamtauftrags `WRN-RELEASE-COMPLETION-2026-09-10`.
- Basis `3285e49`, nach read-only Websiteinventar durch Luna.
- Chief `/root`; Delegation: erlaubt, genau ein Terra-Frontendwriter in Slot3,
  keine Kinder/Indexrechte. Danach unabhängige vorhandene Terra-QA.
- Nutzen: Die drei Website-Navigationsziele führen derzeit nur zu einem
  Migrationsplatzhalter. Sie sollen dieselben bereits erfassten Inhalte und
  geeigneten Kernfunktionen wie die Mobile-App nutzbar machen.

## Exakter Schreibbereich

- `apps/website/src/App.tsx` ausschließlich Route-/Fokus-/gegebenenfalls
  bestätigte Draft-Navigationsintegration dieser drei Ziele.
- Neue `apps/website/src/features/knowledge/` und `features/support/`:
  eigenständige Websitekomponenten, lokale begrenzte Loader, CSS und Tests.
- Datenkopien ausschließlich byteidentisch aus den aktuellen Mobile-
  `features/knowledge/data/legacy-knowledge-v1.json` und
  `features/support/data/legacy-support-v1.json`. Als erzeugte lokale
  Clientausgabe behandeln; eigene Tests binden feste SHA256, Counts/Revision.
  Keine runtime- oder Testimporte aus Mobile; kein neuer Rohdatenimport.
- `apps/website/src/App.test.tsx` nur konkrete neue Routentests, keine
  bestehenden Erwartungen abschwächen.
- Neuer `tests/e2e/website-knowledge-support.spec.ts` für reale Nutzerflüsse,
  Browser-/Axe-/Reflowbelege; exklusiver Browser erst nach Chief-Zuweisung.
- Eigene Evidence/Handoff unter
  `docs/evidence/WRN-WEBSITE-KNOWLEDGE-SUPPORT-2026-09-10.md` und
  `docs/handoffs/WRN-WEBSITE-KNOWLEDGE-SUPPORT-2026-09-10.md`.

## Wiederverwendung und Grenzen

Bestehende neutrale Contracts/Projektoren, Sprachkataloge und Brandtokens
verwenden. Die historischen `mobile-*`-Contractnamen bezeichnen aktuell
neutrale Datenprüfer, keine Erlaubnis für Mobilekomponentenimporte. Keine
gemeinsamen Paket-, Mobile-, Reader-/Save-/Offline-/Medien- oder Buildconfig-
Änderungen; damit bleibt der Content-Migrationsbereich disjunkt.

609 Buchmetadaten/22 Lexikonbegriffe,11 Hilfsangebote/30 historische Profile
müssen auffindbar bleiben. Websiteeigene responsive Darstellung, Suche und
die vorhandenen fachlichen Filter, Quellenangaben, Originalsprache und sichere
Original-/Katalogverweise. Historische Profile nicht als aktuell ausgeben.
Geeignete bestehende Briefwerkstattfunktion mit lokalem Draft, Warnungen,
Druck/Download, explizitem Entwurfverwerfen und Navigationserhalt übernehmen,
ohne fremde Kontakte anzuschreiben oder sensible Daten extern zu übertragen.
Keine vollständigen Bücher/Offlinepakete oder Kontaktdatenaktualität behaupten.

## Abnahme

- Navigation knowledge/help/solidarity rendert echte Fachansichten statt
  Migrationsplatzhaltern; H1→H2→H3, Fokus nach Navigation/Laden erhalten.
-9 UI-Sprachen, Quellen-/Textsprachen separat korrekt; sichere externe Links
  mit noopener/noreferrer, keine automatischen Fremdrequests.
- Strict JSON-/Größen-/UTF8-/Contractprüfung; Abort/Unmount/Retry und kein
  erfolgreicher Cache aus ungültigen Daten. Datenkopien gegen Pins prüfen.
- Unit-/Routentests für Suche/Filter/Entwurf und Fehlerzustände; echte
  Browserflüsse bei390/320, RU200%, Desktop, Violett/Rot und Rot/Cyan/hell.
- Axe, Keyboard,44px-Bedienziele, kein unerwarteter Overflow; neue Bilder in
  frischem eindeutigen Outputordner und ausgewählte gesicherte Hashbelege.
- Website-Unit/Typ/Build, ScopedLint/Format, echte Import-/Fixtureprüfung;
  vorhandene Website-Reader-/Offline-Tests erhalten. Kein pnpm/Installationslauf.

Rücknahme über eigenen Kandidaten; kein bestehender Website-Speicher verändert.
Keine Services/Provider/Signierung/Veröffentlichung. Handoff END-CHECK: :).

## Präzisierung aus konkreter Writerprüfung

Chief bestätigt den tatsächlichen Support-SHA256 per Get-FileHash:
`bbd721dc73f0b67e4065618248a1bcd6c86938beb164684e1ccdf1ad54c2e75f`.
Die erste Chatübergabe enthielt ein zusätzliches `5` und damit65Zeichen;
das war ein Übertragungsfehler, keine Datenänderung. Knowledge bleibt
`26eb4c118d0483788f07ef0b103c97e1cf53fbf75d36a61ae47456146240726b`.
Feste Tests binden die tatsächlichen64-stelligen Pins.

Der bestehende Website-Offlinebuilder verlangt einen geschlossenen JS-Graphen.
Deshalb werden Komponenten statisch importiert; die begrenzten JSON-Loader
bleiben erhalten. Keine Änderung des Offline-/Buildvertrags und kein dynamischer
Import nur zur Erfüllung der früheren Formulierung „Lazy-Route“.
