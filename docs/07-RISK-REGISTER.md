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
| R-09 | Medienquellen oder Rechte sind unklar | rechtliche/produktive Risiken | Provenienz- und Lizenzregister vor Uebernahme | Product Owner / G2 | Qood-Datei ausgeschlossen/offener Ersatz geplant; Markenassets owner-attested; Drittmedien pro Element offen |
| R-10 | parallele Agenten bearbeiten dieselben Dateien | Konflikte, unklare Verantwortung, Tokenverlust | max. zwei normal, getrennte Task Briefs/Worktrees | Chief / laufend | kontrolliert |
| R-11 | Spark/Luna werden fuer Hochrisikoentscheidung eingesetzt | oberflaechliche Fehlentscheidung | verbindliches Modellrouting und Sol-Gates | Chief / laufend | kontrolliert |
| R-12 | externe Provider-, Worker- oder Storagekosten wachsen unbemerkt | Budgetueberschreitung | Abo-first, reale Plan-/Usagemessung, Budget, Quoten, Caching, Kill-Switch und korrigierte Grenzdokumentation | Cost Controller / G2–G5 | Cloudflare Free/Usage und Hostinger-Verlaengerung live belegt; externe KI-Provider/Hard Caps offen |
| R-13 | Build enthaelt nicht den geprueften Quellstand | falsche AAB/Website | commitgebundener Sync, Doppelbuild, Hashreport | QA / G5 | Hostinger hat keine Git-Verbindung; `public_html`/Backup ist nicht commitgebunden |
| R-14 | Signierung/Deployment erfolgt zu frueh | falscher Production Release | Einzelgenehmigung und getrenntes G6 | Product Owner | kontrolliert |
| R-15 | Map-/Spielanforderungen vergroessern ersten Scope | Verzoegerung und Architekturballast | nur Vertragsanbindung, separates spaeteres Gate | Architect | kontrolliert |
| R-16 | Accessibility wird nur automatisch getestet | reale Barrieren bleiben | G1-Befunde beider Oberflaechen zu Touchzielen und Escape als Regressionstests; Tastatur-, Reflow-, Kontrast- und Screenreader-Smokes | Visual Reviewer / G4–G5 | in App und Website konkretisiert |
| R-17 | historische IDs/Artikel verschwinden | tote Share-/SEO-Links | append-only/Redirectstrategie und historische Tests | Website + Data / G2–G5 | offen |
| R-18 | fehlende Lizenz fuer Code/Assets/Fonts | Veroeffentlichungsrisiko | Rechteaudit vor Kopieren und G5 | Security/Product Owner | Qood-Datei ausgeschlossen, offener Ersatz braucht Lizenzbeleg; Marke owner-attested; Code/Medien weiter einzeln pruefen |
| R-19 | Context Rot oder Kontextverschmutzung | falsche Quellen, Wiederholung, Scopeverlust | kurze Task-Instanzen, Statusblock, Continuity Auditor, Handoffs | Chief / laufend | kontrolliert |
| R-20 | fehlendes `:)` loest Agentenkaskade aus | Doppelarbeit und Tokenkosten | Marker nur als YELLOW-Signal; Rotation erst nach Audit | Chief / laufend | kontrolliert |
| R-21 | automatische Profilloeschung entfernt wichtige Regeln | Verlust von Rollen und Nachweisen | Instanz stoppen statt Profil loeschen; expliziter Loeschbefehl und Git | Chief / laufend | kontrolliert |
| R-22 | bewegliche Datenrevisionen machen visuelle und funktionale Vergleiche nicht deterministisch | falsche Regressionen, auseinanderlaufende Clients oder uebersehene Layoutfehler | immutable Datensnapshot, feste Testfixtures plus getrennte Live-Smokes und Hashes | Backend + QA / G2–G5 | in G1 bestaetigt |
| R-23 | historische Workerberichte werden als aktueller Livezustand behandelt | falsche Security-, Privacy-, Kosten- oder Releaseentscheidung | spaeter autorisiertes read-only Deploymentinventar mit Version, Bindings, Plan, Lifecycle und Zeitstempel | Backend + Security / G2 | Cloudflare/Hostinger live belegt; dritter Worker und aktive Legacyflags gefunden; Abschlussreview bestanden |
| R-24 | Uebersetzungs-Cache vertraut einem clientgelieferten Inhaltskey | manipulierte Uebersetzungen koennen als legitimer Cache-HIT erscheinen | Key serverseitig aus einem versionierten kanonischen Payload berechnen; Kollisions-/Manipulations-Negativtests | Security + Backend / vor G3 | SEC-001 High, statisch validiert |
| R-25 | kosten- oder zustandserzeugende anonyme Endpunkte verlassen sich auf CORS und IP-Limits | Quota-/Kostenverbrauch, oeffentliche Fremdinhalte oder Push-Verdraengung | zweckgebundene Admission, kanonische Serverdaten, globale Caps, Ablauf/Pruning und Takedown | Architect + Security / G2–G3 | SEC-002 High; SEC-003 bedingt High |
| R-26 | Privacyversprechen und tatsaechliche Ausloese-/Loeschpfade laufen auseinander | ungewollte Drittuebertragung oder verbleibende Feedback-/Push-/Podcastdaten | Datenflussvertrag, ehrlicher Privacytext, sichtbare Referenz, bestaetigter Widerruf, Retention und Loeschtests | Product Owner + Security / G2–G4 | Live: Podcast-Lifecycle 30 Tage; keine Bucketregel fuer Feedback/Operations/Usage; High bleibt offen |
| R-27 | Website-Landingpages, Manifest, Sitemap und Feed folgen keiner nachweisbaren gemeinsamen Revision mit definierten ID-Mengenbeziehungen | tote oder falsch indexierte Artikel, inkonsistente Shares und Releases | getrennte Hashes fuer aktiven Feed, Archiv, Landingpages, Redirects und Sitemap-Artikel; gleiche Revision und gepruefte Teilmengen-/Gleichheitsregeln | Website + Data / G2–G5 | Manifestdrift in G1 bestaetigt |
| R-28 | gemeinsame Pakete koppeln App und Website wieder auf Screen-/Navigationsniveau | getrennte Releases werden nur scheinbar unabhaengig | Apps importieren einander nie; gemeinsame Pakete nur Brand/Primitive/Domain/Contracts; Importgrenzentest | Architect + Frontend / G3–G5 | in ADR-001/003 adressiert |
| R-29 | vorgeschlagene Retentionfristen werden ungeprueft als rechtlich oder betrieblich korrekt behandelt | zu lange oder zu kurze Speicherung und falscher Privacytext | Product-Owner-/gegebenenfalls Rechtsfreigabe; technische Obergrenzen, TTL, Pruning und End-to-End-Loeschung | Product Owner + Security / vor Aktivierung | Live-R2 belegt nur Podcast 30 Tage; Feedback/Operations/Usage ohne Lifecycle; offen |
| R-30 | Cloudflare-/Providerempfehlung wird ohne aktuellen Live-, Tarif- und Retentionsbeleg umgesetzt | Kosten-, Privacy- oder Betriebsueberraschung | zeitgestempeltes read-only Liveinventar ohne Secretwerte; Adapter, Budget, Caps und Kill-Switch | Backend + Security + Product Owner / vor G3-Servicearbeit | Cloudflare/Hostinger live; Google/Azure/Hugging Face bleiben unverifiziert und fuer das neue Ziel aus |
| R-31 | ein globaler Token-/Assetwechsel veraendert beide Oberflaechen unbemerkt | Marken- oder Accessibilityregression in App und Website | semantische Versionierung, beide Consumer in Screenshot-/Accessibilitymatrix, Rechtebeleg | Frontend + QA / G4–G5 | Font-Ersatz-/Marken-Importbrief und Visualmatrix vorbereitet; nicht implementiert |
| R-32 | alter Client versteht neue Content-/Storageversion nicht | weisse Seite, Mischrevision oder Datenverlust beim Rollback | Compatibility-Fenster, fail-closed Manifest, sichere Read-only-/Reset-Bestaetigung, Upgrade-/Rollbackmatrix | Backend + QA / G3–G5 | in ADR-004/007 adressiert |
| R-33 | immutable alte Revision oder Offlinecache reaktiviert ein takedown-/rechtebedingt gesperrtes Medium | erneute Auslieferung entfernter oder rechtswidriger Inhalte | monotones vorrangiges Revocation-/Tombstone-Manifest, Origin-410, Cache-Purge und maximale Offline-Gueltigkeit | Backend + Security + QA / vor Medien-G4/G5 | durch G2-Review gefunden, adressiert |
| R-34 | logisch getrennte Dienste werden in einem Artefakt gebuendelt, obwohl unabhaengiger Rollback behauptet wird | Translation-Rollback setzt Gateway/Feedback/Push ungewollt zurueck | eigene Deployables fuer Gateway, Translation, Feedback, Podcast und Push; gemeinsame Infra rueckwaertskompatibel | Architect + Backend + QA / vor Service-G3/G5 | Live: 3 Worker, aber Proxy buendelt weiter Feedback/Podcast/Push/Translation; Zieltrennung bleibt Pflicht |
| R-35 | bestaetigte Kernfunktionen besitzen keinen Slice oder keine MUST-Klassifikation | stiller Funktionsverlust wird erst spaet entdeckt | jede Paritaets-ID als MUST/MUST-SPLIT/OPTIONAL-PO; W5-Kernslices mit Owner, Daten-/Privacygate, Test und Ruecknahme | Chief + Product Owner + QA / Scopefreeze G3/G5 | durch G2-Review gefunden, adressiert |
| R-36 | GitHub-Workflows oder Credentials erhalten zu breite Schreib-/Produktionsrechte | unautorisierte Repository-, Deployment- oder Releasemutation | geschuetztes main, minimale Workflowpermissions, keine Secrets fuer Fremdcode, gepinnte Actions, geschuetzte Environments/OIDC | Chief + QA + Product Owner / Remote-Setup/G5 | Legacy live: alle `main` ungeschuetzt, Datenworkflows schreiben direkt, Actions nur auf Major-Tags; neues Remote-/CI-Task offen |
| R-37 | Capacitor CLI zieht im reinen Entwicklungspfad ein moderat betroffenes `uuid@7.0.3` ueber `xcode@3.0.1` ein | potenzieller Toolingfehler bei spaeterer nativer Verarbeitung; keine bekannte Webruntime-Exposition | keinen blinden Override setzen; Upstream-Update beobachten, Audit vor Androidgenerierung/G5 wiederholen und nativen Input nicht als vertrauenswuerdig behandeln | Mobile + Security + QA / vor Androidgenerierung und G5 | eine moderate Advisory `GHSA-w5hq-g745-h8pq`, null High/Critical; Foundation akzeptiert mit Beobachtung |

