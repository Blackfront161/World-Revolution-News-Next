# Task Brief – WRN-G3-012 Immutable Content Revision Consumer

## Identitaet

- Task-ID: `WRN-G3-012`
- Titel: Releasefoermige lokale Inhaltsrevision fuer App und Website
- Phase/Welle: G3 / Abschluss der Voraussetzung vor dem eigentlichen
  Wave-4-Offline-/Update-Slice
- Paritaetsbezug: `NEWS-01/02/03/09/10`, `SYS-03/04/08`, `WEB-01/02/03`
- Risikobezug: `R-05`, `R-06`, `R-17`, `R-22`, `R-27`, `R-32`, `R-33`,
  `R-41`
- Auftraggeber: Product Owner
- Vorbereitung: Chief AI Architect mit read-only Explorer und
  Security/Privacy Reviewer
- Spaetere Implementierungssequenz nach separatem Start:
  `backend_data_reliability_engineer`, danach `frontend_brand_engineer`,
  danach `qa_release_engineer`; optional abschliessend read-only
  `independent_architecture_reviewer`
- Status: **AM 27. AUGUST 2026 TECHNISCH GREEN UND VISUELL AKZEPTIERT**
- Dokumentarischer Vorbereitungscheckpoint: `879d0b2`
- Einziges Implementierungsgate: `START WRN-G3-012`
- Startgate: vom Product Owner am 27. August 2026 exakt erteilt; Frontend und
  QA bleiben bis zum jeweils gesicherten vorherigen Handoff gesperrt
- Startcheckpoint: `341e46d`
- Backend/Data-Produktcheckpoint: `171b3ba`; Evidenz/Handoff `63cbc10`;
  GREEN abgeschlossen und Agent beendet
- Frontend-/Publisher-Produktkandidat: `c99fa2b`; Evidenz/Handoff `eb8fc78`;
  GREEN abgeschlossen und Agent beendet
- Nach dem Frontend-Handoff pruefte genau ein frischer `qa_release_engineer`
  den unveraenderten Kandidaten und schrieb nur QA-Evidenz/Handoff
- Unabhaengige QA `012d6a2`: GREEN mit 0 Findings, 133 Tests,
  19 Boundarytests, beiden Builds, Releaseboundary, 61 Browser-PASS,
  21 PNGs und 19 Runtimefaellen; Agent beendet
- Letztes technisches Gate vor sichtbarer PO-Entscheidung: frischer
  `independent_architecture_reviewer` read-only, nur Bericht/Handoff
- Architekturreview `aec0d82`: RED mit Medium `WRN-G3-012-M-001`. Beide
  Adapter laden Manifest und Payloads bereits vor vollstaendiger Descriptor-/
  Manifestfreigabe. Kein falscher Inhalt wird aktiviert, aber die gebundene
  Null-Payloadrequest-Grenze und sichere G3-013-Stagingvoraussetzung sind
  verletzt.
- PO-062: Der Product Owner erteilte am 27. August 2026 exakt
  `G3-012 M-001 BEHEBEN`. Freigegeben sind ausschliesslich eine zweistufige
  Descriptor-/Manifestvorpruefung beider Adapter und Requestzaehler-
  Regressionen. Danach sind frischer read-only Bypassreview, vollstaendige
  unabhaengige Re-QA und erneuter kurzer read-only Architekturreview Pflicht.
  Bei Finding wird gestoppt.
- PO-062-Korrekturstartcheckpoint: `3ac2251`
- PO-062-Produkt-/Testkandidat `1520c05`; Evidenz/Handoff `18018ce`;
  frischer read-only Bypassreview GREEN mit 0 Findings
- vollstaendige unabhaengige PO-062-Re-QA `f122555`: GREEN mit 0 Findings;
  letzter Architektur-Recheck `ac48f86`: GREEN mit 0 Findings; alle Agenten
  beendet
- sichtbare Product-Owner-Abnahme: am 27. August 2026 mit exakt
  `G3-012 VISUELL AKZEPTIERT`; G3-012 geschlossen
- die gleichzeitig genannte Header-Sprachwahl ist ein separater Folgeslice
  und aendert diesen abgeschlossenen Scope nicht

## Produktziel in einfacher Sprache

