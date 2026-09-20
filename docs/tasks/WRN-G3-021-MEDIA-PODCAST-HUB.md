# WRN-G3-021 – Medien- und Podcast-Hub

Status: **P3-A DURCH PO-101 GESTARTET – WRITER-GATE WIRD GEBUNDEN**

## Freigabe und Abhaengigkeit

PO-095 erlaubte nur die getrennte dokumentarische/read-only Vorbereitung.
PO-099 schloss G3-020 sichtbar. PO-100 startet G3-021 am 1. September 2026
mit exakt `START WRN-G3-021`. Vor dem ersten Produktwrite bleiben folgende
Voraussetzungen bindend:

1. G3-020 technisch GREEN und durch den Product Owner sichtbar geschlossen,
2. das durch PO-100 erteilte Startgate,
3. aktuelle Quellen-, Alias-, Rechte-, Privacy- und Kostenvertraege,
4. selbst erstellte lokale Testmedien,
5. sequenzielle Daten-/Player-/Frontendarbeit und unabhaengige QA, Security
   und Architekturpruefung.

Vor dem spaeteren ersten Produktwrite muss ein eigenes, unabhaengig GREEN
geprueftes Arbeitspaket die exakten Dateiallowlists, Basis-/Ergebnisbindung,
Abbruchgrenzen und P1-bis-P5-Reihenfolge festlegen. Pro Dateibereich arbeitet
genau ein Schreiber; Daten-/Admission-/Rechtevertraege werden zuerst
gesichert, danach Player/Lifecycle, danach Mobile-Frontend. Frische QA und
Security berichten unabhaengig direkt an den Chief; der abschliessende
Architekturreview folgt erst nach deren gesichertem Ende. Diese Vorbereitung
aktiviert keinen dieser Schreiber.

P1 besteht aus getrennten read-only Kontinuitaets-, Technik-/Testbarkeits-
und Architektur-/Privacypruefungen. Erst ihre Chief-Synthese bindet ein
exaktes Daten-/Admission-/Rechte-Arbeitspaket. Dieses Dokument nimmt keine
konkrete Quelle auf und erteilt keine Provider-,
Download-, Streaming-, Generierungs-, Live- oder Releasebefugnis.

P1-L/T/S sind im Commit `29941c2` YELLOW beendet. Die Chief-Synthese bindet
ihre Findings in `docs/tasks/WRN-G3-021-P2-DATA-ADMISSION-RIGHTS.md`.
Produkt-, Test-, Fixture-, Browser- und Assetwrites bleiben bis zu einem
frischen unabhaengigen Sol-P1-R-GREEN gesperrt.

P2 ist im Produktkandidaten
`c096d7d6ccfdb8bc08225c757bcf8cb86e101517` nach finalem unabhängigem
Architekturabschluss technisch GREEN. Die anschließende PO-Fortsetzung
erlaubt ausschließlich die sichere P3-P0-Vorbereitung. Drei read-only
Prüfungen binden ihre Findings im Vertrag
`docs/tasks/WRN-G3-021-P3-PLAYER-LIFECYCLE-UI-CONTRACT.md`. P3-A bleibt bis
zum separaten Vertragscommit, frischem Sol-Recheck-GREEN und eigenem
Writergate ohne Produktrecht. P4-B/UI bleibt bis P3-A-GREEN gesperrt.

Der erste Sol-P3-P0-R1-Vertragsrecheck ist RED mit zwei Privacy-Mediums:
Aktivitätszeitpunkt im Resume-Schema sowie unvollständige automatische
Expiry-/Revocation-/Mismatch-Bereinigung. Der enge R1-Nachtrag entfernt das
Zeitfeld und bindet den race-sicheren `deleteIfExact`-Pfad samt vollständiger
Matrix 17/22. P3-A bleibt bis frischem Recheck-GREEN gesperrt.

Der frische unabhängige Sol/high-P3-P0-R2-Abschlussrecheck auf Basis
`2d4c62963e20576b4e3455303e0d2036ba15a445` ist mit null Findings in allen
Klassen GREEN. Er schließt beide Privacy-Mediums und ihre Coverage-
Auswirkung. Die P3-P0-Vertragsvorbereitung ist damit abgeschlossen, startet
aber keinen Produktwriter. P3-A benötigt weiterhin das ausdrückliche
PO-Startgate `START WRN-G3-021-P3-A` und anschließend einen separaten Chief-
Writergatecommit. P4-B/UI und alle OUT-/externen Bereiche bleiben gesperrt.

