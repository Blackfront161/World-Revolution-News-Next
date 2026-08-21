# Initiales Risikoregister

| ID | Risiko | Auswirkung | Gegenmassnahme | Owner/Gate | Status |
|---|---|---|---|---|---|
| R-01 | Falsches Legacy-Verzeichnis wird migriert | falscher oder veralteter Produktstand | Source Register, Commitpruefung, read-only Analyst | Chief / G1 | offen |
| R-02 | App und Website werden blind zusammenkopiert | Cache-, SEO-, Navigations- und Releasefehler | getrennte Apps/Releaseketten, gemeinsame Pakete nur gezielt | Architect / G2 | offen |
| R-03 | monolithische Legacy-JS/CSS-Struktur wird nur umbenannt | schlechte Wartbarkeit bleibt bestehen | Domain-/Featuregrenzen und schrittweise vertikale Migration | Frontend / G3–G4 | offen |
| R-04 | Funktionsverlust bei visueller Neumigration | Product Owner erkennt Verlust spaet | Paritaetsmatrix, Referenzscreenshots, Flowtests | Legacy + QA / G1–G4 | offen |
| R-05 | optionale Feeds erzeugen 404 und stille Fallbacks | Warnungen, veraltete/fehlende Inhalte | Feedinventar, explizite Optionalitaet, Contracttests | Backend / G2–G4 | bekannt |
| R-06 | App-/Website-Datenrevisionen laufen auseinander | falsche Links, Landingpages, Offlinepakete | versionierter Releasevertrag und Hashmanifest | Backend + QA / G4–G5 | offen |
| R-07 | Offline-/Cachemigration bricht Updates | weisse Seite oder alte Inhalte | Cache-Migrationsplan, Erst-/Zweitstart, Rollbacktests | Backend + QA / G4 | offen |
| R-08 | sensible Hilfe-/Uebersetzungsdaten werden geloggt | Datenschutz- und Vertrauensschaden | Datenflussreview, No-Persistence-/Logtests | Security / G2–G5 | offen |
| R-09 | Medienquellen oder Rechte sind unklar | rechtliche/produktive Risiken | Provenienz- und Lizenzregister vor Uebernahme | Product Owner / G2 | offen |
| R-10 | parallele Agenten bearbeiten dieselben Dateien | Konflikte, unklare Verantwortung, Tokenverlust | max. zwei normal, getrennte Task Briefs/Worktrees | Chief / laufend | kontrolliert |
| R-11 | Spark/Luna werden fuer Hochrisikoentscheidung eingesetzt | oberflaechliche Fehlentscheidung | verbindliches Modellrouting und Sol-Gates | Chief / laufend | kontrolliert |
| R-12 | externe API-Kosten wachsen unbemerkt | Budgetueberschreitung | Abo-first, Kostenbudget, Quoten, Caching, Kill-Switch | Cost Controller / G2–G5 | offen |
| R-13 | Build enthaelt nicht den geprueften Quellstand | falsche AAB/Website | commitgebundener Sync, Doppelbuild, Hashreport | QA / G5 | offen |
| R-14 | Signierung/Deployment erfolgt zu frueh | falscher Production Release | Einzelgenehmigung und getrenntes G6 | Product Owner | kontrolliert |
| R-15 | Map-/Spielanforderungen vergroessern ersten Scope | Verzoegerung und Architekturballast | nur Vertragsanbindung, separates spaeteres Gate | Architect | kontrolliert |
| R-16 | Accessibility wird nur automatisch getestet | reale Barrieren bleiben | Tastatur-, Reflow-, Screenreader- und visuelle Smokes | Visual Reviewer / G4–G5 | offen |
| R-17 | historische IDs/Artikel verschwinden | tote Share-/SEO-Links | append-only/Redirectstrategie und historische Tests | Website + Data / G2–G5 | offen |
| R-18 | fehlende Lizenz fuer Code/Assets/Fonts | Veroeffentlichungsrisiko | Rechteaudit vor Kopieren und G5 | Security/Product Owner | offen |

## Pflege

- Jeder Agent meldet neue Risiken mit Eintrittsausloeser und Gegenmassnahme.
- Blocker und High-Risiken benoetigen einen Owner und ein Gate.
- Ein Risiko wird nur mit Beleg geschlossen, nicht weil es laenger nicht
  beobachtet wurde.
