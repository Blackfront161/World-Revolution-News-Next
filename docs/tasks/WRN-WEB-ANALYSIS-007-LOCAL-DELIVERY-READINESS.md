# WRN-WEB-ANALYSIS-007 – lokale Auslieferungsbereitschaft

Stand: 30. August 2026. Auftrag PO-080. Owner: Chief. Dieser Auftrag endet
vor jeder Hosting-, DNS-, Upload- oder Liveaktion.

## Ziel

Der durch PO-079 visuell akzeptierte Websitekandidat wird mit der bereits
integrierten Staging-/Retirement-Toolchain in einem sauberen, getrennten
Checkout neu gebaut und lokal geprueft. Das Ergebnis ist nur ein nicht
uploadfaehiges Probe-Paket mit exakter Datei-, Byte- und SHA-256-Bindung.

## Gebundene Quellen

- aktueller Governance-/Quellstand: `c813d8d`
- visuell akzeptierter Produktkandidat: `8df7b5c`
- V3-R4-Evidence/Handoff: `fb54d27`
- Staging-/Retirement-Paket und Sicherheitskorrekturen:
  `docs/tasks/WRN-WEB-ANALYSIS-003-STAGING-PACKAGE.md`,
  `docs/tasks/WRN-WEB-ANALYSIS-004-STAGING-SECURITY-CORRECTIONS.md`
- integrierte Hauptliniencommits der Paketfolge: `623fdb4`, `ae39079`,
  `54e2d62` und `0ce3dfd`; abweichende IDs in den isolierten Handoffs sind
  historische Original-Worktree-Commits, nicht die aktuelle Quellbindung
- technische Handoffs WRN-WEB-ANALYSIS-003 bis -006
- Hostinggrenzen aus
  `docs/tasks/WRN-WEB-ANALYSIS-001-SEPARATE-PREVIEW.md`

## Erlaubte lokale Arbeit

1. Zwei saubere, getrennte Checkouts exakt desselben Commits erstellen.
2. Vorhandene gepinnte Toolchain ohne neue Dependency und ohne Netzwerkzugriff
   verwenden.
3. Websiteunits, Node-/Pakettests, Boundaries, Typecheck, fokussierten Lint,
   Normalbuild und zwei identische Staging-Probe-Builds ausfuehren.
4. Fuer beide Proben ausschliesslich die reservierte, nicht erreichbare Origin
   `https://preview.example.test`, Canonical-Strategie `self` und Paketmodus
   `probe` verwenden.
5. Probe-Paket lokal mit ausdruecklichem `--allow-probe` verifizieren und
   bestaetigen, dass dieselbe Probe ohne diese Testausnahme nicht uploadfaehig
   ist.
6. Ergebnisse und Hashbindungen nur unter
   `docs/evidence/WRN-WEB-ANALYSIS-007/` und in einem Handoff dokumentieren.

Produkt-, Test-, Paket-, Build-, Mobile-, Android- und Legacyquellen bleiben
unveraendert. Generierte Probeausgaben sind ignorierte lokale Belege und keine
einzucheckenden Uploadartefakte.

## Abbruch- und Freigabegrenze

Bei Testfehlern, nicht deterministischen Paketen, unerwarteten Dateien oder
Abweichungen vom akzeptierten Kandidaten wird kein Fehler wegakzeptiert und
kein Upload vorbereitet. Ein echter `candidate`-Build benoetigt weiterhin:

- eine reale separate HTTPS-Origin;
- die ausdrueckliche Canonical-Strategie `self` oder `source`;
- nachgewiesenen isolierten Document Root, HTTPS, 0-CHF-Nutzung und einen mit
  Offline-Fetches kompatiblen Zugriffsschutz;
- unabhaengige Pruefung des frischen Kandidatenpakets;
- eine einzelne Freigabe fuer Hostingmutation und Upload.

Noindex ist kein Zugriffsschutz. Bestehende Website, App, AAB, Hauptdomain,
DNS, hPanel, Android und Google Play bleiben unangetastet.

## Abschlussformat

Bericht und Handoff nennen exakten Commit, Toolchain, Befehle, Exitcodes,
Testzahlen, Paket-/Shell-/Manifesthashes, Determinismusvergleich, offene
externe Gates und `END-CHECK: :)`.