Der Product Owner startet P3-A am 7. September 2026 mit exakt
`START WRN-G3-021-P3-A` als PO-101. Der Chief bindet den separaten
Zehn-Pfad-Vertrag `docs/tasks/WRN-G3-021-P3-A-WRITER-GATE.md`. Erst nach
dessen eigenem Commit darf genau ein frischer Terra/high-Frontendwriter ohne
Kinder und Git-Index headless Media-Hub, Player/Lifecycle, Resume-Store,
Units und echte Chrome-/IndexedDB-Belege umsetzen. P4-B/UI und OUT/extern
bleiben gesperrt.

Der erste P3-A-Writer stoppt korrekt fail-closed: Der WIP bleibt unstaged in
exakt zehn erlaubten Pfaden; unter Node 24.19 sind nur Mobile-Typecheck, vier
Unit-Smokes und ein Chromium-Import-Smoke GREEN. Der unabhängige read-only
WIP-Review meldet sieben Mediums und null High/Low zu Laufidentität, Loader-/
Timeout-/URL-Races, Automaten/Late-events, Resume-DB, CAS-Readback, Resume-
Orchestrierung und Pflichtmatrix. Die enge sequenzielle Fortsetzung ist in
`docs/tasks/WRN-G3-021-P3-A-R1-WRITER-CONTINUATION.md` gebunden. Erst nach
separatem Commit darf genau ein frischer Ersatzwriter ohne Kinder und
Git-Index denselben Zehn-Pfad-WIP fortsetzen. P4-B/UI und OUT/extern bleiben
gesperrt.

Der R1-Ersatzwriter erreicht unter exakt Node 24.19 12/12 fokussierte Units
und 4/4 echte Chromium-/IndexedDB-/Request-Fälle und schließt fünf der sieben
Mediumgruppen produktseitig. Er stoppt weiterhin fail-closed mit zwei
Rest-Mediums: vollständige Hub-/Resume-Orchestrierung und vollständige Matrix
1 bis 23. Der Chief bindet die finale sequenzielle Fortsetzung in
`docs/tasks/WRN-G3-021-P3-A-R2-FINAL-WRITER-CONTINUATION.md`. Nach separatem
Commit darf genau ein frischer Ersatzwriter ohne Kinder und Git-Index nur den
gleichen Zehn-Pfad-WIP abschließen. P4-B/UI und OUT/extern bleiben gesperrt.

Der R2-Ersatzwriter ergänzt die Resume-Orchestrierung und bestätigt unter
exakt Node 24.19 sieben Typechecks, 21/21 Units, 6/6 echte Chromium-/IDB-/
Request-Fälle und zwölf Schutz-Hashes. Zwei Matrix-Mediums bleiben offen.
Der Chief bindet deshalb
`docs/tasks/WRN-G3-021-P3-A-R3-MATRIX-COMPLETION.md` für die vollständige
Lifecycle-, Fault-, Cap-, Future-/Corrupt-, CAS-/Clear- und Late-sink-Matrix
sowie alle Hauptläufe. Nach separatem Commit darf genau ein frischer Writer
ohne Kinder und Git-Index nur dieselben zehn Pfade beenden. P4-B/UI und OUT/
extern bleiben gesperrt.

## Bestandsbefund

- Im neuen Produkt bestehen nur Mediennavigation, Sprachtexte und ein
  ehrlicher Placeholder; ein Media-/Podcastmanifest und Player fehlen.
- Manifestvalidierung, atomare Aktivierung, Offlineadapter, A/B/A,
  Revocation und neun UI-Sprachen liefern wiederverwendbare Muster.
- Die vorhandenen Artikel-/Markenrechte ersetzen keine elementweisen Audio-,
  Thumbnail- oder Transkriptrechte.
- PO-092 beschreibt nur ein spaeteres Aufnahmemodell. Keine reale Quelle ist
  fuer G3-021 bereits zugelassen.

## Ziel und Nutzervertrag

Die App praesentiert zugelassene Audio-/Podcastangebote uebersichtlich,
aktualisierbar und ohne Autoplay. Externe Inhalte laden erst nach
Nutzeraktion und, wenn erforderlich, explizitem Consent. Playerzustand,
Offlinefaehigkeit, Aktualitaet, Rechte und Fehler werden ehrlich dargestellt.
Es gibt kein dauerhaftes Hoerprofil und keine versteckten Drittanbieter-
Requests.

## Additive Zielarchitektur

Die genaue Schemafassung wird erst im Startprozess final gebunden. Vorgesehen
sind getrennte, versionierte Vertraege:

- `media-manifest-v1`: stabile Media-/Episode-ID, Typ, Publisher, Titel,
  Revision, Stream-/Dateireferenz, MIME, Dauer, Bytes, Hash und Ablauf,
