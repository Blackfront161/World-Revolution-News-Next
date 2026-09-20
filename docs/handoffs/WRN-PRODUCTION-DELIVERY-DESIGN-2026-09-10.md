# Agent Handoff

- Agent: `production_content_design`
- Task-ID: `WRN-PRODUCTION-DELIVERY-DESIGN-2026-09-10`
- Ergebnis: bestanden / bedingt
- Eltern-/Kindbrief, Rolle (Main/Fachlead/Helfer/Review) und Instanz-ID:
  `/root`, read-only Designreview, `/root/production_content_design`
- Basiscommit / Ergebniscommit / Branch und Worktree: Gate `921054e`, kein
  Produktcommit, gemeinsamer Checkout
- Slot-ID / zentraler Slotvergeber / Status aller Kinder: Slot 2, `/root`, keine
  Kinder
- Schreibarbeit beendet / Rechteuebergabe und Slotfreigabe bestaetigt durch:
  Reviewer gibt Berichtsschreibrecht und Slot 2 mit diesem Handoff an `/root`
  zurueck
- Unabhaengiger Reviewadressat (Main/Chief): `/root`

## Kurzfazit

Kleinster Produktionspfad ist ein statischer Dienst am fest kompilierten
`https://solinaridao.com/wrn-production-content/`. Website bleibt same-origin;
Mobile behaelt den gebuendelten Release nur als jungfraeulichen Erstbootstrap
und verwendet danach ausschliesslich den credentialfreien Remote-Transport.
Bestehende Safety-vor-Payload-, Store-, Rollback- und Readingvertraege werden
wiederverwendet. Ein neuer Backenddienst ist nicht erforderlich.

Der aktuelle relative Mobile-Fetch liest im Capacitor-Paket nur den lokalen
Assetserver und ist deshalb keine laufende Versorgung. Alt-GitHub-Pages und
Raw-`main` bleiben Producer-/Baselinebeleg und werden kein Fallback.

## Delegationsaufwand (falls zutreffend)

- Arbeits-/Koordinationszeit, Nacharbeitsrunden, Konflikte: ein begrenzter Pass,
  keine Konflikte
- Gemessene Token/Kosten mit Beleg oder `unbekannt`: unbekannt
- Aufwands-/Versuchsgrenze eingehalten / Eskalation: eingehalten
- Helferhandoffs, gepruefte Befunde und Disposition: keine Helfer

## Verwendete Quellen

- `AGENTS.md`
- `docs/01-SOURCE-OF-TRUTH.md`
- `docs/03-TARGET-ARCHITECTURE.md`
- `docs/tasks/WRN-PRODUCTION-DELIVERY-DESIGN-2026-09-10.md`
- akzeptierte Core-, B1/R1-, Shared- und Website-Stage-C/R1-Belege
- aktuelle Browser-Content-Transporte/Controller/Profile, beide Clientadapter,
  Capacitorconfig/Manifest, Corebuilder und Website-Publisher
- massgebliche Alt-App `2216ff3`, nur oeffentliche Source-Konfiguration

## Geaenderte Dateien

- `docs/evidence/WRN-PRODUCTION-DELIVERY-DESIGN-2026-09-10.md`
- `docs/handoffs/WRN-PRODUCTION-DELIVERY-DESIGN-2026-09-10.md`

## Tests und Belege

Keine Tests, Builds, Browser, Netz- oder Provideroperationen ausgefuehrt.
Read-only bestaetigt: relativer Same-Origin-Transport, fehlender Mobile-Remote-
Origin, getrennte DB-Profile, byteidentische acht Mobile-/Website-Coredateien,
generischer lokaler Corebuilder und deterministischer Stage-C-Publisher.

## Feststellungen nach Prioritaet

- **High fuer laufende Versorgung:** Mobile besitzt aktuell keinen externen
  Produktionspfad; der Pilot ist nur gebuendelt.
- **Implementierungsbedingung:** Source muss pro Check fest bleiben, Bootstrap
  ist nur im jungfraeulichen Store erlaubt, und ein unverifizierter Refresh
  darf ein unexpired Active nicht ausblenden.
- **Releasebedingung:** Liveorigin, Header, Promotion/Rollback und Geraeteablauf
  bleiben bis zur gesonderten konkreten Freigabe unbelegt.

## Annahmen und offene Fragen

Der empfohlene feste Origin ist aus dem akzeptierten Website-Origin und
vorhandenen Stage-C-Pfad abgeleitet. Seine tatsaechliche Hostingkontrolle,
Headerfaehigkeit, atomare Promotion und Kosten sind vor externem Write zu
verifizieren. Ein Scheitern dieses Gates erlaubt keinen stillen Wechsel auf
Raw-`main` oder einen konfigurierbaren Clientendpoint.

## Restrisiken

Keine Publisher-Signatur; Origin-Kompromiss bleibt offen. Neue Inhalte brauchen
fortlaufende Admission/Rechte-/Safety-Arbeit. Ledger und Clientreceipts sind auf
512 Identitaeten begrenzt. Reale Android-CORS-, Restart- und Upgradeevidenz fehlt.

## Empfohlener naechster Schritt

Zuerst den eng getrennten Client-Slice mit festem Remote-Sourceprofil und
Bootstrap-/Offlineorakeln implementieren. Danach den rein lokalen
Delivery-Paket-/Ledger-Orchestrator bauen. Erst nach unabhaengiger QA eine
konkrete Deploymentfreigabe fuer Originheader, Upload, Pointerpromotion und
Rollback einholen.

## WRN-AGENT-STATUS

- Task: `WRN-PRODUCTION-DELIVERY-DESIGN-2026-09-10`
- Status: GREEN fuer Design / YELLOW fuer reale Versorgung
- Quellstand: Gate `921054e`
- Erledigt: Endpoint-, Transport-, Bootstrap-, Refresh-, Ledger-, Publisher-
  und Testvertrag gebunden
- Tests: read-only Quellenvergleich; keine Ausfuehrung
- Offen: Implementierung, unabhaengige QA, Hosting-/Header-/Device-/Releasegates
- Handoff: `docs/handoffs/WRN-PRODUCTION-DELIVERY-DESIGN-2026-09-10.md`
- Naechster Schritt: zwei enge lokale Implementierungsslices, dann separate
  konkrete Deploymentfreigabe
- END-CHECK: :)
