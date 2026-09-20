# Agent Handoff

- Agent: `production_content_design` (Sol/high)
- Task-ID: WRN-RELEASE-COMPLETION-CONTENT-DESIGN-2026-09-10
- Ergebnis: bestanden (Analyse); Produktions-/Releasegate bleibt RED
- Eltern-/Kindbrief, Rolle (Main/Fachlead/Helfer/Review) und Instanz-ID:
  `/root`, unabhängiger read-only Review, Slot 1
- Basiscommit / Ergebniscommit / Branch und Worktree:
  Basis `3e2d8dd16b84fd39ea0c59d6f8e9e8bf5938b10c`, geprüft auf
  `3285e49be453f7563f1912974c3bed47c78bebe1`, gemeinsamer Hauptworktree
- Slot-ID / zentraler Slotvergeber / Status aller Kinder:
  Slot 1 / `/root` / keine Kinder
- Schreibarbeit beendet / Rechteuebergabe und Slotfreigabe bestaetigt durch:
  ausschließlich diese Evidence und dieses Handoff geschrieben; Produkt-,
  Test-, Index-, Browser- und Commitrechte nie besessen; Slot an `/root`
  zurückgegeben
- Unabhaengiger Reviewadressat (Main/Chief): `/root`

## Kurzfazit

Fixture-v1 bleibt unverändert strikt. Der kleinste sichere Produktionsweg ist
ein additiver Production-v1-Admissionvertrag auf einem kleinen gemeinsamen
Strukturkern, anschließend dieselbe Domain-/Readerlogik, eine eigene
Lesestatus-v2 und die vorhandene Offline-Safety-/Rollbackmechanik mit neuem
monotonem Release-Sequence-Gate. Websitepublikation wird aus dem Mobile-Core
gelöst. Der vollständige Entwurf samt Pfaden und Tests steht in
`docs/evidence/WRN-RELEASE-COMPLETION-CONTENT-DESIGN-2026-09-10.md`.

## Delegationsaufwand (falls zutreffend)

- Arbeits-/Koordinationszeit, Nacharbeitsrunden, Konflikte: ein begrenzter
  Codepass; keine Kinder; keine Dateikonflikte
- Gemessene Token/Kosten mit Beleg oder `unbekannt`: unbekannt
- Aufwands-/Versuchsgrenze eingehalten / Eskalation: eingehalten; kein Retryloop
- Helferhandoffs, gepruefte Befunde und Disposition: keine

## Verwendete Quellen

- `AGENTS.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/tasks/WRN-RELEASE-COMPLETION-2026-09-10.md`
- `docs/evidence/WRN-REAL-CONTENT-INVENTORY-2026-09-10.md`
- `packages/content-contracts/src/index.ts` und fokussierte Tests
- `packages/domain/src/index.ts` und fokussierte Tests
- beide `local-content-release.ts`, Offline-Stores/-Controller,
  Lesestatusadapter und Appreader
- Website-Diskloader und statische Generator-/Integrationswerkzeuge
- Chief-Zwischenmeldung zum EFF-Kandidaten und Upstream-Snapshot; als nicht in
  diesem Review live reproduzierte Fremdevidenz kenntlich gemacht

## Geaenderte Dateien

- `docs/evidence/WRN-RELEASE-COMPLETION-CONTENT-DESIGN-2026-09-10.md`
- `docs/handoffs/WRN-RELEASE-COMPLETION-CONTENT-DESIGN-2026-09-10.md`

Keine anderen Dateien geändert.

## Tests und Belege

- Content Contracts: 24/24 PASS in 4 fokussierten Dateien.
- Domain: 10/10 PASS in 2 fokussierten Dateien.
- Mobile LocalContentRelease/OfflineController: 30/30 PASS.
- Website LocalContentRelease/OfflineController: 30/30 PASS.
- Websitegenerator/Integration: 9/9 PASS.
- Ein Root-Vitest-Fehlversuch ohne App-jsdom-Konfiguration ist im Evidencebericht
  transparent als ungültige Reproduktion dokumentiert; die korrekten
  Projektläufe bestanden.

## Feststellungen nach Prioritaet

1. HIGH: Fixture-v1 kann reale IDs/URLs/Provenienz nicht ehrlich aufnehmen und
   darf nicht gelockert werden.
2. HIGH: Der mögliche CC-BY-Pilot besitzt noch keinen artikelweisen Rechtepass
   und die aktuelle UI keine vollständige Autor-/Lizenz-/Änderungsdarstellung.
3. HIGH: Revocation ist monoton, Contentreleasefolge dagegen nicht; Production
   braucht `sequence` plus explizite Rollbackkante.
4. MEDIUM: Websitepublikation ist heute fälschlich mobile Pflichtkomponente.
5. MEDIUM: Rohfeed-/Altartikelgrößen überschreiten bestehende Limits;
   producerseitige kleine Pakete sind Pflicht.
6. MEDIUM: Archive-Reader lassen Quote/List-Blöcke still weg.

## Annahmen und offene Fragen

- Der Chief entscheidet und belegt die konkrete Artikelmenge; Empfehlung sind
  höchstens drei vollständige Pilotartikel.
- Der getrennte Contentrepository-Checkout/Ownerpfad ist vor dem Builderwrite
  noch zu binden.
- Remote-Updateauthentizität bleibt ein gesondertes Gate; der erste Slice darf
  lokal/revisionsgebunden bleiben.

## Restrisiken

- Eine allgemeine Quellenlizenz kann Drittmaterial im Einzelartikel ausnehmen.
- Ohne v2-Schlüssel würde der Wechsel zu Produktions-IDs gespeicherte
  Fixture-Lesedaten als ungültig behandeln; deshalb alte v1-Rohwerte erhalten.
- Ohne Productionsequenz kann ein gültiger alter Inhalt als neuer Kandidat
  aktiviert werden.
- Ein großer Artikel kann trotz kleiner Artikelzahl Transport-/Bundlelimits
  überschreiten.

## Empfohlener naechster Schritt

Chief bindet Stufe A aus dem Evidencebericht als separaten Writerbrief:
Content-Contracts/Core, Domain-v2, deterministischer Builder und ausschließlich
synthetische Contracttests. Nach dessen unabhängigem GREEN folgt Mobile; die
Websiteintegration wartet auf die Rückgabe des disjunkten Websitewriters. Kein
realer Artikel wird vor einem eigenen, artikelweisen Admissionpacket eingebaut.

## WRN-AGENT-STATUS

- Task: WRN Release Completion – Production Content Design
- Status: GREEN
- Quellstand: `3285e49be453f7563f1912974c3bed47c78bebe1`
- Erledigt: Vertrag, Ripplepfade, Migration/Rollback, Tests und Gateentscheidung
- Tests: 24 Contract + 10 Domain + 30 Mobile + 30 Website + 9 Generator PASS
- Offen: Productionwriter, artikelweiser Rechtepass, Clientintegration,
  unabhängige QA und Releasegate
- Handoff: `docs/handoffs/WRN-RELEASE-COMPLETION-CONTENT-DESIGN-2026-09-10.md`
- Naechster Schritt: enger Stufe-A-Writerbrief durch Chief
- END-CHECK: :)
