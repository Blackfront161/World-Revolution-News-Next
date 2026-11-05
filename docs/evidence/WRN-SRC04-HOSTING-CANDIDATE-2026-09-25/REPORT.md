# Aktueller lokaler Hostingkandidat nach SRC-04

Stand: 25. September 2026; Quellcommit `d008fdd3`.

Der gebaute Websitekandidat `wrn-production-news-2026-09-20-v6` umfasst
41 Dateien/10.044.963 Byte. Das kombinierte Paket bindet zusätzlich das
Verzeichnis mit Sequenz `202609250001` und umfasst 44 Dateien/11.998.905 Byte.
Beide Pakete wurden aus den gebundenen Eingaben rekonstruiert und byteweise
rückverifiziert. Ihre vollständigen Datei-/SHA-256-Listen sind als
`website-package.manifest.json` und `hosting-packet.manifest.json` versioniert.
Die Manifest-SHA-256 sind
`03eacdfd34849f7146d98d41d0cba542afd1e9427a691cc2a0e1166da15eb0c2`
und `f137b1c470a4505ceb7892974f878640e31e1deab756925660fcd0cb1cb75788`.

Der Website-Packager bindet als vorherigen Widerrufsstand die gebündelte leere
Revision 1 (SHA-256
`030aa883148b5378ac0821a7ddc0f48935178fe13058508439155423f83bb617`).
Das ist ein **Bootstrap-Eingang**, keine Behauptung über einen bereits
ausgelieferten Host-Snapshot. Ein neueres Live-Receipt muss vor jeder
Aktivierung als `previousRevocationsFile` eingesetzt und gegen den Kandidaten
geprüft werden. Die Pakettests bestätigen rev2→rev1 als Fehler und rev2→rev3
als zulässig; 13/13 Fälle bestanden.

Ein lesender HTTPS-Abruf am 25.09. ergab HTTP 404 für die drei öffentlichen
Zeiger `wrn-production-content/current.json`,
`wrn-content-directory/current.json` und
`wrn-source-pass-revocations/current.json`. Diese Probe belegt weder die
Serverkonfiguration noch eine spätere Aktivierung. Vor Play intern sind der
authentisierte Transfer, HTTPS-/CORS-/Cache-/Header- und Rollbackprobe sowie
Produktionssignatur und Play-Pre-Launch erforderlich. Es wurde nichts
veröffentlicht.

Die frischen lokalen Produktionsvorschauen sind erreichbar unter
`http://127.0.0.1:43235/#discover/sources` (Website) und
`http://127.0.0.1:43236/#discover/sources` (App-Weboberfläche); beide
lieferten HTTP 200 und die 83.783 Byte lange volle Quellenpassdatei.

Lesende Kontoprüfung am 25.09.: Das angemeldete Cloudflare-Konto zeigt
**Workers Free** als aktuellen Plan mit 100.000 Worker-Anfragen pro Tag. Unter
Workers und Pages existieren drei Worker (`wrn-translation-cache`,
`revolution-proxy`, `wrn-shared-translations`), aber kein Pages-Projekt.
`wrn-translation-cache` bindet den bestehenden Proxy, KV, Durable Object und
Rate Limiter. Der Proxy hat Gemini-/Hugging-Face-/Azure-Secrets und einen
Podcast-Bucket; die alten Übersetzungs- und Podcast-Schalter sind aktiviert.
Diese Bestandsaufnahme belegt weder ein kostenloses Gemini-/Azure-Kontingent
noch eine sichere Aktivierung der neuen Dienste. Der vorhandene Hostinger-Tab
für den Dateimanager von `solinaridao.com` zeigt nur die Anmeldung, keinen
authentisierten Dateizugriff. Deshalb wurden weder Worker noch Website
verändert. Die alte Website bleibt online; die neuen drei Zeiger bleiben 404.

END-CHECK: :)
