# SEC-001 – Client-kontrollierter Uebersetzungs-Cachekey

- Disposition: **REPORTABLE**
- Severity: **High**
- Confidence: **hoch fuer den Quellcodepfad; Live-Exposition unbekannt**
- Quellstand: `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`

## Source – Control – Sink

1. `shared-translation-client.js` berechnet einen SHA-256-Key aus
   `{version, language, mode, title, text}` und sendet ihn sowohl als Header als
   auch als `sharedCacheKey` im JSON-Body.
2. `cloudflare/wrn-translation-cache/src/index.js` akzeptiert jeden syntaktisch
   gueltigen 64-Hex-Key direkt. Nur wenn keiner geliefert wird, berechnet der
   Worker selbst einen Key – dabei sogar mit dem abweichenden Feldnamen
   `targetLanguage`.
3. Bei einem Cache-MISS wird der vom Angreifer gelieferte Text an den Upstream
   gesendet und die erfolgreiche Antwort unter dem fremdbestimmten Key in KV
   beziehungsweise Edge Cache geschrieben.
4. Ein spaeterer legitimer Request fuer den bekannten Artikelkey kann deshalb
   die manipulierte Uebersetzung als Cache-HIT erhalten.

Naechste fehlende Kontrolle: Der Worker bindet den Speicherkey nicht selbst an
den normalisierten, validierten Requestpayload. Die Origin-Allowlist ist keine
Authentisierung eines direkten HTTP-Clients.

## Auswirkung und Vorbedingungen

Die Integritaet von Uebersetzungen kann verletzt werden. Bei Nachrichten kann
ein falscher Titel oder Text als vermeintlich legitime Uebersetzung erscheinen.
Notwendig sind die deployte betroffene Version, ein bekannter/ableitbarer Key
und ein Cache-MISS oder abgelaufener Eintrag.

## Gegenbelege und Restluecken

- Laengenvalidierung, Origin-Allowlist, Rate Limit, Cache-TTL und Providerfehler
  begrenzen den Pfad, binden den Key aber nicht an den Inhalt.
- Der Rate Limiter faellt ohne Binding offen aus; `X-Client-Id` ist
  clientbestimmt. Das ist eine zusaetzliche Haertungsluecke, nicht die
  Hauptursache dieses Findings.
- Kein Live-PoC wurde ausgefuehrt. Deployment, aktiver Cache und aktuelle
  Bindings bleiben unbekannt.

## Mindestbehebung und Negativtest

Der Worker muss den kanonischen Key ausschliesslich serverseitig aus einem
versionierten, normalisierten Schema berechnen. Ein Clientkey darf hoechstens
als Hinweis dienen und muss konstantzeitlich mit dem Serverkey verglichen oder
ignoriert werden. Client und Worker muessen dieselben Feldnamen verwenden.

Negativtest: Zwei Payloads mit identischem geliefertem Key, aber verschiedenem
Titel/Text duerfen niemals denselben gespeicherten Eintrag erzeugen. Ein alter
Schema-Key darf nur ueber eine ausdrueckliche, getestete Migrationsregel lesen.

