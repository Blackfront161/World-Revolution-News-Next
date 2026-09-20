# WRN-WEB-ANALYSIS-001 – separate Website zur Analyse

Stand: 28. August 2026. Owner: Chief. Vorbereitung und bedingte
Veroeffentlichung gemaess PO-075/076; noch kein Upload oder Deployment.
Kein neuer sichtbarer Task. PO-077-Review beendet, alle Slots frei;
Ergebnis gemaess `WRN-WEB-ANALYSIS-001-SECURITY-REVIEW.md`.

Aktueller Stand: Anmeldung und read-only Hostingvorpruefung am 28.08.
abgeschlossen. Beleg: `../evidence/WRN-WEB-ANALYSIS-001/HOSTING-READINESS.md`.
Eigener PHP/HTML-Websiteplatz im bestehenden Business-Plan empfohlen;
kein Ziel angelegt. Die zwei Low-Findings sind durch PO-078 technisch
geschlossen. Ein deterministisches lokales Staging-/Retirement-Paket samt
Sicherheitsnachkorrekturen ist integriert; reale Ziel- und Auslieferungsgates
bleiben offen.

## Auftrag und Abgrenzung

PO-075: Die neue Website darf zur Analyse online gehen, wenn sie keine
offenen sicherheitsrelevanten Probleme aufweist; die App ausdruecklich nicht.
PO-076: Das anschliessende „ja“ bestaetigt genau die separate Testadresse
bei unveraenderter bisheriger Website. Das ist weder eine Freigabe zum
Ersetzen von solinaridao.com noch zur App-/Play-Veroeffentlichung.

G3-015 ist durch PO-079 lokal visuell akzeptiert. Die Analyseveroeffentlichung
erteilt trotzdem keine Hosting-, Live-, Mobile-, Android-, Google-Play- oder
Releasefreigabe der bestehenden Hauptwebsite oder App. Bekannte funktionale
und externe Auslieferungsgrenzen bleiben sichtbar.

## Quellen und aktueller Befund

- Hauptcheckout, Branch codex/g3-015-website-offline-shell; Vorbereitung auf
  Governancebasis270d18e.
- Historischer Stand vor Outcome A und PO-079: Produkt-/Testkandidat bceee9b;
  enger Nachcheck f8f8332/32516ba schloss nur S8-M-001. Diese damaligen offenen
  P2-/P3-/P4-Gates erteilen keine heutigen Rechte und beschreiben nicht den
  aktuellen akzeptierten Kandidaten.
- Verbindlich: Charter, Source-of-Truth, Zielarchitektur, Qualitaetsregeln,
  ADR-009 und G3-015-Chief-Handoff. Keine Legacykopie als neuer Kandidat.
- Liveinventar WRN-G2-004 vom 23.08.2026: Hostinger Business Web Hosting,
  PHP/HTML, bisher public_html. Dies ist historische Evidenz, keine aktuelle
  Kapazitaets-, Tarif-, Subdomain- oder Zielverzeichnisbestaetigung.
- Frueher am 28.08.2026 read-only Browserzugriff auf hpanel.hostinger.com:
  Weiterleitung zur Hostinger-Anmeldung. Kein angemeldeter hPanel-Zugriff;
  Browserdiscovery zeigte nur den In-app-Browser. Keine Eingaben/Logins,
  DNS-/Datei-/Hostingmutation, Credentialsuche oder externen Ressourcenstarts.
- Verfuegbarer Hostinger-Connector betrifft Horizons, nicht das dokumentierte
  PHP/HTML-Hosting; deshalb kein Horizons-Neubau. Keine Sites-Konfiguration
  im Repository; kein stiller Provider-/Architekturwechsel.
- Nach der PO-Fortsetzung Anmeldung bestaetigt: Dashboard 4/100 Websites,
  2,22/200 GB; Subdomainformular mit /public_html/-Praefix und eigener Ordner-
  Option. Kein ausserhalb des Bestands isolierter Root nachgewiesen. In der
  Websiteuebersicht ist ein separater PHP/HTML-Websiteplatz als Einrichtungsweg
  sichtbar. Noch kein Name/Root/HTTPS/Schutz oder Endpreis verifiziert.

## Noch zu bindende Voraussetzungen

1. Nach Anmeldung read-only konkretes Ziel, getrennten Document Root,
   HTTPS, vorhandene Belegung und Kosten innerhalb bestehender Ressourcen
   verifizieren. Bevorzugt eigener PHP/HTML-Websiteplatz im bisherigen
   Hosting statt unbewiesen isoliertem Unterordner der Hauptwebsite;
   noch kein Hostname/DNSziel beschlossen oder angelegt.