- `media-admission-v1`: stabile Quellen-ID, Selbstbeschreibung versus
  redaktionelle Einordnung, Alias/Nachfolge, Region/Sprache, Health und
  erlaubte Auslieferungsart,
- `media-rights-v1`: elementweise Rechte fuer Audio, Thumbnail und
  Transkript einschliesslich Lizenz, Attribution, Territorium, Offline-/
  Cache-Erlaubnis, Ablauf und Korrekturkontakt,
- `media-consent-v1`: Click-to-load, Origin-Allowlist, Datenumfang,
  Widerruf und nachweisbarer No-Tracking-Default,
- `media-lifecycle-v1`: idle, loading, playing, paused, ended, error,
  offline und blocked sowie deterministischer lokaler Resumezustand,
- `media-revocation-v1`: monotones `blocked`, `gone` oder `replaced`, das
  aeltere Revisionen, lokale Kopien, Caches und Rollbacks ueberstimmt.

Die Vertraege werden nicht still in das bestehende Artikelmanifest oder den
Shared Reader v1 eingebaut. Remoteauthentizitaet benoetigt eine verifizierbare
Signatur- oder gleichwertige Vertrauensgrenze. Aktivierung ist atomar;
Fehler behalten nur dann Last-known-good, wenn keine Revocation vorliegt.

## Player-, Offline- und Privacygrenzen

- kein Autoplay; Laden/Abspielen nur nach sichtbarer Nutzeraktion,
- keine persoenlichen IDs, Hoerhistorie, Telemetrie oder Inhaltslogs,
- Resume ausschliesslich lokal, minimal und explizit loeschbar,
- Offlinekopie nur bei ausdruecklichem Download-/Cacherecht,
- sichere MIME-, Origin-, CSP-, Range-, Groessen- und Timeoutgrenzen,
- externe Medien standardmaessig als Referenz statt als Kopie,
- Cache-Purge bei Revocation/Takedown; Future-Schema fail-closed/read-only,
- keine Remoteprovider oder Netzrequests in lokalen G3-021-Fixtures.

## Kostenvertrag

Vor einem spaeteren Providergate muessen Requests, Egress, Storage,
Transcoding und eventuelle Generierung getrennt messbar und hart gedeckelt
sein. Der lokale Basisslice bleibt provider- und kostenneutral. Generierte
Podcasts sind bis zu einem eigenen PO-, Rechte-, Datenschutz-, Transparenz-
und Securitygate deaktiviert.

## Sprach-, UI- und A11y-Vertrag

Hub-, Consent-, Player-, Offline-, Rechte-, Fehler- und Leerzustand erhalten
Texte in allen neun vorhandenen UI-Sprachen. Englisch bleibt Erststart, die
gueltige UI-Sprachauswahl lokal persistent. Bedienung muss Tastatur,
Screenreader, Fokus, 44-Pixel-Ziele, vier Themes, gebundene Viewports und
200-Prozent-Reflow abdecken. App und Website bleiben getrennt; Website-Player
und Shared Reader v1 sind OUT.

## Spaetere Testmatrix

- Manifest, Signatur/Vertrauen, Hash, Revision, atomarer Abbruch, Required/
  Optional und Future-Schema,
- Admission, Alias/Nachfolge und getrennte Selbst-/Redaktionseinordnung,
- Rechte je Audio, Thumbnail und Transkript sowie Ablauf/Takedown,
- Consent, Click-to-load, Widerruf und null Drittanbieterrequest vor Aktion,
- Player-Lifecycle, Fokus, Resume, Neustart und Loeschung,
- Timeout, MIME, Range, Origin/CSP, Groessenlimit und blockierte Medien,
- Offline, Last-known-good, Update, A/B/A, Rollback, Revocation und Cache-
  Purge,
- neun Sprachen, Axe, Tastatur, Touchziele, Themes, Viewports und
  200-Prozent-Reflow,
- keine Logs/Identifier und keine Providernebenwirkung,
- messbare Nullkosten im lokalen Slice und harte Caps in spaeteren Gates,
- getrennte Mobile-/Website-Erwartungen mit erwarteten Website-Skips.

## Harte OUT-Grenzen

Recherche, Feedabrufe, Admission, Scraping, Hotlinking, Assetkopien,
Transcoding, Generierung, neue Dependencies/Provider/Kosten, Websiteprodukt,
Hosting/Live, Android/AAB/Play, Signierung, Upload, Deployment und Release
bleiben gesperrt.

END-CHECK: :)
