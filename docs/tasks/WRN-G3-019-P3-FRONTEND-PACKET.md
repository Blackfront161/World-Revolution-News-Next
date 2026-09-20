# WRN-G3-019 – P3 Mobile Reader-v2 Frontendpaket

Status: **READ-ONLY VORBEREITET; WRITER BIS P2-R4-GREEN GESPERRT**

## Ziel und unveränderliche Grenze

P3 integriert den optionalen, snapshotgebundenen Reader-v2-Sidecar in den
bestehenden Mobile-Reader. Reader v1 bleibt alleinige Originaltext-,
Navigations-, Save-, Offline- und Fallbackquelle. Fehlt der Sidecar oder ist
irgendeine Bindung ungültig, bleibt die bestehende v1-Darstellung vollständig
funktional und sichtbar.

Website, Shared Reader v1, Domain-Reader, Reading-State-Schema,
Content-Offlinecontroller/-store, echte Quellen/Medien, Remoteprovider,
Dependencies, Hosting/Live, Android/AAB/Play und Release bleiben OUT.

## Startbedingungen

Der P3-Writer darf erst starten, wenn alle folgenden Bedingungen durch den
Chief dokumentiert sind:

1. P2-R4-Testwriter beendet und Rechte zurückgegeben;
2. vollständige R4-Negativmatrix GREEN;
3. frischer unabhängiger R4-Recheck GREEN;
4. P2-FINAL-M-001 geschlossen;
5. genau ein `frontend_brand_engineer` Terra/high erhält die Allowlist.

Dieser vorbereitete Brief selbst erteilt noch kein Schreibrecht.

## Produktverhalten

### Laden und Fallback

- Eine reine Helperfunktion leitet die vollständige Reader-v2-
  Snapshotidentität ausschließlich aus demselben bereits validierten
  `LocalContentReleaseReadyV1` ab:
  - `releaseRevision = ready.descriptor.releaseRevision`;
  - `manifestSha256 = ready.manifestSha256`;
  - `readerDetailsRevision = ready.readerDetails.revision`;
  - `readerDetailsWholeDocumentSha256 =
    ready.descriptor.expectedComponents.readerDetails.sha256`;
  - `readerDetailsIntegritySha256 = ready.readerDetails.integritySha256`.
- Fixture- und Produktmodus behalten genau diesen validierten Ready-Wert und
  benutzen dieselbe Ableitung. Kein UI-, Query-, Storage- oder Sidecarwert
  darf ein Snapshotfeld liefern.
- Mobile startet genau einen abbrechbaren Reader-v2-Ladeversuch pro
  vollständiger kanonischer Fünffeldidentität und Komponenten-Mount, erst nach
  erfolgreicher v1-Releasevalidierung und nur bei exakter Übereinstimmung mit
  dem buildgebundenen Pin. Ein unveränderter Snapshot erzeugt innerhalb
  desselben Mounts keinen zweiten Versuch; ein StrictMode-Remount ist ein
  neuer Mount, darf aber keine Antwort des beendeten Mounts übernehmen.
- Derselbe Effect besitzt den `AbortController`, setzt vor einem neuen Versuch
  synchron `loading` ohne alte Sidecardaten, ignoriert jedes Ergebnis nach
  Cleanup und verwirft A nach einem Wechsel zu B auch bei einer späten
  A-Antwort. v1 rendert bereits während `loading` vollständig weiter.
- Zustände `loading`, `ready`, `fallback` bleiben flüchtig. Kein Retry,
  Storage, Cookie, Telemetrie, Log, zusätzlicher Historyeintrag oder
  Providerrequest.
- Sidecarfehler blockieren, ersetzen oder verzögern den lesbaren v1-Reader
  nicht. Bei Release-, Snapshot- oder Unmountwechsel wird laufende Arbeit
  abgebrochen und die alte v2-Projektion verworfen.
- Pflichtregressionen: unveränderter Snapshot ohne zweiten Request,
  StrictMode-Cleanup/Remount, A/B/A, späte A-Antwort nach B, Unmount,
  invalid/future Sidecar und fehlender Pin. Jeder Pfad behält v1 sichtbar.

### Struktur und Originalerhalt

- Eine kleine reine UI-Projektion ordnet validierte v2-Abschnitte ausschließlich
  den bereits validierten v1-Blöcken zu; sie dupliziert oder verändert keinen
  autoritativen Text.
