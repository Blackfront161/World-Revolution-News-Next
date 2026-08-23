# WRN-G3-001 – Toolchain-, Dependency- und Lizenzbeleg

Stand: 23. August 2026
Scope: ausschliesslich lokale Foundation, kein Deployment und kein
Produktionszugriff

## Reproduzierbare Toolchain

| Baustein | Festgelegte Version | Beleg/Regel |
|---|---:|---|
| Node.js | `24.19.0` | `.node-version`, `engines` und harter `toolchain:check` |
| pnpm | `11.19.0` | `packageManager`, `engines` und harter `toolchain:check` |
| TypeScript | `6.0.3` | exakte Root-Dependency und Lockfile |
| React / React DOM | `19.2.8` | exakte App-Dependencies und Lockfile |
| Vite | `8.2.2` | exakte Root-Dependency und Lockfile |
| Vitest | `4.1.11` | exakte Root-Dependency und Lockfile |
| Playwright | `1.62.1` | exakte Root-Dependency; vorhandener lokaler Chrome |
| Chrome | `151.0.7922.170` | lokaler Browser fuer die G3-001-Smokes |
| Capacitor Core/CLI/Android | `8.5.0` | exakte Mobile-Dependencies und Lockfile |

`pnpm-workspace.yaml` enthaelt die pnpm-11-Projektregeln. Abhaengigkeiten
werden exakt gespeichert, Peer-Abhaengigkeiten nicht still installiert,
Installationsskripte bleiben deaktiviert und ein 24-Stunden-Altersgate gilt
fuer kuenftige, nicht ausdruecklich gepruefte Versionen. Der Lockfile-Hash des
geprueften Stands lautet:

`A02BFECF2BD71E7DCFE0FC1C76A0EF5F33BD148093C7EBFFBA8CC48DECBC77C4`

`pnpm install --frozen-lockfile` bestand. Der Qualitaetslauf wird unter der
festgelegten Node-Version ausgefuehrt und bricht unter der lokal ebenfalls
vorhandenen, aber nicht freigegebenen Systemversion Node `24.16.0` bewusst ab.
Auf einem neuen Rechner muss daher zuerst Node `24.19.0` gemaess
`.node-version` bereitgestellt werden. Es wurde in diesem Task keine globale
Node-Installation veraendert.

Die Projektkonfiguration folgt der aktuellen pnpm-11-Regel, nach der
Workspaceoptionen in `pnpm-workspace.yaml` statt in `.npmrc` liegen. Quellen:
[pnpm Settings](https://pnpm.io/settings) und
[pnpm Runtime-Pinning](https://pnpm.io/package_json#devenginesruntime).

## Dependency- und Supply-Chain-Pruefung

- sieben Workspaceprojekte inklusive Root;
- 325 installierte Paketversionen im Lizenzscan;
- 351 Eintraege im Audit inklusive optionaler Abhaengigkeiten;
- Lockfile bestand die aktive pnpm-Supply-Chain-Policy;
- `ignoreScripts: true`: keine Dependency-Installationsskripte ausgefuehrt;
- keine automatische Peer-Installation; das benoetigte
  `@testing-library/dom@10.4.1` ist direkt und exakt deklariert.

## Lizenzklassen

| Lizenz | Paketversionen |
|---|---:|
| MIT | 248 |
| Apache-2.0 | 24 |
| ISC | 20 |
| BlueOak-1.0.0 | 11 |
| BSD-2-Clause | 8 |
| MPL-2.0 | 4 |
| BSD-3-Clause | 3 |
| MIT-0 | 2 |
| Unlicense | 2 |
| 0BSD | 1 |
| CC-BY-4.0 | 1 |
| CC0-1.0 | 1 |
| **Summe** | **325** |

Der Scan meldete keine unbekannte, proprietaere, GPL- oder AGPL-Lizenz. Diese
Foundation enthaelt weiterhin keine Legacydatei, Schriftdatei, Marke oder
Medienkopie. Die spaetere Produktveroeffentlichung braucht dennoch einen
vollstaendigen Notice-/Attributionsbeleg fuer die dann tatsaechlich
ausgelieferten Abhaengigkeiten und Assets.

## Security-Audit

`pnpm audit --json` meldete null kritische, null hohe, null niedrige und eine
moderate Advisory:

- `uuid@7.0.3`, `GHSA-w5hq-g745-h8pq`;
- ausschliesslicher Pfad:
  `apps/mobile > @capacitor/cli@8.5.0 > xcode@3.0.1 > uuid@7.0.3`;
- als Development-Abhaengigkeit markiert und nicht Teil der gebauten
  Webruntime;
- die gepatchte `uuid`-Linie ist `>=11.1.1`, wird vom Upstreampfad aber nicht
  direkt kontrolliert.

Es wird kein riskanter transitive Override eingefuehrt. R-37 dokumentiert den
Beobachtungs- und Upgradepunkt vor nativer Androidgenerierung oder G5.

## Lokale Android-Grenze

Java, ADB und Gradle waren im lokalen Vorcheck nicht verfuegbar. Deshalb wurde
kein nativer `android/`-Ordner erzeugt. Vorhanden ist nur der gepruefte
Capacitor-Vertrag mit Paket-ID `com.world.revolution` und `webDir: dist`.
Androidgenerierung, SDK/API-36-, Geraete-, Signier- und Play-Pruefungen bleiben
ein eigener, spaeter freizugebender Task.

## Ergebnis

**PASS MIT DOKUMENTIERTEM MODERATEM DEV-DEPENDENCY-RISIKO.** Die Foundation ist
lokal reproduzierbar; sie ist weder ein Android-Releasekandidat noch fuer
Produktionsveroeffentlichung freigegeben.
