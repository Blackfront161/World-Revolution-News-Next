# WRN-G3-019 – P2-Vertragsvollstaendigkeitsaudit vor P3

Status: **VORBEREITET – START ERST NACH BEENDETEM P2-R2-SECURITYDELTA**

Stand: 31. August 2026

## Ziel

Ein frischer unabhaengiger Sol-Architekturreview prueft vor jedem UI-Write,
ob der technisch gepruefte Reader-v2-Datenvertrag alle im verbindlichen
Produktbrief verlangten Informationen ausdruecken und fail-closed an Mobile
uebergeben kann. Der Review bewertet keine Gestaltung und implementiert
nichts.

## Gebundene Quellen

- Produktbrief:
  `docs/tasks/WRN-G3-019-READER-CONTENT-AND-INLINE-TRANSLATION.md`
- P1-/P1-R-Architekturbelege und P2-Vertrag:
  `docs/tasks/WRN-G3-019-P2-BACKEND-PACKET.md`
- Produktkandidat `a77d7b2`, Testkandidat `d66ee6e`
- `packages/content-contracts/src/mobile-reader-v2.ts`
- `apps/mobile/src/mobile-reader-v2.ts`
- `apps/mobile/src/mobile-reader-v2-media-safety.ts`
- lokale Reader-v1-/Reader-v2-Fixtures und bestehender Mobile-Reader nur
  read-only

## Pflichtfragen

Der Reviewer prueft mindestens:

1. Kann jede v2-Projektion Parser-/Transformationsversion, stabile Abschnitts-
   und Blockidentitaet sowie den unveraenderten Originalbezug eindeutig
   nachweisen?
2. Ist eine optionale Vorgaengerrelation mit stabiler Artikel-/Fragmentbindung
   und sichtbarer, nicht loeschender Trennsemantik vollstaendig ausdrueckbar?
3. Kann ein aufklappbares Quellenprofil Selbstbeschreibung und redaktionelle
   Einordnung, Typ, Region, Sprachen, Aktualitaet, Original-Link und einen
   optionalen offiziellen Korrekturkontakt getrennt darstellen, ohne Daten aus
   Text oder URL zu erfinden?
4. Traegt jedes zugelassene lokale Medium neben Provenienz auch den eigentlichen
   Alttext, und existiert eine fail-closed, buildgebundene Aufloesung vom
   opaken `localAssetId` zu exakt verifizierten lokalen Bytes? Fehlt sie, muss
   P3 sicher beim ehrlichen Placeholder bleiben.
5. Sind die pro Abschnitt erforderlichen Uebersetzungszustaende, Original-
   Sichtbarkeit, UI-Zielsprache, Stale-/Abortbindung und der deaktivierte
   Produktionsdefault mit den vorhandenen APIs ohne neue Provider- oder
   Persistenzoberflaeche implementierbar?
6. Bleiben Website, Shared Reader v1, Reading State, History, Back/Rueckfokus,
   Offline, A/B/A, Rollback, Revocation und externe Source-Grenzen unveraendert?

## Ergebnisregeln

- **GREEN:** P3 kann mit einer exakten UI-Allowlist vorbereitet werden.
- **YELLOW:** jede fehlende Vertragsinformation wird als einzelnes
  priorisiertes Finding mit minimalem Korrekturvertrag gebunden; P3 bleibt
  gesperrt.
- **RED:** Sicherheits-, Datenverlust- oder Architekturbruch; Chief stoppt
  G3-019 und disponiert gesondert.

Der Reviewer schreibt nur eigenen Bericht und Handoff, startet keine Kinder,
veraendert weder Produkt noch Tests und erteilt keine Website-, Content-,
Provider-, Live-, Android- oder Releasefreigabe.

END-CHECK: :)
