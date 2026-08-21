# ADR-005 – Backend-, HTTP- und Workergrenzen

- Status: `PROPOSED`
- Entscheidungseigner: Product Owner fuer Provider/Budget; Chief Architect
  fuer die technische Empfehlung
- Technischer Owner nach Freigabe: Backend Data Reliability Engineer
- Betroffene Risiken: R-08, R-12, R-23, R-24, R-25, R-26

## Kontext

Die Legacy-App enthaelt Cloudflare Worker fuer Uebersetzung, Proxy,
Operationen, Quoten und Push. KV, R2 und Durable Objects sind statisch
referenziert; der Livezustand ist unbekannt. G1 bestaetigte, dass CORS als
Admission ungeeignet ist, ein clientbestimmter Uebersetzungskey unsicher ist
und zustandserzeugende anonyme Operationen Kosten und oeffentliche Daten
erzeugen koennen.

## Entscheidung

Cloudflare Workers bleiben der bevorzugte Ausgangspunkt, weil vorhandene
Vertraege und Betriebswissen dort liegen. Die Wahl ist bedingt: Vor G3 muessen
ein autorisiertes read-only Liveinventar, aktuelle Kosten-/Quotaangaben,
Lizenzen und die benoetigten Produktentscheidungen vorliegen. HTTP-Vertraege
und Domainlogik werden providerneutral beschrieben; Bindings sitzen nur in
Adaptern.

### Logische Deploymentgrenzen

| Grenze | Verantwortung | Auth/Admission | Persistenz |
|---|---|---|---|
| Content Gateway | nur revisionsgebundene GET-/HEAD-Lesezugriffe, Schema-/Hashpruefung, kontrollierte Fallbacks | oeffentlich lesbar, strikte Methoden/Origins/Caching | keine Nutzerdaten; kurze technische Metadaten |
| Translation | `POST /v1/translations`; Normalisierung, serverseitiger Cachekey, Provideradapter | zweckgebundene Client-/Session-Admission soweit Missbrauchsrisiko; CORS zusaetzlich | Cache mit TTL; kein Rohinhalt in Logs |
| Feedback | `POST /v1/feedback`, Status/Loeschung ueber Referenz | Abusekontrolle; Adminzugriff getrennt und fail-closed | minimale Felder, feste Retention, belegte Loeschung |
| Podcast Generation | optional; kanonische Content-ID, Jobstatus, Takedown | kurzlebige zweckgebundene Admission, harte Nutzer-/Globalcaps | Audio/Metadaten nur mit Lifecycle und Moderation |
| Push | Config, Challenge, Subscribe, Revoke; Adminversand getrennt | bestaetigte Subscription, Adminauth fuer Versand | Ablauf, Caps, Pruning und bestaetigter Widerruf |
| Operations/Health | technische Versions-, Quota- und Dependencyzustaende | keine Secretwerte; Adminfelder authentisiert | aggregierte, contentfreie Betriebsdaten |

Jede unabhaengig rollbackbare fachliche Grenze ist ein eigenes physisches
Deployable: `content-gateway`, `translation`, `feedback`, `podcast` und `push`.
Read-only Health/Operations duerfen nur mit dem Dienst gebuendelt werden,
dessen Version und Datenklasse sie beobachten; dienstuebergreifende
Adminoperationen sind ein separates Deployable. Quota-Koordination kann als
gemeinsamer Infrastrukturservice laufen, muss aber versioniert,
rueckwaertskompatibel und ohne Mitrollback fachlicher Dienste betreibbar sein.

Eine Buendelung ist nur zulaessig, wenn Endpunkte dieselbe Datenklasse,
Admission, Retention, SLO, Owner, Migrationsfolge und Rollbackeinheit besitzen.
Dann wird die gesamte Gruppe ausdruecklich als eine Blast-Radius-, Deploy- und
Rollbackeinheit dokumentiert; logisch getrennte Rollbacks innerhalb eines
einzelnen Artefakts werden nicht behauptet. Fuer Release 1 trifft diese
Ausnahme auf die fuenf oben benannten fachlichen Grenzen nicht zu.

### HTTP-Vertrag

- `/v1/` als explizite Majorversion; additive kompatible Felder optional.
- normierte Fehlerhuelle mit `code`, sicherer Nutzermeldung,
  `correlationId` und `retryable`; keine Inhalts- oder Secretspiegelung.
- Idempotency-Key fuer zustandserzeugende wiederholbare Operationen, aber
  serverseitig an autorisierten Zweck/Payload gebunden.
