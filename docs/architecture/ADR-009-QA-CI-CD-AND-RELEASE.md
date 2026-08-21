# ADR-009 – QA, CI/CD, Release und Rollback

- Status: `PROPOSED`
- Entscheidungseigner: Product Owner fuer Releases; QA Release Engineer fuer
  unabhaengige Evidenz ohne Deploymentauthority
- Betroffene Risiken: R-04, R-07, R-13, R-14, R-16, R-17, R-27

## Kontext

Die App besitzt historische API-36-, AAB-, Signatur- und Hashbelege. Die
Website besitzt historische Paket-/Rollbackbelege und versionsgebundene QA.
G1 fuehrte keine neuen Builds aus. Ein gruener Build allein beweist weder den
richtigen Contentstand noch visuelle, Offline-, Security- oder Rollbackqualitaet.

## Entscheidung

CI prueft und erzeugt unveraenderliche Kandidaten; CD bedeutet in Release 1
nicht automatische Produktion. Signierung, Playupload, Websiteupload,
Workerdeployment und Cacheumschaltung sind getrennte, einzeln autorisierte
Operationen.

### Testpyramide und Ownership

| Ebene | Pflichtbeleg | Primaerer Owner |
|---|---|---|
| statisch | Format, Typen, Importgrenzen, Lizenzen, Secret-/Artefaktscan | implementierender Engineer |
| Unit | Domain-, Filter-, State- und Migrationslogik | implementierender Engineer |
| Contract | JSON/OpenAPI, Revision, Hash, Provenienz, Fehler | Backend/Data + QA |
| Integration | Gateway, Storage, Cache, Provideradapter, Loeschung | Backend/Data + QA |
| Browser E2E | Hauptflows, Deep Links, Keyboard, Fehler, Offline | QA |
| Visual | G1-Referenzen, Viewports, Themes, Reflow | QA + Product Owner bei Abweichung |
| Android | Lint, Unit, Instrumentation, WebView, Lifecycle, Berechtigungen | QA |
| Security/Privacy | Abuse-, Admission-, No-Logging-, Loesch-/Widerrufstests | Security Reviewer |
| Release | Herkunft, Doppelbuild/Determinismus, Hash, Manifest, Rollback | QA + unabh. Reviewer |

### Pipelinegrenzen

- Pull-Request/Change Gate: statisch, Unit, Contract, betroffene Integration,
  kleine Visual-/E2E-Matrix; keine externen Mutationen.
- Main-Kandidat: volle getrennte Mobile-/Website-Matrix und immutable
  Artefakte mit Provenienzmanifest.
- Worker-Kandidat: Dry-run/isolierte Tests, Configschema und Rollbackpaket;
  kein `wrangler deploy` in normalen Checks.
- Release Candidate: unabhaengiger Review, offene Findings und Risikoregister.
- Produktion: nur Product-Owner-Einzelgenehmigung gemaess G6.

### Provenienzmanifest

Jedes Artefakt nennt Quellcommit, Lockfilehash, Toolchainversionen,
Contentrevision, Contractversionen, Buildzeit, Testreporthash, Artefakthash,
Zielumgebung und Rollbackreferenz. Mobile und Website besitzen getrennte
Manifeste; dieselbe Contentrevision kann referenziert werden.

### Website

- statisches Apache-kompatibles Paket;
- Feed, Landingpages, Manifest und Sitemap aus einer Revision;
- unveraenderliches ZIP plus SHA-256;
- getrennt getesteter vorheriger Rollbackstand;
- Service-Worker-Upgrade-/Rollbackmatrix;
- Upload und Live-Smoke erst nach Freigabe.

### Android

- commitgebundene Webassets, Paketname und expliziter Versionsentscheid;
- reproduzierbare Node-/Capacitor-/Gradle-/JDK-/SDK-Toolchain;
- zwei unabhaengige Builds oder gleichwertiger deterministischer Nachweis;
- AAB-Inhalt, Signatur, Zertifikat und Hash getrennt pruefen;
- Signierung, Versionscodeaenderung, Trackwahl und Upload nur mit
  Einzelgenehmigung.

### Rollback

- Clientrollback und Contentrollback sind getrennte Entscheidungen.
- Website: vorheriges vollstaendiges Paket und kompatible Contentrevision.
- Android: kein stilles Downgrade; serverseitige Compatibility-/Kill-Switch-
  Grenzen und naechster korrigierter Build.
- Worker: vorherige Version/Configbindung und Datenmigration mit
  Vorwaerts-/Rueckwaertsstrategie.
- Rollbacktest darf Produktion nicht veraendern.

## Alternativen

1. **Vollautomatische CD:** schneller, verletzt aktuelle Freigabe- und
   Solo-Owner-Schutzgrenzen.
2. **Nur manuelle QA:** flexibel, aber nicht reproduzierbar und fuer den
   delegierenden Product Owner unzureichend.
3. **Eine gemeinsame App/Web-Pipeline:** weniger Konfiguration, koppelt aber
   Releases und Rollbacks.
4. **Snapshots blind aktualisieren:** verboten, weil es Regressionen verdeckt.

## Kosten

- CI-Minuten, Emulator-/Browserzeit, Artefaktspeicher und QA-Aufwand getrennt
  messen; keine Preise erfinden.
- Risikobasiertes Test-Sharding darf Laufzeit sparen, die volle G5-Matrix aber
  nicht ersetzen.
- Abo-/lokale Toolchains bevorzugen; kostenpflichtige externe Devicefarms nur
  nach Budgetfreigabe.

## Risiken und Gegenmassnahmen

- Flaky Tests: Quarantaene mit Owner/Frist, niemals still ignorieren.
- Visuelle Fixtures driften mit Livecontent: immutable Testdaten und getrennte
  Live-Smokes.
- Buildprovenienz kann unvollstaendig sein: Manifestgate vor Signierung.
- Rollback kann neues lokales Schema nicht lesen: Kompatibilitaetsmatrix aus
  ADR-007.

## Konsequenzen

Der Product Owner erhaelt Pass/Fail, Screenshots, Hashes, Risiken und einen
Rueckweg statt nur technischer Buildmeldungen. Kein normaler Agent oder CI-Lauf
erhaelt implizite Deploymentauthority.

## Migration

1. G1-Test-/Screenshotbelege Paritaets- und Risik IDs zuordnen.
2. Kandidatenpipelines ohne Deployschritte dokumentieren und spaeter umsetzen.
3. Erstes Slice mit kleiner Matrix; bei wachsendem Scope Testpyramide erweitern.
4. Releaseprovenienz und Rollback vor erstem RC trocken pruefen.

## Verifikationsgate

G5 verlangt volle Paritaetsmatrix, null offene Blocker/High, getrennte
reproduzierbare Mobile-/Websiteartefakte, Security/Privacy-Review, Offline-
Upgrade/Rollback, Accessibility-/Visualbelege und unabhaengigen Review. G6
verlangt zusaetzlich explizite Product-Owner-Freigabe; ein bestandener G5-Lauf
deployt nichts.