2. Unabhaengige Security-/Privacypruefung des exakt ausgewaehlten Kandidaten
   und seiner Auslieferung: Buildinhalt, versehentliche interne Dateien/
   Secrets/PII, Testdaten- und Markenrechte, externe Requests, Header,
   Zugriffsschutz sowie Service-Worker-/Cache-/Origintrennung. Keine bekannten
   offenen sicherheitsrelevanten Befunde vor Veroeffentlichung; ein Review
   beweist keine absolute Fehlerfreiheit. Sicherheitsbefunde nicht selbst
   wegakzeptieren; notwendige Korrekturen eng disponieren.
3. Zugang fuer Analyse begrenzen; keine Produktionsnutzer umleiten.
   Noindex allein ist kein Zugriffsschutz. Gewaehlter Schutz und Offlinetests
   muessen zusammen geprueft werden; keine ungepruefte Cache-/Authausnahme.
4. Exakten Build, Toolchain, Inhaltsrevision, Paketinhalt und SHA256 binden.
   Nur verifizierte Websiteausgabe ausliefern, kein Monorepo-/Dokument-/
   Testreport-/Attachmentupload. Rootformatbefund und offene G3-015-
   Funktionsfragen bleiben dokumentiert, kein behauptetes Gesamt-GREEN.
5. Separaten Hosting-/Rollback-/Abschaltplan und minimale Website-Smokes
   binden. Keine globale Cacheleerung, keine Aenderung der bestehenden
   Websiteordner, DNS-Haupteintraege, Legacyworker oder produktiven Daten.
   Ruecknahme muss vorhandene Browsercaches/Worker angemessen beruecksichtigen;
   blosses Loeschen von Serverdateien ist kein vollstaendiger Offline-Rollback.
6. Erst wenn Ziel und Sicherheitsbedingungen erfuellt sind, genau das gebundene
   Websitepaket veroeffentlichen und HTTPS/Assets/Deep Links/Isolation pruefen.
   Erforderliche konkrete Browser-Aktionsfreigaben vor Upload/Hostingmutation
   bleiben bestehen. Keine neue allgemeine Publish-Genehmigung erfinden.

## Erlaubte Arbeit und Grenzen dieser Vorbereitung

Historische Vorbereitungsgrenze vor PO-077: Chief schreibt ausschliesslich
diesen Brief und aktuelle Governancehinweise;
read-only Quellen-/Hostingvoraussetzungen duerfen geklaert werden. Keine
Produkt-/Test-/Package-/Buildkonfigurationsaenderung, kein Sicherheitslauf
oder Implementierungsagent in dieser Vorbereitung gestartet. Ein folgender
Pruefauftrag braucht konkrete Quellen, Eigentum, Belege und zentrale Slots;
Securityscan nach passendem Skill, nicht als informeller Selbstreview.

Keine neuen Abos/APIkosten, Domainkaeufe, Remote-/CI-Neueinrichtung,
App-/Android-/Playaktionen oder produktiven Backendkopien. Keine Passwoerter,
Tokens oder MFA-Codes in Chat/Git. Die Testadresse darf nicht unter dem
Service-Worker-Scope der bestehenden Hauptwebsite liegen.

## Naechster Schritt und Status

Hosting-Anmeldung, Zielwegpruefung, PO-077-Quellreview und PO-078-Fixpaket mit
unabhaengigem Recheck sind beendet. Die zwei Low-Findings sind geschlossen.
WRN-WEB-ANALYSIS-003 bis -006 liefern ein geschlossenes lokales Staging-/
Retirement-Paket, Origin-/Workerisolation, Securityheader, exakte Paketlisten
und korrigierte Testprozessgrenzen. Noch fehlen reale Origin, Canonicalwahl,
isolierter Document Root, HTTPS, Zugriffsschutz, Providerwirkung und die
einzelne Uploadfreigabe. PO-080 erlaubt jetzt nur den frischen lokalen
Readiness-Nachweis gemaess WRN-WEB-ANALYSIS-007.

Dieser Readiness-Nachweis ist auf `183a609` abgeschlossen: zwei saubere
Probe-Builds sind bytegleich, alle lokalen Qualitaetsgates bestanden und der
versiegelte Security-Diffscan `5f76675c-4ce9-417a-977d-5a5e2e5c6e9a`
meldet bis `c813d8d` null Findings. Der anschliessende semantisch neutrale
Lintdiff bis `183a609` ist separat durch Diffpruefung und die gesamte frische
Matrix gebunden. Die Probe bleibt absichtlich nicht uploadfaehig. Die oben
genannten realen Ziel-/Provider-/Uploadgates bleiben unveraendert offen.

Keine externen Ressourcen wurden angelegt oder kostenpflichtigen Dienste
beauftragt. Outcome A ist getrennt bereits umgesetzt; G3-015 ist mit PO-079
lokal visuell akzeptiert.

WRN-AGENT-STATUS: GREEN fuer WRN-WEB-ANALYSIS-007/008; YELLOW fuer die reale
Auslieferung – Ziel-/Providergates fehlen, keine Veroeffentlichung.
END-CHECK: :)
