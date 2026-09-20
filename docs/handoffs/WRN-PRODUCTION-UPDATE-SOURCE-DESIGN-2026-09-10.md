# Agent Handoff

- Agent: `production_content_design` (Sol/high)
- Task-ID: `WRN-PRODUCTION-UPDATE-SOURCE-2026-09-10`
- Ergebnis: teilweise / CONDITIONAL PASS
- Eltern-/Kindbrief, Rolle und Instanz-ID: Root / RELEASE-COMPLETION;
  unabhängige enge Designklärung; keine Kinder
- Basiscommit / Ergebniscommit / Branch und Worktree: Auftrag `bf81a99`;
  gemeinsamer lokaler Checkout; keine Produktänderung
- Slot-ID / zentraler Slotvergeber / Status aller Kinder: Slot2 durch Root;
  keine Kinder
- Schreibarbeit beendet / Rechteübergabe und Slotfreigabe bestätigt durch:
  Reviewer gibt mit diesem Handoff alle Rechte und Slot2 an Root zurück
- Unabhängiger Reviewadressat: Root / Chief

## Kurzfazit

`unverified-preserve-check-time` ist als internes zusätzliches Finish-Ergebnis
geeignet. Es bewahrt nur den alten Marker; anschließendes `project()` bindet
die Autorität weiter an `active.checkedAt`, sodass keine TTL verlängert wird.
Die Verwendung muss an die festgehaltene Identität des ausdrücklich
konfigurierten `refreshSource` gebunden bleiben. Bootstrap und Legacy behalten
das alte `unverified`.

Eine konkrete Brief-/Oraclekorrektur ist nötig: Der bestehende Domainvertrag
erlaubt exakt `checkedAt + 24h` und sperrt ab `+24h+1ms`. Da dieser Slice die
TTL unverändert lässt und Domainquellen nicht besitzt, darf er Gleichheit
nicht neu als abgelaufen definieren.

## Delegationsaufwand (falls zutreffend)

- Arbeits-/Koordinationszeit, Nacharbeitsrunden, Konflikte: ein begrenzter
  Quell- und Designpass; keine Konflikte
- Gemessene Token/Kosten mit Beleg oder `unbekannt`: unbekannt
- Aufwands-/Versuchsgrenze eingehalten / Eskalation: eingehalten; keine
  Eskalation
- Helferhandoffs, geprüfte Befunde und Disposition: keine Helfer

## Verwendete Quellen

- `docs/tasks/WRN-PRODUCTION-UPDATE-SOURCE-2026-09-10.md` auf `bf81a99`
- früherer gebundener Delivery-Designbericht und Handoff
- `packages/browser-content/src/production-content-offline-store.ts`
- `packages/browser-content/src/production-content-offline-controller.ts`
- Mobile-/Website-Controllerwrapper und bestehende Controllerorakel
- `packages/domain/src/index.ts`
- `packages/domain/tests/content-offline-guard.test.ts`
- kanonische Production-Offline-Controlform in Content Contracts

## Geänderte Dateien

- `docs/evidence/WRN-PRODUCTION-UPDATE-SOURCE-DESIGN-2026-09-10.md`
- `docs/handoffs/WRN-PRODUCTION-UPDATE-SOURCE-DESIGN-2026-09-10.md`

Keine Produkt-, Test-, Index- oder Browserdatei geändert.

## Tests und Belege

Keine Ausführung gemäß engem Designauftrag. Die Klärung wurde gegen die
konkreten Store-/Controller-/Domainquellen und vorhandenen Orakel gelesen.

## Feststellungen nach Priorität

- Keine Blockade der vorgeschlagenen Outcome-Semantik.
- Erforderliche Abnahmepräzisierung: bestehende inklusive 24h-Grenze bewahren;
  erst jenseits der Grenze expired.
- Erforderliche Implementierungsgrenzen: Finish plus Project nur für captured
  Refreshsource; Bootstrap/Legacy unverändert; exakte Virgin-Prüfung vor dem
  durch Expected geschützten Prepare.

## Annahmen und offene Fragen

Keine Nutzerentscheidung nötig. Sollte Root die TTL-Gleichheitssemantik bewusst
ändern wollen, braucht das einen getrennten Domain-Scope samt bestehender
Orakeländerung; das ist nicht Teil dieses Auftrags.

## Restrisiken

Transportimplementierung, Runtimeorakel, Browser, Geräte und Liveendpoint
bleiben offen. Direkte fremde IndexedDB-Manipulation ist kein autorisierter
Sourcewahlpfad.

## Empfohlener nächster Schritt

Root kann den Update-Source-Writer nach Korrektur des TTL-Orakelwortlauts eng
umsetzen. Die sechs im Evidence-Bericht genannten Orakel unterscheiden die
neue Semantik ohne Store-Schema- oder UI-Erweiterung.

## WRN-AGENT-STATUS

- Task: Production Update Source narrow design clarification
- Status: YELLOW / CONDITIONAL PASS
- Quellstand: Auftrag `bf81a99`
- Erledigt: Preserve-Outcome, Sourceprovenienz, Project-/TTL-Verhalten und
  Snapshot-/Virgin-/Prepare-Guard geprüft
- Tests: keine Ausführung, read-only Designauftrag
- Offen: TTL-Wortlaut berichtigen; danach Implementierung und unabhängige QA
- Handoff: dieser Pfad
- Nächster Schritt: Root übernimmt Klärung und Slot2
- END-CHECK: :)
