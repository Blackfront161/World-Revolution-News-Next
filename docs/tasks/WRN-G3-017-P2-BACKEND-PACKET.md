# WRN-G3-017 P2 – lokaler Personalisierungs- und Persistenzvertrag

## Identitaet und Sequenz

- Task-ID: `WRN-G3-017-P2`.
- Chief/Integrationsowner: `/root`.
- Quellen: Hauptbrief, P1-L/T/S und `P1-CHIEF-SYNTHESIS.md`.
- Vor Implementierung: ein Sol-Vertragsrecheck und ein Luna-
  Traceabilityabgleich, beide produkt-read-only.
- Implementierungsowner danach: genau ein
  `backend_data_reliability_engineer`, Terra/high; keine Kinder.
- P3 bleibt bis P2-GREEN und Rechteende gesperrt.

## Erlaubte Implementierungspfade

- `packages/content-contracts/src/index.ts`;
- `packages/content-contracts/tests/personalization-v1.test.ts` (neu);
- `packages/domain/src/index.ts`;
- `packages/domain/tests/personalization-v1.test.ts` (neu);
- `apps/mobile/src/local-personalization-state.ts` (neu);
- `apps/mobile/src/local-personalization-state.test.ts` (neu);
- eigene P2-Evidence und Handoff.

Alle App-UI-, CSS-, Katalog-, Website-, Fixture-, Manifest-, Offline-Store-,
Controller-, Navigation-, Governance-, Dependency- und Releasepfade sind
read-only.

## Exakter V1-Vertrag

Storagekey: `wrn.mobile-local-personalization.v1`.

Exakte Dokumentfelder:

- `contractVersion: 1`;
- `schema: "wrn.local-personalization"`;
- `revision: "wrn-local-personalization-v1"`;
- `interestIds: string[]`;
- `regionIds: string[]`;
- `contentLanguageIds: string[]`.

Listen sind kanonisch sortiert, eindeutig und enthalten nur IDs aus den in
der Chief-Synthese gebundenen Katalogen. Caps: hoechstens 7 Interessen, 8
Regionen, 9 Inhaltssprachen und 4096 UTF-8-Bytes fuer das gesamte serialisierte
Dokument. Keine Zusatzfelder. Leere Gesamtwahl wird nicht gespeichert und
gilt als `inactive`.

## Loader-, Save- und Clear-Semantik

- Missing: `inactive`, kein Write.
- Gueltiges V1: `ready` mit unveraenderter kanonischer Projektion.
- Future, unbekannt, malformed, Fremdfeld, Limit-/Bytefehler oder nicht
  lesbarer Rawwert: `protected` plus bytegleicher Rawwert; kein Normalisieren,
  Speichern oder Migrieren.
- Storagezugriff nicht moeglich: ehrlicher `unavailable`/Fehlerzustand.
- Jeder erfolgreiche Load liefert neben dem Zustand eine unveraenderliche
  Ausgangserwartung fuer genau diesen Key: `null` bei `missing` oder den exakt
  gelesenen Rawstring bei `ready`. `protected` und `unavailable` erteilen
  keine Saveberechtigung.
- Save nimmt nur ein vollstaendig validiertes kanonisches Dokument, die vom
  gleichen Load gelieferte Ausgangserwartung und den noch gueltigen
  Konfliktstatus. Unmittelbar vor jeder Mutation liest Save den Key erneut.
  Nur wenn dieser Rawwert bytegleich der Ausgangserwartung ist und kein
  `storage`-Konfliktsignal die Erwartung invalidiert hat, darf genau ein
  `setItem` folgen. Abweichung, Pre-Read-Fehler, `protected`, `unavailable`
  oder invalidierter Konfliktstatus stoppen ohne Mutation.
- Nach `setItem` liest Save sofort zurueck und meldet Erfolg nur bei exakter
  Bytegleichheit und erneuter Validierung. Kein Teilstand, Journal, Backup,
  zweiter Key oder automatischer Retry.
- Clear ist die einzige bei `protected` erlaubte Mutation: `removeItem`,
  Readback `null`; andernfalls Fehlschlag ohne Erfolgsmeldung. Andere lokale
  Keys werden niemals gelesen, veraendert oder entfernt.
