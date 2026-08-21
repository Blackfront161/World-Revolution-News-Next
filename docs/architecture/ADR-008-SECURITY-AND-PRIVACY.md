# ADR-008 – Security-, Privacy- und Datenloeschvertrag

- Status: `PROPOSED`
- Entscheidungseigner: Product Owner fuer Funktionen, Datenschutzhinweise und
  Retention; technische Freigabe durch Security/Privacy Review
- Betroffene Risiken: R-08, R-23, R-24, R-25, R-26
- Verbindliche Findings: SEC-001, SEC-002, SEC-003

## Kontext

G1 bestaetigte zwei High-Schwachstellen und einen bedingten High-Pushpfad.
Zusaetzlich widersprechen automatische Uebersetzung, Feedbackloeschung,
Pushwiderruf und oeffentliche Podcasts teilweise den sichtbaren
Datenschutzversprechen. Hilfe nutzt keinen Standort; Action Radar fragt ihn
freiwillig ab und verarbeitet ihn im beobachteten Pfad lokal.

## Entscheidung

Privacy by default und Datenminimierung sind Architekturvertraege. Remote-
Operationen sind standardmaessig deaktiviert, bis Datenfluss, Admission,
Retention, Loeschung, Kosten und Nutzertext uebereinstimmen.

### Verbindliche Kontrollen

| Bereich | Zielkontrolle | Releasegate |
|---|---|---|
| SEC-001 Translation | kanonischer serverseitiger Key aus versioniertem normalisiertem Payload; Clientkey ignorieren oder verifizieren | Manipulations-/Kollisionsnegativtest vor Portierung |
| SEC-002 Podcast | zweckgebundene Admission, kanonische servergeladene Artikel, Nutzer-/Globalcaps, Moderation/Takedown | kein Provider-/Storageeffekt ohne Admission |
| SEC-003 Push | echte Subscription-Challenge, Ablauf, Gesamtcaps, Pruning, faire Auswahl, idempotenter bestaetigter Widerruf | Fantasieendpoint/Expiry/Capacity-Negativtests |
| Translation Privacy | explizite Nutzeraktion; klare Provider-/Datenanzeige; Original bleibt sichtbar | kein automatischer Remoteaufruf im Default |
| Feedback | minimale Felder, sichtbare Referenz, authentisierter Auskunfts-/Loeschweg | End-to-End-Loeschbeleg |
| Push Clear-all | lokaler und serverseitiger Widerruf, Fehler sichtbar und wiederholbar | Netzwerk-/HTTP-Fehler darf nicht als Erfolg erscheinen |
| Hilfe | keine Geolocation, URL-/Log-/Analytics-/Persistenzprofile | No-Transmission-Test |
| Action Radar | freiwillige Berechtigung nur im Radar, lokale Distanzberechnung | keine Koordinate in Netz, URL, Logs oder Persistenz |

### Datenklassen und vorgeschlagene Obergrenzen

Die genauen Fristen benoetigen Product-Owner- und gegebenenfalls Rechtspruefung.
Technisch darf keine unendliche Retention existieren.

| Daten | Minimaler Zweck | G2-Vorschlag fuer Maximum | Loeschweg |
|---|---|---|---|
| technische Logs | Fehler/Quota ohne Inhalt | 30 Tage | automatischer Ablauf |
| Translation Cache | wiederverwendbares Ergebnis ohne Nutzer-ID | 7 Tage, schema-/payloadgebunden | TTL plus administrativer Purge |
| Feedback | Bearbeitung einer Anfrage | 90 Tage oder frueher auf Referenz | bestaetigte Objekt-/Metadatenloeschung |
| Pushsubscription | Benachrichtigung nach Opt-in | bis Widerruf; spaetestens nach 180 Tagen ohne Revalidierung sperren | idempotenter Serverwiderruf |
| generiertes Podcastobjekt | freigegebene Audioausgabe | 30 Tage, sofern nicht redaktionell uebernommen | Takedown/Expiry inklusive Derivaten |
| Standort | lokale Distanzsortierung | nur im Arbeitsspeicher der Aktion | Verwerfen nach Berechnung |
| lokale Einstellungen/Lesestatus | Nutzerkomfort | bis lokaler Loeschung | selektiv und Clear-all |

