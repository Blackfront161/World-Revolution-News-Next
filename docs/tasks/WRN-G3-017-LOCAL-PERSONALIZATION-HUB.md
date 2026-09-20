# WRN-G3-017 – `Für mich` als lokaler Personalisierungshub

Status: **GESTARTET DURCH PO-086 – P2 GREEN, P3 VORBEREITET**

## Ziel und Iststand

`Für mich` wird die zentrale lokale Personalisierungsseite. Sie bleibt strikt
von der anonymen Startseite aus G3-016 getrennt. Bestehende Daten-/UI-Verträge
und der lokale Sichtkandidat `8df7b5c` sind Referenzen, keine neue Freigabe.

## Vertrag

IN: lokale Auswahl von Interessen/Regionen/Sprachen nach expliziter Zustimmung,
versionierter Speicher, Anzeige und vollstaendige Loeschung. Future-Schema,
unbekannte Versionen, Korruption, fehlende Berechtigung und Migrationen
fail-closed mit nachvollziehbarem Leer-/Fehlerzustand. Neun UI-Sprachen,
EN Erststart und persistierte letzte Auswahl gelten weiterhin.

Migrationen sind atomar und idempotent. Eine unbekannte Zukunftsversion wird
bytegleich/read-only bewahrt und niemals durch ein aelteres Schema
ueberschrieben. Fehler oder Downgradeversuche lassen die letzte lesbare
Version aktiv beziehungsweise bieten eine explizite sichere Ruecknahme; kein
Teilstand darf als erfolgreiche Migration publiziert werden.

OUT: Serverprofil, Tracking, stille Personalisierung, Identitaetsabgleich,
Werbung, Content-Recherche, Website-Sync, neue Provider, Live/Hosting,
Android/AAB/Play/Release und UX-POLISH-001-Implementierung.

## Sicherheit, Kosten und Gates

Datensparsamkeit, keine Logs persoenlicher Praeferenzen, klare Loeschbestaetigung
und Security-/Privacy-Review sind Pflicht. Backend/Persistenzvertrag zuerst,
dann genau ein App-Frontend-Schreiber; Website bleibt read-only. Tests muessen
Versionen, Migration, Neustart, Loeschung, Fehler, Accessibility und visuelle
Leerzustaende belegen. Der Product Owner erteilte `START WRN-G3-017`; G3-016
ist technisch geprueft und sichtbar geschlossen. Zuerst drei getrennte
read-only Vorpruefungen und Chief-Synthese. Produktcode erst nach gebundenem
Backend-/Frontendpaket.

P2 ist in `2a00974` implementiert und durch Chief, Luna-Kontinuität,
Terra-QA sowie den versiegelten Sol-Securityreview
`28e475fb-ff2b-4185-b004-0c1e1a5c7b1d` GREEN geprüft. Der sichtbare
Frontendvertrag steht in `WRN-G3-017-P3-FRONTEND-PACKET.md`; Website und alle
externen Gates bleiben gesperrt.

END-CHECK: :)
