# Security/Privacy Handoff – WRN-G1-004

- Agent: `security_privacy_reviewer`, danach unabhaengige statische
  Kandidatenvalidierung durch den Main Agent
- Task-ID: `WRN-G1-004`
- Ergebnis: **YELLOW – Scope vollstaendig, High-Gates vor Portierung**
- App-Quellstand: `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`

## Executive Summary

Der begrenzte Review bestaetigt wirksame Schutzmechanismen, aber auch zwei
konkrete High-Schwachstellen mit hoher statischer Sicherheit:

1. Der Uebersetzungs-Worker vertraut einem clientgelieferten Cachekey. Bei
   Cache-MISS/Ablauf kann fremder Text unter einem bekannten Artikelkey
   gespeichert werden.
2. Die Podcastgenerierung verwendet CORS-Origin praktisch als Admission-
   Grenze. Ein direkter anonymer Client kann innerhalb der Quoten Azurekosten,
   R2-Zustand und oeffentliche Katalogeintraege erzeugen.

Ein dritter Pushpfad ist bedingt High: synthetische anonyme Subscriptions
koennen bei aktivem Pushbetrieb und einem spaeteren Adminbroadcast legitime
Empfaenger aus dem 2.500er-Auswahlfenster verdraengen. Der statische Pfad ist
belegt; seine Live-Voraussetzungen sind unbekannt.

Zusaetzlich bestehen High-Privacy-/Governance-Luecken: automatische
Startseitenuebersetzung widerspricht dem Datenschutzhinweis, die versprochene
fruehere Feedbackloeschung ist ohne sichtbare Referenz praktisch unbrauchbar,
Push-Widerruf kann serverseitig still scheitern und generierte Podcasts haben
keinen belastbaren Admission-/Takedownvertrag.

Keine dieser Aussagen beweist einen aktuellen Live-Deploy. Die vollstaendige
Validierung steht unter `docs/security/WRN-G1-004/validation-summary.md`.

## Scope und Evidenzgrenze

Statisch gelesen wurden die im Task Brief definierten Client-, Proxy-,
Translation-, Push-, Quota-, Offline-, Hilfe-/Radar- und Privacybereiche. Die
Pruefung folgte Daten und kontrollierbaren Eingaben von Quelle zu Senke.

Nicht gelesen oder ausgefuehrt wurden Konten, Dashboards, Secretwerte,
Live-Endpunkte, Provider-APIs, Deployments, Tests, Builds, Server oder
Angriffe. Codeabsicht fuer Bindings, Lifecycle, Logging und Retention ist daher
kein Beweis fuer den heutigen Cloudzustand.

## Source-to-Sink-Matrix

| Fluss | Ausloeser und Daten | Transport/Provider | Speicher/Logs/Loeschung | Bewertung |
|---|---|---|---|---|
| Uebersetzung | Startseite ruft `ensureHomeTranslations` ohne einzelne Funktionsauswahl auf; Titel/Text, Sprache, Modus und Cachekey | Translation Cache -> Proxy -> Gemini/Hugging Face | KV/Edge Cache mit TTL; Providerlogs unbekannt | automatische Drittuebertragung widerspricht Privacytext; SEC-001 |
| Feedback | freiwillige Nachricht, Kategorie, Sprache und optionale E-Mail | Proxy -> R2, optional E-Mail | Code sieht 90 Tage und Pruner vor; API liefert Referenz, UI zeigt sie nicht; kein Loeschendpoint im Scope | Retention nicht live bewiesen, versprochene fruehere Loeschung praktisch nicht nutzbar |
| Push | Opt-in; Endpoint, `p256dh`, `auth`, Themen, Sprache, Zeitzone, Appversion | Proxy -> PushGateway DO -> Web-Push-Provider | DO ohne maximale Retention; 404/410-Pruning; Unsubscribe kann still scheitern | Widerruf-/Loeschluecke; SEC-003 bedingt |
| generierter Podcast | Nutzeraktion; frei gelieferte Titel-, Quellen-, URL- und Textfelder | Proxy -> Azure Speech -> R2 | oeffentliche Metadaten/Audio; Quoten, 30-Tage-Pruningabsicht und Speichergrenze | SEC-002; Moderation/Takedown fehlen |
| Hilfe finden | Filter/Profile, kein Nutzerstandort | statisch kein Netzwerkpfad fuer Standort | lokale Anzeige, kein Standortpersistenzpfad belegt | No-Geolocation-Grenze bestaetigt |
| Action Radar | freiwillige Geolocation nach Nutzeraktion | Browser-Geolocation; Distanzberechnung im geprueften Pfad lokal | keine Koordinatenweitergabe an URL/Netz/Log/Speicher belegt | von Hilfe getrennt; spaeterer Runtime-No-Transmission-Test bleibt Gate |