- Ein erkannter oder vor dem Schreiben bereits vorhandener Konflikt wird nie
  ueberschrieben oder als Erfolg bezeichnet. Ein konkurrierender/mismatched
  Post-Readback ist Fehler. `localStorage` bietet keine echte transaktionale
  Mehrtabgarantie; der Vertrag behauptet deshalb keine unmoegliche Sperre fuer
  ein Rennen exakt zwischen Pre-Read und `setItem`. Eine staerkere Garantie
  wuerde einen eigenen spaeteren Storage-/Lockvertrag benoetigen.

## Katalog und deterministische Projektion

Content Contracts exportieren die stabilen ID-Kataloge und Validatoren.
Domain exportiert eine reine Projektion gegen bereits validierte Artikel und
Discoverindex:

- ODER innerhalb `interestIds`, `regionIds`, `contentLanguageIds`;
- UND zwischen jeder nicht leeren Dimension;
- leere Gesamtwahl = keine Treffer/inaktiv;
- nur vorhandene, im aktuellen Release aktive Artikel-IDs;
- Reihenfolge des validierten Articlearrays bleibt erhalten;
- keine Scores, Rangfolge, Zeit-/Nutzungsdaten oder Reading-State-Inputs.

Lokale Testzuordnung V1:

- `Basisarbeit` -> `movement-news`;
- `Lokales` -> `local-organizing`;
- `Medien`/`Technologie` -> `media-technology`;
- `Sport` -> `sport`; `Fussball` -> `football`;
- `Fankultur` -> `fan-culture`; `Frauen` -> `women-feminist`;
- `Europa` -> `europe`; `Nordamerika` -> `north-america`;
  `Lateinamerika` -> `latin-america-caribbean`;
- `Local test region` erhaelt bewusst keine reale Regionszuordnung;
- Inhaltssprachen matchen exakt gegen `originalLanguage`.

Diese Zuordnung gilt nur fuer selbst erstellte lokale Testdaten und ist keine
echte Inhalts-/Gruppenklassifikation.

## Pflichtpruefungen

1. Exact keys, alle Kataloge/Caps/Bytecap, Sortierung, Duplikate, Fremdwerte,
   Future, corrupt und malformed.
2. Missing ohne Write; gueltiges V1; kein V0-/Reading-/Theme-/UI-Sprachimport.
3. Save bindet den erwarteten Load-Rawwert: `missing -> future -> stale save`
   und `ready A -> ready B -> stale save` stoppen vor Mutation und erhalten B
   bytegleich. Pre-Read-Fehler, invalidiertes `storage`-Konfliktsignal,
   Quota-/Setfehler und Post-Read-Mismatch scheitern ehrlich. Erfolg erfordert
   exakten Post-Readback und erneute Validierung.
4. Clear fuer ready/protected; Readback nicht null oder remove/get-Fehler
   scheitert; alle Fremdkeys bytegleich.
5. Projektion fuer jede Dimension, OR/AND, leere Auswahl, unbekannte Mapping-
   werte, aktive IDs, Reihenfolge und keine Reading-State-Abhaengigkeit.
6. Bestehende relevante Contract-/Domain-/Mobiletests, Typechecks, Boundaries,
   Build-/Releaseboundary soweit vom Scope betroffen; Website-Diff leer.
7. Prettier und `git diff --check`.
8. Statischer Scopebeleg fuer alle sechs erlaubten Quellpfade: keine Requests,
   Cookies, URL-/Hashparameter, Analytics oder Konsolen-/Fehlerlogs mit
   Praeferenzwerten oder geschuetztem Rawstring. Fehler verlassen den Adapter
   nur als kategorische Zustaende.

## Stopregeln und Gate

Mehr als ein Key, echte Migration, IndexedDB, Cross-Client-Sync, neuer
Provider/Dependency, Websitewrite, unklare Datenloeschung oder andere
Architekturgrenze: Stop an Chief. Writer darf enge belegte Fehler im Scope
selbst korrigieren, aber keine Produktentscheidung erfinden.

P2-GREEN erfordert Bericht/Handoff mit Dateiliste, exakten Tests, Findings,
Restrisiken, Token/Kosten und Rechteende. Es startet P3 nicht automatisch.

END-CHECK: :)
