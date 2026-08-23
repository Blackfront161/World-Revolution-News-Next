# ADR-002 – Clientstack fuer Android-App und Website

- Status: `ACCEPTED` am 23. August 2026; aktuelle Versionen/Lizenzen vor G3 belegen
- Entscheidungseigner: Product Owner
- Technischer Owner nach Freigabe: Frontend Brand Engineer
- Betroffene Risiken: R-03, R-04, R-07, R-13, R-16

## Kontext

Die App-Baseline ist eine Webruntime in Capacitor 8.4.0 mit Android API 36 und
nativen Share-, Notification- und Updatepfaden. Die Website ist eine statische,
SEO-orientierte Apache-Anwendung mit 935 Landingpageverzeichnissen. Beide
Legacy-Runtimes sind stark gekoppelt. Die Migration muss visuelle Paritaet,
Androidfaehigkeit, SEO, Offline, Testbarkeit und KI-gestuetzte Wartbarkeit
gleichzeitig tragen.

## Entscheidung

Empfohlen wird:

- React + TypeScript + Vite fuer beide getrennten Weboberflaechen;
- Capacitor fuer die Android-Huelle und eng begrenzte native Adapter;
- frameworkunabhaengige Domain-/Contractpakete;
- statische, deterministische SEO-Ausgabe fuer die Website;
- kein serverseitiges Rendering als Pflicht fuer Release 1, solange der
  Landingpagevertrag SEO und Direktaufrufe nachweisbar erfuellt.

React ist keine Legacyuebernahme, sondern ein modularer Rewrite in vertikalen
Slices. Die Wahl bleibt bis zur Product-Owner-Freigabe vorgeschlagen.

## Bewertungsmatrix

Skala: 1 = unguenstig, 3 = tragfaehig, 5 = sehr passend. Gewichte leiten sich
aus Charter/G1 ab: oeffentliche statische SEO-Website und bestehende
Capacitor-/Androidkette sind Muss-Grenzen; der Legacy-Monolith verlangt kleine,
typisierte, testbare Module. Preise, Popularitaet oder vermutete Modellvorlieben
sind kein Kriterium.

| Kriterium | Gewicht | Messbare Bedeutung fuer WRN |
|---|---:|---|
| Web/SEO | 25 % | semantisches DOM, statische Landingpages, Apachepaket, Deep Links |
| Android-/Native-Kontinuitaet | 20 % | API-36-/Capacitorpfad, Share/Update/Lifecycle ohne Komplettwechsel |
| Paritaetsmigration | 15 % | vertikale Ablösung der Webruntime ohne Big-Bang oder doppelte Screens |
| Tests/Accessibility | 15 % | Unit/Contract/E2E/Visual, DOM-A11y, Tastatur/Reflow automatisierbar |
| KI-gestuetzte Wartbarkeit | 15 % | explizite Typen, kleine Dateien/Exports, geringe globale Kopplung, deterministische Tests und wenig Plattformduplikation; nicht „vom Modell bevorzugt“ |
| Betrieb/Performance/Dependencies | 10 % | statisches Hosting, Bundlekontrolle, reproduzierbare Lockfiles und ueberschaubare Dependency-/Securityflaeche |

Gewichteter Wert = Summe aus `(Punkte / 5) * Gewicht`, maximal 100.

| Option | Web/SEO 25 | Android 20 | Paritaet 15 | Test/A11y 15 | KI-Wartbarkeit 15 | Betrieb 10 | Gesamt / 100 |
|---|---:|---:|---:|---:|---:|---:|---:|
| React + TS + Vite + Capacitor | 5 | 5 | 4 | 5 | 5 | 4 | 95 |
| modularisiertes Vanilla JS + Capacitor | 5 | 5 | 3 | 3 | 2 | 5 | 79 |
| Flutter fuer Mobile und Web | 2 | 3 | 2 | 4 | 4 | 3 | 58 |
| React Native plus separate Web-App | 4 | 4 | 2 | 4 | 3 | 2 | 67 |
| native Android plus separate Web-App | 5 | 5 | 1 | 5 | 2 | 1 | 71 |

