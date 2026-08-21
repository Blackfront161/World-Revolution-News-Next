# WRN Project State

Stand: 21. August 2026

## Aktuelle Phase

- Phase: 0 – Organisations- und Analysebasis
- Gate: G0 abgeschlossen; G1-001 bis G1-005 auditiert; `WRN-G1-005`
  Continuity 12/12 GREEN, fachlich wegen Manifest-/Live-/Visual-Gates YELLOW
- Produktcode: keiner
- Produktdeployment/Upload: keiner
- Git-Checkpoint: aktueller `main`; mit `git log -1` vor jeder Uebergabe pruefen

## Verbindliche Quellen

- App: `wrn-github-app-current`, HEAD `2216ff3c1305f6d474712892a36dc9b0ea7cb0a0`
- App-Runtime: `968c320adfe87d1e11e88f99f448a435d4242750`
- Website: `wrn-web-portal-2026-08-20-r10n-work`, HEAD `9a59b17cc9b3a6a7b7541c2e64862af208d02ace`
- Details und Ausschluesse: `docs/01-SOURCE-OF-TRUTH.md`

## Freigegebene Entscheidungen

- Dokumentation, Agentenregeln und Quality Gates vor Produktcode
- fuenf Kernprofile, Reservepool und Context-Continuity-Auditor
- `:)` nur als Uebertragungsmarker, nicht als Gesundheitsbeweis
- GREEN/YELLOW/RED-Audit und sichere Agentenrotation
- `FEUERN` stoppt Instanz; Profile/Belege bleiben
- automatische Profilloeschung verboten
- Map/Spiel im ersten Release nur als spaetere Schnittstellengrenze

## Aktive Mitarbeiterinstanzen

- keine

## Naechste erlaubte Aktion

Separaten visuellen Website-Baseline-Task schriftlich vorbereiten und sichern.
Danach genau eine Visual-QA-Instanz starten. Kein Produktcode vor
`GO-IMPLEMENTATION`.

## Offene Umgebungsabweichung

Die lokal registrierte Python-3.13-Installation konnte beim Governance-Setup
das Standardmodul `typing` nicht laden. Vor Python-basierten Legacy-Tests muss
die konkrete Toolchain read-only diagnostiziert und anschliessend separat
freigegeben repariert werden.
