# Agent Handoff – WRN-G3-012 Vorbereitung

Stand: 26. August 2026

Dokumentarischer Vorbereitungscheckpoint: `879d0b2`

## Ergebnis

WRN-G3-012 ist ausschliesslich dokumentarisch vorbereitet. Produkt-, Test-,
Fixture- und Assetcode wurde nicht geaendert. Kein Implementierungsmitarbeiter
wurde gestartet.

## Warum der Scope gegenueber der ersten Idee erweitert wurde

Zwei unabhaengige read-only Vorpruefungen fanden:

1. `@wrn/test-support` speist nicht nur den Feed, sondern auch Discover,
   Readerdetails und Archiv-Lifecycle. Die Runtimegrenze muss deshalb das
   vollstaendige atomische lokale Contentbundle umfassen.
2. Der Website-Landingpage-Generator importiert Testdaten direkt aus
   `packages/test-support/src/index.ts`; der bisherige Release-Boundary-Check
   prueft diesen Pfad nicht.

Nur die beiden `App.tsx`-Imports zu ersetzen waere ein falscher Abschluss.

## Gebundene Entscheidungen

- vorhandenes Manifest v1 unveraendert wiederverwenden;
- erwartete Revision plus separaten kanonischen Manifesthash pinnen;
- feste same-origin Resource-ID-/Pfad-Allowlist;
- Feed, Discover, Reader, Lifecycle und Websitepublikation atomar validieren;
- keine Teilrevision und kein stiller Fixturefallback;
- Test-Support aus Produktquellen, normalen Build-/Publisherpfaden und finalen
  Artefakten entfernen;
- `optional-absent` und unbekannte Ressourcen erzeugen keine Requests;
- keine Storage-, Cookie-, Cache-, Service-Worker-, Telemetrie- oder externe
  Netznebenwirkung;
- lokale Runtimekosten 0 CHF.

## Was der Product Owner sonst noch nicht vergessen darf

Diese Punkte sind bewusst **nicht** Teil von G3-012 und brauchen spaetere
eigene Gates:

1. G3-013 fuer echten Offlinecache, Update, Teilupdate, letzte valide Revision,
   Storage-full, Rollback und Tombstone-Purge.
2. Apache/CSP- und Capacitor-/Android-Originpruefung.
3. echte Inhalte, Rechte, Provenienz und 935-ID-Migration.
4. produktiver SEO-/Sitemap-/Landingpage-Publisher.
5. authentisierte Manifestprovenienz/Signatur vor Release.
6. Remote/CI, reproduzierbare Releaseartefakte, Deployment, Signierung,
   Upload und Play-Console-Verarbeitung.

## Verwendete Quellen

- `AGENTS.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/02-FEATURE-PARITY-MATRIX.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/07-RISK-REGISTER.md`
- ADR-001, ADR-004, ADR-005, ADR-007, ADR-008 und ADR-009
- `docs/architecture/MIGRATION-WAVES.md`
- G3-002-bis-G3-011-Task-/QA-/Handoffbelege
- aktuelle Client-, Test-Support-, Publisher- und Boundarypfade, read-only
- read-only Explorer `g3_012_runtime_inventory`
- read-only Security/Privacy Reviewer `g3_012_security_prep`

## Naechster Schritt

Der Product Owner prueft Task Brief und Abnahmeplan. Erst der exakte sichtbare
Befehl `START WRN-G3-012` erlaubt die sequenzielle Implementierung. Bis dahin
bleiben Produktcode, Tests, Fixtures, Livequellen und externe Systeme gesperrt.

## WRN-AGENT-STATUS

- Task: WRN-G3-012 Immutable Content Revision Consumer
- Status: GREEN – NUR DOKUMENTARISCH VORBEREITET
- Quellstand: G3-011-Abnahme `6e5dd20`; G3-012-Vorbereitung `879d0b2`
- Erledigt: Runtime-/Publisherinventar, Security-/Privacygrenzen,
  Vollstaendigkeit, Negativtests, visuelle Matrix, Agentensequenz und
  Folgetasks definiert
- Offen: separates sichtbares Implementierungsgate `START WRN-G3-012`
- Kosten: 0 CHF Runtime; keine externen APIs oder Provider
- Handoff: `docs/handoffs/WRN-G3-012-preparation.md`
- END-CHECK: :)
