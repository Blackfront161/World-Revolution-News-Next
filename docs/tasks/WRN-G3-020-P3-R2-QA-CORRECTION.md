# WRN-G3-020 P3-R2 – QA-Korrektur fuer Controller und Sichtbelege

Status: **SCHREIBBAR fuer genau einen frischen Terra/high-Frontendwriter**

## Ausgangslage

- Produktkandidat: `d446f7b`
- unabhaengige P4-QA: `fbfb4f3`
- Findings: `P4-QA-M-001` bis `P4-QA-M-003` und `P4-QA-L-001`
- Security-Endscan: nicht erfolgt; die reservierte Sol-Instanz endete vor
  einem Ergebnis am Modellkontingent. Daraus folgt weder RED noch GREEN.

Die breite Basismatrix ist GREEN, aber P3 ist nicht freigabefaehig. Dieser
Vertrag behebt nur die vier bestaetigten Findings und vervollstaendigt die
bereits im P3-Paket verlangte Controller-/Visualmatrix.

## Identitaet und Grenzen

- Writer: genau ein frischer `frontend_brand_engineer`, Terra/high
- keine Kinder, keine Unterdelegation, kein Git-Index/Commit
- Integrationsowner: Chief `/root`
- keine neue Dependency, Config, Fixture, Pin, P2-API oder externe Kopplung
- bei erforderlicher Allowlistenerweiterung: sofort fail-closed stoppen

## Exakte Sechspfad-Allowlist

1. `apps/mobile/src/mobile-regional-events-ui.tsx`
2. `apps/mobile/src/mobile-regional-events-ui.test.tsx`
3. `tests/e2e/g3-020-regional-events-visual-harness.tsx`
4. `tests/e2e/g3-020-regional-events-visual.spec.ts`
5. `docs/evidence/WRN-G3-020/P3-R2-QA-CORRECTION.md` neu
6. `docs/handoffs/WRN-G3-020-p3-r2-qa-correction.md` neu

Alle anderen Pfade sind read-only, insbesondere `App.tsx`, `App.test.tsx`,
CSS, Sprachen, P2-Module/-Tests/-Fixtures/-Pins, globale Testconfig,
Dependencies, Website und Governance.

## R2-01 – aktueller Lauf muss exklusiv abortierbar sein

- Jeder neue Lauf abortiert den vorherigen Lauf, bevor Stores geschlossen
  oder neue Arbeit begonnen wird.
- Eine Ref bindet die aktuelle Abortfunktion/Run-ID. Reload darf sie nicht
  verwerfen; Unmount abortiert stets den neuesten Lauf und invalidiert dessen
  Run-ID monoton.
- Ein nach Abort/Runwechsel spaet aufgeloester `openStore`- oder
  `openSelection`-Handle wird sofort geschlossen und niemals in eine aktive
  Ref uebernommen.
- Nach jedem relevanten Await wird vor Mutation/Ref-/Statewrite die aktuelle
  Run-ID plus Signal geprueft. Kein spaeter Save/Activate/Selectionwrite.
- Es gibt weiterhin keinen Retry, Timer, Poll oder Hintergrundlauf.

Pflichtorakel mit kontrollierten Deferred-Adaptern: Initialrun, Reload,
zweiter Reload, Navigation/Unmount vor openStore, vor snapshot, vor load, vor
Save, vor Activate, vor openSelection und vor read. Fuer jeden Fall:
Aborts, null spaete Mutation/Statewrite und exakt geschlossene Handles.

## R2-02 – Selection-Storagefehler fail-closed

- `openSelection`-/`read`-Fehler ausser `protected` werden als echter
  fokussierbarer `reload-required`-/Storagefehler dargestellt, nicht als
  semantisch ungueltige Auswahl.
- Save/Clear sind danach deaktiviert. Nur explizites Reload startet einen
  frischen Store-/Taxonomielauf.
- Protected bleibt byteunveraendert und getrennt. CAS-/Write-/Verifyfehler
  behalten dieselbe Sperr-/Reloadsemantik.
- Kein stilles No-op bei sichtbaren aktivierten Aktionen.

## R2-03 – gespeicherte Region sichtbar und nachvollziehbar

- Bei gueltiger `ready`-Auswahl zeigt die Auswahlsektion den lokalisierten
  Namen der kanonischen aktiven Region sichtbar an.
- Alias wird nur ueber die bestehende explizite Aliasfunktion kanonisiert.
  Successor/unknown/blocked bleibt ungueltig und erzeugt keine Ersatzwahl.
