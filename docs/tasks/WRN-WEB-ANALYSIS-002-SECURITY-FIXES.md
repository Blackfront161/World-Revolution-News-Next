# WRN-WEB-ANALYSIS-002 – zwei begrenzte Website-Sicherheitskorrekturen

Stand: 29. August 2026. Autorisierung: PO-078 „gerne weitermachen“ auf die
konkrete Frage, beide bestaetigten Low-Befunde als begrenztes Reparaturpaket
mit unabhaengiger Nachpruefung zu bearbeiten.

## Identitaet und Arbeitsvertrag

- Task-ID: `WRN-WEB-ANALYSIS-002`
- Findings: `WEB-SEC-L-001` / `csf_8cbbafa31626f6118e455b2d` und
  `WEB-SEC-L-002` / `csf_8ef8797d94eb2e45d0c36e6b`
- Quellbasis: `a0575413fd51368dde449c68b512d962a74ce1d5`; Produktbasis `bceee9b`
- Auftraggeber: Product Owner; Integrations- und Schreibowner: Chief
- Modell/Reasoning: Main unveraendert; read-only Security-Reviewer Sol/high
- Delegation: erlaubt fuer genau einen read-only Ermittler und danach genau
  einen frischen read-only Bypass-/Regressionsreview, niemals gleichzeitig
- Weiterdelegation: nicht erlaubt; keine Kinder; zentraler Slotgeber Chief
- Schreibrechte der Reviewer: keine; Chief allein fuer Produkt, Tests,
  Taskbelege und Handoff
- Aufwandsgrenze: genau eine Implementierung und eine Reviewrunde; bei einer
  notwendigen Produkt-, Kompatibilitaets-, Hosting- oder Kostenentscheidung
  Stopp und Rueckfrage statt Scopeerweiterung

## Ziel in beobachtbarer Sprache

1. Wenn zwei bereits offene Website-Tabs denselben lokalen Lesestatus geladen
   haben, Tab A einen Eintrag loescht und Tab B danach einen anderen Eintrag
   speichert, bleibt der geloeschte Eintrag auch nach einem Reload geloescht.
2. Nur die zehn kanonischen Navigations-IDs werden akzeptiert. Hashes wie
   `#__proto__`, `#constructor`, `#toString` und normale unbekannte Werte
   fallen sicher auf Start zurueck und brechen die Website nicht ab.
3. Die bisherigen legitimen Lese-, Speicher-, Sprach-, Theme-, Routing- und
   Offlinefunktionen bleiben erhalten.

## Ausgangslage und Belege

- Offizieller Scan: `docs/evidence/WRN-WEB-ANALYSIS-001/security-scan/`
- Gebundener Handoff: `docs/handoffs/WRN-WEB-ANALYSIS-001-security-review.md`
- Lesestatus: `apps/website/src/local-reading-state.ts` und direkte Aufrufer
  in `apps/website/src/App.tsx`
- Navigation: `packages/domain/src/index.ts` und Websiteverbraucher
- Beide Findings sind bislang statisch bestaetigt, aber noch nicht dynamisch
  reproduziert. Tests muessen zuerst den unveraenderten Fehler belegen.

## Scope

### Erlaubte Pfade

- `apps/website/src/local-reading-state.ts`
- eng zugehoerige neue oder bestehende Website-Unit-Tests
- `apps/website/src/App.tsx` und `apps/website/src/App.test.tsx`
- `packages/domain/src/index.ts` und `packages/domain/tests/shell-state.test.ts`
- genau zugehoerige Website-E2E-Regression unter `tests/e2e/`
- Task-, Evidence-, Handoff-, Status- und Entscheidungsdokumente dieses Pakets

### Nicht-Ziele und verbotene Aktionen

- keine Aenderung von Content-IndexedDB, Service Worker, Cache Storage,
  G3-015-Outcomevertrag, Mobile-/Androidprodukt oder Legacy-/Liveprojekten
- keine neuen Dependencies, Installationen, Netzrequests, Remote-/CI-/Cloud-
  oder Hostingaktionen, keine Signierung, kein Upload und keine Veroeffentlichung
- keine Artikelpayloads im Lesestatus, keine neue Synchronisierung ueber Server
- keine allgemeine Security-Vollpruefung oder Bereinigung benachbarter Themen
- `.codex-remote-attachments/` bleibt unberuehrt und unversioniert

## Sicherheits- und Kompatibilitaetsinvarianten

- Jede Lesestatusmutation arbeitet an der beim Schreibzeitpunkt aktuellen,
  validierten Website-V1-Fassung und wird gegen parallele Website-Tabs
  serialisiert oder durch eine gleichwertig getestete Stale-Write-Barriere
  geschuetzt. Eine reine `storage`-/Broadcast-Anzeigeaktualisierung reicht nicht.
- Ein spaeter vorgefundenes unbekanntes oder fehlerhaftes Dokument bleibt
  byteidentisch und schaltet auch einen bereits offenen V1-Tab auf read-only;
  es darf nicht durch einen alten Snapshot ueberschrieben werden.
- Saved, Read und Progress sowie ihre partiellen Loeschungen bleiben getrennt.
- Der Domain-Navigationsparser prueft kanonische Eigenmitgliedschaft statt
  einzelne problematische Namen zu blockieren. Der Website-Labelsink liefert
  fuer unerwartete Laufzeitwerte stets einen sicheren String.
- Die bisherige Website darf ohne Web Locks weiterhin sicher bedienbar sein;
  keine stille neue Secure-Context-Pflicht.

## Akzeptanzkriterien und Tests

1. Vorher-RED und Nachher-GREEN fuer A/B: beide laden X, A loescht X, B
   speichert Y, Reload enthaelt Y und nicht X.
2. Bereits offener V1-Tab trifft spaeter V2/malformed: kein Write, Bytes bleiben
   unveraendert, UI meldet geschuetzten/nicht gespeicherten Zustand ehrlich.
3. Partielle Clear-Semantik und normale Save/Read/Progress-Flows bleiben GREEN.
4. Domain- und Website-Tests fuer `__proto__`, `constructor`, `toString`,
   normalen Unknown, gueltige IDs, direkten Hash und spaeteren Hashwechsel.
5. Exakte Node-24.19-/pnpm-11.19-Pruefung: fokussierte Domain-/Websiteunits,
   Website- und Domain-Typecheck, relevante Website-E2E, Boundaries und Build.
6. Danach genau ein frischer read-only Bypass-/Regressionsreview nach dem
   `fix-finding`-Vertrag; bestaetigte Findings werden eng korrigiert und die
   relevanten Gates einmal erneut ausgefuehrt.

## Ergebnisgrenzen

Technisches GREEN schliesst nur diese zwei Finding-IDs. Es veroeffentlicht
nichts, beantwortet `WRN-G3-015-OUTCOME-DECISION` nicht und ersetzt weder die
separaten Hosting-/Header-/Zugriffsschutz-/Paketgates noch eine spaetere
Product-Owner-Abnahme.

## Abschluss

Technisch GREEN am 29. August 2026. Beide Findings `fixed`; Fixreport unter
`docs/evidence/WRN-WEB-ANALYSIS-001/security-scan/artifacts/fix_report.md`,
Handoff `docs/handoffs/WRN-WEB-ANALYSIS-002-security-fixes.md`. Beide
read-only Reviewer beendet, keine Restschreibrechte. Keine Veroeffentlichung.

END-CHECK: :)
