# Sauberes Wo Rev Ne

Dieses private Arbeitsrepository ist das neue, kontrollierte Grundgeruest fuer
World Revolution News (WRN) und die gemeinsame Marke Solinaridao.

Der aktuelle Stand enthaelt bewusst **keinen Produktcode**. Er definiert zuerst
Produktziel, Quellen, Architekturgrenzen, Agentenzustaendigkeiten und
Qualitaetsgates. Implementierung darf erst nach dem dokumentierten Start-Gate
beginnen.

## Aktuelle Phase

**Phase 0 – Organisations- und Analysebasis**

- Git-Struktur und Codex-Regeln: angelegt
- Custom-Agent-Profile: angelegt, nicht gestartet
- Product Charter: angelegt
- vorlaeufige Feature-Paritaetsmatrix: angelegt
- Qualitaets- und Release-Gates: angelegt
- Produktcode: nicht angelegt
- Deployment, Signierung oder Upload: nicht ausgefuehrt

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