Providerretention kann kuerzer, nie ungeprueft laenger sein. Abweichungen
brauchen neue Privacybewertung und sichtbare Information.

### No-Content-Logging

Logs verwenden eine Feld-Allowlist. Artikel-/Uebersetzungstext,
Feedbackinhalt/-adresse, Pushendpoint/-keys, Standort, Tokens, vollständige
Original-URLs und Mediendaten sind verboten. Fehler werden in sichere
Kategorien normalisiert. Correlation-IDs sind zufaellig und nicht aus
Inhaltsdaten abgeleitet.

### Betroffenenrechte und Widerruf

- Datenfluesse dokumentieren Controller/Processor, Zweck, Felder, Region,
  Retention und Kontaktweg, bevor sie aktiviert werden.
- Feedbackreferenzen duerfen keinen Zugriff auf fremde Datensaetze erlauben.
- Auskunft, Loeschung und Widerruf sind idempotent, authentisiert soweit
  erforderlich, beobachtbar und end-to-end bestaetigt.
- `Alle Daten loeschen` zeigt getrennt: lokal geloescht, serverseitig
  bestaetigt, noch ausstehend oder fehlgeschlagen.

## Alternativen

1. **Bestehende Privacytexte nur anpassen:** ehrlichere Kommunikation, schliesst
   aber technische Cache-, Admission- und Loeschluecken nicht.
2. **Alle optionalen Remote-Features entfernen:** kleinste Angriffs- und
   Datenschutzflaeche; echte Product-Owner-Option.
3. **Nutzerkonten fuer alle Operationen:** staerkere Identitaet, erzeugt aber
   neue personenbezogene Daten und ist fuer Release 1 nicht empfohlen.
4. **Anonyme kurzlebige Capability Tokens:** kleinere Datenspur und
   zweckgebundene Admission; bevorzugt fuer erlaubte zustandserzeugende Flows.

## Kosten

- Engineering fuer Admission, Loeschung, Pruning, sichere Logs und Negativtests.
- Potenziell geringere Provider-/Abusekosten durch Caps und Cacheintegritaet.
- Rechtsberatung, Providerplaene oder aktuelle Preise sind nicht im G2-Beleg
  enthalten und brauchen gesonderte Freigabe.

## Risiken und Gegenmassnahmen

- Anonyme Capabilities koennen geteilt werden: kurze TTL, enger Zweck,
  einmalige Nutzung und serverseitige Caps.
- Zu kurze Retention kann Support erschweren: Status-/Auditmetadaten ohne
  Inhalt getrennt und minimal halten.
- Clear-all ueber mehrere Provider kann teilweise scheitern: Saga-artiger
  Status mit sicherem Retry statt falschem Gesamterfolg.

## Konsequenzen

Automatische Remoteuebersetzung ist nicht Default. Podcast und Push bleiben
bis zur jeweiligen Product-Owner- und Securityfreigabe aus. Hilfe bleibt strikt
standortfrei; Action Radar ist ein separater optionaler Datenfluss.

## Migration

1. Read-only Liveinventar und Datenflussregister vervollstaendigen.
2. SEC-001 zuerst in neuem Translationvertrag schliessen.
3. Feedbackreferenz, Auskunft und Loeschung als eigener Slice.
4. Podcast/Push nur nach Product-Owner-Entscheidung und Negativtests.
5. Privacytext gegen beobachtete Requests und Loeschpfade abgleichen.

## Verifikationsgate

Threat Review sowie Source-to-Sink-, Auth/Admission-, Cacheintegritaets-,
No-Side-Effect-, Retention-, Pruning-, Auskunfts-, Loesch-, Widerrufs-,
No-Content-Logging- und Standort-No-Transmission-Tests bestehen. Keine High-
Findings bleiben vor G5 offen; Livekonfiguration wird ohne Secretwerte
read-only belegt.