App und Website sollen ihre lokale Nachrichtenrevision so lesen, wie spaeter
ein echtes, reproduzierbares Release gelesen wird. Die sichtbaren Inhalte
bleiben vorerst selbst erstellte Testinhalte. Neu ist die saubere technische
Grenze: Produktclients und Website-Publisher duerfen nicht mehr zur Laufzeit
oder im normalen Releasebuild direkt aus `@wrn/test-support` lesen.

Beide Clients lesen dieselbe explizit gepinnte lokale Revision, pruefen
Manifest, Kompatibilitaet, Ressourcen, Hashes und ID-Mengen vollstaendig und
zeigen erst danach atomar `ready`. Bei Fehlern wird niemals still auf
Testdaten, eine alte Mischrevision oder eine externe Quelle ausgewichen.

## Warum dieser Slice jetzt notwendig ist

G3-002 bis G3-011 haben Produktverhalten mit vollstaendig lokalen,
deterministischen Fixtures aufgebaut. Das war absichtlich sicher und
kostenlos. Die beiden Produktclients deklarieren und importieren jedoch noch
`@wrn/test-support`. Ausserdem liest der statische Website-Publisher direkt aus
`packages/test-support/src/index.ts`. Der vorhandene Release-Grenzcheck
verbietet die Clientkopplung zwar im Release-Modus, prueft den Publisherpfad
aber noch nicht.

Ein Offlinecache in G3-013 wuerde diese Previewkopplung sonst nur dauerhaft
speichern. Deshalb wird zuerst die releasefoermige, rein lesende
Runtimegrenze hergestellt.

## Verbindliche Ausgangslage

- akzeptierter G3-011-Abschluss: Kandidat `d19ce4d`, GREEN-Re-QA `f1ebf70`,
  Vollrecheck `1b344b6`, Registerabschluss `695b1c0`, sichtbare Abnahme
  `6e5dd20`;
- vorhandener Manifest-v1-Vertrag in `packages/content-contracts` bleibt die
  einzige Vertragsquelle und wird nicht neu erfunden;
- G3-002-Revision, Discover-Index, Readerdetails, G3-008-Lifecycle und
  G3-007-Websitepublikation sind selbst erstellte lokale Testartefakte;
- `apps/mobile/src/App.tsx` und `apps/website/src/App.tsx` importieren Feed,
  Discover, Reader und Lifecycle indirekt oder direkt aus
  `@wrn/test-support`;
- `apps/website/tools/generate-static-article-landings.mjs` importiert
  Testdaten direkt aus dem Quellpfad von `packages/test-support`;
- `tools/check-local-preview-boundary.mjs` prueft bisher nur die Client-
  Quellverzeichnisse und nicht alle Build-/Publisherpfade;
- die aktuelle App, aktuelle Website, ihre Repositories, echten Daten und
  Liveinfrastruktur bleiben strikt read-only.

## Verbindlicher Zielschnitt

```text
selbst erstellte lokale Quellfixture
            |
            | nur separate deterministische Vorbereitung
            v
gepinntes lokales Content-Release
  - erwartete Revision
  - kanonischer Manifest-SHA-256
  - feste Ressourcen-Allowlist
  - Feed/Discover/Reader/Lifecycle/Publikation
            |
            +--------------------------+
            |                          |
            v                          v
 Mobile Runtime Consumer      Website Runtime Consumer
 eigener Adapter              eigener Adapter + Publisher
            |                          |
            +-------- gleiche ---------+
                   Revision/IDs
```

`@wrn/test-support` darf Fixtures und Testbuilder bereitstellen, ist aber
keine Produkt-, Runtime-, Publisher- oder normale Releasebuild-Datenquelle.

## Funktionaler Scope nach spaeterem `START`

### 1. Vorhandenen Vertrag wiederverwenden

- `LocalManifestV1`, Ressourcenklassen, Compatibility, ID-Mengen und
  Integritaetspruefungen bleiben semantisch unveraendert.
- Keine zweite Manifestversion, kein paralleles Client-Schema und kein
  duplizierter Validator.
- Die fixture-spezifischen Werte wie `wrn-test-*`, `.invalid`,
  `local-fixture://` und `self-authored-local-fixture` bleiben ehrlich als
  lokale Testprovenienz sichtbar. G3-012 behauptet keine Produktivdatenreife.