- `original` und `structured` zeigen alle referenzierten v1-Blöcke in
  Originalreihenfolge. `ambiguous` zeigt zusätzlich eine ehrliche sichtbare
  Kennzeichnung. `rejected`, unbekannt oder inkonsistent fällt vollständig
  auf die heutige v1-Blockdarstellung zurück.
- React-Keys verwenden `sectionId:blockId:absoluteV1Index`. Der absolute Index
  stammt ausschließlich aus der bereits hashvalidierten Blockreferenz und ist
  keine Text- oder Positionserkennungsheuristik.
- Ein Vorgaengerseparator erscheint nur aus der bereits validierten expliziten
  Relation vor dem gebundenen Block. Er löscht, versteckt oder gruppiert
  keinen Originalblock.

### Quellenprofil

- Die bestehende kompakte Quellenzeile bleibt sichtbar.
- Ein natives `<details><summary>` zeigt das lokale Quellenprofil kompakt und
  barrierearm: Selbstbeschreibung und redaktionelle Einordnung sind visuell
  getrennt; Typ, Regionen, Sprachen und Freshness sind beschriftet.
- Der autoritative Original-Link bleibt ausschließlich der bestehende v1-Link
  mit dem vorhandenen Bestätigungsdialog, `noopener` und `no-referrer`.
- Der optionale Korrekturkontakt ist nur beschrifteter Text, kein neuer Link,
  Formular-, Mail-, Netzwerk- oder Trackingpfad.

### Medien

- Medien dürfen ausschließlich über `resolveMobileReaderV2LocalAsset(...)`
  und den bereits geladenen Safetyzustand dargestellt werden.
- `media: []` bedeutet ausdrücklich: kein Medienslot und kein Bildplaceholder.
  Das Frontend darf ohne validiertes Mediaobjekt keine redaktionelle Position
  oder Leerstelle erfinden.
- Nur ein vorhandenes, vollständig validiertes und an `sectionId`/`blockId`
  gebundenes Mediaobjekt besitzt eine semantische Position. Ergibt dessen
  Resolver `null`, protected, unavailable, revoked oder eine
  Metadatenabweichung, erscheint genau an diesem Anker ein neutraler lokaler
  Placeholder und der Text bleibt lesbar. Kein Remoteabruf, Hotlink oder
  Object-URL.

### Abschnittsübersetzung

- Originaltext und Originalsprache bleiben jederzeit sichtbar.
- Die kleinste Übersetzungseinheit ist exakt eine validierte
  `blockReference`, nicht eine frei aggregierte Section. Jede Referenz besitzt
  ihren eigenen Status und Resultat-Key mit ihrem vorhandenen
  `sourceFragmentSha256`. Eine Section mit mehreren Referenzen erhält je
  Referenz eine getrennte bewusste Aktion; kein erster Hash repräsentiert die
  ganze Section und es werden keine Aggregathashes erfunden.
- Der Eingabetext wird deterministisch und verlustfrei aus genau den
  referenzierten validierten v1-Blöcken serialisiert: Paragraph/Heading nutzen
  ihren Text, Quote Text plus vorhandene Attribution in einer getrennten
  Zeile, Listen ihre Items in Originalreihenfolge je Zeile; Blöcke werden
  durch zwei Newlines getrennt. Das Original-DOM bleibt separat unverändert.
- Die Aktion richtet sich an die aktuell gewählte UI-Sprache und erzeugt
  keinen Historyeintrag. Sichtbar bleiben Originalsprache, Zielsprache und bei
  einem Ergebnis die lokale Adapter-ID/-Version als Provenienz.
- Der Produktionsdefault bleibt deaktiviert und kostenfrei. Ohne explizit
  injizierten lokalen Fixtureadapter zeigt die UI ehrlich `disabled`; sie
  behauptet keine Übersetzung.
- Ein lokaler Adapter darf nur in gezielten Tests/Visualfixtures injiziert
  werden. Die UI bildet `loading`, `translated`, `error`, `offline`, `stale`,
  `aborted`, `noop` und `disabled` ab. Stale/Abort/Error zeigt niemals alten
  übersetzten Text. Vor dem Commit eines Resultats wird dessen Key erneut
  gegen Snapshot, Artikel, Section, Blockreferenzhash, beide Sprachen und
  Adapter-ID/-Version verglichen.
