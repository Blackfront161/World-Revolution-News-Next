# Task Brief – WRN-G3-003 Marken- und Designgrundlage

## Metadaten

- Task-ID: `WRN-G3-003`
- Phase/Welle: G3, querschnittliche Markenbasis vor den weiteren News-Slices
- Auftraggeber: Product Owner
- Owner-Agent: Chief AI Architect
- Spaetere Implementierungsowner: Frontend Brand Engineer; danach unabhaengig
  QA Release Engineer
- Modellrouting: Terra/high fuer Implementierung und visuelle Integration;
  Luna/medium nur fuer deterministische Asset-/Evidenztabellen; Sol/high nur
  bei Architektur-, Rechte-, Security- oder Releaseblocker
- Delegation nach Start: maximal ein schreibender Frontend-Agent und danach
  ein read-only QA-Agent; keine parallele Schreibarbeit
- Paritaet: `UX-01`, `UX-03`, `UX-04`, `UX-05`, `UX-06`, `UX-07`; sichtbare
  Fortfuehrung von `NEWS-01`
- Risiken: `R-04`, `R-16`, `R-18`, `R-37`
- Status: **KORREKTURRUNDE 2 TECHNISCH GREEN – SICHTENTSCHEIDUNG AUSSTEHEND**
- Startgate: `START WRN-G3-003` am 23. August 2026 erteilt
- vorheriger Produkt-/Testkandidat: `af2fd9920191`
- unabhaengige QA: GREEN; null offene Blocker, Highs, Mediums oder Lows
- PO-026-Korrekturkandidat: `0a822398a888a6ffce063c1a8e9d0c4d0ce5a548`
- PO-026-QA-/Evidenzcheckpoint: `6039c46`
- PO-027-Korrekturkandidat: `f54a2993e1eca52b75c1af3ddefd48ca434716b1`
- PO-027-QA-/Evidenzcheckpoint: `21351f7`

## Ziel in beobachtbarer Sprache

Mobile-App und responsive Website erhalten eine gemeinsame, erkennbare
WRN-/Solinaridao-Markenbasis: freigegebene Bildmarke, dunkle und helle
Farbsemantik, lesbare Typografierollen, Abstaende, Fokusdarstellung und
markengerechte Feedkarten. Mobile und Website sollen wie dieselbe Marke
wirken, duerfen aber weiterhin unterschiedliche Header- und Layoutkompositionen
haben.

Der Product Owner erhaelt beschriftete Alt-vs.-Neu-Vergleiche sowie eine kleine
Auswahlentscheidung fuer die spaetere offene Ersatzschrift. Dieser Task ordnet
keine fehlende Produktfunktion neu an und behauptet keine vollstaendige
Funktionsparitaet.

## Ausgangslage und verbindliche Belege

- neues Zielrepository: `codex/g3-002-newsfeed` auf technischem
  Dokumentstand `88ad2c6`; G3-002-Produktkandidat `422917b7a686`
- G3-002: technisch GREEN und am 23. August 2026 visuell akzeptiert
- App-Baseline, strikt read-only:
  `C:\Users\patri\Documents\World Rev Ne\wrn-github-app-current`
  auf `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`; sichtbare Runtime
  `968c320adfe87d1e11e88f99f448a435d4242750`
- Website-Baseline, strikt read-only:
  `C:\Users\patri\Documents\World Revolution News\wrn-web-portal-2026-08-20-r10n-work`
  auf `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- Rechte-/Hashregister:
  `docs/evidence/WRN-G2-002-ASSET-RIGHTS-REGISTER.md`
- Font-/Importbrief:
  `docs/evidence/WRN-G2-003-FONT-AND-BRAND-RECREATION-BRIEF.md`
- Architektur: ADR-001, ADR-003 und ADR-009
- visuelle Altbaselines:
  `docs/handoffs/WRN-G1-002-visual-app-baseline.md` und
  `docs/handoffs/WRN-G1-006-visual-website-baseline.md`
- bestehende lokale Implementierung:
  `packages/brand-tokens`, `apps/mobile` und `apps/website`

## Verbindlicher Slice

```text
owner-attested Original + bekannter SHA-256
                    |
                    v
       lokales Assetmanifest und Masterrolle
                    |
                    v
   gemeinsame semantische Brand-/A11y-Tokens
             /                     \
            v                       v
  mobiler Markenheader       responsiver Webheader
  + Feedkarten               + Feedkartenraster
             \                     /
              +---- Visual QA -----+
