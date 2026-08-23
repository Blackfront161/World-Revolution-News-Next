# Task Brief – WRN-G3-001 Foundation

## Metadaten

- Task-ID: `WRN-G3-001`
- Phase/Gate: G3 / Wave 1
- Auftraggeber: Product Owner
- Owner-Agent: Chief AI Architect; spaeter eng begrenzte Implementierungsowner
- Delegation: erst nach `GO-IMPLEMENTATION`; maximal zwei getrennte Schreibpakete
- Risikoklasse: hoch wegen neuer Toolchain-/Repositorygrenzen, ohne Livewirkung
- Freigabe: Product Owner – `GO-IMPLEMENTATION` am 23. August 2026
- Status: **QA GREEN – PRODUCT-OWNER-VISUALABNAHME AUSSTEHEND**

## Ziel

Die kleinste reproduzierbare neue Workspacefoundation erzeugen, auf der App
und Website als getrennte Produkte mit gemeinsamen Domain-/Contract-/Brand-
Primitiven entwickelt werden koennen. Noch keine Legacyfunktion portieren.

## Geplanter Scope nach Freigabe

- `apps/mobile`: React/TypeScript/Vite/Capacitor-Shell;
- `apps/website`: getrennte React/TypeScript/Vite-Shell;
- `packages/domain`, `packages/api-contracts`, `packages/brand-tokens` und
  `packages/test-support` mit harten Importgrenzen;
- Workspace-/Lockfile, Formatter, Lint, Typecheck, Unit-/Contracttest und lokale
  Screenshot-Smokes;
- CI nur pruefend und ohne Deployment-, Signier- oder Uploadauthority;
- neutrale, selbst erzeugte Platzhalter statt ungepruefter Legacyassets.

## Erlaubte Schreibpfade

- Root-Workspacekonfiguration: `package.json`, `pnpm-workspace.yaml`,
  `pnpm-lock.yaml`, TypeScript-/ESLint-/Prettier-/Playwright-Konfiguration,
  `.node-version`, `.npmrc`, `.gitignore` und `README.md`;
- `apps/mobile/**` und `apps/website/**`;
- `packages/domain/**`, `packages/api-contracts/**`,
  `packages/brand-tokens/**` und `packages/test-support/**`;
- lokale pruefende Werkzeuge unter `tools/**`;
- Task-, Evidenz-, Handoff-, Status-, Risiko- und Kostenbelege unter `docs/**`.

`.github/**`, Remotes, produktive Infrastruktur und alle Legacyquellen bleiben
ausserhalb dieses Tasks. Native Androidgenerierung wird nur aufgenommen, wenn
die lokale Toolchain den read-only Vorcheck besteht; andernfalls bleibt der
Capacitor-Vertrag konfiguriert und die Abweichung dokumentiert.

## Nicht-Ziele

- kein Legacycode-/Assetimport;
- keine echte Newsfunktion, Worker, Datenbank oder Providerintegration;
- kein Cloudflare-/Hostinger-/Google-Play-Zugriff;
- keine Secrets, Signierung, Remoteerstellung, Deployment oder Produktion;
- keine Translation, Podcasts, Push, Feedback, Standort, Zine oder Map/Spiel.

## Akzeptanzkriterien

1. Mobile und Website koennen getrennt installiert, gebaut, getestet und
   zurueckgenommen werden.
2. Apps importieren einander nie; gemeinsame Pakete sind plattformneutral.
3. Exakte Versionen, Lockfile, Lizenzbericht und Toolchain sind reproduzierbar.
4. Leere Shells zeigen Loading-, Error- und Offline-Testzustand ohne Remotezugriff.
5. Screenshot-Smokes decken Smartphone, Tablet und Desktop der Website sowie
   einen Android-Referenzviewport ab; noch kein Paritaetsversprechen.
6. Accessibility-Smokes pruefen Fokus, Tastatur, 200-Prozent-Reflow,
   Touchziele und semantische Grundstruktur.
7. Keine produktive externe Nebenwirkung und keine ungepruefte Datei im Diff.
8. Unabhaengiger QA-Review vor Abnahme.

## Abschlussbelege

| Kriterium | Ergebnis | Beleg |
|---|---|---|
| getrennte Clients und Ruecknahme | PASS | Kandidatencommit `e4d78b4`, getrennte Mobile-/Website-Builds |
| Import- und Plattformgrenzen | PASS | Workspace-Guard und 4/4 Boundary-Negativtests |
| Toolchain, Lockfile und Lizenzen | PASS MIT R-37 | `docs/evidence/WRN-G3-001-TOOLCHAIN-AND-LICENSES.md` |
| lokale Zustaende ohne Remote | PASS | 16 Unit-/Contracttests und 10/10 E2E |
| Screenshotmatrix | PASS | zehn commitgebundene PNGs unter `docs/evidence/WRN-G3-001/` |
| Accessibility-Grundlage | PASS | Axe 0 Violations, Fokus, 44px, Semantik, Overflow und Reflow |
| externe Nebenwirkungen/ungepruefte Dateien | PASS | Secret-/Artefakt-/Legacy-/Remote-Scan leer |
| unabhaengiger QA-Review | PASS | `docs/handoffs/WRN-G3-001-independent-qa.md` |

Der technische Foundation-Scope ist erfuellt. Die visuelle Abnahme des Product
Owners bleibt gemaess Qualitaetsregeln erforderlich; daraus folgt keine
automatische Freigabe von `WRN-G3-002`, Legacyimport, Android oder Release.

## Vorbedingungen

- Product Owner erteilt separat exakt `GO-IMPLEMENTATION`;
- PO-016 ist eingeplant: Qood wird ausgeschlossen; die verlangte offene
  Ersatzschrift wird erst in einem spaeteren Font-/Visualtask ausgewaehlt;
- PO-017 ist dokumentiert: owner-attested Markenassets duerfen erst nach
  `GO-IMPLEMENTATION` in einem eigenen Asset-Task importiert werden; die
  Foundation nutzt weiterhin neutrale Platzhalter;
- WRN-G2-004 ist abgeschlossen und unabhaengig ohne Secretbefund geprueft; die
  Product-Owner-Abnahme bleibt Teil des separaten `GO-IMPLEMENTATION`-Befehls;
- aktueller Git-Status ist gesichert; ein Foundation-Checkpoint ist
  ruecknehmbar;
- Dependencydownload und spaetere Remote-/CI-Aenderungen erhalten jeweils die
  nach AGENTS.md erforderliche Einzelgenehmigung.

## Direkt folgende vertikale Funktion

Nach bestandener Foundation ist `WRN-G3-002` der erste Produkt-Slice:
immutable lokale Manifest-v1-Fixture -> Domainvertrag -> getrennte mobile und
responsive Website-Newsfeeds mit Quelle, Datum, Sprache, Tags sowie Lade-,
Leer-, Fehler- und Offlinezustand. Keine bewegliche Livequelle und kein
Hochrisikodienst. Erst danach Artikelreader/SEO.

## Ruecknahme

Der neue Foundationcommit kann vollstaendig verworfen werden. Legacy-App,
Website, Daten und Liveinfrastruktur bleiben unveraendert.