- Resultate sind nur flüchtiger Komponentenstate; kein Storage, Cache,
  Cookie, Telemetrie, Contentlog oder Provider.

### Sichere Testseams

- `App` darf optionale typisierte Props für Reader-v2-Loader und lokalen
  Translationadapter erhalten. Defaults sind ausschließlich
  `loadMobileReaderV2` und `disabledMobileReaderV2TranslationAdapter`.
- `apps/mobile/src/main.tsx` bleibt byteunverändert und rendert `<App />` ohne
  Props. Query, Hash, Storage, Cookie, `window`, Buildflag und Nutzereingabe
  können keinen Adapter oder Request-Seam aktivieren.
- Komponententests dürfen die Props direkt injizieren und belegen
  `loading/translated/error/stale/abort`. Die Browser-/Screenshotmatrix zeigt
  nur produktiv erreichbare Zustände mit deaktiviertem Adapter. Es wird kein
  test-only Browserentry in den Produktionsquellen und kein künstlicher
  übersetzter Screenshot verlangt.

### Navigation, Fokus, Offline und Reading State

- Bestehende Route `#article/<id>`, `history.state`, App-/Browser-Back,
  Escape-Reihenfolge und Trigger-Rückfokus bleiben unverändert.
- Beim Readerstart fokussiert weiterhin die Artikelüberschrift. Native
  Offenlegung und Übersetzungsaktionen besitzen deterministische sichtbare
  Fokuszustände und mindestens 44 × 44 px Bedienfläche.
- Save, Read, Progress, Reset und Future-Raw-Schutz arbeiten unverändert nur
  mit der v1-Artikel-ID. v2-Zustände schreiben nie in Reading State.
- Offline bleibt Originaltext lesbar; Translation meldet offline/deaktiviert,
  Medien bleiben lokal oder Placeholder.
- Archivreader bleibt im ersten P3-Scope v1-only, sofern der Chief keinen
  separat nachgeprüften, snapshotgleichen Vertrag bindet. Kein stilles
  Ausweiten auf Archivdaten.

## Lokalisierung

Alle neuen sichtbaren Texte werden vollständig in den vorhandenen neun
UI-Sprachen `en`, `de`, `es`, `fr`, `it`, `pt`, `ru`, `el`, `tr` ergänzt.
Englisch bleibt der kanonische Basiskatalog. Katalogtests müssen Exact-cover,
Nichtleerheit und Platzhaltergleichheit bestätigen. Keine Maschinen- oder
Remoteübersetzung im Buildprozess.

## Exakte P3-Allowlist

Genau ein Terra/high-Frontendwriter darf nach dem Startgate nur schreiben:

- `apps/mobile/src/App.tsx`
- `apps/mobile/src/App.test.tsx`
- `apps/mobile/src/styles.css`
- `apps/mobile/src/mobile-reader-v2-ui.ts` – optional neu, reine Projektion/
  flüchtige UI-Zustände, keine zweite Datenquelle
- `apps/mobile/src/mobile-reader-v2-ui.test.ts` – optional neu
- `packages/ui-language/src/index.ts`
- `packages/ui-language/src/index.test.ts`
- `packages/ui-language/src/catalogs/de.ts`
- `packages/ui-language/src/catalogs/es.ts`
- `packages/ui-language/src/catalogs/fr.ts`
- `packages/ui-language/src/catalogs/it.ts`
- `packages/ui-language/src/catalogs/pt.ts`
- `packages/ui-language/src/catalogs/ru.ts`
- `packages/ui-language/src/catalogs/el.ts`
- `packages/ui-language/src/catalogs/tr.ts`
- `tests/e2e/g3-019-reader-v2-visual.spec.ts` – neu
- ausschließlich eigene neue P3-Evidence, Visualbelege und Handoff unter
  `docs/evidence/WRN-G3-019/` und `docs/handoffs/`.

`apps/mobile/src/mobile-reader-v2.ts`, dessen Tests, Contract-/Fixture-
Quellen, Media-Safety, Website, Shared v1, Domain, Reading State,
Offlinecontroller/-store, Root-/Lock-/Package-/Configdateien und vorhandene
fremde E2E-Specs bleiben read-only. Eine fehlende UI-Hilfsfunktion ist ein
Stop beim Chief und keine selbständige Scopeerweiterung.

## Pflichtmatrix des Writers