```

Navigation, Routing und Screenkomposition bleiben app-lokal. Gemeinsame
Tokens und Assetregeln duerfen keine identische Navigation erzwingen.

## Scope

### Erlaubte Schreibpfade nach dem Startgate

- `packages/brand-tokens/**`: semantische Farb-, Typografie-, Abstand-, Radius-,
  Fokus- und Motion-Tokens; kontrollierte Markenassets und maschinenlesbares
  Assetmanifest;
- `apps/mobile/src/**`: ausschliesslich Markenheader, Theme- und Feedkarten-
  Darstellung des vorhandenen G3-002-Slices;
- `apps/website/src/**`: ausschliesslich responsiver Markenheader, Theme- und
  Feedkarten-Darstellung des vorhandenen G3-002-Slices;
- eng notwendige Komponenten-/Browsertests unter den bestehenden App- und
  `tests/e2e/**`-Pfaden;
- eng notwendige, rein lokale Hash-/Assetpruefungen unter `tools/**`;
- die zu WRN-G3-003 gehoerenden `docs/**`-Belege.

Root-/Workspacekonfiguration darf nur angepasst werden, wenn das vorhandene
Paket sonst nicht reproduzierbar gebaut oder getestet werden kann. Eine neue
Dependency oder ein externer Download ist durch `START WRN-G3-003` nicht
automatisch erlaubt.

### Fuer den ersten kontrollierten Import zugelassene Originale

Nach dem Start duerfen hoechstens diese bereits registrierten Dateien aus der
read-only App-Baseline als Kandidaten importiert werden, jeweils nur nach
erneuter SHA-256-Pruefung vor und nach dem Import:

| Rolle | Original | Erwarteter SHA-256 |
|---|---|---|
| kompakte Solinaridao-Bildmarke | `solinaridao-header-mark-filled.png` | `60F839B54A573173D28387DBB2DC6199B2474FC4EF6450FF4EF933108C141081` |
| horizontale WRN-Headerwortmarke | `wrn-future-header-white.png` | `9DA0E22936304A30A55BA1483C2305C6AD6C3B1A057341AF2AB3B16FE98A5E2F` |
| redaktioneller Hintergrund | `app-background.webp` | `CBA5EB9BBFB9E20D2DAD86EBC9295C5D48F04EE080087A42F7E6CA85ADEF1167` |

Keine weitere Legacydatei wird durch diese Tabelle freigegeben. Insbesondere
ist die Website-Datei `solinaridao-header-mark-filled-r10e.png` nicht im
bestehenden Hashregister und bleibt ausgeschlossen, bis sie in einem separaten
Rechte-/Hashnachtrag klassifiziert wurde. Ableitungen werden reproduzierbar aus
einem registrierten Master erzeugt und nicht als unabhaengige Master gepflegt.

### Eigentums- und Reihenfolgegrenzen

1. Der Frontend Brand Engineer implementiert allein die Brandpaket- und
   Clientaenderungen und liefert einen gesicherten Handoff.
2. Der Main Agent prueft Hashes, Scope, Tests und Git-Diff.
3. Der QA Release Engineer prueft den unveraenderten Kandidaten read-only,
   erzeugt die visuelle Matrix und meldet Findings.
4. Der Product Owner entscheidet sichtbar ueber Marke und spaeteren
   Fontkandidaten. Kein Agent ersetzt diese Entscheidung.

### Nicht-Ziele

- keine Suche, Filter oder echte Nutzernavigation (`NEWS-02`/`UX-02`);
- kein Reader, Share, Archiv, Landingpage, Canonical, Sitemap oder SEO;
- keine echten Nachrichten, Livefeeds, Datenbank, Worker oder Provider;
- keine echten Artikelbilder oder sonstige Medien;
- keine Aenderung des Content-/Domainvertrags oder der G3-002-Fixture;
- keine Neuzeichnung eines Logos und kein generatives Markenasset;
- keine Android-Icons, Splashscreens, native Huelle, AAB/APK oder Play-Arbeit;
- keine Remote-/CI-, Cloudflare-, Hostinger- oder Deploymentoperation;
- keine Translation, Podcasts, Push, Hilfe, Map oder Kartenspiel;
- keine Freigabe der noch fehlenden Produktfunktionen.

### Verbotene Aktionen

- jede Aenderung in Live-App, Website, ihren Repositories, Daten oder
  Infrastruktur;
- pauschales Kopieren eines Legacy-Ordners oder nicht gelisteter Assets;
- jede Kopie von `Qood.ttf`, ihrem Lizenztext oder einer ihrer Ableitungen;
- externe Font-CDNs, Telemetrie oder Laufzeit-Fontdownload;
- ein neuer Fontdownload ohne vorherige sichtbare Einzelfreigabe
  `FONT-DOWNLOAD WRN-G3-003 FREIGEGEBEN`;
- Tests oder Screenshots blind aktualisieren, um Abweichungen zu verdecken;
- Mitarbeiter oder Folgefeatures ohne passendes Startgate beginnen.

## Marken-, Token- und UI-Anforderungen

1. Ein versioniertes Assetmanifest dokumentiert pro importiertem Original
   Quellrepository/-commit, Quellpfad, Product-Owner-Rechtebestaetigung,
   Master-/Ableitungsrolle, erlaubte Oberflaechen, Bytes, SHA-256, Alt-Text-
   Regel und Bearbeitungsstatus.
2. Dark und Light verwenden dieselben semantischen Rollen fuer Canvas,
   Surface, Text, Muted, Border, Cyan-/Magenta-Akzent, Fokus, Erfolg, Warnung,
   Fehler und Offline. Zustand darf nie nur durch Farbe vermittelt werden.
3. UI-, Display-, Reading- und Mono-Typografierollen besitzen belastbare
   Systemfallbacks. `Qood` darf in Quelltext, CSS, Build oder Artefakt nicht
   vorkommen.
4. Ein spaeter freigegebener offener Font wird lokal ausgeliefert und braucht
   gepinnten offiziellen Upstreamstand, Originallizenz, SHA-256,
   Third-Party-Notice, WOFF2-/Subsetbeleg und nachgewiesene Zeichenabdeckung.
   Bis zu dieser Entscheidung bleibt der Kandidat ein Vergleich, kein
   Releasebestandteil.
5. Mobile nutzt eine kompakte Headerkomposition; Website nutzt einen
   eigenstaendigen responsiven Header fuer Smartphone, Tablet und Desktop.
   Beide tragen einen zugaenglichen Textnamen unabhaengig vom Bild.
6. Der vorhandene G3-002-Feed, seine Metadaten und sechs Testzustaende bleiben
   funktional unveraendert. Die QA-Testzustandssteuerung bleibt als klar
   bezeichnetes lokales Hilfsmittel und wird nicht als finale Navigation
   ausgegeben.
7. Kein Text oder normales Wort wird bei 200-Prozent-Reflow abgeschnitten;
   Fokus bleibt sichtbar, Touchziele bleiben mindestens 44x44 CSS-Pixel und
   die Hauptseite erzeugt keinen horizontalen Overflow.
8. Assets besitzen sinnvolle Intrinsic-Dimensionen, keine Layoutverschiebung
   durch spaetes Laden und einen lesbaren Text-/CSS-Fallback bei Ladefehler.

## Font-Teilgate

Die A/B-Matrix vergleicht nach separater Downloadfreigabe hoechstens die drei
bereits dokumentierten offenen Familien `Inter`, `Barlow Condensed` und
`Atkinson Hyperlegible Next`. Der technische Agent darf keine davon still als
Sieger festlegen. Der Product Owner waehlt anhand beschrifteter Mobile-/Web-
Vergleiche eine Rolle/Familie oder entscheidet, vorerst bei Systemfonts zu
bleiben.

Ohne `FONT-DOWNLOAD WRN-G3-003 FREIGEGEBEN` bleibt dieser Teil dokumentarisch
vorbereitet und blockiert nicht die lokale Markenasset-/Tokenarbeit, aber eine
Behauptung finaler Font- oder Markenparitaet bleibt gesperrt.

## Akzeptanzkriterien

1. Jeder importierte Bytebestand stimmt exakt mit dem registrierten SHA-256
   ueberein und besitzt einen vollstaendigen Manifest-/Rechtebeleg.
2. `Qood` und nicht freigegebene Legacyassets sind durch einen negativen
   Boundarytest ausgeschlossen.
3. Mobile und Website konsumieren dieselben semantischen Tokens und Assets,
   behalten aber getrennte Header-/Responsive-Kompositionen.
4. Der G3-002-Feed zeigt weiterhin dieselbe Fixture-Revision, Artikelreihenfolge,
   Metadaten und alle sechs Zustaende; bestehende Contract-/Boundarytests
   bleiben gruen.
5. Format, Lint, Typen, Unit-/Komponententests, getrennte Builds und Browser-E2E
   bestehen mit Frozen Lockfile.
6. Axe/gleichwertiger Accessibility-Smoke, Tastatur, sichtbarer Fokus,
   44-px-Ziele, Dark/Light, 200-Prozent-Reflow und Assetfehler-Fallback sind
   ohne offene Blocker/High bestanden.
7. Die commitgebundene Screenshotmatrix zeigt Alt-vs.-Neu und Mobile-vs.-Web,
   ohne ungeklaerte Konsolen-, Netzwerk- oder Layoutfehler.
8. Ein unabhaengiger QA-Review meldet null offene Blocker/High. Medium braucht
   Owner und ausdrueckliche Product-Owner-Entscheidung.
9. Der Product Owner akzeptiert oder korrigiert die sichtbare Markenrichtung.
   Eine Fontentscheidung wird nur dokumentiert, wenn das separate Fontgate
   durchlaufen wurde.
10. Legacyquellen bleiben auf den registrierten Commits und ihre Arbeitsbaeume
    bleiben sauber; kein Secret, Build-/Releaseartefakt oder fremdes Medium
    gelangt in den Diff.

## Tests und visuelle Belege

### Automatisiert

- Format, Lint, Typen, Workspace-/Importgrenzen und Frozen-Lockfile;
- SHA-256-/Byte-/Manifesttests fuer jedes importierte Asset;
- negativer Scan auf `Qood`, nicht registrierte Assetnamen, externe Font-URLs
  und unerwartete Binaries;
- bestehende Domain-/Content-/Fixturetests unveraendert;
- Unit-/Komponententests fuer Markennamen, Bildfallback, Themes und
  Headersemantik in beiden Clients;
- getrennte Mobile-/Website-Builds;
- Browser-E2E fuer Keyboard, Fokus, 44-px-Ziele, Axe, Reflow, Overflow,
  Assetfehler, Konsole und externe Requestliste.

### Screenshotmatrix

- Mobile: 390x844 Dark/Light, 600x960 Dark und 390x844 Light bei
  200-Prozent-Reflowaequivalent;
- Website: 390x844 Dark/Light, 800x1280 Dark und 1440x900 Dark/Light;
- mindestens Mobile- und Website-Header bei absichtlich fehlgeschlagenem
  Markenbild mit sichtbarem Textfallback;
- Alt-vs.-Neu-Kontaktboegen gegen die unveraenderten G1-Referenzen;
- nach Fontgate: je Kandidat exakt dieselben ausgewaehlten Mobile-/Webansichten
  in einem beschrifteten A/B-Bogen;
- jeder neue Beleg nennt Kandidatencommit, Viewport, Theme, Zustand,
  Assetmanifestversion und Testdatum.

## Daten, Privacy, Security und Kosten

- keine Nutzer-, Live- oder redaktionellen Daten und keine Telemetrie;
- keine externen Runtimeanfragen; Fonts und Assets werden spaeter lokal
  ausgeliefert;
- API-/KI-Kosten: 0 CHF;
- maximal zwei Agenteninstanzen nacheinander, nicht parallel;
- neue Libraries oder Tools sind nicht vorgesehen. Ein genehmigter Fontdownload
  nutzt ausschliesslich offizielle Upstreams und benoetigt Lizenz-/Hashbeleg;
- Gemini kann der Product Owner manuell als visuelle Zweitmeinung verwenden,
  ist aber kein Build-, Test- oder Entscheidungsbestandteil.

## Rollback/Ruecknahme

Vor Implementierung wird ein eigener Branch/Checkpoint aus dem akzeptierten
G3-002-Stand angelegt. Marken-/Token-/Clientaenderungen bilden einen getrennten
Kandidaten und muessen auf `422917b7a686` plus zugehoerige Evidenz
zurueckfuehrbar sein. Legacy-App, Website und Live-Systeme sind nie Teil des
Rollbacks, weil sie unveraendert bleiben.

## Uebergabeformat

- geaenderte Dateien nach Eigentumsbereich;
- Ausgangs-, Assetseed-, Produktkandidaten- und Evidenzcheckpoint;
- Assetmanifest mit Quelle, Rechten, Bytes und Hashes;
- Befehle und Testergebnisse einschliesslich Request-/Konsolenbericht;
- beschriftete Screenshots und Visual-QA-Bericht;
- Annahmen, Abweichungen, Findings, Restrisiken und exakter Rueckkehrpunkt;
- unabhaengiger QA-Handoff nach `docs/templates/AGENT-HANDOFF.md`;
- keine ungefragte Folgeaktion.

## Freigabegrenze

Der Product Owner hat mit `START WRN-G3-003` den hier beschriebenen lokalen
Produkt- und Asset-Scope autorisiert. Der Startbefehl erlaubt keinen
Fontdownload, keine weiteren Legacyassets, keine Funktionserweiterung und
keine externe Operation. Nach der Implementierung ist eine neue visuelle
Product-Owner-Abnahme erforderlich.

## Product-Owner-Amendment 1 vom 23. August 2026

Der Product Owner hat den Kandidaten `af2fd9920191` noch nicht visuell
akzeptiert und genau diese Korrekturen freigegeben:

1. Der responsive Website-Header wird deutlich kompakter und in seiner
   sichtbaren Balkenhoehe an den App-Header angenaehert. Die Wortmarke darf auf
   Tablet/Desktop erhalten bleiben, darf aber keine uebergrosse helle Flaeche
   erzeugen.
2. Die Mobile-App zeigt einen Link mit dem exakten sichtbaren Text
   `Mehr zum Projekt` zur autoritativen Website `https://solinaridao.com/`.
3. Die Mobile-App zeigt einen unaufdringlichen Spendenhinweis. Ein direkter
   PayPal-Link darf das bereits in der read-only Baseline belegte Ziel
   `https://www.paypal.com/ncp/payment/6FSV9FEN4X7VS` verwenden, muss aber klar
   sagen, dass Unterstuetzung freiwillig ist und dass dabei die App verlassen
   und PayPal geoeffnet wird.

Beide externen Links verwenden `target="_blank"`, `rel="noopener noreferrer"`
und `referrerpolicy="no-referrer"`. Touchziele, Fokus, Dark/Light,
200-Prozent-Reflow, Offline-/Requestgrenze und alle bisherigen Tests muessen
erneut bestehen. Neue commitgebundene Smartphone-, Tablet- und
Desktop-Screenshots sind erforderlich.

Nicht freigegeben sind weitere Layout-, Text-, Funktions-, Asset-, Font-,
Live-, Android-, Deployment- oder Releaseaenderungen. Der Product Owner hat
weitere sichtbare Aenderungen ausdruecklich fuer spaeter vorbehalten.

## Product-Owner-Amendment 2 vom 24. August 2026

Der Product Owner akzeptierte Korrekturrunde 1 in Header, Platzierung und
Produktrichtung mit `G3-003 KORREKTUR 1 PASST`, verlangt vor der finalen
Sichtabnahme aber diese exakte Copy-Korrektur:

1. In der sichtbaren App-Oberflaeche darf `PayPal` weder im Linktext noch im
   Leaving-App-Hinweis stehen.
2. Der sichtbare Spendenlink lautet exakt `Unterstuetzen`.
3. Der Hinweis lautet neutral und sinngemaess: Beim Aktivieren wird die App
   verlassen und eine externe Zahlungsseite geoeffnet.
4. Das bereits freigegebene technische Ziel, `target="_blank"`,
   `rel="noopener noreferrer"` und `referrerpolicy="no-referrer"` bleiben
   unveraendert.

Erlaubte Produktpfade sind nur `apps/mobile/src/App.tsx`, der zugehoerige
Unit-Test und die eng notwendige E2E-Assertion. CSS, Website, Assets, Fixture,
weitere Texte und Funktionen bleiben unveraendert. Der sichtbare Beleg muss
zeigen, dass in der App kein Anbietername mehr erscheint und der Text bei
200-Prozent-Reflow vollstaendig lesbar bleibt.
