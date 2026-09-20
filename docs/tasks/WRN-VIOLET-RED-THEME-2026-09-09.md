# WRN Violett/Rot und rote Auswahlbuttons

## Identität und Auftrag

- Auftraggeber: Product Owner, aktuelle Nachricht vom 9. September 2026.
- Ausgangspunkt: `4dc1a9d`; ausschließlich zwei erhaltene unversionierte Benutzerordner.
- Chief/Integrationsowner: Root. Produktwriter: ein Terra-Frontend-Agent, falls die Runtime einen Start erlaubt, sonst Chief sequenziell.
- Delegation: erlaubt, maximal zwei Subagenten; Slot 1 Frontend Terra/high, Slot 2 unabhängige QA Terra/high nach Produktrückgabe. Keine Kinder. Keine parallelen Produktwriter.
- Register: `docs/WRN-G3-021-DELEGATION-REGISTER.md`. Keine Indexrechte für Agenten.
- Nutzen/Grenze: klar begrenzte gemeinsame Farbanpassung und unabhängige Browserprüfung; keine neue Architektur oder Providerintegration. Bei Runtime-Limit kein Start-Retryloop.

## Beobachtbares Ziel

### Jüngste PO-Präzisierung: schwarzer Untergrund

Der PO verlangt anschließend ausdrücklich denselben schwarzen/dunklen
Untergrund wie bei Rot/Cyan. Nur die bisherigen Cyan-Akzente sollen im neuen
Theme violett sein; Rot bleibt Rot. Chief setzt diesen kleinen CSS-Nachtrag
sequenziell ohne Delegation um. Einziger Produktpfad:
`packages/brand-tokens/src/styles.css`. Die neutralen Flächen, Text-, Rahmen-
und Statusfarben der Standardpalette entsprechen danach `dark`; die violette
Akzentfarbe bleibt erhalten. Keine Logik-, ID-, Speicher- oder Inhaltsänderung.
Prüfung: vorhandene Theme-Browserfälle, reale berechnete Farbgleichheit der
neutralen Tokens beider Paletten auf beiden Clients, Builds und neue Bilder
unter `docs/evidence/WRN-VIOLET-RED-2026-09-09/black-base/`. Keine Wiederholung
unbetroffener Unit-/Typechecks; keine neue unabhängige Reviewbehauptung für
diesen reinen Farbnachtrag. Frühere Bilder bleiben historische Belege.

Neue Installationen verwenden ein Violett/Rot-Theme. Rot/Cyan bleibt auswählbar, einschließlich bereits gespeicherter gültiger Auswahl. Buttons und Navigationsschaltflächen sind ohne Auswahl rot umrandet, bei semantischer Auswahl rot gefüllt. Tastaturfokus und deaktivierte Zustände bleiben unterscheidbar. Mobile und Website verwenden dieselben semantischen Farbwerte.

## Erlaubte Produkt- und Testpfade

- `packages/brand-tokens/src/index.ts`, `packages/brand-tokens/src/styles.css`
- `packages/ui-language/src/index.ts`, `packages/ui-language/src/catalogs/{de,el,es,fr,it,pt,ru,tr}.ts`
- `apps/mobile/src/App.tsx`, `apps/mobile/src/App.test.tsx`, `apps/mobile/src/styles.css`
- `apps/website/src/App.tsx`, `apps/website/src/App.test.tsx`, `apps/website/src/styles.css`
- Falls zur Auflösung lokaler Farbübersteuerung nötig: `apps/mobile/src/features/{directory,knowledge,support}/*.css`
- Neuer enger Browsertest `tests/e2e/violet-red-theme.spec.ts`; bestehender `tests/e2e/foundation.spec.ts` ausschließlich tatsächlich betroffene Theme-Annahmen.
- Eigene Implementierungsevidenz/Handoff `docs/{evidence,handoffs}/WRN-VIOLET-RED-THEME-2026-09-09.md`.
- Unabhängige QA besitzt nur `docs/{evidence,handoffs}/WRN-VIOLET-RED-THEME-QA-2026-09-09.md` sowie ignorierte Testausgaben.
- Chief allein: Taskvertrag, Delegationsregister, Projektstatus, AGENTS-Kopf, Abschlussbericht und separate YouTube-Rechercheempfehlung.

## Akzeptanz und Prüfung

1. Neues versioniertes Theme-ID `violet`; Standard bei fehlendem/ungültigem/nicht lesbarem Speicher. Explizite gültige Präferenzen und `system`-Auflösung bleiben erhalten.
2. Beide Selektoren nennen Violett/Rot und Rot/Cyan in allen neun UI-Sprachen; alle bisherigen Themes bleiben erreichbar.
3. Inaktive Buttonflächen haben roten Rand und lesbaren Text, aktive/ausgewählte rote Füllung mit ausreichendem Textkontrast. Keine bloß per Farbe erkennbare Auswahl: bestehende ARIA-Zustände bleiben erhalten. Fokus ≥3:1, Text ≥4,5:1, Bedienziele ≥44px. Forced-colors wird respektiert.
4. Kein Zurücksetzen von Lese-, Brief-, Sprach-, Offline- oder Inhaltsdaten. Keine Änderungen an Quellenassets, Medienplayer, Cacheverträgen oder Dependencies.
5. Tests prüfen Erststart, ungültigen/gesperrten Speicher, gespeichertes dark, Auswahl/Reload, system, neue Labels sowie reale berechnete CSS-Zustände beider Clients. Automatisierte Reflow-/Screenshotbelege: neun Sprachen bei 390px, acht Präferenzen, Mobile 320/360/390/412/600/800/Landscape, Website 1024/1280/1440/1920, 200%-Text. Sinnvolle Paarmatrix, keine vollständige kartesische Wiederholung.
6. Mobile/Website Unit-Suiten, relevante Sprachtests, Typechecks, Lint/Format und Builds. Dokumentierte bestehende Boundary-16-Findings bleiben getrennt; keine pauschale Releasebehauptung.

