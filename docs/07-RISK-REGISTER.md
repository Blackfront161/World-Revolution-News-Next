# Initiales Risikoregister

| ID | Risiko | Auswirkung | Gegenmassnahme | Owner/Gate | Status |
|---|---|---|---|---|---|
| R-01 | Falsches Legacy-Verzeichnis wird migriert | falscher oder veralteter Produktstand | Source Register, Commitpruefung, read-only Analyst | Chief / G1 | offen |
| R-02 | App und Website werden blind zusammenkopiert | Cache-, SEO-, Navigations- und Releasefehler | getrennte Apps/Releaseketten, gemeinsame Pakete nur gezielt | Architect / G2 | offen |
| R-03 | monolithische Legacy-JS/CSS-Struktur wird nur umbenannt | schlechte Wartbarkeit bleibt bestehen | Domain-/Featuregrenzen und schrittweise vertikale Migration | Frontend / G3–G4 | offen |
| R-04 | Funktionsverlust bei visueller Neumigration | Product Owner erkennt Verlust spaet | Paritaetsmatrix, Referenzscreenshots, Flowtests | Legacy + QA / G1–G4 | offen |
| R-05 | optionale Feeds erzeugen 404 und stille Fallbacks | Warnungen, veraltete/fehlende Inhalte | Required/Optional-Manifest, Owner, Revision und Contracttests | Backend / G2–G4 | in G1 am Datencommit bestaetigt |
| R-06 | App-/Website-Datenrevisionen laufen auseinander | falsche Links, Landingpages, Offlinepakete | immutable Datenrevision, versionierter Releasevertrag und Hashmanifest | Backend + QA / G2–G5 | in G1 als High bestaetigt |
| R-07 | Offline-/Cachemigration bricht Updates | weisse Seite oder alte Inhalte | Cache-Migrationsplan, Erst-/Zweitstart, Rollbacktests | Backend + QA / G4 | offen |
| R-08 | Uebersetzung, Feedback, Push, Podcast oder Standort werden unnoetig uebertragen, gespeichert oder geloggt | Datenschutz- und Vertrauensschaden | unabhaengiger Privacy-Datenflussreview, Minimierung, Retention/Loeschung, No-Persistence-/Logtests | Security / G1–G5 | High-Ausloeser in G1 |
| R-09 | Medienquellen oder Rechte sind unklar | rechtliche/produktive Risiken | Provenienz- und Lizenzregister vor Uebernahme | Product Owner / G2 | offen |
| R-10 | parallele Agenten bearbeiten dieselben Dateien | Konflikte, unklare Verantwortung, Tokenverlust | max. zwei normal, getrennte Task Briefs/Worktrees | Chief / laufend | kontrolliert |
| R-11 | Spark/Luna werden fuer Hochrisikoentscheidung eingesetzt | oberflaechliche Fehlentscheidung | verbindliches Modellrouting und Sol-Gates | Chief / laufend | kontrolliert |
| R-12 | externe Provider-, Worker- oder Storagekosten wachsen unbemerkt | Budgetueberschreitung | Abo-first, reale Plan-/Usagemessung, Budget, Quoten, Caching, Kill-Switch und korrigierte Grenzdokumentation | Cost Controller / G2–G5 | statische Quoten vorhanden; Livekosten offen |
| R-13 | Build enthaelt nicht den geprueften Quellstand | falsche AAB/Website | commitgebundener Sync, Doppelbuild, Hashreport | QA / G5 | offen |
| R-14 | Signierung/Deployment erfolgt zu frueh | falscher Production Release | Einzelgenehmigung und getrenntes G6 | Product Owner | kontrolliert |
| R-15 | Map-/Spielanforderungen vergroessern ersten Scope | Verzoegerung und Architekturballast | nur Vertragsanbindung, separates spaeteres Gate | Architect | kontrolliert |
| R-16 | Accessibility wird nur automatisch getestet | reale Barrieren bleiben | G1-Befunde zu 200-%-Nav, Touchzielen und Escape als Regressionstests; Tastatur-, Reflow- und Screenreader-Smokes | Visual Reviewer / G4–G5 | in G1 konkretisiert |
| R-17 | historische IDs/Artikel verschwinden | tote Share-/SEO-Links | append-only/Redirectstrategie und historische Tests | Website + Data / G2–G5 | offen |
| R-18 | fehlende Lizenz fuer Code/Assets/Fonts | Veroeffentlichungsrisiko | Rechteaudit vor Kopieren und G5 | Security/Product Owner | offen |
| R-19 | Context Rot oder Kontextverschmutzung | falsche Quellen, Wiederholung, Scopeverlust | kurze Task-Instanzen, Statusblock, Continuity Auditor, Handoffs | Chief / laufend | kontrolliert |
| R-20 | fehlendes `:)` loest Agentenkaskade aus | Doppelarbeit und Tokenkosten | Marker nur als YELLOW-Signal; Rotation erst nach Audit | Chief / laufend | kontrolliert |
| R-21 | automatische Profilloeschung entfernt wichtige Regeln | Verlust von Rollen und Nachweisen | Instanz stoppen statt Profil loeschen; expliziter Loeschbefehl und Git | Chief / laufend | kontrolliert |
| R-22 | bewegliche Datenrevisionen machen visuelle und funktionale Vergleiche nicht deterministisch | falsche Regressionen, auseinanderlaufende Clients oder uebersehene Layoutfehler | immutable Datensnapshot, feste Testfixtures plus getrennte Live-Smokes und Hashes | Backend + QA / G2–G5 | in G1 bestaetigt |
| R-23 | historische Workerberichte werden als aktueller Livezustand behandelt | falsche Security-, Privacy-, Kosten- oder Releaseentscheidung | spaeter autorisiertes read-only Deploymentinventar mit Version, Bindings, Plan, Lifecycle und Zeitstempel | Backend + Security / G2 | in G1 beobachtet |
| R-24 | Uebersetzungs-Cache vertraut einem clientgelieferten Inhaltskey | manipulierte Uebersetzungen koennen als legitimer Cache-HIT erscheinen | Key serverseitig aus einem versionierten kanonischen Payload berechnen; Kollisions-/Manipulations-Negativtests | Security + Backend / vor G3 | SEC-001 High, statisch validiert |
| R-25 | kosten- oder zustandserzeugende anonyme Endpunkte verlassen sich auf CORS und IP-Limits | Quota-/Kostenverbrauch, oeffentliche Fremdinhalte oder Push-Verdraengung | zweckgebundene Admission, kanonische Serverdaten, globale Caps, Ablauf/Pruning und Takedown | Architect + Security / G2–G3 | SEC-002 High; SEC-003 bedingt High |
| R-26 | Privacyversprechen und tatsaechliche Ausloese-/Loeschpfade laufen auseinander | ungewollte Drittuebertragung oder verbleibende Feedback-/Push-/Podcastdaten | Datenflussvertrag, ehrlicher Privacytext, sichtbare Referenz, bestaetigter Widerruf, Retention und Loeschtests | Product Owner + Security / G2–G4 | High-Governance-Luecke in G1 |

## Pflege

- Jeder Agent meldet neue Risiken mit Eintrittsausloeser und Gegenmassnahme.
- Blocker und High-Risiken benoetigen einen Owner und ein Gate.
- Ein Risiko wird nur mit Beleg geschlossen, nicht weil es laenger nicht
  beobachtet wurde.
