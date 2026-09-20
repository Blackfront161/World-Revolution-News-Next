# WRN-G3-017 P3 – App-Frontend `Für mich`

Stand: 30. August 2026

Status: **VORBEREITET NACH P2-GREEN**

## Identität und Voraussetzungen

- Task-ID: `WRN-G3-017-P3`.
- Chief/Integrationsowner: `/root`.
- Produktbasis: P2-Kandidat `2a00974`.
- P2-L, P2-Q und P2-S sind unabhängig GREEN; Securityscan
  `28e475fb-ff2b-4185-b004-0c1e1a5c7b1d` meldet null Findings/deferred.
- Implementierungsowner: genau ein `frontend_brand_engineer`, Terra/high;
  keine Kinder.
- P2-Vertrag, Domain, Adapter und Tests sind für P3 read-only.

## Erlaubte Schreibpfade

- `apps/mobile/src/App.tsx`;
- `apps/mobile/src/styles.css`;
- `apps/mobile/src/App.test.tsx`;
- `packages/ui-language/src/index.ts`;
- `packages/ui-language/src/index.test.ts` nur wenn für die neuen Keys nötig;
- `packages/ui-language/src/catalogs/{de,el,es,fr,it,pt,ru,tr}.ts`;
- `tests/e2e/g3-017-personalization-visual.spec.ts` (neu);
- `tests/e2e/foundation.spec.ts` ausschliesslich fuer die zwei durch diesen
  Vertrag absichtlich veralteten Mobile-Erwartungen: sichtbarer Navname
  `For me` statt `Following` und vorhandener Hub statt `Not migrated yet`;
- eigene P3-Evidence, eigener Visual-Unterbaum und Handoff.

Website, Fixtures/Manifeste, Test-Support, P2-Dateien, Contentcontract, Domain,
Offline-/Controllerpfade, Navigation-IDs, Assets, Dependencies, Governance,
Android und Releasepfade sind read-only.

Chief-Klaerung vom 30. August 2026: Die enge Foundation-Spec-Ausnahme ist
notwendig, weil die verbindliche sichtbare Umbenennung und die Implementierung
des bisherigen Platzhalters sonst einen bekannten falschen Regressionstest
stehen liessen. Sie erlaubt keine Website-, Harness- oder weitere
Foundation-Aenderung.

## Sichtbare Produktstruktur

Die stabile Route/ID bleibt `following`; ihre sichtbare Bezeichnung wird in
allen neun UI-Sprachen sinngemäß zu `For me` beziehungsweise `Für mich`
geändert. Die anonyme Startseite bleibt unverändert.

Der Hub enthält in dieser Reihenfolge:

1. kurze Erklärung, dass die Auswahl nur auf diesem Gerät gespeichert und
   weder übertragen noch aus Leseverhalten abgeleitet wird;
2. drei klar getrennte `fieldset`-Gruppen für Interessen, Regionen und
   Inhaltssprachen;
3. kompakte, mindestens 44 x 44 Pixel bedienbare Auswahlzeilen; keine
   übergroßen Vollbreiten-Pills und kein verstecktes horizontales Scrollen;
4. primäre Aktion zum Prüfen/Speichern und getrennte destruktive Aktion zum
   vollständigen Löschen;
5. bei gültig gespeicherter Auswahl die lokal passenden Artikel in der
   bestehenden validierten Reihenfolge mit Reader-Einstieg;
6. ehrliche Leer-, Konflikt-, Protected- und Unavailable-Zustände.

Keine Inhaltssprache wird aus der UI-Sprache vorbelegt. Beim ersten Öffnen
ohne Key sind alle drei Gruppen leer. Mindestens eine Auswahl über alle
Dimensionen ist erforderlich; die Auswahl darf aber nur in einer Dimension
liegen. Katalogreihenfolge folgt den P2-Exporten, nicht einer erfundenen
redaktionellen Gewichtung. Sprachlabels dürfen die vorhandenen nativen
Sprachnamen verwenden.

## Zustands- und Aktionsvertrag

- Der Store wird genau einmal pro App-Mount mit
  `createMobilePersonalizationStore` erzeugt und beim Unmount mit `dispose()`
  freigegeben.
- UI liest/schreibt/entfernt nie direkt `localStorage` und zeigt, loggt oder
  überträgt niemals `protected.raw`.
- `inactive`: leere editierbare Auswahl, keine automatische Speicherung.
- `ready`: gespeicherte Auswahl wird als Entwurf gezeigt; passende Artikel
  werden nur mit `projectLocalPersonalizedArticles` aus demselben validierten
  aktuellen Artikel-/Discover-Snapshot bestimmt.
- `protected`: keine normale Bearbeitung oder Reparatur; nur verständlicher
  Schutztext, erneutes Laden und nach eigener Bestätigung die opake
  Voll-Löschung.
- `unavailable`: ehrlicher Fehlerzustand ohne Erfolgsbehauptung oder
  Lösch-/Speicheraktion.
