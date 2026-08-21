# ADR-007 – Getrennte Offline-, Storage- und Cachevertraege

- Status: `PROPOSED`
- Entscheidungseigner: Product Owner fuer Offlineumfang
- Technischer Owner nach Freigabe: Backend Data Reliability Engineer
- Betroffene Risiken: R-05, R-06, R-07, R-22, R-26

## Kontext

Die Legacy-App nutzt IndexedDB, localStorage, Cache Storage und zwei
Service-Worker-Vertraege. Die Website besitzt einen eigenen Service Worker und
eigene Cacheversionen. Unkontrollierte Migration kann weisse Seiten,
veraltete Inhalte oder verbleibende Nutzerdaten erzeugen.

## Entscheidung

Mobile-App und Website erhalten getrennte Cache-/Storagenamespaces,
Schemaversionen, Migrationen, Loeschpfade und Rollbacks. Nur Contentschemas und
Testfixtures werden geteilt.

### Datenklassen

| Klasse | Beispiele | Zielstorage | Aktualisierung | Loeschung |
|---|---|---|---|---|
| Shell | HTML/CSS/JS/Icons | Android: paketierte Assets; Website: eigener SW-Cache | nur Clientrelease | bei Update atomar; vorherige Website-Shell fuer Rollback |
| immutable Content | Revisionmanifest, News, Events, Quellen | app-lokale DB/Cache je Client | neue validierte Revision, nie teilweise aktivieren | LRU/Retention, aktive und Rollbackrevision schuetzen |
| optionale Medienmetadaten | Podcasts, Radio, Video, Library | je Client und Manifestklasse | TTL plus Revision | Klasse/TTL/Takedownsignal |
| Nutzereinstellungen | Theme, Sprache, Schrift | je Client lokal | sofort lokal | `Alle lokalen Daten loeschen` |
| Nutzerzustand | gespeichert/gelesen | je Client lokal; Export optional spaeter | transaktional | selektiv und Clear-all |
| Translation Cache | nur server-/contractgebundene Ergebnisse | Clientcache mit Payload-/Contractversion | TTL/Revision | lokal sofort; serverseitig nach eigener Policy |
| sensible Operationen | Feedbackref, Pushstatus | nur minimal; kein Standort | bestaetigter Serverstatus | End-to-End-Widerruf/Loeschung |

### Mobile-App

- Die Android-Shell stammt aus dem gebundenen Appbuild und wird ueber den
  Play-/Installationspfad aktualisiert; sie darf nicht still durch einen
  Website-Service-Worker ersetzt werden.
- IndexedDB/Cache Storage erhalten einen mobilen Namespace und eine
  monoton steigende Schemaversion.
- Ein Service Worker fuer Browserpreview/PWA ist eine eigene Betriebsart. Er
  darf in der nativen Capacitor-Runtime nur nach begruendetem Testvertrag aktiv
  sein.
- Offlinepakete wie `Hilfe finden` speichern keinen Nutzerstandort und tragen
  Revision, Aktualitaet und Loeschstatus.

### Website

- Eigener Service Worker mit Shellversion, Contentrevision und expliziter
  Aktivierungsstrategie.
- Navigation und Required-Daten sind network-first mit begrenztem Timeout und
  ehrlichem Offlinezustand; immutable Revisionen koennen cache-first gelesen
  werden, nachdem Hash/Schema validiert wurden.
- Neue Shell wird erst aktiviert, wenn Pflichtassets vollstaendig vorliegen;
  alte Caches werden erst nach erfolgreicher Aktivierung und Rollbackschutz
  bereinigt.

### Migration und Rollback

- Migrationen sind idempotent, vorwaertsgerichtet und pro Schema dokumentiert.
- Vor destruktiver Transformation wird eine lesbare alte Revision beibehalten,
  solange das Storagebudget dies erlaubt.
- Bei Fehler bleibt die letzte vollstaendig validierte Revision aktiv; keine
  Mischrevision.
- Ein Clientrollback darf neuere lokale Daten nicht blind verwerfen. Wenn ein
  alter Client das Schema nicht versteht, startet er im sicheren Read-only-
  oder Reset-mit-Bestaetigung-Zustand.
- Clear-all nennt lokal und serverseitig betroffene Daten getrennt und meldet
  Fehler sichtbar; lokales Loeschen darf einen fehlgeschlagenen Pushwiderruf
  nicht als vollstaendig darstellen.

## Alternativen

1. **Ein gemeinsamer Service Worker/Cache fuer beide Apps:** weniger Code, aber
   gekoppelte Updates und hohes Rollbackrisiko.
2. **Nur network-first ohne immutable Revisionen:** frischere Daten, aber
   inkonsistente Teilupdates und schlechtere Reproduzierbarkeit.
3. **Alles dauerhaft offline halten:** maximale Verfuegbarkeit, aber
   Storage-, Rechte-, Takedown- und Datenschutzrisiken.
4. **Offline komplett entfernen:** vereinfacht Architektur, verletzt jedoch
   bestaetigte Muss-Faehigkeiten.

## Kosten

- Entwicklung und QA fuer zwei Cacheadapter, Migrationen und Fehlerzustaende.
- Storage-/Netzwerkkosten werden pro Datenklasse gemessen; keine Livepreise.
- Immutable Revisionen reduzieren wiederholte Downloads, benoetigen aber eine
  belegte Aufbewahrungs-/Pruningstrategie.

## Risiken und Gegenmassnahmen

- Alte Service Worker kontrollieren neue Clients: Versionserkennung,
  Aktivierungs-/Unregister-Plan und Browser-Upgrade-Matrix.
- Storagequota wird erreicht: reservierte Mindestmenge, LRU nur fuer
  nicht geschuetzte Revisionen und sichtbarer Degraded Mode.
- Rechte-/Takedownsignal erreicht Offlinekopien spaet: Manifeststatus und
  naechster Onlineabgleich loeschen/markieren betroffene Medien.

## Konsequenzen

Offline bleibt Kernfaehigkeit, wird aber als expliziter Datenvertrag statt als
zufaellige Service-Worker-Nebenwirkung behandelt. App und Website koennen
unabhaengig aktualisieren und zurueckrollen.

## Migration

1. Legacy-Keys, Stores, Cachepraefixe und Datenklassen dokumentieren.
2. Read-only Migrator gegen kopierte Testfixtures entwerfen.
3. Neue Revision parallel aufbauen und erst nach Validierung umschalten.
4. Clear-all, Pushwiderruf und Takedownpfad getrennt nachweisen.
5. Erst-/Zweitstart, Upgrade und Rollback auf jedem Client pruefen.

## Verifikationsgate

Online-, Slow-, Offline-, Erst-/Zweitstart-, Teilupdate-, Storage-full-,
Schemaupgrade-, App-/Website-Rollback-, Clear-all- und Takedowntests bestehen.
Kein Test darf App und Website denselben Cache- oder Service-Worker-Namespace
verwenden lassen; keine fehlerhafte Migration darf die letzte valide Revision
oder Nutzerdaten still loeschen.
