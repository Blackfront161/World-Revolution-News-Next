# Unabhängige Website-Abnahme – `815c27d`

Datum: 2026-10-02 (Asia/Singapore)  
Rolle: unabhängige, read-only Kontrolle  
Produktbasis: `7533fe1`  
UI-Kandidat: `815c27d94b1a4b8e28e11b4c50110e961e07f365` einschließlich `4d989bc`  
Ergebnis: **PASS für den lokalen Website-Kandidaten; kein Live-/Deployment-PASS**

## Umfang und Diff

- `git diff 7533fe1..815c27d` enthält ausschließlich:
  - `apps/website/src/styles.css`
  - `apps/website/src/production-content-ui.css`
- 153 Einfügungen, keine Löschungen; `git diff --check` PASS.
- Keine App-, Shared-, Provider-, Daten- oder Storage-Datei ist Bestandteil des Deltas.
- Die regionale Kontrastkorrektur liegt website-lokal in `apps/website/src/styles.css`.

## Unabhängige Browserprüfung

Bestehender Preview `http://127.0.0.1:43240/?lang=de#home`; vorhandener Browserprozess wurde wiederverwendet, kein zusätzlicher Browserpool gestartet.

- 1440×900: `innerWidth=1440`, `clientWidth=1425`, `scrollWidth=1425`; kein horizontaler Seiten-Overflow. Header und Home-Inhalt sind jeweils 1072 px (67 rem) breit. Leitartikel 678,5 px, aktuelle Spalte 330,7 px. Kompakter Header, Themenleiste, großes Leitbild und aktuelle Meldungen sind sichtbar und nicht überlagert.
- 800×1000: `innerWidth=800`, `clientWidth=785`, `scrollWidth=785`; kein horizontaler Seiten-Overflow. Home-Inhalt 784,7 px, Leitartikel 494,7 px. Zweispaltige Front bleibt lesbar.
- 390×844: `innerWidth=390`, `clientWidth=375`, `scrollWidth=375`; kein horizontaler Seiten-Overflow. Hauptinhalt 374,7 px, Leitartikel 350,7 px. Die Themenleiste scrollt gezielt horizontal; Bottom-Navigation bleibt sichtbar.
- Sichtbare mobile Headeraktionen `Mehr`, `Solidarität`, `Suche` und Sprachauswahl messen jeweils mindestens 44 px Höhe.
- Der Bildnachweis `CC-BY-4.0` ist ein zugänglicher Button mit 44 px Mindesthöhe. Er öffnet den Dialog `Externe Quelle öffnen?`; initialer Fokus liegt auf `Abbrechen`. Nach Schließen kehrt der Fokus exakt zum auslösenden Lizenzbutton zurück.
- Browserkonsole: keine Fehler im geprüften Ablauf.
- Die vier eingecheckten Screenshots (1440, 800, 390, 200 %) wurden visuell geprüft; deren Bytezahlen und SHA-256 stimmen vollständig mit `hashmanifest.json` überein.

Beobachtung ohne Blocker für dieses Delta: Bei 800 px messen die bereits in der akzeptierten Basis vorhandenen Links der primären Navigation 40 px Höhe. Das neue Delta verändert dort Schriftgröße/Frontlayout, nicht die bestehende 40-px-Mindesthöhenregel. Falls das Projekt künftig 44 px auch für diese Tablet-/Desktop-Links zwingend macht, ist das als gesonderte Basisverbesserung zu behandeln.

## Artefakt- und Evidenzbindung

- `work/website-20min-release-815c27d/READY.json`: Quelle und Nicht-Deployment-Aussage konsistent.
- `website.manifest.json`: SHA-256 `d3812869d57399d602166a3e969eb4baca4b06dbdf3c454c1f8d0c52dde86ecb`; 45 Manifest-Einträge = 45 reale Dateien, keine fehlende/zusätzliche Datei, alle Bytezahlen und Dateihashes korrekt, keine Links/Reparsepunkte.
- `hosting.manifest.json`: SHA-256 `a02aaa1f76710fd3b3d06644006b2ce1a6ff467470156db741eea13525ba1831`; 48 Manifest-Einträge = 48 reale Dateien, keine fehlende/zusätzliche Datei, alle Bytezahlen und Dateihashes korrekt, keine Links/Reparsepunkte.
- Die dokumentierte Projektionsbindung bleibt unverändert: 482/500 aufgenommen, 18 ausgeschlossen; Content-Directory SHA-256 `3e73cac43faf5ce71b2b79680dee197b7c98d7bc4bed667e6e175e956f91e136`.
- Der bestehende Projektbericht weist 233 Vitest-Fälle, Typecheck, 36 Sprach-/Breitenkombinationen, axe, 200-%-Reflow sowie Brotli-/vollständigen Chrome-Offline-Neustart als PASS aus. Die unabhängige Kontrolle fand keinen Widerspruch zwischen diesen Behauptungen, dem Paket und dem sichtbaren Verhalten.

## Arbeitsbaum und Freigabegrenze

- Der Repository-Arbeitsbaum war vor der Kontrolle bereits durch fremde WIP-/historische Preview-Dateien verschmutzt (`WebsiteContentDirectoryRoute.test.tsx`, `docs/evidence/WRN-G3-015/`, zahlreiche unversionierte Preview-PNGs). Die Kontrolle hat keine Produktdatei verändert.
- Der lokale Kandidat ist für die nächste Website-Release-/Deployment-Vorbereitung akzeptiert.
- **Nicht freigegeben sind Upload, Consumer-Switch oder Live-Abnahme.** Hostinger verweigert den Upload weiterhin reproduzierbar mit HTTP 403. Vor Live-Freigabe bleiben menschlich autorisierter Hostinger-Zugriff, Rechte-/Revocation-Prüfung, Live-HTTPS/CSP/CORS/SW-Smoke-Test, Pointer-Aktivierung und Rollback-Nachweis erforderlich.

