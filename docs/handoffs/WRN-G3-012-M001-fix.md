# Handoff – WRN-G3-012-M-001 Korrektur

Stand: 27. August 2026

Produkt-/Testcheckpoint: `1520c05`

## GREEN innerhalb des Korrekturscopes

Die beiden getrennten Clientadapter validieren jetzt zuerst den Descriptor
allein, danach das Manifest allein und erst dann die feste Payload-Allowlist.
Die Vorpruefung verwendet ausschliesslich bestehende exportierte
Content-Contract-Guards und die bestehenden kanonischen SHA-256-Hilfen. Die
abschliessende vollstaendige `createValidatedLocalContentReleaseV1`-Pruefung
blieb unveraendert und bleibt weiterhin die einzige Quelle fuer `ready`.

Die neuen direkten Adaptertests zaehlen Requests. Sie belegen fuer Mobile und
Website bei ungueltigem Descriptor, unsupported Compatibility, falscher
Manifestrevision und falschem Manifesthash jeweils null Payloadrequests. Der
legitime Kontrollfall erreicht danach genau die sechs festen Payloadpfade.

## Gepruefte Grenzen

- keine manifestgesteuerten URLs, keine neue Requestklasse und keine
  Allowlistaenderung;
- keine Teilaktivierung, kein Fixturefallback und keine Storage-/Cachewirkung;
- keine Contract-, Fixture-, Artefakt-, Publisher-, UI-, Styling-, Dependency-,
  Lockfile-, Rootconfig- oder E2E-Aenderung;
- Format, ESLint, 19 Boundarytests, sechs Typechecks, 143 Unit-/Contract-/
  Komponententests, beide Builds und `check:release-boundaries` sind GREEN.

Vollstaendige Details stehen in
`docs/evidence/WRN-G3-012/WRN-G3-012-M001-IMPLEMENTATION-EVIDENCE.md`.

## Naechster einzig erlaubter Schritt

Genau ein frischer, read-only Bypassreview darf den unveraenderten Kandidaten
auf Umgehungen der Descriptor-/Manifestgrenze und auf Geschwisterpfade pruefen.
Bei einem Finding wird gestoppt. Nur nach dessen GREEN-Handoff folgen
sequenziell eine frische vollstaendige unabhängige Re-QA und ein frischer
kurzer read-only Architekturreview.

G3-013, Service Worker, Cache/IndexedDB, echte Inhalte, Cloud/Livezugriff,
Android, Remote/CI, Deployment, Signierung, Upload und Release bleiben
gesperrt.

## WRN-AGENT-STATUS

- Task: WRN-G3-012-M-001 Descriptor-/Manifestvorpruefung
- Status: GREEN im autorisierten Produkt-/Testscope
- Kosten: 0 CHF; keine externe oder Provideraktion
- Offene Arbeit: ausschliesslich die vorgeschriebenen unabhaengigen Reviews
- END-CHECK: :)
