# Agent Handoff

- Agent: delivery_correction_review
- Task-ID: WRN-PRODUCTION-IMAGES-DESIGN-2026-09-10
- Ergebnis: bestanden
- Eltern-/Kindbrief, Rolle (Main/Fachlead/Helfer/Review) und Instanz-ID: `WRN-REQUIREMENTS-AND-DEVICE-COMPLETION-2026-09-10`, unabhängiger bounded Designreview, Slot 2
- Basiscommit / Ergebniscommit / Branch und Worktree: `c5eb25d` / `c5eb25d` / `codex/g3-015-website-offline-shell` / gemeinsamer Worktree
- Slot-ID / zentraler Slotvergeber / Status aller Kinder: Slot 2 / Root / keine Kinder
- Schreibarbeit beendet / Rechteübergabe und Slotfreigabe bestätigt durch: Ja; ausschließlich Evidence/Handoff geschrieben
- Unabhängiger Reviewadressat (Main/Chief): Root / Head Chief

## Kurzfazit

Die rohen EFF-HTML-Snapshots enthalten die Bannerkandidaten
`digital-sovereignty-1c_0.jpg` und `flock-dystopia-scene-1.png`, beide mit
Alt-Text. Sie sind im Pilot dennoch durch den Admission-Scope ausgeschlossen
und derzeit nicht rechte- oder hashgebunden. Empfohlen wird ein additiver
`wrn.production-reader-media.v1`-Sidecar bzw. V2-Envelope mit Blockankern, per Bild
geprüfter Provenienz/Rechte, lokalen immutable Assets, gemeinsamer Safety-/IDB-
Behandlung und V1-Fallback. Nach Refresh werden verifizierte Bytes in IDB
gespeichert und über kurzlebige Blob-URLs gerendert; ein ungeprüfter Live- oder
Drittanbieter-Hotlink ist nicht zulässig.

## Delegationsaufwand (falls zutreffend)

- Arbeits-/Koordinationszeit, Nacharbeitsrunden, Konflikte: ein bounded read-only Durchlauf
- Gemessene Token/Kosten mit Beleg oder `unbekannt`: unbekannt
- Aufwands-/Versuchsgrenze eingehalten / Eskalation: eingehalten; keine Eskalation
- Helferhandoffs, geprüfte Befunde und Disposition: Design und Testmatrix erstellt

## Verwendete Quellen

- `docs/tasks/WRN-REQUIREMENTS-AND-DEVICE-COMPLETION-2026-09-10.md`
- `docs/evidence/WRN-PRODUCTION-ARTICLE-PILOT-2026-09-10/admission-review.json`
- `docs/evidence/WRN-PRODUCTION-ARTICLE-PILOT-2026-09-10/production-build-input.json`
- `docs/evidence/WRN-RELEASE-COMPLETION-SOURCES-2026-09-10/original-snapshots.json`
- `packages/content-contracts/src/production-content-release-v1.ts`
- `packages/browser-content/src/production-reader-blocks.tsx`
- `packages/content-contracts/src/mobile-reader-v2.ts`

## Geänderte Dateien

- `docs/evidence/WRN-PRODUCTION-IMAGES-DESIGN-2026-09-10.md`
- `docs/handoffs/WRN-PRODUCTION-IMAGES-DESIGN-2026-09-10.md`

## Tests und Belege

- Read-only `rg`-Vertrags- und Provenienzprüfung: PASS
- Keine Bilder geladen, keine Produktdateien verändert, keine Browser-/Build-/Netzwerkaktion

## Feststellungen nach Priorität

- P1: Zwei Pilotartikel haben identifizierte Bannerkandidaten, aber keine zugelassenen Bildassets oder Bildrechtebelege.
- P1: V1-Reader-Blockvertrag und Renderer sind text-only; Bilder benötigen eine additive Version.
- P2: Offline-/Safety-/CSP-/Package-Integration und beide Client-Tests sind vor Implementierung festzulegen.

## Annahmen und offene Fragen

Die gewünschte „Übernahme“ von Originalbildern erfordert pro Bild eine eigene
Admission. Ob EFF einzelne Artikelbilder unter CC-BY freigibt, ist aus den
vorliegenden Text-/Copyright-Nachweisen nicht ableitbar.

## Restrisiken

Bildrechte, Alt-Text-Qualität, Paketgröße und Android-WebView-Speicher müssen
bei echter Bildaufnahme geprüft werden. Der Sidecar-Vorschlag ist Design,
keine Implementierungs- oder Releasefreigabe.

## Empfohlener nächster Schritt

Root legt nach bestätigter Bild-Admission einen separaten, dateigebundenen
Produktauftrag für Contract, Builder, Transport, Offline-Store und beide
Renderer an.

## WRN-AGENT-STATUS

- Task: WRN-PRODUCTION-IMAGES-DESIGN-2026-09-10
- Status: GREEN
- Quellstand: `c5eb25d95750cad7f55f75c07014434348319676`
- Erledigt: Roh-HTML-Provenienzbefund, V2-Dispatch/Inline-Bytes-Entwurf und Test-/Releaseplan
- Tests: Read-only Vertrags- und Quellenprüfung PASS
- Offen: Bild-Admission und spätere Produktimplementierung
- Handoff: `docs/handoffs/WRN-PRODUCTION-IMAGES-DESIGN-2026-09-10.md`
- Nächster Schritt: Root bindet separaten Implementierungsauftrag
- END-CHECK: :)

## Nachtrag zur konkreten Integrationsgrenze

Die Roh-HTML-Snapshots enthalten die beiden Bannerkandidaten
`digital-sovereignty-1c_0.jpg` und `flock-dystopia-scene-1.png` mit Alt-Text;
ihre Bildrechte und Hashes sind dennoch noch nicht admitted. Für die kleinste
reale Integration empfiehlt der aktualisierte Evidencebericht einen expliziten
`ProductionContentReleaseV2`-Dispatch mit Inline-Base64-Bildblöcken in der
Readerressource. V1-Validatoren und alte Bundles bleiben unverändert; V1-
Clients lehnen V2 sicher ab. IDB speichert die validierte JSON-Ressource atomar,
und der Renderer nutzt nur kurzlebige Blob-URLs (`img-src 'self' blob:`), ohne
neuen Medienendpunkt oder zweiten Revocation-Ledger.
