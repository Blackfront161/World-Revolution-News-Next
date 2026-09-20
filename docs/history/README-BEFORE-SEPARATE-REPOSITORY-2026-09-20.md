# Sauberes Wo Rev Ne

Dieses private Arbeitsrepository ist das neue, kontrollierte Grundgeruest fuer
World Revolution News (WRN) und die gemeinsame Marke Solinaridao.

Der Product Owner hat den Foundation-Task `WRN-G3-001` technisch und den
lokalen Newsfeed-Slice `WRN-G3-002` technisch sowie visuell akzeptiert. Der
Marken-/Design-Slice `WRN-G3-003` einschliesslich der neutralen
PO-027-Spendenbeschriftung ist technisch und visuell akzeptiert. Der lokale
Navigations-Slice `WRN-G3-004` ist technisch, unabhaengig und durch den
Product Owner visuell akzeptiert. `WRN-G3-005` fuer lokale Suche und Filter
ist technisch sowie unabhaengig GREEN; die visuelle Product-Owner-Abnahme ist
noch offen.

## Aktuelle Phase

**Phase G3 / WRN-G3-005 technisch GREEN – visuelle Abnahme offen**

- Git-Struktur und Codex-Regeln: angelegt
- Custom-Agent-Profile: angelegt, nicht gestartet
- Product Charter: angelegt
- vorlaeufige Feature-Paritaetsmatrix: angelegt
- Qualitaets- und Release-Gates: angelegt
- Foundation-Code: lokal implementiert, automatisiert geprueft und technisch
  akzeptiert auf `codex/g3-001-foundation`; keine Design-/Paritaetsfreigabe
- G3-002: lokaler Manifest-Newsfeed technisch GREEN und vom Product Owner
  visuell akzeptiert; fehlende Funktionen bleiben eigene Slices
- G3-003: drei hashgebundene Markenoriginale, gemeinsames Assetmanifest,
  semantische Tokens und getrennte Mobile-/Website-Header lokal umgesetzt
- PO-026/027: Websiteheader kompakter; App-Link `Mehr zum Projekt` und neutral
  beschrifteter Link `Unterstuetzen` umgesetzt; Kandidat `f54a2993e1ec`,
  unabhaengige QA GREEN und vom Product Owner visuell akzeptiert
- G3-004: fuenf mobile Bottom-Ziele, responsive Websitegruppen, stabile
  Ziel-IDs, History/Fokus und ehrliche Zwischenansichten umgesetzt; Kandidat
  `3d89fbc05c53`, finale unabhaengige QA GREEN mit null offenen Findings und
  durch den Product Owner visuell akzeptiert
- G3-005: `Entdecken` mit rein lokaler Suche und den Facetten Region, Thema,
  Quelle, Originalsprache und Format implementiert; Kandidat `9a9a2216a4fa`,
  unabhaengige QA und Sichtmatrix GREEN mit null offenen Findings
- Legacycode und echte Inhalte: nicht importiert; nur die drei einzeln
  freigegebenen und geprueften Markenoriginale wurden uebernommen
- Deployment, Signierung oder Upload: nicht ausgefuehrt

## Lokale Foundation-Befehle

Voraussetzung ist exakt Node `24.19.0` gemaess `.node-version` und pnpm
`11.19.0`. Der Hauptcheck bricht bei einer abweichenden Toolchain ab.

```text
pnpm install --frozen-lockfile
pnpm run check
pnpm run build
pnpm run test:e2e
```

Mobile und Website bleiben getrennt baubar. Die Browser-Smokes starten und
schliessen ihre rein lokalen Testserver selbst. Es wird kein externer Dienst
angesprochen.

Die wichtigsten Abnahmebelege liegen im
[`WRN-G3-001 Visual-QA-Bericht`](docs/evidence/WRN-G3-001-VISUAL-QA-REPORT.md),
im
[`Toolchain-/Lizenzbeleg`](docs/evidence/WRN-G3-001-TOOLCHAIN-AND-LICENSES.md)
und im
[`unabhaengigen QA-Handoff`](docs/handoffs/WRN-G3-001-independent-qa.md).
Der aktuelle Navigationsstand ist im
[`G3-004-Finalbericht`](docs/evidence/WRN-G3-004-FINAL-VISUAL-QA-REPORT.md)
und im
[`gefuehrten G3-004-Abnahmebrief`](docs/evidence/WRN-G3-004-VISUAL-ACCEPTANCE-BRIEF.md)
dokumentiert. Der noch nicht gestartete Folgescope steht im
[`WRN-G3-005 Task Brief`](docs/tasks/WRN-G3-005-DISCOVER-LOCAL-SEARCH-FILTERS.md)
und im
[`Entdecken-Paritaetsbrief`](docs/evidence/WRN-G3-005-DISCOVER-PARITY-BRIEF.md).
Die gefuehrte Sichtabnahme steht im
[`G3-005-Abnahmebrief`](docs/evidence/WRN-G3-005-VISUAL-ACCEPTANCE-BRIEF.md).

## Verbindliche Einstiegsdokumente

1. [`AGENTS.md`](AGENTS.md) – Regeln fuer Main Agent und Sub-Agenten
2. [`docs/00-PRODUCT-CHARTER.md`](docs/00-PRODUCT-CHARTER.md) – Produktziel und Grenzen
3. [`docs/01-SOURCE-OF-TRUTH.md`](docs/01-SOURCE-OF-TRUTH.md) – massgebliche Altstaende
4. [`docs/02-FEATURE-PARITY-MATRIX.md`](docs/02-FEATURE-PARITY-MATRIX.md) – Funktionsabdeckung
5. [`docs/03-TARGET-ARCHITECTURE.md`](docs/03-TARGET-ARCHITECTURE.md) – vorgeschlagene Zielstruktur
6. [`docs/04-QUALITY-RULES.md`](docs/04-QUALITY-RULES.md) – Abnahme-, Test- und Releasegates
7. [`docs/05-AGENT-ROSTER.md`](docs/05-AGENT-ROSTER.md) – Kernteam, Reserve und Modellrouting
8. [`docs/06-DECISION-LOG.md`](docs/06-DECISION-LOG.md) – nachvollziehbare Entscheidungen
9. [`docs/07-RISK-REGISTER.md`](docs/07-RISK-REGISTER.md) – bekannte Risiken und Gegenmassnahmen
10. [`docs/08-CONTEXT-CONTINUITY.md`](docs/08-CONTEXT-CONTINUITY.md) – Kontextgesundheit und sichere Agentenrotation
11. [`docs/PROJECT-STATE.md`](docs/PROJECT-STATE.md) – kompakter, dauerhafter Projektstatus

## Geplanter spaeterer Produktaufbau

Das Repository soll nach Architekturfreigabe zwei getrennt auslieferbare
Oberflaechen enthalten: Mobile App und responsive Website. Gemeinsame
Markenregeln, UI-Bausteine und Datenvertraege werden geteilt; Deployment- und
Cacheketten bleiben getrennt. Das Daten-/Content-Repository bleibt eine eigene
Quelle. World Revolution Map und das historische Kartenspiel sind spaetere
Erweiterungen und werden vorerst nur ueber stabile Schnittstellen vorbereitet.

## Wichtiger Sicherheitsstatus

Keine Datei dieses Repositorys enthaelt Secrets, Keystores oder Signierdaten.
Agenten duerfen ohne ausdruecklichen Auftrag weder deployen noch signieren,
hochladen, produktive Daten veraendern oder Altbestaende loeschen.
