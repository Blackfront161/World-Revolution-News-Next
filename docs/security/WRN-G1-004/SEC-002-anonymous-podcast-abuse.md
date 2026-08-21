# SEC-002 – Anonyme Podcastkosten und oeffentliche Inhalte

- Disposition: **REPORTABLE**
- Severity: **High**
- Confidence: **hoch fuer den Quellcodepfad; Live-Exposition unbekannt**
- Quellstand: `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`

## Source – Control – Sink

1. Der Proxy nimmt `POST` mit `action=podcast.generate` an. Die Route prueft
   Origin und ein IP-basiertes Limit, aber keinen Nutzer-, App-, Artikel- oder
   Arbeitsnachweis.
2. Ein direkter HTTP-Client kann einen erlaubten `Origin`-Header setzen; CORS
   ist eine Browsergrenze und kein Authentisierungsmerkmal.
3. Titel, Quelle, Artikel-URL und bis zu rund 8.000 Zeichen Sprechtext kommen
   aus dem Request. Eindeutige Inhalte umgehen einen vorhandenen Cache-HIT.
4. Der Worker reserviert Azure-Zeichenquota, ruft Speech auf, schreibt MP3 und
   frei gewaehlte normalisierte Metadaten nach R2 und macht Katalog/Audio
   oeffentlich abrufbar.

Naechste fehlende Kontrolle: Es gibt keinen belastbaren Admission-Nachweis,
dass der Request von einer freigegebenen Appinstanz stammt und sich auf einen
kanonischen, erlaubten Artikel bezieht.

## Auswirkung und Vorbedingungen

Ein anonymer Akteur kann kostenrelevante Azure-Arbeit und R2-Zustand erzeugen
und beliebige normalisierte Inhalte in den oeffentlichen Podcastkatalog
bringen. Bei maximalen eindeutigen Requests reichen grob sechzig erfolgreiche
Aufrufe fuer die dokumentierte Monatsgrenze von 475.000 Zeichen.

Notwendig sind eine deployte betroffene Version, aktiviertes Azure/R2, offener
Kill-Switch und ausreichend freie Monats-/Speicherquota.

## Gegenbelege und Restluecken

- 2 Requests/Minute/IP, Monats-/Speicherquoten, maximale Groessen,
  Normalisierung, Cache und Kill-Switch begrenzen Kosten und Inhalt.
- Der Quota Guard faellt bei Ausfall geschlossen. Das verhindert aber keinen
  Missbrauch innerhalb des freigegebenen Budgets.
- Kein Live-PoC wurde ausgefuehrt; Tarif, Istnutzung und Deployment bleiben
  unbekannt.

## Mindestbehebung und Negativtest

Generierung braucht eine serverseitige Admission-Regel: kurzlebiges,
zweckgebundenes Token oder gleichwertige Attestation, kanonische Artikel-ID
statt frei geliefertem Volltext, serverseitig geladene Quelle und harte
Nutzer-/Geraete-/Globalquoten. Der oeffentliche Katalog braucht Moderation und
Takedown.

Negativtests: erlaubter Origin ohne Admission-Nachweis muss ohne Azure-/R2-
Nebenwirkung scheitern; unbekannte Artikel-ID und manipulierte Metadaten ebenso.