### Units und Integration

- v1 bleibt sichtbar bei absent/loading/invalid/future/mismatch/aborted;
- ready projiziert stable IDs, vollständige Originalblöcke und Ambiguous-
  Kennzeichnung ohne Textverlust;
- Vorgaengerseparator nur am gebundenen Block;
- Quellenprofil trennt Selbstbeschreibung/Redaktion und erzeugt keinen Link;
- medienfreies Fixture zeigt keinen Medienslot. Ein vorhandenes, validiertes,
  aber nicht auflösbares Medium wird ausschließlich in einem injizierten
  Komponenten-/DOM-A11y-Test geprüft: Placeholder am gebundenen Anker, kein
  Remotezugriff, Originaltext unverändert. Dieser synthetische Zustand ist
  kein Browser-/Screenshotbeleg des medienfreien Produktionsbuilds;
- Übersetzung je Blockreferenz: disabled, noop, loading, translated, error, offline, stale,
  abort; Original immer sichtbar; kein alter Text nach Kontextwechsel;
- keine Mutation von URL, History, Reading State, Content Storage, Cookie,
  Telemetrie oder Netzoberfläche außer dem festen lokalen Sidecarrequest;
- Back/Fokus aus Home, Discover, Für mich, Saved und gültigem Kaltstart;
- Save/Read/Progress sowie read-only Future-Raw-Schutz unverändert.

### Visual und A11y

- neun Sprachen × vier repräsentative Themes bei 390 × 844 und
  200-Prozent-Reflow: exakt 36 Pflichtfälle;
- alle vier Viewports 320 × 568, 390 × 844, 600 × 960 und 844 × 390 für den
  kanonischen EN/Dark- und DE/Light-Readerzustand: exakt acht Pflichtfälle;
- Sonderzustände mindestens einmal in festem Tupel: v1-Fallback
  `EN/dark/390x844`, Ambiguous `DE/light/390x844`, Quellenprofil geschlossen
  und offen `EN/contrast/600x960`, Translation disabled `DE/pink/390x844`,
  Offline `EN/dark/320x568`;
- `media: []` zeigt in jedem Fall **keinen** Placeholder. Synthetische
  blockierte-Medien- und Translation-loading/-translated/-error/-stale-
  Screenshots sind nicht Teil des Production-Visualgates und bleiben gezielte
  Komponenten-/DOM-A11y-Tests;
- lange Texte, LTR/RTL-Vertrag falls künftig vorhanden, Tastaturreihenfolge,
  Fokus, Escape, Axe, Kontrast, Overflow und 44-px-Ziele;
- kanonische Screenshots mit Manifest aus frischem P3-Lauf. Eigenbelege des
  Writers ersetzen keine unabhängige P4-QA.

### Regression und Grenzen

- vollständige Contract-, Mobile- und UI-Language-Suiten;
- beide Mobile-/UI-Typechecks, Mobile-Build und gezielter Lint/Prettier;
- 19 Boundaries, Fixtureprovenienz und Releaseboundary;
- bestehende G3-016/017/018-Mobile-Grundpfade sowie Offline-/A/B/A-/Rollback-
  Pfade gezielt reproduzieren;
- Archiv bleibt v1-only, erzeugt keinen Reader-v2-/Adapterrequest und behält
  den bestehenden Back-/Triggerfokus in einer expliziten Regression;
- Diff- und Hashnachweis, dass Website, Shared v1, Reading State,
  Offlinecontroller/-store, Dependencies und externe Gates unverändert sind.

Bekannte unveränderte Root-Lint-/Prettier-Baselinefehler außerhalb der
Allowlist werden separat dokumentiert und erteilen keine Korrekturrechte.

## Sequenz nach Writerende

1. Writer sichert Kandidat, Report, Visualmanifest und Handoff; Rechte zurück.
2. Frische unabhängige Terra-P4-QA für Funktion, Visual und A11y.
3. Frischer versiegelter Sol-P4-S-Security-/Privacy-Diffscan, insbesondere
   DOM, Assetresolver, Fokus/History und flüchtige Übersetzungszustände.
4. Frischer Sol-P5-Architekturabschluss.
5. Erst danach lokale PO-Sichtabnahme.

Keines dieser Gates erlaubt Website, Hosting/Live, Android/AAB/Play,
Signierung, Upload oder Release.

END-CHECK: :)
