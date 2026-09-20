# World Revolution News Next

Privater, separater Neubau von World Revolution News und Solinaridao.
GitHub: https://github.com/Blackfront161/World-Revolution-News-Next

## Aufbau

- apps/mobile: App und Android-Integration.
- apps/website: Website mit eigenem Offline-/SEO-Vertrag.
- packages: gemeinsame Inhalte, UI, Sprache und Verträge.
- services/translation: getrennt vorbereiteter Übersetzungsdienst; standardmäßig deaktiviert.
- tools: Inhaltsversorgung, Validierung und lokale Releasepakete.

## Lokal entwickeln

Node24.19.0 und pnpm11.19.0 gemäß Lockfile verwenden.

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm run test
```

Aktueller Funktions-/Releasezustand: [PROJECT-STATE](docs/PROJECT-STATE.md). Alle Anforderungen: [RC-MUST](docs/evidence/WRN-PO-SCOPE-STATUS-2026-09-10.md).

## Trennung vom Livebetrieb

Dieses Repository ersetzt keine laufende App, Domain oder Cloudflare-Ressource. Alte Inhaltsquellen und deren GitHub-Skripte werden als geprüfte Eingaben weitergenutzt. Neue Dienste erhalten eigene Namen und eigene Bindungen; Zugangsdaten gehören ausschließlich in die jeweilige Secretverwaltung. Keine kostenpflichtigen Pläne, Provider oder automatischen Deployments sind aktiviert. Der vorbereitete Actions-Job startet nur in öffentlichen Repositories und bleibt in diesem privaten Repository ohne Ausführung.

Der erste Import ist ein sauberer Snapshot des lokalen Neubaus. Historische Build-/Screenshotarchive bleiben lokal erhalten; benötigte Testeingaben und der originale kleine Git-Seed bleiben für die Herkunftsprüfung erhalten. SOURCE-SNAPSHOT.json dokumentiert den exportierten Quellstand. Die frühere README liegt im [lokalen historischen Register](docs/history/README-BEFORE-SEPARATE-REPOSITORY-2026-09-20.md).
