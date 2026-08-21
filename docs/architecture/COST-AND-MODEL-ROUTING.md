# Kosten- und Modellrouting

Status: `PROPOSED`
Ziel: nachvollziehbare Trennung von vorhandener Abo-Nutzung, optionalen APIs,
Betriebsprovidern und menschlicher Freigabe.

## 1. Kostenklassen

| Klasse | Beispiele | Regel | Beleg vor Freigabe |
|---|---|---|---|
| vorhandene Codex-/Chat-Abos | Sol, Terra, Luna, Spark im verfuegbaren Produkt | niedrigste sichere Modellklasse, keine Abrechnungszusage erfinden | sichtbare Kontingent-/Produktangabe, falls entscheidungsrelevant |
| manuelle Zweitmeinung | Gemini Advanced/AI Plus | nur manuell, kleine freigegebene Dokument-/Screenshotmenge | keine Secrets/private Logs; Ergebnis wird validiert |
| optionale Modell-APIs | Gemini/Hugging Face oder andere Uebersetzungsprovider | standardmaessig aus; nur nach Budget-/Privacy-/Zweckfreigabe | Tarif, Region, Retention, Limits, Kill-Switch |
| Betriebsprovider | Cloudflare Workers/KV/R2/DO, Hosting, E-Mail, Push, Speech | pro Ressource messen, nicht aus Kommentaren/Altberichten ableiten | read-only Liveinventar mit Zeitstempel, keine Secretwerte |
| Release-/QA-Infrastruktur | CI-Minuten, Devicefarm, Artefaktspeicher | lokal/Abo-first; externe Kosten nur bei nachgewiesenem Nutzen | Budget, Laufzeit, Abbruchgrenze, Owner |
| Rechte/Lizenzen | Fonts, Assets, Medien, Code | keine Nutzung ohne Rechtebeleg | Lizenzregister und Product-Owner-Freigabe |

Aktuelle Preise, Tarife und Vertragsrechte sind in G2 nicht belegt. Sie werden
nicht aus historischen Reports, Kommentaren oder Modellwissen uebernommen.

## 2. Agentenrouting

| Modell/Profil | Geeignete Arbeit | Nicht allein zulaessig | Review |
|---|---|---|---|
| Spark (`gpt-5.3-codex-spark`) | kleine Dateikartierung, vorbereitete Tabellen, eng spezifizierte risikoarme Aenderung | Architektur, Security, Datenmigration, Release | Main/Terra nach Risiko |
| Luna (`gpt-5.6-luna`) | Registersynchronisierung, Berichte, Testmatrizen, Continuity Audit | kritische Architektur-/Securityentscheidung | Main; Terra/Sol bei unklarem YELLOW |
| Terra (`gpt-5.6-terra`) | regulaere Implementierung, Integration, umfangreiche Analyse, QA | finale kritische Freigabe allein | QA/Sol je Gate |
| Sol (`gpt-5.6-sol`) | Architektur, Security, kritische Migration, Incident, unabhaengige Gates | Product-Owner-Freigabe ersetzen | Main validiert; Product Owner entscheidet |
| manuelles Gemini | kleine Screenshot- oder alternative Architektur-Zweitmeinung | Quelle, Test oder Freigabe ersetzen | Codex gegen gebundene Evidenz |

Normalbetrieb: ein bis zwei aktive Agenten. Parallele Schreibarbeit am selben
Vertrag ist verboten. Ein groesseres Modell wird nur bei hoeherem Risiko oder
nachgewiesener Unklarheit eingesetzt, nicht wegen fehlender Vorbereitung.

## 3. Routing je Projektphase

| Phase/Arbeit | Primaer | Unabhaengiges Gate |
|---|---|---|
| G2 Register-/Matrixpflege | Main oder Luna | Main-Stichprobe |
| G2 Architektur | Main/Sol-Niveau | genau ein Sol/high Architecture Reviewer |
| G3 normales Frontend/Backend | Terra | QA; Sol nur bei kritischem Risiko |
| kleine isolierte G3-Korrektur | Spark | Terra/QA bei Integration |
| Daten-/Schema-Migration | Terra Specialist | Sol + QA |
| Security-/Privacyflow | Sol Reviewer | Main und verpflichtende Negativtests |
| G4 visuelle/Accessibility-Abnahme | Terra QA/Reviewer | Product Owner bei sichtbarer Abweichung |
| G5 Release Candidate | Terra QA | Sol Reviewer + Product Owner-Gates |

## 4. Betriebsbudgetvertrag

Jede kostenrelevante Funktion besitzt vor Aktivierung:

1. Provider und Ressource;
2. ausloesende Nutzer-/Systemaktion;
3. gemessene Einheit wie Requests, Zeichen, Storage, Egress oder CI-Minuten;
4. Cache-/Dedupstrategie;
5. Rate Limit je Client/Nutzer/IP, soweit datenschutzgerecht;
6. globale Warnschwelle und hard cap;
7. Kill-Switch mit Owner und sichtbarem Nutzerfallback;
8. Datenregion, Logging und Retention;
9. monatlichen Reviewzeitpunkt;
10. Product-Owner-Budgetfreigabe.

Quoten sind nicht nur Kostenkontrolle: sie muessen auch Missbrauch und faire
Kapazitaet behandeln. CORS oder clientbestimmte IDs zaehlen nicht als Admission.

## 5. Funktionsbezogene Messpunkte

| Funktion | Messpunkte | Hard-Stop-Bedingung |
|---|---|---|
| Uebersetzung | Cache-HIT/MISS, Provideraufruf, Zeichen, Fehler, Latenz | Budget/Quota erreicht, Providerprivacy ungeprueft, SEC-001 offen |
| Podcast | zugelassene Jobs, Zeichen, Audio-Bytes, Storage/Egress, Takedowns | Admission/Moderation fehlt, Monats-/Storagecap erreicht |
| Feedback | angenommene/abgewiesene Requests, Storageobjekte, Loeschlatenz | Retention/Loeschpfad oder Abusekontrolle fehlerhaft |
| Push | aktive/revalidierte/abgelaufene Abos, Sends, 404/410, Widerruf | Capacity/Pruning/Widerruf unklar, SEC-003 offen |
| Content Gateway | Revision-HIT, Bytes, Fehlerklasse, Cacheeffizienz | Hash/Schema falsch oder Required-Ressource fehlt |
| CI/QA | Laufzeit je Ebene, Flake, Artefaktbytes | Budgetgrenze ohne risikobasierte Freigabe |

Metriken enthalten keine Inhalte, personenbezogenen Daten, Pushendpoints oder
Standortdaten.

## 6. Abnahme

Kostenrouting ist akzeptiert, wenn Abo, optionale API, Betriebsprovider,
Rechtekosten und manuelle Zweitmeinung getrennt dokumentiert sind; jede aktive
kostenrelevante Funktion gemessene Einheiten, Owner, Warnung, hard cap,
Kill-Switch und Fallback besitzt; und keine unbekannte Preisannahme als
Architekturgrund ausgegeben wird.