## Grenzen, Kosten und Rücknahme

Nur lokale reversible Implementierung, vorhandene Node/Chrome-Werkzeuge. Keine Installation, externe Writes, Veröffentlichung, Signierung oder kostenpflichtige API. YouTube/Shorts werden parallel vom Chief ausschließlich recherchiert und als Vorschlag dokumentiert. Keine Kanäle ungeprüft produktiv aufnehmen, keine Fremdvideos kopieren.

Rücknahme über gezielten Folgecommit der genannten Produktpfade; bestehende Inhalte und Speicherpräferenzen bleiben erhalten. Übergabe nach AGENT-HANDOFF mit Dateien, Prüfungen, Bildern, Grenzen und WRN-AGENT-STATUS / END-CHECK: :).

## Chief-Übernahme nach Ausgabepfad-Vorfall

Zusätzliche enge Disposition aus unabhängiger Browser-QA: Chief darf nach
Port-/Rechterückgabe die bereits zum Fachbereich gehörenden Dateien
`apps/mobile/src/features/support/support.css` und
`apps/mobile/src/features/knowledge/knowledge.css` sequenziell korrigieren.
Alleiniger Zweck: fehlende 44px-Behandlung der Briefwerkstatt-Auswahl und
berechnete Mindestgröße isolierter Quellen-/Downloadaktionen. Keine neuen
Inhalte oder Flows. Der vorhandene neue Theme-Browsertest erhält ein echtes
Bounding-Box-Oracle dieser Bedienelemente. Danach derselbe unabhängige Reviewer
für den engen CSS-/Orakelnachtrag, keine Wiederholung unbetroffener Gesamtsuiten.
Neue beschriftete Benutzerbilder und Hashmanifest unter
`docs/evidence/WRN-VIOLET-RED-2026-09-09/new/` gehören zum Chief-Abschluss.

Die unabhängige QA gibt 43a9509 wegen abgeschnittener russischer Beschriftung
bei 390px/200% RED zurück. Chief korrigiert innerhalb der bestehenden App-/
Brand-CSS-Allowlist: Der native Select bleibt das einzige Bedienelement mit
unveränderten vollständigen Optionen; eine nicht interaktive, aria-hidden
Textspiegelung in derselben Gridzelle zeigt den gewählten Namen mit Umbruch.
Native Tastatur-/Auswahl-/Fokussemantik bleibt erhalten. Der Text wird nicht
kleiner skaliert oder abgekürzt. Das Orakel prüft vollständigen sichtbaren
Text, Zeilenrechtecke innerhalb des Controls, neun Sprachen bei100/200%,
Tastaturänderung, Systemfarben und unabhängige neue Bildprüfung. Keine bloße
Scrollbreitenprüfung als Ersatz für lesbare Beschriftung.

Root hat den Writer am 9. September unterbrochen, nachdem ältere ignorierte
Screenshotordner unter `test-results` als nicht mehr vorhanden festgestellt
wurden. Der vermutete Auslöser ist Playwrights Standard-Ausgabebereinigung.
Der aktuelle Produkt-WIP bleibt erhalten und wird in eigenem Commit gesichert.
Der Writer hat nur noch Rechte für seine zwei wahrheitsgemäßen Belegdateien,
keine Produkt-/Test-/Browserrechte. Chief übernimmt dieselbe Produkt-Allowlist
sequenziell. Jeder weitere Playwright-Lauf erhält zwingend einen neuen
Unterordner via `--output=test-results/<eindeutiger-laufname>`; kein Rootoutput.
Neue Visualbelege werden als neue Reproduktion gekennzeichnet, niemals als
byteidentische Wiederherstellung verschwundener historischer PNGs.
Root dokumentiert den Vorfall und die gültigen neuen Belegpfade; danach
unabhängige QA gemäß unveränderter Slot-2-Grenze.

Enger Chief-Nachtrag zur Wiederholungsvermeidung: Zusätzlich ist ausschließlich
`playwright.config.ts` für einen pro Aufruf eindeutig neuen Standardausgabeordner
unter `test-results/runs/` erlaubt. Kein Löschen/Wiederherstellen alter Ausgaben,
keine Testsemantikänderung. Die Konfiguration wird über Playwrights Testauflistung
und den unabhängigen QA-Lauf geprüft. Neue aktuelle Screenshots dienen dem
neuen Theme-Kandidaten; historische Manifestbindungen bleiben ausdrücklich offen.
