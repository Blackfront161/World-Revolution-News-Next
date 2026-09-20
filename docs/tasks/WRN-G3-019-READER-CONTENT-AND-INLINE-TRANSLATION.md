# WRN-G3-019 – Reader v2 und Inline-Abschnittsuebersetzung

Status: **DURCH PO-095 GESTARTET – NUR P1-ARCHITEKTURREVIEW**

Vorbereitungsbasis: `eb0b829`; Produktbasis: `fd3b0f9`; Branch
`codex/g3-015-website-offline-shell`. G3-018 ist durch PO-093 technisch und
sichtbar geschlossen. PO-094 `BEREITE WRN-G3-019 VOR` erlaubt ausschliesslich
Inventar, Vertrags-, Test- und Delegationsvorbereitung. Produktcode, Tests,
Browserlaeufe, echte Inhalte, Provider und externe Aktionen bleiben bis zum
exakten `START WRN-G3-019` gesperrt.

## Produktziel

Der Mobile-Reader wird professionell erweitert, ohne den bestehenden
Reader-v1-, Offline-, Save-, History- oder Websitevertrag umzudeuten:

1. kompakte Quellenzeile und aufklappbares lokales Quellenprofil;
2. selbst erstellte oder nachweislich erlaubte Bilder an stabilen semantischen
   Abschnittspositionen, sonst ehrlicher Placeholder;
3. saubere, stabile Abschnittsstruktur ohne heuristisches Loeschen;
4. explizite Abtrennung angehaengter Vorgaengerartikel nur bei belegter
   Quellrelation;
5. bewusste Inline-Uebersetzung einzelner Abschnitte in die gewaehlte
   UI-Sprache, Original jederzeit sichtbar;
6. unveraenderte korrekte Zuruecknavigation, Rueckfokus, Offline-Lesbarkeit
   und lokale Lesedaten.

Die UI bleibt eine professionell optimierte Fortfuehrung der Code-26-
Markenwirkung. `Globale Lage` bleibt ausgeschlossen. G3-019 importiert keine
Kandidaten aus `WRN-CONTENT-SOURCES-001`.

## Mobile-only Architekturgrenze

`reader-details` v1 ist ein gemeinsam von Mobile und Website geladener,
release- und lifecyclegebundener Vertrag und bleibt unveraendert. G3-019 darf
ihn nicht in place auf v2 umstellen.

Der spaetere Writer muss eine additive Mobile-Seitenprojektion entwerfen:

- eigener optionaler `mobile-reader-v2`-Vertrag mit eigener Revision und
  Integritaetsbindung;
- exakte Bindung an aktive Release-Revision, Reader-v1-Revision und
  Reader-v1-Hash;
- ausschliesslich Mobile laedt/projiziert diese Seiteninformation;
- fehlt sie, ist sie ungueltig, unpassend, future-versioned oder widerrufen,
  rendert Mobile den bestehenden v1-Reader unveraendert;
- Website-UI, Website-Loader, Shared-v1-Ressourcen und bestehende Public-
  Releases bleiben byteunveraendert;
- kein Overlay darf einen anderen Snapshot, alte Inhalte oder widerrufene
  Medien an einen aktiven Artikel binden.

Ein groesserer Cross-Client-Readerumbau benoetigt eine neue sichtbare
Product-Owner-Entscheidung und ist nicht Teil dieses Briefs.

## Additiver Reader-v2-Vertrag

Jeder v2-Artikel bindet mindestens:

- `articleId`, aktive Release-/Reader-v1-Revision und Reader-v1-Hash;
- stabile `sectionId` und `blockId`, Quellreihenfolge und
  `sourceFragmentSha256`;
- Parser-/Transformationsversion und expliziten Status
  `original`, `structured`, `ambiguous` oder `rejected`;
- optionale explizite Relation zu einem Vorgaengerartikel mit stabiler ID,
  Quellfragment und sichtbarer Trennbeschriftung;
- harte Caps fuer Abschnitte, Bloecke, Textlaenge, Medien und
  Uebersetzungs-Payloads.

Keine Textheuristik darf einen vermuteten Vorgaenger entfernen. Ist die
Abgrenzung nicht durch Quellstruktur oder einen lokalen Testvertrag belegt,
bleibt der Originalinhalt vollstaendig sichtbar und wird als mehrdeutig
gekennzeichnet.