- CORS-Allowlist, CSP und Methodenbegrenzung als Browserhaertung; nie als
  Identitaetsnachweis.
- Quoten pro Operation plus globale Kosten-/Storagecaps und Kill-Switch mit
  benanntem Owner.
- Fail-closed bei Admission, Auth, Quota-Koordination und unbekannter
  Contractversion.

### Observability und Liveinventar

Erlaubte Logs/Metriken: Dienstversion, Route als Template, Statusklasse,
Latenz, Retry, Providercode als normierte Kategorie, Bytes/Quota aggregiert,
Revision und zufaellige Correlation-ID. Verboten: Artikeltext, Uebersetzung,
Feedbacknachricht/-adresse, Pushendpoint/-keys, Standort, Tokens oder komplette
URLs mit sensitiven Parametern.

Das spaetere Liveinventar liest nur Namen, Versionen, Bindingsarten, Routen,
Tarif/Usage, Lifecycle, Alarme und Zeitstempel. Es liest keine Secretwerte und
veraendert nichts.

## Alternativen

1. **Status quo unveraendert portieren:** schnell, uebernimmt aber SEC-001/002
   und unbekannte Live-/Retentiongrenzen.
2. **Managed Container/Server:** mehr Runtimekontrolle, aber neue Betriebs-,
   Patch- und Skalierungsverantwortung.
3. **Supabase/Firebase oder anderer BaaS:** integrierte Daten-/Authfunktionen,
   jedoch Providerwechsel, Datenmigration und neue Kosten-/Privacygrenzen.
4. **Nur statische Daten ohne Operationen:** sehr kleine Angriffs-/Kostenflaeche,
   verliert aber Translation, Feedback, Push und Generierung, sofern der
   Product Owner sie behalten will.

## Kosten

- Abo-/Plan-, Request-, CPU-, KV-, R2-, DO-, E-Mail-, KI-, Speech- und
  Egresskosten werden getrennt gemessen; keine aktuellen Preise behauptet.
- Jede kostenrelevante Route braucht Messpunkt, Budget, Warnschwelle,
  hard cap, Cache-/Fallbackregel und Kill-Switch-Owner.
- Providerwechsel bleibt moeglich, kostet aber Adapter- und Revalidierungsarbeit.

## Risiken und Gegenmassnahmen

- Providerneutralitaet kann zu duennen Abstraktionen fuehren: nur echte
  Domain-/HTTP-Vertraege abstrahieren, Betriebsfeatures sichtbar lassen.
- Gemeinsame Infrastruktur kann mehrere Worker koppeln: versionierte
  Rueckwaertskompatibilitaet, gestufte Migration und eigener Rollbackbeleg.
- Observability kann Privacy verletzen: strukturierte Allowlistfelder und
  No-Content-Logging-Negativtests.

## Konsequenzen

Clients sprechen stabile `/v1`-Vertraege statt Providerbindings. Cloudflare
kann weiterverwendet werden, ohne Architektur und Datenmodell daran zu binden.
Ein Translation-Rollback setzt weder Content Gateway, Feedback, Podcast noch
Push zurueck. Zustandserzeugende Features bleiben standardmaessig deaktiviert,
bis ihr jeweiliges Gate freigegeben ist.

## Migration

1. Read-only Liveinventar und Provider-/Kostenmatrix.
2. OpenAPI-/JSON-Schemas und Fehlercodes als Dokument/Testfixture.
3. Content Gateway zuerst, danach Translation mit geschlossenem SEC-001.
4. Feedback, Podcast und Push jeweils als eigener, freigegebener Slice.
5. Gemeinsame Quota-/Schemaabhaengigkeiten vorwaerts- und rueckwaertskompatibel
   migrieren; keine fachliche Deploymentgruppe erzwingen.
6. Legacyworker erst nach Parallelvergleich und bewiesenem Rollback abloesen.

## Verifikationsgate

Contract-, CORS-, Auth-/Admission-, Quota-, Idempotenz-, No-Side-Effect-,
No-Content-Logging-, Retention-, Loesch- und Provider-Fallbacktests bestehen.
Ein Workerrelease ist commit-/configgebunden, getrennt rollbackfaehig und
deployt niemals als Nebenwirkung eines Tests oder Builds. Ein Test rollt jedes
der fuenf fachlichen Deployables separat zur vorherigen Version zurueck und
belegt, dass die anderen Versionen und Datenmigrationen unveraendert bleiben.
