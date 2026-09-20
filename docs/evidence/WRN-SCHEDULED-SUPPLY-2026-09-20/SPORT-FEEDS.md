# Sportfeeds und bestehende Inhaltsversorgung

Am 20.09.2026 offiziell angekündigte Feeds gelesen und zusätzlich mit dem neuen
`tools/check-sport-feeds.mjs` geprüft:

| Quelle | Feed | Ergebnis 08:29 UTC |
| --- | --- | --- |
| FSGT | https://www.fsgt.org/feed/ | RSS, 12 Einträge, 74.538 Bytes |
| Africa Is a Country | https://africasacountry.com/feed/ | Atom, 20 Einträge, 227.231 Bytes |

Die Homepages verweisen selbst auf diese Endpunkte. FSGT beschreibt ihre Herkunft
aus Arbeitersport und Antifaschismus sowie Sport für alle; AIAC beschreibt eine
afrikanische linke Perspektive einschließlich Sport und Kultur. Keine pauschale
anarchistische Identität oder Freigabe sämtlicher Bilder wird daraus abgeleitet.
AIAC nennt unter https://africasacountry.com/about CC BY 4.0 mit Ausnahmen.
Artikel- und Drittmedienrechte bleiben getrennt zu prüfen.

Die gemeinsamen Sportquellen zeigen beide Feedlinks, ohne beim Rendern eine
externe Verbindung aufzubauen. Alle neun bisherigen Quellen bleiben erhalten.
Der Healthcheck ist ein manuell ausführbarer, begrenzter Originalfeedtest, kein
zweiter Artikelcrawler: exakte Feedliste, HTTPS, keine Redirects/Credentials,
15 Sekunden pro Anfrage, 2 MiB pro Antwort, keine DTD/Entity-Deklarationen,
keine Übernahme von Texten oder Bildern und keine Veröffentlichung.

Fünf Healthchecktests und vier gemeinsame Sport-UI-Tests PASS. Unabhängiger
Review PASS nach korrigierter blockierender Stream-Cancellation. Beide echten
Feedproben PASS. Der bestehende Backend-Abruf bleibt stündlich; Ergänzungslauf
für Volltexte/Bilder alle sechs Stunden. AIAC ist dort bereits als Quelle
konfiguriert; FSGT ist mit dieser lokalen Prüfung noch nicht live hinzugefügt.

Der neue lokale Actions-Workflow bereitet sechs­stündliche Übernahmen vor. Er
veröffentlicht derzeit nicht. Standardrunner nur für öffentliche Repositories,
kein Artefakt-/Cache-Upload; nur begrenzter Status und Receipt-Hash im Jobbericht.
GitHub-Dokumentation: https://docs.github.com/en/billing/concepts/product-billing/github-actions
Der Neubau hat bisher kein Git-Remote; das verbindliche Repository für die
gemeinsame neue Versorgung ist beim PO angefragt. Der bestehende Livebetrieb
wurde durch diese lokale Arbeit nicht ersetzt oder deaktiviert.