- Jede Speicherung öffnet zuvor einen echten modalen Bestätigungsdialog.
  Erst Bestätigung ruft Domainfactory und Storeadapter auf.
- Jede Voll-Löschung öffnet einen getrennten echten modalen Dialog. Nach
  Erfolg: Entwurf leer, Zustand `inactive`, Ergebnisliste leer.
- Save-/Clear-Ergebnisse werden vollständig und kategorisch in verständliche
  Statuscopy übersetzt. Konflikt oder Fehler überschreibt keine sichtbare
  gespeicherte Auswahl mit einer Erfolgsbehauptung. Eine bewusste
  `Neu laden`-Aktion lädt den Key erneut und ersetzt erst dann den Entwurf.
- Keine automatische Wiederholung. Keine Änderung von Home, Discoverfiltern,
  UI-Sprache, Theme, Reading-State oder Saved-State.

## Navigation, Reader und Fokus

- Navigation nach `#following`, Direktaufruf und Browser Vor/Zurück
  fokussieren deterministisch `#mobile-page-title`.
- Ein Artikel aus der personalisierten Liste verwendet den bestehenden
  Readerweg. Schließen/Escape/Browser-Zurück kehrt zu `following` und zum
  auslösenden Readerbutton zurück.
- Bestätigungsdialoge besitzen `role="dialog"`, `aria-modal="true"`, klare
  Label/Description, Anfangsfokus auf Abbrechen, Escape und
  Fokuswiederherstellung zum auslösenden Button.
- Fieldsets/Legends, Status-/Alertrollen, Tastaturreihenfolge, sichtbarer Fokus,
  Axe, 200-Prozent-Reflow, 44-Pixel-Ziele und kein horizontaler Overflow sind
  Pflicht.

## Sprachen und Copy

Alle neuen sichtbaren Strings müssen in `en`, `de`, `es`, `fr`, `it`, `pt`,
`ru`, `el`, `tr` vollständig vorhanden sein. Dazu gehören Hubtitel/-intro,
Privacyhinweis, drei Gruppen, alle 7 Interessen und 8 Regionen, Save/Clear/
Reload, beide Dialoge, Saved/Deleted/Conflict/Protected/Unavailable/Invalid
sowie Ergebnis- und Leerzustände. Englischer Erststart und persistierte
UI-Sprachauswahl bleiben unverändert. Keine Artikeltexte werden übersetzt.

## Pflichtprüfungen

1. Inactive ohne Write, leere/ungültige Auswahl, Savebestätigung, Saved und
   Reload/Neustart.
2. Interessen-, Regionen- und Sprachwahl einzeln sowie OR/AND-Projektion und
   ehrlicher No-Match-Zustand.
3. Save conflict/unavailable/write-/verification-failed ohne falschen Erfolg;
   Reload stellt den tatsächlichen lokalen Zustand wieder her.
4. Protected zeigt keine Rawbytes, blockiert Save und erlaubt nur bestätigte
   opake Voll-Löschung; Clearfehler bleibt ehrlich.
5. Keine Änderung an Reading-State-, Theme-, UI-Sprach-, Offline- oder
   Fremdkeys; anonyme Home-Reihenfolge unverändert.
6. Navigation/Reload/Back/Forward, Reader-Rückweg und Dialog Escape/Cancel/
   Confirm mit Fokuswiederherstellung.
7. Alle neun UI-Sprachen und vorhandene Katalogparität.
8. Frische visuelle Matrix mindestens: inactive, ready mit Treffern, ready
   ohne Treffer, Save-Dialog, Clear-Dialog, protected und unavailable; Phone,
   Tablet, 390-x-844-200-Prozent-Reflow sowie Dark/Light/Pink/Contrast. Die
   Matrix bindet alle neun Sprachen mindestens einmal und die vier Themes in
   Ready plus Reflow.
9. Mobileunits, UI-Language-Tests, alle relevanten P2-Tests, Typechecks,
   ESLint, 19 Boundaries, Releaseboundary, Mobile-/Website-Regressionsbuild,
   Prettier und `git diff --check`.
10. Kein unerwarteter externer Request in Browser-/Visualtests.

## Stopregeln und Gate

Änderung des P2-Vertrags, neue Navigation-ID, Fixture-/Manifestmutation,
direkter Storagezugriff, Websitewrite, neue Dependency, echte Inhalte,
Telemetrie, Sync, Provider oder unklare Lösch-/Datenschutzsemantik: Stop an
Chief. Eng belegte UI-/Testfehler im erlaubten Pfad dürfen korrigiert werden;
Produkt- oder Architekturentscheidungen nicht.

P3-GREEN erfordert Bericht/Handoff, vollständige Dateiliste, exakte Tests,
Visualmanifest/-hash, Findings/Restrisiken, Kostenstatus und Rechteende. Danach
folgen frische unabhängige Visual-/A11y-QA, Security-Deltareview und
Architekturabschluss. Kein Live-/Android-/Release-GREEN.

END-CHECK: :)
