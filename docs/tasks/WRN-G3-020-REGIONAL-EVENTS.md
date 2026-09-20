# WRN-G3-020 – regionale Termine

Status: **GESTARTET DURCH PO-098 – P1-ARCHITEKTUR/PRIVACY**

## Freigabe und Abhaengigkeit

PO-095 erlaubte die getrennte dokumentarische/read-only Vorbereitung.
G3-020 benoetigte vor jeder Ausfuehrung:

1. G3-019 technisch GREEN und durch den Product Owner sichtbar geschlossen
   (**erfuellt durch `32bd06d` und PO-097 in `727a4a9`**),
2. exakt `START WRN-G3-020`
   (**erfuellt durch PO-098 am 1. September 2026**),
3. einen unabhaengigen Architektur-/Privacy-Precheck,
4. danach sequenziell genau einen Daten-/Vertragswriter, einen Mobile-
   Frontendwriter und unabhaengige QA/Security/Architekturpruefung.

Dieses Dokument erteilt keine Schreib-, Recherche-, Provider-, Live- oder
Releasebefugnis.

PO-098 erfuellt den in Punkt 2 gebundenen exakten Startwortlaut. Bis zum
gesicherten GREEN des unabhaengigen P1-Architektur-/Privacy-Prechecks bleiben
Produkt-, Test-, Fixture- und Browserwrites dennoch gesperrt.

## Bestandsbefund

- Im neuen Produkt bestehen nur Navigation, Sprachtexte und ein ehrlicher
  Termin-Placeholder; ein G3-020-Terminmodell existiert nicht.
- Das lokale G3-017-Praeferenzmodell ist als privacy-sicheres Muster nutzbar,
  enthaelt aber keine Terminregion und keine geografische Hierarchie.
- Ein read-only Legacyinventar beobachtete umfangreiche historische
  Terminbestande mit Zeit-, Land-, Stadt- und teilweise Koordinatenfeldern.
  Das ist weder Admission noch Migrations- oder Nutzungsfreigabe.
- Stadtwerte ersetzen keine stabile Regionstaxonomie. Legacy-Geolocation und
  Action-Radar bleiben ausdruecklich OUT.

## Ziel und Nutzervertrag

Die App zeigt Termine als stabile Hierarchie `Kontinent > Land > Region`.
Nutzer waehlen die Region ausdruecklich; es gibt keine automatische
Standorterfassung. Die Auswahl wird rein lokal, versioniert und
datenminimiert gespeichert. Je Auswahl werden deterministisch hoechstens
fuenf kommende, gueltige Eintraege angezeigt.

Weniger als fuenf, keine aktuellen Eintraege, Fehler, Offlinezustand,
abgesagte oder geaenderte Termine werden ehrlich und unterscheidbar
dargestellt. Das Produkt erfindet keine Termine und fuellt die Liste nicht
mit veralteten oder unpassenden Eintraegen auf.

## Additiver Zielvertrag

Die genaue Schemafassung wird erst im Startprozess final gebunden. Mindestens
erforderlich sind:

- stabile `continentId`, `countryId` und `regionId` mit versionierter
  Taxonomie und kanonischen Anzeigeverweisen,
- stabile `eventId`, `sourceId`, Original-Link, Contentrevision und
  kanonischer Hash,
- beobachtete und publizierte Zeit, Start/Ende und IANA-Zeitzone,
- Status wie geplant, geaendert, abgesagt, veraltet oder gesperrt,
- Rechte-/Lizenzreferenz, Provenienz, Aktualitaetsgrenze und Korrektur-/
  Takedownkontakt,
- getrennte optionale Medienreferenzen mit elementweisen Rechten,
- monotone Revocation, atomare Aktivierung und Last-known-good-Verhalten.

Die Auswahl der kommenden Termine ist total und reproduzierbar: validierte
Startzeit in Ereigniszeitzone, dann stabile Tie-Breaker. Dubletten werden nur
ueber explizite stabile Identitaet/Aliasregeln zusammengefuehrt. Sommerzeit,
mehrdeutige oder ungueltige Ortszeiten muessen fail-closed behandelt werden.