- Kontinent-/Land-/Region-Drafts bleiben bis zur bewussten Aenderung
  fluechtig. Eine sichtbare aktive Region darf nicht als ungespeicherter
  Draft ausgegeben werden.
- Keine neue Copy ist erforderlich; vorhandene lokalisierte Regionsnamen und
  gebundene Copy werden kombiniert.

## R2-04 – ehrlicher Presentational-Harness und vollstaendige Matrix

Der Harness bleibt test-only und importiert ausschliesslich die reine
Produktionsview. Er darf keine Produktfixture-, Pin-, Store-, Loader-, App-,
URL-/Query-, globale Config- oder Produktions-Testschalter-Mutation einfuehren.

- Selbst erstellte lokale Viewmodels muessen fuer sichtbare Faelle ein
  strukturell vollstaendiges, nicht produktiv validiertes Presentational-
  Bundle mit Kontinent, Land, Region und mindestens fuenf lokalen Events
  enthalten. Es wird klar als Darstellungstest bezeichnet.
- `ready-1` zeigt exakt eine Karte; `ready-5` exakt fuenf Karten.
- `changed` zeigt Karte plus Lifecyclehinweis; `cancelled` und `blocked`
  erscheinen nur als ID-/Status-Lifecycleeintrag ohne alten Payload.
- Eigene sichtbare Faelle fuer loading, empty, stale, protected, error,
  offline-none, offline-lkg, invalid-update-lkg, invalid selection,
  `reload-required`, changed, cancelled und blocked.
- Die 72er Matrix muss React-Props fuer jede der neun Sprachen wirklich neu
  rendern; nur `document.lang` zu aendern ist unzulaessig. Jede Sprache wird
  mit einem sprachspezifischen sichtbaren Textassert belegt.
- Die 72 Kernfaelle (9 Sprachen x 4 Themes x normal/200 Prozent) und 32
  Viewportfaelle (8 Viewports x 4 Themes) enthalten Selection und reale
  Presentational-Karten, nicht `bundle:null`.
- Assertions: exakte Karten-/Lifecycleanzahl, keine gesperrten Titel/Orte,
  IANA-Zone und `time[datetime]`, sichtbare aktive Region, Root-/Karten-
  Overflow, 44x44 Ziele, echte Labels/Screenreadernamen, Fokus und
  Tastaturfolge, keine reine Farbcodierung sowie Axe in allen vier Themes
  mindestens auf Selection+ready-5+Lifecycle.
- Die reale Produktroute mit unveraendert leerem Produktfixture wird getrennt
  weiter als ehrlicher Leerzustand geprueft.

## R2-05 – reproduzierbare Evidencebindung

- Kanonischer Evidenceordner und Dateinamen werden im Bericht genannt.
- Jede PNG erhaelt SHA-256. Aggregat exakt: Dateinamen ordinal sortieren;
  pro Zeile `<relativer-Dateiname>\t<lowercase-sha256>`; LF zwischen Zeilen,
  kein abschliessendes LF; SHA-256 ueber die UTF-8-Bytes dieses Manifests.
- Anzahl, Gesamtbytes, Aggregat und mindestens je ein konkreter Pfad fuer
  DE, ready-5, invalid-update-lkg, reload-required und Lifecycle werden
  dokumentiert.
- Der Bericht darf Presentational-Evidence nicht als Pin-/Admission-/IDB-
  Beweis bezeichnen.

## Pflichtpruefungen

Mit exakt Node 24.19:

1. neue Controller-/View-Units inklusive aller R2-01-bis-R2-03-Orakel;
2. komplette Mobile-Units (mindestens bisherige 144 plus neue Faelle);
3. 92 Contract- und 5 UI-Sprachtests;
4. beide Typechecks;
5. diffbegrenztes ESLint `--max-warnings=0`, Prettier, `git diff --check`;
6. 19 Boundaries, Release- und Fixturegrenzen;
7. 16 bestehende reale Chrome-/IDB-P2-Faelle unveraendert GREEN;
8. neue P3-Visualspec mit 72+32 plus kompletter Zustands-/A11y-Matrix;
9. Mobile-Build; Chunkgroessenwarnung dokumentieren, nicht verstecken.

## Folgegates

Nach Writerende: Chief-Scope-/Hash-/Testreproduktion; frische unabhaengige
Terra-P4-R1-QA; Security-/Privacy-Diffscan des korrigierten Gesamtdeltas;
finaler unabhaengiger Architekturabschluss. Erst danach lokale PO-Sichtprobe.
G3-021 und alle externen Gates bleiben gesperrt.