Die Punkte binden sich an G1-Evidenz: statische Website/SEO und
Landingpagevertrag (`WRN-G1-005`), bestehender Capacitor-/API-36-Releasepfad
(`WRN-G1-001`), monolithische Webruntime und getrennte App-/Website-Layouts
(`WRN-G1-001/002/005/006`). Annahmen zu aktuellen Frameworkversionen,
Bundlegroessen, Lizenzen, Securitysupport und Toolchainkompatibilitaet bleiben
bis zum read-only G3-Vorcheck unbewiesen. Das erste Slice misst statt
prognostiziert: Bundlebudgets, Buildzeit, Dependencyzahl/-scan,
Accessibilityautomatisierung und Agenten-Nacharbeitsquote pro akzeptiertem
Task.

## Alternativen

### Modulares Vanilla JS

Minimiert Frameworkmigration und passt zur statischen Website. Es bietet aber
weniger harte Komponenten-/Typgrenzen und erhoeht das Risiko, den Legacy-
Monolithen nur umzubenennen.

### Flutter

Ein einheitliches UI-Toolkit waere fuer Mobile attraktiv. Die SEO-
Landingpages, Apacheausgabe und bestehende Websemantik wuerden dennoch eine
separate Webschicht oder erhebliche Sonderarchitektur erfordern.

### React Native plus Web

Kann native Mobile-UI staerken, erzwingt aber fuer die bestehende SEO-Website
eine zweite Rendering-/Komponentenstrategie. Die heute funktionierende
Capacitor-/WebView-Releasekette wuerde verworfen.

### Native Android plus separate Web-App

Maximale Plattformkontrolle, aber doppelte UI-/Accessibilityarbeit und die
hoechsten Paritaets-/Wartungskosten fuer einen Solo-Product-Owner.

## Kosten

- Einmalig: TypeScript-, Komponenten-, Test- und Buildgrundlage sowie
  schrittweiser Rewrite.
- Laufend: Node-/Android-Toolchain, zwei Clientpipelines und
  Dependencypflege.
- React/Vite/Capacitor- oder Providerpreise werden nicht behauptet; Versionen,
  Lizenzen und Supportfenster sind vor G3 read-only zu verifizieren.
- Die Empfehlung reduziert doppelte UI-Logik, ohne Android und Website zu
  einem Release zu koppeln.

## Risiken und Gegenmassnahmen

- Rewrite kann Funktionsverlust erzeugen: Paritaets-IDs, Screenshots und
  vertikale Slices sind harte Abnahme.
- Gemeinsames Framework kann identische Layouts verleiten: Navigation und
  Responsive-Screens bleiben app-lokal.
- Dependency-/Builddrift: exakte Lockfiles, reproduzierbare Toolchain und
  Updates nur ueber gesonderte Reviews.
- Capacitor kann native Sonderfaelle verdecken: jeder native Adapter besitzt
  einen expliziten Vertrag und Geraetetest.

## Konsequenzen

Die Webkompetenz, DOM-Semantik und ein grosser Teil der Testwerkzeuge koennen
geteilt werden. Android bleibt ueber Capacitor erreichbar, die Website kann
statische Artikel und Apachepakete getrennt erzeugen. Ein Wechsel zu Flutter
oder React Native bleibt spaeter moeglich, waere aber eine neue ADR.

## Migration

1. Nach Freigabe ein Headless-News-Slice mit Contracts und deterministischen
   Fixtures.
2. Getrennte Mobile-/Website-Shells mit gemeinsamen Tokens.
3. Reader/Deep Links/SEO und erst danach Offline-/native Adapter.
4. Legacyverhalten zeilenweise abloesen; kein Big-Bang und keine
   Legacydateikopie.

## Verifikationsgate

Vor G3 muessen Lizenz/Supportfenster und Android-/Webtoolchain bestaetigt sein.
Das erste Slice muss getrennte Web- und Android-/Capacitor-Smokes, typisierte
Contracts, Tastatur-/Accessibilitytests, visuelle Paritaet und reproduzierbare
Paketierung ohne Deployment nachweisen. Der Product Owner entscheidet danach,
ob die Empfehlung `ACCEPTED` wird.