Der spaetere P1-Architekturprecheck muss vor jedem Datenwrite zusaetzlich
operationalisieren:

- normalisierte, locale-unabhaengige ID-Formate mit fester Gross-/
  Kleinschreibung, Taxonomierevision und expliziten Alias-/Nachfolgeregeln;
- kanonische Speicherung als Instant plus IANA-Zeitzone und belegter lokaler
  Anzeigezeit; niemals nur ein mehrdeutiger lokaler Zeitstring;
- eine feste Policy fuer DST-Gaps (nicht existierende Ortszeit) und DST-Folds
  (doppelte Ortszeit), die ohne explizite Offset-/Instantbindung fail-closed
  endet;
- exakte Writer-Allowlists und getrennte Reviewgates, bevor Daten- oder
  Frontenddateien schreibbar werden.

## Daten-, Privacy- und Kostengrenzen

- keine Geolocation, Standortpermission, IP-Ortung oder Bewegungsprofile,
- keine Nutzungs- oder Auswahlprotokolle ausserhalb des lokalen Clients,
- keine Recherche, Feedabfrage, Admission, Migration oder echte Quelle in
  diesem Vorbereitungsstand,
- keine neuen Provider, Dependencies, Dienste oder Kosten ohne eigenes Gate,
- keine personenbezogenen Daten aus Legacybestaenden,
- Website und App bleiben getrennte Projektionen; Websiteprodukt ist OUT.

## Offline-, Rollback- und Lifecyclevertrag

Der spaetere Mobileadapter muss Manifest, Revision, Hash, Kompatibilitaet und
Revocation vor Aktivierung pruefen. Ein fehlgeschlagenes Update darf den
zuletzt gueltigen lokalen Bestand nicht beschaedigen. Revocation/Takedown hat
Vorrang vor Last-known-good und Rollback. Unbekannte Zukunftsschemas bleiben
unveraendert und read-only. Die regionale Auswahl wird getrennt vom
Terminbestand gespeichert und darf durch Contentrollback nicht verloren
gehen.

## Sprach-, UI- und A11y-Vertrag

Alle neuen Hierarchie-, Zeit-, Status-, Leer-, Fehler- und Offline-Texte
werden in den neun vorhandenen UI-Sprachen gebunden. Englisch bleibt
Erststart; eine gueltige lokale Auswahl bleibt erhalten. Die Oberflaeche muss
mit Tastatur, Screenreader, 44-Pixel-Zielen, den vier Themes, den gebundenen
Viewports und 200-Prozent-Reflow funktionieren. Kein verstecktes horizontales
Scrollen.

## Spaetere Testmatrix

- Schema, Required/Optional, Hash, Revision, atomarer Abbruch und Future-
  Schema,
- stabile Hierarchie, Alias/Deduplizierung und deterministische Tie-Breaker,
- exakt hoechstens fuenf kommende Eintraege sowie ehrliche `<5`-/Leer-/
  Fehlerzustaende,
- Regionwechsel, lokale Persistenz, Neustart und Loeschung,
- IANA-Zeitzonen, DST, ungueltige/mehrdeutige Zeiten,
- Aktualitaet, Aenderung, Absage, Revocation und Takedown,
- Offline, Last-known-good, A/B/A, Rollback und Future-Schema,
- neun Sprachen, Fokus, Tastatur, Touchziele, Axe, Themes, Viewports und
  200-Prozent-Reflow,
- kein Geolocationzugriff, kein Netzwerk-/Nutzungslog und keine
  Providernebenwirkung,
- getrennte Mobile-/Website-Erwartungen mit erwarteten Website-Skips.

## Harte OUT-Grenzen

Echte Inhalte/Quellen, `WRN-CONTENT-SOURCES-001`, Geolocation, Tracking,
Action-Radar, Provider, Live/Hosting, Websiteprodukt, Android/AAB/Play,
Signierung, Upload, Deployment und Release bleiben gesperrt.

END-CHECK: :)
