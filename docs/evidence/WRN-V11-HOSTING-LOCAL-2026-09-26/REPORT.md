# Aktuelles Website- und Hostingpaket · lokaler Dry-run · 26.09.2026

Die Website wurde aus dem aktuellen Produktstand `a4cbbff92b08219e28f4f84894fea3bcb1fa91b6` frisch mit `pnpm build:website` gebaut. Der Build integrierte zwölf statische Artikellandings und bestand einschließlich Offline-Shell; deren Graph hat 8.384.300 von maximal 8.388.608 Byte. Der geringe Rest von 4.308 Byte ist ein Kapazitätsrisiko für weitere direkt gebündelte Inhalte, kein Fehler dieses Builds.

Der unveränderte Produktionspaketierer erzeugte danach im ignorierten Arbeitsordner `work/wrn-v11-website-package-local/` ein Paket für `wrn-production-news-2026-09-26-v8`: **44 Dateien**, 11.127.078 Byte. Der rekonstruktive `verifyProductionWebsitePackage`-Nachlauf verglich alle 44 Dateien mit den gebundenen Eingaben und bestand. [Website-Manifest](website-package.manifest.json), SHA-256 `ead92b5f427686ceedba2ebc22c2b31146fd350cd1a64401e4e67181bf2de00f`.

Mit dem letzten lokal gebundenen Verzeichnisstand `202609251928` wurde daraus im ignorierten Arbeitsordner `work/wrn-v11-hosting-packet-local/` das kombinierte Paket erzeugt: **47 Dateien**, 13.059.775 Byte. `verifyProductionHostingPacket` rekonstruierte und prüfte alle 47 Dateien erfolgreich. Die letzten beiden Aktivierungsschritte sind `wrn-production-content/current.json` und danach `wrn-content-directory/current.json`. [Hosting-Manifest](hosting-packet.manifest.json), SHA-256 `13a23608da2628ba57cb3150ee8e78d574929dc84914bb0799623675306a46aa`.

Der öffentliche [sechsstündliche GitHub-Lauf #25](https://github.com/Blackfront161/World-Revolution-News-Next/actions/runs/36192206492) war erfolgreich und erzeugte ein Prüfarbeitsartefakt. Der in diesem Checkout vorhandene Workflow ist ausdrücklich **Dry-run**: `publicationPerformed=false`, kein Pointer-Transfer. Er ist kein Nachweis, dass App oder Website laufend neue Inhalte erhalten.

Ein lesender GET auf die drei fest konfigurierten öffentlichen Zeiger antwortete am 26.09.2026 gegen 11:08 UTC jeweils mit **HTTP 404 und `text/html`**: `/wrn-production-content/current.json`, `/wrn-content-directory/current.json` und `/wrn-source-pass-revocations/current.json`. Der laufende GitHub-Dry-run hat diese Hostlücke folglich nicht geschlossen. Diese Beobachtung ersetzt keinen authentisierten Host-Root- und Widerrufsabgleich.

Ein zusätzlicher öffentlicher HEAD auf `https://solinaridao.com/` am selben Tag
zeigte `platform: hostinger`, `panel: hpanel` und `Server: hcdn`. Die feste
Content-URL liegt damit nach außen an der bestehenden Hostinger-Auslieferung;
eine Cloudflare-Worker-Bereitstellung allein würde die drei 404-Zeiger nicht
beheben. Die tatsächliche Dateiwurzel und der zuletzt ausgelieferte
Widerrufsstand bleiben ohne authentisierten Hostzugriff unbewiesen.

**Keine Live-Freigabe:** Der hier verwendete vorige Widerrufsstand stammt aus `packages/browser-content/src/data/source-pass-revocations-v1.json`, nicht aus dem zuletzt tatsächlich ausgelieferten Host. Der Verzeichnis-Snapshot ist vom 25.09.2026. Vor einem Transfer müssen der echte Host-Root und die beiden letzten Pointerantworten samt Widerrufsstand gesichert werden; dann sind HTTPS, Header, Cache, CORS, Client-Refresh und Rollback am authentisierten Host zu prüfen. Es gab keinen Upload, Pointerwechsel, Push oder Live-Deployment.
