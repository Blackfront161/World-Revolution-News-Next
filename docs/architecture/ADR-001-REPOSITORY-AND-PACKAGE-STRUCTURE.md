# ADR-001 – Repository- und Paketstruktur

- Status: `PROPOSED`
- Entscheidungseigner: Product Owner
- Technischer Owner nach Freigabe: Chief AI Architect
- Betroffene Risiken: R-02, R-03, R-10, R-13, R-18

## Kontext

App und Website gehoeren zur selben Marke, besitzen aber unterschiedliche
Navigation, SEO-, Android-, Cache-, Release- und Rollbackvertraege. Das
Contentrepository ist hochdynamisch und erzeugt grosse Datenartefakte. Ein
blindes Zusammenkopieren wuerde G1-Risiken konservieren.

## Entscheidung

Empfohlen wird ein privates Plattform-Monorepo mit zwei getrennten Apps,
gemeinsamen Paketen und klaren Services. Das Content-/Datenrepository sowie
Legacy- und Releasearchive bleiben getrennt.

Geplante Grenzen nach `GO-IMPLEMENTATION`:

| Pfadklasse | Inhalt | Darf nicht enthalten |
|---|---|---|
| `apps/mobile` | mobile UI, Capacitor, Androidadapter, mobiler Cache | Website-SEO/Apache |
| `apps/website` | responsive UI, Landingpage-/SEO-Adapter, Webcache | Android-/Playlogik |
| `packages/brand` | freigegebene Tokens und Assets mit Rechtebeleg | plattformspezifische Navigation |
| `packages/design-system` | nur tatsaechlich gemeinsame, barrierefreie Bausteine | ganze Screens oder Routing |
| `packages/domain` | reine Fachmodelle, IDs und Regeln | HTTP, DOM, Capacitor, Provider |
| `packages/api-contracts` | versionierte HTTP-Schemas und Fehlercodes | Workerimplementierung |
| `packages/content-contracts` | Manifest- und Content-Schemas | generierte Produktionsfeeds |
| `packages/test-support` | deterministische Fixtures und gemeinsame Matcher | produktive Secrets/Daten |
| `services/*` | getrennt deploybare Backendadapter | Clientnavigation |
| `infrastructure` | spaeter autorisierte IaC/Umgebungsreferenzen | Secretwerte |
| `tools` | reproduzierbare lokale QA-/Releasewerkzeuge | automatische Produktionmutation |

Ein Workspace-Lockfile und explizite Paketexporte werden angestrebt. Apps
duerfen gemeinsame Pakete konsumieren, aber nicht gegenseitig importieren.
Services duerfen Domain/Contracts nutzen, jedoch keine Clientpakete.
Gemeinsame Pakete werden semantisch versioniert; jedes Client-
Provenienzmanifest pinnt die konsumierten Paketversionen. Eine inkompatible
Majorversion darf nicht beide Clients still gleichzeitig aktualisieren.

## Alternativen

1. **Zwei vollstaendig getrennte Plattformrepositories:** bessere Isolation,
   aber hoehere Gefahr von Drift bei Brand, IDs und Vertraegen.
2. **Ein einzelnes Apppaket fuer Web und Android:** weniger Struktur, verletzt
   aber getrennte SEO-, Navigation-, Cache- und Releaseketten.
3. **Content im Plattformrepo:** vereinfachte lokale Entwicklung, jedoch grosse
   generierte Diffs, gekoppelte Releases und unklare Ownership.

## Kosten

- Einmalig: Workspace-, Paket-, Ownership- und CI-Grenzen einrichten.
- Laufend: zwei Clientpipelines und mehrere Servicepakete pflegen.
- Einsparung: gemeinsame Vertrags- und Brandkorrekturen werden nur einmal
  versioniert; weniger Drift und Doppelanalyse.
- Keine Hosting- oder Toolkosten werden aus dieser Struktur abgeleitet.

## Risiken und Gegenmassnahmen

- Ein Monorepo kann neue Monolithen beguenstigen: Importgrenzen und
  Abhaengigkeitspruefungen werden Gate.
- Eine gemeinsame Paketaenderung kann beide Clients koppeln: Consumer-Pinning,
  Compatibility-Fenster und getrennte Clientfreigaben.
- Gemeinsame Komponenten koennen plattformspezifische UX verwischen:
  Navigation und Screenlayouts bleiben in den Apps.
- Infrastrukturdateien koennen Secrets anziehen: nur Bindings/Referenzen,
  Secretwerte ausschliesslich in autorisierten Secret-Stores.

## Konsequenzen

App und Website koennen atomar gegen gemeinsame Vertragspakete getestet werden,
bleiben aber unabhaengig liefer- und rollbackfaehig. Das Contentrelease besitzt
eine eigene Revision und ist keine Nebenwirkung eines Clientbuilds.

## Migration

1. Noch keine Ordner anlegen.
2. Nach `GO-IMPLEMENTATION` leeres Workspace-Skelett in eigenem G3-Task
   erzeugen.
3. Zuerst Contracts/Test-Support, danach ein vertikales News-Slice.
4. Legacydateien nicht kopieren; Verhalten und kleine gepruefte Assets nur mit
   Rechtebeleg uebernehmen.
5. Jede App erhaelt eigene CI-, Cache- und Rollbackmetadaten.

## Verifikationsgate

ADR ist fuer G3 akzeptierbar, wenn ein statischer Importgrenzentest beweist,
dass Apps einander nicht importieren, beide getrennt paketierbar sind, Content
aus einer immutable Revision stammt und keine generierten Daten, Secrets oder
Releasearchive als gepflegte Quellpakete aufgenommen wurden.