### 2. Vollstaendiges atomisches lokales Release

Die Runtimegrenze umfasst gemeinsam:

- Manifest und Feedartikel;
- Discover-Index;
- Readerdetails;
- Archiv-/Alias-/Gone-/Revocation-Lifecycle;
- die fuer statische Website-Landingpages benoetigte Publikationsprojektion.

Nur den Feed umzustellen waere unvollstaendig und darf nicht als bestanden
gemeldet werden. Kein Teil darf aus einem anderen Revisionsstand stammen.

### 3. Root of Trust

- Der Clientrelease pinnt mindestens die erwartete Contentrevision und den
  kanonischen SHA-256 des Manifests in einem vom geladenen Manifest getrennten
  Release-Descriptor oder einer gleichwertigen unveraenderlichen Grenze.
- Ein gemeinsam ausgetauschtes Manifest plus Payload darf nicht allein durch
  selbst beschriebene Hashes als vertrauenswuerdig gelten.
- Signatur, Attestation und produktive Gatewayprovenienz bleiben spaetere
  G5-/Releasegates; G3-012 verwendet nur selbst erstellte lokale Daten.

### 4. Sichere lokale Lesegrenze

- Ressourcen werden nur ueber eine feste Resource-ID-zu-Pfad-Allowlist
  aufgeloest. Manifestwerte duerfen keine beliebigen URLs bestimmen.
- Erlaubt sind nur kontrollierte same-origin JSON-Pfade unter einem festen
  lokalen Basispfad; keine Credentials, Querystrings, Fragmente,
  Verzeichniswechsel oder externe Origins.
- Redirects werden abgelehnt. Requests verwenden keine Cookies, Credentials
  oder Referrer und schreiben keinen Browsercache.
- MIME-Typ, Timeout/Abort und ein separates Transportgroessenlimit werden vor
  unbeschraenkter Verarbeitung geprueft. `resource.bytes` bleibt die
  kanonische Inhaltspruefung und ersetzt den Transport-Hardcap nicht.
- `optional-absent` erzeugt exakt null Requests.
- Unbekannte Ressourcen werden vor jedem Request fail-closed abgewiesen.

### 5. Atomare Aktivierung und ehrliche Zustaende

- Reihenfolge: Manifeststruktur, Compatibility, erwartete Revision,
  gepinnter Manifesthash, erlaubte Ressourcen, alle Payloads, Hashes,
  Byte-/Recordzahlen, ID-Mengen, Discover, Reader, Lifecycle und Publikation.
- Erst nach vollstaendiger erfolgreicher Pruefung entsteht genau ein
  `ready`-Zustand.
- Es gibt keinen partiellen Feed, keine Mischrevision und keinen stillen
  Fixturefallback.
- Bestehende sichtbare Zustaende werden weiterverwendet: `loading`, `ready`,
  `empty`, `optional-absent`, `offline` und sicherer `error`.
- Fehlertexte nennen nur sichere Kategorien und geben weder Payloads,
  interne Pfade noch Original-URLs in Logs aus.
- Abbruch oder Unmount stoppt offene Lesevorgaenge und darf keinen spaeten
  `ready`-Zustand ausloesen.

### 6. Release- und Paketgrenzen

- `@wrn/test-support` wird aus Runtime-Dependencies beider Apps entfernt.
- Produktquellen, normale Build-/Publisherwerkzeuge und finale App-/Website-
  Artefakte enthalten weder Imports noch eingebettete Modulpfade aus
  `@wrn/test-support` oder `packages/test-support/**`.
- Testdateien und klar getrennte lokale Fixturevorbereitung duerfen
  `@wrn/test-support` als Developmentquelle nutzen, werden aber nicht Teil des
  normalen Releasebuilds oder finalen Artefakts.
- Der Website-Landingpage-Generator konsumiert dieselbe gepinnte
  Releasequelle wie die Website-Runtime, nicht die Test-Support-Quelle.
- `check:release-boundaries` scannt direkte und indirekte Client-, Tool-,
  Publisher- und finale Artefaktkopplungen.
- Mobile und Website bleiben getrennt build-, liefer- und rollbackfaehig und
  importieren einander nicht.

