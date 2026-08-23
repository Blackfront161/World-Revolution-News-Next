# Sauberes Wo Rev Ne

Dieses private Arbeitsrepository ist das neue, kontrollierte Grundgeruest fuer
World Revolution News (WRN) und die gemeinsame Marke Solinaridao.

Der Product Owner hat den eng begrenzten Foundation-Task `WRN-G3-001`
technisch akzeptiert. Die neutrale Workspacebasis enthaelt noch keine
Legacyfunktion, echten Inhalte, Markenassets oder produktiven Dienste. Der
erste lokale Newsfeed-Slice `WRN-G3-002` wurde am 23. August 2026 gestartet.

## Aktuelle Phase

**Phase G3 / aktive Wave 2 – lokaler Manifest-Newsfeed**

- Git-Struktur und Codex-Regeln: angelegt
- Custom-Agent-Profile: angelegt, nicht gestartet
- Product Charter: angelegt
- vorlaeufige Feature-Paritaetsmatrix: angelegt
- Qualitaets- und Release-Gates: angelegt
- Foundation-Code: lokal implementiert, automatisiert geprueft und technisch
  akzeptiert auf `codex/g3-001-foundation`; keine Design-/Paritaetsfreigabe
- G3-002: Task Brief und gefuehrter Alt-vs.-Neu-Abnahmebogen vorbereitet;
  Umsetzung im exakt begrenzten lokalen Scope gestartet
- Legacycode, echte Inhalte und Markenassets: nicht importiert
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
