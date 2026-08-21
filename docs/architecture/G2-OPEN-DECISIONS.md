# Offene Product-Owner-Entscheidungen nach G2

Status: offen – diese Datei erteilt keine Freigabe.
Regel: Technische Beweisluecken und Pflichtgates stehen nicht hier, sondern in
ADRs, Migration Waves und Risikoregister.

## Entscheidungsuebersicht

| ID | Entscheidung | G2-Empfehlung | Optionen/Auswirkung | Benoetigt vor |
|---|---|---|---|---|
| PO-001 | Zielarchitektur und Clientstack akzeptieren? | Plattform-Monorepo; React + TypeScript + Vite; Capacitor fuer Android | akzeptieren, gezielt aendern oder ADR zurueckweisen | `GO-IMPLEMENTATION` |
| PO-002 | Intro/Onboarding in Release 1? | nur behalten, wenn Nutzen/Flow explizit bestaetigt; sonst deferred | behalten mit Persistenz-/Visualgate oder aus Release 1 nehmen | betroffener UI-Slice |
| PO-003 | Zine-/Druckwerkzeuge in Release 1? | als eigener optionaler Slice, nicht Kernmigration blockieren | behalten, spaeter, oder streichen | Scopefreeze G3 |
| PO-004 | Action Radar in Release 1? | getrennt von Hilfe; nur mit freiwilliger lokaler Standortverarbeitung | behalten mit Permission-/No-Transmission-Gate oder deferred | Berechtigungs-/UI-Slice |
| PO-005 | Push/Benachrichtigungen in Release 1? | standardmaessig aus, bis SEC-003 und Widerruf geschlossen sind | behalten mit Challenge/Expiry/Caps oder deferred | Push-Implementierung |
| PO-006 | Uebersetzungsdefault? | nur explizite Nutzeraktion; keine automatische Remoteuebertragung | explizit, bewusstes Opt-in fuer Automatik, oder Feature deferred | Translation-Slice/Privacytext |
| PO-007 | Generierte Podcasts? | wenn behalten, bevorzugt redaktionell freigegeben statt anonymes Self-Service | redaktionell, stark zugelassenes Self-Service, oder deferred | Provider-/Podcast-Slice |
| PO-008 | Vorgeschlagene Retentionobergrenzen akzeptieren? | 30 Tage Logs, 7 Tage Translation, 90 Tage Feedback, Push-Revalidierung 180 Tage, Podcast 30 Tage | akzeptieren oder nach Rechts-/Betriebspruefung kuerzer/aendern | Aktivierung betroffener Flows |
| PO-009 | Rechte-/Lizenzweg fuer bestehende Marke und Medien? | nur belegte Assets uebernehmen; sonst neu erstellen/lizenzieren | Rechte klaeren, Ersatz schaffen, oder Asset ausschliessen | jeder Assetimport |
| PO-010 | Cloudflare und optionale Provider weiterverwenden? | Cloudflare bedingt beibehalten; Provider ueber Adapter und Budgetvertrag | nach Liveinventar bestaetigen, ersetzen oder Feature deaktivieren | Serviceimplementation |
| PO-011 | Budgets fuer optionale APIs/Provider? | keine Zusatzkosten ohne Messpunkt, hard cap und Kill-Switch | Budget je Funktion oder Funktion deaktiviert | kostenpflichtiger Aufruf |
| PO-012 | G2 abnehmen und spaeter `GO-IMPLEMENTATION` erteilen? | erst Reviewfindings, Pflichtinventare und notwendige PO-Entscheidungen schliessen | G2 akzeptieren; `GO-IMPLEMENTATION` separat erteilen oder verweigern | G3 |

## Noch keine Entscheidung erforderlich

- Map/Spiel bleibt gemaess Charter ausserhalb Release 1; eine spaetere echte
  Integration braucht ein neues Gate.
- Escape, 44x44-Ziele, sichere Cachekeys, immutable Revisionen,
  No-Content-Logging und reproduzierbare Rollbacks sind Qualitaets-/Security-
  gates, keine optionalen Produktpraeferenzen.
- Liveversionen, Bindings, Preise, Rechte und Providerretention sind
  Beweisanforderungen. Fehlende Evidenz wird nicht durch eine Vermutung oder
  Product-Owner-Meinung ersetzt.

## Dokumentation einer Entscheidung

Jede Product-Owner-Antwort wird mit Datum, gewaehlter Option, Scopeauswirkung,
Budget/Privacyfolge und betroffenen ADRs im Decision Log aufgenommen. Eine
Teilentscheidung erteilt weder Deploymentauthority noch automatisch
`GO-IMPLEMENTATION`.