## No-Side-Effect-, Datenschutz- und Kostengrenzen

Der Consumer darf nicht:

- `localStorage`, `sessionStorage`, IndexedDB oder Cache Storage beschreiben;
- Service Worker registrieren oder veraendern;
- Cookies, Analytics, Beacon, Telemetrie oder externe Requests erzeugen;
- Theme-, Navigations- oder G3-011-Lesedaten veraendern;
- Payloads, Original-URLs oder Artikeltexte in Konsolen-/Diagnoselogs ausgeben;
- einen Cloud-, KI-, Uebersetzungs-, Medien- oder sonstigen Provider aufrufen.

Runtime-, API- und KI-Kosten dieses Slices: **0 CHF**.

## Erlaubte Pfade nach spaeterem `START`

- `packages/content-contracts/**`: nur additive Consumer-/Validierungshelfer,
  keine Manifest-v1-Semantikaenderung;
- `packages/domain/**`: reine Zustandsprojektion ohne HTTP, DOM oder Storage;
- `packages/test-support/**`: nur Testbuilder und getrennte lokale
  Fixturevorbereitung, keine Runtimefreigabe;
- `apps/mobile/**`: eigener lokaler Runtimeadapter, Release-Descriptor,
  Zustandsprojektion und enge Tests;
- `apps/website/**`: eigener Runtimeadapter, Release-Descriptor,
  Website-Publisher und enge Tests;
- `tools/**`: Boundary-, Artefakt-, Provenienz- und No-Side-Effect-Pruefungen;
- `tests/e2e/**` und zu G3-012 gehoerende `docs/**`-Evidenz.

Neue externe Dependencies, `services/**`, `infrastructure/**` oder andere
Rootkonfiguration benoetigen ein neues sichtbares Gate. Eine unvermeidbare
Workspaceanpassung innerhalb des beschriebenen lokalen Scopes muss der erste
Implementierungsagent vor der Aenderung im Handoff begruenden.

## Ausdruecklich ausgeschlossen

- echte Nachrichten, echte Medien, echte Nutzerdaten oder die 935 Legacy-IDs;
- produktives Contentrepository, Content Gateway, Cloudflare oder Hostinger;
- Live-HTTP, Remote/CI, Deployment, Signierung, Upload oder Veroeffentlichung;
- Service Worker, Cache Storage, IndexedDB, Offlinevolltexte/-bilder,
  letzte-valide Revision, Teilupdate, Cachemigration oder Rollback; dies ist
  ein eigener spaeterer G3-013-Slice;
- produktive Apache-/CSP- oder Capacitor-/Android-Originfreigabe;
- neue Hilfe-, Medien-, Termin-, Wissens-, Uebersetzungs-, Push-, Feedback-,
  Podcast-, Map- oder Spielfunktion;
- allgemeines Redesign, neue Navigation, neue Themes, Fonts oder Assets;
- Manifest-v1-Schemaaenderung, produktive Signatur oder Attestation.

## Akzeptanzkriterien

1. Beide Apps besitzen keine Runtime-/Produktdependency und keinen
   Produktquellimport auf `@wrn/test-support`.
2. Website-Publisher und normale Buildwerkzeuge besitzen keinen direkten oder
   indirekten Import aus `packages/test-support/**`.
3. Finale `dist`-/Websitepakete enthalten keine Test-Support-Modulpfade oder
   versehentlich eingebettete zweite Datenquelle.
4. Mobile Runtime, Website Runtime und Website-Publisher binden dieselbe
   erwartete Revision, denselben Manifesthash und konsistente ID-Mengen.
5. Feed, Discover, Reader, Lifecycle und Publikation werden als ein
   vollstaendig validiertes Bundle aktiviert; kein partieller `ready`-Zustand.
6. Falsche Version, Revision, Manifesthash, Payloadhash, Byte-/Recordzahl,
   ID-Menge, MIME, Redirect, Uebergroesse, defektes JSON, 404, Timeout,
   Offlinezustand und Abbruch enden deterministisch und fail-closed.
7. `optional-absent` und unbekannte Resource-IDs erzeugen null Requests.
8. Erlaubte Requests bleiben same-origin und nutzen keine Credentials,
   Cookies, Referrer oder Redirects; externe Requests bleiben null.
