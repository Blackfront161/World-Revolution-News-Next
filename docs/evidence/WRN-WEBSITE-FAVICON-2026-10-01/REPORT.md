# Website-Tab-Icon

Das vorhandene Solinaridao-Logo aus dem Website-Kopf ist als PNG-Favicon im HTML eingebunden. Vite verwendet dieselbe bestehende, hashbenannte Assetdatei; keine weitere Bildfamilie und keine Änderung des Logo-Masters. Die Offline-Graphprüfung erlaubt gezielt diesen vorhandenen Logo-Verweis und weist andere oder fehlende Bildverweise weiterhin zurück.

Lokale Prüfungen: Produktionsbuild PASS; 20/20 Offline-Shell-Tests, einschließlich Logo-Verweis und Negativfällen; 13/13 Website-/Hostingpaket-Vertragstests; 4/4 bestehende Offline-Neustartfälle; ESLint der beiden geänderten Werkzeuge und Diff-Whitespace PASS. Der Browser lädt exakt die ursprünglichen PNG-Bytes (HTTP 200, 1254 × 1076) und dekodiert das Icon nach geschlossenem Tab und Offline-Neustart mit aktivem Service Worker.

Build-Shell: `b5883954126c4adb05a01a20b45d25f49ef973b0d2f117f6e9dc2e853dea5dd3`, 8.364.730 Bytes unter 8.388.608 Bytes. Die neue lokale Paketvorbereitung liegt unter `work/website-projection-favicon-release/READY.json` und bindet den Commit dieses Nachtrags. Der vorherige Kandidat bleibt erhalten. Keine Veröffentlichung oder Live-Prüfung; `liveDeviationResolved:false`.

Die lokale Vite-Vorschau liefert JavaScript ohne den vom strikten Offlinevertrag geforderten UTF-8-Charset. Der Offline-Nachweis verwendet deshalb den vorhandenen Website-Testserver mit korrekten MIME-Headern. Keine Produktprüfung oder Sicherheitsassertion wurde abgeschwächt.