## Bild-, Rechte- und Provenienzvertrag

Im G3-019-Produktslice sind nur selbst erstellte lokale Fixturebilder oder
ehrliche Placeholder erlaubt. Echte Quellbilder, Hotlinking, Scraping und
Remoteabruf bleiben bis zu Quellenpass und Rechtegate OUT.

Jedes Bild benoetigt mindestens:

- stabile `mediaId`, `articleId` und `sectionId`/`blockId`-Anker;
- Quelle, Rechte-/Lizenzreferenz, Attribution und erlaubte Auslieferungsart;
- MIME, Bytes, Dimensionen, Inhalts-Hash und Revision;
- Alttext samt Herkunft, keine politische oder personenbezogene Erfindung;
- Revocation-/Takedownstatus und fail-closed Ablauf.

Fehlt ein Feld, passt der Snapshot nicht oder ist das Medium widerrufen, wird
nur der neutrale lokale Placeholder gezeigt. Ein Fehler darf weder Layout
blockieren noch Tracking/Hotlinking ausloesen.

Das Quellenprofil trennt Selbstbeschreibung von redaktioneller Einordnung und
zeigt Typ, Region/Sprachen, Freshness, Original-Link und nur einen offiziellen
oeffentlichen Korrekturkontakt. Im Slice werden dafuer ausschliesslich lokale
selbst erstellte Profildaten verwendet.

## Uebersetzungsvertrag ohne Providerkosten

G3-019 fuehrt keinen Remoteprovider und keinen Produkt-Netzwerkrequest ein.
Der Produktionsadapter bleibt standardmaessig deaktiviert; die lokale
Produkt-/Testedition darf nur deterministische, selbst erstellte und
snapshotgebundene Uebersetzungsfixtures demonstrieren.

- Ziel ist die aktuell gewaehlte UI-Sprache; gleiche Sprache ist ein No-op;
- Uebersetzung erfolgt nur nach bewusster Aktion pro Abschnitt;
- Originaltext, Originalsprache, Ziel, Status und Provenienz bleiben sichtbar;
- Zustaende: `disabled`, `loading`, `translated`, `error`, `offline`, `stale`;
- Resultat-Key bindet Release, Artikel, Abschnitt, Quellfragmenthash,
  Ausgangs-/Zielsprache und Adapterversion;
- Snapshot-, Hash-, Sprach- oder Readerwechsel verwirft ein altes Resultat;
- kein Content-Logging, keine URL-/History-/Cookie-/Storage-/Telemetrysenke;
- Fehler, Timeout, Offline oder Nichtverfuegbarkeit lassen den Originaltext
  unveraendert lesbar.

Jeder spaetere Remoteweg benoetigt ein eigenes sichtbares Provider-/Privacy-/
Kosten-Gate mit Datenanzeige und Einwilligung, Retention/Region/DPA,
serverseitigen Secrets, harten Quoten und Payloadcaps. G3-019 erteilt dieses
Gate nicht.

## Unveraenderliche Bestandsvertraege

- Keine Bild- oder Uebersetzungsaktion erzeugt Historyeintraege.
- Back/Rueckfokus funktioniert aus Home, Discover, Fuer mich, Saved, Archive
  und bei gueltigem Kaltstart wie zuvor.
- Jede asynchrone Aktion ist an Snapshot, Artikel, Abschnitt und Quellhash
  gebunden und wird bei Wechsel abgebrochen.
- Offline bleibt der Originaltext lesbar; nicht lokal gebundene Bilder oder
  Uebersetzungen erscheinen nicht.
- Reading-State-Schema, gespeicherte IDs, Fortschritt, Loeschung und
  Future-Raw-Schutz bleiben bytegleich und unveraendert.
- A/B/A, Rollback, Revocation, Legacybundle und unbekannte Zukunftsversionen
  duerfen keine stale Reader-v2-Daten wiederbeleben.
- Externe Originalquelle oeffnet weiterhin nur ueber die bestaetigte sichere
  no-referrer-/noopener-Grenze.

## IN / OUT