## G2-Zielkontrollen fuer G1-High-Risiken

Diese Matrix verdichtet alle in G1 als High oder High-Governance-Luecke
klassifizierten Themen. `adressiert` bedeutet Architekturkontrolle vorhanden,
nicht Risiko geschlossen.

| Risiko/Finding | Zielkontrolle | Owner | Spaetestes Gate | Status nach G2-Entwurf |
|---|---|---|---|---|
| R-05 fehlende/unklare Feeds | Manifestklasse `required`, `optional-empty` oder `optional-absent`, Schema/Owner/Fallback | Backend/Data | W2/G4 | adressiert, nicht implementiert |
| R-06/R-22 bewegliche Revisionen | immutable Revision, SHA-256, Compatibility und atomarer Alias | Backend/Data + QA | W2/G5 | adressiert, nicht implementiert |
| R-08/R-26 Privacy-/Loeschdrift | Datenflussregister, explizite Aktion, Retention, Auskunft, End-to-End-Loeschung/Widerruf | Security + Product Owner | vor betroffener W6-Funktion/G5 | PO-006/008 akzeptiert; Implementierungs-/Loeschbeleg offen |
| R-09/R-18 Rechte | Asset-/Medienregister mit Ursprung, Lizenz, Nutzung und Hash; kein Import ohne Beleg | Product Owner + Security | vor jedem Import/G5 | Qood ausgeschlossen/offener Ersatz geplant; Marke owner-attested; Code/Medien pro Element offen |
| R-12 Kosten | Ressourcemessung, Warnschwelle, hard cap, Kill-Switch und Owner | Product Owner + Cost/Backend | vor kostenpflichtigem Aufruf | Cloudflare/Hostinger live belegt; externe KI-Provider und echte Billing-Hard-Caps offen |
| R-17 historische IDs | stabile opake IDs, append-only oder versionierte Aliase, Gone-/Fallbackvertrag | Website + Data | W3/G5 | adressiert, nicht implementiert |
| R-23 Livezustand unbekannt | zeitgestempeltes read-only Inventar von Versionen, Bindingsarten, Plan, Lifecycle und Usage ohne Secrets | Backend + Security | Wave 0/vor G3-Servicearbeit | GitHub/Cloudflare/Hostinger live inventarisiert und unabhaengig geprueft; Servicegates separat offen |
| SEC-001/R-24 Translation Cache | Key ausschliesslich serverseitig aus kanonischem versioniertem Payload | Backend + Security | vor Translation-Portierung | adressiert, Finding offen |
| SEC-002/R-25 Podcast | zweckgebundene Admission, kanonische Artikel, globale Caps, Moderation/Takedown | Backend + Security + Product Owner | vor Podcastaktivierung | PO-007/011 akzeptiert; Finding/Belege offen |
| SEC-003/R-25 Push | Subscription-Challenge, Ablauf, Capacity, Pruning, faire Auswahl, bestaetigter Widerruf | Backend + Security + Product Owner | vor Pushaktivierung | PO-005 akzeptiert; Finding/Belege offen |
| R-27 SEO-ID-Drift | gleiche Revision; getrennte Mengenhashes; `active subset archive`, `landing = sitemapArticle`, Redirect-/Resolvable-Vertrag | Website + Data + QA | W3/G5 | nach Review praezisiert, nicht implementiert |
| R-07 Cachemigration | getrennte Namespaces, idempotente Migration, letzte valide Revision, sicherer Rollback | Backend + QA | W4/G5 | adressiert, nicht implementiert |
| R-33 Takedown vs. immutable | Revocation-Overlay dominiert Revision/Cache, 410/Purge/Offline-Revalidierung | Backend + Security + QA | vor Medien-G4/G5 | nach Review adressiert, nicht implementiert |
| R-34 Worker-Rollback | fuenf fachliche Deployables; gebuendelte Einheit nie als getrennt rollbackbar behaupten | Backend + QA | vor Service-G3/G5 | nach Review adressiert, nicht implementiert |
| R-35 Funktionsscope | vollstaendige Paritaetsklassifikation und konkrete W5/W6/W7-Slices | Chief + Product Owner + QA | Scopefreeze G3/G5 | nach Review adressiert, nicht implementiert |

## Pflege

- Jeder Agent meldet neue Risiken mit Eintrittsausloeser und Gegenmassnahme.
- Blocker und High-Risiken benoetigen einen Owner und ein Gate.
- Ein Risiko wird nur mit Beleg geschlossen, nicht weil es laenger nicht
  beobachtet wurde.
- Eine ADR schliesst ein Risiko nicht. Abschluss erfordert den in der
  Zielkontrollmatrix genannten Test-/Live-/Rechtebeleg.
