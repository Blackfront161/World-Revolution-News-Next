# ADR-010 – Kuenftige Map-/Spielgrenze

- Status: `PROPOSED` fuer den Vertrag; Featurestatus `DEFERRED`
- Entscheidungseigner: Product Owner fuer jedes spaetere Integrationsgate
- Betroffene Risiken: R-15, R-17, R-18

## Kontext

World Revolution Map und das historische Kartenspiel sind ausdruecklich nicht
Teil von Migration Release 1. Fehlende vorbereitete IDs, Zeit-/Geo-
Metadaten oder Deep Links koennten spaeter teure Migrationen verursachen;
vorweggenommener Spielcode wuerde den aktuellen Scope vergroessern.

## Entscheidung

Release 1 implementiert keine Karte, Spielmechanik, Scores, Inventare,
Mehrspieler-, Tracking- oder Karten-UI. Es definiert nur optionale,
versionierte Anschlussfelder ausserhalb des News-Kernobjekts.

### Vertragsgrenze

- stabile Namespaces fuer `contentId`, `eventId`, `locationId`, `actorId`,
  `organizationId` und `topicId`;
- ISO-Sprachcodes mit explizitem `und`, IANA-Zeitzone, UTC-Zeitpunkte und
  Zeitraeume mit Unsicherheitskennzeichnung;
- GeoJSON-kompatible Referenzobjekte mit Genauigkeit, Quelle, Rechte und
  optionaler Generalisierung; keine Nutzerposition;
- versionierte HTTPS-Deep-Links fuer Inhalte; App-Link-Adapter spaeter;
- Medien-/Quellenprovenienz nach ADR-004/006;
- jede raeumliche Information besitzt eine textuelle, tastatur- und
  screenreaderfaehige Alternative.

Die Felder sind optional und duerfen Release-1-Clients nicht zum Laden eines
Map-/Spielsystems verpflichten. Consumer-Capabilities werden ueber eine
separate Majorversion ausgehandelt.

## Alternativen

1. **Gar nichts vorbereiten:** kleinster Release-1-Aufwand, spaeter hohes ID-
   und Datenmigrationsrisiko.
2. **Map/Spiel jetzt als Paket scaffolden:** scheinbar zukunftssicher, verletzt
   aber Scope und erzeugt ungetesteten Architekturballast.
3. **Geo direkt in jedes Newsobjekt einbetten:** einfach zu konsumieren, koppelt
   jedoch News, Rechte, Genauigkeit und spaetere Kartenrevisionen.

## Kosten

- Geringe Schema-/Dokumentkosten fuer IDs und optionale Referenzen.
- Keine Map-, Tile-, Geocoding-, Hosting-, Game-Engine- oder API-Kosten in
  Release 1.
- Spaetere Kosten benoetigen eine neue ADR und Product-Owner-Budgetfreigabe.

## Risiken und Gegenmassnahmen

- Optionale Felder koennen dennoch Scope schleichen lassen: Release-1-UI darf
  sie nur als Text/Link nutzen, nicht als Karte.
- Geoangaben koennen sensibel oder ungenau sein: Provenienz, Genauigkeit,
  Generalisierung und redaktionelles Gate.
- Deep Links koennen veralten: stabile IDs, Versionierung und Fallback auf
  barrierefreie Inhaltsseite.

## Konsequenzen

Die Migration vermeidet spaetere ID-Sackgassen, ohne Spielcode oder neue
Provider einzufuehren. Map und Spiel bleiben getrennte Projekte, Releases und
Datenschutzbewertungen.

## Migration

1. Bestehende Content-/Event-/Ort-IDs read-only kartieren.
2. Alias-/Kollisionsregeln in ADR-004 anwenden.
3. Optionales Referenzschema und textuellen Fallback als Contracttest anlegen,
   erst nach `GO-IMPLEMENTATION`.
4. Keine Map-/Spielabhaengigkeit in Client- oder Servicepakete aufnehmen.

## Verifikationsgate

Contracttests beweisen stabile IDs, optionale Felder, Quellen-/Rechteangaben,
Zeit-/Geo-Unsicherheit und funktionierende Text-/Deep-Link-Fallbacks. Ein
Importscan muss bestaetigen, dass Release 1 keine Map-, Tile-, Geocoding- oder
Game-Engine-Abhaengigkeit enthaelt. Jede echte Integration braucht eine neue
Product-Owner-Freigabe.
