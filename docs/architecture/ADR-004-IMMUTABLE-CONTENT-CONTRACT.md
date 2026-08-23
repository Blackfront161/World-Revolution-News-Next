# ADR-004 – Immutable Datenrevision und Contentvertrag

- Status: `ACCEPTED` am 23. August 2026; Contracttests vor Nutzung
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
| `articleSets` | getrennte, sortierte Mengen fuer aktiven Feed, Archiv, Landingpages, Redirects und Sitemap-Artikel |
| `articleSetHashes` | SHA-256 je kanonisch sortierter ID-Menge; niemals ein uneindeutiger Gesamthash |
| `compatibility` | min./max. unterstuetzte Client-/Contractversion |
| `provenance` | Generatorversion und unveraenderliche Quellenreferenzen |
| `revocationRevision` | mindestens zu respektierende Version des vorrangigen Tombstone-/Revocation-Manifests |

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

### Getrennte ID-Mengen und beweisbare Beziehungen

G1 belegt unterschiedlich grosse aktive, archivierte und statisch publizierte
Mengen. Sie werden deshalb nicht gleichgesetzt. Jede Menge besitzt einen
eigenen sortierten Export, Recordcount und SHA-256:

- `activeFeedIds`: IDs des fuer die Revision aktiven Feeds;
- `archiveIds`: alle in der Revision direkt aufloesbaren historischen und
  aktiven Artikel;
- `landingIds`: IDs mit statischer `/articles/<id>/`-Landingpage;
- `redirectSourceIds`: alte/aliasierte IDs mit versioniertem Ziel oder
  bewusstem Gone-Status;
- `sitemapArticleIds`: ausschliesslich Artikel-URLs der Sitemap; nicht-
  artikelbezogene Sitemap-URLs werden separat gezaehlt;
- `resolvableIds`: abgeleitet aus `archiveIds` plus gueltigen Redirectquellen.

Fuer jede publizierte Revision gelten folgende Beziehungen:

```text
activeFeedIds subseteq archiveIds
landingIds subseteq archiveIds
sitemapArticleIds = landingIds
redirectSourceIds disjunkt zu kanonischen Ziel-IDs
canonicalPathIds = landingIds
shareableIds subseteq resolvableIds
```

Ein aktiver oder historisch geteilter Artikel darf also aufloesbar sein, ohne
im aktiven Feed oder als statische Landingpage vorzuliegen. Fuer
`landingIds` ist der Pfadcanonical verbindlich; andere aufloesbare IDs nutzen
den dokumentierten Readerfallback oder einen versionierten Redirect. Ein
bewusster Takedown/Gone bleibt als nicht wiederverwendete ID mit sicherem
Status aufloesbar, aber ohne gesperrten Inhalt.

Websitepaket, Feed, Landingpage-Manifest und Sitemap tragen dieselbe
`revision`, dieselben benannten Mengenshashes und dasselbe Gesamtmanifest. Eine
verletzte Mengenbeziehung, nicht eine erwartbare unterschiedliche Anzahl,
stoppt die Paketfreigabe.

### Vorrangiger Revocation-/Tombstone-Vertrag

Immutable Revisionen bleiben reproduzierbar, koennen aber durch ein separates,
monoton versioniertes Revocation-Manifest ueberstimmt werden. Ein Eintrag nennt
Ziel-ID/Objekthash, Wirksamkeitszeit, sichere Grundkategorie, betroffene
Derivate und Status `blocked`, `gone` oder `replaced`; er enthaelt keinen
entfernten Inhalt.

Revocation hat immer Vorrang vor einer aelteren Contentrevision. Gateway und
Medienorigin liefern fuer gesperrte Objekte keinen Payload; Clients speichern
die hoechste bekannte Revocationrevision dauerhaft, purgen passende Cache-
und Offlineobjekte beim naechsten Onlineabgleich und duerfen sie aus einer
alten Revision nicht wiederherstellen. Revocable Medienpakete besitzen eine
maximale Offline-Gueltigkeit; danach ist vor Wiedergabe eine Revalidierung
erforderlich. Alte Clients werden am Origin mit `410`/sicherem Ersatzstatus
begrenzt; sofortiges Loeschen bereits offline befindlicher Daten kann ohne
Netz nicht garantiert und muss ehrlich dokumentiert werden.

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
  und vor G5 eine Entscheidung ueber authentisierte Signatur/Attestation.
  Hashes allein erkennen Drift, aber keinen kompromittierten Publisher.

## Konsequenzen

App, Website, Offlinepakete und SEO koennen auf denselben Contentstand zeigen,
ohne ihre Releases zu koppeln. Fallbacks werden sichtbar und testbar. Direkter
Raw-Zugriff bleibt hoechstens kontrollierter Recoveryadapter, nie Normalvertrag.

## Migration

1. Vor G3 Produzenten, Generatoren, Schemas und Owner read-only inventarisieren.
2. Bestehende IDs gegen Kollisions-/Stabilitaetsregeln kartieren.
3. Manifest v1 fuer eine feste G1-Fixture erzeugen und nur pruefen.
4. Website-Generator, Sitemap und Landingpages an dieselbe Revision binden.
5. Getrennte ID-Mengen/Hashes und Revocation-Overlay gegen G1-Fixtures
   validieren.
6. Clients ueber einen kompatiblen Adapter umstellen; alte Revision als
   Rollback behalten.

## Verifikationsgate

Contract-, Schema-, Hash-, Required/Optional-, Mengenbeziehungs-, Archiv-,
Deep-Link-, Revocation- und Rollbacktests muessen bestehen. Eine absichtlich
fehlende Required-Datei, ein geaenderter Hash oder eine unzulaessige
Mengenbeziehung muss fail-closed vor Paketierung stoppen; erwartbar
unterschiedliche aktive/archivierte/SEO-Anzahlen duerfen nicht fehlschlagen.
Eine deklarierte optionale Abwesenheit funktioniert ohne 404 und mit dem
vorgesehenen UI-Zustand. Ein tombstoned Objekt bleibt auch beim Rollback einer
Contentrevision gesperrt und wird aus erreichbaren Clientcaches entfernt.
