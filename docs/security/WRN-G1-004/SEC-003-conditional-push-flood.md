# SEC-003 – Bedingte Push-Subscription-Verdraengung

- Disposition: **REPORTABLE, BEDINGT**
- Severity: **High bei erfuellten Vorbedingungen**
- Confidence: **mittel; statischer Pfad belegt, Live-Exposition unbekannt**
- Quellstand: `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`

## Source – Control – Sink

1. `push.subscribe` ist anonym und nur mit Origin sowie 6 Requests/Minute/IP
   begrenzt.
2. `validSubscription` akzeptiert einen beliebigen HTTPS-Endpoint und
   nichtleere `p256dh`-/`auth`-Strings; Providerzugehoerigkeit oder ein
   erfolgreicher Challenge-Nachweis werden nicht geprueft.
3. Der Durable Object Store hat weder Aufnahmeobergrenze noch maximale
   Lebensdauer. Upserts erzeugen beziehungsweise aktualisieren Datensaetze.
4. Ein Broadcast liest nur die neuesten 2.500 Abos und versucht deren Versand.
   Synthetische neue Eintraege koennen deshalb aeltere legitime Eintraege aus
   dem Auswahlfenster verdraengen. Automatisch geloescht wird erst nach einem
   spaeteren 404/410 beim Versand.

## Auswirkung und Vorbedingungen

Moeglich sind Benachrichtigungsverlust fuer legitime Empfaenger, wachsende
DO-Daten und bis zu 2.500 unnuetze Versandversuche pro spaeterem Broadcast.
Voraussetzungen sind VAPID/Push im betroffenen Deployment, ausreichend viele
ueber Zeit oder verteilt angelegte Eintraege und anschliessend ein
authentisierter Adminbroadcast. Der Angreifer kann den Broadcast nicht selbst
ausloesen.

## Gegenbelege und Restluecken

- IP-Rate-Limit, Adminauth fuer den Versand, Quiet Hours und Loeschung nach
  404/410 reduzieren die praktische Wirkung.
- Der Pfad benoetigt Zeit oder Verteilung und ist ohne aktiven Pushbetrieb
  inaktiv. Deshalb wird keine aktuelle Ausnutzung behauptet.
- Kein Provider-/Live-Negativtest wurde ausgefuehrt.

## Mindestbehebung und Negativtest

Vor Persistenz muss ein echter Pushservice-/Challenge-Nachweis erfolgen.
Zusaetzlich sind Gesamt-/Mandantenlimits, Ablaufdatum, regelmaessiges Pruning,
idempotenter Widerruf und eine Broadcastauswahl ohne stille Verdraengung
notwendig.

Negativtest: syntaktische Fantasie-Endpoints duerfen nicht dauerhaft
persistiert werden; abgelaufene Eintraege muessen vor der 2.500er-Auswahl
entfernt werden; Ueberkapazitaet muss sichtbar und fail-closed reagieren.

