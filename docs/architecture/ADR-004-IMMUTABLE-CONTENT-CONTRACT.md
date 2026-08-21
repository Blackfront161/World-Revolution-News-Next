# ADR-004 – Immutable Datenrevision und Contentvertrag

- Status: `PROPOSED`
- Entscheidungseigner: Product Owner fuer Contentumfang; Backend/Data Owner
  fuer Vertragserfuellung
- Betroffene Risiken: R-05, R-06, R-17, R-22, R-27

## Kontext

G1 beobachtete bewegliche Pages-/Raw-`main`-Feeds, fehlende Library-, Video-
und Editorialdateien sowie ein Landingpage-Manifest ohne `ids`,
`articleCount` und `revision`. App und Website koennen dadurch unterschiedliche
Daten sehen; Landingpages, Sitemap und Shares sind nicht beweisbar an dieselbe
ID-Menge gebunden.

## Entscheidung

Jede Contentpublikation erzeugt eine immutable Revision und ein signier- oder
mindestens hashgebundenes Release-Manifest. Clients konsumieren nie ein
bewegliches `main` als stillen Vertrag. Ein stabiler Alias wie `current` darf
nur atomar auf eine bereits vollstaendig validierte Revision zeigen.

### Pflichtfelder des Release-Manifests

| Feld | Zweck |
|---|---|
| `contractVersion` | semantische Version des Manifest-Schemas |
| `revision` | immutable, weltweit eindeutige Contentrevision |
| `generatedAt` | UTC-Zeitpunkt des Generators, nicht Clientzeit |
| `sourceCommit` | gebundener Commit des Datenrepositories |
| `resources[]` | Pfad/URL, Schema, Required/Optional, SHA-256, Bytes, Recordzahl, Owner, Fallbackklasse |
| `articleIds` | sortierte ID-Menge oder deren hashgebundene externe Liste |
| `articleIdsSha256` | Hash der kanonisch sortierten Artikel-IDs |
| `compatibility` | min./max. unterstuetzte Client-/Contractversion |
| `provenance` | Generatorversion und unveraenderliche Quellenreferenzen |

Jede Ressource ist exakt eine Klasse:

- `required`: Revision wird nicht publiziert, wenn Datei, Schema, Hash oder
  Owner fehlt.
- `optional-empty`: Datei existiert schema-valide und kann leer sein; kein 404.
- `optional-absent`: Manifest nennt bewusste Abwesenheit, Grund, UI-Zustand und
  naechste Pruefung; Clients fragen keinen nicht vorhandenen Pfad ab.

### Identitaet und Provenienz

- IDs sind stabil, opak und nach Publikation nicht wiederverwendbar.
- Historische Artikel werden append-only erhalten oder besitzen einen
  versionierten Redirect-/Aliasdatensatz; ein Alias darf nie still auf einen
  fachlich anderen Inhalt zeigen.
- Artikel, Ereignisse, Orte, Akteure, Organisationen und Themen erhalten
  getrennte Namespaces.
- Pflichtprovenienz: Original-URL, Quelle, beobachteter/veroeffentlichter
  Zeitpunkt, Originalsprache oder `und`, Rechte-/Lizenzstatus, Transformations-
  und Uebersetzungsreferenz.
- Unsichere oder fehlende Angaben bleiben explizit unbekannt; es werden keine
  Herkunft, Sprache oder Verifikation erfunden.

### Feed-/Landing-/Sitemap-Gleichheit

Websitepaket, Feed, Landingpage-Manifest und Sitemap muessen dieselbe
`revision` und `articleIdsSha256` tragen. Vor Publikation gilt:

```text
feed IDs = landing manifest IDs = erzeugte Landingpage IDs
         = sitemap article IDs = share-/canonical-faehige IDs
```

Abweichung stoppt die Paketfreigabe. Historische IDs ausserhalb des aktiven
Feeds werden separat als Archivmenge gefuehrt und muessen weiterhin eindeutig
auflosbar sein.

## Alternativen

1. **Bewegliches `main` plus Cache-Busting:** einfach, aber nicht
   reproduzierbar und fuer Cross-Client-/SEO-Gleichheit ungeeignet.
2. **Nur Zeitstempel statt Hashes:** lesbar, erkennt aber weder Teilupdates noch
   Inhaltsdrift sicher.
3. **Content im Clientrepository:** koppelt redaktionelle und Clientreleases
   und vervielfacht grosse generierte Diffs.
4. **Datenbank als einzige Wahrheit:** kann spaeter sinnvoll sein, beseitigt
   aber ohne Exportmanifest weder Offline- noch Release-Reproduzierbarkeit.

## Kosten

- Generator- und Contractarbeit fuer Manifest, Schemas, Hashes und Archive.
- Zusaetzlicher Storage fuer immutable Revisionen und definierte Aufbewahrung.
- Einsparung durch deterministische QA, gezielte Rollbacks und weniger 404-
  sowie Driftanalyse.
- Storage- und Hostingpreise bleiben bis zum Liveinventar unbekannt.

## Risiken und Gegenmassnahmen

- Unbegrenztes Revisionswachstum: Retention nach Datenklasse, niemals
  unkontrolliertes Loeschen historisch verlinkter Inhalte.
- Fehlerhafter Generator kann konsistent falsche Daten erzeugen: Schema-,
  Provenienz-, Mengen- und Stichprobentests plus unabhaengige QA.
- Hashmanifest ohne vertrauenswuerdige Auslieferung: HTTPS, Releaseprovenienz
  und spaeter optional Signatur/Attestation.

## Konsequenzen

App, Website, Offlinepakete und SEO koennen auf denselben Contentstand zeigen,
ohne ihre Releases zu koppeln. Fallbacks werden sichtbar und testbar. Direkter
Raw-Zugriff bleibt hoechstens kontrollierter Recoveryadapter, nie Normalvertrag.

## Migration

1. Vor G3 Produzenten, Generatoren, Schemas und Owner read-only inventarisieren.
2. Bestehende IDs gegen Kollisions-/Stabilitaetsregeln kartieren.
3. Manifest v1 fuer eine feste G1-Fixture erzeugen und nur pruefen.
4. Website-Generator, Sitemap und Landingpages an dieselbe Revision binden.
5. Clients ueber einen kompatiblen Adapter umstellen; alte Revision als
   Rollback behalten.

## Verifikationsgate

Contract-, Schema-, Hash-, Required/Optional-, Same-ID-, Archiv-, Deep-Link-
und Rollbacktests muessen bestehen. Eine absichtlich fehlende Required-Datei,
ein geaenderter Hash oder eine ID-Mengendifferenz muss fail-closed vor
Paketierung stoppen; eine deklarierte optionale Abwesenheit muss ohne 404 und
mit dem vorgesehenen UI-Zustand funktionieren.