## Validierung der G1-003-High-Privacy-Befunde

| G1-003-Befund | Klassifikation | Praezisierung |
|---|---|---|
| externe KI-Uebersetzung | **PRAEZISIERT** | Home-Uebersetzung wird automatisch angestossen; Privacytext verspricht Auswahl der Funktion. Cache-Integritaetsfinding SEC-001 zusaetzlich. |
| Feedback-Retention | **PRAEZISIERT** | 90-Tage-Ablauf und Pruner sind implementiert, aber nur Codeabsicht. Die fuer fruehere Loeschung benoetigte Referenz wird im Client nicht angezeigt; kein passender Loeschendpoint gefunden. |
| Pushdaten | **PRAEZISIERT** | Opt-in und Unsubscribe existieren. HTTP-/Netzfehler beim Backendwiderruf werden geschluckt, danach wird lokal geloescht; `Alle Daten loeschen` widerruft nicht beim Backend. Keine Maximalretention. |

## Validierte Security Findings

| ID | Severity | Kurzbefund | Gate |
|---|---|---|---|
| SEC-001 | High | clientbestimmter Translation-Cachekey erlaubt Cachevergiftung bei MISS/Ablauf | serverseitiger versionierter kanonischer Key vor Wiederverwendung |
| SEC-002 | High | anonyme Podcastgenerierung kann Quota/Kosten, R2 und oeffentliche Inhalte belasten | echte Admission, kanonische Artikel, Moderation/Takedown |
| SEC-003 | High, bedingt | anonyme Fantasie-Abos koennen 2.500er-Broadcastauswahl verdraengen | Admission/Challenge, Ablauf, Caps und Pruning vor Push-Freigabe |

Detailberichte:

- `docs/security/WRN-G1-004/SEC-001-translation-cache-poisoning.md`
- `docs/security/WRN-G1-004/SEC-002-anonymous-podcast-abuse.md`
- `docs/security/WRN-G1-004/SEC-003-conditional-push-flood.md`

## Weitere Findings

### High – Privacy/Governance, keine Vulnerability-Etikettierung

- Datenschutzhinweis und automatische Uebersetzung stimmen nicht ueberein.
- Feedbackloeschung vor 90 Tagen besitzt keinen nutzbaren End-to-End-Weg.
- Push-Widerruf und `Alle Daten loeschen` koennen Serverdaten zuruecklassen.
- Oeffentliche generierte Podcasts brauchen Offenlegung, Moderation,
  Takedown und verbindliche Retention.

### Medium

- Feedback kann innerhalb schwacher anonymer Admissiongrenzen die Tagesquota
  belasten.
- Der Translation-Limiter faellt ohne Binding offen aus; `X-Client-Id` ist
  clientbestimmt und rotierbar.
- Origin-Listen und Clientkonfiguration koennen auseinanderdriften.
- Providerfehler duerfen keine Inhaltsauszuege in Logs spiegeln; Liveverhalten
  ist nicht belegt.
- Pruner, R2-Lifecycle, Bucketzugriff und deployte Versionen sind unbekannt.

## Vorhandene Schutzmechanismen

- Request-/Feldlaengen und Normalisierung an wesentlichen Eingaben
- HTTPS-Pflicht fuer Pushendpoints
- Origin-Allowlisten als Browserkontrolle
- Proxy-Rate-Limits und kostenrelevante DO-Quoten ueberwiegend fail-closed
- Kill-Switches, Azure-Zeichen- und R2-Speichergrenzen
- Feedback-Honeypot, 90-Tage-Codepfad und tokenisierte Adminrouten
- parametrisierte SQL-Nutzung im PushGateway
- explizites Push-Opt-in, Quiet Hours und 404/410-Pruning
- klare statische Trennung von Hilfe ohne Geolocation und freiwilligem Radar

Diese Kontrollen reduzieren Risiken, ersetzen aber nicht die in den Findings
genannten Inhaltsbindungen, Admission- und Loeschvertraege.

## Mindestanforderungen, Negativtests und Gates

