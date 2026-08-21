# ADR-002 – Clientstack fuer Android-App und Website

- Status: `PROPOSED`
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

Skala: 1 = unguenstig, 3 = tragfaehig, 5 = sehr passend. Die Werte sind eine
G2-Architekturbewertung aus der gebundenen Baseline, keine Markt- oder
Preisbehauptung.

| Option | Web/SEO | Android-/Native-Kontinuitaet | Paritaetsmigration | automatisierbare Tests | ein gemeinsames Kompetenzmodell | Gesamt |
|---|---:|---:|---:|---:|---:|---:|
| React + TS + Vite + Capacitor | 5 | 5 | 4 | 5 | 5 | 24 |
| modularisiertes Vanilla JS + Capacitor | 5 | 5 | 3 | 3 | 3 | 19 |
| Flutter fuer Mobile und Web | 2 | 3 | 2 | 4 | 4 | 15 |
| React Native plus separate Web-App | 4 | 4 | 2 | 4 | 3 | 17 |
| native Android plus separate Web-App | 5 | 5 | 1 | 5 | 1 | 17 |

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
