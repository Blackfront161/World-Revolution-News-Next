# WRN-G1-004 – Security Validation Summary

Stand: 21. August 2026  
Gepruefter App-Stand: `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`

## Methode und Grenze

Die Kandidaten wurden skeptisch und statisch vom oeffentlichen Eingang bis zur
Wirkung geprueft. Pro Kandidat galten fuenf Fragen:

1. Gibt es kontrollierbare Eingaben an einer oeffentlichen HTTP-Grenze?
2. Fehlt die naechste wirksame Kontrolle oder ist sie umgehbar?
3. Ist eine konkrete Speicher-, Kosten- oder Versandwirkung erreichbar?
4. Sind Auswirkung und notwendige Vorbedingungen konkret?
5. Welche Gegenbelege, Schutzmechanismen und Beweisluecken bleiben?

Keine Live-Endpunkte, Konten, Secrets, Server, Tests oder Angriffsdaten wurden
verwendet. Das war im Task Brief ausdruecklich verboten. Die Bewertung beweist
daher den Quellcodepfad am gebundenen Commit, nicht dessen aktuelles Deployment.
Es existiert kein `false_positive_feedback.json` im geprueften App-Repository.

## Abschlussmatrix

| ID | Root Control | Eintritt | Wirkung | Disposition | Sicherheit / Beweisluecke |
|---|---|---|---|---|---|
| SEC-001 | vom Client gelieferter Cachekey wird nicht serverseitig aus dem Payload abgeleitet | `POST /` des Translation-Cache-Workers | fremder Text kann bei MISS/Ablauf unter einem bekannten Artikelkey gespeichert und spaeter ausgeliefert werden | **REPORTABLE – High** | hoch, statisch; Deployment und Cachezustand unbekannt |
| SEC-002 | CORS-Origin wird wie Autorisierung benutzt; kein Nutzer-/App-Nachweis fuer Generierung | `POST podcast.generate` am Proxy | Azure-Zeichenquota, R2-Speicher und oeffentlicher Katalog koennen anonym mit frei gewaehlten Inhalten belastet werden | **REPORTABLE – High** | hoch, statisch; Azure/R2/Kill-Switch/Deployment unbekannt |
| SEC-003 | syntaktische Pushsubscription ohne Admission-Cap oder Ablauf | `POST push.subscribe` | synthetische Abos koennen legitime Eintraege aus dem 2.500er-Broadcastfenster verdrangen und Versandversuche erzeugen | **REPORTABLE, BEDINGT – High** | mittel, statisch; VAPID, Zeitaufwand und spaeterer Adminbroadcast sind Vorbedingungen |

## Nicht als Vulnerability klassifizierte High-Luecken

- Die Startseite stoesst Uebersetzungen automatisch an, waehrend der
  Datenschutzhinweis eine Auswahl der Funktion verspricht.
- Die Feedback-API liefert eine Referenz, die UI zeigt sie nicht. Damit ist der
  versprochene fruehere Loeschweg praktisch nicht nutzbar; ein Loeschendpoint
  wurde im Scope nicht gefunden.
- Push-Unsubscribe ignoriert HTTP-/Netzfehler und entfernt danach die lokale
  Subscription. `Alle Daten loeschen` ruft den Backend-Widerruf nicht auf.
- Fuer generierte oeffentliche Podcasts fehlen belastbare Admission-,
  Takedown- und Offenlegungsregeln.

Diese Punkte sind reale Privacy-/Governance- und Produktvertragsluecken. Ohne
zusaetzlichen konkreten Angreiferpfad werden sie nicht als Schwachstelle
etikettiert.

## Gate

Vor einer Portierung oder Wiederverwendung dieser Workerpfade muessen SEC-001
und SEC-002 im Zielentwurf geschlossen werden. SEC-003 benoetigt vor einer
Push-Freigabe eine Architekturentscheidung und einen autorisierten Negativtest.
Ein spaeteres read-only Deploymentinventar muss zuerst klaeren, welche
Versionen und Bindings live sind; es darf keine Secretwerte offenlegen.