9. Theme- und G3-011-Lesedaten bleiben vor und nach allen Erfolgs-/Fehlerfaellen
   bytegleich; Storage, Cache und Service-Worker-Registrierungen bleiben null.
10. Alle bestehenden G3-002-bis-G3-011-Funktionen und akzeptierten Mobile-/
    Websitekompositionen bleiben funktional und visuell unveraendert.
11. `check:release-boundaries`, Importgrenzen, Format, Lint, Typechecks,
    Unit-/Contract-/Komponententests, Boundarytests, beide Builds und der volle
    Browser-E2E-Lauf sind GREEN.
12. Eine unabhaengige QA meldet null Blocker, Highs, Mediums oder Lows. Erst
    danach wird der unveraenderte Kandidat dem Product Owner visuell vorgelegt.

## Visuelle Abnahme

G3-012 ist primär eine Daten- und Releasegrenze, aber der Product Owner muss
belegen koennen, dass die sichtbare App nicht unbemerkt veraendert wurde.
Deshalb werden mindestens folgende commitgebundene Belege erzeugt:

- Mobile 390x844: Dunkel/ready, Pink/ready, offline, Integritaetsfehler;
- Mobile 600x960: Hell/ready;
- Website 390x844: Dunkel/ready, Pink/ready, offline, Integritaetsfehler;
- Website 800x1280 und 1440x900: Hell/ready;
- je Client ein beschrifteter Zustandskontaktbogen fuer loading, empty,
  optional-absent, offline, error und ready;
- ein maschinenlesbarer Runtimebeleg mit Revision, Manifesthash, Artikel-IDs,
  Requestliste, Storage/Cookies/Cache/SW und Konsolenfehlern;
- Vergleich gegen den akzeptierten G3-011-Kandidaten, ohne allgemeines
  Redesign oder Snapshot-Neubaseline als Abkuerzung.

## Agentensequenz nach `START WRN-G3-012`

1. Genau ein `backend_data_reliability_engineer` implementiert zuerst
   Release-Descriptor, Consumer-/Fehlervertrag, deterministische lokale
   Releasebereitstellung und Contract-/Boundarytests. Er veraendert keine UI.
2. Nach GREEN-Checkpoint und Handoff wird dieser Agent beendet.
3. Genau ein frischer `frontend_brand_engineer` implementiert getrennte
   Mobile-/Websiteadapter, stellt den Website-Publisher um und bewahrt die
   akzeptierten Oberflaechen.
4. Nach Kandidatencheckpoint und Handoff wird der Frontend-Agent beendet.
5. Genau ein frischer `qa_release_engineer` prueft den unveraenderten
   Kandidaten unabhaengig mit der gesamten G3-012- und Regressionsmatrix.
6. Bei Finding wird gestoppt. Eine Korrektur braucht eine sichtbare, eng
   begrenzte Product-Owner-Freigabe und danach frische Re-QA.
7. Bei GREEN kann ein kurzer read-only `independent_architecture_reviewer`
   Package-, Publisher- und G3-013-Cachegrenzen kontrollieren.

Parallele Schreibarbeit an Contracts, Clients, Publisher oder Boundaries ist
verboten. Technisches GREEN ersetzt keine sichtbare Product-Owner-Abnahme.

## Was bewusst fuer spaeter offen bleibt

1. `WRN-G3-014`: getrennte Offline-/Cache-/Update-/Rollbackketten,
   letzte-valide Revision, Teilupdate, Storage-full und Tombstone-Purge. Der
   zuvor reservierte G3-013-Slot wurde nach PO-064 fuer die priorisierte
   Header-UI-Sprachwahl verwendet.
2. Apache/CSP- und Capacitor-/Android-Origin-Smokes.
3. echte Content-, Rechte-, Provenienz- und 935-ID-Migration.
4. produktiver SEO-/Sitemap-/Landingpage-Publisher.
5. authentisierte Manifestprovenienz, Signatur oder Attestation vor G5.
6. reproduzierbare Website-/AAB-Releaseartefakte sowie Remote-/CI-/Releasegate.

## Startwortlaut

Diese Vorbereitung erlaubt keine Implementierung. Das einzige Startgate ist:

```text
START WRN-G3-012
```

END-CHECK: :)
