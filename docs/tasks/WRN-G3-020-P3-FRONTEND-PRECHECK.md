# WRN-G3-020 P3 – Mobile-Frontend-/Lifecycle-Precheck

Status: **GEBUNDEN; NUR READ-ONLY-SOL-PRECHECK DARF STARTEN**

## Basis und Ziel

P2 ist nach `374ea21` und dem finalen Metadatenrecheck technisch GREEN. Der
P3-Slice ersetzt ausschliesslich den vorhandenen Mobile-Platzhalter `Termine`
durch eine professionelle, lokale und zugaengliche Projektion des gebundenen
Regional-Events-Vertrags. Website und echte Inhalte bleiben OUT.

Der Precheck soll eine minimale, exakte P3-Allowlist und einen implementierbaren
Vertrag fuer einen spaeteren `frontend_brand_engineer` Terra/high liefern.
Er prueft Quellpfade und darf keinen Produkt-, Test- oder Fixturecode aendern.

## Zu bindende Nutzersemantik

1. Bestehende Navigation `Termine` oeffnet eine eigene Mobile-Seite.
2. Hierarchie ist kaskadierend `Kontinent > Land > Region`; keine
   Geolocation, IP-Ortung oder automatische Standortannahme.
3. Eine explizite gueltige Region wird nur in der getrennten lokalen
   Selection-IDB gespeichert und nach Neustart wiederhergestellt. Ungueltige,
   fremde oder kuenftige Auswahlrecords bleiben fail-closed und werden nicht
   still ersetzt.
4. Je Region erscheinen deterministisch hoechstens fuenf kommende Termine.
   Weniger als fuenf, leer, stale, protected, error, offline-none,
   offline-lkg und invalid-update-lkg werden ehrlich unterschieden.
5. Geaenderte/abgesagte/gesperrte Lifecyclehinweise bleiben sichtbar, ohne
   gesperrte Termine als normale aktive Karten auszugeben.
6. Karten zeigen lokalisierte Titel, lokale Ortsbezeichnung, kanonisch aus
   `startInstant` plus IANA-Zeitzone formatierte Zeit und klare Statusangabe.
   Keine erfundenen Bilder; die leere lokale Produktfixture bleibt leer.
7. Alle neuen Texte in neun UI-Sprachen; Englisch bleibt Erststart. Vier
   Themes, Phone/Tablet/Desktop-Projektion der App, Landscape, 200-Prozent-
   Reflow, Axe, Tastatur, Screenreader, sichtbarer Fokus und 44-Pixel-Ziele.
8. Keine versteckte horizontale Scrollliste und keine stille Kopplung an
   Newsreader, Personalisierung, Website, Map oder Spiel.

## Architekturfragen des Prechecks

- exakter Controllerablauf fuer Pinload, Eventstore-Snapshot,
  SaveCandidate/Activate, LKG, invalid update, Offline und Restart;
- atomare/konfliktsichere Selection-Lese-/Save-/Clear-Semantik;
- feste Referenzzeit fuer Projektion und testbare Formatierung ohne
  Zeitzonen- oder Hydrationsdrift;
- ehrlicher Visualtest mit selbst erstellten in-memory/routegebundenen
  Ereignissen, ohne Produktfixture/Pin oder Produkt-Testhook zu veraendern;
- genaue Component-, Copy-, CSS-, Unit-/E2E- und Evidence-Allowlist;
- getrennte Folgegates: Frontendwriter, unabhaengige Visual/A11y-QA,
  Securitydelta und finaler Architekturabschluss.

## Exklusiver Precheck-Schreibscope

1. `docs/evidence/WRN-G3-020/P3-FRONTEND-PRECHECK.md`
2. `docs/handoffs/WRN-G3-020-p3-frontend-precheck.md`

Keine anderen Writes, kein Git-Index/Commit, keine Kinder. Nur null offene
Findings und eine exakte Allowlist erlauben dem Chief, den P3-Writervertrag
zu binden. P3-Code startet nicht durch den Precheck selbst.

## OUT

Echte Events/Quellen/Provider, neue Dependencies/Kosten, Website, G3-021,
Map/Spiel, Geolocation, Hosting/Live, Android/AAB/Play, Signierung, Upload,
Deployment und Release.

## WRN-AGENT-STATUS

- Task: WRN-G3-020 P3 Frontend-Precheck
- Status: gebunden; Produktwrite gesperrt
- Basis: P2 GREEN `374ea21`; Produkt `9e84af4`
- Rechte: zwei eigene Precheckberichte
- Naechster Schritt: frischer Sol-Frontend-/Lifecycle-Precheck
- END-CHECK: :)
