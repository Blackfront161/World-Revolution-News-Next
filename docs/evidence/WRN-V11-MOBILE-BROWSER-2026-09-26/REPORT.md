# Aktueller mobiler Browserdurchlauf · 26.09.2026

Auf dem RC-Checkout `b2b30c71adcce6f4d8c0e3af06992929049e9822` mit
unverändertem Produktstand `a4cbbff92b08219e28f4f84894fea3bcb1fa91b6`
wurde `pnpm exec playwright test --project=mobile-390x844 --workers=2`
vollständig ausgeführt. Ergebnis: **485 bestanden, 41 projektspezifisch
übersprungen, 0 fehlgeschlagen**; alle 526 gelisteten Fälle sind zugeordnet.
Laufzeit 21,8 Minuten. Das ignorierte lokale Protokoll
`work/rc-mobile-390-e2e-20260926.log` hat 89.490 Byte und SHA-256
`c52ce842e496e9ad6dd591b31f4f51c0d0d1f01ea17fa1e19e00d80224467af5`.

Der Vite-Entwicklungsserver meldete während des Laufs dreimal einen
fehlgeschlagenen dynamischen Modulabruf (Directory, Knowledge, Support). Die
betroffenen Tests bestanden nach der vorgesehenen Fehlergrenze bzw.
Wiederaufnahme; das ist **kein** Nachweis, dass Produktions-Chunks auf jedem
Gerät fehlerfrei laden. `pnpm check` und beide Produktbuilds waren für diesen
Produktstand bereits bestanden. Der Durchlauf beweist nur das genannte eine
mobile Browserprojekt, nicht die übrigen sechs Projekte, ein Android-Gerät,
Provider- oder Hostbetrieb.

Kein Produktcode, AAB, Play-Track oder Live-Host wurde für diesen Test geändert.
