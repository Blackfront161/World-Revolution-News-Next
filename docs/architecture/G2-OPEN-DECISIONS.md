# Product-Owner-Entscheidungen nach G2

Status: PO-001–013 am 23. August 2026 entschieden; `GO-IMPLEMENTATION` offen.
Regel: Technische Beweisluecken und Pflichtgates stehen nicht hier, sondern in
ADRs, Migration Waves und Risikoregister.

## Entscheidungsuebersicht

| ID | Entscheidung | Product-Owner-Option | Verbleibendes Gate |
|---|---|---|---|
| PO-001 | Zielarchitektur und Clientstack | akzeptiert | aktuelle Versionen/Lizenzen belegen; `GO-IMPLEMENTATION` |
| PO-002 | Intro/Onboarding | nur bestaetigte Runtime-Paritaet; kein neuer Scope | Runtime-/UX-Beleg und Visualgate |
| PO-003 | Zine-/Druckwerkzeuge | spaeter eigener Release-1-Slice | Rechte-, Export-, Print- und A11y-Gate |
| PO-004 | Action Radar | nur freiwillig lokal; sonst deaktiviert | Permission- und No-Transmission-Gate |
| PO-005 | Push | behalten, standardmaessig aus | SEC-003, Challenge/Expiry/Caps und Widerruf |
| PO-006 | Uebersetzung | nur explizite Nutzeraktion | SEC-001, Privacytext und No-Content-Logging |
| PO-007 | Generierte Podcasts | nur redaktionell freigegeben; kein anonymes Self-Service | SEC-002, Rechte, Quoten, Moderation/Takedown |
| PO-008 | Retentionobergrenzen | Vorschlag als technische Maxima akzeptiert | kuerzere Rechts-/Betriebsanforderung hat Vorrang |
| PO-009 | Rechte-/Lizenzweg | nur belegte Assets; sonst Ersatz oder Ausschluss | Rechte-/Lizenzregister vor Import |
| PO-010 | Cloudflare/Provider | bedingt beibehalten; Adaptergrenze | read-only Liveinventar vor Servicearbeit |
| PO-011 | API-/Providerbudget | neue optionale Kosten standardmaessig 0 CHF | spaetere Einzelbudgetfreigabe mit Hard Cap/Kill-Switch |
| PO-012 | G2-Abnahme | G2 akzeptiert | `GO-IMPLEMENTATION` separat und noch offen |
| PO-013 | GitHub/Actions | privat und bedingt akzeptiert | eigener autorisierter Remote-/CI-Task |

## Weiterhin keine Entscheidung erforderlich

- Map/Spiel bleibt gemaess Charter ausserhalb Release 1; eine spaetere echte
  Integration braucht ein neues Gate.
- Escape, 44x44-Ziele, sichere Cachekeys, immutable Revisionen,
  No-Content-Logging und reproduzierbare Rollbacks sind Qualitaets-/Security-
  gates, keine optionalen Produktpraeferenzen.
- Liveversionen, Bindings, Preise, Rechte und Providerretention sind
  Beweisanforderungen. Fehlende Evidenz wird nicht durch eine Vermutung oder
  Product-Owner-Meinung ersetzt.

## Evidenz bleibt erforderlich

Die Entscheidungen sind im Decision Log mit Datum, Scope-, Budget- und
Privacywirkung dokumentiert. Sie ersetzen weder Rechte-/Live-/Testbelege noch
erteilen sie Deployment-, Signier-, Upload- oder Implementierungsauthority.
