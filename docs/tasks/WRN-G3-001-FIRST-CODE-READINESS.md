# Task Brief – WRN-G3-001 Foundation (noch nicht freigegeben)

## Metadaten

- Task-ID: `WRN-G3-001`
- Phase/Gate: G3 / Wave 1
- Auftraggeber: Product Owner
- Owner-Agent: Chief AI Architect; spaeter eng begrenzte Implementierungsowner
- Delegation: erst nach `GO-IMPLEMENTATION`; maximal zwei getrennte Schreibpakete
- Risikoklasse: hoch wegen neuer Toolchain-/Repositorygrenzen, ohne Livewirkung
- Status: **VORBEREITET – GESPERRT BIS `GO-IMPLEMENTATION`**

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

## Vorbedingungen

- Product Owner erteilt separat exakt `GO-IMPLEMENTATION`;
- PO-014 ist erfuellt: Qood wird ausgeschlossen und ist keine Runtimeparitaet;
- PO-015 ist erfuellt: ungeklaerte Markenassets bleiben draussen und werden in
  einem spaeteren visuellen Task neu erstellt; die Foundation nutzt neutrale
  Platzhalter;
- WRN-G2-004 liefert das akzeptierte read-only Liveinventar ohne Secrets;
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