| Bereich | Mindestanforderung | verpflichtender Negativtest | Gate |
|---|---|---|---|
| Translation | Key nur serverseitig aus einheitlichem versioniertem Payload; Provider/Logging/TTL offenlegen; automatische Uebersetzung korrekt erklaeren oder abschalten | gleicher gelieferter Key mit anderem Inhalt darf nie denselben Cacheeintrag schreiben | vor G3-Portierung des Flusses |
| Podcast | kurzlebige zweckgebundene Admission; kanonische servergeladene Artikel; harte Nutzer-/Globalquota; Moderation/Takedown | erlaubter Origin ohne Nachweis erzeugt weder Azure- noch R2-Nebenwirkung | vor G3-Portierung und jedem Livebetrieb |
| Feedback | Referenz sichtbar und sicher aufbewahrbar; authentisierter Loeschweg; Retention/Lifecycle/Pruner belegen | abgelehnte/abgelaufene/zu loeschende Anfrage hinterlaesst keinen ungewollten Datensatz | vor G4-Paritaetsfreigabe |
| Push | bestaetigte Subscription, Ablauf/Caps/Pruning, serverseitig bestaetigter idempotenter Widerruf; Clear-all umfasst Backend | Netz-/HTTP-Fehler bleibt sichtbar; Fantasieendpoint und abgelaufenes Abo werden nicht gesendet | vor Push-Produktentscheidung/GO |
| Hilfe/Radar | getrennte Permissions und No-Transmission-Vertrag | Hilfe fordert nie Standort; Radar-Koordinaten erscheinen nicht in Netz, URL, Log oder persistentem Speicher | vor G4-Paritaetsfreigabe |

## Vorhandene Tests – nicht ausgefuehrt

- `tests/test_shared_translation_client.js`
- `tests/test_home_translation_layout.js`
- `tests/test_feedback_delivery.js`
- `tests/test_origin_safety.js`
- `tests/test_generated_podcast_library.js`
- `tests/test_offline_persistence_21.js`
- `cloudflare/tests/quota-client.test.mjs`
- `cloudflare/tests/operations.test.mjs`

Zusaetzlich benoetigt werden gezielte Negativtests fuer serverseitige
Cachekeybindung, Podcast-Admission ohne Nebenwirkung, Feedbackloeschung,
Push-Admission/Expiry/Widerruf und Standort-No-Transmission.

## Offene Live-, Rechts- und Providerfragen

- Welche Worker-Versionen, Bindings, R2-Lifecycle- und VAPID-Konfigurationen
  sind aktuell aktiv?
- Welche Provider speichern oder loggen Text, Fehlermeldungen und Metadaten,
  wie lange und in welcher Region?
- Sind automatische Uebersetzung, oeffentliche KI-Podcasts und deren
  Drittanbieter-/Takedownhinweise produktseitig gewollt?
- Welcher Prozess bearbeitet Auskunft, Loeschung und Missbrauch ohne
  personenbezogene Daten unnoetig zu vermehren?

Diese Fragen benoetigen spaeter ein autorisiertes read-only Liveinventar und
eine Produkt-/Datenschutzentscheidung; dieser Bericht ist keine Rechtsberatung.

## Aenderungen und Ausfuehrungen

- Fachagent: keine Dateien veraendert.
- Main Agent: nur Governanceberichte, Register und Projektstatus im neuen Repo.
- Keine Tests, Builds, Server, Browser, Worker, Live-Endpunkte, Provider-APIs,
  Konten, Secrets, Deployments oder Produktdateien verwendet oder veraendert.

## Empfehlung

G1-004 kann nach Continuity Audit als Analyse abgeschlossen werden. SEC-001
und SEC-002 sind verbindliche Zielarchitektur-Gates fuer G2/G3; sie verlangen
noch keinen Eingriff in den Legacy-Code. SEC-003 und die Datenschutzluecken
muessen als explizite Produkt-/Architekturentscheidungen in G2 aufgenommen
werden. Ein weiterer Vollscan ist fuer den aktuellen G1-Scope nicht notwendig.

## WRN-AGENT-STATUS

- Task: `WRN-G1-004`
- Status: YELLOW
- Quellstand: App `2216ff3`
- Erledigt: scoped Security-/Privacy-Review und statische Kandidatenvalidierung
- Tests: keine; im Task Brief verboten
- Offen: Continuity Audit, Live-Deploymentinventar und Zielarchitektur-Gates
- Handoff: `docs/handoffs/WRN-G1-004-security-privacy-review.md`
- Naechster Schritt: Continuity Audit
- END-CHECK: :)