IN nach spaeterem Start: additiver Mobile-v2-Datenvertrag, mobile-only Loader/
Adapter, lokale selbst erstellte v2-Fixtures, Readerdarstellung, Quellenprofil,
Bildplaceholder/-fixture, lokale Abschnittsuebersetzungsfixtures, neun UI-
Sprachen sowie gezielte Unit-/E2E-/Visualtests.

OUT: Aenderung des Reader-v1-Vertrags oder Shared-Releases, Website-UI/-Loader,
echte Inhalte/Quellen/Medien, Quellenrecherche und Admission, Remoteparser,
Remoteuebersetzung, Provider, neue Dependencies/Kosten, Tracking, Content-
Logging, Services/Infrastructure, Hosting/Live, Android/AAB/Play/Release,
World Revolution Map, Spiel und UX-POLISH-001.

## Sequenz und Agenten

Nach einem exakten `START WRN-G3-019`:

1. P1: frischer unabhaengiger Sol-Architektur-/Vertragsreview, alles read-only;
2. P2: nur bei P1-GREEN genau ein Backend/Data-Writer Terra/high fuer den
   additiven Vertrag, Validator, Mobileadapter und lokale Fixtures;
3. P3: nach gesichertem P2-Ende genau ein Frontend-Brand-Writer Terra/high;
4. P4-Q: frische unabhaengige Terra-QA fuer Funktion, Visual und A11y;
5. P4-S: frischer versiegelter Sol-Security-/Privacy-Diffreview;
6. P5: frischer Sol-Architekturabschluss, danach lokale PO-Sichtabnahme.

Normal maximal ein Subagent, keine Kinder und keine parallelen Schreiber.
Spark darf erst nach einem eingefrorenen, hoechstens zwoelf Keys umfassenden
reinen Katalog-/Fixture-Mikroauftrag helfen. Chief fuehrt allein das Register.

## Definition of Ready und Testmatrix

Vor Produktwrite bindet P1 eine exakte Dateiallowlist und bestaetigt die
mobile-only Seitenprojektion. Mindestmatrix:

- Contract-/Validator-Units: v1-Fallback, gueltiges v2, falscher Snapshot/
  Hash, future version, Caps, ungueltige IDs/Anker, Revocation;
- Parser-/Struktur-Units: stabile IDs, Reihenfolge, expliziter Vorgaenger,
  mehrdeutige Abgrenzung ohne Textverlust;
- Medien: Rechte erlaubt/verweigert, Hash/MIME/Bytes/Dimensionen, fehlender
  Alttext, Takedown, neutraler Placeholder, null Remoteabruf;
- Uebersetzung: no-request, gleiche Sprache, lokale Fixture, Fehler, Offline,
  stale cancellation, Snapshot-/Sprachwechsel, null Persistenz/Netzwerk;
- Lifecycle: A/B/A, Neustart, Rollback, Revocation, Legacybundle und Future-
  Schema; v1 bleibt Last-known-good;
- Navigation: Home, Discover, Fuer mich, Saved, Archive, Kaltstart,
  Browser/App-Back und Rueckfokus;
- Reading State: Save, Read, Fortschritt, Reset, Loeschung und read-only Schutz;
- Visual/A11y: neun UI-Sprachen, vier repraesentative Themes, 320/390/600 px,
  844x390 Landscape, 200-Prozent-Reflow, lange Texte, Tastatur/Fokus, Axe,
  44-px-Ziele, Bild-/Quellenprofil-/Uebersetzungs-/Fehlerzustaende;
- Boundaries, beide Typechecks/Builds und Nachweis, dass Website, Shared-v1,
  Dependencies und externe Requests unveraendert sind.

Rollback ist der Revert des isolierten v2-Sidecars und der Mobileprojektion;
Reader-v1 und lokale Lesedaten benoetigen keine Migration.

## Startgate

Der unabhaengige P0-R-Dokumentrecheck auf `c0d8d06` ist GREEN; die sechs
P0-A-Bedingungen sind geschlossen. PO-095 erteilt am 31. August 2026 exakt
`START WRN-G3-019`. Damit darf zuerst nur P1 gemaess diesem Brief laufen.
Produktarbeit beginnt erst nach einem gesicherten P1-GREEN und einem daraus
abgeleiteten exakten P2-Writerpaket. PO-095 ist keine Provider-, Content-,
Live- oder Releasefreigabe.

END-CHECK: :)
